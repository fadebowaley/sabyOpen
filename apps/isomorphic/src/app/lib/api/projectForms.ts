import { api } from '../axios';

// Type definitions
export interface FormElement {
  id: string;
  type: string;
  properties: {
    label?: string;
    placeholder?: string; // Optional and should be omitted if empty
    required?: boolean;
    validation?: any;
    options?: string[];
      dependsOn?: string;
      leadScore?: number;
      leadScores?: string | Record<string, unknown>;
      correctAnswer?: string | string[];
      quizPoints?: number;
      matchWeights?: string | Record<string, unknown>;
      mediaUrl?: string;
      mediaAlt?: string;
      branchingRule?: {
        targetNodeId?: string;
        operator?: 'equals' | string;
        expectedValue?: string;
        action?: 'show' | 'hide' | string;
      };
    multiple?: boolean;
    accept?: string;
    defaultValue?: any;
    showWithNext?: boolean;
    [key: string]: any;
  };
  position: {
    x: number;
    y: number;
  };
}

export interface TransactionPayment {
  enabled?: boolean;
  mode?: string;
  currency?: string | null;
  enabledChannels?: Array<
    'paystack' | 'flutterwave' | 'sabypay' | '9psb' | 'premium' | string
  >;
  defaultChannel?: string | null;
  collectionStage?:
    | 'submission'
    | 'pre_approval'
    | 'post_approval'
    | 'before_submit'
    | 'before_approval'
    | 'after_approval'
    | string;
  settlementType?: string;
  receivingAccount?: Record<string, any> | string | null;
  channelConfigs?: Record<string, any>;
  policies?: {
    requirePaymentBeforeSubmit?: boolean;
    allowPartialPayment?: boolean;
    allowOverpayment?: boolean;
    refundPolicy?: string;
  };
}

export interface ReceivingAccount {
  id?: string | null;
  label?: string;
  accountNumber?: string;
  bankName?: string;
  accountName?: string;
  isPrimary?: boolean;
  isActive?: boolean;
}

export interface TransactionRemittance {
  enabled?: boolean;
  accountSource?: string;
  specificNodeId?: string | null;
  targetLevelId?: string | null;
  requireNodeAccount?: boolean;
  nodeAccountField?: string | null;
  inheritParentAccount?: boolean;
  settlementRule?: {
    mode?: string;
    splitType?: string;
    targets?: Array<{
      nodeId: string;
      percentage?: number;
    }>;
  };
  routing?: {
    byNode?: boolean;
    bySubmissionValue?: boolean;
    fallbackAccountId?: string | null;
  };
}

export interface TransactionInvoiceCondition {
  sourceType?: 'field' | 'submission_status' | 'workflow_status' | string;
  fieldId?: string | null;
  statusKey?: string | null;
  operator?: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in' | string;
  value?: string | number | boolean | null;
}

export interface TransactionInvoiceLineItem {
  id?: string;
  label?: string;
  sourceField?: string | null;
  enabled?: boolean;
  calculationType?: 'fixed' | 'percentage' | 'formula' | string;
  rate?: number;
  fixedAmount?: number | null;
  quantityField?: string | null;
  baseExpression?: string | null;
  computedExpression?: string | null;
  includeInSubtotal?: boolean;
  conditions?: TransactionInvoiceCondition[];
  active?: boolean;
}

export interface TransactionInvoiceAdjustment {
  enabled?: boolean;
  mode?: 'none' | 'fixed' | 'percentage' | 'formula' | string;
  value?: number;
  expression?: string | null;
  conditions?: TransactionInvoiceCondition[];
}

export interface TransactionInvoice {
  enabled?: boolean;
  calculationMode?: string;
  currency?: string | null;
  baseAmount?: number;
  amountSourceField?: string | null;
  lineItemsEnabled?: boolean;
  lineItems?: TransactionInvoiceLineItem[];
  discountsEnabled?: boolean;
  taxEnabled?: boolean;
  discounts?: TransactionInvoiceAdjustment;
  tax?: TransactionInvoiceAdjustment;
  totals?: {
    subtotalExpression?: string | null;
    discountExpression?: string | null;
    taxExpression?: string | null;
    grandTotalExpression?: string | null;
  };
  invoiceNumbering?: {
    mode?: string;
    prefix?: string;
    nextNumber?: number;
  };
  presentation?: {
    showPaymentInstructions?: boolean;
    showRemittanceDetails?: boolean;
    showDueDate?: boolean;
    showSubtotal?: boolean;
    showDiscount?: boolean;
    showTax?: boolean;
    showGrandTotal?: boolean;
  };
}

export interface AutomationRuleCondition {
  id?: string;
  sourceType?: 'field' | 'submission_status' | 'workflow_status';
  fieldId?: string | null;
  statusKey?: string | null;
  operator?: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in';
  value?: any;
}

export interface AutomationRule {
  id?: string;
  name?: string;
  enabled?: boolean;
  priority?: number;
  matchMode?: 'all' | 'any';
  scope?: {
    source?: 'submission' | 'workflow';
    trigger?: 'created' | 'updated' | 'approved' | 'rejected' | 'completed' | 'manual';
  };
  conditions?: AutomationRuleCondition[];
  actionRefs?: string[];
  outcome?: {
    statusOnMatch?: string | null;
    note?: string;
  };
}

export interface ConnectedAction {
  id?: string;
  name?: string;
  enabled?: boolean;
  provider?: 'internal' | 'webhook' | 'email' | 'slack' | 'zapier' | 'power_automate';
  actionType?: 'notify' | 'status_update' | 'integration_sync' | 'assign' | 'webhook_call';
  target?: string | null;
  config?: Record<string, any>;
  retryPolicy?: {
    enabled?: boolean;
    maxAttempts?: number;
  };
}

export interface AutomationOperationalVisibility {
  showRunLog?: boolean;
  showStatuses?: boolean;
  showOwners?: boolean;
  showAuditTrail?: boolean;
  showRuleMatches?: boolean;
  showLastRunAt?: boolean;
}

