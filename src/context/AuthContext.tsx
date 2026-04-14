import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange } from '../services/authService';
import { isUserAllowed } from '../services/firebaseService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAllowed: boolean;
  checkingAccess: boolean;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true, 
  isAllowed: false,
  checkingAccess: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setUser(user);
      setLoading(false);
      
      if (user) {
        // Verificar si el usuario está en la lista blanca
        setCheckingAccess(true);
        try {
          const allowed = await isUserAllowed(user.uid, user.email || '');
          setIsAllowed(allowed);
        } catch (error) {
          console.error('Error al verificar acceso:', error);
          setIsAllowed(false);
        } finally {
          setCheckingAccess(false);
        }
      } else {
        setIsAllowed(false);
        setCheckingAccess(false);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAllowed, checkingAccess }}>
      {children}
    </AuthContext.Provider>
  );
};


