import { api } from '../axios';

// POST /
export const createLevel = async (payload: any) => {
  const { data } = await api.post('/level', payload);
  return data;
};

// GET /
export const getLevels = async (params?: any) => {
  const { data } = await api.get('/level', { params });
  return data;
};

// GET /:levelId
export const getLevelById = async (levelId: string) => {
  const { data } = await api.get(`/level/${levelId}`);
  return data;
};

// PATCH /:levelId
export const updateLevelById = async (levelId: string, payload: any) => {
  const { data } = await api.patch(`/level/${levelId}`, payload);
  return data;
};

// DELETE /:levelId
export const deleteLevelById = async (levelId: string) => {
  const { data } = await api.delete(`/level/${levelId}`);
  return data;
};

// GET /hierarchy
export const getLevelsByHierarchy = async () => {
  const { data } = await api.get('/level/hierarchy');
  return data;
};

// GET /:levelId/parent
export const getParentLevel = async (levelId: string) => {
  const { data } = await api.get(`/level/${levelId}/parent`);
  return data;
};

// GET /:levelId/children
export const getChildLevels = async (levelId: string) => {
  const { data } = await api.get(`/level/${levelId}/children`);
  return data;
};

// PATCH /:levelId/activate
export const activateLevel = async (levelId: string) => {
  const { data } = await api.patch(`/level/${levelId}/activate`);
  return data;
};

// PATCH /:levelId/deactivate
export const deactivateLevel = async (levelId: string) => {
  const { data } = await api.patch(`/level/${levelId}/deactivate`);
  return data;
};

// PATCH /:levelId/move
export const moveLevelToParent = async (levelId: string, payload: any) => {
  const { data } = await api.patch(`/level/${levelId}/move`, payload);
  return data;
};
