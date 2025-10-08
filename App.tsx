
import React, { useState, useEffect } from 'react';
import ChatLauncher from './components/ChatLauncher';
import ChatWidget from './components/ChatWidget';
import AdminPanel from './components/AdminPanel';
import ToastContainer from './components/ToastContainer';

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const isExpanded = isChatOpen || isAdminOpen;

  // Re-introduce postMessage to communicate with the parent window
  // This allows the embed script to dynamically resize the iframe.
  useEffect(() => {
    // Ensure we are in an iframe before posting a message
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'UAD_CHATBOT_STATE_CHANGE',
        isExpanded: isExpanded,
      }, '*'); // In a real production environment, you should replace '*' with your Moodle domain for security.
    }
  }, [isExpanded]);

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

  // The pointerEvents logic is no longer needed as the iframe itself will be resized.
  return (
    <div className="w-full h-full relative">
      {renderContent()}
      <ToastContainer />
    </div>
  );
}

export default App;