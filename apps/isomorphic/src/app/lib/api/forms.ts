import { api } from '../axios';

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

export const getUserFormSettings = async (
  filters?: UserFormSettingsFilters,
  token?: string
) => {
  const options = {
    params: {
      page: filters?.page,
      limit: filters?.limit,
      user: filters?.user,
      tenantId: filters?.tenantId,
    },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  console.log('API request with options:', options);
  const { data } = await api.get('/user-form-settings', options);
  return data;
};

export const getUserFormSettingsById = async (
  settingsId: string,
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.get(`/user-form-settings/${settingsId}`, options);
  return data;
};

export const getUserFormSettingsByUserId = async (
  userId: string,
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.get(`/user-form-settings/user/${userId}`, options);
  return data;
};

export const createUserFormSettings = async (
  payload: UserFormSettingsPayload & { user: string },
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.post('/user-form-settings', payload, options);
  return data;
};

export const updateUserFormSettings = async (
  settingsId: string,
  payload: Partial<UserFormSettingsPayload>,
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.patch(
    `/user-form-settings/${settingsId}`,
    payload,
    options
  );
  return data;
};

export const updateUserFormSettingsByUserId = async (
  userId: string,
  payload: Partial<UserFormSettingsPayload>,
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.patch(
    `/user-form-settings/user/${userId}`,
    payload,
    options
  );
  return data;
};

export const upsertUserFormSettings = async (
  userId: string,
  payload: UserFormSettingsPayload,
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.put(
    `/user-form-settings/user/${userId}`,
    payload,
    options
  );
  return data;
};

export const deleteUserFormSettings = async (
  settingsId: string,
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.delete(
    `/user-form-settings/${settingsId}`,
    options
  );
  return data;
};

export const deleteUserFormSettingsByUserId = async (
  userId: string,
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.delete(
    `/user-form-settings/user/${userId}`,
    options
  );
  return data;
};
