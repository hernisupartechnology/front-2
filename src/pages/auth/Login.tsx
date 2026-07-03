import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { authService } from '@/services/api/auth';

const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

/**
 * Página de inicio de sesión — diseño premium con animaciones y validación Zod.
 */
export default function Login() {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const mutation = useMutation({
    mutationFn: authService.login,
    onSuccess: () => {
      toast.success('¡Bienvenido de vuelta!');
      // La redirección la maneja App.tsx via el PrivateRoute/PublicRoute
    },
    onError: (error: { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }) => {
      const message = error.response?.data?.message;
      const errors422 = error.response?.data?.errors;

      if (errors422?.email) {
        setError('email', { message: errors422.email[0] });
      } else if (errors422?.password) {
        setError('password', { message: errors422.password[0] });
      } else {
        toast.error(message ?? 'No se pudo iniciar sesión. Intenta de nuevo.');
      }
    },
  });

  const onSubmit = (values: LoginFormValues) => mutation.mutate(values);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #F1F8E9 0%, #E8F5E9 50%, #C8E6C9 100%)' }}
    >
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white font-bold text-2xl mb-4"
            style={{ background: 'var(--color-primary)', boxShadow: '0 8px 24px rgba(27,94,32,.3)' }}
          >
            UV
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#1B5E20', fontFamily: 'var(--font-display)' }}>
            Bienvenido a UparVital
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Ingresa a tu cuenta para continuar</p>
        </div>

        {/* Formulario */}
        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Correo electrónico
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                className={`input ${errors.email ? 'input--error' : ''}`}
                placeholder="tu@correo.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-1 text-xs" style={{ color: '#C62828' }}>{errors.email.message}</p>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Contraseña
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium hover:underline"
                  style={{ color: 'var(--color-primary)' }}
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`input pr-11 ${errors.password ? 'input--error' : ''}`}
                  placeholder="Tu contraseña"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs" style={{ color: '#C62828' }}>{errors.password.message}</p>
              )}
            </div>

            {/* Botón de login */}
            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn btn--primary w-full text-base font-semibold gap-2 py-3"
              style={{ borderRadius: '10px' }}
            >
              {mutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Ingresando...
                </span>
              ) : (
                <>
                  <LogIn size={18} />
                  Iniciar sesión
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="font-medium hover:underline" style={{ color: 'var(--color-primary)' }}>
              Regístrate gratis
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © 2026 UparVital · UparTechnology
        </p>
      </div>
    </div>
  );
}
