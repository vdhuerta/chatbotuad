
import React from 'react';

const Spinner: React.FC<{ className?: string }> = ({ className = 'h-5 w-5 border-white' }) => (
  <div className={`animate-spin rounded-full border-2 border-t-transparent ${className}`} />
);

export default Spinner;
