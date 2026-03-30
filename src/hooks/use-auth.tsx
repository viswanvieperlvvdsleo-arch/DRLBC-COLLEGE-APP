"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Role = "student" | "teacher" | null;

interface AuthContextType {
  role: Role;
  setRole: (role: Role) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRoleState] = useState<Role>(() => {
    try {
      const storedRole = localStorage.getItem('userRole') as Role;
      return storedRole ?? null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    try {
      if (newRole) {
        localStorage.setItem('userRole', newRole);
      } else {
        localStorage.removeItem('userRole');
      }
    } catch (error) {
       console.error("Could not access localStorage", error);
    }
  };
  
  const value = { role, setRole, isLoading };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
