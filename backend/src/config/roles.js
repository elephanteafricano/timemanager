// User role constants - single source of truth for role values
// Used across authentication, authorization, and UI logic

const USER_ROLES = {
  EMPLOYEE: 'employee',
  MANAGER: 'manager'
};

// Array of all valid roles for validation
const VALID_ROLES = Object.values(USER_ROLES);

module.exports = { USER_ROLES, VALID_ROLES };
