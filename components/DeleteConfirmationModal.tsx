
import React, { useState } from 'react';
import { ADMIN_PASSWORD } from '../constants';

interface DeleteConfirmationModalProps {
  courseName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ courseName, onConfirm, onCancel }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (password === ADMIN_PASSWORD) {
      onConfirm();
    } else {
      setError('Contraseña incorrecta.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[110]">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-lg font-bold text-gray-900">Confirmar Eliminación</h2>
        <p className="mt-2 text-sm text-gray-600">
          ¿Estás seguro de que quieres eliminar el curso <strong className="text-red-600">{courseName}</strong>? Esta acción no se puede deshacer.
        </p>
        <p className="mt-4 text-sm text-gray-600">
          Para confirmar, por favor ingresa la contraseña de administrador.
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError('');
          }}
          className={`w-full mt-2 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${error ? 'border-red-500 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'}`}
          placeholder="Contraseña"
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:bg-red-300"
            disabled={!password}
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
