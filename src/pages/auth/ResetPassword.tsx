import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { authService } from '@/services/api/auth';

const resetSchema = z.object({
  email:                 z.string().email('Correo electrónico inválido'),
  password:              z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  password_confirmation: z.string(),
}).refine((d) => d.password === d.password_confirmation, {
  path: ['password_confirmation'],
  message: 'Las contraseñas no coinciden',
});

type ResetFormValues = z.infer<typeof resetSchema>;

/**
 * Página de restablecimiento de contraseña — recibe el token por la URL
 * (enviado en el enlace del correo) y el email por query param.
 */
export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: searchParams.get('email') ?? '' },
  });

  const mutation = useMutation({
    mutationFn: (values: ResetFormValues) =>
      authService.resetPassword({ ...values, token: token ?? '' }),
    onSuccess: (data) => {
      toast.success(data.message ?? '¡Contraseña restablecida!');
      navigate('/login');
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? 'El enlace no es válido o ya expiró.');
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
            Restablecer contraseña
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Crea una nueva contraseña para tu cuenta</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4" noValidate>
            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Correo electrónico
              </label>
              <input
                id="reset-email"
                type="email"
                className={`input ${errors.email ? 'input--error' : ''}`}
                placeholder="tu@correo.com"
                {...register('email')}
              />
              {errors.email && <p className="mt-1 text-xs" style={{ color: '#C62828' }}>{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="reset-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  id="reset-password"
                  type={showPassword ? 'text' : 'password'}
                  className={`input pr-11 ${errors.password ? 'input--error' : ''}`}
                  placeholder="Mínimo 8 caracteres"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs" style={{ color: '#C62828' }}>{errors.password.message}</p>}
            </div>

            <div>
              <label htmlFor="reset-confirm" className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirmar contraseña
              </label>
              <input
                id="reset-confirm"
                type={showPassword ? 'text' : 'password'}
                className={`input ${errors.password_confirmation ? 'input--error' : ''}`}
                placeholder="Repite tu contraseña"
                {...register('password_confirmation')}
              />
              {errors.password_confirmation && (
                <p className="mt-1 text-xs" style={{ color: '#C62828' }}>{errors.password_confirmation.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn btn--primary w-full text-base font-semibold gap-2 py-3 mt-2"
              style={{ borderRadius: '10px' }}
            >
              {mutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Restableciendo...
                </span>
              ) : (
                <>
                  <KeyRound size={18} />
                  Restablecer contraseña
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            <Link to="/login" className="font-medium hover:underline" style={{ color: 'var(--color-primary)' }}>
              Volver a iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