export interface ProjectFormData {
  schemaVersion: '2.0.0';
  workspaceId?: string;
  identity: {
    name: string;
    description: string;
    category: 'standard' | 'system' | string;
    tags: string[];
    status: 'draft' | 'published' | 'archived';
  };
  elements?: FormElement[];
  layout?: {
    style?: string;
    wizardMode?: boolean;
    grid?: {
      columns?: number;
      columnSpans?: Record<string, number>;
    };
    builder?: Record<string, any>;
  };
  capabilities?: {
    experience?: {
      security?: {
        enabled?: boolean;
        audience?: 'public' | 'authenticated' | 'selected_roles' | 'selected_users';
        profile?:
          | 'open_public'
          | 'private_safe'
          | 'restricted_team'
          | 'internal_staff'
          | 'high_security';
        mode?: 'public' | 'private' | 'restricted' | 'internal';
        publicSecureMode?: 'off' | 'link_only' | 'otp' | 'access_code';
        access?: {
          whoCanAccess?:
            | 'anyone'
            | 'authenticated_users'
            | 'selected_roles'
            | 'selected_users';
          allowedRoles?: string[];
          allowedUsers?: string[];
          restrictByLocation?: boolean;
          allowedCountries?: string[];
        };
        authentication?: {
          method?: 'none' | 'otp' | 'access_code';
          requireLogin?: boolean;
          allowAnonymous?: boolean;
          requireOtp?: boolean;
        };
        accessCode?: {
          code?: string | null;
          hint?: string | null;
          maxAttempts?: number;
          lockoutMinutes?: number;
        };
        submissionProtection?: {
          preventDuplicateSubmission?: boolean;
          duplicateCheckField?: string | null;
          rateLimitEnabled?: boolean;
          maxSubmissionsPerUser?: number | null;
        };
        channels?: (
          | 'web'
          | 'api'
          | 'embedded'
          | 'javascript'
          | 'mobile'
          | 'whatsapp'
          | 'telegram'
        )[];
      };
      behavior?: Record<string, any>;
      previewSubmission?: {
        enabled?: boolean;
        layout?: string;
        allowEditBeforeSubmit?: boolean;
        showBranding?: boolean;
      };
      distribution?: Record<string, any>;
      notifications?: Record<string, any>;
      compliance?: {
        enabled?: boolean;
        availability?: {
          startDate?: string | null;
          endDate?: string | null;
        };
        reportingPeriod?: {
          scope?: 'yearly' | 'monthly' | 'weekly' | 'daily' | 'custom_range';
          weekStartsOn?: 0 | 1;
          timezone?: string | null;
          defaultYear?: number | null;
          defaultMonth?: string | null;
          customRange?: {
            maxDays?: number | null;
          };
        };
        submissionPolicy?: {
          maxSubmissionsPerPeriod?: number;
          allowBackdating?: boolean;
          closeWindowAtPeriodEnd?: boolean;
        };
        submissionFrequency?: {
          mode?: 'once' | 'multiple' | 'daily' | 'weekly' | 'monthly' | 'custom';
          count?: number;
          weekdays?: number[];
          monthDates?: number[];
          intervalWeeks?: number;
          custom?: {
            interval?: number | null;
            unit?: 'day' | 'week' | 'month' | null;
          };
        };
        trackingMode?: 'none' | 'daily' | 'weekly' | 'monthly';
        dailyConfig?: {
          activeDays?: number[];
          frequencyPerDay?: number;
          skipWeekends?: boolean;
          skipHolidays?: boolean;
        };
        weeklyConfig?: {
          days?: Array<{
            day: number;
            name: string;
            frequency: 'weekly' | 'biweekly' | 'monthly';
            occurrences?: number | null;
            enabled: boolean;
          }>;
        };
        monthlyConfig?: {
          dates?: number[];
          submissionLimitPerDate?: number;
        };
        schedule?: {
          frequency?: 'daily' | 'weekly' | 'monthly';
          startDate?: string | null;
          endDate?: string | null;
          daily?: {
            weekdays?: number[];
          };
          weekly?: {
            intervalWeeks?: number;
            weekdays?: number[];
            anchorDate?: string | null;
          };
          monthly?: {
            dates?: number[];
          };
        };
        submissionLimit?: {
          count?: number;
          scope?: 'occurrence';
        };
        enforcement?: {
          allowBackdating?: boolean;
          closeWindowAtPeriodEnd?: boolean;
        };
        requireNodeId?: boolean;
        requireMonth?: boolean;
        trackCompliance?: boolean;
        autoGenerateCalendar?: boolean;
        autoLockMonthEnd?: boolean;
        calendarRequired?: boolean;
        eventTypes?: string[];
        calendarGeneration?: {
          startDate?: string | null;
          endDate?: string | null;
          allowBackdating?: boolean;
          monthsToGenerate?: number | null;
        };
      };
      workflow?: {
        enabled?: boolean;
        approvalMode?: string;
        triggerOn?: string;
        workflows?: Array<{
          id?: string;
          name?: string;
          enabled?: boolean;
          type?: 'approval' | 'review' | 'notification' | 'custom';
          triggerOn?: 'submission' | 'submit' | 'update' | 'manual';
          description?: string | null;
          metadata?: Record<string, any>;
          steps?: Array<{
            id?: string;
            name?: string;
            stepOrder?: number;
            actionType?:
              | 'SUBMIT'
              | 'REVIEW'
              | 'APPROVE'
              | 'REJECT'
              | 'ESCALATE'
              | 'NOTIFY';
            assigneeType?: 'role' | 'user' | 'dynamic_field';
            assigneeRole?: string | null;
            assigneeRoles?: string[];
            assigneeUsers?: string[];
            sla?: {
              hours?: number;
              escalateTo?: string | null;
            };
            type?: string;
            description?: string | null;
          }>;
        }>;
      };
    };
    transaction?: {
      payment?: TransactionPayment;
      remittance?: TransactionRemittance;
      invoice?: TransactionInvoice;
    };
    automation?: {
      rules?: AutomationRule[];
      connectedActions?: ConnectedAction[];
      operationalVisibility?: AutomationOperationalVisibility;
    };
  };
  smartMappings?: Record<string, any>;
  analytics?: {
    profile?: Record<string, any>;
  };
  ui?: Record<string, any>;
  metadata?: {
    schemaVersion?: '2.0.0';
    elementsCount?: number;
    hasValidation?: boolean;
    systemTarget?: 'user_profile' | 'node_profile' | null;
    systemVersion?: string;
    enabledCapabilities?: string[];
    moduleStudio?: {
      document?: Record<string, any>;
      savedAt?: string;
    };
    [key: string]: any;
  };
}

