import { Navigate } from 'react-router-dom';
import tokenService from '../services/tokenService';
import { USER_ROLES } from '../constants/roles';

// NOTE: This role check is also performed on the backend in roleCheck middleware.
// Frontend checks improve UX by preventing unauthorized navigation.
// Backend checks ensure API security - client-side checks can be bypassed.
function ProtectedRoute({ children, requireManager = false }) {
  if (!tokenService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (requireManager) {
    const user = tokenService.getUser();
    if (user?.role !== USER_ROLES.MANAGER) {
      return <Navigate to="/home" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;
