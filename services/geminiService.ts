import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

let ai: GoogleGenAI | null = null;

/**
 * Lazily initializes and returns the GoogleGenAI client instance.
 * This prevents the app from crashing on load if the API key is not set.
 * Throws an error if the API key is not configured in the environment.
 */
const getAiClient = (): GoogleGenAI => {
  if (ai) {
    return ai;
  }

  // FIX: Per @google/genai coding guidelines, the API key must be read from process.env.API_KEY.
  // This resolves the TypeScript error 'Property 'env' does not exist on type 'ImportMeta'' by avoiding `import.meta.env`.
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    throw new Error("La configuración del asistente es incorrecta. Falta la clave de API (API Key). Contacta al administrador para configurar la variable de entorno API_KEY en la plataforma de despliegue (ej. Netlify).");
  }

  ai = new GoogleGenAI({ apiKey });
  return ai;
};

const fileToGenerativePart = (base64: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  };
};

export const generateChatResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  context: string,
  image?: { inlineData: { mimeType: string; data: string } }
): Promise<string> => {
  console.log("Making Gemini Chat Request with context:", { context, image: !!image, history });

  const systemInstruction = `You are a virtual assistant for students at UAD.
Your one and only source of truth is the 'Knowledge Base' (text and images) I provide.
You MUST NOT use any external knowledge.
Your answers must be based exclusively on the provided 'Knowledge Base'.
If the question is about a topic not covered in the 'Knowledge Base', you MUST reply that you don't have information on that specific topic. Do not try to answer it anyway.
The user has selected one or more courses. Here is the knowledge base for the selected course(s):
---
KNOWLEDGE BASE START
${context}
KNOWLEDGE BASE END
---
Now, answer the user's last question based only on this knowledge base and the conversation history.`;

  try {
    const gemini = getAiClient();
    
    if (history.length === 0) {
      throw new Error("Cannot generate response for empty history.");
    }

    // FIX: Use the Chat API for multi-turn conversations. `generateContent` was being used incorrectly with a history array.
    const historyForChat = history.slice(0, -1).map(h => ({ role: h.role, parts: h.parts }));
    const lastMessage = history[history.length - 1];
    
    const currentMessageParts: any[] = [...lastMessage.parts];
    if (image) {
        currentMessageParts.push(image);
    }

    const chat = gemini.chats.create({
        model: 'gemini-2.5-flash',
        history: historyForChat,
        config: {
            systemInstruction: systemInstruction,
        },
    });
    
    const response: GenerateContentResponse = await chat.sendMessage({ message: currentMessageParts });

    return response.text;
  } catch (error) {
    console.error("Gemini API error:", error);
    if (error instanceof Error) {
        throw error; // Re-throw to be caught by the UI component
    }
    throw new Error("No se pudo obtener una respuesta del modelo de IA.");
  }
};

export const processDocumentContent = async (
  fileBase64: string,
  mimeType: string
): Promise<string> => {
  console.log(`[START] Gemini Document Processing. MimeType: ${mimeType}.`);

  const unsupportedTypes = ['application/zip', 'image/heic'];
  if (unsupportedTypes.includes(mimeType)) {
    console.warn(`[ABORT] Unsupported file type: ${mimeType}`);
    return "ERROR: Formato de archivo no soportado.";
  }

  try {
    const gemini = getAiClient();
    const imagePart = fileToGenerativePart(fileBase64, mimeType);
    const textPart = { text: "Extract the text content from this document and format it as clean, well-structured Markdown. Focus on the core information, using headings, lists, and paragraphs as appropriate." };

    console.log("[API CALL] Sending request to Gemini 'gemini-2.5-flash' model...");
    const response: GenerateContentResponse = await gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
    });

    const resultText = response.text;
    console.log("[API SUCCESS] Received response from Gemini. Length:", resultText.length);

    return resultText;
  } catch (error) {
    console.error("[API ERROR] Gemini document processing failed:", error);
     if (error instanceof Error) {
      return `ERROR: ${error.message}`;
    }
    return "ERROR: Falló el procesamiento del documento con el modelo de IA.";
  }
};