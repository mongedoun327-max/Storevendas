import { useState } from 'react';

export type UserRole = 'ADMIN' | 'GERENTE' | 'OPERADOR_CAIXA';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
}

export function usePermissions() {
  // Estado de perfil obtido após o login
  const [currentUser] = useState<UserProfile>({
    id: 'usr-001',
    name: 'Miguel António',
    role: 'ADMIN',
  });

  const canAccessModule = (requiredRole: UserRole[]): boolean => {
    return requiredRole.includes(currentUser.role);
  };

  const requiresSupervisorApproval = (discountPercentage: number): boolean => {
    // Exemplo: Descontos acima de 10% exigem PIN do Gerente/Admin se for Operador
    if (currentUser.role === 'OPERADOR_CAIXA' && discountPercentage > 10) {
      return true;
    }
    return false;
  };

  return {
    currentUser,
    canAccessModule,
    requiresSupervisorApproval,
    isAdmin: currentUser.role === 'ADMIN',
    isManager: currentUser.role === 'GERENTE' || currentUser.role === 'ADMIN',
  };
}

export default usePermissions;
