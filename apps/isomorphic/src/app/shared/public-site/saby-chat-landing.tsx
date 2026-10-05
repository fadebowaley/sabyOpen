'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Archive,
  ArrowUp,
  BarChart3,
  BadgeCheck,
  ClipboardList,
  Building2,
  BookOpenText,
  Check,
  Copy,
  Clock3,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FolderOpen,
  Globe,
  Landmark,
  MapPin,
  Mic,
  Network,
  KeyRound,
  LifeBuoy,
  LogIn,
  LogOut,
  Menu,
  MoreHorizontal,
  Paperclip,
  PencilLine,
  Pin,
  Phone,
  Plus,
  Search,
  Share,
  Settings2,
  Bot,
  RotateCcw,
  UserRoundPlus,
  Trash2,
  Wrench,
  UserPlus2,
  X,
} from 'lucide-react';
import { signIn, signOut, useSession } from 'next-auth/react';
import GoogleIcon from '@core/components/icons/google';
import { PiAppleLogoFill, PiTextIndent } from 'react-icons/pi';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useReducer,
  useState,
  type ClipboardEvent as ReactClipboardEvent,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/app/lib/hooks/useAuth';
import { useRecaptcha } from '@/app/lib/hooks/useRecaptcha';
import { berylliumMenuItems } from '@/layouts/beryllium/beryllium-fixed-menu-items';
import FooterSection from '@/app/shared/public-site/footer-section';
import PublicAuthModal from '@/app/shared/public-site/public-auth-modal';
import SabyMeetSection from '@/app/shared/public-site/saby-meet-section';
import IntegrationsSection from '@/app/shared/public-site/IntegrationsSection';
import SabyPricingCtaSection from '@/app/shared/public-site/saby-pricing-cta-section';
import SabyProfileSettingsModal, {
  type ProfileSettingsTabId,
} from '@/app/shared/public-site/SabyProfileSettingsModal';
import SabyPublicNavbar from '@/app/shared/public-site/saby-public-navbar';
import PublicThemeToggleButton from '@/app/shared/public-site/public-theme-toggle-button';
import TrustedByCompanies from '@/app/shared/public-site/TrustedByCompanies';
import WorkflowTemplatesSection from '@/app/shared/public-site/WorkflowTemplatesSection';
import ReasoningBanner from './ReasoningBanner';
import SabyThinkingIndicator from './SabyThinkingIndicator';
import { publicSiteTheme } from '@/app/shared/public-site/public-theme-classes';
import { usePublicTheme } from '@/app/shared/public-site/use-public-theme';
import type { PublicThemeMode } from '@/app/shared/public-site/use-public-theme';
import { loginSchema } from '@/validators/login.schema';
import { signUpSchema } from '@/validators/signup.schema';
import { marked } from 'marked';
import {
  applyOperationToDraft,
  buildUtilityTemplate,
  createEmptyDraft,
  detectUtilityCandidatesForField,
  evaluateDraftReadiness,
  getDraftUtilities,
  initialModuleDraftHistoryState,
  interpretModuleDraftIntent,
  moduleDraftReducer,
  utilityTypeLabels,
} from '../module-studio-v2';

type ComposeAction = {
  label: string;
  icon: React.ReactNode;
  href: string;
  requiresAuth?: boolean;
  hasSubmenu?: boolean;
};

type ChatTurn = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  reasoning?: string;
};

function cleanTurnThinking(
  rawText: unknown,
  rawReasoning?: unknown
): { cleanText: string; reasoning?: string } {
  let cleanText =
    typeof rawText === 'string'
      ? rawText
      : rawText && typeof rawText === 'object'
        ? JSON.stringify(rawText)
        : String(rawText || '');
  let reasoning =
    typeof rawReasoning === 'string'
      ? rawReasoning
      : rawReasoning && typeof rawReasoning === 'object'
        ? JSON.stringify(rawReasoning)
        : String(rawReasoning || '');

  if (cleanText.includes('<think>')) {
    const thinkRegex = /<think>([\s\S]*?)(?:<\/think>|$)/gi;
    let match;
    while ((match = thinkRegex.exec(cleanText)) !== null) {
      if (match[1]) {
        reasoning = (reasoning ? `${reasoning}\n` : '') + match[1].trim();
      }
    }
    cleanText = cleanText.replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, '').trim();
  }

  return {
    cleanText,
    reasoning: reasoning.trim() || undefined,
  };
}

type SidebarHistory = {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
  turns: ChatTurn[];
  pinned?: boolean;
  archived?: boolean;
};

type RollingIssue = {
  label: string;
  href: string;
  requiresAuth?: boolean;
};

type HelpMenuItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  requiresAuth?: boolean;
  settingsTab?: ProfileSettingsTabId;
};

type AuthView = 'login' | 'signup' | 'forgot' | 'otp' | 'reset' | 'phone';

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

type AuthFieldErrors = Partial<Record<keyof SignUpFormState, string>>;
type ThemeMode = 'dark' | 'light';
type SabyUserSettings = {
  onboardingComplete: boolean;
};

type CommandTool = {
  key: string;
  label: string;
  command: string;
  hint: string;
  icon: React.ReactNode;
};

type QuickPrompt = {
  id: string;
  text: string;
};

type AssistantPromptChip = {
  id: string;
  text: string;
  prompt?: string;
  autoSend?: boolean;
};

type ModuleArtifactTab =
  | 'preview'
  | 'json'
  | 'builder'
  | 'workflow'
  | 'payment'
  | 'payment_config'
  | 'utilities'
  | 'behavior'
  | 'review';

type ModuleTemplateCatalogItem = {
  id: string;
  name: string;
  description: string;
  industry: string;
  category: string;
  tags: string[];
  difficulty: string;
  estimatedTime: string;
  icon: string;
  preview: string;
  payloadVersion?: number;
  fieldCount?: number;
  readiness?: {
    workflow?: boolean;
    paymentPolicy?: boolean;
    paymentConfig?: boolean;
    utilities?: boolean;
  };
  taxonomy?: {
    isNonProfit?: boolean;
    isChurch?: boolean;
  };
};

type ModuleLibraryItem = {
  projectFormId: string;
  projectId: string;
  name: string;
  status: string;
  updatedAt: string | null;
  tags: string[];
  draft: Record<string, any>;
};

type ModuleTemplateSelectionState = {
  stage: 'industry' | 'template';
  brief: string;
  candidates: ModuleTemplateCatalogItem[];
  industries?: string[];
  industry?: string;
  options?: ModuleTemplateCatalogItem[];
};

type PendingEventMeta = {
  eventId: string;
  actionType: string | null;
};

type PendingConfirmationMeta = {
  actionType: string;
  title: string;
  warning: boolean;
};

type ActionTurnStatus = 'processing' | 'completed' | 'failed' | 'timeout';

type ActionTurnMeta = {
  eventId: string;
  actionType: string | null;
  status: ActionTurnStatus;
  attempts: number;
  lastCheckedAt: string | null;
  finalEvent?: any;
};

type OnboardingJobSnapshot = {
  id: string;
  mode: 'dry_run' | 'import';
  status: string;
  stage: string;
  progressPct: number;
  totalRows: number;
  processedRows: number;
  summary: Record<string, any>;
  errors: Record<string, any>;
  events: any[];
};

type OnboardingUiState = {
  phase:
    | 'idle'
    | 'uploading'
    | 'processing'
    | 'completed'
    | 'failed'
    | 'cancelled';
  fileName: string;
  uploadPct: number;
  message?: string;
  job?: OnboardingJobSnapshot;
};

const ONBOARDING_MASTER_TEMPLATE_URL = '/saby_orgs_template.csv';

type OnboardingIssueEntry = {
  line: number;
  code: string;
  message: string;
};

type OwnerOnboardingProfile = {
  owner: {
    phoneNumber: string;
    roleTitle: string;
  };
  company: {
    name: string;
    email: string;
    phone: string;
    industry: string;
    size: string;
    timezone: string;
    country: string;
    state: string;
    city: string;
    address: string;
  };
  node: {
    rootNodeId: string;
    rootNodeName: string;
    rootLevelName: string;
    rootNodeAddress: string;
    nodeStructures?: boolean | null;
  };
  draftProgress?: {
    currentIndex: number;
    phase: 'question' | 'review' | 'submitting' | 'completed';
    skipped: Record<string, boolean>;
    lastSavedAt?: string | null;
  };
};

type OwnerOnboardingForm = {
  owner: {
    phoneNumber: string;
    roleTitle: string;
  };
  company: {
    name: string;
    email: string;
    phone: string;
    industry: string;
    size: string;
    timezone: string;
    country: string;
    state: string;
    city: string;
    address: string;
  };
  node: {
    rootNodeName: string;
    rootLevelName: string;
    rootNodeAddress: string;
    nodeStructures: string | boolean;
  };
};

type OwnerOnboardingQuestion = {
  id: string;
  section: keyof OwnerOnboardingForm;
  field: string;
  prompt: string;
  helper?: string;
  required?: boolean;
  type?: 'text' | 'email';
  options?: string[];
};

type OwnerOnboardingSessionState = {
  form: OwnerOnboardingForm;
  currentIndex: number;
  phase: 'question' | 'review' | 'submitting' | 'completed';
  skipped: Record<string, boolean>;
};

type OwnerPhoneVerificationState = {
  phoneNumber: string;
  otpTurnId: string;
  digits: string[];
  error: string | null;
  info: string | null;
  sending: boolean;
  verifying: boolean;
  verified: boolean;
};

type OwnerOnboardingReviewCard = {
  ownerTitle: string;
  ownerPhone: string;
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  industry: string;
  teamSize: string;
  location: string;
  timezone: string;
  branchMode: string;
  rootNodeName: string;
};

const OWNER_ONBOARDING_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OWNER_ONBOARDING_PHONE_DIGIT_REGEX = /^\d{10,15}$/;
const OWNER_PHONE_VERIFIED_KEY = 'owner.phoneNumber.verified';
const OWNER_ONBOARDING_INDUSTRIES = [
  'Non-Profit & Faith-Based',
  'Education & Research',
  'Healthcare & Life Sciences',
  'Financial Services & Fintech',
  'Government & Public Sector',
  'Retail & Commerce',
  'Energy, Utilities & IoT',
  'Other',
];
const OWNER_ONBOARDING_TEAM_SIZES = [
  '1-10',
  '11-50',
  '51-200',
  '201-1000',
  '1000+',
];
const OWNER_ONBOARDING_TIMEZONES = [
  'Africa/Lagos',
  'UTC',
  'Africa/Accra',
  'Europe/London',
  'America/New_York',
];

const OWNER_ONBOARDING_QUESTIONS: OwnerOnboardingQuestion[] = [
  {
    id: 'owner.roleTitle',
    section: 'owner',
    field: 'roleTitle',
    prompt: 'What title should we use for you as the account owner?',
    helper: 'Examples: Owner, CEO, Lead Pastor, Administrator.',
    options: ['Owner', 'CEO', 'Lead Pastor', 'Administrator'],
  },
  {
    id: 'owner.phoneNumber',
    section: 'owner',
    field: 'phoneNumber',
    prompt: 'What is your phone number?',
    helper:
      'Used for account recovery and urgent alerts. After this, a 6-digit verification card will appear.',
  },
  {
    id: 'company.name',
    section: 'company',
    field: 'name',
    prompt: 'What is your organization name?',
    required: true,
  },
  {
    id: 'company.industry',
    section: 'company',
    field: 'industry',
    prompt: 'Which industry best describes your organization?',
    options: OWNER_ONBOARDING_INDUSTRIES,
  },
  {
    id: 'company.email',
    section: 'company',
    field: 'email',
    prompt: 'What email should we use as your company contact?',
    type: 'email',
  },
  {
    id: 'company.phone',
    section: 'company',
    field: 'phone',
    prompt: 'What is your company phone number?',
  },
  {
    id: 'company.size',
    section: 'company',
    field: 'size',
    prompt: 'How large is your team?',
    options: OWNER_ONBOARDING_TEAM_SIZES,
  },
  {
    id: 'company.timezone',
    section: 'company',
    field: 'timezone',
    prompt: 'Which timezone should Saby use for your tenant?',
    required: true,
    options: OWNER_ONBOARDING_TIMEZONES,
  },
  {
    id: 'company.country',
    section: 'company',
    field: 'country',
    prompt: 'Which City is your organization based in?',
    helper: 'Type in this format: Ikeja, Lagos Nigeria (City, State, Country).',
  },
  {
    id: 'node.nodeStructures',
    section: 'node',
    field: 'nodeStructures',
    prompt: 'Do you have more than one branch?',
    required: true,
    options: ['Yes', 'No'],
  },
  {
    id: 'node.rootNodeName',
    section: 'node',
    field: 'rootNodeName',
    prompt: 'What name should we call your branch?',
    helper:
      'Examples: Head Office, Headquarters, National Office, Global Office.',
    required: true,
  },
];

const buildOwnerOnboardingInitialForm = (
  profile: OwnerOnboardingProfile | null
): OwnerOnboardingForm => ({
  owner: {
    phoneNumber: String(profile?.owner?.phoneNumber || ''),
    roleTitle: String(profile?.owner?.roleTitle || ''),
  },
  company: {
    name: String(profile?.company?.name || ''),
    email: String(profile?.company?.email || ''),
    phone: String(profile?.company?.phone || ''),
    industry: String(profile?.company?.industry || ''),
    size: String(profile?.company?.size || ''),
    timezone: String(profile?.company?.timezone || 'Africa/Lagos'),
    country: String(profile?.company?.country || ''),
    state: String(profile?.company?.state || ''),
    city: String(profile?.company?.city || ''),
    address: String(profile?.company?.address || ''),
  },
  node: {
    rootNodeName: String(profile?.node?.rootNodeName || ''),
    rootLevelName: String(profile?.node?.rootLevelName || 'Headquarters'),
    rootNodeAddress: String(
      profile?.node?.rootNodeAddress || profile?.company?.address || ''
    ),
    nodeStructures: profile?.node?.nodeStructures ? 'Yes' : 'No',
  },
});

const getOwnerOnboardingFieldValue = (
  form: OwnerOnboardingForm,
  question: OwnerOnboardingQuestion
) => {
  const section = form[question.section] as Record<string, any>;
  return String(section?.[question.field] ?? '');
};

const setOwnerOnboardingFieldValue = (
  form: OwnerOnboardingForm,
  question: OwnerOnboardingQuestion,
  rawValue: string
): OwnerOnboardingForm => {
  const value = String(rawValue || '').trim();
  const next = {
    ...form,
    [question.section]: {
      ...(form[question.section] as Record<string, any>),
      [question.field]: value,
    },
  } as OwnerOnboardingForm;
  if (question.id === 'company.name' && !next.node.rootNodeName.trim()) {
    next.node.rootNodeName = value ? `${value} HQ` : '';
  }
  if (question.id === 'company.address' && !next.node.rootNodeAddress.trim()) {
    next.node.rootNodeAddress = value;
  }
  return next;
};

const buildOwnerOnboardingPayload = (
  form: OwnerOnboardingForm
): OwnerOnboardingForm => {
  const nodeStructuresRaw = String(form.node.nodeStructures || '')
    .trim()
    .toLowerCase();
  const nodeStructures =
    nodeStructuresRaw === 'yes' ||
    nodeStructuresRaw === 'true' ||
    nodeStructuresRaw === '1';
  const companyName = String(form.company.name || '').trim();
  const companyAddress = String(form.company.address || '').trim();
  const locationRaw = String(form.company.country || '').trim();
  const locationParts = locationRaw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  let parsedCity = '';
  let parsedState = '';
  let parsedCountry = '';
  if (locationParts.length >= 3) {
    parsedCity = locationParts[0];
    parsedState = locationParts[1];
    parsedCountry = locationParts.slice(2).join(', ');
  } else if (locationParts.length === 2) {
    parsedCity = locationParts[0];
    parsedCountry = locationParts[1];
  } else if (locationParts.length === 1) {
    parsedCountry = locationParts[0];
  }
  return {
    owner: {
      phoneNumber: String(form.owner.phoneNumber || '').trim(),
      roleTitle: String(form.owner.roleTitle || '').trim() || 'Owner',
    },
    company: {
      name: companyName,
      email: String(form.company.email || '').trim(),
      phone: String(form.company.phone || '').trim(),
      industry: String(form.company.industry || '').trim(),
      size: String(form.company.size || '').trim(),
      timezone: String(form.company.timezone || '').trim() || 'Africa/Lagos',
      country: parsedCountry || String(form.company.country || '').trim(),
      state: parsedState || String(form.company.state || '').trim(),
      city: parsedCity || String(form.company.city || '').trim(),
      address: companyAddress,
    },
    node: {
      rootNodeName:
        String(form.node.rootNodeName || '').trim() ||
        (companyName ? `${companyName} HQ` : ''),
      rootLevelName: 'Headquarters',
      rootNodeAddress:
        String(form.node.rootNodeAddress || '').trim() || companyAddress,
      nodeStructures,
    },
  };
};

const validateOwnerOnboardingAnswer = (
  question: OwnerOnboardingQuestion,
  rawValue: string
) => {
  const value = String(rawValue || '').trim();
  if (question.required && !value) {
    return 'This question is required.';
  }
  if (
    question.type === 'email' &&
    value &&
    !OWNER_ONBOARDING_EMAIL_REGEX.test(value)
  ) {
    return 'Please enter a valid email address.';
  }
  if (
    (question.id === 'owner.phoneNumber' || question.id === 'company.phone') &&
    value
  ) {
    const digitsOnly = value.replace(/\D/g, '');
    if (!OWNER_ONBOARDING_PHONE_DIGIT_REGEX.test(digitsOnly)) {
      return 'Please enter a valid phone number (10 to 15 digits).';
    }
  }
  return null;
};

const isOwnerOnboardingQuestionAnswered = (
  form: OwnerOnboardingForm,
  question: OwnerOnboardingQuestion,
  skipped: Record<string, boolean> = {}
) => {
  const hasSkipMarker = Object.prototype.hasOwnProperty.call(
    skipped || {},
    question.id
  );
  if (skipped?.[question.id]) return true;
  const value = getOwnerOnboardingFieldValue(form, question).trim();
  if (question.id === 'owner.phoneNumber') {
    return value.length > 0 && Boolean(skipped?.[OWNER_PHONE_VERIFIED_KEY]);
  }
  if (question.required) return value.length > 0;
  return value.length > 0 || hasSkipMarker;
};

const findNextOwnerOnboardingQuestionIndex = (
  form: OwnerOnboardingForm,
  skipped: Record<string, boolean> = {}
) => {
  for (let idx = 0; idx < OWNER_ONBOARDING_QUESTIONS.length; idx += 1) {
    if (
      !isOwnerOnboardingQuestionAnswered(
        form,
        OWNER_ONBOARDING_QUESTIONS[idx],
        skipped
      )
    ) {
      return idx;
    }
  }
  return OWNER_ONBOARDING_QUESTIONS.length;
};

const normalizeOwnerOnboardingSession = (
  incoming: OwnerOnboardingSessionState
): OwnerOnboardingSessionState => {
  const skipped = incoming?.skipped || {};
  if (incoming?.phase === 'review') {
    return {
      ...incoming,
      currentIndex: Math.max(0, OWNER_ONBOARDING_QUESTIONS.length - 1),
      phase: 'review',
      skipped,
    };
  }
  const firstPending = findNextOwnerOnboardingQuestionIndex(
    incoming.form,
    skipped
  );
  if (firstPending >= OWNER_ONBOARDING_QUESTIONS.length) {
    return {
      ...incoming,
      currentIndex: Math.max(0, OWNER_ONBOARDING_QUESTIONS.length - 1),
      phase: 'review',
      skipped,
    };
  }
  return {
    ...incoming,
    currentIndex: firstPending,
    phase: 'question',
    skipped,
  };
};

const ACTION_FINAL_STATES = new Set([
  'completed',
  'failed',
  'cancelled',
  'dead_letter',
  'reversed',
]);

const DESTRUCTIVE_ACTION_KEYWORDS = [
  'delete',
  'remove',
  'archive',
  'revoke',
  'disable',
];

const formatActionTypeLabel = (value: string | null | undefined) => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  if (!normalized) return 'Pending Action';
  return normalized
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const parsePendingConfirmationMeta = (
  text: string
): PendingConfirmationMeta | null => {
  const message = String(text || '').trim();
  const match = message.match(
    /ready to ([a-z_]+)\.\s*type\s+"yes"\s+to\s+confirm\s+or\s+"cancel"\s+to\s+stop\.?/i
  );
  const actionType = String(match?.[1] || '').toLowerCase();
  if (!actionType) return null;
  const title = formatActionTypeLabel(actionType);
  const warning = DESTRUCTIVE_ACTION_KEYWORDS.some((keyword) =>
    actionType.includes(keyword)
  );
  return {
    actionType,
    title,
    warning,
  };
};

const parsePendingEventMeta = (text: string): PendingEventMeta | null => {
  const message = String(text || '');
  const eventMatch = message.match(
    /\(event\s+([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\)/i
  );
  if (!eventMatch?.[1]) return null;
  const isQueued = /queued\s+[a-z_]+/i.test(message);
  const isStillProcessing = /still processing/i.test(message);
  const actionMatch = message.match(/queued\s+([a-z_]+)\s+\(event/i);
  const inferredAction = (() => {
    const m = message.toLowerCase();
    if (/create_user|user creation/.test(m)) return 'create_user';
    if (/update_user|user update/.test(m)) return 'update_user';
    if (/delete_user|user deletion/.test(m)) return 'delete_user';
    if (/deactivate_user|user deactivation/.test(m)) return 'deactivate_user';
    if (/reactivate_user|user activation/.test(m)) return 'reactivate_user';
    if (/verify_account|account verification/.test(m)) return 'verify_account';
    if (/reset_password|password reset/.test(m)) return 'reset_password';
    return null;
  })();
  return {
    eventId: eventMatch[1],
    actionType: actionMatch?.[1]
      ? String(actionMatch[1]).toLowerCase()
      : inferredAction,
  };
};

type FollowUpAction = {
  label: string;
  prompt: string;
  kind: 'reversal' | 'next';
};

const getFollowUpActions = (
  actionType: string | null,
  event: any
): FollowUpAction[] => {
  const normalizedAction = String(
    actionType || event?.action_type || ''
  ).toLowerCase();
  const result = event?.result_json || {};
  const payload = event?.payload_json || {};
  const email = result?.email ? String(result.email).trim() : '';
  const roleName = result?.name
    ? String(result.name).trim()
    : payload?.roleBody?.roleName || payload?.roleBody?.name || '';
  const nodeName = result?.name
    ? String(result.name).trim()
    : payload?.nodeBody?.name || '';

  const userShared = {
    create: {
      label: 'Create User',
      prompt:
        '/user create user firstname <first> lastname <last> email <email> password TempPass123!',
      kind: 'next' as const,
    },
    view: {
      label: 'View User',
      prompt: `/user view user ${email}`,
      kind: 'next' as const,
    },
    assignRole: {
      label: 'Assign Role',
      prompt: `/user assign role <role name> to ${email}`,
      kind: 'next' as const,
    },
    unassignRole: {
      label: 'Unassign Role',
      prompt: `/unassign role <role name> from ${email}`,
      kind: 'next' as const,
    },
    activate: {
      label: 'Activate User',
      prompt: `/user reactivate user ${email}`,
      kind: 'next' as const,
    },
    deactivate: {
      label: 'Deactivate User',
      prompt: `/user deactivate user ${email}`,
      kind: 'reversal' as const,
    },
    update: {
      label: 'Update User',
      prompt: `/user update user ${email} firstname <first> lastname <last>`,
      kind: 'next' as const,
    },
    verify: {
      label: 'Verify Account',
      prompt: `/user verify account for ${email}`,
      kind: 'next' as const,
    },
    reset: {
      label: 'Reset Password',
      prompt: `/user reset password for ${email} to TempPass123!`,
      kind: 'next' as const,
    },
    assignNode: {
      label: 'Assign Node',
      prompt: `/assign user ${email} to node <node name>`,
      kind: 'next' as const,
    },
    unassignNode: {
      label: 'Unassign Node',
      prompt: `/unassign user ${email} from node <node name>`,
      kind: 'next' as const,
    },
  };

  const roleShared = {
    createRole: {
      label: 'Create Role',
      prompt: '/user create role <role name>',
      kind: 'next' as const,
    },
    deleteRole: {
      label: 'Delete Role',
      prompt: roleName
        ? `/user delete role ${roleName}`
        : '/user delete role <role name>',
      kind: 'reversal' as const,
    },
    assignRole: {
      label: 'Assign Role',
      prompt: roleName
        ? `/user assign ${roleName} role to <user email>`
        : '/user assign <role name> role to <user email>',
      kind: 'next' as const,
    },
    unassignRole: {
      label: 'Unassign Role',
      prompt: roleName
        ? `/user unassign role ${roleName} from <user email>`
        : '/user unassign role <role name> from <user email>',
      kind: 'next' as const,
    },
    grantPermission: {
      label: 'Grant Permission',
      prompt: roleName
        ? `/user grant permission <permission name> to role ${roleName}`
        : '/user grant permission <permission name> to role <role name>',
      kind: 'next' as const,
    },
    revokePermission: {
      label: 'Revoke Permission',
      prompt: roleName
        ? `/user revoke permission <permission name> from role ${roleName}`
        : '/user revoke permission <permission name> from role <role name>',
      kind: 'next' as const,
    },
    viewRole: {
      label: 'View Role',
      prompt: roleName
        ? `/user view role ${roleName}`
        : '/user view role <role name>',
      kind: 'next' as const,
    },
  };

  const nodeShared = {
    createNode: {
      label: 'Create Node',
      prompt: '/node create node <name> under <parent node> with level <level>',
      kind: 'next' as const,
    },
    moveNode: {
      label: 'Move Node',
      prompt: nodeName
        ? `/node move node ${nodeName} to <target parent node>`
        : '/node move node <node name> to <target parent node>',
      kind: 'next' as const,
    },
    moveNodeFamily: {
      label: 'Move Node Family',
      prompt: nodeName
        ? `/node move node family ${nodeName} to <target parent node>`
        : '/node move node family <node name> to <target parent node>',
      kind: 'next' as const,
    },
    deleteNode: {
      label: 'Delete Node',
      prompt: nodeName
        ? `/node delete node ${nodeName}`
        : '/node delete node <node name>',
      kind: 'reversal' as const,
    },
    restoreNode: {
      label: 'Restore Node',
      prompt: nodeName
        ? `/node restore node ${nodeName}`
        : '/node restore node <node name>',
      kind: 'next' as const,
    },
    assignUserToNode: {
      label: 'Assign User To Node',
      prompt: nodeName
        ? `/node assign user <user email> to node ${nodeName}`
        : '/node assign user <user email> to node <node name>',
      kind: 'next' as const,
    },
    unassignUserFromNode: {
      label: 'Unassign User From Node',
      prompt: nodeName
        ? `/node unassign user <user email> from node ${nodeName}`
        : '/node unassign user <user email> from node <node name>',
      kind: 'next' as const,
    },
    viewNode: {
      label: 'View Node',
      prompt: nodeName
        ? `/node view node ${nodeName}`
        : '/node view node <node name>',
      kind: 'next' as const,
    },
  };

  if (
    [
      'create_user',
      'update_user',
      'delete_user',
      'deactivate_user',
      'reactivate_user',
      'verify_account',
      'reset_password',
    ].includes(normalizedAction)
  ) {
    if (!email) return [];

    const shared = userShared;
    const baseNext = [
      shared.view,
      shared.update,
      shared.verify,
      shared.reset,
      shared.assignRole,
      shared.assignNode,
      shared.unassignNode,
      shared.unassignRole,
      shared.create,
    ];

    if (normalizedAction === 'delete_user') {
      return [
        shared.create,
        ...baseNext.filter((x) => x.label !== 'Create User'),
      ];
    }
    if (normalizedAction === 'deactivate_user') {
      return [shared.activate, ...baseNext];
    }
    if (normalizedAction === 'reactivate_user') {
      return [shared.deactivate, ...baseNext];
    }
    if (normalizedAction === 'create_user') {
      return [shared.deactivate, ...baseNext];
    }
    if (normalizedAction === 'verify_account') {
      return [shared.deactivate, ...baseNext];
    }
    if (normalizedAction === 'reset_password') {
      return [
        shared.reset,
        ...baseNext.filter((x) => x.label !== 'Reset Password'),
      ];
    }
    if (normalizedAction === 'update_user') {
      return [
        shared.update,
        ...baseNext.filter((x) => x.label !== 'Update User'),
      ];
    }
    return baseNext;
  }

  if (
    [
      'create_role',
      'delete_role',
      'assign_role',
      'unassign_role',
      'grant_permission',
      'revoke_permission',
    ].includes(normalizedAction)
  ) {
    const roleBase = [
      roleShared.viewRole,
      roleShared.assignRole,
      roleShared.unassignRole,
      roleShared.grantPermission,
      roleShared.revokePermission,
      roleShared.createRole,
    ];

    if (normalizedAction === 'create_role')
      return [roleShared.deleteRole, ...roleBase];
    if (normalizedAction === 'delete_role')
      return [roleShared.createRole, ...roleBase];
    if (normalizedAction === 'grant_permission')
      return [roleShared.revokePermission, ...roleBase];
    if (normalizedAction === 'revoke_permission')
      return [roleShared.grantPermission, ...roleBase];
    if (normalizedAction === 'assign_role')
      return [roleShared.unassignRole, ...roleBase];
    if (normalizedAction === 'unassign_role')
      return [roleShared.assignRole, ...roleBase];
    return roleBase;
  }

  if (
    [
      'create_node',
      'move_node',
      'delete_node',
      'restore_node',
      'assign_user_to_node',
      'unassign_user_from_node',
    ].includes(normalizedAction)
  ) {
    const nodeBase = [
      nodeShared.viewNode,
      nodeShared.moveNode,
      nodeShared.moveNodeFamily,
      nodeShared.assignUserToNode,
      nodeShared.unassignUserFromNode,
      nodeShared.createNode,
    ];

    if (normalizedAction === 'create_node')
      return [nodeShared.deleteNode, ...nodeBase];
    if (normalizedAction === 'delete_node')
      return [nodeShared.restoreNode, ...nodeBase];
    if (normalizedAction === 'restore_node')
      return [nodeShared.deleteNode, ...nodeBase];
    if (normalizedAction === 'move_node')
      return [nodeShared.moveNodeFamily, ...nodeBase];
    if (normalizedAction === 'assign_user_to_node')
      return [nodeShared.unassignUserFromNode, ...nodeBase];
    if (normalizedAction === 'unassign_user_from_node')
      return [nodeShared.assignUserToNode, ...nodeBase];
    return nodeBase;
  }

  return [];
};

const summarizeFinalAction = (actionType: string | null, event: any) => {
  const normalizedAction = String(
    actionType || event?.action_type || ''
  ).toLowerCase();
  const result = event?.result_json || {};
  const email = result?.email ? String(result.email) : '';
  const firstname = result?.firstname ? String(result.firstname) : '';
  const lastname = result?.lastname ? String(result.lastname) : '';
  const displayName = [lastname, firstname].filter(Boolean).join(' ').trim();
  const displayRef = displayName || email || 'user';
  const roleName = result?.name ? String(result.name) : 'role';
  const nodeName = result?.name ? String(result.name) : 'node';
  const followUps = getFollowUpActions(actionType, event);
  const reversal = followUps.find((item) => item.kind === 'reversal');

  let headline = 'Action completed successfully.';
  if (normalizedAction === 'create_user')
    headline = `User creation for ${displayRef} is successful.`;
  if (normalizedAction === 'update_user')
    headline = `User update for ${displayRef} is successful.`;
  if (normalizedAction === 'delete_user')
    headline = `User deletion for ${displayRef} is successful.`;
  if (normalizedAction === 'deactivate_user')
    headline = `User deactivation for ${displayRef} is successful.`;
  if (normalizedAction === 'reactivate_user')
    headline = `User activation for ${displayRef} is successful.`;
  if (normalizedAction === 'verify_account')
    headline = `Account verification for ${displayRef} is successful.`;
  if (normalizedAction === 'reset_password')
    headline = `Password reset for ${displayRef} is successful.`;
  if (normalizedAction === 'create_role')
    headline = `Role creation for ${roleName} is successful.`;
  if (normalizedAction === 'delete_role')
    headline = `Role deletion for ${roleName} is successful.`;
  if (normalizedAction === 'assign_role')
    headline = 'Role assignment is successful.';
  if (normalizedAction === 'unassign_role')
    headline = 'Role unassignment is successful.';
  if (normalizedAction === 'grant_permission')
    headline = 'Permission grant is successful.';
  if (normalizedAction === 'revoke_permission')
    headline = 'Permission revoke is successful.';
  if (normalizedAction === 'create_node')
    headline = `Node creation for ${nodeName} is successful.`;
  if (normalizedAction === 'move_node')
    headline = `Node movement for ${nodeName} is successful.`;
  if (normalizedAction === 'delete_node')
    headline = `Node deletion for ${nodeName} is successful.`;
  if (normalizedAction === 'restore_node')
    headline = `Node restoration for ${nodeName} is successful.`;
  if (normalizedAction === 'assign_user_to_node')
    headline = 'User assignment to node is successful.';
  if (normalizedAction === 'unassign_user_from_node')
    headline = 'User unassignment from node is successful.';

  const reversalLine = reversal
    ? ` Reversal available: ${reversal.label}.`
    : '';
  return `${headline}${reversalLine} You can perform next actions below.`;
};

const getActionBadgeClass = (
  item: FollowUpAction,
  isLightTheme: boolean
): string => {
  if (item.kind === 'reversal') {
    return isLightTheme
      ? 'border-[#f6d6dc] bg-[#fff1f4] text-[#8e1e35] hover:bg-[#ffe8ee]'
      : 'border-[#8f3c4d] bg-[#3a1f29] text-[#ffd7e1] hover:bg-[#4a2632]';
  }

  const paletteByLabel: Record<string, { light: string; dark: string }> = {
    'Create User': {
      light: 'border-[#d8d3ff] bg-[#f3f0ff] text-[#4b2ead] hover:bg-[#eae4ff]',
      dark: 'border-[#5844a8] bg-[#2a2350] text-[#d8d0ff] hover:bg-[#342b62]',
    },
    'View User': {
      light: 'border-[#c9e3ff] bg-[#eef7ff] text-[#1f4c87] hover:bg-[#e3f1ff]',
      dark: 'border-[#3f6ea4] bg-[#1f3551] text-[#d6e9ff] hover:bg-[#294365]',
    },
    'Update User': {
      light: 'border-[#cdeed9] bg-[#effcf4] text-[#1f6a3a] hover:bg-[#e3f8ea]',
      dark: 'border-[#3f8a5e] bg-[#1f4b32] text-[#d5f4e1] hover:bg-[#275d3f]',
    },
    'Verify Account': {
      light: 'border-[#ffe1b8] bg-[#fff7ea] text-[#8a5218] hover:bg-[#ffefd8]',
      dark: 'border-[#b1792f] bg-[#4d381d] text-[#ffe8c5] hover:bg-[#5c4321]',
    },
    'Reset Password': {
      light: 'border-[#ffd2ec] bg-[#fff1fa] text-[#8b2c64] hover:bg-[#ffe8f7]',
      dark: 'border-[#9f4f82] bg-[#4a2540] text-[#ffd8ef] hover:bg-[#5a2e4d]',
    },
    'Assign Role': {
      light: 'border-[#d0e9ff] bg-[#f0f8ff] text-[#1f5f98] hover:bg-[#e5f3ff]',
      dark: 'border-[#4e79a4] bg-[#233f59] text-[#d8ecff] hover:bg-[#2c4e6d]',
    },
    'Unassign Role': {
      light: 'border-[#ffd9cf] bg-[#fff3ef] text-[#8a3b24] hover:bg-[#ffe9e2]',
      dark: 'border-[#a7654f] bg-[#4a2f27] text-[#ffdcd2] hover:bg-[#5a3930]',
    },
    'Assign Node': {
      light: 'border-[#cff0f0] bg-[#edfdfd] text-[#1f6767] hover:bg-[#e0f8f8]',
      dark: 'border-[#4d9292] bg-[#1f4b4b] text-[#d5f4f4] hover:bg-[#285b5b]',
    },
    'Unassign Node': {
      light: 'border-[#f7dfc8] bg-[#fff7ef] text-[#7d4f1f] hover:bg-[#ffefdF]',
      dark: 'border-[#9d7448] bg-[#4b3824] text-[#f6e3cc] hover:bg-[#5c452c]',
    },
    'Create Role': {
      light: 'border-[#d9dcff] bg-[#f2f3ff] text-[#373e9c] hover:bg-[#e8ebff]',
      dark: 'border-[#535ab3] bg-[#24284f] text-[#e0e3ff] hover:bg-[#2d3360]',
    },
    'Delete Role': {
      light: 'border-[#ffd4d4] bg-[#fff0f0] text-[#8e2a2a] hover:bg-[#ffe6e6]',
      dark: 'border-[#a45353] bg-[#4f2525] text-[#ffd9d9] hover:bg-[#5f2d2d]',
    },
    'Grant Permission': {
      light: 'border-[#cceee3] bg-[#eefcf7] text-[#1f6e55] hover:bg-[#e3f8f1]',
      dark: 'border-[#4a8f78] bg-[#1f4d3d] text-[#d4f4e9] hover:bg-[#285e4b]',
    },
    'Revoke Permission': {
      light: 'border-[#ffe0bf] bg-[#fff6ea] text-[#8a4f16] hover:bg-[#ffefd9]',
      dark: 'border-[#ab7540] bg-[#4d3620] text-[#ffe6c8] hover:bg-[#5c4126]',
    },
    'View Role': {
      light: 'border-[#cfe4ff] bg-[#eff7ff] text-[#205484] hover:bg-[#e5f1ff]',
      dark: 'border-[#4b78a7] bg-[#223f5a] text-[#d8e9ff] hover:bg-[#2c4e70]',
    },
    'Create Node': {
      light: 'border-[#cde9ff] bg-[#eef7ff] text-[#1f5a8a] hover:bg-[#e3f2ff]',
      dark: 'border-[#4a7fae] bg-[#1f3f5a] text-[#d4eaff] hover:bg-[#28516f]',
    },
    'Move Node': {
      light: 'border-[#d7e9c7] bg-[#f4fbe9] text-[#3f6a1f] hover:bg-[#ecf7de]',
      dark: 'border-[#648b49] bg-[#314822] text-[#e2f2d5] hover:bg-[#3a5828]',
    },
    'Move Node Family': {
      light: 'border-[#d9dbff] bg-[#f3f4ff] text-[#383b90] hover:bg-[#e9ebff]',
      dark: 'border-[#5d62a6] bg-[#2b2f56] text-[#e1e3ff] hover:bg-[#343966]',
    },
    'Delete Node': {
      light: 'border-[#ffd7d2] bg-[#fff2f0] text-[#8a3025] hover:bg-[#ffe9e5]',
      dark: 'border-[#a55a50] bg-[#4d2b26] text-[#ffdcd6] hover:bg-[#5d342d]',
    },
    'Restore Node': {
      light: 'border-[#d1efda] bg-[#eefcf2] text-[#23673d] hover:bg-[#e4f8ea]',
      dark: 'border-[#4b8a62] bg-[#214a31] text-[#d9f4e3] hover:bg-[#2a5a3b]',
    },
    'Assign User To Node': {
      light: 'border-[#d1eff3] bg-[#edfafd] text-[#1f6573] hover:bg-[#e3f7fb]',
      dark: 'border-[#4d8f9b] bg-[#21474f] text-[#d9f2f7] hover:bg-[#2a5760]',
    },
    'Unassign User From Node': {
      light: 'border-[#ffe2c9] bg-[#fff7ef] text-[#7c4d1f] hover:bg-[#ffefdF]',
      dark: 'border-[#9b7348] bg-[#4a3724] text-[#f6e3cc] hover:bg-[#5a432c]',
    },
    'View Node': {
      light: 'border-[#d5e4ff] bg-[#f1f6ff] text-[#2c4f89] hover:bg-[#e8f0ff]',
      dark: 'border-[#5375a8] bg-[#253c5d] text-[#dce8ff] hover:bg-[#2d4a72]',
    },
    'Activate User': {
      light: 'border-[#ccefd2] bg-[#ecfbef] text-[#1f6d31] hover:bg-[#e0f7e5]',
      dark: 'border-[#4b8d5c] bg-[#1f4a2b] text-[#d3f2db] hover:bg-[#275937]',
    },
    'Deactivate User': {
      light: 'border-[#f6d6dc] bg-[#fff1f4] text-[#8e1e35] hover:bg-[#ffe8ee]',
      dark: 'border-[#8f3c4d] bg-[#3a1f29] text-[#ffd7e1] hover:bg-[#4a2632]',
    },
  };

  const palette = paletteByLabel[item.label];
  if (!palette) {
    return isLightTheme
      ? 'border-[#d7e3fa] bg-[#f4f8ff] text-[#204070] hover:bg-[#e9f1ff]'
      : 'border-[#3f5f90] bg-[#1f2e48] text-[#dbeafe] hover:bg-[#2a3d5f]';
  }
  return isLightTheme ? palette.light : palette.dark;
};

// ── Configure marked once (module scope) ──────────────────────────────────
marked.use({
  gfm: true, // GitHub Flavored Markdown: tables, strikethrough, task lists
  breaks: true, // Convert single \n to <br> in paragraphs
});

/**
 * Strip dangerous HTML from marked output and enhance presentation.
 * The LLM output is trusted but we still guard against prompt-injection.
 */
function sanitizeChatHtml(html: string): string {
  return (
    html
      // Security: remove dangerous tags / attributes
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(
        /<(iframe|object|embed|form|input|button|select|textarea|meta|link|base)\b[^>]*>/gi,
        ''
      )
      .replace(/\s+on\w+\s*=\s*(['"])[\s\S]*?\1/gi, '')
      .replace(/\s+on\w+\s*=\s*[^\s>]*/gi, '')
      .replace(/(href|src|action)\s*=\s*(['"])\s*javascript:/gi, '$1=$2#')
      // Presentation: wrap tables with a horizontally-scrollable container
      .replace(/<table>/g, '<div class="saby-table-scroll"><table>')
      .replace(/<\/table>/g, '</table></div>')
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SabyContentRenderer — Extensible Rich-Content Rendering Engine
// ═══════════════════════════════════════════════════════════════════════════
//
// Architecture:
//   text  ──► parseSabyBlocks()  ──► SabyBlock[]  ──► block registry  ──► JSX
//
// Standard LLM output (no tags) → single MarkdownBlock (existing behaviour).
// Agent/backend can inject structured blocks using:
//
//   [SABY:alert level="warning" title="High CPU Usage"]
//   CPU has been above 90% for 15 minutes on node-03.
//   [/SABY]
//
//   [SABY:quick_actions]Show metrics|Create incident|Silence alert[/SABY]
//
//   [SABY:action_card title="New User"]
//   Name: Alice Smith
//   Email: alice@acme.com
//   Role: Admin
//   ACTION:Confirm & Create
//   ACTION:Edit Details
//   [/SABY]
//
//   [SABY:stat_grid]CPU:92%:up|Memory:78%:neutral|Open Incidents:3:down[/SABY]
//
//   [SABY:divider][/SABY]
//
// Extending: add a new case to the `switch` in SabyContentRenderer and a
// matching renderer component + CSS class. No other changes needed.
// ═══════════════════════════════════════════════════════════════════════════

// ── Block type definitions ─────────────────────────────────────────────────

type SabyAlertLevel = 'info' | 'success' | 'warning' | 'error';

type SabyBlock =
  | { type: 'markdown'; content: string }
  | { type: 'alert'; level: SabyAlertLevel; title?: string; content: string }
  | {
      type: 'action_card';
      title: string;
      fields: { label: string; value: string }[];
      actions: string[];
    }
  | { type: 'quick_actions'; items: string[] }
  | {
      type: 'stat_grid';
      items: {
        label: string;
        value: string;
        trend?: 'up' | 'down' | 'neutral';
      }[];
    }
  | { type: 'divider' };

// ── Block parser ───────────────────────────────────────────────────────────

const SABY_BLOCK_RE = /\[SABY:(\w+)([^\]]*)\]([\s\S]*?)\[\/SABY\]/g;

function _parseAttrString(attrStr: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /(\w+)\s*=\s*["']([^"']*)["']/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(attrStr)) !== null) attrs[m[1]] = m[2];
  return attrs;
}

function parseSabyBlocks(text: string): SabyBlock[] {
  const blocks: SabyBlock[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  SABY_BLOCK_RE.lastIndex = 0;

  while ((match = SABY_BLOCK_RE.exec(text)) !== null) {
    // Capture markdown text that precedes this structured block
    if (match.index > lastIndex) {
      const chunk = text.slice(lastIndex, match.index).trim();
      if (chunk) blocks.push({ type: 'markdown', content: chunk });
    }

    const [, blockType, attrStr, inner] = match;
    const attrs = _parseAttrString(attrStr);
    const content = inner.trim();

    switch (blockType) {
      case 'alert':
        blocks.push({
          type: 'alert',
          level: (['info', 'success', 'warning', 'error'].includes(attrs.level)
            ? attrs.level
            : 'info') as SabyAlertLevel,
          title: attrs.title,
          content,
        });
        break;

      case 'action_card': {
        const lines = content.split('\n').filter(Boolean);
        const fields: { label: string; value: string }[] = [];
        const actions: string[] = [];
        for (const line of lines) {
          if (line.startsWith('ACTION:')) {
            actions.push(line.slice(7).trim());
          } else {
            const colon = line.indexOf(':');
            if (colon > 0) {
              fields.push({
                label: line.slice(0, colon).trim(),
                value: line.slice(colon + 1).trim(),
              });
            }
          }
        }
        blocks.push({
          type: 'action_card',
          title: attrs.title || 'Action',
          fields,
          actions,
        });
        break;
      }

      case 'quick_actions':
        blocks.push({
          type: 'quick_actions',
          items: content
            .split('|')
            .map((s) => s.trim())
            .filter(Boolean),
        });
        break;

      case 'stat_grid': {
        const statItems = content
          .split('|')
          .map((raw) => {
            const parts = raw.split(':').map((p) => p.trim());
            const trend = parts[2];
            return {
              label: parts[0] || '',
              value: parts[1] || '',
              trend: (['up', 'down', 'neutral'].includes(trend)
                ? trend
                : 'neutral') as 'up' | 'down' | 'neutral',
            };
          })
          .filter((s) => s.label);
        blocks.push({ type: 'stat_grid', items: statItems });
        break;
      }

      case 'divider':
        blocks.push({ type: 'divider' });
        break;

      default:
        // Unknown block type — degrade gracefully to markdown
        blocks.push({
          type: 'markdown',
          content: `**[${blockType}]**\n${content}`,
        });
    }

    lastIndex = match.index + match[0].length;
  }

  // Capture any trailing text after the last block
  if (lastIndex < text.length) {
    const chunk = text.slice(lastIndex).trim();
    if (chunk) blocks.push({ type: 'markdown', content: chunk });
  }

  // Pure markdown (no SABY blocks at all)
  if (blocks.length === 0 && text.trim()) {
    blocks.push({ type: 'markdown', content: text.trim() });
  }

  return blocks;
}

// ── HTML post-processing ───────────────────────────────────────────────────
// Wraps fenced code blocks with a language badge div (handled in CSS).

function enhanceMarkdownHtml(html: string): string {
  return sanitizeChatHtml(html)
    .replace(
      /<pre><code class="language-(\w+)">/g,
      '<div class="saby-code-block"><div class="saby-code-lang">$1</div><pre><code class="language-$1">'
    )
    .replace(/<\/code><\/pre>/g, '</code></pre></div>');
}

// ── Block sub-components ───────────────────────────────────────────────────

function MarkdownBlock({
  content,
  isLightTheme,
  streaming = false,
}: {
  content: string;
  isLightTheme: boolean;
  streaming?: boolean;
}) {
  const html = useMemo(() => {
    if (!content) return '';
    return enhanceMarkdownHtml(marked.parse(content) as string);
  }, [content]);

  return (
    <div
      className={`saby-chat-prose ${isLightTheme ? 'saby-prose-light' : 'saby-prose-dark'}${streaming ? 'saby-streaming' : ''}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// Alert level configuration — icon + theme class pairs
const _ALERT_CFG: Record<
  SabyAlertLevel,
  { icon: string; lightCls: string; darkCls: string }
> = {
  info: {
    icon: 'ℹ️',
    lightCls: 'saby-alert-info-light',
    darkCls: 'saby-alert-info-dark',
  },
  success: {
    icon: '✅',
    lightCls: 'saby-alert-success-light',
    darkCls: 'saby-alert-success-dark',
  },
  warning: {
    icon: '⚠️',
    lightCls: 'saby-alert-warning-light',
    darkCls: 'saby-alert-warning-dark',
  },
  error: {
    icon: '🚨',
    lightCls: 'saby-alert-error-light',
    darkCls: 'saby-alert-error-dark',
  },
};

function AlertBlock({
  block,
  isLightTheme,
}: {
  block: Extract<SabyBlock, { type: 'alert' }>;
  isLightTheme: boolean;
}) {
  const cfg = _ALERT_CFG[block.level];
  return (
    <div
      className={`saby-alert-block ${isLightTheme ? cfg.lightCls : cfg.darkCls}`}
    >
      <div className="saby-alert-header">
        <span className="saby-alert-icon" role="img" aria-label={block.level}>
          {cfg.icon}
        </span>
        {block.title && <span className="saby-alert-title">{block.title}</span>}
      </div>
      {block.content && (
        <div className="saby-alert-body">
          <MarkdownBlock content={block.content} isLightTheme={isLightTheme} />
        </div>
      )}
    </div>
  );
}

function ActionCardBlock({
  block,
  isLightTheme,
  onAction,
}: {
  block: Extract<SabyBlock, { type: 'action_card' }>;
  isLightTheme: boolean;
  onAction?: (action: string) => void;
}) {
  return (
    <div
      className={`saby-action-card ${isLightTheme ? 'saby-action-card-light' : 'saby-action-card-dark'}`}
    >
      {block.title && (
        <div className="saby-action-card-title">{block.title}</div>
      )}
      {block.fields.length > 0 && (
        <dl className="saby-action-card-fields">
          {block.fields.map((f, i) => (
            <div key={i} className="saby-action-card-field">
              <dt>{typeof f.label === 'string' ? f.label : JSON.stringify(f.label)}</dt>
              <dd>{typeof f.value === 'string' ? f.value : JSON.stringify(f.value)}</dd>
            </div>
          ))}
        </dl>
      )}
      {block.actions.length > 0 && (
        <div className="saby-action-card-actions">
          {block.actions.map((action, i) => (
            <button
              key={i}
              className={`saby-action-btn ${i === 0 ? 'saby-action-btn-primary' : 'saby-action-btn-secondary'} ${isLightTheme ? 'light' : 'dark'}`}
              onClick={() => onAction?.(action)}
              type="button"
            >
              {typeof action === 'string' ? action : JSON.stringify(action)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function QuickActionsBlock({
  block,
  isLightTheme,
  onAction,
}: {
  block: Extract<SabyBlock, { type: 'quick_actions' }>;
  isLightTheme: boolean;
  onAction?: (action: string) => void;
}) {
  return (
    <div
      className={`saby-quick-actions ${isLightTheme ? 'saby-quick-actions-light' : 'saby-quick-actions-dark'}`}
    >
      <span className="saby-quick-label">Suggested:</span>
      {block.items.map((item, i) => (
        <button
          key={i}
          className="saby-quick-chip"
          onClick={() => onAction?.(item)}
          type="button"
        >
          {typeof item === 'string' ? item : JSON.stringify(item)}
        </button>
      ))}
    </div>
  );
}

function StatGridBlock({
  block,
  isLightTheme,
}: {
  block: Extract<SabyBlock, { type: 'stat_grid' }>;
  isLightTheme: boolean;
}) {
  return (
    <div
      className={`saby-stat-grid ${isLightTheme ? 'saby-stat-grid-light' : 'saby-stat-grid-dark'}`}
    >
      {block.items.map((item, i) => (
        <div key={i} className="saby-stat-cell">
          <div className="saby-stat-value">
            {typeof item.value === 'string' ? item.value : JSON.stringify(item.value)}
            {item.trend === 'up' && (
              <span className="saby-stat-trend up" aria-label="trending up">
                ↑
              </span>
            )}
            {item.trend === 'down' && (
              <span className="saby-stat-trend down" aria-label="trending down">
                ↓
              </span>
            )}
          </div>
          <div className="saby-stat-label">
            {typeof item.label === 'string' ? item.label : JSON.stringify(item.label)}
          </div>
        </div>
      ))}
    </div>
  );
}

function SabyDividerBlock({ isLightTheme }: { isLightTheme: boolean }) {
  return (
    <hr
      className={`saby-block-divider ${isLightTheme ? 'saby-block-divider-light' : 'saby-block-divider-dark'}`}
    />
  );
}

// ── SabyContentRenderer — main entry point ─────────────────────────────────
//
// Drop-in replacement for the old MarkdownMessage.
// Same external API: text / animate / onDone / isLightTheme.
// New optional: onAction — called when the user clicks an action button or
// quick-action chip; the action label string is passed as the argument.

function SabyContentRenderer({
  text,
  animate,
  onDone,
  isLightTheme = true,
  onAction,
}: {
  text: string;
  animate: boolean;
  onDone?: () => void;
  isLightTheme?: boolean;
  onAction?: (action: string) => void;
}) {
  // Fire onDone once per animation cycle (handles non-SSE queued turns).
  const doneFiredRef = useRef(false);
  useEffect(() => {
    if (!animate) {
      doneFiredRef.current = false;
      return;
    }
    if (doneFiredRef.current || !onDone) return;
    doneFiredRef.current = true;
    const t = setTimeout(onDone, 80);
    return () => clearTimeout(t);
  }, [animate, onDone]);

  const blocks = useMemo(() => parseSabyBlocks(text || ''), [text]);

  // During streaming the blinking cursor belongs on the last markdown block
  const lastMdIdx = useMemo(() => {
    for (let i = blocks.length - 1; i >= 0; i--) {
      if (blocks[i].type === 'markdown') return i;
    }
    return -1;
  }, [blocks]);

  return (
    <div
      className={`saby-content-renderer${!animate ? 'saby-prose-enter' : ''}`}
    >
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'markdown':
            return (
              <MarkdownBlock
                key={idx}
                content={block.content}
                isLightTheme={isLightTheme}
                streaming={animate && idx === lastMdIdx}
              />
            );
          case 'alert':
            return (
              <AlertBlock key={idx} block={block} isLightTheme={isLightTheme} />
            );
          case 'action_card':
            return (
              <ActionCardBlock
                key={idx}
                block={block}
                isLightTheme={isLightTheme}
                onAction={onAction}
              />
            );
          case 'quick_actions':
            return (
              <QuickActionsBlock
                key={idx}
                block={block}
                isLightTheme={isLightTheme}
                onAction={onAction}
              />
            );
          case 'stat_grid':
            return (
              <StatGridBlock
                key={idx}
                block={block}
                isLightTheme={isLightTheme}
              />
            );
          case 'divider':
            return <SabyDividerBlock key={idx} isLightTheme={isLightTheme} />;
          default:
            return null;
        }
      })}
    </div>
  );
}

// ── FeedbackButtons ───────────────────────────────────────────────────────
// Thumbs-up / thumbs-down pair shown below each completed assistant turn.
// Fires POST /api/saby/agent/feedback on click.

type FeedbackValue = 'helpful' | 'not_helpful';

function FeedbackButtons({
  turnId,
  workflowName,
  current,
  isLightTheme,
  onChange,
  compact = false,
}: {
  turnId: string;
  workflowName?: string | null;
  current: FeedbackValue | null;
  isLightTheme: boolean;
  onChange: (turnId: string, value: FeedbackValue) => void;
  compact?: boolean;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [showThanks, setShowThanks] = useState(false);

  const handleClick = async (value: FeedbackValue) => {
    if (submitting || current === value) return;
    setSubmitting(true);
    onChange(turnId, value);

    try {
      await fetch('/api/saby/agent/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedbackType: value,
          workflowName: workflowName || null,
        }),
      });
    } catch {
      /* non-fatal — feedback is best-effort */
    }

    setSubmitting(false);
    setShowThanks(true);
    setTimeout(() => setShowThanks(false), 2200);
  };

  const base = `inline-flex items-center justify-center rounded-md p-1 transition-all duration-150`;
  const idleLight = 'text-[#94a3b8] hover:text-[#3b63c8] hover:bg-[#e8f0ff]';
  const idleDark = 'text-white/50 hover:text-white hover:bg-white/10';
  const activeLight = 'text-[#3b63c8] bg-[#e8f0ff]';
  const activeDark = 'text-white bg-white/15';

  const btnClass = (value: FeedbackValue) => {
    const isSelected = current === value;
    if (isSelected) return `${base} ${isLightTheme ? activeLight : activeDark}`;
    return `${base} ${isLightTheme ? idleLight : idleDark}`;
  };

  return (
    <div
      className={`flex items-center ${
        compact ? 'gap-2 pl-0.5 text-white/70' : 'gap-1.5'
      }`}
    >
      <button
        className={btnClass('helpful')}
        onClick={() => void handleClick('helpful')}
        disabled={submitting}
        title="This was helpful"
        aria-label="Mark as helpful"
      >
        <svg
          width={compact ? '16' : '14'}
          height={compact ? '16' : '14'}
          viewBox="0 0 24 24"
          fill={current === 'helpful' ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z" />
          <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
        </svg>
      </button>

      <button
        className={btnClass('not_helpful')}
        onClick={() => void handleClick('not_helpful')}
        disabled={submitting}
        title="This wasn't helpful"
        aria-label="Mark as not helpful"
      >
        <svg
          width={compact ? '16' : '14'}
          height={compact ? '16' : '14'}
          viewBox="0 0 24 24"
          fill={current === 'not_helpful' ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3z" />
          <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
        </svg>
      </button>

      {showThanks && (
        <span
          className={`text-[11px] font-medium transition-opacity ${
            isLightTheme ? 'text-[#3b63c8]' : 'text-white/70'
          }`}
        >
          Thanks!
        </span>
      )}
    </div>
  );
}

// ── Legacy Incident Alerts (Deprecated) ──────────────────────────────────
// Background incident cron jobs and AlertBanner removed in favor of Copilot agent.

const normalizeHistoryEntries = (
  entries: SidebarHistory[]
): SidebarHistory[] => {
  const byId = new Map<string, SidebarHistory>();
  for (const entry of entries) {
    if (!entry?.id) continue;
    const normalizedEntry: SidebarHistory = {
      ...entry,
      pinned: Boolean(entry?.pinned),
      archived: Boolean(entry?.archived),
    };
    const current = byId.get(entry.id);
    if (!current) {
      byId.set(entry.id, normalizedEntry);
      continue;
    }
    const currentTs = new Date(current.updatedAt).getTime();
    const nextTs = new Date(entry.updatedAt).getTime();
    if (
      Number.isFinite(nextTs) &&
      (!Number.isFinite(currentTs) || nextTs >= currentTs)
    ) {
      byId.set(entry.id, {
        ...normalizedEntry,
        pinned: Boolean(current?.pinned || normalizedEntry?.pinned),
        archived: Boolean(current?.archived || normalizedEntry?.archived),
      });
    }
  }

  // Deduplicate twin/shadow duplicates (e.g. client draft chat-... alongside server thr_...)
  const result: SidebarHistory[] = [];
  const sorted = Array.from(byId.values()).sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) {
      return a.pinned ? -1 : 1;
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  for (const item of sorted) {
    const itemTitle = (item.title || '')
      .trim()
      .toLowerCase()
      .replace(/\.+$/, '');
    const itemTime = new Date(item.updatedAt).getTime();
    const isDup = result.some((existing) => {
      const existingTitle = (existing.title || '')
        .trim()
        .toLowerCase()
        .replace(/\.+$/, '');
      const existingTime = new Date(existing.updatedAt).getTime();
      const timeDiff = Math.abs(itemTime - existingTime);
      const titlesMatch =
        itemTitle.length > 0 &&
        (itemTitle === existingTitle ||
          (itemTitle.length >= 20 &&
            (existingTitle.startsWith(itemTitle.slice(0, 20)) ||
              itemTitle.startsWith(existingTitle.slice(0, 20)))));
      return titlesMatch && timeDiff < 180000;
    });

    if (!isDup) {
      result.push(item);
    }
  }

  return result.slice(0, 80);
};

const composeActions: ComposeAction[] = [
  {
    label: 'Start a Project',
    icon: <FolderOpen className="h-4 w-4" />,
    href: '/sabyform/templates',
    requiresAuth: true,
  },
  {
    label: 'Upload document',
    icon: <Paperclip className="h-4 w-4" />,
    href: '/file-manager',
    requiresAuth: true,
  },
  {
    label: 'Connect OCR',
    icon: <Globe className="h-4 w-4" />,
    href: '/apis/api-center',
    requiresAuth: true,
  },
  {
    label: 'Documentation',
    icon: <BookOpenText className="h-4 w-4" />,
    href: '/documentation',
  },
];

const rollingIssues: RollingIssue[] = [
  {
    label: '3 branches are overdue on statutory filings',
    href: '/apis/approvals',
    requiresAuth: true,
  },
  {
    label: '2 approvals are blocked in finance escalation',
    href: '/forms',
    requiresAuth: true,
  },
  {
    label: '1 branch submission failed validation checks',
    href: '/apis/api-center',
    requiresAuth: true,
  },
  {
    label: 'Donation reconciliation variance detected in one node',
    href: '/calendar-management',
    requiresAuth: true,
  },
  {
    label: 'Quarterly governance report is missing supporting evidence',
    href: '/node/distribution',
    requiresAuth: true,
  },
  {
    label: '5 tasks are at risk of SLA breach in compliance calendar',
    href: '/users/roles',
    requiresAuth: true,
  },
];

const heroComposerPrompts = [
  'which branches are most at risk this month.',
  'to summarize compliance performance by region.',
  'to compare inflows, spend, and variance by branch.',
  'to generate an audit-ready submission checklist.',
  'to recommend interventions before deadlines are missed.',
];

const commandTools: CommandTool[] = [
  {
    key: 'search',
    label: 'Search',
    command: '/search',
    hint: 'Search users, nodes, roles, projects.',
    icon: <Search className="h-3.5 w-3.5" />,
  },
  {
    key: 'resolve',
    label: 'Resolve',
    command: '/resolve',
    hint: 'Resolve names to IDs with disambiguation.',
    icon: <KeyRound className="h-3.5 w-3.5" />,
  },
  {
    key: 'help',
    label: 'Help',
    command: '/help',
    hint: 'Get guidance, examples, and tool usage help.',
    icon: <CircleHelp className="h-3.5 w-3.5" />,
  },
  {
    key: 'scoreboard',
    label: 'Scoreboard',
    command: '/scoreboard',
    hint: 'Project performance summary.',
    icon: <Landmark className="h-3.5 w-3.5" />,
  },
  {
    key: 'rules',
    label: 'Rules',
    command: '/rules',
    hint: 'Analyze active project rules.',
    icon: <Check className="h-3.5 w-3.5" />,
  },
  {
    key: 'node-rankings',
    label: 'Node Rankings',
    command: '/node-rankings',
    hint: 'Top/bottom node performance.',
    icon: <Network className="h-3.5 w-3.5" />,
  },
  {
    key: 'node-compare',
    label: 'Node Compare',
    command: '/node-compare',
    hint: 'Compare node vs node/family.',
    icon: <Building2 className="h-3.5 w-3.5" />,
  },
  {
    key: 'feedback',
    label: 'Feedback',
    command: '/feedback',
    hint: 'Mark response right/wrong.',
    icon: <Share className="h-3.5 w-3.5" />,
  },
  {
    key: 'user',
    label: 'User',
    command: '/user',
    hint: 'User + role administration.',
    icon: <UserRoundPlus className="h-3.5 w-3.5" />,
  },
  {
    key: 'node',
    label: 'Node',
    command: '/node',
    hint: 'Node operations, including move node family.',
    icon: <MapPin className="h-3.5 w-3.5" />,
  },
  {
    key: 'module',
    label: 'Module',
    command: '/module',
    hint: 'Chat-first module/form design mode.',
    icon: <FolderOpen className="h-3.5 w-3.5" />,
  },
  {
    key: 'onboarding',
    label: 'Onboarding',
    command: '/onboarding',
    hint: 'Upload CSV and track onboarding progress.',
    icon: <UserPlus2 className="h-3.5 w-3.5" />,
  },
];

const helpQuickPrompts: QuickPrompt[] = [
  { id: 'help-create-user', text: 'how do I create a user' },
  { id: 'help-update-user', text: 'how do I update a user' },
  { id: 'help-view-user', text: 'how do I view a user' },
  { id: 'help-delete-user', text: 'how do I delete a user' },
  { id: 'help-verify', text: 'how do I verify account' },
  { id: 'help-reset', text: 'how do I reset password' },
];

const toolQuickPrompts: Record<string, QuickPrompt[]> = {
  '/search': [
    { id: 'search-user', text: 'mo@gmail.com user' },
    { id: 'search-node', text: 'Onideure node' },
    { id: 'search-role', text: 'Senior Pastor role' },
  ],
  '/resolve': [
    { id: 'resolve-user', text: 'user mo@gmail.com' },
    { id: 'resolve-node', text: 'node Onideure (Zone)' },
    { id: 'resolve-role', text: 'role Senior Pastor' },
  ],
  '/reset-password': [
    { id: 'reset-password-sample', text: 'mo@gmail.com TempPass123!' },
  ],
  '/verify-account': [{ id: 'verify-account-sample', text: 'mo@gmail.com' }],
  '/user': [],
  '/node': [],
  '/module': [
    {
      id: 'module-generate',
      text: 'generate a form for employee registration',
    },
    { id: 'module-create', text: 'create module named Branch Weekly Report' },
    { id: 'module-preview-payload', text: 'preview payload' },
    { id: 'module-submit', text: 'submit module' },
  ],
  '/onboarding': [
    { id: 'onboarding-upload', text: 'upload onboarding csv' },
    { id: 'onboarding-status', text: 'show onboarding status' },
  ],
  '/help': [
    { id: 'help-topics', text: 'help topics' },
    { id: 'help-create-user-2', text: 'help me create user' },
    { id: 'help-update-user-2', text: 'help me update user' },
  ],
};

const moduleWizardSteps: Array<{
  key: ModuleArtifactTab;
  label: string;
  saveLabel: string;
}> = [
  { key: 'preview', label: 'Basics', saveLabel: 'Save Basics' },
  { key: 'builder', label: 'Builder', saveLabel: 'Save Fields' },
  { key: 'workflow', label: 'Workflow', saveLabel: 'Save Workflow' },
  { key: 'payment', label: 'Payment Policy', saveLabel: 'Save Payment Policy' },
  {
    key: 'payment_config',
    label: 'Payment Config',
    saveLabel: 'Save Payment Config',
  },
  { key: 'utilities', label: 'Utilities', saveLabel: 'Save Utilities' },
  { key: 'behavior', label: 'Behavior', saveLabel: 'Save Behavior' },
  { key: 'review', label: 'Review', saveLabel: 'Submit Module' },
];

const moduleAIGenerationChips: AssistantPromptChip[] = [
  {
    id: 'module-chip-workspace',
    text: 'Module Workspace',
    prompt: '__open_workspace__',
  },
  { id: 'module-chip-compliance', text: 'Compliance', prompt: 'enable perm' },
  {
    id: 'module-chip-security',
    text: 'Security',
    prompt: 'set security private',
  },
  { id: 'module-chip-rules', text: 'Rules', prompt: 'enable workflow' },
  {
    id: 'module-chip-payment',
    text: 'Payment Policy',
    prompt: 'set payment mode fixed amount 1000',
  },
  {
    id: 'module-chip-payment-config',
    text: 'Payment Config',
    prompt: 'set payment config channel sabypipe',
  },
  { id: 'module-chip-workflow', text: 'Workflow', prompt: 'enable workflow' },
];

const PAYMENT_CHANNEL_OPTIONS = [
  { value: 'sabypipe', label: 'SabyPipe' },
  { value: 'paystack', label: 'Paystack' },
  { value: 'flutterwave', label: 'Flutterwave' },
] as const;

const MODULE_TEMPLATE_STOP_WORDS = new Set([
  'create',
  'build',
  'design',
  'generate',
  'form',
  'module',
  'project',
  'for',
  'with',
  'and',
  'the',
  'a',
  'an',
  'data',
  'collection',
  'report',
]);

const normalizeTemplateText = (value: string) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const tokenizeTemplateText = (value: string) =>
  normalizeTemplateText(value)
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => !MODULE_TEMPLATE_STOP_WORDS.has(item));

const inferIndustryFromPrompt = (
  text: string,
  candidates: ModuleTemplateCatalogItem[]
): string | null => {
  const input = normalizeTemplateText(text);
  if (!input) return null;
  if (
    /\bnon\s*profit\b|\bnonprofit\b|\bfaith\b|\bchurch\b|\bministry\b/.test(
      input
    )
  ) {
    return 'Non-Profit & Faith-Based';
  }
  if (/\bfintech\b|\bfinancial\b|\bbank(ing)?\b/.test(input)) {
    return 'Financial Services & Fintech';
  }
  if (/\bhealth\b|\bmedical\b|\bhospital\b|\bclinic\b/.test(input)) {
    return 'Healthcare & Life Sciences';
  }
  if (/\bgovernment\b|\bpublic\b|\bcitizen\b/.test(input)) {
    return 'Government & Public Sector';
  }
  if (/\benergy\b|\butility\b|\biot\b/.test(input)) {
    return 'Energy, Utilities & IoT';
  }
  if (/\bretail\b|\bcommerce\b|\bstore\b/.test(input)) {
    return 'Retail & Commerce';
  }
  if (/\beducation\b|\bresearch\b|\bschool\b/.test(input)) {
    return 'Education & Research';
  }

  const industries = Array.from(
    new Set(candidates.map((item) => item.industry))
  );
  for (const industry of industries) {
    const industryNorm = normalizeTemplateText(industry);
    if (input.includes(industryNorm) || industryNorm.includes(input)) {
      return industry;
    }
  }
  return null;
};

const scoreTemplateForPrompt = (
  prompt: string,
  item: ModuleTemplateCatalogItem
) => {
  const promptTokens = tokenizeTemplateText(prompt);
  const blob = `${item.id} ${item.name} ${item.industry} ${item.category} ${item.tags.join(' ')}`;
  const candidateTokens = new Set(tokenizeTemplateText(blob));
  let score = 0;
  for (const token of promptTokens) {
    if (candidateTokens.has(token)) score += token.length >= 5 ? 3 : 2;
  }
  const normalizedPrompt = normalizeTemplateText(prompt);
  const normalizedName = normalizeTemplateText(item.name);
  const normalizedId = normalizeTemplateText(item.id);
  if (normalizedPrompt.includes(normalizedName)) score += 6;
  if (normalizedPrompt.includes(normalizedId)) score += 8;
  return score;
};

const rankTemplateCandidates = (
  prompt: string,
  catalog: ModuleTemplateCatalogItem[]
) =>
  catalog
    .map((item) => ({ item, score: scoreTemplateForPrompt(prompt, item) }))
    .filter((row) => row.score > 0)
    .sort(
      (a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name)
    );

const extractSuggestedModuleName = (prompt: string) => {
  const raw = String(prompt || '').trim();
  if (!raw) return 'New Module';
  const explicit =
    raw.match(
      /\b(?:named|called)\s+["']?(.+?)["']?(?=\s+\b(with|for|fields?)\b|$)/i
    ) || raw.match(/\bfor\s+(.+)$/i);
  const value = (explicit?.[1] || raw)
    .replace(/\b(create|build|design|generate)\b/gi, '')
    .replace(/\b(form|module|project)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!value) return 'New Module';
  return value
    .split(' ')
    .slice(0, 8)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const buildGenericTemplateDraft = (prompt: string) => {
  const projectName = extractSuggestedModuleName(prompt);
  const toField = (
    id: string,
    key: string,
    label: string,
    kind: any,
    required = false,
    placeholder?: string
  ) => ({
    id,
    key,
    label,
    kind,
    placeholder,
    validation: { required },
    layout: { colSpan: 1 },
  });
  return createEmptyDraft({
    metadata: {
      projectName,
      tags: ['operations'],
      additionalTags: [],
      security: 'private',
      accessibility: ['api', 'web', 'embedded'],
    },
    ui: {
      style: 'default',
      wizardMode: true,
      showProgressBar: true,
      primaryColor: '#3b82f6',
      theme: 'default',
    },
    fields: [
      toField('fld_name', 'name', 'Name', 'text', true, 'Enter name'),
      toField('fld_category', 'category', 'Category', 'select', true),
      toField('fld_date', 'date', 'Date', 'date', true),
      toField('fld_status', 'status', 'Status', 'select', true),
      toField(
        'fld_notes',
        'notes',
        'Notes',
        'textarea',
        false,
        'Additional notes'
      ),
    ].map((field, index) =>
      field.key === 'category'
        ? {
            ...field,
            options: ['General', 'Operations', 'Compliance', 'Finance'],
            layout: { colSpan: 1, order: index + 1 },
          }
        : field.key === 'status'
          ? {
              ...field,
              options: ['Pending', 'In Progress', 'Completed'],
              layout: { colSpan: 1, order: index + 1 },
            }
          : { ...field, layout: { colSpan: 1, order: index + 1 } }
    ),
    analysis: {
      domain: 'custom',
      dataNature: 'hybrid',
    },
  });
};

const PAYMENT_DERIVATION_PRESETS: Record<
  string,
  Array<{
    id: string;
    label: string;
    deriveFrom:
      | 'field_percentage'
      | 'expression'
      | 'node_attribute'
      | 'combined';
    expression?: string;
    percentage?: number;
    fieldKeyHint?: string;
    nodeAttributeHint?: string;
  }>
> = {
  finance: [
    {
      id: 'fin_1',
      label: '10% of amount',
      deriveFrom: 'field_percentage',
      percentage: 10,
      fieldKeyHint: 'amount',
    },
    {
      id: 'fin_2',
      label: 'Tiered amount',
      deriveFrom: 'expression',
      expression:
        'field.amount >= 100000 ? field.amount * 0.15 : field.amount * 0.1',
    },
    {
      id: 'fin_3',
      label: 'Amount + node income factor',
      deriveFrom: 'combined',
      expression: 'field.amount * 0.08 + node.profile.averageIncome * 0.01',
      nodeAttributeHint: 'profile.averageIncome',
    },
  ],
  attendance: [
    {
      id: 'att_1',
      label: '5% of offering',
      deriveFrom: 'field_percentage',
      percentage: 5,
      fieldKeyHint: 'offering',
    },
    {
      id: 'att_2',
      label: 'Attendance weighted',
      deriveFrom: 'combined',
      expression:
        'field.offering * (node.profile.averageAttendance >= 200 ? 0.12 : 0.08)',
      nodeAttributeHint: 'profile.averageAttendance',
    },
  ],
  operations: [
    {
      id: 'ops_1',
      label: 'Fixed operational fee logic',
      deriveFrom: 'expression',
      expression: 'field.amount > 0 ? field.amount * 0.07 : 0',
    },
    {
      id: 'ops_2',
      label: 'Node state modifier',
      deriveFrom: 'combined',
      expression: "field.amount * (node.state == 'Lagos' ? 0.12 : 0.1)",
      nodeAttributeHint: 'state',
    },
  ],
  hr: [
    {
      id: 'hr_1',
      label: 'Salary contribution %',
      deriveFrom: 'field_percentage',
      percentage: 3,
      fieldKeyHint: 'salary',
    },
    {
      id: 'hr_2',
      label: 'Experience band logic',
      deriveFrom: 'expression',
      expression: 'field.years_experience >= 10 ? 15000 : 7500',
    },
  ],
  custom: [
    {
      id: 'cus_1',
      label: 'Simple percentage',
      deriveFrom: 'field_percentage',
      percentage: 10,
      fieldKeyHint: 'amount',
    },
    {
      id: 'cus_2',
      label: 'Custom expression',
      deriveFrom: 'expression',
      expression: 'field.amount * 0.1',
    },
  ],
};

const deepGet = (source: any, path: string) => {
  if (!source || !path) return undefined;
  return path.split('.').reduce((acc: any, key: string) => {
    if (acc == null) return undefined;
    return acc[key];
  }, source);
};

const normalizeIncomeMode = (mode: string) => {
  if (mode === 'fixed') return 'steady';
  if (mode === 'dynamic') return 'active';
  return mode === 'active' ? 'active' : 'steady';
};

const evaluatePaymentExpression = (
  expression: string,
  sample: {
    fieldValues?: Record<string, number>;
    nodeValues?: Record<string, number>;
  }
) => {
  const raw = String(expression || '').trim();
  if (!raw) return { ok: false as const, value: 0, error: 'No expression' };
  const replaced = raw.replace(
    /\b(field|node)\.([a-zA-Z0-9_.]+)\b/g,
    (_, root, path) => {
      const bucket = root === 'field' ? sample.fieldValues : sample.nodeValues;
      const value = Number(deepGet(bucket || {}, path) || 0);
      return Number.isFinite(value) ? String(value) : '0';
    }
  );

  type Token = {
    type: 'num' | 'str' | 'op' | 'paren' | 'qmark' | 'colon';
    value: any;
  };
  const tokens: Token[] = [];
  let i = 0;
  const s = replaced;
  const twoCharOps = new Set(['&&', '||', '==', '!=', '>=', '<=']);
  const oneCharOps = new Set(['+', '-', '*', '/', '%', '>', '<', '!']);

  while (i < s.length) {
    const ch = s[i];
    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }
    const two = s.slice(i, i + 2);
    if (twoCharOps.has(two)) {
      tokens.push({ type: 'op', value: two });
      i += 2;
      continue;
    }
    if (ch === '(' || ch === ')') {
      tokens.push({ type: 'paren', value: ch });
      i += 1;
      continue;
    }
    if (ch === '?') {
      tokens.push({ type: 'qmark', value: ch });
      i += 1;
      continue;
    }
    if (ch === ':') {
      tokens.push({ type: 'colon', value: ch });
      i += 1;
      continue;
    }
    if (oneCharOps.has(ch)) {
      tokens.push({ type: 'op', value: ch });
      i += 1;
      continue;
    }
    if (ch === '"' || ch === "'") {
      const quote = ch;
      i += 1;
      let out = '';
      while (i < s.length && s[i] !== quote) {
        if (s[i] === '\\' && i + 1 < s.length) {
          out += s[i + 1];
          i += 2;
          continue;
        }
        out += s[i];
        i += 1;
      }
      if (i >= s.length) {
        return {
          ok: false as const,
          value: 0,
          error: 'Unterminated string literal',
        };
      }
      i += 1;
      tokens.push({ type: 'str', value: out });
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j += 1;
      const num = Number(s.slice(i, j));
      if (!Number.isFinite(num)) {
        return {
          ok: false as const,
          value: 0,
          error: 'Invalid number in expression',
        };
      }
      tokens.push({ type: 'num', value: num });
      i = j;
      continue;
    }
    return { ok: false as const, value: 0, error: `Unsupported token "${ch}"` };
  }

  let pos = 0;
  const peek = () => tokens[pos];
  const consume = () => tokens[pos++];
  const toNumber = (v: any) => {
    const n = Number(v);
    if (!Number.isFinite(n))
      throw new Error(`Non-numeric value "${String(v)}"`);
    return n;
  };

  const parsePrimary = (): any => {
    const token = consume();
    if (!token) throw new Error('Unexpected end of expression');
    if (token.type === 'num' || token.type === 'str') return token.value;
    if (token.type === 'paren' && token.value === '(') {
      const value = parseTernary();
      const next = consume();
      if (!next || next.type !== 'paren' || next.value !== ')') {
        throw new Error('Missing closing parenthesis');
      }
      return value;
    }
    throw new Error(`Unexpected token "${String(token.value)}"`);
  };

  const parseUnary = (): any => {
    const token = peek();
    if (token?.type === 'op' && token.value === '!') {
      consume();
      return !Boolean(parseUnary());
    }
    if (token?.type === 'op' && token.value === '-') {
      consume();
      return -toNumber(parseUnary());
    }
    return parsePrimary();
  };

  const parseMulDiv = (): any => {
    let left = parseUnary();
    while (true) {
      const token = peek();
      if (
        !token ||
        token.type !== 'op' ||
        !['*', '/', '%'].includes(token.value)
      )
        break;
      consume();
      const right = parseUnary();
      if (token.value === '*') left = toNumber(left) * toNumber(right);
      else if (token.value === '/') left = toNumber(left) / toNumber(right);
      else left = toNumber(left) % toNumber(right);
    }
    return left;
  };

  const parseAddSub = (): any => {
    let left = parseMulDiv();
    while (true) {
      const token = peek();
      if (!token || token.type !== 'op' || !['+', '-'].includes(token.value))
        break;
      consume();
      const right = parseMulDiv();
      if (token.value === '+') left = toNumber(left) + toNumber(right);
      else left = toNumber(left) - toNumber(right);
    }
    return left;
  };

  const parseRelational = (): any => {
    let left = parseAddSub();
    while (true) {
      const token = peek();
      if (
        !token ||
        token.type !== 'op' ||
        !['>', '<', '>=', '<='].includes(token.value)
      )
        break;
      consume();
      const right = parseAddSub();
      if (token.value === '>') left = toNumber(left) > toNumber(right);
      else if (token.value === '<') left = toNumber(left) < toNumber(right);
      else if (token.value === '>=') left = toNumber(left) >= toNumber(right);
      else left = toNumber(left) <= toNumber(right);
    }
    return left;
  };

  const parseEquality = (): any => {
    let left = parseRelational();
    while (true) {
      const token = peek();
      if (!token || token.type !== 'op' || !['==', '!='].includes(token.value))
        break;
      consume();
      const right = parseRelational();
      left = token.value === '==' ? left == right : left != right;
    }
    return left;
  };

  const parseAnd = (): any => {
    let left = parseEquality();
    while (peek()?.type === 'op' && peek()?.value === '&&') {
      consume();
      left = Boolean(left) && Boolean(parseEquality());
    }
    return left;
  };

  const parseOr = (): any => {
    let left = parseAnd();
    while (peek()?.type === 'op' && peek()?.value === '||') {
      consume();
      left = Boolean(left) || Boolean(parseAnd());
    }
    return left;
  };

  const parseTernary = (): any => {
    const condition = parseOr();
    if (peek()?.type === 'qmark') {
      consume();
      const whenTrue = parseTernary();
      const sep = consume();
      if (!sep || sep.type !== 'colon')
        throw new Error('Missing ":" in ternary expression');
      const whenFalse = parseTernary();
      return Boolean(condition) ? whenTrue : whenFalse;
    }
    return condition;
  };

  try {
    const parsed = parseTernary();
    if (pos < tokens.length) {
      throw new Error(`Unexpected token "${String(tokens[pos]?.value)}"`);
    }
    const value = Number(parsed);
    if (!Number.isFinite(value)) {
      return { ok: false as const, value: 0, error: 'Result is not numeric' };
    }
    return { ok: true as const, value, error: '' };
  } catch (error: any) {
    return {
      ok: false as const,
      value: 0,
      error: error?.message || 'Expression evaluation failed',
    };
  }
};

const buildModuleSamplePayload = (draft: any) => {
  if (!draft) {
    return {
      payload: {},
      warnings: ['No module draft available yet.'],
      errors: ['Generate or create a module first.'],
    };
  }

  const payload: Record<string, any> = {};
  const warnings: string[] = [];
  const errors: string[] = [];
  const seenKeys = new Set<string>();

  for (const field of Array.isArray(draft.fields) ? draft.fields : []) {
    const key = String(field?.key || '').trim();
    const label = String(field?.label || 'Unnamed field').trim();
    const kind = String(field?.kind || 'text');
    const required = Boolean(field?.validation?.required);

    if (!key) {
      errors.push(`Field "${label}" is missing a key.`);
      continue;
    }
    if (seenKeys.has(key)) {
      errors.push(`Duplicate field key detected: "${key}".`);
      continue;
    }
    seenKeys.add(key);

    if (!label) {
      warnings.push(`Field "${key}" is missing a label.`);
    }

    if (kind === 'number') payload[key] = 0;
    else if (kind === 'date') payload[key] = '2026-01-01';
    else if (kind === 'time') payload[key] = '09:00';
    else if (kind === 'datetime') payload[key] = '2026-01-01T09:00:00Z';
    else if (kind === 'checkbox') payload[key] = false;
    else if (kind === 'select' || kind === 'radio')
      payload[key] = field?.options?.[0] || '';
    else payload[key] = '';

    if (
      required &&
      (payload[key] === '' ||
        payload[key] === null ||
        payload[key] === undefined)
    ) {
      errors.push(`Required field "${label}" has empty sample value.`);
    }
  }

  if (
    draft?.workflow?.enabled &&
    (!Array.isArray(draft?.workflow?.steps) ||
      draft.workflow.steps.length === 0)
  ) {
    errors.push('Workflow is enabled but has no steps.');
  }

  if (draft?.payment?.enabled) {
    const policies = Array.isArray(draft?.payment?.policies)
      ? draft.payment.policies
      : [];
    if (policies.length === 0) {
      errors.push(
        'Payment policy is enabled but no income policy is configured.'
      );
    }
    policies.forEach((policy: any, index: number) => {
      const mode = normalizeIncomeMode(String(policy?.mode || 'steady'));
      if (mode === 'steady' && Number(policy?.fixedAmount || 0) <= 0) {
        errors.push(
          `Payment policy #${index + 1} steady income requires amount > 0.`
        );
      }
      if (mode === 'active' && !String(policy?.formula || '').trim()) {
        errors.push(
          `Payment policy #${index + 1} active income requires derivation expression.`
        );
      }
    });
  }

  return {
    payload,
    warnings,
    errors,
  };
};

const buildModulePreSubmitAudit = (draft: any) => {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!draft) {
    errors.push('No module draft loaded.');
    return { errors, warnings };
  }

  const fields = Array.isArray(draft.fields) ? draft.fields : [];
  const keySet = new Set<string>();
  fields.forEach((field: any, index: number) => {
    const key = String(field?.key || '').trim();
    const label = String(field?.label || '').trim();
    const kind = String(field?.kind || 'text');
    if (!label) errors.push(`Field #${index + 1} is missing label.`);
    if (!key)
      errors.push(`Field "${label || `#${index + 1}`}" is missing key.`);
    if (key && keySet.has(key)) errors.push(`Duplicate field key: "${key}".`);
    if (key) keySet.add(key);
    if (['select', 'radio', 'checkbox'].includes(kind)) {
      const options = Array.isArray(field?.options) ? field.options : [];
      if (options.length < 2) {
        warnings.push(
          `Field "${label || key}" should have at least 2 options.`
        );
      }
    }
  });

  if (!String(draft?.metadata?.projectName || '').trim()) {
    errors.push('Project name is required.');
  }

  if (draft?.workflow?.enabled) {
    const steps = Array.isArray(draft?.workflow?.steps)
      ? draft.workflow.steps
      : [];
    if (steps.length === 0)
      errors.push('Workflow is enabled but has no steps.');
    steps.forEach((step: any, index: number) => {
      if (!String(step?.name || '').trim()) {
        errors.push(`Workflow step #${index + 1} has no name.`);
      }
      if (
        !Array.isArray(step?.allowedRoles) ||
        step.allowedRoles.length === 0
      ) {
        warnings.push(
          `Workflow step "${step?.name || index + 1}" has no role assigned.`
        );
      }
    });
  }

  if (draft?.payment?.enabled) {
    const policies = Array.isArray(draft?.payment?.policies)
      ? draft.payment.policies
      : [];
    if (policies.length === 0) {
      errors.push('Payment policy enabled but no income policy added.');
    }
    policies.forEach((policy: any, index: number) => {
      const mode = normalizeIncomeMode(String(policy?.mode || 'steady'));
      if (mode === 'steady' && Number(policy?.fixedAmount || 0) <= 0) {
        errors.push(
          `Payment policy #${index + 1} steady income requires amount > 0.`
        );
      }
      if (mode === 'active' && !String(policy?.formula || '').trim()) {
        errors.push(
          `Payment policy #${index + 1} active income needs derived expression.`
        );
      }
      if (
        String(policy?.scopeType || '') !== 'all' &&
        !String(policy?.scopeRef || '').trim()
      ) {
        errors.push(`Payment policy #${index + 1} must target a scope.`);
      }
    });
    if (!String(draft?.payment?.currency || '').trim()) {
      warnings.push('Payment currency is not set.');
    }
  }

  const hooks = draft?.behaviorHooks || {};
  if (Array.isArray(hooks?.filePolicies)) {
    hooks.filePolicies.forEach((policy: any, index: number) => {
      if (!String(policy?.fieldKey || '').trim()) {
        warnings.push(`File policy #${index + 1} has no field key.`);
      }
    });
  }
  if (Array.isArray(hooks?.dateTriggers)) {
    hooks.dateTriggers.forEach((trigger: any, index: number) => {
      if (!String(trigger?.fieldKey || '').trim()) {
        warnings.push(`Date trigger #${index + 1} has no field key.`);
      }
    });
  }

  return { errors, warnings };
};

const computeModuleTemplateDiff = (baseline: any, current: any) => {
  if (!baseline || !current) {
    return null;
  }

  const baselineByKey = new Map<string, any>(
    (Array.isArray(baseline.fields) ? baseline.fields : []).map(
      (field: any) => [String(field?.key || field?.id || ''), field]
    )
  );
  const currentByKey = new Map<string, any>(
    (Array.isArray(current.fields) ? current.fields : []).map((field: any) => [
      String(field?.key || field?.id || ''),
      field,
    ])
  );

  const addedFields = Array.from(currentByKey.keys()).filter(
    (key) => key && !baselineByKey.has(key)
  );
  const removedFields = Array.from(baselineByKey.keys()).filter(
    (key) => key && !currentByKey.has(key)
  );
  const changedFields = Array.from(currentByKey.keys()).filter((key) => {
    if (!key || !baselineByKey.has(key)) return false;
    const base = baselineByKey.get(key);
    const next = currentByKey.get(key);
    return (
      String(base?.label || '') !== String(next?.label || '') ||
      String(base?.kind || '') !== String(next?.kind || '') ||
      Boolean(base?.validation?.required) !==
        Boolean(next?.validation?.required)
    );
  });

  const workflowChanged =
    Boolean(baseline?.workflow?.enabled) !==
      Boolean(current?.workflow?.enabled) ||
    Number(baseline?.workflow?.steps?.length || 0) !==
      Number(current?.workflow?.steps?.length || 0);
  const permChanged =
    Boolean(baseline?.perm?.enabled) !== Boolean(current?.perm?.enabled) ||
    String(baseline?.perm?.trackingMode || 'none') !==
      String(current?.perm?.trackingMode || 'none');
  const paymentChanged =
    Boolean(baseline?.payment?.enabled) !==
      Boolean(current?.payment?.enabled) ||
    String(baseline?.payment?.mode || 'none') !==
      String(current?.payment?.mode || 'none');
  const paymentConfigChanged =
    Boolean(baseline?.payment?.config?.enabled) !==
      Boolean(current?.payment?.config?.enabled) ||
    String(baseline?.payment?.config?.defaultChannel || '') !==
      String(current?.payment?.config?.defaultChannel || '') ||
    JSON.stringify(baseline?.payment?.config?.enabledChannels || []) !==
      JSON.stringify(current?.payment?.config?.enabledChannels || []);

  return {
    addedFields,
    removedFields,
    changedFields,
    workflowChanged,
    permChanged,
    paymentChanged,
    paymentConfigChanged,
    hasChanges:
      addedFields.length > 0 ||
      removedFields.length > 0 ||
      changedFields.length > 0 ||
      workflowChanged ||
      permChanged ||
      paymentChanged ||
      paymentConfigChanged,
  };
};

const helpMenuItems: HelpMenuItem[] = [
  {
    label: 'Plans and pricing',
    href: '/pricing',
    icon: <BadgeCheck className="h-3.5 w-3.5" />,
  },
  {
    label: 'Settings',
    href: '/forms/profile-settings',
    icon: <Settings2 className="h-3.5 w-3.5" />,
    requiresAuth: true,
    settingsTab: 'general',
  },
  {
    label: 'Help and support',
    href: '/help',
    icon: <LifeBuoy className="h-3.5 w-3.5" />,
  },
  {
    label: 'Product updates',
    href: '/product-updates',
    icon: <PencilLine className="h-3.5 w-3.5" />,
  },
  {
    label: 'Legal and trust',
    href: '/terms-of-service',
    icon: <BookOpenText className="h-3.5 w-3.5" />,
  },
];

const publicSolutions = [
  { label: 'Energy', href: '/coming-soon' },
  { label: 'Non Profit', href: '/coming-soon' },
  { label: 'Retail Chains', href: '/coming-soon' },
  { label: 'e-Government', href: '/coming-soon' },
];

const publicResources = [
  { label: 'Documentation', href: '/documentation' },
  { label: 'Blog', href: '/blog' },
  { label: 'Partners', href: '/partners' },
];

const publicNavItems = [
  { label: 'Pricing', href: '/pricing' },
  { label: 'Community', href: '/' },
];

const getWorkspaceMenuHref = (menu: (typeof berylliumMenuItems)[number]) => {
  const directMenu = menu.menuItems.find((item) => item.href)?.href;
  if (directMenu) return directMenu;
  const nestedMenu = menu.menuItems.find((item) => item.subMenuItems?.[0]?.href)
    ?.subMenuItems?.[0]?.href;
  if (nestedMenu) return nestedMenu;
  return '/';
};

type AuthModalMode = 'closed' | 'quick' | 'full';

const mapAuthQueryToView = (value: string | null): AuthView => {
  switch ((value || '').toLowerCase()) {
    case 'signup':
      return 'signup';
    case 'forgot':
      return 'forgot';
    case 'otp':
      return 'otp';
    case 'reset':
      return 'reset';
    case 'phone':
      return 'phone';
    default:
      return 'login';
  }
};

const mapAuthErrorToMessage = (value: string | null): string | null => {
  switch ((value || '').toLowerCase()) {
    case 'callback':
      return 'Google sign-in failed during callback. Please try again or use email login.';
    case 'oauthcallback':
      return 'OAuth callback failed. Please retry Google sign-in.';
    case 'oauthsignin':
      return 'Unable to start OAuth sign-in. Please try again.';
    case 'accessdenied':
      return 'Access was denied by the provider.';
    default:
      return null;
  }
};

type SabyChatLandingMode = 'chat' | 'onboarding';

type SabyChatLandingProps = {
  mode?: SabyChatLandingMode;
  initialTheme?: PublicThemeMode;
};

export default function SabyChatLanding({
  mode = 'chat',
  initialTheme = 'dark',
}: SabyChatLandingProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const {
    login: loginWithCredentials,
    register: registerUser,
    forgotPassword: requestForgotPassword,
    resetPassword: submitResetPassword,
    verifyOtp: verifyOtpCode,
    resendOtp: resendOtpCode,
  } = useAuth();
  const {
    isEnabled: isCaptchaEnabled,
    isReady: isCaptchaReady,
    error: captchaError,
    execute: executeCaptcha,
  } = useRecaptcha();
  const [isClientReady, setIsClientReady] = useState(false);
  const isSessionLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated' && Boolean(session?.user);


  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const { themeMode, isLightTheme, setThemeMode } = usePublicTheme(
    initialTheme,
    {
      storageKey: 'saby:theme-preference:public-pages',
    }
  );
  useEffect(() => {
    setIsClientReady(true);
  }, []);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isHelpMenuOpen, setIsHelpMenuOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsModalInitialTab, setSettingsModalInitialTab] =
    useState<ProfileSettingsTabId>('general');
  const [isSolutionsMenuOpen, setIsSolutionsMenuOpen] = useState(false);
  const [isResourcesMenuOpen, setIsResourcesMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isPublicAuthModalOpen, setIsPublicAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('closed');
  const [authView, setAuthView] = useState<AuthView>('login');
  const [authRedirectPath, setAuthRedirectPath] = useState('/');
  const [authModalInitialError, setAuthModalInitialError] = useState<
    string | null
  >(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authInfo, setAuthInfo] = useState<string | null>(null);
  const [authFieldErrors, setAuthFieldErrors] = useState<AuthFieldErrors>({});
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
  const [prompt, setPrompt] = useState('');
  const [showThoughtProcess, setShowThoughtProcess] = useState<boolean>(true);

  useEffect(() => {
    try {
      const stored = window.localStorage?.getItem('saby_show_thought_process');
      if (stored !== null) {
        setShowThoughtProcess(stored !== 'false');
      }
    } catch {
      /* ignore */
    }
  }, []);
  const [activeIssueIndex, setActiveIssueIndex] = useState(0);
  const [liveTaskItems, setLiveTaskItems] =
    useState<RollingIssue[]>(rollingIssues);
  const [userSidebarHistory, setUserSidebarHistory] = useState<
    SidebarHistory[]
  >([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [historySearch, setHistorySearch] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [pendingAuthCredentials, setPendingAuthCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [activeRootHeroMessageIndex, setActiveRootHeroMessageIndex] =
    useState(0);
  const [activeLandingToolGroup, setActiveLandingToolGroup] = useState<
    'workspace' | 'insights' | 'utilities' | null
  >(null);
  const [activeHeroPromptIndex, setActiveHeroPromptIndex] = useState(0);
  const [typedHeroPrompt, setTypedHeroPrompt] = useState('');
  const [isHeroPromptDeleting, setIsHeroPromptDeleting] = useState(false);
  const [chatTurns, setChatTurns] = useState<ChatTurn[]>([]);
  const [typingAssistantTurnId, setTypingAssistantTurnId] = useState<
    string | null
  >(null);
  const [isChatSending, setIsChatSending] = useState(false);
  const [chatProgressStage, setChatProgressStage] = useState<
    'thinking' | 'tools' | 'synthesis' | 'routing' | null
  >(null);
  const chatAbortControllerRef = useRef<AbortController | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [copiedTurnId, setCopiedTurnId] = useState<string | null>(null);
  const [editingUserTurnId, setEditingUserTurnId] = useState<string | null>(
    null
  );
  const [editingUserTurnText, setEditingUserTurnText] = useState('');
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [selectedRootModel, setSelectedRootModel] = useState('Flash');
  const [rootMenuOpenSections, setRootMenuOpenSections] = useState<
    Record<
      'model' | 'workspace' | 'insights' | 'utilities' | 'response',
      boolean
    >
  >({
    model: false,
    workspace: false,
    insights: false,
    utilities: false,
    response: false,
  });
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceInputError, setVoiceInputError] = useState<string | null>(null);
  const [isModuleLibraryMenuOpen, setIsModuleLibraryMenuOpen] = useState(false);
  const [activeToolCommand, setActiveToolCommand] = useState<string | null>(
    null
  );
  const [isHelpMode, setIsHelpMode] = useState(false);
  const [actionTurnMeta, setActionTurnMeta] = useState<
    Record<string, ActionTurnMeta>
  >({});
  const [assistantPromptChips, setAssistantPromptChips] = useState<
    Record<string, AssistantPromptChip[]>
  >({});
  const speechRecognitionRef = useRef<any>(null);
  const speechBasePromptRef = useRef('');
  const speechFinalTranscriptRef = useRef('');
  const speechInterimTranscriptRef = useRef('');

  // Feedback state — tracks per-turn thumbs-up/down selection and submission status
  const [feedbackByTurnId, setFeedbackByTurnId] = useState<
    Record<string, 'helpful' | 'not_helpful' | null>
  >({});
  // Optional per-turn intent/workflowName stored from the SSE done event
  const [turnIntentByTurnId, setTurnIntentByTurnId] = useState<
    Record<string, string | null>
  >({});

  const [expandedActionDetails, setExpandedActionDetails] = useState<
    Record<string, boolean>
  >({});
  const [isModuleWorkspaceOpen, setIsModuleWorkspaceOpen] = useState(false);
  const [activeModuleTab, setActiveModuleTab] =
    useState<ModuleArtifactTab>('preview');
  const [moduleTemplateCatalog, setModuleTemplateCatalog] = useState<
    ModuleTemplateCatalogItem[]
  >([]);
  const [moduleTemplateLibraryQuery, setModuleTemplateLibraryQuery] =
    useState('');
  const [moduleTemplateIndustryFilter, setModuleTemplateIndustryFilter] =
    useState<string>('All Industries');
  const [moduleTemplateReadinessFilter, setModuleTemplateReadinessFilter] =
    useState<'all' | 'payment_enabled' | 'church' | 'nonprofit'>('all');
  const [moduleTemplateLibraryLoading, setModuleTemplateLibraryLoading] =
    useState(false);
  const [moduleTemplateLibraryError, setModuleTemplateLibraryError] = useState<
    string | null
  >(null);
  const [moduleTemplatePreviewItem, setModuleTemplatePreviewItem] =
    useState<ModuleTemplateCatalogItem | null>(null);
  const [moduleTemplatePreviewDraft, setModuleTemplatePreviewDraft] = useState<
    any | null
  >(null);
  const [moduleTemplatePreviewPanel, setModuleTemplatePreviewPanel] = useState<
    'preview' | 'json'
  >('preview');
  const [moduleTemplatePreviewLoading, setModuleTemplatePreviewLoading] =
    useState(false);
  const [moduleTemplatePreviewError, setModuleTemplatePreviewError] = useState<
    string | null
  >(null);
  const [moduleTemplateSelection, setModuleTemplateSelection] =
    useState<ModuleTemplateSelectionState | null>(null);
  const [moduleTemplateBaseline, setModuleTemplateBaseline] = useState<
    any | null
  >(null);
  const [moduleTemplateInfo, setModuleTemplateInfo] = useState<{
    id: string;
    name: string;
    industry: string;
    category: string;
  } | null>(null);
  const [moduleLifecycleStage, setModuleLifecycleStage] = useState<
    'draft' | 'in_review' | 'approved' | 'published' | 'archived'
  >('draft');
  const [isModuleSubmitting, setIsModuleSubmitting] = useState(false);
  const [isModuleAutoSaving, setIsModuleAutoSaving] = useState(false);
  const [moduleLastSavedAt, setModuleLastSavedAt] = useState<string | null>(
    null
  );
  const [moduleSubmitDryRun, setModuleSubmitDryRun] = useState<any | null>(
    null
  );
  const [moduleSubmitResult, setModuleSubmitResult] = useState<any | null>(
    null
  );
  const [moduleLibraryLoading, setModuleLibraryLoading] = useState(false);
  const [moduleLibraryError, setModuleLibraryError] = useState<string | null>(
    null
  );
  const [moduleLibraryItems, setModuleLibraryItems] = useState<
    ModuleLibraryItem[]
  >([]);
  const [activeModuleRecordId, setActiveModuleRecordId] = useState<
    string | null
  >(null);
  const [moduleNodesLoading, setModuleNodesLoading] = useState(false);
  const [moduleNodesError, setModuleNodesError] = useState<string | null>(null);
  const [moduleNodeLevels, setModuleNodeLevels] = useState<
    Array<{ id: string; name: string; order?: number }>
  >([]);
  const [moduleNodeList, setModuleNodeList] = useState<
    Array<{
      id: string;
      name: string;
      levelId: string;
      levelName: string;
      parentId?: string | null;
      attributes?: Record<string, any>;
    }>
  >([]);
  const [moduleFamilyRoots, setModuleFamilyRoots] = useState<
    Array<{ id: string; name: string; levelId: string; levelName: string }>
  >([]);
  const [moduleNodeAttributeKeys, setModuleNodeAttributeKeys] = useState<
    string[]
  >([]);
  const [moduleRolesLoading, setModuleRolesLoading] = useState(false);
  const [moduleRolesError, setModuleRolesError] = useState<string | null>(null);
  const [moduleRoleList, setModuleRoleList] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [paymentDryRunInputs, setPaymentDryRunInputs] = useState<
    Record<string, { fieldValue: number; nodeValue: number }>
  >({});
  const [paymentSettingsBuffers, setPaymentSettingsBuffers] = useState<
    Record<string, string>
  >({});
  const [paymentSettingsErrors, setPaymentSettingsErrors] = useState<
    Record<string, string>
  >({});
  const [moduleWizardSavedStates, setModuleWizardSavedStates] = useState<
    Partial<Record<ModuleArtifactTab, string>>
  >({});
  const [onboardingUi, setOnboardingUi] = useState<OnboardingUiState | null>(
    null
  );
  const [ownerOnboardingLoadingState, setOwnerOnboardingLoading] =
    useState(true);
  const [ownerOnboardingRequiredState, setOwnerOnboardingRequired] =
    useState(false);
  const [ownerOnboardingProfileState, setOwnerOnboardingProfile] =
    useState<OwnerOnboardingProfile | null>(null);
  const [ownerOnboardingSession, setOwnerOnboardingSession] =
    useState<OwnerOnboardingSessionState | null>(null);
  const [onboardingIssueDataByTurnId, setOnboardingIssueDataByTurnId] =
    useState<
      Record<
        string,
        {
          jobId: string;
          issues: OnboardingIssueEntry[];
          summary: Record<string, any>;
        }
      >
    >({});
  const [onboardingIssueExpandedByTurnId, setOnboardingIssueExpandedByTurnId] =
    useState<Record<string, boolean>>({});
  const [ownerPhoneVerification, setOwnerPhoneVerification] =
    useState<OwnerPhoneVerificationState | null>(null);
  const [ownerOnboardingReviewByTurnId, setOwnerOnboardingReviewByTurnId] =
    useState<Record<string, OwnerOnboardingReviewCard>>({});
  const [openHistoryMenuId, setOpenHistoryMenuId] = useState<string | null>(
    null
  );
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
  const [editingHistoryTitle, setEditingHistoryTitle] = useState('');
  const [sidebarNotice, setSidebarNotice] = useState<string | null>(null);
  const [historyView, setHistoryView] = useState<'active' | 'archived'>(
    'active'
  );

  const composerMenuRef = useRef<HTMLDivElement>(null);
  const moduleLibraryMenuRef = useRef<HTMLDivElement>(null);
  const historyMenuRef = useRef<HTMLDivElement>(null);
  const helpMenuRef = useRef<HTMLDivElement>(null);
  const solutionsMenuRef = useRef<HTMLDivElement>(null);
  const resourcesMenuRef = useRef<HTMLDivElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const composerInputRef = useRef<HTMLTextAreaElement>(null);
  const isComposerFocusedRef = useRef(false);
  const composerSelectionRef = useRef<{ start: number; end: number } | null>(null);
  const [isComposerMultiline, setIsComposerMultiline] = useState(false);
  const draftThreadIdRef = useRef<string | null>(null);
  const actionPollingRef = useRef<Set<string>>(new Set());
  const onboardingPollingRef = useRef<number | null>(null);
  const onboardingAnnouncedJobsRef = useRef<Set<string>>(new Set());
  const onboardingFileInputRef = useRef<HTMLInputElement>(null);
  const onboardingPendingImportFileRef = useRef<File | null>(null);
  const ownerOnboardingPromptRef = useRef<string | null>(null);
  const ownerOnboardingActiveTurnRef = useRef<string | null>(null);
  const ownerOnboardingIntroShownRef = useRef(false);
  const ownerPhoneOtpInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const ownerOnboardingDraftSaveTimerRef = useRef<number | null>(null);
  const ownerOnboardingDraftSignatureRef = useRef<string>('');
  const assistantTurnQueueRef = useRef<
    Array<{ turn: ChatTurn; chips?: AssistantPromptChip[] }>
  >([]);
  const typingAssistantTurnRef = useRef<string | null>(null);
  const [ownerOnboardingTurnState, setOwnerOnboardingTurnState] = useState<
    Record<string, 'active' | 'answered'>
  >({});
  const moduleAutosaveInFlightRef = useRef(false);
  const moduleLastAutosaveSignatureRef = useRef<string>('');
  const [moduleDraftHistory, dispatchModuleDraft] = useReducer(
    moduleDraftReducer,
    initialModuleDraftHistoryState
  );
  const moduleDraft = moduleDraftHistory.present;
  const moduleReadiness = useMemo(
    () => (moduleDraft ? evaluateDraftReadiness(moduleDraft) : null),
    [moduleDraft]
  );
  const moduleSampleSimulation = useMemo(
    () => buildModuleSamplePayload(moduleDraft),
    [moduleDraft]
  );
  const modulePreSubmitAudit = useMemo(
    () => buildModulePreSubmitAudit(moduleDraft),
    [moduleDraft]
  );
  const moduleBlockerActions = useMemo(() => {
    const blockers = Array.isArray(moduleSubmitDryRun?.lint?.blockers)
      ? moduleSubmitDryRun.lint.blockers
      : Array.isArray(moduleReadiness?.blockers)
        ? moduleReadiness.blockers
        : [];
    const bucket = new Map<
      string,
      {
        label: string;
        tab: ModuleArtifactTab;
        count: number;
        blockers: string[];
      }
    >();
    const push = (
      key: string,
      label: string,
      tab: ModuleArtifactTab,
      blocker: string
    ) => {
      const existing = bucket.get(key);
      if (existing) {
        existing.count += 1;
        existing.blockers.push(blocker);
      } else {
        bucket.set(key, { label, tab, count: 1, blockers: [blocker] });
      }
    };
    blockers.forEach((blocker: string) => {
      const text = String(blocker || '').toLowerCase();
      if (/workflow|step|approv|review/.test(text)) {
        push('workflow', 'Workflow', 'workflow', blocker);
      } else if (
        /payment config|payment channel|processor|gateway/.test(text)
      ) {
        push('payment_config', 'Payment Config', 'payment_config', blocker);
      } else if (
        /payment|formula|fixed amount|steady income|active income|currency/.test(
          text
        )
      ) {
        push('payment', 'Payment Policy', 'payment', blocker);
      } else if (/field|key|label|project name/.test(text)) {
        push('builder', 'Fields', 'builder', blocker);
      } else if (/perm|tracking|calendar/.test(text)) {
        push('review', 'Compliance', 'review', blocker);
      } else {
        push('review_other', 'Review', 'review', blocker);
      }
    });
    return {
      total: blockers.length,
      groups: Array.from(bucket.values()),
      blockers,
    };
  }, [moduleSubmitDryRun?.lint?.blockers, moduleReadiness?.blockers]);
  const isModuleReadyToSubmit = useMemo(() => {
    const blockers = moduleSubmitDryRun?.lint?.blockers;
    return (
      Array.isArray(blockers) &&
      blockers.length === 0 &&
      Boolean(moduleSubmitDryRun?.payload)
    );
  }, [moduleSubmitDryRun]);
  const moduleTemplateDiff = useMemo(
    () => computeModuleTemplateDiff(moduleTemplateBaseline, moduleDraft),
    [moduleTemplateBaseline, moduleDraft]
  );
  const moduleTemplateIndustries = useMemo(() => {
    const values = Array.from(
      new Set(
        moduleTemplateCatalog
          .map((item) => String(item.industry || '').trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
    return ['All Industries', ...values];
  }, [moduleTemplateCatalog]);
  const moduleTemplateLibraryFiltered = useMemo(() => {
    const query = String(moduleTemplateLibraryQuery || '')
      .trim()
      .toLowerCase();
    return moduleTemplateCatalog.filter((item) => {
      if (
        moduleTemplateIndustryFilter !== 'All Industries' &&
        String(item.industry) !== moduleTemplateIndustryFilter
      ) {
        return false;
      }
      if (moduleTemplateReadinessFilter === 'payment_enabled') {
        if (!item.readiness?.paymentPolicy) return false;
      } else if (moduleTemplateReadinessFilter === 'church') {
        if (!item.taxonomy?.isChurch) return false;
      } else if (moduleTemplateReadinessFilter === 'nonprofit') {
        if (!item.taxonomy?.isNonProfit) return false;
      }
      if (!query) return true;
      const blob =
        `${item.id} ${item.name} ${item.industry} ${item.category} ${(
          item.tags || []
        ).join(' ')}`.toLowerCase();
      return blob.includes(query);
    });
  }, [
    moduleTemplateCatalog,
    moduleTemplateIndustryFilter,
    moduleTemplateLibraryQuery,
    moduleTemplateReadinessFilter,
  ]);
  const moduleLastSavedLabel = useMemo(() => {
    if (!moduleLastSavedAt) return null;
    const dt = new Date(moduleLastSavedAt);
    if (Number.isNaN(dt.getTime())) return null;
    return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [moduleLastSavedAt]);
  const moduleDateFields = useMemo(
    () =>
      (Array.isArray(moduleDraft?.fields) ? moduleDraft.fields : []).filter(
        (field) => ['date', 'datetime', 'time'].includes(String(field.kind))
      ),
    [moduleDraft?.fields]
  );
  const moduleFileFields = useMemo(
    () =>
      (Array.isArray(moduleDraft?.fields) ? moduleDraft.fields : []).filter(
        (field) => String(field.kind) === 'file'
      ),
    [moduleDraft?.fields]
  );
  const moduleDateTriggers = useMemo(() => {
    const raw = (moduleDraft?.behaviorHooks as any)?.dateTriggers;
    return Array.isArray(raw) ? raw : [];
  }, [moduleDraft?.behaviorHooks]);
  const moduleFilePolicies = useMemo(() => {
    const raw = (moduleDraft?.behaviorHooks as any)?.filePolicies;
    return Array.isArray(raw) ? raw : [];
  }, [moduleDraft?.behaviorHooks]);
  const draftUtilities = useMemo(
    () => getDraftUtilities(moduleDraft as any),
    [moduleDraft]
  );
  const utilitySuggestions = useMemo(() => {
    const fields = Array.isArray(moduleDraft?.fields) ? moduleDraft.fields : [];
    const taken = new Set(
      draftUtilities.map(
        (u: any) => `${String(u?.type || '')}:${String(u?.fieldKey || '')}`
      )
    );
    const suggestions: Array<{
      type: string;
      fieldKey?: string;
      label: string;
      fieldLabel?: string;
    }> = [];
    fields.forEach((field: any) => {
      const candidates = detectUtilityCandidatesForField(field);
      candidates.forEach((type) => {
        const key = `${type}:${String(field?.key || '')}`;
        if (taken.has(key)) return;
        suggestions.push({
          type,
          fieldKey: field?.key,
          fieldLabel: field?.label,
          label: `${utilityTypeLabels[type]} • ${field?.label || field?.key || 'field'}`,
        });
      });
    });
    return suggestions.slice(0, 16);
  }, [moduleDraft?.fields, draftUtilities]);
  const moduleWizardStepIndex = useMemo(
    () => moduleWizardSteps.findIndex((step) => step.key === activeModuleTab),
    [activeModuleTab]
  );
  const moduleWizardCurrentStep =
    moduleWizardStepIndex >= 0
      ? moduleWizardSteps[moduleWizardStepIndex]
      : null;
  const moduleWizardPrevStep =
    moduleWizardStepIndex > 0
      ? moduleWizardSteps[moduleWizardStepIndex - 1]
      : null;
  const moduleWizardNextStep =
    moduleWizardStepIndex >= 0 &&
    moduleWizardStepIndex < moduleWizardSteps.length - 1
      ? moduleWizardSteps[moduleWizardStepIndex + 1]
      : null;

  const getModuleWizardSignature = useCallback(
    (tab: ModuleArtifactTab) => {
      if (!moduleDraft) return '';
      switch (tab) {
        case 'preview':
          return JSON.stringify({
            projectName: moduleDraft.metadata?.projectName || '',
            tags: moduleDraft.metadata?.tags || [],
            additionalTags: moduleDraft.metadata?.additionalTags || [],
            security: moduleDraft.metadata?.security || 'private',
            accessibility: moduleDraft.metadata?.accessibility || [],
          });
        case 'builder':
          return JSON.stringify(moduleDraft.fields || []);
        case 'workflow':
          return JSON.stringify(moduleDraft.workflow || {});
        case 'payment':
          return JSON.stringify(moduleDraft.payment || {});
        case 'payment_config':
          return JSON.stringify((moduleDraft.payment as any)?.config || {});
        case 'utilities':
          return JSON.stringify({
            utilities: draftUtilities || [],
            dateTriggers: moduleDateTriggers || [],
            filePolicies: moduleFilePolicies || [],
          });
        case 'behavior':
          return JSON.stringify(moduleDraft.behaviorHooks || {});
        case 'review':
          return JSON.stringify({
            blockers: modulePreSubmitAudit.errors || [],
            warnings: modulePreSubmitAudit.warnings || [],
            dryRunReady: Boolean(moduleSubmitDryRun?.payload),
            lifecycle: moduleLifecycleStage,
          });
        default:
          return JSON.stringify(moduleDraft);
      }
    },
    [
      draftUtilities,
      moduleDateTriggers,
      moduleDraft,
      moduleFilePolicies,
      moduleLifecycleStage,
      modulePreSubmitAudit.errors,
      modulePreSubmitAudit.warnings,
      moduleSubmitDryRun?.payload,
    ]
  );

  const getModuleWizardStepBlockers = useCallback(
    (tab: ModuleArtifactTab) => {
      if (!moduleDraft) return ['Load or create a module first.'];
      switch (tab) {
        case 'preview':
          return moduleDraft.metadata?.projectName?.trim()
            ? []
            : ['Module name is required.'];
        case 'builder':
          return Array.isArray(moduleDraft.fields) &&
            moduleDraft.fields.length > 0
            ? []
            : ['Add at least one field before continuing.'];
        case 'workflow':
          return moduleDraft.workflow?.enabled &&
            (moduleDraft.workflow.steps || []).length === 0
            ? ['Add at least one workflow step or disable workflow.']
            : [];
        case 'payment':
          return (
            moduleReadiness?.blockers?.filter((blocker) => {
              const text = String(blocker || '');
              const paymentRelated =
                /payment|formula|fixed amount|steady income|active income|currency/i.test(
                  text
                );
              const paymentConfigRelated =
                /payment config|payment channel|default channel|processor|gateway/i.test(
                  text
                );
              return paymentRelated && !paymentConfigRelated;
            }) || []
          );
        case 'payment_config':
          return (
            moduleReadiness?.blockers?.filter((blocker) =>
              /payment config|payment channel|default channel|processor|gateway/i.test(
                blocker
              )
            ) || []
          );
        case 'utilities':
          return [];
        case 'behavior':
          return [];
        case 'review':
          return modulePreSubmitAudit.errors || [];
        default:
          return [];
      }
    },
    [moduleDraft, modulePreSubmitAudit.errors, moduleReadiness?.blockers]
  );

  const moduleWizardCurrentBlockers = useMemo(
    () =>
      moduleWizardCurrentStep
        ? getModuleWizardStepBlockers(moduleWizardCurrentStep.key)
        : [],
    [getModuleWizardStepBlockers, moduleWizardCurrentStep]
  );
  const moduleWizardCurrentSignature = useMemo(
    () =>
      moduleWizardCurrentStep
        ? getModuleWizardSignature(moduleWizardCurrentStep.key)
        : '',
    [getModuleWizardSignature, moduleWizardCurrentStep]
  );
  const moduleWizardCurrentSavedSignature = moduleWizardCurrentStep
    ? moduleWizardSavedStates[moduleWizardCurrentStep.key] || ''
    : '';
  const moduleWizardCurrentStepSaved = Boolean(
    moduleWizardCurrentStep &&
      moduleWizardCurrentSavedSignature &&
      moduleWizardCurrentSavedSignature === moduleWizardCurrentSignature
  );
  const moduleWizardPrimaryLabel = useMemo(() => {
    if (!moduleWizardCurrentStep) return 'Continue';
    if (moduleWizardCurrentStep.key === 'review') {
      if (moduleLifecycleStage === 'published') return 'Published';
      return moduleLifecycleStage === 'approved'
        ? 'Publish Module'
        : moduleWizardCurrentStep.saveLabel;
    }
    if (!moduleWizardCurrentStepSaved) return moduleWizardCurrentStep.saveLabel;
    return moduleWizardNextStep
      ? `Continue to ${moduleWizardNextStep.label}`
      : 'Continue';
  }, [
    moduleLifecycleStage,
    moduleWizardCurrentStep,
    moduleWizardCurrentStepSaved,
    moduleWizardNextStep,
  ]);

  const getSafeRedirectPath = (path?: string) => {
    if (!path || path === '%2F') return '/';
    if (path.startsWith('/')) return path;
    return '/';
  };

  useEffect(() => {
    if (!isClientReady || status === 'loading') return;

    // Already signed in via CLI login: send the existing session straight to
    // the local callback server without reopening the auth modal.
    const cliCallbackParam = searchParams.get('cli_callback');
    if (isAuthenticated && cliCallbackParam) {
      const cliUser = session?.user as {
        accessToken?: string;
        refreshToken?: string;
        name?: string | null;
        email?: string | null;
      };
      if (cliUser?.accessToken) {
        window.location.replace(
          cliCallbackParam +
            '#' +
            encodeURIComponent(
              JSON.stringify({
                accessToken: cliUser.accessToken,
                refreshToken: cliUser.refreshToken,
                name: cliUser.name,
                email: cliUser.email,
              })
            )
        );
      }
      return;
    }

    if (!isClientReady || status === 'loading' || isAuthenticated) return;
    const authQuery = searchParams.get('auth');
    const authError = searchParams.get('error');
    if (!authQuery && !authError) return;

    const nextView = authQuery ? mapAuthQueryToView(authQuery) : 'login';
    const callbackUrl = getSafeRedirectPath(
      searchParams.get('callbackUrl') || pathname || '/'
    );

    setAuthView(nextView);
    setAuthRedirectPath(callbackUrl);
    setAuthModalInitialError(mapAuthErrorToMessage(authError));
    setIsPublicAuthModalOpen(true);

    // CLI login handoff: preserve the callback target across OTP/MFA steps so
    // the login hook can redirect back to the local CLI with the session.
    const cliCallback = searchParams.get('cli_callback');
    if (cliCallback) {
      sessionStorage.setItem('sabyCliCallback', cliCallback);
    }

    const nextSearch = new URLSearchParams(searchParams.toString());
    nextSearch.delete('auth');
    nextSearch.delete('error');
    nextSearch.delete('callbackUrl');
    nextSearch.delete('cli_callback');
    const cleanedQuery = nextSearch.toString();
    const target = cleanedQuery ? `${pathname}?${cleanedQuery}` : pathname;
    router.replace(target, { scroll: false });
  }, [isAuthenticated, isClientReady, pathname, router, searchParams, session, status]);

  const displayName = useMemo(() => {
    if (!isAuthenticated) return 'Guest User';
    if (session?.user?.name) return session.user.name;
    if (session?.user?.email) return session.user.email.split('@')[0];
    return 'Saby User';
  }, [isAuthenticated, session?.user?.email, session?.user?.name]);

  const displayEmail = isAuthenticated
    ? session?.user?.email || 'Authenticated user'
    : 'Sign in to personalize your workspace';
  const modalSettingsStorageKey = useMemo(() => {
    if (!isAuthenticated) return undefined;
    const tenantId = session?.user?.tenantId || 'default';
    const userKey = session?.user?.email || session?.user?.id;
    if (!userKey) return undefined;
    return `saby:settings:${tenantId}:${userKey}`;
  }, [isAuthenticated, session?.user?.tenantId, session?.user?.email, session?.user?.id]);
  const isOnboardingRoute = mode === 'onboarding';
  const ownerOnboardingLoading =
    isOnboardingRoute && ownerOnboardingLoadingState;
  const ownerOnboardingRequired =
    isOnboardingRoute && ownerOnboardingRequiredState;
  const dashboardNavLocked = isAuthenticated && ownerOnboardingRequired;
  const isRootAuthenticatedChatUi =
    mode === 'chat' && isAuthenticated && !ownerOnboardingRequired;
  const hasAuthenticatedChatActivity =
    isAuthenticated &&
    (chatTurns.length > 0 || Boolean(chatError) || isChatSending);
  const showAuthenticatedRootHero =
    isRootAuthenticatedChatUi && !hasAuthenticatedChatActivity;
  const hasPromptValue = prompt.trim().length > 0;
  const hasRootComposerContext =
    isRootAuthenticatedChatUi &&
    (Boolean(activeToolCommand) ||
      Boolean(activeLandingToolGroup) ||
      isHelpMode);
  const useCompactRootComposer =
    isRootAuthenticatedChatUi &&
    showAuthenticatedRootHero &&
    !hasRootComposerContext;
  const useCompactMarketingComposer = !isAuthenticated;
  const isLandingEntryRoute = false;
  const shouldShowAuthenticatedEntryHandoff = false;
  const onboardingThreadId = useMemo(() => {
    if (!isAuthenticated) return null;
    const tenantId = session?.user?.tenantId || 'default';
    const identity = session?.user?.id || session?.user?.email;
    if (!identity) return null;
    return `owner-onboarding-${tenantId}-${identity}`;
  }, [isAuthenticated, session?.user?.tenantId, session?.user?.email, session?.user?.id]);

  const showOnboardingLockNotice = useCallback(
    (targetLabel?: string) => {
      if (!dashboardNavLocked) return;
      setSidebarNotice(
        targetLabel
          ? `Finish onboarding to open ${targetLabel}.`
          : 'Finish onboarding before opening workspace links.'
      );
      if (typeof window !== 'undefined') {
        window.setTimeout(() => setSidebarNotice(null), 2600);
      }
    },
    [dashboardNavLocked]
  );

  const activeToolLabel = useMemo(() => {
    if (!activeToolCommand) return null;
    return (
      commandTools.find((tool) => tool.command === activeToolCommand)?.label ||
      activeToolCommand.replace(/^\//, '')
    );
  }, [activeToolCommand]);
  const rootHeroMessages = useMemo(
    () => [
      `Good to see you, ${displayName}.`,
      'What’s task is the next ?',
      'What are you working on ?',
      `Hey, ${displayName}. Ready to dive in?`,
      'Ready when you are.',
    ],
    [displayName]
  );
  const rootUtilityTools = useMemo(
    () =>
      commandTools.filter((tool) =>
        ['search', 'resolve', 'help'].includes(tool.key)
      ),
    []
  );
  const rootWorkspaceTools = useMemo(
    () =>
      commandTools.filter((tool) =>
        ['user', 'node', 'module', 'onboarding'].includes(tool.key)
      ),
    []
  );
  const rootInsightTools = useMemo(
    () =>
      commandTools.filter((tool) =>
        ['scoreboard', 'rules', 'node-rankings', 'node-compare'].includes(
          tool.key
        )
      ),
    []
  );
  const rootResponseTools = useMemo(
    () => commandTools.filter((tool) => ['feedback'].includes(tool.key)),
    []
  );
  const landingToolGroups = useMemo(
    () => [
      {
        key: 'workspace' as const,
        title: 'Manage Daily Tasks',
        description: 'User, node, module and onboarding actions',
        children: rootWorkspaceTools,
        icon: <ClipboardList className="h-4.5 w-4.5" />,
        accent:
          'border-[#365b96]/60 bg-[#16243d]/85 text-[#dbeafe] hover:bg-[#1d2e4d]',
        chipAccent:
          'border-[#4b6ea4] bg-[#20304b] text-[#dbeafe] hover:bg-[#284066]',
      },
      {
        key: 'insights' as const,
        title: 'Generate Reports',
        description: 'Analytics, rules and node performance',
        children: rootInsightTools,
        icon: <BarChart3 className="h-4.5 w-4.5" />,
        accent:
          'border-[#5d467d]/60 bg-[#23182f]/85 text-[#f1e8ff] hover:bg-[#2c1f3d]',
        chipAccent:
          'border-[#7f63a8] bg-[#34224a] text-[#f1e8ff] hover:bg-[#422d5f]',
      },
      {
        key: 'utilities' as const,
        title: 'Search & utilities',
        description: 'Search and resolve operational records',
        children: rootUtilityTools,
        icon: <Search className="h-4.5 w-4.5" />,
        accent:
          'border-[#4a5e2a]/60 bg-[#1b2410]/85 text-[#e6f7c8] hover:bg-[#243115]',
        chipAccent:
          'border-[#6f8c39] bg-[#2a3817] text-[#e6f7c8] hover:bg-[#36481d]',
      },
    ],
    [rootInsightTools, rootUtilityTools, rootWorkspaceTools]
  );
  const selectedLandingToolGroup = useMemo(
    () =>
      landingToolGroups.find((group) => group.key === activeLandingToolGroup) ||
      null,
    [activeLandingToolGroup, landingToolGroups]
  );
  const rootModelOptions = useMemo(
    () => [
      { key: 'flash', label: 'Flash', hint: 'Fast everyday assistance' },
      { key: 'balanced', label: 'Balanced', hint: 'General-purpose reasoning' },
      { key: 'pro', label: 'Pro', hint: 'Stronger analysis and writing' },
      {
        key: 'deep-think',
        label: 'Deep Think',
        hint: 'Highest reasoning depth',
      },
    ],
    []
  );
  useEffect(() => {
    if (!showAuthenticatedRootHero) {
      setActiveLandingToolGroup(null);
      return;
    }

    setActiveRootHeroMessageIndex(() =>
      Math.floor(Math.random() * rootHeroMessages.length)
    );
  }, [rootHeroMessages.length, showAuthenticatedRootHero]);

  const toggleRootMenuSection = useCallback(
    (
      section: 'model' | 'workspace' | 'insights' | 'utilities' | 'response'
    ) => {
      setRootMenuOpenSections((current) => ({
        ...current,
        [section]: !current[section],
      }));
    },
    []
  );
  const clearLandingToolSelection = useCallback(() => {
    setActiveLandingToolGroup(null);
    setActiveToolCommand(null);
  }, []);
  const stopVoiceInput = useCallback(() => {
    const recognition = speechRecognitionRef.current;
    if (recognition) {
      try {
        recognition.stop();
      } catch {}
    }
    const finalPrompt = [
      speechBasePromptRef.current,
      speechFinalTranscriptRef.current,
    ]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (finalPrompt) {
      setPrompt(finalPrompt);
    }
    speechInterimTranscriptRef.current = '';
    speechRecognitionRef.current = null;
    setIsVoiceListening(false);
  }, []);
  const mapVoiceInputError = useCallback((errorCode?: string) => {
    switch (String(errorCode || '').toLowerCase()) {
      case 'not-allowed':
      case 'service-not-allowed':
        return 'Microphone access was blocked. Allow mic permission and try again.';
      case 'audio-capture':
        return 'No microphone was found or it is unavailable.';
      case 'network':
        return 'Voice recognition failed because the network is unavailable.';
      case 'no-speech':
        return 'No speech was detected. Try speaking again.';
      case 'aborted':
        return null;
      default:
        return 'Voice input could not be started.';
    }
  }, []);
  const startVoiceInput = useCallback(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setVoiceInputError('Voice input is not supported in this browser.');
      return;
    }

    setVoiceInputError(null);
    speechBasePromptRef.current = prompt.trim();
    speechFinalTranscriptRef.current = '';
    speechInterimTranscriptRef.current = '';

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsVoiceListening(true);
    };

    recognition.onresult = (event: any) => {
      let nextFinalChunk = '';
      let nextInterimChunk = '';

      for (
        let index = event.resultIndex;
        index < event.results.length;
        index += 1
      ) {
        const transcript = String(
          event.results[index][0]?.transcript || ''
        ).trim();
        if (!transcript) continue;
        if (event.results[index].isFinal) {
          nextFinalChunk += `${transcript} `;
        } else {
          nextInterimChunk += `${transcript} `;
        }
      }

      if (nextFinalChunk) {
        speechFinalTranscriptRef.current = [
          speechFinalTranscriptRef.current,
          nextFinalChunk.trim(),
        ]
          .filter(Boolean)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
      }

      speechInterimTranscriptRef.current = nextInterimChunk.trim();

      const nextValue = [
        speechBasePromptRef.current,
        speechFinalTranscriptRef.current,
        speechInterimTranscriptRef.current,
      ]
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      setPrompt(nextValue);
    };

    recognition.onerror = (event: any) => {
      const nextError = mapVoiceInputError(event?.error);
      if (nextError) {
        setVoiceInputError(nextError);
      }
      setIsVoiceListening(false);
      speechRecognitionRef.current = null;
    };

    recognition.onend = () => {
      const finalPrompt = [
        speechBasePromptRef.current,
        speechFinalTranscriptRef.current,
      ]
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (finalPrompt) {
        setPrompt(finalPrompt);
      }
      speechInterimTranscriptRef.current = '';
      setIsVoiceListening(false);
      speechRecognitionRef.current = null;
      setTimeout(() => composerInputRef.current?.focus(), 0);
    };

    speechRecognitionRef.current = recognition;
    recognition.start();
  }, [mapVoiceInputError, prompt]);
  useEffect(() => {
    return () => {
      const recognition = speechRecognitionRef.current;
      if (recognition) {
        try {
          recognition.stop();
        } catch {}
      }
    };
  }, []);
  useEffect(() => {
    const textarea = composerInputRef.current;
    if (!textarea) return;

    if (
      isRootAuthenticatedChatUi &&
      useCompactRootComposer &&
      !hasPromptValue
    ) {
      textarea.style.height = '';
      textarea.style.overflowY = 'hidden';
      setIsComposerMultiline(false);
      return;
    }

    const maxHeight = isRootAuthenticatedChatUi ? 188 : 220;
    const minHeight = isRootAuthenticatedChatUi
      ? useCompactRootComposer
        ? 28
        : 42
      : 32;

    textarea.style.height = 'auto';
    const nextHeight = Math.max(
      minHeight,
      Math.min(textarea.scrollHeight, maxHeight)
    );
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
    const isMulti = nextHeight > 36;
    setIsComposerMultiline((prev) => (prev !== isMulti ? isMulti : prev));
  }, [
    hasPromptValue,
    isRootAuthenticatedChatUi,
    prompt,
    useCompactRootComposer,
  ]);
  useEffect(() => {
    if (isComposerFocusedRef.current && composerInputRef.current) {
      composerInputRef.current.focus();
      if (composerSelectionRef.current) {
        try {
          composerInputRef.current.setSelectionRange(
            composerSelectionRef.current.start,
            composerSelectionRef.current.end
          );
        } catch {}
      }
    }
  }, [useCompactRootComposer]);
  const composeActionItems = useMemo<ComposeAction[]>(() => {
    if (dashboardNavLocked) {
      return [
        {
          label: 'CSV Upload',
          icon: <Paperclip className="h-4 w-4" />,
          href: '__onboarding_csv_upload__',
          requiresAuth: true,
        },
      ];
    }
    return composeActions;
  }, [dashboardNavLocked]);
  const contextualQuickPrompts = useMemo<QuickPrompt[]>(() => {
    if (isHelpMode) return helpQuickPrompts;
    if (!activeToolCommand) return [];
    const prompts = toolQuickPrompts[activeToolCommand] || [];
    if (
      activeToolCommand === '/module' &&
      moduleLifecycleStage === 'published'
    ) {
      return prompts.filter((item) => item.id !== 'module-submit');
    }
    return prompts;
  }, [isHelpMode, activeToolCommand, moduleLifecycleStage]);

  const filteredSidebarHistory = useMemo(() => {
    if (dashboardNavLocked) {
      if (!onboardingThreadId) return [];
      return userSidebarHistory.filter(
        (entry) => entry.id === onboardingThreadId
      );
    }
    const query = historySearch.trim().toLowerCase();
    const baseHistory =
      historyView === 'archived'
        ? userSidebarHistory.filter((entry) => entry.archived)
        : userSidebarHistory.filter((entry) => !entry.archived);
    if (!query) return baseHistory;
    return baseHistory.filter(
      (entry) =>
        entry.title.toLowerCase().includes(query) ||
        entry.preview.toLowerCase().includes(query)
    );
  }, [
    dashboardNavLocked,
    historySearch,
    historyView,
    onboardingThreadId,
    userSidebarHistory,
  ]);

  useEffect(() => {
    if (
      !isAuthenticated ||
      activeToolCommand !== '/module' ||
      !isModuleWorkspaceOpen ||
      !moduleDraft
    ) {
      return;
    }
    const signature = JSON.stringify(moduleDraft);
    if (!signature || signature === moduleLastAutosaveSignatureRef.current) {
      return;
    }
    const timer = setTimeout(async () => {
      if (moduleAutosaveInFlightRef.current) return;
      moduleAutosaveInFlightRef.current = true;
      try {
        await saveModuleDraftRecord({ silent: true });
        moduleLastAutosaveSignatureRef.current = signature;
      } catch {
        // keep silent; manual save is still available
      } finally {
        moduleAutosaveInFlightRef.current = false;
      }
    }, 30000);
    return () => clearTimeout(timer);
  }, [isAuthenticated, activeToolCommand, isModuleWorkspaceOpen, moduleDraft]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        composerMenuRef.current &&
        !composerMenuRef.current.contains(target)
      ) {
        setIsQuickActionOpen(false);
        setIsToolsMenuOpen(false);
        setIsModuleLibraryMenuOpen(false);
      }
      if (
        moduleLibraryMenuRef.current &&
        !moduleLibraryMenuRef.current.contains(target)
      ) {
        setIsModuleLibraryMenuOpen(false);
      }
      if (historyMenuRef.current && !historyMenuRef.current.contains(target)) {
        setOpenHistoryMenuId(null);
      }
      if (helpMenuRef.current && !helpMenuRef.current.contains(target)) {
        setIsHelpMenuOpen(false);
      }
      if (
        solutionsMenuRef.current &&
        !solutionsMenuRef.current.contains(target)
      ) {
        setIsSolutionsMenuOpen(false);
      }
      if (
        resourcesMenuRef.current &&
        !resourcesMenuRef.current.contains(target)
      ) {
        setIsResourcesMenuOpen(false);
      }
      if (mobileNavRef.current && !mobileNavRef.current.contains(target)) {
        setIsMobileNavOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!moduleDraft?.id) return;
    if (moduleDraft.status === 'published') {
      setModuleLifecycleStage('published');
    } else if (moduleDraft.status === 'ready') {
      setModuleLifecycleStage('approved');
    } else {
      setModuleLifecycleStage('draft');
    }
  }, [moduleDraft?.id]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPublicAuthModalOpen(false);
        setAuthModalMode('closed');
        setIsSettingsModalOpen(false);
        setIsQuickActionOpen(false);
        setIsHelpMenuOpen(false);
        setIsSolutionsMenuOpen(false);
        setIsResourcesMenuOpen(false);
        setIsMobileNavOpen(false);
        setIsProfileMenuOpen(false);
        setIsModuleLibraryMenuOpen(false);
        setOpenHistoryMenuId(null);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  useEffect(() => {
    setIsMobileNavOpen(false);
    setIsSolutionsMenuOpen(false);
    setIsResourcesMenuOpen(false);
    setIsProfileMenuOpen(false);
    setIsToolsMenuOpen(false);
    setIsModuleLibraryMenuOpen(false);
    setIsSettingsModalOpen(false);
  }, [isAuthenticated, pathname]);

  useEffect(() => {
    if (!isAuthenticated || !isModuleLibraryMenuOpen) return;
    if (moduleLibraryItems.length === 0) {
      void fetchModuleLibrary();
    }
    if (moduleTemplateCatalog.length === 0) {
      void fetchModuleTemplateCatalog(undefined, { suppressErrorThrow: true });
    }
  }, [
    isAuthenticated,
    isModuleLibraryMenuOpen,
    moduleLibraryItems.length,
    moduleTemplateCatalog.length,
  ]);

  useEffect(() => {
    if (!isAuthenticated || !isModuleWorkspaceOpen) return;
    if (moduleNodeLevels.length > 0) return;
    void fetchModuleNodesCatalog();
  }, [isAuthenticated, isModuleWorkspaceOpen]);

  useEffect(() => {
    if (!isAuthenticated || !isModuleWorkspaceOpen) return;
    if (moduleRoleList.length > 0) return;
    void fetchModuleRolesCatalog();
  }, [isAuthenticated, isModuleWorkspaceOpen]);

  useEffect(() => {
    const rotation = window.setInterval(() => {
      setActiveIssueIndex(
        (previous) => (previous + 1) % (liveTaskItems.length || 1)
      );
    }, 3000);

    return () => window.clearInterval(rotation);
  }, [liveTaskItems.length]);

  useEffect(() => {
    if (isAuthenticated) {
      setTypedHeroPrompt('');
      setIsHeroPromptDeleting(false);
      return;
    }

    const currentPrompt = heroComposerPrompts[activeHeroPromptIndex];

    if (!isHeroPromptDeleting && typedHeroPrompt === currentPrompt) {
      const holdTimer = window.setTimeout(
        () => setIsHeroPromptDeleting(true),
        1400
      );
      return () => window.clearTimeout(holdTimer);
    }

    if (isHeroPromptDeleting && typedHeroPrompt.length === 0) {
      setIsHeroPromptDeleting(false);
      setActiveHeroPromptIndex((currentIndex) => {
        if (heroComposerPrompts.length <= 1) return currentIndex;
        let nextIndex = currentIndex;
        while (nextIndex === currentIndex) {
          nextIndex = Math.floor(Math.random() * heroComposerPrompts.length);
        }
        return nextIndex;
      });
      return;
    }

    const typingTimer = window.setTimeout(
      () => {
        if (isHeroPromptDeleting) {
          setTypedHeroPrompt((value) => value.slice(0, -1));
          return;
        }
        setTypedHeroPrompt(currentPrompt.slice(0, typedHeroPrompt.length + 1));
      },
      isHeroPromptDeleting ? 26 : 46
    );

    return () => window.clearTimeout(typingTimer);
  }, [
    activeHeroPromptIndex,
    isAuthenticated,
    isHeroPromptDeleting,
    typedHeroPrompt,
  ]);

  useEffect(() => {
    if (isAuthenticated) {
      setIsPublicAuthModalOpen(false);
    }
    if (isAuthenticated && authModalMode !== 'closed') {
      setAuthModalMode('closed');
      setAuthError(null);
      setAuthInfo(null);
      setAuthFieldErrors({});
    }
  }, [authModalMode, isAuthenticated]);

  useEffect(() => {
    if (
      !isClientReady ||
      isSessionLoading ||
      !isAuthenticated ||
      ownerOnboardingLoading
    ) {
      return;
    }
  }, [
    isAuthenticated,
    isClientReady,
    isLandingEntryRoute,
    ownerOnboardingLoading,
    ownerOnboardingRequired,
    pathname,
    router,
    isSessionLoading,
  ]);

  const currentTenantId = session?.user?.tenantId || null;
  const prevTenantIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !currentTenantId) return;
    if (prevTenantIdRef.current && prevTenantIdRef.current !== currentTenantId) {
      // Switched tenant! Reset in-memory turns and transient session storage
      setChatTurns([]);
      setActiveHistoryId(null);
      draftThreadIdRef.current = null;
      setUserSidebarHistory([]);
      try {
        window.sessionStorage?.clear();
      } catch (_) {}
    }
    prevTenantIdRef.current = currentTenantId;
    try {
      document.cookie = `saby_tenant_session=${currentTenantId}; path=/; SameSite=Lax;`;
    } catch (_) {}
  }, [currentTenantId, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined') return;
    const tenantId = session?.user?.tenantId || 'default';
    const userKey = session?.user?.email || session?.user?.id;
    if (!userKey) return;
    const storageKey = `saby:module-draft-v2:${tenantId}:${userKey}`;
    const stored = window.sessionStorage?.getItem(storageKey);
    if (!stored) return;
    try {
      const parsed: any = JSON.parse(stored);
      if (parsed && parsed.version === 2) {
        dispatchModuleDraft({ type: 'initialize', draft: parsed });
        setModuleWizardSavedStates({});
      }
    } catch {
      // ignore corrupted draft storage
    }
  }, [isAuthenticated, session?.user?.email, session?.user?.id, session?.user?.tenantId]);

  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined') return;
    const tenantId = session?.user?.tenantId || 'default';
    const userKey = session?.user?.email || session?.user?.id;
    if (!userKey || !moduleDraft) return;
    const storageKey = `saby:module-draft-v2:${tenantId}:${userKey}`;
    window.sessionStorage?.setItem(storageKey, JSON.stringify(moduleDraft));
  }, [isAuthenticated, moduleDraft, session?.user?.email, session?.user?.id, session?.user?.tenantId]);

  useEffect(() => {
    // Any draft mutation invalidates previous submit dry-run/result.
    setModuleSubmitDryRun(null);
    setModuleSubmitResult(null);
  }, [moduleDraft?.updatedAt]);

  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined') {
      draftThreadIdRef.current = null;
      setUserSidebarHistory([]);
      setActiveHistoryId(null);
      setChatTurns([]);
      setActionTurnMeta({});
      setAssistantPromptChips({});
      setExpandedActionDetails({});
      setFeedbackByTurnId({});
      setTurnIntentByTurnId({});
      return;
    }

    const tenantId = session?.user?.tenantId || 'default';
    const userKey = session?.user?.email || session?.user?.id;
    if (!userKey) return;

    // Purge legacy unpartitioned storage to prevent cross-tenant leaks from older versions
    try {
      window.localStorage?.removeItem(`saby:chat-history:${userKey}`);
      window.localStorage?.removeItem(`saby:module-draft-v2:${userKey}`);
      window.localStorage?.removeItem(`saby:feedback:${userKey}`);
      window.localStorage?.removeItem(`saby:owner-onboarding:${userKey}`);
      window.localStorage?.removeItem(`saby:history-search:${userKey}`);
    } catch (_) {}

    const storageKey = `saby:chat-history:${tenantId}:${userKey}`;
    const feedbackStorageKey = `saby:feedback:${tenantId}:${userKey}`;
    const profileStorageKey = `saby:profile:${tenantId}:${userKey}`;
    const settingsStorageKey = `saby:settings:${tenantId}:${userKey}`;
    const storedProfile = window.sessionStorage?.getItem(profileStorageKey);
    const storedSettings = window.sessionStorage?.getItem(settingsStorageKey);

    // Restore persisted feedback votes from sessionStorage
    try {
      const storedFeedback = window.sessionStorage?.getItem(feedbackStorageKey);
      if (storedFeedback) {
        const parsed = JSON.parse(storedFeedback) as Record<
          string,
          'helpful' | 'not_helpful'
        >;
        if (parsed && typeof parsed === 'object') {
          setFeedbackByTurnId(parsed);
        }
      }
    } catch {
      /* non-fatal */
    }
    const hydrate = async () => {
      draftThreadIdRef.current = null;
      setActiveHistoryId(null);
      setChatTurns([]);
      setActionTurnMeta({});
      setAssistantPromptChips({});
      setExpandedActionDetails({});
      let fromServer: SidebarHistory[] = [];
      try {
        const res = await fetch('/api/saby/history/threads?limit=80');
        const data: any = await res.json().catch(() => ({ ok: false }));
        if (res.ok && data?.ok && Array.isArray(data?.data?.items)) {
          fromServer = data.data.items.map((item: any) => ({
            id: String(item.id),
            title: String(item.title || 'Untitled chat'),
            preview: String(item.preview || ''),
            updatedAt: String(item.updatedAt || new Date().toISOString()),
            turns: Array.isArray(item.turns) ? (item.turns as ChatTurn[]) : [],
            pinned: Boolean(item.pinned),
            archived: Boolean(item.archived),
          }));
        }
      } catch {
        fromServer = [];
      }

      if (fromServer.length > 0) {
        const normalized = normalizeHistoryEntries(fromServer);
        setUserSidebarHistory(normalized);
        window.sessionStorage?.setItem(storageKey, JSON.stringify(normalized));
        return;
      }

      const stored = window.sessionStorage?.getItem(storageKey);
      if (!stored) {
        window.sessionStorage?.setItem(storageKey, JSON.stringify([]));
        setUserSidebarHistory([]);
        setActiveHistoryId(null);
        setChatTurns([]);
        return;
      }

      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const migrated: SidebarHistory[] = parsed
            .map((entry: any) => {
              if (entry?.id && Array.isArray(entry?.turns)) {
                return {
                  id: String(entry.id),
                  title: String(entry.title || 'Untitled chat'),
                  preview: String(entry.preview || ''),
                  updatedAt: String(
                    entry.updatedAt || new Date().toISOString()
                  ),
                  turns: entry.turns as ChatTurn[],
                  pinned: Boolean(entry.pinned),
                  archived: Boolean(entry.archived),
                };
              }
              if (entry?.label) {
                return {
                  id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                  title: String(entry.label),
                  preview: '',
                  updatedAt: new Date().toISOString(),
                  turns: [],
                  pinned: false,
                  archived: false,
                };
              }
              return null;
            })
            .filter(Boolean) as SidebarHistory[];
          const normalized = normalizeHistoryEntries(migrated);
          setUserSidebarHistory(normalized);
          setActiveHistoryId(null);
          setChatTurns([]);
        } else {
          setUserSidebarHistory([]);
          setActiveHistoryId(null);
          setActionTurnMeta({});
          setAssistantPromptChips({});
          setExpandedActionDetails({});
        }
      } catch {
        setUserSidebarHistory([]);
        setActiveHistoryId(null);
        setActionTurnMeta({});
        setAssistantPromptChips({});
        setExpandedActionDetails({});
      }
    };
    void hydrate();

    if (!storedProfile) {
      const defaultProfile = {
        id: session?.user?.id || userKey,
        name: displayName,
        email: session?.user?.email || '',
        avatar: session?.user?.image || '/avatar-1.png',
        createdAt: new Date().toISOString(),
      };
      window.sessionStorage?.setItem(
        profileStorageKey,
        JSON.stringify(defaultProfile)
      );
    }

    if (!storedSettings) {
      const defaultSettings: SabyUserSettings = {
        onboardingComplete: true,
      };
      window.sessionStorage?.setItem(
        settingsStorageKey,
        JSON.stringify(defaultSettings)
      );
    } else {
      try {
        const parsedSettings = JSON.parse(storedSettings) as SabyUserSettings;
        const normalizedSettings: SabyUserSettings = {
          onboardingComplete: parsedSettings?.onboardingComplete !== false,
        };
        window.sessionStorage?.setItem(
          settingsStorageKey,
          JSON.stringify(normalizedSettings)
        );
      } catch {
        const fallbackSettings: SabyUserSettings = {
          onboardingComplete: true,
        };
        window.sessionStorage?.setItem(
          settingsStorageKey,
          JSON.stringify(fallbackSettings)
        );
      }
    }
  }, [
    displayName,
    isAuthenticated,
    session?.user?.email,
    session?.user?.id,
    session?.user?.image,
    session?.user?.tenantId,
  ]);

  // Fetch real pending tasks / approvals for the task bar when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLiveTaskItems(rollingIssues);
      return;
    }
    const fetchTasks = async () => {
      try {
        const [tasksRes, approvalsRes] = await Promise.all([
          fetch('/api/saby/agent/tasks?limit=10'),
          fetch('/api/saby/approvals?limit=10'),
        ]);
        const tasksData = tasksRes.ok
          ? await tasksRes.json().catch(() => null)
          : null;
        const approvalsData = approvalsRes.ok
          ? await approvalsRes.json().catch(() => null)
          : null;

        const items: RollingIssue[] = [];

        const pendingApprovals: any[] = Array.isArray(approvalsData?.results)
          ? approvalsData.results
          : Array.isArray(approvalsData)
            ? approvalsData
            : [];
        for (const a of pendingApprovals.slice(0, 3)) {
          const label = a?.reason || a?.action_type || 'Pending approval';
          items.push({
            label: `Approval needed: ${label}`,
            href: '/apis/approvals',
            requiresAuth: true,
          });
        }

        const tasks: any[] = Array.isArray(tasksData?.results)
          ? tasksData.results
          : [];
        for (const t of tasks.slice(0, 5)) {
          if (t.status === 'waiting_approval') {
            items.push({
              label: `Waiting approval: ${t.intent || t.goal_text || 'task'}`,
              href: '/apis/approvals',
              requiresAuth: true,
            });
          } else if (t.status === 'failed') {
            items.push({
              label: `Failed action: ${t.intent || t.goal_text || 'task'}`,
              href: '/studio',
              requiresAuth: true,
            });
          }
        }

        setLiveTaskItems(items.length > 0 ? items : rollingIssues);
        setActiveIssueIndex(0);
      } catch {
        setLiveTaskItems(rollingIssues);
      }
    };
    void fetchTasks();
  }, [isAuthenticated]);

  // Persist feedback votes to sessionStorage whenever they change
  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined') return;
    const tenantId = session?.user?.tenantId || 'default';
    const userKey = session?.user?.email || session?.user?.id;
    if (!userKey) return;
    const nonNullFeedback = Object.fromEntries(
      Object.entries(feedbackByTurnId).filter(([, v]) => v !== null)
    );
    try {
      window.sessionStorage?.setItem(
        `saby:feedback:${tenantId}:${userKey}`,
        JSON.stringify(nonNullFeedback)
      );
    } catch {
      /* non-fatal */
    }
  }, [
    feedbackByTurnId,
    isAuthenticated,
    session?.user?.email,
    session?.user?.id,
    session?.user?.tenantId,
  ]);

  useEffect(() => {
    if (
      !dashboardNavLocked ||
      !onboardingThreadId ||
      typeof window === 'undefined'
    ) {
      return;
    }
    const tenantId = session?.user?.tenantId || 'default';
    const userKey = session?.user?.email || session?.user?.id;
    if (!userKey) return;
    const storageKey = `saby:chat-history:${tenantId}:${userKey}`;
    const existingOnboarding = userSidebarHistory.find(
      (entry) => entry.id === onboardingThreadId
    );
    draftThreadIdRef.current = onboardingThreadId;
    setHistoryView('active');
    if (historySearch) setHistorySearch('');
    if (activeHistoryId !== onboardingThreadId) {
      const hasPersistedOnboardingTurns =
        Array.isArray(existingOnboarding?.turns) &&
        existingOnboarding.turns.length > 0;
      setChatTurns((current) => {
        if (hasPersistedOnboardingTurns) return existingOnboarding!.turns;
        // Do not wipe newly queued onboarding prompts during thread lock handoff.
        return current.length > 0 ? current : [];
      });
      setActionTurnMeta({});
      setAssistantPromptChips({});
      setExpandedActionDetails({});
    }
    setActiveHistoryId(onboardingThreadId);
    setUserSidebarHistory((prev) => {
      const existingIndex = prev.findIndex(
        (entry) => entry.id === onboardingThreadId
      );
      const existing = existingIndex >= 0 ? prev[existingIndex] : null;
      const needsCreate = existingIndex < 0;
      const needsNormalize =
        !needsCreate &&
        (existing?.title !== 'Onboarding' ||
          Boolean(existing?.archived) ||
          Boolean(existing?.pinned));
      if (!needsCreate && !needsNormalize) {
        return prev;
      }
      const nextEntry: SidebarHistory = {
        id: onboardingThreadId,
        title: 'Onboarding',
        preview: existing?.preview || '',
        updatedAt: existing?.updatedAt || new Date().toISOString(),
        turns: Array.isArray(existing?.turns) ? existing!.turns : [],
        pinned: false,
        archived: false,
      };

      let next = [...prev];
      if (existingIndex >= 0) {
        next[existingIndex] = { ...existing, ...nextEntry };
      } else {
        next = [nextEntry, ...next];
      }
      next = normalizeHistoryEntries(next);
      window.sessionStorage?.setItem(storageKey, JSON.stringify(next));

      void fetch('/api/saby/history/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: nextEntry.id,
          title: nextEntry.title,
          preview: nextEntry.preview,
          turns: nextEntry.turns,
          archived: false,
          pinned: false,
        }),
      }).catch(() => null);
      return next;
    });
  }, [
    dashboardNavLocked,
    activeHistoryId,
    historySearch,
    onboardingThreadId,
    session?.user?.email,
    session?.user?.id,
    session?.user?.tenantId,
  ]);

  useEffect(() => {
    if (!dashboardNavLocked || !ownerOnboardingSession) return;
    if (ownerOnboardingSession.phase === 'completed') return;
    const activeTurnId = ownerOnboardingActiveTurnRef.current;
    const hasVisibleActiveTurn = Boolean(
      activeTurnId && chatTurns.some((turn) => turn.id === activeTurnId)
    );
    if (hasVisibleActiveTurn) return;

    ownerOnboardingPromptRef.current = null;
    const timer = window.setTimeout(() => {
      askOwnerOnboardingQuestion(ownerOnboardingSession);
    }, 40);
    return () => window.clearTimeout(timer);
  }, [chatTurns, dashboardNavLocked, ownerOnboardingSession]);

  useEffect(() => {
    if (!dashboardNavLocked || !onboardingThreadId) return;
    const entry = userSidebarHistory.find(
      (item) => item.id === onboardingThreadId
    );
    if (!entry) return;
    if (activeHistoryId !== onboardingThreadId) {
      setChatTurns(Array.isArray(entry.turns) ? entry.turns : []);
      setActionTurnMeta({});
      setAssistantPromptChips({});
      setExpandedActionDetails({});
    }
  }, [
    activeHistoryId,
    dashboardNavLocked,
    onboardingThreadId,
    userSidebarHistory,
  ]);

  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined') return;
    const tenantId = session?.user?.tenantId || 'default';
    const userKey = session?.user?.email || session?.user?.id;
    if (!userKey) return;
    const searchStorageKey = `saby:history-search:${tenantId}:${userKey}`;
    const saved = window.sessionStorage?.getItem(searchStorageKey);
    if (saved !== null) {
      setHistorySearch(saved);
    }
  }, [isAuthenticated, session?.user?.email, session?.user?.id, session?.user?.tenantId]);

  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined') return;
    const tenantId = session?.user?.tenantId || 'default';
    const userKey = session?.user?.email || session?.user?.id;
    if (!userKey) return;
    const searchStorageKey = `saby:history-search:${tenantId}:${userKey}`;
    window.sessionStorage?.setItem(searchStorageKey, historySearch);
  }, [historySearch, isAuthenticated, session?.user?.email, session?.user?.id, session?.user?.tenantId]);

  useEffect(() => {
    if (!chatScrollRef.current) return;
    chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [chatTurns, chatError, isChatSending]);

  useEffect(() => {
    typingAssistantTurnRef.current = typingAssistantTurnId;
    if (!typingAssistantTurnId) {
      flushAssistantTurnQueue();
    }
  }, [typingAssistantTurnId]);

  useEffect(
    () => () => {
      if (
        typeof window !== 'undefined' &&
        ownerOnboardingDraftSaveTimerRef.current != null
      ) {
        window.clearTimeout(ownerOnboardingDraftSaveTimerRef.current);
      }
      ownerOnboardingDraftSaveTimerRef.current = null;
    },
    []
  );

  useEffect(() => {
    if (!isAuthenticated || !isOnboardingRoute) return;
    if (!activeHistoryId) return;
    stopOnboardingPolling();
    setOnboardingUi(null);
    void hydrateLatestOnboardingForThread(activeHistoryId);
  }, [activeHistoryId, isAuthenticated, isOnboardingRoute]);

  useEffect(() => {
    if (!isAuthenticated) {
      setOwnerOnboardingRequired(false);
      setOwnerOnboardingLoading(false);
      setOwnerOnboardingProfile(null);
      setOwnerOnboardingSession(null);
      setOwnerOnboardingReviewByTurnId({});
      setOwnerPhoneVerification(null);
      ownerOnboardingDraftSignatureRef.current = '';
      ownerOnboardingPromptRef.current = null;
      ownerOnboardingActiveTurnRef.current = null;
      ownerOnboardingIntroShownRef.current = false;
      setOwnerOnboardingTurnState({});
      return;
    }

    if (!isOnboardingRoute) {
      setOwnerOnboardingRequired(false);
      setOwnerOnboardingLoading(false);
      setOwnerOnboardingProfile(null);
      setOwnerOnboardingSession(null);
      setOwnerOnboardingReviewByTurnId({});
      setOwnerPhoneVerification(null);
      ownerOnboardingDraftSignatureRef.current = '';
      ownerOnboardingPromptRef.current = null;
      ownerOnboardingActiveTurnRef.current = null;
      ownerOnboardingIntroShownRef.current = false;
      setOwnerOnboardingTurnState({});
      return;
    }

    const canConfigureTenant = Boolean(
      session?.user?.isOwner || session?.user?.isSuper || session?.user?.isSaby
    );
    if (!canConfigureTenant) {
      setOwnerOnboardingRequired(false);
      setOwnerOnboardingLoading(false);
      setOwnerOnboardingProfile(null);
      setOwnerOnboardingSession(null);
      setOwnerOnboardingReviewByTurnId({});
      setOwnerPhoneVerification(null);
      ownerOnboardingDraftSignatureRef.current = '';
      ownerOnboardingPromptRef.current = null;
      ownerOnboardingActiveTurnRef.current = null;
      ownerOnboardingIntroShownRef.current = false;
      setOwnerOnboardingTurnState({});
      return;
    }

    let cancelled = false;
    const run = async () => {
      setOwnerOnboardingLoading(true);
      try {
        const res = await fetch('/api/saby/onboarding/profile', {
          method: 'GET',
          cache: 'no-store',
        });
        const payload: any = await res.json().catch(() => ({
          ok: false,
          error: 'Could not load onboarding profile',
        }));
        if (!res.ok || !payload?.ok) {
          throw new Error(
            payload?.error || 'Could not load onboarding profile'
          );
        }
        if (cancelled) return;
        const data = payload?.data || {};
        const required = Boolean(data?.requiresOnboarding);
        const completed = Boolean(data?.completed);
        const profile = (data?.profile as OwnerOnboardingProfile) || null;
        setOwnerOnboardingProfile(profile);

        if (required && !completed) {
          setOwnerOnboardingRequired(true);
          setActiveToolCommand('/onboarding');
          const initialForm = buildOwnerOnboardingInitialForm(profile);
          let initialState: OwnerOnboardingSessionState = {
            form: initialForm,
            currentIndex: 0,
            phase: 'question',
            skipped: {},
          };
          const serverDraft = profile?.draftProgress;
          if (serverDraft && typeof serverDraft === 'object') {
            initialState = {
              ...initialState,
              currentIndex: Math.max(0, Number(serverDraft.currentIndex || 0)),
              phase: serverDraft.phase === 'review' ? 'review' : 'question',
              skipped:
                serverDraft.skipped && typeof serverDraft.skipped === 'object'
                  ? serverDraft.skipped
                  : {},
            };
          }
          if (typeof window !== 'undefined') {
            const storageKey = getOwnerOnboardingStorageKey();
            if (storageKey) {
              const saved = window.sessionStorage?.getItem(storageKey);
              if (saved) {
                try {
                  const parsed = JSON.parse(saved);
                  if (parsed?.form && typeof parsed.form === 'object') {
                    initialState = {
                      form: {
                        owner: {
                          ...initialForm.owner,
                          ...(parsed.form.owner || {}),
                        },
                        company: {
                          ...initialForm.company,
                          ...(parsed.form.company || {}),
                        },
                        node: {
                          ...initialForm.node,
                          ...(parsed.form.node || {}),
                        },
                      },
                      currentIndex: Math.max(
                        0,
                        Math.min(
                          OWNER_ONBOARDING_QUESTIONS.length - 1,
                          Number(parsed?.currentIndex || 0)
                        )
                      ),
                      phase: parsed?.phase === 'review' ? 'review' : 'question',
                      skipped:
                        parsed?.skipped && typeof parsed.skipped === 'object'
                          ? parsed.skipped
                          : {},
                    };
                  }
                } catch {
                  // ignore corrupted onboarding draft
                }
              }
            }
          }
          initialState = normalizeOwnerOnboardingSession(initialState);
          setOwnerOnboardingSession(initialState);
          scheduleOwnerOnboardingDraftSave(initialState);
          ownerOnboardingPromptRef.current = null;
          if (!ownerOnboardingIntroShownRef.current) {
            ownerOnboardingIntroShownRef.current = true;
            pushAssistantTurn(
              'Welcome. I will guide you through a short onboarding setup, then take you straight to CSV onboarding.'
            );
          }
          window.setTimeout(() => {
            if (!cancelled) askOwnerOnboardingQuestion(initialState);
          }, 10);
        } else {
          setOwnerOnboardingRequired(false);
          setOwnerOnboardingSession(null);
          setOwnerOnboardingReviewByTurnId({});
          setOwnerPhoneVerification(null);
          setOnboardingUi(null);
          stopOnboardingPolling();
          setActiveToolCommand((current) =>
            current === '/onboarding' ? null : current
          );
          ownerOnboardingDraftSignatureRef.current = '';
          ownerOnboardingPromptRef.current = null;
          ownerOnboardingActiveTurnRef.current = null;
          ownerOnboardingIntroShownRef.current = false;
          setOwnerOnboardingTurnState({});
        }
      } catch {
        if (cancelled) return;
        setOwnerOnboardingRequired(false);
        setOwnerOnboardingSession(null);
        setOwnerOnboardingReviewByTurnId({});
        setOwnerPhoneVerification(null);
        ownerOnboardingDraftSignatureRef.current = '';
        ownerOnboardingPromptRef.current = null;
        ownerOnboardingActiveTurnRef.current = null;
        ownerOnboardingIntroShownRef.current = false;
        setOwnerOnboardingTurnState({});
      } finally {
        if (!cancelled) setOwnerOnboardingLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [
    isAuthenticated,
    isOnboardingRoute,
    displayName,
    session?.user?.id,
    session?.user?.isOwner,
    session?.user?.isSaby,
    session?.user?.isSuper,
  ]);

  const clearAuthValidation = () => {
    setAuthError(null);
    setAuthInfo(null);
    setAuthFieldErrors({});
  };

  const historyTimeLabel = (iso: string) => {
    const t = new Date(iso).getTime();
    if (!Number.isFinite(t)) return 'now';
    const diffMin = Math.floor((Date.now() - t) / 60000);
    if (diffMin < 1) return 'now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(iso).toLocaleDateString();
  };

  const updateActiveHistory = (
    nextTurns: ChatTurn[],
    explicitThreadId?: string
  ) => {
    if (typeof window === 'undefined' || !isAuthenticated) return;
    const tenantId = session?.user?.tenantId || 'default';
    const userKey = session?.user?.email || session?.user?.id;
    if (!userKey) return;
    const isOwnerOnboardingThread =
      dashboardNavLocked && Boolean(onboardingThreadId);

    const storageKey = `saby:chat-history:${tenantId}:${userKey}`;
    setUserSidebarHistory((prev) => {
      const nowIso = new Date().toISOString();
      const firstUserText =
        nextTurns.find((t) => t.role === 'user')?.text || 'New chat';
      const title = isOwnerOnboardingThread
        ? 'Onboarding'
        : firstUserText.length > 48
          ? `${firstUserText.slice(0, 45)}...`
          : firstUserText;
      const preview = nextTurns[nextTurns.length - 1]?.text || '';
      const trimmedPreview =
        preview.length > 88 ? `${preview.slice(0, 85)}...` : preview;

      let next = [...prev];
      const id = isOwnerOnboardingThread
        ? (onboardingThreadId as string)
        : explicitThreadId ||
          activeHistoryId ||
          draftThreadIdRef.current ||
          `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      if (!activeHistoryId && !draftThreadIdRef.current) {
        draftThreadIdRef.current = id;
      }
      const index = next.findIndex((entry) => entry.id === id);
      const previousEntry = index >= 0 ? next[index] : null;
      const record: SidebarHistory = {
        id,
        title,
        preview: trimmedPreview,
        updatedAt: nowIso,
        turns: nextTurns,
        pinned: Boolean(previousEntry?.pinned),
        archived: Boolean(previousEntry?.archived),
      };

      if (index >= 0) {
        next[index] = record;
      } else {
        next = [record, ...next];
      }

      next = normalizeHistoryEntries(next);
      window.sessionStorage?.setItem(storageKey, JSON.stringify(next));
      if (!activeHistoryId || isOwnerOnboardingThread) setActiveHistoryId(id);
      const active = next.find((entry) => entry.id === id) || record;
      void fetch('/api/saby/history/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: active.id,
          title: active.title,
          preview: active.preview,
          turns: active.turns,
        }),
      }).catch(() => null);
      return next;
    });
  };

  const copyTurnText = useCallback(async (turnId: string, text: string) => {
    if (typeof window === 'undefined' || !navigator?.clipboard) {
      setSidebarNotice('Copy is not available in this browser.');
      if (typeof window !== 'undefined') {
        window.setTimeout(() => setSidebarNotice(null), 2200);
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(String(text || ''));
      setCopiedTurnId(turnId);
      window.setTimeout(() => {
        setCopiedTurnId((current) => (current === turnId ? null : current));
      }, 1800);
    } catch {
      setSidebarNotice('Could not copy message.');
      window.setTimeout(() => setSidebarNotice(null), 2200);
    }
  }, []);

  const startEditingUserTurn = useCallback((turnId: string, text: string) => {
    setEditingUserTurnId(turnId);
    setEditingUserTurnText(text);
  }, []);

  const cancelEditingUserTurn = useCallback(() => {
    setEditingUserTurnId(null);
    setEditingUserTurnText('');
  }, []);

  const saveEditedUserTurn = useCallback(() => {
    const nextText = editingUserTurnText.trim();
    if (!editingUserTurnId || !nextText) return;
    setChatTurns((current) => {
      const next = current.map((turn) =>
        turn.id === editingUserTurnId ? { ...turn, text: nextText } : turn
      );
      updateActiveHistory(next);
      return next;
    });
    setEditingUserTurnId(null);
    setEditingUserTurnText('');
  }, [editingUserTurnId, editingUserTurnText]);

  const updateTurnText = (turnId: string, text: string) => {
    setChatTurns((current) => {
      const next = current.map((turn) =>
        turn.id === turnId ? { ...turn, text } : turn
      );
      updateActiveHistory(next);
      return next;
    });
  };

  const stopOnboardingPolling = () => {
    if (onboardingPollingRef.current != null && typeof window !== 'undefined') {
      window.clearInterval(onboardingPollingRef.current);
    }
    onboardingPollingRef.current = null;
  };

  const commitAssistantTurn = (
    assistantTurn: ChatTurn,
    chips?: AssistantPromptChip[]
  ) => {
    typingAssistantTurnRef.current = assistantTurn.id;
    setTypingAssistantTurnId(assistantTurn.id);
    setChatTurns((current) => {
      const next = [...current, assistantTurn];
      updateActiveHistory(next);
      return next;
    });
    if (chips && chips.length > 0) {
      setAssistantPromptChips((current) => ({
        ...current,
        [assistantTurn.id]: chips,
      }));
    }
  };

  const flushAssistantTurnQueue = () => {
    if (typingAssistantTurnRef.current) return;
    const queued = assistantTurnQueueRef.current.shift();
    if (!queued) return;
    commitAssistantTurn(queued.turn, queued.chips);
  };

  const pushAssistantTurn = (
    text: string,
    chips?: AssistantPromptChip[]
  ): string => {
    const assistantTurn: ChatTurn = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      text,
    };
    if (typingAssistantTurnRef.current) {
      assistantTurnQueueRef.current.push({ turn: assistantTurn, chips });
    } else {
      commitAssistantTurn(assistantTurn, chips);
    }
    return assistantTurn.id;
  };

  const handleAssistantTypingDone = (turnId: string) => {
    setTypingAssistantTurnId((current) =>
      current === turnId ? null : current
    );
    if (typingAssistantTurnRef.current === turnId) {
      typingAssistantTurnRef.current = null;
      if (typeof window !== 'undefined') {
        window.setTimeout(() => {
          flushAssistantTurnQueue();
        }, 30);
      } else {
        flushAssistantTurnQueue();
      }
    }
  };

  function getOwnerOnboardingStorageKey() {
    const tenantId = session?.user?.tenantId || 'default';
    const identity = session?.user?.id || session?.user?.email;
    if (!identity) return null;
    return `saby:owner-onboarding:${tenantId}:${identity}`;
  }

  function buildOwnerOnboardingReviewCard(
    form: OwnerOnboardingForm
  ): OwnerOnboardingReviewCard {
    const branchMode =
      String(form.node.nodeStructures || '').toLowerCase() === 'true' ||
      String(form.node.nodeStructures || '').toLowerCase() === 'yes'
        ? 'Multi-branch'
        : 'Single branch';
    return {
      ownerTitle: form.owner.roleTitle || 'Owner',
      ownerPhone: form.owner.phoneNumber || '—',
      companyName: form.company.name || '—',
      companyEmail: form.company.email || '—',
      companyPhone: form.company.phone || '—',
      industry: form.company.industry || '—',
      teamSize: form.company.size || '—',
      location: form.company.country || '—',
      timezone: form.company.timezone || 'Africa/Lagos',
      branchMode,
      rootNodeName: form.node.rootNodeName || '—',
    };
  }

  const handleOwnerOnboardingReviewAction = (action: 'proceed' | 'cancel') => {
    if (action === 'proceed') {
      void sendPromptToSaby('proceed');
      return;
    }
    void sendPromptToSaby('cancel');
  };

  const moveOwnerOnboardingToQuestion = (index: number) => {
    if (!ownerOnboardingSession) return;
    const safeIndex = Math.max(
      0,
      Math.min(OWNER_ONBOARDING_QUESTIONS.length - 1, Number(index || 0))
    );
    const nextState: OwnerOnboardingSessionState = {
      ...ownerOnboardingSession,
      phase: 'question',
      currentIndex: safeIndex,
    };
    setOwnerOnboardingSession(nextState);
    if (OWNER_ONBOARDING_QUESTIONS[safeIndex]?.id !== 'owner.phoneNumber') {
      setOwnerPhoneVerification(null);
    }
    persistOwnerOnboardingState(nextState);
    scheduleOwnerOnboardingDraftSave(nextState);
    ownerOnboardingPromptRef.current = null;
    askOwnerOnboardingQuestion(nextState);
  };

  const handleOwnerOnboardingReviewEdit = (target: string) => {
    const keyword = String(target || '').toLowerCase();
    const directIndex = OWNER_ONBOARDING_QUESTIONS.findIndex(
      (q) => q.id === keyword
    );
    if (directIndex >= 0) {
      moveOwnerOnboardingToQuestion(directIndex);
      return;
    }
    const index = OWNER_ONBOARDING_QUESTIONS.findIndex(
      (question) =>
        question.id.toLowerCase().includes(keyword) ||
        question.prompt.toLowerCase().includes(keyword) ||
        question.field.toLowerCase().includes(keyword)
    );
    if (index >= 0) {
      moveOwnerOnboardingToQuestion(index);
      return;
    }
    pushAssistantTurn(
      'I could not map that field. Try editing role title, phone, organization name, timezone, branch mode, or root node name.'
    );
  };

  function askOwnerOnboardingQuestion(state: OwnerOnboardingSessionState) {
    if (state.phase === 'review') {
      const marker = 'review';
      if (ownerOnboardingPromptRef.current === marker) return;
      ownerOnboardingPromptRef.current = marker;
      const promptText = 'Please review your setup before saving.';
      const lastTurn = chatTurns[chatTurns.length - 1];
      const turnId =
        lastTurn?.role === 'assistant' && lastTurn?.text === promptText
          ? lastTurn.id
          : pushAssistantTurn(promptText);
      setOwnerOnboardingReviewByTurnId((current) => ({
        ...current,
        [turnId]: buildOwnerOnboardingReviewCard(state.form),
      }));
      ownerOnboardingActiveTurnRef.current = turnId;
      setOwnerOnboardingTurnState((current) => ({
        ...current,
        [turnId]: 'active',
      }));
      return;
    }
    if (state.phase !== 'question') return;
    const question = OWNER_ONBOARDING_QUESTIONS[state.currentIndex];
    if (!question) return;
    const marker = `${question.id}:${state.currentIndex}`;
    if (ownerOnboardingPromptRef.current === marker) return;
    ownerOnboardingPromptRef.current = marker;
    const chips: AssistantPromptChip[] = [];
    if (Array.isArray(question.options) && question.options.length > 0) {
      question.options.forEach((option, index) => {
        chips.push({
          id: `owner-onboarding-option-${question.id}-${index}`,
          text: option,
          prompt: option,
          autoSend: true,
        });
      });
    }
    if (!question.required) {
      chips.push({
        id: `owner-onboarding-skip-${question.id}`,
        text: 'Skip',
        prompt: 'skip',
        autoSend: true,
      });
    }
    chips.push({
      id: `owner-onboarding-back-${question.id}`,
      text: 'Back',
      prompt: 'back',
      autoSend: true,
    });
    const promptText = `${question.prompt}${question.required ? ' *' : ''}${
      question.helper ? `\n${question.helper}` : ''
    }${question.id === 'company.country' ? '' : '\nType your answer and I will continue guiding you.'}`;
    const lastTurn = chatTurns[chatTurns.length - 1];
    const turnId =
      lastTurn?.role === 'assistant' && lastTurn?.text === promptText
        ? lastTurn.id
        : pushAssistantTurn(promptText, chips);
    ownerOnboardingActiveTurnRef.current = turnId;
    setOwnerOnboardingTurnState((current) => ({
      ...current,
      [turnId]: 'active',
    }));
  }

  function persistOwnerOnboardingState(
    state: OwnerOnboardingSessionState | null
  ) {
    if (typeof window === 'undefined') return;
    const storageKey = getOwnerOnboardingStorageKey();
    if (!storageKey) return;
    if (!state || state.phase === 'completed') {
      window.sessionStorage?.removeItem(storageKey);
      return;
    }
    window.sessionStorage?.setItem(storageKey, JSON.stringify(state));
  }

  async function saveOwnerOnboardingDraft(
    state: OwnerOnboardingSessionState | null
  ) {
    if (!state || state.phase === 'completed') return;
    try {
      await fetch('/api/saby/onboarding/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form: state.form,
          currentIndex: state.currentIndex,
          phase: state.phase,
          skipped: state.skipped || {},
        }),
      });
    } catch {
      // Best effort draft persistence; local storage fallback remains active.
    }
  }

  function scheduleOwnerOnboardingDraftSave(
    state: OwnerOnboardingSessionState | null
  ) {
    if (typeof window === 'undefined' || !state || state.phase === 'completed')
      return;
    const signature = JSON.stringify({
      form: state.form,
      currentIndex: state.currentIndex,
      phase: state.phase,
      skipped: state.skipped || {},
    });
    if (signature === ownerOnboardingDraftSignatureRef.current) return;
    ownerOnboardingDraftSignatureRef.current = signature;
    if (ownerOnboardingDraftSaveTimerRef.current != null) {
      window.clearTimeout(ownerOnboardingDraftSaveTimerRef.current);
    }
    ownerOnboardingDraftSaveTimerRef.current = window.setTimeout(() => {
      void saveOwnerOnboardingDraft(state);
      ownerOnboardingDraftSaveTimerRef.current = null;
    }, 350);
  }

  const requestOwnerPhoneVerificationOtp = async (phoneNumber: string) => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 20000);
    let response: Response;
    try {
      response = await fetch('/api/saby/onboarding/phone-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          action: 'send',
          phoneNumber,
        }),
      });
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw new Error('OTP request timed out. Please retry.');
      }
      throw error;
    } finally {
      window.clearTimeout(timer);
    }

    const payload = await response
      .json()
      .catch(() => ({ ok: false, error: 'Invalid OTP response' }));

    if (!response.ok || !payload?.ok) {
      throw new Error(payload?.error || 'Failed to send OTP code');
    }

    return payload?.data || {};
  };

  const verifyOwnerPhoneVerificationOtp = async (
    phoneNumber: string,
    otp: string
  ) => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 20000);
    let response: Response;
    try {
      response = await fetch('/api/saby/onboarding/phone-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          action: 'verify',
          phoneNumber,
          otp,
        }),
      });
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw new Error('OTP verification timed out. Please retry.');
      }
      throw error;
    } finally {
      window.clearTimeout(timer);
    }

    const payload = await response
      .json()
      .catch(() => ({ ok: false, error: 'Invalid OTP verification response' }));

    if (!response.ok || !payload?.ok) {
      throw new Error(payload?.error || 'OTP verification failed');
    }

    return payload?.data?.data || {};
  };

  const sendOwnerPhoneVerificationOtp = async (
    phoneNumber: string,
    options: { resetDigits?: boolean } = {}
  ) => {
    setOwnerPhoneVerification((current) =>
      current
        ? {
            ...current,
            sending: true,
            error: null,
            info: 'Sending OTP...',
            digits: options.resetDigits
              ? new Array(6).fill('')
              : current.digits,
          }
        : current
    );

    try {
      const result = await requestOwnerPhoneVerificationOtp(phoneNumber);
      const destination = String(result?.data?.destination || phoneNumber);
      const fallbackEmail = String(result?.data?.email || '').trim();
      const message = String(result?.message || 'OTP sent.');
      setOwnerPhoneVerification((current) =>
        current
          ? {
              ...current,
              sending: false,
              error: null,
              info: fallbackEmail
                ? `${message} (${destination}, ${fallbackEmail})`
                : `${message} (${destination})`,
            }
          : current
      );
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to send OTP code.';
      setOwnerPhoneVerification((current) =>
        current
          ? {
              ...current,
              sending: false,
              error: errorMessage,
              info: null,
            }
          : current
      );
      pushAssistantTurn(`Phone verification could not start: ${errorMessage}`);
    }
  };

  const applyOwnerPhoneVerificationCode = async (rawCode: string) => {
    const currentVerification = ownerPhoneVerification;
    const activeOnboarding = ownerOnboardingSession;
    if (!currentVerification || currentVerification.verified) return;
    if (!activeOnboarding) return;

    const question = OWNER_ONBOARDING_QUESTIONS[activeOnboarding.currentIndex];
    if (!question || question.id !== 'owner.phoneNumber') return;

    const normalizedCode = String(rawCode || '')
      .replace(/\D/g, '')
      .slice(0, 6);
    if (normalizedCode.length !== 6) {
      setOwnerPhoneVerification((current) =>
        current
          ? {
              ...current,
              error: 'Enter a valid 6-digit code.',
            }
          : current
      );
      return;
    }

    setOwnerPhoneVerification((current) =>
      current
        ? {
            ...current,
            verifying: true,
            error: null,
          }
        : current
    );

    try {
      await verifyOwnerPhoneVerificationOtp(
        currentVerification.phoneNumber,
        normalizedCode
      );
    } catch (error: any) {
      setOwnerPhoneVerification((current) =>
        current
          ? {
              ...current,
              verifying: false,
              error: error?.message || 'Invalid OTP code.',
            }
          : current
      );
      return;
    }

    const nextIndex = activeOnboarding.currentIndex + 1;
    const nextState = normalizeOwnerOnboardingSession({
      ...activeOnboarding,
      skipped: {
        ...(activeOnboarding.skipped || {}),
        [OWNER_PHONE_VERIFIED_KEY]: true,
        [question.id]: false,
      },
      currentIndex: Math.min(nextIndex, OWNER_ONBOARDING_QUESTIONS.length - 1),
      phase:
        nextIndex >= OWNER_ONBOARDING_QUESTIONS.length ? 'review' : 'question',
    });
    setOwnerOnboardingSession(nextState);
    persistOwnerOnboardingState(nextState);
    scheduleOwnerOnboardingDraftSave(nextState);
    setOwnerPhoneVerification((current) =>
      current
        ? {
            ...current,
            verifying: false,
            verified: true,
            error: null,
            info: 'Phone number verified.',
          }
        : current
    );
    ownerOnboardingPromptRef.current = null;
    pushAssistantTurn('Phone verification successful. Continuing onboarding.');
    askOwnerOnboardingQuestion(nextState);
  };

  const handleOwnerPhoneOtpChange = (index: number, value: string) => {
    const digit = String(value || '')
      .replace(/\D/g, '')
      .slice(-1);
    setOwnerPhoneVerification((current) => {
      if (!current) return current;
      const nextDigits = [...current.digits];
      nextDigits[index] = digit;
      return {
        ...current,
        digits: nextDigits,
        error: null,
      };
    });
    if (digit && index < 5) {
      ownerPhoneOtpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOwnerPhoneOtpKeyDown = (
    index: number,
    event: ReactKeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void applyOwnerPhoneVerificationCode(
        (ownerPhoneVerification?.digits || []).join('')
      );
      return;
    }
    if (event.key !== 'Backspace') return;
    const value = ownerPhoneVerification?.digits?.[index] || '';
    if (value) return;
    if (index > 0) {
      ownerPhoneOtpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOwnerPhoneOtpPaste = (
    event: ReactClipboardEvent<HTMLInputElement>
  ) => {
    const pasted = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);
    if (!pasted) return;
    event.preventDefault();
    setOwnerPhoneVerification((current) => {
      if (!current) return current;
      const nextDigits = new Array(6).fill('');
      pasted.split('').forEach((digit, idx) => {
        nextDigits[idx] = digit;
      });
      return {
        ...current,
        digits: nextDigits,
        error: null,
      };
    });
    const targetIndex = Math.min(5, pasted.length);
    ownerPhoneOtpInputRefs.current[targetIndex]?.focus();
  };

  async function saveOwnerOnboardingProfile(payload: OwnerOnboardingForm) {
    const res = await fetch('/api/saby/onboarding/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const response: any = await res
      .json()
      .catch(() => ({ ok: false, error: 'Failed to save onboarding profile' }));
    if (!res.ok || !response?.ok) {
      throw new Error(response?.error || 'Failed to save onboarding profile');
    }
    return {
      companyName: String(payload.company.name || ''),
      rootNodeName: String(payload.node.rootNodeName || ''),
      rootNodeId: String(response?.data?.rootNode?.id || ''),
    };
  }

  function handleOwnerOnboardingCompleted(
    payload: {
      owner: { phoneNumber: string; roleTitle: string };
      company: {
        name: string;
        email: string;
        phone: string;
        industry: string;
        size: string;
        timezone: string;
        country: string;
        state: string;
        city: string;
        address: string;
      };
      node: {
        rootNodeName: string;
        rootLevelName: string;
        rootNodeAddress: string;
        nodeStructures: string | boolean;
      };
    },
    result?: { rootNodeId?: string }
  ) {
    setOwnerOnboardingRequired(false);
    setOwnerOnboardingSession(null);
    setOwnerOnboardingReviewByTurnId({});
    setOwnerPhoneVerification(null);
    ownerOnboardingDraftSignatureRef.current = '';
    ownerOnboardingPromptRef.current = null;
    ownerOnboardingActiveTurnRef.current = null;
    ownerOnboardingIntroShownRef.current = false;
    setOwnerOnboardingTurnState({});
    persistOwnerOnboardingState(null);
    setOwnerOnboardingProfile({
      owner: {
        phoneNumber: payload.owner.phoneNumber || '',
        roleTitle: payload.owner.roleTitle || '',
      },
      company: {
        name: payload.company.name || '',
        email: payload.company.email || '',
        phone: payload.company.phone || '',
        industry: payload.company.industry || '',
        size: payload.company.size || '',
        timezone: payload.company.timezone || '',
        country: payload.company.country || '',
        state: payload.company.state || '',
        city: payload.company.city || '',
        address: payload.company.address || '',
      },
      node: {
        rootNodeId: String(result?.rootNodeId || ''),
        rootNodeName: payload.node.rootNodeName || '',
        rootLevelName: payload.node.rootLevelName || '',
        rootNodeAddress: payload.node.rootNodeAddress || '',
        nodeStructures:
          String(payload.node.nodeStructures || '').toLowerCase() === 'true' ||
          String(payload.node.nodeStructures || '').toLowerCase() === 'yes',
      },
    });
    setOnboardingUi(null);
    stopOnboardingPolling();
    setActiveToolCommand((current) =>
      current === '/onboarding' ? null : current
    );

    pushAssistantTurn(
      `Setup complete! ${payload.company.name} is now configured. CSV upload is optional. You can continue to workspace now, or download the template (${ONBOARDING_MASTER_TEMPLATE_URL}) and upload later via + > CSV Upload.`,
      [
        {
          id: 'owner-onboarding-download-template',
          text: 'Download Template',
          prompt: '__download_onboarding_template__',
        },
        {
          id: 'owner-onboarding-open-upload',
          text: 'CSV Upload (+)',
          prompt: '__onboarding_csv_upload__',
        },
      ]
    );
  }

  const summarizeOnboardingJob = (job: OnboardingJobSnapshot) => {
    const summary = job?.summary || {};
    const created = Number(summary?.created || 0);
    const updated = Number(summary?.updated || 0);
    const assigned = Number(summary?.assigned || 0);
    const failed = Number(summary?.failed || 0);
    const total = Number(job?.totalRows || 0);
    const prefix =
      job.mode === 'dry_run'
        ? 'Onboarding dry-run'
        : summary?.rolledBack
          ? 'Onboarding import rolled back'
          : 'Onboarding import';
    const attemptedCreated = Number(summary?.attemptedCreated || created);
    const attemptedUpdated = Number(summary?.attemptedUpdated || updated);
    const attemptedAssigned = Number(summary?.attemptedAssigned || assigned);
    const base = `${prefix} ${job.status}: ${total} rows, ${created} created, ${updated} updated, ${assigned} assigned, ${failed} failed.`;
    if (summary?.rolledBack) {
      return `${base} Rollback removed attempted changes (${attemptedCreated} created, ${attemptedUpdated} updated, ${attemptedAssigned} assigned).`;
    }
    return base;
  };

  const getActiveOnboardingOrgName = () =>
    String(
      ownerOnboardingSession?.form?.company?.name ||
        ownerOnboardingProfileState?.company?.name ||
        'Your organization'
    ).trim();

  const buildOnboardingSettingsCheckMessage = () =>
    `Setup complete! ${getActiveOnboardingOrgName()} is now configured. I'm checking your settings to confirm everything is okay.`;

  const getOnboardingPrimaryError = (job: OnboardingJobSnapshot) => {
    const explicitError = String((job?.errors as any)?.error || '').trim();
    if (explicitError) return explicitError;
    const failedRowError = Array.isArray((job?.errors as any)?.failedRows)
      ? (job?.errors as any)?.failedRows.find((entry: any) =>
          String(entry?.reason || entry?.message || '').trim()
        )
      : null;
    if (failedRowError?.reason || failedRowError?.message) {
      const detail = String(
        failedRowError.reason || failedRowError.message || ''
      ).trim();
      const line = Number(failedRowError.line || 0);
      return line > 0 ? `line ${line}: ${detail}` : detail;
    }
    const arrayError = Array.isArray((job?.errors as any)?.errors)
      ? (job?.errors as any).errors.find((entry: any) =>
          String(entry?.message || '').trim()
        )
      : null;
    if (arrayError?.message) return String(arrayError.message);
    const failedStage = Array.isArray((job?.errors as any)?.stageResults)
      ? (job?.errors as any).stageResults.find(
          (entry: any) =>
            String(entry?.status || '').toLowerCase() === 'failed' &&
            String(entry?.error || '').trim()
        )
      : null;
    if (failedStage?.error) return String(failedStage.error);
    return 'Onboarding processing failed.';
  };

  const collectOnboardingIssues = (
    job: OnboardingJobSnapshot
  ): OnboardingIssueEntry[] => {
    const validationIssues = Array.isArray(job?.errors?.errors)
      ? job.errors.errors
          .map((entry: any) => ({
            line: Number(entry?.line || 0),
            code: String(entry?.code || '').trim(),
            message: String(entry?.message || '').trim(),
          }))
          .filter((entry: any) => entry.message)
      : [];
    const stageIssues = Array.isArray(job?.errors?.stageResults)
      ? job.errors.stageResults
          .filter(
            (entry: any) =>
              String(entry?.status || '').toLowerCase() === 'failed'
          )
          .map((entry: any) => ({
            line: 0,
            code: String(entry?.stage || '').trim(),
            message: String(entry?.error || '').trim(),
          }))
          .filter((entry: any) => entry.message)
      : [];
    const failedRowIssues = Array.isArray((job?.errors as any)?.failedRows)
      ? (job?.errors as any).failedRows
          .map((entry: any) => ({
            line: Number(entry?.line || 0),
            code: String(
              entry?.recordType || entry?.action || 'import_failed'
            ).trim(),
            message: String(entry?.reason || entry?.message || '').trim(),
          }))
          .filter((entry: any) => entry.message)
      : [];
    const merged = [...validationIssues, ...stageIssues, ...failedRowIssues];
    const dedup = new Set<string>();
    return merged.filter((entry: any) => {
      const key = `${entry.line}::${entry.code}::${entry.message}`;
      if (dedup.has(key)) return false;
      dedup.add(key);
      return true;
    });
  };

  const buildOnboardingDryRunFailedMessage = (
    issues: OnboardingIssueEntry[]
  ) => {
    const crossTenantEmailConflicts = issues.filter(
      (issue) => issue.code === 'email_registered_in_other_tenant'
    ).length;
    if (crossTenantEmailConflicts > 0) {
      const countText =
        crossTenantEmailConflicts > 85
          ? 'more than 85'
          : String(crossTenantEmailConflicts);
      return `I'm sorry — I found issues. ${countText} user email(s) already exist in other tenant(s). Click View Issues to review and fix them, then re-upload.`;
    }
    return `I'm sorry — I found onboarding issues. Click View Issues to review and fix them, then re-upload.`;
  };

  const buildOnboardingSummaryChips = (job: OnboardingJobSnapshot) => {
    const hasFailures =
      Number(job?.summary?.failed || 0) > 0 ||
      (Array.isArray(job?.errors?.errors) && job.errors.errors.length > 0);
    const chips: AssistantPromptChip[] = [
      {
        id: `onboarding-view-summary-${job.id}`,
        text: 'View Summary',
        prompt: '/onboarding show status',
        autoSend: true,
      },
      {
        id: `onboarding-backup-${job.id}`,
        text: 'Create Backup',
        prompt: 'create backup of tenant data before next onboarding import',
      },
    ];
    if (hasFailures) {
      chips.unshift({
        id: `onboarding-retry-failed-${job.id}`,
        text: 'Retry Failed Rows',
        prompt: '__onboarding_retry__',
      });
    }
    return chips;
  };

  const buildOnboardingDryRunPassedChips = (job: OnboardingJobSnapshot) => [
    {
      id: `onboarding-start-import-${job.id}`,
      text: 'Start Import',
      prompt: '__onboarding_start_import__',
      autoSend: true,
    },
    {
      id: `onboarding-view-summary-${job.id}`,
      text: 'View Dry-Run Summary',
      prompt: '/onboarding show status',
      autoSend: true,
    },
    {
      id: `onboarding-reselect-file-${job.id}`,
      text: 'Select Another CSV',
      prompt: '__onboarding_retry__',
    },
  ];

  const buildOnboardingDryRunFailedChips = (
    jobId: string,
    turnId: string,
    expanded = false
  ) => [
    {
      id: `onboarding-view-issues-${jobId}`,
      text: expanded ? 'Hide Issues' : 'View Issues',
      prompt: `__onboarding_toggle_issues__:${jobId}:${turnId}:${expanded ? 'hide' : 'view'}`,
    },
    {
      id: `onboarding-reselect-file-${jobId}`,
      text: 'Upload Fixed CSV',
      prompt: '__onboarding_retry__',
    },
  ];

  const buildOnboardingImportFailedChips = (
    jobId: string,
    turnId: string,
    expanded = false
  ) => [
    {
      id: `onboarding-view-import-issues-${jobId}`,
      text: expanded ? 'Hide Issues' : 'View Issues',
      prompt: `__onboarding_toggle_issues__:${jobId}:${turnId}:${expanded ? 'hide' : 'view'}`,
    },
    {
      id: `onboarding-retry-import-${jobId}`,
      text: 'Upload Fixed CSV',
      prompt: '__onboarding_retry__',
    },
  ];

  const snapshotFromJobPayload = (job: any): OnboardingJobSnapshot => ({
    id: String(job.id),
    mode:
      String(job.mode || 'import').toLowerCase() === 'dry_run'
        ? 'dry_run'
        : 'import',
    status: String(job.status || 'queued'),
    stage: String(job.stage || 'queued'),
    progressPct: Number(job.progress_pct || 0),
    totalRows: Number(job.total_rows || 0),
    processedRows: Number(job.processed_rows || 0),
    summary: job.summary_json || {},
    errors: job.error_json || {},
    events: Array.isArray(job.events) ? job.events : [],
  });

  const pollOnboardingJob = (jobId: string) => {
    if (!jobId || typeof window === 'undefined') return;
    stopOnboardingPolling();

    const poll = async () => {
      try {
        const res = await fetch(
          `/api/saby/onboarding/jobs/${encodeURIComponent(jobId)}?includeEvents=true&eventLimit=10`
        );
        const data: any = await res.json().catch(() => null);
        if (!res.ok || !data?.ok || !data?.job) {
          throw new Error(data?.error || 'Could not fetch onboarding status');
        }

        const snapshot = snapshotFromJobPayload(data.job);

        const normalizedStatus = snapshot.status.toLowerCase();
        const completedWithErrors = Boolean(
          snapshot?.summary?.completedWithErrors
        );
        const finalPhase =
          normalizedStatus === 'completed' && !completedWithErrors
            ? 'completed'
            : normalizedStatus === 'completed' && completedWithErrors
              ? 'failed'
              : normalizedStatus === 'cancelled'
                ? 'cancelled'
                : normalizedStatus === 'failed'
                  ? 'failed'
                  : 'processing';

        setOnboardingUi((previous) => ({
          phase: finalPhase,
          fileName: previous?.fileName || 'onboarding.csv',
          uploadPct: 100,
          message:
            finalPhase === 'processing'
              ? `Processing: ${snapshot.stage}`
              : summarizeOnboardingJob(snapshot),
          job: snapshot,
        }));

        if (finalPhase !== 'processing') {
          stopOnboardingPolling();
          if (!onboardingAnnouncedJobsRef.current.has(snapshot.id)) {
            onboardingAnnouncedJobsRef.current.add(snapshot.id);
            if (snapshot.mode === 'dry_run') {
              if (finalPhase === 'completed') {
                pushAssistantTurn(
                  `Onboarding dry-run passed.\n${summarizeOnboardingJob(
                    snapshot
                  )}\nReview the summary and click "Start Import" when ready.`,
                  buildOnboardingDryRunPassedChips(snapshot)
                );
              } else if (finalPhase === 'cancelled') {
                pushAssistantTurn('Onboarding dry-run was cancelled.');
              } else {
                const issues = collectOnboardingIssues(snapshot);
                const turnId = pushAssistantTurn(
                  buildOnboardingDryRunFailedMessage(issues)
                );
                setOnboardingIssueDataByTurnId((current) => ({
                  ...current,
                  [turnId]: {
                    jobId: snapshot.id,
                    issues,
                    summary: snapshot.summary || {},
                  },
                }));
                setOnboardingIssueExpandedByTurnId((current) => ({
                  ...current,
                  [turnId]: false,
                }));
                setAssistantPromptChips((current) => ({
                  ...current,
                  [turnId]: buildOnboardingDryRunFailedChips(
                    snapshot.id,
                    turnId,
                    false
                  ),
                }));
              }
            } else if (finalPhase === 'completed') {
              pushAssistantTurn(
                `Onboarding import completed successfully.\n${summarizeOnboardingJob(snapshot)}`,
                buildOnboardingSummaryChips(snapshot)
              );
            } else if (
              normalizedStatus === 'completed' &&
              completedWithErrors
            ) {
              const issues = collectOnboardingIssues(snapshot);
              const turnId = pushAssistantTurn(
                `Onboarding import completed with errors.\n${summarizeOnboardingJob(snapshot)}`
              );
              setOnboardingIssueDataByTurnId((current) => ({
                ...current,
                [turnId]: {
                  jobId: snapshot.id,
                  issues,
                  summary: snapshot.summary || {},
                },
              }));
              setOnboardingIssueExpandedByTurnId((current) => ({
                ...current,
                [turnId]: false,
              }));
              setAssistantPromptChips((current) => ({
                ...current,
                [turnId]: buildOnboardingImportFailedChips(
                  snapshot.id,
                  turnId,
                  false
                ),
              }));
            } else if (finalPhase === 'cancelled') {
              pushAssistantTurn('Onboarding import was cancelled.');
            } else {
              const err = getOnboardingPrimaryError(snapshot);
              const issues = collectOnboardingIssues(snapshot);
              const turnId = pushAssistantTurn(
                `Onboarding import failed: ${err}\n${summarizeOnboardingJob(snapshot)}`
              );
              setOnboardingIssueDataByTurnId((current) => ({
                ...current,
                [turnId]: {
                  jobId: snapshot.id,
                  issues,
                  summary: snapshot.summary || {},
                },
              }));
              setOnboardingIssueExpandedByTurnId((current) => ({
                ...current,
                [turnId]: false,
              }));
              setAssistantPromptChips((current) => ({
                ...current,
                [turnId]: buildOnboardingImportFailedChips(
                  snapshot.id,
                  turnId,
                  false
                ),
              }));
            }
          }
        }
      } catch (error: any) {
        setOnboardingUi((previous) =>
          previous
            ? {
                ...previous,
                phase: 'failed',
                message: error?.message || 'Failed to poll onboarding status',
              }
            : previous
        );
        stopOnboardingPolling();
      }
    };

    void poll();
    onboardingPollingRef.current = window.setInterval(() => {
      void poll();
    }, 2000);
  };

  const uploadOnboardingCsv = (
    file: File,
    mode: 'dry_run' | 'import' = 'import'
  ) =>
    new Promise<any>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/saby/onboarding/jobs');
      xhr.responseType = 'json';

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        const pct = Math.min(
          100,
          Math.round((event.loaded / event.total) * 100)
        );
        setOnboardingUi((previous) => ({
          phase: 'uploading',
          fileName: file.name,
          uploadPct: pct,
          message: `Uploading ${pct}%`,
          job: previous?.job,
        }));
      };

      xhr.onload = () => {
        const data = xhr.response;
        if (xhr.status >= 200 && xhr.status < 300 && data?.ok) {
          resolve(data);
          return;
        }
        reject(
          new Error(
            data?.error || data?.message || `Upload failed (${xhr.status})`
          )
        );
      };

      xhr.onerror = () =>
        reject(new Error('Upload failed due to a network error'));

      const form = new FormData();
      form.append('file', file);
      form.append('mode', mode);
      const threadId = activeHistoryId || draftThreadIdRef.current;
      if (threadId) form.append('threadId', threadId);
      xhr.send(form);
    });

  const startOnboardingUpload = async (
    file: File,
    mode: 'dry_run' | 'import'
  ) => {
    const data = await uploadOnboardingCsv(file, mode);
    const job = data?.job;
    if (!job?.id) {
      throw new Error('Onboarding upload accepted but job id was missing');
    }

    const snapshot = snapshotFromJobPayload({
      ...job,
      mode,
      progress_pct: Number(job.progress_pct || 5),
    });

    setOnboardingUi({
      phase: 'processing',
      fileName: file.name,
      uploadPct: 100,
      message:
        mode === 'dry_run'
          ? 'Upload complete. Running settings checks...'
          : 'Upload complete. Processing import...',
      job: snapshot,
    });
    pushAssistantTurn(
      mode === 'dry_run'
        ? buildOnboardingSettingsCheckMessage()
        : `Onboarding CSV received: ${file.name}. Import started (job ${snapshot.id}).`
    );
    pollOnboardingJob(snapshot.id);
  };

  const handleOnboardingFileSelected = async (file: File | null) => {
    if (!file) return;
    if (!isAuthenticated) {
      openQuickAuthModal(pathname || '/');
      return;
    }

    stopOnboardingPolling();
    setOnboardingUi({
      phase: 'uploading',
      fileName: file.name,
      uploadPct: 0,
      message: 'Uploading 0%',
    });
    setIsToolsMenuOpen(false);
    setIsQuickActionOpen(false);

    try {
      onboardingPendingImportFileRef.current = file;
      await startOnboardingUpload(file, 'dry_run');
    } catch (error: any) {
      setOnboardingUi({
        phase: 'failed',
        fileName: file.name,
        uploadPct: 0,
        message: error?.message || 'Could not upload onboarding CSV',
      });
      pushAssistantTurn(
        `Onboarding upload failed for ${file.name}: ${
          error?.message || 'Unexpected error'
        }`
      );
    }
  };

  const handleStartOnboardingImport = async () => {
    const file = onboardingPendingImportFileRef.current;
    if (!file) {
      pushAssistantTurn(
        'No CSV file is staged for import. Select the CSV again to rerun dry-run and import.'
      );
      onboardingFileInputRef.current?.click();
      return;
    }
    stopOnboardingPolling();
    setOnboardingUi({
      phase: 'uploading',
      fileName: file.name,
      uploadPct: 0,
      message: 'Uploading 0%',
    });
    try {
      await startOnboardingUpload(file, 'import');
    } catch (error: any) {
      setOnboardingUi({
        phase: 'failed',
        fileName: file.name,
        uploadPct: 0,
        message: error?.message || 'Could not start onboarding import',
      });
      pushAssistantTurn(
        `Onboarding import could not start: ${error?.message || 'Unexpected error'}`
      );
    }
  };

  const handleCancelOnboardingJob = async () => {
    const jobId = onboardingUi?.job?.id;
    if (!jobId) return;
    try {
      const res = await fetch(
        `/api/saby/onboarding/jobs/${encodeURIComponent(jobId)}/cancel`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'Cancelled from chat composer' }),
        }
      );
      const data: any = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to cancel onboarding job');
      }
      stopOnboardingPolling();
      onboardingAnnouncedJobsRef.current.add(jobId);
      setOnboardingUi((previous) =>
        previous
          ? {
              ...previous,
              phase: 'cancelled',
              message: 'Onboarding import cancelled.',
              job: previous.job
                ? { ...previous.job, status: 'cancelled', stage: 'cancelled' }
                : previous.job,
            }
          : previous
      );
      pushAssistantTurn('Onboarding import was cancelled.');
    } catch (error: any) {
      setOnboardingUi((previous) =>
        previous
          ? {
              ...previous,
              message: error?.message || 'Failed to cancel onboarding job',
            }
          : previous
      );
    }
  };

  const hydrateLatestOnboardingForThread = useCallback(
    async (threadId: string | null) => {
      if (!threadId || !isAuthenticated) return;
      try {
        const res = await fetch(
          `/api/saby/onboarding/jobs?threadId=${encodeURIComponent(threadId)}&limit=1`
        );
        const data: any = await res.json().catch(() => null);
        if (!res.ok || !data?.ok) return;
        const latest = Array.isArray(data.results) ? data.results[0] : null;
        if (!latest?.id) return;
        const snapshot = snapshotFromJobPayload(latest);
        const status = String(snapshot.status || '').toLowerCase();
        const completedWithErrors = Boolean(
          snapshot?.summary?.completedWithErrors
        );
        const phase =
          status === 'completed' && !completedWithErrors
            ? 'completed'
            : status === 'completed' && completedWithErrors
              ? 'failed'
              : status === 'cancelled'
                ? 'cancelled'
                : status === 'failed'
                  ? 'failed'
                  : 'processing';
        setOnboardingUi({
          phase,
          fileName: String(latest.source_file_name || 'onboarding.csv'),
          uploadPct: 100,
          message:
            phase === 'processing'
              ? `Processing: ${snapshot.stage}`
              : summarizeOnboardingJob(snapshot),
          job: snapshot,
        });
        if (phase === 'processing') {
          pollOnboardingJob(snapshot.id);
        }
      } catch {
        // ignore hydration errors for chat continuity
      }
    },
    [isAuthenticated]
  );

  const pollActionFinalStatusForTurn = async (
    turnId: string,
    eventId: string,
    actionType: string | null,
    mode: 'foreground' | 'background' = 'foreground'
  ) => {
    if (!turnId || !eventId) return;
    if (actionPollingRef.current.has(turnId)) return;
    actionPollingRef.current.add(turnId);

    let attempts = 0;
    const intervalMs = mode === 'background' ? 10000 : 2000;
    const maxAttempts = mode === 'background' ? 360 : 10;

    while (actionPollingRef.current.has(turnId) && attempts < maxAttempts) {
      attempts += 1;
      try {
        const res = await fetch(
          `/api/saby/actions/${encodeURIComponent(eventId)}`,
          { method: 'GET' }
        );
        if (res.ok) {
          const event: any = await res.json().catch(() => null);
          const status = String(event?.status || '').toLowerCase();
          setActionTurnMeta((current) => ({
            ...current,
            [turnId]: {
              eventId,
              actionType,
              status:
                status === 'completed'
                  ? 'completed'
                  : ACTION_FINAL_STATES.has(status)
                    ? 'failed'
                    : current[turnId]?.status || 'processing',
              attempts,
              lastCheckedAt: new Date().toISOString(),
              finalEvent: ACTION_FINAL_STATES.has(status)
                ? event
                : current[turnId]?.finalEvent,
            },
          }));
          if (ACTION_FINAL_STATES.has(status)) {
            const finalText =
              status === 'completed'
                ? `Confirmed. ${summarizeFinalAction(actionType, event)}`
                : `Failed to execute ${
                    actionType || event?.action_type || 'action'
                  }: ${
                    event?.error_message ||
                    event?.result_json?.error ||
                    'Execution failed'
                  }.`;

            updateTurnText(turnId, finalText);
            actionPollingRef.current.delete(turnId);
            return;
          }
        }
      } catch {
        // Ignore transient polling errors and continue attempts.
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    actionPollingRef.current.delete(turnId);
    if (mode === 'foreground') {
      setActionTurnMeta((current) => ({
        ...current,
        [turnId]: {
          eventId,
          actionType,
          status: 'timeout',
          attempts,
          lastCheckedAt: new Date().toISOString(),
          finalEvent: current[turnId]?.finalEvent,
        },
      }));
      setChatTurns((current) => {
        const next = current.map((turn) => {
          if (turn.id !== turnId) return turn;
          if (/still processing/i.test(turn.text)) return turn;
          return {
            ...turn,
            text: `${turn.text} Still processing. I will keep checking in the background and update this message when done.`,
          };
        });
        updateActiveHistory(next);
        return next;
      });
      window.setTimeout(() => {
        void pollActionFinalStatusForTurn(
          turnId,
          eventId,
          actionType,
          'background'
        );
      }, 1500);
    }
  };

  useEffect(() => {
    return () => {
      actionPollingRef.current.clear();
      onboardingAnnouncedJobsRef.current.clear();
      stopOnboardingPolling();
    };
  }, []);

  const startNewChat = () => {
    if (dashboardNavLocked) {
      showOnboardingLockNotice('new chat');
      return;
    }
    if (chatAbortControllerRef.current) {
      chatAbortControllerRef.current.abort();
      chatAbortControllerRef.current = null;
    }
    actionPollingRef.current.clear();
    onboardingAnnouncedJobsRef.current.clear();
    stopOnboardingPolling();
    draftThreadIdRef.current = null;
    setActiveHistoryId(null);
    setHistoryView('active');
    setChatTurns([]);
    setActionTurnMeta({});
    setAssistantPromptChips({});
    setExpandedActionDetails({});
    setTypingAssistantTurnId(null);
    setIsChatSending(false);
    setChatError(null);
    setPrompt('');
    setOnboardingUi(null);
  };

  const persistHistoryEntries = (entries: SidebarHistory[]) => {
    if (typeof window === 'undefined' || !isAuthenticated) return;
    const tenantId = session?.user?.tenantId || 'default';
    const userKey = session?.user?.email || session?.user?.id;
    if (!userKey) return;
    const storageKey = `saby:chat-history:${tenantId}:${userKey}`;
    window.sessionStorage?.setItem(storageKey, JSON.stringify(entries));
  };

  const syncThread = (entry: SidebarHistory) => {
    void fetch('/api/saby/history/threads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        threadId: entry.id,
        title: entry.title,
        preview: entry.preview,
        turns: entry.turns,
      }),
    }).catch(() => null);
  };

  const selectHistoryThread = (entry: SidebarHistory) => {
    if (dashboardNavLocked && entry.id !== onboardingThreadId) {
      showOnboardingLockNotice('chat history');
      return;
    }
    if (chatAbortControllerRef.current) {
      chatAbortControllerRef.current.abort();
      chatAbortControllerRef.current = null;
    }
    setIsChatSending(false);
    setTypingAssistantTurnId(null);
    setChatError(null);
    draftThreadIdRef.current = null;
    setActiveHistoryId(entry.id);
    setOpenHistoryMenuId(null);
    setOnboardingUi(null);
    stopOnboardingPolling();
    void fetch(`/api/saby/history/threads/${encodeURIComponent(entry.id)}`)
      .then(async (res) => {
        const data: any = await res.json().catch(() => ({ ok: false }));
        if (res.ok && data?.ok && data?.data) {
          setChatTurns(
            Array.isArray(data.data.turns)
              ? (data.data.turns as ChatTurn[])
              : []
          );
          setActionTurnMeta({});
          setAssistantPromptChips({});
          setExpandedActionDetails({});
          return;
        }
        setChatTurns(Array.isArray(entry.turns) ? entry.turns : []);
        setActionTurnMeta({});
        setAssistantPromptChips({});
        setExpandedActionDetails({});
      })
      .catch(() => {
        setChatTurns(Array.isArray(entry.turns) ? entry.turns : []);
        setActionTurnMeta({});
        setAssistantPromptChips({});
        setExpandedActionDetails({});
      });
    void hydrateLatestOnboardingForThread(entry.id);
    setChatError(null);
  };

  const startInlineRenameThread = (threadId: string) => {
    if (dashboardNavLocked) {
      showOnboardingLockNotice('chat settings');
      return;
    }
    const current = userSidebarHistory.find((x) => x.id === threadId);
    if (!current) return;
    setEditingHistoryId(threadId);
    setEditingHistoryTitle(current.title || '');
    setOpenHistoryMenuId(null);
  };

  const submitInlineRenameThread = (threadId: string) => {
    if (dashboardNavLocked) {
      setEditingHistoryId(null);
      setEditingHistoryTitle('');
      showOnboardingLockNotice('chat settings');
      return;
    }
    const nextTitle = String(editingHistoryTitle || '').trim();
    const current = userSidebarHistory.find((x) => x.id === threadId);
    if (!current) {
      setEditingHistoryId(null);
      setEditingHistoryTitle('');
      return;
    }
    if (!nextTitle || nextTitle === current.title) {
      setEditingHistoryId(null);
      setEditingHistoryTitle('');
      return;
    }
    setUserSidebarHistory((prev) => {
      const next = normalizeHistoryEntries(
        prev.map((entry) =>
          entry.id === threadId
            ? {
                ...entry,
                title: nextTitle,
                updatedAt: new Date().toISOString(),
              }
            : entry
        )
      );
      persistHistoryEntries(next);
      const updated = next.find((x) => x.id === threadId);
      if (updated) syncThread(updated);
      return next;
    });
    setEditingHistoryId(null);
    setEditingHistoryTitle('');
  };

  const toggleThreadPin = (threadId: string) => {
    if (dashboardNavLocked) {
      showOnboardingLockNotice('chat settings');
      return;
    }
    setUserSidebarHistory((prev) => {
      const next = normalizeHistoryEntries(
        prev.map((entry) =>
          entry.id === threadId ? { ...entry, pinned: !entry.pinned } : entry
        )
      );
      persistHistoryEntries(next);
      const updated = next.find((x) => x.id === threadId);
      if (updated) syncThread(updated);
      return next;
    });
    setOpenHistoryMenuId(null);
  };

  const toggleThreadArchive = (threadId: string) => {
    if (dashboardNavLocked) {
      showOnboardingLockNotice('chat settings');
      return;
    }
    setUserSidebarHistory((prev) => {
      const next = normalizeHistoryEntries(
        prev.map((entry) =>
          entry.id === threadId
            ? { ...entry, archived: !entry.archived, pinned: false }
            : entry
        )
      );
      persistHistoryEntries(next);
      const updated = next.find((x) => x.id === threadId);
      if (updated) syncThread(updated);
      if (activeHistoryId === threadId) {
        startNewChat();
      }
      return next;
    });
    setOpenHistoryMenuId(null);
  };

  const restoreArchivedThread = (threadId: string) => {
    setHistoryView('active');
    toggleThreadArchive(threadId);
  };

  const shareThread = async (threadId: string) => {
    if (dashboardNavLocked) {
      showOnboardingLockNotice('chat sharing');
      return;
    }
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}${window.location.pathname}?thread=${encodeURIComponent(threadId)}`;
    try {
      await navigator.clipboard.writeText(url);
      setSidebarNotice('Thread link copied.');
      window.setTimeout(() => setSidebarNotice(null), 2200);
    } catch {
      setSidebarNotice('Could not copy thread link.');
      window.setTimeout(() => setSidebarNotice(null), 2200);
    }
    setOpenHistoryMenuId(null);
  };

  const deleteThread = (threadId: string) => {
    if (dashboardNavLocked) {
      showOnboardingLockNotice('chat deletion');
      return;
    }
    if (!threadId) return;
    setOpenHistoryMenuId(null);
    setUserSidebarHistory((prev) => {
      const next = prev.filter((entry) => entry.id !== threadId);
      persistHistoryEntries(next);
      return next;
    });
    if (activeHistoryId === threadId) {
      startNewChat();
    }
    setActionTurnMeta((current) => {
      const next = { ...current };
      const keys = Object.keys(next);
      for (const k of keys) delete next[k];
      return next;
    });
    setExpandedActionDetails((current) => {
      const next = { ...current };
      const keys = Object.keys(next);
      for (const k of keys) delete next[k];
      return next;
    });
    void fetch(`/api/saby/history/threads/${encodeURIComponent(threadId)}`, {
      method: 'DELETE',
    })
      .then(async (res) => {
        if (!res.ok) return;
        const syncRes = await fetch('/api/saby/history/threads?limit=80');
        const syncData: any = await syncRes.json().catch(() => ({ ok: false }));
        if (
          !syncRes.ok ||
          !syncData?.ok ||
          !Array.isArray(syncData?.data?.items)
        )
          return;

        const refreshed: SidebarHistory[] = normalizeHistoryEntries(
          syncData.data.items.map((item: any) => ({
            id: String(item.id),
            title: String(item.title || 'Untitled chat'),
            preview: String(item.preview || ''),
            updatedAt: String(item.updatedAt || new Date().toISOString()),
            turns: Array.isArray(item.turns) ? (item.turns as ChatTurn[]) : [],
            pinned: Boolean(item.pinned),
            archived: Boolean(item.archived),
          }))
        );
        setUserSidebarHistory(refreshed);
        if (activeHistoryId && activeHistoryId !== threadId) {
          const stillExists = refreshed.some((t) => t.id === activeHistoryId);
          if (!stillExists) {
            startNewChat();
          }
        }
      })
      .catch(() => null);
  };

  const openQuickAuthModal = (redirectPath?: string) => {
    setAuthView('login');
    setAuthRedirectPath(getSafeRedirectPath(redirectPath || pathname || '/'));
    setAuthModalInitialError(null);
    setIsPublicAuthModalOpen(true);
  };

  const openFullAuthModal = (view: AuthView, redirectPath?: string) => {
    setAuthView(view);
    setAuthRedirectPath(getSafeRedirectPath(redirectPath || pathname || '/'));
    setAuthModalInitialError(null);
    setIsPublicAuthModalOpen(true);
  };

  const getTargetPath = (href: string, requiresAuth?: boolean) => {
    if (requiresAuth && !isAuthenticated) return '#';
    return href;
  };

  const handleActionNavigation = (href: string, requiresAuth?: boolean) => {
    setIsQuickActionOpen(false);
    if (href === '__onboarding_csv_upload__') {
      setActiveToolCommand('/onboarding');
      setOnboardingUi(
        (previous) =>
          previous || {
            phase: 'idle',
            fileName: 'onboarding.csv',
            uploadPct: 0,
            message: 'Select your CSV file to start onboarding import.',
          }
      );
      onboardingFileInputRef.current?.click();
      return;
    }
    if (dashboardNavLocked) {
      showOnboardingLockNotice('workspace links');
      return;
    }
    if (requiresAuth && !isAuthenticated) {
      openQuickAuthModal(href);
      return;
    }
    router.push(href);
  };

  const openSettingsModal = (tab: ProfileSettingsTabId = 'general') => {
    if (dashboardNavLocked) {
      showOnboardingLockNotice('settings');
      return;
    }
    setSettingsModalInitialTab(tab);
    setIsHelpMenuOpen(false);
    setIsProfileMenuOpen(false);
    setIsSettingsModalOpen(true);
  };

  const handleLogout = async () => {
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage?.clear();
        document.cookie =
          'saby_tenant_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;';
        // Clean up any remaining transient saby:* items in localStorage
        try {
          const keysToRemove: string[] = [];
          for (let i = 0; i < window.localStorage.length; i++) {
            const k = window.localStorage.key(i);
            if (
              k &&
              (k.startsWith('saby:chat-history') ||
                k.startsWith('saby:module-draft') ||
                k.startsWith('saby:feedback') ||
                k.startsWith('saby:history-search') ||
                k.startsWith('saby:owner-onboarding') ||
                k.startsWith('saby:settings') ||
                k.startsWith('saby:profile'))
            ) {
              keysToRemove.push(k);
            }
          }
          keysToRemove.forEach((k) => window.localStorage.removeItem(k));
        } catch (_) {}
      }
    } catch (_) {}
    setChatTurns([]);
    setActiveHistoryId(null);
    draftThreadIdRef.current = null;
    setUserSidebarHistory([]);
    await signOut({ callbackUrl: '/' });
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

    let captchaToken: string | undefined;
    if (isCaptchaEnabled) {
      if (!isCaptchaReady) {
        setAuthError(
          'Security check is still loading. Please wait and try again.'
        );
        return;
      }

      try {
        const result = await executeCaptcha('saby_login');
        captchaToken = result.token;
      } catch {
        setAuthError('Unable to complete Google reCAPTCHA verification.');
        return;
      }
    }

    setAuthSubmitting(true);
    const response = await loginWithCredentials({
      email: loginForm.email,
      password: loginForm.password,
      redirectTo: getSafeRedirectPath(authRedirectPath),
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
      setAuthError(
        response.error || 'Unable to sign in with those credentials.'
      );
      return;
    }

    setAuthModalMode('closed');
  };

  const handleSignUpSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearAuthValidation();

    const parsed = signUpSchema.safeParse({
      ...signUpForm,
      isOwner: true,
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

    let captchaToken: string | undefined;
    if (isCaptchaEnabled) {
      if (!isCaptchaReady) {
        setAuthError(
          'Security check is still loading. Please wait and try again.'
        );
        return;
      }
      try {
        const result = await executeCaptcha('saby_signup');
        captchaToken = result.token;
      } catch {
        setAuthError('Unable to complete Google reCAPTCHA verification.');
        return;
      }
    }

    setAuthSubmitting(true);
    const response = await registerUser({
      firstname: signUpForm.firstname.trim(),
      lastname: signUpForm.lastname.trim(),
      email: signUpForm.email.trim(),
      password: signUpForm.password,
      isOwner: true,
      isAgreed: signUpForm.isAgreed,
      redirectTo: getSafeRedirectPath(authRedirectPath),
      captchaToken,
      suppressNavigation: true,
    });
    setAuthSubmitting(false);

    if (!response.success) {
      setAuthError(
        response.error || 'Unable to create your account right now.'
      );
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

    const email = forgotEmail.trim();
    if (!email) {
      setAuthError('Please enter your email address.');
      return;
    }

    setAuthSubmitting(true);
    const response = await requestForgotPassword(email);
    setAuthSubmitting(false);

    if (!response.success) {
      setAuthError(
        response.error || 'Unable to send reset instructions right now.'
      );
      return;
    }

    setAuthView('reset');
    setAuthInfo(
      'Reset instructions sent. Paste your reset token below to set a new password.'
    );
  };

  const handleResetPasswordSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    clearAuthValidation();

    const token = resetToken.trim();
    if (!token) {
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
    const response = await submitResetPassword(token, resetNewPassword);
    setAuthSubmitting(false);

    if (!response.success) {
      setAuthError(response.error || 'Unable to reset password right now.');
      return;
    }

    setAuthView('login');
    setAuthInfo(
      'Password updated successfully. Sign in with your new password.'
    );
    setLoginForm((previous) => ({
      ...previous,
      email: forgotEmail || previous.email,
      password: '',
    }));
    setResetToken('');
    setResetNewPassword('');
    setResetConfirmPassword('');
  };

  const handleOtpSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearAuthValidation();

    const otp = otpCode.trim();
    if (!otpEmail) {
      setAuthError('Missing OTP email context. Restart sign in.');
      return;
    }

    if (otp.length < 6) {
      setAuthError('Enter the full 6-digit OTP.');
      return;
    }

    setAuthSubmitting(true);
    const verifyResponse = await verifyOtpCode(otp, otpEmail);
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

    let captchaToken: string | undefined;
    if (isCaptchaEnabled) {
      if (!isCaptchaReady) {
        setAuthSubmitting(false);
        setAuthError(
          'Security check is still loading. Please wait and try again.'
        );
        return;
      }
      try {
        const result = await executeCaptcha('saby_login_after_otp');
        captchaToken = result.token;
      } catch {
        setAuthSubmitting(false);
        setAuthError('Unable to complete Google reCAPTCHA verification.');
        return;
      }
    }

    const loginResponse = await loginWithCredentials({
      email: pendingAuthCredentials.email,
      password: pendingAuthCredentials.password,
      redirectTo: getSafeRedirectPath(authRedirectPath),
      captchaToken,
      suppressNavigation: true,
    });
    setAuthSubmitting(false);

    if (!loginResponse.success) {
      setAuthError(
        loginResponse.error || 'OTP verified, but automatic sign-in failed.'
      );
      return;
    }

    setPendingAuthCredentials(null);
    setOtpCode('');
    setAuthModalMode('closed');
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

  const formatChatErrorMessage = (err: unknown): string => {
    if (!err) return 'An error occurred during agent processing';
    if (typeof err === 'string') return err;
    if (err instanceof Error) return err.message;
    if (typeof err === 'object') {
      const anyErr = err as Record<string, any>;
      if (typeof anyErr.data?.message === 'string' && anyErr.data.message) {
        return anyErr.data.message;
      }
      if (typeof anyErr.message === 'string' && anyErr.message) {
        return anyErr.message;
      }
      if (typeof anyErr.error === 'string' && anyErr.error) {
        return anyErr.error;
      }
      if (anyErr.name === 'ProviderAuthError') {
        const provider =
          anyErr.data?.providerID || anyErr.data?.provider || 'AI provider';
        return `AI provider authentication failed for ${provider}. Please verify API keys in Settings.`;
      }
      if (anyErr.name === 'ProviderModelNotFoundError') {
        const p = anyErr.data?.providerID || '';
        const m = anyErr.data?.modelID || '';
        return `Requested model not found (${p}${p && m ? '/' : ''}${m}).`;
      }
      if (anyErr.name) {
        const details =
          anyErr.data && Object.keys(anyErr.data).length > 0
            ? `: ${JSON.stringify(anyErr.data)}`
            : '';
        return `${anyErr.name}${details}`;
      }
      try {
        return JSON.stringify(err);
      } catch {
        return String(err);
      }
    }
    return String(err);
  };

  const sendPromptToSaby = async (nextPrompt?: string) => {
    const message = (nextPrompt ?? prompt).trim();
    if (!message || isChatSending) return;
    const isModuleMode = activeToolCommand === '/module';
    const messageWithoutModulePrefix = message
      .replace(/^\/module\s*/i, '')
      .trim();
    const agentMessage =
      activeToolCommand && !message.startsWith('/')
        ? `${activeToolCommand} ${message}`.trim()
        : message;
    if (!isAuthenticated) {
      openQuickAuthModal(pathname || '/');
      return;
    }

    setChatError(null);
    setIsChatSending(true);
    setPrompt('');
    setIsQuickActionOpen(false);
    setIsToolsMenuOpen(false);
    setIsModuleLibraryMenuOpen(false);

    // Synchronously assign threadId upfront to eliminate race conditions with the SSE stream
    const isOwnerOnboardingThread =
      dashboardNavLocked && Boolean(onboardingThreadId);
    const assignedThreadId = isOwnerOnboardingThread
      ? (onboardingThreadId as string)
      : activeHistoryId ||
        draftThreadIdRef.current ||
        `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    if (!activeHistoryId && !draftThreadIdRef.current) {
      draftThreadIdRef.current = assignedThreadId;
    }
    if (!activeHistoryId && !isOwnerOnboardingThread) {
      setActiveHistoryId(assignedThreadId);
    }

    const userTurn: ChatTurn = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: message,
    };
    setChatTurns((current) => {
      const next = [...current, userTurn];
      updateActiveHistory(next, assignedThreadId);
      return next;
    });

    const activeOwnerOnboarding = ownerOnboardingRequired
      ? ownerOnboardingSession
      : null;
    if (activeOwnerOnboarding && activeOwnerOnboarding.phase !== 'completed') {
      const normalized = message.trim();
      const normalizedLower = normalized.toLowerCase();
      const markActiveOnboardingTurnAnswered = () => {
        const activeTurnId = ownerOnboardingActiveTurnRef.current;
        if (!activeTurnId) return;
        setOwnerOnboardingTurnState((current) => ({
          ...current,
          [activeTurnId]: 'answered',
        }));
      };

      const moveBack = () => {
        markActiveOnboardingTurnAnswered();
        const previousIndex = Math.max(
          0,
          activeOwnerOnboarding.currentIndex - 1
        );
        const nextState: OwnerOnboardingSessionState = {
          ...activeOwnerOnboarding,
          currentIndex: previousIndex,
          phase: 'question',
        };
        setOwnerOnboardingSession(nextState);
        if (
          OWNER_ONBOARDING_QUESTIONS[previousIndex]?.id !== 'owner.phoneNumber'
        ) {
          setOwnerPhoneVerification(null);
        }
        persistOwnerOnboardingState(nextState);
        scheduleOwnerOnboardingDraftSave(nextState);
        ownerOnboardingPromptRef.current = null;
        askOwnerOnboardingQuestion(nextState);
      };

      if (normalizedLower === 'back') {
        moveBack();
        setIsChatSending(false);
        return;
      }

      if (activeOwnerOnboarding.phase === 'review') {
        if (/^(proceed|confirm|save)$/i.test(normalizedLower)) {
          markActiveOnboardingTurnAnswered();
          const savingState: OwnerOnboardingSessionState = {
            ...activeOwnerOnboarding,
            phase: 'submitting',
          };
          setOwnerOnboardingSession(savingState);
          persistOwnerOnboardingState(savingState);
          scheduleOwnerOnboardingDraftSave(savingState);
          pushAssistantTurn('Saving your onboarding setup...');
          try {
            const payload = buildOwnerOnboardingPayload(
              activeOwnerOnboarding.form
            );
            const result = await saveOwnerOnboardingProfile(payload);
            const completedState: OwnerOnboardingSessionState = {
              ...savingState,
              phase: 'completed',
              form: payload,
            };
            setOwnerOnboardingSession(completedState);
            persistOwnerOnboardingState(null);
            handleOwnerOnboardingCompleted(payload, {
              rootNodeId: result.rootNodeId,
            });
          } catch (error: any) {
            const retryState: OwnerOnboardingSessionState = {
              ...activeOwnerOnboarding,
              phase: 'review',
            };
            setOwnerOnboardingSession(retryState);
            persistOwnerOnboardingState(retryState);
            pushAssistantTurn(
              `I could not save onboarding setup: ${
                error?.message || 'Unexpected error'
              }. Type "proceed" to retry, "cancel" to revise, or "edit timezone".`,
              [
                {
                  id: 'owner-onboarding-save-retry',
                  text: 'Retry Save',
                  prompt: 'proceed',
                  autoSend: true,
                },
                {
                  id: 'owner-onboarding-save-back',
                  text: 'Cancel',
                  prompt: 'cancel',
                  autoSend: true,
                },
              ]
            );
          } finally {
            setIsChatSending(false);
          }
          return;
        }

        if (/^(cancel|back)$/i.test(normalizedLower)) {
          moveBack();
          setIsChatSending(false);
          return;
        }

        const editMatch = normalized.match(/^edit\s+(.+)$/i);
        if (editMatch?.[1]) {
          markActiveOnboardingTurnAnswered();
          handleOwnerOnboardingReviewEdit(editMatch[1]);
          setIsChatSending(false);
          return;
        }

        pushAssistantTurn(
          'Use the review card buttons to continue, or type "edit <field>".'
        );
        setIsChatSending(false);
        return;
      }

      const question =
        OWNER_ONBOARDING_QUESTIONS[activeOwnerOnboarding.currentIndex];
      if (!question) {
        const reviewState: OwnerOnboardingSessionState = {
          ...activeOwnerOnboarding,
          phase: 'review',
        };
        setOwnerOnboardingSession(reviewState);
        persistOwnerOnboardingState(reviewState);
        scheduleOwnerOnboardingDraftSave(reviewState);
        ownerOnboardingPromptRef.current = null;
        askOwnerOnboardingQuestion(reviewState);
        setIsChatSending(false);
        return;
      }

      if (
        question.id === 'owner.phoneNumber' &&
        ownerPhoneVerification &&
        !ownerPhoneVerification.verified
      ) {
        const codeFromChat = normalized.replace(/\D/g, '').slice(0, 6);
        if (codeFromChat.length === 6) {
          void applyOwnerPhoneVerificationCode(codeFromChat);
        } else {
          pushAssistantTurn(
            'Please use the 6-digit verification card to continue.'
          );
        }
        setIsChatSending(false);
        return;
      }

      if (normalizedLower === 'skip' && !question.required) {
        markActiveOnboardingTurnAnswered();
        const nextIndex = activeOwnerOnboarding.currentIndex + 1;
        const nextState = normalizeOwnerOnboardingSession({
          ...activeOwnerOnboarding,
          skipped: { ...activeOwnerOnboarding.skipped, [question.id]: true },
          currentIndex: Math.min(
            nextIndex,
            OWNER_ONBOARDING_QUESTIONS.length - 1
          ),
          phase:
            nextIndex >= OWNER_ONBOARDING_QUESTIONS.length
              ? 'review'
              : 'question',
        });
        setOwnerOnboardingSession(nextState);
        setOwnerPhoneVerification(null);
        persistOwnerOnboardingState(nextState);
        scheduleOwnerOnboardingDraftSave(nextState);
        ownerOnboardingPromptRef.current = null;
        askOwnerOnboardingQuestion(nextState);
        setIsChatSending(false);
        return;
      }

      const validationError = validateOwnerOnboardingAnswer(
        question,
        normalized
      );
      if (validationError) {
        pushAssistantTurn(
          `${validationError} ${question.required ? '' : 'You can also type "skip".'}`
        );
        setIsChatSending(false);
        return;
      }

      const updatedForm = setOwnerOnboardingFieldValue(
        activeOwnerOnboarding.form,
        question,
        normalized
      );
      markActiveOnboardingTurnAnswered();
      if (question.id === 'owner.phoneNumber') {
        const pendingState: OwnerOnboardingSessionState = {
          ...activeOwnerOnboarding,
          form: updatedForm,
          skipped: {
            ...activeOwnerOnboarding.skipped,
            [OWNER_PHONE_VERIFIED_KEY]: false,
          },
        };
        setOwnerOnboardingSession(pendingState);
        persistOwnerOnboardingState(pendingState);
        scheduleOwnerOnboardingDraftSave(pendingState);
        const otpTurnId = pushAssistantTurn(
          'Verify your phone number to continue. Enter the 6-digit code sent via SMS and email.'
        );
        setOwnerPhoneVerification({
          phoneNumber: normalized,
          otpTurnId,
          digits: new Array(6).fill(''),
          error: null,
          info: null,
          sending: true,
          verifying: false,
          verified: false,
        });
        setTimeout(() => {
          ownerPhoneOtpInputRefs.current[0]?.focus();
        }, 80);
        void sendOwnerPhoneVerificationOtp(normalized);
        setIsChatSending(false);
        return;
      }
      const nextIndex = activeOwnerOnboarding.currentIndex + 1;
      const nextState = normalizeOwnerOnboardingSession({
        ...activeOwnerOnboarding,
        form: updatedForm,
        skipped: { ...activeOwnerOnboarding.skipped, [question.id]: false },
        currentIndex: Math.min(
          nextIndex,
          OWNER_ONBOARDING_QUESTIONS.length - 1
        ),
        phase:
          nextIndex >= OWNER_ONBOARDING_QUESTIONS.length
            ? 'review'
            : 'question',
      });
      setOwnerOnboardingSession(nextState);
      setOwnerPhoneVerification(null);
      persistOwnerOnboardingState(nextState);
      scheduleOwnerOnboardingDraftSave(nextState);
      ownerOnboardingPromptRef.current = null;
      askOwnerOnboardingQuestion(nextState);
      setIsChatSending(false);
      return;
    }

    const isOnboardingMode =
      activeToolCommand === '/onboarding' || /^\/onboarding\b/i.test(message);
    if (isOnboardingMode) {
      const normalized = message
        .replace(/^\/onboarding\s*/i, '')
        .trim()
        .toLowerCase();
      if (
        normalized === '__onboarding_start_import__' ||
        /^(start|continue|proceed)(\s+with)?\s+import$/.test(normalized) ||
        /^start\s+import\s+now$/.test(normalized)
      ) {
        void handleStartOnboardingImport();
        setIsChatSending(false);
        return;
      }
      if (/status|progress|state/.test(normalized)) {
        if (onboardingUi?.job?.id) {
          pollOnboardingJob(onboardingUi.job.id);
          pushAssistantTurn(
            `Checking onboarding status for job ${onboardingUi.job.id}...`
          );
        } else {
          pushAssistantTurn(
            'No active onboarding job yet. Click + and choose CSV Upload to upload your onboarding CSV.'
          );
        }
        setIsChatSending(false);
        return;
      }

      if (
        normalized.length === 0 ||
        /upload|csv|start|begin|onboarding/.test(normalized)
      ) {
        onboardingFileInputRef.current?.click();
        setIsChatSending(false);
        return;
      }
    }

    if (isModuleMode || /^\/module\b/i.test(message)) {
      const baseDraft = moduleDraft || createEmptyDraft();
      if (!moduleDraft) {
        dispatchModuleDraft({ type: 'initialize', draft: baseDraft });
        setModuleWizardSavedStates({});
        setActiveModuleRecordId(null);
      }

      const normalizedModuleRequest = (
        isModuleMode
          ? messageWithoutModulePrefix
          : message.replace(/^\/module\s*/i, '').trim()
      ).toLowerCase();
      const listTemplatesMatch = /^(list|show)\s+(module\s+)?templates\b/.test(
        normalizedModuleRequest
      );
      const useTemplateMatch = normalizedModuleRequest.match(
        /^use\s+template\s+(.+)$/i
      );
      const showTemplateDiffMatch = /^(show\s+)?template\s+diff$/.test(
        normalizedModuleRequest
      );
      const previewSubmitPayloadMatch =
        /^(preview|show)\s+(submit\s+)?payload$/i.test(normalizedModuleRequest);
      const submitModuleMatch = /^(submit|publish)\s+module$/i.test(
        normalizedModuleRequest
      );

      if (moduleTemplateSelection?.stage === 'industry') {
        if (/^(cancel|stop|abort)$/i.test(normalizedModuleRequest)) {
          setModuleTemplateSelection(null);
          const assistantTurn: ChatTurn = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            text: 'Template selection cancelled. You can start again with: "create a form for ...".',
          };
          setTypingAssistantTurnId(assistantTurn.id);
          setChatTurns((current) => {
            const next = [...current, assistantTurn];
            updateActiveHistory(next);
            return next;
          });
          setIsChatSending(false);
          return;
        }
        const industryFromPrompt = inferIndustryFromPrompt(
          normalizedModuleRequest,
          moduleTemplateSelection.candidates
        );
        const indexPick = Number(normalizedModuleRequest);
        const industries = moduleTemplateSelection.industries || [];
        const pickedIndustry =
          industryFromPrompt ||
          (Number.isInteger(indexPick) &&
          indexPick >= 1 &&
          indexPick <= industries.length
            ? industries[indexPick - 1]
            : null);

        if (!pickedIndustry) {
          const assistantTurn: ChatTurn = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            text: 'I did not catch the industry yet. Choose an industry badge or type the industry name (example: Non-Profit & Faith-Based).',
          };
          setTypingAssistantTurnId(assistantTurn.id);
          setChatTurns((current) => {
            const next = [...current, assistantTurn];
            updateActiveHistory(next);
            return next;
          });
          setIsChatSending(false);
          return;
        }

        const options = moduleTemplateSelection.candidates.filter(
          (item) => item.industry === pickedIndustry
        );
        setModuleTemplateSelection({
          ...moduleTemplateSelection,
          stage: 'template',
          industry: pickedIndustry,
          options,
        });
        const assistantTurn: ChatTurn = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: `Great. Here are ${pickedIndustry} templates`,
        };
        setTypingAssistantTurnId(assistantTurn.id);
        setChatTurns((current) => {
          const next = [...current, assistantTurn];
          updateActiveHistory(next);
          return next;
        });
        setAssistantPromptChips((current) => ({
          ...current,
          [assistantTurn.id]: options.map((item, index) => ({
            id: `module-template-option-${item.id}`,
            text: `${index + 1}. ${item.name}`,
            prompt: String(index + 1),
            autoSend: true,
          })),
        }));
        setIsChatSending(false);
        return;
      }

      if (moduleTemplateSelection?.stage === 'template') {
        if (/^(cancel|stop|abort)$/i.test(normalizedModuleRequest)) {
          setModuleTemplateSelection(null);
          const assistantTurn: ChatTurn = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            text: 'Template selection cancelled. You can start again with: "create a form for ...".',
          };
          setTypingAssistantTurnId(assistantTurn.id);
          setChatTurns((current) => {
            const next = [...current, assistantTurn];
            updateActiveHistory(next);
            return next;
          });
          setIsChatSending(false);
          return;
        }
        const options = moduleTemplateSelection.options || [];
        const indexPick = Number(normalizedModuleRequest);
        const pickedByNumber =
          Number.isInteger(indexPick) &&
          indexPick >= 1 &&
          indexPick <= options.length
            ? options[indexPick - 1]
            : null;
        const normalizedInput = normalizeTemplateText(normalizedModuleRequest);
        const pickedByName = options.find((item) => {
          const id = normalizeTemplateText(item.id);
          const name = normalizeTemplateText(item.name);
          return (
            normalizedInput === id ||
            normalizedInput === name ||
            name.includes(normalizedInput)
          );
        });
        const selected = pickedByNumber || pickedByName || null;

        if (!selected) {
          const assistantTurn: ChatTurn = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            text: `Please reply with a number (1-${options.length}) to load a template from ${moduleTemplateSelection.industry}.`,
          };
          setTypingAssistantTurnId(assistantTurn.id);
          setChatTurns((current) => {
            const next = [...current, assistantTurn];
            updateActiveHistory(next);
            return next;
          });
          setIsChatSending(false);
          return;
        }

        try {
          const loaded = await loadTemplateIntoDraft(selected.id);
          setModuleTemplateSelection(null);
          const loadedFields = Array.isArray(loaded?.draft?.fields)
            ? loaded.draft.fields.length
            : 0;
          const assistantTurn: ChatTurn = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            text: `Loaded template "${selected.name}" (${selected.id}) with ${loadedFields} fields. You can continue editing in Module Workspace.`,
          };
          setTypingAssistantTurnId(assistantTurn.id);
          setChatTurns((current) => {
            const next = [...current, assistantTurn];
            updateActiveHistory(next);
            return next;
          });
          setAssistantPromptChips((current) => ({
            ...current,
            [assistantTurn.id]: moduleAIGenerationChips.map((chip, index) => ({
              ...chip,
              id: `${chip.id}-${index}-${Date.now()}`,
            })),
          }));
          setIsChatSending(false);
          return;
        } catch (error: any) {
          const assistantTurn: ChatTurn = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            text: `Could not load selected template: ${error?.message || 'Unexpected error.'}`,
          };
          setTypingAssistantTurnId(assistantTurn.id);
          setChatTurns((current) => {
            const next = [...current, assistantTurn];
            updateActiveHistory(next);
            return next;
          });
          setIsChatSending(false);
          return;
        }
      }

      if (listTemplatesMatch) {
        postModuleUpdateSummary(
          'Use "create a form for <purpose>" and Saby will list matching templates. If ambiguous, pick industry then pick template number.'
        );
        setIsChatSending(false);
        return;
      }

      if (useTemplateMatch?.[1]) {
        try {
          const requested = useTemplateMatch[1].trim();
          const catalog =
            moduleTemplateCatalog.length > 0
              ? moduleTemplateCatalog
              : await fetchModuleTemplateCatalog();
          const needle = requested.toLowerCase();
          const selected =
            catalog.find((item) => item.id.toLowerCase() === needle) ||
            catalog.find((item) => item.name.toLowerCase() === needle) ||
            catalog.find((item) => item.name.toLowerCase().includes(needle)) ||
            catalog.find((item) => item.id.toLowerCase().includes(needle));
          if (!selected) {
            const assistantTurn: ChatTurn = {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              text: `Template "${requested}" was not found. Try "list templates".`,
            };
            setTypingAssistantTurnId(assistantTurn.id);
            setChatTurns((current) => {
              const next = [...current, assistantTurn];
              updateActiveHistory(next);
              return next;
            });
            setIsChatSending(false);
            return;
          }
          const loaded = await loadTemplateIntoDraft(selected.id);
          const loadedFields = Array.isArray(loaded?.draft?.fields)
            ? loaded.draft.fields.length
            : 0;
          const assistantTurn: ChatTurn = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            text: `Loaded template "${selected.name}" (${selected.id}) into module draft with ${loadedFields} fields. You can now refine it with chat edits and review template diff.`,
          };
          setTypingAssistantTurnId(assistantTurn.id);
          setChatTurns((current) => {
            const next = [...current, assistantTurn];
            updateActiveHistory(next);
            return next;
          });
          setAssistantPromptChips((current) => ({
            ...current,
            [assistantTurn.id]: [
              { id: 'tpl-diff', text: 'show template diff' },
              { id: 'tpl-preview', text: 'module readiness' },
              { id: 'tpl-json', text: 'show module draft json' },
            ],
          }));
          setIsChatSending(false);
          return;
        } catch (error: any) {
          const assistantTurn: ChatTurn = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            text: `Could not apply template: ${error?.message || 'Unexpected error.'}`,
          };
          setTypingAssistantTurnId(assistantTurn.id);
          setChatTurns((current) => {
            const next = [...current, assistantTurn];
            updateActiveHistory(next);
            return next;
          });
          setIsChatSending(false);
          return;
        }
      }

      if (showTemplateDiffMatch) {
        setActiveModuleTab('review');
        setIsModuleWorkspaceOpen(true);
        const diff = computeModuleTemplateDiff(
          moduleTemplateBaseline,
          baseDraft
        );
        const assistantTurn: ChatTurn = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text:
            !moduleTemplateInfo || !diff
              ? 'No template baseline found. Use: "use template <id>" first.'
              : `Template diff for "${moduleTemplateInfo.name}": +${diff.addedFields.length} added, -${diff.removedFields.length} removed, ${diff.changedFields.length} changed fields.`,
        };
        setTypingAssistantTurnId(assistantTurn.id);
        setChatTurns((current) => {
          const next = [...current, assistantTurn];
          updateActiveHistory(next);
          return next;
        });
        setIsChatSending(false);
        return;
      }

      if (previewSubmitPayloadMatch) {
        try {
          const data = await submitModuleDraft(true);
          const assistantTurn: ChatTurn = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            text: data?.lint?.warnings?.length
              ? `Submission payload preview generated with ${data.lint.warnings.length} warning(s). Open Review tab for full payload and lint details.`
              : 'Submission payload preview generated. Open Review tab for full payload.',
          };
          setTypingAssistantTurnId(assistantTurn.id);
          setChatTurns((current) => {
            const next = [...current, assistantTurn];
            updateActiveHistory(next);
            return next;
          });
        } catch (error: any) {
          const assistantTurn: ChatTurn = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            text: `Could not generate submit payload: ${error?.message || 'Unexpected error.'}`,
          };
          setTypingAssistantTurnId(assistantTurn.id);
          setChatTurns((current) => {
            const next = [...current, assistantTurn];
            updateActiveHistory(next);
            return next;
          });
        }
        setIsChatSending(false);
        return;
      }

      if (submitModuleMatch) {
        if (moduleLifecycleStage === 'published') {
          const assistantTurn: ChatTurn = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            text: 'This module is already published and will not be submitted again.',
          };
          setTypingAssistantTurnId(assistantTurn.id);
          setChatTurns((current) => {
            const next = [...current, assistantTurn];
            updateActiveHistory(next);
            return next;
          });
          setIsChatSending(false);
          return;
        }
        if (!isModuleReadyToSubmit || modulePreSubmitAudit.errors.length > 0) {
          const assistantTurn: ChatTurn = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            text:
              modulePreSubmitAudit.errors.length > 0
                ? 'Finalize first: resolve pre-submit audit errors in Review tab before submitting.'
                : 'Finalize first: run "preview payload" and resolve blockers before submitting this module.',
          };
          setTypingAssistantTurnId(assistantTurn.id);
          setChatTurns((current) => {
            const next = [...current, assistantTurn];
            updateActiveHistory(next);
            return next;
          });
          setIsChatSending(false);
          return;
        }
        try {
          const data = await submitModuleDraft(false);
          const projectId =
            data?.result?.projectForm?.projectId ||
            data?.result?.projectId ||
            'unknown';
          const wasUpdate =
            String(data?.operation || '').toLowerCase() === 'update';
          const assistantTurn: ChatTurn = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            text: wasUpdate
              ? `Module updated successfully and is ready for publish (projectId: ${projectId}).`
              : `Module submitted successfully and is ready for publish (projectId: ${projectId}).`,
          };
          setTypingAssistantTurnId(assistantTurn.id);
          setChatTurns((current) => {
            const next = [...current, assistantTurn];
            updateActiveHistory(next);
            return next;
          });
        } catch (error: any) {
          const assistantTurn: ChatTurn = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            text: `Module submission failed: ${error?.message || 'Unexpected error.'}`,
          };
          setTypingAssistantTurnId(assistantTurn.id);
          setChatTurns((current) => {
            const next = [...current, assistantTurn];
            updateActiveHistory(next);
            return next;
          });
        }
        setIsChatSending(false);
        return;
      }

      const regenerateSection = (() => {
        if (/^regenerate\s+(all|module|draft)\b/.test(normalizedModuleRequest))
          return 'all';
        if (/^regenerate\s+fields?\b/.test(normalizedModuleRequest))
          return 'fields';
        if (/^regenerate\s+workflow\b/.test(normalizedModuleRequest))
          return 'workflow';
        if (/^regenerate\s+perm\b/.test(normalizedModuleRequest)) return 'perm';
        return null;
      })();
      const isAIGenerateRequest =
        regenerateSection !== null ||
        /^(generate|design|build)\b/.test(normalizedModuleRequest) ||
        /^create\s+(.+)?\b(form|module|project)\b/.test(
          normalizedModuleRequest
        ) ||
        /^create\s+module\s+for\b/.test(normalizedModuleRequest) ||
        /\b(i\s+need|need|want)\b[\s\S]*\b(form|module|project)\b/.test(
          normalizedModuleRequest
        ) ||
        /complete\s+module/.test(normalizedModuleRequest) ||
        /from\s+brief/.test(normalizedModuleRequest);

      if (isAIGenerateRequest) {
        try {
          const brief = (
            isModuleMode
              ? messageWithoutModulePrefix
              : message.replace(/^\/module\s*/i, '').trim()
          ).trim();
          const catalog =
            moduleTemplateCatalog.length > 0
              ? moduleTemplateCatalog
              : await fetchModuleTemplateCatalog();
          const ranked = rankTemplateCandidates(brief, catalog);
          const topScore = ranked[0]?.score || 0;
          const candidateRows = ranked.filter(
            (row) => row.score >= Math.max(3, topScore - 2)
          );
          const candidates = candidateRows.map((row) => row.item);

          if (candidates.length === 1) {
            const selected = candidates[0];
            const loaded = await loadTemplateIntoDraft(selected.id);
            const loadedFields = Array.isArray(loaded?.draft?.fields)
              ? loaded.draft.fields.length
              : 0;
            const assistantTurn: ChatTurn = {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              text: `Loaded template "${selected.name}" (${selected.id}) with ${loadedFields} fields. You can continue editing in Module Workspace.`,
            };
            setTypingAssistantTurnId(assistantTurn.id);
            setChatTurns((current) => {
              const next = [...current, assistantTurn];
              updateActiveHistory(next);
              return next;
            });
            setAssistantPromptChips((current) => ({
              ...current,
              [assistantTurn.id]: moduleAIGenerationChips.map(
                (chip, index) => ({
                  ...chip,
                  id: `${chip.id}-${index}-${Date.now()}`,
                })
              ),
            }));
            setIsChatSending(false);
            return;
          }

          if (candidates.length > 1) {
            const industries = Array.from(
              new Set(catalog.map((item) => item.industry))
            ).sort((a, b) => a.localeCompare(b));
            if (industries.length > 1) {
              setModuleTemplateSelection({
                stage: 'industry',
                brief,
                candidates: catalog,
                industries,
              });
              const assistantTurn: ChatTurn = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                text: 'I found multiple matching templates. Select an industry to continue, then I will list templates by number.',
              };
              setTypingAssistantTurnId(assistantTurn.id);
              setChatTurns((current) => {
                const next = [...current, assistantTurn];
                updateActiveHistory(next);
                return next;
              });
              setAssistantPromptChips((current) => ({
                ...current,
                [assistantTurn.id]: industries.map((industry, index) => ({
                  id: `module-industry-${index}-${Date.now()}`,
                  text: industry,
                  prompt: industry,
                  autoSend: true,
                })),
              }));
              setIsChatSending(false);
              return;
            }

            const singleIndustry = industries[0];
            const options = candidates.filter(
              (item) => item.industry === singleIndustry
            );
            setModuleTemplateSelection({
              stage: 'template',
              brief,
              candidates,
              industry: singleIndustry,
              options,
            });
            const lines = options
              .map((item, index) => `${index + 1}. ${item.name} (${item.id})`)
              .join('\n');
            const assistantTurn: ChatTurn = {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              text: `I found multiple templates in ${singleIndustry}:\n${lines}\nReply with a number to load one template.`,
            };
            setTypingAssistantTurnId(assistantTurn.id);
            setChatTurns((current) => {
              const next = [...current, assistantTurn];
              updateActiveHistory(next);
              return next;
            });
            setAssistantPromptChips((current) => ({
              ...current,
              [assistantTurn.id]: options.map((item, index) => ({
                id: `module-template-pick-${item.id}-${Date.now()}`,
                text: `${index + 1}. ${item.name}`,
                prompt: String(index + 1),
                autoSend: true,
              })),
            }));
            setIsChatSending(false);
            return;
          }

          const industries = Array.from(
            new Set(catalog.map((item) => item.industry))
          ).sort((a, b) => a.localeCompare(b));
          setModuleTemplateSelection({
            stage: 'industry',
            brief,
            candidates: catalog,
            industries,
          });
          const assistantTurn: ChatTurn = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            text: 'Choose an industry badge to see available templates.',
          };
          setTypingAssistantTurnId(assistantTurn.id);
          setChatTurns((current) => {
            const next = [...current, assistantTurn];
            updateActiveHistory(next);
            return next;
          });
          setAssistantPromptChips((current) => ({
            ...current,
            [assistantTurn.id]: industries.map((industry, index) => ({
              id: `module-industry-strict-${index}-${Date.now()}`,
              text: industry,
              prompt: industry,
              autoSend: true,
            })),
          }));
          setIsChatSending(false);
          return;
        } catch (error: any) {
          const assistantTurn: ChatTurn = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            text: `Template generation failed: ${error?.message || 'Unexpected error.'}`,
          };
          setTypingAssistantTurnId(assistantTurn.id);
          setChatTurns((current) => {
            const next = [...current, assistantTurn];
            updateActiveHistory(next);
            return next;
          });
          setIsChatSending(false);
          return;
        }
      }

      const intentResult = interpretModuleDraftIntent(
        isModuleMode ? messageWithoutModulePrefix : message,
        baseDraft
      );

      if (
        String(intentResult.assistantText || '').startsWith(
          "I couldn't map that module command yet."
        )
      ) {
        const catalog =
          moduleTemplateCatalog.length > 0
            ? moduleTemplateCatalog
            : await fetchModuleTemplateCatalog();
        const industries = Array.from(
          new Set(catalog.map((item) => item.industry))
        ).sort((a, b) => a.localeCompare(b));
        setModuleTemplateSelection({
          stage: 'industry',
          brief: isModuleMode
            ? messageWithoutModulePrefix
            : message.replace(/^\/module\s*/i, '').trim(),
          candidates: catalog,
          industries,
        });
        const assistantTurn: ChatTurn = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: 'Please choose an industry badge so I can load templates.',
        };
        setTypingAssistantTurnId(assistantTurn.id);
        setChatTurns((current) => {
          const next = [...current, assistantTurn];
          updateActiveHistory(next);
          return next;
        });
        setAssistantPromptChips((current) => ({
          ...current,
          [assistantTurn.id]: industries.map((industry, index) => ({
            id: `module-industry-fallback-${index}-${Date.now()}`,
            text: industry,
            prompt: industry,
            autoSend: true,
          })),
        }));
        setIsChatSending(false);
        return;
      }

      let nextDraft = baseDraft;
      if (intentResult.operation) {
        if (intentResult.operation.type === 'create_module') {
          const projectName =
            String(intentResult.operation.payload?.projectName || '').trim() ||
            'New Module';
          const freshDraft = createEmptyDraft({
            metadata: {
              projectName,
              tags: [],
              additionalTags: [],
              security: 'private',
              accessibility: ['api', 'web', 'embedded'],
            },
            ui: {
              style: 'default',
              wizardMode: true,
              showProgressBar: true,
              primaryColor: '#3b82f6',
              theme: 'default',
            },
          });
          dispatchModuleDraft({ type: 'initialize', draft: freshDraft });
          setModuleWizardSavedStates({});
          nextDraft = freshDraft;
          setActiveModuleRecordId(null);
          setModuleLifecycleStage('draft');
          setModuleLastSavedAt(null);
          moduleLastAutosaveSignatureRef.current = '';
          setModuleTemplateSelection(null);
          setModuleTemplateBaseline(null);
          setModuleTemplateInfo(null);
          setModuleSubmitDryRun(null);
          setModuleSubmitResult(null);
        } else {
          nextDraft = applyOperationToDraft(baseDraft, intentResult.operation);
          dispatchModuleDraft({
            type: 'apply_operation',
            operation: intentResult.operation,
          });
        }
      }

      const readiness = evaluateDraftReadiness(nextDraft);
      const statusLine = `Draft status: ${readiness.isReady ? 'ready' : 'not ready'} | fields: ${nextDraft.fields.length} | workflow steps: ${nextDraft.workflow.steps.length}.`;
      const assistantTurn: ChatTurn = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: `${intentResult.assistantText}\n${statusLine}`,
      };

      setTypingAssistantTurnId(assistantTurn.id);
      setChatTurns((current) => {
        const next = [...current, assistantTurn];
        updateActiveHistory(next);
        return next;
      });
      if (intentResult.chips?.length) {
        setAssistantPromptChips((current) => ({
          ...current,
          [assistantTurn.id]: intentResult.chips || [],
        }));
      }
      setIsChatSending(false);
      return;
    }

    if (chatAbortControllerRef.current) {
      chatAbortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    chatAbortControllerRef.current = abortController;

    let assistantTurnId = '';

    try {
      // ── Streaming SSE fetch ───────────────────────────────────────────────
      // /api/saby/agent/stream proxies to the copilot SSE endpoint and emits:
      //   event: progress   { stage }
      //   event: reasoning  { chunk }   — CoT / thought process deltas
      //   event: token      { chunk }   — LLM synthesis tokens as they arrive
      //   event: done       { ok, answer, reasoning, route, toolResults }
      //   event: error      { error }
      const currentThreadId =
        activeHistoryId || draftThreadIdRef.current || null;
      const activeTitle = activeHistoryId
        ? userSidebarHistory.find((h) => h.id === activeHistoryId)?.title || null
        : null;
      const agentPayload = JSON.stringify({
        message: agentMessage,
        threadId: currentThreadId,
        title: activeTitle,
        activeNodeId: activeModuleRecordId || null,
        context: {
          currentRoute: pathname || null,
          currentModuleId: activeModuleRecordId || null,
          timezone:
            ownerOnboardingProfileState?.company?.timezone ||
            Intl.DateTimeFormat().resolvedOptions().timeZone ||
            'Africa/Lagos',
          helpMode: isHelpMode,
          toolMode: activeToolCommand || null,
          modelPreference: selectedRootModel || 'Flash',
        },
      });

      setChatProgressStage('thinking');
      const response = await fetch('/api/saby/agent/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: agentPayload,
        signal: abortController.signal,
      });

      if (!response.ok || !response.body) {
        // Non-2xx or no body — fall back to a plain error message
        const errText = await response.text().catch(() => '');
        let errMsg = 'Unable to process request';
        try {
          const errJson: any = JSON.parse(errText);
          errMsg = errJson?.error || errMsg;
        } catch {
          /* raw text */
        }
        setChatError(formatChatErrorMessage(errMsg));
        setIsChatSending(false);
        return;
      }

      // ── Build a live assistant turn that fills in as tokens arrive ────────
      assistantTurnId = `assistant-${Date.now()}`;
      const assistantTurn: ChatTurn = {
        id: assistantTurnId,
        role: 'assistant',
        text: '',
      };
      // Insert the (empty) turn immediately so the typing indicator renders
      setTypingAssistantTurnId(assistantTurnId);
      setChatTurns((current) => [...current, assistantTurn]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = '';
      let currentEventType = '';
      let streamedText = '';
      let streamedReasoning = '';
      let finalAnswer = '';
      let finalReasoning = '';
      let finalRoute: any = null;
      let finalToolResults: any = null;
      let streamErrored = false;

      // 60fps token batching via requestAnimationFrame to eliminate lag in 17k line component
      let rafId: number | null = null;
      let pendingUpdate = false;
      const scheduleRender = () => {
        if (pendingUpdate) return;
        pendingUpdate = true;
        rafId = requestAnimationFrame(() => {
          pendingUpdate = false;
          const parsed = cleanTurnThinking(streamedText, streamedReasoning);
          setChatTurns((current) =>
            current.map((t) =>
              t.id === assistantTurnId
                ? {
                    ...t,
                    text: parsed.cleanText,
                    reasoning: parsed.reasoning,
                  }
                : t
            )
          );
        });
      };

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });

        // SSE lines are separated by \n; a blank line ends one event block
        const lines = sseBuffer.split('\n');
        sseBuffer = lines.pop() ?? ''; // keep any partial last line

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6);
            // Skip keep-alive comments
            if (jsonStr.startsWith(':')) continue;
            try {
              const payload: any = JSON.parse(jsonStr);

              if (currentEventType === 'progress') {
                const stage =
                  payload.stage || payload.detail?.engineType || null;
                if (
                  stage === 'tools' ||
                  stage === 'synthesis' ||
                  stage === 'routing' ||
                  stage === 'thinking'
                ) {
                  setChatProgressStage(stage);
                }
              } else if (currentEventType === 'token') {
                setChatProgressStage('synthesis');
                // Append streaming token in real time with 60fps throttled render
                streamedText += payload.chunk ?? payload.token ?? '';
                scheduleRender();
              } else if (currentEventType === 'reasoning') {
                setChatProgressStage('thinking');
                // Append reasoning/thought process tokens
                streamedReasoning += payload.chunk ?? payload.token ?? '';
                scheduleRender();
              } else if (currentEventType === 'done') {
                setChatProgressStage(null);
                if (rafId) cancelAnimationFrame(rafId);
                if (payload.threadId) {
                  const previousId =
                    activeHistoryId || draftThreadIdRef.current;
                  setActiveHistoryId(payload.threadId);
                  draftThreadIdRef.current = payload.threadId;
                  if (previousId && previousId !== payload.threadId) {
                    setUserSidebarHistory((prev) => {
                      const next = prev.map((entry) =>
                        entry.id === previousId
                          ? { ...entry, id: payload.threadId }
                          : entry
                      );
                      const normalized = normalizeHistoryEntries(next);
                      persistHistoryEntries(normalized);
                      return normalized;
                    });
                  }
                }
                finalAnswer = String(payload.answer ?? streamedText).trim();
                finalReasoning = String(
                  payload.reasoning ?? streamedReasoning
                ).trim();
                finalRoute = payload.route ?? null;
                finalToolResults = payload.toolResults ?? null;
                // Store the intent so FeedbackButtons can pass it as workflowName
                if (finalRoute?.intent) {
                  setTurnIntentByTurnId((c) => ({
                    ...c,
                    [assistantTurnId]: finalRoute.intent,
                  }));
                }
                try {
                  void reader.cancel().catch(() => null);
                } catch {
                  /* ignore */
                }
                break outer;
              } else if (currentEventType === 'error') {
                setChatProgressStage(null);
                if (rafId) cancelAnimationFrame(rafId);
                const rawError = payload.error || 'Saby stream error';
                const errorMessage = formatChatErrorMessage(rawError);
                setChatError(errorMessage);
                // Remove the placeholder turn
                setChatTurns((current) =>
                  current.filter((t) => t.id !== assistantTurnId)
                );
                handleAssistantTypingDone(assistantTurnId);
                streamErrored = true;
                try {
                  void reader.cancel().catch(() => null);
                } catch {
                  /* ignore */
                }
                break outer;
              }
            } catch {
              /* malformed SSE data — skip */
            }

            currentEventType = '';
          } else if (line === '') {
            // blank line = end of SSE event block
            currentEventType = '';
          }
        }
      }

      if (streamErrored) {
        setIsChatSending(false);
        handleAssistantTypingDone(assistantTurnId);
        return;
      }

      // ── Commit final answer ───────────────────────────────────────────────
      // If the LLM streamed tokens, streamedText already has the full text.
      // The done event's answer is canonical — prefer it if it differs (e.g. post-processing).
      const parsed = cleanTurnThinking(
        finalAnswer || streamedText,
        finalReasoning || streamedReasoning
      );
      const answer = parsed.cleanText.trim();
      const reasoning = parsed.reasoning;

      if (!answer) {
        setChatError('Saby returned an empty response. Please retry.');
        // Remove the placeholder turn
        setChatTurns((current) =>
          current.filter((t) => t.id !== assistantTurnId)
        );
        handleAssistantTypingDone(assistantTurnId);
        setIsChatSending(false);
        return;
      }

      setChatTurns((current) => {
        const next = current.map((t) =>
          t.id === assistantTurnId ? { ...t, text: answer, reasoning } : t
        );
        updateActiveHistory(next);
        return next;
      });

      // Clear the streaming indicator — removes the blinking cursor and
      // allows the next queued assistant turn (if any) to start rendering.
      handleAssistantTypingDone(assistantTurnId);

      // ── Handle pending action events (confirmation polling) ───────────────
      const pendingMeta = parsePendingEventMeta(answer);
      if (pendingMeta?.eventId) {
        setActionTurnMeta((current) => ({
          ...current,
          [assistantTurnId]: {
            eventId: pendingMeta.eventId,
            actionType: pendingMeta.actionType,
            status: 'processing',
            attempts: 0,
            lastCheckedAt: null,
          },
        }));
        void pollActionFinalStatusForTurn(
          assistantTurnId,
          pendingMeta.eventId,
          pendingMeta.actionType,
          'foreground'
        );
      }

      // Suppress unused-variable warnings for future use
      void finalRoute;
      void finalToolResults;
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        setChatError('Could not connect to Saby service. Check agent status.');
      }
    } finally {
      setIsChatSending(false);
      setChatProgressStage(null);
      chatAbortControllerRef.current = null;
      if (assistantTurnId) {
        handleAssistantTypingDone(assistantTurnId);
      }
    }
  };

  const handlePromptKeyDown = (
    event: ReactKeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendPromptToSaby();
    }
  };

  const handleSelectToolCommand = (command: string) => {
    if (command === '/help') {
      setActiveToolCommand(null);
      setIsHelpMode(true);
      setIsToolsMenuOpen(false);
      setRootMenuOpenSections({
        model: false,
        workspace: false,
        insights: false,
        utilities: false,
        response: false,
      });
      setIsModuleLibraryMenuOpen(false);
      setTimeout(() => composerInputRef.current?.focus(), 0);
      return;
    }
    setActiveToolCommand(command);
    setIsHelpMode(false);
    setIsToolsMenuOpen(false);
    setRootMenuOpenSections({
      model: false,
      workspace: false,
      insights: false,
      utilities: false,
      response: false,
    });
    setIsModuleLibraryMenuOpen(false);
    if (command === '/onboarding') {
      setOnboardingUi(
        (previous) =>
          previous || {
            phase: 'idle',
            fileName: 'onboarding.csv',
            uploadPct: 0,
            message: 'Select your CSV file to start onboarding import.',
          }
      );
    }
    setTimeout(() => composerInputRef.current?.focus(), 0);
  };

  const handleQuickPromptInsert = (value: string) => {
    setPrompt(value);
    setTimeout(() => composerInputRef.current?.focus(), 0);
  };

  const handlePendingConfirmationResponse = useCallback(
    (value: 'yes' | 'cancel') => {
      void sendPromptToSaby(value);
    },
    [sendPromptToSaby]
  );

  const handleAssistantPromptChipClick = (chip: AssistantPromptChip) => {
    if (chip.prompt === '__open_workspace__') {
      if (dashboardNavLocked) {
        showOnboardingLockNotice('module workspace');
        return;
      }
      openModuleWorkspace('preview');
      return;
    }
    if (chip.prompt === '__download_onboarding_template__') {
      if (typeof window !== 'undefined') {
        const anchor = document.createElement('a');
        anchor.href = ONBOARDING_MASTER_TEMPLATE_URL;
        anchor.download = 'saby_orgs_template.csv';
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
      }
      return;
    }
    if (chip.prompt === '__onboarding_csv_upload__') {
      setActiveToolCommand('/onboarding');
      onboardingFileInputRef.current?.click();
      return;
    }
    if (String(chip.prompt || '').startsWith('__onboarding_toggle_issues__:')) {
      const parts = String(chip.prompt || '').split(':');
      const jobId = parts[1] || '';
      const turnId = parts[2] || '';
      const action = parts[3] || 'view';
      if (jobId && turnId) {
        const currentlyExpanded = Boolean(
          onboardingIssueExpandedByTurnId[turnId]
        );
        const expanding =
          action === 'hide'
            ? false
            : action === 'view'
              ? true
              : !currentlyExpanded;
        setOnboardingIssueExpandedByTurnId((current) => ({
          ...current,
          [turnId]: expanding,
        }));
        setAssistantPromptChips((current) => ({
          ...current,
          [turnId]: buildOnboardingDryRunFailedChips(jobId, turnId, expanding),
        }));
      }
      return;
    }
    if (chip.prompt === '__onboarding_start_import__') {
      setActiveToolCommand('/onboarding');
      setIsHelpMode(false);
      void handleStartOnboardingImport();
      return;
    }
    if (chip.prompt === '__onboarding_retry__') {
      setActiveToolCommand('/onboarding');
      setIsHelpMode(false);
      onboardingFileInputRef.current?.click();
      return;
    }
    if (chip.autoSend) {
      void sendPromptToSaby(chip.prompt || chip.text);
      return;
    }
    handleQuickPromptInsert(chip.prompt || chip.text);
  };

  const getAssistantChipClass = (chip: AssistantPromptChip) => {
    const key = chip.text.toLowerCase();
    if (key === 'module workspace') {
      return isLightTheme
        ? 'border-[#cfe0ff] bg-[#edf3ff] text-[#103d7a] hover:bg-[#e3edff]'
        : 'border-[#4b6ea4] bg-[#20304b] text-[#dbeafe] hover:bg-[#29416a]';
    }
    if (key === 'compliance') {
      return isLightTheme
        ? 'border-[#ccead2] bg-[#ebfaef] text-[#1f6b3a] hover:bg-[#dcf6e4]'
        : 'border-[#2f7c52] bg-[#163b2a] text-[#d7ffe8] hover:bg-[#20523a]';
    }
    if (key === 'security') {
      return isLightTheme
        ? 'border-[#f4d0a6] bg-[#fff5e8] text-[#8a5207] hover:bg-[#ffedd4]'
        : 'border-[#7f5b1f] bg-[#3f2f14] text-[#ffe7bf] hover:bg-[#59431d]';
    }
    if (key === 'rules') {
      return isLightTheme
        ? 'border-[#e6cdf8] bg-[#f8f0ff] text-[#6a2f91] hover:bg-[#f1e3ff]'
        : 'border-[#6e3f93] bg-[#321e45] text-[#efdcff] hover:bg-[#44285e]';
    }
    if (key === 'payment') {
      return isLightTheme
        ? 'border-[#f4c4c4] bg-[#fff1f1] text-[#9a3434] hover:bg-[#ffe5e5]'
        : 'border-[#7a4343] bg-[#3e2323] text-[#ffd7d7] hover:bg-[#573232]';
    }
    if (key === 'workflow') {
      return isLightTheme
        ? 'border-[#c7e6f8] bg-[#ecf8ff] text-[#0f5c84] hover:bg-[#ddf3ff]'
        : 'border-[#3a6d8c] bg-[#1a3444] text-[#d8f0ff] hover:bg-[#24485f]';
    }
    return isLightTheme
      ? 'border-[#d7e3fa] bg-[#f4f8ff] text-[#204070] hover:bg-[#e9f1ff]'
      : 'border-[#3f5f90] bg-[#1f2e48] text-[#dbeafe] hover:bg-[#2a3d5f]';
  };

  const openModuleWorkspace = (tab: ModuleArtifactTab) => {
    setActiveModuleTab(tab);
    setIsModuleWorkspaceOpen(true);
  };

  const fetchModuleLibrary = async () => {
    setModuleLibraryLoading(true);
    setModuleLibraryError(null);
    try {
      const response = await fetch('/api/saby/module/list');
      const data: any = await response
        .json()
        .catch(() => ({ ok: false, error: 'Invalid module list response' }));
      if (!response.ok || data?.ok === false) {
        throw new Error(data?.error || 'Could not load module list.');
      }
      const items = Array.isArray(data?.items) ? data.items : [];
      setModuleLibraryItems(items);
      return items as ModuleLibraryItem[];
    } catch (error: any) {
      const message = error?.message || 'Could not load module list.';
      setModuleLibraryError(message);
      return [];
    } finally {
      setModuleLibraryLoading(false);
    }
  };

  const fetchModuleNodesCatalog = async () => {
    setModuleNodesLoading(true);
    setModuleNodesError(null);
    try {
      const response = await fetch('/api/saby/module/nodes');
      const data: any = await response
        .json()
        .catch(() => ({ ok: false, error: 'Invalid nodes response' }));
      if (!response.ok || data?.ok === false) {
        throw new Error(data?.error || 'Could not load nodes.');
      }
      setModuleNodeLevels(Array.isArray(data?.levels) ? data.levels : []);
      setModuleNodeList(Array.isArray(data?.nodes) ? data.nodes : []);
      setModuleFamilyRoots(Array.isArray(data?.families) ? data.families : []);
      setModuleNodeAttributeKeys(
        Array.isArray(data?.attributeKeys)
          ? data.attributeKeys.map((key: any) => String(key)).filter(Boolean)
          : []
      );
    } catch (error: any) {
      setModuleNodesError(error?.message || 'Could not load nodes.');
    } finally {
      setModuleNodesLoading(false);
    }
  };

  const fetchModuleRolesCatalog = async () => {
    setModuleRolesLoading(true);
    setModuleRolesError(null);
    try {
      const response = await fetch('/api/saby/module/roles');
      const data: any = await response
        .json()
        .catch(() => ({ ok: false, error: 'Invalid roles response' }));
      if (!response.ok || data?.ok === false) {
        throw new Error(data?.error || 'Could not load roles.');
      }
      setModuleRoleList(Array.isArray(data?.roles) ? data.roles : []);
    } catch (error: any) {
      setModuleRolesError(error?.message || 'Could not load roles.');
    } finally {
      setModuleRolesLoading(false);
    }
  };

  const openModuleFromLibrary = (item: ModuleLibraryItem) => {
    if (!item?.projectFormId) return;
    setIsModuleLibraryMenuOpen(false);
    const formId = encodeURIComponent(item.projectFormId);
    const pid = encodeURIComponent(item.projectId);
    router.push(`/studio/workspace/${formId}?tab=general&projectId=${pid}`);
  };

  const deleteActiveModule = async () => {
    if (!activeModuleRecordId) {
      postModuleUpdateSummary('No saved module selected for deletion.');
      return;
    }
    const approved = window.confirm(
      'Delete this module (soft delete)? You can restore it later from backend deleted records.'
    );
    if (!approved) return;
    try {
      const response = await fetch(
        `/api/saby/module/${encodeURIComponent(activeModuleRecordId)}/delete`,
        {
          method: 'PATCH',
        }
      );
      const data: any = await response
        .json()
        .catch(() => ({ ok: false, error: 'Invalid delete response' }));
      if (!response.ok || data?.ok === false) {
        throw new Error(data?.error || 'Module delete failed.');
      }
      setModuleLibraryItems((current) =>
        current.filter((item) => item.projectFormId !== activeModuleRecordId)
      );
      setActiveModuleRecordId(null);
      dispatchModuleDraft({ type: 'reset' });
      setIsModuleWorkspaceOpen(false);
      postModuleUpdateSummary('Module deleted (soft delete) successfully.');
    } catch (error: any) {
      postModuleUpdateSummary(
        error?.message || 'Could not delete selected module.'
      );
    }
  };

  const fetchModuleTemplateCatalog = async (
    query?: string,
    options?: { suppressErrorThrow?: boolean }
  ) => {
    setModuleTemplateLibraryLoading(true);
    setModuleTemplateLibraryError(null);
    const params = new URLSearchParams();
    params.set('limit', '200');
    if (query) params.set('q', query);
    try {
      const response = await fetch(
        `/api/saby/module/templates?${params.toString()}`
      );
      const data: any = await response
        .json()
        .catch(() => ({ ok: false, error: 'Invalid template response' }));
      if (!response.ok || data?.ok === false) {
        throw new Error(data?.error || 'Could not load module templates.');
      }
      const templates = Array.isArray(data?.templates) ? data.templates : [];
      setModuleTemplateCatalog(templates);
      return templates as ModuleTemplateCatalogItem[];
    } catch (error: any) {
      const message = error?.message || 'Could not load module templates.';
      setModuleTemplateLibraryError(message);
      if (options?.suppressErrorThrow) {
        return [];
      }
      throw error;
    } finally {
      setModuleTemplateLibraryLoading(false);
    }
  };

  const loadTemplateIntoDraft = async (templateId: string) => {
    const response = await fetch(
      `/api/saby/module/templates/${encodeURIComponent(templateId)}`
    );
    const data: any = await response
      .json()
      .catch(() => ({ ok: false, error: 'Invalid template load response' }));
    if (!response.ok || data?.ok === false || !data?.draft) {
      throw new Error(data?.error || 'Could not load selected template.');
    }
    dispatchModuleDraft({ type: 'initialize', draft: data.draft });
    setModuleWizardSavedStates({});
    setActiveModuleRecordId(null);
    setModuleTemplateBaseline(data.draft);
    setModuleTemplateInfo(data.template || null);
    return data;
  };

  const loadTemplatePreview = async (templateId: string) => {
    setModuleTemplatePreviewLoading(true);
    setModuleTemplatePreviewError(null);
    try {
      const response = await fetch(
        `/api/saby/module/templates/${encodeURIComponent(templateId)}`
      );
      const data: any = await response.json().catch(() => ({
        ok: false,
        error: 'Invalid template preview response',
      }));
      if (!response.ok || data?.ok === false || !data?.draft) {
        throw new Error(data?.error || 'Could not preview selected template.');
      }
      setModuleTemplatePreviewDraft(data.draft);
      return data;
    } catch (error: any) {
      const message = error?.message || 'Could not preview selected template.';
      setModuleTemplatePreviewError(message);
      return null;
    } finally {
      setModuleTemplatePreviewLoading(false);
    }
  };

  const handleTemplateDashboardPreview = async (
    item: ModuleTemplateCatalogItem,
    panel: 'preview' | 'json' = 'preview'
  ) => {
    setModuleTemplatePreviewItem(item);
    setModuleTemplatePreviewPanel(panel);
    await loadTemplatePreview(item.id);
  };

  const handleTemplateDashboardUse = async (
    item: ModuleTemplateCatalogItem
  ) => {
    try {
      const loaded = await loadTemplateIntoDraft(item.id);
      const loadedFields = Array.isArray(loaded?.draft?.fields)
        ? loaded.draft.fields.length
        : 0;
      setModuleTemplatePreviewItem(item);
      setModuleTemplatePreviewDraft(loaded?.draft || null);
      setIsModuleLibraryMenuOpen(false);
      setActiveToolCommand('/module');
      openModuleWorkspace('preview');
      postModuleUpdateSummary(
        `Loaded template "${item.name}" (${item.id}) with ${loadedFields} fields into Module Workspace.`
      );
    } catch (error: any) {
      postModuleUpdateSummary(
        `Could not load template "${item.name}": ${error?.message || 'Unexpected error.'}`
      );
    }
  };

  const handleTemplateDashboardCompare = async (
    item: ModuleTemplateCatalogItem
  ) => {
    const previewData = await loadTemplatePreview(item.id);
    if (!previewData?.draft) return;
    setModuleTemplatePreviewItem(item);
    setModuleTemplatePreviewDraft(previewData.draft);
    setModuleTemplateBaseline(previewData.draft);
    setModuleTemplateInfo({
      id: item.id,
      name: item.name,
      industry: item.industry,
      category: item.category,
    });
    if (!moduleDraft) {
      postModuleUpdateSummary(
        `Template baseline set to "${item.name}". Load or create a module draft to compare diff.`
      );
      return;
    }
    const diff = computeModuleTemplateDiff(previewData.draft, moduleDraft);
    if (!diff || !diff.hasChanges) {
      postModuleUpdateSummary(
        `Current module matches template "${item.name}" on tracked fields/workflow/payment.`
      );
      return;
    }
    postModuleUpdateSummary(
      `Template diff vs "${item.name}": +${diff.addedFields.length} added, -${diff.removedFields.length} removed, ${diff.changedFields.length} changed, workflow ${diff.workflowChanged ? 'changed' : 'same'}, payment policy ${diff.paymentChanged ? 'changed' : 'same'}, payment config ${diff.paymentConfigChanged ? 'changed' : 'same'}.`
    );
  };

  const buildDraftWithBufferedPaymentSettings = (strict: boolean) => {
    if (!moduleDraft) return { draft: null as any, errors: [] as string[] };
    const cloned = JSON.parse(JSON.stringify(moduleDraft)) as any;
    const policies = Array.isArray(cloned?.payment?.policies)
      ? cloned.payment.policies
      : [];
    const errors: string[] = [];
    const nextFieldErrors: Record<string, string> = {};
    policies.forEach((policy: any, index: number) => {
      const key = String(policy?.id || index);
      if (!(key in paymentSettingsBuffers)) return;
      const raw = String(paymentSettingsBuffers[key] || '').trim();
      if (!raw) {
        policy.settings = {};
        nextFieldErrors[key] = '';
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('Settings must be a JSON object.');
        }
        policy.settings = parsed;
        nextFieldErrors[key] = '';
      } catch (error: any) {
        const message = error?.message || 'Invalid JSON';
        errors.push(`Policy ${index + 1}: ${message}`);
        nextFieldErrors[key] = message;
      }
    });
    if (Object.keys(nextFieldErrors).length > 0) {
      setPaymentSettingsErrors((prev) => ({ ...prev, ...nextFieldErrors }));
    }
    return strict
      ? { draft: cloned, errors }
      : { draft: cloned, errors: [] as string[] };
  };

  const submitModuleDraft = async (dryRun: boolean) => {
    if (!moduleDraft) return null;
    const normalized = buildDraftWithBufferedPaymentSettings(true);
    if (normalized.errors.length > 0) {
      throw new Error(
        `Fix Payment Policy advanced settings: ${normalized.errors.join(' | ')}`
      );
    }
    setIsModuleSubmitting(true);
    try {
      const response = await fetch('/api/saby/module/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draft: normalized.draft,
          dryRun,
          projectFormId: activeModuleRecordId || undefined,
        }),
      });
      const data: any = await response
        .json()
        .catch(() => ({ ok: false, error: 'Invalid module submit response' }));
      if (!response.ok || data?.ok === false) {
        throw new Error(data?.error || 'Module submission failed.');
      }
      if (dryRun) {
        setModuleSubmitDryRun(data);
      } else {
        setModuleSubmitResult(data);
        setModuleLifecycleStage('approved');
        const savedId =
          data?.result?.projectForm?._id ||
          data?.result?.projectForm?.id ||
          data?.result?.projectFormId ||
          data?.result?.id ||
          null;
        if (savedId) {
          setActiveModuleRecordId(String(savedId));
          void fetchModuleLibrary();
        }
      }
      return data;
    } finally {
      setIsModuleSubmitting(false);
    }
  };

  const saveModuleDraftRecord = async (options?: { silent?: boolean }) => {
    const silent = Boolean(options?.silent);
    if (!moduleDraft) return null;
    const normalized = buildDraftWithBufferedPaymentSettings(!silent);
    if (!silent && normalized.errors.length > 0) {
      throw new Error(
        `Fix Payment Policy advanced settings: ${normalized.errors.join(' | ')}`
      );
    }
    if (!silent) setIsModuleSubmitting(true);
    if (silent) setIsModuleAutoSaving(true);
    try {
      const response = await fetch('/api/saby/module/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draft: normalized.draft,
          projectFormId: activeModuleRecordId || undefined,
        }),
      });
      const data: any = await response
        .json()
        .catch(() => ({ ok: false, error: 'Invalid module save response' }));
      if (!response.ok || data?.ok === false) {
        throw new Error(data?.error || 'Module draft save failed.');
      }
      const savedId =
        data?.result?.projectForm?._id ||
        data?.result?.projectForm?.id ||
        data?.result?.projectFormId ||
        data?.result?.id ||
        null;
      if (savedId) {
        setActiveModuleRecordId(String(savedId));
        await fetchModuleLibrary();
      }
      setModuleLastSavedAt(new Date().toISOString());
      moduleLastAutosaveSignatureRef.current = JSON.stringify(normalized.draft);
      return data;
    } finally {
      if (!silent) setIsModuleSubmitting(false);
      if (silent) setIsModuleAutoSaving(false);
    }
  };

  const saveModuleWizardStep = async (tab: ModuleArtifactTab) => {
    if (tab === 'payment') {
      const hasPaymentJsonErrors = Object.values(paymentSettingsErrors).some(
        (value) => Boolean(String(value || '').trim())
      );
      if (hasPaymentJsonErrors) {
        throw new Error(
          'Fix Payment Policy advanced settings JSON errors before saving.'
        );
      }
    }

    if (tab === 'payment_config') {
      const paymentEnabled = Boolean(moduleDraft?.payment?.enabled);
      const configEnabled = Boolean(paymentConfigDraft.enabled);
      const enabledChannels = Array.isArray(paymentConfigDraft.enabledChannels)
        ? paymentConfigDraft.enabledChannels
        : [];
      if (paymentEnabled && !configEnabled) {
        throw new Error(
          'Payment policy is enabled. Enable Payment Config before saving this step.'
        );
      }
      if (configEnabled && enabledChannels.length === 0) {
        throw new Error(
          'Select at least one payment channel before saving Payment Config.'
        );
      }
      if (
        configEnabled &&
        !String(paymentConfigDraft.defaultChannel || '').trim()
      ) {
        throw new Error(
          'Set a default payment channel before saving Payment Config.'
        );
      }
      if (
        paymentConfigDraft.defaultChannel &&
        !enabledChannels.includes(String(paymentConfigDraft.defaultChannel))
      ) {
        throw new Error(
          'Default payment channel must be included in enabled channels.'
        );
      }
    }

    const blockers = getModuleWizardStepBlockers(tab);
    if (blockers.length > 0) {
      throw new Error(blockers[0]);
    }
    const data = await saveModuleDraftRecord();
    setModuleWizardSavedStates((current) => ({
      ...current,
      [tab]: getModuleWizardSignature(tab),
    }));
    return data;
  };

  const getModuleWizardSaveSuccessMessage = (tab: ModuleArtifactTab) => {
    switch (tab) {
      case 'payment':
        return 'Payment Policy saved successfully.';
      case 'payment_config':
        return 'Payment Config saved successfully.';
      default: {
        const step = moduleWizardSteps.find((item) => item.key === tab);
        return `${step?.label || 'Step'} saved successfully.`;
      }
    }
  };

  const handleModuleWizardPrimaryAction = async () => {
    if (!moduleWizardCurrentStep) return;
    if (moduleWizardCurrentStep.key === 'review') {
      if (moduleLifecycleStage === 'published') return;
      if (moduleLifecycleStage === 'approved') {
        await runModuleLifecycleAction('publish');
        setModuleLifecycleStage('published');
        postModuleUpdateSummary('Module published successfully.');
        return;
      }
      const data = await submitModuleDraft(false);
      const projectId =
        data?.result?.projectForm?.projectId ||
        data?.result?.projectId ||
        'unknown';
      const wasUpdate =
        String(data?.operation || '').toLowerCase() === 'update';
      setModuleWizardSavedStates((current) => ({
        ...current,
        review: getModuleWizardSignature('review'),
      }));
      postModuleUpdateSummary(
        wasUpdate
          ? `Module updated successfully and is ready for publish with projectId ${projectId}.`
          : `Module submitted successfully and is ready for publish with projectId ${projectId}.`
      );
      return;
    }

    if (!moduleWizardCurrentStepSaved) {
      await saveModuleWizardStep(moduleWizardCurrentStep.key);
      postModuleUpdateSummary(
        getModuleWizardSaveSuccessMessage(moduleWizardCurrentStep.key)
      );
      return;
    }

    if (moduleWizardNextStep) {
      setActiveModuleTab(moduleWizardNextStep.key);
      if (typeof window !== 'undefined') {
        window.requestAnimationFrame(() => {
          const container = document.querySelector(
            '[data-module-workspace-scroll="true"]'
          );
          if (container instanceof HTMLElement) {
            container.scrollTo({ top: 0, behavior: 'smooth' });
          }
        });
      }
    }
  };

  const runModuleLifecycleAction = async (
    action: 'submit_review' | 'approve' | 'publish' | 'archive',
    projectFormIdOverride?: string | null
  ) => {
    const currentId = (
      projectFormIdOverride ||
      activeModuleRecordId ||
      ''
    ).trim();
    if (!currentId) {
      throw new Error('Save draft first before running lifecycle actions.');
    }
    const response = await fetch('/api/saby/module/lifecycle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectFormId: currentId,
        action,
      }),
    });
    const data: any = await response
      .json()
      .catch(() => ({ ok: false, error: 'Invalid lifecycle response' }));
    if (!response.ok || data?.ok === false) {
      throw new Error(data?.error || `Failed to ${action}.`);
    }
    await fetchModuleLibrary();
    return data;
  };

  const handleModuleLifecycleAction = (
    action: 'save_draft' | 'submit_review' | 'approve' | 'publish' | 'archive'
  ) => {
    if (action === 'save_draft') {
      void (async () => {
        try {
          const data = await saveModuleDraftRecord();
          const wasUpdate =
            String(data?.operation || '').toLowerCase() === 'update';
          const projectId =
            data?.result?.projectForm?.projectId ||
            data?.result?.projectId ||
            'unknown';
          setModuleLifecycleStage('draft');
          postModuleUpdateSummary(
            wasUpdate
              ? `Draft saved to existing module (projectId: ${projectId}).`
              : `Draft saved as new module (projectId: ${projectId}).`
          );
        } catch (error: any) {
          postModuleUpdateSummary(
            `Draft save failed: ${error?.message || 'Unexpected error.'}`
          );
        }
      })();
      return;
    }
    void (async () => {
      try {
        setIsModuleSubmitting(true);
        let lifecycleTargetId = activeModuleRecordId;
        if (action === 'publish' && !lifecycleTargetId) {
          const saved = await saveModuleDraftRecord({ silent: true });
          const savedId =
            saved?.result?.projectForm?._id ||
            saved?.result?.projectForm?.id ||
            saved?.result?.projectFormId ||
            saved?.result?.id ||
            null;
          lifecycleTargetId = savedId ? String(savedId) : null;
        }
        await runModuleLifecycleAction(action, lifecycleTargetId);
        const nextStatusByAction: Record<
          Exclude<typeof action, 'save_draft'>,
          typeof moduleLifecycleStage
        > = {
          submit_review: 'in_review',
          approve: 'approved',
          publish: 'published',
          archive: 'archived',
        };
        const nextStatus =
          nextStatusByAction[action as Exclude<typeof action, 'save_draft'>];
        setModuleLifecycleStage(nextStatus);
        postModuleUpdateSummary(
          `Module lifecycle updated: ${nextStatus.replace('_', ' ')}.`
        );
      } catch (error: any) {
        postModuleUpdateSummary(
          `Lifecycle action failed (${action}): ${error?.message || 'Unexpected error.'}`
        );
      } finally {
        setIsModuleSubmitting(false);
      }
    })();
  };

  const handleModuleNameChange = (value: string) => {
    dispatchModuleDraft({
      type: 'apply_operation',
      operation: {
        type: 'set_module_name',
        payload: { projectName: value },
        source: 'ui',
        createdAt: new Date().toISOString(),
      },
    });
  };

  const postModuleUpdateSummary = (text: string) => {
    const assistantTurn: ChatTurn = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      text,
    };
    setTypingAssistantTurnId(assistantTurn.id);
    setChatTurns((current) => {
      const next = [...current, assistantTurn];
      updateActiveHistory(next);
      return next;
    });
  };

  const handleModuleFieldUpdate = (
    fieldId: string,
    patch: {
      label?: string;
      kind?: string;
      required?: boolean;
      options?: string[] | undefined;
    }
  ) => {
    if (!moduleDraft) return;
    const field = moduleDraft.fields.find((f) => f.id === fieldId);
    if (!field) return;
    const nextValidation =
      patch.required == null
        ? field.validation
        : {
            ...(field.validation || {}),
            required: patch.required,
          };
    dispatchModuleDraft({
      type: 'apply_operation',
      operation: {
        type: 'update_field',
        payload: {
          fieldId,
          ...(patch.label != null ? { label: patch.label } : {}),
          ...(patch.kind != null ? { kind: patch.kind } : {}),
          ...(patch.options !== undefined ? { options: patch.options } : {}),
          validation: nextValidation,
        },
        source: 'ui',
        createdAt: new Date().toISOString(),
      },
    });
  };

  const handleModuleAddField = () => {
    dispatchModuleDraft({
      type: 'apply_operation',
      operation: {
        type: 'add_field',
        payload: {
          label: 'New Field',
          kind: 'text',
        },
        source: 'ui',
        createdAt: new Date().toISOString(),
      },
    });
    postModuleUpdateSummary('Added new field to module draft.');
  };

  const handleModuleRemoveField = (fieldId: string) => {
    dispatchModuleDraft({
      type: 'apply_operation',
      operation: {
        type: 'remove_field',
        payload: { fieldId },
        source: 'ui',
        createdAt: new Date().toISOString(),
      },
    });
    postModuleUpdateSummary('Removed field from module draft.');
  };

  const handleModuleWorkflowToggle = (enabled: boolean) => {
    dispatchModuleDraft({
      type: 'apply_operation',
      operation: {
        type: 'toggle_workflow',
        payload: { enabled },
        source: 'ui',
        createdAt: new Date().toISOString(),
      },
    });
  };

  const handleModuleWorkflowAddStep = () => {
    const order = (moduleDraft?.workflow.steps.length || 0) + 1;
    const defaultRole = moduleRoleList[0]?.name || 'Admin';
    dispatchModuleDraft({
      type: 'apply_operation',
      operation: {
        type: 'add_workflow_step',
        payload: {
          name: `Step ${order}`,
          actionType: 'APPROVE',
          allowedRoles: [defaultRole],
          requiredApprovals: 1,
          order,
        },
        source: 'ui',
        createdAt: new Date().toISOString(),
      },
    });
    postModuleUpdateSummary('Added workflow step.');
  };

  const handleModuleWorkflowUpdateStep = (
    stepId: string,
    patch: { name?: string; roles?: string[] }
  ) => {
    const current = moduleDraft?.workflow.steps.find((s) => s.id === stepId);
    if (!current) return;
    dispatchModuleDraft({
      type: 'apply_operation',
      operation: {
        type: 'update_workflow_step',
        payload: {
          stepId,
          ...(patch.name != null ? { name: patch.name } : {}),
          ...(patch.roles != null ? { allowedRoles: patch.roles } : {}),
          requiredApprovals: current.requiredApprovals || 1,
        },
        source: 'ui',
        createdAt: new Date().toISOString(),
      },
    });
  };

  const handleModuleWorkflowToggleRole = (stepId: string, roleName: string) => {
    const current = moduleDraft?.workflow.steps.find((s) => s.id === stepId);
    if (!current) return;
    const currentRoles = Array.isArray(current.allowedRoles)
      ? current.allowedRoles
      : [];
    const nextRoles = currentRoles.includes(roleName)
      ? currentRoles.filter((role) => role !== roleName)
      : [...currentRoles, roleName];
    handleModuleWorkflowUpdateStep(stepId, { roles: nextRoles });
  };

  const handleModuleWorkflowIncidentNotificationToggle = (enabled: boolean) => {
    dispatchModuleDraft({
      type: 'apply_operation',
      operation: {
        type: 'set_workflow_notifications',
        payload: { onEveryIncident: enabled },
        source: 'ui',
        createdAt: new Date().toISOString(),
      },
    });
  };

  const handleModuleWorkflowRemoveStep = (stepId: string) => {
    dispatchModuleDraft({
      type: 'apply_operation',
      operation: {
        type: 'remove_workflow_step',
        payload: { stepId },
        source: 'ui',
        createdAt: new Date().toISOString(),
      },
    });
    postModuleUpdateSummary('Removed workflow step.');
  };

  const handleModulePaymentUpdate = (patch: Record<string, unknown>) => {
    dispatchModuleDraft({
      type: 'apply_operation',
      operation: {
        type: 'set_payment_config',
        payload: patch,
        source: 'ui',
        createdAt: new Date().toISOString(),
      },
    });
  };

  const handleModulePaymentConfigUpdate = (patch: Record<string, unknown>) => {
    const existingConfig =
      moduleDraft?.payment?.config &&
      typeof moduleDraft.payment.config === 'object'
        ? moduleDraft.payment.config
        : { enabled: false, enabledChannels: [] };
    handleModulePaymentUpdate({
      config: {
        ...existingConfig,
        ...patch,
      },
    });
  };

  const handleModulePaymentConfigToggleChannel = (
    channel: 'sabypipe' | 'paystack' | 'flutterwave'
  ) => {
    const existingConfig =
      moduleDraft?.payment?.config &&
      typeof moduleDraft.payment.config === 'object'
        ? moduleDraft.payment.config
        : { enabled: false, enabledChannels: [] };
    const currentChannels = Array.isArray(existingConfig.enabledChannels)
      ? existingConfig.enabledChannels.map((item: any) =>
          String(item).toLowerCase()
        )
      : [];
    const hasChannel = currentChannels.includes(channel);
    const nextChannels = hasChannel
      ? currentChannels.filter((item) => item !== channel)
      : [...currentChannels, channel];
    const nextDefault =
      nextChannels.length === 0
        ? undefined
        : nextChannels.includes(
              String(existingConfig.defaultChannel || '').toLowerCase()
            )
          ? existingConfig.defaultChannel
          : nextChannels[0];
    handleModulePaymentConfigUpdate({
      enabledChannels: nextChannels,
      defaultChannel: nextDefault,
    });
  };

  const handleModulePaymentConfigSetDefault = (channel: string) => {
    if (!['sabypipe', 'paystack', 'flutterwave'].includes(channel)) {
      handleModulePaymentConfigUpdate({ defaultChannel: undefined });
      return;
    }
    const existingConfig =
      moduleDraft?.payment?.config &&
      typeof moduleDraft.payment.config === 'object'
        ? moduleDraft.payment.config
        : { enabled: false, enabledChannels: [] };
    const currentChannels = Array.isArray(existingConfig.enabledChannels)
      ? existingConfig.enabledChannels.map((item: any) =>
          String(item).toLowerCase()
        )
      : [];
    const nextChannels = currentChannels.includes(channel)
      ? currentChannels
      : [...currentChannels, channel];
    handleModulePaymentConfigUpdate({
      enabledChannels: nextChannels,
      defaultChannel: channel,
    });
  };

  const handleModuleBehaviorUpdate = (patch: Record<string, unknown>) => {
    dispatchModuleDraft({
      type: 'apply_operation',
      operation: {
        type: 'set_behavior_hooks',
        payload: patch,
        source: 'ui',
        createdAt: new Date().toISOString(),
      },
    });
  };

  const paymentPolicies = useMemo(() => {
    const raw = (moduleDraft?.payment as any)?.policies;
    return Array.isArray(raw) ? raw : [];
  }, [moduleDraft?.payment]);
  const paymentConfigDraft = useMemo(() => {
    const raw = (moduleDraft?.payment as any)?.config;
    if (!raw || typeof raw !== 'object') {
      return {
        enabled: false,
        defaultChannel: '',
        enabledChannels: [] as string[],
      };
    }
    return {
      enabled: Boolean(raw.enabled),
      defaultChannel: String(raw.defaultChannel || '').toLowerCase(),
      enabledChannels: Array.isArray(raw.enabledChannels)
        ? raw.enabledChannels.map((item: any) => String(item).toLowerCase())
        : [],
      processorSettings:
        raw.processorSettings && typeof raw.processorSettings === 'object'
          ? raw.processorSettings
          : {},
    };
  }, [moduleDraft?.payment]);
  const paymentPolicySummary = useMemo(() => {
    const nodeById = new Map(
      moduleNodeList.map((node) => [String(node.id), node])
    );
    const childMap = new Map<string, string[]>();
    moduleNodeList.forEach((node) => {
      const parentId = String(node.parentId || '');
      if (!parentId) return;
      const current = childMap.get(parentId) || [];
      current.push(String(node.id));
      childMap.set(parentId, current);
    });
    const descendantCount = (rootId: string) => {
      if (!rootId) return 0;
      const queue = [rootId];
      const visited = new Set<string>();
      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;
        visited.add(current);
        const children = childMap.get(current) || [];
        for (const child of children) queue.push(child);
      }
      return visited.size;
    };
    const categoryMatchCount = (scopeRef: string) => {
      const raw = String(scopeRef || '').trim();
      if (!raw) return 0;
      const [key, value] = raw.includes('=') ? raw.split('=') : raw.split(':');
      const path = String(key || '').trim();
      const expected = String(value || '')
        .trim()
        .toLowerCase();
      if (!path || !expected) return 0;
      return moduleNodeList.filter((node) => {
        const nodeValue = deepGet(node?.attributes || {}, path);
        return String(nodeValue ?? '').toLowerCase() === expected;
      }).length;
    };

    const totals = {
      total: paymentPolicies.length,
      steady: 0,
      active: 0,
      estimatedImpactedNodes: 0,
    };
    for (const policy of paymentPolicies) {
      const mode = normalizeIncomeMode(
        String((policy as any)?.mode || 'steady')
      );
      if (mode === 'active') totals.active += 1;
      else totals.steady += 1;
      const scopeType = String((policy as any)?.scopeType || 'node');
      const scopeRef = String((policy as any)?.scopeRef || '');
      if (scopeType === 'all') {
        totals.estimatedImpactedNodes += moduleNodeList.length;
      } else if (scopeType === 'node') {
        totals.estimatedImpactedNodes +=
          scopeRef && nodeById.has(scopeRef) ? 1 : 0;
      } else if (scopeType === 'family') {
        totals.estimatedImpactedNodes += descendantCount(scopeRef);
      } else if (scopeType === 'level') {
        totals.estimatedImpactedNodes += moduleNodeList.filter(
          (n) => String(n.levelId) === scopeRef
        ).length;
      } else if (scopeType === 'category') {
        totals.estimatedImpactedNodes += categoryMatchCount(scopeRef);
      }
    }
    return totals;
  }, [paymentPolicies, moduleNodeList]);

  const handleModuleDateTriggersUpdate = (nextTriggers: any[]) => {
    handleModuleBehaviorUpdate({ dateTriggers: nextTriggers });
  };

  const handleModuleFilePoliciesUpdate = (nextPolicies: any[]) => {
    handleModuleBehaviorUpdate({ filePolicies: nextPolicies });
  };

  const handleAddUtility = (type: any, fieldKey?: string) => {
    const fields = Array.isArray(moduleDraft?.fields) ? moduleDraft.fields : [];
    const field = fieldKey
      ? fields.find((f: any) => f.key === fieldKey)
      : undefined;
    const next = [
      ...draftUtilities,
      buildUtilityTemplate(type, field as any, draftUtilities.length),
    ];
    handleModuleBehaviorUpdate({ utilities: next });
    postModuleUpdateSummary(
      `Added utility: ${utilityTypeLabels[type as keyof typeof utilityTypeLabels] || type}.`
    );
  };

  const handleUpdateUtility = (
    index: number,
    patch: Record<string, unknown>
  ) => {
    const next = [...draftUtilities];
    const current = next[index] || {};
    next[index] = { ...current, ...patch };
    handleModuleBehaviorUpdate({ utilities: next });
  };

  const handleRemoveUtility = (index: number) => {
    const next = draftUtilities.filter((_: any, i: number) => i !== index);
    handleModuleBehaviorUpdate({ utilities: next });
  };

  const handlePaymentPolicyAdd = () => {
    const firstNode = moduleNodeList[0];
    handleModulePaymentUpdate({
      policies: [
        ...paymentPolicies,
        {
          id: `pay_policy_${Date.now().toString(36)}`,
          name: 'Collection Policy',
          active: true,
          priority: paymentPolicies.length + 1,
          scopeType: 'node',
          scopeRef: firstNode?.id || '',
          mode: 'steady',
          fixedAmount: 0,
          formula: '',
          approverRoles: [],
          activeConfig: {
            deriveFrom: 'field_percentage',
            fieldKey: '',
            percentage: 10,
            nodeAttributeKey: '',
            expression: '',
            conditionExpression: '',
          },
          conditions: [],
          breakdown: [
            {
              id: `line_${Date.now().toString(36)}`,
              recipientType: 'platform',
              mode: 'percentage',
              value: 100,
            },
          ],
          enforcement: {
            requiredOnSubmission: true,
            blockSubmissionOnFailure: true,
          },
        },
      ],
    });
  };

  const buildActiveIncomeFormula = (policy: any) => {
    const cfg = policy?.activeConfig || {};
    const deriveFrom = String(cfg?.deriveFrom || 'field_percentage');
    const fieldKey = String(cfg?.fieldKey || '').trim();
    const pct = Number(cfg?.percentage || 0);
    const nodeAttr = String(cfg?.nodeAttributeKey || '').trim();
    const expression = String(cfg?.expression || '').trim();
    const conditionExpression = String(cfg?.conditionExpression || '').trim();

    const fieldExpr = fieldKey ? `field.${fieldKey}` : '0';
    const pctExpr = pct > 0 ? `${fieldExpr} * ${pct / 100}` : '';
    const nodeExpr = nodeAttr ? `node.${nodeAttr}` : '';

    if (deriveFrom === 'field_percentage') return pctExpr || expression || '0';
    if (deriveFrom === 'expression') return expression || pctExpr || '0';
    if (deriveFrom === 'node_attribute') return nodeExpr || expression || '0';

    const parts = [pctExpr, expression, nodeExpr].filter(Boolean);
    const combined = parts.length ? parts.join(' + ') : '0';
    return conditionExpression
      ? `((${conditionExpression}) ? (${combined}) : 0)`
      : combined;
  };

  const handlePaymentPolicyUpdate = (
    index: number,
    patch: Record<string, unknown>
  ) => {
    const next = [...paymentPolicies];
    const current = next[index] || {};
    const merged = { ...current, ...patch } as any;
    merged.mode = normalizeIncomeMode(String(merged?.mode || 'steady'));
    if (merged.mode === 'active') {
      merged.formula = buildActiveIncomeFormula(merged);
    }
    next[index] = merged;
    handleModulePaymentUpdate({ policies: next });
  };

  const handlePaymentPolicyRemove = (index: number) => {
    const next = paymentPolicies.filter((_, i) => i !== index);
    handleModulePaymentUpdate({ policies: next });
  };

  const handleApplyPaymentPreset = (
    index: number,
    preset: {
      deriveFrom:
        | 'field_percentage'
        | 'expression'
        | 'node_attribute'
        | 'combined';
      expression?: string;
      percentage?: number;
      fieldKeyHint?: string;
      nodeAttributeHint?: string;
    }
  ) => {
    const fields = Array.isArray(moduleDraft?.fields) ? moduleDraft.fields : [];
    const numericFields = fields.filter((field: any) =>
      ['number'].includes(String(field?.kind || '').toLowerCase())
    );
    const matchedField =
      numericFields.find(
        (field: any) =>
          String(field.key || '').toLowerCase() ===
          String(preset.fieldKeyHint || '').toLowerCase()
      ) || numericFields[0];
    const matchedAttr =
      moduleNodeAttributeKeys.find(
        (key) =>
          key.toLowerCase() ===
          String(preset.nodeAttributeHint || '').toLowerCase()
      ) ||
      moduleNodeAttributeKeys[0] ||
      '';
    handlePaymentPolicyUpdate(index, {
      mode: 'active',
      activeConfig: {
        deriveFrom: preset.deriveFrom,
        fieldKey: matchedField?.key || '',
        percentage: Number(preset.percentage || 0),
        nodeAttributeKey: matchedAttr,
        expression: String(preset.expression || ''),
      },
    });
  };

  const commitPaymentSettingsBuffer = (policyKey: string, index: number) => {
    const raw = String(paymentSettingsBuffers[policyKey] || '').trim();
    if (!raw) {
      setPaymentSettingsErrors((prev) => ({ ...prev, [policyKey]: '' }));
      handlePaymentPolicyUpdate(index, { settings: {} });
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        setPaymentSettingsErrors((prev) => ({
          ...prev,
          [policyKey]: 'Settings must be a JSON object.',
        }));
        return;
      }
      setPaymentSettingsErrors((prev) => ({ ...prev, [policyKey]: '' }));
      handlePaymentPolicyUpdate(index, { settings: parsed });
    } catch (error: any) {
      setPaymentSettingsErrors((prev) => ({
        ...prev,
        [policyKey]: error?.message || 'Invalid JSON.',
      }));
    }
  };

  const handleFollowUpBadgeInsert = (value: string) => {
    const raw = String(value || '').trim();
    if (!raw) return;

    const isRoleOrNodeUserFlow =
      /^\/user\s+(assign role|unassign role)/i.test(raw) ||
      /^\/node\s+(assign user|unassign user)/i.test(raw) ||
      /^\/(assign user|unassign user)/i.test(raw);

    if (isRoleOrNodeUserFlow) {
      const normalized = raw
        .replace(/^\/user\s+/i, '')
        .replace(/^\/node\s+/i, '')
        .replace(/^\//, '')
        .trim();
      setActiveToolCommand(null);
      setIsHelpMode(false);
      setPrompt(normalized);
      setTimeout(() => composerInputRef.current?.focus(), 0);
      return;
    }

    const matchedTool = commandTools.find((tool) =>
      raw.toLowerCase().startsWith(`${tool.command} `)
    );

    if (matchedTool) {
      const nextPrompt = raw.slice(matchedTool.command.length).trim();
      setActiveToolCommand(matchedTool.command);
      setIsHelpMode(false);
      setPrompt(nextPrompt);
      setTimeout(() => composerInputRef.current?.focus(), 0);
      return;
    }

    if (raw.startsWith('/')) {
      setPrompt(raw.replace(/^\//, ''));
      setTimeout(() => composerInputRef.current?.focus(), 0);
      return;
    }

    setPrompt(raw);
    setTimeout(() => composerInputRef.current?.focus(), 0);
  };

  const handleActivateHelpMode = () => {
    if (!isAuthenticated) {
      openQuickAuthModal(pathname || '/');
      return;
    }
    setIsHelpMode(true);
    setActiveToolCommand(null);
    setIsToolsMenuOpen(false);
    setTimeout(() => composerInputRef.current?.focus(), 0);
  };

  const handleGuestComposerAction = () => {
    if (!isAuthenticated) {
      openQuickAuthModal(pathname || '/');
      return;
    }
    if (isVoiceListening) {
      stopVoiceInput();
      return;
    }
    if (!hasPromptValue) {
      startVoiceInput();
      return;
    }
    void sendPromptToSaby();
  };

  const resendEditedUserTurn = useCallback(() => {
    const nextText = editingUserTurnText.trim();
    if (!editingUserTurnId || !nextText) return;
    setChatTurns((current) => {
      const next = current.map((turn) =>
        turn.id === editingUserTurnId ? { ...turn, text: nextText } : turn
      );
      updateActiveHistory(next);
      return next;
    });
    setEditingUserTurnId(null);
    setEditingUserTurnText('');
    void sendPromptToSaby(nextText);
  }, [editingUserTurnId, editingUserTurnText, sendPromptToSaby]);

  const authenticatedEntryHandoffShell = (
    <div
      className={`relative min-h-screen overflow-hidden transition-colors duration-300 ${
        isLightTheme
          ? `${publicSiteTheme.light.pageBg} ${publicSiteTheme.light.pageText}`
          : 'bg-[#0f1012] text-[#ececf1]'
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-0 ${
          isLightTheme
            ? 'bg-transparent'
            : 'bg-[radial-gradient(circle_at_22%_18%,rgba(37,99,235,0.18),rgba(4,5,8,0)_30%),radial-gradient(circle_at_78%_20%,rgba(29,78,216,0.16),rgba(4,5,8,0)_34%),radial-gradient(circle_at_50%_56%,rgba(30,64,175,0.18),rgba(4,5,8,0)_42%),linear-gradient(180deg,#050608_0%,#090b10_52%,#0e1014_100%)]'
        }`}
      />
      <div className="relative z-[1] mx-auto flex min-h-screen w-full max-w-[74rem] flex-col items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div
          className={`rounded-[2rem] border px-6 py-5 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)] ${
            isLightTheme
              ? `${publicSiteTheme.light.border} ${publicSiteTheme.light.surface} text-[#334155]`
              : 'border-white/10 bg-[#171b24]/90 text-[#d8deeb]'
          }`}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#4d81bd]">
            Preparing workspace
          </p>
          <p className="mt-3 text-base">
            {ownerOnboardingRequired
              ? 'Taking you to onboarding setup.'
              : 'Opening your workspace.'}
          </p>
        </div>
      </div>
    </div>
  );

  return shouldShowAuthenticatedEntryHandoff && !ownerOnboardingLoading ? (
    authenticatedEntryHandoffShell
  ) : (
    <div
      className={`relative min-h-screen overflow-hidden transition-colors duration-300 ${
        isLightTheme
          ? `${publicSiteTheme.light.pageBg} ${publicSiteTheme.light.pageText}`
          : 'bg-[#0f1012] text-[#ececf1]'
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-0 ${
          isLightTheme
            ? 'bg-transparent'
            : 'bg-[radial-gradient(circle_at_22%_18%,rgba(37,99,235,0.18),rgba(4,5,8,0)_30%),radial-gradient(circle_at_78%_20%,rgba(29,78,216,0.16),rgba(4,5,8,0)_34%),radial-gradient(circle_at_50%_56%,rgba(30,64,175,0.18),rgba(4,5,8,0)_42%),linear-gradient(180deg,#050608_0%,#090b10_52%,#0e1014_100%)]'
        }`}
      />

      {isAuthenticated && (
        <aside
          className={`fixed left-0 top-0 z-30 hidden h-screen flex-col border-r transition-all duration-300 lg:flex ${
            isLightTheme
              ? `${publicSiteTheme.light.border} ${publicSiteTheme.light.surfaceSoft}`
              : 'border-white/10 bg-[#17181d]'
          } ${isSidebarExpanded ? 'w-[292px]' : 'w-[88px]'}`}
        >
          <div className="flex items-center justify-end px-4 py-4">
            <button
              type="button"
              aria-label="Toggle sidebar"
              onClick={() => {
                setIsSidebarExpanded((previous) => !previous);
                setIsProfileMenuOpen(false);
              }}
              className={`ml-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-transparent transition-colors ${
                isLightTheme
                  ? 'text-[#4b5565] hover:bg-white hover:shadow-sm hover:enabled:text-gray-900'
                  : 'text-white hover:bg-white/85 hover:enabled:text-gray-900'
              }`}
            >
              <PiTextIndent className="h-auto w-9" />
            </button>
          </div>

          {isSidebarExpanded && (
            <>
              <div className="px-4 pb-2 pt-2">
                <button
                  type="button"
                  onClick={startNewChat}
                  disabled={dashboardNavLocked}
                  className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[15px] transition ${
                    isLightTheme
                      ? 'text-[#202b43] hover:bg-[#edf2ff]'
                      : 'text-[#f1f4fb] hover:bg-white/[0.06]'
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <PencilLine className="h-4 w-4" />
                  <span>New chat</span>
                </button>
                <div className="mb-2" />
                <div
                  className={`${isLightTheme ? 'border-[#d9e0ef]' : 'border-white/10'} border-t`}
                />
              </div>

              <div className="px-4 pb-2">
                <div
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
                    isLightTheme
                      ? 'border-[#cad3e4] bg-white'
                      : 'border-white/15 bg-[#202229]'
                  }`}
                >
                  <Search
                    className={`h-4 w-4 ${isLightTheme ? 'text-[#6a7389]' : 'text-[#9ca4b8]'}`}
                  />
                  <input
                    id="saby-history-search"
                    value={historySearch}
                    onChange={(event) => setHistorySearch(event.target.value)}
                    disabled={dashboardNavLocked}
                    placeholder="Search conversations"
                    className={`h-6 w-full !border-0 bg-transparent text-[14px] !outline-none !ring-0 ${
                      isLightTheme
                        ? 'text-[#111827] placeholder:text-[#7b859b]'
                        : 'text-white placeholder:text-[#9299ad]'
                    }`}
                  />
                </div>
                {sidebarNotice && (
                  <p
                    className={`mt-2 text-[11px] ${isLightTheme ? 'text-[#536483]' : 'text-[#a4adbe]'}`}
                  >
                    {sidebarNotice}
                  </p>
                )}
                <div
                  className={`mt-2 grid w-full grid-cols-2 rounded-lg p-0.5 ${
                    isLightTheme ? 'bg-[#f6f9ff]' : 'bg-white/[0.04]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setHistoryView('active')}
                    disabled={dashboardNavLocked}
                    className={`w-full rounded-md px-2.5 py-1 text-[11px] transition ${
                      historyView === 'active'
                        ? isLightTheme
                          ? 'bg-white text-[#1f2b46]'
                          : 'bg-white/[0.12] text-[#e7ecf8]'
                        : isLightTheme
                          ? 'text-[#5e6d88]'
                          : 'text-[#a7b0c2]'
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    Chats
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryView('archived')}
                    disabled={dashboardNavLocked}
                    className={`w-full rounded-md px-2.5 py-1 text-[11px] transition ${
                      historyView === 'archived'
                        ? isLightTheme
                          ? 'bg-white text-[#1f2b46]'
                          : 'bg-white/[0.12] text-[#e7ecf8]'
                        : isLightTheme
                          ? 'text-[#5e6d88]'
                          : 'text-[#a7b0c2]'
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    Archived
                  </button>
                </div>
              </div>

              <div
                ref={historyMenuRef}
                className="custom-scrollbar flex-1 overflow-y-auto px-3 pb-5 pt-2"
              >
                <div
                  className={`${isLightTheme ? 'border-[#d9e0ef]' : 'border-white/10'} mb-2 border-t`}
                />
                <div className="space-y-1">
                  {filteredSidebarHistory.length === 0 ? (
                    <p
                      className={`rounded-lg px-3 py-2 text-xs ${
                        isLightTheme ? 'text-[#6f7d96]' : 'text-[#a6a9b6]'
                      }`}
                    >
                      {historyView === 'archived'
                        ? 'No archived chats found.'
                        : 'No matching conversations found.'}
                    </p>
                  ) : (
                    filteredSidebarHistory.map((entry) => (
                      <div key={entry.id} className="relative">
                        <div
                          className={`group flex items-center gap-1.5 rounded-xl px-2 py-1.5 transition ${
                            activeHistoryId === entry.id
                              ? isLightTheme
                                ? 'bg-[#eaf0ff]'
                                : 'bg-white/[0.10]'
                              : isLightTheme
                                ? 'hover:bg-[#f1f5ff]'
                                : 'hover:bg-white/[0.06]'
                          }`}
                        >
                          {editingHistoryId === entry.id ? (
                            <div className="min-w-0 flex-1 text-left">
                              <input
                                autoFocus
                                value={editingHistoryTitle}
                                onChange={(event) =>
                                  setEditingHistoryTitle(event.target.value)
                                }
                                onBlur={() =>
                                  submitInlineRenameThread(entry.id)
                                }
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter') {
                                    event.preventDefault();
                                    submitInlineRenameThread(entry.id);
                                  } else if (event.key === 'Escape') {
                                    event.preventDefault();
                                    setEditingHistoryId(null);
                                    setEditingHistoryTitle('');
                                  }
                                }}
                                className={`w-full rounded-md border px-2 py-1 text-[14px] outline-none ${
                                  isLightTheme
                                    ? 'border-[#cdd9ee] bg-white text-[#1d2535]'
                                    : 'border-white/20 bg-white/10 text-[#e8ecf7]'
                                }`}
                              />
                              <p
                                className={`mt-0.5 truncate text-[11px] ${
                                  isLightTheme
                                    ? 'text-[#72809a]'
                                    : 'text-[#99a1b4]'
                                }`}
                              >
                                {historyTimeLabel(entry.updatedAt)}
                              </p>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => selectHistoryThread(entry)}
                              disabled={
                                dashboardNavLocked &&
                                entry.id !== onboardingThreadId
                              }
                              className="min-w-0 flex-1 text-left disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <div className="flex min-w-0 items-center gap-1.5">
                                {entry.pinned && (
                                  <Pin
                                    className={`h-3.5 w-3.5 shrink-0 ${
                                      isLightTheme
                                        ? 'text-[#3f5f90]'
                                        : 'text-[#9eb7df]'
                                    }`}
                                  />
                                )}
                                <p
                                  className={`truncate text-[15px] ${
                                    isLightTheme
                                      ? 'text-[#1d2535]'
                                      : 'text-[#e8ecf7]'
                                  }`}
                                >
                                  {entry.title}
                                </p>
                              </div>
                              <p
                                className={`mt-0.5 truncate text-[11px] ${
                                  isLightTheme
                                    ? 'text-[#72809a]'
                                    : 'text-[#99a1b4]'
                                }`}
                              >
                                {historyTimeLabel(entry.updatedAt)}
                              </p>
                            </button>
                          )}
                          {!dashboardNavLocked && (
                            <button
                              type="button"
                              onClick={() =>
                                setOpenHistoryMenuId((curr) =>
                                  curr === entry.id ? null : entry.id
                                )
                              }
                              className={`inline-flex h-7 w-7 items-center justify-center rounded-lg transition ${
                                isLightTheme
                                  ? 'text-[#556179] hover:bg-[#dde7ff]'
                                  : 'text-[#b7bfd2] hover:bg-white/[0.08]'
                              }`}
                              aria-label="Thread actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          )}
                          {historyView === 'archived' && (
                            <button
                              type="button"
                              onClick={() => restoreArchivedThread(entry.id)}
                              className={`inline-flex h-7 w-7 items-center justify-center rounded-lg transition ${
                                isLightTheme
                                  ? 'text-[#4f6d3d] hover:bg-[#e5f7dc]'
                                  : 'text-[#bfe4a6] hover:bg-[#2f4f2a]'
                              }`}
                              aria-label="Restore chat"
                              title="Restore chat"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        {openHistoryMenuId === entry.id && (
                          <div
                            className={`absolute right-0 top-10 z-40 w-60 rounded-2xl border p-2 shadow-2xl ${
                              isLightTheme
                                ? 'border-[#cfd9ec] bg-white'
                                : 'border-white/10 bg-[#2f323a]'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => shareThread(entry.id)}
                              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition ${
                                isLightTheme
                                  ? 'text-[#22304a] hover:bg-[#eef3ff]'
                                  : 'text-[#e7ecf8] hover:bg-white/[0.06]'
                              }`}
                            >
                              <Share className="h-4 w-4" />
                              Share
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenHistoryMenuId(null);
                                setPrompt(
                                  `start a group chat based on: ${entry.title}`
                                );
                                setTimeout(
                                  () => composerInputRef.current?.focus(),
                                  0
                                );
                              }}
                              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition ${
                                isLightTheme
                                  ? 'text-[#22304a] hover:bg-[#eef3ff]'
                                  : 'text-[#e7ecf8] hover:bg-white/[0.06]'
                              }`}
                            >
                              <UserRoundPlus className="h-4 w-4" />
                              Start a group chat
                            </button>
                            <button
                              type="button"
                              onClick={() => startInlineRenameThread(entry.id)}
                              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition ${
                                isLightTheme
                                  ? 'text-[#22304a] hover:bg-[#eef3ff]'
                                  : 'text-[#e7ecf8] hover:bg-white/[0.06]'
                              }`}
                            >
                              <PencilLine className="h-4 w-4" />
                              Rename
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenHistoryMenuId(null);
                                setPrompt(
                                  `move chat "${entry.title}" to project <project name>`
                                );
                                setTimeout(
                                  () => composerInputRef.current?.focus(),
                                  0
                                );
                              }}
                              className={`flex w-full items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition ${
                                isLightTheme
                                  ? 'text-[#22304a] hover:bg-[#eef3ff]'
                                  : 'text-[#e7ecf8] hover:bg-white/[0.06]'
                              }`}
                            >
                              <span className="flex items-center gap-2.5">
                                <FolderOpen className="h-4 w-4" />
                                Move to project
                              </span>
                              <ChevronRight className="h-4 w-4 opacity-80" />
                            </button>
                            <div
                              className={`${isLightTheme ? 'border-[#dbe3f3]' : 'border-white/10'} my-1 border-t`}
                            />
                            <button
                              type="button"
                              onClick={() => toggleThreadPin(entry.id)}
                              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition ${
                                isLightTheme
                                  ? 'text-[#22304a] hover:bg-[#eef3ff]'
                                  : 'text-[#e7ecf8] hover:bg-white/[0.06]'
                              }`}
                            >
                              <Pin className="h-4 w-4" />
                              {entry.pinned ? 'Unpin chat' : 'Pin chat'}
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleThreadArchive(entry.id)}
                              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition ${
                                isLightTheme
                                  ? 'text-[#22304a] hover:bg-[#eef3ff]'
                                  : 'text-[#e7ecf8] hover:bg-white/[0.06]'
                              }`}
                            >
                              <Archive className="h-4 w-4" />
                              {entry.archived ? 'Unarchive' : 'Archive'}
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteThread(entry.id)}
                              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition ${
                                isLightTheme
                                  ? 'text-[#af2435] hover:bg-[#fff1f4]'
                                  : 'text-[#ff8ea1] hover:bg-[#472430]'
                              }`}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {!isSidebarExpanded && (
            <div className="custom-scrollbar flex-1 overflow-y-auto px-2 pb-5 pt-3">
              <menu className="flex w-full justify-center">
                <ul className="flex flex-col items-center gap-5">
                  {berylliumMenuItems.map((menu) => {
                    const Icon = menu.icon;
                    const menuHref = getWorkspaceMenuHref(menu);
                    const isActive =
                      pathname === menuHref ||
                      pathname.startsWith(`${menuHref}/`);
                    return (
                      <li key={menu.id} className="group">
                        <Link
                          href={menuHref}
                          onClick={(event) => {
                            if (dashboardNavLocked) {
                              event.preventDefault();
                              showOnboardingLockNotice('workspace');
                              router.push('/studio/onboarding');
                            }
                          }}
                          className={`inline-flex rounded-3xl px-4 py-2 transition-colors duration-200 ${
                            isActive
                              ? 'bg-gray-0 text-gray-900 dark:bg-gray-100'
                              : isLightTheme
                                ? 'text-[#37455f] hover:bg-white hover:text-gray-900'
                                : 'text-white hover:bg-gray-0 hover:text-gray-900 dark:hover:bg-gray-100'
                          } ${dashboardNavLocked ? 'pointer-events-auto opacity-45' : ''}`}
                          title={menu.title}
                        >
                          <Icon className="h-auto w-6" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </menu>
            </div>
          )}

          <div
            ref={profileMenuRef}
            className={`relative border-t px-3 py-3 ${isLightTheme ? 'border-[#d8dee9]' : 'border-white/10'}`}
          >
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen((previous) => !previous)}
              className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition ${
                isLightTheme
                  ? 'bg-white hover:bg-[#f3f6fd]'
                  : 'bg-white/5 hover:bg-white/10'
              } ${isSidebarExpanded ? '' : 'justify-center'}`}
            >
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#30333c]">
                <Image
                  src="/avatar-1.png"
                  alt="User profile"
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-full"
                />
              </div>
              {isSidebarExpanded && (
                <div className="min-w-0">
                  <p
                    className={`truncate text-sm font-medium ${isLightTheme ? 'text-[#1d2535]' : 'text-white'}`}
                  >
                    {displayName}
                  </p>
                  <p
                    className={`truncate text-xs ${isLightTheme ? 'text-[#6f7d96]' : 'text-[#a4a8b8]'}`}
                  >
                    {displayEmail}
                  </p>
                </div>
              )}
            </button>

            {isProfileMenuOpen && (
              <div
                className={`menu-pop absolute bottom-20 ${isSidebarExpanded ? 'left-3 w-[264px]' : 'left-2 w-[248px]'} z-30 rounded-2xl border p-3 shadow-2xl ${
                  isLightTheme
                    ? 'border-[#d4dced] bg-white'
                    : 'border-white/10 bg-[#31333b]'
                }`}
              >
                <div className="mb-3 flex items-center gap-2.5">
                  <div
                    className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full ${isLightTheme ? 'bg-[#eef2f9]' : 'bg-[#272a31]'}`}
                  >
                    <Image
                      src="/avatar-1.png"
                      alt="Profile avatar"
                      width={36}
                      height={36}
                      className="h-9 w-9 rounded-full"
                    />
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`truncate text-base font-medium ${isLightTheme ? 'text-[#1f2a44]' : 'text-white'}`}
                    >
                      {displayName}
                    </p>
                    <p
                      className={`truncate text-xs ${isLightTheme ? 'text-[#71819d]' : 'text-[#abb0bd]'}`}
                    >
                      {displayEmail}
                    </p>
                  </div>
                </div>

                <div
                  className={`mb-2 border-t ${isLightTheme ? 'border-[#dbe2f0]' : 'border-white/15'}`}
                />

                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (dashboardNavLocked) {
                        showOnboardingLockNotice('billing');
                        return;
                      }
                      setIsProfileMenuOpen(false);
                      setIsHelpMenuOpen(false);
                      router.push('/billing');
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[0.92rem] transition ${
                      isLightTheme
                        ? 'text-[#1f2a44] hover:bg-[#eef3ff]'
                        : 'text-white hover:bg-white/10'
                    } ${dashboardNavLocked ? 'opacity-55' : ''}`}
                  >
                    <BadgeCheck className="h-4 w-4" />
                    <span>Upgrade plan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openSettingsModal('general')}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[0.92rem] transition ${
                      isLightTheme
                        ? 'text-[#1f2a44] hover:bg-[#eef3ff]'
                        : 'text-white hover:bg-white/10'
                    } ${dashboardNavLocked ? 'opacity-55' : ''}`}
                  >
                    <Settings2 className="h-4 w-4" />
                    <span>Settings</span>
                  </button>
                  <div
                    className={`my-2 border-t ${isLightTheme ? 'border-[#dbe2f0]' : 'border-white/15'}`}
                  />
                  <Link
                    href="/help"
                    className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-[0.92rem] transition ${
                      isLightTheme
                        ? 'text-[#1f2a44] hover:bg-[#eef3ff]'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <LifeBuoy className="h-4 w-4" />
                      <span>Help & Support</span>
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[0.92rem] transition ${
                      isLightTheme
                        ? 'text-[#1f2a44] hover:bg-[#eef3ff]'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>
      )}

      <main
        className={`relative flex min-h-screen flex-col antialiased transition-all duration-300 ${
          isAuthenticated
            ? isSidebarExpanded
              ? 'lg:ml-[292px]'
              : 'lg:ml-[88px]'
            : ''
        }`}
      >
        {!isAuthenticated ? (
          <SabyPublicNavbar
            isLightTheme={isLightTheme}
            onOpenAuthModal={() => openQuickAuthModal(pathname || '/')}
            onToggleTheme={() =>
              setThemeMode((previous) =>
                previous === 'dark' ? 'light' : 'dark'
              )
            }
          />
        ) : (
          <header className="flex flex-wrap items-center justify-end gap-2 px-4 py-3 sm:gap-3 sm:px-6 sm:py-4 lg:px-8">
            <div className="relative flex items-center gap-1.5 sm:gap-2">
              <PublicThemeToggleButton
                mode={isLightTheme ? 'light' : 'dark'}
                onChange={setThemeMode}
              />
              <Link
                href={dashboardNavLocked ? '/studio/onboarding' : '/studio'}
                onClick={(event) => {
                  if (dashboardNavLocked) {
                    event.preventDefault();
                    showOnboardingLockNotice('workspace');
                    router.push('/studio/onboarding');
                  }
                }}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition active:scale-[0.98] sm:px-4 sm:py-2 sm:text-sm ${
                  isLightTheme
                    ? 'border-[#ced7e8] bg-white text-[#16171c] hover:bg-[#eef3ff]'
                    : 'border-white/20 bg-white/5 text-white hover:bg-white/10'
                } ${dashboardNavLocked ? 'opacity-55' : ''}`}
              >
                <span className="sm:hidden">Workspace</span>
                <span className="hidden sm:inline">Open Workspace</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-[0.98] sm:px-4 sm:py-2 sm:text-sm ${
                  isLightTheme
                    ? 'bg-[#111827] text-white hover:bg-[#1f2937]'
                    : 'bg-white text-[#16171c] hover:bg-[#e7e8ef]'
                }`}
              >
                Logout
              </button>
            </div>
          </header>
        )}

        <section
          className={`relative flex flex-col items-center px-4 sm:px-6 lg:px-8 ${
            isAuthenticated
              ? 'min-h-[calc(100vh-72px)] pb-4 pt-2 sm:min-h-[calc(100vh-82px)] sm:pb-5 sm:pt-3 lg:pb-6 lg:pt-4'
              : 'min-h-[78vh] pb-8 pt-10 sm:min-h-[82vh] sm:pb-10 sm:pt-14 lg:pb-12 lg:pt-14'
          }`}
        >
          <div
            className={`pointer-events-none absolute left-1/2 top-5 h-[460px] w-[min(95%,1120px)] -translate-x-1/2 blur-3xl ${
              isLightTheme
                ? 'bg-transparent'
                : 'bg-[radial-gradient(circle_at_50%_36%,rgba(37,99,235,0.34),rgba(9,13,24,0.16)_46%,rgba(3,4,7,0)_74%)]'
            }`}
          />
          <div
            className={`relative z-[1] mx-auto flex w-full max-w-[74rem] flex-1 flex-col ${
              showAuthenticatedRootHero
                ? 'justify-center'
                : isAuthenticated
                  ? 'justify-end'
                  : ''
            }`}
          >
            {!isAuthenticated && (
              <div className="mb-5 flex justify-center sm:mb-6">
                <Link
                  href="/studio"
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs shadow-[0_8px_26px_rgba(0,0,0,0.18)] sm:gap-3 sm:px-4 sm:py-2 sm:text-sm ${
                    isLightTheme
                      ? `${publicSiteTheme.light.border} ${publicSiteTheme.light.surface} text-[#25314c]`
                      : 'border-white/15 bg-[#141a27]/90 text-[#dce1f0]'
                  }`}
                >
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold sm:px-2.5 sm:text-xs ${
                      isLightTheme
                        ? 'bg-[#dbe8ff] text-[#1f3a74]'
                        : 'bg-[#2f67e8] text-white'
                    }`}
                  >
                    New
                  </span>
                  <span className="whitespace-nowrap">
                    Now live: Executive intelligence for distributed operations
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            )}
            {isAuthenticated ? (
              showAuthenticatedRootHero && (
                <h1
                  className={`mx-auto mb-5 max-w-[26ch] text-center text-[1.8rem] font-normal leading-[1.12] tracking-[-0.035em] sm:mb-6 sm:text-[2.35rem] lg:text-[3rem] ${
                    isLightTheme ? 'text-[#101828]' : 'text-[#f3f4f6]'
                  }`}
                  style={{
                    fontFamily:
                      "'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
                  }}
                >
                  {rootHeroMessages[activeRootHeroMessageIndex]}
                </h1>
              )
            ) : (
    
<>
  <h1
    className={`mx-auto max-w-[1220px] text-center
      text-[2.9rem]
      leading-[0.95]
      tracking-[-0.045em]
      sm:text-[4.4rem]
      lg:text-[5.35rem]
      ${isLightTheme ? "text-[#111827]" : "text-[#F8FAFC]"}`}
  >
    {/* Line 1 */}
    <span
      className="block opacity-95"
      style={{
        fontFamily: "'Russo One', sans-serif",
        letterSpacing: "0.04em",
      }}
    >
      Run an
    </span>

    {/* Line 2 */}
    <span
      className={`block font-semibold ${
        isLightTheme ? "text-[#101828]" : "text-white"
      }`}
      style={{
        fontFamily: "'Inter', 'Geist', sans-serif",
        letterSpacing: "-0.055em",
      }}
    >
      Intelligent
    </span>

    {/* Line 3 */}
    <span
      className="mt-1 block opacity-95"
      style={{
        fontFamily: "'Russo One', sans-serif",
        letterSpacing: "0.04em",
      }}
    >
      Organization
    </span>

    {/* Line 4 */}
    <span
      className={`mt-6 block
        text-[0.96em]
        font-normal
        italic
        leading-none
        tracking-[0.015em]
        ${isLightTheme ? "text-[#667085]" : "text-white/75"}`}
      style={{
        fontFamily:
          "'Instrument Serif','Playfair Display',Georgia,serif",
      }}
    >
      that thinks ahead.
    </span>
  </h1>

  <p
    className={`mx-auto mt-12 max-w-[720px]
      text-center
      text-lg
      leading-[1.65]
      tracking-[-0.01em]
      sm:text-[1.15rem]
      lg:text-[1.3rem]
      ${isLightTheme ? "text-[#475467]" : "text-[#D0D5DD]"}`}
    style={{
      fontFamily: "'Inter', 'Geist', sans-serif",
    }}
  >
    Saby unifies people, workflows, compliance, finance, and AI into a single{" "}
    <span
      className={`font-semibold ${
        isLightTheme ? "text-[#111827]" : "text-white"
      }`}
    >
      Operational Intelligence Platform
    </span>
    —giving leaders real-time visibility, faster execution, and better
    decisions.
  </p>
</>
  
     
            )}


            {hasAuthenticatedChatActivity && (
              <div
                ref={chatScrollRef}
                className={`mx-auto mb-4 overflow-y-auto px-2 sm:mb-5 sm:px-4 ${
                  isRootAuthenticatedChatUi
                    ? 'root-chat-scroll-offset max-h-[58vh] w-full max-w-5xl pt-2 sm:pt-4'
                    : 'max-h-[58vh] w-full max-w-5xl'
                }`}
              >
                {chatTurns.map((turn) => {
                  const onboardingState = ownerOnboardingTurnState[turn.id];
                  const isOnboardingAssistantTurn =
                    turn.role === 'assistant' && Boolean(onboardingState);
                  return (
                    <div
                      key={turn.id}
                      className={`relative text-[16px] sm:text-[17px] ${
                        isRootAuthenticatedChatUi
                          ? turn.role === 'user'
                            ? 'mb-8 ml-auto flex max-w-[85%] sm:max-w-[34rem] justify-end'
                            : isLightTheme
                              ? 'mb-8 mr-auto flex flex-col items-start w-full max-w-[95%] sm:max-w-[88%] md:max-w-[48rem] text-[#1c2338]'
                              : 'mb-8 mr-auto flex flex-col items-start w-full max-w-[95%] sm:max-w-[88%] md:max-w-[48rem] text-[#f0f2f8]'
                          : turn.role === 'user'
                            ? 'mb-5 ml-auto flex max-w-[85%] sm:max-w-[34rem] justify-end'
                            : isLightTheme
                              ? 'mb-6 mr-auto flex flex-col items-start w-full max-w-[95%] sm:max-w-[88%] md:max-w-[48rem] text-[#1c2338]'
                              : 'mb-6 mr-auto flex flex-col items-start w-full max-w-[95%] sm:max-w-[88%] md:max-w-[48rem] text-[#f0f2f8]'
                      } ${
                        isOnboardingAssistantTurn &&
                        onboardingState === 'active'
                          ? 'onboarding-turn-active'
                          : ''
                      } ${
                        isOnboardingAssistantTurn &&
                        onboardingState === 'answered'
                          ? 'onboarding-turn-answered'
                          : ''
                      }`}
                    >
                      {isOnboardingAssistantTurn && (
                        <span
                          className={`mb-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                            isLightTheme
                              ? 'border-[#bfd8ff] bg-[#e8f1ff] text-[#17467f]'
                              : 'border-[#45689c] bg-[#1e3554] text-[#dbeafe]'
                          }`}
                        >
                          <Bot className="h-3 w-3" />
                          Saby Setup
                        </span>
                      )}
                      {turn.role === 'assistant' ? (
                        <div
                          className={`w-full rounded-[22px] sm:rounded-[26px] border p-4 sm:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.05)] transition-all ${
                            isLightTheme
                              ? 'border-[#dce6f6] bg-[#f8fbff] text-[#1c2338] shadow-[0_4px_20px_rgba(28,45,86,0.05)]'
                              : 'border-white/[0.08] bg-[#121929]/95 text-[#f0f2f8] shadow-[0_8px_32px_rgba(0,0,0,0.36)] backdrop-blur-md'
                          }`}
                        >
                          {/* Chat Card Header */}
                          <div className="mb-3 flex items-center justify-between border-b pb-2.5 border-black/[0.05] dark:border-white/[0.06]">
                            <div className="flex items-center gap-2">
                              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm">
                                <Bot className="h-3.5 w-3.5" />
                              </div>
                              <span className="text-[12.5px] font-semibold tracking-wide text-blue-600 dark:text-blue-400">
                                Saby Copilot
                              </span>
                            </div>
                            {typingAssistantTurnId === turn.id && (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10.5px] font-medium text-blue-500 dark:text-blue-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                                Live
                              </span>
                            )}
                          </div>

                          {(() => {
                            const isStreaming =
                              typingAssistantTurnId === turn.id;
                            const pendingConfirmation = !isStreaming
                              ? parsePendingConfirmationMeta(turn.text)
                              : null;

                            if (pendingConfirmation) {
                              return (
                                <div
                                  className={`rounded-[18px] border px-4 py-3.5 shadow-sm ${
                                    pendingConfirmation.warning
                                      ? isLightTheme
                                        ? 'border-[#f1c5bf] bg-[#fff2ef] text-[#7f1d1d]'
                                        : 'border-[#8b4b4b] bg-[#30191a] text-[#ffd7d7]'
                                      : isLightTheme
                                        ? 'border-[#d7dff2] bg-white text-[#1f2b46]'
                                        : 'border-[#3a4868] bg-[#1a233a] text-[#eef2ff]'
                                  }`}
                                >
                                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] opacity-75">
                                    Pending action
                                  </p>
                                  <h4
                                    className={`mt-1 text-[1rem] font-semibold leading-tight ${
                                      pendingConfirmation.warning
                                        ? ''
                                        : isLightTheme
                                          ? 'text-[#102a52]'
                                          : 'text-[#ffffff]'
                                    }`}
                                  >
                                    {pendingConfirmation.title}
                                  </h4>
                                  <p className="mt-1.5 text-[12px] leading-relaxed opacity-90">
                                    {pendingConfirmation.warning
                                      ? 'This action may remove or affect existing records. Confirm only if you are sure.'
                                      : 'This action is ready to run. Confirm to continue or cancel to stop.'}
                                  </p>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handlePendingConfirmationResponse('yes')
                                      }
                                      className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                                        isLightTheme
                                          ? 'bg-[#2f63c8] text-white hover:bg-[#2554b2]'
                                          : 'border border-[#5f79b6] bg-[#3d5ea8] text-white hover:bg-[#486cba]'
                                      }`}
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handlePendingConfirmationResponse(
                                          'cancel'
                                        )
                                      }
                                      className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                                        pendingConfirmation.warning
                                          ? isLightTheme
                                            ? 'border-[#f1c5bf] bg-white text-[#9f2a2a] hover:bg-[#fff7f5]'
                                            : 'border-[#8b4b4b] bg-transparent text-[#ffd7d7] hover:bg-white/[0.06]'
                                          : isLightTheme
                                            ? 'border-[#cdd8ef] bg-[#eef4ff] text-[#38507f] hover:bg-[#e2ebff]'
                                            : 'border-[#4a5877] bg-[#2e3850] text-[#dce5ff] hover:bg-[#394561]'
                                      }`}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              );
                            }

                            const parsed = cleanTurnThinking(
                              turn.text,
                              turn.reasoning
                            );

                            // If streaming and content has not arrived yet, display the dynamic thinking/working animation!
                            if (
                              isStreaming &&
                              !parsed.cleanText &&
                              !parsed.reasoning
                            ) {
                              return (
                                <div className="py-2">
                                  <SabyThinkingIndicator
                                    stage={chatProgressStage}
                                    isLightTheme={isLightTheme}
                                  />
                                </div>
                              );
                            }

                            return (
                              <>
                                <ReasoningBanner
                                  reasoning={parsed.reasoning}
                                  isStreaming={isStreaming}
                                  isLightTheme={isLightTheme}
                                  visible={showThoughtProcess}
                                />
                                <SabyContentRenderer
                                  text={parsed.cleanText}
                                  animate={isStreaming}
                                  onDone={() =>
                                    handleAssistantTypingDone(turn.id)
                                  }
                                  isLightTheme={isLightTheme}
                                  onAction={(action) =>
                                    void sendPromptToSaby(action)
                                  }
                                />
                              </>
                            );
                          })()}
                        </div>
                      ) : editingUserTurnId === turn.id ? (
                        <div
                          className={`w-full rounded-[26px] border px-4 py-3 shadow-[0_10px_26px_rgba(0,0,0,0.22)] sm:px-5 ${
                            isLightTheme
                              ? 'border-[#d7d0c4] bg-[#ece6da] text-[#1f2b46]'
                              : 'border-white/[0.08] bg-white/[0.05] text-[#f3f4f6]'
                          }`}
                        >
                          <textarea
                            value={editingUserTurnText}
                            onChange={(event) =>
                              setEditingUserTurnText(event.target.value)
                            }
                            className="min-h-[84px] w-full resize-none bg-transparent text-[15px] leading-relaxed outline-none"
                          />
                          <div className="mt-3 flex justify-end gap-2 text-[11px]">
                            <button
                              type="button"
                              onClick={cancelEditingUserTurn}
                              className={`rounded-full border px-3 py-1.5 transition ${
                                isLightTheme
                                  ? 'border-[#cdbfa7] bg-[#f5efe4] text-[#6a4b23]'
                                  : 'border-white/[0.1] bg-white/[0.03] text-white/70 hover:bg-white/[0.07]'
                              }`}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={saveEditedUserTurn}
                              className={`rounded-full border px-3 py-1.5 transition ${
                                isLightTheme
                                  ? 'border-[#c7d6f7] bg-[#eef4ff] text-[#234a91]'
                                  : 'border-white/[0.1] bg-white/[0.06] text-white/85 hover:bg-white/[0.1]'
                              }`}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={resendEditedUserTurn}
                              className={`rounded-full px-3 py-1.5 transition ${
                                isLightTheme
                                  ? 'bg-[#111827] text-white'
                                  : 'bg-[#f3f4f6] text-[#111827]'
                              }`}
                            >
                              Resend
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={`inline-flex ${
                              isRootAuthenticatedChatUi
                                ? 'rounded-[26px] px-5 py-3 text-[15px] shadow-[0_10px_26px_rgba(0,0,0,0.22)] sm:px-6 sm:py-3'
                                : 'rounded-[28px] px-5 py-3 text-[16px] shadow-[0_8px_24px_rgba(0,0,0,0.18)] sm:px-6 sm:py-3.5'
                            } ${
                              isLightTheme
                                ? 'bg-[#ece6da] text-[#1f2b46]'
                                : isRootAuthenticatedChatUi
                                  ? 'bg-white/[0.045] text-[#f3f4f6]'
                                  : 'bg-white/[0.05] text-[#f3f4f6]'
                            }`}
                          >
                            <span className="whitespace-pre-wrap">
                              {typeof turn.text === 'string'
                                ? turn.text
                                : JSON.stringify(turn.text ?? '')}
                            </span>
                          </span>
                          <div className="mr-6 flex items-center gap-1.5 self-end text-[10px] sm:mr-8">
                            <button
                              type="button"
                              onClick={() =>
                                void copyTurnText(turn.id, turn.text)
                              }
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 transition ${
                                isLightTheme
                                  ? 'border-[#d2ddef] bg-white/90 text-[#38507f] hover:bg-[#eef4ff]'
                                  : 'border-white/[0.08] bg-white/[0.04] text-white/70 hover:bg-white/[0.08]'
                              }`}
                              aria-label="Copy message"
                              title={
                                copiedTurnId === turn.id ? 'Copied' : 'Copy'
                              }
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                startEditingUserTurn(turn.id, turn.text)
                              }
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 transition ${
                                isLightTheme
                                  ? 'border-[#d2ddef] bg-white/90 text-[#38507f] hover:bg-[#eef4ff]'
                                  : 'border-white/[0.08] bg-white/[0.04] text-white/70 hover:bg-white/[0.08]'
                              }`}
                              aria-label="Edit message"
                              title="Edit"
                            >
                              <PencilLine className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* ── Feedback buttons — only on completed assistant turns ── */}
                      {turn.role === 'assistant' &&
                        typingAssistantTurnId !== turn.id &&
                        turn.text.length > 0 &&
                        !parsePendingConfirmationMeta(turn.text) && (
                          <div className="mt-2 flex items-center gap-1.5">
                            <FeedbackButtons
                              turnId={turn.id}
                              workflowName={turnIntentByTurnId[turn.id] ?? null}
                              current={feedbackByTurnId[turn.id] ?? null}
                              isLightTheme={isLightTheme}
                              compact={isRootAuthenticatedChatUi}
                              onChange={(tid, value) =>
                                setFeedbackByTurnId((c) => ({
                                  ...c,
                                  [tid]: value,
                                }))
                              }
                            />
                            <button
                              type="button"
                              onClick={() =>
                                void copyTurnText(turn.id, turn.text)
                              }
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] transition ${
                                isLightTheme
                                  ? 'border-[#d2ddef] bg-white/90 text-[#38507f] hover:bg-[#eef4ff]'
                                  : 'border-white/[0.08] bg-white/[0.04] text-white/70 hover:bg-white/[0.08]'
                              }`}
                              aria-label="Copy response"
                              title={
                                copiedTurnId === turn.id ? 'Copied' : 'Copy'
                              }
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}

                      {turn.role === 'assistant' &&
                        ownerOnboardingReviewByTurnId[turn.id] && (
                          <div
                            className={`mt-2.5 rounded-2xl border p-3.5 ${
                              isLightTheme
                                ? 'border-[#ddd5c7] bg-[#fbf7ef] text-[#1f2b46] shadow-[0_10px_22px_rgba(130,112,78,0.10)]'
                                : 'border-[#3f5f90] bg-[linear-gradient(160deg,rgba(24,40,66,0.95),rgba(30,52,84,0.88))] text-[#e4ecff] shadow-[0_10px_24px_rgba(8,15,28,0.45)]'
                            }`}
                          >
                            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <div className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] opacity-95">
                                  <BadgeCheck className="h-3.5 w-3.5" />
                                  Final Review
                                </div>
                                <h4 className="mt-1.5 text-[17px] font-semibold leading-tight">
                                  Welcome to Saby
                                </h4>
                                <p className="mt-0.5 text-[11px] opacity-80">
                                  Confirm your setup details, or edit any
                                  section before submission.
                                </p>
                              </div>
                              <span
                                className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold ${
                                  ownerOnboardingSession?.skipped?.[
                                    OWNER_PHONE_VERIFIED_KEY
                                  ]
                                    ? isLightTheme
                                      ? 'border-[#b8e4cb] bg-[#eaf9f0] text-[#1f6a3e]'
                                      : 'border-[#4b8a62] bg-[#214a31] text-[#d8f6e4]'
                                    : isLightTheme
                                      ? 'border-[#f5d6b0] bg-[#fff6eb] text-[#8b5223]'
                                      : 'border-[#a8804f] bg-[#4a3622] text-[#ffe3c2]'
                                }`}
                              >
                                {ownerOnboardingSession?.skipped?.[
                                  OWNER_PHONE_VERIFIED_KEY
                                ] ? (
                                  <>
                                    <Check className="h-3.5 w-3.5" />
                                    Phone Verified
                                  </>
                                ) : (
                                  <>
                                    <Phone className="h-3.5 w-3.5" />
                                    Verification Required
                                  </>
                                )}
                              </span>
                            </div>

                            <div className="mb-3 flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  handleOwnerOnboardingReviewEdit(
                                    'owner.roleTitle'
                                  )
                                }
                                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition ${
                                  isLightTheme
                                    ? 'border-[#bed3ff] bg-[#edf4ff] text-[#234b8d] hover:bg-[#e4eeff]'
                                    : 'border-[#4b689a] bg-[#243b5e] text-[#d6e7ff] hover:bg-[#2f4a75]'
                                }`}
                              >
                                <UserRoundPlus className="h-3.5 w-3.5" />
                                Edit Owner
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleOwnerOnboardingReviewEdit(
                                    'company.name'
                                  )
                                }
                                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition ${
                                  isLightTheme
                                    ? 'border-[#cad8ff] bg-[#f2f6ff] text-[#2f4e95] hover:bg-[#e9efff]'
                                    : 'border-[#4f6592] bg-[#2a3a56] text-[#dbe6ff] hover:bg-[#334969]'
                                }`}
                              >
                                <Building2 className="h-3.5 w-3.5" />
                                Edit Company
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleOwnerOnboardingReviewEdit(
                                    'node.rootNodeName'
                                  )
                                }
                                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition ${
                                  isLightTheme
                                    ? 'border-[#cde5cf] bg-[#effbf0] text-[#2f6b3d] hover:bg-[#e7f7e9]'
                                    : 'border-[#4c7f56] bg-[#243f2a] text-[#d7f0dc] hover:bg-[#2d5035]'
                                }`}
                              >
                                <Landmark className="h-3.5 w-3.5" />
                                Edit Branch
                              </button>
                            </div>

                            <div className="grid grid-cols-1 gap-2 text-sm">
                              <div
                                className={`rounded-xl border p-2.5 ${
                                  isLightTheme
                                    ? 'border-[#d4e2ff] bg-white/75'
                                    : 'border-[#3f5f90] bg-[#162944]/70'
                                }`}
                              >
                                <div className="mb-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.08em] opacity-85">
                                  <UserRoundPlus className="h-3.5 w-3.5" />
                                  Owner
                                  <ChevronRight className="h-3.5 w-3.5 opacity-70" />
                                </div>
                                <div className="grid gap-1.5 sm:grid-cols-2">
                                  <div className="rounded-lg border border-white/10 px-2.5 py-1.5">
                                    <p className="text-[10px] opacity-70">
                                      Role Title
                                    </p>
                                    <p className="font-medium">
                                      {
                                        ownerOnboardingReviewByTurnId[turn.id]
                                          .ownerTitle
                                      }
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleOwnerOnboardingReviewEdit(
                                        'owner.phoneNumber'
                                      )
                                    }
                                    className={`rounded-lg border px-2.5 py-1.5 text-left transition ${
                                      isLightTheme
                                        ? 'border-[#d6e3fd] bg-[#f7faff] hover:bg-[#eef5ff]'
                                        : 'border-[#45628f] bg-[#1b2f4d]/80 hover:bg-[#243b5d]'
                                    }`}
                                  >
                                    <p className="text-[10px] opacity-70">
                                      Phone
                                    </p>
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="font-medium">
                                        {
                                          ownerOnboardingReviewByTurnId[turn.id]
                                            .ownerPhone
                                        }
                                      </p>
                                      <PencilLine className="h-3.5 w-3.5 opacity-75" />
                                    </div>
                                  </button>
                                </div>
                              </div>

                              <div
                                className={`rounded-xl border p-2.5 ${
                                  isLightTheme
                                    ? 'border-[#d9e6ff] bg-white/75'
                                    : 'border-[#3d5986] bg-[#182b46]/70'
                                }`}
                              >
                                <div className="mb-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.08em] opacity-85">
                                  <Building2 className="h-3.5 w-3.5" />
                                  Organization
                                  <ChevronRight className="h-3.5 w-3.5 opacity-70" />
                                </div>
                                <div className="grid gap-1.5 sm:grid-cols-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleOwnerOnboardingReviewEdit(
                                        'company.name'
                                      )
                                    }
                                    className={`rounded-lg border px-2.5 py-1.5 text-left transition ${isLightTheme ? 'border-[#d6e3fd] bg-[#f7faff] hover:bg-[#eef5ff]' : 'border-[#45628f] bg-[#1b2f4d]/80 hover:bg-[#243b5d]'}`}
                                  >
                                    <p className="text-[10px] opacity-70">
                                      Company Name
                                    </p>
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="font-medium">
                                        {
                                          ownerOnboardingReviewByTurnId[turn.id]
                                            .companyName
                                        }
                                      </p>
                                      <PencilLine className="h-3.5 w-3.5 opacity-75" />
                                    </div>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleOwnerOnboardingReviewEdit(
                                        'company.email'
                                      )
                                    }
                                    className={`rounded-lg border px-2.5 py-1.5 text-left transition ${isLightTheme ? 'border-[#d6e3fd] bg-[#f7faff] hover:bg-[#eef5ff]' : 'border-[#45628f] bg-[#1b2f4d]/80 hover:bg-[#243b5d]'}`}
                                  >
                                    <p className="text-[10px] opacity-70">
                                      Contact Email
                                    </p>
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="font-medium">
                                        {
                                          ownerOnboardingReviewByTurnId[turn.id]
                                            .companyEmail
                                        }
                                      </p>
                                      <PencilLine className="h-3.5 w-3.5 opacity-75" />
                                    </div>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleOwnerOnboardingReviewEdit(
                                        'company.phone'
                                      )
                                    }
                                    className={`rounded-lg border px-2.5 py-1.5 text-left transition ${isLightTheme ? 'border-[#d6e3fd] bg-[#f7faff] hover:bg-[#eef5ff]' : 'border-[#45628f] bg-[#1b2f4d]/80 hover:bg-[#243b5d]'}`}
                                  >
                                    <p className="text-[10px] opacity-70">
                                      Company Phone
                                    </p>
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="font-medium">
                                        {
                                          ownerOnboardingReviewByTurnId[turn.id]
                                            .companyPhone
                                        }
                                      </p>
                                      <PencilLine className="h-3.5 w-3.5 opacity-75" />
                                    </div>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleOwnerOnboardingReviewEdit(
                                        'company.industry'
                                      )
                                    }
                                    className={`rounded-lg border px-2.5 py-1.5 text-left transition ${isLightTheme ? 'border-[#d6e3fd] bg-[#f7faff] hover:bg-[#eef5ff]' : 'border-[#45628f] bg-[#1b2f4d]/80 hover:bg-[#243b5d]'}`}
                                  >
                                    <p className="text-[10px] opacity-70">
                                      Industry
                                    </p>
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="font-medium">
                                        {
                                          ownerOnboardingReviewByTurnId[turn.id]
                                            .industry
                                        }
                                      </p>
                                      <PencilLine className="h-3.5 w-3.5 opacity-75" />
                                    </div>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleOwnerOnboardingReviewEdit(
                                        'company.size'
                                      )
                                    }
                                    className={`rounded-lg border px-2.5 py-1.5 text-left transition ${isLightTheme ? 'border-[#d6e3fd] bg-[#f7faff] hover:bg-[#eef5ff]' : 'border-[#45628f] bg-[#1b2f4d]/80 hover:bg-[#243b5d]'}`}
                                  >
                                    <p className="text-[10px] opacity-70">
                                      Team Size
                                    </p>
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="font-medium">
                                        {
                                          ownerOnboardingReviewByTurnId[turn.id]
                                            .teamSize
                                        }
                                      </p>
                                      <PencilLine className="h-3.5 w-3.5 opacity-75" />
                                    </div>
                                  </button>
                                </div>
                              </div>

                              <div
                                className={`rounded-xl border p-2.5 ${
                                  isLightTheme
                                    ? 'border-[#d2e6d4] bg-white/75'
                                    : 'border-[#476f54] bg-[#1a3123]/65'
                                }`}
                              >
                                <div className="mb-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.08em] opacity-85">
                                  <Network className="h-3.5 w-3.5" />
                                  Branch Setup
                                  <ChevronRight className="h-3.5 w-3.5 opacity-70" />
                                </div>
                                <div className="grid gap-1.5 sm:grid-cols-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleOwnerOnboardingReviewEdit(
                                        'company.country'
                                      )
                                    }
                                    className={`rounded-lg border px-2.5 py-1.5 text-left transition ${isLightTheme ? 'border-[#d6e3fd] bg-[#f7faff] hover:bg-[#eef5ff]' : 'border-[#45628f] bg-[#1b2f4d]/80 hover:bg-[#243b5d]'}`}
                                  >
                                    <p className="inline-flex items-center gap-1 text-[10px] opacity-70">
                                      <MapPin className="h-3.5 w-3.5" />
                                      Location
                                    </p>
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="font-medium">
                                        {
                                          ownerOnboardingReviewByTurnId[turn.id]
                                            .location
                                        }
                                      </p>
                                      <PencilLine className="h-3.5 w-3.5 opacity-75" />
                                    </div>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleOwnerOnboardingReviewEdit(
                                        'company.timezone'
                                      )
                                    }
                                    className={`rounded-lg border px-2.5 py-1.5 text-left transition ${isLightTheme ? 'border-[#d6e3fd] bg-[#f7faff] hover:bg-[#eef5ff]' : 'border-[#45628f] bg-[#1b2f4d]/80 hover:bg-[#243b5d]'}`}
                                  >
                                    <p className="inline-flex items-center gap-1 text-[10px] opacity-70">
                                      <Clock3 className="h-3.5 w-3.5" />
                                      Timezone
                                    </p>
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="font-medium">
                                        {
                                          ownerOnboardingReviewByTurnId[turn.id]
                                            .timezone
                                        }
                                      </p>
                                      <PencilLine className="h-3.5 w-3.5 opacity-75" />
                                    </div>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleOwnerOnboardingReviewEdit(
                                        'node.nodeStructures'
                                      )
                                    }
                                    className={`rounded-lg border px-2.5 py-1.5 text-left transition ${isLightTheme ? 'border-[#d6e3fd] bg-[#f7faff] hover:bg-[#eef5ff]' : 'border-[#45628f] bg-[#1b2f4d]/80 hover:bg-[#243b5d]'}`}
                                  >
                                    <p className="text-[10px] opacity-70">
                                      Branch Mode
                                    </p>
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="font-medium">
                                        {
                                          ownerOnboardingReviewByTurnId[turn.id]
                                            .branchMode
                                        }
                                      </p>
                                      <PencilLine className="h-3.5 w-3.5 opacity-75" />
                                    </div>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleOwnerOnboardingReviewEdit(
                                        'node.rootNodeName'
                                      )
                                    }
                                    className={`rounded-lg border px-2.5 py-1.5 text-left transition ${isLightTheme ? 'border-[#d6e3fd] bg-[#f7faff] hover:bg-[#eef5ff]' : 'border-[#45628f] bg-[#1b2f4d]/80 hover:bg-[#243b5d]'}`}
                                  >
                                    <p className="inline-flex items-center gap-1 text-[10px] opacity-70">
                                      <Landmark className="h-3.5 w-3.5" />
                                      Root Branch
                                    </p>
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="font-medium">
                                        {
                                          ownerOnboardingReviewByTurnId[turn.id]
                                            .rootNodeName
                                        }
                                      </p>
                                      <PencilLine className="h-3.5 w-3.5 opacity-75" />
                                    </div>
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleOwnerOnboardingReviewAction('proceed')
                                }
                                className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                                  isLightTheme
                                    ? 'bg-[#2d5aa8] text-white hover:bg-[#234b90]'
                                    : 'bg-[#3f6fbf] text-white hover:bg-[#335ca1]'
                                }`}
                              >
                                Proceed
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleOwnerOnboardingReviewAction('cancel')
                                }
                                className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${
                                  isLightTheme
                                    ? 'border-[#edc0c0] bg-[#fff3f3] text-[#8a2d2d] hover:bg-[#ffe9e9]'
                                    : 'border-[#8b4a4a] bg-[#3f2222] text-[#ffd9d9] hover:bg-[#553030]'
                                }`}
                              >
                                Cancel
                              </button>
                              <span className="text-[10px] opacity-70">
                                You can edit any tile above before final
                                submission.
                              </span>
                            </div>
                          </div>
                        )}
                      {turn.role === 'assistant' &&
                        assistantPromptChips[turn.id] &&
                        assistantPromptChips[turn.id].length > 0 && (
                          <div
                            className={`mt-2 flex flex-wrap gap-1.5 ${
                              isOnboardingAssistantTurn &&
                              onboardingState === 'answered'
                                ? 'opacity-70 transition-opacity duration-300'
                                : ''
                            }`}
                          >
                            {assistantPromptChips[turn.id].map((chip) => (
                              <button
                                key={`${turn.id}-${chip.id}`}
                                type="button"
                                onClick={() =>
                                  handleAssistantPromptChipClick(chip)
                                }
                                className={`rounded-full border px-2.5 py-1 text-[10px] font-medium transition ${getAssistantChipClass(chip)}`}
                                title={chip.prompt || chip.text}
                              >
                                {typeof chip.text === 'string'
                                  ? chip.text
                                  : String(chip.text || '')}
                              </button>
                            ))}
                          </div>
                        )}
                      {turn.role === 'assistant' &&
                        onboardingIssueDataByTurnId[turn.id] &&
                        onboardingIssueExpandedByTurnId[turn.id] && (
                          <pre
                            className={`mt-2 max-h-56 overflow-auto rounded-md border p-2 text-[11px] ${
                              isLightTheme
                                ? 'border-[#d4deef] bg-[#f7faff]/80 text-[#2b3550]'
                                : 'border-white/10 bg-[#1f2430]/80 text-[#d9e1f5]'
                            }`}
                          >
                            {JSON.stringify(
                              {
                                jobId:
                                  onboardingIssueDataByTurnId[turn.id].jobId,
                                issueCount:
                                  onboardingIssueDataByTurnId[turn.id].issues
                                    .length,
                                summary:
                                  onboardingIssueDataByTurnId[turn.id].summary,
                                issues:
                                  onboardingIssueDataByTurnId[turn.id].issues,
                              },
                              null,
                              2
                            )}
                          </pre>
                        )}
                      {turn.role === 'assistant' &&
                        ownerPhoneVerification &&
                        ownerPhoneVerification.otpTurnId === turn.id &&
                        !ownerPhoneVerification.verified && (
                          <div
                            className={`mt-2.5 rounded-xl border p-3 ${
                              isLightTheme
                                ? 'border-[#c9d8f7] bg-[#eef4ff]/80 text-[#1f2b46]'
                                : 'border-[#3f5f90] bg-[#1c2a45]/85 text-[#e4ecff]'
                            }`}
                          >
                            <div className="mb-1 text-xs font-semibold">
                              Phone Verification
                            </div>
                            <div className="mb-2 text-xs opacity-90">
                              Enter the 6-digit code sent via SMS to{' '}
                              <span className="font-semibold">
                                {ownerPhoneVerification.phoneNumber}
                              </span>
                              . The same code is also sent to your email as
                              fallback.
                            </div>
                            <div className="mb-2 flex items-center gap-1.5">
                              {new Array(6).fill(0).map((_, idx) => (
                                <input
                                  key={`owner-phone-otp-${idx}`}
                                  ref={(element) => {
                                    ownerPhoneOtpInputRefs.current[idx] =
                                      element;
                                  }}
                                  value={
                                    ownerPhoneVerification.digits[idx] || ''
                                  }
                                  onChange={(event) =>
                                    handleOwnerPhoneOtpChange(
                                      idx,
                                      event.target.value
                                    )
                                  }
                                  onKeyDown={(event) =>
                                    handleOwnerPhoneOtpKeyDown(idx, event)
                                  }
                                  onPaste={handleOwnerPhoneOtpPaste}
                                  inputMode="numeric"
                                  maxLength={1}
                                  disabled={
                                    ownerPhoneVerification.sending ||
                                    ownerPhoneVerification.verifying
                                  }
                                  className={`h-12 w-11 rounded-md border text-center text-[11px] font-semibold outline-none transition ${
                                    isLightTheme
                                      ? 'border-[#b7c8ec] bg-white text-[#1f2b46] focus:border-[#5a83d0]'
                                      : 'border-[#4a6291] bg-[#16243d] text-[#e4ecff] focus:border-[#7aa0e6]'
                                  }`}
                                  aria-label={`Phone verification digit ${idx + 1}`}
                                />
                              ))}
                            </div>
                            {ownerPhoneVerification.info && (
                              <div className="mb-2 text-xs text-[#7cd2a7]">
                                {ownerPhoneVerification.info}
                              </div>
                            )}
                            {ownerPhoneVerification.error && (
                              <div className="mb-2 text-xs text-[#ff7a7a]">
                                {typeof ownerPhoneVerification.error === 'string'
                                  ? ownerPhoneVerification.error
                                  : formatChatErrorMessage(ownerPhoneVerification.error)}
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  void applyOwnerPhoneVerificationCode(
                                    ownerPhoneVerification.digits.join('')
                                  )
                                }
                                disabled={
                                  ownerPhoneVerification.sending ||
                                  ownerPhoneVerification.verifying
                                }
                                className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                                  isLightTheme
                                    ? 'bg-[#2d5aa8] text-white hover:bg-[#234b90]'
                                    : 'bg-[#3f6fbf] text-white hover:bg-[#335ca1]'
                                }`}
                              >
                                {ownerPhoneVerification.verifying
                                  ? 'Verifying...'
                                  : 'Verify Code'}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setOwnerPhoneVerification((current) =>
                                    current
                                      ? {
                                          ...current,
                                          digits: new Array(6).fill(''),
                                          error: null,
                                        }
                                      : current
                                  )
                                }
                                disabled={
                                  ownerPhoneVerification.sending ||
                                  ownerPhoneVerification.verifying
                                }
                                className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${
                                  isLightTheme
                                    ? 'border-[#b7c8ec] text-[#2b477d] hover:bg-[#e3edff]'
                                    : 'border-[#4a6291] text-[#d8e6ff] hover:bg-[#25385b]'
                                }`}
                              >
                                Clear
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  void sendOwnerPhoneVerificationOtp(
                                    ownerPhoneVerification.phoneNumber,
                                    { resetDigits: true }
                                  )
                                }
                                disabled={
                                  ownerPhoneVerification.sending ||
                                  ownerPhoneVerification.verifying
                                }
                                className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${
                                  isLightTheme
                                    ? 'border-[#90b2eb] text-[#24467d] hover:bg-[#d9e8ff]'
                                    : 'border-[#5679b4] text-[#d8e6ff] hover:bg-[#2a426b]'
                                }`}
                              >
                                {ownerPhoneVerification.sending
                                  ? 'Sending...'
                                  : 'Resend Code'}
                              </button>
                            </div>
                          </div>
                        )}
                      {turn.role === 'assistant' && actionTurnMeta[turn.id] && (
                        <div className="mt-2 text-xs">
                          {actionTurnMeta[turn.id].status === 'completed' &&
                            Array.isArray(
                              getFollowUpActions(
                                actionTurnMeta[turn.id].actionType,
                                actionTurnMeta[turn.id].finalEvent
                              )
                            ) &&
                            getFollowUpActions(
                              actionTurnMeta[turn.id].actionType,
                              actionTurnMeta[turn.id].finalEvent
                            ).length > 0 && (
                              <div className="mb-2 flex flex-wrap gap-1.5">
                                {getFollowUpActions(
                                  actionTurnMeta[turn.id].actionType,
                                  actionTurnMeta[turn.id].finalEvent
                                ).map((item) => (
                                  <button
                                    key={`${turn.id}-${item.label}`}
                                    type="button"
                                    onClick={() =>
                                      handleFollowUpBadgeInsert(item.prompt)
                                    }
                                    className={`rounded-full border px-2.5 py-1 text-[10px] font-medium transition ${getActionBadgeClass(
                                      item,
                                      isLightTheme
                                    )}`}
                                    title={item.prompt}
                                  >
                                    {item.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          <div className="flex items-center gap-2">
                            {actionTurnMeta[turn.id].status ===
                              'processing' && (
                              <>
                                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent opacity-80" />
                                <span className="opacity-85">
                                  Processing...
                                </span>
                              </>
                            )}
                            {actionTurnMeta[turn.id].status === 'timeout' && (
                              <span className="opacity-85">
                                Still processing in background...
                              </span>
                            )}
                            {actionTurnMeta[turn.id].status === 'completed' && (
                              <span className="opacity-85">Completed</span>
                            )}
                            {actionTurnMeta[turn.id].status === 'failed' && (
                              <span className="opacity-85">Failed</span>
                            )}
                            <button
                              type="button"
                              className="underline underline-offset-2 opacity-85 hover:opacity-100"
                              onClick={() =>
                                setExpandedActionDetails((current) => ({
                                  ...current,
                                  [turn.id]: !current[turn.id],
                                }))
                              }
                            >
                              {expandedActionDetails[turn.id]
                                ? 'Hide details'
                                : 'View details'}
                            </button>
                          </div>
                          {expandedActionDetails[turn.id] && (
                            <pre
                              className={`mt-1 max-h-48 overflow-auto rounded-md border p-2 text-[11px] ${
                                isLightTheme
                                  ? 'border-[#d4deef] bg-[#f7faff]/80 text-[#2b3550]'
                                  : 'border-white/10 bg-[#1f2430]/80 text-[#d9e1f5]'
                              }`}
                            >
                              {JSON.stringify(
                                {
                                  eventId: actionTurnMeta[turn.id].eventId,
                                  actionType:
                                    actionTurnMeta[turn.id].actionType,
                                  status: actionTurnMeta[turn.id].status,
                                  attempts: actionTurnMeta[turn.id].attempts,
                                  lastCheckedAt:
                                    actionTurnMeta[turn.id].lastCheckedAt,
                                  event:
                                    actionTurnMeta[turn.id].finalEvent || null,
                                },
                                null,
                                2
                              )}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {chatError && (
                  <div
                    className={`rounded-xl border px-3 py-2 text-sm ${
                      isLightTheme
                        ? 'border-[#c9dcff] bg-[#eef3ff]/70 text-[#1f3a74]'
                        : 'border-[#5f7db6] bg-white/[0.04] text-[#d8e7ff]'
                    }`}
                  >
                    {typeof chatError === 'string'
                      ? chatError
                      : formatChatErrorMessage(chatError)}
                  </div>
                )}
                {isChatSending && !typingAssistantTurnId && (
                  <div className="mr-auto py-2">
                    <SabyThinkingIndicator
                      stage={chatProgressStage}
                      isLightTheme={isLightTheme}
                    />
                  </div>
                )}
              </div>
            )}

            {isAuthenticated &&
              activeToolCommand === '/module' &&
              moduleDraft &&
              isModuleWorkspaceOpen && (
                <div className="fixed inset-0 z-40">
                  <div
                    className="absolute inset-0 bg-black/50"
                    onClick={() => setIsModuleWorkspaceOpen(false)}
                    aria-hidden="true"
                  />
                  <div
                    className={`absolute right-0 top-0 flex h-full w-full flex-col overflow-hidden border-l shadow-2xl sm:w-[86vw] lg:w-[72vw] xl:w-[62vw] ${
                      isLightTheme
                        ? 'border-[#ced7e8] bg-[#f7f9ff]'
                        : 'border-white/15 bg-[#121622]'
                    }`}
                  >
                    <div
                      className={`flex items-center justify-between border-b px-4 py-3 ${
                        isLightTheme ? 'border-[#d8e1f1]' : 'border-white/10'
                      }`}
                    >
                      <div>
                        <p
                          className={`text-[10px] uppercase tracking-[0.08em] ${
                            isLightTheme ? 'text-[#516388]' : 'text-[#9ab0da]'
                          }`}
                        >
                          Module Workspace
                        </p>
                        <input
                          value={moduleDraft.metadata.projectName || ''}
                          onChange={(event) =>
                            handleModuleNameChange(event.target.value)
                          }
                          placeholder="Untitled Module"
                          className={`w-full rounded-md border px-2 py-1 text-sm font-semibold sm:text-base ${
                            isLightTheme
                              ? 'border-[#d4deef] bg-white text-[#121b2d]'
                              : 'border-white/15 bg-white/[0.04] text-[#f4f5fa]'
                          }`}
                        />
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                              activeModuleRecordId
                                ? isLightTheme
                                  ? 'border-[#bdd7c8] bg-[#eaf8f0] text-[#1c6f46]'
                                  : 'border-[#2f7c52] bg-[#173728] text-[#d5ffe7]'
                                : isLightTheme
                                  ? 'border-[#d7e3fa] bg-[#f4f8ff] text-[#304d82]'
                                  : 'border-[#4b6ea4] bg-[#20304b] text-[#dbeafe]'
                            }`}
                          >
                            {activeModuleRecordId
                              ? 'Editing Existing Module'
                              : 'New Draft Module'}
                          </span>
                          {activeModuleRecordId && (
                            <span
                              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] ${
                                isLightTheme
                                  ? 'border-[#d7deea] bg-white text-[#425372]'
                                  : 'border-white/15 bg-white/[0.04] text-[#b9c8e8]'
                              }`}
                              title={activeModuleRecordId}
                            >
                              ID: {activeModuleRecordId}
                            </span>
                          )}
                          {(isModuleAutoSaving || moduleLastSavedLabel) && (
                            <span
                              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] ${
                                isLightTheme
                                  ? 'border-[#d7e3fa] bg-[#f4f8ff] text-[#304d82]'
                                  : 'border-[#4b6ea4] bg-[#20304b] text-[#dbeafe]'
                              }`}
                            >
                              {isModuleAutoSaving
                                ? 'Autosaving...'
                                : `Last saved: ${moduleLastSavedLabel}`}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void deleteActiveModule()}
                          disabled={!activeModuleRecordId}
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                            isLightTheme
                              ? 'border-[#efd3d3] bg-[#fff2f2] text-[#8b2d2d]'
                              : 'border-[#7a4343] bg-[#3e2323] text-[#ffd7d7]'
                          } disabled:cursor-not-allowed disabled:opacity-60`}
                          title={
                            activeModuleRecordId
                              ? 'Soft delete this module'
                              : 'Load a saved module from Module Library to delete it'
                          }
                        >
                          Delete Module
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsModuleWorkspaceOpen(false)}
                          className={`rounded-full border p-2 ${
                            isLightTheme
                              ? 'border-[#ced7e8] bg-white text-[#23314f]'
                              : 'border-white/20 bg-white/5 text-[#dbeafe]'
                          }`}
                          aria-label="Close module workspace"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div
                      className={`border-b px-3 py-3 ${
                        isLightTheme
                          ? 'border-[#d8e1f1] bg-[#f9fbff]'
                          : 'border-white/10 bg-white/[0.025]'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {moduleWizardSteps.map((step, index) => {
                            const active = activeModuleTab === step.key;
                            const savedSignature =
                              moduleWizardSavedStates[step.key] || '';
                            const stepComplete = Boolean(
                              savedSignature &&
                                savedSignature ===
                                  getModuleWizardSignature(step.key)
                            );
                            return (
                              <button
                                key={`module-wizard-step-${step.key}`}
                                type="button"
                                onClick={() => setActiveModuleTab(step.key)}
                                className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                                  active
                                    ? isLightTheme
                                      ? 'border-[#cfe0ff] bg-[#edf3ff] text-[#103d7a]'
                                      : 'border-[#4b6ea4] bg-[#20304b] text-[#dbeafe]'
                                    : stepComplete
                                      ? isLightTheme
                                        ? 'border-[#ccead2] bg-[#ebfaef] text-[#1f6b3a]'
                                        : 'border-[#2f7c52] bg-[#163b2a] text-[#d7ffe8]'
                                      : isLightTheme
                                        ? 'border-[#d7e3fa] bg-white text-[#3a4f78]'
                                        : 'border-white/15 bg-white/[0.03] text-[#cbd7f2]'
                                }`}
                              >
                                <span
                                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                                    active
                                      ? isLightTheme
                                        ? 'bg-[#dce8ff] text-[#103d7a]'
                                        : 'bg-[#2a4670] text-[#dbeafe]'
                                      : stepComplete
                                        ? isLightTheme
                                          ? 'bg-[#d8f4e1] text-[#1f6b3a]'
                                          : 'bg-[#20523a] text-[#d7ffe8]'
                                        : isLightTheme
                                          ? 'bg-[#eef3fb] text-[#56719a]'
                                          : 'bg-white/[0.06] text-[#b9c9ea]'
                                  }`}
                                >
                                  {stepComplete ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    index + 1
                                  )}
                                </span>
                                <span>{step.label}</span>
                              </button>
                            );
                          })}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveModuleTab(
                              activeModuleTab === 'json'
                                ? moduleWizardCurrentStep?.key || 'preview'
                                : 'json'
                            )
                          }
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                            activeModuleTab === 'json'
                              ? isLightTheme
                                ? 'border-[#cfe0ff] bg-[#edf3ff] text-[#103d7a]'
                                : 'border-[#4b6ea4] bg-[#20304b] text-[#dbeafe]'
                              : isLightTheme
                                ? 'border-[#d7e3fa] bg-white text-[#3a4f78]'
                                : 'border-white/15 bg-white/[0.03] text-[#cbd7f2]'
                          }`}
                        >
                          {activeModuleTab === 'json'
                            ? 'Back To Wizard'
                            : 'Advanced JSON'}
                        </button>
                      </div>
                    </div>

                    <div
                      className="min-h-0 flex-1 overflow-auto p-4 pb-28"
                      data-module-workspace-scroll="true"
                    >
                      <div
                        key={`module-tab-panel-${activeModuleTab}`}
                        className="translate-x-0 space-y-4 opacity-100 transition-all duration-200 ease-out"
                      >
                        {activeModuleTab === 'preview' && (
                          <div className="space-y-4">
                            <div
                              className={`rounded-xl border p-3 ${
                                isLightTheme
                                  ? 'border-[#d8e1f1] bg-white'
                                  : 'border-white/10 bg-white/[0.03]'
                              }`}
                            >
                              <h4
                                className={`mb-3 text-lg font-semibold ${
                                  isLightTheme
                                    ? 'text-[#111827]'
                                    : 'text-[#f4f5fa]'
                                }`}
                              >
                                {moduleDraft.metadata.projectName ||
                                  'Generated Module'}
                              </h4>
                              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                {moduleDraft.fields.map((field) => (
                                  <div
                                    key={`preview-${field.id}`}
                                    className="space-y-1"
                                  >
                                    <label
                                      className={`text-sm font-medium ${
                                        isLightTheme
                                          ? 'text-[#1f2b44]'
                                          : 'text-[#dbe7ff]'
                                      }`}
                                    >
                                      {field.label}
                                    </label>
                                    {field.kind === 'textarea' ? (
                                      <textarea
                                        disabled
                                        rows={3}
                                        placeholder={
                                          field.placeholder ||
                                          `Enter ${field.label.toLowerCase()}`
                                        }
                                        className={`w-full rounded-lg border px-3 py-2 text-sm ${
                                          isLightTheme
                                            ? 'border-[#d4deef] bg-[#f9fbff] text-[#2b3550]'
                                            : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                        }`}
                                      />
                                    ) : field.kind === 'select' ||
                                      field.kind === 'radio' ? (
                                      <select
                                        disabled
                                        className={`w-full rounded-lg border px-3 py-2 text-sm ${
                                          isLightTheme
                                            ? 'border-[#d4deef] bg-[#f9fbff] text-[#2b3550]'
                                            : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                        }`}
                                      >
                                        <option>
                                          {field.placeholder || 'Select option'}
                                        </option>
                                      </select>
                                    ) : (
                                      <input
                                        disabled
                                        type={
                                          field.kind === 'number'
                                            ? 'number'
                                            : field.kind === 'email'
                                              ? 'email'
                                              : 'text'
                                        }
                                        placeholder={
                                          field.placeholder ||
                                          `Enter ${field.label.toLowerCase()}`
                                        }
                                        className={`w-full rounded-lg border px-3 py-2 text-sm ${
                                          isLightTheme
                                            ? 'border-[#d4deef] bg-[#f9fbff] text-[#2b3550]'
                                            : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                        }`}
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {activeModuleTab === 'json' && (
                          <pre
                            className={`max-h-[75vh] overflow-auto rounded-xl border p-3 text-[12px] ${
                              isLightTheme
                                ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                : 'border-white/10 bg-[#1f2430] text-[#d9e1f5]'
                            }`}
                          >
                            {JSON.stringify(moduleDraft, null, 2)}
                          </pre>
                        )}

                        {activeModuleTab === 'builder' && (
                          <div
                            className={`space-y-3 rounded-xl border p-4 text-sm ${
                              isLightTheme
                                ? 'border-[#d8e1f1] bg-white text-[#2b3550]'
                                : 'border-white/10 bg-white/[0.03] text-[#d9e1f5]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold">Visual Builder</p>
                              <button
                                type="button"
                                onClick={handleModuleAddField}
                                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                  isLightTheme
                                    ? 'border-[#d7e3fa] bg-[#f4f8ff] text-[#204070]'
                                    : 'border-[#3f5f90] bg-[#1f2e48] text-[#dbeafe]'
                                }`}
                              >
                                Add Field
                              </button>
                            </div>
                            <div className="space-y-2">
                              {moduleDraft.fields.map((field) => (
                                <div
                                  key={`builder-${field.id}`}
                                  className={`rounded-lg border p-2 ${
                                    isLightTheme
                                      ? 'border-[#e1e8f5] bg-[#fbfdff]'
                                      : 'border-white/10 bg-white/[0.03]'
                                  }`}
                                >
                                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
                                    <input
                                      value={field.label}
                                      onChange={(event) =>
                                        handleModuleFieldUpdate(field.id, {
                                          label: event.target.value,
                                        })
                                      }
                                      className={`rounded-md border px-2 py-1.5 text-xs sm:col-span-5 ${
                                        isLightTheme
                                          ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                          : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                      }`}
                                    />
                                    <select
                                      value={field.kind}
                                      onChange={(event) =>
                                        handleModuleFieldUpdate(field.id, {
                                          kind: event.target.value,
                                        })
                                      }
                                      className={`rounded-md border px-2 py-1.5 text-xs sm:col-span-3 ${
                                        isLightTheme
                                          ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                          : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                      }`}
                                    >
                                      {[
                                        'text',
                                        'textarea',
                                        'number',
                                        'email',
                                        'phone',
                                        'date',
                                        'time',
                                        'datetime',
                                        'select',
                                        'radio',
                                        'checkbox',
                                        'file',
                                      ].map((kind) => (
                                        <option
                                          key={`${field.id}-${kind}`}
                                          value={kind}
                                        >
                                          {kind}
                                        </option>
                                      ))}
                                    </select>
                                    <label className="inline-flex items-center gap-1 text-xs sm:col-span-2">
                                      <input
                                        type="checkbox"
                                        checked={Boolean(
                                          field.validation?.required
                                        )}
                                        onChange={(event) =>
                                          handleModuleFieldUpdate(field.id, {
                                            required: event.target.checked,
                                          })
                                        }
                                      />
                                      Required
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleModuleRemoveField(field.id)
                                      }
                                      className={`rounded-md border px-2 py-1.5 text-xs sm:col-span-2 ${
                                        isLightTheme
                                          ? 'border-[#efd3d3] bg-[#fff2f2] text-[#8b2d2d]'
                                          : 'border-[#7a4343] bg-[#3e2323] text-[#ffd7d7]'
                                      }`}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                  {['select', 'radio', 'checkbox'].includes(
                                    field.kind
                                  ) && (
                                    <div className="mt-2">
                                      <input
                                        value={
                                          Array.isArray(field.options)
                                            ? field.options.join(', ')
                                            : ''
                                        }
                                        onChange={(event) =>
                                          handleModuleFieldUpdate(field.id, {
                                            options: event.target.value
                                              .split(',')
                                              .map((item) => item.trim())
                                              .filter(Boolean),
                                          })
                                        }
                                        placeholder="Options (comma-separated): Option A, Option B, Option C"
                                        className={`w-full rounded-md border px-2 py-1.5 text-xs ${
                                          isLightTheme
                                            ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                            : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                        }`}
                                      />
                                    </div>
                                  )}
                                  <div
                                    className={`mt-1.5 flex flex-wrap gap-1 text-[10px] ${
                                      isLightTheme
                                        ? 'text-[#5a6f95]'
                                        : 'text-[#9bb0d3]'
                                    }`}
                                  >
                                    {!field.key ? (
                                      <span
                                        className={`rounded-full border px-2 py-0.5 ${
                                          isLightTheme
                                            ? 'border-[#f4c4c4] bg-[#fff1f1] text-[#9a3434]'
                                            : 'border-[#7a4343] bg-[#3e2323] text-[#ffd7d7]'
                                        }`}
                                      >
                                        Missing field key
                                      </span>
                                    ) : null}
                                    {!field.label?.trim() ? (
                                      <span
                                        className={`rounded-full border px-2 py-0.5 ${
                                          isLightTheme
                                            ? 'border-[#f4c4c4] bg-[#fff1f1] text-[#9a3434]'
                                            : 'border-[#7a4343] bg-[#3e2323] text-[#ffd7d7]'
                                        }`}
                                      >
                                        Missing label
                                      </span>
                                    ) : null}
                                    <span
                                      className={`rounded-full border px-2 py-0.5 ${
                                        isLightTheme
                                          ? 'border-[#d9e4f7] bg-[#f6f9ff] text-[#3f5d8d]'
                                          : 'border-white/20 bg-white/[0.04] text-[#b9c9ea]'
                                      }`}
                                    >
                                      key: {field.key || 'unset'}
                                    </span>
                                    <span
                                      className={`rounded-full border px-2 py-0.5 ${
                                        isLightTheme
                                          ? 'border-[#d9e4f7] bg-[#f6f9ff] text-[#3f5d8d]'
                                          : 'border-white/20 bg-white/[0.04] text-[#b9c9ea]'
                                      }`}
                                    >
                                      type: {field.kind}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {activeModuleTab === 'workflow' && (
                          <div
                            className={`space-y-3 rounded-xl border p-4 text-sm ${
                              isLightTheme
                                ? 'border-[#d8e1f1] bg-white text-[#2b3550]'
                                : 'border-white/10 bg-white/[0.03] text-[#d9e1f5]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold">Workflow</p>
                              <label className="inline-flex items-center gap-2 text-xs">
                                <input
                                  type="checkbox"
                                  checked={moduleDraft.workflow.enabled}
                                  onChange={(event) =>
                                    handleModuleWorkflowToggle(
                                      event.target.checked
                                    )
                                  }
                                />
                                Enabled
                              </label>
                            </div>
                            {moduleDraft.workflow.enabled && (
                              <>
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                  <label className="inline-flex items-center gap-2 text-xs">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(
                                        moduleDraft.workflow?.notifications
                                          ?.onEveryIncident
                                      )}
                                      onChange={(event) =>
                                        handleModuleWorkflowIncidentNotificationToggle(
                                          event.target.checked
                                        )
                                      }
                                    />
                                    Notify eligible roles on every workflow
                                    incident
                                  </label>
                                  <div className="text-xs opacity-75 sm:text-right">
                                    {moduleRolesLoading
                                      ? 'Loading roles...'
                                      : moduleRolesError
                                        ? moduleRolesError
                                        : `${moduleRoleList.length} roles available`}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={handleModuleWorkflowAddStep}
                                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                    isLightTheme
                                      ? 'border-[#d7e3fa] bg-[#f4f8ff] text-[#204070]'
                                      : 'border-[#3f5f90] bg-[#1f2e48] text-[#dbeafe]'
                                  }`}
                                >
                                  Add Step
                                </button>
                                <div className="space-y-2">
                                  {(Array.isArray(moduleDraft.workflow.steps)
                                    ? moduleDraft.workflow.steps
                                    : []
                                  ).map((step) => (
                                    <div
                                      key={`wf-${step.id}`}
                                      className={`rounded-lg border p-2 ${
                                        isLightTheme
                                          ? 'border-[#e1e8f5] bg-[#fbfdff]'
                                          : 'border-white/10 bg-white/[0.03]'
                                      }`}
                                    >
                                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
                                        <input
                                          value={step.name}
                                          onChange={(event) =>
                                            handleModuleWorkflowUpdateStep(
                                              step.id,
                                              {
                                                name: event.target.value,
                                              }
                                            )
                                          }
                                          className={`rounded-md border px-2 py-1.5 text-xs sm:col-span-5 ${
                                            isLightTheme
                                              ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                              : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                          }`}
                                        />
                                        <div
                                          className={`rounded-md border px-2 py-1.5 text-xs sm:col-span-5 ${
                                            isLightTheme
                                              ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                              : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                          }`}
                                        >
                                          <p className="mb-1 text-[10px] opacity-70">
                                            Eligible roles
                                          </p>
                                          <div className="flex max-h-20 flex-wrap gap-1 overflow-y-auto">
                                            {(moduleRoleList || []).map(
                                              (role) => {
                                                const selected = Boolean(
                                                  step?.allowedRoles?.includes(
                                                    role.name
                                                  )
                                                );
                                                return (
                                                  <button
                                                    key={`wf-role-${step.id}-${role.id}`}
                                                    type="button"
                                                    onClick={() =>
                                                      handleModuleWorkflowToggleRole(
                                                        step.id,
                                                        role.name
                                                      )
                                                    }
                                                    className={`rounded-full border px-2 py-0.5 text-[10px] ${
                                                      selected
                                                        ? isLightTheme
                                                          ? 'border-[#9ec4ff] bg-[#e8f1ff] text-[#15407a]'
                                                          : 'border-[#4f73a8] bg-[#1f3558] text-[#dbeafe]'
                                                        : isLightTheme
                                                          ? 'border-[#d4deef] bg-white text-[#5b6e8c]'
                                                          : 'border-white/15 bg-white/[0.03] text-[#a8b6d1]'
                                                    }`}
                                                  >
                                                    {role.name}
                                                  </button>
                                                );
                                              }
                                            )}
                                          </div>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleModuleWorkflowRemoveStep(
                                              step.id
                                            )
                                          }
                                          className={`rounded-md border px-2 py-1.5 text-xs sm:col-span-2 ${
                                            isLightTheme
                                              ? 'border-[#efd3d3] bg-[#fff2f2] text-[#8b2d2d]'
                                              : 'border-[#7a4343] bg-[#3e2323] text-[#ffd7d7]'
                                          }`}
                                        >
                                          Remove
                                        </button>
                                      </div>
                                      {(!Array.isArray(step?.allowedRoles) ||
                                        step.allowedRoles.length === 0) && (
                                        <p className="mt-2 text-[11px] text-[#d97777]">
                                          Select at least one eligible role for
                                          this step.
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {activeModuleTab === 'payment' && (
                          <div
                            className={`space-y-3 rounded-xl border p-4 text-sm ${
                              isLightTheme
                                ? 'border-[#d8e1f1] bg-white text-[#2b3550]'
                                : 'border-white/10 bg-white/[0.03] text-[#d9e1f5]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold">Payment Policy</p>
                              <button
                                type="button"
                                onClick={() => void fetchModuleNodesCatalog()}
                                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                  isLightTheme
                                    ? 'border-[#d7e3fa] bg-[#f4f8ff] text-[#204070]'
                                    : 'border-[#3f5f90] bg-[#1f2e48] text-[#dbeafe]'
                                }`}
                              >
                                Refresh Nodes
                              </button>
                            </div>
                            <label className="inline-flex items-center gap-2 text-xs">
                              <input
                                type="checkbox"
                                checked={Boolean(moduleDraft.payment?.enabled)}
                                onChange={(event) =>
                                  handleModulePaymentUpdate({
                                    enabled: event.target.checked,
                                  })
                                }
                              />
                              Enable payment policy
                            </label>
                            <p className="text-[11px] opacity-75">
                              {moduleNodesLoading
                                ? 'Loading node attributes...'
                                : moduleNodeAttributeKeys.length > 0
                                  ? `${moduleNodeAttributeKeys.length} node attributes available for active income derivation.`
                                  : 'No node attributes detected yet.'}
                            </p>
                            {!moduleNodesLoading && (
                              <p className="text-[11px] opacity-75">
                                Nodes: {moduleNodeList.length} | Families:{' '}
                                {moduleFamilyRoots.length} | Levels:{' '}
                                {moduleNodeLevels.length}
                                {moduleNodeList.length === 0
                                  ? ' (No nodes returned for this tenant/session. Refresh or verify tenant data.)'
                                  : ''}
                              </p>
                            )}
                            {!moduleNodesLoading &&
                              moduleNodeLevels.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {moduleNodeLevels
                                    .slice(0, 12)
                                    .map((level) => (
                                      <span
                                        key={`payment-level-chip-${level.id}`}
                                        className={`rounded-full border px-2 py-0.5 text-[10px] ${
                                          isLightTheme
                                            ? 'border-[#d7e3fa] bg-[#f4f8ff] text-[#204070]'
                                            : 'border-[#3f5f90] bg-[#1f2e48] text-[#dbeafe]'
                                        }`}
                                      >
                                        {level.name}
                                      </span>
                                    ))}
                                </div>
                              )}
                            <div
                              className={`grid grid-cols-2 gap-2 rounded-lg border p-3 text-[11px] sm:grid-cols-4 ${
                                isLightTheme
                                  ? 'border-[#d8e1f1] bg-[#f8fbff] text-[#35507d]'
                                  : 'border-white/10 bg-white/[0.02] text-[#b4c6e8]'
                              }`}
                            >
                              <div>
                                <p className="opacity-70">Policies</p>
                                <p className="text-sm font-semibold">
                                  {paymentPolicySummary.total}
                                </p>
                              </div>
                              <div>
                                <p className="opacity-70">Steady</p>
                                <p className="text-sm font-semibold">
                                  {paymentPolicySummary.steady}
                                </p>
                              </div>
                              <div>
                                <p className="opacity-70">Active</p>
                                <p className="text-sm font-semibold">
                                  {paymentPolicySummary.active}
                                </p>
                              </div>
                              <div>
                                <p className="opacity-70">
                                  Impacted Nodes (est.)
                                </p>
                                <p className="text-sm font-semibold">
                                  {paymentPolicySummary.estimatedImpactedNodes}
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              <input
                                value={moduleDraft.payment?.currency || 'NGN'}
                                onChange={(event) =>
                                  handleModulePaymentUpdate({
                                    currency: event.target.value.toUpperCase(),
                                  })
                                }
                                placeholder="Currency"
                                className={`rounded-md border px-2 py-1.5 text-xs ${
                                  isLightTheme
                                    ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                    : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                }`}
                              />
                              <select
                                value={String(
                                  moduleDraft.payment?.collectionStage ||
                                    'before_submit'
                                )}
                                onChange={(event) =>
                                  handleModulePaymentUpdate({
                                    collectionStage: event.target.value,
                                  })
                                }
                                className={`rounded-md border px-2 py-1.5 text-xs ${
                                  isLightTheme
                                    ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                    : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                }`}
                              >
                                <option value="before_submit">
                                  Collect before submit
                                </option>
                                <option value="before_approval">
                                  Collect before approval
                                </option>
                                <option value="after_approval">
                                  Collect after approval
                                </option>
                              </select>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                postModuleUpdateSummary(
                                  'Updated payment policy in module draft.'
                                )
                              }
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                isLightTheme
                                  ? 'border-[#d7e3fa] bg-[#f4f8ff] text-[#204070]'
                                  : 'border-[#3f5f90] bg-[#1f2e48] text-[#dbeafe]'
                              }`}
                            >
                              Save Payment Policy
                            </button>
                            <div
                              className={`space-y-2 rounded-lg border p-3 ${
                                isLightTheme
                                  ? 'border-[#d8e1f1] bg-[#f8fbff]'
                                  : 'border-white/10 bg-white/[0.02]'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-semibold">
                                  Payment Policies
                                  (All/Node/Family/Level/Category)
                                </p>
                                <button
                                  type="button"
                                  onClick={handlePaymentPolicyAdd}
                                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                                    isLightTheme
                                      ? 'border-[#d7e3fa] bg-[#f4f8ff] text-[#204070]'
                                      : 'border-[#3f5f90] bg-[#1f2e48] text-[#dbeafe]'
                                  }`}
                                >
                                  Add Policy
                                </button>
                              </div>
                              {paymentPolicies.length === 0 && (
                                <p className="text-[11px] opacity-75">
                                  No payment policies yet. Add one to target all
                                  nodes, a node family, level, category, or a
                                  specific node.
                                </p>
                              )}
                              <div className="space-y-2">
                                {paymentPolicies.map(
                                  (policy: any, index: number) => {
                                    const scopeType = String(
                                      policy?.scopeType || 'node'
                                    );
                                    const scopeRef = String(
                                      policy?.scopeRef || ''
                                    );
                                    const mode = normalizeIncomeMode(
                                      String(policy?.mode || 'steady')
                                    );
                                    const activeConfig =
                                      policy?.activeConfig &&
                                      typeof policy.activeConfig === 'object'
                                        ? policy.activeConfig
                                        : {};
                                    const analysisDomain = String(
                                      moduleDraft?.analysis?.domain || 'custom'
                                    );
                                    const presetKey = [
                                      'finance',
                                      'attendance',
                                      'hr',
                                      'operations',
                                    ].includes(analysisDomain)
                                      ? analysisDomain
                                      : 'custom';
                                    const derivationPresets =
                                      PAYMENT_DERIVATION_PRESETS[presetKey] ||
                                      PAYMENT_DERIVATION_PRESETS.custom;
                                    const numericFields = (
                                      Array.isArray(moduleDraft?.fields)
                                        ? moduleDraft.fields
                                        : []
                                    ).filter((field: any) =>
                                      ['number'].includes(
                                        String(field?.kind || '').toLowerCase()
                                      )
                                    );
                                    const dryRunKey = String(
                                      policy?.id || index
                                    );
                                    const dryRunInput = paymentDryRunInputs[
                                      dryRunKey
                                    ] || {
                                      fieldValue: 10000,
                                      nodeValue: 5000,
                                    };
                                    const settingsBuffer =
                                      paymentSettingsBuffers[dryRunKey] ??
                                      JSON.stringify(
                                        policy?.settings || {},
                                        null,
                                        2
                                      );
                                    const levelNodeCounts = new Map<
                                      string,
                                      number
                                    >();
                                    moduleNodeList.forEach((node: any) => {
                                      const key = String(node?.levelId || '');
                                      if (!key) return;
                                      levelNodeCounts.set(
                                        key,
                                        (levelNodeCounts.get(key) || 0) + 1
                                      );
                                    });
                                    const nodeOptions =
                                      scopeType === 'all'
                                        ? []
                                        : scopeType === 'node'
                                          ? moduleNodeList
                                          : scopeType === 'family'
                                            ? moduleFamilyRoots
                                            : scopeType === 'level'
                                              ? moduleNodeLevels
                                              : [];
                                    const breakdown = Array.isArray(
                                      policy?.breakdown
                                    )
                                      ? policy.breakdown
                                      : [];
                                    const line0 = breakdown[0] || {
                                      id: `line_${index + 1}`,
                                      recipientType: 'platform',
                                      mode: 'percentage',
                                      value: 100,
                                    };
                                    const activeFieldKey = String(
                                      activeConfig?.fieldKey || ''
                                    );
                                    const activeNodeAttributeKey = String(
                                      activeConfig?.nodeAttributeKey || ''
                                    );
                                    const dryNodeValues: Record<string, any> =
                                      {};
                                    if (activeNodeAttributeKey) {
                                      const parts =
                                        activeNodeAttributeKey.split('.');
                                      let cursor: Record<string, any> =
                                        dryNodeValues;
                                      parts.forEach((part, partIndex) => {
                                        if (partIndex === parts.length - 1) {
                                          cursor[part] = Number(
                                            dryRunInput.nodeValue || 0
                                          );
                                        } else {
                                          if (
                                            !cursor[part] ||
                                            typeof cursor[part] !== 'object'
                                          ) {
                                            cursor[part] = {};
                                          }
                                          cursor = cursor[part];
                                        }
                                      });
                                    }
                                    const dryEval = evaluatePaymentExpression(
                                      String(policy?.formula || '0'),
                                      {
                                        fieldValues: activeFieldKey
                                          ? {
                                              [activeFieldKey]: Number(
                                                dryRunInput.fieldValue || 0
                                              ),
                                            }
                                          : {},
                                        nodeValues: dryNodeValues,
                                      }
                                    );
                                    return (
                                      <div
                                        key={`policy-${policy?.id || index}`}
                                        className={`space-y-2 rounded-md border p-2 ${
                                          isLightTheme
                                            ? 'border-[#dbe4f3] bg-white'
                                            : 'border-white/10 bg-white/[0.03]'
                                        }`}
                                      >
                                        <div className="flex flex-wrap items-center gap-1 text-[10px] font-semibold opacity-80">
                                          <span className="rounded-full border px-2 py-0.5">
                                            1. Type
                                          </span>
                                          <span className="rounded-full border px-2 py-0.5">
                                            2. Target
                                          </span>
                                          <span className="rounded-full border px-2 py-0.5">
                                            3. Amount Rule
                                          </span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
                                          <input
                                            value={String(policy?.name || '')}
                                            onChange={(event) =>
                                              handlePaymentPolicyUpdate(index, {
                                                name: event.target.value,
                                              })
                                            }
                                            placeholder="Policy name"
                                            className={`rounded-md border px-2 py-1.5 text-xs sm:col-span-3 ${
                                              isLightTheme
                                                ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                                : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                            }`}
                                          />
                                          <select
                                            value={scopeType}
                                            onChange={(event) =>
                                              handlePaymentPolicyUpdate(index, {
                                                scopeType: event.target.value,
                                                scopeRef: '',
                                              })
                                            }
                                            className={`rounded-md border px-2 py-1.5 text-xs sm:col-span-2 ${
                                              isLightTheme
                                                ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                                : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                            }`}
                                          >
                                            <option value="all">
                                              All Nodes
                                            </option>
                                            <option value="node">Node</option>
                                            <option value="family">
                                              Family
                                            </option>
                                            <option value="level">Level</option>
                                            <option value="category">
                                              Category
                                            </option>
                                          </select>
                                          {scopeType === 'all' ? (
                                            <div
                                              className={`rounded-md border px-2 py-1.5 text-xs sm:col-span-3 ${
                                                isLightTheme
                                                  ? 'border-[#d4deef] bg-[#f8fbff] text-[#5a6f95]'
                                                  : 'border-white/15 bg-white/[0.04] text-[#a8b6d1]'
                                              }`}
                                            >
                                              Applies to all nodes
                                            </div>
                                          ) : scopeType === 'category' ? (
                                            <input
                                              value={scopeRef}
                                              onChange={(event) =>
                                                handlePaymentPolicyUpdate(
                                                  index,
                                                  {
                                                    scopeRef:
                                                      event.target.value,
                                                  }
                                                )
                                              }
                                              placeholder="Category key/value"
                                              className={`rounded-md border px-2 py-1.5 text-xs sm:col-span-3 ${
                                                isLightTheme
                                                  ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                                  : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                              }`}
                                            />
                                          ) : (
                                            <select
                                              value={scopeRef}
                                              onChange={(event) =>
                                                handlePaymentPolicyUpdate(
                                                  index,
                                                  {
                                                    scopeRef:
                                                      event.target.value,
                                                  }
                                                )
                                              }
                                              className={`rounded-md border px-2 py-1.5 text-xs sm:col-span-3 ${
                                                isLightTheme
                                                  ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                                  : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                              }`}
                                            >
                                              <option value="">
                                                Select target
                                              </option>
                                              {nodeOptions.map((opt: any) => (
                                                <option
                                                  key={`scope-${scopeType}-${opt.id}`}
                                                  value={opt.id}
                                                >
                                                  {scopeType === 'node'
                                                    ? `${opt.name} (${opt.levelName || 'Unknown Level'})`
                                                    : scopeType === 'family'
                                                      ? `${opt.name} (${opt.levelName || 'Unknown Level'})`
                                                      : scopeType === 'level'
                                                        ? `${opt.name} (${levelNodeCounts.get(String(opt.id)) || 0} nodes)`
                                                        : opt.name}
                                                </option>
                                              ))}
                                            </select>
                                          )}
                                          <select
                                            value={mode}
                                            onChange={(event) =>
                                              handlePaymentPolicyUpdate(index, {
                                                mode: event.target.value,
                                              })
                                            }
                                            className={`rounded-md border px-2 py-1.5 text-xs sm:col-span-2 ${
                                              isLightTheme
                                                ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                                : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                            }`}
                                          >
                                            <option value="steady">
                                              Steady Income
                                            </option>
                                            <option value="active">
                                              Active Income
                                            </option>
                                          </select>
                                          <div
                                            className={`rounded-md border px-2 py-1.5 text-xs sm:col-span-1 ${
                                              isLightTheme
                                                ? 'border-[#d4deef] bg-[#f8fbff] text-[#2b3550]'
                                                : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                            }`}
                                          >
                                            {mode === 'steady'
                                              ? 'Steady rule'
                                              : 'Active rule'}
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handlePaymentPolicyRemove(index)
                                            }
                                            className={`rounded-md border px-2 py-1.5 text-xs sm:col-span-1 ${
                                              isLightTheme
                                                ? 'border-[#efd3d3] bg-[#fff2f2] text-[#8b2d2d]'
                                                : 'border-[#7a4343] bg-[#3e2323] text-[#ffd7d7]'
                                            }`}
                                          >
                                            Remove
                                          </button>
                                        </div>
                                        <div
                                          className={`space-y-2 rounded-md border p-2 ${
                                            isLightTheme
                                              ? 'border-[#dbe4f3] bg-[#f8fbff]'
                                              : 'border-white/10 bg-white/[0.02]'
                                          }`}
                                        >
                                          <p className="text-[11px] font-semibold">
                                            Step 3: Amount Rule
                                          </p>
                                          {mode === 'steady' ? (
                                            <input
                                              type="number"
                                              value={Number(
                                                policy?.fixedAmount ?? 0
                                              )}
                                              onChange={(event) =>
                                                handlePaymentPolicyUpdate(
                                                  index,
                                                  {
                                                    fixedAmount: Number(
                                                      event.target.value || 0
                                                    ),
                                                  }
                                                )
                                              }
                                              placeholder="Enter steady amount"
                                              className={`w-full rounded-md border px-2 py-1.5 text-xs ${
                                                isLightTheme
                                                  ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                                  : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                              }`}
                                            />
                                          ) : (
                                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                                              <select
                                                value={String(
                                                  activeConfig?.deriveFrom ||
                                                    'field_percentage'
                                                )}
                                                onChange={(event) =>
                                                  handlePaymentPolicyUpdate(
                                                    index,
                                                    {
                                                      activeConfig: {
                                                        ...(activeConfig || {}),
                                                        deriveFrom:
                                                          event.target.value,
                                                      },
                                                    }
                                                  )
                                                }
                                                className={`rounded-md border px-2 py-1.5 text-xs ${
                                                  isLightTheme
                                                    ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                                    : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                                }`}
                                              >
                                                <option value="field_percentage">
                                                  Field %
                                                </option>
                                                <option value="expression">
                                                  Expression
                                                </option>
                                                <option value="node_attribute">
                                                  Node Attribute
                                                </option>
                                                <option value="combined">
                                                  Combined
                                                </option>
                                              </select>
                                              <select
                                                value={String(
                                                  activeConfig?.fieldKey || ''
                                                )}
                                                onChange={(event) =>
                                                  handlePaymentPolicyUpdate(
                                                    index,
                                                    {
                                                      activeConfig: {
                                                        ...(activeConfig || {}),
                                                        fieldKey:
                                                          event.target.value,
                                                      },
                                                    }
                                                  )
                                                }
                                                className={`rounded-md border px-2 py-1.5 text-xs ${
                                                  isLightTheme
                                                    ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                                    : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                                }`}
                                              >
                                                <option value="">
                                                  Form numeric field
                                                </option>
                                                {numericFields.map(
                                                  (field: any) => (
                                                    <option
                                                      key={`pay-simple-field-${policy?.id || index}-${field.id}`}
                                                      value={field.key}
                                                    >
                                                      {field.label || field.key}
                                                    </option>
                                                  )
                                                )}
                                              </select>
                                              <input
                                                type="number"
                                                value={Number(
                                                  activeConfig?.percentage || 0
                                                )}
                                                onChange={(event) =>
                                                  handlePaymentPolicyUpdate(
                                                    index,
                                                    {
                                                      activeConfig: {
                                                        ...(activeConfig || {}),
                                                        percentage: Number(
                                                          event.target.value ||
                                                            0
                                                        ),
                                                      },
                                                    }
                                                  )
                                                }
                                                placeholder="%"
                                                className={`rounded-md border px-2 py-1.5 text-xs ${
                                                  isLightTheme
                                                    ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                                    : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                                }`}
                                              />
                                              <select
                                                value={String(
                                                  activeConfig?.nodeAttributeKey ||
                                                    ''
                                                )}
                                                onChange={(event) =>
                                                  handlePaymentPolicyUpdate(
                                                    index,
                                                    {
                                                      activeConfig: {
                                                        ...(activeConfig || {}),
                                                        nodeAttributeKey:
                                                          event.target.value,
                                                      },
                                                    }
                                                  )
                                                }
                                                className={`rounded-md border px-2 py-1.5 text-xs ${
                                                  isLightTheme
                                                    ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                                    : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                                }`}
                                              >
                                                <option value="">
                                                  Node attribute
                                                </option>
                                                {moduleNodeAttributeKeys.map(
                                                  (attr) => (
                                                    <option
                                                      key={`pay-simple-attr-${policy?.id || index}-${attr}`}
                                                      value={attr}
                                                    >
                                                      {attr}
                                                    </option>
                                                  )
                                                )}
                                              </select>
                                            </div>
                                          )}
                                        </div>
                                        <details className="rounded-md border border-dashed p-2 text-xs">
                                          <summary className="cursor-pointer font-semibold opacity-80">
                                            Optional Advanced Settings
                                          </summary>
                                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
                                            {mode === 'active' && (
                                              <>
                                                <select
                                                  value={String(
                                                    activeConfig?.deriveFrom ||
                                                      'field_percentage'
                                                  )}
                                                  onChange={(event) =>
                                                    handlePaymentPolicyUpdate(
                                                      index,
                                                      {
                                                        activeConfig: {
                                                          ...(activeConfig ||
                                                            {}),
                                                          deriveFrom:
                                                            event.target.value,
                                                        },
                                                      }
                                                    )
                                                  }
                                                  className={`rounded-md border px-2 py-1.5 text-xs sm:col-span-3 ${
                                                    isLightTheme
                                                      ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                                      : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                                  }`}
                                                >
                                                  <option value="field_percentage">
                                                    Percent of form field
                                                  </option>
                                                  <option value="expression">
                                                    Programmatic expression
                                                  </option>
                                                  <option value="node_attribute">
                                                    Node attribute
                                                  </option>
                                                  <option value="combined">
                                                    Combined derivation
                                                  </option>
                                                </select>
                                                <select
                                                  value={String(
                                                    activeConfig?.fieldKey || ''
                                                  )}
                                                  onChange={(event) =>
                                                    handlePaymentPolicyUpdate(
                                                      index,
                                                      {
                                                        activeConfig: {
                                                          ...(activeConfig ||
                                                            {}),
                                                          fieldKey:
                                                            event.target.value,
                                                        },
                                                      }
                                                    )
                                                  }
                                                  className={`rounded-md border px-2 py-1.5 text-xs sm:col-span-3 ${
                                                    isLightTheme
                                                      ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                                      : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                                  }`}
                                                >
                                                  <option value="">
                                                    Amount field
                                                  </option>
                                                  {numericFields.map(
                                                    (field: any) => (
                                                      <option
                                                        key={`pay-field-${policy?.id || index}-${field.id}`}
                                                        value={field.key}
                                                      >
                                                        {field.label ||
                                                          field.key}
                                                      </option>
                                                    )
                                                  )}
                                                </select>
                                                <input
                                                  type="number"
                                                  value={Number(
                                                    activeConfig?.percentage ||
                                                      0
                                                  )}
                                                  onChange={(event) =>
                                                    handlePaymentPolicyUpdate(
                                                      index,
                                                      {
                                                        activeConfig: {
                                                          ...(activeConfig ||
                                                            {}),
                                                          percentage: Number(
                                                            event.target
                                                              .value || 0
                                                          ),
                                                        },
                                                      }
                                                    )
                                                  }
                                                  placeholder="%"
                                                  className={`rounded-md border px-2 py-1.5 text-xs sm:col-span-1 ${
                                                    isLightTheme
                                                      ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                                      : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                                  }`}
                                                />
                                                <select
                                                  value={String(
                                                    activeConfig?.nodeAttributeKey ||
                                                      ''
                                                  )}
                                                  onChange={(event) =>
                                                    handlePaymentPolicyUpdate(
                                                      index,
                                                      {
                                                        activeConfig: {
                                                          ...(activeConfig ||
                                                            {}),
                                                          nodeAttributeKey:
                                                            event.target.value,
                                                        },
                                                      }
                                                    )
                                                  }
                                                  className={`rounded-md border px-2 py-1.5 text-xs sm:col-span-2 ${
                                                    isLightTheme
                                                      ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                                      : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                                  }`}
                                                >
                                                  <option value="">
                                                    Node attribute
                                                  </option>
                                                  {moduleNodeAttributeKeys.map(
                                                    (attr) => (
                                                      <option
                                                        key={`pay-attr-${policy?.id || index}-${attr}`}
                                                        value={attr}
                                                      >
                                                        {attr}
                                                      </option>
                                                    )
                                                  )}
                                                </select>
                                                <div className="flex flex-wrap gap-1 sm:col-span-3">
                                                  {derivationPresets.map(
                                                    (preset) => (
                                                      <button
                                                        key={`preset-${policy?.id || index}-${preset.id}`}
                                                        type="button"
                                                        onClick={() =>
                                                          handleApplyPaymentPreset(
                                                            index,
                                                            preset
                                                          )
                                                        }
                                                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                                                          isLightTheme
                                                            ? 'border-[#d7e3fa] bg-[#f4f8ff] text-[#204070]'
                                                            : 'border-[#3f5f90] bg-[#1f2e48] text-[#dbeafe]'
                                                        }`}
                                                      >
                                                        {preset.label}
                                                      </button>
                                                    )
                                                  )}
                                                </div>
                                              </>
                                            )}
                                            <input
                                              value={
                                                Array.isArray(
                                                  policy?.conditions
                                                )
                                                  ? policy.conditions.join(
                                                      ' && '
                                                    )
                                                  : ''
                                              }
                                              onChange={(event) =>
                                                handlePaymentPolicyUpdate(
                                                  index,
                                                  {
                                                    conditions: event.target
                                                      .value
                                                      ? event.target.value
                                                          .split('&&')
                                                          .map((x: string) =>
                                                            x.trim()
                                                          )
                                                          .filter(Boolean)
                                                      : [],
                                                  }
                                                )
                                              }
                                              placeholder="Conditions (e.g. field.membership_type == 'gold' && node.state == 'Lagos')"
                                              className={`rounded-md border px-2 py-1.5 text-xs ${
                                                mode === 'active'
                                                  ? 'sm:col-span-5'
                                                  : 'sm:col-span-7'
                                              } ${
                                                isLightTheme
                                                  ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                                  : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                              }`}
                                            />
                                            {mode === 'active' && (
                                              <input
                                                value={String(
                                                  activeConfig?.expression || ''
                                                )}
                                                onChange={(event) =>
                                                  handlePaymentPolicyUpdate(
                                                    index,
                                                    {
                                                      activeConfig: {
                                                        ...(activeConfig || {}),
                                                        expression:
                                                          event.target.value,
                                                      },
                                                    }
                                                  )
                                                }
                                                placeholder="Programmatic expression override"
                                                className={`rounded-md border px-2 py-1.5 text-xs sm:col-span-2 ${
                                                  isLightTheme
                                                    ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                                    : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                                }`}
                                              />
                                            )}
                                            <select
                                              value={String(
                                                line0?.recipientType ||
                                                  'platform'
                                              )}
                                              onChange={(event) =>
                                                handlePaymentPolicyUpdate(
                                                  index,
                                                  {
                                                    breakdown: [
                                                      {
                                                        ...line0,
                                                        recipientType:
                                                          event.target.value,
                                                      },
                                                    ],
                                                  }
                                                )
                                              }
                                              className={`rounded-md border px-2 py-1.5 text-xs sm:col-span-2 ${
                                                isLightTheme
                                                  ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                                  : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                              }`}
                                            >
                                              <option value="platform">
                                                Platform
                                              </option>
                                              <option value="tenant">
                                                Tenant
                                              </option>
                                              <option value="node">Node</option>
                                              <option value="family">
                                                Family
                                              </option>
                                              <option value="level">
                                                Level
                                              </option>
                                              <option value="category">
                                                Category
                                              </option>
                                            </select>
                                            <input
                                              type="number"
                                              value={Number(
                                                line0?.value ?? 100
                                              )}
                                              onChange={(event) =>
                                                handlePaymentPolicyUpdate(
                                                  index,
                                                  {
                                                    breakdown: [
                                                      {
                                                        ...line0,
                                                        value: Number(
                                                          event.target.value ||
                                                            0
                                                        ),
                                                      },
                                                    ],
                                                  }
                                                )
                                              }
                                              placeholder="% or amount"
                                              className={`rounded-md border px-2 py-1.5 text-xs sm:col-span-1 ${
                                                isLightTheme
                                                  ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                                  : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                              }`}
                                            />
                                            <div className="flex items-center gap-3 text-[11px] sm:col-span-2">
                                              <label className="inline-flex items-center gap-1.5">
                                                <input
                                                  type="checkbox"
                                                  checked={Boolean(
                                                    policy?.enforcement
                                                      ?.requiredOnSubmission ??
                                                      true
                                                  )}
                                                  onChange={(event) =>
                                                    handlePaymentPolicyUpdate(
                                                      index,
                                                      {
                                                        enforcement: {
                                                          ...(policy?.enforcement ||
                                                            {}),
                                                          requiredOnSubmission:
                                                            event.target
                                                              .checked,
                                                        },
                                                      }
                                                    )
                                                  }
                                                />
                                                Required
                                              </label>
                                              <label className="inline-flex items-center gap-1.5">
                                                <input
                                                  type="checkbox"
                                                  checked={Boolean(
                                                    policy?.enforcement
                                                      ?.blockSubmissionOnFailure ??
                                                      true
                                                  )}
                                                  onChange={(event) =>
                                                    handlePaymentPolicyUpdate(
                                                      index,
                                                      {
                                                        enforcement: {
                                                          ...(policy?.enforcement ||
                                                            {}),
                                                          blockSubmissionOnFailure:
                                                            event.target
                                                              .checked,
                                                        },
                                                      }
                                                    )
                                                  }
                                                />
                                                Block on fail
                                              </label>
                                            </div>
                                          </div>
                                          {mode === 'active' && (
                                            <div
                                              className={`rounded-md border px-2 py-1.5 text-[11px] ${
                                                isLightTheme
                                                  ? 'border-[#dbe4f3] bg-[#f8fbff] text-[#35507d]'
                                                  : 'border-white/10 bg-white/[0.02] text-[#b4c6e8]'
                                              }`}
                                            >
                                              Derived expression:{' '}
                                              <code>
                                                {String(policy?.formula || '0')}
                                              </code>
                                            </div>
                                          )}
                                          {mode === 'active' && (
                                            <div
                                              className={`space-y-2 rounded-md border p-2 ${
                                                isLightTheme
                                                  ? 'border-[#dbe4f3] bg-[#fbfdff] text-[#2b3550]'
                                                  : 'border-white/10 bg-white/[0.02] text-[#d9e1f5]'
                                              }`}
                                            >
                                              <p className="text-[11px] font-semibold">
                                                Dry-run Calculator
                                              </p>
                                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                                                <input
                                                  type="number"
                                                  value={Number(
                                                    dryRunInput.fieldValue || 0
                                                  )}
                                                  onChange={(event) =>
                                                    setPaymentDryRunInputs(
                                                      (prev) => ({
                                                        ...prev,
                                                        [dryRunKey]: {
                                                          ...(prev[
                                                            dryRunKey
                                                          ] || {
                                                            fieldValue: 10000,
                                                            nodeValue: 5000,
                                                          }),
                                                          fieldValue: Number(
                                                            event.target
                                                              .value || 0
                                                          ),
                                                        },
                                                      })
                                                    )
                                                  }
                                                  placeholder="Sample form value"
                                                  className={`rounded-md border px-2 py-1.5 text-xs ${
                                                    isLightTheme
                                                      ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                                      : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                                  }`}
                                                />
                                                <input
                                                  type="number"
                                                  value={Number(
                                                    dryRunInput.nodeValue || 0
                                                  )}
                                                  onChange={(event) =>
                                                    setPaymentDryRunInputs(
                                                      (prev) => ({
                                                        ...prev,
                                                        [dryRunKey]: {
                                                          ...(prev[
                                                            dryRunKey
                                                          ] || {
                                                            fieldValue: 10000,
                                                            nodeValue: 5000,
                                                          }),
                                                          nodeValue: Number(
                                                            event.target
                                                              .value || 0
                                                          ),
                                                        },
                                                      })
                                                    )
                                                  }
                                                  placeholder="Sample node value"
                                                  className={`rounded-md border px-2 py-1.5 text-xs ${
                                                    isLightTheme
                                                      ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                                      : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                                  }`}
                                                />
                                                <div className="rounded-md border px-2 py-1.5 text-xs sm:col-span-2">
                                                  {dryEval.ok ? (
                                                    <span>
                                                      Estimated Amount:{' '}
                                                      <strong>
                                                        {Number(
                                                          dryEval.value || 0
                                                        ).toLocaleString()}
                                                      </strong>
                                                    </span>
                                                  ) : (
                                                    <span className="text-[#d97777]">
                                                      Dry-run error:{' '}
                                                      {typeof dryEval.error === 'string'
                                                        ? dryEval.error
                                                        : formatChatErrorMessage(dryEval.error)}
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                          <div
                                            className={`space-y-2 rounded-md border p-2 ${
                                              isLightTheme
                                                ? 'border-[#dbe4f3] bg-[#f9fbff]'
                                                : 'border-white/10 bg-white/[0.02]'
                                            }`}
                                          >
                                            <p className="text-[11px] font-semibold">
                                              Advanced Settings (JSON)
                                            </p>
                                            <textarea
                                              value={settingsBuffer}
                                              onChange={(event) =>
                                                setPaymentSettingsBuffers(
                                                  (prev) => ({
                                                    ...prev,
                                                    [dryRunKey]:
                                                      event.target.value,
                                                  })
                                                )
                                              }
                                              onBlur={() =>
                                                commitPaymentSettingsBuffer(
                                                  dryRunKey,
                                                  index
                                                )
                                              }
                                              placeholder='{"retryLimit": 3, "receiptTemplate": "standard"}'
                                              className={`min-h-[86px] w-full rounded-md border px-2 py-1.5 font-mono text-xs ${
                                                isLightTheme
                                                  ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                                  : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                              }`}
                                            />
                                            {paymentSettingsErrors[
                                              dryRunKey
                                            ] ? (
                                              <p className="text-[11px] text-[#d97777]">
                                                {
                                                  paymentSettingsErrors[
                                                    dryRunKey
                                                  ]
                                                }
                                              </p>
                                            ) : (
                                              <p className="text-[11px] opacity-75">
                                                Generic settings for future
                                                policy features.
                                              </p>
                                            )}
                                          </div>
                                        </details>
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                              <p className="text-[11px] opacity-75">
                                Steady Income applies fixed charges
                                automatically on submission. Active Income
                                derives amount from form fields, expressions,
                                node attributes, or combinations.
                              </p>
                            </div>
                            <p className="text-[11px] opacity-75">
                              Node-level distribution has been consolidated into
                              Payment Policies to reduce duplicated
                              configuration.
                            </p>
                          </div>
                        )}

                        {activeModuleTab === 'payment_config' && (
                          <div
                            className={`space-y-3 rounded-xl border p-4 text-sm ${
                              isLightTheme
                                ? 'border-[#d8e1f1] bg-white text-[#2b3550]'
                                : 'border-white/10 bg-white/[0.03] text-[#d9e1f5]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold">Payment Config</p>
                              <button
                                type="button"
                                onClick={() =>
                                  postModuleUpdateSummary(
                                    'Updated payment processor config in module draft.'
                                  )
                                }
                                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                  isLightTheme
                                    ? 'border-[#d7e3fa] bg-[#f4f8ff] text-[#204070]'
                                    : 'border-[#3f5f90] bg-[#1f2e48] text-[#dbeafe]'
                                }`}
                              >
                                Save Payment Config
                              </button>
                            </div>

                            <label className="inline-flex items-center gap-2 text-xs">
                              <input
                                type="checkbox"
                                checked={Boolean(paymentConfigDraft.enabled)}
                                onChange={(event) =>
                                  handleModulePaymentConfigUpdate({
                                    enabled: event.target.checked,
                                  })
                                }
                              />
                              Enable payment processor config
                            </label>

                            <div
                              className={`rounded-lg border p-3 ${
                                isLightTheme
                                  ? 'border-[#d8e1f1] bg-[#f8fbff]'
                                  : 'border-white/10 bg-white/[0.02]'
                              }`}
                            >
                              <p className="mb-2 text-xs font-semibold">
                                Enabled Channels
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {PAYMENT_CHANNEL_OPTIONS.map((channel) => {
                                  const selected =
                                    paymentConfigDraft.enabledChannels.includes(
                                      channel.value
                                    );
                                  return (
                                    <button
                                      key={`pay-channel-${channel.value}`}
                                      type="button"
                                      onClick={() =>
                                        handleModulePaymentConfigToggleChannel(
                                          channel.value
                                        )
                                      }
                                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                        selected
                                          ? isLightTheme
                                            ? 'border-[#9ec4ff] bg-[#e8f1ff] text-[#15407a]'
                                            : 'border-[#4f73a8] bg-[#1f3558] text-[#dbeafe]'
                                          : isLightTheme
                                            ? 'border-[#d4deef] bg-white text-[#5b6e8c]'
                                            : 'border-white/15 bg-white/[0.03] text-[#a8b6d1]'
                                      }`}
                                    >
                                      {channel.label}
                                    </button>
                                  );
                                })}
                              </div>
                              <p className="mt-2 text-[11px] opacity-75">
                                Select one or more processors. At least one
                                channel is required when payment policy is
                                enabled.
                              </p>
                            </div>

                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              <select
                                value={String(
                                  paymentConfigDraft.defaultChannel || ''
                                )}
                                onChange={(event) =>
                                  handleModulePaymentConfigSetDefault(
                                    event.target.value
                                  )
                                }
                                className={`rounded-md border px-2 py-1.5 text-xs ${
                                  isLightTheme
                                    ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                    : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                }`}
                              >
                                <option value="">Default channel</option>
                                {PAYMENT_CHANNEL_OPTIONS.map((channel) => (
                                  <option
                                    key={`pay-default-${channel.value}`}
                                    value={channel.value}
                                  >
                                    {channel.label}
                                  </option>
                                ))}
                              </select>
                              <div
                                className={`rounded-md border px-3 py-2 text-xs ${
                                  isLightTheme
                                    ? 'border-[#d4deef] bg-[#f8fbff] text-[#35507d]'
                                    : 'border-white/15 bg-white/[0.03] text-[#b4c6e8]'
                                }`}
                              >
                                Active channels:{' '}
                                {paymentConfigDraft.enabledChannels.length}
                              </div>
                            </div>

                            <div
                              className={`space-y-2 rounded-lg border p-3 ${
                                isLightTheme
                                  ? 'border-[#d8e1f1] bg-[#f8fbff]'
                                  : 'border-white/10 bg-white/[0.02]'
                              }`}
                            >
                              <p className="text-xs font-semibold">
                                Processor Settings (JSON)
                              </p>
                              <textarea
                                defaultValue={JSON.stringify(
                                  paymentConfigDraft.processorSettings || {},
                                  null,
                                  2
                                )}
                                onBlur={(event) => {
                                  const raw = String(
                                    event.target.value || ''
                                  ).trim();
                                  if (!raw) {
                                    handleModulePaymentConfigUpdate({
                                      processorSettings: {},
                                    });
                                    return;
                                  }
                                  try {
                                    const parsed = JSON.parse(raw);
                                    if (
                                      !parsed ||
                                      typeof parsed !== 'object' ||
                                      Array.isArray(parsed)
                                    ) {
                                      toast.error(
                                        'Processor settings must be a JSON object.'
                                      );
                                      return;
                                    }
                                    handleModulePaymentConfigUpdate({
                                      processorSettings: parsed,
                                    });
                                  } catch (error) {
                                    toast.error(
                                      'Invalid processor settings JSON.'
                                    );
                                  }
                                }}
                                placeholder='{"paystack":{"splitCode":"SPL_xxx"},"flutterwave":{"subaccountId":"123"}}'
                                className={`min-h-[110px] w-full rounded-md border px-2 py-1.5 font-mono text-xs ${
                                  isLightTheme
                                    ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                    : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                }`}
                              />
                              <p className="text-[11px] opacity-75">
                                Optional gateway settings per provider. This is
                                separate from payment policy formulas/scopes.
                              </p>
                            </div>
                          </div>
                        )}

                        {activeModuleTab === 'utilities' && (
                          <div
                            className={`space-y-3 rounded-xl border p-4 text-sm ${
                              isLightTheme
                                ? 'border-[#d8e1f1] bg-white text-[#2b3550]'
                                : 'border-white/10 bg-white/[0.03] text-[#d9e1f5]'
                            }`}
                          >
                            <div
                              className={`space-y-2 rounded-lg border p-3 ${
                                isLightTheme
                                  ? 'border-[#d8e1f1] bg-[#f8fbff]'
                                  : 'border-white/10 bg-white/[0.02]'
                              }`}
                            >
                              <p className="text-xs font-semibold">
                                Recommended Utilities
                              </p>
                              {utilitySuggestions.length === 0 ? (
                                <p className="text-[11px] opacity-75">
                                  No new utility suggestions right now. Add more
                                  fields in Builder to unlock more.
                                </p>
                              ) : (
                                <div className="flex flex-wrap gap-1.5">
                                  {utilitySuggestions.map((item, index) => (
                                    <button
                                      key={`util-suggest-${item.type}-${item.fieldKey || 'na'}-${index}`}
                                      type="button"
                                      onClick={() =>
                                        handleAddUtility(
                                          item.type as any,
                                          item.fieldKey
                                        )
                                      }
                                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                                        isLightTheme
                                          ? 'border-[#d7e3fa] bg-[#f4f8ff] text-[#204070]'
                                          : 'border-[#3f5f90] bg-[#1f2e48] text-[#dbeafe]'
                                      }`}
                                      title={item.label}
                                    >
                                      + {item.label}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div
                              className={`space-y-2 rounded-lg border p-3 ${
                                isLightTheme
                                  ? 'border-[#d8e1f1] bg-[#f8fbff]'
                                  : 'border-white/10 bg-white/[0.02]'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-semibold">
                                  Reusable Utility Rules
                                </p>
                                <span className="text-[11px] opacity-75">
                                  {draftUtilities.length} active
                                </span>
                              </div>
                              {draftUtilities.length === 0 ? (
                                <p className="text-[11px] opacity-75">
                                  Add utilities from recommendations above.
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  {draftUtilities.map(
                                    (util: any, index: number) => (
                                      <div
                                        key={`util-rule-${util?.id || index}`}
                                        className={`grid grid-cols-1 gap-2 rounded-md border p-2 sm:grid-cols-12 ${
                                          isLightTheme
                                            ? 'border-[#dbe4f3] bg-white'
                                            : 'border-white/10 bg-white/[0.03]'
                                        }`}
                                      >
                                        <input
                                          value={String(util?.name || '')}
                                          onChange={(event) =>
                                            handleUpdateUtility(index, {
                                              name: event.target.value,
                                            })
                                          }
                                          placeholder="Rule name"
                                          className={`rounded-md border px-2 py-1.5 text-xs sm:col-span-3 ${
                                            isLightTheme
                                              ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                              : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                          }`}
                                        />
                                        <select
                                          value={String(util?.type || '')}
                                          onChange={(event) =>
                                            handleUpdateUtility(index, {
                                              type: event.target.value,
                                            })
                                          }
                                          className={`rounded-md border px-2 py-1.5 text-xs sm:col-span-2 ${
                                            isLightTheme
                                              ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                              : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                          }`}
                                        >
                                          {Object.entries(
                                            utilityTypeLabels
                                          ).map(([key, label]) => (
                                            <option
                                              key={`utype-${key}`}
                                              value={key}
                                            >
                                              {label}
                                            </option>
                                          ))}
                                        </select>
                                        <select
                                          value={String(util?.fieldKey || '')}
                                          onChange={(event) =>
                                            handleUpdateUtility(index, {
                                              fieldKey: event.target.value,
                                            })
                                          }
                                          className={`rounded-md border px-2 py-1.5 text-xs sm:col-span-3 ${
                                            isLightTheme
                                              ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                              : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                          }`}
                                        >
                                          <option value="">
                                            No field binding
                                          </option>
                                          {(moduleDraft?.fields || []).map(
                                            (field: any) => (
                                              <option
                                                key={`ufield-${field.id}`}
                                                value={field.key}
                                              >
                                                {field.label} ({field.key})
                                              </option>
                                            )
                                          )}
                                        </select>
                                        <input
                                          type="number"
                                          value={Number(
                                            util?.priority ?? index + 1
                                          )}
                                          onChange={(event) =>
                                            handleUpdateUtility(index, {
                                              priority: Number(
                                                event.target.value || index + 1
                                              ),
                                            })
                                          }
                                          className={`rounded-md border px-2 py-1.5 text-xs sm:col-span-1 ${
                                            isLightTheme
                                              ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                              : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                          }`}
                                        />
                                        <label className="inline-flex items-center gap-1.5 text-xs sm:col-span-1">
                                          <input
                                            type="checkbox"
                                            checked={Boolean(util?.enabled)}
                                            onChange={(event) =>
                                              handleUpdateUtility(index, {
                                                enabled: event.target.checked,
                                              })
                                            }
                                          />
                                          Enabled
                                        </label>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleRemoveUtility(index)
                                          }
                                          className={`rounded-md border px-2 py-1.5 text-xs sm:col-span-2 ${
                                            isLightTheme
                                              ? 'border-[#efd3d3] bg-[#fff2f2] text-[#8b2d2d]'
                                              : 'border-[#7a4343] bg-[#3e2323] text-[#ffd7d7]'
                                          }`}
                                        >
                                          Remove
                                        </button>
                                        <input
                                          value={
                                            Array.isArray(util?.conditions)
                                              ? util.conditions.join(' && ')
                                              : ''
                                          }
                                          onChange={(event) =>
                                            handleUpdateUtility(index, {
                                              conditions: event.target.value
                                                ? event.target.value
                                                    .split('&&')
                                                    .map((x: string) =>
                                                      x.trim()
                                                    )
                                                    .filter(Boolean)
                                                : [],
                                            })
                                          }
                                          placeholder="Conditions (optional)"
                                          className={`rounded-md border px-2 py-1.5 text-xs sm:col-span-8 ${
                                            isLightTheme
                                              ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                              : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                          }`}
                                        />
                                        <label className="inline-flex items-center gap-1.5 text-xs sm:col-span-2">
                                          <input
                                            type="checkbox"
                                            checked={Boolean(
                                              util?.enforcement?.required
                                            )}
                                            onChange={(event) =>
                                              handleUpdateUtility(index, {
                                                enforcement: {
                                                  ...(util?.enforcement || {}),
                                                  required:
                                                    event.target.checked,
                                                },
                                              })
                                            }
                                          />
                                          Required
                                        </label>
                                        <label className="inline-flex items-center gap-1.5 text-xs sm:col-span-2">
                                          <input
                                            type="checkbox"
                                            checked={Boolean(
                                              util?.enforcement?.blockOnFailure
                                            )}
                                            onChange={(event) =>
                                              handleUpdateUtility(index, {
                                                enforcement: {
                                                  ...(util?.enforcement || {}),
                                                  blockOnFailure:
                                                    event.target.checked,
                                                },
                                              })
                                            }
                                          />
                                          Block on fail
                                        </label>
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold">
                                Date Trigger Utilities
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  const firstField = moduleDateFields[0];
                                  if (!firstField) return;
                                  handleModuleDateTriggersUpdate([
                                    ...moduleDateTriggers,
                                    {
                                      id: `dt_${Date.now().toString(36)}`,
                                      fieldKey: firstField.key,
                                      when: 'on_date_reached',
                                      offsetDays: 0,
                                      action: 'notify',
                                      note: '',
                                    },
                                  ]);
                                }}
                                disabled={moduleDateFields.length === 0}
                                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                                  isLightTheme
                                    ? 'border-[#d7e3fa] bg-[#f4f8ff] text-[#204070]'
                                    : 'border-[#3f5f90] bg-[#1f2e48] text-[#dbeafe]'
                                } disabled:cursor-not-allowed disabled:opacity-60`}
                              >
                                Add Trigger
                              </button>
                            </div>
                            {moduleDateFields.length === 0 && (
                              <p className="text-[11px] opacity-75">
                                Add at least one date/time field in Builder to
                                configure date events.
                              </p>
                            )}
                            <div className="space-y-2">
                              {moduleDateTriggers.map(
                                (trigger: any, index: number) => (
                                  <div
                                    key={`date-trigger-${trigger?.id || index}`}
                                    className={`grid grid-cols-1 gap-2 rounded-md border p-2 sm:grid-cols-12 ${
                                      isLightTheme
                                        ? 'border-[#dbe4f3] bg-[#f9fbff]'
                                        : 'border-white/10 bg-white/[0.03]'
                                    }`}
                                  >
                                    <select
                                      value={String(trigger?.fieldKey || '')}
                                      onChange={(event) => {
                                        const next = [...moduleDateTriggers];
                                        next[index] = {
                                          ...trigger,
                                          fieldKey: event.target.value,
                                        };
                                        handleModuleDateTriggersUpdate(next);
                                      }}
                                      className={`rounded-md border px-2 py-1.5 text-xs sm:col-span-3 ${
                                        isLightTheme
                                          ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                          : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                      }`}
                                    >
                                      {moduleDateFields.map((field) => (
                                        <option
                                          key={`date-field-${field.id}`}
                                          value={field.key}
                                        >
                                          {field.label}
                                        </option>
                                      ))}
                                    </select>
                                    <select
                                      value={String(
                                        trigger?.when || 'on_date_reached'
                                      )}
                                      onChange={(event) => {
                                        const next = [...moduleDateTriggers];
                                        next[index] = {
                                          ...trigger,
                                          when: event.target.value,
                                        };
                                        handleModuleDateTriggersUpdate(next);
                                      }}
                                      className={`rounded-md border px-2 py-1.5 text-xs sm:col-span-3 ${
                                        isLightTheme
                                          ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                          : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                      }`}
                                    >
                                      <option value="on_date_reached">
                                        On date reached
                                      </option>
                                      <option value="before_days">
                                        Days before
                                      </option>
                                      <option value="after_days">
                                        Days after
                                      </option>
                                    </select>
                                    <input
                                      type="number"
                                      value={Number(trigger?.offsetDays ?? 0)}
                                      onChange={(event) => {
                                        const next = [...moduleDateTriggers];
                                        next[index] = {
                                          ...trigger,
                                          offsetDays: Number(
                                            event.target.value || 0
                                          ),
                                        };
                                        handleModuleDateTriggersUpdate(next);
                                      }}
                                      className={`rounded-md border px-2 py-1.5 text-xs sm:col-span-2 ${
                                        isLightTheme
                                          ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                          : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                      }`}
                                    />
                                    <input
                                      value={String(trigger?.action || '')}
                                      onChange={(event) => {
                                        const next = [...moduleDateTriggers];
                                        next[index] = {
                                          ...trigger,
                                          action: event.target.value,
                                        };
                                        handleModuleDateTriggersUpdate(next);
                                      }}
                                      placeholder="Action (notify/escalate)"
                                      className={`rounded-md border px-2 py-1.5 text-xs sm:col-span-3 ${
                                        isLightTheme
                                          ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                          : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                      }`}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const next = moduleDateTriggers.filter(
                                          (_: any, i: number) => i !== index
                                        );
                                        handleModuleDateTriggersUpdate(next);
                                      }}
                                      className={`rounded-md border px-2 py-1.5 text-xs sm:col-span-1 ${
                                        isLightTheme
                                          ? 'border-[#efd3d3] bg-[#fff2f2] text-[#8b2d2d]'
                                          : 'border-[#7a4343] bg-[#3e2323] text-[#ffd7d7]'
                                      }`}
                                    >
                                      Del
                                    </button>
                                  </div>
                                )
                              )}
                            </div>
                            <p className="text-[11px] opacity-75">
                              Date triggers are stored in behavior hooks and can
                              be consumed by backend workflows/events.
                            </p>

                            <div
                              className={`space-y-3 rounded-lg border p-3 ${
                                isLightTheme
                                  ? 'border-[#d8e1f1] bg-[#f8fbff]'
                                  : 'border-white/10 bg-white/[0.02]'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-semibold">
                                  File Storage + Rules
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const firstField = moduleFileFields[0];
                                    if (!firstField) return;
                                    handleModuleFilePoliciesUpdate([
                                      ...moduleFilePolicies,
                                      {
                                        id: `fp_${Date.now().toString(36)}`,
                                        fieldKey: firstField.key,
                                        storageFolder: `uploads/${firstField.key}`,
                                        namingPattern:
                                          '{{nodeId}}/{{yyyy}}/{{mm}}/{{originalName}}',
                                        allowedTypes: [
                                          'image/*',
                                          'application/pdf',
                                        ],
                                        maxSizeMB: 10,
                                        metaKeys: [
                                          'nodeId',
                                          'userId',
                                          'submissionId',
                                        ],
                                        behavior: {
                                          onUpload: 'store_and_index',
                                          onValidationFail: 'reject',
                                          autoExtractMeta: true,
                                        },
                                        rules: {
                                          antivirusScan: true,
                                          deduplicateUploads: false,
                                          requireApprovalBeforeUse: false,
                                        },
                                      },
                                    ]);
                                  }}
                                  disabled={moduleFileFields.length === 0}
                                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                                    isLightTheme
                                      ? 'border-[#d7e3fa] bg-[#f4f8ff] text-[#204070]'
                                      : 'border-[#3f5f90] bg-[#1f2e48] text-[#dbeafe]'
                                  } disabled:cursor-not-allowed disabled:opacity-60`}
                                >
                                  Add File Policy
                                </button>
                              </div>
                              {moduleFileFields.length === 0 && (
                                <p className="text-[11px] opacity-75">
                                  Add at least one file field in Builder to
                                  configure storage and file rules.
                                </p>
                              )}
                              <div className="space-y-2">
                                {moduleFilePolicies.map(
                                  (policy: any, index: number) => (
                                    <div
                                      key={`file-policy-${policy?.id || index}`}
                                      className={`space-y-2 rounded-md border p-2 ${
                                        isLightTheme
                                          ? 'border-[#dbe4f3] bg-white'
                                          : 'border-white/10 bg-white/[0.03]'
                                      }`}
                                    >
                                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
                                        <select
                                          value={String(policy?.fieldKey || '')}
                                          onChange={(event) => {
                                            const next = [
                                              ...moduleFilePolicies,
                                            ];
                                            next[index] = {
                                              ...policy,
                                              fieldKey: event.target.value,
                                            };
                                            handleModuleFilePoliciesUpdate(
                                              next
                                            );
                                          }}
                                          className={`rounded-md border px-2 py-1.5 text-xs sm:col-span-4 ${
                                            isLightTheme
                                              ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                              : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                          }`}
                                        >
                                          {moduleFileFields.map((field) => (
                                            <option
                                              key={`file-field-${field.id}`}
                                              value={field.key}
                                            >
                                              {field.label}
                                            </option>
                                          ))}
                                        </select>
                                        <input
                                          value={String(
                                            policy?.storageFolder || ''
                                          )}
                                          onChange={(event) => {
                                            const next = [
                                              ...moduleFilePolicies,
                                            ];
                                            next[index] = {
                                              ...policy,
                                              storageFolder: event.target.value,
                                            };
                                            handleModuleFilePoliciesUpdate(
                                              next
                                            );
                                          }}
                                          placeholder="Storage folder"
                                          className={`rounded-md border px-2 py-1.5 text-xs sm:col-span-5 ${
                                            isLightTheme
                                              ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                              : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                          }`}
                                        />
                                        <input
                                          type="number"
                                          value={Number(
                                            policy?.maxSizeMB ?? 10
                                          )}
                                          onChange={(event) => {
                                            const next = [
                                              ...moduleFilePolicies,
                                            ];
                                            next[index] = {
                                              ...policy,
                                              maxSizeMB: Number(
                                                event.target.value || 10
                                              ),
                                            };
                                            handleModuleFilePoliciesUpdate(
                                              next
                                            );
                                          }}
                                          placeholder="Max MB"
                                          className={`rounded-md border px-2 py-1.5 text-xs sm:col-span-2 ${
                                            isLightTheme
                                              ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                              : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                          }`}
                                        />
                                        <input
                                          value={String(
                                            policy?.namingPattern || ''
                                          )}
                                          onChange={(event) => {
                                            const next = [
                                              ...moduleFilePolicies,
                                            ];
                                            next[index] = {
                                              ...policy,
                                              namingPattern: event.target.value,
                                            };
                                            handleModuleFilePoliciesUpdate(
                                              next
                                            );
                                          }}
                                          placeholder="Naming pattern"
                                          className={`rounded-md border px-2 py-1.5 text-xs sm:col-span-6 ${
                                            isLightTheme
                                              ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                              : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                          }`}
                                        />
                                        <input
                                          value={
                                            Array.isArray(policy?.allowedTypes)
                                              ? policy.allowedTypes.join(',')
                                              : ''
                                          }
                                          onChange={(event) => {
                                            const next = [
                                              ...moduleFilePolicies,
                                            ];
                                            next[index] = {
                                              ...policy,
                                              allowedTypes: event.target.value
                                                .split(',')
                                                .map((x) => x.trim())
                                                .filter(Boolean),
                                            };
                                            handleModuleFilePoliciesUpdate(
                                              next
                                            );
                                          }}
                                          placeholder="Allowed types (comma)"
                                          className={`rounded-md border px-2 py-1.5 text-xs sm:col-span-6 ${
                                            isLightTheme
                                              ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                              : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                          }`}
                                        />
                                        <input
                                          value={
                                            Array.isArray(policy?.metaKeys)
                                              ? policy.metaKeys.join(',')
                                              : ''
                                          }
                                          onChange={(event) => {
                                            const next = [
                                              ...moduleFilePolicies,
                                            ];
                                            next[index] = {
                                              ...policy,
                                              metaKeys: event.target.value
                                                .split(',')
                                                .map((x) => x.trim())
                                                .filter(Boolean),
                                            };
                                            handleModuleFilePoliciesUpdate(
                                              next
                                            );
                                          }}
                                          placeholder="Meta keys (comma)"
                                          className={`rounded-md border px-2 py-1.5 text-xs sm:col-span-4 ${
                                            isLightTheme
                                              ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                              : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                          }`}
                                        />
                                        <select
                                          value={String(
                                            policy?.behavior?.onUpload ||
                                              'store_and_index'
                                          )}
                                          onChange={(event) => {
                                            const next = [
                                              ...moduleFilePolicies,
                                            ];
                                            next[index] = {
                                              ...policy,
                                              behavior: {
                                                ...(policy?.behavior || {}),
                                                onUpload: event.target.value,
                                              },
                                            };
                                            handleModuleFilePoliciesUpdate(
                                              next
                                            );
                                          }}
                                          className={`rounded-md border px-2 py-1.5 text-xs sm:col-span-3 ${
                                            isLightTheme
                                              ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                              : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                          }`}
                                        >
                                          <option value="store_and_index">
                                            Store + index
                                          </option>
                                          <option value="store_only">
                                            Store only
                                          </option>
                                          <option value="store_and_notify">
                                            Store + notify
                                          </option>
                                        </select>
                                        <select
                                          value={String(
                                            policy?.behavior
                                              ?.onValidationFail || 'reject'
                                          )}
                                          onChange={(event) => {
                                            const next = [
                                              ...moduleFilePolicies,
                                            ];
                                            next[index] = {
                                              ...policy,
                                              behavior: {
                                                ...(policy?.behavior || {}),
                                                onValidationFail:
                                                  event.target.value,
                                              },
                                            };
                                            handleModuleFilePoliciesUpdate(
                                              next
                                            );
                                          }}
                                          className={`rounded-md border px-2 py-1.5 text-xs sm:col-span-3 ${
                                            isLightTheme
                                              ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                              : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                          }`}
                                        >
                                          <option value="reject">Reject</option>
                                          <option value="quarantine">
                                            Quarantine
                                          </option>
                                          <option value="allow_with_warning">
                                            Allow with warning
                                          </option>
                                        </select>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const next =
                                              moduleFilePolicies.filter(
                                                (_: any, i: number) =>
                                                  i !== index
                                              );
                                            handleModuleFilePoliciesUpdate(
                                              next
                                            );
                                          }}
                                          className={`rounded-md border px-2 py-1.5 text-xs sm:col-span-2 ${
                                            isLightTheme
                                              ? 'border-[#efd3d3] bg-[#fff2f2] text-[#8b2d2d]'
                                              : 'border-[#7a4343] bg-[#3e2323] text-[#ffd7d7]'
                                          }`}
                                        >
                                          Remove
                                        </button>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-3 text-[11px]">
                                        <label className="inline-flex items-center gap-1.5">
                                          <input
                                            type="checkbox"
                                            checked={Boolean(
                                              policy?.behavior?.autoExtractMeta
                                            )}
                                            onChange={(event) => {
                                              const next = [
                                                ...moduleFilePolicies,
                                              ];
                                              next[index] = {
                                                ...policy,
                                                behavior: {
                                                  ...(policy?.behavior || {}),
                                                  autoExtractMeta:
                                                    event.target.checked,
                                                },
                                              };
                                              handleModuleFilePoliciesUpdate(
                                                next
                                              );
                                            }}
                                          />
                                          Auto extract meta
                                        </label>
                                        <label className="inline-flex items-center gap-1.5">
                                          <input
                                            type="checkbox"
                                            checked={Boolean(
                                              policy?.rules?.antivirusScan
                                            )}
                                            onChange={(event) => {
                                              const next = [
                                                ...moduleFilePolicies,
                                              ];
                                              next[index] = {
                                                ...policy,
                                                rules: {
                                                  ...(policy?.rules || {}),
                                                  antivirusScan:
                                                    event.target.checked,
                                                },
                                              };
                                              handleModuleFilePoliciesUpdate(
                                                next
                                              );
                                            }}
                                          />
                                          AV scan
                                        </label>
                                        <label className="inline-flex items-center gap-1.5">
                                          <input
                                            type="checkbox"
                                            checked={Boolean(
                                              policy?.rules?.deduplicateUploads
                                            )}
                                            onChange={(event) => {
                                              const next = [
                                                ...moduleFilePolicies,
                                              ];
                                              next[index] = {
                                                ...policy,
                                                rules: {
                                                  ...(policy?.rules || {}),
                                                  deduplicateUploads:
                                                    event.target.checked,
                                                },
                                              };
                                              handleModuleFilePoliciesUpdate(
                                                next
                                              );
                                            }}
                                          />
                                          Deduplicate
                                        </label>
                                        <label className="inline-flex items-center gap-1.5">
                                          <input
                                            type="checkbox"
                                            checked={Boolean(
                                              policy?.rules
                                                ?.requireApprovalBeforeUse
                                            )}
                                            onChange={(event) => {
                                              const next = [
                                                ...moduleFilePolicies,
                                              ];
                                              next[index] = {
                                                ...policy,
                                                rules: {
                                                  ...(policy?.rules || {}),
                                                  requireApprovalBeforeUse:
                                                    event.target.checked,
                                                },
                                              };
                                              handleModuleFilePoliciesUpdate(
                                                next
                                              );
                                            }}
                                          />
                                          Approval before use
                                        </label>
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                              <p className="text-[11px] opacity-75">
                                File policies are saved in behavior hooks for
                                storage routing, metadata, and rule checks.
                              </p>
                            </div>
                          </div>
                        )}

                        {activeModuleTab === 'behavior' && (
                          <div
                            className={`space-y-3 rounded-xl border p-4 text-sm ${
                              isLightTheme
                                ? 'border-[#d8e1f1] bg-white text-[#2b3550]'
                                : 'border-white/10 bg-white/[0.03] text-[#d9e1f5]'
                            }`}
                          >
                            <p className="font-semibold">Behavior Hooks</p>
                            {(
                              [
                                [
                                  'onLoad',
                                  moduleDraft.behaviorHooks?.onLoad || '',
                                ],
                                [
                                  'onChange',
                                  moduleDraft.behaviorHooks?.onChange || '',
                                ],
                                [
                                  'beforeSubmit',
                                  moduleDraft.behaviorHooks?.beforeSubmit || '',
                                ],
                                [
                                  'afterSubmit',
                                  moduleDraft.behaviorHooks?.afterSubmit || '',
                                ],
                                [
                                  'customValidation',
                                  moduleDraft.behaviorHooks?.customValidation ||
                                    '',
                                ],
                              ] as Array<[string, string]>
                            ).map(([key, value]) => (
                              <div key={`hook-${key}`} className="space-y-1">
                                <p className="text-xs font-semibold">{key}</p>
                                <textarea
                                  rows={3}
                                  value={value}
                                  onChange={(event) =>
                                    handleModuleBehaviorUpdate({
                                      [key]: event.target.value,
                                    })
                                  }
                                  placeholder={`function ${key}(){ ... }`}
                                  className={`w-full rounded-md border px-2 py-1.5 text-xs ${
                                    isLightTheme
                                      ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                      : 'border-white/15 bg-white/[0.04] text-[#d9e1f5]'
                                  }`}
                                />
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() =>
                                postModuleUpdateSummary(
                                  'Updated behavior hooks in module draft.'
                                )
                              }
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                isLightTheme
                                  ? 'border-[#d7e3fa] bg-[#f4f8ff] text-[#204070]'
                                  : 'border-[#3f5f90] bg-[#1f2e48] text-[#dbeafe]'
                              }`}
                            >
                              Save Hooks
                            </button>
                          </div>
                        )}

                        {activeModuleTab === 'review' && (
                          <div
                            className={`space-y-3 rounded-xl border p-4 text-sm ${
                              isLightTheme
                                ? 'border-[#d8e1f1] bg-white text-[#2b3550]'
                                : 'border-white/10 bg-white/[0.03] text-[#d9e1f5]'
                            }`}
                          >
                            <p className="font-semibold">Review & Publish</p>
                            <p className="text-xs opacity-80">
                              Current status:{' '}
                              {moduleLifecycleStage.replace('_', ' ')}
                            </p>
                            <p className="text-[11px] opacity-75">
                              Workflow review/approval is executed during real
                              submission flow by assigned roles. Use this
                              workspace for draft quality checks and lifecycle
                              controls only.
                            </p>
                            <div
                              className={`space-y-2 rounded-lg border p-3 ${
                                isLightTheme
                                  ? 'border-[#d8e1f1] bg-[#f8fbff]'
                                  : 'border-white/10 bg-white/[0.02]'
                              }`}
                            >
                              <p className="text-xs font-semibold">
                                Pre-submit audit
                              </p>
                              {modulePreSubmitAudit.errors.length === 0 ? (
                                <span
                                  className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] ${
                                    isLightTheme
                                      ? 'border-[#bde4cb] bg-[#eaf9ef] text-[#156b3e]'
                                      : 'border-[#2f7c52] bg-[#163b2a] text-[#d7ffe8]'
                                  }`}
                                >
                                  No critical audit errors
                                </span>
                              ) : (
                                <div className="flex flex-wrap gap-1">
                                  {modulePreSubmitAudit.errors.map(
                                    (error, index) => (
                                      <span
                                        key={`audit-error-${index}`}
                                        className={`rounded-full border px-2 py-0.5 text-[10px] ${
                                          isLightTheme
                                            ? 'border-[#f4c4c4] bg-[#fff1f1] text-[#9a3434]'
                                            : 'border-[#7a4343] bg-[#3e2323] text-[#ffd7d7]'
                                        }`}
                                      >
                                        {error}
                                      </span>
                                    )
                                  )}
                                </div>
                              )}
                              {modulePreSubmitAudit.warnings.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {modulePreSubmitAudit.warnings.map(
                                    (warning, index) => (
                                      <span
                                        key={`audit-warning-${index}`}
                                        className={`rounded-full border px-2 py-0.5 text-[10px] ${
                                          isLightTheme
                                            ? 'border-[#f2d5a2] bg-[#fff7e6] text-[#8a5a07]'
                                            : 'border-[#7f5b1f] bg-[#3f2f14] text-[#ffe7bf]'
                                        }`}
                                      >
                                        {warning}
                                      </span>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  handleModuleLifecycleAction('save_draft')
                                }
                                disabled={isModuleSubmitting}
                                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                  isLightTheme
                                    ? 'border-[#d7e3fa] bg-[#f4f8ff] text-[#204070]'
                                    : 'border-[#3f5f90] bg-[#1f2e48] text-[#dbeafe]'
                                } disabled:cursor-not-allowed disabled:opacity-60`}
                              >
                                {isModuleSubmitting
                                  ? 'Saving...'
                                  : 'Save Draft'}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleModuleLifecycleAction('publish')
                                }
                                disabled={
                                  isModuleSubmitting ||
                                  moduleLifecycleStage !== 'approved'
                                }
                                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                  isLightTheme
                                    ? 'border-[#bde4cb] bg-[#eaf9ef] text-[#156b3e]'
                                    : 'border-[#2f7c52] bg-[#163b2a] text-[#d7ffe8]'
                                } disabled:cursor-not-allowed disabled:opacity-60`}
                              >
                                Publish
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleModuleLifecycleAction('archive')
                                }
                                disabled={isModuleSubmitting}
                                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                  isLightTheme
                                    ? 'border-[#efd3d3] bg-[#fff2f2] text-[#8b2d2d]'
                                    : 'border-[#7a4343] bg-[#3e2323] text-[#ffd7d7]'
                                } disabled:cursor-not-allowed disabled:opacity-60`}
                              >
                                Archive
                              </button>
                            </div>
                            <div
                              className={`space-y-2 rounded-lg border p-3 ${
                                isLightTheme
                                  ? 'border-[#d8e1f1] bg-[#f8fbff]'
                                  : 'border-white/10 bg-white/[0.02]'
                              }`}
                            >
                              <p className="text-xs font-semibold">
                                Preview simulation
                              </p>
                              {moduleSampleSimulation.errors.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {moduleSampleSimulation.errors.map(
                                    (error, index) => (
                                      <span
                                        key={`sim-error-${index}`}
                                        className={`rounded-full border px-2 py-0.5 text-[10px] ${
                                          isLightTheme
                                            ? 'border-[#f4c4c4] bg-[#fff1f1] text-[#9a3434]'
                                            : 'border-[#7a4343] bg-[#3e2323] text-[#ffd7d7]'
                                        }`}
                                      >
                                        {error}
                                      </span>
                                    )
                                  )}
                                </div>
                              ) : (
                                <span
                                  className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] ${
                                    isLightTheme
                                      ? 'border-[#bde4cb] bg-[#eaf9ef] text-[#156b3e]'
                                      : 'border-[#2f7c52] bg-[#163b2a] text-[#d7ffe8]'
                                  }`}
                                >
                                  Validation passed for sample payload
                                </span>
                              )}
                              {moduleSampleSimulation.warnings.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {moduleSampleSimulation.warnings.map(
                                    (warning, index) => (
                                      <span
                                        key={`sim-warn-${index}`}
                                        className={`rounded-full border px-2 py-0.5 text-[10px] ${
                                          isLightTheme
                                            ? 'border-[#f2d5a2] bg-[#fff7e6] text-[#8a5a07]'
                                            : 'border-[#7f5b1f] bg-[#3f2f14] text-[#ffe7bf]'
                                        }`}
                                      >
                                        {warning}
                                      </span>
                                    )
                                  )}
                                </div>
                              )}
                              <pre
                                className={`max-h-48 overflow-auto rounded-lg border p-2 text-[11px] ${
                                  isLightTheme
                                    ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                    : 'border-white/10 bg-[#1f2430] text-[#d9e1f5]'
                                }`}
                              >
                                {JSON.stringify(
                                  moduleSampleSimulation.payload,
                                  null,
                                  2
                                )}
                              </pre>
                            </div>
                            {moduleTemplateInfo && moduleTemplateDiff && (
                              <div
                                className={`space-y-2 rounded-lg border p-3 ${
                                  isLightTheme
                                    ? 'border-[#d8e1f1] bg-[#f8fbff]'
                                    : 'border-white/10 bg-white/[0.02]'
                                }`}
                              >
                                <p className="text-xs font-semibold">
                                  Template diff: {moduleTemplateInfo.name}
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  <span
                                    className={`rounded-full border px-2 py-0.5 text-[10px] ${
                                      isLightTheme
                                        ? 'border-[#bde4cb] bg-[#eaf9ef] text-[#156b3e]'
                                        : 'border-[#2f7c52] bg-[#163b2a] text-[#d7ffe8]'
                                    }`}
                                  >
                                    +{moduleTemplateDiff.addedFields.length}{' '}
                                    added
                                  </span>
                                  <span
                                    className={`rounded-full border px-2 py-0.5 text-[10px] ${
                                      isLightTheme
                                        ? 'border-[#f4c4c4] bg-[#fff1f1] text-[#9a3434]'
                                        : 'border-[#7a4343] bg-[#3e2323] text-[#ffd7d7]'
                                    }`}
                                  >
                                    -{moduleTemplateDiff.removedFields.length}{' '}
                                    removed
                                  </span>
                                  <span
                                    className={`rounded-full border px-2 py-0.5 text-[10px] ${
                                      isLightTheme
                                        ? 'border-[#d9e4f7] bg-[#f6f9ff] text-[#3f5d8d]'
                                        : 'border-white/20 bg-white/[0.04] text-[#b9c9ea]'
                                    }`}
                                  >
                                    {moduleTemplateDiff.changedFields.length}{' '}
                                    changed
                                  </span>
                                </div>
                              </div>
                            )}
                            <div
                              className={`space-y-2 rounded-lg border p-3 ${
                                isLightTheme
                                  ? 'border-[#d8e1f1] bg-[#f8fbff]'
                                  : 'border-white/10 bg-white/[0.02]'
                              }`}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-xs font-semibold">
                                  Submit to project forms
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      try {
                                        await submitModuleDraft(true);
                                        postModuleUpdateSummary(
                                          'Submit payload preview generated. Review lint and payload in Review tab.'
                                        );
                                      } catch (error: any) {
                                        postModuleUpdateSummary(
                                          `Could not generate submit payload: ${error?.message || 'Unexpected error.'}`
                                        );
                                      }
                                    }}
                                    disabled={isModuleSubmitting}
                                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                      isLightTheme
                                        ? 'border-[#d7e3fa] bg-[#f4f8ff] text-[#204070]'
                                        : 'border-[#3f5f90] bg-[#1f2e48] text-[#dbeafe]'
                                    } disabled:cursor-not-allowed disabled:opacity-60`}
                                  >
                                    {isModuleSubmitting
                                      ? 'Working...'
                                      : 'Preview Payload'}
                                  </button>
                                  {moduleLifecycleStage !== 'published' && (
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        try {
                                          const data =
                                            await submitModuleDraft(false);
                                          const projectId =
                                            data?.result?.projectForm
                                              ?.projectId ||
                                            data?.result?.projectId ||
                                            'unknown';
                                          const wasUpdate =
                                            String(
                                              data?.operation || ''
                                            ).toLowerCase() === 'update';
                                          postModuleUpdateSummary(
                                            wasUpdate
                                              ? `Module updated successfully and is ready for publish with projectId ${projectId}.`
                                              : `Module submitted successfully and is ready for publish with projectId ${projectId}.`
                                          );
                                        } catch (error: any) {
                                          postModuleUpdateSummary(
                                            `Module submission failed: ${error?.message || 'Unexpected error.'}`
                                          );
                                        }
                                      }}
                                      disabled={
                                        isModuleSubmitting ||
                                        !isModuleReadyToSubmit ||
                                        modulePreSubmitAudit.errors.length > 0
                                      }
                                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                        isLightTheme
                                          ? 'border-[#bde4cb] bg-[#eaf9ef] text-[#156b3e]'
                                          : 'border-[#2f7c52] bg-[#163b2a] text-[#d7ffe8]'
                                      } disabled:cursor-not-allowed disabled:opacity-60`}
                                    >
                                      {isModuleSubmitting
                                        ? 'Submitting...'
                                        : 'Submit Module'}
                                    </button>
                                  )}
                                </div>
                              </div>
                              {!isModuleReadyToSubmit &&
                                moduleLifecycleStage !== 'published' && (
                                  <p
                                    className={`text-[11px] ${
                                      isLightTheme
                                        ? 'text-[#8a5a07]'
                                        : 'text-[#ffe7bf]'
                                    }`}
                                  >
                                    Run Preview Payload and clear blockers
                                    before final submit.
                                  </p>
                                )}
                              {moduleLifecycleStage !== 'approved' &&
                                moduleLifecycleStage !== 'published' && (
                                  <p
                                    className={`text-[11px] ${
                                      isLightTheme
                                        ? 'text-[#49638f]'
                                        : 'text-[#a6bce1]'
                                    }`}
                                  >
                                    Submit the module first before publishing it
                                    live.
                                  </p>
                                )}
                              {moduleLifecycleStage === 'approved' && (
                                <p
                                  className={`text-[11px] ${
                                    isLightTheme
                                      ? 'text-[#156b3e]'
                                      : 'text-[#d7ffe8]'
                                  }`}
                                >
                                  This module has been submitted and is ready to
                                  publish.
                                </p>
                              )}
                              {modulePreSubmitAudit.errors.length > 0 &&
                                moduleLifecycleStage !== 'published' && (
                                  <p
                                    className={`text-[11px] ${
                                      isLightTheme
                                        ? 'text-[#9a3434]'
                                        : 'text-[#ffd7d7]'
                                    }`}
                                  >
                                    Resolve pre-submit audit errors before final
                                    submit.
                                  </p>
                                )}
                              {!isModuleReadyToSubmit &&
                                moduleLifecycleStage !== 'published' &&
                                moduleBlockerActions.total > 0 && (
                                  <div
                                    className={`rounded-lg border p-2 ${
                                      isLightTheme
                                        ? 'border-[#f2d5a2] bg-[#fff9ec]'
                                        : 'border-[#7f5b1f] bg-[#3f2f14]/65'
                                    }`}
                                  >
                                    <div className="mb-1.5 flex items-center justify-between gap-2">
                                      <p
                                        className={`text-[11px] font-semibold ${
                                          isLightTheme
                                            ? 'text-[#8a5a07]'
                                            : 'text-[#ffe7bf]'
                                        }`}
                                      >
                                        Blockers ({moduleBlockerActions.total})
                                      </p>
                                      <p
                                        className={`text-[10px] ${
                                          isLightTheme
                                            ? 'text-[#9a792f]'
                                            : 'text-[#f2d79c]'
                                        }`}
                                      >
                                        Click a category to fix
                                      </p>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {moduleBlockerActions.groups.map(
                                        (group) =>
                                          (() => {
                                            const tone =
                                              group.tab === 'workflow'
                                                ? isLightTheme
                                                  ? {
                                                      base: 'border-[#d0c2ff] bg-[#f4f0ff] text-[#57369d] hover:bg-[#ece5ff]',
                                                      pill: 'bg-[#e2d7ff] text-[#57369d]',
                                                    }
                                                  : {
                                                      base: 'border-[#5b48a4] bg-[#2b2346] text-[#e2d7ff] hover:bg-[#342957]',
                                                      pill: 'bg-[#4a3b7d] text-[#efe7ff]',
                                                    }
                                                : group.tab === 'payment_config'
                                                  ? isLightTheme
                                                    ? {
                                                        base: 'border-[#b2d8d2] bg-[#eefaf8] text-[#0d5e52] hover:bg-[#e0f3ef]',
                                                        pill: 'bg-[#d6efea] text-[#0d5e52]',
                                                      }
                                                    : {
                                                        base: 'border-[#2f7d73] bg-[#153832] text-[#cff5ef] hover:bg-[#1b463f]',
                                                        pill: 'bg-[#235d55] text-[#e3fff9]',
                                                      }
                                                  : group.tab === 'payment'
                                                    ? isLightTheme
                                                      ? {
                                                          base: 'border-[#f4c38d] bg-[#fff5e9] text-[#8a4d08] hover:bg-[#ffedd8]',
                                                          pill: 'bg-[#ffe4c5] text-[#8a4d08]',
                                                        }
                                                      : {
                                                          base: 'border-[#9a6232] bg-[#422a16] text-[#ffdcb5] hover:bg-[#52361d]',
                                                          pill: 'bg-[#6d4726] text-[#ffe8cd]',
                                                        }
                                                    : group.tab === 'builder'
                                                      ? isLightTheme
                                                        ? {
                                                            base: 'border-[#8fc2ff] bg-[#ecf5ff] text-[#0f4b8f] hover:bg-[#dfedff]',
                                                            pill: 'bg-[#d8eaff] text-[#0f4b8f]',
                                                          }
                                                        : {
                                                            base: 'border-[#3d6eaa] bg-[#1a2d46] text-[#cfe4ff] hover:bg-[#223a5a]',
                                                            pill: 'bg-[#2c4b73] text-[#dcedff]',
                                                          }
                                                      : isLightTheme
                                                        ? {
                                                            base: 'border-[#9fdeb8] bg-[#ecfbf1] text-[#156b3e] hover:bg-[#def8e8]',
                                                            pill: 'bg-[#d2f3df] text-[#156b3e]',
                                                          }
                                                        : {
                                                            base: 'border-[#3a865d] bg-[#173725] text-[#d5f7e4] hover:bg-[#1d452e]',
                                                            pill: 'bg-[#2a5f42] text-[#e3ffef]',
                                                          };

                                            return (
                                              <button
                                                key={`${group.tab}-${group.label}`}
                                                type="button"
                                                title={group.blockers.join(
                                                  '\n'
                                                )}
                                                onClick={() => {
                                                  setIsModuleWorkspaceOpen(
                                                    true
                                                  );
                                                  setActiveModuleTab(group.tab);
                                                }}
                                                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold transition ${tone.base}`}
                                              >
                                                <span>{group.label}</span>
                                                <span
                                                  className={`rounded-full px-1.5 py-0.5 text-[9px] ${tone.pill}`}
                                                >
                                                  {group.count}
                                                </span>
                                              </button>
                                            );
                                          })()
                                      )}
                                    </div>
                                  </div>
                                )}
                              {moduleLifecycleStage === 'published' && (
                                <p
                                  className={`text-[11px] ${
                                    isLightTheme
                                      ? 'text-[#49638f]'
                                      : 'text-[#a6bce1]'
                                  }`}
                                >
                                  This module is already published.
                                </p>
                              )}
                              {moduleSubmitDryRun?.lint && (
                                <div className="flex flex-wrap gap-1">
                                  <span
                                    className={`rounded-full border px-2 py-0.5 text-[10px] ${
                                      isLightTheme
                                        ? 'border-[#d9e4f7] bg-[#f6f9ff] text-[#3f5d8d]'
                                        : 'border-white/20 bg-white/[0.04] text-[#b9c9ea]'
                                    }`}
                                  >
                                    blockers:{' '}
                                    {moduleSubmitDryRun.lint.blockers?.length ||
                                      0}
                                  </span>
                                  <span
                                    className={`rounded-full border px-2 py-0.5 text-[10px] ${
                                      isLightTheme
                                        ? 'border-[#f2d5a2] bg-[#fff7e6] text-[#8a5a07]'
                                        : 'border-[#7f5b1f] bg-[#3f2f14] text-[#ffe7bf]'
                                    }`}
                                  >
                                    warnings:{' '}
                                    {moduleSubmitDryRun.lint.warnings?.length ||
                                      0}
                                  </span>
                                </div>
                              )}
                              {moduleSubmitDryRun?.payload && (
                                <pre
                                  className={`max-h-48 overflow-auto rounded-lg border p-2 text-[11px] ${
                                    isLightTheme
                                      ? 'border-[#d4deef] bg-white text-[#2b3550]'
                                      : 'border-white/10 bg-[#1f2430] text-[#d9e1f5]'
                                  }`}
                                >
                                  {JSON.stringify(
                                    moduleSubmitDryRun.payload,
                                    null,
                                    2
                                  )}
                                </pre>
                              )}
                              {moduleSubmitResult?.result && (
                                <pre
                                  className={`max-h-40 overflow-auto rounded-lg border p-2 text-[11px] ${
                                    isLightTheme
                                      ? 'border-[#bde4cb] bg-[#f3fff7] text-[#1a5a37]'
                                      : 'border-[#2f7c52] bg-[#163b2a] text-[#d7ffe8]'
                                  }`}
                                >
                                  {JSON.stringify(
                                    moduleSubmitResult.result,
                                    null,
                                    2
                                  )}
                                </pre>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      {moduleWizardCurrentStep &&
                        moduleWizardSteps.some(
                          (step) => step.key === activeModuleTab
                        ) && (
                          <div
                            className={`sticky bottom-2 z-20 mt-4 rounded-2xl border px-4 py-3 shadow-lg ${
                              isLightTheme
                                ? 'border-[#d8e1f1] bg-white/95 text-[#23314f]'
                                : 'border-white/10 bg-[#141a25]/95 text-[#dbeafe]'
                            }`}
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="space-y-1">
                                <p className="text-xs font-semibold">
                                  Step {moduleWizardStepIndex + 1} of{' '}
                                  {moduleWizardSteps.length}:{' '}
                                  {moduleWizardCurrentStep.label}
                                </p>
                                {moduleWizardCurrentBlockers.length > 0 ? (
                                  <p
                                    className={`text-[11px] ${
                                      isLightTheme
                                        ? 'text-[#9a3434]'
                                        : 'text-[#ffd7d7]'
                                    }`}
                                  >
                                    {moduleWizardCurrentBlockers[0]}
                                  </p>
                                ) : moduleWizardCurrentStepSaved ? (
                                  <p
                                    className={`text-[11px] ${
                                      isLightTheme
                                        ? 'text-[#156b3e]'
                                        : 'text-[#d7ffe8]'
                                    }`}
                                  >
                                    Saved.{' '}
                                    {moduleWizardNextStep
                                      ? `Next: ${moduleWizardNextStep.label}.`
                                      : 'Ready for final action.'}
                                  </p>
                                ) : (
                                  <p
                                    className={`text-[11px] ${
                                      isLightTheme
                                        ? 'text-[#49638f]'
                                        : 'text-[#a6bce1]'
                                    }`}
                                  >
                                    Save this step to unlock the next action.
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                {moduleWizardPrevStep && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setActiveModuleTab(
                                        moduleWizardPrevStep.key
                                      )
                                    }
                                    className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold ${
                                      isLightTheme
                                        ? 'border-[#d7e3fa] bg-white text-[#3a4f78]'
                                        : 'border-white/15 bg-white/[0.03] text-[#cbd7f2]'
                                    }`}
                                  >
                                    Back to {moduleWizardPrevStep.label}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    void handleModuleWizardPrimaryAction().catch(
                                      (error: any) => {
                                        postModuleUpdateSummary(
                                          `${moduleWizardPrimaryLabel} failed: ${error?.message || 'Unexpected error.'}`
                                        );
                                      }
                                    );
                                  }}
                                  disabled={
                                    isModuleSubmitting ||
                                    moduleLifecycleStage === 'published' ||
                                    (!moduleWizardCurrentStepSaved &&
                                      moduleWizardCurrentBlockers.length > 0)
                                  }
                                  className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold ${
                                    isLightTheme
                                      ? 'border-[#cfe0ff] bg-[#edf3ff] text-[#103d7a]'
                                      : 'border-[#4b6ea4] bg-[#20304b] text-[#dbeafe]'
                                  } disabled:cursor-not-allowed disabled:opacity-60`}
                                >
                                  {isModuleSubmitting
                                    ? 'Working...'
                                    : moduleWizardPrimaryLabel}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              )}

            <div
              className={`relative mx-auto mt-3 w-full sm:mt-4 ${
                isAuthenticated
                  ? `${
                      isRootAuthenticatedChatUi
                        ? 'max-w-5xl'
                        : 'max-w-5xl'
                    } ${
                      isRootAuthenticatedChatUi && showAuthenticatedRootHero
                        ? 'mb-1 sm:mb-2'
                        : 'mt-auto'
                    }`
                  : 'max-w-[58rem] xl:max-w-[62rem]'
              }`}
              ref={composerMenuRef}
            >
              <div
                className={`rounded-[32px] border px-3 pb-2.5 pt-2.5 shadow-[0_18px_40px_rgba(0,0,0,0.3)] transition-[min-height,padding,box-shadow] duration-300 ease-out sm:rounded-[36px] sm:px-4 sm:pb-3 sm:pt-3 ${
                  isAuthenticated
                    ? isRootAuthenticatedChatUi
                      ? useCompactRootComposer
                        ? 'min-h-[68px] sm:min-h-[72px]'
                        : 'min-h-[110px] sm:min-h-[126px]'
                      : 'min-h-[84px] sm:min-h-[88px]'
                    : useCompactMarketingComposer
                      ? 'min-h-[68px] sm:min-h-[72px]'
                      : 'min-h-[128px] sm:min-h-[150px]'
                } ${
                  isLightTheme
                    ? 'border-[#d8d5ce] bg-[#fbfaf7]'
                    : isRootAuthenticatedChatUi
                      ? 'border-white/[0.07] bg-[#1f1f1d]/95'
                      : 'border-white/10 bg-[#1f1f1f]/95'
                }`}
                style={
                  isRootAuthenticatedChatUi
                    ? {
                        boxShadow: isLightTheme
                          ? '0 14px 34px rgba(16, 24, 40, 0.12)'
                          : '0 18px 54px rgba(0, 0, 0, 0.38)',
                      }
                    : undefined
                }
              >
                <div className="flex h-full flex-col">
                  {(isRootAuthenticatedChatUi && useCompactRootComposer) ||
                  useCompactMarketingComposer ? (
                    <div
                      className={`flex min-h-[44px] gap-2.5 sm:gap-3 ${
                        isComposerMultiline ? 'items-end pb-0.5' : 'items-center'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsQuickActionOpen((prev) => !prev)}
                          className={`rounded-full border p-2 transition active:scale-[0.98] sm:p-2.5 ${
                            isLightTheme
                              ? 'border-[#ddd7cd] bg-[#f2efe8] text-[#1f2b46] hover:bg-[#ebe6dc]'
                              : 'border-white/[0.06] bg-white/[0.05] text-[#f0f1f7] hover:bg-white/[0.09]'
                          }`}
                        >
                          {isQuickActionOpen ? (
                            <X className="h-5 w-5 sm:h-6 sm:w-6" />
                          ) : (
                            <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
                          )}
                        </button>
                        {isQuickActionOpen && (
                          <div
                            className={`menu-pop absolute left-0 z-30 w-[22rem] rounded-[22px] border p-2 shadow-2xl ${
                              isLightTheme
                                ? 'border-[#d4dced] bg-white'
                                : 'border-white/[0.08] bg-[#232321]'
                            } bottom-[calc(100%+14px)]`}
                          >
                            {composeActionItems.map((action, index) => (
                              <div key={action.label}>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleActionNavigation(
                                      action.href,
                                      action.requiresAuth
                                    )
                                  }
                                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[13px] transition ${
                                    isLightTheme
                                      ? 'text-[#1f2a44] hover:bg-[#eef3ff]'
                                      : 'text-[#dfdfdd] hover:bg-white/[0.06]'
                                  }`}
                                >
                                  <span className="flex items-center gap-2.5">
                                    {action.icon}
                                    <span>{action.label}</span>
                                  </span>
                                  {action.hasSubmenu && (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </button>
                                {index === 0 &&
                                  composeActionItems.length > 1 && (
                                    <div
                                      className={`mx-2.5 my-1 border-t ${isLightTheme ? 'border-[#dbe2f0]' : 'border-white/15'}`}
                                    />
                                  )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="relative min-w-0 flex-1">
                        {!isAuthenticated && !prompt && (
                          <div className="pointer-events-none absolute inset-0 flex items-center">
                            <div
                              className={`min-w-0 truncate text-[16px] leading-[1.35] sm:text-[18px] ${
                                isLightTheme
                                  ? 'text-[#7f889e]'
                                  : 'text-[#aeb1bd]'
                              }`}
                              style={{
                                fontFamily:
                                  "'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
                                letterSpacing: '-0.01em',
                              }}
                            >
                              <span className="mr-2 font-medium text-white">
                                Ask Saby
                              </span>
                              <span>{typedHeroPrompt}</span>
                              <span className="ml-0.5 animate-pulse">|</span>
                            </div>
                          </div>
                        )}
                        <textarea
                          ref={composerInputRef}
                          value={prompt}
                          onChange={(event) => {
                            setPrompt(event.target.value);
                            composerSelectionRef.current = {
                              start: event.target.selectionStart,
                              end: event.target.selectionEnd,
                            };
                          }}
                          onKeyDown={handlePromptKeyDown}
                          onFocus={() => {
                            isComposerFocusedRef.current = true;
                            if (!isAuthenticated)
                              openQuickAuthModal(pathname || '/');
                          }}
                          onBlur={() => {
                            isComposerFocusedRef.current = false;
                          }}
                          placeholder={
                            isAuthenticated ? 'Ask saby about todays task' : ''
                          }
                          rows={1}
                          className={`min-h-[28px] max-h-[188px] w-full resize-none !border-0 bg-transparent py-0 text-[16px] leading-[1.35] !shadow-none !outline-none !ring-0 sm:text-[18px] ${
                            isLightTheme
                              ? 'text-[#121b2d] placeholder:text-[#8a8f9c]'
                              : 'text-[#f4f5fa] placeholder:text-[#a5a7ae]'
                          }`}
                          style={{
                            fontFamily:
                              "'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
                            letterSpacing: '-0.01em',
                          }}
                        />
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                        <div className="relative">
                          <button
                            type="button"
                            disabled={dashboardNavLocked}
                            onClick={() => {
                              if (!isAuthenticated) {
                                openQuickAuthModal(pathname || '/');
                                return;
                              }
                              if (dashboardNavLocked) {
                                showOnboardingLockNotice('tools');
                                return;
                              }
                              setIsToolsMenuOpen((prev) => {
                                const next = !prev;
                                if (!next) {
                                  setRootMenuOpenSections({
                                    model: false,
                                    workspace: false,
                                    insights: false,
                                    utilities: false,
                                    response: false,
                                  });
                                }
                                return next;
                              });
                            }}
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                              isLightTheme
                                ? 'border-[#ddd7cd] bg-[#f2efe8] text-[#1f2b46] hover:bg-[#ebe6dc]'
                                : 'border-white/[0.06] bg-white/[0.055] text-[#ececeb] hover:bg-white/[0.095]'
                            } disabled:cursor-not-allowed disabled:opacity-55`}
                            aria-label="Model and tools"
                          >
                            <span>{selectedRootModel}</span>
                            <ChevronDown className="h-4 w-4" />
                          </button>
                          {isToolsMenuOpen && (
                            <div
                              className={`menu-pop absolute right-0 z-30 w-[17.5rem] max-w-[calc(100vw-1.5rem)] rounded-[20px] border p-1.5 shadow-2xl ${
                                isLightTheme
                                  ? 'border-[#d4dced] bg-white'
                                  : 'border-white/[0.08] bg-[#242422]'
                              } bottom-[calc(100%+12px)]`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center justify-between px-2.5 py-1.5">
                                  <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/60">
                                    Model
                                  </span>
                                </div>
                                <div className="space-y-1 px-1 pb-1">
                                  {rootModelOptions.map((model: any) => {
                                    const isSelected =
                                      selectedRootModel === model.label;
                                    return (
                                      <button
                                        key={model.key}
                                        type="button"
                                        onClick={() => {
                                          setSelectedRootModel(model.label);
                                          setIsToolsMenuOpen(false);
                                        }}
                                        className={`flex w-full items-center justify-between rounded-[14px] border px-2.5 py-1.5 text-left transition ${
                                          isLightTheme
                                            ? isSelected
                                              ? 'border-[#c7d6f7] bg-[#eef4ff] text-[#1f2a44]'
                                              : 'border-[#dbe4f3] bg-white text-[#1f2a44] hover:bg-[#eef3ff]'
                                            : isSelected
                                              ? 'border-white/[0.12] bg-white/[0.065] text-white'
                                              : 'border-white/[0.08] bg-white/[0.025] text-[#d8d9e0] hover:bg-white/[0.06]'
                                        }`}
                                      >
                                        <span className="min-w-0">
                                          <span className="block text-[11px] font-medium leading-tight">
                                            {model.label}
                                          </span>
                                          <span className="mt-0.5 block text-[9px] opacity-65">
                                            {model.hint}
                                          </span>
                                        </span>
                                        <span
                                          className={`inline-flex h-5 min-w-[2.4rem] items-center rounded-full border px-0.5 transition ${
                                            isSelected
                                              ? isLightTheme
                                                ? 'justify-end border-[#87a8eb] bg-[#d8e6ff]'
                                                : 'justify-end border-white/[0.14] bg-white/[0.14]'
                                              : isLightTheme
                                                ? 'justify-start border-[#cfd9ec] bg-white'
                                                : 'justify-start border-white/[0.1] bg-white/[0.03]'
                                          }`}
                                          aria-hidden="true"
                                        >
                                          <span
                                            className={`h-3.5 w-3.5 rounded-full ${
                                              isSelected
                                                ? isLightTheme
                                                  ? 'bg-[#2b5fd8]'
                                                  : 'bg-white'
                                                : isLightTheme
                                                  ? 'bg-[#aab6cf]'
                                                  : 'bg-white/45'
                                            }`}
                                          />
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={handleGuestComposerAction}
                          disabled={isChatSending}
                          className={`flex h-10 w-10 items-center justify-center rounded-full transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:w-11 ${
                            isLightTheme
                              ? hasPromptValue
                                ? 'bg-[#111827] text-white'
                                : isVoiceListening
                                  ? 'border border-[#87a8eb] bg-[#d8e6ff] text-[#1c4ed8]'
                                  : 'border border-[#ddd7cd] bg-[#f2efe8] text-[#4b5563]'
                              : hasPromptValue
                                ? 'bg-[#f3f4f6] text-[#111827]'
                                : isVoiceListening
                                  ? 'border border-[#5b7bb8] bg-[#2b3f62] text-[#dbeafe]'
                                  : 'border border-white/[0.06] bg-white/[0.045] text-[#d1d5db]'
                          }`}
                          aria-label={
                            isVoiceListening
                              ? 'Stop voice input'
                              : hasPromptValue
                                ? 'Send message'
                                : 'Start voice input'
                          }
                        >
                          {isVoiceListening ? (
                            <Mic className="h-5 w-5" />
                          ) : hasPromptValue ? (
                            <ArrowUp className="h-5 w-5" />
                          ) : (
                            <Mic className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        className={`relative ${
                          isRootAuthenticatedChatUi && useCompactRootComposer
                            ? 'flex min-h-[28px] items-center'
                            : 'flex-1'
                        }`}
                      >
                        {isAuthenticated &&
                          !isRootAuthenticatedChatUi &&
                          (activeToolCommand || isHelpMode) && (
                            <div className="mb-1.5 flex flex-wrap items-center gap-2">
                              {ownerOnboardingRequired ? (
                                <span
                                  className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                    isLightTheme
                                      ? 'border-[#bfd8ff] bg-[#e8f1ff] text-[#18407a]'
                                      : 'border-[#4b6ea4] bg-[#20304b] text-[#dbeafe]'
                                  }`}
                                >
                                  Onboarding
                                </span>
                              ) : (
                                activeToolCommand && (
                                  <span
                                    className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                      isLightTheme
                                        ? 'border-[#cfe0ff] bg-[#edf3ff] text-[#103d7a]'
                                        : 'border-[#4b6ea4] bg-[#20304b] text-[#dbeafe]'
                                    }`}
                                  >
                                    {activeToolLabel || 'Tool'}
                                    <button
                                      type="button"
                                      onClick={() => setActiveToolCommand(null)}
                                      className="text-current/80 hover:text-current"
                                      aria-label="Clear tool mode"
                                    >
                                      x
                                    </button>
                                  </span>
                                )
                              )}
                              {!ownerOnboardingRequired && isHelpMode && (
                                <span
                                  className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                    isLightTheme
                                      ? 'border-[#c8e6d1] bg-[#eaffef] text-[#0f5131]'
                                      : 'border-[#3f7d5e] bg-[#1f3f30] text-[#dcfce7]'
                                  }`}
                                >
                                  Help
                                  <button
                                    type="button"
                                    onClick={() => setIsHelpMode(false)}
                                    className="text-current/80 hover:text-current"
                                    aria-label="Disable help mode"
                                  >
                                    x
                                  </button>
                                </span>
                              )}
                              {!ownerOnboardingRequired &&
                                activeToolCommand === '/module' &&
                                moduleReadiness && (
                                  <span
                                    className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                      moduleReadiness.isReady
                                        ? isLightTheme
                                          ? 'border-[#b6e4c6] bg-[#eaf9ef] text-[#156b3e]'
                                          : 'border-[#2f7c52] bg-[#163b2a] text-[#d7ffe8]'
                                        : isLightTheme
                                          ? 'border-[#f2d5a2] bg-[#fff7e6] text-[#8a5a07]'
                                          : 'border-[#7f5b1f] bg-[#3f2f14] text-[#ffe7bf]'
                                    }`}
                                  >
                                    Module Draft:{' '}
                                    {moduleReadiness.isReady
                                      ? 'Ready'
                                      : 'Not Ready'}
                                  </span>
                                )}
                            </div>
                          )}
                        {isAuthenticated &&
                          !isRootAuthenticatedChatUi &&
                          !ownerOnboardingRequired &&
                          activeToolCommand === '/module' &&
                          moduleTemplateSelection && (
                            <div
                              className={`mb-1.5 inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${
                                isLightTheme
                                  ? 'border-[#d7e3fa] bg-[#f4f8ff] text-[#244579]'
                                  : 'border-[#4b6ea4] bg-[#20304b] text-[#dbeafe]'
                              }`}
                            >
                              <span className="font-semibold">Mode:</span>
                              <span>
                                {moduleTemplateSelection.stage === 'industry'
                                  ? 'Selecting Industry'
                                  : 'Selecting Template'}
                              </span>
                              {moduleTemplateSelection.stage === 'template' &&
                                moduleTemplateSelection.industry && (
                                  <span className="truncate opacity-90">
                                    ({moduleTemplateSelection.industry})
                                  </span>
                                )}
                            </div>
                          )}
                        {isAuthenticated &&
                          !isRootAuthenticatedChatUi &&
                          !ownerOnboardingRequired &&
                          contextualQuickPrompts.length > 0 && (
                            <div className="mb-2 flex flex-wrap gap-1.5">
                              {contextualQuickPrompts.map((item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() =>
                                    handleQuickPromptInsert(item.text)
                                  }
                                  className={`rounded-full border px-2.5 py-1 text-[10px] font-medium transition ${
                                    isLightTheme
                                      ? 'border-[#d7e3fa] bg-[#f4f8ff] text-[#204070] hover:bg-[#e9f1ff]'
                                      : 'border-[#3f5f90] bg-[#1f2e48] text-[#dbeafe] hover:bg-[#2a3d5f]'
                                  }`}
                                  title={item.text}
                                >
                                  {item.text}
                                </button>
                              ))}
                            </div>
                          )}
                        {isAuthenticated &&
                          !ownerOnboardingRequired &&
                          (activeToolCommand === '/onboarding' ||
                            Boolean(onboardingUi)) && (
                            <div
                              className={`mb-2 rounded-xl border p-2 ${
                                isLightTheme
                                  ? 'border-[#d7e3fa] bg-[#f4f8ff]'
                                  : 'border-[#3f5f90] bg-[#1f2e48]'
                              }`}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p
                                  className={`text-[11px] font-semibold ${
                                    isLightTheme
                                      ? 'text-[#204070]'
                                      : 'text-[#dbeafe]'
                                  }`}
                                >
                                  Onboarding CSV Import
                                </p>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onboardingFileInputRef.current?.click()
                                    }
                                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                                      isLightTheme
                                        ? 'border-[#c8d7f6] bg-white text-[#204070]'
                                        : 'border-[#5478ad] bg-[#253b5e] text-[#dbeafe]'
                                    }`}
                                  >
                                    Select CSV
                                  </button>
                                  {onboardingUi?.job?.id &&
                                    ![
                                      'completed',
                                      'failed',
                                      'cancelled',
                                    ].includes(
                                      String(onboardingUi.phase || '')
                                    ) && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          void handleCancelOnboardingJob()
                                        }
                                        className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                                          isLightTheme
                                            ? 'border-[#f4c4c4] bg-[#fff1f1] text-[#9a3434]'
                                            : 'border-[#7a4343] bg-[#3e2323] text-[#ffd7d7]'
                                        }`}
                                      >
                                        Cancel
                                      </button>
                                    )}
                                </div>
                              </div>
                              {onboardingUi && (
                                <div className="mt-2 space-y-1.5">
                                  <div className="flex items-center justify-between text-[10px]">
                                    <span
                                      className={
                                        isLightTheme
                                          ? 'text-[#4a5f84]'
                                          : 'text-[#b6c8ec]'
                                      }
                                    >
                                      Upload
                                    </span>
                                    <span
                                      className={
                                        isLightTheme
                                          ? 'text-[#204070]'
                                          : 'text-[#dbeafe]'
                                      }
                                    >
                                      {Math.max(
                                        0,
                                        Math.min(
                                          100,
                                          Number(onboardingUi.uploadPct || 0)
                                        )
                                      )}
                                      %
                                    </span>
                                  </div>
                                  <div
                                    className={`h-1.5 rounded-full ${isLightTheme ? 'bg-[#dbe6fb]' : 'bg-[#2a3d5f]'}`}
                                  >
                                    <div
                                      className={`h-full rounded-full ${isLightTheme ? 'bg-[#2f63c8]' : 'bg-[#7aa2f8]'}`}
                                      style={{
                                        width: `${Math.max(0, Math.min(100, Number(onboardingUi.uploadPct || 0)))}%`,
                                      }}
                                    />
                                  </div>
                                  {onboardingUi.job && (
                                    <>
                                      <div className="flex items-center justify-between text-[10px]">
                                        <span
                                          className={
                                            isLightTheme
                                              ? 'text-[#4a5f84]'
                                              : 'text-[#b6c8ec]'
                                          }
                                        >
                                          Processing
                                        </span>
                                        <span
                                          className={
                                            isLightTheme
                                              ? 'text-[#204070]'
                                              : 'text-[#dbeafe]'
                                          }
                                        >
                                          {Math.max(
                                            0,
                                            Math.min(
                                              100,
                                              Number(
                                                onboardingUi.job.progressPct ||
                                                  0
                                              )
                                            )
                                          )}
                                          %
                                        </span>
                                      </div>
                                      <div
                                        className={`h-1.5 rounded-full ${isLightTheme ? 'bg-[#dbe6fb]' : 'bg-[#2a3d5f]'}`}
                                      >
                                        <div
                                          className={`h-full rounded-full ${isLightTheme ? 'bg-[#2d8f5b]' : 'bg-[#5fd39c]'}`}
                                          style={{
                                            width: `${Math.max(
                                              0,
                                              Math.min(
                                                100,
                                                Number(
                                                  onboardingUi.job
                                                    .progressPct || 0
                                                )
                                              )
                                            )}%`,
                                          }}
                                        />
                                      </div>
                                    </>
                                  )}
                                  <p
                                    className={`text-[10px] ${
                                      isLightTheme
                                        ? 'text-[#3e557d]'
                                        : 'text-[#c8d7f7]'
                                    }`}
                                  >
                                    {onboardingUi.message ||
                                      (onboardingUi.job
                                        ? `${onboardingUi.job.stage} • ${onboardingUi.job.processedRows}/${onboardingUi.job.totalRows} rows`
                                        : onboardingUi.fileName)}
                                  </p>
                                  {onboardingUi.job?.events &&
                                    onboardingUi.job.events.length > 0 && (
                                      <div
                                        className={`max-h-16 space-y-1 overflow-auto rounded-md border px-2 py-1 ${
                                          isLightTheme
                                            ? 'border-[#d7e3fa] bg-white/80'
                                            : 'border-[#3f5f90] bg-[#1a2740]/80'
                                        }`}
                                      >
                                        {onboardingUi.job.events
                                          .slice(0, 3)
                                          .map((event: any, index: number) => (
                                            <p
                                              key={`${onboardingUi.job?.id}-event-${index}`}
                                              className={`text-[9px] ${
                                                isLightTheme
                                                  ? 'text-[#3a527a]'
                                                  : 'text-[#bdd0f4]'
                                              }`}
                                            >
                                              {String(
                                                event?.message ||
                                                  event?.event_type ||
                                                  event?.stage ||
                                                  'Job update'
                                              )}
                                            </p>
                                          ))}
                                      </div>
                                    )}
                                </div>
                              )}
                            </div>
                          )}
                        <input
                          ref={onboardingFileInputRef}
                          type="file"
                          accept=".csv,text/csv"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0] || null;
                            event.currentTarget.value = '';
                            void handleOnboardingFileSelected(file);
                          }}
                        />
                        <textarea
                          ref={composerInputRef}
                          value={prompt}
                          onChange={(event) => {
                            setPrompt(event.target.value);
                            composerSelectionRef.current = {
                              start: event.target.selectionStart,
                              end: event.target.selectionEnd,
                            };
                          }}
                          onKeyDown={handlePromptKeyDown}
                          onFocus={() => {
                            isComposerFocusedRef.current = true;
                            if (!isAuthenticated)
                              openQuickAuthModal(pathname || '/');
                          }}
                          onBlur={() => {
                            isComposerFocusedRef.current = false;
                          }}
                          placeholder={
                            isAuthenticated
                              ? ownerOnboardingRequired
                                ? 'Onboarding in progress: answer the current setup question...'
                                : isHelpMode
                                  ? 'Ask for help, examples, or guidance...'
                                  : activeToolCommand
                                    ? `Type your ${activeToolLabel || 'tool'} request...`
                                    : isRootAuthenticatedChatUi
                                      ? 'Ask saby about todays task'
                                      : 'Ask about branch risk, compliance, or performance...'
                              : ''
                          }
                          rows={1}
                          className={`w-full resize-none !border-0 bg-transparent text-[17px] leading-relaxed !shadow-none !outline-none !ring-0 transition-[min-height,height,padding] duration-300 ease-out ${
                            isRootAuthenticatedChatUi
                              ? useCompactRootComposer
                                ? 'min-h-[28px] py-0 sm:text-[18px]'
                                : 'max-h-[188px] min-h-[42px] py-0.5 sm:min-h-[48px] sm:text-[18px]'
                              : 'min-h-[32px] sm:min-h-[38px] sm:text-[18px]'
                          } ${
                            isLightTheme
                              ? 'text-[#121b2d] placeholder:text-[#8a8f9c]'
                              : 'text-[#f4f5fa] placeholder:text-[#a5a7ae]'
                          }`}
                          style={
                            isRootAuthenticatedChatUi
                              ? {
                                  fontFamily:
                                    "'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
                                  letterSpacing: '-0.01em',
                                  paddingTop: useCompactRootComposer
                                    ? '0'
                                    : '0.125rem',
                                  paddingBottom: useCompactRootComposer
                                    ? '0'
                                    : '0.125rem',
                                  fontSize: '16px',
                                  lineHeight: useCompactRootComposer
                                    ? '1.35'
                                    : '1.45',
                                }
                              : undefined
                          }
                        />
                      </div>

                      {isRootAuthenticatedChatUi &&
                        (selectedLandingToolGroup ||
                          isHelpMode ||
                          activeToolCommand) && (
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            {selectedLandingToolGroup && (
                              <span
                                className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-medium sm:text-[11px] ${
                                  isLightTheme
                                    ? 'border-[#dbe4f3] bg-[#f7faff] text-[#1f2a44]'
                                    : 'border-white/[0.08] bg-white/[0.04] text-[#eef0f6]'
                                }`}
                              >
                                {selectedLandingToolGroup.title}
                                <button
                                  type="button"
                                  onClick={clearLandingToolSelection}
                                  className="text-current/80 hover:text-current"
                                  aria-label="Clear selected parent task"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </span>
                            )}
                            {isHelpMode && (
                              <span
                                className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-medium sm:text-[11px] ${
                                  isLightTheme
                                    ? 'border-[#c8e6d1] bg-[#eaffef] text-[#0f5131]'
                                    : 'border-[#3f7d5e] bg-[#1f3f30] text-[#dcfce7]'
                                }`}
                              >
                                Help
                                <button
                                  type="button"
                                  onClick={() => setIsHelpMode(false)}
                                  className="text-current/80 hover:text-current"
                                  aria-label="Clear help mode"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </span>
                            )}
                            {activeToolCommand && (
                              <span
                                className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-medium sm:text-[11px] ${
                                  isLightTheme
                                    ? 'border-[#cfe0ff] bg-[#edf3ff] text-[#103d7a]'
                                    : 'border-[#4b6ea4] bg-[#20304b] text-[#dbeafe]'
                                }`}
                              >
                                {activeToolLabel || 'Tool'}
                                <button
                                  type="button"
                                  onClick={() => setActiveToolCommand(null)}
                                  className="text-current/80 hover:text-current"
                                  aria-label="Clear selected tool"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </span>
                            )}
                          </div>
                        )}

                      <div
                        className={`flex items-end justify-between gap-2 transition-[margin,padding] duration-300 ease-out sm:gap-2.5 ${
                          isRootAuthenticatedChatUi
                            ? useCompactRootComposer
                              ? 'mt-0.5 pt-0'
                              : 'mt-2 pt-0.5'
                            : 'mt-1.5'
                        }`}
                      >
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setIsQuickActionOpen((prev) => !prev)
                            }
                            className={`rounded-full border p-2 transition active:scale-[0.98] sm:p-2.5 ${
                              isLightTheme
                                ? 'border-[#ddd7cd] bg-[#f2efe8] text-[#1f2b46] hover:bg-[#ebe6dc]'
                                : isRootAuthenticatedChatUi
                                  ? 'border-white/[0.06] bg-white/[0.05] text-[#f0f1f7] hover:bg-white/[0.09]'
                                  : 'border-white/10 bg-[#2a2a2a] text-[#f0f1f7] hover:bg-white/10'
                            }`}
                          >
                            {isRootAuthenticatedChatUi && isQuickActionOpen ? (
                              <X className="h-5 w-5 sm:h-6 sm:w-6" />
                            ) : (
                              <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
                            )}
                          </button>
                          {isQuickActionOpen && (
                            <div
                              className={`menu-pop absolute left-0 z-30 rounded-[22px] border p-2 shadow-2xl ${
                                isLightTheme
                                  ? 'border-[#d4dced] bg-white'
                                  : isRootAuthenticatedChatUi
                                    ? 'border-white/[0.08] bg-[#232321]'
                                    : 'border-white/10 bg-[#242424]'
                              } ${
                                isRootAuthenticatedChatUi
                                  ? 'bottom-[calc(100%+14px)] w-[22rem]'
                                  : 'bottom-12 w-60 sm:bottom-14'
                              }`}
                            >
                              {composeActionItems.map((action, index) => (
                                <div key={action.label}>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleActionNavigation(
                                        action.href,
                                        action.requiresAuth
                                      )
                                    }
                                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[13px] transition ${
                                      isLightTheme
                                        ? 'text-[#1f2a44] hover:bg-[#eef3ff]'
                                        : isRootAuthenticatedChatUi
                                          ? 'text-[#dfdfdd] hover:bg-white/[0.06]'
                                          : 'text-[#d8d9e0] hover:bg-white/10'
                                    }`}
                                  >
                                    <span className="flex items-center gap-2.5">
                                      {action.icon}
                                      <span>{action.label}</span>
                                    </span>
                                    {action.hasSubmenu && (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </button>
                                  {index === 0 &&
                                    composeActionItems.length > 1 && (
                                      <div
                                        className={`mx-2.5 my-1 border-t ${isLightTheme ? 'border-[#dbe2f0]' : 'border-white/15'}`}
                                      />
                                    )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {isAuthenticated && !isRootAuthenticatedChatUi && (
                          <Link
                            href={getTargetPath(
                              ownerOnboardingRequired
                                ? '/studio/onboarding'
                                : (liveTaskItems[activeIssueIndex]?.href ??
                                    '/studio'),
                              ownerOnboardingRequired
                                ? true
                                : liveTaskItems[activeIssueIndex]?.requiresAuth
                            )}
                            onClick={(event) => {
                              if (ownerOnboardingRequired) {
                                event.preventDefault();
                                router.push('/studio/onboarding');
                                return;
                              }
                              const activeIssue =
                                liveTaskItems[activeIssueIndex];
                              if (
                                activeIssue?.requiresAuth &&
                                !isAuthenticated
                              ) {
                                event.preventDefault();
                                openQuickAuthModal(activeIssue.href);
                              }
                            }}
                            className={`mx-2 hidden min-w-0 flex-1 items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] sm:flex ${
                              isLightTheme
                                ? 'border-[#d6e0f2] bg-[#f7f9ff] text-[#33415f]'
                                : 'border-white/15 bg-white/[0.04] text-[#cfd7ea]'
                            }`}
                            title={
                              ownerOnboardingRequired
                                ? 'Owner setup in progress'
                                : liveTaskItems[activeIssueIndex]?.label
                            }
                          >
                            <span className="shrink-0 font-semibold uppercase tracking-[0.08em] opacity-75">
                              {ownerOnboardingRequired ? 'Setup' : 'Task'}
                            </span>
                            <span className="truncate">
                              {ownerOnboardingRequired
                                ? 'We need a few onboarding answers before normal chat.'
                                : liveTaskItems[activeIssueIndex]?.label}
                            </span>
                          </Link>
                        )}

                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <div
                            className={`${isRootAuthenticatedChatUi ? 'hidden' : 'relative hidden sm:block'}`}
                            ref={moduleLibraryMenuRef}
                          >
                            <button
                              type="button"
                              disabled={dashboardNavLocked}
                              onClick={() => {
                                if (!isAuthenticated) {
                                  openQuickAuthModal(pathname || '/');
                                  return;
                                }
                                if (dashboardNavLocked) {
                                  showOnboardingLockNotice('module library');
                                  return;
                                }
                                setIsModuleLibraryMenuOpen((prev) => !prev);
                                setIsToolsMenuOpen(false);
                                setIsHelpMenuOpen(false);
                                if (!isModuleLibraryMenuOpen) {
                                  void fetchModuleLibrary();
                                }
                              }}
                              className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition sm:inline-flex ${
                                isLightTheme
                                  ? 'border-[#ced7e8] bg-[#f7f9ff] text-[#1f2b46] hover:bg-[#eef3ff]'
                                  : 'border-white/20 bg-[#262a34] text-[#d6dae7] hover:bg-white/10'
                              } disabled:cursor-not-allowed disabled:opacity-55`}
                              aria-label="Module library"
                            >
                              <Settings2 className="h-4 w-4" />
                            </button>
                            {isModuleLibraryMenuOpen && (
                              <div
                                className={`menu-pop absolute bottom-11 right-0 z-30 w-[32rem] max-w-[calc(100vw-1.5rem)] rounded-xl border p-2 shadow-2xl ${
                                  isLightTheme
                                    ? 'border-[#d4dced] bg-white'
                                    : 'border-white/15 bg-[#31333b]'
                                }`}
                              >
                                <div className="mb-2 flex items-center justify-between gap-2">
                                  <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.08em] opacity-80">
                                    Module Library
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => void fetchModuleLibrary()}
                                    className={`rounded-full border px-2 py-0.5 text-[10px] ${
                                      isLightTheme
                                        ? 'border-[#d7e3fa] bg-[#f4f8ff] text-[#204070]'
                                        : 'border-[#3f5f90] bg-[#1f2e48] text-[#dbeafe]'
                                    }`}
                                  >
                                    Refresh
                                  </button>
                                </div>
                                <div className="max-h-80 space-y-1 overflow-auto">
                                  {moduleLibraryLoading && (
                                    <p className="px-2 py-1 text-[11px] opacity-75">
                                      Loading modules...
                                    </p>
                                  )}
                                  {!moduleLibraryLoading &&
                                    moduleLibraryError && (
                                      <p className="px-2 py-1 text-[11px] text-[#e07474]">
                                        {typeof moduleLibraryError === 'string'
                                          ? moduleLibraryError
                                          : formatChatErrorMessage(moduleLibraryError)}
                                      </p>
                                    )}
                                  {!moduleLibraryLoading &&
                                    !moduleLibraryError &&
                                    moduleLibraryItems.length === 0 && (
                                      <p className="px-2 py-1 text-[11px] opacity-75">
                                        No modules found yet.
                                      </p>
                                    )}
                                  {moduleLibraryItems.map((item) => (
                                    <button
                                      key={`module-item-${item.projectFormId}`}
                                      type="button"
                                      onClick={() =>
                                        openModuleFromLibrary(item)
                                      }
                                      className={`w-full rounded-lg border px-2.5 py-2 text-left transition ${
                                        isLightTheme
                                          ? 'border-[#dbe4f3] bg-[#f9fbff] text-[#1f2a44] hover:bg-[#eef3ff]'
                                          : 'border-white/10 bg-white/[0.03] text-[#d8d9e0] hover:bg-white/10'
                                      }`}
                                    >
                                      <p className="truncate text-[12px] font-semibold">
                                        {item.name}
                                      </p>
                                      <p className="mt-0.5 truncate text-[10px] opacity-80">
                                        {item.projectId} • {item.status}
                                      </p>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="relative">
                            <button
                              type="button"
                              disabled={dashboardNavLocked}
                              onClick={() => {
                                if (!isAuthenticated) {
                                  openQuickAuthModal(pathname || '/');
                                  return;
                                }
                                if (dashboardNavLocked) {
                                  showOnboardingLockNotice('tools');
                                  return;
                                }
                                setIsToolsMenuOpen((prev) => {
                                  const next = !prev;
                                  if (!next) {
                                    setRootMenuOpenSections({
                                      model: false,
                                      workspace: false,
                                      insights: false,
                                      utilities: false,
                                      response: false,
                                    });
                                  }
                                  return next;
                                });
                              }}
                              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                                isLightTheme
                                  ? 'border-[#ddd7cd] bg-[#f2efe8] text-[#1f2b46] hover:bg-[#ebe6dc]'
                                  : isRootAuthenticatedChatUi
                                    ? 'border-white/[0.06] bg-white/[0.055] text-[#ececeb] hover:bg-white/[0.095]'
                                    : 'border-white/12 bg-[#2a2a2a] text-[#e5e7eb] hover:bg-[#323232]'
                              } disabled:cursor-not-allowed disabled:opacity-55`}
                              aria-label="Model and tools"
                            >
                              <span>
                                {isRootAuthenticatedChatUi
                                  ? selectedRootModel
                                  : 'Saby'}
                              </span>
                              <ChevronDown className="h-4 w-4" />
                            </button>
                            {isToolsMenuOpen && (
                              <div
                                className={`menu-pop absolute right-0 z-30 max-w-[calc(100vw-1.5rem)] rounded-[20px] border p-1.5 shadow-2xl ${
                                  isLightTheme
                                    ? 'border-[#d4dced] bg-white'
                                    : isRootAuthenticatedChatUi
                                      ? 'border-white/[0.08] bg-[#242422]'
                                      : 'border-white/10 bg-[#242424]'
                                } ${
                                  isRootAuthenticatedChatUi
                                    ? 'bottom-[calc(100%+12px)] w-[17.5rem]'
                                    : 'bottom-11 w-[20rem]'
                                }`}
                              >
                                {isRootAuthenticatedChatUi ? (
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between px-2.5 py-1.5">
                                      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/60">
                                        Model
                                      </span>
                                    </div>
                                    <div className="space-y-1 px-1 pb-1">
                                      {rootModelOptions.map((model: any) => {
                                        const isSelected =
                                          selectedRootModel === model.label;
                                        return (
                                          <button
                                            key={model.key}
                                            type="button"
                                            onClick={() => {
                                              setSelectedRootModel(model.label);
                                              setIsToolsMenuOpen(false);
                                            }}
                                            className={`flex w-full items-center justify-between rounded-[14px] border px-2.5 py-1.5 text-left transition ${
                                              isLightTheme
                                                ? isSelected
                                                  ? 'border-[#c7d6f7] bg-[#eef4ff] text-[#1f2a44]'
                                                  : 'border-[#dbe4f3] bg-white text-[#1f2a44] hover:bg-[#eef3ff]'
                                                : isSelected
                                                  ? 'border-white/[0.12] bg-white/[0.065] text-white'
                                                  : 'border-white/[0.08] bg-white/[0.025] text-[#d8d9e0] hover:bg-white/[0.06]'
                                            }`}
                                          >
                                            <span className="min-w-0">
                                              <span className="block text-[11px] font-medium leading-tight">
                                                {model.label}
                                              </span>
                                              <span className="mt-0.5 block text-[9px] opacity-65">
                                                {model.hint}
                                              </span>
                                            </span>
                                            <span
                                              className={`inline-flex h-5 min-w-[2.4rem] items-center rounded-full border px-0.5 transition ${
                                                isSelected
                                                  ? isLightTheme
                                                    ? 'justify-end border-[#87a8eb] bg-[#d8e6ff]'
                                                    : 'justify-end border-white/[0.14] bg-white/[0.14]'
                                                  : isLightTheme
                                                    ? 'justify-start border-[#cfd9ec] bg-white'
                                                    : 'justify-start border-white/[0.1] bg-white/[0.03]'
                                              }`}
                                              aria-hidden="true"
                                            >
                                              <span
                                                className={`h-3.5 w-3.5 rounded-full ${
                                                  isSelected
                                                    ? isLightTheme
                                                      ? 'bg-[#2b5fd8]'
                                                      : 'bg-white'
                                                    : isLightTheme
                                                      ? 'bg-[#aab6cf]'
                                                      : 'bg-white/45'
                                                }`}
                                              />
                                            </span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-3 gap-1">
                                    {commandTools.map((tool) => (
                                      <button
                                        key={tool.key}
                                        type="button"
                                        onClick={() =>
                                          handleSelectToolCommand(tool.command)
                                        }
                                        className={`rounded-md border px-2 py-2.5 text-center transition ${
                                          isLightTheme
                                            ? 'border-[#dbe4f3] bg-[#f9fbff] text-[#1f2a44] hover:bg-[#eef3ff]'
                                            : 'border-white/10 bg-white/[0.03] text-[#d8d9e0] hover:bg-white/10'
                                        }`}
                                      >
                                        <div className="flex flex-col items-center gap-1.5">
                                          <span
                                            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${
                                              isLightTheme
                                                ? 'border-[#d2ddef] bg-[#eef4ff] text-[#1d3f74]'
                                                : 'border-white/15 bg-white/5 text-[#d9e4ff]'
                                            }`}
                                          >
                                            {tool.icon}
                                          </span>
                                          <div className="line-clamp-2 text-[11px] font-semibold leading-tight">
                                            {tool.label}
                                          </div>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            disabled={dashboardNavLocked}
                            onClick={handleActivateHelpMode}
                            className={`${
                              isRootAuthenticatedChatUi
                                ? 'hidden'
                                : 'hidden sm:inline-flex'
                            } h-9 w-9 items-center justify-center rounded-full border transition ${
                              isHelpMode
                                ? isLightTheme
                                  ? 'border-[#3568d4] bg-[#e7f0ff] text-[#11346c]'
                                  : 'border-[#7197df] bg-[#253a5f] text-[#e6efff]'
                                : isLightTheme
                                  ? 'border-[#ced7e8] bg-[#f7f9ff] text-[#1f2b46] hover:bg-[#eef3ff]'
                                  : 'border-white/20 bg-[#262a34] text-[#d6dae7] hover:bg-white/10'
                            } disabled:cursor-not-allowed disabled:opacity-55`}
                            aria-label="Help mode"
                          >
                            <CircleHelp className="h-4 w-4" />
                          </button>
                          {isAuthenticated &&
                            !ownerOnboardingRequired &&
                            activeToolCommand === '/onboarding' && (
                              <button
                                type="button"
                                onClick={() =>
                                  onboardingFileInputRef.current?.click()
                                }
                                className={`hidden h-9 w-9 items-center justify-center rounded-full border transition sm:inline-flex ${
                                  isLightTheme
                                    ? 'border-[#ced7e8] bg-[#f7f9ff] text-[#1f2b46] hover:bg-[#eef3ff]'
                                    : 'border-white/20 bg-[#262a34] text-[#d6dae7] hover:bg-white/10'
                                }`}
                                aria-label="Upload onboarding CSV"
                              >
                                <Paperclip className="h-4 w-4" />
                              </button>
                            )}
                          <button
                            type="button"
                            onClick={handleGuestComposerAction}
                            disabled={isChatSending}
                            className={`flex h-10 w-10 items-center justify-center rounded-full transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:w-11 ${
                              isLightTheme
                                ? hasPromptValue
                                  ? 'bg-[#111827] text-white'
                                  : isVoiceListening
                                    ? 'border border-[#87a8eb] bg-[#d8e6ff] text-[#1c4ed8]'
                                    : 'border border-[#ddd7cd] bg-[#f2efe8] text-[#4b5563]'
                                : hasPromptValue
                                  ? 'bg-[#f3f4f6] text-[#111827]'
                                  : isVoiceListening
                                    ? 'border border-[#5b7bb8] bg-[#2b3f62] text-[#dbeafe]'
                                    : isRootAuthenticatedChatUi
                                      ? 'border border-white/[0.06] bg-white/[0.045] text-[#d1d5db]'
                                      : 'border border-white/10 bg-[#2a2a2a] text-[#d1d5db]'
                            }`}
                            aria-label={
                              isVoiceListening
                                ? 'Stop voice input'
                                : hasPromptValue
                                  ? 'Send message'
                                  : 'Start voice input'
                            }
                          >
                            {isVoiceListening ? (
                              <Mic className="h-5 w-5" />
                            ) : hasPromptValue ? (
                              <ArrowUp className="h-5 w-5" />
                            ) : (
                              <Mic className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {isRootAuthenticatedChatUi &&
              (isVoiceListening || voiceInputError) && (
                <p
                  className={`mt-2 text-center text-[10px] sm:text-[11px] ${
                    voiceInputError
                      ? isLightTheme
                        ? 'text-[#b42318]'
                        : 'text-[#fca5a5]'
                      : isLightTheme
                        ? 'text-[#3559a6]'
                        : 'text-[#b8cdfc]'
                  }`}
                >
                  {voiceInputError ||
                    'Listening... speak now and your words will be added to the prompt.'}
                </p>
              )}

            {showAuthenticatedRootHero && (
              <div className="mx-auto mt-0.5 w-full max-w-[54rem]">
                {!activeLandingToolGroup && (
                  <div className="grid gap-1.5 md:grid-cols-3">
                    {landingToolGroups.map((group) => (
                      <button
                        key={group.key}
                        type="button"
                        onClick={() => setActiveLandingToolGroup(group.key)}
                        className={`min-h-[78px] rounded-[20px] border px-4 py-2.5 text-left transition-all duration-300 ease-out ${
                          isLightTheme
                            ? 'border-[#dbe4f3] bg-white text-[#1f2a44] hover:bg-[#f7faff]'
                            : 'border-white/[0.1] bg-[#0f1012] text-[#eef0f6] hover:bg-white/[0.05]'
                        }`}
                      >
                        <span className="flex items-center gap-2 text-[0.9rem] font-medium sm:text-[0.95rem]">
                          <span
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-full border ${
                              isLightTheme
                                ? 'border-[#dbe4f3] bg-[#f7faff] text-[#244579]'
                                : 'border-white/[0.08] bg-white/[0.04] text-[#d7def0]'
                            }`}
                          >
                            {group.icon}
                          </span>
                          <span>{group.title}</span>
                        </span>
                        <span className="mt-0.5 block text-[10px] opacity-70 sm:text-[10.5px]">
                          {group.description}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-out ${
                    activeLandingToolGroup
                      ? 'mt-0.5 max-h-[140px] translate-y-0 opacity-100'
                      : 'mt-0 max-h-0 -translate-y-1 opacity-0'
                  }`}
                >
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {selectedLandingToolGroup?.children.map((tool, index) => {
                      const activeGroup = selectedLandingToolGroup;
                      const inactiveChipClasses = isLightTheme
                        ? 'border-[#dbe4f3] bg-[#fbfdff] text-[#1f2a44] hover:bg-[#f2f6ff]'
                        : activeGroup?.key === 'workspace'
                          ? 'border-[#365b96]/45 bg-[#1a2740] text-[#dbeafe] hover:bg-[#223458]'
                          : activeGroup?.key === 'insights'
                            ? 'border-[#6b55a0]/45 bg-[#271a37] text-[#efe4ff] hover:bg-[#342348]'
                            : 'border-[#6f8c39]/45 bg-[#202b12] text-[#e9f7cf] hover:bg-[#2b3918]';
                      const activeChipClasses = isLightTheme
                        ? 'border-[#b7cbee] bg-[#eef4ff] text-[#133c75] shadow-[0_8px_18px_rgba(16,58,117,0.14)]'
                        : activeGroup?.chipAccent ||
                          'border-[#4b6ea4] bg-[#20304b] text-[#dbeafe]';
                      return (
                        <button
                          key={`landing-tool-${tool.key}`}
                          type="button"
                          onClick={() => handleSelectToolCommand(tool.command)}
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-left text-[11px] font-medium transition-all duration-300 ease-out ${
                            activeToolCommand === tool.command
                              ? activeChipClasses
                              : inactiveChipClasses
                          }`}
                          style={{
                            transitionDelay: `${Math.min(index * 35, 180)}ms`,
                          }}
                        >
                          <span
                            className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                              isLightTheme
                                ? 'border-[#d2ddef] bg-[#eef4ff] text-[#1d3f74]'
                                : activeGroup?.key === 'workspace'
                                  ? 'border-[#4a6aa5]/45 bg-[#243758] text-[#dbeafe]'
                                  : activeGroup?.key === 'insights'
                                    ? 'border-[#7b63ad]/45 bg-[#3a2850] text-[#efe4ff]'
                                    : 'border-[#7d9845]/45 bg-[#33431c] text-[#e9f7cf]'
                            }`}
                          >
                            {tool.icon}
                          </span>
                          <span className="whitespace-nowrap">
                            {tool.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {isAuthenticated &&
              (!isRootAuthenticatedChatUi || hasAuthenticatedChatActivity) && (
                <p
                  className={`mt-2 text-center text-[10px] leading-relaxed sm:mt-2 sm:text-[11px] ${
                    isLightTheme ? 'text-[#6f7d96]' : 'text-[#b7bccb]'
                  }`}
                >
                  {isRootAuthenticatedChatUi
                    ? 'Saby AI can make mistakes. '
                    : 'By messaging Saby AI, you agree to our '}
                  {isRootAuthenticatedChatUi
                    ? 'Review important outputs. By messaging Saby AI, you agree to our '
                    : ''}
                  <Link
                    href="/terms-of-service"
                    className={`underline underline-offset-4 transition ${isLightTheme ? 'hover:text-[#111827]' : 'hover:text-white'}`}
                  >
                    Terms
                  </Link>{' '}
                  and have read our{' '}
                  <Link
                    href="/privacy-policy"
                    className={`underline underline-offset-4 transition ${isLightTheme ? 'hover:text-[#111827]' : 'hover:text-white'}`}
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              )}
          </div>
        </section>

        {!isAuthenticated && (
          <>
            <TrustedByCompanies isLightTheme={isLightTheme} />
            <IntegrationsSection isLightTheme={isLightTheme} />
            <WorkflowTemplatesSection isLightTheme={isLightTheme} />
            <SabyPricingCtaSection
              isLightTheme={isLightTheme}
              onCtaClick={() => openQuickAuthModal(pathname || '/')}
            />
            <FooterSection variant="landing" isLightTheme={isLightTheme} />
          </>
        )}
      </main>

      <SabyProfileSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        isLightTheme={isLightTheme}
        initialTab={settingsModalInitialTab}
        displayName={displayName}
        displayEmail={displayEmail}
        settingsStorageKey={modalSettingsStorageKey}
        themeMode={themeMode}
        onThemeModeChange={setThemeMode}
      />

      <PublicAuthModal
        isOpen={isPublicAuthModalOpen}
        onClose={() => setIsPublicAuthModalOpen(false)}
        initialView={authView}
        initialError={authModalInitialError}
        callbackPath={authRedirectPath || pathname || '/'}
        isLightTheme={isLightTheme}
        description="Log in or create your account to continue."
      />

      <style jsx>{`
        :global(.saby-chat-prose) {
          font-size: 1.04rem;
          line-height: 1.8;
        }

        :global(.saby-chat-prose p),
        :global(.saby-chat-prose li),
        :global(.saby-chat-prose div) {
          font-size: inherit;
        }

        :global(.saby-prose-dark) {
          color: #f3f4f6;
        }

        .root-chat-scroll-offset {
          scrollbar-gutter: stable;
        }

        @keyframes menu-pop {
          0% {
            opacity: 0;
            transform: translateY(-6px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes issue-flash {
          0% {
            opacity: 0.28;
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            opacity: 0.28;
          }
        }

        .issue-flash {
          animation: issue-flash 3s ease-in-out;
          transition: background 180ms ease;
        }

        .menu-pop {
          animation: menu-pop 170ms cubic-bezier(0.16, 1, 0.3, 1) both;
          transform-origin: top right;
        }

        @keyframes onboarding-turn-in {
          0% {
            opacity: 0;
            transform: translateY(6px) scale(0.99);
            filter: blur(1px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes onboarding-turn-out {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0.92;
            transform: translateY(0) scale(1);
          }
        }

        .onboarding-turn-active {
          animation: onboarding-turn-in 220ms ease both;
        }

        .onboarding-turn-answered {
          animation: onboarding-turn-out 260ms ease both;
        }

        .typing-dots {
          display: inline-flex;
          gap: 5px;
          align-items: center;
          min-width: 28px;
          min-height: 10px;
        }

        .typing-dots span {
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background: currentColor;
          opacity: 0.25;
          animation: typing-pulse 1.05s ease-in-out infinite;
        }

        .typing-dots span:nth-child(2) {
          animation-delay: 0.12s;
        }

        .typing-dots span:nth-child(3) {
          animation-delay: 0.24s;
        }

        @keyframes typing-pulse {
          0%,
          80%,
          100% {
            transform: translateY(0);
            opacity: 0.25;
          }
          40% {
            transform: translateY(-2px);
            opacity: 1;
          }
        }

        .issue-flash:hover {
          background: rgba(255, 255, 255, 0.16);
        }

        @media (prefers-reduced-motion: reduce) {
          .issue-flash,
          .menu-pop,
          .onboarding-turn-active,
          .onboarding-turn-answered,
          .typing-dots span {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
