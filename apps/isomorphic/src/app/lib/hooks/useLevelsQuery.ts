'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import * as api from '@/app/lib/api/level';

// Query key factory for levels
export const levelQueryKeys = {
  all: ['levels'] as const,
  tenant: (tenantId: string | null) => [...levelQueryKeys.all, tenantId] as const,
  list: (tenantId: string | null, params?: Record<string, any>) => 
    [...levelQueryKeys.tenant(tenantId), 'list', params] as const,
};

type LevelRecord = { 
  id: string; 
  name: string; 
  _id?: string; 
  rank?: number;
  isSpecial?: boolean;
  isActive?: boolean;
  structureName?: string; // For special levels (extracted from name)
};

/**
 * Shared hook for fetching levels using React Query
 * All components using this hook will share the same cache
 * Cache automatically invalidates when tenant changes
 * @param params - Query parameters
 * @param params.onlyWithStructures - If true, only return levels that have active structures
 */
export function useLevelsQuery(params?: { sortBy?: string; limit?: number; onlyWithStructures?: boolean }) {
  const { data: session } = useSession();
  const user = session?.user as any;
  const tenantId = user?.tenantId || user?.tenant?.id || user?.tenant || null;

  // Debug tenant resolution
  if (typeof window !== 'undefined') {
    console.log('[useLevelsQuery] Session:', { 
      hasSession: !!session, 
      user, 
      tenantId,
      tenantSources: {
        tenantId: user?.tenantId,
        tenantId2: user?.tenant?.id,
        tenantId3: user?.tenant
      }
    });
  }

  const queryKey = levelQueryKeys.list(tenantId, params);
  const isEnabled = !!tenantId;
  
  if (typeof window !== 'undefined') {
    console.log('[useLevelsQuery] Query config:', {
      queryKey,
      isEnabled,
      tenantId,
      params,
    });
  }

  return useQuery({
    queryKey,
    queryFn: async () => {
      try {
        // Backend validation only allows: tenantId, limit, page, onlyWithStructures
        // sortBy is not allowed in validation, so we sort client-side
        const response = await api.getLevels({ 
          limit: params?.limit || 500,
          page: 1,
          ...(params?.onlyWithStructures !== undefined && { onlyWithStructures: params.onlyWithStructures }),
        });
        
        console.log('[useLevelsQuery] Raw API response:', response);
        
        // API returns { results: [...], totalPages, totalResults }
        // Handle both direct results array and wrapped response
        let levelsArray: any[] = [];
        
        if (Array.isArray(response)) {
          // Response is directly an array
          levelsArray = response;
        } else if (response?.results && Array.isArray(response.results)) {
          // Response is wrapped in { results: [...] }
          levelsArray = response.results;
        } else if (response?.data?.results && Array.isArray(response.data.results)) {
          // Response is wrapped in { data: { results: [...] } }
          levelsArray = response.data.results;
        }
        
        console.log('[useLevelsQuery] Extracted levels array:', levelsArray);
        console.log('[useLevelsQuery] First level sample:', levelsArray[0]);
        
        // Normalize level objects to ensure they have id or _id
        // MongoDB typically uses _id, but API might transform it to id
        const normalizedLevels = levelsArray
          .map((level: any) => {
            // Handle both id and _id - MongoDB uses _id, but API might expose as id
            const levelId = level.id || level._id || '';
            const isSpecial = level.isSpecial || false;
            const structureName =
              isSpecial && level.name?.startsWith('Special-')
                ? level.name.replace('Special-', '')
                : undefined;

            return {
              id: levelId,
              _id: level._id || level.id || levelId,
              name: level.name || '',
              rank: level.rank,
              isSpecial, // ADD THIS
              isActive: level.isActive ?? true, // ADD THIS (default true)
              structureName, // ADD THIS
            };
          })
          .filter((level) => level.id) // Filter out any without an ID
          .sort((a, b) => {
            // Sort by rank ascending (client-side since backend doesn't support sortBy)
            const rankA = a.rank ?? 999;
            const rankB = b.rank ?? 999;
            return rankA - rankB;
          });
        
        console.log('[useLevelsQuery] Normalized levels:', normalizedLevels);
        
        return normalizedLevels as LevelRecord[];
      } catch (error) {
        console.error('[useLevelsQuery] Error fetching levels:', error);
        return [];
      }
    },
    enabled: !!tenantId,
    staleTime: 0, // Always consider data stale - refetch when cache is invalidated
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });
}

/**
 * Hook to get query client for manual cache invalidation
 */
export function useLevelsQueryClient() {
  return useQueryClient();
}

