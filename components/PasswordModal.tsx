
import React, { useState } from 'react';
import { ADMIN_PASSWORD } from '../constants';
import { CloseIcon } from './Icons';

interface PasswordModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ onSuccess, onClose }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      onSuccess();
    } else {
      setError('Contraseña incorrecta.');
      setPassword('');
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full mx-auto relative">
      <button 
        onClick={onClose} 
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Cerrar"
      >
        <CloseIcon className="w-6 h-6" />
      </button>
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Acceso de Administrador</h2>
      <p className="text-center text-gray-500 mb-6">Ingresa la contraseña para continuar.</p>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError('');
          }}
          className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${error ? 'border-red-500 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'}`}
          placeholder="Contraseña"
        />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <button
          type="submit"
          className="w-full mt-6 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Entrar
        </button>
      </form>
    </div>
  );
};

export default PasswordModal;