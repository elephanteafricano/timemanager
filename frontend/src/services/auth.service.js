import api from './api';

const authService = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
};

export default authService;
