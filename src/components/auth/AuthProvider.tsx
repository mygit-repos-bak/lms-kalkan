import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as AppUser } from '../../types/database';

interface AuthContextType {
  user: AppUser | null;
  session: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo credentials
const DEMO_CREDENTIALS = {
  email: 'admin@kalkan.bartonapps.com',
  password: 'admin1234'
};

const DEMO_USER: AppUser = {
  id: 'd36ba832-bcf7-481a-98c4-a9bfe71335c5',
  name: 'Admin',
  email: 'admin@kalkan.bartonapps.com',
  role: 'admin',
  active: true,
  notification_prefs: {
    email: true,
    in_app: true,
    mentions: true,
    assignments: true
  },
  force_password_change: false,
  timezone: 'America/New_York',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear any cached session with old email
    const savedUser = sessionStorage.getItem('legalflow_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);

        // If email is from the old domain, clear it
        if (parsedUser.email && parsedUser.email.includes('@lf.bartonapps.com')) {
          console.log('Clearing old session with email:', parsedUser.email);
          sessionStorage.removeItem('legalflow_user');
          setLoading(false);
          return;
        }

        // Validate user ID is a proper UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

        if (parsedUser.id && uuidRegex.test(parsedUser.id)) {
          setUser(parsedUser);
        } else {
          console.warn('Invalid user ID found in session storage, clearing:', parsedUser.id);
          sessionStorage.removeItem('legalflow_user');
        }
      } catch (error) {
        console.error('Error parsing saved user:', error);
        sessionStorage.removeItem('legalflow_user');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    console.log('Sign in attempt:', { email, passwordLength: password.length });

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Support both old and new email addresses
    const validEmails = ['admin@lf.bartonapps.com', 'admin@kalkan.bartonapps.com'];

    console.log('Valid emails:', validEmails);
    console.log('Email match:', validEmails.includes(email));
    console.log('Password match:', password === DEMO_CREDENTIALS.password);
    console.log('Expected password:', DEMO_CREDENTIALS.password);

    if (validEmails.includes(email) && password === DEMO_CREDENTIALS.password) {
      setUser(DEMO_USER);
      sessionStorage.setItem('legalflow_user', JSON.stringify(DEMO_USER));
      return {};
    } else {
      return { error: 'Invalid email or password' };
    }
  };

  const signOut = async (): Promise<void> => {
    setUser(null);
    sessionStorage.removeItem('legalflow_user');
  };

  const updatePassword = async (newPassword: string): Promise<{ error?: string }> => {
    return {};
  };

  const value = {
    user,
    session: user ? { user } : null,
    loading,
    signIn,
    signOut,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}