import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { saveUserTheme, getUserSettings, saveUserSettings } from '../services/firebaseService';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  headerColor: string;
  headerTitle: string;
  loginBgColor: string;
  headerColorDark: string;
  headerColorLight: string;
  displayName: string;
  updateHeaderColorDark: (color: string) => Promise<void>;
  updateHeaderColorLight: (color: string) => Promise<void>;
  updateHeaderTitle: (title: string) => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  headerColor: '#1e40af',
  headerTitle: 'KM Suran',
  loginBgColor: '#1e40af',
  headerColorDark: '#1e40af',
  headerColorLight: '#2563eb',
  updateHeaderColorDark: async () => {},
  updateHeaderColorLight: async () => {},
  updateHeaderTitle: async () => {},
  displayName: '',
  updateDisplayName: async () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();

  const getInitialTheme = (): Theme => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
    return 'dark';
  };
  
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [loading, setLoading] = useState(!!user);
  const [headerColorDark, setHeaderColorDark] = useState<string>('#1e40af');
  const [headerColorLight, setHeaderColorLight] = useState<string>('#2563eb');
  const [headerTitle, setHeaderTitle] = useState<string>('KM Suran');
  const [displayName, setDisplayName] = useState<string>('');

  const headerColor = theme === 'dark' ? headerColorDark : headerColorLight;
  const loginBgColor = theme === 'dark' ? '#1e40af' : '#2563eb';

  useEffect(() => {
    const t = headerTitle.trim();
    document.title = t || 'KM Suran';
  }, [headerTitle]);

  useEffect(() => {
    const loadTheme = async () => {
      if (user) {
        try {
          const settings = await getUserSettings(user.uid);
          if (settings) {
            if (settings.theme) {
              setTheme(settings.theme);
              localStorage.setItem('theme', settings.theme);
            } else {
              const localTheme = localStorage.getItem('theme') as Theme | null;
              if (localTheme === 'dark' || localTheme === 'light') {
                setTheme(localTheme);
                await saveUserTheme(user.uid, localTheme);
              }
            }
            if (settings.headerColorDark) setHeaderColorDark(settings.headerColorDark);
            if (settings.headerColorLight) setHeaderColorLight(settings.headerColorLight);
            if (settings.headerTitle) setHeaderTitle(settings.headerTitle);
            if (settings.displayName) {
              setDisplayName(settings.displayName);
            } else {
              setDisplayName('');
            }
          }
        } catch (error) {
          console.error('Error al cargar configuraciones:', error);
          const localTheme = localStorage.getItem('theme') as Theme | null;
          if (localTheme === 'dark' || localTheme === 'light') setTheme(localTheme);
        }
        setLoading(false);
      } else {
        setDisplayName('');
        const savedTheme = localStorage.getItem('theme') as Theme | null;
        if (savedTheme === 'dark' || savedTheme === 'light') setTheme(savedTheme);
        setLoading(false);
      }
    };
    loadTheme();
  }, [user]);
  
  const toggleTheme = async () => {
    const newTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);

    if (user) {
      try {
        await saveUserTheme(user.uid, newTheme);
        await saveUserSettings(user.uid, { theme: newTheme });
      } catch (error) {
        console.error('Error al guardar tema:', error);
      }
    }
  };

  const updateHeaderColorDark = async (color: string) => {
    if (!color || !color.startsWith('#')) return;
    setHeaderColorDark(color);
    if (user) {
      try { await saveUserSettings(user.uid, { headerColorDark: color }); }
      catch (error) { console.error('Error al guardar color:', error); }
    }
  };

  const updateHeaderColorLight = async (color: string) => {
    if (!color || !color.startsWith('#')) return;
    setHeaderColorLight(color);
    if (user) {
      try { await saveUserSettings(user.uid, { headerColorLight: color }); }
      catch (error) { console.error('Error al guardar color:', error); }
    }
  };

  const updateHeaderTitle = async (title: string) => {
    setHeaderTitle(title);
    if (user) {
      try { await saveUserSettings(user.uid, { headerTitle: title }); }
      catch (error) { console.error('Error al guardar título:', error); }
    }
  };

  const updateDisplayName = async (name: string) => {
    const trimmed = name.trim();
    setDisplayName(trimmed);
    if (user) {
      try { await saveUserSettings(user.uid, { displayName: trimmed }); }
      catch (error) { console.error('Error al guardar nombre:', error); }
    }
  };

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    } else {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--header-color', headerColor);
  }, [headerColor]);

  if (loading) return null;

  return (
    <ThemeContext.Provider value={{ 
      theme, toggleTheme, headerColor, headerTitle, loginBgColor,
      headerColorDark, headerColorLight, displayName,
      updateHeaderColorDark, updateHeaderColorLight,
      updateHeaderTitle, updateDisplayName,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
