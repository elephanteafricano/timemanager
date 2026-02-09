import api from './api';

const usersService = {
  getUserById: (id) => api.get(`/users/${id}`),
  getUsers: () => api.get('/users'),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

export default usersService;
