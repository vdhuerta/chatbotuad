import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { KnowledgeBase } from '../types';
import { useKnowledgeBase } from '../hooks/useKnowledgeBase';
import PasswordModal from './PasswordModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { PlusIcon, SaveIcon, TrashIcon, ExitIcon, UploadIcon, ImagePreviewIcon, CloseIcon, CopyIcon } from './Icons';
import Spinner from './Spinner';

interface AdminPanelProps {
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { knowledgeBases, addKnowledgeBase, updateKnowledgeBase, deleteKnowledgeBase, uploadAndProcessDocument } = useKnowledgeBase();
  
  const [activeCourse, setActiveCourse] = useState<KnowledgeBase | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formState, setFormState] = useState<Partial<KnowledgeBase>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingDoc, setIsProcessingDoc] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const selectCourse = useCallback((kb: KnowledgeBase) => {
    setActiveCourse(kb);
    setFormState(kb);
    setIsCreating(false);
    setHasChanges(false);
  }, []);

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
    setHasChanges(true);
  };
  
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
      } catch (error) {
        console.error("Doc processing failed:", error);
      } finally {
        setIsProcessingDoc(false);
      }
    }
  };
  
  const handleSaveChanges = async () => {
    if (!formState.course) return;
    setIsSaving(true);
    if (isCreating) {
      await addKnowledgeBase(formState as Omit<KnowledgeBase, 'id'>);
      handleNewCourse(); // Reset for another new course
    } else if (activeCourse) {
      await updateKnowledgeBase({ ...activeCourse, ...formState });
    }
    setIsSaving(false);
    setHasChanges(false);
  };
  
  const handleDelete = async () => {
    if(activeCourse?.id) {
        await deleteKnowledgeBase(activeCourse.id);
        setActiveCourse(null);
        setFormState({});
        setShowDeleteModal(false);
    }
  };

  useEffect(() => {
    if (knowledgeBases.length > 0 && !activeCourse && !isCreating) {
      selectCourse(knowledgeBases[0]);
    }
  }, [knowledgeBases, activeCourse, isCreating, selectCourse]);

  const embedCode = `<iframe
  src="${window.location.origin}"
  style="position: fixed; bottom: 0; right: 0; width: 450px; height: 650px; border: none; z-index: 9999;"
  title="Asistente Virtual"
></iframe>`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(embedCode);
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
      <div className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex overflow-hidden">
        {/* Left Column: Navigation */}
        <div className="w-1/3 bg-white/50 border-r border-gray-200 flex flex-col p-4">
          <button onClick={handleNewCourse} className="flex items-center justify-center w-full bg-blue-500 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-600 transition mb-4">
            <PlusIcon className="w-5 h-5 mr-2" />
            Nuevo Curso
          </button>
          <div className="flex-grow overflow-y-auto pr-2">
            <ul className="space-y-1">
              {knowledgeBases.map(kb => (
                <li key={kb.id}>
                  <button
                    onClick={() => selectCourse(kb)}
                    className={`w-full text-left p-3 rounded-md transition text-sm font-medium ${activeCourse?.id === kb.id && !isCreating ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    {kb.course}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Código de Inserción</label>
            <textarea
              readOnly
              className="w-full text-xs p-2 border bg-gray-100 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 resize-none h-28"
              value={embedCode}
            />
            <button
              onClick={handleCopyCode}
              className={`flex items-center justify-center w-full mt-2 font-semibold py-2 px-4 rounded-lg transition ${isCopied ? 'bg-green-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-800'}`}
            >
              <CopyIcon className="w-4 h-4 mr-2" />
              {isCopied ? '¡Copiado!' : 'Copiar Código'}
            </button>
          </div>
          
          <button onClick={onClose} className="flex items-center justify-center w-full bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg hover:bg-gray-300 transition mt-4">
            <ExitIcon className="w-5 h-5 mr-2" />
            Salir del Panel
          </button>
        </div>

        {/* Right Column: Editor */}
        <div className="w-2/3 flex flex-col p-6 overflow-y-auto">
          {(activeCourse || isCreating) ? (
            <>
              <div className="flex-grow">
                 {isCreating && (
                    <div className="mb-4">
                        <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Curso</label>
                        <input type="text" name="course" id="course" value={formState.course || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" />
                    </div>
                 )}
                 <h2 className="text-2xl font-bold text-gray-800 mb-4">{isCreating ? "Creando Nuevo Curso" : formState.course}</h2>
                 
                 <div className="mb-4">
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">Base de Conocimiento (Texto)</label>
                    <textarea name="content" id="content" rows={10} value={formState.content || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"></textarea>
                 </div>
                 <div className="mb-4">
                    <label htmlFor="docUpload" className="inline-flex items-center bg-white text-gray-700 font-semibold py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-100 cursor-pointer transition">
                      <UploadIcon className="w-5 h-5 mr-2"/>
                      {isProcessingDoc ? 'Procesando...' : 'Subir Doc'}
                    </label>
                    <input type="file" id="docUpload" className="hidden" onChange={handleDocUpload} accept=".pdf,.docx,.txt,.md" disabled={isProcessingDoc}/>
                    {isProcessingDoc && <Spinner className="inline-block ml-2 h-5 w-5 border-blue-500" />}
                 </div>
                 
                 <div className="mb-4">
                    <label htmlFor="links" className="block text-sm font-medium text-gray-700 mb-1">Links de Contexto (uno por línea)</label>
                    <textarea name="links" id="links" rows={3} value={formState.links || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"></textarea>
                 </div>

                 <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Imagen de Contexto</label>
                    {formState.image_base64 ? (
                      <div className="relative group w-48 h-32">
                        <img src={`data:${formState.image_type};base64,${formState.image_base64}`} alt="Preview" className="w-full h-full object-cover rounded-md border border-gray-300"/>
                        <button onClick={removeImage} className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"><CloseIcon className="w-4 h-4"/></button>
                      </div>
                    ) : (
                      <div className="w-48 h-32 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-500">
                        <ImagePreviewIcon className="w-10 h-10 mb-1"/>
                        <label htmlFor="imageUpload" className="text-blue-600 hover:underline cursor-pointer text-sm font-semibold">Subir Imagen</label>
                        <input type="file" id="imageUpload" className="hidden" onChange={handleImageUpload} accept="image/png, image/jpeg, image/webp, image/gif"/>
                      </div>
                    )}
                 </div>
              </div>
              <div className="flex-shrink-0 flex justify-between items-center pt-4 border-t">
                <div>
                  {!isCreating && (
                    <button onClick={() => setShowDeleteModal(true)} className="flex items-center bg-red-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-600 transition">
                      <TrashIcon className="w-5 h-5 mr-2" />
                      Eliminar Curso
                    </button>
                  )}
                </div>
                <button 
                  onClick={handleSaveChanges} 
                  disabled={!hasChanges || isSaving}
                  className="flex items-center bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  {isSaving ? <Spinner className="w-5 h-5 mr-2" /> : <SaveIcon className="w-5 h-5 mr-2" />}
                  {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <p>Selecciona un curso para editar o crea uno nuevo.</p>
            </div>
          )}
        </div>
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