'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

/**
 * Defines the shape of the authentication context.
 * @interface
 */
interface AuthContextType {
  /** The currently authenticated user, or null if no user is authenticated. */
  user: User | null;
  /** Indicates if the authentication state is still being loaded. */
  loading: boolean;
}

/**
 * Creates a context for authentication data.
 * @type {React.Context<AuthContextType | undefined>}
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provides authentication context to its children components.
 * It fetches the initial user session and listens for authentication state changes.
 * @param {object} props - The component props.
 * @param {ReactNode} props.children - The child components to be wrapped by the provider.
 * @returns {JSX.Element} The AuthProvider component.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
     * Fetches the initial user session from Supabase.
     * @async
     */
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    /**
     * Subscribes to authentication state changes.
     * @type {Subscription}
     */
    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    // Unsubscribe from the auth listener on component unmount
    return () => {
      authListener.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * A custom hook to access the authentication context.
 * Throws an error if used outside of an AuthProvider.
 * @returns {AuthContextType} The authentication context values (user and loading state).
 * @throws {Error} If used outside of an AuthProvider.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
