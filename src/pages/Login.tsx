import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, signUp } from '../services/authService';
import { useTheme } from '../context/ThemeContext';

export default function Login() {
  const navigate = useNavigate();
  const { theme, toggleTheme, loginBgColor, headerColor } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Error al autenticar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: loginBgColor }}>
      <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-md mx-4 ${theme === 'dark' ? 'border border-gray-700' : 'border border-gray-300'}`}>
        <div className="flex items-center justify-between mb-6">
          <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>🚗 KM Suran</h1>
          <button
            onClick={toggleTheme}
            className={`px-4 py-2 rounded-full flex items-center space-x-2 text-xs transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-800 text-white hover:bg-gray-700' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {theme === 'dark' ? (
              <svg key={theme} xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" className="w-4 h-4">
                <path fill="none" stroke="currentColor" strokeDasharray="64" strokeDashoffset="64" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M12 3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21C15.53 21 18.59 18.96 20.06 16C20.06 16 14 17.5 11 13C8 8.5 12 3 12 3Z">
                  <animate fill="freeze" attributeName="stroke-dashoffset" dur="0.6s" values="64;0" />
                </path>
              </svg>
            ) : (
              <svg key={theme} xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" className="w-4 h-4">
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
            <span>{theme === 'dark' ? 'Modo oscuro' : 'Modo claro'}</span>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className={`w-full border rounded px-3 py-2 focus:outline-none focus-ring-header ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-800'}`}
              required />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className={`w-full border rounded px-3 py-2 focus:outline-none focus-ring-header ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-800'}`}
              required minLength={6} />
          </div>

          {error && (
            <div className={`px-4 py-3 rounded border ${theme === 'dark' ? 'bg-red-900/50 border-red-500 text-red-200' : 'bg-red-100 border-red-400 text-red-700'}`}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full py-2 rounded btn-header-primary font-medium">
            {loading ? 'Cargando...' : isLogin ? 'Iniciar Sesión' : 'Registrarse'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button type="button" onClick={() => setIsLogin(!isLogin)}
            className="transition-opacity hover:opacity-80 underline-offset-2 hover:underline font-medium text-sm"
            style={{ color: headerColor }}>
            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  );
}
