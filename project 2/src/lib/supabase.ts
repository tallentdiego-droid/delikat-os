import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://zjlvoxihqhqwnpdrkhqr.supabase.co';
export const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqbHZveGlocWhxd25wZHJraHFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5NjU1OTgsImV4cCI6MjA5NjU0MTU5OH0.WSK-25yV5er8cH43bLk52CVPdp9G6_hmX9BTfT4c22Q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
