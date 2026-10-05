'use client';

import Image from 'next/image';
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  Clock3,
  CopyPlus,
  CreditCard,
  FileText,
  Info,
  Link2,
  PanelsTopLeft,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  X,
  KeyRound,
  Eye,
  EyeOff,
  Check,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { QRCodeSVG } from 'qrcode.react';
import { PiSparkleBold } from 'react-icons/pi';
import CustomAiTab from './custom-ai-tab';
import { useCurrentSubscriptionRuntime } from '@/app/lib/subscription/use-current-subscription';
import { findSabyPlan } from './saby-pricing-plans';

export type ProfileSettingsTabId =
  | 'general'
  | 'account'
  | 'custom-ai'
  | 'security'
  | 'apps'
  | 'schedules'
  | 'billing'
  | 'data-controls';

type SabyProfileSettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  isLightTheme: boolean;
  initialTab?: ProfileSettingsTabId;
  displayName?: string;
  displayEmail?: string;
  settingsStorageKey?: string;
  themeMode?: 'light' | 'dark';
  onThemeModeChange?: (mode: 'light' | 'dark') => void;
};

type ModalPreferences = {
  appearance: 'system' | 'light' | 'dark';
  accentColor: 'Default' | 'Ocean' | 'Slate';
  language:
    | 'Auto-detect'
    | 'English'
    | 'French'
    | 'Spanish'
    | 'Portuguese'
    | 'Arabic'
    | 'Hausa'
    | 'Swahili';
  spokenLanguage: 'Auto-detect' | 'English' | 'French';
  responsesChannel: 'Push' | 'Email' | 'Push, Email';
  groupChatsChannel: 'Push' | 'Email' | 'Push, Email';
  tasksChannel: 'Push' | 'Email' | 'Push, Email';
  projectsChannel: 'Push' | 'Email' | 'Push, Email';
  recommendationsChannel: 'Push' | 'Email' | 'Push, Email';
  usageChannel: 'Push' | 'Email' | 'Push, Email';
  authenticatorAppEnabled: boolean;
  pushVerificationEnabled: boolean;
  matureFilterEnabled: boolean;
  purchaseConfirmEnabled: boolean;
  enabledApps: string[];
  alertSchedules: AlertSchedule[];
};

type AlertSchedule = {
  id: string;
  name: string;
  alertType: string;
  frequency: string;
  time: string;
  recipients: string;
  channel: string;
  active: boolean;
};

type PaymentRecord = {
  id?: string;
  _id?: string;
  reference?: string;
  status?: string;
  amount?: number;
  total?: number;
  currency?: string;
  paymentDate?: string;
  completedAt?: string;
  createdAt?: string;
  metadata?: Record<string, any>;
};

type TrustedDevice = {
  id: string;
  current?: boolean;
  deviceType?: string | null;
  firstSeenAt?: string | null;
  deviceName?: string | null;
  browser?: string | null;
  platform?: string | null;
  ip?: string | null;
  lastUsedAt?: string | null;
  sessionCount?: number;
};

type AppTemplate = {
  id: string;
  name: string;
  description: string;
  iconSrc?: string;
};

type TabItem = {
  id: ProfileSettingsTabId;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const tabs: TabItem[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'account', label: 'Account', icon: CircleUserRound },
  { id: 'custom-ai', label: 'Custom AI', icon: PiSparkleBold },
  { id: 'security', label: 'Security', icon: ShieldCheck },
  { id: 'apps', label: 'Apps', icon: PanelsTopLeft },
  { id: 'schedules', label: 'Schedules', icon: Clock3 },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'data-controls', label: 'Data control', icon: SlidersHorizontal },
];

const DEFAULT_MODAL_PREFERENCES: ModalPreferences = {
  appearance: 'light',
  accentColor: 'Default',
  language: 'English',
  spokenLanguage: 'Auto-detect',
  responsesChannel: 'Push',
  groupChatsChannel: 'Push',
  tasksChannel: 'Push, Email',
  projectsChannel: 'Email',
  recommendationsChannel: 'Push, Email',
  usageChannel: 'Push, Email',
  authenticatorAppEnabled: false,
  pushVerificationEnabled: false,
  matureFilterEnabled: true,
  purchaseConfirmEnabled: false,
  enabledApps: [],
  alertSchedules: [],
};

const appIconSources: Record<string, string> = {
  excel: '/xls-icon.svg',
  'google-drive': '/logos/google.svg',
  'microsoft-word': '/doc-icon.svg',
  slides: '/ppt-icon.svg',
  gmail: '/logos/google.svg',
  slack: '/logos/slack.svg',
  teams: '/logos/microsoft.svg',
};

const DEFAULT_APP_TEMPLATES: AppTemplate[] = [
  { id: 'excel', name: 'Excel', description: 'Analyze spreadsheet data and export reports.', iconSrc: appIconSources.excel },
  { id: 'google-drive', name: 'Google Drive', description: 'Find, read, and organize Drive files.', iconSrc: appIconSources['google-drive'] },
  { id: 'microsoft-word', name: 'Microsoft Word', description: 'Create and review structured documents.', iconSrc: appIconSources['microsoft-word'] },
  { id: 'slides', name: 'Slides', description: 'Prepare presentation drafts and summaries.', iconSrc: appIconSources.slides },
  { id: 'gmail', name: 'Gmail', description: 'Search mailbox context and draft replies.', iconSrc: appIconSources.gmail },
  { id: 'slack', name: 'Slack', description: 'Send workspace alerts and workflow updates.', iconSrc: appIconSources.slack },
  { id: 'teams', name: 'Teams', description: 'Route approvals and reminders to Teams.', iconSrc: appIconSources.teams },
  { id: 'webhook', name: 'Webhook', description: 'Connect Saby events to any external endpoint.' },
];

const languageOptions: Array<{
  value: ModalPreferences['language'];
  label: string;
  flag: string;
}> = [
  { value: 'English', label: 'English', flag: '🇬🇧' },
  { value: 'French', label: 'French', flag: '🇫🇷' },
  { value: 'Spanish', label: 'Spanish', flag: '🇪🇸' },
  { value: 'Portuguese', label: 'Portuguese', flag: '🇵🇹' },
  { value: 'Arabic', label: 'Arabic', flag: '🇸🇦' },
  { value: 'Hausa', label: 'Hausa', flag: '🇳🇬' },
  { value: 'Swahili', label: 'Swahili', flag: '🇰🇪' },
];

const normalizePreferences = (
  value: Partial<ModalPreferences> | null | undefined
): ModalPreferences => ({
  ...DEFAULT_MODAL_PREFERENCES,
  ...(value || {}),
});

const withCurrentAppearance = (
  value: Partial<ModalPreferences> | null | undefined,
  currentTheme?: 'light' | 'dark'
): ModalPreferences => ({
  ...normalizePreferences(value),
  appearance: currentTheme || normalizePreferences(value).appearance,
});

const getPersistableModalPreferences = (preferences: ModalPreferences) => {
  const { appearance: _appearance, ...persistablePreferences } = preferences;
  return persistablePreferences;
};

const formatSubscriptionDate = (value?: string | Date | null) => {
  const parsed = value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
};

const titleCase = (value?: string | null) =>
  String(value || 'unknown')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());

const formatInvoiceDate = (value?: string | null) => {
  const parsed = value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return '-';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
};

const formatMoney = (amount?: number | null, currency?: string | null) => {
  const value = Number(amount || 0);
  return `${String(currency || 'NGN').toUpperCase()} ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const getPaymentId = (payment: PaymentRecord) =>
  String(payment.id || payment._id || '');

const getPaymentDate = (payment: PaymentRecord) =>
  payment.completedAt || payment.paymentDate || payment.createdAt || null;

const isReceiptPayment = (payment?: PaymentRecord | null) =>
  ['completed', 'refunded'].includes(String(payment?.status || '').toLowerCase());

const formatTrustedDeviceDate = (value?: string | null) => {
  const parsed = value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return 'Unknown activity';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
};

function ChevronValue({
  value,
  isLightTheme,
  direction = 'down',
  dot = false,
  onClick,
}: {
  value?: string;
  isLightTheme: boolean;
  direction?: 'right' | 'down';
  dot?: boolean;
  onClick?: () => void;
}) {
  const Chevron = direction === 'right' ? ChevronRight : ChevronDown;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 text-[0.92rem] transition ${
        isLightTheme
          ? 'text-[#2f415f] hover:text-[#1d3f84]'
          : 'text-[#e6ebf8] hover:text-white'
      }`}
    >
      {dot ? (
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            isLightTheme ? 'bg-[#6f7f98]' : 'bg-[#adb7cc]'
          }`}
        />
      ) : null}
      {value ? <span>{value}</span> : null}
      <Chevron className="h-4 w-4 opacity-80" />
    </button>
  );
}

function Toggle({
  checked,
  onChange,
  isLightTheme,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  isLightTheme: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
        checked
          ? 'bg-[#2b66e7]'
          : isLightTheme
            ? 'bg-[#c6d1e6]'
            : 'bg-[#4a5467]'
      }`}
      aria-pressed={checked}
    >
      <span
        className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

function AppTemplateIcon({
  app,
  isLightTheme,
}: {
  app: AppTemplate;
  isLightTheme: boolean;
}) {
  const iconSrc = app.iconSrc || appIconSources[app.id];
  return (
    <span
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
        isLightTheme
          ? 'border-[#d0dbef] bg-[#f5f8ff]'
          : 'border-white/15 bg-[#242b38]'
      }`}
    >
      {iconSrc ? (
        <Image
          src={iconSrc}
          alt=""
          width={22}
          height={22}
          className="h-5 w-5 object-contain"
        />
      ) : (
        <Link2
          className={`h-5 w-5 ${isLightTheme ? 'text-[#274f95]' : 'text-[#dbe6ff]'}`}
        />
      )}
    </span>
  );
}

function Row({
  label,
  description,
  leading,
  trailing,
  isLightTheme,
  noBorder = false,
}: {
  label: string;
  description?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  isLightTheme: boolean;
  noBorder?: boolean;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-4 py-4 ${
        noBorder ? '' : isLightTheme ? 'border-b border-[#d8e2f2]' : 'border-b border-white/10'
      }`}
    >
      <div className="min-w-0">
        <div className="flex items-start gap-3">
          {leading ? (
            <span
              className={`mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
                isLightTheme
                  ? 'border-[#d4deee] bg-white text-[#3f526f]'
                  : 'border-white/15 bg-[#1b212c] text-[#dce3f2]'
              }`}
            >
              {leading}
            </span>
          ) : null}
          <div className="min-w-0">
            <p
              className={`text-[0.95rem] leading-6 ${
                isLightTheme ? 'text-[#18253d]' : 'text-white'
              }`}
            >
              {label}
            </p>
            {description ? (
              <p
                  className={`mt-1 text-[0.85rem] leading-5 ${
                    isLightTheme ? 'text-[#5f7090]' : 'text-[#aeb7cb]'
                  }`}
                >
                {description}
              </p>
            ) : null}
          </div>
        </div>
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );
}

