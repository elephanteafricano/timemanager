// User role constants - single source of truth for role values
// Used across authentication, authorization, and UI logic

export const USER_ROLES = {
  EMPLOYEE: 'employee',
  MANAGER: 'manager'
};

// Array of all valid roles for validation
export const VALID_ROLES = Object.values(USER_ROLES);
