import type { ChatMessage, KnowledgeBase, ImageFile } from '../types';

/**
 * Procesa los errores de la API (ahora a través de la Netlify Function) y devuelve un mensaje amigable.
 * @param error El error capturado.
 * @param context Una cadena que describe la operación que falló (por ejemplo, 'getChatResponse').
 * @returns Un string con el mensaje de error para el usuario.
 */
const handleServiceError = (error: unknown, context: string): string => {
    console.error(`Error during ${context} call:`, error);
    const ERROR_PREFIX = "Error:"; 
    let userMessage = `${ERROR_PREFIX} Lo siento, ha ocurrido un error inesperado al contactar al asistente. Revisa la consola para más detalles.`;

    if (error instanceof Error) {
        // Captura errores de red (e.g., fetch failed) y errores devueltos por la función serverless.
        userMessage = `${ERROR_PREFIX} ${error.message}`;
    }
    
    return userMessage;
};

export const getChatResponse = async (
    history: ChatMessage[],
    newMessage: string,
    knowledgeBases: KnowledgeBase[]
): Promise<string> => {
    try {
        const response = await fetch('/.netlify/functions/gemini-proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ history, newMessage, knowledgeBases }),
        });

        const data = await response.json();

        if (!response.ok) {
            // Si la respuesta no es 2xx, lanza un error con el mensaje del servidor.
            throw new Error(data.error || `El servidor respondió con el estado ${response.status}`);
        }
        
        return data.text;
    } catch (error) {
        return handleServiceError(error, 'getChatResponse');
    }
};

export const processDocumentWithGemini = async (document: ImageFile): Promise<string> => {
    try {
        const response = await fetch('/.netlify/functions/gemini-document-processor', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ document }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `El servidor respondió con el estado ${response.status}`);
        }

        return data.text;
    } catch (error) {
        // En este caso, el error debe ser relanzado para que el componente de UI pueda manejarlo
        // y mostrar una alerta, en lugar de solo devolver un string.
        const errorMessage = handleServiceError(error, 'processDocumentWithGemini');
        throw new Error(errorMessage);
    }
};
