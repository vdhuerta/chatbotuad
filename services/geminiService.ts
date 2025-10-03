
import { GoogleGenAI } from "@google/genai";
import type { ChatMessage, KnowledgeBase, MessagePart, ImageFile } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Procesa los errores de la API de Gemini y devuelve un mensaje amigable para el usuario.
 * @param error El error capturado.
 * @returns Un string con el mensaje de error para el usuario.
 */
const handleGeminiError = (error: unknown): string => {
    console.error(`Error during Gemini API call:`, error);

    // Prefix all errors to make them easily identifiable by the UI
    const ERROR_PREFIX = "Error:"; 

    let userMessage = `${ERROR_PREFIX} Lo siento, ha ocurrido un error inesperado. Revisa la consola para más detalles.`;

    if (error instanceof Error) {
        if (error.name === 'TypeError' && error.message.toLowerCase().includes('fetch')) {
            userMessage = `${ERROR_PREFIX} Error de Conexión con la API (CORS).\n\n` +
                          `ACCIÓN REQUERIDA: La API de Google ha bloqueado la solicitud desde este sitio web. Para solucionarlo, debes autorizar el dominio de tu aplicación en la configuración de tu clave de API.\n\n` +
                          `Pasos a seguir:\n` +
                          `1. Ve a Google AI Studio (o Google Cloud Console).\n` +
                          `2. Busca la sección de "API Keys".\n` +
                          `3. Selecciona la clave que estás usando.\n` +
                          `4. En "Restricciones de aplicaciones", añade la URL de esta aplicación a los "Referentes HTTP" autorizados.\n\n` +
                          `Este es un mecanismo de seguridad de Google, no un error en el código.`;
        } else if (error.message.includes('API key not valid')) {
            userMessage = `${ERROR_PREFIX} La clave de API de Gemini no es válida.\n\n` +
                          `ACCIÓN REQUERIDA: Asegúrate de que la clave de API en el entorno esté configurada correctamente con una clave válida de Google AI Studio.`;
        } else {
             userMessage = `${ERROR_PREFIX} Ha ocurrido un error al comunicarse con la API de Gemini: ${error.message}`;
        }
    }
    
    return userMessage;
};


export const getChatResponse = async (
    history: ChatMessage[],
    newMessage: string,
    knowledgeBases: KnowledgeBase[]
): Promise<string> => {
    try {
        const knowledgeParts: MessagePart[] = [];
        let allContentText = '';

        if (knowledgeBases.length > 0) {
            knowledgeBases.forEach(kb => {
                const kbText = `## Curso: ${kb.course}\n\n**Contenido Principal:**\n\`\`\`\n${kb.content || 'No se ha proporcionado contenido de texto.'}\n\`\`\`\n\n**Enlaces de Referencia:**\n- ${kb.links ? kb.links.split('\n').filter(link => link.trim() !== '').join('\n- ') : 'Ninguno'}`;
                allContentText += kbText + '\n\n---\n\n';

                if (kb.image) {
                    knowledgeParts.push({
                        inlineData: {
                            mimeType: kb.image.type,
                            data: kb.image.base64,
                        }
                    });
                }
            });
        }

        if (!allContentText.trim()) {
            allContentText = 'La base de conocimientos está vacía. No se ha proporcionado ninguna información. Informa al usuario de esta situación y sugiere que un administrador debe cargar el contenido.';
        }
        
        knowledgeParts.unshift({ text: allContentText });


        const systemInstruction = `Eres un asistente virtual para estudiantes de la UAD, un experto en analizar y sintetizar información de manera precisa.

**Regla Maestra:** Tu única y exclusiva fuente de verdad es la "Base de Conocimiento" (texto e imágenes) que te proporciono. NO debes usar ningún conocimiento externo ni hacer suposiciones más allá de lo que está explícitamente disponible.

**Tu Tarea:** Debes utilizar la información de la "Base de Conocimiento" para realizar las siguientes acciones:
1.  **Responder preguntas:** Contesta las dudas del usuario basándote directamente en los datos proporcionados, incluyendo la información visual de las imágenes si es relevante.
2.  **Sintetizar y Resumir:** Si el usuario lo pide, crea resúmenes o extrae las ideas principales del contenido.
3.  **Explicar y Elaborar:** Proporciona explicaciones detalladas sobre los conceptos encontrados en el texto y las imágenes.

**Manejo de Información Faltante:** Si la pregunta del usuario trata sobre un tema que no se aborda en la "Base de Conocimiento", debes responder de forma clara y amable que no tienes información sobre ese tema específico. No intentes adivinar ni inferir información que no está presente.

--- INICIO DE BASE DE CONOCIMIENTO ---
(El contenido de texto e imágenes se proporciona en el siguiente turno del historial)
--- FIN DE BASE DE CONOCIMIENTO ---

Ahora, aplicando estas reglas rigurosamente, procesa y responde la solicitud del usuario.`;

        const contents: ChatMessage[] = [
            { role: 'user', parts: knowledgeParts },
            { role: 'model', parts: [{ text: "Base de conocimientos recibida. Estoy listo para ayudar." }] },
            ...history,
            { role: 'user', parts: [{ text: newMessage }] }
        ];

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: contents,
          config: {
            systemInstruction
          }
        });

        return response.text;
    } catch (error) {
        return handleGeminiError(error);
    }
};

export const processDocumentWithGemini = async (document: ImageFile): Promise<string> => {
    try {
        const documentPart = {
            inlineData: {
                mimeType: document.type,
                data: document.base64,
            },
        };

        const textPart = {
            text: `Eres un experto en extracción y estructuración de información.
Tu tarea es analizar el documento proporcionado (que puede ser una imagen, PDF, DOCX, etc.) y convertir todo su contenido de texto a formato Markdown bien estructurado.

**Instrucciones:**
1.  **Extrae TODO el texto:** Asegúrate de capturar cada palabra del documento.
2.  **Formatea en Markdown:** Utiliza encabezados (#, ##), listas (*, -), negritas (**), cursivas (*), etc., para mantener la estructura y jerarquía del documento original.
3.  **Maneja Tablas:** Si hay tablas, formátalas como tablas Markdown.
4.  **Preserva la Coherencia:** El resultado debe ser un único bloque de texto en Markdown que represente fielmente el contenido del documento.
5.  **No Resumas ni Omitas:** No debes resumir el contenido ni omitir ninguna sección. El objetivo es una transcripción completa y formateada.

Procesa el siguiente documento y devuelve el contenido exclusivamente en formato Markdown.`,
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [documentPart, textPart] },
        });

        return response.text;
    } catch (error) {
        const errorMessage = handleGeminiError(error);
        throw new Error(errorMessage);
    }
};