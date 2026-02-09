import api from './api';

const clocksService = {
  getUserClocks: (userId) => api.get(`/clocks/${userId}`),
  toggleClock: (clockData) => api.post('/clocks', clockData),
};

export default clocksService;
