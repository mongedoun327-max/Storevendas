import { SystemUser, UserSession } from '../types';

export const DEFAULT_USERS: SystemUser[] = [
  {
    id: 'usr-admin-01',
    name: 'Administrador Master',
    email: 'admin@masakula.co.ao',
    pin: '5424',
    role: 'admin',
    terminal: 'Terminal Master 01 - Gestão',
    active: true,
    createdAt: '2026-01-01T08:00:00Z',
    lastLogin: 'Hoje'
  },
  {
    id: 'usr-atende-01',
    name: 'Atendente 01 (Balcão)',
    email: 'atende1@masakula.co.ao',
    pin: '4561',
    role: 'atendente',
    terminal: 'Caixa 01 - Balcão Principal',
    active: true,
    createdAt: '2026-01-01T08:00:00Z',
    lastLogin: 'Nunca'
  }
];

const STORAGE_KEY = 'masakula_system_users_v2';

export function getStoredUsers(): SystemUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Assegura que admin (5424) e atende1 (4561) estão sempre presentes e corretos
        let list = [...parsed];
        const adminIndex = list.findIndex(u => u.email.toLowerCase() === 'admin@masakula.co.ao');
        if (adminIndex >= 0) {
          list[adminIndex] = { ...list[adminIndex], pin: '5424', role: 'admin' };
        } else {
          list.unshift(DEFAULT_USERS[0]);
        }

        const atende1Index = list.findIndex(u => u.email.toLowerCase() === 'atende1@masakula.co.ao');
        if (atende1Index >= 0) {
          list[atende1Index] = { ...list[atende1Index], pin: '4561', role: 'atendente' };
        } else {
          list.push(DEFAULT_USERS[1]);
        }

        return list;
      }
    }
  } catch (err) {
    console.warn('Erro ao carregar utilizadores:', err);
  }

  saveStoredUsers(DEFAULT_USERS);
  return DEFAULT_USERS;
}

export function saveStoredUsers(users: SystemUser[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.warn('Erro ao salvar utilizadores:', err);
  }
}

export function authenticateUser(email: string, pin: string): SystemUser | null {
  const users = getStoredUsers();
  const cleanEmail = email.trim().toLowerCase();
  const cleanPin = pin.trim();

  const found = users.find(u => u.email.toLowerCase() === cleanEmail && u.active);
  if (!found) return null;

  if (found.pin === cleanPin) {
    // Atualiza hora do último login
    const updated = users.map(u => 
      u.id === found.id 
        ? { ...u, lastLogin: new Date().toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' }) } 
        : u
    );
    saveStoredUsers(updated);
    return found;
  }

  return null;
}

export function createAttendant(data: {
  name: string;
  email: string;
  pin: string;
  terminal?: string;
}): { success: boolean; error?: string; user?: SystemUser } {
  const users = getStoredUsers();
  const cleanEmail = data.email.trim().toLowerCase();
  const cleanPin = data.pin.trim();

  if (!data.name.trim()) {
    return { success: false, error: 'O nome do atendente é obrigatório.' };
  }

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'O e-mail introduzido é inválido.' };
  }

  if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
    return { success: false, error: 'Já existe um operador ou atendente registado com este e-mail.' };
  }

  if (cleanPin.length < 4) {
    return { success: false, error: 'O código PIN de acesso deve conter pelo menos 4 dígitos.' };
  }

  const newUser: SystemUser = {
    id: `usr-atende-${Date.now()}`,
    name: data.name.trim(),
    email: cleanEmail,
    pin: cleanPin,
    role: 'atendente',
    terminal: data.terminal?.trim() || 'Caixa 01 - Balcão Principal',
    active: true,
    createdAt: new Date().toISOString(),
    lastLogin: 'Nunca'
  };

  const updatedUsers = [...users, newUser];
  saveStoredUsers(updatedUsers);

  return { success: true, user: newUser };
}

export function deleteAttendant(id: string): { success: boolean; error?: string } {
  const users = getStoredUsers();
  const target = users.find(u => u.id === id);

  if (!target) {
    return { success: false, error: 'Utilizador não encontrado.' };
  }

  if (target.email.toLowerCase() === 'admin@masakula.co.ao') {
    return { success: false, error: 'A conta principal de Administrador não pode ser eliminada.' };
  }

  const updated = users.filter(u => u.id !== id);
  saveStoredUsers(updated);
  return { success: true };
}

export function toggleUserStatus(id: string): { success: boolean; error?: string } {
  const users = getStoredUsers();
  const target = users.find(u => u.id === id);

  if (!target) {
    return { success: false, error: 'Utilizador não encontrado.' };
  }

  if (target.email.toLowerCase() === 'admin@masakula.co.ao') {
    return { success: false, error: 'A conta de Administrador não pode ser desativada.' };
  }

  const updated = users.map(u => u.id === id ? { ...u, active: !u.active } : u);
  saveStoredUsers(updated);
  return { success: true };
}
