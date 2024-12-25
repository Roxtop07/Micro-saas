export type MessageType = 'text' | 'audio' | 'image' | 'video' | 'speech';

export interface Message {
  id: string;
  content: string;
  type: MessageType;
  isUser: boolean;
  timestamp: string;
  fileUrl?: string;
  responseFormat?: MessageType;
  error?: string;
  status?: 'sending' | 'sent' | 'error';
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export interface APIResponse {
  type: MessageType;
  content: string;
  fileUrl?: string;
  error?: string;
}
