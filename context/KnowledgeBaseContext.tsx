import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
// FIX: Import Toast and ToastType for the notification system.
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
  // FIX: Add properties for toast notifications.
  toasts: Toast[];
  removeToast: (id: number) => void;
}

export const KnowledgeBaseContext = createContext<KnowledgeBaseContextType | undefined>(undefined);

export const KnowledgeBaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourseNames, setSelectedCourseNames] = useState<string[]>([]);
  // FIX: Add state for toast notifications.
  const [toasts, setToasts] = useState<Toast[]>([]);

  const fetchKnowledgeBases = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('knowledge_bases').select('*').order('id', { ascending: true });
    if (error) {
      setError('Failed to fetch knowledge bases.');
      console.error('Supabase fetch error:', error);
    } else {
      setKnowledgeBases(data || []);
      setError(null);
    }
    setLoading(false);
  }, []);

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
      console.error('Supabase insert error:', error);
      throw new Error('Error al crear el curso.');
    }
  };

  const updateKnowledgeBase = async (kb: KnowledgeBase) => {
    const { id, ...updateData } = kb;
    const { error } = await supabase.from('knowledge_bases').update(updateData).eq('id', id);
     if (error) {
      console.error('Supabase update error:', error);
      throw new Error('Error al guardar los cambios.');
    }
  };

  const deleteKnowledgeBase = async (id: number) => {
    const { error } = await supabase.from('knowledge_bases').delete().eq('id', id);
    if (error) {
      console.error('Supabase delete error:', error);
      throw new Error('Error al eliminar el curso.');
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
                    reject(new Error(errorMessage));
                } else {
                    resolve(markdown);
                }
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error desconocido.';
                reject(new Error(`Fallo el procesamiento del documento: ${errorMessage}`));
            }
        };
        reader.onerror = (error) => {
            reject(new Error('Error al leer el archivo.'));
        };
    });
  };

  // FIX: Add function to remove toast notifications.
  const removeToast = useCallback((id: number) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

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
        // FIX: Provide toast state and functions through context.
        toasts,
        removeToast,
      }}
    >
      {children}
    </KnowledgeBaseContext.Provider>
  );
};
