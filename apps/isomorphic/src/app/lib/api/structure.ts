import { api } from '../axios';


export const createStructure = async (payload: any, token?: string) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.post('/structure', payload, options);
  return data;
};



//GET Structures 
export const getStructures = async (
  query?: Record<string, any>,
  token?: string
) => {
  const options = {
    params: query,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.get('/structure', options);
  return data;
};

// GET /:structureId
export const getStructure = async (structureId: string, token?: string) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.get(`/structure/${structureId}`, options);
  return data;
};


// PATCH /:structureId
export const updateStructure = async (
  structureId: string,
  payload: any,
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.patch(
    `/structure/${structureId}`,
    payload,
    options
  );
  return data;
};

// DELETE /:structureId
export const deleteStructure = async (structureId: string, token?: string) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.delete(`/structure/${structureId}`, options);
  return data;
};
