
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
    // This effect manages the click-through behavior of the iframe.
    const root = document.getElementById('root');
    if (root) {
      if (isAnythingOpen) {
        // When the chat or admin panel is open, the entire app should be interactive.
        root.style.pointerEvents = 'auto';
      } else {
        // When only the launcher is visible, the root container should allow clicks
        // to pass through to the underlying page (e.g., Moodle).
        // The ChatLauncher component will re-enable pointer events for itself.
        root.style.pointerEvents = 'none';
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