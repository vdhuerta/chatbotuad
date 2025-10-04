import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { KnowledgeBase, Toast, ToastType } from '../types';
import { processDocumentContent } from '../services/geminiService';
import { supabase } from '../lib/supabaseClient';

interface KnowledgeBaseContextType {
  knowledgeBases: KnowledgeBase[];
  loading: boolean;
  error: string | null;
  selectedCourseNames: string[];
  setSelectedCourseNames: React.Dispatch<React.SetStateAction<string[]>>;
  addKnowledgeBase: (kb: Omit<KnowledgeBase, 'id'>) => Promise<void>;
  updateKnowledgeBase: (kb: KnowledgeBase) => Promise<void>;
  deleteKnowledgeBase: (id: number) => Promise<void>;
  uploadAndProcessDocument: (file: File) => Promise<string>;
  addToast: (message: string, type?: ToastType) => void;
  toasts: Toast[];
  removeToast: (id: number) => void;
}

export const KnowledgeBaseContext = createContext<KnowledgeBaseContextType | undefined>(undefined);

export const KnowledgeBaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourseNames, setSelectedCourseNames] = useState<string[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);
  
  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const fetchKnowledgeBases = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('knowledge_bases').select('*').order('id', { ascending: true });
    if (error) {
      setError('Failed to fetch knowledge bases.');
      addToast('Error al cargar la base de conocimientos', 'error');
      console.error('Supabase fetch error:', error);
    } else {
      setKnowledgeBases(data || []);
      setError(null);
    }
    setLoading(false);
  }, [addToast]);

  useEffect(() => {
    fetchKnowledgeBases();

    const channel = supabase
      .channel('knowledge_bases_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'knowledge_bases' },
        (payload) => {
          console.log('Real-time change received!', payload);
          fetchKnowledgeBases();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchKnowledgeBases]);

  const addKnowledgeBase = async (kb: Omit<KnowledgeBase, 'id'>) => {
    const { error } = await supabase.from('knowledge_bases').insert(kb);
    if (error) {
      addToast('Error al crear el curso.', 'error');
      console.error('Supabase insert error:', error);
    } else {
      addToast('Curso creado exitosamente.', 'success');
    }
  };

  const updateKnowledgeBase = async (kb: KnowledgeBase) => {
    const { id, ...updateData } = kb;
    const { error } = await supabase.from('knowledge_bases').update(updateData).eq('id', id);
     if (error) {
      addToast('Error al guardar los cambios.', 'error');
      console.error('Supabase update error:', error);
    } else {
      addToast('Cambios guardados exitosamente.', 'success');
    }
  };

  const deleteKnowledgeBase = async (id: number) => {
    const { error } = await supabase.from('knowledge_bases').delete().eq('id', id);
    if (error) {
      addToast('Error al eliminar el curso.', 'error');
      console.error('Supabase delete error:', error);
    } else {
      addToast('Curso eliminado exitosamente.', 'success');
    }
  };

  const uploadAndProcessDocument = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64 = (reader.result as string).split(',')[1];
            try {
                const markdown = await processDocumentContent(base64, file.type);
                if (markdown.startsWith('ERROR:')) {
                    const errorMessage = markdown.replace('ERROR: ', '');
                    addToast(errorMessage, 'error');
                    reject(new Error(errorMessage));
                } else {
                    addToast('Documento procesado con éxito.', 'success');
                    resolve(markdown);
                }
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error desconocido.';
                addToast(`Fallo el procesamiento del documento: ${errorMessage}`, 'error');
                reject(e);
            }
        };
        reader.onerror = (error) => {
            addToast('Error al leer el archivo.', 'error');
            reject(error);
        };
    });
  };

  return (
    <KnowledgeBaseContext.Provider
      value={{
        knowledgeBases,
        loading,
        error,
        selectedCourseNames,
        setSelectedCourseNames,
        addKnowledgeBase,
        updateKnowledgeBase,
        deleteKnowledgeBase,
        uploadAndProcessDocument,
        addToast,
        toasts,
        removeToast,
      }}
    >
      {children}
    </KnowledgeBaseContext.Provider>
  );
};