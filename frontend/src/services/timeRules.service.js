import api from './api';

const timeRulesService = {
  getCurrent: (teamId) => {
    const params = {};
    if (teamId) {
      params.teamId = teamId;
    }
    return api.get('/time-rules/current', { params });
  },
};

export default timeRulesService;
