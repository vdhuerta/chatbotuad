export interface KnowledgeBase {
  id: number;
  course: string;
  content: string;
  links: string;
  image_name: string | null;
  image_type: string | null;
  image_base64: string | null;
}

export type MessageRole = 'user' | 'model' | 'error';

export interface Message {
  role: MessageRole;
  content: string;
}

// FIX: Add Toast and ToastType to be used by the toast notification system.
export type ToastType = 'success' | 'error';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}
