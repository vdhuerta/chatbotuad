
import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { KnowledgeBase } from '../types';
import { useKnowledgeBase } from '../hooks/useKnowledgeBase';
import PasswordModal from './PasswordModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { PlusIcon, SaveIcon, TrashIcon, ExitIcon, UploadIcon, ImagePreviewIcon, CloseIcon, CopyIcon, ArrowLeftIcon } from './Icons';
import Spinner from './Spinner';

interface AdminPanelProps {
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { knowledgeBases, addKnowledgeBase, updateKnowledgeBase, deleteKnowledgeBase, uploadAndProcessDocument } = useKnowledgeBase();
  
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [activeCourse, setActiveCourse] = useState<KnowledgeBase | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formState, setFormState] = useState<Partial<KnowledgeBase>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingDoc, setIsProcessingDoc] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const showStatusMessage = (text: string, type: 'success' | 'error', duration: number = 4000) => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), duration);
  };

  const selectCourse = (kb: KnowledgeBase) => {
    setActiveCourse(kb);
    setFormState(kb);
    setIsCreating(false);
    setHasChanges(false);
    setStatusMessage(null);
    setView('editor');
  };

  const handleNewCourse = () => {
    const newCourseTemplate: Partial<KnowledgeBase> = {
      course: '',
      content: '',
      links: '',
      image_name: null,
      image_type: null,
      image_base64: null,
    };
    setActiveCourse(null);
    setFormState(newCourseTemplate);
    setIsCreating(true);
    setHasChanges(false); // Changes will be true on first input
    setStatusMessage(null);
    setView('editor');
  };

  const handleBackToList = () => {
    setView('list');
    setActiveCourse(null);
    setIsCreating(false);
    setFormState({});
  }
  
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState({ ...formState, [e.target.name]: e.target.value });
    setHasChanges(true);
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        setFormState({
          ...formState,
          image_name: file.name,
          image_type: file.type,
          image_base64: base64,
        });
        setHasChanges(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormState({
      ...formState,
      image_name: null,
      image_type: null,
      image_base64: null,
    });
    setHasChanges(true);
  };

  const handleDocUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingDoc(true);
      try {
        const markdown = await uploadAndProcessDocument(file);
        setFormState(prev => ({ ...prev, content: `${prev.content || ''}\n\n${markdown}`.trim() }));
        setHasChanges(true);
        showStatusMessage('Documento procesado con éxito.', 'success');
      } catch (error) {
        console.error("Doc processing failed:", error);
        showStatusMessage(error instanceof Error ? error.message : 'Fallo en el procesamiento.', 'error');
      } finally {
        setIsProcessingDoc(false);
      }
    }
  };
  
  const handleSaveChanges = async () => {
    if (!formState.course) {
        showStatusMessage('El nombre del curso es obligatorio.', 'error');
        return;
    };
    setIsSaving(true);
    try {
        if (isCreating) {
            await addKnowledgeBase(formState as Omit<KnowledgeBase, 'id'>);
        } else if (activeCourse) {
            await updateKnowledgeBase({ ...activeCourse, ...formState });
        }
        setHasChanges(false);
        setView('list');
    } catch (error) {
        showStatusMessage(error instanceof Error ? error.message : 'Ocurrió un error al guardar.', 'error');
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleDelete = async () => {
    if(activeCourse?.id) {
        try {
            await deleteKnowledgeBase(activeCourse.id);
            setActiveCourse(null);
            setFormState({});
            setShowDeleteModal(false);
            setView('list');
        } catch(error) {
            setShowDeleteModal(false);
            showStatusMessage(error instanceof Error ? error.message : 'Error al eliminar.', 'error');
        }
    }
  };

  const embedCode = `<!-- INICIO: CÓDIGO DE INSERCIÓN DEL CHATBOT UAD (Interacción Selectiva) -->
<div id="uad-chatbot-container"></div>
<script>
  (function() {
    // Reemplaza 'URL_DEL_CHATBOT' con la URL real de tu aplicación de chatbot.
    const chatbotUrl = 'URL_DEL_CHATBOT';
    const container = document.getElementById('uad-chatbot-container');

    // Prevenir la doble inicialización si el script se carga varias veces.
    if (container.querySelector('#uad-chatbot-iframe')) {
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'uad-chatbot-iframe';
    iframe.title = 'Asistente Virtual UAD';
    iframe.src = chatbotUrl;
    
    const styles = {
      position: 'fixed',
      bottom: '0',
      right: '0',
      width: '400px',
      height: '600px',
      border: 'none',
      background: 'transparent',
      zIndex: '9999',
      pointerEvents: 'none' /* CRÍTICO: Hace que el iframe sea "click-through" */
    };
    Object.assign(iframe.style, styles);
    
    container.appendChild(iframe);
  })();
</script>
<!-- FIN: CÓDIGO DE INSERCIÓN DEL CHATBOT UAD -->`;


  const handleCopyCode = () => {
    navigator.clipboard.writeText(embedCode.trim());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100]">
        <PasswordModal onSuccess={() => setIsAuthenticated(true)} onClose={onClose} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
      <div className="bg-gray-50 rounded-2xl shadow-2xl w-[400px] h-[600px] flex flex-col overflow-hidden animate-[scale-up_0.3s_ease-out]">
        
        {view === 'list' ? (
          <div className="flex flex-col h-full p-4">
            <button onClick={handleNewCourse} className="flex items-center justify-center w-full bg-blue-500 text-white font-semibold py-2 rounded-lg hover:bg-blue-600 transition mb-3 text-sm">
              <PlusIcon className="w-4 h-4 mr-2" />
              Nuevo Curso
            </button>
            <div className="flex-grow overflow-y-auto pr-2">
              <ul className="space-y-1">
                {knowledgeBases.map(kb => (
                  <li key={kb.id}>
                    <button
                      onClick={() => selectCourse(kb)}
                      className="w-full text-left p-2 rounded-md transition text-sm font-medium text-gray-600 hover:bg-gray-100"
                    >
                      {kb.course}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-200">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Código de Inserción</label>
              <textarea
                readOnly
                className="w-full text-[10px] p-1.5 border bg-gray-100 border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 resize-none h-20"
                value={embedCode.trim()}
              />
              <button
                onClick={handleCopyCode}
                className={`flex items-center justify-center w-full mt-2 font-semibold py-1.5 px-3 rounded-lg transition text-sm ${isCopied ? 'bg-green-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-800'}`}
              >
                <CopyIcon className="w-4 h-4 mr-2" />
                {isCopied ? '¡Copiado!' : 'Copiar Código'}
              </button>
            </div>
            
            <button onClick={onClose} className="flex items-center justify-center w-full bg-gray-200 text-gray-700 font-semibold py-2 rounded-lg hover:bg-gray-300 transition mt-3 text-sm">
              <ExitIcon className="w-4 h-4 mr-2" />
              Salir del Panel
            </button>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Editor Header */}
            <div className="flex-shrink-0 flex items-center p-3 border-b border-gray-200 bg-white/60">
                <button onClick={handleBackToList} className="p-1.5 rounded-full hover:bg-gray-200 transition-colors mr-2">
                    <ArrowLeftIcon className="w-5 h-5 text-gray-600"/>
                </button>
                <h2 className="text-base font-bold text-gray-800 truncate">{isCreating ? "Creando Nuevo Curso" : formState.course}</h2>
            </div>
            
            {/* Editor Body */}
            <div className="flex-grow p-4 overflow-y-auto">
              {isCreating && (
                 <div className="mb-3">
                     <label htmlFor="course" className="block text-xs font-medium text-gray-700 mb-1">Nombre del Curso</label>
                     <input type="text" name="course" id="course" value={formState.course || ''} onChange={handleInputChange} className="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500" />
                 </div>
              )}
             
             <div className="mb-3">
                <label htmlFor="content" className="block text-xs font-medium text-gray-700 mb-1">Base de Conocimiento (Texto)</label>
                <textarea name="content" id="content" rows={6} value={formState.content || ''} onChange={handleInputChange} className="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"></textarea>
             </div>
             <div className="mb-3">
                <label htmlFor="docUpload" className="inline-flex items-center bg-white text-gray-700 font-semibold py-1.5 px-3 rounded-lg border border-gray-300 hover:bg-gray-100 cursor-pointer transition text-xs">
                  <UploadIcon className="w-4 h-4 mr-2"/>
                  {isProcessingDoc ? 'Procesando...' : 'Subir Doc'}
                </label>
                <input type="file" id="docUpload" className="hidden" onChange={handleDocUpload} accept=".pdf,.docx,.txt,.md" disabled={isProcessingDoc}/>
                {isProcessingDoc && <Spinner className="inline-block ml-2 h-4 w-4 border-blue-500" />}
             </div>
             
             <div className="mb-3">
                <label htmlFor="links" className="block text-xs font-medium text-gray-700 mb-1">Links de Contexto (uno por línea)</label>
                <textarea name="links" id="links" rows={2} value={formState.links || ''} onChange={handleInputChange} className="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"></textarea>
             </div>

             <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">Imagen de Contexto</label>
                {formState.image_base64 ? (
                  <div className="relative group w-32 h-24">
                    <img src={`data:${formState.image_type};base64,${formState.image_base64}`} alt="Preview" className="w-full h-full object-cover rounded-md border border-gray-300"/>
                    <button onClick={removeImage} className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"><CloseIcon className="w-3 h-3"/></button>
                  </div>
                ) : (
                  <div className="w-32 h-24 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-500">
                    <ImagePreviewIcon className="w-8 h-8 mb-1"/>
                    <label htmlFor="imageUpload" className="text-blue-600 hover:underline cursor-pointer text-xs font-semibold">Subir Imagen</label>
                    <input type="file" id="imageUpload" className="hidden" onChange={handleImageUpload} accept="image/png, image/jpeg, image/webp, image/gif"/>
                  </div>
                )}
             </div>
            </div>

            {/* Editor Footer */}
            <div className="flex-shrink-0 flex justify-between items-center p-3 border-t">
              <div>
                {!isCreating && activeCourse && (
                  <button onClick={() => setShowDeleteModal(true)} className="flex items-center bg-red-500 text-white font-semibold py-1.5 px-3 rounded-lg hover:bg-red-600 transition text-xs">
                    <TrashIcon className="w-4 h-4 mr-1.5" />
                    Eliminar
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-3">
                {statusMessage && (
                  <span
                    key={Date.now()}
                    className={`text-xs font-semibold animate-[scale-up_0.3s_ease-out] ${statusMessage.type === 'error' ? 'text-red-500' : 'text-green-600'}`}
                  >
                    {statusMessage.text}
                  </span>
                )}
                <button 
                  onClick={handleSaveChanges} 
                  disabled={!hasChanges || isSaving}
                  className="flex items-center bg-blue-500 text-white font-semibold py-1.5 px-3 rounded-lg hover:bg-blue-600 transition disabled:bg-blue-300 disabled:cursor-not-allowed text-xs"
                >
                  {isSaving ? <Spinner className="w-4 h-4 mr-2" /> : <SaveIcon className="w-4 h-4 mr-2" />}
                  {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
      {showDeleteModal && activeCourse && (
        <DeleteConfirmationModal
          courseName={activeCourse.course}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
};

export default AdminPanel;
