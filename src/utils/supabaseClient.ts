import { createClient } from '@supabase/supabase-js';

// Your Supabase project configuration
const supabaseUrl = 'https://rnlrzuxhxsnrgfqjqxnr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJubHJ6dXhoeHNucmdmcWpxeG5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MTc4MTYsImV4cCI6MjA2NzQ5MzgxNn0.eTE2mt8XCjF7RuZ-T-bMP4FoQeSB4F0uX-QFCHNml98';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  }
}); 