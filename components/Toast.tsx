
import React, { useEffect } from 'react';
import { Toast as ToastType, ToastType as Type } from '../types';
import { CheckIcon, ErrorIcon } from './Icons';

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: number) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, [toast.id, onDismiss]);

  const getStyle = (type: Type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-500',
          icon: <CheckIcon className="w-6 h-6 text-white" />,
        };
      case 'error':
        return {
          bg: 'bg-red-500',
          icon: <ErrorIcon className="w-6 h-6 text-white" />,
        };
      default:
        return {
          bg: 'bg-blue-500',
          icon: <ErrorIcon className="w-6 h-6 text-white" />,
        };
    }
  };

  const { bg, icon } = getStyle(toast.type);

  return (
    <div
      className={`relative flex items-center text-white p-4 rounded-lg shadow-lg overflow-hidden animate-[slide-in-right_0.5s_ease-out]`}
    >
      <div className={`absolute inset-0 ${bg} opacity-90`}></div>
      <div className="relative flex items-center z-10">
        <div className="flex-shrink-0 mr-3">{icon}</div>
        <div>{toast.message}</div>
         <button onClick={() => onDismiss(toast.id)} className="absolute top-1 right-1 text-white/70 hover:text-white/100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
    </div>
  );
};

export default Toast;
