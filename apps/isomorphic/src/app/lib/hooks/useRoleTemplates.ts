'use client';

import { useQuery } from '@tanstack/react-query';
import { getRoleTemplates } from '@/app/lib/api/roles';

type IndustryTemplate = {
  industry: string;
  [key: string]: unknown;
};

const roleTemplateQueryKey = ['role-templates'] as const;

const normalizeTemplates = (payload: any): IndustryTemplate[] => {
  if (!payload) return [];

  if (Array.isArray(payload)) {
    return payload as IndustryTemplate[];
  }

  if (Array.isArray(payload?.industryTemplates)) {
    return payload.industryTemplates as IndustryTemplate[];
  }

  if (Array.isArray(payload?.data?.industryTemplates)) {
    return payload.data.industryTemplates as IndustryTemplate[];
  }

  if (Array.isArray(payload?.results)) {
    return payload.results as IndustryTemplate[];
  }

  return [];
};

export const useRoleTemplates = () => {
  const query = useQuery({
    queryKey: roleTemplateQueryKey,
    queryFn: async () => {
      const response = await getRoleTemplates();
      return normalizeTemplates(response);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    industryTemplates: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? 'Failed to load industry templates.' : null,
    refetch: query.refetch,
  };
};

