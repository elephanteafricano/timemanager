import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';
import tokenService from '../services/tokenService';

function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const login = async (username, password) => {
    setLoading(true);
    setError('');
    try {
      const response = await authService.login(username, password);
      const { accessToken, refreshToken, user } = response.data;
      tokenService.saveTokens(accessToken, refreshToken, user);
      return { success: true, user };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password, role, first_name, last_name, phone_number) => {
    setLoading(true);
    setError('');
    try {
      const response = await authService.register(username, email, password, role, first_name, last_name, phone_number);
      const { accessToken, refreshToken, user } = response.data;
      tokenService.saveTokens(accessToken, refreshToken, user);
      return { success: true, user };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    tokenService.clearTokens();
    navigate('/login');
  };

  return { login, register, logout, loading, error };
}

export default useAuth;
