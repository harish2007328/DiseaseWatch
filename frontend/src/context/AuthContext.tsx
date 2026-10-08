import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { demoLogin, roleSelect } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: 'admin' | 'camp' | null;
  activeCampId: string | null;
  isAuthenticated: boolean;
  loginWithRole: (role: 'admin' | 'camp', campId?: string, name?: string) => Promise<void>;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  switchRole: (role: 'admin' | 'camp', campId?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('diseasewatch_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null; // Start unauthenticated so user is prompted to select their role!
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('diseasewatch_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('diseasewatch_user');
    }
  }, [user]);

  const loginWithRole = async (role: 'admin' | 'camp', campId?: string, name?: string) => {
    try {
      const res = await roleSelect({ role, camp_id: campId, name });
      setUser(res.data.user);
    } catch (err) {
      // Fallback local if backend is offline
      if (role === 'admin') {
        setUser({
          id: 'u-admin-1',
          email: 'admin@districthealth.gov.in',
          name: name || 'Dr. Priya Sharma (District Health Officer)',
          role: 'admin',
          camp_id: null,
        });
      } else {
        const cId = campId || 'camp-1';
        setUser({
          id: `u-${cId}`,
          email: `coordinator@${cId}.org`,
          name: name || `Camp Coordinator (${cId})`,
          role: 'camp',
          camp_id: cId,
        });
      }
    }
  };

  const loginWithCredentials = async (email: string, password: string) => {
    const res = await demoLogin(email, password);
    setUser(res.data.user);
  };

  const switchRole = (newRole: 'admin' | 'camp', campId?: string) => {
    loginWithRole(newRole, campId);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('diseasewatch_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        activeCampId: user ? user.camp_id : null,
        isAuthenticated: !!user,
        loginWithRole,
        loginWithCredentials,
        switchRole,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
