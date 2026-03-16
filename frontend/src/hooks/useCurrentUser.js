import { useEffect, useState } from 'react';
import tokenService from '../services/tokenService';

function useCurrentUser() {
  const [user] = useState(() => tokenService.getUser());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  return { user, isLoading };
}

export default useCurrentUser;
