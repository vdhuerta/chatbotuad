

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import type { KnowledgeBase } from '../types';
import {
    fetchKnowledgeBases,
    saveKnowledgeBase,
    deleteKnowledgeBase,
    supabase,
    fromRecordToKnowledgeBase
} from '../services/supabaseClient';
import type { KnowledgeBaseRecord } from '../services/supabaseClient';

interface KnowledgeBaseContextType {
    knowledgeBases: KnowledgeBase[];
    // State for Admin Panel
    adminEditingCourse: string | null;
    // State for Chatbot
    selectedCourseNames: string[];
    selectedKnowledgeBases: KnowledgeBase[];
    isLoading: boolean;
    error: string | null;
    actions: {
        saveCourse: (kb: KnowledgeBase) => Promise<void>;
        deleteCourse: (courseId: number, courseName: string) => Promise<void>;
        setAdminEditingCourse: (courseName: string | null) => void;
        toggleChatCourseSelection: (courseName: string) => void;
    };
}

const KnowledgeBaseContext = createContext<KnowledgeBaseContextType | undefined>(undefined);

export const KnowledgeBaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
    const [adminEditingCourse, setAdminEditingCourse] = useState<string | null>(null);
    const [selectedCourseNames, setSelectedCourseNames] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // FIX: Create a ref to hold the latest value of adminEditingCourse to avoid stale state in the subscription callback.
    const adminEditingCourseRef = useRef(adminEditingCourse);
    useEffect(() => {
        adminEditingCourseRef.current = adminEditingCourse;
    }, [adminEditingCourse]);

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                const initialKbs = await fetchKnowledgeBases();
                const sortedKbs = initialKbs.sort((a, b) => a.course.localeCompare(b.course));
                setKnowledgeBases(sortedKbs);

                // By default, select the first course for the chat if available
                if (sortedKbs.length > 0) {
                    setSelectedCourseNames([sortedKbs[0].course]);
                }
                
                setError(null);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                console.error(err);
                setError(`No se pudo cargar la base de conocimientos: ${errorMessage}`);
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialData();

        const channel = supabase
            .channel('knowledge_bases_changes')
            .on<KnowledgeBaseRecord>(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'knowledge_bases' },
                (payload) => {
                    console.log('Realtime change received!', payload);
                    const { eventType, new: newRecord, old: oldRecord } = payload;
                    
                    setKnowledgeBases(currentKbs => {
                        let newKbs = [...currentKbs];
                        const newKb = eventType !== 'DELETE' ? fromRecordToKnowledgeBase(newRecord as KnowledgeBaseRecord) : null;
                        const oldId = (oldRecord as { id?: number })?.id;

                        if (eventType === 'INSERT' && newKb) {
                            // Only add if it doesn't exist by ID to prevent duplicates from optimistic updates
                            if (!currentKbs.some(kb => kb.id === newKb.id)) {
                               newKbs.push(newKb);
                            }
                        } else if (eventType === 'UPDATE' && newKb) {
                            newKbs = currentKbs.map(kb => 
                                kb.id === newKb.id ? newKb : kb
                            );
                        } else if (eventType === 'DELETE' && oldId) {
                            const courseName = currentKbs.find(kb => kb.id === oldId)?.course;
                            newKbs = currentKbs.filter(kb => kb.id !== oldId);
                            if (courseName) {
                                setSelectedCourseNames(prev => prev.filter(name => name !== courseName));
                                // FIX: Use the ref to get the latest value of the editing course.
                                // This ensures the form resets even if the delete event comes from another client.
                                if (adminEditingCourseRef.current === courseName) {
                                    setAdminEditingCourse(null);
                                }
                            }
                        }
                        return newKbs.sort((a, b) => a.course.localeCompare(b.course));
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);
    
    const saveCourse = async (kb: KnowledgeBase) => {
        try {
            // Espera a que la base de datos devuelva el registro guardado, que ahora incluye el ID.
            const savedKb = await saveKnowledgeBase(kb);
            
            // Actualiza el estado local con el objeto real de la base de datos.
            setKnowledgeBases(currentKbs => {
                const index = currentKbs.findIndex(k => k.id === savedKb.id || k.course === savedKb.course);
                let newKbs;
                
                if (index > -1) {
                    // Actualiza el curso existente en el array
                    newKbs = [...currentKbs];
                    newKbs[index] = savedKb;
                } else {
                    // Añade el curso nuevo si no existía
                    newKbs = [...currentKbs, savedKb];
                }
                return newKbs.sort((a, b) => a.course.localeCompare(b.course));
            });

            // Después de guardar, lo establece como el curso en edición.
            setAdminEditingCourse(savedKb.course);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(`Error al guardar: ${errorMessage}`);
            throw err;
        }
    };
    
    const deleteCourse = async (courseId: number, courseName: string) => {
        try {
            // FIX: Remove optimistic/manual update. The state will now be updated
            // exclusively by the realtime subscription listener. This avoids race
            // conditions and ensures the UI always reflects the database state.
            await deleteKnowledgeBase(courseId);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(`Error al eliminar: ${errorMessage}`);
            throw err; // Re-lanza el error para que sea capturado por el componente de UI
        }
    };

    const toggleChatCourseSelection = (courseName: string) => {
        setSelectedCourseNames(prev => 
            prev.includes(courseName)
                ? prev.filter(name => name !== courseName)
                : [...prev, courseName]
        );
    };

    const selectedKnowledgeBases = knowledgeBases.filter(kb => selectedCourseNames.includes(kb.course));

    const value: KnowledgeBaseContextType = {
        knowledgeBases,
        adminEditingCourse,
        selectedCourseNames,
        selectedKnowledgeBases,
        isLoading,
        error,
        actions: {
            saveCourse,
            deleteCourse,
            setAdminEditingCourse,
            toggleChatCourseSelection,
        }
    };

    return (
        <KnowledgeBaseContext.Provider value={value}>
            {children}
        </KnowledgeBaseContext.Provider>
    );
};

export const useKnowledgeBase = (): KnowledgeBaseContextType => {
    const context = useContext(KnowledgeBaseContext);
    if (context === undefined) {
        throw new Error('useKnowledgeBase must be used within a KnowledgeBaseProvider');
    }
    return context;
};