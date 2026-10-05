'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import {
  Eye,
  EyeOff,
  Fingerprint,
  LifeBuoy,
  Phone,
  ScanFace,
  X,
} from 'lucide-react';
import { PiAppleLogoFill } from 'react-icons/pi';
import GoogleIcon from '@core/components/icons/google';
import { useAuth } from '@/app/lib/hooks/useAuth';
import * as authApi from '@/app/lib/api/auth';
import { useRecaptcha } from '@/app/lib/hooks/useRecaptcha';
import { getTrustedDeviceId } from '@/app/lib/auth/trusted-device';
import { PUBLIC_THEME_STORAGE_KEY } from '@/app/shared/public-site/use-public-theme';
import { routes } from '@/config/routes';
import { loginSchema } from '@/validators/login.schema';
import { signUpSchema } from '@/validators/signup.schema';

type AuthView =
  | 'login'
  | 'signup'
  | 'forgot'
  | 'otp'
  | 'reset'
  | 'phone'
  | 'mfa';

type LoginFormState = {
  email: string;
  password: string;
};

type SignUpFormState = {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  confirmPassword: string;
  isAgreed: boolean;
};

type AuthFieldErrors = Partial<
  Record<keyof SignUpFormState | 'email' | 'password', string>
>;

type PublicAuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  callbackPath?: string;
  isLightTheme?: boolean;
  title?: string;
  description?: string;
  initialView?: AuthView;
  initialError?: string | null;
  signupAsOwner?: boolean;
};

type ProviderCapabilities = {
  credentials: boolean;
  google: boolean;
  apple: boolean;
  phone: boolean;
};

const PHONE_OTP_LENGTH = 6;

type MfaChallengeMethod = 'passkey' | 'authenticator';

const base64UrlToArrayBuffer = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    '='
  );
  const binary = window.atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
};

const arrayBufferToBase64Url = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let index = 0; index < bytes.byteLength; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return window
    .btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
};

const preparePasskeyRequestOptions = (
  options: any
): PublicKeyCredentialRequestOptions => ({
  ...options,
  challenge: base64UrlToArrayBuffer(options.challenge),
  allowCredentials: Array.isArray(options.allowCredentials)
    ? options.allowCredentials.map((credential: any) => ({
        ...credential,
        id: base64UrlToArrayBuffer(credential.id),
      }))
    : undefined,
});

const serializePasskeyAssertion = (credential: PublicKeyCredential) => {
  const response = credential.response as AuthenticatorAssertionResponse;
  return {
    id: credential.id,
    rawId: arrayBufferToBase64Url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: arrayBufferToBase64Url(response.clientDataJSON),
      authenticatorData: arrayBufferToBase64Url(response.authenticatorData),
      signature: arrayBufferToBase64Url(response.signature),
      userHandle: response.userHandle
        ? arrayBufferToBase64Url(response.userHandle)
        : null,
    },
    authenticatorAttachment: credential.authenticatorAttachment || null,
    clientExtensionResults:
      typeof credential.getClientExtensionResults === 'function'
        ? credential.getClientExtensionResults()
        : {},
  };
};

const getInheritedLightTheme = () => {
  if (typeof window === 'undefined') return false;
  const storedTheme = window.localStorage.getItem(PUBLIC_THEME_STORAGE_KEY);
  if (storedTheme === 'light') return true;
  if (storedTheme === 'dark') return false;
  const activeTheme = document.documentElement.dataset.theme;
  if (activeTheme === 'light') return true;
  if (activeTheme === 'dark') return false;
  return false;
};

const getSafeCallbackPath = (value?: string) => {
  if (!value || value === '%2F') return '/';
  if (!value.startsWith('/')) return '/';
  return value;
};

