import { useNavigate } from 'react-router-dom';
import { logout } from '../services/authService';
import { useTheme } from '../context/ThemeContext';

export default function NotAuthorized() {
  const navigate = useNavigate();
  const { theme, loginBgColor } = useTheme();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: loginBgColor }}>
      <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl p-8 w-full max-w-md mx-4 ${theme === 'dark' ? 'border border-gray-700' : 'border border-gray-300'}`}>
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            Acceso No Autorizado
          </h1>
          <p className={`mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Tu cuenta no tiene permiso para acceder a esta aplicación.
            Por favor, contacta al administrador para solicitar acceso.
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2 px-4 rounded font-medium btn-header-primary"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}

