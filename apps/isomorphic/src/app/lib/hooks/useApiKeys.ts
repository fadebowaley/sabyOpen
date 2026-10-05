'use client';

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import * as apiKeyApi from '../api/apiKeys';

// Types
type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

export const useApiKeys = () => {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  // Utility function for API requests with error handling
  const apiRequest = useCallback(
    async <T>(
      apiFunc: Function,
      params: any[] = [],
      successMsg?: string,
      errorMsg?: string
    ): Promise<ApiResponse<T>> => {
      setLoading(true);
      try {
        console.log('API request params:', params);
        const result = await apiFunc(...params, token);
        console.log('API request result:', result);
        if (successMsg) {
          toast.success(successMsg);
        }
        return { success: true, data: result };
      } catch (err: any) {
        console.error('API request error:', err);
        const message =
          err?.response?.data?.message || errorMsg || 'An error occurred';
        toast.error(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  // Get all API keys with filtering
  const getApiKeys = useCallback(
    async (
      filters?: apiKeyApi.ApiKeyFilters
    ): Promise<ApiResponse<apiKeyApi.PaginatedApiKeysResponse>> => {
      return apiRequest(
        apiKeyApi.getApiKeys,
        [filters],
        undefined,
        'Failed to load API keys'
      );
    },
    [apiRequest]
  );

  // Create a new API key
  const createApiKey = useCallback(
    async (
      payload: apiKeyApi.CreateApiKeyPayload
    ): Promise<ApiResponse<apiKeyApi.CreateApiKeyResponse>> => {
      return apiRequest(
        apiKeyApi.createApiKey,
        [payload],
        'API key created successfully',
        'Failed to create API key'
      );
    },
    [apiRequest]
  );

  // Get API key by ID
  const getApiKeyById = useCallback(
    async (keyId: string): Promise<ApiResponse<apiKeyApi.ApiKey>> => {
      return apiRequest(
        apiKeyApi.getApiKeyById,
        [keyId],
        undefined,
        'Failed to load API key'
      );
    },
    [apiRequest]
  );

  // Update an API key
  const updateApiKey = useCallback(
    async (
      keyId: string,
      payload: apiKeyApi.UpdateApiKeyPayload
    ): Promise<ApiResponse<apiKeyApi.ApiKey>> => {
      console.log('updateApiKey called with:', { keyId, payload });
      return apiRequest(
        apiKeyApi.updateApiKey,
        [keyId, payload],
        'API key updated successfully',
        'Failed to update API key'
      );
    },
    [apiRequest]
  );

  // Delete an API key
  const deleteApiKey = useCallback(
    async (keyId: string): Promise<ApiResponse<void>> => {
      return apiRequest(
        apiKeyApi.deleteApiKey,
        [keyId],
        'API key deleted successfully',
        'Failed to delete API key'
      );
    },
    [apiRequest]
  );

  // Get API key analytics
  const getApiKeyAnalytics = useCallback(
    async (
      keyId: string,
      options?: {
        startDate?: string;
        endDate?: string;
        granularity?: 'hour' | 'day' | 'week' | 'month';
      }
    ): Promise<ApiResponse<apiKeyApi.ApiKeyAnalytics>> => {
      return apiRequest(
        apiKeyApi.getApiKeyAnalytics,
        [keyId, options],
        undefined,
        'Failed to load API key analytics'
      );
    },
    [apiRequest]
  );

  // Regenerate an API key
  const regenerateApiKey = useCallback(
    async (
      keyId: string
    ): Promise<ApiResponse<apiKeyApi.CreateApiKeyResponse>> => {
      return apiRequest(
        apiKeyApi.regenerateApiKey,
        [keyId],
        'API key regenerated successfully',
        'Failed to regenerate API key'
      );
    },
    [apiRequest]
  );

  // Batch operations
  const batchUpdateApiKeys = useCallback(
    async (
      updates: Array<{ keyId: string; payload: apiKeyApi.UpdateApiKeyPayload }>
    ): Promise<ApiResponse<apiKeyApi.ApiKey[]>> => {
      return apiRequest(
        apiKeyApi.batchUpdateApiKeys,
        [updates],
        'API keys updated successfully',
        'Failed to update API keys'
      );
    },
    [apiRequest]
  );

  const batchDeleteApiKeys = useCallback(
    async (keyIds: string[]): Promise<ApiResponse<void>> => {
      return apiRequest(
        apiKeyApi.batchDeleteApiKeys,
        [keyIds],
        `${keyIds.length} API key${keyIds.length > 1 ? 's' : ''} deleted successfully`,
        'Failed to delete API keys'
      );
    },
    [apiRequest]
  );

  // Toggle API key status (activate/deactivate)
  const toggleApiKeyStatus = useCallback(
    async (
      keyId: string,
      isActive: boolean
    ): Promise<ApiResponse<apiKeyApi.ApiKey>> => {
      return updateApiKey(keyId, { isActive });
    },
    [updateApiKey]
  );

  // Utility functions for working with API keys
  const formatApiKeyForDisplay = useCallback(
    (apiKey: apiKeyApi.ApiKey): apiKeyApi.ApiKey => {
      return apiKeyApi.formatApiKeyForDisplay(apiKey);
    },
    []
  );

  // Get API key status color for UI
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'inactive':
        return 'text-gray-600 bg-gray-100';
      case 'expired':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }, []);

  // Get environment color for UI
  const getEnvironmentColor = useCallback((environment: string) => {
    switch (environment) {
      case 'production':
        return 'text-red-600 bg-red-100';
      case 'staging':
        return 'text-yellow-600 bg-yellow-100';
      case 'development':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }, []);

  // Validate API key creation payload
  const validateCreatePayload = useCallback(
    (payload: apiKeyApi.CreateApiKeyPayload): string[] => {
      const errors: string[] = [];

      if (!payload.label?.trim()) {
        errors.push('Label is required');
      }

      if (!payload.environment) {
        errors.push('Environment is required');
      }

      if (!payload.scope?.trim()) {
        errors.push('Scope is required');
      }

      if (
        payload.rateLimit &&
        (payload.rateLimit < 1 || payload.rateLimit > 10000)
      ) {
        errors.push('Rate limit must be between 1 and 10,000');
      }

      if (payload.expires && new Date(payload.expires) <= new Date()) {
        errors.push('Expiration date must be in the future');
      }

      return errors;
    },
    []
  );

  return {
    loading,

    // API methods
    getApiKeys,
    createApiKey,
    getApiKeyById,
    updateApiKey,
    deleteApiKey,
    getApiKeyAnalytics,
    regenerateApiKey,

    // Batch operations
    batchUpdateApiKeys,
    batchDeleteApiKeys,

    // Utility methods
    toggleApiKeyStatus,
    formatApiKeyForDisplay,
    getStatusColor,
    getEnvironmentColor,
    validateCreatePayload,
  };
};
