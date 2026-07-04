import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

// Layouts
import AppLayout from '@/components/layout/AppLayout';

// Páginas públicas
import Landing from '@/pages/Landing';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';

// Páginas privadas
import Dashboard from '@/pages/Dashboard';
import Onboarding from '@/pages/Onboarding';
import MemberHistory from '@/pages/member/MemberHistory';
import Doctors from '@/pages/Doctors';
import Reports from '@/pages/Reports';
import Notifications from '@/pages/Notifications';
import Settings from '@/pages/Settings';

/**
 * Guarda de ruta privada — redirige al login si no hay sesión.
 */
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => !!s.token && !!s.user);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

/**
 * Guarda de ruta pública — redirige al dashboard si ya hay sesión activa.
 */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => !!s.token && !!s.user);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

/**
 * Exige que el usuario autenticado ya pertenezca a un hogar.
 * Si no tiene household_id (primer uso), lo envía al Onboarding.
 */
function RequireHousehold({ children }: { children: React.ReactNode }) {
  const householdId = useAuthStore((s) => s.user?.household_id);
  return householdId ? <>{children}</> : <Navigate to="/onboarding" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* ── Rutas públicas ─────────────────────────────────── */}
      <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/reset-password/:token" element={<PublicRoute><ResetPassword /></PublicRoute>} />

      {/* ── Onboarding (primer uso — sin hogar) ───────────── */}
      <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />

      {/* ── Rutas privadas con layout ──────────────────────── */}
      <Route element={<PrivateRoute><RequireHousehold><AppLayout /></RequireHousehold></PrivateRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/member/:userId/history" element={<MemberHistory />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Redirigir rutas desconocidas */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
