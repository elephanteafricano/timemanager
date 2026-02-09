import api from './api';

const getCurrentKpis = () => api.get('/kpis/current');

export default {
  getCurrentKpis,
};
