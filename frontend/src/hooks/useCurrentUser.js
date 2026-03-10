import { useEffect, useState } from 'react';
import tokenService from '../services/tokenService';

function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUser(tokenService.getUser());
    setIsLoading(false);
  }, []);

  return { user, isLoading };
}

export default useCurrentUser;
