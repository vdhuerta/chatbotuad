
import React, { useState, useEffect } from 'react';
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

  // The new architecture uses a self-contained iframe.
  // We control click-through behavior using `pointer-events`.
  // When collapsed (launcher only), the main container allows clicks to pass through.
  // The launcher component itself re-enables pointer-events for the button.
  // When expanded (chat/admin), the container becomes interactive.
  return (
    <div 
      className="w-full h-full relative"
      style={{ pointerEvents: isExpanded ? 'auto' : 'none' }}
    >
      {renderContent()}
      <ToastContainer />
    </div>
  );
}

export default App;