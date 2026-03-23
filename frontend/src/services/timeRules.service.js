import api from './api';

const timeRulesService = {
  listRules: () => api.get('/time-rules'),
  createRule: (payload) => api.post('/time-rules', payload),
  updateRule: (id, payload) => api.put(`/time-rules/${id}`, payload),
  deleteRule: (id) => api.delete(`/time-rules/${id}`),
};

export default timeRulesService;
