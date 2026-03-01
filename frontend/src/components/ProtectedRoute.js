import { Navigate } from 'react-router-dom';
import useCurrentUser from '../hooks/useCurrentUser';
import { isManagerRole } from '../utils/roles';

// NOTE: This role check is also performed on the backend in roleCheck middleware.
// Frontend checks improve UX by preventing unauthorized navigation.
// Backend checks ensure API security - client-side checks can be bypassed.
function ProtectedRoute({ children, requireManager = false }) {
  const { user, isLoading } = useCurrentUser();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireManager) {
    if (!isManagerRole(user)) {
      return <Navigate to="/home" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;
