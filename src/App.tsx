import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import NotAuthorized from './pages/NotAuthorized';
import Dashboard from './pages/Dashboard';
import RegisterTrip from './pages/RegisterTrip';
import RegisterFuel from './pages/RegisterFuel';
import Balance from './pages/Balance';
import DataManager from './pages/DataManager';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAllowed, checkingAccess } = useAuth();

  if (loading || checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-xl text-white">Cargando...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;
  if (!isAllowed) return <Navigate to="/not-authorized" />;

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/not-authorized" element={<NotAuthorized />} />
      <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/viaje" element={<ProtectedRoute><Layout><RegisterTrip /></Layout></ProtectedRoute>} />
      <Route path="/nafta" element={<ProtectedRoute><Layout><RegisterFuel /></Layout></ProtectedRoute>} />
      <Route path="/balance" element={<ProtectedRoute><Layout><Balance /></Layout></ProtectedRoute>} />
      <Route path="/datos" element={<ProtectedRoute><Layout><DataManager /></Layout></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
