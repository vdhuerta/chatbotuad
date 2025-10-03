
import { createClient } from '@supabase/supabase-js';
import type { KnowledgeBase, ImageFile } from '../types';

// --- ¡CONFIGURACIÓN CRÍTICA REQUERIDA! ---
// Reemplaza los siguientes valores con tus propias credenciales de Supabase.
// Puedes encontrarlas en tu panel de Supabase: Project Settings > API.
const SUPABASE_URL = 'https://bntrznjvepzmndgykajl.supabase.co'; // Pega aquí tu URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJudHJ6bmp2ZXB6bW5kZ3lrYWpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMzczNTgsImV4cCI6MjA3NDgxMzM1OH0.Zm_WMtb6HUtGbESxQ5yGiIt0SCAGktwG8qPM3iUr_Qc'; // Pega aquí tu clave anónima (anon key)
// ---------------------------------

// Diagnóstico: Advierte al desarrollador si está usando las credenciales de ejemplo.
if (SUPABASE_URL.includes('bntrznjvepzmndgykajl')) {
    console.warn(
        `%cCONFIGURACIÓN PENDIENTE:`,
        'color: orange; font-weight: bold;',
        `Parece que estás usando la URL de Supabase de ejemplo. Asegúrate de reemplazar SUPABASE_URL y SUPABASE_ANON_KEY en 'services/supabaseClient.ts' con tus propias credenciales del proyecto.`
    );
}


// Se elimina la comprobación que lanzaba un error para evitar que la aplicación se bloquee.
// Si las credenciales no son válidas, Supabase fallará de forma controlada y la UI mostrará un mensaje de error.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface KnowledgeBaseRecord {
    id: number; // ID should always be present on records from DB
    course: string;
    content: string;
    links: string;
    image_name: string | null;
    image_type: string | null;
    image_base64: string | null;
}

export const fromRecordToKnowledgeBase = (record: KnowledgeBaseRecord): KnowledgeBase => {
    let image: ImageFile | null = null;
    if (record.image_name && record.image_type && record.image_base64) {
        image = {
            name: record.image_name,
            type: record.image_type,
            base64: record.image_base64,
        };
    }
    return {
        id: record.id,
        course: record.course,
        content: record.content,
        links: record.links,
        image: image,
    };
};

// FIX: Add helper to convert KnowledgeBase to a record for Supabase.
export const fromKnowledgeBaseToRecord = (kb: KnowledgeBase): Omit<KnowledgeBaseRecord, 'id'> => {
    return {
        course: kb.course,
        content: kb.content,
        links: kb.links,
        image_name: kb.image?.name || null,
        image_type: kb.image?.type || null,
        image_base64: kb.image?.base64 || null,
    };
};

export const fetchKnowledgeBases = async (): Promise<KnowledgeBase[]> => {
    const { data, error } = await supabase
        .from('knowledge_bases')
        .select('*');

    if (error) {
        console.error('Error fetching from Supabase:', error);
        throw new Error(`No se pudo cargar la base de conocimientos. Verifica la conexión y la configuración de RLS en Supabase. Detalles: ${error.message}`);
    }

    // Filtra los registros que no tengan un nombre de curso válido para evitar "registros fantasma"
    return data
        .map(fromRecordToKnowledgeBase)
        .filter(kb => kb.course && kb.course.trim() !== '');
};

// FIX: La función ahora devuelve el registro guardado desde la base de datos,
// asegurando que el ID generado por la base de datos esté siempre disponible.
export const saveKnowledgeBase = async (kb: KnowledgeBase): Promise<KnowledgeBase> => {
    const record = fromKnowledgeBaseToRecord(kb);
    
    // .select().single() fuerza a Supabase a devolver el registro que acaba de guardar.
    const { data, error } = await supabase
        .from('knowledge_bases')
        .upsert(record, { onConflict: 'course' })
        .select()
        .single();

    if (error) {
        console.error('Error saving to Supabase:', error);
        let detailedMessage = `No se pudo guardar el curso. Causa: ${error.message}`;
        if (error.details) detailedMessage += `\n\nDetalles: ${error.details}`;
        if (error.hint) detailedMessage += `\n\nSugerencia: ${error.hint}`;
        
        if (error.message.includes('violates row-level security policy') || error.message.includes('new row violates check constraint')) {
            detailedMessage += `\n\nAcción recomendada: Ve a tu panel de Supabase > Authentication > Policies y asegúrate de tener una política que permita INSERT y UPDATE en la tabla 'knowledge_bases' para el rol 'anon_key'.`;
        }
        
        throw new Error(detailedMessage);
    }
    
    if (!data) {
        throw new Error("Supabase no devolvió el registro guardado. La operación puede haber fallado silenciosamente.");
    }

    return fromRecordToKnowledgeBase(data as KnowledgeBaseRecord);
};


// FIX: Add function to delete a knowledge base course by its primary key (ID).
export const deleteKnowledgeBase = async (courseId: number): Promise<void> => {
    const { error } = await supabase
        .from('knowledge_bases')
        .delete()
        .eq('id', courseId);
    
    if (error) {
        console.error('Error deleting from Supabase:', error);
        let detailedMessage = `No se pudo eliminar el curso.\n\nCausa: ${error.message}`;

        if (error.message.toLowerCase().includes('fetch failed')) {
            detailedMessage += `\n\nSugerencia: Esto suele ser un problema de red o de configuración de CORS. Asegúrate de que tu URL de Supabase es correcta y que has añadido 'localhost' a la configuración de CORS en tu proyecto de Supabase si estás desarrollando localmente.`;
        } else if (error.message.includes('violates row-level security policy')) {
            detailedMessage += `\n\nAcción Requerida: Ve a tu panel de Supabase > Authentication > Policies. Asegúrate de tener una política que permita la operación DELETE en la tabla 'knowledge_bases' para el rol 'anon'. La forma más simple para probar es una política con la expresión 'USING (true)'.`;
        } else {
             if (error.details) detailedMessage += `\n\nDetalles: ${error.details}`;
             if (error.hint) detailedMessage += `\n\nSugerencia: ${error.hint}`;
        }
        
        throw new Error(detailedMessage);
    }
};