import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  LogOut, Users, Bell, Stethoscope, HeartPulse, Download,
  AlertTriangle, Smartphone, UserPlus, UserRoundPlus, Crown, Trash2, Pencil,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/api/auth';
import { householdService } from '@/services/api/household';
import { pushSubscriptionService } from '@/services/api/pushSubscriptions';
import api from '@/lib/axios';
import NewManagedMemberModal from '@/components/modals/NewManagedMemberModal';
import type { User } from '@/types';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export default function Settings() {
  const navigate = useNavigate();
  const { user, household, isOwner, setUser } = useAuthStore();

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
      toast.success('Sesión cerrada correctamente.');
    } catch {
      toast.error('No se pudo cerrar la sesión.');
    }
  };

  return (
    <div className="animate-fade-in space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>
          Configuración
        </h1>
        <button onClick={handleLogout} className="btn btn--ghost text-sm gap-1.5 text-[var(--color-alert-red)]">
          <LogOut size={15} /> Cerrar sesión
        </button>
      </div>

      <ProfileSection user={user} onUpdated={setUser} />
      {household && <HouseholdSection householdId={household.id ?? user?.household_id ?? 0} isOwner={isOwner()} currentUserId={user?.id} />}
      <VitalSignRangeSection />
      <PushNotificationsSection />
      <DoctorsLinkSection />
      <ExportSection />
      <DangerZoneSection isOwner={isOwner()} />
    </div>
  );
}

// ── Perfil médico ──────────────────────────────────────────────────────

