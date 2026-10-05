import { api } from '../axios';

// GET /templates
export const getRoleTemplates = async (token?: string) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.get('/roles/templates', options);
  return data;
};

// POST /
export const createRole = async (payload: any, token?: string) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.post('/roles', payload, options);
  return data;
};

export type TenantRole = {
  id: string;
  name: string;
  description?: string;
};

export const getTenantRoles = async (token?: string): Promise<TenantRole[]> => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    params: { limit: 100 },
  };
  const { data } = await api.get('/roles', options);
  const rawRoles: Array<{
    id?: string;
    _id?: string;
    name?: string;
    description?: string;
  }> = Array.isArray(data) ? data : data?.results ?? [];
  return rawRoles.flatMap((role) => {
    const id = role.id ?? role._id;
    if (!id || !role.name) return [];
    return [{ id, name: role.name, description: role.description }];
  });
};

// GET /
export const getRoles = async (token?: string) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.get('/roles', options);
  return data;
};

// DELETE /
export const deleteAllRoles = async (token?: string) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.delete('/roles', options);
  return data;
};

// POST /bulk
export const bulkCreateRoles = async (
  payload: any[] | { rolesArray: any[] },
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const normalizedPayload = Array.isArray(payload)
    ? { rolesArray: payload }
    : payload;
  const { data } = await api.post('/roles/bulk', normalizedPayload, options);
  return data;
};

// GET /:roleId
export const getRoleById = async (roleId: string, token?: string) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.get(`/roles/${roleId}`, options);
  return data;
};

// PATCH /:roleId
export const updateRole = async (
  roleId: string,
  payload: any,
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.patch(`/roles/${roleId}`, payload, options);
  return data;
};

// DELETE /:roleId
export const deleteRole = async (roleId: string, token?: string) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.delete(`/roles/${roleId}`, options);
  return data;
};

// GET /:roleId/permissions
export const getPermissionsForRole = async (roleId: string, token?: string) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.get(`/roles/${roleId}/permissions`, options);
  return data;
};

// PATCH /:roleId/permissions
export const assignRolePermissions = async (
  roleId: string,
  payload: any,
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };

  const { data } = await api.patch(
    `/roles/${roleId}/permissions`,
    payload,
    options
  );
  return data;
};

// DELETE /roles/:roleId/permissions
// export const removeRolePermissions = async (
//   roleId: string,
//   permissions: string[],
//   token?: string
// ) => {
//   const options = {
//     headers: token ? { Authorization: `Bearer ${token}` } : {},
//     data: { permissions }, // DELETE with body
//   };
//   const { data } = await api.delete(`/roles/${roleId}/permissions`, options);
//   return data;
// };
export const removeRolePermissions = async (
  roleId: string,
  permissions:string[],
  token?: string
) => {
  const { data } = await api.delete(`/roles/${roleId}/permissions`, {
    data: { permissions }, // body
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return data;
};
