import { useState, useCallback } from 'react';
import * as api from '@/app/lib/api/structure';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { Node, Edge } from 'reactflow';

// Types
type ApiResponse = {
  success: boolean;
  data?: any;
  error?: string;
};

interface Structure {
  tempId: string;
  name: string;
  code: string;
  description: string;
  levelRank: number;
  parentTempId: string | null;
  isActive: boolean;
  isSpecial: boolean;
  position?: { x: number; y: number };
}

// Hook
export const useSubmitStructure = () => {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const token = session?.user?.accessToken;



  // API request wrapper
  const apiRequest = useCallback(
    async <T = any>(
      apiFunc: (...args: any[]) => Promise<T>,
      params: any[] = []
    ): Promise<ApiResponse> => {
      if (!token) {
        toast.error('Missing access token. Please log in again.');
        return { success: false, error: 'Missing token' };
      }

      setLoading(true);
      try {
        const result = await apiFunc(...params, token);
        return { success: true, data: result };
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.message || 'An error occurred';
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  // Converts nodes and edges to API payload format
  const convertToStructure = useCallback(
    (nodes: Node[], edges: Edge[]): Structure[] => {
      console.log('[SUBMIT STRUCTURE] Converting nodes and edges to structure format');
      console.log('[SUBMIT STRUCTURE] Nodes count:', nodes.length);
      console.log('[SUBMIT STRUCTURE] Edges count:', edges.length);
      console.log('[SUBMIT STRUCTURE] All edges:', edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target
      })));
      
      const structures = nodes.map((node) => {
        const parentEdge = edges.find((edge) => edge.target === node.id);
        const parentTempId = parentEdge?.source || null;
        
        // Extract isSpecial and isActive from node data
        const isSpecial = node.data.special ?? false;
        const isActive = node.data.active ?? true;
        
        console.log(`[SUBMIT STRUCTURE] Node "${node.data.name}":`, {
          tempId: node.id,
          levelRank: node.data.level,
          parentEdge: parentEdge ? `${parentEdge.source} → ${parentEdge.target}` : 'none',
          parentTempId: parentTempId,
          isSpecial, // Log the actual value
          isActive, // Log the actual value
          nodeDataSpecial: node.data.special, // Log raw value from node
          nodeDataActive: node.data.active, // Log raw value from node
        });
        
        return {
          tempId: node.id,
          name: node.data.name,
          code: node.data.type,
          description: node.data.description,
          levelRank: node.data.level,
          parentTempId: parentTempId,
          isActive, // Use isActive (camelCase with 'is' prefix)
          isSpecial, // Use isSpecial (camelCase with 'is' prefix)
          position: node.position,
        };
      });
      
      console.log('[SUBMIT STRUCTURE] Final structures payload:', structures);
      return structures;
    },
    []
  );

  // Submits structure data to the backend
  const submitStructure = useCallback(
    async (nodes: Node[], edges: Edge[]) => {
      const structures = convertToStructure(nodes, edges);
      const payload = { structures };

      return await apiRequest(api.createStructure, [payload]);
    },
    [convertToStructure, apiRequest]
  );

  // Expose function and loading state
  return { submitStructure, loading };
};



