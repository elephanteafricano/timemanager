import api from './api';

const reportsService = {
  getReports: (paramsOrUserId) => {
    const params = typeof paramsOrUserId === 'object'
      ? { ...paramsOrUserId }
      : { userId: paramsOrUserId };

    Object.keys(params).forEach((key) => {
      if (params[key] === undefined || params[key] === null || params[key] === '') {
        delete params[key];
      }
    });

    if (Object.prototype.hasOwnProperty.call(params, 'teamId')) {
      delete params.userId;
    }

    return api.get('/reports', { params });
  },
};

export default reportsService;
