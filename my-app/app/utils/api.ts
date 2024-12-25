import { Message, MessageType } from '../types/chat';

export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload file');
  }

  const data = await response.json();
  return data.fileUrl;
}

export async function sendMessage(
  content: string,
  type: MessageType,
  responseFormat: MessageType,
  fileUrl?: string
): Promise<Message> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content,
      type,
      responseFormat,
      fileUrl,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  const data = await response.json();
  
  return {
    id: Date.now().toString(),
    content: data.content,
    type: data.type,
    isUser: false,
    timestamp: new Date().toISOString(),
    fileUrl: data.fileUrl,
  };
}
