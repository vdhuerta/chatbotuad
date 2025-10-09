
import React, { useRef, useEffect, useState } from 'react';
import { Message } from '../types';
import { CopyIcon, CheckIcon } from './Icons';

interface MessageListProps {
  messages: Message[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleCopy = (text: string, index: number) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedMessageIndex(index);
      setTimeout(() => setCopiedMessageIndex(null), 2000);
    });
  };

  const getMessageStyle = (role: string) => {
    switch (role) {
      case 'user':
        return 'bg-blue-500 text-white self-end';
      case 'model':
        return 'bg-gray-200 text-gray-800 self-start';
      case 'error':
        return 'bg-red-100 text-red-800 self-start border border-red-200';
      default:
        return 'bg-gray-200 text-gray-800 self-start';
    }
  };

  return (
    <div className="flex-1 p-4 overflow-y-auto bg-white">
      <div className="flex flex-col space-y-3">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`max-w-[80%] p-3 rounded-xl whitespace-pre-wrap text-sm relative group ${getMessageStyle(msg.role)}`}
          >
            {msg.content}
            {msg.role !== 'user' && msg.content && (
              <button
                onClick={() => handleCopy(msg.content, index)}
                className="absolute top-2 right-2 p-1 bg-black/20 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/30"
                aria-label={copiedMessageIndex === index ? 'Copiado' : 'Copiar texto'}
              >
                {copiedMessageIndex === index ? (
                  <CheckIcon className="w-4 h-4 text-gray-800" />
                ) : (
                  <CopyIcon className="w-4 h-4 text-gray-800" />
                )}
              </button>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;