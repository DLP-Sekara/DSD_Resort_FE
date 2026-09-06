import { useState, createContext, useContext, type ReactNode } from 'react';
import { getLocalStoragedata } from '../helpers/StorageHelper';

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userData, setUserData] = useState(getLocalStoragedata('userData'));

  const value = {
    userData,
    setUserData,
  };

  return <AuthContext.Provider value={value}>{children} </AuthContext.Provider>;
};

// Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
