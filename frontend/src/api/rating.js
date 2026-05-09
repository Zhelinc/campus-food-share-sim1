import api from '../utils/axios';

export const createRating = (claimId, score, comment) =>
  api.post('/api/rating', { claimId, score, comment });

export const getClaimRatings = (claimId) =>
  api.get(`/api/rating/claim/${claimId}`);

export const getUserRatings = (userId, page = 1, limit = 10) =>
  api.get(`/api/rating/user/${userId}?page=${page}&limit=${limit}`);