
import React, { useState, useEffect } from 'react';
import ChatLauncher from './components/ChatLauncher';
import ChatWidget from './components/ChatWidget';
import AdminPanel from './components/AdminPanel';
import ToastContainer from './components/ToastContainer';

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const isAnythingOpen = isChatOpen || isAdminOpen;

  useEffect(() => {
    const root = document.getElementById('root');
    const body = document.body;

    if (root && body) {
      if (isAnythingOpen) {
        // When a panel is open, make the entire iframe clickable.
        body.style.pointerEvents = 'auto';
        
        // And reset root styles to fill the iframe.
        root.style.pointerEvents = '';
        root.style.position = 'static';
        root.style.width = '100%';
        root.style.height = '100%';
        root.style.bottom = '';
        root.style.right = '';
      } else {
        // When only the launcher is visible, make the iframe background non-clickable ("pass-through").
        body.style.pointerEvents = 'none';
        
        // Re-enable clicks only for the root container, which is shrunk to fit the launcher.
        root.style.pointerEvents = 'auto';
        root.style.position = 'absolute';
        root.style.bottom = '0';
        root.style.right = '0';
        root.style.width = '300px'; // A generous width for the launcher and its text bubble
        root.style.height = '100px'; // A generous height for the launcher
      }
    }
  }, [isAnythingOpen]);

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
      <ToastContainer />
      {renderContent()}
    </>
  );
}

export default App;
