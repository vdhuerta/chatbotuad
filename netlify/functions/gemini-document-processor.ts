import type { Handler, HandlerEvent } from "@netlify/functions";
import { GoogleGenAI } from "@google/genai";
import type { ImageFile } from '../../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set in Netlify.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const handler: Handler = async (event: HandlerEvent) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { document } = JSON.parse(event.body || '{}') as { document: ImageFile };

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

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: response.text }),
        };
    } catch (error) {
        console.error('Error in gemini-document-processor function:', error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred processing the document.";
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: `Error del servidor al procesar el documento: ${errorMessage}` }),
        };
    }
};

export { handler };
