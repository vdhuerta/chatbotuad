
import React, { useState } from 'react';
import ChatLauncher from './components/ChatLauncher';
import ChatWidget from './components/ChatWidget';
import AdminPanel from './components/AdminPanel';
import ToastContainer from './components/ToastContainer';

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  return (
    <>
      <ToastContainer />

      {!isChatOpen && <ChatLauncher onOpen={() => setIsChatOpen(true)} />}
      
      {isChatOpen && (
        <ChatWidget 
          onClose={() => setIsChatOpen(false)} 
          onAdminOpen={() => setIsAdminOpen(true)}
        />
      )}

      {isAdminOpen && <AdminPanel onClose={() => setIsAdminOpen(false)} />}
    </>
  );
}

export default App;