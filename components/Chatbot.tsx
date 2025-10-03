import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getChatResponse } from '../services/geminiService';
import type { ChatMessage, KnowledgeBase } from '../types';
import { UserIcon } from './icons/UserIcon';
import { BotIcon } from './icons/BotIcon';
import { SendIcon } from './icons/SendIcon';

interface ChatbotProps {
    messages: ChatMessage[];
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    selectedKnowledgeBases: KnowledgeBase[];
}

export const Chatbot: React.FC<ChatbotProps> = ({ messages, setMessages, selectedKnowledgeBases }) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = useCallback(async () => {
        if (input.trim() === '' || isLoading) return;

        const currentInput = input;
        const userMessage: ChatMessage = { role: 'user', parts: [{ text: currentInput }] };
        
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInput('');
        setIsLoading(true);

        try {
            const history = updatedMessages.slice(1, -1);
            const responseText = await getChatResponse(history, currentInput, selectedKnowledgeBases);
            
            const isError = responseText.startsWith("Error:");
            const modelMessage: ChatMessage = { 
                role: 'model', 
                parts: [{ text: responseText }],
                isError: isError
            };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            console.error("Error sending message:", error);
            const errorMessage: ChatMessage = { 
                role: 'model', 
                parts: [{ text: "Error: Lo siento, no pude procesar tu solicitud. Inténtalo de nuevo." }],
                isError: true
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }

    }, [input, isLoading, messages, setMessages, selectedKnowledgeBases]);


    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="flex-grow overflow-y-auto p-4 space-y-6">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'model' && (
                             <div className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center ${
                                msg.isError ? 'bg-red-200' : 'bg-gray-200'
                             }`}>
                                <BotIcon className={`w-6 h-6 ${msg.isError ? 'text-red-600' : 'text-gray-600'}`}/>
                            </div>
                        )}
                        <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                            msg.role === 'user' 
                                ? 'bg-blue-600 text-white rounded-br-none' 
                                : msg.isError
                                    ? 'bg-red-100 text-red-800 rounded-bl-none border border-red-200'
                                    : 'bg-gray-200 text-gray-800 rounded-bl-none'
                        }`}>
                            {msg.parts.map((part, i) => 'text' in part ? <p key={i} className="whitespace-pre-wrap">{part.text}</p> : null)}
                        </div>
                        {msg.role === 'user' && (
                           <div className="w-10 h-10 flex-shrink-0 bg-blue-600 text-white rounded-full flex items-center justify-center">
                                <UserIcon className="w-6 h-6"/>
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                     <div className="flex items-start gap-3 justify-start">
                         <div className="w-10 h-10 flex-shrink-0 bg-gray-200 rounded-full flex items-center justify-center">
                            <BotIcon className="w-6 h-6 text-gray-600"/>
                        </div>
                        <div className="max-w-xs px-4 py-3 rounded-2xl rounded-bl-none bg-gray-200">
                            <div className="flex items-center justify-center space-x-1">
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t flex items-center gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe tu mensaje..."
                    className="flex-grow w-full bg-gray-100 text-gray-800 placeholder-gray-500 text-sm py-2 px-4 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    disabled={isLoading}
                />
                <button
                    onClick={handleSend}
                    disabled={isLoading}
                    className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 active:scale-95 transition-all duration-200 disabled:bg-blue-300 disabled:cursor-not-allowed"
                    aria-label="Enviar mensaje"
                >
                    <SendIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};