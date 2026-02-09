import api from './api';

const authService = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  register: (username, email, password, role, first_name, last_name, phone_number) =>
    api.post('/auth/register', { username, email, password, role, first_name, last_name, phone_number }),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
};

export default authService;
