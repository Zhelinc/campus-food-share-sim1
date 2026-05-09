import api from '../utils/axios';

// 1. 登录接口
export const login = (email, password) => {
  return api.post('/api/users/login', { email, password });
};

// 2. 注册接口
export const register = (email, password, confirmPassword, role = 'user', invitationCode = '') => {
  return api.post('/api/users/register', { 
    email, 
    password, 
    confirmPassword, 
    role, 
    invitationCode 
  });
};

// 3. 获取用户信息接口
export const getUserInfo = () => {
  return api.get('/api/users/info');
};