function ProfileSection({ user, onUpdated }: { user: User | null; onUpdated: (u: User) => void }) {
  const { register, handleSubmit, reset } = useForm<Partial<User>>({ values: user ?? undefined });

  const mutation = useMutation({
    mutationFn: (v: Partial<User>) => authService.updateProfile(v),
    onSuccess: (updated) => {
      toast.success('Perfil actualizado correctamente.');
      onUpdated(updated);
      reset(updated);
    },
    onError: () => toast.error('No se pudo actualizar el perfil.'),
  });

  return (
    <section className="card p-5">
      <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">Perfil médico</h2>
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Nombre</label>
            <input className="input" {...register('name')} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Teléfono</label>
            <input className="input" {...register('phone')} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Fecha de nacimiento</label>
            <input type="date" className="input" {...register('birthdate')} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Género</label>
            <select className="input" {...register('gender')}>
              <option value="">Selecciona...</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Tipo de sangre</label>
            <select className="input" {...register('blood_type')}>
              <option value="">Selecciona...</option>
              {BLOOD_TYPES.map((bt) => <option key={bt} value={bt}>{bt}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">EPS</label>
            <input className="input" {...register('eps')} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">IPS preferida</label>
            <input className="input" {...register('ips_preferida')} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Número de afiliado</label>
            <input className="input" {...register('numero_afiliado')} />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
          <input type="checkbox" {...register('track_vital_signs')} />
          Quiero registrar mis signos vitales periódicamente
        </label>

        <button type="submit" disabled={mutation.isPending} className="btn btn--primary py-2.5 px-5">
          {mutation.isPending ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </section>
  );
}

// ── Hogar ──────────────────────────────────────────────────────────────

function HouseholdSection({ householdId, isOwner, currentUserId }: { householdId: number; isOwner: boolean; currentUserId?: number }) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'viewer'>('member');
  const [managedModal, setManagedModal] = useState<{ open: boolean; member?: User }>({ open: false });
  const queryClient = useQueryClient();

  const { data: household } = useQuery({ queryKey: ['household', 'current'], queryFn: householdService.current });

  const inviteMutation = useMutation({
    mutationFn: () => householdService.invite(inviteEmail, inviteRole),
    onSuccess: (inv) => {
      toast.success(`Invitación creada. Código: ${inv.token}`);
      setInviteEmail('');
    },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message ?? 'No se pudo invitar.'),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: 'member' | 'viewer' }) => householdService.updateRole(householdId, userId, role),
    onSuccess: () => {
      toast.success('Rol actualizado.');
      queryClient.invalidateQueries({ queryKey: ['household'] });
    },
    onError: () => toast.error('No se pudo cambiar el rol.'),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: number) => householdService.removeMember(householdId, userId),
    onSuccess: () => {
      toast.success('Miembro eliminado del hogar.');
      queryClient.invalidateQueries({ queryKey: ['household'] });
    },
    onError: () => toast.error('No se pudo eliminar al miembro.'),
  });

  return (
    <section className="card p-5">
      <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-1.5">
        <Users size={16} style={{ color: 'var(--color-primary)' }} /> Hogar — {household?.name}
      </h2>
      <p className="text-xs text-gray-400 mb-4">Código para invitar: compártelo con quien quieras agregar a tu hogar.</p>

      <div className="space-y-2 mb-4">
        {household?.members?.map((m) => (
          <div key={m.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[var(--color-primary-100)]/30">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: 'var(--color-primary)' }}>
                {m.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{m.name}</p>
                <p className="text-xs text-gray-400">{m.is_managed ? 'Perfil gestionado — sin cuenta propia' : m.email}</p>
              </div>
              {m.role === 'owner' && <Crown size={13} className="text-[var(--color-alert-yellow)] flex-shrink-0" />}
            </div>

            {isOwner && m.id !== currentUserId && m.role !== 'owner' && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {m.is_managed ? (
                  <button
                    onClick={() => setManagedModal({ open: true, member: m })}
                    className="btn btn--ghost p-1.5 rounded-full"
                  >
                    <Pencil size={13} />
                  </button>
                ) : (
                  <select
                    defaultValue={m.role}
                    onChange={(e) => roleMutation.mutate({ userId: m.id, role: e.target.value as 'member' | 'viewer' })}
                    className="input py-1 text-xs w-24"
                    style={{ minHeight: 'auto' }}
                  >
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                )}
                <button
                  onClick={() => confirm(`¿Eliminar a ${m.name} del hogar?`) && removeMutation.mutate(m.id)}
                  className="btn btn--ghost p-1.5 rounded-full text-[var(--color-alert-red)]"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {isOwner && (
        <div className="space-y-3 pt-3 border-t border-[rgba(27,94,32,.08)]">
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1.5">
              Familiar sin correo propio (niños, adultos mayores) — tú administras su información.
            </p>
            <button onClick={() => setManagedModal({ open: true })} className="btn btn--secondary gap-1.5 text-sm">
              <UserRoundPlus size={15} /> Agregar familiar
            </button>
          </div>

          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Invitar por correo (esa persona usará su propia cuenta)</label>
              <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} type="email" className="input" placeholder="correo@ejemplo.com" />
            </div>
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as 'member' | 'viewer')} className="input w-28">
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>
            <button
              onClick={() => inviteEmail && inviteMutation.mutate()}
              disabled={inviteMutation.isPending || !inviteEmail}
              className="btn btn--primary gap-1.5 py-2.5"
            >
              <UserPlus size={15} /> Invitar
            </button>
          </div>
        </div>
      )}

      {managedModal.open && (
        <NewManagedMemberModal
          householdId={householdId}
          supervisors={household?.members?.filter((m) => m.role !== 'viewer') ?? []}
          member={managedModal.member}
          onClose={() => setManagedModal({ open: false })}
        />
      )}
    </section>
  );
}

// ── Rangos de signos vitales ─────────────────────────────────────────────

interface RangeForm {
  systolic_min: number; systolic_max: number; diastolic_min: number; diastolic_max: number;
  glucose_min: number; glucose_max: number; oxygen_min: number;
}

function VitalSignRangeSection() {
  const { register, handleSubmit, reset } = useForm<RangeForm>();

  const { data } = useQuery({
    queryKey: ['profile', 'vital-sign-range'],
    queryFn: async () => (await api.get<{ range: RangeForm }>('/auth/profile/vital-sign-range')).data.range,
  });

  useEffect(() => { if (data) reset(data); }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (v: RangeForm) => api.put('/auth/profile/vital-sign-range', v),
    onSuccess: () => toast.success('Rangos actualizados correctamente.'),
    onError: () => toast.error('No se pudo actualizar.'),
  });

  return (
    <section className="card p-5">
      <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-1.5">
        <HeartPulse size={16} style={{ color: 'var(--color-primary)' }} /> Rangos de signos vitales
      </h2>
      <p className="text-xs text-gray-400 mb-4">Personaliza tus rangos normales si tienes una condición especial.</p>

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <NumField label="Sistólica mín." name="systolic_min" register={register} />
        <NumField label="Sistólica máx." name="systolic_max" register={register} />
        <NumField label="Diastólica mín." name="diastolic_min" register={register} />
        <NumField label="Diastólica máx." name="diastolic_max" register={register} />
        <NumField label="Glucosa mín." name="glucose_min" register={register} />
        <NumField label="Glucosa máx." name="glucose_max" register={register} />
        <NumField label="Saturación O2 mín." name="oxygen_min" register={register} />
        <div className="col-span-full">
          <button type="submit" disabled={mutation.isPending} className="btn btn--primary py-2.5 px-5">
            {mutation.isPending ? 'Guardando...' : 'Guardar rangos'}
          </button>
        </div>
      </form>
    </section>
  );
}

function NumField({ label, name, register }: { label: string; name: keyof RangeForm; register: ReturnType<typeof useForm<RangeForm>>['register'] }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      <input type="number" className="input" {...register(name, { valueAsNumber: true })} />
    </div>
  );
}

// ── Notificaciones push ──────────────────────────────────────────────────