export interface ProjectForm {
  _id?: string;
  id?: string;
  formId?: string; // MongoDB ObjectId as string
  projectId: string;
  shareRef?: string;
  shareCode?: string;
  workspaceId?: string;
  publicRef?: string;
  formReference?: string | null;
  tenantId: string;
  createdBy: {
    _id: string;
    firstname: string;
    lastname: string;
    email: string;
  };
  schemaVersion: '2.0.0';
  identity: {
    name: string;
    description?: string;
    category: 'standard' | 'system' | string;
    tags: string[];
    status: 'draft' | 'published' | 'archived';
  };
  elements: FormElement[];
  layout: {
    style: string;
    wizardMode: boolean;
    grid: {
      columns: number;
      columnSpans: Record<string, number>;
    };
    builder?: Record<string, any>;
  };
  capabilities: ProjectFormData['capabilities'];
  smartMappings?: Record<string, any>;
  metadata: {
    schemaVersion: '2.0.0';
    elementsCount: number;
    hasValidation: boolean;
    lastModified: string;
    integrations?: string[];
    systemTarget?: 'user_profile' | 'node_profile' | null;
    systemVersion?: string;
    enabledCapabilities?: string[];
    moduleStudio?: {
      document?: Record<string, any>;
      savedAt?: string;
    };
    [key: string]: any;
  };
  analytics: {
    views: number;
    submissions: number;
    lastAccessed?: string;
    conversionRate: number;
    compliance?: number;
    profile?: Record<string, any>;
  };
  ui?: Record<string, any>;
  status: 'active' | 'inactive' | 'archived';
  publishedAt?: string;
  archivedAt?: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFormFilters {
  workspaceId?: string;
  page?: number;
  limit?: number;
  status?: 'active' | 'inactive' | 'archived';
  'identity.name'?: string;
  'identity.tags'?: string;
  'capabilities.experience.security.mode'?: 'public' | 'private';
  'identity.status'?: 'draft' | 'published' | 'archived';
  'identity.category'?: 'standard' | 'system';
  'metadata.systemTarget'?: 'user_profile' | 'node_profile';
  tenantId?: string;
  q?: string;
  sortBy?: string;
  populate?: string;
}

export type WorkspaceRole = 'owner' | 'editor' | 'viewer';

export interface ProjectWorkspaceSummary {
  workspaceId: string;
  name: string;
  visibility: 'private' | 'public';
  createdBy?: string;
  role: WorkspaceRole;
  memberCount: number;
  formCount: number;
  isDefault: boolean;
}

export interface ProjectWorkspacesResponse {
  tenantId: string;
  defaultWorkspaceId: string;
  workspaces: ProjectWorkspaceSummary[];
}

export interface WorkspaceMemberAssignmentSummary {
  workspaceId: string;
  workspaceName: string;
  visibility: 'private' | 'public';
  role: WorkspaceRole;
  accessProfileId?: 'workspace_owner' | 'data_administrator' | 'editor' | 'viewer';
  isDefault: boolean;
}

export interface WorkspaceMemberSummary {
  userId: string;
  firstname?: string;
  lastname?: string;
  email: string;
  phoneNumber?: string | null;
  assignments: WorkspaceMemberAssignmentSummary[];
}

export interface WorkspaceInvitationSummary {
  id: string;
  workspaceId: string;
  workspaceName?: string | null;
  email: string;
  firstname?: string;
  lastname?: string;
  phoneNumber?: string | null;
  accessProfileId: 'workspace_owner' | 'data_administrator' | 'editor' | 'viewer';
  workspaceRole: WorkspaceRole;
  bundleRoleName?: string | null;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  expiresAt: string;
  acceptedAt?: string | null;
  lastSentAt?: string | null;
  resendCount?: number;
  redirectPath?: string | null;
  inviteUrl?: string;
  existingUser?: boolean;
  isExpired?: boolean;
  canAccept?: boolean;
}

export interface BulkOperation {
  type: 'delete' | 'restore' | 'publish' | 'archive';
  projectFormId: string;
}

export interface PublicAccessMetrics {
  totalRequests: number;
  linkRequests: number;
  linksConsumed: number;
  submitSuccess: number;
  submitFailed: number;
  replayFailures: number;
  statusCounts: {
    issued: number;
    consumed: number;
    submitted: number;
    expired: number;
    revoked: number;
  };
  delivery: {
    emailSent: number;
    smsSent: number;
    emailFailed: number;
    smsFailed: number;
  };
  recent: {
    windowHours: number;
    requests: number;
    submissions: number;
    since: string;
  };
}

export interface BootstrapSystemFormsPayload {
  targets?: Array<'user_profile' | 'node_profile'>;
  force?: boolean;
}

const isRecord = (value: unknown): value is Record<string, any> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const stripNilKeys = <T extends Record<string, any>>(value: T) =>
  Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== null && entry !== '')
  ) as Partial<T>;

const VALID_COMPLIANCE_FREQUENCIES = new Set(['daily', 'weekly', 'monthly']);

const clampComplianceNumber = (
  value: unknown,
  fallback: number,
  { min = 1, max = 31 } = {}
) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(numeric)));
};

const normalizeComplianceNumberList = (
  values: unknown,
  { min = 0, max = 31 } = {}
) =>
  Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((entry) => Number(entry))
        .filter(
          (entry) => Number.isInteger(entry) && entry >= min && entry <= max
        )
    )
  ).sort((left, right) => left - right);

type ExperienceComplianceConfig = NonNullable<
  NonNullable<NonNullable<ProjectFormData['capabilities']>['experience']>['compliance']
>;
type ExperienceComplianceWeeklyDay = NonNullable<
  NonNullable<ExperienceComplianceConfig['weeklyConfig']>['days']
>[number];

