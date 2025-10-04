import React, { useState, useRef, useEffect } from 'react';
import { Message, KnowledgeBase } from '../types';
import { useKnowledgeBase } from '../hooks/useKnowledgeBase';
import { generateChatResponse } from '../services/geminiService';
import { CloseIcon, AdminIcon, SendIcon } from './Icons';
import CourseSelector from './CourseSelector';
import MessageList from './MessageList';
import TypingIndicator from './TypingIndicator';

interface ChatWidgetProps {
  onClose: () => void;
  onAdminOpen: () => void;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ onClose, onAdminOpen }) => {
  const { knowledgeBases, selectedCourseNames } = useKnowledgeBase();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: '¡Hola! Selecciona uno o más cursos para comenzar.' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const selectedKBs = knowledgeBases.filter(kb => selectedCourseNames.includes(kb.course));
      if (selectedKBs.length === 0) {
        throw new Error("No course selected");
      }
      
      const contextText = selectedKBs.map(kb => `Course: ${kb.course}\nContent: ${kb.content}\nLinks: ${kb.links}`).join('\n\n---\n\n');
      const contextImage = selectedKBs.find(kb => kb.image_base64)?.image_base64;
      const contextImageType = selectedKBs.find(kb => kb.image_base64)?.image_type;
      
      const historyForApi = messages
        .filter(msg => msg.role !== 'error') // Filter out error messages
        .map(msg => ({
          role: msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: msg.content }]
      }));
      historyForApi.push({ role: 'user', parts: [{ text: input }] });

      const response = await generateChatResponse(
        historyForApi,
        contextText,
        contextImage && contextImageType ? { inlineData: { mimeType: contextImageType, data: contextImage } } : undefined
      );

      setMessages(prev => [...prev, { role: 'model', content: response }]);
    } catch (error) {
        if (error instanceof Error && error.message === "No course selected") {
            setMessages(prev => [...prev, { role: 'error', content: 'Por favor, selecciona al menos un curso del menú superior antes de preguntar.' }]);
        } else {
            const displayMessage = error instanceof Error ? error.message : 'Lo siento, ocurrió un error. Por favor, inténtalo de nuevo.';
            setMessages(prev => [...prev, { role: 'error', content: displayMessage }]);
        }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 w-[400px] h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 transition-all duration-300 origin-bottom-right animate-[scale-up_0.3s_ease-out]">
      {/* Header */}
      <div className="bg-gray-50 p-4 rounded-t-2xl border-b border-gray-200 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3">
          <img src="https://raw.githubusercontent.com/vdhuerta/assets-aplications/main/Logo%20UAD%20Redondo.png" alt="Logo UAD" className="w-10 h-10 rounded-full" />
          <div>
            <h3 className="font-bold text-gray-800">Asistente Virtual</h3>
            <CourseSelector />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={onAdminOpen} className="text-gray-500 hover:text-gray-800 p-1.5 rounded-full hover:bg-gray-200 transition-colors">
            <AdminIcon className="h-5 w-5" />
          </button>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-1.5 rounded-full hover:bg-gray-200 transition-colors">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={messages} />
      {isLoading && <TypingIndicator />}

      {/* Input */}
      <div className="p-4 border-t border-gray-200 flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleEnter}
            placeholder="Escribe tu mensaje..."
            disabled={isLoading}
            rows={1}
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none disabled:bg-gray-100 text-sm"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-blue-500 text-white p-2.5 rounded-full hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors transform hover:scale-105"
          >
            <SendIcon className="h-5 w-5" />
          </button>
        </form>
        <p className="text-center text-[9px] text-gray-500 mt-2">
          Desarrollado por UAD © 2025
        </p>
      </div>
    </div>
  );
};

export default ChatWidget;