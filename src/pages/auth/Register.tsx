import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { authService } from '@/services/api/auth';

const registerSchema = z.object({
  name:                  z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email:                 z.string().email('Correo electrónico inválido'),
  password:              z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  password_confirmation: z.string(),
}).refine((d) => d.password === d.password_confirmation, {
  path: ['password_confirmation'],
  message: 'Las contraseñas no coinciden',
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors }, setError } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const mutation = useMutation({
    mutationFn: authService.register,
    onSuccess: () => toast.success('¡Cuenta creada exitosamente! Bienvenido a UparVital.'),
    onError: (error: { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }) => {
      const errors422 = error.response?.data?.errors;
      if (errors422?.email) setError('email', { message: errors422.email[0] });
      else toast.error(error.response?.data?.message ?? 'No se pudo crear la cuenta.');
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
            Crea tu cuenta
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Comienza a gestionar la salud de tu familia</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4" noValidate>

            <div>
              <label htmlFor="reg-name" className="block text-sm font-medium text-gray-700 mb-1.5">Nombre completo</label>
              <input id="reg-name" type="text" className={`input ${errors.name ? 'input--error' : ''}`} placeholder="Tu nombre" {...register('name')} />
              {errors.name && <p className="mt-1 text-xs" style={{ color: '#C62828' }}>{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1.5">Correo electrónico</label>
              <input id="reg-email" type="email" className={`input ${errors.email ? 'input--error' : ''}`} placeholder="tu@correo.com" {...register('email')} />
              {errors.email && <p className="mt-1 text-xs" style={{ color: '#C62828' }}>{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
              <div className="relative">
                <input id="reg-password" type={showPassword ? 'text' : 'password'} className={`input pr-11 ${errors.password ? 'input--error' : ''}`} placeholder="Mínimo 8 caracteres" {...register('password')} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs" style={{ color: '#C62828' }}>{errors.password.message}</p>}
            </div>

            <div>
              <label htmlFor="reg-confirm" className="block text-sm font-medium text-gray-700 mb-1.5">Confirmar contraseña</label>
              <input id="reg-confirm" type={showPassword ? 'text' : 'password'} className={`input ${errors.password_confirmation ? 'input--error' : ''}`} placeholder="Repite tu contraseña" {...register('password_confirmation')} />
              {errors.password_confirmation && <p className="mt-1 text-xs" style={{ color: '#C62828' }}>{errors.password_confirmation.message}</p>}
            </div>

            <button type="submit" disabled={mutation.isPending} className="btn btn--primary w-full text-base font-semibold gap-2 py-3 mt-2" style={{ borderRadius: '10px' }}>
              {mutation.isPending ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creando cuenta...</span> : <><UserPlus size={18} />Crear cuenta</>}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-medium hover:underline" style={{ color: 'var(--color-primary)' }}>Iniciar sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
