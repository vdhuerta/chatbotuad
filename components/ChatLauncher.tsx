
import React, { useState, useEffect } from 'react';
import { useKnowledgeBase } from '../hooks/useKnowledgeBase';
import { ErrorIcon } from './Icons';
import Spinner from './Spinner';

interface ChatLauncherProps {
  onOpen: () => void;
}

const ChatLauncher: React.FC<ChatLauncherProps> = ({ onOpen }) => {
  const { loading, error } = useKnowledgeBase();
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setShake(true);
      setTimeout(() => setShake(false), 1000);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const getLauncherState = () => {
    if (loading) {
      return {
        icon: <Spinner className="h-8 w-8 border-white" />,
        bgColor: 'bg-gray-400',
        disabled: true,
        text: 'Cargando...',
      };
    }
    if (error) {
      return {
        icon: <ErrorIcon className="h-8 w-8 text-white" />,
        bgColor: 'bg-red-500',
        disabled: true,
        text: 'Error de Carga',
      };
    }
    return {
      icon: <img src="https://raw.githubusercontent.com/vdhuerta/assets-aplications/main/BotUAD.png" alt="Asistente UAD" className="w-full h-full" />,
      bgColor: 'bg-red-100',
      disabled: false,
      text: '¿Cómo te ayudo?',
    };
  };

  const { icon, bgColor, disabled, text } = getLauncherState();

  return (
    <div className="absolute bottom-0 right-0 p-3 flex items-center space-x-3">
      <div className={`px-4 py-2 bg-red-100 rounded-full shadow-lg text-red-700 font-semibold transition-opacity duration-300 ${shake ? 'shake' : ''}`}>
        {text}
      </div>
      <button
        onClick={onOpen}
        disabled={disabled}
        className={`w-[50px] h-[50px] rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-red-300 ${bgColor} ${!loading && !error ? 'animate-[pulse-zoom_2s_infinite]' : ''}`}
        aria-label="Abrir asistente virtual"
      >
        {icon}
      </button>
    </div>
  );
};

export default ChatLauncher;