const sanitizeComplianceConfig = (
  value: unknown
): ExperienceComplianceConfig | undefined => {
  if (!isRecord(value)) return undefined;

  const availability = isRecord(value.availability) ? value.availability : {};
  const reportingPeriod = isRecord(value.reportingPeriod) ? value.reportingPeriod : {};
  const schedule = isRecord(value.schedule) ? value.schedule : {};
  const daily = isRecord(schedule.daily) ? schedule.daily : {};
  const weekly = isRecord(schedule.weekly) ? schedule.weekly : {};
  const monthly = isRecord(schedule.monthly) ? schedule.monthly : {};
  const submissionLimit = isRecord(value.submissionLimit)
    ? value.submissionLimit
    : {};
  const submissionPolicy = isRecord(value.submissionPolicy)
    ? value.submissionPolicy
    : {};
  const submissionFrequency = isRecord(value.submissionFrequency)
    ? value.submissionFrequency
    : {};
  const enforcement = isRecord(value.enforcement) ? value.enforcement : {};
  const legacyDailyConfig = isRecord(value.dailyConfig) ? value.dailyConfig : {};
  const legacyWeeklyConfig = isRecord(value.weeklyConfig) ? value.weeklyConfig : {};
  const legacyMonthlyConfig = isRecord(value.monthlyConfig)
    ? value.monthlyConfig
    : {};
  const calendarGeneration = isRecord(value.calendarGeneration)
    ? value.calendarGeneration
    : {};

  const reportingScopeCandidate = String(
    reportingPeriod.scope || schedule.frequency || value.trackingMode || ''
  )
    .trim()
    .toLowerCase();
  const normalizedScope =
    reportingScopeCandidate === 'yearly' ||
    reportingScopeCandidate === 'monthly' ||
    reportingScopeCandidate === 'weekly' ||
    reportingScopeCandidate === 'daily' ||
    reportingScopeCandidate === 'custom_range'
      ? reportingScopeCandidate
      : VALID_COMPLIANCE_FREQUENCIES.has(reportingScopeCandidate)
        ? reportingScopeCandidate
        : 'monthly';
  const normalizedFrequency =
    normalizedScope === 'daily' ||
    normalizedScope === 'weekly' ||
    normalizedScope === 'monthly'
      ? normalizedScope
      : 'monthly';
  const normalizedSubmissionFrequencyMode = String(
    submissionFrequency.mode || value.frequency || normalizedScope || ''
  )
    .trim()
    .toLowerCase();
  const submissionFrequencyMode =
    normalizedSubmissionFrequencyMode === 'once' ||
    normalizedSubmissionFrequencyMode === 'multiple' ||
    normalizedSubmissionFrequencyMode === 'daily' ||
    normalizedSubmissionFrequencyMode === 'weekly' ||
    normalizedSubmissionFrequencyMode === 'monthly' ||
    normalizedSubmissionFrequencyMode === 'custom'
      ? normalizedSubmissionFrequencyMode
      : normalizedFrequency;
  const submissionLimitCount = clampComplianceNumber(
    submissionFrequency.count ??
    submissionPolicy.maxSubmissionsPerPeriod ??
      submissionLimit.count ??
      legacyMonthlyConfig.submissionLimitPerDate ??
      legacyDailyConfig.frequencyPerDay ??
      1,
    1,
    { min: 1, max: 20 }
  );
  const dailyWeekdays = normalizeComplianceNumberList(
    submissionFrequency.weekdays ?? daily.weekdays ?? legacyDailyConfig.activeDays,
    { min: 0, max: 6 }
  );
  const weeklyWeekdays = normalizeComplianceNumberList(
    submissionFrequency.weekdays ??
      weekly.weekdays ??
      (Array.isArray(legacyWeeklyConfig.days)
        ? legacyWeeklyConfig.days.map((entry) => (entry as any)?.day)
        : []),
    { min: 0, max: 6 }
  );
  const monthlyDates = normalizeComplianceNumberList(
    submissionFrequency.monthDates ?? monthly.dates ?? legacyMonthlyConfig.dates,
    { min: 1, max: 31 }
  );
  const intervalWeeks = clampComplianceNumber(
    submissionFrequency.intervalWeeks ??
      weekly.intervalWeeks ??
      (Array.isArray(legacyWeeklyConfig.days) &&
      legacyWeeklyConfig.days.some((entry) => (entry as any)?.frequency === 'biweekly')
        ? 2
        : 1),
    1,
    { min: 1, max: 4 }
  );
  const startDate =
    typeof availability.startDate === 'string' && availability.startDate.trim()
      ? availability.startDate
      : typeof schedule.startDate === 'string' && schedule.startDate.trim()
        ? schedule.startDate
        : typeof calendarGeneration.startDate === 'string' &&
            calendarGeneration.startDate.trim()
          ? calendarGeneration.startDate
          : null;
  const endDate =
    typeof availability.endDate === 'string' && availability.endDate.trim()
      ? availability.endDate
      : typeof schedule.endDate === 'string' && schedule.endDate.trim()
        ? schedule.endDate
        : typeof calendarGeneration.endDate === 'string' &&
            calendarGeneration.endDate.trim()
          ? calendarGeneration.endDate
          : null;
  const allowBackdating =
    typeof submissionPolicy.allowBackdating === 'boolean'
      ? submissionPolicy.allowBackdating
      : typeof enforcement.allowBackdating === 'boolean'
        ? enforcement.allowBackdating
        : calendarGeneration.allowBackdating === true;
  const closeWindowAtPeriodEnd =
    typeof submissionPolicy.closeWindowAtPeriodEnd === 'boolean'
      ? submissionPolicy.closeWindowAtPeriodEnd
      : typeof enforcement.closeWindowAtPeriodEnd === 'boolean'
        ? enforcement.closeWindowAtPeriodEnd
        : value.autoLockMonthEnd === true;
  const weekStartsOn =
    Number(reportingPeriod.weekStartsOn) === 0 ? 0 : 1;
  const timezone =
    typeof reportingPeriod.timezone === 'string' && reportingPeriod.timezone.trim()
      ? reportingPeriod.timezone.trim()
      : null;
  const defaultYearRaw = Number(reportingPeriod.defaultYear);
  const defaultYear =
    Number.isInteger(defaultYearRaw) && defaultYearRaw >= 2000 && defaultYearRaw <= 2100
      ? defaultYearRaw
      : null;
  const defaultMonth =
    typeof reportingPeriod.defaultMonth === 'string' &&
    /^\d{4}-\d{2}$/.test(reportingPeriod.defaultMonth)
      ? reportingPeriod.defaultMonth
      : null;
  const customRange = isRecord(reportingPeriod.customRange)
    ? (reportingPeriod.customRange as Record<string, any>)
    : {};
  const customRangeMaxDays =
    customRange.maxDays == null || customRange.maxDays === ''
      ? null
      : Math.min(366, Math.max(1, Number(customRange.maxDays) || 1));
  const customFrequency = isRecord(submissionFrequency.custom)
    ? (submissionFrequency.custom as Record<string, any>)
    : {};
  const customFrequencyInterval =
    customFrequency.interval == null || customFrequency.interval === ''
      ? null
      : Math.min(365, Math.max(1, Number(customFrequency.interval) || 1));
  const customFrequencyUnit =
    customFrequency.unit === 'day' ||
    customFrequency.unit === 'week' ||
    customFrequency.unit === 'month'
      ? customFrequency.unit
      : null;
  const trackingModeValue = (
    Boolean(value.enabled)
      ? submissionFrequencyMode === 'daily' ||
        submissionFrequencyMode === 'weekly' ||
        submissionFrequencyMode === 'monthly'
        ? submissionFrequencyMode
        : normalizedScope === 'custom_range'
          ? 'none'
          : normalizedScope === 'yearly'
            ? 'monthly'
            : normalizedFrequency === 'monthly' &&
                monthlyDates.length === 0 &&
                normalizedScope !== 'monthly'
              ? 'none'
              : normalizedFrequency
      : 'none'
  ) as NonNullable<ExperienceComplianceConfig['trackingMode']>;

  const nextValue: ExperienceComplianceConfig & Record<string, any> = {
    enabled: Boolean(value.enabled),
    availability: {
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    },
    reportingPeriod: {
      scope: normalizedScope as NonNullable<
        NonNullable<ExperienceComplianceConfig['reportingPeriod']>
      >['scope'],
      weekStartsOn,
      ...(timezone ? { timezone } : {}),
      ...(defaultYear !== null ? { defaultYear } : {}),
      ...(defaultMonth ? { defaultMonth } : {}),
      customRange: {
        ...(customRangeMaxDays !== null ? { maxDays: customRangeMaxDays } : {}),
      },
    },
    submissionPolicy: {
      maxSubmissionsPerPeriod: submissionLimitCount,
      allowBackdating,
      closeWindowAtPeriodEnd,
    },
    submissionFrequency: {
      mode: submissionFrequencyMode as NonNullable<
        NonNullable<ExperienceComplianceConfig['submissionFrequency']>
      >['mode'],
      count: submissionLimitCount,
      weekdays:
        submissionFrequencyMode === 'daily' ? dailyWeekdays : weeklyWeekdays,
      monthDates: monthlyDates,
      intervalWeeks,
      custom: {
        ...(customFrequencyInterval !== null ? { interval: customFrequencyInterval } : {}),
        ...(customFrequencyUnit ? { unit: customFrequencyUnit } : {}),
      },
    },
    trackingMode: trackingModeValue,
    frequency: normalizedFrequency as NonNullable<
      ExperienceComplianceConfig['schedule']
    >['frequency'],
    dailyConfig: {
      ...legacyDailyConfig,
      activeDays: dailyWeekdays,
      frequencyPerDay: submissionLimitCount,
      skipWeekends: false,
    },
    weeklyConfig: {
      ...legacyWeeklyConfig,
      days: weeklyWeekdays.map((day) => ({
        day,
        name: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
          day
        ],
        frequency: intervalWeeks === 2 ? 'biweekly' : 'weekly',
        occurrences: null,
        enabled: true,
      })),
    },
    monthlyConfig: {
      dates: monthlyDates,
      submissionLimitPerDate: submissionLimitCount,
    },
    schedule: {
      frequency: normalizedFrequency as NonNullable<
        ExperienceComplianceConfig['schedule']
      >['frequency'],
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
      daily: {
        weekdays: dailyWeekdays,
      },
      weekly: {
        intervalWeeks,
        weekdays: weeklyWeekdays,
        ...(typeof weekly.anchorDate === 'string' && weekly.anchorDate.trim()
          ? { anchorDate: weekly.anchorDate }
          : startDate
            ? { anchorDate: startDate }
            : {}),
      },
      monthly: {
        dates: monthlyDates,
      },
    },
    submissionLimit: {
      count: submissionLimitCount,
      scope: 'occurrence',
    },
    enforcement: {
      allowBackdating,
      closeWindowAtPeriodEnd,
    },
    requireNodeId:
      typeof value.requireNodeId === 'boolean' ? value.requireNodeId : true,
    requireMonth:
      typeof value.requireMonth === 'boolean' ? value.requireMonth : true,
    trackCompliance:
      typeof value.trackCompliance === 'boolean' ? value.trackCompliance : true,
    autoGenerateCalendar:
      typeof value.autoGenerateCalendar === 'boolean'
        ? value.autoGenerateCalendar
        : true,
    autoLockMonthEnd: closeWindowAtPeriodEnd,
    calendarRequired:
      typeof value.calendarRequired === 'boolean'
        ? value.calendarRequired
        : false,
    eventTypes: Array.isArray(value.eventTypes)
      ? value.eventTypes.map((entry) => String(entry).trim()).filter(Boolean)
      : [],
  };

  if (isRecord(value.calendarGeneration)) {
    nextValue.calendarGeneration = {
      ...value.calendarGeneration,
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
      allowBackdating,
    };
  }

  if (isRecord(nextValue.calendarGeneration)) {
    const sanitizedCalendar = stripNilKeys(nextValue.calendarGeneration);
    if (Object.keys(sanitizedCalendar).length > 0) {
      nextValue.calendarGeneration = sanitizedCalendar;
    } else {
      delete nextValue.calendarGeneration;
    }
  }

  if (
    isRecord(nextValue.weeklyConfig) &&
    Array.isArray(nextValue.weeklyConfig.days)
  ) {
    nextValue.weeklyConfig = {
      ...nextValue.weeklyConfig,
      days: nextValue.weeklyConfig.days.map(
        (day: unknown) =>
          (isRecord(day)
            ? stripNilKeys(day as Record<string, any>)
            : day) as ExperienceComplianceWeeklyDay
      ),
    };
  }

  return nextValue;
};

