import {
  useSession,
  signIn,
  signOut as nextAuthSignOut,
} from 'next-auth/react';
import * as api from '@/app/lib/api/auth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { routes } from '@/config/routes';
import { rbacService } from '@/lib/services/rbac.service';
import { getTrustedDeviceId } from '@/app/lib/auth/trusted-device';

// ---------------------
// ✅ Payload Types
// ---------------------
type LoginPayload = {
  email: string;
  password: string;
  redirectTo?: string;
  captchaToken?: string;
  suppressNavigation?: boolean;
};

type RegisterPayload = {
  email: string;
  password: string;
  firstname: string;
  lastname: string;
  isAgreed: boolean;
  isOwner: boolean;
  redirectTo?: string;
  captchaToken?: string;
  suppressNavigation?: boolean;
};

type PhoneOtpLoginPayload = {
  phoneNumber: string;
  otp: string;
  redirectTo?: string;
  suppressNavigation?: boolean;
};

type ApiResponse = {
  success: boolean;
  data?: any;
  error?: string;
  code?: 'OTP_REQUIRED' | 'MFA_REQUIRED' | 'NAVIGATION_SKIPPED' | 'PHONE_NOT_REGISTERED';
};

// ---------------------
// ✅ useAuth Hook
// ---------------------
export const useAuth = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const getSafeRedirectPath = (path?: string) => {
    if (!path || path === '%2F') return '/';
    if (path.startsWith('/')) return path;
    return '/';
  };

  const shouldRouteUsingStudioAccess = async (user: any) => {
    if (!user) {
      return { onboardingRequired: false, billingRequired: false };
    }

    try {
      const response = await fetch('/api/studio/access-state', {
        method: 'GET',
        cache: 'no-store',
      });
      const payload: any = await response.json().catch(() => null);
      const accessState = payload?.ok ? payload?.data : null;
      const onboardingRequired = Boolean(
        accessState?.onboarding?.required && !accessState?.onboarding?.completed
      );
      const billingRequired = Boolean(
        accessState?.subscription?.accessState &&
          !accessState.subscription.accessState.isActive &&
          accessState.subscription.accessState.requiresBillingAction
      );

      return {
        onboardingRequired,
        billingRequired,
      };
    } catch {
      const explicitStatus = String(
        user?.onboardingStatus || user?.onboarding_state || ''
      )
        .trim()
        .toLowerCase();

      if (explicitStatus === 'required' || explicitStatus === 'in_progress') {
        return { onboardingRequired: true, billingRequired: false };
      }

      return { onboardingRequired: false, billingRequired: false };
    }
  };

  // ---------------------
  // 🔐 Login
  // ---------------------