function PushNotificationsSection() {
  const [subscribed, setSubscribed] = useState<boolean | null>(null);

  const { data: devices, refetch } = useQuery({
    queryKey: ['push-subscriptions'],
    queryFn: () => pushSubscriptionService.listDevices(),
  });

  useEffect(() => {
    pushSubscriptionService.isSubscribed().then(setSubscribed);
  }, []);

  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (subscribed) {
        await pushSubscriptionService.unsubscribe();
        return false;
      }
      await pushSubscriptionService.subscribe();
      return true;
    },
    onSuccess: (nowSubscribed) => {
      setSubscribed(nowSubscribed);
      toast.success(nowSubscribed ? '¡Notificaciones push activadas!' : 'Notificaciones push desactivadas.');
      refetch();
    },
    onError: (e: Error) => toast.error(e.message || 'No se pudo cambiar el estado de las notificaciones.'),
  });

  return (
    <section className="card p-5">
      <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-1.5">
        <Bell size={16} style={{ color: 'var(--color-primary)' }} /> Recordatorios de toma (Push)
      </h2>
      <p className="text-xs text-gray-400 mb-4">Recibe recordatorios de tus medicamentos aunque tengas la app cerrada.</p>

      <button
        onClick={() => toggleMutation.mutate()}
        disabled={toggleMutation.isPending || !pushSubscriptionService.isSupported()}
        className={`btn ${subscribed ? 'btn--danger' : 'btn--primary'} py-2.5 px-5`}
      >
        {toggleMutation.isPending ? 'Procesando...' : subscribed ? 'Desactivar en este dispositivo' : 'Activar en este dispositivo'}
      </button>
      {!pushSubscriptionService.isSupported() && (
        <p className="text-xs text-gray-400 mt-2">Tu navegador no soporta notificaciones push.</p>
      )}

      {devices && devices.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[rgba(27,94,32,.08)] space-y-2">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Dispositivos con notificaciones activas</p>
          {devices.map((d) => (
            <div key={d.id} className="flex items-center gap-2 text-xs text-gray-500">
              <Smartphone size={13} />
              {d.device_label ?? 'Dispositivo'}
              {d.last_used_at && <span className="text-gray-400">· último uso {new Date(d.last_used_at).toLocaleDateString('es-CO')}</span>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ── Enlace a médicos ─────────────────────────────────────────────────────

function DoctorsLinkSection() {
  return (
    <section className="card p-5 flex items-center justify-between">
      <div>
        <h2 className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
          <Stethoscope size={16} style={{ color: 'var(--color-primary)' }} /> Catálogo de médicos
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">Gestiona los médicos del hogar.</p>
      </div>
      <Link to="/doctors" className="btn btn--secondary text-sm py-2 px-4">Ver médicos</Link>
    </section>
  );
}

// ── Exportación ───────────────────────────────────────────────────────────

function ExportSection() {
  const exportMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.get('/auth/profile/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `uparvital-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    },
    onSuccess: () => toast.success('Datos exportados correctamente.'),
    onError: () => toast.error('No se pudo exportar la información.'),
  });

  return (
    <section className="card p-5 flex items-center justify-between">
      <div>
        <h2 className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
          <Download size={16} style={{ color: 'var(--color-primary)' }} /> Exportar mis datos
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">Descarga tu historial médico completo en formato JSON.</p>
      </div>
      <button onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending} className="btn btn--secondary text-sm py-2 px-4">
        {exportMutation.isPending ? 'Exportando...' : 'Exportar JSON'}
      </button>
    </section>
  );
}

// ── Zona peligrosa ────────────────────────────────────────────────────────

function DangerZoneSection({ isOwner }: { isOwner: boolean }) {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirming, setConfirming] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => api.delete('/auth/account', { data: { password } }),
    onSuccess: async () => {
      toast.success('Tu cuenta fue eliminada.');
      useAuthStore.getState().logout();
      navigate('/login');
    },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message ?? 'No se pudo eliminar la cuenta.'),
  });

  return (
    <section className="card p-5 border-2" style={{ borderColor: 'var(--color-alert-red)' }}>
      <h2 className="font-semibold flex items-center gap-1.5" style={{ color: 'var(--color-alert-red)' }}>
        <AlertTriangle size={16} /> Zona peligrosa
      </h2>
      <p className="text-xs text-gray-500 mt-1 mb-3">
        Eliminar tu cuenta borra permanentemente tu perfil y no se puede deshacer.
        {isOwner && ' Debes transferir la propiedad del hogar antes si hay otros miembros.'}
      </p>

      {!confirming ? (
        <button onClick={() => setConfirming(true)} className="btn btn--danger text-sm py-2 px-4">Eliminar mi cuenta</button>
      ) : (
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Confirma tu contraseña"
            className="input flex-1 min-w-[180px]"
          />
          <button
            onClick={() => deleteMutation.mutate()}
            disabled={!password || deleteMutation.isPending}
            className="btn btn--danger text-sm py-2 px-4"
          >
            {deleteMutation.isPending ? 'Eliminando...' : 'Confirmar eliminación'}
          </button>
          <button onClick={() => setConfirming(false)} className="btn btn--ghost text-sm py-2 px-4">Cancelar</button>
        </div>
      )}
    </section>
  );
}
