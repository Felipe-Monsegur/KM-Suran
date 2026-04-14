import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { logout } from '../services/authService';
import ProfileModal from './ProfileModal';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme, headerColor, headerTitle } = useTheme();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const navItems = [
    { path: '/', label: 'Inicio', icon: '🏠' },
    { path: '/balance', label: 'Balance', icon: '💰' },
    { path: '/datos', label: 'Datos', icon: '🗂️' },
  ];

  const actionItems = [
    { path: '/viaje', label: 'Viaje', icon: '🚗', classes: 'bg-rose-500 hover:bg-rose-600 text-white' },
    { path: '/nafta', label: 'Nafta', icon: '⛽', classes: 'bg-emerald-500 hover:bg-emerald-600 text-white' },
  ];

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <header className="text-white shadow-lg" style={{ backgroundColor: headerColor }}>
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
              <span className="text-2xl sm:text-3xl" aria-hidden>
                🚗
              </span>
              {headerTitle.trim() || 'KM Suran'}
            </h1>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={toggleTheme}
                className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg flex items-center gap-1.5 text-xs sm:text-sm transition-colors ${
                  theme === 'dark'
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              >
                {theme === 'dark' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path fill="none" stroke="currentColor" strokeDasharray="64" strokeDashoffset="64" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M12 3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21C15.53 21 18.59 18.96 20.06 16C20.06 16 14 17.5 11 13C8 8.5 12 3 12 3Z">
                      <animate fill="freeze" attributeName="stroke-dashoffset" dur="0.6s" values="64;0" />
                    </path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2">
                      <path strokeDasharray="34" strokeDashoffset="34" d="M12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7">
                        <animate fill="freeze" attributeName="stroke-dashoffset" dur="0.4s" values="34;0" />
                      </path>
                      <g strokeDasharray="2" strokeDashoffset="2">
                        <path d="M0 0">
                          <animate fill="freeze" attributeName="d" begin="0.5s" dur="0.2s" values="M12 19v1M19 12h1M12 5v-1M5 12h-1;M12 21v1M21 12h1M12 3v-1M3 12h-1" />
                          <animate fill="freeze" attributeName="stroke-dashoffset" begin="0.5s" dur="0.2s" values="2;0" />
                        </path>
                        <path d="M0 0">
                          <animate fill="freeze" attributeName="d" begin="0.7s" dur="0.2s" values="M17 17l0.5 0.5M17 7l0.5 -0.5M7 7l-0.5 -0.5M7 17l-0.5 0.5;M18.5 18.5l0.5 0.5M18.5 5.5l0.5 -0.5M5.5 5.5l-0.5 -0.5M5.5 18.5l-0.5 0.5" />
                          <animate fill="freeze" attributeName="stroke-dashoffset" begin="0.7s" dur="0.2s" values="2;0" />
                        </path>
                      </g>
                    </g>
                  </svg>
                )}
                <span className="hidden sm:inline">{theme === 'dark' ? 'Oscuro' : 'Claro'}</span>
              </button>
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-1.5 text-white"
                title="Mi perfil"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-xs sm:text-sm hidden sm:inline font-medium">{user?.email}</span>
              </button>
              <button
                onClick={handleLogout}
                className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-xs sm:text-sm text-white font-medium"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav
        className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-md sticky top-0 z-10`}
        style={{ borderBottom: `2px solid ${headerColor}` }}
      >
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex flex-col gap-2 py-2 sm:py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm ${
                    location.pathname === item.path
                      ? `${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-black'} font-semibold`
                      : `${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-black hover:bg-gray-100'}`
                  }`}
                >
                  <span className="mr-1 sm:mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap gap-1 sm:gap-2 sm:justify-end">
              {actionItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium ${
                    location.pathname === item.path
                      ? `${item.classes} ring-2 ring-white/70`
                      : `${item.classes} opacity-90`
                  }`}
                >
                  <span className="mr-1.5">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">{children}</main>

      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </div>
  );
}
