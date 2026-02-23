import { USER_ROLES } from '../constants/roles';

export function isManagerRole(user) {
  return user?.role === USER_ROLES.MANAGER;
}
