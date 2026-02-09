import api from './api';

const teamsService = {
  getTeams: () => api.get('/teams'),
  getTeamById: (id) => api.get(`/teams/${id}`),
  createTeam: (teamData) => api.post('/teams', teamData),
  updateTeam: (id, teamData) => api.put(`/teams/${id}`, teamData),
  deleteTeam: (id) => api.delete(`/teams/${id}`),
  updateTeamMembers: (id, members) => api.put(`/teams/${id}/members`, { members }),
};

export default teamsService;
