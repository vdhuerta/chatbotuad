import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bntrznjvepzmndgykajl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJudHJ6bmp2ZXB6bW5kZ3lrYWpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMzczNTgsImV4cCI6MjA3NDgxMzM1OH0.Zm_WMtb6HUtGbESxQ5yGiIt0SCAGktwG8qPM3iUr_Qc';

// Note: For write operations (insert, update, delete) to work with the anon key,
// you must have Row Level Security (RLS) policies in place on your Supabase table
// that allow these actions for anonymous users.

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
