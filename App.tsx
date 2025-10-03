
import React, { useState, Fragment, useEffect } from 'react';
import { Chatbot } from './components/Chatbot';
import { CourseAdmin } from './components/AdminPanel';
import { CloseIcon } from './components/icons/CloseIcon';
import { CogIcon } from './components/icons/CogIcon';
import type { ChatMessage } from './types';
import { KnowledgeBaseProvider, useKnowledgeBase } from './context/KnowledgeBaseContext';

const App: React.FC = () => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: 'model',
            parts: [{ text: '¡Hola! ¿En qué puedo ayudarte hoy?' }],
        },
    ]);
    const [view, setView] = useState<'chat' | 'login' | 'admin'>('chat');
    const [password, setPassword] = useState('');
    const [isCourseSelectorOpen, setIsCourseSelectorOpen] = useState(false);
    const [animateHelpText, setAnimateHelpText] = useState(false);

    const { knowledgeBases, selectedKnowledgeBases, selectedCourseNames, actions, isLoading, error } = useKnowledgeBase();
    
    useEffect(() => {
        // Interval to trigger the shake animation on the help text bubble
        const intervalId = setInterval(() => {
            setAnimateHelpText(true);
            // The animation duration is ~820ms from the CSS.
            // We reset the state after the animation completes.
            const timeoutId = setTimeout(() => {
                setAnimateHelpText(false);
            }, 1000); 

            return () => clearTimeout(timeoutId);
        }, 10000); // Triggers every 10 seconds

        return () => clearInterval(intervalId); // Cleanup on component unmount
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // This is a simple, insecure password check for demonstration purposes.
        // In a real application, use a secure authentication method.
        if (password === '070670') { 
            setView('admin');
            setPassword('');
        } else {
            alert('Contraseña incorrecta.');
            setPassword('');
        }
    };

    if (view === 'login') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-2xl shadow-lg">
                    <h2 className="text-2xl font-bold text-center text-gray-800">Acceso de Administrador</h2>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label htmlFor="password-input" className="sr-only">Contraseña</label>
                            <input
                                id="password-input"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Contraseña"
                                className="w-full px-4 py-3 text-sm bg-gray-100 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                            />
                        </div>
                        <div className="flex items-center gap-4">
                             <button type="button" onClick={() => setView('chat')} className="w-full py-3 text-sm font-semibold text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 transition-colors">
                                Cancelar
                            </button>
                            <button type="submit" className="w-full py-3 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors">
                                Ingresar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }
    
    if (view === 'admin') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60">
                <div className="w-full max-w-7xl h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                    <CourseAdmin onExit={() => setView('chat')} />
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p>Cargando asistente...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    return (
        <>
            {/* Chat Launcher */}
            <button
                onClick={() => setIsChatOpen(true)}
                className={`fixed bottom-6 right-6 z-40 flex items-center gap-3 group transition-all duration-300 ease-in-out ${isChatOpen ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}
                aria-label="Abrir chat"
            >
                <div className={`bg-rose-100 px-4 py-2 rounded-full shadow-lg ${animateHelpText ? 'animate-shake' : ''}`}>
                    <p className="font-semibold text-rose-700">¿Cómo te ayudo?</p>
                </div>
                <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform animate-heartbeat">
                    <img src="https://raw.githubusercontent.com/vdhuerta/assets-aplications/main/BotUAD.png" alt="Asistente Virtual" className="w-full h-full object-contain p-1" />
                </div>
            </button>
            
            {/* Chat Window */}
            <div className={`fixed bottom-28 right-6 w-full max-w-md h-[70vh] max-h-[600px] transition-all duration-300 ease-in-out origin-bottom-right z-50 ${isChatOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                 <div className="relative w-full h-full bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b">
                        <div className="flex items-center gap-3">
                            <img src="https://raw.githubusercontent.com/vdhuerta/assets-aplications/main/Logo%20UAD%20Redondo.png" alt="Logo UAD" className="w-10 h-10 object-contain" />
                            <div>
                                <h1 className="text-base font-bold text-gray-800">
                                    Asistente Virtual
                                </h1>
                                <div className="relative">
                                    <button onClick={() => setIsCourseSelectorOpen(prev => !prev)} className="text-xs text-blue-600 hover:underline">
                                        Buscando en: {selectedCourseNames.length === 0 ? 'General' : `${selectedCourseNames.length} curso(s)`}
                                    </button>
                                     {isCourseSelectorOpen && (
                                        <div className="absolute top-full mt-2 w-64 bg-white border rounded-lg shadow-xl z-10 p-2">
                                            <p className="text-xs font-semibold text-gray-600 px-2 py-1">Selecciona los cursos:</p>
                                            <div className="max-h-48 overflow-y-auto">
                                                {knowledgeBases.map(kb => (
                                                    <label key={kb.course} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                            checked={selectedCourseNames.includes(kb.course)}
                                                            onChange={() => actions.toggleChatCourseSelection(kb.course)}
                                                        />
                                                        <span className="text-sm text-gray-800">{kb.course}</span>
                                                    </label>
                                                ))}
                                                {knowledgeBases.length === 0 && (
                                                    <p className="text-sm text-gray-500 p-2">No hay cursos disponibles.</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 self-start">
                             <button
                                onClick={() => {
                                    setView('login');
                                    setIsChatOpen(false); // Optionally close chat when opening admin
                                }}
                                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors duration-200"
                                aria-label="Panel de Administración"
                            >
                                <img src="https://raw.githubusercontent.com/vdhuerta/assets-aplications/main/controles-deslizantes-de-configuracion%20(1).png" alt="Panel de Administración" className="w-5 h-5 object-contain" />
                            </button>
                             <button
                                onClick={() => setIsChatOpen(false)}
                                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors duration-200"
                                aria-label="Cerrar chat"
                            >
                                <CloseIcon className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="w-full h-full flex flex-col flex-grow overflow-y-auto" onClick={() => isCourseSelectorOpen && setIsCourseSelectorOpen(false)}>
                        <Chatbot
                            messages={messages}
                            setMessages={setMessages}
                            selectedKnowledgeBases={selectedKnowledgeBases}
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

const AppContainer: React.FC = () => (
    <KnowledgeBaseProvider>
        <App />
    </KnowledgeBaseProvider>
);

export default AppContainer;