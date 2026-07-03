import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Mail, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '@/services/api/auth';

const forgotSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

/**
 * Página de recuperación de contraseña — solicita el enlace de restablecimiento.
 */
export default function ForgotPassword() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
  });

  const mutation = useMutation({
    mutationFn: (values: ForgotFormValues) => authService.forgotPassword(values.email),
    onSuccess: (data) => toast.success(data.message ?? 'Te enviamos un enlace a tu correo.'),
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? 'No pudimos procesar tu solicitud. Intenta de nuevo.');
    },
  });

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #F1F8E9 0%, #E8F5E9 50%, #C8E6C9 100%)' }}
    >
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white font-bold text-2xl mb-4"
            style={{ background: 'var(--color-primary)', boxShadow: '0 8px 24px rgba(27,94,32,.3)' }}
          >
            UV
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#1B5E20', fontFamily: 'var(--font-display)' }}>
            ¿Olvidaste tu contraseña?
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Ingresa tu correo y te enviaremos un enlace para restablecerla
          </p>
        </div>

        <div className="card p-8">
          {mutation.isSuccess ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                ✅ Revisa tu correo <strong>{mutation.variables?.email}</strong> — te enviamos las instrucciones
                para restablecer tu contraseña.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-5" noValidate>
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Correo electrónico
                </label>
                <input
                  id="forgot-email"
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

              <button
                type="submit"
                disabled={mutation.isPending}
                className="btn btn--primary w-full text-base font-semibold gap-2 py-3"
                style={{ borderRadius: '10px' }}
              >
                {mutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando...
                  </span>
                ) : (
                  <>
                    <Mail size={18} />
                    Enviar enlace de recuperación
                  </>
                )}
              </button>
            </form>
          )}

          <Link
            to="/login"
            className="flex items-center justify-center gap-1.5 text-sm font-medium mt-6 hover:underline"
            style={{ color: 'var(--color-primary)' }}
          >
            <ArrowLeft size={14} />
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
