import { api } from '../axios';

interface UserFilters {
  page?: number;
  limit?: number;
  status?: string;
  roles?: string;
  search?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
}

export type TenantUser = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
};

type ApiUser = {
  id?: string;
  _id?: string;
  userId?: string;
  firstname?: string;
  lastname?: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
};

export const getUsers = async (filters?: UserFilters, token?: string) => {
  const options = {
    params: {
      page: filters?.page,
      limit: filters?.limit,
      status: filters?.status,
      roles: filters?.roles,
      search: filters?.search,
    },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.get('/users', options);
  return data;
};

export const getTenantUsers = async (): Promise<TenantUser[]> => {
  const { data } = await api.get<
    { results?: ApiUser[]; users?: ApiUser[] } | ApiUser[]
  >('/users', { params: { status: 'active', limit: 200 } });
  const users = Array.isArray(data) ? data : (data.results ?? data.users ?? []);
  return users.flatMap((user) => {
    const id = user.id ?? user._id ?? user.userId;
    if (!id) return [];
    return [
      {
        id,
        name:
          user.name ??
          ([user.firstname, user.lastname].filter(Boolean).join(' ') ||
            user.email ||
            'Unnamed user'),
        email: user.email,
        phone: user.phoneNumber,
      },
    ];
  });
};

export const getUser = async (userId: string, token?: string) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.get(`/users/${userId}`, options);
  return data;
};

export const createUser = async (payload: any, token?: string) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.post('/users', payload, options);
  return data;
};

export const updateUser = async (
  userId: string,
  payload: Partial<{
    firstname: string;
    lastname: string;
    email: string;
    phoneNumber: string;
    role: string;
    isActive: boolean;
    isOwner: boolean;
    isSuper: boolean;
    isSaby: boolean;
    isAdmin: boolean;
    [key: string]: any; // Allow additional fields
  }>,
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };

  try {
    const { data } = await api.patch(`/users/${userId}`, payload, options);
    return data;
  } catch (error: any) {
    // Create a clean error object without circular references
    const cleanError = {
      message: error?.message || 'Unknown error',
      status: error.response?.status,
      data: error.response?.data,
      name: error?.name || 'Error',
    };

    throw cleanError;
  }
};

export const deleteUser = async (userId: string, token?: string) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.delete(`/users/${userId}`, options);
  return data;
};

export const bulkCreateUsers = async (payload: any[], token?: string) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.post('/users/bulk-create', payload, options);
  return data;
};

export const restoreUser = async (userId: string, token?: string) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.post(`/users/restore/${userId}`, {}, options);
  return data;
};

export const softDeleteUser = async (userId: string, token?: string) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.post(`/users/soft-delete/${userId}`, {}, options);
  return data;
};

export const searchUsers = async (query: string, token?: string) => {
  const options = {
    params: {
      search: query,
      limit: 10,
    },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.get('/users', options);
  return data;
};

export const promoteUser = async (
  userId: string,
  promotionType: 'toSabyUser' | 'toOwner' | 'toAdmin',
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };

  let payload;
  switch (promotionType) {
    case 'toSabyUser':
      payload = { isSaby: true, isSuper: true, isOwner: true, isAdmin: true };
      break;
    case 'toAdmin':
      payload = { isAdmin: true };
      break;
    case 'toOwner':
    default:
      payload = { isOwner: true };
      break;
  }

  const { data } = await api.patch(`/users/${userId}`, payload, options);
  return data;
};

export const assignRoles = async (
  userId: string,
  roleIds: string[],
  token?: string
) => {
  // Ensure roleIds is an array of strings and filter out any non-string values
  const cleanRoleIds = Array.isArray(roleIds)
    ? roleIds.filter((id) => typeof id === 'string' && id.trim().length > 0)
    : [];

  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };

  const { data } = await api.patch(
    `/users/${userId}/assign-roles`,
    { roles: cleanRoleIds.length === 1 ? cleanRoleIds[0] : cleanRoleIds },
    options
  );
  return data;
};
