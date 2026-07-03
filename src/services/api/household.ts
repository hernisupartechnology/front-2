import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import type { Household, User, HouseholdInvitation } from '@/types';

/**
 * Servicio de hogares — creación, unión, miembros e invitaciones.
 */
export const householdService = {
  /** Crear un nuevo hogar (el usuario autenticado se convierte en owner). */
  async create(name: string): Promise<Household> {
    const { data } = await api.post<{ household: Household }>('/households', { name });
    useAuthStore.getState().setHousehold(data.household);
    return data.household;
  },

  /** Obtener el hogar actual del usuario autenticado. */
  async current(): Promise<Household | null> {
    const { data } = await api.get<{ household: Household | null }>('/households/current');
    useAuthStore.getState().setHousehold(data.household);
    return data.household;
  },

  /** Actualizar nombre o avatar del hogar. */
  async update(id: number, payload: Partial<Pick<Household, 'name'>>): Promise<Household> {
    const { data } = await api.put<{ household: Household }>(`/households/${id}`, payload);
    useAuthStore.getState().setHousehold(data.household);
    return data.household;
  },

  /** Listar los miembros del hogar. */
  async members(id: number): Promise<User[]> {
    const { data } = await api.get<{ members: User[] }>(`/households/${id}/members`);
    return data.members;
  },

  /** Invitar a un nuevo miembro por correo electrónico. */
  async invite(email: string, roleAssigned: 'member' | 'viewer'): Promise<HouseholdInvitation> {
    const { data } = await api.post<{ invitation: HouseholdInvitation }>('/households/invite', {
      email,
      role_assigned: roleAssigned,
    });
    return data.invitation;
  },

  /** Unirse a un hogar con el código de 8 caracteres. */
  async join(token: string): Promise<Household> {
    const { data } = await api.post<{ household: Household }>('/households/join', { token });
    useAuthStore.getState().setHousehold(data.household);
    return data.household;
  },

  /** Cambiar el rol de un miembro (member / viewer). */
  async updateRole(householdId: number, userId: number, role: 'member' | 'viewer'): Promise<User> {
    const { data } = await api.put<{ member: User }>(
      `/households/${householdId}/members/${userId}/role`,
      { role }
    );
    return data.member;
  },

  /** Asignar el supervisor (padre/tutor) de un miembro menor de edad. */
  async updateSupervisor(householdId: number, userId: number, supervisedBy: number | null): Promise<User> {
    const { data } = await api.put<{ member: User }>(
      `/households/${householdId}/members/${userId}/supervisor`,
      { supervised_by: supervisedBy }
    );
    return data.member;
  },

  /** Eliminar un miembro del hogar. */
  async removeMember(householdId: number, userId: number): Promise<void> {
    await api.delete(`/households/${householdId}/members/${userId}`);
  },

  /** Transferir la propiedad del hogar a otro miembro. */
  async transferOwnership(householdId: number, newOwnerId: number): Promise<void> {
    await api.post(`/households/${householdId}/transfer-ownership`, { new_owner_id: newOwnerId });
  },
};