const sanitizeSecurityConfig = (value: unknown) => {
  const nextValue = isRecord(value) ? value : {};
  const access = isRecord(nextValue.access) ? nextValue.access : {};
  const authentication = isRecord(nextValue.authentication)
    ? nextValue.authentication
    : {};
  const accessCode = isRecord(nextValue.accessCode) ? nextValue.accessCode : {};
  const submissionProtection = isRecord(nextValue.submissionProtection)
    ? nextValue.submissionProtection
    : {};
  const normalizeLegacyAudience = (
    audience: unknown
  ): 'anyone' | 'authenticated_users' | 'selected_roles' | 'selected_users' => {
    const normalized = String(audience || '').trim().toLowerCase();
    if (
      normalized === 'anyone' ||
      normalized === 'authenticated_users' ||
      normalized === 'selected_roles' ||
      normalized === 'selected_users'
    ) {
      return normalized;
    }
    return 'anyone';
  };
  const normalizeAudience = (
    audience: unknown
  ): 'public' | 'authenticated' | 'selected_roles' | 'selected_users' => {
    const normalized = String(audience || '').trim().toLowerCase();
    if (
      normalized === 'public' ||
      normalized === 'authenticated' ||
      normalized === 'selected_roles' ||
      normalized === 'selected_users'
    ) {
      return normalized;
    }
    if (normalized === 'anyone') return 'public';
    if (normalized === 'authenticated_users') return 'authenticated';
    return 'public';
  };
  const normalizeAuthMethod = (
    method: unknown
  ): 'none' | 'otp' | 'access_code' => {
    const normalized = String(method || '').trim().toLowerCase();
    if (
      normalized === 'none' ||
      normalized === 'otp' ||
      normalized === 'access_code'
    ) {
      return normalized;
    }
    if (normalized === 'off') return 'none';
    if (normalized === 'link_only') return 'otp';
    return 'none';
  };
  const mapLegacyModeToMethod = (
    mode: unknown
  ): 'none' | 'otp' | 'access_code' => {
    const normalized = String(mode || '').trim().toLowerCase();
    if (normalized === 'otp' || normalized === 'link_only') return 'otp';
    if (normalized === 'access_code') return 'access_code';
    return 'none';
  };
  const mapAudienceToLegacy = (
    audience: 'public' | 'authenticated' | 'selected_roles' | 'selected_users'
  ): 'anyone' | 'authenticated_users' | 'selected_roles' | 'selected_users' => {
    if (audience === 'public') return 'anyone';
    if (audience === 'selected_roles') return 'selected_roles';
    if (audience === 'selected_users') return 'selected_users';
    return 'authenticated_users';
  };
  const mapMethodToPublicMode = (
    method: 'none' | 'otp' | 'access_code'
  ): 'off' | 'otp' | 'access_code' => {
    if (method === 'otp') return 'otp';
    if (method === 'access_code') return 'access_code';
    return 'off';
  };

  const legacyAudience = normalizeLegacyAudience(access.whoCanAccess);
  const initialAudience = normalizeAudience(nextValue.audience || legacyAudience);
  const initialMethod = normalizeAuthMethod(
    authentication.method || mapLegacyModeToMethod(nextValue.publicSecureMode)
  );
  const enabled =
    typeof nextValue.enabled === 'boolean'
      ? nextValue.enabled
      : !(initialAudience === 'public' && initialMethod === 'none');
  const channels = Array.isArray(nextValue.channels)
    ? Array.from(
        new Set(
          nextValue.channels
            .map((entry: unknown) => String(entry).trim())
            .filter((entry: string) =>
              ['web', 'api', 'whatsapp'].includes(entry)
            )
        )
      )
    : [];

  let audience = initialAudience;
  let method = initialMethod;

  if (!enabled) {
    audience = 'public';
    method = 'none';
  } else if (method === 'access_code') {
    audience = 'public';
  } else {
    if (audience === 'public') {
      audience = 'authenticated';
    }
    method = 'otp';
  }

  const whoCanAccess = mapAudienceToLegacy(audience);
  const publicSecureMode = mapMethodToPublicMode(method);
  const isOpenPublic = !enabled || method === 'access_code';
  const derivedProfile =
    typeof access.restrictByLocation === 'boolean' && access.restrictByLocation
      ? 'high_security'
      : audience === 'public'
        ? 'open_public'
        : audience === 'selected_roles'
          ? 'restricted_team'
          : audience === 'selected_users'
            ? 'internal_staff'
            : 'private_safe';
  const derivedMode =
    derivedProfile === 'open_public'
      ? 'public'
      : derivedProfile === 'internal_staff'
        ? 'internal'
        : derivedProfile === 'private_safe'
          ? 'private'
          : 'restricted';

  return {
    ...nextValue,
    enabled,
    audience,
    profile: derivedProfile,
    mode: derivedMode,
    access: {
      ...access,
      whoCanAccess,
      allowedRoles: Array.isArray(access.allowedRoles)
        ? (audience === 'selected_roles' ? access.allowedRoles : [])
            .map((entry: unknown) => String(entry).trim())
            .filter(Boolean)
        : [],
      allowedUsers: Array.isArray(access.allowedUsers)
        ? (audience === 'selected_users' ? access.allowedUsers : [])
            .map((entry: unknown) => String(entry).trim())
            .filter(Boolean)
        : [],
      allowedCountries: Array.isArray(access.allowedCountries)
        ? access.allowedCountries
            .map((entry: unknown) => String(entry).trim())
            .filter(Boolean)
        : [],
      restrictByLocation:
        typeof access.restrictByLocation === 'boolean'
          ? access.restrictByLocation
          : false,
    },
    authentication: {
      ...authentication,
      method,
      requireLogin: enabled && method === 'otp',
      allowAnonymous: isOpenPublic,
      requireOtp: enabled && method === 'otp',
    },
    accessCode: {
      code:
        typeof accessCode.code === 'string' && accessCode.code.trim()
          ? accessCode.code.trim().replace(/\s+/g, '-').toUpperCase()
          : null,
      hint:
        typeof accessCode.hint === 'string' && accessCode.hint.trim()
          ? accessCode.hint.trim()
          : null,
      maxAttempts:
        typeof accessCode.maxAttempts === 'number' && accessCode.maxAttempts > 0
          ? Math.min(20, Math.max(1, accessCode.maxAttempts))
          : 5,
      lockoutMinutes:
        typeof accessCode.lockoutMinutes === 'number' &&
        accessCode.lockoutMinutes > 0
          ? Math.min(1440, Math.max(1, accessCode.lockoutMinutes))
          : 15,
    },
    submissionProtection: {
      ...submissionProtection,
      preventDuplicateSubmission:
        typeof submissionProtection.preventDuplicateSubmission === 'boolean'
          ? submissionProtection.preventDuplicateSubmission
          : false,
      duplicateCheckField:
        typeof submissionProtection.duplicateCheckField === 'string' &&
        submissionProtection.duplicateCheckField.trim()
          ? submissionProtection.duplicateCheckField
          : null,
      rateLimitEnabled:
        typeof submissionProtection.rateLimitEnabled === 'boolean'
          ? submissionProtection.rateLimitEnabled
          : false,
      maxSubmissionsPerUser:
        typeof submissionProtection.maxSubmissionsPerUser === 'number'
          ? submissionProtection.maxSubmissionsPerUser
          : null,
    },
    channels: channels.length ? channels : ['web'],
    publicSecureMode,
  };
};

