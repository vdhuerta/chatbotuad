
import React, { useState, useEffect } from 'react';
import ChatLauncher from './components/ChatLauncher';
import ChatWidget from './components/ChatWidget';
import AdminPanel from './components/AdminPanel';
import ToastContainer from './components/ToastContainer';

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // NEW ARCHITECTURE: postMessage communication
  // This effect communicates the widget's state (expanded or collapsed) to the parent window.
  // The parent window (e.g., Moodle) will be responsible for resizing the iframe,
  // which is the definitive solution to the click-through/overlapping problem.
  useEffect(() => {
    const isExpanded = isChatOpen || isAdminOpen;
    // The message object has a unique type to prevent conflicts with other scripts.
    window.parent.postMessage({ type: 'UAD_CHATBOT_STATE', isExpanded }, '*');
  }, [isChatOpen, isAdminOpen]);


  const openAdminPanel = () => {
    setIsChatOpen(false);
    setIsAdminOpen(true);
  };

  const closeAdminPanel = () => {
    setIsAdminOpen(false);
  };
  
  const openChat = () => {
      setIsChatOpen(true);
  };

  const closeChat = () => {
      setIsChatOpen(false);
  };

  const renderContent = () => {
    if (isChatOpen) {
      return <ChatWidget onClose={closeChat} onAdminOpen={openAdminPanel} />;
    }
    if (isAdminOpen) {
      return <AdminPanel onClose={closeAdminPanel} />;
    }
    return <ChatLauncher onOpen={openChat} />;
  }

  // The old pointer-events wrapper has been removed as this logic is now handled
  // by the parent page resizing the iframe itself.
  return (
    <div className="w-full h-full relative">
      {renderContent()}
      <ToastContainer />
    </div>
  );
}

export default App;