const login = async ({
  email,
  password,
  redirectTo,
  captchaToken,
  suppressNavigation,
}: LoginPayload): Promise<ApiResponse> => {
  setLoading(true);
  try {
    const normalizedEmail = email.trim();
    const safeRedirectPath = getSafeRedirectPath(redirectTo);
    const signInPayload: Record<string, string | boolean> = {
      redirect: false,
      email: normalizedEmail,
      password,
      callbackUrl: safeRedirectPath,
      deviceId: getTrustedDeviceId(),
    };

    if (captchaToken) {
      signInPayload.captchaToken = captchaToken;
    }

    const result = await signIn('credentials', {
      ...signInPayload,
    });

    // 🔒 Handle OTP not verified error
    const signInError = decodeURIComponent(result?.error || '');
    if (
      signInError.includes('[OtpNotVerified]') ||
      (/otp/i.test(signInError) && /verify/i.test(signInError))
    ) {
      const otpParams = new URLSearchParams({
        email: normalizedEmail,
      });
      if (safeRedirectPath !== '/') {
        otpParams.set('callbackUrl', safeRedirectPath);
      }
      if (!suppressNavigation) {
        router.push(`${routes.auth.otp2}?${otpParams.toString()}`);
      }
      toast.error('Please verify your OTP first');
      return {
        success: false,
        error: 'Please verify your OTP first',
        code: 'OTP_REQUIRED',
      };
    }

    if (signInError.includes('[MfaRequired]')) {
      const [, rawPayload = '{}'] = signInError.split('[MfaRequired]');
      let mfaPayload: any = {};
      try {
        mfaPayload = JSON.parse(rawPayload.trim());
      } catch {
        mfaPayload = {};
      }
      return {
        success: false,
        error: 'Multi-factor authentication is required',
        code: 'MFA_REQUIRED',
        data: mfaPayload,
      };
    }

    // ✅ Login successful
    if (result?.ok) {
      toast.success('Login successful!');
      
      // Get session to determine role-based redirect
      const newSession = (await fetch('/api/auth/session').then((res) => res.json())) as {
        user?: any;
      };

      // CLI login handoff: when the session was started from the terminal
      // (?cli_callback=), send the tokens to the local callback server instead
      // of navigating into the app. Clear the marker so it fires only once.
      const cliCallback = sessionStorage.getItem('sabyCliCallback');
      if (cliCallback && newSession?.user?.accessToken) {
        sessionStorage.removeItem('sabyCliCallback');
        window.location.replace(
          cliCallback +
            '#' +
            encodeURIComponent(
              JSON.stringify({
                accessToken: newSession.user.accessToken,
                refreshToken: newSession.user.refreshToken,
                name: newSession.user.name,
                email: newSession.user.email,
              })
            )
        );
        return { success: true };
      }

      if (suppressNavigation) {
        return { success: true, data: newSession, code: 'NAVIGATION_SKIPPED' };
      }
      
      if (newSession?.user) {
        const { billingRequired: subscriptionBillingRequired } =
          await shouldRouteUsingStudioAccess(newSession.user);
        // Use RBAC service to get role-based redirect URL
        const redirectUrl =
          subscriptionBillingRequired &&
              (safeRedirectPath === '/' ||
                safeRedirectPath.startsWith(routes.studioV2.index))
            ? routes.billing
          : safeRedirectPath !== '/'
          ? safeRedirectPath
          : rbacService.getLoginRedirectUrl(newSession.user);
        console.log('🔐 Redirecting to:', redirectUrl, 'for user role:', {
          isSuper: newSession.user.isSuper,
          isOwner: newSession.user.isOwner,
          isSaby: newSession.user.isSaby,
          isAdmin: newSession.user.isAdmin,
        });
        router.push(redirectUrl);
      } else {
        // Fallback to default URL
        router.push(result.url || safeRedirectPath);
      }
      
      return { success: true };
    }

    // ❌ Other failure (e.g., wrong password, no redirect)
    if (result?.error) {
      const normalizedError = result.error.includes('captchaToken')
        ? 'Login security token is currently incompatible with backend auth configuration.'
        : result.error;
      toast.error(normalizedError);
      return { success: false, error: normalizedError };
    }

    // 🛑 Unknown fallback
    toast.error('Login failed due to unknown error.');
    return { success: false };
  } catch (err: any) {
    console.error('Login error:', err);
    toast.error(err.message || 'Login failed');
    return { success: false, error: err.message || 'Login failed' };
  } finally {
    setLoading(false);
  }
};

const loginWithPhoneOtp = async ({
  phoneNumber,
  otp,
  redirectTo,
  suppressNavigation,
}: PhoneOtpLoginPayload): Promise<ApiResponse> => {
  setLoading(true);
  try {
    const safeRedirectPath = getSafeRedirectPath(redirectTo);
    const result = await signIn('phone-otp', {
      redirect: false,
      phoneNumber: phoneNumber.trim(),
      otp: otp.trim(),
      callbackUrl: safeRedirectPath,
    });

    if (result?.ok) {
      toast.success('Login successful!');
      const newSession = (await fetch('/api/auth/session').then((res) =>
        res.json()
      )) as {
        user?: any;
      };

      if (suppressNavigation) {
        return { success: true, data: newSession, code: 'NAVIGATION_SKIPPED' };
      }

      if (newSession?.user) {
        const { billingRequired: subscriptionBillingRequired } =
          await shouldRouteUsingStudioAccess(newSession.user);
        const redirectUrl =
          subscriptionBillingRequired &&
              (safeRedirectPath === '/' ||
                safeRedirectPath.startsWith(routes.studioV2.index))
            ? routes.billing
          : safeRedirectPath !== '/'
          ? safeRedirectPath
          : rbacService.getLoginRedirectUrl(newSession.user);
        router.push(redirectUrl);
      } else {
        router.push(safeRedirectPath);
      }
      return { success: true };
    }

    if (result?.error) {
      const errorMessage = decodeURIComponent(result.error);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }

    return { success: false, error: 'Phone login failed' };
  } catch (err: any) {
    console.error('Phone OTP login error:', err);
    return { success: false, error: err?.message || 'Phone login failed' };
  } finally {
    setLoading(false);
  }
};

