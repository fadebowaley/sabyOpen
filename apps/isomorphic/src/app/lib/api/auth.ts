import { api } from '../axios';

const shouldForwardCaptchaToken =
  process.env.NEXT_PUBLIC_AUTH_SEND_CAPTCHA_TOKEN === 'true';

export const login = async (
  email: string,
  password: string,
  captchaToken?: string,
  deviceId?: string
) => {
  const payload: { email: string; password: string; captchaToken?: string; deviceId?: string } = {
    email,
    password,
  };

  if (shouldForwardCaptchaToken && captchaToken) {
    payload.captchaToken = captchaToken;
  }

  if (deviceId) {
    payload.deviceId = deviceId;
  }

  const { data } = await api.post('/auth/login', payload);
  return data;
};

export const register = async (payload: {
  lastname: string;
  firstname: string;
  email: string;
  password: string;
  isOwner: boolean;
  isAgreed: boolean;
  captchaToken?: string;
}) => {
  try {
    const requestPayload = { ...payload };

    if (!shouldForwardCaptchaToken) {
      delete requestPayload.captchaToken;
    }

    const { data } = await api.post('/auth/register', requestPayload);
    return data;
  } catch (error: any) {
    console.error('Register API error:', error?.message || 'Unknown error');
    throw error;
  }
};

export const forgotPassword = async (email: string) => {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
};

export const resetPassword = async (token: string, newPassword: string) => {
  const { data } = await api.post(`/auth/reset-password?token=${token}`, {
    password: newPassword,
  });
  return data;
};

export const verifyOtp = async (otp: string, email: string) => {
  const { data } = await api.post('/auth/verify-otp', { otp, email });
  return data;
};

export const resendOtp = async (email: string) => {
  const { data } = await api.post('/auth/resend-otp', { email });
  return data;
};

export const requestPhoneLoginOtp = async (phoneNumber: string) => {
  const { data } = await api.post('/auth/phone-login/request-otp', {
    phoneNumber,
  });
  return data;
};

export const verifyPhoneLoginOtp = async (
  phoneNumber: string,
  otp: string
) => {
  const { data } = await api.post('/auth/phone-login/verify-otp', {
    phoneNumber,
    otp,
  });
  return data;
};

export const getMfaPasskeyOptions = async (mfaToken: string) => {
  const { data } = await api.post('/auth/mfa/login/passkey/options', {
    mfaToken,
  });
  return data;
};

export const verifyMfaPasskey = async (mfaToken: string, credential: any, deviceId?: string) => {
  const { data } = await api.post('/auth/mfa/login/passkey/verify', {
    mfaToken,
    credential,
    deviceId,
  });
  return data;
};

export const verifyMfaAuthenticator = async (mfaToken: string, code: string, deviceId?: string) => {
  const { data } = await api.post('/auth/mfa/login/authenticator/verify', {
    mfaToken,
    code,
    deviceId,
  });
  return data;
};

/**
 * Check user role before login to determine if API key is required
 * @param email - User email address
 * @returns Role check result with isOwner, isAdmin, requiresApiKey flags
 */
export const checkUserRole = async (email: string) => {
  try {
    const { data } = await api.get(`/auth/user-role?email=${encodeURIComponent(email)}`);
    return {
      isOwner: data.isOwner || false,
      isAdmin: data.isAdmin || false,
      requiresApiKey: data.requiresApiKey !== false,
      userRole: data.isOwner ? 'owner' : data.isAdmin ? 'admin' : 'ordinary',
    };
  } catch {
    return {
      isOwner: false,
      isAdmin: false,
      requiresApiKey: true,
      userRole: 'ordinary' as const,
    };
  }
};
