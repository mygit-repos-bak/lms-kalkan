import { useState, useEffect, createContext, useContext } from 'react';
import { User as AppUser } from '../types/database';

interface AuthContextType {
  user: AppUser | null;
  session: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<{ error?: string }>;
}

// Mock authentication for demo purposes
const DEMO_CREDENTIALS = {
  email: 'admin_super@example.com',
  password: 'admin1234'
};

const DEMO_USER: AppUser = {
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  name: 'Super Admin',
  email: 'admin_super@example.com',
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

let currentUser: AppUser | null = null;

export function useAuth(): AuthContextType {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (from sessionStorage)
    const savedUser = sessionStorage.getItem('legalflow_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        
        // Validate user ID is a proper UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        
        if (parsedUser.id && uuidRegex.test(parsedUser.id)) {
          setUser(parsedUser);
          currentUser = parsedUser;
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
    setLoading(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
        setUser(DEMO_USER);
        currentUser = DEMO_USER;
        sessionStorage.setItem('legalflow_user', JSON.stringify(DEMO_USER));
        return {};
      } else {
        return { error: 'Invalid email or password' };
      }
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setUser(null);
    currentUser = null;
    sessionStorage.removeItem('legalflow_user');
  };

  const updatePassword = async (newPassword: string): Promise<{ error?: string }> => {
    // Mock password update
    return {};
  };

  return {
    user,
    session: user ? { user } : null,
    loading,
    signIn,
    signOut,
    updatePassword
  };
}

// Export current user for use in other parts of the app
export const getCurrentUser = () => currentUser;