export interface SocialLinks {
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
}

export interface ExchangeRates {
  [currency: string]: number;
}

export interface EmailSMTP {
  host?: string;
  port?: number | string;
  user?: string;
  password?: string;
}

export interface GlobalSettings {
  organizationName: string;
  logoUrl: string;
  primaryColor: string;
  contactEmail: string;
  contactPhone: string;
  websiteUrl: string;
  socialLinks: SocialLinks;
  timezone: string;
  language: string;
  multiTenant: boolean;
  eventSchedule: string[];
  enableLiveStreaming: boolean;
  liveStreamUrl: string;
  enableEventRegistration: boolean;
  maxEventParticipants: number;
  enablePayments: boolean;
  currency: string;
  exchangeRates: ExchangeRates;
  donationCategories: string[];
  supportedPaymentGateways: string[];
  defaultPaymentGateway: string;
  enableRecurringDonations: boolean;
  enableReporting: boolean;
  reportingFrequency: string;
  enableAttendanceTracking: boolean;
  trackEngagementPatterns: boolean;
  generateReports: boolean;
  enableDataLocks: boolean;
  lockPeriod: number;
  adminOverride: boolean;
  allowGuestAccess: boolean;
  emailSMTP: EmailSMTP;
  enableSMSNotifications: boolean;
  enablePushNotifications: boolean;
  announcementBroadcast: boolean;
  enableTwoFactorAuth: boolean;
  passwordStrengthPolicy: string;
  gdprCompliance: boolean;
  cookieConsentBanner: boolean;
  enableIPWhitelisting: boolean;
  ipWhitelist: string[];
  apiRateLimit: number;
  accountRecovery: boolean;
}

export interface OnboardingProfileData {
  requiresOnboarding: boolean;
  completed: boolean;
  reason?: string;
  profile?: {
    company?: {
      name?: string;
      receivingAccounts?: any[];
    } | null;
    owner?: any;
    node?: any;
  } | null;
  settings?: GlobalSettings;
}

type OnboardingProfilePayload = {
  ok: boolean;
  error?: string;
  data?: OnboardingProfileData;
};

export const getOnboardingProfile = async (): Promise<OnboardingProfileData> => {
  const response = await fetch('/api/saby/onboarding/profile', { cache: 'no-store' });
  const payload = (await response.json()) as OnboardingProfilePayload;

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || 'Failed to load onboarding profile');
  }

  return payload.data as OnboardingProfileData;
};

export const saveGlobalSettings = async (
  settings: Partial<GlobalSettings>
): Promise<OnboardingProfileData> => {
  const response = await fetch('/api/saby/onboarding/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ settings }),
  });

  const payload = (await response.json()) as OnboardingProfilePayload;
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || 'Failed to save global settings');
  }

  return payload.data as OnboardingProfileData;
};