import { Message } from '../types/chat';
import Image from 'next/image';
import { useState } from 'react';
import ActionButtons from './ActionButtons';
import { toast } from 'sonner';

interface ChatMessageProps {
  message: Message;
  onDelete: (id: string) => void;
  onRegenerate?: (id: string) => void;
}

export default function ChatMessage({ message, onDelete, onRegenerate }: ChatMessageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`message ${message.isUser ? 'user' : 'ai'}`}>
      <div className="message-content">
        {!message.isUser && (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium mr-2">
            AI
          </div>
        )}
        
        <div
          className={`max-w-[70%] p-4 rounded-lg message-bubble ${
            message.isUser
              ? 'bg-blue-500 text-white rounded-br-none'
              : 'bg-white shadow-md text-gray-900 rounded-bl-none'
          } ${message.status === 'error' ? 'border-2 border-red-500' : ''}`}
        >
          {message.type === 'text' && (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}
          
          {message.type === 'image' && message.fileUrl && (
            <div className="relative">
              <div className={`relative w-full aspect-square rounded-lg overflow-hidden ${!imageLoaded ? 'bg-gray-100' : ''}`}>
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="loading-pulse">
                      <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v2m0 12v2M4 12h2m12 0h2m-4.5-7.5l1.5-1.5m-9 9l-1.5 1.5m11-1.5l1.5 1.5m-9-9l-1.5-1.5"/>
                      </svg>
                    </div>
                  </div>
                )}
                <Image
                  src={message.fileUrl}
                  alt="Chat image"
                  fill
                  className={`object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setImageLoaded(true)}
                />
              </div>
            </div>
          )}
          
          {message.type === 'audio' && message.fileUrl && (
            <div className="bg-gray-50 rounded p-2">
              <audio controls className="w-full">
                <source src={message.fileUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          {message.status === 'sending' && (
            <div className="text-xs mt-2 text-gray-400">
              Sending...
            </div>
          )}

          {message.status === 'error' && message.error && (
            <div className="text-xs mt-2 text-red-500">
              {message.error === 'rate_limit_exceeded' 
                ? 'Rate limit exceeded. Please try again later.'
                : message.error}
            </div>
          )}
          
          <div className={`text-xs mt-2 flex items-center gap-2 ${
            message.isUser ? 'text-blue-100' : 'text-gray-500'
          }`}>
            <span>{formatTime(message.timestamp)}</span>
            {message.type !== 'text' && (
              <span className="px-2 py-1 rounded-full bg-opacity-20 bg-current text-current">
                {message.type}
              </span>
            )}
          </div>

          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <ActionButtons
              message={message}
              onDelete={onDelete}
              onRegenerate={onRegenerate}
              onCopy={(content) => {
                navigator.clipboard.writeText(content);
                toast.success('Copied to clipboard');
              }}
              onDownload={(url, filename) => {
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            />
          </div>
        </div>

        {message.isUser && (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium ml-2">
            You
          </div>
        )}
      </div>
    </div>
  );
}
