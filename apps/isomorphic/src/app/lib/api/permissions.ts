import { api } from '../axios';

const authHeaders = (token?: string) => ({
  headers: token ? { Authorization: `Bearer ${token}` } : {},
});

export const createPermission = async (payload: any, token?: string) => {
  const { data } = await api.post('/permissions', payload, authHeaders(token));
  return data;
};

export const getPermissions = async (
  query?: Record<string, any>,
  token?: string
) => {
  const { data } = await api.get('/permissions', {
    params: query,
    ...authHeaders(token),
  });
  return data;
};

export const getPermission = async (permissionName: string, token?: string) => {
  const { data } = await api.get(
    `/permissions/${permissionName}`,
    authHeaders(token)
  );
  return data;
};

export const updatePermission = async (
  permissionName: string,
  payload: any,
  token?: string
) => {
  const { data } = await api.patch(
    `/permissions/${permissionName}`,
    payload,
    authHeaders(token)
  );
  return data;
};

export const deletePermission = async (
  permissionName: string,
  token?: string
) => {
  const { data } = await api.delete(
    `/permissions/${permissionName}`,
    authHeaders(token)
  );
  return data;
};

export const bulkCreatePermissions = async (payload: any[], token?: string) => {
  const { data } = await api.post(
    '/permissions/bulk',
    payload,
    authHeaders(token)
  );
  return data;
};