const sanitizeMetadataConfig = (value: unknown) => {
  if (!isRecord(value)) return undefined;

  const nextValue: Record<string, any> = { ...value };

  if (Array.isArray(nextValue.integrations)) {
    nextValue.integrations = nextValue.integrations
      .map((entry: unknown) => String(entry).trim())
      .filter((entry: string) =>
        ['web', 'whatsapp', 'telegram', 'mobile', 'email', 'api'].includes(
          entry
        )
      );
  }

  return nextValue;
};

const sanitizeInvoiceConditionValue = (value: unknown) => {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (Array.isArray(value) || isRecord(value)) {
    try {
      return JSON.stringify(value);
    } catch {
      return '';
    }
  }

  return '';
};

const sanitizeInvoiceConditions = (value: unknown) =>
  Array.isArray(value)
    ? value.map((entry: unknown) => {
        const nextEntry = isRecord(entry) ? { ...entry } : {};
        return {
          ...nextEntry,
          value: sanitizeInvoiceConditionValue(nextEntry.value),
        };
      })
    : [];

const VALID_TRANSACTION_PAYMENT_CHANNELS = new Set([
  'paystack',
  'flutterwave',
  'sabypay',
  '9psb',
  'premium',
]);

const normalizeTransactionPaymentChannel = (value: unknown) => {
  const candidate = String(value || '')
    .trim()
    .toLowerCase();
  if (!candidate) return null;
  if (candidate === 'sabypipe') return 'sabypay';
  return VALID_TRANSACTION_PAYMENT_CHANNELS.has(candidate) ? candidate : null;
};

const normalizeTransactionCollectionStage = (value: unknown) => {
  const candidate = String(value || '')
    .trim()
    .toLowerCase();
  if (candidate === 'before_submit' || candidate === 'submission') {
    return 'submission';
  }
  if (candidate === 'before_approval' || candidate === 'pre_approval') {
    return 'pre_approval';
  }
  if (candidate === 'after_approval' || candidate === 'post_approval') {
    return 'post_approval';
  }
  return 'submission';
};

const sanitizeTransactionPaymentConfig = (value: unknown) => {
  if (!isRecord(value)) return value;

  const nextValue: Record<string, any> = { ...value };
  const enabledChannels = Array.isArray(nextValue.enabledChannels)
    ? nextValue.enabledChannels
        .map((entry: unknown) => normalizeTransactionPaymentChannel(entry))
        .filter(Boolean)
    : [];
  const defaultChannel = normalizeTransactionPaymentChannel(
    nextValue.defaultChannel
  );

  nextValue.enabledChannels = Array.from(new Set(enabledChannels));
  nextValue.defaultChannel =
    defaultChannel && nextValue.enabledChannels.includes(defaultChannel)
      ? defaultChannel
      : nextValue.enabledChannels[0] || null;
  nextValue.enabled = nextValue.enabled === true;
  nextValue.mode = nextValue.enabled ? 'invoice' : 'none';
  nextValue.collectionStage = normalizeTransactionCollectionStage(
    nextValue.collectionStage
  );
  nextValue.channelConfigs =
    isRecord(nextValue.channelConfigs) ? nextValue.channelConfigs : {};
  nextValue.policies = isRecord(nextValue.policies) ? nextValue.policies : {};

  return nextValue;
};

const sanitizeTransactionRemittanceConfig = (value: unknown) => {
  if (!isRecord(value)) return value;

  const nextValue: Record<string, any> = { ...value };
  nextValue.settlementRule = isRecord(nextValue.settlementRule)
    ? {
        ...nextValue.settlementRule,
        targets: Array.isArray(nextValue.settlementRule.targets)
          ? nextValue.settlementRule.targets
              .map((target: unknown) => (isRecord(target) ? target : null))
              .filter(Boolean)
          : [],
      }
    : { targets: [] };
  nextValue.routing = isRecord(nextValue.routing) ? nextValue.routing : {};
  return nextValue;
};

const sanitizeInvoiceConfig = (value: unknown) => {
  if (!isRecord(value)) return value;

  const nextValue: Record<string, any> = { ...value };

  if (Array.isArray(nextValue.lineItems)) {
    nextValue.lineItems = nextValue.lineItems.map((item: unknown) => {
      const nextItem = isRecord(item) ? { ...item } : {};
      return {
        ...nextItem,
        conditions: sanitizeInvoiceConditions(nextItem.conditions),
      };
    });
  }

  if (isRecord(nextValue.discounts)) {
    nextValue.discounts = {
      ...nextValue.discounts,
      conditions: sanitizeInvoiceConditions(nextValue.discounts.conditions),
    };
  }

  if (isRecord(nextValue.tax)) {
    nextValue.tax = {
      ...nextValue.tax,
      conditions: sanitizeInvoiceConditions(nextValue.tax.conditions),
    };
  }

  const calculationMode = String(nextValue.calculationMode || 'none')
    .trim()
    .toLowerCase();
  const lineItems = Array.isArray(nextValue.lineItems) ? nextValue.lineItems : [];
  const discounts = isRecord(nextValue.discounts) ? nextValue.discounts : {};
  const tax = isRecord(nextValue.tax) ? nextValue.tax : {};

  nextValue.calculationMode = [
    'none',
    'fixed',
    'line_items',
    'rule_based',
  ].includes(calculationMode)
    ? calculationMode
    : 'none';
  nextValue.lineItems = lineItems;
  nextValue.lineItemsEnabled =
    nextValue.calculationMode === 'line_items' ||
    nextValue.calculationMode === 'rule_based';
  nextValue.discountsEnabled =
    discounts.enabled === true || String(discounts.mode || 'none') !== 'none';
  nextValue.taxEnabled =
    tax.enabled === true || String(tax.mode || 'none') !== 'none';

  return nextValue;
};

