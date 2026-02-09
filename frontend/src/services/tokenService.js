// Centralized token and user storage management

const tokenService = {
  saveTokens: (accessToken, refreshToken, user) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  },

  getAccessToken: () => {
    return localStorage.getItem('accessToken') || localStorage.getItem('token');
  },

  getRefreshToken: () => {
    return localStorage.getItem('refreshToken');
  },

  getUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  clearTokens: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  isAuthenticated: () => {
    return !!tokenService.getAccessToken() && !!tokenService.getUser();
  },
};

export default tokenService;
