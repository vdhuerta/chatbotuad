
import React, { useRef, useEffect } from 'react';
import { Message } from '../types';

interface MessageListProps {
  messages: Message[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

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
            className={`max-w-[80%] p-3 rounded-xl whitespace-pre-wrap text-sm ${getMessageStyle(msg.role)}`}
          >
            {msg.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;