
import React from 'react';

const TypingIndicator: React.FC = () => (
  <div className="flex items-center space-x-1.5 p-4 pt-1 flex-shrink-0">
    <div className="h-2 w-2 bg-gray-400 rounded-full wave-animation" style={{ animationDelay: '0s' }}></div>
    <div className="h-2 w-2 bg-gray-400 rounded-full wave-animation" style={{ animationDelay: '0.1s' }}></div>
    <div className="h-2 w-2 bg-gray-400 rounded-full wave-animation" style={{ animationDelay: '0.2s' }}></div>
  </div>
);

export default TypingIndicator;