const requestPhoneOtp = async (phoneNumber: string): Promise<ApiResponse> => {
  setLoading(true);
  try {
    const data = await api.requestPhoneLoginOtp(phoneNumber);
    return { success: true, data };
  } catch (err: any) {
    if (err?.response?.status === 404) {
      const errorMessage =
        err?.response?.data?.message ||
        'No account found for this phone number. Please create an account.';
      return {
        success: false,
        error: errorMessage,
        code: 'PHONE_NOT_REGISTERED',
      };
    }
    const errorMessage =
      err?.response?.data?.message || 'Failed to send phone OTP';
    return { success: false, error: errorMessage };
  } finally {
    setLoading(false);
  }
};

  // ---------------------
  // 🚪 Logout
  // ---------------------
  const logout = async () => {
    try {
      // Clear all local storage
      localStorage.clear();
      sessionStorage.clear();
      // Sign out from NextAuth
      await nextAuthSignOut({ redirect: false });
      
      // Force reload to clear all session data
      window.location.href = '/auth/sign-in';
      
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if logout fails
      window.location.href = '/auth/sign-in';
    }
  };

  const register = async (payload: RegisterPayload): Promise<ApiResponse> => {
    setLoading(true);
    try {
      const { redirectTo, captchaToken, suppressNavigation, ...registerPayload } = payload;
      const safeRedirectPath = getSafeRedirectPath(redirectTo);
      const data = await api.register({
        ...registerPayload,
        ...(captchaToken ? { captchaToken } : {}),
      });
      toast.success('Registration successful. Please verify your email.');

      if (suppressNavigation) {
        return { success: true, data, code: 'OTP_REQUIRED' };
      }

      // 🔁 Redirect to OTP verification page instead of login
      const otpParams = new URLSearchParams({
        email: payload.email,
      });
      if (safeRedirectPath !== '/') {
        otpParams.set('callbackUrl', safeRedirectPath);
      }
      router.push(`${routes.auth.otp2}?${otpParams.toString()}`);

      return { success: true, data };
    } catch (err: any) {
      console.error('Registration error:', err);
      const status = err?.response?.status;
      const backendMessage = err?.response?.data?.message;
      const mappedError =
        status === 500
          ? 'Registration service is unavailable right now (server error). Please try again later.'
          : backendMessage || 'Registration failed';
      toast.error(mappedError);
      return {
        success: false,
        error: mappedError,
      };
    } finally {
      setLoading(false);
    }
  };

  // ---------------------
  // ❓ Forgot Password
  // ---------------------
  const forgotPassword = async (email: string): Promise<ApiResponse> => {
    setLoading(true);
    try {
      const data = await api.forgotPassword(email);
      //toast.success('Password reset link sent');
      return { success: true, data };
    } catch (err: any) {
      console.error('Forgot password error:', err);
      toast.error(
        err?.response?.data?.message || 'Error sending password reset link'
      );
      return {
        success: false,
        error:
          err?.response?.data?.message || 'Error sending password reset link',
      };
    } finally {
      setLoading(false);
    }
  };

  // ---------------------
  // 🔁 Reset Password
  // ---------------------
  const resetPassword = async (
    token: string,
    newPassword: string
  ): Promise<ApiResponse> => {
    setLoading(true);
    try {
      console.log('were are about reseting password . . .', token);
      const data = await api.resetPassword(token, newPassword);
      toast.success('Password reset successful');
      console.log('our response from the server --- >', data);
      return { success: true, data };
    } catch (err: any) {
      console.error('Reset password error:', err);
      toast.error(err?.response?.data?.message || 'Error resetting password');
      return {
        success: false,
        error: err?.response?.data?.message || 'Error resetting password',
      };
    } finally {
      setLoading(false);
    }
  };

  // ---------------------
  // 🔐 OTP Verification
  // ---------------------
  const verifyOtp = async (
    otp: string,
    email: string
  ): Promise<ApiResponse> => {
    setLoading(true);
    try {
      const data = await api.verifyOtp(otp, email);
      toast.success('OTP verification successful');
      return { success: true, data };
    } catch (err: any) {
      console.error('OTP verification error:', err);
      toast.error(err?.response?.data?.message || 'OTP verification failed');
      return {
        success: false,
        error: err?.response?.data?.message || 'OTP verification failed',
      };
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async (email: string): Promise<ApiResponse> => {
    setLoading(true);
    try {
      const data = await api.resendOtp(email);
      toast.success('OTP resent successfully');
      return { success: true, data };
    } catch (err: any) {
      console.error('Resend OTP error:', err);
      toast.error(err?.response?.data?.message || 'Failed to resend OTP');
      return {
        success: false,
        error: err?.response?.data?.message || 'Failed to resend OTP',
      };
    } finally {
      setLoading(false);
    }
  };
return {
  session,
  user: session?.user,
  isAuthenticated: status === 'authenticated',
  isLoading: status === 'loading' || loading,
  login,
  logout,
  register,
  forgotPassword,
  resetPassword,
  verifyOtp,
  resendOtp,
  requestPhoneOtp,
  loginWithPhoneOtp,
};
};
