import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://puhxlfitwbvmzlbnzrhr.supabase.co';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1aHhsZml0d2J2bXpsYm56cmhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxMjEzMDYsImV4cCI6MjEwMzY5NzMwNn0.PQFuIrpIvBnm7kGQ5EhZKrEq1YbQBQ-5Qc4biqPOn-g';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
