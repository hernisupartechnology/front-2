import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Home, Users, HeartPulse, ArrowRight, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { householdService } from '@/services/api/household';
import { authService } from '@/services/api/auth';

type Step = 'choose' | 'create' | 'join' | 'profile';

const createSchema = z.object({ name: z.string().min(2, 'El nombre del hogar es obligatorio') });
const joinSchema = z.object({ token: z.string().length(8, 'El código debe tener 8 caracteres') });

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] as const;

const profileSchema = z.object({
  blood_type: z.union([z.enum(BLOOD_TYPES), z.literal('')]).optional(),
  eps: z.string().optional(),
  ips_preferida: z.string().optional(),
});

/**
 * Onboarding — primer uso de la aplicación.
 * Paso 1: crear hogar o unirse con código de invitación.
 * Paso 2 (solo owner de un hogar recién creado): perfil médico básico.
 */
export default function Onboarding() {
  const navigate = useNavigate();
  const { user, isOwner } = useAuthStore();
  const [step, setStep] = useState<Step>(user?.household_id ? 'profile' : 'choose');

  const createForm = useForm<z.infer<typeof createSchema>>({ resolver: zodResolver(createSchema) });
  const joinForm = useForm<z.infer<typeof joinSchema>>({ resolver: zodResolver(joinSchema) });
  const profileForm = useForm<z.infer<typeof profileSchema>>({ resolver: zodResolver(profileSchema) });

  const createMutation = useMutation({
    mutationFn: (v: z.infer<typeof createSchema>) => householdService.create(v.name),
    onSuccess: () => {
      toast.success('¡Hogar creado! Ahora configura tu perfil médico básico.');
      setStep('profile');
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e.response?.data?.message ?? 'No se pudo crear el hogar.'),
  });

  const joinMutation = useMutation({
    mutationFn: (v: z.infer<typeof joinSchema>) => householdService.join(v.token.toUpperCase()),
    onSuccess: () => {
      toast.success('¡Te uniste al hogar exitosamente!');
      navigate('/dashboard');
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e.response?.data?.message ?? 'Código inválido o expirado.'),
  });

  const profileMutation = useMutation({
    mutationFn: (v: z.infer<typeof profileSchema>) =>
      authService.updateProfile({ ...v, blood_type: v.blood_type || undefined }),
    onSuccess: () => {
      toast.success('¡Todo listo! Bienvenido a UparVital.');
      navigate('/dashboard');
    },
    onError: () => toast.error('No se pudo guardar tu perfil médico.'),
  });

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #F1F8E9 0%, #E8F5E9 50%, #C8E6C9 100%)' }}
    >
      <div className="w-full max-w-lg animate-fade-in">
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white font-bold text-2xl mb-4"
            style={{ background: 'var(--color-primary)', boxShadow: '0 8px 24px rgba(27,94,32,.3)' }}
          >
            UV
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#1B5E20', fontFamily: 'var(--font-display)' }}>
            ¡Hola, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Vamos a configurar tu espacio en UparVital</p>
        </div>

        <div className="card p-8">
          {step === 'choose' && (
            <div className="space-y-3">
              <button
                onClick={() => setStep('create')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-transparent hover:border-[var(--color-primary-300)] hover:bg-[var(--color-primary-100)] transition-colors text-left"
              >
                <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-primary-100)' }}>
                  <Home size={20} style={{ color: 'var(--color-primary)' }} />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">Crear un hogar nuevo</p>
                  <p className="text-xs text-gray-500 mt-0.5">Serás el propietario y podrás invitar a tu familia</p>
                </div>
                <ArrowRight size={18} className="ml-auto text-gray-300 flex-shrink-0" />
              </button>

              <button
                onClick={() => setStep('join')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-transparent hover:border-[var(--color-primary-300)] hover:bg-[var(--color-primary-100)] transition-colors text-left"
              >
                <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-primary-100)' }}>
                  <Users size={20} style={{ color: 'var(--color-primary)' }} />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">Unirme a un hogar existente</p>
                  <p className="text-xs text-gray-500 mt-0.5">Ingresa el código de 8 caracteres que te compartieron</p>
                </div>
                <ArrowRight size={18} className="ml-auto text-gray-300 flex-shrink-0" />
              </button>
            </div>
          )}

          {step === 'create' && (
            <form onSubmit={createForm.handleSubmit((v) => createMutation.mutate(v))} className="space-y-5" noValidate>
              <div>
                <label htmlFor="household-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nombre del hogar
                </label>
                <input
                  id="household-name"
                  type="text"
                  className={`input ${createForm.formState.errors.name ? 'input--error' : ''}`}
                  placeholder="Ej: Familia Mercado"
                  {...createForm.register('name')}
                />
                {createForm.formState.errors.name && (
                  <p className="mt-1 text-xs" style={{ color: '#C62828' }}>{createForm.formState.errors.name.message}</p>
                )}
              </div>
              <button type="submit" disabled={createMutation.isPending} className="btn btn--primary w-full py-3" style={{ borderRadius: '10px' }}>
                {createMutation.isPending ? 'Creando...' : 'Crear hogar'}
              </button>
              <button type="button" onClick={() => setStep('choose')} className="btn btn--ghost w-full">
                Volver
              </button>
            </form>
          )}

          {step === 'join' && (
            <form onSubmit={joinForm.handleSubmit((v) => joinMutation.mutate(v))} className="space-y-5" noValidate>
              <div>
                <label htmlFor="join-token" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Código de invitación
                </label>
                <input
                  id="join-token"
                  type="text"
                  maxLength={8}
                  className={`input uppercase tracking-widest text-center font-semibold ${joinForm.formState.errors.token ? 'input--error' : ''}`}
                  placeholder="ABCD1234"
                  {...joinForm.register('token')}
                />
                {joinForm.formState.errors.token && (
                  <p className="mt-1 text-xs" style={{ color: '#C62828' }}>{joinForm.formState.errors.token.message}</p>
                )}
              </div>
              <button type="submit" disabled={joinMutation.isPending} className="btn btn--primary w-full py-3" style={{ borderRadius: '10px' }}>
                {joinMutation.isPending ? 'Uniéndote...' : 'Unirme al hogar'}
              </button>
              <button type="button" onClick={() => setStep('choose')} className="btn btn--ghost w-full">
                Volver
              </button>
            </form>
          )}

          {step === 'profile' && (
            <form onSubmit={profileForm.handleSubmit((v) => profileMutation.mutate(v))} className="space-y-5" noValidate>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <HeartPulse size={16} style={{ color: 'var(--color-primary)' }} />
                Perfil médico básico (puedes completarlo después)
              </div>

              <div>
                <label htmlFor="blood-type" className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de sangre</label>
                <select id="blood-type" className="input" {...profileForm.register('blood_type')}>
                  <option value="">Selecciona...</option>
                  {BLOOD_TYPES.map((bt) => <option key={bt} value={bt}>{bt}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="eps" className="block text-sm font-medium text-gray-700 mb-1.5">EPS</label>
                <input id="eps" type="text" className="input" placeholder="Ej: Sura EPS" {...profileForm.register('eps')} />
              </div>

              <div>
                <label htmlFor="ips" className="block text-sm font-medium text-gray-700 mb-1.5">IPS preferida</label>
                <input id="ips" type="text" className="input" placeholder="Ej: IPS Sura Norte" {...profileForm.register('ips_preferida')} />
              </div>

              <button type="submit" disabled={profileMutation.isPending} className="btn btn--primary w-full py-3" style={{ borderRadius: '10px' }}>
                {profileMutation.isPending ? 'Guardando...' : 'Finalizar y entrar a UparVital'}
              </button>
              {!isOwner() && (
                <button type="button" onClick={() => navigate('/dashboard')} className="btn btn--ghost w-full">
                  Omitir por ahora
                </button>
              )}
            </form>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mt-6 mx-auto"
        >
          <LogOut size={14} />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
