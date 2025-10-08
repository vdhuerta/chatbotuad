
import React, { useState } from 'react';
import ChatLauncher from './components/ChatLauncher';
import ChatWidget from './components/ChatWidget';
import AdminPanel from './components/AdminPanel';
import ToastContainer from './components/ToastContainer';

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const isExpanded = isChatOpen || isAdminOpen;

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

  // The pointerEvents logic is now the main controller for interactivity.
  // The ToastContainer is moved outside to prevent it from being affected.
  return (
    <>
      <div 
        className="w-full h-full"
        style={{ pointerEvents: isExpanded ? 'auto' : 'none' }}
      >
        {renderContent()}
      </div>
      <ToastContainer />
    </>
  );
}

export default App;
