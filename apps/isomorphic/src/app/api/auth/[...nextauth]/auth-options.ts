import { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import AppleProvider from 'next-auth/providers/apple';
import { env } from '@/env.mjs';
import { pagesOptions } from './pages-options';
import * as api from '@/app/lib/api/auth';
import { checkExpiration, refreshAccessToken } from '@lib/api/token';

const shouldForwardCaptchaToken =
  process.env.NEXT_PUBLIC_AUTH_SEND_CAPTCHA_TOKEN === 'true';

const isMeaningfulProviderCredential = (value?: string) => {
  const normalized = String(value || '').trim();
  if (!normalized) return false;
  const lower = normalized.toLowerCase();
  if (lower.includes('example') || lower.includes('dummy')) return false;
  if (lower.includes('local-dev')) return false;
  if (/^\d+-dev\.apps\.googleusercontent\.com$/i.test(normalized)) return false;
  return true;
};

const resolveBackendApiBase = () => {
  const raw =
    process.env.NEXT_SERVER_URL_BASE ||
    process.env.NEXT_PUBLIC_SERVER_URL_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:4000/v1';
  const trimmed = raw.replace(/\/+$/, '');
  if (trimmed.endsWith('/v1')) return trimmed;
  return `${trimmed}/v1`;
};

const toBackendUserObject = (data: any) => ({
  id: data.user.id,
  userId: data.user.userId,
  haloId: data.user.haloId,
  tenantId: data.user.tenantId,
  firstname: data.user.firstname,
  lastname: data.user.lastname,
  name: `${data.user.firstname} ${data.user.lastname}`.trim(),
  email: data.user.email,
  phoneNumber: data.user.phoneNumber,
  avatar: data.user.avatar,
  isOwner: data.user.isOwner,
  isSuper: data.user.isSuper,
  isSaby: data.user.isSaby,
  isAdmin: data.user.isAdmin,
  isAgreed: data.user.isAgreed,
  isEmailVerified: data.user.isEmailVerified,
  isPhoneVerified: data.user.isPhoneVerified,
  status: data.user.status,
  createdAt: data.user.createdAt,
  onboardingStatus:
    data.user.onboardingStatus ||
    data.user.onboarding_state ||
    (typeof data.user.onboardingComplete === 'boolean'
      ? data.user.onboardingComplete
        ? 'complete'
        : 'required'
      : undefined),
  onboardingComplete:
    typeof data.user.onboardingComplete === 'boolean'
      ? data.user.onboardingComplete
      : undefined,
  requiresOnboarding:
    typeof data.user.requiresOnboarding === 'boolean'
      ? data.user.requiresOnboarding
      : undefined,
  roles: data.user.roles,
  permissions: data.user.permissions,
  tokens: data.tokens,
});

const extractSocialNameParts = (user: any) => {
  const providedFirstname = String(user?.firstname || '').trim();
  const providedLastname = String(user?.lastname || '').trim();
  if (providedFirstname && providedLastname) {
    return { firstname: providedFirstname, lastname: providedLastname };
  }

  const fullName = String(user?.name || '').trim();
  if (fullName) {
    const chunks = fullName.split(/\s+/).filter(Boolean);
    if (chunks.length >= 2) {
      return {
        firstname: chunks[0],
        lastname: chunks.slice(1).join(' '),
      };
    }
    return {
      firstname: chunks[0],
      lastname: '',
    };
  }

  return {
    firstname: '',
    lastname: '',
  };
};

const exchangeSocialLogin = async ({
  provider,
  email,
  firstname,
  lastname,
  name,
  avatar,
  emailVerified,
}: {
  provider: 'google' | 'apple';
  email: string;
  firstname?: string;
  lastname?: string;
  name?: string;
  avatar?: string;
  emailVerified?: boolean;
}) => {
  const sharedSecret = String(env.SOCIAL_AUTH_SHARED_SECRET || '').trim();
  if (!sharedSecret) {
    throw new Error('Social auth bridge secret is not configured.');
  }

  const response = await fetch(`${resolveBackendApiBase()}/auth/social-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-social-auth-secret': sharedSecret,
    },
    body: JSON.stringify({
      provider,
      email: String(email || '').trim().toLowerCase(),
      firstname: String(firstname || '').trim(),
      lastname: String(lastname || '').trim(),
      name: String(name || '').trim(),
      avatar: String(avatar || '').trim(),
      emailVerified:
        typeof emailVerified === 'boolean' ? emailVerified : undefined,
    }),
    cache: 'no-store',
  });

  const payload: any = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.tokens || !payload?.user) {
    const message =
      payload?.message ||
      `Unable to complete ${provider} authentication right now.`;
    throw new Error(String(message));
  }
  return payload;
};

export const authOptions: NextAuthOptions = {
  debug: false,
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    ...pagesOptions,
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user, account, profile, trigger, session }) {
      const sessionUpdate = session as Record<string, any> | undefined;
      if (trigger === 'update' && token.user) {
        token.user = {
          ...token.user,
          ...(typeof sessionUpdate?.phoneNumber === 'string'
            ? { phoneNumber: sessionUpdate.phoneNumber }
            : {}),
          ...(typeof sessionUpdate?.onboardingStatus === 'string'
            ? { onboardingStatus: sessionUpdate.onboardingStatus }
            : {}),
          ...(typeof sessionUpdate?.onboardingComplete === 'boolean'
            ? { onboardingComplete: sessionUpdate.onboardingComplete }
            : {}),
          ...(typeof sessionUpdate?.requiresOnboarding === 'boolean'
            ? { requiresOnboarding: sessionUpdate.requiresOnboarding }
            : {}),
          ...(typeof sessionUpdate?.isPhoneVerified === 'boolean'
            ? { isPhoneVerified: sessionUpdate.isPhoneVerified }
            : {}),
          ...(typeof sessionUpdate?.isEmailVerified === 'boolean'
            ? { isEmailVerified: sessionUpdate.isEmailVerified }
            : {}),
        };
      }

      if (user) {
        let userWithTokens = user as any;
        const provider = account?.provider;
        if (
          !userWithTokens?.tokens &&
          (provider === 'google' || provider === 'apple')
        ) {
          const oauthEmail = String((userWithTokens?.email as string) || '')
            .trim()
            .toLowerCase();
          if (!oauthEmail) {
            throw new Error(
              `${provider} did not provide an email. Sign in with email/password.`
            );
          }
          const nameParts = extractSocialNameParts(userWithTokens);
          const googleEmailVerifiedRaw = (profile as any)?.email_verified;
          const providerEmailVerified =
            provider === 'google'
              ? googleEmailVerifiedRaw === undefined
                ? true
                : Boolean(googleEmailVerifiedRaw)
              : true;
          const socialData = await exchangeSocialLogin({
            provider,
            email: oauthEmail,
            firstname: nameParts.firstname,
            lastname: nameParts.lastname,
            name: String(userWithTokens?.name || '').trim(),
            avatar: String(userWithTokens?.image || '').trim(),
            emailVerified: providerEmailVerified,
          });
          userWithTokens = toBackendUserObject(socialData);
        }

        if (!userWithTokens?.tokens?.access?.token) {
          throw new Error('Login session is missing backend tokens.');
        }

        token.user = userWithTokens;
        token.accessToken = userWithTokens.tokens?.access?.token;
        token.refreshToken = userWithTokens.tokens?.refresh?.token;
        token.lastActivity = Date.now();
      }

      const accessToken =
        typeof token.accessToken === 'string' ? token.accessToken : undefined;
      const refreshToken =
        typeof token.refreshToken === 'string' ? token.refreshToken : undefined;
      const lastRefreshAttempt =
        typeof token.lastRefreshAttempt === 'number' ? token.lastRefreshAttempt : 0;
      const isExpired = checkExpiration(accessToken);
      const timeSinceLastRefresh = Date.now() - lastRefreshAttempt;

      if (
        isExpired &&
        refreshToken &&
        !token.isStale &&
        timeSinceLastRefresh > 60000
      ) {
        token.lastRefreshAttempt = Date.now();

        try {
          const refreshed = await refreshAccessToken(refreshToken);
          if (refreshed) {
            token.accessToken = refreshed.accessToken;
            token.refreshToken = refreshed.refreshToken ?? token.refreshToken;
            token.lastActivity = Date.now();
            token.isStale = false;
            token.staleTimestamp = undefined;
          } else {
            token.isStale = true;
            token.staleTimestamp = token.staleTimestamp || Date.now();
            token.lastRefreshAttempt = undefined;
            const staleTime = (token.staleTimestamp as number) || Date.now();
            if (Date.now() - staleTime > 15 * 60 * 1000) {
              token.name = undefined;
              token.email = undefined;
              token.picture = undefined;
              token.sub = undefined;
              token.user = undefined;
              token.accessToken = undefined;
              token.refreshToken = undefined;
            }
          }
        } catch (error: any) {
          if (
            error?.code === 'ECONNREFUSED' ||
            error?.message?.includes('fetch failed') ||
            error?.name === 'TypeError'
          ) {
            return token;
          }
          token.isStale = true;
          token.staleTimestamp = token.staleTimestamp || Date.now();
        }
      } else if (!isExpired && token.accessToken) {
        token.lastActivity = Date.now();
      }

      return token;
    },

    async session({ session, token }) {
      const tokenUser = (token.user || {}) as any;
      const sessionUser = {
        ...session.user,
        id: tokenUser.id,
        userId: tokenUser.userId,
        haloId: tokenUser.haloId,
        tenantId: tokenUser.tenantId,
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        isSaby: tokenUser.isSaby,
        isSuper: tokenUser.isSuper,
        isOwner: tokenUser.isOwner,
        isAdmin: tokenUser.isAdmin,
        onboardingStatus: tokenUser.onboardingStatus,
        onboardingComplete: tokenUser.onboardingComplete,
        requiresOnboarding: tokenUser.requiresOnboarding,
        isEmailVerified: tokenUser.isEmailVerified,
        isPhoneVerified: tokenUser.isPhoneVerified,
        roles: tokenUser.roles,
        permissions: tokenUser.permissions,
      };
      return {
        ...session,
        user: sessionUser,
        isStale: token.isStale || false,
        lastActivity: token.lastActivity,
        staleTimestamp: token.staleTimestamp,
      };
    },

    async redirect({ url, baseUrl }) {
      const parsedUrl = new URL(url, baseUrl);
      const callbackPath = parsedUrl.searchParams.get('callbackUrl');
      if (callbackPath && callbackPath !== '/' && callbackPath !== '%2F') {
        return `${baseUrl}${callbackPath}`;
      }
      return `${baseUrl}/`;
    },
  },

  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        captchaToken: { label: 'Captcha Token', type: 'text' },
        deviceId: { label: 'Trusted Device ID', type: 'text' },
      },
      async authorize(credentials) {
        try {
          const email =
            typeof credentials?.email === 'string'
              ? credentials.email.trim()
              : '';
          const password =
            typeof credentials?.password === 'string'
              ? credentials.password
              : '';
          if (!email || !password) {
            throw new Error('Missing email or password');
          }

          const captchaToken =
            shouldForwardCaptchaToken &&
            typeof credentials?.captchaToken === 'string'
              ? credentials.captchaToken
              : undefined;
          const deviceId =
            typeof credentials?.deviceId === 'string'
              ? credentials.deviceId.trim()
              : undefined;
          const data = await api.login(email, password, captchaToken, deviceId);
          if (data?.mfaRequired) {
            throw new Error(`[MfaRequired] ${JSON.stringify({
              mfaToken: data.mfaToken,
              methods: data.methods,
              expiresIn: data.expiresIn,
              email: data.email,
            })}`);
          }
          if (!data?.tokens || !data?.user) {
            throw new Error('Invalid response from server');
          }
          return toBackendUserObject(data);
        } catch (error: any) {
          const status = error?.response?.status;
          const rawMessage =
            error?.response?.data?.message ?? error?.message ?? 'Login failed';
          const message = Array.isArray(rawMessage)
            ? rawMessage.join(' ')
            : typeof rawMessage === 'string'
              ? rawMessage
              : JSON.stringify(rawMessage);

          if (status === 401 && /otp/i.test(message)) {
            throw new Error(`[OtpNotVerified] ${message}`);
          }
          if (status === 401) {
            throw new Error(message || 'Invalid email or password');
          }
          if (status === 429) {
            throw new Error('Too many login attempts. Please wait and try again.');
          }
          throw new Error(message || 'Login failed');
        }
      },
    }),
    CredentialsProvider({
      id: 'mfa',
      name: 'MFA',
      credentials: {
        mfaToken: { label: 'MFA Token', type: 'text' },
        method: { label: 'Method', type: 'text' },
        code: { label: 'Code', type: 'text' },
        credential: { label: 'Credential', type: 'text' },
        deviceId: { label: 'Trusted Device ID', type: 'text' },
      },
      async authorize(credentials) {
        try {
          const mfaToken =
            typeof credentials?.mfaToken === 'string'
              ? credentials.mfaToken.trim()
              : '';
          const method =
            typeof credentials?.method === 'string'
              ? credentials.method.trim()
              : '';
          if (!mfaToken) throw new Error('Missing MFA challenge.');
          const deviceId =
            typeof credentials?.deviceId === 'string'
              ? credentials.deviceId.trim()
              : undefined;

          const data =
            method === 'passkey'
              ? await api.verifyMfaPasskey(
                  mfaToken,
                  JSON.parse(String(credentials?.credential || '{}')),
                  deviceId
                )
              : await api.verifyMfaAuthenticator(
                  mfaToken,
                  String(credentials?.code || '').replace(/\D/g, '').slice(0, 6),
                  deviceId
                );
          if (!data?.tokens || !data?.user) {
            throw new Error('Invalid MFA response from server');
          }
          return toBackendUserObject(data);
        } catch (error: any) {
          const rawMessage =
            error?.response?.data?.message || error?.message || 'MFA verification failed';
          throw new Error(String(rawMessage));
        }
      },
    }),
    CredentialsProvider({
      id: 'phone-otp',
      name: 'Phone OTP',
      credentials: {
        phoneNumber: { label: 'Phone Number', type: 'text' },
        otp: { label: 'OTP', type: 'text' },
      },
      async authorize(credentials) {
        try {
          const phoneNumber =
            typeof credentials?.phoneNumber === 'string'
              ? credentials.phoneNumber.trim()
              : '';
          const otp =
            typeof credentials?.otp === 'string'
              ? credentials.otp.replace(/\D/g, '').slice(0, 6)
              : '';
          if (!phoneNumber || otp.length !== 6) {
            throw new Error('Phone number and 6-digit OTP are required.');
          }
          const data = await api.verifyPhoneLoginOtp(phoneNumber, otp);
          if (!data?.tokens || !data?.user) {
            throw new Error('Invalid response from server');
          }
          return toBackendUserObject(data);
        } catch (error: any) {
          const rawMessage =
            error?.response?.data?.message || error?.message || 'Phone login failed';
          throw new Error(String(rawMessage));
        }
      },
    }),
    ...(isMeaningfulProviderCredential(env.GOOGLE_CLIENT_ID) &&
    isMeaningfulProviderCredential(env.GOOGLE_CLIENT_SECRET)
      ? [
          GoogleProvider({
            clientId: String(env.GOOGLE_CLIENT_ID),
            clientSecret: String(env.GOOGLE_CLIENT_SECRET),
            allowDangerousEmailAccountLinking: false,
          }),
        ]
      : []),
    ...(isMeaningfulProviderCredential(env.APPLE_ID) &&
    isMeaningfulProviderCredential(env.APPLE_SECRET)
      ? [
          AppleProvider({
            clientId: String(env.APPLE_ID),
            clientSecret: String(env.APPLE_SECRET),
          }),
        ]
      : []),
  ],
};