export const normalizeProjectFormForUpdate = (
  form: Partial<ProjectForm>
): ProjectFormData => {
  const capabilities = isRecord(form.capabilities) ? form.capabilities : {};
  const experience = isRecord(capabilities.experience)
    ? capabilities.experience
    : {};
  const transaction = isRecord(capabilities.transaction)
    ? capabilities.transaction
    : {};
  const automation = isRecord(capabilities.automation)
    ? capabilities.automation
    : {};
  const security = isRecord(experience.security) ? experience.security : {};
  const analytics = isRecord(form.analytics) ? form.analytics : {};
  const layout = isRecord(form.layout) ? form.layout : {};
  const identity = isRecord(form.identity) ? form.identity : {};

  return {
    schemaVersion: '2.0.0',
    workspaceId:
      typeof form.workspaceId === 'string' && form.workspaceId.trim()
        ? form.workspaceId.trim()
        : undefined,
    identity: {
      name:
        (typeof identity.name === 'string' && identity.name.trim()) ||
        'Untitled form',
      description:
        typeof identity.description === 'string' ? identity.description : '',
      category: identity.category === 'system' ? 'system' : 'standard',
      tags: Array.isArray(identity.tags)
        ? identity.tags.map((tag: unknown) => String(tag).trim()).filter(Boolean)
        : [],
      status:
        identity.status === 'published' || identity.status === 'archived'
          ? identity.status
          : 'draft',
    },
    elements: Array.isArray(form.elements) ? form.elements : [],
    layout: {
      style:
        typeof layout.style === 'string' && layout.style.trim()
          ? layout.style
          : 'default',
      wizardMode: Boolean(layout.wizardMode),
      grid: {
        columns:
          typeof layout?.grid?.columns === 'number' ? layout.grid.columns : 12,
        columnSpans:
          isRecord(layout?.grid?.columnSpans) ? layout.grid.columnSpans : {},
      },
      builder: isRecord(layout.builder) ? layout.builder : {},
    },
    capabilities: {
      experience: {
        ...experience,
        security: sanitizeSecurityConfig(security),
        compliance: sanitizeComplianceConfig(experience.compliance),
      },
      transaction: {
        ...transaction,
        payment: sanitizeTransactionPaymentConfig(
          transaction.payment
        ) as TransactionPayment | undefined,
        remittance: sanitizeTransactionRemittanceConfig(
          transaction.remittance
        ) as TransactionRemittance | undefined,
        invoice: sanitizeInvoiceConfig(
          transaction.invoice
        ) as TransactionInvoice | undefined,
      },
      automation: automation,
    },
    smartMappings: isRecord(form.smartMappings) ? form.smartMappings : undefined,
    analytics: {
      profile: isRecord(analytics.profile) ? analytics.profile : {},
    },
    ui: isRecord(form.ui) ? form.ui : undefined,
    metadata: sanitizeMetadataConfig(form.metadata),
  };
};

// API Functions
export const createProjectForm = async (
  payload: ProjectFormData,
  token?: string
) => {
  console.log('🌐 [API] ========== AXIOS API LAYER ==========');
  console.log('🌐 [API] Endpoint: /project-forms');
  console.log('🌐 [API] Method: POST');
  console.log('🌐 [API] Token available:', !!token);
  console.log(
    '🌐 [API] Payload being sent to backend:',
    JSON.stringify(payload, null, 2)
  );
  console.log('🌐 [API] =====================================');

  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    sabyHandleForbiddenLocally: true,
  };

  try {
    const response = await api.post('/project-forms', payload, options);
    console.log(
      '🌐 [API] Backend response received:',
      JSON.stringify(response.data, null, 2)
    );
    return response.data;
  } catch (error: any) {
    console.error(
      '🌐 [API] Backend error:',
      error?.response?.data || error.message
    );
    throw error;
  }
};

