import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';
import { environment, validateEnvironment, log } from '../config/environment';

// Validate environment configuration
const validation = validateEnvironment();
if (!validation.valid) {
  const errors = validation.errors.join(', ');
  log.error('Supabase configuration errors:', errors);
  throw new Error(`Supabase configuration errors: ${errors}`);
}

const supabaseUrl = environment.supabase.url;
const supabaseAnonKey = environment.supabase.anonKey;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Auth helper functions
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: undefined // Disable email confirmation
    }
  });
  if (error) throw error;
  return data;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Real-time subscription helper
export const subscribeToTable = (
  table: string,
  callback: (payload: any) => void,
  filter?: string
) => {
  const subscription = supabase
    .channel(`public:${table}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table,
        filter: filter
      },
      callback
    )
    .subscribe();

  return subscription;
};

export default supabase;