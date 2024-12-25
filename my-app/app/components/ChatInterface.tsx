'use client';

import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Message as ImportedMessage, MessageType, APIResponse } from '../types/chat';

type Message = ImportedMessage & {
  responseFormat: MessageType;
  status: 'sending' | 'sent' | 'error';
  error?: string;
  fileUrl?: string;
};

import ChatMessage from './ChatMessage';
import ActionButtons from './ActionButtons';
import { uploadFile, sendMessage } from '../utils/api';

const ChatInterface: React.FC = () => {
  const [inputType, setInputType] = useState<MessageType>('text');
  const [responseFormat, setResponseFormat] = useState<MessageType>('text');
  const [textInput, setTextInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    try {
      setIsLoading(true);
      setError(null);

      // Use crypto.randomUUID() for consistent ID generation
      const userMessage: Message = {
        id: crypto.randomUUID(),
        content: textInput,
        type: inputType,
        isUser: true,
        timestamp: new Date().toISOString(),
        responseFormat,
        status: 'sending'
      };
      setMessages(prev => [...prev, userMessage]);

      // Get AI response
      const response = await sendMessage(textInput, inputType, responseFormat);
      
      // Update user message status
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id 
          ? { ...msg, status: 'sent' }
          : msg
      ));

      // Add AI response
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        content: response.content,
        type: responseFormat,
        isUser: false,
        timestamp: new Date().toISOString(),
        fileUrl: response.fileUrl,
        responseFormat: responseFormat,
        status: response.error ? 'error' : 'sent',
        error: response.error
      };
      setMessages(prev => [...prev, aiMessage]);
      
      if (response.error === 'rate_limit_exceeded') {
        toast.error('Rate limit exceeded. Please try again in about an hour.');
      }
      setTextInput('');
    } catch (err) {
      console.error('Full error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);

      // Update last message with error status
      setMessages(prev => prev.map((msg, index) => 
        index === prev.length - 1
          ? { ...msg, status: 'error', error: errorMessage }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      
      if (file.size > 25 * 1024 * 1024) {
        throw new Error('File size must be less than 25MB');
      }

      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const validAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg'];
      const validTypes = inputType === 'image' ? validImageTypes : validAudioTypes;

      if (!validTypes.includes(file.type)) {
        throw new Error(`Invalid file type. Please upload ${inputType === 'image' ? 'an image' : 'an audio'} file`);
      }

      setIsLoading(true);
      const fileUrl = await uploadFile(file);
      await handleSubmit(e as React.FormEvent);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleDeleteMessage = (id: string) => {
    setMessages(prev => prev.filter(message => message.id !== id));
    toast.success('Message deleted');
  };

  const handleRegenerateMessage = async (id: string) => {
    try {
      setError(null);
      setIsLoading(true);

      // Find the message to regenerate
      const messageIndex = messages.findIndex(m => m.id === id);
      if (messageIndex === -1) return;

      // Get the previous user message
      const userMessage = messages[messageIndex - 1];
      if (!userMessage || !userMessage.isUser) {
        throw new Error('Cannot regenerate response: No user message found');
      }

      // Remove all messages after the user message
      setMessages(prev => prev.slice(0, messageIndex));

      // Generate new response
      const response = await sendMessage(userMessage.content, userMessage.type, responseFormat);
      
      // Add new AI response
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        content: response.content,
        type: responseFormat,
        isUser: false,
        timestamp: new Date().toISOString(),
        fileUrl: response.fileUrl,
        responseFormat: responseFormat,
        status: 'sent'
      };
      
      setMessages(prev => [...prev, aiMessage]);
      toast.success('Response regenerated');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to regenerate response';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((message) => (
          <ChatMessage 
            key={message.id} 
            message={message} 
            onDelete={handleDeleteMessage}
            onRegenerate={handleRegenerateMessage}
          />
        ))}
        {isLoading && (
          <div className="loading-indicator">
            AI is thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input-container">
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Input Type:</div>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setInputType('text')}
              className={`px-4 py-2 rounded ${
                inputType === 'text' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
              disabled={isLoading}
            >
              Text
            </button>
            <button
              onClick={() => setInputType('audio')}
              className={`px-4 py-2 rounded ${
                inputType === 'audio' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
              disabled={isLoading}
            >
              Audio
            </button>
            <button
              onClick={() => setInputType('image')}
              className={`px-4 py-2 rounded ${
                inputType === 'image' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
              disabled={isLoading}
            >
              Image
            </button>
          </div>

          <div className="text-sm font-medium text-gray-700 mb-2">Response Format:</div>
          <div className="flex gap-2">
            <button
              onClick={() => setResponseFormat('text')}
              className={`px-4 py-2 rounded ${
                responseFormat === 'text' ? 'bg-green-500 text-white' : 'bg-gray-200'
              }`}
              disabled={isLoading}
            >
              Text
            </button>
            <button
              onClick={() => setResponseFormat('speech')}
              className={`px-4 py-2 rounded ${
                responseFormat === 'speech' ? 'bg-green-500 text-white' : 'bg-gray-200'
              }`}
              disabled={isLoading}
            >
              Speech
            </button>
            <button
              onClick={() => setResponseFormat('image')}
              className={`px-4 py-2 rounded ${
                responseFormat === 'image' ? 'bg-green-500 text-white' : 'bg-gray-200'
              }`}
              disabled={isLoading}
            >
              Image
            </button>
          </div>
        </div>

        {inputType === 'text' ? (
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="w-full p-2 border rounded-lg resize-none h-32 focus:ring-2 focus:ring-blue-500"
                placeholder="Type your message here..."
                disabled={isLoading}
              />
              <div className="absolute right-2 bottom-2 text-sm text-gray-500">
                {textInput.length} characters
              </div>
            </div>
            <button 
              className="send-button"
              type="submit"
              disabled={isLoading || !textInput.trim()}
            >
              Send
            </button>
          </form>
        ) : (
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <input
              type="file"
              accept={inputType === 'audio' ? 'audio/*' : 'image/*'}
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              disabled={isLoading}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer text-blue-500 hover:text-blue-600"
            >
              Click to upload
              <br />
              <span className="text-sm text-gray-500">
                {inputType === 'audio' ? 'Audio files' : 'Image files'} up to 25MB
              </span>
            </label>
          </div>
        )}

        {error && (
          <div className="mt-2 text-sm text-red-500">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