export default function PublicAuthModal({
  isOpen,
  onClose,
  callbackPath,
  isLightTheme: isLightThemeProp,
  title,
  description,
  initialView = 'login',
  initialError = null,
  signupAsOwner = false,
}: PublicAuthModalProps) {
  const router = useRouter();
  const {
    login: loginWithCredentials,
    register: registerUser,
    forgotPassword: requestForgotPassword,
    resetPassword: submitResetPassword,
    verifyOtp: verifyOtpCode,
    resendOtp: resendOtpCode,
    requestPhoneOtp,
    loginWithPhoneOtp,
  } = useAuth();
  const {
    isEnabled: isCaptchaEnabled,
    isReady: isCaptchaReady,
    error: captchaError,
    execute: executeCaptcha,
  } = useRecaptcha();

  const safeCallback = useMemo(
    () => getSafeCallbackPath(callbackPath),
    [callbackPath]
  );

  const [authView, setAuthView] = useState<AuthView>(initialView);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authInfo, setAuthInfo] = useState<string | null>(null);
  const [authFieldErrors, setAuthFieldErrors] = useState<AuthFieldErrors>({});
  const [inheritedIsLightTheme, setInheritedIsLightTheme] = useState(
    getInheritedLightTheme
  );
  const [providerCapabilities, setProviderCapabilities] =
    useState<ProviderCapabilities>({
      credentials: true,
      google: false,
      apple: false,
      phone: false,
    });

  const [loginForm, setLoginForm] = useState<LoginFormState>({
    email: '',
    password: '',
  });
  const [signUpForm, setSignUpForm] = useState<SignUpFormState>({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    confirmPassword: '',
    isAgreed: false,
  });

  const [forgotEmail, setForgotEmail] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [phoneLoginNumber, setPhoneLoginNumber] = useState('');
  const [phoneLoginOtpDigits, setPhoneLoginOtpDigits] = useState<string[]>(
    Array(PHONE_OTP_LENGTH).fill('')
  );
  const [mfaToken, setMfaToken] = useState('');
  const [mfaMethods, setMfaMethods] = useState<{
    authenticator?: boolean;
    passkey?: boolean;
  }>({});
  const [mfaCode, setMfaCode] = useState('');
  const [mfaChallengeMethod, setMfaChallengeMethod] =
    useState<MfaChallengeMethod>('passkey');
  const [phoneLoginOtpRequested, setPhoneLoginOtpRequested] = useState(false);
  const phoneOtpInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const mfaCodeInputRef = useRef<HTMLInputElement | null>(null);
  const [showPrimaryPassword, setShowPrimaryPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] =
    useState(false);
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] =
    useState(false);
  const [pendingAuthCredentials, setPendingAuthCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const shouldRenderTopStatusBanner = Boolean(
    authView === 'login' &&
      (authInfo || authError) &&
      (authSubmitting ||
        /redirecting you to (google|apple)/i.test(String(authInfo || '')))
  );
  const isLightTheme = isLightThemeProp ?? inheritedIsLightTheme;

  useEffect(() => {
    if (!isOpen || isLightThemeProp !== undefined) return;
    setInheritedIsLightTheme(getInheritedLightTheme());
  }, [isLightThemeProp, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setAuthView(initialView);
    setAuthError(initialError);
    setAuthInfo(null);
    setAuthFieldErrors({});
    setShowPrimaryPassword(false);
    setShowSignupConfirmPassword(false);
    setShowResetNewPassword(false);
    setShowResetConfirmPassword(false);
    setPhoneLoginOtpRequested(false);
    setPhoneLoginOtpDigits(Array(PHONE_OTP_LENGTH).fill(''));
  }, [initialError, initialView, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    const loadProviders = async () => {
      try {
        const response = await fetch('/api/auth/providers');
        const payload = (await response.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;
        if (!mounted) return;
        const keys = Object.keys(payload || {});
        setProviderCapabilities({
          credentials: keys.includes('credentials'),
          google: keys.includes('google'),
          apple: keys.includes('apple'),
          phone: keys.includes('phone-otp'),
        });
      } catch {
        if (!mounted) return;
        setProviderCapabilities((current) => ({
          ...current,
          credentials: true,
          google: false,
          apple: false,
          phone: false,
        }));
      }
    };
    void loadProviders();
    return () => {
      mounted = false;
    };
  }, [isOpen]);

  const clearAuthValidation = () => {
    setAuthError(null);
    setAuthInfo(null);
    setAuthFieldErrors({});
  };

  const closeModal = () => {
    setAuthSubmitting(false);
    clearAuthValidation();
    onClose();
  };

  const finalizeSuccess = () => {
    closeModal();
    router.push(safeCallback);
    router.refresh();
  };

  const getCaptchaToken = async (action: string) => {
    if (!isCaptchaEnabled) return undefined;

    if (!isCaptchaReady) {
      setAuthError(
        'Security check is still loading. Please wait and try again.'
      );
      return null;
    }

    try {
      const result = await executeCaptcha(action);
      return result.token;
    } catch {
      setAuthError('Unable to complete Google reCAPTCHA verification.');
      return null;
    }
  };

  const handleAuthProviderClick = async (
    provider: 'google' | 'apple' | 'phone'
  ) => {
    if (provider === 'google') {
      clearAuthValidation();
      setAuthSubmitting(true);
      setAuthInfo('Redirecting you to Google secure sign-in...');
      try {
        await signIn('google', { callbackUrl: safeCallback });
      } catch {
        setAuthSubmitting(false);
        setAuthError(
          'Unable to start Google login right now. Please try again.'
        );
      }
      return;
    }
    if (provider === 'apple') {
      clearAuthValidation();
      setAuthSubmitting(true);
      setAuthInfo('Redirecting you to Apple secure sign-in...');
      try {
        await signIn('apple', { callbackUrl: safeCallback });
      } catch {
        setAuthSubmitting(false);
        setAuthError(
          'Unable to start Apple login right now. Please try again.'
        );
      }
      return;
    }
    if (provider === 'phone') {
      setAuthView('phone');
      clearAuthValidation();
      setPhoneLoginOtpRequested(false);
      setPhoneLoginOtpDigits(Array(PHONE_OTP_LENGTH).fill(''));
      return;
    }
  };

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearAuthValidation();

    const parsed = loginSchema.safeParse({
      email: loginForm.email,
      password: loginForm.password,
      rememberMe: true,
    });

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setAuthFieldErrors({
        email: errors.email?.[0],
        password: errors.password?.[0],
      });
      return;
    }

    const captchaToken = await getCaptchaToken('public_auth_login');
    if (captchaToken === null) return;

    setAuthSubmitting(true);
    const response = await loginWithCredentials({
      email: loginForm.email,
      password: loginForm.password,
      redirectTo: safeCallback,
      captchaToken,
      suppressNavigation: true,
    });
    setAuthSubmitting(false);

    if (!response.success) {
      if (response.code === 'OTP_REQUIRED') {
        setOtpEmail(loginForm.email.trim());
        setOtpCode('');
        setPendingAuthCredentials({
          email: loginForm.email.trim(),
          password: loginForm.password,
        });
        setAuthView('otp');
        setAuthInfo(
          'Enter the 6-digit OTP sent to your email to complete sign in.'
        );
        return;
      }

      if (response.code === 'MFA_REQUIRED') {
        const methods = response.data?.methods || {};
        setMfaToken(String(response.data?.mfaToken || ''));
        setMfaMethods(methods);
        setMfaChallengeMethod(methods.passkey ? 'passkey' : 'authenticator');
        setMfaCode('');
        setAuthView('mfa');
        setAuthInfo(null);
        return;
      }

      setAuthError(
        response.error || 'Unable to sign in with those credentials.'
      );
      return;
    }

    finalizeSuccess();
  };

  const handleSignUpSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearAuthValidation();

    const parsed = signUpSchema.safeParse({
      ...signUpForm,
      isOwner: signupAsOwner,
    });

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setAuthFieldErrors({
        firstname: errors.firstname?.[0],
        lastname: errors.lastname?.[0],
        email: errors.email?.[0],
        password: errors.password?.[0],
        confirmPassword: errors.confirmPassword?.[0],
        isAgreed: errors.isAgreed?.[0],
      });
      return;
    }

    if (signUpForm.password !== signUpForm.confirmPassword) {
      setAuthFieldErrors((previous) => ({
        ...previous,
        confirmPassword: 'Passwords do not match.',
      }));
      return;
    }

    const captchaToken = await getCaptchaToken('public_auth_signup');
    if (captchaToken === null) return;

    setAuthSubmitting(true);
    const response = await registerUser({
      email: signUpForm.email,
      password: signUpForm.password,
      firstname: signUpForm.firstname,
      lastname: signUpForm.lastname,
      isAgreed: signUpForm.isAgreed,
      isOwner: signupAsOwner,
      redirectTo: safeCallback,
      captchaToken,
      suppressNavigation: true,
    });
    setAuthSubmitting(false);

    if (!response.success) {
      setAuthError(response.error || 'Unable to create account right now.');
      return;
    }

    setOtpEmail(signUpForm.email.trim());
    setOtpCode('');
    setPendingAuthCredentials({
      email: signUpForm.email.trim(),
      password: signUpForm.password,
    });
    setAuthView('otp');
    setAuthInfo('Account created. Verify the OTP to activate your workspace.');
  };

  const handleForgotPasswordSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    clearAuthValidation();

    if (!forgotEmail.trim()) {
      setAuthError('Please enter your email address.');
      return;
    }

    setAuthSubmitting(true);
    const response = await requestForgotPassword(forgotEmail.trim());
    setAuthSubmitting(false);

    if (!response.success) {
      setAuthError(
        response.error || 'Unable to send reset instructions right now.'
      );
      return;
    }

    setAuthView('reset');
    setAuthInfo(
      'A reset token has been issued. Paste it below with a new password.'
    );
  };

  const handleResetPasswordSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    clearAuthValidation();

    if (!resetToken.trim()) {
      setAuthError('Reset token is required.');
      return;
    }
    if (!resetNewPassword) {
      setAuthError('Please enter a new password.');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }

    setAuthSubmitting(true);
    const response = await submitResetPassword(
      resetToken.trim(),
      resetNewPassword
    );
    setAuthSubmitting(false);

    if (!response.success) {
      setAuthError(response.error || 'Unable to reset password right now.');
      return;
    }

    setAuthView('login');
    setAuthInfo('Password reset successful. You can now sign in.');
  };

  const handleOtpSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearAuthValidation();

    if (!otpEmail) {
      setAuthError('Missing OTP email context. Restart sign in.');
      return;
    }

    if (otpCode.length !== 6) {
      setAuthError('Enter the full 6-digit OTP.');
      return;
    }

    setAuthSubmitting(true);
    const verifyResponse = await verifyOtpCode(otpCode, otpEmail);
    if (!verifyResponse.success) {
      setAuthSubmitting(false);
      setAuthError(verifyResponse.error || 'OTP verification failed.');
      return;
    }

    if (!pendingAuthCredentials) {
      setAuthSubmitting(false);
      setAuthView('login');
      setAuthInfo('OTP verified. You can sign in now.');
      return;
    }

    const captchaToken = await getCaptchaToken('public_auth_login');
    if (captchaToken === null) {
      setAuthSubmitting(false);
      return;
    }

    const loginResponse = await loginWithCredentials({
      email: pendingAuthCredentials.email,
      password: pendingAuthCredentials.password,
      redirectTo: safeCallback,
      captchaToken,
      suppressNavigation: true,
    });

    setAuthSubmitting(false);

    if (!loginResponse.success) {
      setAuthError(loginResponse.error || 'OTP verified, but login failed.');
      return;
    }

    setPendingAuthCredentials(null);
    finalizeSuccess();
  };

  const completeMfaSession = async (payload: Record<string, string>) => {
    const result = await signIn('mfa', {
      redirect: false,
      callbackUrl: safeCallback,
      deviceId: getTrustedDeviceId(),
      ...payload,
    });
    if (!result?.ok) {
      throw new Error(result?.error || 'MFA verification failed.');
    }
  };

  const handleMfaAuthenticatorSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    clearAuthValidation();
    const code = mfaCode.replace(/\D/g, '').slice(0, 6);
    if (!mfaToken) {
      setAuthError('MFA challenge has expired. Please sign in again.');
      return;
    }
    if (code.length !== 6) {
      setAuthError('Enter the full 6-digit authenticator code.');
      return;
    }

    setAuthSubmitting(true);
    try {
      await completeMfaSession({
        mfaToken,
        method: 'authenticator',
        code,
      });
      finalizeSuccess();
    } catch (error: any) {
      setAuthError(error?.message || 'Authenticator verification failed.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handlePasskeyMfa = async () => {
    clearAuthValidation();
    if (!mfaToken) {
      setAuthError('MFA challenge has expired. Please sign in again.');
      return;
    }
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      setAuthError('This browser does not support passkeys.');
      return;
    }

    setAuthSubmitting(true);
    try {
      const optionsPayload = await authApi.getMfaPasskeyOptions(mfaToken);
      const credential = (await navigator.credentials.get({
        publicKey: preparePasskeyRequestOptions(optionsPayload.publicKey),
      })) as PublicKeyCredential | null;
      if (!credential) throw new Error('Passkey verification was cancelled.');

      await completeMfaSession({
        mfaToken,
        method: 'passkey',
        credential: JSON.stringify(serializePasskeyAssertion(credential)),
      });
      finalizeSuccess();
    } catch (error: any) {
      setAuthError(
        error?.response?.data?.message ||
          error?.message ||
          'Passkey verification failed.'
      );
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleUseAuthenticatorMfa = () => {
    clearAuthValidation();
    setMfaChallengeMethod('authenticator');
    setTimeout(() => {
      mfaCodeInputRef.current?.focus();
    }, 0);
  };

  const handleResendOtp = async () => {
    clearAuthValidation();
    if (!otpEmail) {
      setAuthError('Missing OTP email. Restart sign in.');
      return;
    }

    setAuthSubmitting(true);
    const response = await resendOtpCode(otpEmail);
    setAuthSubmitting(false);

    if (!response.success) {
      setAuthError(response.error || 'Unable to resend OTP right now.');
      return;
    }

    setAuthInfo(`A new OTP has been sent to ${otpEmail}.`);
  };

  const handlePhoneOtpDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setPhoneLoginOtpDigits((previous) => {
      const next = [...previous];
      next[index] = digit;
      return next;
    });
    if (digit && index < PHONE_OTP_LENGTH - 1) {
      phoneOtpInputRefs.current[index + 1]?.focus();
    }
  };

  const handlePhoneOtpDigitKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === 'Backspace' && !phoneLoginOtpDigits[index] && index > 0) {
      phoneOtpInputRefs.current[index - 1]?.focus();
      return;
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      phoneOtpInputRefs.current[index - 1]?.focus();
      return;
    }
    if (event.key === 'ArrowRight' && index < PHONE_OTP_LENGTH - 1) {
      event.preventDefault();
      phoneOtpInputRefs.current[index + 1]?.focus();
    }
  };

  const handlePhoneOtpPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const digits = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, PHONE_OTP_LENGTH)
      .split('');
    if (!digits.length) return;
    const next = Array(PHONE_OTP_LENGTH).fill('');
    digits.forEach((digit, idx) => {
      next[idx] = digit;
    });
    setPhoneLoginOtpDigits(next);
    const focusIndex = Math.min(digits.length, PHONE_OTP_LENGTH) - 1;
    if (focusIndex >= 0) {
      phoneOtpInputRefs.current[focusIndex]?.focus();
    }
  };

  const handlePhoneRequestOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearAuthValidation();
    if (!phoneLoginNumber.trim()) {
      setAuthError('Please enter your phone number.');
      return;
    }

    setAuthSubmitting(true);
    const response = await requestPhoneOtp(phoneLoginNumber.trim());
    setAuthSubmitting(false);

    if (!response.success) {
      if (response.code === 'PHONE_NOT_REGISTERED') {
        setAuthView('signup');
        setPhoneLoginOtpRequested(false);
        setPhoneLoginOtpDigits(Array(PHONE_OTP_LENGTH).fill(''));
        setAuthInfo(
          'No account found with this phone number. Create your account to continue.'
        );
        setAuthError(null);
        return;
      }
      setAuthError(response.error || 'Unable to send OTP right now.');
      return;
    }

    setPhoneLoginOtpRequested(true);
    setPhoneLoginOtpDigits(Array(PHONE_OTP_LENGTH).fill(''));
    setAuthInfo('Enter the OTP sent to your phone to continue.');
    setTimeout(() => {
      phoneOtpInputRefs.current[0]?.focus();
    }, 0);
  };

  const handlePhoneLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearAuthValidation();
    if (!phoneLoginNumber.trim()) {
      setAuthError('Please enter your phone number.');
      return;
    }
    const normalizedPhoneOtp = phoneLoginOtpDigits.join('');
    if (normalizedPhoneOtp.length !== PHONE_OTP_LENGTH) {
      setAuthError('Enter the full 6-digit OTP.');
      return;
    }

    setAuthSubmitting(true);
    const response = await loginWithPhoneOtp({
      phoneNumber: phoneLoginNumber.trim(),
      otp: normalizedPhoneOtp,
      redirectTo: safeCallback,
      suppressNavigation: true,
    });
    setAuthSubmitting(false);

    if (!response.success) {
      setAuthError(response.error || 'Phone login failed.');
      return;
    }

    finalizeSuccess();
  };

  const handleBackToLogin = () => {
    setAuthView('login');
    clearAuthValidation();
    setMfaToken('');
    setMfaMethods({});
    setMfaCode('');
    setMfaChallengeMethod('passkey');
    setPhoneLoginOtpRequested(false);
    setPhoneLoginOtpDigits(Array(PHONE_OTP_LENGTH).fill(''));
  };

  if (!isOpen) return null;

  const baseDescription =
    description || 'Log in or create your account to continue.';
  const hasPasskeyMfa = Boolean(mfaMethods.passkey);
  const hasAuthenticatorMfa = Boolean(mfaMethods.authenticator);
  const hasMultipleMfaMethods = hasPasskeyMfa && hasAuthenticatorMfa;
  const showPasskeyMfa =
    hasPasskeyMfa && (!hasAuthenticatorMfa || mfaChallengeMethod === 'passkey');
  const showAuthenticatorMfa =
    hasAuthenticatorMfa &&
    (!hasPasskeyMfa || mfaChallengeMethod === 'authenticator');

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-3 py-4 backdrop-blur-[2px] sm:px-4"
      onClick={closeModal}
    >
      <div
        className={`saby-auth-modal relative max-h-[92vh] w-full overflow-y-auto rounded-[22px] border p-4 shadow-[0_28px_56px_rgba(0,0,0,0.6)] sm:rounded-[24px] sm:p-5 ${
          authView === 'mfa'
            ? 'max-w-[410px] sm:max-w-[430px]'
            : 'max-w-[440px] sm:max-w-[460px]'
        } ${
          isLightTheme
            ? 'border-[#d7e0ef] bg-white'
            : 'saby-auth-modal-dark border-white/10 bg-[#262830]'
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={closeModal}
          className={`absolute right-3 top-3 rounded-full p-2 transition sm:right-4 sm:top-4 ${
            isLightTheme
              ? 'text-[#4d5d79] hover:bg-[#eef3ff] hover:text-[#111827]'
              : 'text-[#d5d7e0] hover:bg-white/10 hover:text-white'
          }`}
          aria-label="Close auth modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div
          className={`px-1 pb-1 ${
            authView === 'mfa' ? 'pt-2 sm:px-1 sm:pt-3' : 'pt-4 sm:px-2 sm:pt-6'
          }`}
        >
          {authView === 'mfa' && (
            <>
              <div
                className={`mx-auto mb-4 flex max-w-[360px] items-center justify-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold ${
                  isLightTheme
                    ? 'bg-[#f4f6fa] text-[#12213c]'
                    : 'bg-white/[0.08] text-white'
                }`}
              >
                <span className="min-w-0 truncate">
                  {loginForm.email.trim() || 'Your Saby account'}
                </span>
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className={`shrink-0 font-bold transition ${
                    isLightTheme
                      ? 'text-[#2167d8] hover:text-[#174da3]'
                      : 'text-[#8fb7ff] hover:text-white'
                  }`}
                >
                  Change
                </button>
              </div>

              <div
                className={`mx-auto mb-4 inline-flex w-full items-center justify-center gap-4 ${
                  isLightTheme ? 'text-[#0b3f99]' : 'text-[#9fc1ff]'
                }`}
                aria-hidden="true"
              >
                {showPasskeyMfa ? (
                  <>
                    <ScanFace className="h-9 w-9 stroke-[1.8]" />
                    <Fingerprint className="h-9 w-9 stroke-[1.8]" />
                  </>
                ) : (
                  <Fingerprint className="h-9 w-9 stroke-[1.8]" />
                )}
              </div>
            </>
          )}

          <h2
            className={`text-center font-semibold ${
              authView === 'mfa'
                ? 'text-2xl sm:text-3xl'
                : 'text-3xl sm:text-4xl'
            } ${isLightTheme ? 'text-[#111827]' : 'text-white'}`}
          >
            {authView === 'mfa'
              ? 'Verify it is you'
              : title ||
                (authView === 'login' && 'Log in to Saby') ||
                (authView === 'signup' && 'Create your Saby account') ||
                (authView === 'forgot' && 'Reset your password') ||
                (authView === 'otp' && 'Verify OTP') ||
                (authView === 'phone' && 'Continue with phone') ||
                'Set new password'}
          </h2>
          <p
            className={`mx-auto max-w-lg text-center text-sm leading-relaxed ${
              authView === 'mfa' ? 'mt-2' : 'mt-3 sm:mt-4 sm:text-base'
            } ${isLightTheme ? 'text-[#5b6a86]' : 'text-[#d4d6e0]'}`}
          >
            {authView === 'login' && baseDescription}
            {authView === 'signup' &&
              (signupAsOwner
                ? 'Create your owner account to complete subscription and start workspace onboarding.'
                : 'Create your account to save chats, sync settings, and unlock full workspace access.')}
            {authView === 'forgot' &&
              'Enter your email to receive password reset instructions from the backend.'}
            {authView === 'otp' &&
              `Enter the six-digit OTP sent to ${otpEmail || 'your email'} to continue securely.`}
            {authView === 'mfa' &&
              (showPasskeyMfa
                ? 'Use your passkey, Face ID, or Touch ID to continue.'
                : 'Enter your authenticator app code to continue.')}
            {authView === 'phone' &&
              'Use your phone number and a one-time code to sign in securely.'}
            {authView === 'reset' &&
              'Use your reset token and choose a new password to restore account access.'}
          </p>

          {shouldRenderTopStatusBanner && (
            <div
              className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                authError
                  ? isLightTheme
                    ? 'border-[#f5b2b2] bg-[#fff0f0] text-[#b42318]'
                    : 'border-[#7f1d1d] bg-[#3a1212]/70 text-[#fecaca]'
                  : isLightTheme
                    ? 'border-[#b4dfc4] bg-[#effbf3] text-[#0b6e3f]'
                    : 'border-[#14532d] bg-[#052e16]/70 text-[#bbf7d0]'
              }`}
            >
              {authError || authInfo}
            </div>
          )}

          {authView === 'login' && (
            <>
              {(providerCapabilities.google ||
                providerCapabilities.apple ||
                providerCapabilities.phone) && (
                <>
                  <div className="mt-5 space-y-2.5 sm:mt-6">
                    {providerCapabilities.google && (
                      <button
                        type="button"
                        disabled={authSubmitting}
                        onClick={() => handleAuthProviderClick('google')}
                        className={`flex w-full items-center justify-center rounded-full border px-5 py-2.5 text-[15px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 sm:py-3 sm:text-base ${
                          isLightTheme
                            ? 'border-[#ced7e8] bg-white text-[#111827] hover:bg-[#eef3ff]'
                            : 'border-white/20 bg-white/5 text-white hover:bg-white/10'
                        }`}
                      >
                        <GoogleIcon className="mr-3 h-5 w-5 shrink-0" />
                        Continue with Google
                      </button>
                    )}
                    {providerCapabilities.apple && (
                      <button
                        type="button"
                        disabled={authSubmitting}
                        onClick={() => handleAuthProviderClick('apple')}
                        className={`flex w-full items-center justify-center rounded-full border px-5 py-2.5 text-[15px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 sm:py-3 sm:text-base ${
                          isLightTheme
                            ? 'border-[#ced7e8] bg-white text-[#111827] hover:bg-[#eef3ff]'
                            : 'border-white/20 bg-white/5 text-white hover:bg-white/10'
                        }`}
                      >
                        <PiAppleLogoFill className="mr-3 h-5 w-5 shrink-0" />
                        Continue with Apple
                      </button>
                    )}
                    {providerCapabilities.phone && (
                      <button
                        type="button"
                        disabled={authSubmitting}
                        onClick={() => handleAuthProviderClick('phone')}
                        className={`flex w-full items-center justify-center rounded-full border px-5 py-2.5 text-[15px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 sm:py-3 sm:text-base ${
                          isLightTheme
                            ? 'border-[#ced7e8] bg-white text-[#111827] hover:bg-[#eef3ff]'
                            : 'border-white/20 bg-white/5 text-white hover:bg-white/10'
                        }`}
                      >
                        <Phone className="mr-3 h-5 w-5 shrink-0" />
                        Continue with phone
                      </button>
                    )}
                  </div>

                  <div className="my-4 flex items-center gap-4 sm:my-5">
                    <div
                      className={`h-px flex-1 ${
                        isLightTheme ? 'bg-[#d6ddea]' : 'bg-white/20'
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        isLightTheme ? 'text-[#60708d]' : 'text-[#b9bdcb]'
                      }`}
                    >
                      OR
                    </span>
                    <div
                      className={`h-px flex-1 ${
                        isLightTheme ? 'bg-[#d6ddea]' : 'bg-white/20'
                      }`}
                    />
                  </div>
                </>
              )}
              {!providerCapabilities.google &&
                !providerCapabilities.apple &&
                !providerCapabilities.phone && (
                  <p
                    className={`mt-5 text-center text-xs ${
                      isLightTheme ? 'text-[#60708d]' : 'text-[#b9bdcb]'
                    }`}
                  >
                    Social sign-in providers are currently unavailable. Use
                    email/password.
                  </p>
                )}
            </>
          )}

          {(authView === 'login' || authView === 'signup') && (
            <form
              onSubmit={
                authView === 'login' ? handleLoginSubmit : handleSignUpSubmit
              }
              className="space-y-3.5"
            >
              {authView === 'signup' && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <input
                      value={signUpForm.firstname}
                      onChange={(event) =>
                        setSignUpForm((previous) => ({
                          ...previous,
                          firstname: event.target.value,
                        }))
                      }
                      type="text"
                      placeholder="First name"
                      className={`h-10 w-full rounded-full border px-4 text-sm placeholder:text-[#9ca1b2] focus:outline-none focus:ring-2 sm:h-11 ${
                        isLightTheme
                          ? 'border-[#ced7e8] bg-white text-[#111827] focus:ring-[#c7d5f0]'
                          : 'border-white/30 bg-white/5 text-white focus:ring-white/20'
                      }`}
                    />
                    {authFieldErrors.firstname && (
                      <p className="mt-1 text-xs text-[#ff6b6b]">
                        {authFieldErrors.firstname}
                      </p>
                    )}
                  </div>
                  <div>
                    <input
                      value={signUpForm.lastname}
                      onChange={(event) =>
                        setSignUpForm((previous) => ({
                          ...previous,
                          lastname: event.target.value,
                        }))
                      }
                      type="text"
                      placeholder="Last name"
                      className={`h-10 w-full rounded-full border px-4 text-sm placeholder:text-[#9ca1b2] focus:outline-none focus:ring-2 sm:h-11 ${
                        isLightTheme
                          ? 'border-[#ced7e8] bg-white text-[#111827] focus:ring-[#c7d5f0]'
                          : 'border-white/30 bg-white/5 text-white focus:ring-white/20'
                      }`}
                    />
                    {authFieldErrors.lastname && (
                      <p className="mt-1 text-xs text-[#ff6b6b]">
                        {authFieldErrors.lastname}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <input
                  value={
                    authView === 'login' ? loginForm.email : signUpForm.email
                  }
                  onChange={(event) => {
                    const email = event.target.value;
                    if (authView === 'login') {
                      setLoginForm((previous) => ({ ...previous, email }));
                      return;
                    }
                    setSignUpForm((previous) => ({ ...previous, email }));
                  }}
                  type="email"
                  placeholder="Email address"
                  className={`h-11 w-full rounded-full border px-5 text-sm placeholder:text-[#9ca1b2] focus:outline-none focus:ring-2 sm:h-12 sm:text-base ${
                    isLightTheme
                      ? 'border-[#ced7e8] bg-white text-[#111827] focus:ring-[#c7d5f0]'
                      : 'border-white/30 bg-white/5 text-white focus:ring-white/20'
                  }`}
                />
                {authFieldErrors.email && (
                  <p className="mt-1 text-xs text-[#ff6b6b]">
                    {authFieldErrors.email}
                  </p>
                )}
              </div>

              <div className="relative">
                <input
                  value={
                    authView === 'login'
                      ? loginForm.password
                      : signUpForm.password
                  }
                  onChange={(event) => {
                    const password = event.target.value;
                    if (authView === 'login') {
                      setLoginForm((previous) => ({ ...previous, password }));
                      return;
                    }
                    setSignUpForm((previous) => ({ ...previous, password }));
                  }}
                  type={showPrimaryPassword ? 'text' : 'password'}
                  placeholder="Password"
                  className={`h-11 w-full rounded-full border px-5 pr-12 text-sm placeholder:text-[#9ca1b2] focus:outline-none focus:ring-2 sm:h-12 sm:text-base ${
                    isLightTheme
                      ? 'border-[#ced7e8] bg-white text-[#111827] focus:ring-[#c7d5f0]'
                      : 'border-white/30 bg-white/5 text-white focus:ring-white/20'
                  }`}
                />
                <button
                  type="button"
                  aria-label={
                    showPrimaryPassword ? 'Hide password' : 'Show password'
                  }
                  onClick={() => setShowPrimaryPassword((value) => !value)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 transition ${
                    isLightTheme
                      ? 'text-[#4d5d79] hover:bg-[#eef3ff] hover:text-[#111827]'
                      : 'text-[#c8ccda] hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {showPrimaryPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
                {authFieldErrors.password && (
                  <p className="mt-1 text-xs text-[#ff6b6b]">
                    {authFieldErrors.password}
                  </p>
                )}
              </div>

              {authView === 'signup' && (
                <>
                  <div className="relative">
                    <input
                      value={signUpForm.confirmPassword}
                      onChange={(event) =>
                        setSignUpForm((previous) => ({
                          ...previous,
                          confirmPassword: event.target.value,
                        }))
                      }
                      type={showSignupConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm password"
                      className={`h-11 w-full rounded-full border px-5 pr-12 text-sm placeholder:text-[#9ca1b2] focus:outline-none focus:ring-2 sm:h-12 sm:text-base ${
                        isLightTheme
                          ? 'border-[#ced7e8] bg-white text-[#111827] focus:ring-[#c7d5f0]'
                          : 'border-white/30 bg-white/5 text-white focus:ring-white/20'
                      }`}
                    />
                    <button
                      type="button"
                      aria-label={
                        showSignupConfirmPassword
                          ? 'Hide confirm password'
                          : 'Show confirm password'
                      }
                      onClick={() =>
                        setShowSignupConfirmPassword((value) => !value)
                      }
                      className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 transition ${
                        isLightTheme
                          ? 'text-[#4d5d79] hover:bg-[#eef3ff] hover:text-[#111827]'
                          : 'text-[#c8ccda] hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {showSignupConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                    {authFieldErrors.confirmPassword && (
                      <p className="mt-1 text-xs text-[#ff6b6b]">
                        {authFieldErrors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <label
                    className={`flex items-start gap-2 text-sm ${
                      isLightTheme ? 'text-[#495a78]' : 'text-[#d0d3df]'
                    }`}
                  >
                    <input
                      checked={signUpForm.isAgreed}
                      onChange={(event) =>
                        setSignUpForm((previous) => ({
                          ...previous,
                          isAgreed: event.target.checked,
                        }))
                      }
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-white/40 bg-transparent"
                    />
                    <span>
                      I agree to the{' '}
                      <Link
                        href="/terms-of-service"
                        className="underline underline-offset-4 hover:text-[#111827] dark:hover:text-white"
                      >
                        Terms
                      </Link>{' '}
                      and{' '}
                      <Link
                        href="/privacy-policy"
                        className="underline underline-offset-4 hover:text-[#111827] dark:hover:text-white"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </span>
                  </label>
                  {authFieldErrors.isAgreed && (
                    <p className="text-xs text-[#ff6b6b]">
                      {authFieldErrors.isAgreed}
                    </p>
                  )}
                </>
              )}

              {authView === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(loginForm.email.trim());
                    setAuthView('forgot');
                    clearAuthValidation();
                  }}
                  className={`text-left text-sm underline underline-offset-4 transition ${
                    isLightTheme
                      ? 'text-[#4b5d7b] hover:text-[#111827]'
                      : 'text-[#c3c7d4] hover:text-white'
                  }`}
                >
                  Forgot password?
                </button>
              )}

              {authError && !shouldRenderTopStatusBanner && (
                <p className="text-sm text-[#ff6b6b]">{authError}</p>
              )}
              {authInfo && !shouldRenderTopStatusBanner && (
                <p className="text-sm text-[#3db174]">{authInfo}</p>
              )}
              {captchaError && (
                <p className="text-sm text-[#ff6b6b]">{captchaError}</p>
              )}
              {isCaptchaEnabled && (
                <p
                  className={`text-center text-xs ${
                    isLightTheme ? 'text-[#5f7090]' : 'text-[#aeb3c4]'
                  }`}
                >
                  Protected by Google reCAPTCHA.
                </p>
              )}

              <button
                type="submit"
                disabled={authSubmitting}
                className={`w-full rounded-full px-5 py-2.5 text-[15px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 sm:py-3 sm:text-base ${
                  isLightTheme
                    ? 'bg-[#111827] text-white hover:bg-[#1f2937]'
                    : 'bg-[#ececf1] text-[#13141a] hover:bg-white'
                }`}
              >
                {authSubmitting
                  ? authView === 'login'
                    ? 'Signing in...'
                    : 'Creating account...'
                  : authView === 'login'
                    ? 'Continue'
                    : 'Create account'}
              </button>
            </form>
          )}

          {authView === 'forgot' && (
            <form
              onSubmit={handleForgotPasswordSubmit}
              className="mt-5 space-y-3.5"
            >
              <input
                value={forgotEmail}
                onChange={(event) => setForgotEmail(event.target.value)}
                type="email"
                placeholder="Email address"
                className={`h-11 w-full rounded-full border px-5 text-sm placeholder:text-[#9ca1b2] focus:outline-none focus:ring-2 sm:h-12 sm:text-base ${
                  isLightTheme
                    ? 'border-[#ced7e8] bg-white text-[#111827] focus:ring-[#c7d5f0]'
                    : 'border-white/30 bg-white/5 text-white focus:ring-white/20'
                }`}
              />
              {authError && (
                <p className="text-sm text-[#ff6b6b]">{authError}</p>
              )}
              {authInfo && <p className="text-sm text-[#3db174]">{authInfo}</p>}
              <button
                type="submit"
                disabled={authSubmitting}
                className={`w-full rounded-full px-5 py-2.5 text-[15px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 sm:py-3 sm:text-base ${
                  isLightTheme
                    ? 'bg-[#111827] text-white hover:bg-[#1f2937]'
                    : 'bg-[#ececf1] text-[#13141a] hover:bg-white'
                }`}
              >
                {authSubmitting ? 'Sending...' : 'Send reset instructions'}
              </button>
            </form>
          )}

          {authView === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="mt-5 space-y-3.5">
              <input
                value={otpCode}
                onChange={(event) =>
                  setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                }
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                className={`h-11 w-full rounded-full border px-5 text-center text-base tracking-[0.32em] placeholder:text-[#9ca1b2] focus:outline-none focus:ring-2 sm:h-12 sm:text-lg sm:tracking-[0.4em] ${
                  isLightTheme
                    ? 'border-[#ced7e8] bg-white text-[#111827] focus:ring-[#c7d5f0]'
                    : 'border-white/30 bg-white/5 text-white focus:ring-white/20'
                }`}
              />
              {authError && (
                <p className="text-sm text-[#ff6b6b]">{authError}</p>
              )}
              {authInfo && <p className="text-sm text-[#3db174]">{authInfo}</p>}
              <button
                type="submit"
                disabled={authSubmitting}
                className={`w-full rounded-full px-5 py-2.5 text-[15px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 sm:py-3 sm:text-base ${
                  isLightTheme
                    ? 'bg-[#111827] text-white hover:bg-[#1f2937]'
                    : 'bg-[#ececf1] text-[#13141a] hover:bg-white'
                }`}
              >
                {authSubmitting ? 'Verifying...' : 'Verify OTP'}
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={authSubmitting}
                className={`w-full rounded-full border px-5 py-2.5 text-[15px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 sm:py-3 sm:text-base ${
                  isLightTheme
                    ? 'border-[#ced7e8] bg-white text-[#1f2b45] hover:bg-[#eef3ff]'
                    : 'border-white/20 bg-white/5 text-white hover:bg-white/10'
                }`}
              >
                Resend OTP
              </button>
            </form>
          )}

          {authView === 'mfa' && (
            <div className="mx-auto mt-5 max-w-[360px] space-y-3">
              {showPasskeyMfa && (
                <>
                  <button
                    type="button"
                    onClick={handlePasskeyMfa}
                    disabled={authSubmitting}
                    className={`mx-auto flex w-auto min-w-[180px] items-center justify-center gap-2 rounded-full px-6 py-2.5 text-[15px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      isLightTheme
                        ? 'bg-[#111827] text-white hover:bg-[#1f2937]'
                        : 'bg-[#ececf1] text-[#13141a] hover:bg-white'
                    }`}
                  >
                    <Fingerprint className="h-4 w-4" />
                    {authSubmitting ? 'Checking...' : 'Use passkey'}
                  </button>

                  {hasMultipleMfaMethods && (
                    <button
                      type="button"
                      onClick={handleUseAuthenticatorMfa}
                      className={`w-full text-center text-sm font-semibold transition ${
                        isLightTheme
                          ? 'text-[#2167d8] hover:text-[#174da3]'
                          : 'text-[#8fb7ff] hover:text-white'
                      }`}
                    >
                      Confirm a different way
                    </button>
                  )}
                </>
              )}

              {showAuthenticatorMfa && (
                <>
                  <form
                    onSubmit={handleMfaAuthenticatorSubmit}
                    className={`rounded-[20px] border p-3 ${
                      isLightTheme
                        ? 'border-[#e1e7f2] bg-[#fbfcff]'
                        : 'border-white/10 bg-white/[0.04]'
                    }`}
                  >
                    <label
                      className={`mb-3 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] ${
                        isLightTheme ? 'text-[#69758f]' : 'text-[#b7bbc9]'
                      }`}
                    >
                      Authenticator app
                    </label>
                    <input
                      ref={mfaCodeInputRef}
                      value={mfaCode}
                      onChange={(event) =>
                        setMfaCode(
                          event.target.value.replace(/\D/g, '').slice(0, 6)
                        )
                      }
                      inputMode="numeric"
                      maxLength={6}
                      autoComplete="one-time-code"
                      placeholder="Authentication code"
                      className={`h-11 w-full rounded-full border px-5 text-center text-base tracking-[0.28em] placeholder:tracking-[0.18em] placeholder:text-[#9ca1b2] focus:outline-none focus:ring-2 sm:h-12 sm:tracking-[0.34em] ${
                        isLightTheme
                          ? 'border-[#ced7e8] bg-white text-[#111827] focus:ring-[#c7d5f0]'
                          : 'border-white/30 bg-white/5 text-white focus:ring-white/20'
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={authSubmitting}
                      className={`mt-3 flex w-full items-center justify-center rounded-full border px-5 py-2.5 text-[15px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        isLightTheme
                          ? 'border-[#cfd8e8] bg-[#f8fafc] text-[#1f2b45] hover:bg-[#eef3ff]'
                          : 'border-white/20 bg-white/5 text-white hover:bg-white/10'
                      }`}
                    >
                      {authSubmitting ? 'Verifying...' : 'Verify code'}
                    </button>
                  </form>
                </>
              )}

              {authError && (
                <p className="text-sm text-[#ff6b6b]">{authError}</p>
              )}
              {authInfo && (
                <p className="text-center text-sm text-[#3db174]">{authInfo}</p>
              )}

              <div
                className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-center text-sm ${
                  isLightTheme
                    ? 'bg-[#f4f6fa] text-[#5b6a86]'
                    : 'bg-white/[0.05] text-[#d4d6e0]'
                }`}
              >
                <LifeBuoy className="h-4 w-4 shrink-0" />
                <span>Having trouble?</span>
                <Link
                  href={routes.helpSupport}
                  className={`font-semibold underline-offset-4 hover:underline ${
                    isLightTheme ? 'text-[#2167d8]' : 'text-[#9fc1ff]'
                  }`}
                >
                  Visit support
                </Link>
              </div>
            </div>
          )}

          {authView === 'phone' && (
            <form
              onSubmit={
                phoneLoginOtpRequested
                  ? handlePhoneLoginSubmit
                  : handlePhoneRequestOtp
              }
              className="mt-5 space-y-3.5"
            >
              <input
                value={phoneLoginNumber}
                onChange={(event) => setPhoneLoginNumber(event.target.value)}
                type="tel"
                placeholder="Phone number"
                className={`h-11 w-full rounded-full border px-5 text-sm placeholder:text-[#9ca1b2] focus:outline-none focus:ring-2 sm:h-12 sm:text-base ${
                  isLightTheme
                    ? 'border-[#ced7e8] bg-white text-[#111827] focus:ring-[#c7d5f0]'
                    : 'border-white/30 bg-white/5 text-white focus:ring-white/20'
                }`}
              />

              {phoneLoginOtpRequested && (
                <div className="grid grid-cols-6 gap-2 sm:gap-3">
                  {Array.from({ length: PHONE_OTP_LENGTH }, (_, index) => (
                    <input
                      key={`phone-otp-digit-${index}`}
                      ref={(element) => {
                        phoneOtpInputRefs.current[index] = element;
                      }}
                      value={phoneLoginOtpDigits[index] || ''}
                      onChange={(event) =>
                        handlePhoneOtpDigitChange(index, event.target.value)
                      }
                      onKeyDown={(event) =>
                        handlePhoneOtpDigitKeyDown(index, event)
                      }
                      onPaste={handlePhoneOtpPaste}
                      inputMode="numeric"
                      autoComplete={index === 0 ? 'one-time-code' : 'off'}
                      maxLength={1}
                      aria-label={`OTP digit ${index + 1}`}
                      className={`h-12 w-full rounded-xl border text-center text-lg font-semibold focus:outline-none focus:ring-2 sm:h-14 sm:text-xl ${
                        isLightTheme
                          ? 'border-[#ced7e8] bg-white text-[#111827] focus:ring-[#c7d5f0]'
                          : 'border-white/30 bg-white/5 text-white focus:ring-white/20'
                      }`}
                    />
                  ))}
                </div>
              )}

              {authError && (
                <p className="text-sm text-[#ff6b6b]">{authError}</p>
              )}
              {authInfo && <p className="text-sm text-[#3db174]">{authInfo}</p>}

              <button
                type="submit"
                disabled={authSubmitting}
                className={`w-full rounded-full px-5 py-2.5 text-[15px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 sm:py-3 sm:text-base ${
                  isLightTheme
                    ? 'bg-[#111827] text-white hover:bg-[#1f2937]'
                    : 'bg-[#ececf1] text-[#13141a] hover:bg-white'
                }`}
              >
                {authSubmitting
                  ? phoneLoginOtpRequested
                    ? 'Signing in...'
                    : 'Sending OTP...'
                  : phoneLoginOtpRequested
                    ? 'Continue'
                    : 'Send OTP'}
              </button>
              {phoneLoginOtpRequested && (
                <button
                  type="button"
                  onClick={async () => {
                    clearAuthValidation();
                    if (!phoneLoginNumber.trim()) {
                      setAuthError('Please enter your phone number.');
                      return;
                    }
                    setAuthSubmitting(true);
                    const response = await requestPhoneOtp(
                      phoneLoginNumber.trim()
                    );
                    setAuthSubmitting(false);
                    if (!response.success) {
                      if (response.code === 'PHONE_NOT_REGISTERED') {
                        setAuthView('signup');
                        setPhoneLoginOtpRequested(false);
                        setPhoneLoginOtpDigits(
                          Array(PHONE_OTP_LENGTH).fill('')
                        );
                        setAuthInfo(
                          'No account found with this phone number. Create your account to continue.'
                        );
                        setAuthError(null);
                        return;
                      }
                      setAuthError(
                        response.error || 'Unable to resend OTP right now.'
                      );
                      return;
                    }
                    setPhoneLoginOtpDigits(Array(PHONE_OTP_LENGTH).fill(''));
                    setAuthInfo('A new OTP has been sent to your phone.');
                  }}
                  disabled={authSubmitting}
                  className={`w-full rounded-full border px-5 py-2.5 text-[15px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 sm:py-3 sm:text-base ${
                    isLightTheme
                      ? 'border-[#ced7e8] bg-white text-[#1f2b45] hover:bg-[#eef3ff]'
                      : 'border-white/20 bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  Resend OTP
                </button>
              )}
            </form>
          )}

          {authView === 'reset' && (
            <form
              onSubmit={handleResetPasswordSubmit}
              className="mt-5 space-y-3.5"
            >
              <input
                value={resetToken}
                onChange={(event) => setResetToken(event.target.value)}
                placeholder="Reset token"
                className={`h-11 w-full rounded-full border px-5 text-sm placeholder:text-[#9ca1b2] focus:outline-none focus:ring-2 sm:h-12 sm:text-base ${
                  isLightTheme
                    ? 'border-[#ced7e8] bg-white text-[#111827] focus:ring-[#c7d5f0]'
                    : 'border-white/30 bg-white/5 text-white focus:ring-white/20'
                }`}
              />
              <div className="relative">
                <input
                  value={resetNewPassword}
                  onChange={(event) => setResetNewPassword(event.target.value)}
                  type={showResetNewPassword ? 'text' : 'password'}
                  placeholder="New password"
                  className={`h-11 w-full rounded-full border px-5 pr-12 text-sm placeholder:text-[#9ca1b2] focus:outline-none focus:ring-2 sm:h-12 sm:text-base ${
                    isLightTheme
                      ? 'border-[#ced7e8] bg-white text-[#111827] focus:ring-[#c7d5f0]'
                      : 'border-white/30 bg-white/5 text-white focus:ring-white/20'
                  }`}
                />
                <button
                  type="button"
                  aria-label={
                    showResetNewPassword
                      ? 'Hide new password'
                      : 'Show new password'
                  }
                  onClick={() => setShowResetNewPassword((value) => !value)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 transition ${
                    isLightTheme
                      ? 'text-[#4d5d79] hover:bg-[#eef3ff] hover:text-[#111827]'
                      : 'text-[#c8ccda] hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {showResetNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="relative">
                <input
                  value={resetConfirmPassword}
                  onChange={(event) =>
                    setResetConfirmPassword(event.target.value)
                  }
                  type={showResetConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  className={`h-11 w-full rounded-full border px-5 pr-12 text-sm placeholder:text-[#9ca1b2] focus:outline-none focus:ring-2 sm:h-12 sm:text-base ${
                    isLightTheme
                      ? 'border-[#ced7e8] bg-white text-[#111827] focus:ring-[#c7d5f0]'
                      : 'border-white/30 bg-white/5 text-white focus:ring-white/20'
                  }`}
                />
                <button
                  type="button"
                  aria-label={
                    showResetConfirmPassword
                      ? 'Hide confirm new password'
                      : 'Show confirm new password'
                  }
                  onClick={() => setShowResetConfirmPassword((value) => !value)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 transition ${
                    isLightTheme
                      ? 'text-[#4d5d79] hover:bg-[#eef3ff] hover:text-[#111827]'
                      : 'text-[#c8ccda] hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {showResetConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {authError && (
                <p className="text-sm text-[#ff6b6b]">{authError}</p>
              )}
              {authInfo && <p className="text-sm text-[#3db174]">{authInfo}</p>}
              <button
                type="submit"
                disabled={authSubmitting}
                className={`w-full rounded-full px-5 py-2.5 text-[15px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 sm:py-3 sm:text-base ${
                  isLightTheme
                    ? 'bg-[#111827] text-white hover:bg-[#1f2937]'
                    : 'bg-[#ececf1] text-[#13141a] hover:bg-white'
                }`}
              >
                {authSubmitting ? 'Updating...' : 'Update password'}
              </button>
            </form>
          )}

          <div
            className={`mt-4 text-center text-sm ${
              isLightTheme ? 'text-[#5f7090]' : 'text-[#aeb3c4]'
            }`}
          >
            {authView === 'login' && (
              <button
                type="button"
                onClick={() => setAuthView('signup')}
                className="underline underline-offset-4 transition hover:text-[#111827] dark:hover:text-white"
              >
                Need an account? Create one
              </button>
            )}

            {authView === 'signup' && (
              <button
                type="button"
                onClick={() => setAuthView('login')}
                className="underline underline-offset-4 transition hover:text-[#111827] dark:hover:text-white"
              >
                Already have an account? Log in
              </button>
            )}

            {(authView === 'forgot' ||
              authView === 'reset' ||
              authView === 'otp' ||
              authView === 'mfa' ||
              authView === 'phone') && (
              <button
                type="button"
                onClick={handleBackToLogin}
                className="underline underline-offset-4 transition hover:text-[#111827] dark:hover:text-white"
              >
                Back to login
              </button>
            )}
          </div>
        </div>
      </div>
      <style jsx global>{`
        .saby-auth-modal.saby-auth-modal-dark input,
        .saby-auth-modal.saby-auth-modal-dark textarea,
        .saby-auth-modal.saby-auth-modal-dark select {
          color: #ffffff !important;
          caret-color: #ffffff;
        }

        .saby-auth-modal.saby-auth-modal-dark input::placeholder,
        .saby-auth-modal.saby-auth-modal-dark textarea::placeholder {
          color: #9ca1b2 !important;
        }

        .saby-auth-modal.saby-auth-modal-dark input:-webkit-autofill,
        .saby-auth-modal.saby-auth-modal-dark input:-webkit-autofill:hover,
        .saby-auth-modal.saby-auth-modal-dark input:-webkit-autofill:focus {
          -webkit-text-fill-color: #ffffff !important;
          box-shadow: 0 0 0px 1000px rgba(255, 255, 255, 0.04) inset !important;
          -webkit-box-shadow: 0 0 0px 1000px rgba(255, 255, 255, 0.04) inset !important;
          transition: background-color 9999s ease-in-out 0s;
        }
      `}</style>
    </div>
  );
}