function SectionShell({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-[780px]">{children}</div>;
}

function SectionDivider({ isLightTheme }: { isLightTheme: boolean }) {
  return (
    <div className={isLightTheme ? 'border-b border-[#d8e2f2]' : 'border-b border-white/10'} />
  );
}

function OutlineButton({
  children,
  isLightTheme,
}: {
  children: ReactNode;
  isLightTheme: boolean;
}) {
  return (
    <button
      type="button"
      className={`rounded-full border px-4 py-1.5 text-[0.92rem] transition ${
        isLightTheme
          ? 'border-[#c6d6f1] text-[#234f99] hover:bg-[#edf3ff]'
          : 'border-white/20 text-[#dbe7ff] hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}

const base64UrlToArrayBuffer = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
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

type SabyPasskeyCreationOptions = Omit<PublicKeyCredentialCreationOptions, 'challenge' | 'user' | 'excludeCredentials'> & {
  challenge: string;
  user: Omit<PublicKeyCredentialUserEntity, 'id'> & { id: string };
  excludeCredentials?: Array<Omit<PublicKeyCredentialDescriptor, 'id'> & { id: string }>;
};

const preparePasskeyCreationOptions = (
  options: SabyPasskeyCreationOptions
): PublicKeyCredentialCreationOptions => ({
  ...options,
  challenge: base64UrlToArrayBuffer(options.challenge),
  user: {
    ...options.user,
    id: base64UrlToArrayBuffer(options.user.id),
  },
  excludeCredentials: options.excludeCredentials?.map((credential) => ({
    ...credential,
    id: base64UrlToArrayBuffer(credential.id),
  })),
});

const serializePasskeyCredential = (credential: PublicKeyCredential) => {
  const response = credential.response as AuthenticatorAttestationResponse;
  return {
    id: credential.id,
    rawId: arrayBufferToBase64Url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: arrayBufferToBase64Url(response.clientDataJSON),
      attestationObject: arrayBufferToBase64Url(response.attestationObject),
      transports:
        typeof response.getTransports === 'function' ? response.getTransports() : [],
    },
    authenticatorAttachment: credential.authenticatorAttachment || null,
    clientExtensionResults:
      typeof credential.getClientExtensionResults === 'function'
        ? credential.getClientExtensionResults()
        : {},
  };
};

export default function SabyProfileSettingsModal({
  isOpen,
  onClose,
  isLightTheme,
  initialTab = 'general',
  displayName = 'Account user',
  displayEmail = 'user@saby.ai',
  settingsStorageKey,
  themeMode,
  onThemeModeChange,
}: SabyProfileSettingsModalProps) {
  const router = useRouter();
  const subscriptionRuntime = useCurrentSubscriptionRuntime();
  const dialogId = useId();
  const headingId = `${dialogId}-heading`;
  const [activeTab, setActiveTab] = useState<ProfileSettingsTabId>(initialTab);
  const [preferences, setPreferences] = useState<ModalPreferences>(
    DEFAULT_MODAL_PREFERENCES
  );
  const [appTemplates, setAppTemplates] =
    useState<AppTemplate[]>(DEFAULT_APP_TEMPLATES);
  const [showAppTemplates, setShowAppTemplates] = useState(false);
  const [scheduleDraft, setScheduleDraft] = useState<Omit<AlertSchedule, 'id'>>({
    name: '',
    alertType: 'Compliance alert',
    frequency: 'Weekly',
    time: '09:00',
    recipients: '',
    channel: 'Email',
    active: true,
  });
  const [workspaceSchedules, setWorkspaceSchedules] = useState<AlertSchedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleActionId, setScheduleActionId] = useState<string | null>(null);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleStatus, setScheduleStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [billingInvoices, setBillingInvoices] = useState<PaymentRecord[]>([]);
  const [billingInvoicesLoading, setBillingInvoicesLoading] = useState(false);
  const [billingInvoicesError, setBillingInvoicesError] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordStatus, setPasswordStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [sessionActionStatus, setSessionActionStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [sessionActionLoading, setSessionActionLoading] = useState<
    'current' | 'all' | null
  >(null);
  const [trustedDeviceCount, setTrustedDeviceCount] = useState(0);
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([]);
  const [securityOverviewLoading, setSecurityOverviewLoading] = useState(false);
  const [passkeyCount, setPasskeyCount] = useState(0);
  const [passkeyStatus, setPasskeyStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [mfaSetup, setMfaSetup] = useState<{
    secret: string;
    otpauthUrl: string;
  } | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaStatus, setMfaStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [mfaLoading, setMfaLoading] = useState<'setup' | 'verify' | null>(null);
  const [mfaMethod, setMfaMethod] = useState<'authenticator' | 'passkey'>(
    'authenticator'
  );
  const currentPasswordInputRef = useRef<HTMLInputElement | null>(null);
  const mfaCodeInputRefs = useRef<Array<HTMLInputElement | null>>([]);



  const subscriptionPlan = useMemo(
    () => findSabyPlan(subscriptionRuntime.subscription?.planId),
    [subscriptionRuntime.subscription?.planId]
  );
  const subscriptionBillingPeriod =
    String(subscriptionRuntime.subscription?.billingPeriod || '').trim().toLowerCase() ===
    'annual'
      ? 'Annual'
      : 'Monthly';
  const subscriptionRenewalLabel = formatSubscriptionDate(
    subscriptionRuntime.subscription?.renewalAt ||
      subscriptionRuntime.subscription?.currentPeriodEnd ||
      null
  );
  const subscriptionStatusLabel = subscriptionRuntime.loading
    ? 'Loading current workspace subscription'
    : subscriptionRuntime.subscription
      ? `${subscriptionPlan.name} • ${subscriptionBillingPeriod}`
      : 'No active workspace subscription';
  const subscriptionDescription = subscriptionRuntime.loading
    ? 'Checking billing state for this workspace.'
    : subscriptionRuntime.subscription
      ? subscriptionRenewalLabel
        ? `Renews on ${subscriptionRenewalLabel}`
        : 'Manage your current workspace billing and add-ons.'
      : 'Open billing to start or update the current workspace subscription.';
  const subscriptionStatusText = subscriptionRuntime.subscription?.status
    ? titleCase(subscriptionRuntime.subscription.status)
    : subscriptionRuntime.subscription
      ? 'Active'
      : 'No active subscription';
  const [hasLoadedPreferences, setHasLoadedPreferences] = useState(false);
  const [isRemoteReady, setIsRemoteReady] = useState(!settingsStorageKey);
  const syncDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const initialRemoteSyncDoneRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const onThemeModeChangeRef = useRef(onThemeModeChange);
  const themeModeRef = useRef(themeMode);
  const modalPreferencesStorageKey = useMemo(
    () =>
      settingsStorageKey
        ? `${settingsStorageKey}:modal-preferences`
        : 'saby:settings:modal:guest',
    [settingsStorageKey]
  );

  useEffect(() => {
    setHasLoadedPreferences(false);
    setIsRemoteReady(!settingsStorageKey);
    initialRemoteSyncDoneRef.current = false;
  }, [settingsStorageKey]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    onThemeModeChangeRef.current = onThemeModeChange;
  }, [onThemeModeChange]);

  useEffect(() => {
    themeModeRef.current = themeMode;
  }, [themeMode]);

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (!isOpen || activeTab !== 'billing') return;
    let cancelled = false;
    const loadInvoices = async () => {
      setBillingInvoicesLoading(true);
      setBillingInvoicesError('');
      try {
        const response = await fetch('/api/subscriptions/invoices?limit=5&page=1', {
          cache: 'no-store',
        });
        const payload: any = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload?.message || payload?.error || 'Failed to load invoices');
        }
        const rows: PaymentRecord[] = payload?.results || payload?.invoices || payload?.data || [];
        if (!cancelled) {
          setBillingInvoices(Array.isArray(rows) ? rows : []);
        }
      } catch (error: any) {
        if (!cancelled) {
          setBillingInvoices([]);
          setBillingInvoicesError(error?.message || 'Failed to load invoices');
        }
      } finally {
        if (!cancelled) {
          setBillingInvoicesLoading(false);
        }
      }
    };
    void loadInvoices();
    return () => {
      cancelled = true;
    };
  }, [activeTab, isOpen]);


  useEffect(() => {
    if (!isOpen || activeTab !== 'security') return;
    let cancelled = false;
    const loadSecurityOverview = async () => {
      setSecurityOverviewLoading(true);
      try {
        const response = await fetch('/api/saby/security/overview', {
          cache: 'no-store',
        });
        const payload: any = await response.json().catch(() => ({}));
        if (!response.ok || payload?.ok === false || cancelled) return;
        const devices = Array.isArray(payload?.trustedDevices)
          ? payload.trustedDevices
          : [];
        setTrustedDevices(devices);
        setTrustedDeviceCount(
          devices.length
        );
        setPasskeyCount(Number(payload?.mfa?.passkeys?.count || 0));
        if (payload?.mfa?.authenticator?.enabled) {
          setPreferences((prev) => ({
            ...prev,
            authenticatorAppEnabled: true,
          }));
        }
      } catch {
        // Security overview is progressive enhancement for the modal.
      } finally {
        if (!cancelled) {
          setSecurityOverviewLoading(false);
        }
      }
    };
    void loadSecurityOverview();
    return () => {
      cancelled = true;
    };
  }, [activeTab, isOpen]);

  useEffect(() => {
    if (!showPasswordForm) return;
    const focusTimer = window.setTimeout(() => {
      currentPasswordInputRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(focusTimer);
  }, [showPasswordForm]);

  useEffect(() => {
    if (!mfaSetup) return;
    const focusTimer = window.setTimeout(() => {
      mfaCodeInputRefs.current[0]?.focus();
    }, 0);
    return () => window.clearTimeout(focusTimer);
  }, [mfaSetup]);

  useEffect(() => {
    if (!isOpen || activeTab !== 'apps') return;
    let cancelled = false;

    const normalizeAppTemplate = (row: any): AppTemplate | null => {
      const rawId = String(row?.id || row?.appId || row?.appName || row?.name || '')
        .trim()
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/\s+/g, '-')
        .toLowerCase();
      const name = String(row?.label || row?.name || row?.appName || '').trim();
      if (!rawId || !name) return null;
      return {
        id: rawId,
        name,
        iconSrc: appIconSources[rawId],
        description:
          String(row?.description || row?.summary || '').trim() ||
          'Connect this app to Saby workflows.',
      };
    };

    const loadAppCatalog = async () => {
      try {
        const response = await fetch('/api/saby/apps/catalog', {
          cache: 'no-store',
        });
        const payload: any = await response.json().catch(() => ({}));
        if (!response.ok || payload?.ok === false || cancelled) return;
        const rows = Array.isArray(payload?.results) ? payload.results : [];
        const normalized = rows
          .map(normalizeAppTemplate)
          .filter(Boolean) as AppTemplate[];
        if (normalized.length) {
          setAppTemplates(normalized);
        }
      } catch {
        // Keep the curated fallback catalog when the backend catalog is unavailable.
      }
    };

    void loadAppCatalog();
    return () => {
      cancelled = true;
    };
  }, [activeTab, isOpen]);

  const loadWorkspaceSchedules = async () => {
    setSchedulesLoading(true);
    setScheduleStatus(null);
    try {
      const response = await fetch('/api/saby/settings/schedules', {
        cache: 'no-store',
      });
      const payload: any = await response.json().catch(() => ({}));
      if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.error || payload?.message || 'Failed to load schedules');
      }
      const rows = Array.isArray(payload?.results) ? payload.results : [];
      setWorkspaceSchedules(rows);
    } catch (error: any) {
      setWorkspaceSchedules([]);
      setScheduleStatus({
        type: 'error',
        message: error?.message || 'Failed to load schedules',
      });
    } finally {
      setSchedulesLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || activeTab !== 'schedules') return;
    void loadWorkspaceSchedules();
  }, [activeTab, isOpen]);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previousActiveElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    const focusFirstElement = () => {
      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(focusableSelector)
      );
      const firstElement = focusableElements[0];
      if (firstElement) {
        firstElement.focus();
        return;
      }
      dialog.focus();
    };

    focusFirstElement();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(focusableSelector)
      );
      if (!focusableElements.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (activeElement === firstElement || !dialog.contains(activeElement)) {
          event.preventDefault();
          lastElement.focus();
        }
        return;
      }

      if (activeElement === lastElement || !dialog.contains(activeElement)) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
        previousActiveElement.focus();
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(modalPreferencesStorageKey);
      if (!raw) {
        const currentTheme = themeModeRef.current;
        if (currentTheme) {
          setPreferences((prev) => ({
            ...prev,
            appearance: currentTheme,
          }));
        }
        setHasLoadedPreferences(true);
        return;
      }
      const parsed = JSON.parse(raw) as Partial<ModalPreferences>;
      setPreferences(withCurrentAppearance(parsed, themeModeRef.current));
      setHasLoadedPreferences(true);
    } catch {
      setPreferences(DEFAULT_MODAL_PREFERENCES);
      setHasLoadedPreferences(true);
    }
  }, [modalPreferencesStorageKey]);

  useEffect(() => {
    if (!isOpen || !settingsStorageKey) return;
    let cancelled = false;
    const loadRemotePreferences = async () => {
      try {
        const response = await fetch('/api/saby/user-settings/modal', {
          method: 'GET',
          cache: 'no-store',
        });
        if (!response.ok) return;
        const payload = (await response.json()) as {
          ok?: boolean;
          preferences?: Partial<ModalPreferences>;
        };
        if (cancelled || !payload?.ok) return;
        setPreferences(withCurrentAppearance(payload.preferences, themeModeRef.current));
        initialRemoteSyncDoneRef.current = true;
      } catch {
        // Keep local values when remote settings are unavailable.
      } finally {
        if (!cancelled) {
          setIsRemoteReady(true);
        }
      }
    };
    void loadRemotePreferences();
    return () => {
      cancelled = true;
    };
  }, [isOpen, settingsStorageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!hasLoadedPreferences) return;
    window.localStorage.setItem(
      modalPreferencesStorageKey,
      JSON.stringify(getPersistableModalPreferences(preferences))
    );
  }, [hasLoadedPreferences, modalPreferencesStorageKey, preferences]);

  useEffect(() => {
    if (!isOpen || !settingsStorageKey || !hasLoadedPreferences || !isRemoteReady) return;
    if (syncDebounceRef.current) {
      clearTimeout(syncDebounceRef.current);
    }
    syncDebounceRef.current = setTimeout(() => {
      void fetch('/api/saby/user-settings/modal', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: getPersistableModalPreferences(preferences),
        }),
      }).catch(() => null);
    }, initialRemoteSyncDoneRef.current ? 350 : 900);
    return () => {
      if (syncDebounceRef.current) {
        clearTimeout(syncDebounceRef.current);
        syncDebounceRef.current = null;
      }
    };
  }, [hasLoadedPreferences, isOpen, isRemoteReady, preferences, settingsStorageKey]);

  useEffect(() => {
    if (!themeMode) return;
    setPreferences((prev) =>
      prev.appearance === themeMode
        ? prev
        : {
            ...prev,
            appearance: themeMode,
          }
    );
  }, [themeMode]);

  useEffect(() => {
    if (!isOpen || !hasLoadedPreferences) return;
    const desiredTheme = preferences.appearance === 'dark' ? 'dark' : 'light';
    if (themeMode === desiredTheme) return;
    onThemeModeChangeRef.current?.(desiredTheme);
  }, [hasLoadedPreferences, isOpen, preferences.appearance, themeMode]);

  const heading = useMemo(
    () => tabs.find((tab) => tab.id === activeTab)?.label ?? 'Settings',
    [activeTab]
  );

  const effectiveAppearance =
    preferences.appearance === 'dark' ? 'dark' : 'light';

  const toggleAppTemplate = (appId: string) => {
    setPreferences((prev) => {
      const enabled = new Set(prev.enabledApps || []);
      if (enabled.has(appId)) {
        enabled.delete(appId);
      } else {
        enabled.add(appId);
      }
      return {
        ...prev,
        enabledApps: Array.from(enabled),
      };
    });
  };

  const resetScheduleDraft = () => {
    setScheduleDraft({
      name: '',
      alertType: 'Compliance alert',
      frequency: 'Weekly',
      time: '09:00',
      recipients: '',
      channel: 'Email',
      active: true,
    });
  };

  const addAlertSchedule = async () => {
    const name = scheduleDraft.name.trim();
    const recipients = scheduleDraft.recipients.trim();
    if (!name) {
      setScheduleStatus({ type: 'error', message: 'Schedule name is required.' });
      return;
    }
    if (!recipients) {
      setScheduleStatus({ type: 'error', message: 'Add at least one recipient.' });
      return;
    }

    setScheduleSaving(true);
    setScheduleStatus(null);
    try {
      const response = await fetch('/api/saby/settings/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...scheduleDraft,
          name,
          recipients,
        }),
      });
      const payload: any = await response.json().catch(() => ({}));
      if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.error || payload?.message || 'Failed to create schedule');
      }
      resetScheduleDraft();
      setShowScheduleForm(false);
      setScheduleStatus({ type: 'success', message: 'Schedule created successfully.' });
      await loadWorkspaceSchedules();
    } catch (error: any) {
      setScheduleStatus({
        type: 'error',
        message: error?.message || 'Failed to create schedule',
      });
    } finally {
      setScheduleSaving(false);
    }
  };

  const removeAlertSchedule = async (scheduleId: string) => {
    setScheduleActionId(scheduleId);
    setScheduleStatus(null);
    try {
      const response = await fetch(
        `/api/saby/settings/schedules/${encodeURIComponent(scheduleId)}`,
        { method: 'DELETE' }
      );
      const payload: any = await response.json().catch(() => ({}));
      if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.error || payload?.message || 'Failed to remove schedule');
      }
      setScheduleStatus({ type: 'success', message: 'Schedule removed.' });
      await loadWorkspaceSchedules();
    } catch (error: any) {
      setScheduleStatus({
        type: 'error',
        message: error?.message || 'Failed to remove schedule',
      });
    } finally {
      setScheduleActionId(null);
    }
  };

  const resetPasswordForm = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setPasswordStatus(null);
    setShowPasswordForm(false);
  };

  const submitPasswordChange = async () => {
    const currentPassword = passwordForm.currentPassword.trim();
    const newPassword = passwordForm.newPassword.trim();
    const confirmPassword = passwordForm.confirmPassword.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordStatus({
        type: 'error',
        message: 'Enter your current password, new password, and confirmation.',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({
        type: 'error',
        message: 'New password and confirmation do not match.',
      });
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordStatus({
        type: 'error',
        message: 'New password must be different from your current password.',
      });
      return;
    }

    setPasswordSubmitting(true);
    setPasswordStatus(null);
    try {
      const response = await fetch('/api/saby/security/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const payload: any = await response.json().catch(() => ({}));
      if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.error || payload?.message || 'Failed to update password');
      }
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordStatus({
        type: 'success',
        message: 'Password updated successfully.',
      });
      setShowPasswordForm(false);
    } catch (error: any) {
      setPasswordStatus({
        type: 'error',
        message: error?.message || 'Failed to update password',
      });
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const updateMfaCodeDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const digits = mfaCode.padEnd(6, ' ').slice(0, 6).split('');
    digits[index] = digit || ' ';
    setMfaCode(digits.join(''));

    if (digit && index < 5) {
      mfaCodeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleMfaCodePaste = (
    event: React.ClipboardEvent<HTMLInputElement>,
    index: number
  ) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const digits = mfaCode.padEnd(6, ' ').slice(0, 6).split('');
    pasted.split('').forEach((digit, offset) => {
      const targetIndex = index + offset;
      if (targetIndex < 6) {
        digits[targetIndex] = digit;
      }
    });

    setMfaCode(digits.join('').slice(0, 6));
    mfaCodeInputRefs.current[Math.min(index + pasted.length, 5)]?.focus();
  };

  const handleMfaCodeKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (
      event.key === 'Backspace' &&
      !/\d/.test(mfaCode[index] || '') &&
      index > 0
    ) {
      event.preventDefault();
      const digits = mfaCode.padEnd(6, ' ').slice(0, 6).split('');
      digits[index - 1] = ' ';
      setMfaCode(digits.join(''));
      mfaCodeInputRefs.current[index - 1]?.focus();
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      mfaCodeInputRefs.current[index - 1]?.focus();
    }

    if (event.key === 'ArrowRight' && index < 5) {
      event.preventDefault();
      mfaCodeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleSessionLogout = async (scope: 'current' | 'all') => {
    setSessionActionLoading(scope);
    setSessionActionStatus(null);
    try {
      const response = await fetch('/api/saby/security/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope }),
      });
      const payload: any = await response.json().catch(() => ({}));
      if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.error || payload?.message || 'Failed to log out');
      }
      await signOut({ callbackUrl: '/' });
      return;
    } catch (error: any) {
      setSessionActionStatus({
        type: 'error',
        message: error?.message || 'Failed to log out',
      });
    } finally {
      setSessionActionLoading(null);
    }
  };

  const startAuthenticatorSetup = async () => {
    setMfaLoading('setup');
    setMfaStatus(null);
    try {
      const response = await fetch('/api/saby/security/mfa/authenticator/setup', {
        method: 'POST',
      });
      const payload: any = await response.json().catch(() => ({}));
      if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.error || payload?.message || 'Failed to start MFA setup');
      }
      setMfaSetup({
        secret: String(payload.secret || ''),
        otpauthUrl: String(payload.otpauthUrl || ''),
      });
      setMfaStatus({
        type: 'success',
        message: 'Authenticator setup started. Enter the 6-digit code to verify.',
      });
    } catch (error: any) {
      setMfaStatus({
        type: 'error',
        message: error?.message || 'Failed to start MFA setup',
      });
    } finally {
      setMfaLoading(null);
    }
  };

  const verifyAuthenticatorSetup = async () => {
    const code = mfaCode.replace(/\D/g, '').slice(0, 6);
    if (code.length !== 6) {
      setMfaStatus({ type: 'error', message: 'Enter a valid 6-digit code.' });
      return;
    }
    setMfaLoading('verify');
    setMfaStatus(null);
    try {
      const response = await fetch('/api/saby/security/mfa/authenticator/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const payload: any = await response.json().catch(() => ({}));
      if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.error || payload?.message || 'Failed to verify authenticator');
      }
      setPreferences((prev) => ({
        ...prev,
        authenticatorAppEnabled: true,
      }));
      setMfaCode('');
      setMfaSetup(null);
      setMfaStatus({
        type: 'success',
        message: 'Authenticator MFA is now enabled.',
      });
    } catch (error: any) {
      setMfaStatus({
        type: 'error',
        message: error?.message || 'Failed to verify authenticator',
      });
    } finally {
      setMfaLoading(null);
    }
  };

  const startPasskeySetup = async () => {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      setPasskeyStatus({
        type: 'error',
        message: 'This browser does not support passkeys.',
      });
      return;
    }

    setPasskeyStatus({ type: 'info', message: 'Starting passkey setup...' });

    try {
      const optionsResponse = await fetch('/api/saby/security/mfa/passkey/options', {
        method: 'POST',
      });
      const optionsPayload: any = await optionsResponse.json().catch(() => ({}));
      if (!optionsResponse.ok || optionsPayload?.ok === false || !optionsPayload?.publicKey) {
        throw new Error(
          optionsPayload?.error || optionsPayload?.message || 'Failed to start passkey setup'
        );
      }

      const credential = (await navigator.credentials.create({
        publicKey: preparePasskeyCreationOptions(optionsPayload.publicKey),
      })) as PublicKeyCredential | null;

      if (!credential) {
        throw new Error('Passkey setup was cancelled.');
      }

      const verifyResponse = await fetch('/api/saby/security/mfa/passkey/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serializePasskeyCredential(credential)),
      });
      const verifyPayload: any = await verifyResponse.json().catch(() => ({}));
      if (!verifyResponse.ok || verifyPayload?.ok === false) {
        throw new Error(
          verifyPayload?.error || verifyPayload?.message || 'Failed to verify passkey'
        );
      }

      setPasskeyCount(Number(verifyPayload?.passkeys?.count || passkeyCount + 1));
      setPasskeyStatus({
        type: 'success',
        message: 'Passkey registered. You can now use this device as an MFA method.',
      });
    } catch (error: any) {
      setPasskeyStatus({
        type: 'error',
        message: error?.message || 'Failed to set up passkey.',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000]">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
        aria-label="Close settings modal"
      />

      <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-5">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          tabIndex={-1}
          className={`relative flex h-[min(88vh,700px)] w-full max-w-[980px] overflow-hidden rounded-2xl border shadow-2xl ${
            isLightTheme
              ? 'border-[#cfd9ef] bg-[#f5f8ff]'
              : 'border-white/15 bg-[#232630]'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`absolute right-4 top-4 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
              isLightTheme
                ? 'border-[#d8e2f2] bg-white text-[#3f526f] hover:bg-[#eef3ff]'
                : 'border-white/15 bg-[#151a23] text-[#dce3f2] hover:bg-white/10'
            }`}
            aria-label="Close settings modal"
          >
            <X className="h-5 w-5" />
          </button>
          <aside
            className={`flex w-full shrink-0 flex-col md:w-[248px] ${
              isLightTheme
                ? 'border-b border-[#d8e2f2] bg-white md:border-b-0 md:border-r'
                : 'border-b border-white/10 bg-[#232630] md:border-b-0 md:border-r md:border-white/10'
            }`}
          >
            <div className="flex gap-1 overflow-x-auto px-3 pb-3 pt-4 md:block md:space-y-1 md:overflow-y-auto md:px-4 md:pb-4 md:pt-5">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const selected = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-xl px-3 text-[0.93rem] transition md:flex md:w-full ${
                      selected
                        ? isLightTheme
                          ? 'bg-[#e8f0ff] text-[#183f82]'
                          : 'bg-white/10 text-white'
                        : isLightTheme
                          ? 'text-[#2f415f] hover:bg-[#f1f5ff]'
                          : 'text-[#d0d7e8] hover:bg-white/5'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="flex min-w-0 flex-1 flex-col">
            <div
              className={`border-b px-6 py-5 pr-16 ${
                isLightTheme ? 'border-[#d8e2f2]' : 'border-white/10'
              }`}
            >
              <h2
                id={headingId}
                className={`text-[1.55rem] font-semibold ${
                  isLightTheme ? 'text-[#18253d]' : 'text-white'
                }`}
              >
                {heading}
              </h2>
            </div>

            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
              {activeTab === 'general' ? (
                <SectionShell>
                  <SectionDivider isLightTheme={isLightTheme} />
                  <div
                    className={`py-5 ${
                      isLightTheme ? 'border-b border-[#d8e2f2]' : 'border-b border-white/10'
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p
                          className={`text-[0.95rem] leading-6 ${
                            isLightTheme ? 'text-[#18253d]' : 'text-white'
                          }`}
                        >
                          Appearance
                        </p>
                        <p
                          className={`mt-1 text-[0.85rem] leading-5 ${
                            isLightTheme ? 'text-[#5f7090]' : 'text-[#aeb7cb]'
                          }`}
                        >
                          Choose the visual mode for Saby on this device.
                        </p>
                      </div>
                      <div
                        className={`inline-flex rounded-full border p-1 ${
                          isLightTheme
                            ? 'border-[#c8d5ef] bg-[#f2f6ff]'
                            : 'border-white/15 bg-[#151a23]'
                        }`}
                      >
                        {(['light', 'dark'] as const).map((mode) => {
                          const selected = effectiveAppearance === mode;
                          return (
                            <button
                              key={mode}
                              type="button"
                              onClick={() =>
                                setPreferences((prev) => ({
                                  ...prev,
                                  appearance: mode,
                                }))
                              }
                              className={`h-9 rounded-full px-4 text-[0.92rem] font-medium capitalize transition ${
                                selected
                                  ? isLightTheme
                                    ? 'bg-white text-[#183f82] shadow-sm'
                                    : 'bg-white text-[#111827]'
                                  : isLightTheme
                                    ? 'text-[#5f7090] hover:text-[#183f82]'
                                    : 'text-[#aeb7cb] hover:text-white'
                              }`}
                            >
                              {mode}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="py-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p
                          className={`text-[0.95rem] leading-6 ${
                            isLightTheme ? 'text-[#18253d]' : 'text-white'
                          }`}
                        >
                          Language
                        </p>
                        <p
                          className={`mt-1 text-[0.85rem] leading-5 ${
                            isLightTheme ? 'text-[#5f7090]' : 'text-[#aeb7cb]'
                          }`}
                        >
                          Select the interface language for settings and workspace notices.
                        </p>
                      </div>
                      <select
                        value={preferences.language}
                        onChange={(event) =>
                          setPreferences((prev) => ({
                            ...prev,
                            language: event.target.value as ModalPreferences['language'],
                          }))
                        }
                        className={`h-12 w-full rounded-2xl border px-4 text-[0.95rem] font-medium outline-none transition sm:w-[260px] ${
                          isLightTheme
                            ? 'border-[#d8e2f2] bg-white text-[#18253d] focus:border-[#8fb0e8] focus:ring-2 focus:ring-[#8fb0e8]/25'
                            : 'border-white/10 bg-[#151a23] text-white focus:border-white/35 focus:ring-2 focus:ring-white/15'
                        }`}
                      >
                        {languageOptions.map((language) => (
                          <option key={language.value} value={language.value}>
                            {language.flag} {language.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </SectionShell>
              ) : null}

              {activeTab === 'apps' ? (
                <SectionShell>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h3
                      className={`text-[1.4rem] font-semibold ${
                        isLightTheme ? 'text-[#1a2b47]' : 'text-white'
                      }`}
                    >
                      Enabled apps
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowAppTemplates((prev) => !prev)}
                      className={`inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-[0.92rem] transition ${
                        isLightTheme
                          ? 'border-[#c8d7f1] bg-[#f7faff] text-[#274f95] hover:bg-[#edf3ff]'
                          : 'border-white/20 bg-[#2a2d34] text-[#e0e9ff] hover:bg-white/10'
                      }`}
                    >
                      <CopyPlus className="h-4 w-4" />
                      <span>Add app</span>
                    </button>
                  </div>
                  <p
                    className={`mb-3 text-[0.92rem] ${
                      isLightTheme ? 'text-[#5f7090]' : 'text-[#aeb7cb]'
                    }`}
                  >
                    Choose apps Saby can use for workspace files, alerts, and connected workflows.
                  </p>
                  <SectionDivider isLightTheme={isLightTheme} />
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {appTemplates
                      .filter((app) => preferences.enabledApps.includes(app.id))
                      .map((app) => (
                        <div
                          key={app.id}
                          className={`rounded-2xl border p-4 ${
                            isLightTheme
                              ? 'border-[#d8e2f2] bg-white'
                              : 'border-white/10 bg-[#171c26]'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <AppTemplateIcon app={app} isLightTheme={isLightTheme} />
                            <div className="min-w-0 flex-1">
                              <p
                                className={`font-medium ${
                                  isLightTheme ? 'text-[#1a2b47]' : 'text-white'
                                }`}
                              >
                                {app.name}
                              </p>
                              <p
                                className={`mt-1 text-[0.82rem] leading-5 ${
                                  isLightTheme ? 'text-[#5f7090]' : 'text-[#aeb7cb]'
                                }`}
                              >
                                {app.description}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleAppTemplate(app.id)}
                              className={`rounded-full border px-3 py-1 text-xs ${
                                isLightTheme
                                  ? 'border-[#d6e0f1] text-[#315996] hover:bg-[#edf3ff]'
                                  : 'border-white/15 text-[#dbe6ff] hover:bg-white/10'
                              }`}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                  {!preferences.enabledApps.length ? (
                    <div
                      className={`mt-4 rounded-2xl border p-4 text-[0.92rem] ${
                        isLightTheme
                          ? 'border-[#d8e2f2] bg-[#f8fbff] text-[#5f7090]'
                          : 'border-white/10 bg-[#151a23] text-[#aeb7cb]'
                      }`}
                    >
                      No apps enabled yet. Click Add app to choose from the template gallery.
                    </div>
                  ) : null}
                  {showAppTemplates ? (
                    <div
                      className={`mt-5 rounded-2xl border p-4 ${
                        isLightTheme
                          ? 'border-[#d8e2f2] bg-[#f5f8ff]'
                          : 'border-white/10 bg-[#111722]'
                      }`}
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <p
                          className={`text-[1.05rem] font-semibold ${
                            isLightTheme ? 'text-[#1a2b47]' : 'text-white'
                          }`}
                        >
                          App templates
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowAppTemplates(false)}
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
                            isLightTheme ? 'hover:bg-[#eaf2ff]' : 'hover:bg-white/10'
                          }`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {appTemplates.map((app) => {
                          const enabled = preferences.enabledApps.includes(app.id);
                          return (
                            <button
                              key={app.id}
                              type="button"
                              onClick={() => toggleAppTemplate(app.id)}
                              className={`rounded-2xl border p-4 text-left transition ${
                                enabled
                                  ? isLightTheme
                                    ? 'border-[#8fb0e8] bg-[#eaf2ff]'
                                    : 'border-white/30 bg-white/10'
                                  : isLightTheme
                                    ? 'border-[#d8e2f2] bg-white hover:bg-[#f8fbff]'
                                    : 'border-white/10 bg-[#1b212c] hover:bg-white/10'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <AppTemplateIcon app={app} isLightTheme={isLightTheme} />
                                <span className="min-w-0">
                                  <span
                                    className={`block font-medium ${
                                      isLightTheme ? 'text-[#1a2b47]' : 'text-white'
                                    }`}
                                  >
                                    {app.name}
                                  </span>
                                  <span
                                    className={`mt-1 block text-[0.82rem] leading-5 ${
                                      isLightTheme ? 'text-[#5f7090]' : 'text-[#aeb7cb]'
                                    }`}
                                  >
                                    {app.description}
                                  </span>
                                  <span
                                    className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs ${
                                      enabled
                                        ? isLightTheme
                                          ? 'border-[#9bb7e9] text-[#214c91]'
                                          : 'border-white/30 text-white'
                                        : isLightTheme
                                          ? 'border-[#d8e2f2] text-[#5f7090]'
                                          : 'border-white/15 text-[#aeb7cb]'
                                    }`}
                                  >
                                    {enabled ? 'Enabled' : 'Add app'}
                                  </span>
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                  <div
                    className={`mt-4 rounded-2xl border p-4 ${
                      isLightTheme
                        ? 'border-[#d8e2f2] bg-[#f5f8ff]'
                        : 'border-white/15 bg-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <Info className="mt-0.5 h-6 w-6 shrink-0" />
                        <div>
                          <p className="text-lg font-medium">Looking for Connectors?</p>
                          <p
                            className={`mt-1 text-[0.9rem] ${
                              isLightTheme ? 'text-[#5f7090]' : 'text-[#c0c8da]'
                            }`}
                          >
                            Connectors are now called Apps. You can still manage enabled ones here.
                          </p>
                          <button
                            type="button"
                            className="mt-1 text-[0.9rem] underline underline-offset-4"
                          >
                            Explore all apps
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
                          isLightTheme ? 'hover:bg-[#eaf2ff]' : 'hover:bg-white/10'
                        }`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </SectionShell>
              ) : null}

              {activeTab === 'schedules' ? (
                <SectionShell>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3
                        className={`text-[1.35rem] font-semibold ${
                          isLightTheme ? 'text-[#1a2b47]' : 'text-white'
                        }`}
                      >
                        Workspace schedules
                      </h3>
                      <p
                        className={`mt-1 text-[0.92rem] ${
                          isLightTheme ? 'text-[#5f7090]' : 'text-[#aeb7cb]'
                        }`}
                      >
                        Existing alert schedules for this workspace.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowScheduleForm((prev) => !prev);
                        setScheduleStatus(null);
                      }}
                      className={`inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-[0.92rem] transition ${
                        isLightTheme
                          ? 'border-[#c8d7f1] bg-[#f7faff] text-[#274f95] hover:bg-[#edf3ff]'
                          : 'border-white/20 bg-[#2a2d34] text-[#e0e9ff] hover:bg-white/10'
                      }`}
                    >
                      <CopyPlus className="h-4 w-4" />
                      <span>Add Schedule</span>
                    </button>
                  </div>
                  <SectionDivider isLightTheme={isLightTheme} />

                  {scheduleStatus ? (
                    <p
                      className={`mt-4 rounded-xl border px-3 py-2 text-sm ${
                        scheduleStatus.type === 'success'
                          ? isLightTheme
                            ? 'border-[#b6e2a5] bg-[#eaf9e2] text-[#3d7a2e]'
                            : 'border-[#2f7d4c]/70 bg-[#123522] text-[#8ee6af]'
                          : isLightTheme
                            ? 'border-[#f3c0c8] bg-[#fdecef] text-[#be485f]'
                            : 'border-[#fb7185]/45 bg-[#3a1720] text-[#fda4af]'
                      }`}
                    >
                      {scheduleStatus.message}
                    </p>
                  ) : null}

                  {showScheduleForm ? (
                    <div
                      className={`mt-5 rounded-2xl border p-5 ${
                        isLightTheme
                          ? 'border-[#d8e2f2] bg-white'
                          : 'border-white/10 bg-[#151a23]'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3
                            className={`text-[1.3rem] font-semibold ${
                              isLightTheme ? 'text-[#1a2b47]' : 'text-white'
                            }`}
                          >
                            Create alert schedule
                          </h3>
                          <p
                            className={`mt-1 text-[0.92rem] ${
                              isLightTheme ? 'text-[#5f7090]' : 'text-[#aeb7cb]'
                            }`}
                          >
                            Configure recurring alerts for compliance, anomaly, billing, or system events.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            resetScheduleDraft();
                            setShowScheduleForm(false);
                            setScheduleStatus(null);
                          }}
                          disabled={scheduleSaving}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
                            isLightTheme
                              ? 'border-[#c8d7f1] text-[#274f95] hover:bg-[#edf3ff]'
                              : 'border-white/20 text-[#e0e9ff] hover:bg-white/10'
                          }`}
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className={`text-sm ${isLightTheme ? 'text-[#2f415f]' : 'text-[#dbe3f3]'}`}>
                            Schedule name
                          </span>
                          <input
                            value={scheduleDraft.name}
                            onChange={(event) =>
                              setScheduleDraft((prev) => ({ ...prev, name: event.target.value }))
                            }
                            placeholder="Branch compliance reminder"
                            className={`mt-2 h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                              isLightTheme
                                ? 'border-[#d8e2f2] bg-[#f8fbff] text-[#18253d] focus:border-[#8fb0e8] focus:ring-2 focus:ring-[#8fb0e8]/25'
                                : 'border-white/10 bg-[#0f141c] text-white focus:border-white/35 focus:ring-2 focus:ring-white/15'
                            }`}
                          />
                        </label>
                        <label className="block">
                          <span className={`text-sm ${isLightTheme ? 'text-[#2f415f]' : 'text-[#dbe3f3]'}`}>
                            Alert type
                          </span>
                          <select
                            value={scheduleDraft.alertType}
                            onChange={(event) =>
                              setScheduleDraft((prev) => ({ ...prev, alertType: event.target.value }))
                            }
                            className={`mt-2 h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                              isLightTheme
                                ? 'border-[#d8e2f2] bg-[#f8fbff] text-[#18253d] focus:border-[#8fb0e8] focus:ring-2 focus:ring-[#8fb0e8]/25'
                                : 'border-white/10 bg-[#0f141c] text-white focus:border-white/35 focus:ring-2 focus:ring-white/15'
                            }`}
                          >
                            <option>Compliance alert</option>
                            <option>Anomaly alert</option>
                            <option>Billing alert</option>
                            <option>System alert</option>
                          </select>
                        </label>
                        <label className="block">
                          <span className={`text-sm ${isLightTheme ? 'text-[#2f415f]' : 'text-[#dbe3f3]'}`}>
                            Frequency
                          </span>
                          <select
                            value={scheduleDraft.frequency}
                            onChange={(event) =>
                              setScheduleDraft((prev) => ({ ...prev, frequency: event.target.value }))
                            }
                            className={`mt-2 h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                              isLightTheme
                                ? 'border-[#d8e2f2] bg-[#f8fbff] text-[#18253d] focus:border-[#8fb0e8] focus:ring-2 focus:ring-[#8fb0e8]/25'
                                : 'border-white/10 bg-[#0f141c] text-white focus:border-white/35 focus:ring-2 focus:ring-white/15'
                            }`}
                          >
                            <option>Daily</option>
                            <option>Weekly</option>
                            <option>Monthly</option>
                          </select>
                        </label>
                        <label className="block">
                          <span className={`text-sm ${isLightTheme ? 'text-[#2f415f]' : 'text-[#dbe3f3]'}`}>
                            Time
                          </span>
                          <input
                            type="time"
                            value={scheduleDraft.time}
                            onChange={(event) =>
                              setScheduleDraft((prev) => ({ ...prev, time: event.target.value }))
                            }
                            className={`mt-2 h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                              isLightTheme
                                ? 'border-[#d8e2f2] bg-[#f8fbff] text-[#18253d] focus:border-[#8fb0e8] focus:ring-2 focus:ring-[#8fb0e8]/25'
                                : 'border-white/10 bg-[#0f141c] text-white focus:border-white/35 focus:ring-2 focus:ring-white/15'
                            }`}
                          />
                        </label>
                        <label className="block sm:col-span-2">
                          <span className={`text-sm ${isLightTheme ? 'text-[#2f415f]' : 'text-[#dbe3f3]'}`}>
                            Recipients
                          </span>
                          <input
                            value={scheduleDraft.recipients}
                            onChange={(event) =>
                              setScheduleDraft((prev) => ({ ...prev, recipients: event.target.value }))
                            }
                            placeholder="ops@saby.ai, compliance@saby.ai"
                            className={`mt-2 h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                              isLightTheme
                                ? 'border-[#d8e2f2] bg-[#f8fbff] text-[#18253d] focus:border-[#8fb0e8] focus:ring-2 focus:ring-[#8fb0e8]/25'
                                : 'border-white/10 bg-[#0f141c] text-white focus:border-white/35 focus:ring-2 focus:ring-white/15'
                            }`}
                          />
                        </label>
                        <label className="block">
                          <span className={`text-sm ${isLightTheme ? 'text-[#2f415f]' : 'text-[#dbe3f3]'}`}>
                            Delivery channel
                          </span>
                          <select
                            value={scheduleDraft.channel}
                            onChange={(event) =>
                              setScheduleDraft((prev) => ({ ...prev, channel: event.target.value }))
                            }
                            className={`mt-2 h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                              isLightTheme
                                ? 'border-[#d8e2f2] bg-[#f8fbff] text-[#18253d] focus:border-[#8fb0e8] focus:ring-2 focus:ring-[#8fb0e8]/25'
                                : 'border-white/10 bg-[#0f141c] text-white focus:border-white/35 focus:ring-2 focus:ring-white/15'
                            }`}
                          >
                            <option>Email</option>
                            <option>In-app</option>
                            <option>Email + In-app</option>
                          </select>
                        </label>
                        <div className="flex items-end justify-between gap-4">
                          <div>
                            <p className={`text-sm ${isLightTheme ? 'text-[#2f415f]' : 'text-[#dbe3f3]'}`}>
                              Active
                            </p>
                            <div className="mt-2">
                              <Toggle
                                checked={scheduleDraft.active}
                                onChange={(value) =>
                                  setScheduleDraft((prev) => ({ ...prev, active: value }))
                                }
                                isLightTheme={isLightTheme}
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={addAlertSchedule}
                            disabled={scheduleSaving}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
                              isLightTheme
                                ? 'bg-[#111827] text-white hover:bg-[#1f2937]'
                                : 'bg-white text-[#111827] hover:bg-[#e5e7eb]'
                            }`}
                          >
                            {scheduleSaving ? 'Creating...' : 'Create schedule'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-5 space-y-3">
                    {schedulesLoading ? (
                      <p
                        className={`rounded-2xl border p-4 text-[0.92rem] ${
                          isLightTheme
                            ? 'border-[#d8e2f2] bg-[#f8fbff] text-[#5f7090]'
                            : 'border-white/10 bg-[#151a23] text-[#aeb7cb]'
                        }`}
                      >
                        Loading schedules...
                      </p>
                    ) : null}
                    {!schedulesLoading && workspaceSchedules.length
                      ? workspaceSchedules.map((schedule) => (
                          <div
                            key={schedule.id}
                            className={`rounded-2xl border p-4 ${
                              isLightTheme
                                ? 'border-[#d8e2f2] bg-white'
                                : 'border-white/10 bg-[#151a23]'
                            }`}
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p
                                  className={`font-medium ${
                                    isLightTheme ? 'text-[#1a2b47]' : 'text-white'
                                  }`}
                                >
                                  {schedule.name}
                                </p>
                                <p
                                  className={`mt-1 text-[0.86rem] ${
                                    isLightTheme ? 'text-[#5f7090]' : 'text-[#aeb7cb]'
                                  }`}
                                >
                                  {schedule.alertType} • {schedule.frequency} at {schedule.time} • {schedule.channel}
                                </p>
                                {schedule.recipients ? (
                                  <p
                                    className={`mt-1 text-[0.82rem] ${
                                      isLightTheme ? 'text-[#6b7893]' : 'text-[#98a4ba]'
                                    }`}
                                  >
                                    {schedule.recipients}
                                  </p>
                                ) : null}
                              </div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`rounded-full border px-2.5 py-1 text-xs ${
                                    schedule.active
                                      ? isLightTheme
                                        ? 'border-[#b6e2a5] bg-[#eaf9e2] text-[#3d7a2e]'
                                        : 'border-[#2f7d4c]/70 bg-[#123522] text-[#8ee6af]'
                                      : isLightTheme
                                        ? 'border-[#d7dfed] bg-[#f1f5f9] text-[#475569]'
                                        : 'border-white/15 bg-white/[0.05] text-white/65'
                                  }`}
                                >
                                  {schedule.active ? 'Active' : 'Paused'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeAlertSchedule(schedule.id)}
                                  disabled={scheduleActionId === schedule.id}
                                  className="rounded-full border border-[#d65b5b] px-3 py-1 text-xs text-[#ff8d8d] transition hover:bg-[#3a1818] disabled:opacity-60"
                                >
                                  {scheduleActionId === schedule.id ? 'Removing...' : 'Remove'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      : null}
                    {!schedulesLoading && !workspaceSchedules.length ? (
                      <p
                        className={`rounded-2xl border p-4 text-[0.92rem] ${
                          isLightTheme
                            ? 'border-[#d8e2f2] bg-[#f8fbff] text-[#5f7090]'
                            : 'border-white/10 bg-[#151a23] text-[#aeb7cb]'
                        }`}
                      >
                        No workspace alert schedules yet. Use Add Schedule to create one.
                      </p>
                    ) : null}
                  </div>
                </SectionShell>
              ) : null}

              {activeTab === 'billing' ? (
                <SectionShell>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3
                        className={`text-[1.35rem] font-semibold ${
                          isLightTheme ? 'text-[#1a2b47]' : 'text-white'
                        }`}
                      >
                        Recent invoices
                      </h3>
                      <p
                        className={`mt-1 text-[0.92rem] ${
                          isLightTheme ? 'text-[#5f7090]' : 'text-[#aeb7cb]'
                        }`}
                      >
                        A compact view of your latest subscription invoices.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        router.push('/billing');
                      }}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        isLightTheme
                          ? 'border-[#c8d7f1] bg-white text-[#274f95] hover:bg-[#edf3ff]'
                          : 'border-white/20 bg-white/5 text-white hover:bg-white/10'
                      }`}
                    >
                      View all
                    </button>
                  </div>
                  <SectionDivider isLightTheme={isLightTheme} />
                  <div className="mt-4 space-y-3">
                    {billingInvoicesLoading ? (
                      Array.from({ length: 3 }).map((_, index) => (
                        <div
                          key={index}
                          className={`h-20 animate-pulse rounded-2xl border ${
                            isLightTheme
                              ? 'border-[#d8e2f2] bg-white'
                              : 'border-white/10 bg-[#151a23]'
                          }`}
                        />
                      ))
                    ) : billingInvoicesError ? (
                      <div
                        className={`rounded-2xl border p-4 text-[0.92rem] ${
                          isLightTheme
                            ? 'border-[#f3c0c8] bg-[#fdecef] text-[#be485f]'
                            : 'border-[#fb7185]/45 bg-[#3a1720] text-[#fda4af]'
                        }`}
                      >
                        {billingInvoicesError}
                      </div>
                    ) : billingInvoices.length ? (
                      billingInvoices.map((invoice, index) => {
                        const paymentId = getPaymentId(invoice);
                        const documentLabel = isReceiptPayment(invoice)
                          ? 'Receipt'
                          : 'Invoice';
                        return (
                          <div
                            key={paymentId || invoice.reference || `invoice-${index}`}
                            className={`rounded-2xl border p-4 ${
                              isLightTheme
                                ? 'border-[#d8e2f2] bg-white'
                                : 'border-white/10 bg-[#151a23]'
                            }`}
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex min-w-0 items-start gap-3">
                                <span
                                  className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
                                    isLightTheme
                                      ? 'border-[#d0dbef] bg-[#f5f8ff] text-[#274f95]'
                                      : 'border-white/15 bg-[#242b38] text-[#dbe6ff]'
                                  }`}
                                >
                                  <FileText className="h-5 w-5" />
                                </span>
                                <div className="min-w-0">
                                  <p
                                    className={`truncate font-medium ${
                                      isLightTheme ? 'text-[#1a2b47]' : 'text-white'
                                    }`}
                                  >
                                    {invoice.metadata?.planName || invoice.reference || 'Subscription invoice'}
                                  </p>
                                  <p
                                    className={`mt-1 text-[0.82rem] ${
                                      isLightTheme ? 'text-[#5f7090]' : 'text-[#aeb7cb]'
                                    }`}
                                  >
                                    {formatInvoiceDate(getPaymentDate(invoice))} • {invoice.reference || paymentId || 'No reference'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                                <span
                                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                                    String(invoice.status || '').toLowerCase() === 'completed'
                                      ? isLightTheme
                                        ? 'border-[#b6e2a5] bg-[#eaf9e2] text-[#3d7a2e]'
                                        : 'border-[#2f7d4c]/70 bg-[#123522] text-[#8ee6af]'
                                      : isLightTheme
                                        ? 'border-[#d7dfed] bg-[#f1f5f9] text-[#475569]'
                                        : 'border-white/15 bg-white/[0.05] text-white/65'
                                  }`}
                                >
                                  {titleCase(invoice.status)}
                                </span>
                                <span
                                  className={`text-sm font-semibold ${
                                    isLightTheme ? 'text-[#1a2b47]' : 'text-white'
                                  }`}
                                >
                                  {formatMoney(invoice.total || invoice.amount, invoice.currency)}
                                </span>
                                {paymentId ? (
                                  <a
                                    href={`/api/subscriptions/invoices/${encodeURIComponent(paymentId)}/billing-document`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                      isLightTheme
                                        ? 'border-[#c8d7f1] text-[#274f95] hover:bg-[#edf3ff]'
                                        : 'border-white/20 text-[#e0e9ff] hover:bg-white/10'
                                    }`}
                                  >
                                    {documentLabel}
                                  </a>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div
                        className={`rounded-2xl border p-4 text-[0.92rem] ${
                          isLightTheme
                            ? 'border-[#d8e2f2] bg-[#f8fbff] text-[#5f7090]'
                            : 'border-white/10 bg-[#151a23] text-[#aeb7cb]'
                        }`}
                      >
                        No invoices found yet.
                      </div>
                    )}
                  </div>
                </SectionShell>
              ) : null}

              {activeTab === 'data-controls' ? (
                <SectionShell>
                  <SectionDivider isLightTheme={isLightTheme} />
                  <Row
                    label="Chat history and training"
                    description="Allow Saby to use chat activity to improve response quality."
                    trailing={
                      <Toggle
                        checked={preferences.matureFilterEnabled}
                        onChange={(value) =>
                          setPreferences((prev) => ({
                            ...prev,
                            matureFilterEnabled: value,
                          }))
                        }
                        isLightTheme={isLightTheme}
                      />
                    }
                    isLightTheme={isLightTheme}
                  />
                  <Row
                    label="Analytics sharing"
                    description="Share anonymous usage metrics for product improvements."
                    trailing={
                      <Toggle
                        checked={preferences.purchaseConfirmEnabled}
                        onChange={(value) =>
                          setPreferences((prev) => ({
                            ...prev,
                            purchaseConfirmEnabled: value,
                          }))
                        }
                        isLightTheme={isLightTheme}
                      />
                    }
                    isLightTheme={isLightTheme}
                  />
                  <Row
                    label="Export account data"
                    description="Download your account profile and usage records."
                    trailing={
                      <ChevronValue
                        value="Export"
                        direction="right"
                        isLightTheme={isLightTheme}
                      />
                    }
                    isLightTheme={isLightTheme}
                  />
                  <Row
                    label="Delete all chats"
                    description="Permanently remove all conversations from this account."
                    trailing={
                      <button
                        type="button"
                        className="rounded-full border border-[#d65b5b] px-4 py-1.5 text-sm text-[#ff8d8d] transition hover:bg-[#3a1818]"
                      >
                        Delete
                      </button>
                    }
                    isLightTheme={isLightTheme}
                    noBorder
                  />
                </SectionShell>
              ) : null}

              {activeTab === 'security' ? (
                <SectionShell>
                  <SectionDivider isLightTheme={isLightTheme} />
                  <div
                    className={`py-4 ${
                      isLightTheme ? 'border-b border-[#d8e2f2]' : 'border-b border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p
                          className={`text-[0.95rem] leading-6 ${
                            isLightTheme ? 'text-[#18253d]' : 'text-white'
                          }`}
                        >
                          Password
                        </p>
                        <p
                          className={`mt-1 text-[0.85rem] leading-5 ${
                            isLightTheme ? 'text-[#5f7090]' : 'text-[#aeb7cb]'
                          }`}
                        >
                          Replace your account password after confirming the current one.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordForm((prev) => !prev);
                          setPasswordStatus(null);
                        }}
                        className={`inline-flex items-center gap-2 text-[0.92rem] transition ${
                          isLightTheme
                            ? 'text-[#2f415f] hover:text-[#1d3f84]'
                            : 'text-[#e6ebf8] hover:text-white'
                        }`}
                      >
                        <span>{showPasswordForm ? 'Close' : 'Change'}</span>
                        <ChevronRight
                          className={`h-4 w-4 transition ${
                            showPasswordForm ? 'rotate-90' : ''
                          }`}
                        />
                      </button>
                    </div>
                    {showPasswordForm ? (
                      <div
                        className={`mt-4 rounded-2xl border p-4 ${
                          isLightTheme
                            ? 'border-[#d8e2f2] bg-white'
                            : 'border-white/10 bg-[#151a23]'
                        }`}
                      >
                        <div className="grid gap-3">
                          {[
                            ['currentPassword', 'Current password'],
                            ['newPassword', 'New password'],
                            ['confirmPassword', 'Confirm new password'],
                          ].map(([field, label]) => (
                            <label key={field} className="block">
                              <span
                                className={`text-sm ${
                                  isLightTheme ? 'text-[#2f415f]' : 'text-[#dbe3f3]'
                                }`}
                              >
                                {label}
                              </span>
                              <input
                                ref={
                                  field === 'currentPassword'
                                    ? currentPasswordInputRef
                                    : undefined
                                }
                                name={field}
                                type="password"
                                value={passwordForm[field as keyof typeof passwordForm]}
                                onChange={(event) =>
                                  setPasswordForm((prev) => ({
                                    ...prev,
                                    [field]: event.target.value,
                                  }))
                                }
                                autoComplete={
                                  field === 'currentPassword'
                                    ? 'current-password'
                                    : 'new-password'
                                }
                                className={`mt-2 h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                                  isLightTheme
                                    ? 'border-[#d8e2f2] bg-[#f8fbff] text-[#18253d]'
                                    : 'border-white/10 bg-[#0f141c] text-white'
                                }`}
                              />
                            </label>
                          ))}
                        </div>
                        {passwordStatus ? (
                          <p
                            className={`mt-3 rounded-xl border px-3 py-2 text-sm ${
                              passwordStatus.type === 'success'
                                ? isLightTheme
                                  ? 'border-[#b6e2a5] bg-[#eaf9e2] text-[#3d7a2e]'
                                  : 'border-[#2f7d4c]/70 bg-[#123522] text-[#8ee6af]'
                                : isLightTheme
                                  ? 'border-[#f3c0c8] bg-[#fdecef] text-[#be485f]'
                                  : 'border-[#fb7185]/45 bg-[#3a1720] text-[#fda4af]'
                            }`}
                          >
                            {passwordStatus.message}
                          </p>
                        ) : null}
                        <div className="mt-4 flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={resetPasswordForm}
                            className={`rounded-full border px-4 py-2 text-sm transition ${
                              isLightTheme
                                ? 'border-[#c8d7f1] text-[#274f95] hover:bg-[#edf3ff]'
                                : 'border-white/20 text-[#e0e9ff] hover:bg-white/10'
                            }`}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={submitPasswordChange}
                            disabled={passwordSubmitting}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${
                              isLightTheme
                                ? 'bg-[#111827] text-white hover:bg-[#1f2937]'
                                : 'bg-white text-[#111827] hover:bg-[#e5e7eb]'
                            }`}
                          >
                            {passwordSubmitting ? 'Saving...' : 'Save password'}
                          </button>
                        </div>
                      </div>
                    ) : passwordStatus ? (
                      <p
                        className={`mt-3 rounded-xl border px-3 py-2 text-sm ${
                          passwordStatus.type === 'success'
                            ? isLightTheme
                              ? 'border-[#b6e2a5] bg-[#eaf9e2] text-[#3d7a2e]'
                              : 'border-[#2f7d4c]/70 bg-[#123522] text-[#8ee6af]'
                            : isLightTheme
                              ? 'border-[#f3c0c8] bg-[#fdecef] text-[#be485f]'
                              : 'border-[#fb7185]/45 bg-[#3a1720] text-[#fda4af]'
                        }`}
                      >
                        {passwordStatus.message}
                      </p>
                    ) : null}
                  </div>
                  <p
                    className={`mt-4 text-[1.4rem] font-semibold ${
                      isLightTheme ? 'text-[#1a2b47]' : 'text-white'
                    }`}
                  >
                    Multi-factor authentication (MFA)
                  </p>
                  <p
                    className={`mt-1 text-[0.92rem] leading-6 ${
                      isLightTheme ? 'text-[#5f7090]' : 'text-[#aeb7cb]'
                    }`}
                  >
                    Choose one account protection method. Authenticator 2FA is available now;
                    passkey setup requires the WebAuthn backend before it can be enabled.
                  </p>
                  <div
                    className={`mt-4 rounded-2xl border p-4 ${
                      isLightTheme
                        ? 'border-[#d8e2f2] bg-white'
                        : 'border-white/10 bg-[#151a23]'
                    }`}
                  >
                    <div
                      className={`grid gap-2 rounded-2xl border p-2 sm:grid-cols-2 ${
                        isLightTheme
                          ? 'border-[#d8e2f2] bg-[#f8fbff]'
                          : 'border-white/10 bg-[#0f141c]'
                      }`}
                    >
                      <div
                        className={`rounded-xl border p-3 transition ${
                          mfaMethod === 'authenticator'
                            ? isLightTheme
                              ? 'border-[#8fb0e8] bg-white text-[#183f82]'
                              : 'border-white/30 bg-white/10 text-white'
                            : isLightTheme
                              ? 'border-transparent text-[#2f415f]'
                              : 'border-transparent text-[#dbe3f3]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setMfaMethod('authenticator')}
                          className="block w-full text-left"
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold">Authenticator 2FA</span>
                            {mfaMethod === 'authenticator' ? (
                              <span
                                className={`h-2.5 w-2.5 rounded-full ${
                                  isLightTheme ? 'bg-[#2b66e7]' : 'bg-white'
                                }`}
                              />
                            ) : null}
                          </span>
                          <span className="mt-1 block text-[0.8rem] leading-5 opacity-80">
                            {preferences.authenticatorAppEnabled
                              ? 'Enabled for this account'
                              : 'Use Google Authenticator or another code app'}
                          </span>
                        </button>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {!preferences.authenticatorAppEnabled ? (
                            <button
                              type="button"
                              onClick={startAuthenticatorSetup}
                              disabled={Boolean(mfaLoading)}
                              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                                isLightTheme
                                  ? 'bg-[#111827] text-white hover:bg-[#1f2937]'
                                  : 'bg-white text-[#111827] hover:bg-[#e5e7eb]'
                              }`}
                            >
                              {mfaLoading === 'setup' ? 'Starting...' : 'Set up'}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            disabled={!preferences.authenticatorAppEnabled}
                            onClick={() =>
                              setMfaStatus({
                                type: 'success',
                                message:
                                  'Authenticator 2FA is enabled. Recovery codes and method removal can be added to this management flow next.',
                              })
                            }
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              isLightTheme
                                ? 'border-[#c8d7f1] text-[#274f95] hover:bg-[#edf3ff]'
                                : 'border-white/20 text-[#e0e9ff] hover:bg-white/10'
                            }`}
                          >
                            Manage
                          </button>
                        </div>
                      </div>
                      <div
                        className={`rounded-xl border p-3 transition ${
                          mfaMethod === 'passkey'
                            ? isLightTheme
                              ? 'border-[#8fb0e8] bg-white text-[#183f82]'
                              : 'border-white/30 bg-white/10 text-white'
                            : isLightTheme
                              ? 'border-transparent text-[#2f415f]'
                              : 'border-transparent text-[#dbe3f3]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setMfaMethod('passkey')}
                          className="block w-full text-left"
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold">Passkey</span>
                            {mfaMethod === 'passkey' ? (
                              <span
                                className={`h-2.5 w-2.5 rounded-full ${
                                  isLightTheme ? 'bg-[#2b66e7]' : 'bg-white'
                                }`}
                              />
                            ) : null}
                          </span>
                          <span className="mt-1 block text-[0.8rem] leading-5 opacity-80">
                            {passkeyCount > 0
                              ? `${passkeyCount} passkey${passkeyCount === 1 ? '' : 's'} registered`
                              : 'Face ID, Touch ID, Windows Hello, or security key'}
                          </span>
                        </button>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={startPasskeySetup}
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                              isLightTheme
                                ? 'bg-[#111827] text-white hover:bg-[#1f2937]'
                                : 'bg-white text-[#111827] hover:bg-[#e5e7eb]'
                            }`}
                          >
                            {passkeyCount > 0 ? 'Manage' : 'Set up'}
                          </button>
                        </div>
                      </div>
                    </div>
                    {mfaMethod === 'passkey' ? (
                      <div
                        className={`mt-4 rounded-xl border p-3 text-sm ${
                          isLightTheme
                            ? 'border-[#d8e2f2] bg-[#f8fbff] text-[#5f7090]'
                            : 'border-white/10 bg-[#0f141c] text-[#aeb7cb]'
                        }`}
                      >
                        {passkeyStatus?.message ||
                          'Set up a passkey with Face ID, Touch ID, Windows Hello, or a security key.'}
                      </div>
                    ) : null}
                    {mfaSetup ? (
                      <div
                        className={`mt-4 rounded-xl border p-3 ${
                          isLightTheme
                            ? 'border-[#d8e2f2] bg-[#f8fbff]'
                            : 'border-white/10 bg-[#0f141c]'
                        }`}
                      >
                        <p
                          className={`text-sm font-medium ${
                            isLightTheme ? 'text-[#1a2b47]' : 'text-white'
                          }`}
                        >
                          Add this secret to your authenticator app
                        </p>
                        <div className="mt-3 grid gap-4 sm:grid-cols-[168px_1fr] sm:items-start">
                          <div
                            className={`inline-flex rounded-2xl border p-3 ${
                              isLightTheme
                                ? 'border-[#d8e2f2] bg-white'
                                : 'border-white/10 bg-white'
                            }`}
                          >
                            <QRCodeSVG
                              value={mfaSetup.otpauthUrl || mfaSetup.secret}
                              size={144}
                              includeMargin
                              fgColor="#111827"
                              bgColor="#ffffff"
                            />
                          </div>
                          <div>
                            <p
                              className={`text-[0.88rem] leading-6 ${
                                isLightTheme ? 'text-[#5f7090]' : 'text-[#aeb7cb]'
                              }`}
                            >
                              Scan this barcode in Google Authenticator, Microsoft
                              Authenticator, 1Password, Authy, or any TOTP app. If scanning
                              fails, enter the setup key manually.
                            </p>
                            <code
                              className={`mt-2 block break-all rounded-lg px-3 py-2 text-xs ${
                                isLightTheme
                                  ? 'bg-white text-[#274f95]'
                                  : 'bg-[#151a23] text-[#dbe6ff]'
                              }`}
                            >
                              {mfaSetup.secret}
                            </code>
                          </div>
                        </div>
                        <div className="mt-4">
                          <p
                            className={`mb-2 text-sm ${
                              isLightTheme ? 'text-[#2f415f]' : 'text-[#dbe3f3]'
                            }`}
                          >
                            Enter 6-digit code
                          </p>
                          <div className="flex gap-2 sm:gap-3">
                            {Array.from({ length: 6 }).map((_, index) => (
                              <input
                                key={index}
                                ref={(element) => {
                                  mfaCodeInputRefs.current[index] = element;
                                }}
                                name={`mfaCode-${index + 1}`}
                                type="text"
                                value={/\d/.test(mfaCode[index] || '') ? mfaCode[index] : ''}
                                onChange={(event) =>
                                  updateMfaCodeDigit(index, event.target.value)
                                }
                                onKeyDown={(event) =>
                                  handleMfaCodeKeyDown(event, index)
                                }
                                onPaste={(event) => handleMfaCodePaste(event, index)}
                                inputMode="numeric"
                                pattern="[0-9]*"
                                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                                maxLength={1}
                                aria-label={`2FA digit ${index + 1}`}
                                className={`h-12 w-10 rounded-xl border text-center text-lg font-semibold outline-none transition focus:ring-2 sm:h-14 sm:w-12 ${
                                  isLightTheme
                                    ? 'border-[#d8e2f2] bg-white text-[#18253d] focus:border-[#8fb0e8] focus:ring-[#8fb0e8]/30'
                                    : 'border-white/10 bg-[#151a23] text-white focus:border-white/40 focus:ring-white/20'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setMfaSetup(null);
                              setMfaCode('');
                            }}
                            className={`rounded-full border px-4 py-2 text-sm transition ${
                              isLightTheme
                                ? 'border-[#c8d7f1] text-[#274f95] hover:bg-[#edf3ff]'
                                : 'border-white/20 text-[#e0e9ff] hover:bg-white/10'
                            }`}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={verifyAuthenticatorSetup}
                            disabled={mfaLoading === 'verify'}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${
                              isLightTheme
                                ? 'bg-[#111827] text-white hover:bg-[#1f2937]'
                                : 'bg-white text-[#111827] hover:bg-[#e5e7eb]'
                            }`}
                          >
                            {mfaLoading === 'verify' ? 'Verifying...' : 'Verify code'}
                          </button>
                        </div>
                      </div>
                    ) : null}
                    {mfaStatus ? (
                      <p
                        className={`mt-3 rounded-xl border px-3 py-2 text-sm ${
                          mfaStatus.type === 'success'
                            ? isLightTheme
                              ? 'border-[#b6e2a5] bg-[#eaf9e2] text-[#3d7a2e]'
                              : 'border-[#2f7d4c]/70 bg-[#123522] text-[#8ee6af]'
                            : isLightTheme
                              ? 'border-[#f3c0c8] bg-[#fdecef] text-[#be485f]'
                              : 'border-[#fb7185]/45 bg-[#3a1720] text-[#fda4af]'
                        }`}
                      >
                        {mfaStatus.message}
                      </p>
                    ) : null}
                  </div>
                  <div
                    className={`mt-5 rounded-2xl border p-4 ${
                      isLightTheme
                        ? 'border-[#d8e2f2] bg-white'
                        : 'border-white/10 bg-[#151a23]'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p
                          className={`text-[1.1rem] font-semibold ${
                            isLightTheme ? 'text-[#1a2b47]' : 'text-white'
                          }`}
                        >
                          Trusted Devices
                        </p>
                        <p
                          className={`mt-1 text-[0.86rem] ${
                            isLightTheme ? 'text-[#5f7090]' : 'text-[#aeb7cb]'
                          }`}
                        >
                          {securityOverviewLoading
                            ? 'Loading trusted devices...'
                            : `${trustedDeviceCount} trusted device${trustedDeviceCount === 1 ? '' : 's'}`}
                        </p>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          isLightTheme
                            ? 'border-[#d8e2f2] bg-[#f8fbff] text-[#274f95]'
                            : 'border-white/15 bg-white/[0.05] text-[#dbe6ff]'
                        }`}
                      >
                        Live
                      </span>
                    </div>
                    <div className="mt-4 space-y-2">
                      {trustedDevices.length ? (
                        trustedDevices.map((device) => (
                          <div
                            key={device.id}
                            className={`rounded-xl border p-3 ${
                              isLightTheme
                                ? 'border-[#d8e2f2] bg-[#f8fbff]'
                                : 'border-white/10 bg-[#0f141c]'
                            }`}
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0">
                                <p
                                  className={`font-medium ${
                                    isLightTheme ? 'text-[#1a2b47]' : 'text-white'
                                  }`}
                                >
                                  {device.deviceName || device.browser || 'Unknown device'}
                                  {device.current ? ' • Current' : ''}
                                </p>
                                <p
                                  className={`mt-1 text-[0.82rem] ${
                                    isLightTheme ? 'text-[#5f7090]' : 'text-[#aeb7cb]'
                                  }`}
                                >
                                  {[
                                    device.browser,
                                    device.platform,
                                    device.deviceType,
                                    device.sessionCount
                                      ? `${device.sessionCount} session${device.sessionCount === 1 ? '' : 's'}`
                                      : null,
                                    device.ip,
                                  ]
                                    .filter(Boolean)
                                    .join(' • ') || 'No device details captured'}
                                </p>
                              </div>
                              <span
                                className={`shrink-0 text-xs ${
                                  isLightTheme ? 'text-[#6b7893]' : 'text-[#98a4ba]'
                                }`}
                              >
                                {formatTrustedDeviceDate(device.lastUsedAt)}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p
                          className={`rounded-xl border p-3 text-sm ${
                            isLightTheme
                              ? 'border-[#d8e2f2] bg-[#f8fbff] text-[#5f7090]'
                              : 'border-white/10 bg-[#0f141c] text-[#aeb7cb]'
                          }`}
                        >
                          No active trusted devices were returned by the session service.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="pt-4">
                    <p
                      className={`text-[1.1rem] font-semibold ${
                        isLightTheme ? 'text-[#1a2b47]' : 'text-white'
                      }`}
                    >
                      Sessions
                    </p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => handleSessionLogout('current')}
                        disabled={Boolean(sessionActionLoading)}
                        className={`rounded-2xl border p-4 text-left transition disabled:opacity-60 ${
                          isLightTheme
                            ? 'border-[#d8e2f2] bg-white text-[#274f95] hover:bg-[#edf3ff]'
                            : 'border-white/10 bg-[#151a23] text-[#e0e9ff] hover:bg-white/10'
                        }`}
                      >
                        <span className="block text-sm font-semibold">
                          {sessionActionLoading === 'current'
                            ? 'Logging out...'
                            : 'Log out this device'}
                        </span>
                        <span className="mt-1 block text-xs opacity-75">
                          End only this browser session.
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSessionLogout('all')}
                        disabled={Boolean(sessionActionLoading)}
                        className="rounded-2xl border border-[#d65b5b] p-4 text-left text-[#ff8d8d] transition hover:bg-[#3a1818] disabled:opacity-60"
                      >
                        <span className="block text-sm font-semibold">
                          {sessionActionLoading === 'all'
                            ? 'Requesting...'
                            : 'Log out all devices'}
                        </span>
                        <span className="mt-1 block text-xs opacity-75">
                          Requires full session service support.
                        </span>
                      </button>
                    </div>
                    {sessionActionStatus ? (
                      <p
                        className={`mt-3 rounded-xl border px-3 py-2 text-sm ${
                          sessionActionStatus.type === 'success'
                            ? isLightTheme
                              ? 'border-[#b6e2a5] bg-[#eaf9e2] text-[#3d7a2e]'
                              : 'border-[#2f7d4c]/70 bg-[#123522] text-[#8ee6af]'
                            : isLightTheme
                              ? 'border-[#f3c0c8] bg-[#fdecef] text-[#be485f]'
                              : 'border-[#fb7185]/45 bg-[#3a1720] text-[#fda4af]'
                        }`}
                      >
                        {sessionActionStatus.message}
                      </p>
                    ) : null}
                  </div>
                </SectionShell>
              ) : null}

              {activeTab === 'account' ? (
                <SectionShell>
                  <SectionDivider isLightTheme={isLightTheme} />
                  <div
                    className={`mt-5 rounded-2xl border p-5 ${
                      isLightTheme
                        ? 'border-[#d8e2f2] bg-white'
                        : 'border-white/10 bg-[#151a23]'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border ${
                          isLightTheme
                            ? 'border-[#d0dbef] bg-[#f5f8ff]'
                            : 'border-white/15 bg-[#242b38]'
                        }`}
                      >
                        <Image
                          src="/avatar-1.png"
                          alt="Profile avatar"
                          width={64}
                          height={64}
                          className="h-16 w-16 rounded-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p
                          className={`truncate text-[1.15rem] font-semibold ${
                            isLightTheme ? 'text-[#1a2b47]' : 'text-white'
                          }`}
                        >
                          {displayName}
                        </p>
                        <p
                          className={`truncate text-[0.92rem] ${
                            isLightTheme ? 'text-[#5f7090]' : 'text-[#aeb7cb]'
                          }`}
                        >
                          {displayEmail}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Row
                    label="Name"
                    trailing={
                      <span
                        className={`text-[0.92rem] ${
                          isLightTheme ? 'text-[#2f415f]' : 'text-[#dbe3f3]'
                        }`}
                      >
                        {displayName}
                      </span>
                    }
                    isLightTheme={isLightTheme}
                  />
                  <Row
                    label="Email"
                    trailing={
                      <button
                        type="button"
                        className={`inline-flex items-center gap-2 text-[0.92rem] ${
                          isLightTheme ? 'text-[#2f415f]' : 'text-[#dbe3f3]'
                        }`}
                      >
                        <span>{displayEmail}</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    }
                    isLightTheme={isLightTheme}
                  />
                  <div
                    className={`mt-5 grid gap-3 rounded-2xl border p-4 sm:grid-cols-2 ${
                      isLightTheme
                        ? 'border-[#d8e2f2] bg-[#f8fbff]'
                        : 'border-white/10 bg-[#111722]'
                    }`}
                  >
                    {[
                      ['Plan', subscriptionPlan.name],
                      ['Cycle', subscriptionBillingPeriod],
                      ['Renewal', subscriptionRenewalLabel || '-'],
                      ['Status', subscriptionStatusText],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <p
                          className={`text-[0.72rem] font-bold uppercase tracking-[0.16em] ${
                            isLightTheme ? 'text-[#6b7893]' : 'text-[#98a4ba]'
                          }`}
                        >
                          {label}
                        </p>
                        <p
                          className={`mt-1 text-[0.95rem] font-medium ${
                            isLightTheme ? 'text-[#1a2b47]' : 'text-white'
                          }`}
                        >
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>

                </SectionShell>
              ) : null}

              {activeTab === 'custom-ai' ? (
                <SectionShell>
                  <CustomAiTab isLightTheme={isLightTheme} />
                </SectionShell>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
