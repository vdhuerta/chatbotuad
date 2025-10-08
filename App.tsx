
import React, { useState } from 'react';
import ChatLauncher from './components/ChatLauncher';
import ChatWidget from './components/ChatWidget';
import AdminPanel from './components/AdminPanel';
import ToastContainer from './components/ToastContainer';

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

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

  // This wrapper div declaratively handles the pointer-events logic.
  // This is a more robust, "React-way" of handling this, preventing
  // side-effects from direct DOM manipulation and ensuring the click-through
  // behavior is consistently applied.
  return (
    <div 
      className="w-full h-full relative" 
      style={{ pointerEvents: isAdminOpen ? 'auto' : 'none' }}
    >
      {renderContent()}
      <ToastContainer />
    </div>
  );
}

export default App;
