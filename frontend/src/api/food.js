import api from '../utils/axios';

// 1. 获取食物列表（支持筛选）
export const getFoodList = (filters = {}) => {
  return api.get('/api/food/list', { params: filters });
};

// 2. 认领食物
export const claimFood = (foodId, pickupTime) => {
  return api.post('/api/food/claim', { foodId, pickupTime });
};

// 3. 发布食物
export const publishFood = (foodData) => {
  return api.post('/api/food/publish', foodData);
};

// 4. 修改发布的食物
export const updateFood = (foodId, foodData) => {
  return api.put(`/api/food/${foodId}`, foodData);
};

// 5. 删除发布的食物
export const deleteFood = (foodId) => {
  return api.delete(`/api/food/${foodId}`);
};

// 6. 获取当前用户发布的食物
export const getMyPublishedFoods = () => {
  return api.get('/api/food/my-publish');
};