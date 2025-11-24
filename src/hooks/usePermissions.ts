import { useAuth } from './useAuth';

export function usePermissions() {
  const { user } = useAuth();

  const canCreateItem = (sectionId: string) => {
    if (!user) return false;
    return user.role === 'admin' || ['manager', 'staff'].includes(user.role);
  };

  const canEditItem = (item: any) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'manager') return true;
    if (user.role === 'staff') {
      return item.created_by === user.id || item.assignees?.some((a: any) => a.id === user.id);
    }
    return false;
  };

  const canDeleteItem = (item: any) => {
    if (!user) return false;
    return user.role === 'admin' || user.role === 'manager';
  };

  const canCreateTask = (itemId: string) => {
    if (!user) return false;
    return user.role === 'admin' || ['manager', 'staff'].includes(user.role);
  };

  const canEditTask = (task: any) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'manager') return true;
    if (user.role === 'staff') {
      return task.created_by === user.id || task.assignees?.some((a: any) => a.id === user.id);
    }
    return false;
  };

  const canDeleteTask = (task: any) => {
    if (!user) return false;
    return user.role === 'admin' || user.role === 'manager';
  };

  const canAccessAdmin = () => {
    if (!user) return false;
    return user.role === 'admin';
  };

  const canManageUsers = () => {
    if (!user) return false;
    return user.role === 'admin';
  };

  return {
    canCreateItem,
    canEditItem,
    canDeleteItem,
    canCreateTask,
    canEditTask,
    canDeleteTask,
    canAccessAdmin,
    canManageUsers,
  };
}