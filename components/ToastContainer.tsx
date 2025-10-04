
import React from 'react';
import { useKnowledgeBase } from '../hooks/useKnowledgeBase';
import Toast from './Toast';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useKnowledgeBase();

  return (
    <div className="fixed bottom-5 right-5 z-[200] w-80 space-y-3">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  );
};

export default ToastContainer;
