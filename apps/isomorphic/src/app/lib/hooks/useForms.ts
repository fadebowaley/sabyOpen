import { useState, useCallback } from 'react';
import * as api from '@/app/lib/api/forms';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';

type ApiResponse = {
  success: boolean;
  data?: any;
  error?: string;
};

interface UserFormSettingsFilters {
  page?: number;
  limit?: number;
  user?: string;
  tenantId?: string;
}

interface FormSettingsData {
  access?: {
    type?: 'public' | 'role-based' | 'invite-only';
    requiresLogin?: boolean;
    allowedRoles?: string[];
    submissionLimit?: number;
    allowMultipleSubmissions?: boolean;
    allowAnonymous?: boolean;
  };
  behavior?: {
    autosave?: boolean;
    saveDraft?: boolean;
    allowResubmission?: boolean;
    showProgressBar?: boolean;
    timeoutInMinutes?: number;
    redirectAfterSubmit?: string;
    customSuccessMessage?: string;
  };
  distribution?: {
    enablePublicUrl?: boolean;
    enablePrivateUrl?: boolean;
    enableHtmlEmbed?: boolean;
    enableApiSubmission?: boolean;
    enableJsEmbed?: boolean;
    customDomain?: string;
  };
  notifications?: {
    onSubmit?: {
      sendToUser?: boolean;
      sendToOwner?: boolean;
      emailTemplateId?: string;
      customEmails?: string[];
    };
    onFailure?: {
      sendToOwner?: boolean;
      emailTemplateId?: string;
    };
  };
  ui?: {
    theme?: 'light' | 'dark' | 'auto' | 'custom';
    layout?: 'single-page' | 'multi-step' | 'wizard';
    branding?: {
      logoUrl?: string;
      primaryColor?: string;
      backgroundColor?: string;
      fontFamily?: string;
      customCss?: string;
    };
    language?: string;
    showFormTitle?: boolean;
    showFormDescription?: boolean;
  };
  builder?: {
    selectedStyle?: string;
    wizardMode?: boolean;
    columnSpans?: Record<string, number>;
    elements?: any[];
    formLayout?: {
      spacing?: 'compact' | 'normal' | 'comfortable';
      labelPosition?: 'top' | 'left' | 'floating';
      buttonAlignment?: 'left' | 'center' | 'right';
    };
    validation?: {
      showRequiredAsterisk?: boolean;
      validateOnSubmit?: boolean;
      validateOnBlur?: boolean;
    };
  };
}

interface UserFormSettingsPayload {
  tenantId?: string;
  defaultFormSettings: FormSettingsData;
}

export const useForms = () => {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  // Utility function for API requests
  const apiRequest = useCallback(
    async (apiFunc: Function, params: any[] = []): Promise<ApiResponse> => {
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

  const getUserFormSettings = useCallback(
    async (filters?: UserFormSettingsFilters): Promise<ApiResponse> => {
      console.log('getUserFormSettings called with filters:', filters);
      return apiRequest(api.getUserFormSettings, [filters]);
    },
    [apiRequest]
  );

  const getUserFormSettingsById = useCallback(
    async (settingsId: string): Promise<ApiResponse> => {
      console.log('getUserFormSettingsById called with settingsId:', settingsId);
      return apiRequest(api.getUserFormSettingsById, [settingsId]);
    },
    [apiRequest]
  );

  const getUserFormSettingsByUserId = useCallback(
    async (userId: string): Promise<ApiResponse> => {
    console.log('getUserFormSettingsByUserId called with settingsId:',userId);
      return apiRequest(api.getUserFormSettingsByUserId, [userId]);
    },
    [apiRequest]
  );

  const createUserFormSettings = useCallback(
    async (
      payload: UserFormSettingsPayload & { user: string }
    ): Promise<ApiResponse> => {
      return apiRequest(api.createUserFormSettings, [payload]);
    },
    [apiRequest]
  );

  const updateUserFormSettings = useCallback(
    async (
      settingsId: string,
      payload: Partial<UserFormSettingsPayload>
    ): Promise<ApiResponse> => {
      return apiRequest(api.updateUserFormSettings, [settingsId, payload]);
    },
    [apiRequest]
  );

  const updateUserFormSettingsByUserId = useCallback(
    async (
      userId: string,
      payload: Partial<UserFormSettingsPayload>
    ): Promise<ApiResponse> => {
      return apiRequest(api.updateUserFormSettingsByUserId, [userId, payload]);
    },
    [apiRequest]
  );

  const upsertUserFormSettings = useCallback(
    async (
      userId: string,
      payload: UserFormSettingsPayload
    ): Promise<ApiResponse> => {
      return apiRequest(api.upsertUserFormSettings, [userId, payload]);
    },
    [apiRequest]
  );

  const deleteUserFormSettings = useCallback(
    async (settingsId: string): Promise<ApiResponse> => {
      return apiRequest(api.deleteUserFormSettings, [settingsId]);
    },
    [apiRequest]
  );

  const deleteUserFormSettingsByUserId = useCallback(
    async (userId: string): Promise<ApiResponse> => {
      return apiRequest(api.deleteUserFormSettingsByUserId, [userId]);
    },
    [apiRequest]
  );

  return {
    loading,
    getUserFormSettings,
    getUserFormSettingsById,
    getUserFormSettingsByUserId,
    createUserFormSettings,
    updateUserFormSettings,
    updateUserFormSettingsByUserId,
    upsertUserFormSettings,
    deleteUserFormSettings,
    deleteUserFormSettingsByUserId,
  };
};
