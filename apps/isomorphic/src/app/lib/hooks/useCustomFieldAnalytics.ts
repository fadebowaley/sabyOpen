'use client';

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  customFieldAnalyticsApi, 
  CustomFieldConfig 
} from '../api/baselineIntelligence';
import { CustomField } from '../api/tenantConfig';
import { mapTenantTypeToAnalyticsType, isAnalyzableType } from '../utils/fieldTypeMapper';
import toast from 'react-hot-toast';

// Query Keys
export const customFieldQueryKeys = {
  all: ['customFieldAnalytics'] as const,
  config: (entityType: 'user' | 'node') => [...customFieldQueryKeys.all, 'config', entityType] as const,
};

// Hook for getting custom field config
export function useCustomFieldConfig(entityType: 'user' | 'node', enabled = true) {
  return useQuery({
    queryKey: customFieldQueryKeys.config(entityType),
    queryFn: async () => {
      try {
        return await customFieldAnalyticsApi.getCustomFieldConfig(entityType);
      } catch (error: any) {
        // If API doesn't exist (404), return empty config instead of throwing
        if (error?.response?.status === 404) {
          console.warn(`Analytics config API not found for ${entityType}. Returning empty config.`);
          return {
            tenantId: '',
            entityType,
            fields: [],
            version: 1,
          };
        }
        // For other errors, still throw to let React Query handle it
        throw error;
      }
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: false, // Don't retry - if API doesn't exist, we use fallback
    retryOnMount: false,
    refetchOnWindowFocus: false,
    // Provide fallback data for when API doesn't exist yet
    placeholderData: {
      tenantId: '',
      entityType,
      fields: [],
      version: 1,
    },
  });
}

// Helper function to sanitize fields and ensure clean data structure
function sanitizeFields(fields: CustomFieldConfig['fields']): CustomFieldConfig['fields'] {
  return fields.map(field => ({
    fieldName: String(field.fieldName || ''),
    displayName: String(field.displayName || field.fieldName || ''),
    type: field.type || 'text',
    analyticsEnabled: Boolean(field.analyticsEnabled),
    ...(field.required !== undefined && { required: Boolean(field.required) }),
    ...(field.options && Array.isArray(field.options) && { 
      options: field.options.map(opt => ({
        label: String(opt.label || ''),
        value: typeof opt.value === 'string' || typeof opt.value === 'number' || typeof opt.value === 'boolean' 
          ? opt.value 
          : String(opt.value || '')
      }))
    }),
  }));
}

// Hook for updating custom field config
export function useUpdateCustomFieldConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      entityType, 
      fields 
    }: { 
      entityType: 'user' | 'node'; 
      fields: CustomFieldConfig['fields'] 
    }) => {
      // Sanitize fields before sending to API
      const sanitizedFields = sanitizeFields(fields);
      return customFieldAnalyticsApi.updateCustomFieldConfig(entityType, sanitizedFields);
    },
    
    onSuccess: (data, variables) => {
      toast.success(`${variables.entityType} field analytics configuration updated successfully`);
      
      // Update the cache with the new data
      queryClient.setQueryData(
        customFieldQueryKeys.config(variables.entityType), 
        data
      );
      
      // Invalidate baseline queries to trigger recomputation
      queryClient.invalidateQueries({ 
        queryKey: ['baseline'] 
      });
    },
    
    onError: (error: any) => {
      // Handle 404 errors gracefully (API endpoint might not exist yet)
      if (error?.response?.status === 404) {
        console.warn('Custom field analytics API endpoint not found. This feature may not be implemented yet.');
        toast.error('Analytics configuration API is not available. Please ensure the backend is updated.');
      } else {
        toast.error(
          error?.response?.data?.message || 
          'Failed to update custom field analytics configuration'
        );
      }
    },
  });
}

