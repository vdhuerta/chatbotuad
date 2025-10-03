
export interface TextPart {
    text: string;
}

export interface InlineDataPart {
    inlineData: {
        mimeType: string;
        data: string;
    };
}

export type MessagePart = TextPart | InlineDataPart;

export interface ChatMessage {
    role: 'user' | 'model';
    parts: MessagePart[];
    isError?: boolean;
}

export interface ImageFile {
    name: string;
    type: string;
    base64: string;
}

export interface KnowledgeBase {
    id?: number; // Added to uniquely identify records
    course: string;
    content: string;
    image: ImageFile | null;
    links: string; 
}