export const getProjectForms = async (
  filters?: ProjectFormFilters & { limit?: number; page?: number },
  token?: string
) => {
  const options = {
    params: filters,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.get('/project-forms', options);
  return data;
};

export const getProjectForm = async (projectFormId: string, token?: string) => {
  const options = {
    params: { populate: 'createdBy' },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.get(`/project-forms/${projectFormId}`, options);
  return data;
};

export const getProjectFormByProjectId = async (
  projectId: string,
  token?: string
) => {
  const { data } = await api.get(`/project-forms/project/${projectId}`, {
    params: { populate: 'createdBy' },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return data;
};

export const getProjectFormByPublicRef = async (
  publicRef: string,
  token?: string
) => {
  const options = {
    params: { populate: 'createdBy' },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.get(`/project-forms/ref/${publicRef}`, options);
  return data;
};

export const getPublicProjectFormByReference = async (
  reference: string,
  accessToken?: string
) => {
  const { data } = await api.get(`/project-forms/public/ref/${reference}`, {
    params: accessToken ? { accessToken } : undefined,
    headers: accessToken ? { 'x-form-access-token': accessToken } : undefined,
  });
  return data;
};

export const getProjectFormsByTenant = async (
  tenantId: string,
  filters?: Omit<ProjectFormFilters, 'tenantId'>,
  token?: string
) => {
  const options = {
    params: {
      workspaceId: filters?.workspaceId,
      page: filters?.page,
      limit: filters?.limit,
      status: filters?.status,
      'identity.name': filters?.['identity.name'],
      'identity.tags': filters?.['identity.tags'],
      'identity.status': filters?.['identity.status'],
      'identity.category': filters?.['identity.category'],
      'capabilities.experience.security.mode':
        filters?.['capabilities.experience.security.mode'],
      'metadata.systemTarget': filters?.['metadata.systemTarget'],
      sortBy: filters?.sortBy,
      populate: filters?.populate,
    },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.get(`/project-forms/tenant/${tenantId}`, options);
  return data;
};

export const bootstrapSystemForms = async (
  payload: BootstrapSystemFormsPayload = {},
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.post('/project-forms/system/bootstrap', payload, options);
  return data;
};

export const getSystemProjectForm = async (
  target: 'user_profile' | 'node_profile',
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.get(`/project-forms/system/${target}`, options);
  return data as ProjectForm;
};

export const getProjectFormsByUser = async (
  userId: string,
  filters?: Omit<ProjectFormFilters, 'tenantId'>,
  token?: string
) => {
  const options = {
    params: {
      workspaceId: filters?.workspaceId,
      page: filters?.page,
      limit: filters?.limit,
      status: filters?.status,
      'identity.name': filters?.['identity.name'],
      'identity.tags': filters?.['identity.tags'],
      'identity.status': filters?.['identity.status'],
      'identity.category': filters?.['identity.category'],
      'capabilities.experience.security.mode':
        filters?.['capabilities.experience.security.mode'],
      'metadata.systemTarget': filters?.['metadata.systemTarget'],
      sortBy: filters?.sortBy,
      populate: filters?.populate,
    },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.get(`/project-forms/user/${userId}`, options);
  return data;
};

export const updateProjectForm = async (
  projectFormId: string,
  payload: Partial<ProjectFormData>,
  token?: string
) => {
  const options = {
    params: { populate: 'createdBy' },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.patch(
    `/project-forms/${projectFormId}`,
    payload,
    options
  );
  return data;
};

export const generateProjectFormTranslation = async (
  projectFormId: string,
  targetLanguage: string
) => {
  const { data } = await api.post(
    `/project-forms/${encodeURIComponent(projectFormId)}/translations/generate`,
    { targetLanguage }
  );
  return data;
};

export const updateProjectFormByProjectId = async (
  projectId: string,
  payload: Partial<ProjectFormData>,
  token?: string
) => {
  const options = {
    params: {
      populate: 'createdBy',
    },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.patch(
    `/project-forms/project/${projectId}`,
    payload,
    options
  );
  return data;
};

export const deleteProjectForm = async (
  projectFormId: string,
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.delete(`/project-forms/${projectFormId}`, options);
  return data;
};

export const deleteProjectFormByProjectId = async (
  projectId: string,
  permanent = false,
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    data: { permanent },
  };
  const { data } = await api.delete(`/project-forms/project/${projectId}`, options);
  return data;
};

export const softDeleteProjectForm = async (
  projectFormId: string,
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.patch(
    `/project-forms/${projectFormId}/delete`,
    {},
    options
  );
  return data;
};

export const restoreProjectForm = async (
  projectFormId: string,
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.patch(
    `/project-forms/${projectFormId}/restore`,
    {},
    options
  );
  return data;
};

export const getDeletedProjectForms = async (token?: string) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.get('/project-forms/deleted', options);
  return data;
};

export const publishProjectForm = async (
  projectFormId: string,
  token?: string
) => {
  try {
    const options = {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
    
    // First, fetch the form to get its V2 compliance config
    const formResponse = await api.get(
      `/project-forms/${projectFormId}`,
      options
    );
    const form = formResponse.data;
    
    // Extract calendar generation options from capabilities.experience.compliance
    const requestBody: any = {};
    const compliance = form?.capabilities?.experience?.compliance;
    if (
      compliance?.enabled &&
      compliance?.autoGenerateCalendar &&
      isRecord(compliance?.calendarGeneration)
    ) {
      const sanitizedCalendarGeneration = stripNilKeys(
        compliance.calendarGeneration
      );
      if (Object.keys(sanitizedCalendarGeneration).length > 0) {
        requestBody.calendarGeneration = sanitizedCalendarGeneration;
      }
      console.log('📅 [publishProjectForm] Sending calendar generation options:', requestBody.calendarGeneration);
    }
    
    const { data } = await api.patch(
      `/project-forms/${projectFormId}/publish`,
      requestBody,
      options
    );
    return { success: true, data };
  } catch (error: any) {
    console.error('[publishProjectForm] Error:', error);
    return { 
      success: false, 
      error: error?.response?.data?.message || 'Failed to publish form' 
    };
  }
};

export const unpublishProjectForm = async (
  projectFormId: string,
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.patch(
    `/project-forms/${projectFormId}/unpublish`,
    {},
    options
  );
  return data;
};

export const archiveProjectForm = async (
  projectFormId: string,
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.patch(
    `/project-forms/${projectFormId}/archive`,
    {},
    options
  );
  return data;
};

export const getProjectAnalytics = async (
  projectId: string,
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.get(
    `/project-forms/project/${projectId}/analytics`,
    options
  );
  return data;
};

export const getProjectPublicAccessMetrics = async (
  projectId: string,
  windowHours = 24,
  token?: string
) => {
  const options = {
    params: { windowHours },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.get(
    `/project-forms/project/${projectId}/public-access-metrics`,
    options
  );
  return data as PublicAccessMetrics;
};

export const incrementProjectSubmissions = async (
  projectId: string,
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.post(
    `/project-forms/project/${projectId}/submit`,
    {},
    options
  );
  return data;
};

export const bulkOperations = async (
  operations: BulkOperation[],
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.post(
    '/project-forms/bulk',
    { operations },
    options
  );
  return data;
};

export const searchProjectForms = async (
  query: string,
  filters?: Omit<ProjectFormFilters, 'q'>,
  token?: string
) => {
  const options = {
    params: { q: query, ...filters },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.get('/project-forms/search', options);
  return data;
};

export const getProjectFormStats = async (token?: string) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.get('/project-forms/stats', options);
  return data;
};

export const listProjectWorkspaces = async (
  token?: string,
  params?: { includeAll?: boolean }
) => {
  const requestOptions = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    params: params?.includeAll ? { includeAll: true } : undefined,
  };
  const { data } = await api.get('/project-forms/workspaces', requestOptions);
  return data as ProjectWorkspacesResponse;
};

export const createProjectWorkspace = async (
  payload: { name: string; visibility?: 'private' | 'public' },
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.post('/project-forms/workspaces', payload, options);
  return data;
};

export const renameProjectWorkspace = async (
  workspaceId: string,
  payload: { name: string; visibility?: 'private' | 'public' },
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.patch(
    `/project-forms/workspaces/${workspaceId}`,
    payload,
    options
  );
  return data;
};

export const addProjectWorkspaceMember = async (
  workspaceId: string,
  payload: {
    userId?: string;
    email?: string;
    role: WorkspaceRole;
    accessProfileId?: 'workspace_owner' | 'data_administrator' | 'editor' | 'viewer';
  },
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.post(
    `/project-forms/workspaces/${workspaceId}/members`,
    payload,
    options
  );
  return data;
};

export const listProjectWorkspaceMembers = async (
  token?: string,
  params?: { includeAll?: boolean }
) => {
  const requestOptions = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    params: params?.includeAll ? { includeAll: true } : undefined,
  };
  const { data } = await api.get('/project-forms/workspace-members', requestOptions);
  return data as { members: WorkspaceMemberSummary[] };
};

export const listProjectWorkspaceInvitations = async (
  workspaceId: string,
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.get(
    `/project-forms/workspaces/${workspaceId}/invitations`,
    options
  );
  return data as { invitations: WorkspaceInvitationSummary[] };
};

export const createProjectWorkspaceInvitation = async (
  workspaceId: string,
  payload: {
    email: string;
    firstname?: string;
    lastname?: string;
    phoneNumber?: string | null;
    accessProfileId?: 'workspace_owner' | 'data_administrator' | 'editor' | 'viewer';
    redirectPath?: string | null;
  },
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.post(
    `/project-forms/workspaces/${workspaceId}/invitations`,
    payload,
    options
  );
  return data as { message: string; invitation: WorkspaceInvitationSummary };
};

export const resendProjectWorkspaceInvitation = async (
  workspaceId: string,
  invitationId: string,
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.post(
    `/project-forms/workspaces/${workspaceId}/invitations/${invitationId}/resend`,
    {},
    options
  );
  return data as { message: string; invitation: WorkspaceInvitationSummary };
};

export const revokeProjectWorkspaceInvitation = async (
  workspaceId: string,
  invitationId: string,
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.post(
    `/project-forms/workspaces/${workspaceId}/invitations/${invitationId}/revoke`,
    {},
    options
  );
  return data as { message: string; invitation: WorkspaceInvitationSummary };
};

export const getWorkspaceInvitationByToken = async (token: string) => {
  const { data } = await api.get(`/project-forms/workspace-invitations/${token}`);
  return data as { invitation: WorkspaceInvitationSummary };
};

export const acceptWorkspaceInvitationByToken = async (
  token: string,
  payload: {
    firstname?: string;
    lastname?: string;
    password?: string;
    phoneNumber?: string | null;
  } = {}
) => {
  const { data } = await api.post(
    `/project-forms/workspace-invitations/${token}/accept`,
    payload
  );
  return data as {
    message: string;
    invitation: WorkspaceInvitationSummary;
    user: {
      id: string;
      email: string;
      firstname: string;
      lastname: string;
    };
  };
};

export const removeProjectWorkspaceMember = async (
  workspaceId: string,
  userId: string,
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.delete(
    `/project-forms/workspaces/${workspaceId}/members/${userId}`,
    options
  );
  return data;
};

export const leaveProjectWorkspace = async (workspaceId: string, token?: string) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.post(
    `/project-forms/workspaces/${workspaceId}/leave`,
    {},
    options
  );
  return data;
};

export const deleteProjectWorkspace = async (workspaceId: string, token?: string) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.delete(`/project-forms/workspaces/${workspaceId}`, options);
  return data;
};

export const duplicateProjectForm = async (
  projectId: string,
  payload: { name?: string; workspaceId?: string } = {},
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.post(
    `/project-forms/project/${projectId}/duplicate`,
    payload,
    options
  );
  return data;
};
