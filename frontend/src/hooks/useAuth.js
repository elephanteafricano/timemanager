import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';
import tokenService from '../services/tokenService';

function useAuth() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const login = async (username, password) => {
    setLoading(true);
    try {
      const response = await authService.login(username, password);
      const { accessToken, refreshToken, user } = response.data;
      tokenService.saveTokens(accessToken, refreshToken, user);
      return { success: true, user };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    tokenService.clearTokens();
    navigate('/login');
  };

  return { login, logout, loading };
}

export default useAuth;
