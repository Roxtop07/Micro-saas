import { Message } from '../types/chat';

interface ActionButtonsProps {
  message: Message;
  onCopy: (content: string) => void;
  onDelete: (id: string) => void;
  onRegenerate?: (id: string) => void;
  onDownload: (url: string, filename: string) => void;
}

export default function ActionButtons({
  message,
  onCopy,
  onDelete,
  onRegenerate,
  onDownload,
}: ActionButtonsProps) {
  return (
    <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
      {/* Copy button */}
      <button
        onClick={() => onCopy(message.content)}
        className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center gap-1 transition-colors"
        title="Copy message"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Copy
      </button>

      {/* Delete button */}
      <button
        onClick={() => onDelete(message.id)}
        className="text-xs px-2 py-1 rounded bg-red-50 hover:bg-red-100 text-red-600 flex items-center gap-1 transition-colors"
        title="Delete message"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Delete
      </button>

      {/* Regenerate button (only for AI responses) */}
      {!message.isUser && onRegenerate && (
        <button
          onClick={() => onRegenerate(message.id)}
          className="text-xs px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center gap-1 transition-colors"
          title="Regenerate response"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Regenerate
        </button>
      )}

      {/* Download button (for media files) */}
      {message.fileUrl && onDownload && (
        <button
          onClick={() => onDownload(message.fileUrl!, `${message.type}-${message.id}`)}
          className="text-xs px-2 py-1 rounded bg-green-50 hover:bg-green-100 text-green-600 flex items-center gap-1 transition-colors"
          title="Download file"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </button>
      )}
    </div>
  );
}
