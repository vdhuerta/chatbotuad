import type { Handler, HandlerEvent } from "@netlify/functions";
import { GoogleGenAI } from "@google/genai";
import type { ChatMessage, KnowledgeBase, MessagePart } from '../../types';

// The API Key is stored as an environment variable on Netlify, not in the code.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This will cause the function to fail safely if the API key is not set.
  throw new Error("API_KEY environment variable not set in Netlify.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { history, newMessage, knowledgeBases } = JSON.parse(event.body || '{}');

    // This is the core logic moved from the original geminiService.ts
    const knowledgeParts: MessagePart[] = [];
    let allContentText = '';

    if (knowledgeBases && knowledgeBases.length > 0) {
        knowledgeBases.forEach((kb: KnowledgeBase) => {
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
        ...(history || []),
        { role: 'user', parts: [{ text: newMessage }] }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction
      }
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: response.text }),
    };
  } catch (error) {
    console.error('Error in gemini-proxy function:', error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: `Error del servidor al llamar a la API de Gemini: ${errorMessage}` }),
    };
  }
};

export { handler };