// Combined hook for managing both user and node configs
export function useCustomFieldAnalytics() {
  const userConfig = useCustomFieldConfig('user');
  const nodeConfig = useCustomFieldConfig('node');
  const updateConfig = useUpdateCustomFieldConfig();

  const isLoading = userConfig.isLoading || nodeConfig.isLoading;
  const error = userConfig.error || nodeConfig.error;

  const toggleFieldAnalytics = (
    entityType: 'user' | 'node',
    fieldName: string,
    enabled: boolean
  ) => {
    const currentConfig = entityType === 'user' ? userConfig.data : nodeConfig.data;
    
    // Ensure we have a valid config structure
    if (!currentConfig) {
      console.warn('Cannot toggle analytics: config not available');
      toast.error('Configuration not loaded. Please refresh the page.');
      return;
    }

    // Ensure fields is an array
    const currentFields = Array.isArray(currentConfig.fields) ? currentConfig.fields : [];
    
    // Ensure enabled is explicitly a boolean
    const analyticsEnabled = Boolean(enabled);
    
    // Check if field exists in analytics config
    const existingField = currentFields.find(field => field.fieldName === fieldName);
    
    let updatedFields: CustomFieldConfig['fields'];
    
    if (existingField) {
      // Update existing field - preserve all existing properties
      updatedFields = currentFields.map(field => 
        field.fieldName === fieldName 
          ? { 
              ...field, 
              analyticsEnabled: analyticsEnabled,
              // Ensure fieldName and displayName are strings
              fieldName: String(field.fieldName || fieldName),
              displayName: String(field.displayName || fieldName),
            }
          : field
      );
    } else {
      // Field doesn't exist in analytics config yet - add it
      // Note: fieldName should match the CustomField.id from tenant config
      updatedFields = [
        ...currentFields,
        {
          fieldName: String(fieldName), // Maps to CustomField.id
          displayName: String(fieldName), // Will be updated if we have label info
          type: 'text' as const, // Default, should match CustomField.type if available
          analyticsEnabled: analyticsEnabled, // Explicitly boolean
        }
      ];
    }

    updateConfig.mutate({ entityType, fields: updatedFields });
  };

  const addAnalyticsField = (
    entityType: 'user' | 'node',
    field: CustomFieldConfig['fields'][0]
  ) => {
    const currentConfig = entityType === 'user' ? userConfig.data : nodeConfig.data;
    if (!currentConfig) {
      console.warn('Cannot add analytics field: config not available');
      return;
    }

    const currentFields = Array.isArray(currentConfig.fields) ? currentConfig.fields : [];
    // Ensure analyticsEnabled is a boolean
    const cleanField = {
      ...field,
      analyticsEnabled: Boolean(field.analyticsEnabled),
    };
    const updatedFields = [...currentFields, cleanField];
    updateConfig.mutate({ entityType, fields: updatedFields });
  };

  const removeAnalyticsField = (
    entityType: 'user' | 'node',
    fieldName: string
  ) => {
    const currentConfig = entityType === 'user' ? userConfig.data : nodeConfig.data;
    if (!currentConfig || !currentConfig.fields || !Array.isArray(currentConfig.fields)) {
      console.warn('Cannot remove analytics field: config or fields not available');
      return;
    }

    const updatedFields = currentConfig.fields.filter(
      field => field.fieldName !== fieldName
    );
    updateConfig.mutate({ entityType, fields: updatedFields });
  };

  const getAnalyticsEnabledFields = (entityType: 'user' | 'node') => {
    const config = entityType === 'user' ? userConfig.data : nodeConfig.data;
    return config?.fields?.filter(field => field.analyticsEnabled) || [];
  };

  /**
   * Initialize analytics entry for a new field
   * Called automatically when a field is created in tenant config
   */
  const initializeFieldAnalytics = useCallback(
    async (
      entityType: 'user' | 'node',
      field: CustomField
    ) => {
      // Skip non-analyzable fields (checks metadata for excludeFromAnalytics)
      if (!isAnalyzableType(field.type, field.analytics)) {
        console.log(`Skipping analytics initialization for non-analyzable field type: ${field.type}`, {
          excludeFromAnalytics: field.analytics?.excludeFromAnalytics
        });
        return;
      }

      const currentConfig = entityType === 'user' ? userConfig.data : nodeConfig.data;
      
      if (!currentConfig) {
        console.warn('Cannot initialize analytics: config not available');
        return;
      }

      const currentFields = Array.isArray(currentConfig.fields) ? currentConfig.fields : [];
      
      // Check if field already exists
      const existingField = currentFields.find(f => f.fieldName === field.id);
      
      if (existingField) {
        // Field already exists, don't overwrite
        console.log(`Analytics entry already exists for field: ${field.id}`);
        return;
      }

      // Create new analytics entry with correct mapping (including metadata)
      const analyticsField = {
        fieldName: field.id, // Map id to fieldName
        displayName: field.label, // Map label to displayName
        type: mapTenantTypeToAnalyticsType(field.type, field.analytics), // Map type correctly with metadata
        analyticsEnabled: false, // Default to disabled
        required: field.required || false,
        options: field.options || [],
      };

      const updatedFields = [...currentFields, analyticsField];
      
      console.log(`Initializing analytics for field: ${field.id} (${field.label})`, {
        tenantType: field.type,
        analyticsType: analyticsField.type,
        format: field.analytics?.format
      });
      updateConfig.mutate({ entityType, fields: updatedFields });
    },
    [userConfig.data, nodeConfig.data, updateConfig]
  );

  /**
   * Sync analytics config with tenant config fields
   * DEPRECATED: This function is no longer needed since we're using unified model.
   * Analytics state is now stored in field.analytics.enabled (nested in TenantConfig).
   * This function is kept for backward compatibility but does nothing.
   */
  const syncAnalyticsWithTenantConfig = useCallback(
    async (
      entityType: 'user' | 'node',
      tenantFields: CustomField[]
    ) => {
      // NO-OP: Analytics is now stored in unified TenantConfig model
      // Each field has field.analytics.enabled which is managed via toggleFieldAnalytics endpoint
      // No separate sync needed - analytics state is part of the field definition
      console.log(`[syncAnalyticsWithTenantConfig] Skipped - using unified model (analytics nested in TenantConfig)`);
      return;
    },
    []
  );

  return {
    // Data
    userConfig: userConfig.data,
    nodeConfig: nodeConfig.data,
    
    // State
    isLoading,
    error,
    isUpdating: updateConfig.isPending,
    
    // Actions
    toggleFieldAnalytics,
    addAnalyticsField,
    removeAnalyticsField,
    getAnalyticsEnabledFields,
    initializeFieldAnalytics,
    syncAnalyticsWithTenantConfig,
    
    // Refetch
    refetch: () => {
      userConfig.refetch();
      nodeConfig.refetch();
    },
  };
}
