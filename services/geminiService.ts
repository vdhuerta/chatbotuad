import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// This service now makes real calls to the Gemini API.
// It should be handled on a secure server in a production environment
// to protect the API key.

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = (base64: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64,
      mimeType
    },
  };
}

export const generateChatResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  context: string,
  image?: { inlineData: { mimeType: string; data: string } }
): Promise<string> => {
  console.log("Making real Gemini Chat Request with context:", { context, image: !!image, history });

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
    const contents = [...history.map(h => ({ role: h.role, parts: h.parts }))];
    
    // Add context image if it exists
    const lastUserMessage = contents[contents.length-1];
    if (image && lastUserMessage.parts[0]) {
        lastUserMessage.parts.push(image as any);
    }

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to get response from AI model.");
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
  
  if (!process.env.API_KEY) {
      console.error("[ERROR] Gemini API Key is not configured.");
      return "ERROR: La API Key de Gemini no está configurada. Contacta al administrador.";
  }

  try {
    const imagePart = fileToGenerativePart(fileBase64, mimeType);
    const textPart = { text: "Extract the text content from this document and format it as clean, well-structured Markdown. Focus on the core information, using headings, lists, and paragraphs as appropriate." };
    
    console.log("[API CALL] Sending request to Gemini 'gemini-2.5-flash' model...");
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
    });
    
    const resultText = response.text;
    console.log("[API SUCCESS] Received response from Gemini. Length:", resultText.length);
    
    return resultText;
  } catch (error) {
    console.error("[API ERROR] Gemini document processing failed:", error);
    return "ERROR: Falló el procesamiento del documento con el modelo de IA.";
  }
};