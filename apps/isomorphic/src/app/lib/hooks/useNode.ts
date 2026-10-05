import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { nodeApi, Node } from '../api/node';
import { CreateNodeInput } from '@/validators/create-node.schema';
import { useModal } from '@/app/shared/modal-views/use-modal';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { emitNodeMutation } from '@/app/lib/node-mutation-bus';
import { levelQueryKeys } from './useLevelsQuery';

export function useNode() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [archivedNodes, setArchivedNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { closeModal } = useModal();
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const queryClient = useQueryClient();
  
  // Helper to get tenantId from session
  const getTenantId = useCallback(() => {
    const user = session?.user as any;
    return user?.tenantId || user?.tenant?.id || user?.tenant || null;
  }, [session?.user]);
  
  // Helper to invalidate levels cache
  const invalidateLevelsCache = useCallback(() => {
    const tenantId = getTenantId();
    if (tenantId) {
      queryClient.invalidateQueries({ queryKey: levelQueryKeys.tenant(tenantId) });
    } else {
      // If tenantId not available, invalidate all level queries
      queryClient.invalidateQueries({ queryKey: levelQueryKeys.all });
    }
  }, [queryClient, getTenantId]);

  const resolveNodeId = useCallback((node?: Partial<Node> | null) => {
    if (!node) {
      return '';
    }
    return (
      (node as any).id ||
      (node as any)._id ||
      (node as any).nodeId ||
      ''
    );
  }, []);

  const resolveParentId = useCallback((node?: Partial<Node> | null) => {
    if (!node?.parent) {
      return null;
    }
    if (typeof node.parent === 'string') {
      return node.parent;
    }
    const parent: any = node.parent;
    return parent.id || parent._id || null;
  }, []);

  const fetchNodes = useCallback(
    async (
      params?: {
        page?: number;
        limit?: number;
        search?: string;
        level?: string;
        includeFamily?: boolean;
        status?: 'active' | 'archived' | 'all';
      }
    ) => {
      try {
        console.log('[USE NODE] Fetching nodes with token:', token ? 'present' : 'missing');
        setLoading(true);
        const status = params?.status ?? 'active';
        const response = await nodeApi.getNodes(token, { ...params, status });
        console.log('[USE NODE] API Response:', response);
        
        if (response?.results) {
          console.log('[USE NODE] Nodes fetched:', response.results.length);
          console.log('[USE NODE] Sample node:', response.results[0]);
          
          // Sort nodes by hierarchy path
          const sortedData = response.results.sort((a, b) =>
            a.path.localeCompare(b.path)
          );

          if (status === 'archived') {
            setArchivedNodes(sortedData);
          } else {
            setNodes(sortedData);
          }
          setError(null);
          return {
            success: true,
            data: {
              results: sortedData,
              totalResults: response.totalResults,
              totalPages: response.totalPages,
            },
          };
        }
        setError(null);
        return { success: false, error: 'Invalid response format' };
      } catch (err) {
        setError('Failed to fetch nodes');
        console.error('[USE NODE] Error fetching nodes:', err);
        toast.error('Failed to fetch nodes');
        return { success: false, error: 'Failed to fetch nodes' };
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const fetchArchivedNodes = useCallback(
    async (params?: { page?: number; limit?: number; search?: string; level?: string; includeFamily?: boolean }) => {
      return await fetchNodes({ ...params, status: 'archived' });
    },
    [fetchNodes]
  );

  const fetchNodeBranch = useCallback(
    async (nodeId: string) => {
      if (!nodeId) {
        return { success: false, error: 'Node ID is required' };
      }
      try {
        const response = await nodeApi.getNodeBranch(nodeId, token);
        if (Array.isArray(response?.results)) {
          return { success: true, data: response };
        }
        return { success: false, error: 'Invalid branch response' };
      } catch (err) {
        console.error('[USE NODE] Failed to fetch node branch:', err);
        return { success: false, error: 'Failed to fetch node branch' };
      }
    },
    [token]
  );

  const fetchNodeBranches = useCallback(
    async (nodeIds: string[]) => {
      if (!Array.isArray(nodeIds) || nodeIds.length === 0) {
        return { success: false, error: 'At least one node ID is required' };
      }
      try {
        const response = await nodeApi.getNodeBranches(nodeIds, token);
        if (Array.isArray(response?.results)) {
          return { success: true, data: response };
        }
        return { success: false, error: 'Invalid branch response' };
      } catch (err) {
        console.error('[USE NODE] Failed to fetch node branches:', err);
        return { success: false, error: 'Failed to fetch node branches' };
      }
    },
    [token]
  );

  const createNode = useCallback(
    async (data: CreateNodeInput) => {
      try {
        setLoading(true);
        const newNode = await nodeApi.createNode(data, token);
        setNodes((prev) =>
          [...prev, newNode].sort((a, b) => a.path.localeCompare(b.path))
        );
        setError(null);
        closeModal();
        toast.success('Node created successfully');
        
        // Invalidate levels cache since node creation may reference levels
        invalidateLevelsCache();
        
        emitNodeMutation({
          type: 'upsert',
          nodes: [newNode],
          touchedNodeIds: [
            resolveNodeId(newNode),
            resolveParentId(newNode) || undefined,
          ].filter(Boolean) as string[],
          reason: 'create',
        });
        return { success: true, data: newNode };
      } catch (err) {
        setError('Failed to create node');
        console.error(err);
        toast.error('Failed to create node');
        return { success: false, error: 'Failed to create node' };
      } finally {
        setLoading(false);
      }
    },
    [closeModal, resolveNodeId, resolveParentId, token, invalidateLevelsCache]
  );

  const updateNode = useCallback(
    async (
      id: string,
      data: Partial<CreateNodeInput>,
      shouldCloseModal = true,
      options?: { touchedNodeIds?: string[]; reason?: string }
    ) => {
      try {
        setLoading(true);
        const updatedNode = await nodeApi.updateNode(id, data, token);
        setNodes((prev) =>
          prev
            .map((node) => (node.id === id ? updatedNode : node))
            .sort((a, b) => a.path.localeCompare(b.path))
        );
        setError(null);
        if (shouldCloseModal) {
          closeModal();
        }
        toast.success('Node updated successfully');
        
        // Invalidate levels cache if level was changed or if this is a level-change operation
        // This ensures the inline selector shows the latest levels
        if (data.level || options?.reason === 'level-change') {
          invalidateLevelsCache();
        }
        
        emitNodeMutation({
          type: 'upsert',
          nodes: [updatedNode],
          touchedNodeIds:
            options?.touchedNodeIds ??
            [
              resolveNodeId(updatedNode),
              resolveParentId(updatedNode) || undefined,
            ].filter(Boolean) as string[],
          reason: options?.reason || 'update',
        });
        return { success: true, data: updatedNode };
      } catch (err) {
        setError('Failed to update node');
        console.error(err);
        toast.error('Failed to update node');
        return { success: false, error: 'Failed to update node' };
      } finally {
        setLoading(false);
      }
    },
    [closeModal, resolveNodeId, resolveParentId, token, invalidateLevelsCache]
  );

  const deleteNode = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        await nodeApi.deleteNode(id, token);
        setNodes((prev) => prev.filter((node) => node.id !== id));
        setError(null);
        toast.success('Node deleted successfully');
        await fetchArchivedNodes();
        emitNodeMutation({
          type: 'remove',
          nodeIds: [id],
          reason: 'soft-delete',
        });
        return { success: true };
      } catch (err) {
        setError('Failed to delete node');
        console.error(err);
        toast.error('Failed to delete node');
        return { success: false, error: 'Failed to delete node' };
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const getNodeHierarchy = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        const hierarchy = await nodeApi.getNodeHierarchy(id, token);
        setError(null);
        return { success: true, data: hierarchy };
      } catch (err) {
        setError('Failed to fetch node hierarchy');
        console.error(err);
        toast.error('Failed to fetch node hierarchy');
        return { success: false, error: 'Failed to fetch node hierarchy' };
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const assignUsersToNode = useCallback(
    async (nodeId: string, userIds: string[]) => {
      try {
        setLoading(true);

        const updatedNode = await nodeApi.assignUsersToNode(
          nodeId,
          userIds,
          token
        );
        
        setNodes((prev) =>
          prev
            .map((node) => (node.id === nodeId ? updatedNode : node))
            .sort((a, b) => a.path.localeCompare(b.path))
        );
        setError(null);
        toast.success('Users assigned successfully');
        emitNodeMutation({
          type: 'upsert',
          nodes: [updatedNode],
          touchedNodeIds: [
            resolveNodeId(updatedNode),
            resolveParentId(updatedNode) || undefined,
          ].filter(Boolean) as string[],
          reason: 'assign-users',
        });
        return { success: true, data: updatedNode };
      } catch (err) {
        setError('Failed to assign users');
        console.error('assignUsersToNode error:', err);
        toast.error('Failed to assign users');
        return { success: false, error: 'Failed to assign users' };
      } finally {
        setLoading(false);
      }
    },
    [resolveNodeId, resolveParentId, token]
  );

  const bulkImportNodes = useCallback(
    async (nodeData: CreateNodeInput[]) => {
      try {
        setLoading(true);
        const result = await nodeApi.bulkImportNodes(nodeData, token);
        // Refresh the nodes list after import
        await fetchNodes();
        setError(null);
        toast.success(`Successfully imported ${result.data.length} nodes`);
        if (Array.isArray(result.data) && result.data.length) {
          emitNodeMutation({
            type: 'upsert',
            nodes: result.data,
            reason: 'bulk-import',
          });
        } else {
          emitNodeMutation({
            type: 'refresh',
            reason: 'bulk-import',
          });
        }
        return { success: true, data: result.data };
      } catch (err) {
        setError('Failed to import nodes');
        console.error(err);
        toast.error('Failed to import nodes');
        return { success: false, error: 'Failed to import nodes' };
      } finally {
        setLoading(false);
      }
    },
    [token, fetchNodes]
  );

  const deleteNodeHard = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        await nodeApi.deleteNodeHard(id, token);
        setArchivedNodes((prev) => prev.filter((node) => node.id !== id));
        toast.success('Node permanently deleted');
        emitNodeMutation({
          type: 'remove',
          nodeIds: [id],
          reason: 'hard-delete',
        });
        return { success: true };
      } catch (err) {
        setError('Failed to delete node');
        console.error(err);
        toast.error('Failed to delete node');
        return { success: false, error: 'Failed to delete node' };
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const restoreNode = useCallback(
    async (id: string, payload: { parent?: string | null; level?: string }) => {
      try {
        setLoading(true);
        const restored = await nodeApi.restoreNode(id, payload, token);
        setArchivedNodes((prev) => prev.filter((node) => node.id !== id));
        setNodes((prev) =>
          [...prev, restored].sort((a, b) => a.path.localeCompare(b.path))
        );
        toast.success('Node restored successfully');
        emitNodeMutation({
          type: 'upsert',
          nodes: [restored],
          touchedNodeIds: [
            resolveNodeId(restored),
            resolveParentId(restored) || undefined,
          ].filter(Boolean) as string[],
          reason: 'restore',
        });
        return { success: true, data: restored };
      } catch (err) {
        setError('Failed to restore node');
        console.error(err);
        toast.error('Failed to restore node');
        return { success: false, error: 'Failed to restore node' };
      } finally {
        setLoading(false);
      }
    },
    [resolveNodeId, resolveParentId, token]
  );

  return {
    nodes,
    archivedNodes,
    loading,
    error,
    fetchNodes,
    fetchArchivedNodes,
    fetchNodeBranch,
    fetchNodeBranches,
    createNode,
    updateNode,
    deleteNode,
    deleteNodeHard,
    restoreNode,
    getNodeHierarchy,
    assignUsersToNode,
    bulkImportNodes,
  };
}
