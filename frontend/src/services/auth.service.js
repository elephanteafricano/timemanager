import api from './api';

const authService = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  register: (username, email, password, role, first_name, last_name, phone_number) =>
    api.post('/auth/register', { username, email, password, role, first_name, last_name, phone_number }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
};

export default authService;
