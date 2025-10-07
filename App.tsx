
import React, { useState, useEffect } from 'react';
import ChatLauncher from './components/ChatLauncher';
import ChatWidget from './components/ChatWidget';
import AdminPanel from './components/AdminPanel';
import ToastContainer from './components/ToastContainer';

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;

    if (isAdminOpen) {
      // When the admin panel is open (modal), the entire app area must be interactive.
      root.style.pointerEvents = 'auto';
    } else {
      // For both the launcher and the chat widget, the root container should allow
      // clicks to pass through to the underlying page. The individual components
      // (ChatLauncher, ChatWidget) will re-enable pointer events for themselves.
      root.style.pointerEvents = 'none';
    }
    // This effect should run whenever the visibility of a major component changes.
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

  return (
    <>
      {renderContent()}
      <ToastContainer />
    </>
  );
}

export default App;