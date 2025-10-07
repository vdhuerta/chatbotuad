
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

    // The entire iframe area should only be interactive when the admin panel modal is open.
    // In all other cases (chat open or chat closed), the root should be click-through,
    // allowing the individual components (launcher, widget) to capture their own pointer events.
    if (isAdminOpen) {
      root.style.pointerEvents = 'auto';
    } else {
      root.style.pointerEvents = 'none';
    }
    // This effect's logic only depends on whether the admin modal is active.
  }, [isAdminOpen]);

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