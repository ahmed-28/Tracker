import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, signIn, signUp, signOut, getCurrentUser } from '../services/supabase';
import { checkIfMigrationNeeded } from '../services/migrationService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  needsMigration: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
  clearError: () => void;
  completeMigration: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);
  const completeMigration = () => setNeedsMigration(false);

  const handleSignUp = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const result = await signUp(email, password);
      // User is automatically signed in after signup (no email confirmation)
      if (result.user && result.session) {
        setUser(result.user);
        setSession(result.session);
      }
    } catch (err) {
      const error = err as AuthError;
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const { user, session } = await signIn(email, password);
      setUser(user);
      setSession(session);
    } catch (err) {
      const error = err as AuthError;
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setError(null);
      setLoading(true);
      await signOut();
      setUser(null);
      setSession(null);
    } catch (err) {
      const error = err as AuthError;
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is already logged in
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          setError(error.message);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError('Failed to initialize authentication');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setUser(session?.user ?? null);
          // Check if migration is needed when user signs in
          if (session?.user) {
            const migrationNeeded = checkIfMigrationNeeded();
            setNeedsMigration(migrationNeeded);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setNeedsMigration(false);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    user,
    session,
    loading,
    needsMigration,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signOut: handleSignOut,
    error,
    clearError,
    completeMigration,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};