
import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { ImageFile, KnowledgeBase } from '../types';
import { SaveIcon } from './icons/SaveIcon';
import { ImageIcon } from './icons/ImageIcon';
import { DocumentIcon } from './icons/DocumentIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PlusIcon } from './icons/PlusIcon';
import { processDocumentWithGemini } from '../services/geminiService';
import { useKnowledgeBase } from '../context/KnowledgeBaseContext';

interface CourseAdminProps {
    onExit: () => void;
}

export const CourseAdmin: React.FC<CourseAdminProps> = ({ onExit }) => {
    const { knowledgeBases, adminEditingCourse, actions } = useKnowledgeBase();
    
    const [formState, setFormState] = useState<Omit<KnowledgeBase, 'course' | 'id'>>({ content: '', image: null, links: '' });
    const [newCourseName, setNewCourseName] = useState('');
    const [initialState, setInitialState] = useState<KnowledgeBase | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [isProcessingDocument, setIsProcessingDocument] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // State for the new delete confirmation modal
    const [deletingCourse, setDeletingCourse] = useState<KnowledgeBase | null>(null);
    const [deletePassword, setDeletePassword] = useState('');
    const [deletePasswordError, setDeletePasswordError] = useState('');
    const ADMIN_PASSWORD = '070670'; // Use the same password as login for consistency

    const documentInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const isNewCourse = adminEditingCourse === null;

    useEffect(() => {
        if (isNewCourse) {
            setFormState({ content: '', image: null, links: '' });
            setNewCourseName('');
            setInitialState(null);
        } else {
            const kb = knowledgeBases.find(k => k.course === adminEditingCourse);
            if (kb) {
                setFormState({ content: kb.content, image: kb.image, links: kb.links });
                setNewCourseName('');
                setInitialState(kb);
            }
        }
    }, [adminEditingCourse, knowledgeBases, isNewCourse]);

    useEffect(() => {
        if (isNewCourse) {
            setIsDirty(newCourseName.trim() !== '' || formState.content.trim() !== '' || formState.links.trim() !== '' || formState.image !== null);
        } else if (initialState) {
            const contentChanged = formState.content !== initialState.content;
            const linksChanged = formState.links !== initialState.links;
            const imageChanged = JSON.stringify(formState.image) !== JSON.stringify(initialState.image);
            setIsDirty(contentChanged || linksChanged || imageChanged);
        } else {
            setIsDirty(false);
        }
    }, [formState, newCourseName, isNewCourse, initialState]);


    const handleFormChange = (field: keyof Omit<KnowledgeBase, 'course' | 'id'>, value: any) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = (e.target?.result as string).split(',')[1];
                handleFormChange('image', { name: file.name, type: file.type, base64 });
            };
            reader.readAsDataURL(file);
        }
        event.target.value = '';
    };
    
    const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsProcessingDocument(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const base64 = (e.target?.result as string).split(',')[1];
                const fileData: ImageFile = { name: file.name, type: file.type, base64 };
                const markdownContent = await processDocumentWithGemini(fileData);
                handleFormChange('content', formState.content ? `${formState.content}\n\n---\n\n${markdownContent}` : markdownContent);
                alert(`Contenido de "${file.name}" añadido.`);
            } catch (error) {
                alert(`Error al procesar el documento: ${error instanceof Error ? error.message : String(error)}`);
            } finally {
                setIsProcessingDocument(false);
            }
        };
        reader.readAsDataURL(file);
        event.target.value = '';
    };

    const handleSave = useCallback(async () => {
        const courseName = isNewCourse ? newCourseName.trim() : adminEditingCourse;
        if (!courseName) {
            alert("Por favor, asigna un nombre al curso.");
            return;
        }

        if (isNewCourse && knowledgeBases.some(kb => kb.course === courseName)) {
            alert(`El curso "${courseName}" ya existe.`);
            return;
        }
        
        setIsSaving(true);
        try {
            const courseToSave: KnowledgeBase = {
                id: initialState?.id,
                course: courseName,
                ...formState
            };
            await actions.saveCourse(courseToSave);
            alert('¡Curso guardado con éxito!');
        } catch (error) {
            alert(`Error al guardar: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsSaving(false);
        }
    }, [isNewCourse, newCourseName, adminEditingCourse, actions, formState, knowledgeBases, initialState]);
    
    // --- New Deletion Flow ---
    const handleInitiateDelete = (course: KnowledgeBase) => {
        setDeletingCourse(course);
        setDeletePassword('');
        setDeletePasswordError('');
    };

    const handleCancelDelete = () => {
        setDeletingCourse(null);
    };
    
    const handleConfirmDelete = useCallback(async () => {
        if (!deletingCourse) return;

        // 1. Validate password
        if (deletePassword !== ADMIN_PASSWORD) {
            setDeletePasswordError('Contraseña incorrecta.');
            return;
        }
        
        if (!deletingCourse.id) {
            alert("Error: No se puede eliminar un curso sin ID.");
            handleCancelDelete();
            return;
        }

        const courseName = deletingCourse.course;
        const courseId = deletingCourse.id;

        // 2. Close modal and set loading state
        handleCancelDelete();
        
        try {
            // 3. Call context action to interact with the database
            await actions.deleteCourse(courseId, courseName);
            // The UI will update automatically via Supabase realtime subscription
            alert(`Curso "${courseName}" eliminado.`);
        } catch (error) {
             const errorMessage = error instanceof Error ? error.message : String(error);
             console.error("Detalles completos del error al eliminar:", error);
             alert(`Error al eliminar el curso.\n\n${errorMessage}\n\nRevisa la consola (F12) para más detalles.`);
        }
    }, [actions, deletingCourse, deletePassword]);


    return (
        <>
            <div className="flex h-full bg-white overflow-hidden">
                {/* Left Sidebar: Course List */}
                <aside className="w-1/3 min-w-[150px] max-w-[200px] bg-gray-50 border-r flex flex-col">
                    <div className="p-2 border-b">
                        <button
                            onClick={() => actions.setAdminEditingCourse(null)}
                            className="w-full flex items-center justify-center gap-2 text-sm bg-blue-600 text-white font-semibold py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Nuevo Curso
                        </button>
                    </div>
                    <nav className="flex-grow overflow-y-auto">
                        <ul>
                            {knowledgeBases.map(kb => (
                                <li key={kb.id || kb.course}>
                                    <a
                                        href="#"
                                        onClick={(e) => { e.preventDefault(); actions.setAdminEditingCourse(kb.course); }}
                                        className={`block p-3 text-sm transition-colors truncate ${adminEditingCourse === kb.course ? 'bg-blue-100 text-blue-800 font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}
                                    >
                                        {kb.course}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>
                     <div className="p-2 border-t">
                        <button onClick={onExit} className="w-full text-sm py-2 px-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">
                            Salir
                        </button>
                    </div>
                </aside>

                {/* Right Panel: Course Editor */}
                <main className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto">
                     <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">
                        {isNewCourse ? 'Creando Nuevo Curso' : `Editando: ${adminEditingCourse}`}
                    </h2>

                    <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Main Content Column */}
                        <div className="md:col-span-2 flex flex-col gap-4">
                            {isNewCourse && (
                                <div>
                                    <label htmlFor="new-course-name" className="font-medium text-gray-700 mb-1 block">Nombre del Curso</label>
                                    <input type="text" id="new-course-name" value={newCourseName} onChange={e => setNewCourseName(e.target.value)} placeholder="Ej: Fundamentos de Programación" className="w-full bg-gray-100 border border-gray-200 text-gray-800 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                                </div>
                            )}
                            <div className="flex-grow flex flex-col">
                                <div className="flex justify-between items-center mb-1">
                                    <label htmlFor="content" className="font-medium text-gray-700">Base de Conocimiento (Texto)</label>
                                    <input type="file" accept=".txt,.md,.json,.doc,.docx,.pdf" ref={documentInputRef} onChange={handleDocumentUpload} className="hidden" />
                                    <button onClick={() => documentInputRef.current?.click()} disabled={isProcessingDocument} className="flex items-center gap-2 text-sm bg-gray-100 text-gray-600 py-1.5 px-3 rounded-full border border-gray-200 hover:bg-gray-200 transition-colors disabled:opacity-50">
                                        <DocumentIcon className="w-4 h-4" />
                                        <span>{isProcessingDocument ? 'Procesando...' : 'Subir Doc'}</span>
                                    </button>
                                </div>
                                <textarea id="content" value={formState.content} onChange={(e) => handleFormChange('content', e.target.value)} placeholder="Pega aquí el contenido, resúmenes, o sube un archivo..." className="w-full flex-grow bg-gray-100 border border-gray-200 text-gray-800 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[250px] text-sm" />
                            </div>
                        </div>

                        {/* Sidebar Column */}
                        <div className="md:col-span-1 flex flex-col gap-6">
                            <div>
                                <label htmlFor="links" className="mb-1 font-medium text-gray-700 block">Links de Contexto (uno por línea)</label>
                                <textarea id="links" value={formState.links} onChange={(e) => handleFormChange('links', e.target.value)} placeholder="https://ejemplo.com/recurso1" className="w-full bg-gray-100 border border-gray-200 text-gray-800 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[100px] text-sm" />
                            </div>
                            <div>
                                <label className="mb-1 font-medium text-gray-700 block">Imagen de Contexto</label>
                                <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageUpload} className="hidden" />
                                {formState.image ? (
                                    <div className="relative group aspect-video">
                                        <img src={`data:${formState.image.type};base64,${formState.image.base64}`} alt="Vista previa" className="w-full h-full rounded-lg object-cover border border-gray-200" />
                                        <button 
                                            onClick={() => handleFormChange('image', null)}
                                            className="absolute top-2 right-2 p-1.5 bg-black bg-opacity-60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-opacity-80"
                                            aria-label="Eliminar imagen"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => imageInputRef.current?.click()}
                                        className="w-full flex flex-col items-center justify-center gap-2 bg-gray-50 text-gray-500 py-8 px-4 rounded-xl border-2 border-dashed border-gray-300 hover:bg-gray-100 hover:border-blue-500 hover:text-blue-600 transition-colors"
                                    >
                                        <ImageIcon className="w-8 h-8" />
                                        <span className="text-sm font-medium">Seleccionar Imagen</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-between items-center pt-4 border-t">
                        <div>
                            {!isNewCourse && initialState && (
                                <button
                                    onClick={() => handleInitiateDelete(initialState)}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 py-2 px-5 bg-red-600 text-white font-semibold rounded-full hover:bg-red-700 transition-colors disabled:bg-red-300 disabled:cursor-not-allowed"
                                    aria-label={`Eliminar el curso ${initialState.course}`}
                                >
                                    <TrashIcon className="w-5 h-5" />
                                    <span>Eliminar Curso</span>
                                </button>
                            )}
                        </div>
                        
                         <button 
                            onClick={handleSave} 
                            disabled={!isDirty || isSaving}
                            className="flex items-center gap-2 py-2 px-5 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
                        >
                            {isSaving ? (
                                'Guardando...'
                            ) : (
                                <>
                                    <SaveIcon className="w-5 h-5"/>
                                    Guardar Cambios
                                </>
                            )}
                        </button>
                    </div>
                </main>
            </div>
            
            {/* Deletion Confirmation Modal */}
            {deletingCourse && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
                    <div className="w-full max-w-md p-6 sm:p-8 space-y-6 bg-white rounded-2xl shadow-2xl m-4">
                        <h2 className="text-xl font-bold text-center text-gray-800">Confirmar Eliminación</h2>
                        <p className="text-center text-gray-600">
                            ¿Estás seguro de que quieres eliminar el curso <br/>
                            <strong className="font-semibold text-gray-900">{deletingCourse.course}</strong>?
                        </p>
                        <p className="text-center text-sm font-semibold text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                            Esta acción es irreversible y borrará todo el contenido asociado.
                        </p>
                        
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="delete-password-input" className="sr-only">Contraseña de Administrador</label>
                                <input
                                    id="delete-password-input"
                                    type="password"
                                    value={deletePassword}
                                    onChange={(e) => {
                                        setDeletePassword(e.target.value);
                                        setDeletePasswordError('');
                                    }}
                                    onKeyPress={(e) => e.key === 'Enter' && handleConfirmDelete()}
                                    placeholder="Contraseña de Administrador"
                                    className={`w-full px-4 py-3 text-sm bg-gray-100 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                                        deletePasswordError 
                                        ? 'border-red-400 focus:ring-red-500' 
                                        : 'border-gray-200 focus:ring-blue-500'
                                    }`}
                                    autoFocus
                                />
                                {deletePasswordError && <p className="mt-2 text-xs text-red-600">{deletePasswordError}</p>}
                            </div>
                           
                            <div className="flex items-center gap-4 pt-2">
                                <button type="button" onClick={handleCancelDelete} className="w-full py-3 text-sm font-semibold text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 transition-colors">
                                    Cancelar
                                </button>
                                <button 
                                    type="button" 
                                    onClick={handleConfirmDelete}
                                    className="w-full py-3 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
                                >
                                    Eliminar Permanentemente
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};