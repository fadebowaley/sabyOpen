import { api } from '../axios';

/**
 * Get node profile (now embedded in Node model)
 * NOTE: Profile is now nested in the Node object under the 'profile' field
 */
export const getNodeProfile = async (nodeId: string, token?: string) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.get(`/node/${nodeId}`, options);
  
  // Extract profile from node object
  return data.profile || {};
};

/**
 * Create node profile (now part of Node update)
 * @deprecated - Use upsertNodeProfile instead
 */
export const createNodeProfile = async (payload: any, token?: string) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  
  // Extract nodeId from payload
  const nodeId = payload.church || payload.nodeId || payload.node;
  if (!nodeId) {
    throw new Error('Node ID is required in payload (as church, nodeId, or node field)');
  }
  
  // Update node with profile data
  const profileData = { ...payload };
  delete profileData.church;
  delete profileData.nodeId;
  delete profileData.node;
  delete profileData.tenantId;
  
  const { data } = await api.patch(`/node/${nodeId}`, { profile: profileData }, options);
  return data;
};

/**
 * Update node profile (now part of Node model)
 * @param nodeId - The node ID (previously profileId, now expects nodeId)
 * @param payload - Profile data to update
 * @param token - Auth token
 */
export const updateNodeProfile = async (
  nodeId: string,
  payload: any,
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  
  // Send profile data as nested object
  const { data } = await api.patch(`/node/${nodeId}`, { profile: payload }, options);
  return data;
};

/**
 * Create or update node profile (upsert)
 * Merged profiles are now part of the Node model
 */
export const upsertNodeProfile = async (payload: any, token?: string) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  
  // Extract nodeId from payload
  const nodeId = payload.church || payload.nodeId || payload.node;
  if (!nodeId) {
    throw new Error('Node ID is required in payload (as church, nodeId, or node field)');
  }
  
  // Prepare profile data (remove metadata fields)
  const profileData = { ...payload };
  delete profileData.church;
  delete profileData.nodeId;
  delete profileData.node;
  delete profileData.tenantId;
  
  // Update node with profile data
  const { data } = await api.patch(`/node/${nodeId}`, { profile: profileData }, options);
  return data;
};

/**
 * Delete node profile (clears profile fields)
 */
export const deleteNodeProfile = async (nodeId: string, token?: string) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  
  // Clear profile by setting it to empty object
  const { data } = await api.patch(`/node/${nodeId}`, { profile: {} }, options);
  return data;
};


