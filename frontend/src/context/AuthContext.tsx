import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  role: 'admin' | 'camp';
  activeCampId: string | null;
  setUser: (user: User | null) => void;
  switchRole: (role: 'admin' | 'camp', campId?: string) => void;
  logout: () => void;
}

const DEFAULT_USERS: Record<string, User> = {
  admin: {
    id: 'u-admin-1',
    email: 'admin@districthealth.gov.in',
    name: 'Dr. Priya Sharma (District Health Officer)',
    role: 'admin',
    camp_id: null,
  },
  'camp-1': {
    id: 'u-camp-1',
    email: 'coord1@reliefcamp.org',
    name: 'Rajesh Kumar (Camp Alpha - Govt High School)',
    role: 'camp',
    camp_id: 'camp-1',
  },
  'camp-2': {
    id: 'u-camp-2',
    email: 'coord2@reliefcamp.org',
    name: 'Sunita Devi (Camp Beta - Community Hall)',
    role: 'camp',
    camp_id: 'camp-2',
  },
  'camp-3': {
    id: 'u-camp-3',
    email: 'coord3@reliefcamp.org',
    name: 'Amit Patel (Camp Gamma - Sports Complex)',
    role: 'camp',
    camp_id: 'camp-3',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem('diseasewatch_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return DEFAULT_USERS['admin'];
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('diseasewatch_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('diseasewatch_user');
    }
  }, [user]);

  const switchRole = (newRole: 'admin' | 'camp', campId?: string) => {
    if (newRole === 'admin') {
      setUser(DEFAULT_USERS['admin']);
    } else {
      const selectedCampId = campId || 'camp-1';
      setUser(DEFAULT_USERS[selectedCampId] || {
        id: `u-${selectedCampId}`,
        email: `coordinator@${selectedCampId}.org`,
        name: `Camp Coordinator (${selectedCampId})`,
        role: 'camp',
        camp_id: selectedCampId,
      });
    }
  };

  const logout = () => {
    setUser(DEFAULT_USERS['admin']);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : 'admin',
        activeCampId: user ? user.camp_id : null,
        setUser,
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
