import type { ModuleDraftV2 } from './contracts';

export type SubmissionLint = {
  blockers: string[];
  warnings: string[];
};

type TransactionPaymentPayload = {
  enabled: boolean;
  mode: string;
  currency: string | null;
  enabledChannels: string[];
  defaultChannel: string | null;
  collectionStage: string;
  settlementType: string;
  receivingAccount: Record<string, unknown> | null;
  channelConfigs: Record<string, unknown>;
  policies: {
    requirePaymentBeforeSubmit: boolean;
    allowPartialPayment: boolean;
    allowOverpayment: boolean;
    refundPolicy: string;
  };
};

type TransactionRemittancePayload = {
  enabled: boolean;
  accountSource: string;
  specificNodeId: string | null;
  targetLevelId: string | null;
  requireNodeAccount: boolean;
  nodeAccountField: string | null;
  inheritParentAccount: boolean;
  settlementRule: {
    mode: string;
    splitType: string;
    targets: Array<{
      nodeId: string;
      percentage?: number;
    }>;
  };
  routing: {
    byNode: boolean;
    bySubmissionValue: boolean;
    fallbackAccountId: string | null;
  };
};

type TransactionInvoiceConditionPayload = {
  sourceType: string;
  fieldId: string | null;
  statusKey: string | null;
  operator: string;
  value: string | number | boolean | null;
};

type TransactionInvoiceLineItemPayload = {
  id: string;
  label: string;
  sourceField: string | null;
  enabled: boolean;
  calculationType: string;
  rate: number;
  fixedAmount: number | null;
  quantityField: string | null;
  baseExpression: string | null;
  computedExpression: string | null;
  includeInSubtotal: boolean;
  conditions: TransactionInvoiceConditionPayload[];
  active: boolean;
};

type TransactionInvoiceAdjustmentPayload = {
  enabled: boolean;
  mode: string;
  value: number;
  expression: string | null;
  conditions: TransactionInvoiceConditionPayload[];
};

type TransactionInvoicePayload = {
  enabled: boolean;
  calculationMode: string;
  currency: string | null;
  baseAmount: number;
  amountSourceField: string | null;
  lineItemsEnabled: boolean;
  lineItems: TransactionInvoiceLineItemPayload[];
  discountsEnabled: boolean;
  taxEnabled: boolean;
  discounts: TransactionInvoiceAdjustmentPayload;
  tax: TransactionInvoiceAdjustmentPayload;
  totals: {
    subtotalExpression: string | null;
    discountExpression: string | null;
    taxExpression: string | null;
    grandTotalExpression: string | null;
  };
  invoiceNumbering: {
    mode: string;
    prefix: string;
    nextNumber: number;
  };
  presentation: {
    showPaymentInstructions: boolean;
    showRemittanceDetails: boolean;
    showDueDate: boolean;
    showSubtotal: boolean;
    showDiscount: boolean;
    showTax: boolean;
    showGrandTotal: boolean;
  };
};

const normalizeTransactionPaymentChannel = (value: unknown) => {
  const candidate = String(value || '')
    .trim()
    .toLowerCase();
  if (!candidate) return null;
  if (candidate === 'sabypipe') return 'sabypay';
  return ['paystack', 'flutterwave', 'sabypay', '9psb', 'premium'].includes(
    candidate
  )
    ? candidate
    : null;
};

type AutomationRuleConditionPayload = {
  id: string;
  sourceType: 'field' | 'submission_status' | 'workflow_status';
  fieldId: string | null;
  statusKey: string | null;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in';
  value: unknown;
};

type AutomationRulePayload = {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  matchMode: 'all' | 'any';
  scope: {
    source: 'submission' | 'workflow';
    trigger: 'created' | 'updated' | 'approved' | 'rejected' | 'completed' | 'manual';
  };
  conditions: AutomationRuleConditionPayload[];
  actionRefs: string[];
  outcome: {
    statusOnMatch: string | null;
    note: string;
  };
};

type ConnectedActionPayload = {
  id: string;
  name: string;
  enabled: boolean;
  provider: 'internal' | 'webhook' | 'email' | 'slack' | 'zapier' | 'power_automate';
  actionType: 'notify' | 'status_update' | 'integration_sync' | 'assign' | 'webhook_call';
  target: string | null;
  config: Record<string, unknown>;
  retryPolicy: {
    enabled: boolean;
    maxAttempts: number;
  };
};

type AutomationOperationalVisibilityPayload = {
  showRunLog: boolean;
  showStatuses: boolean;
  showOwners: boolean;
  showAuditTrail: boolean;
  showRuleMatches: boolean;
  showLastRunAt: boolean;
};

export type ProjectFormPayload = {
  schemaVersion: '2.0.0';
  workspaceId?: string;
  identity: {
    name: string;
    description: string;
    category: string;
    tags: string[];
    status: 'draft' | 'published' | 'archived';
  };
  elements: Array<{
    id: string;
    type: string;
    properties: Record<string, unknown>;
    position: { x: number; y: number };
  }>;
  layout: {
    style: string;
    wizardMode: boolean;
    grid: {
      columns: number;
      columnSpans: Record<string, number>;
    };
    builder: Record<string, unknown>;
  };
  capabilities: {
    experience: {
      security: {
        profile:
          | 'open_public'
          | 'private_safe'
          | 'restricted_team'
          | 'internal_staff'
          | 'high_security';
        mode: 'public' | 'private' | 'restricted' | 'internal';
        publicSecureMode: 'off' | 'link_only' | 'otp' | 'access_code';
        access: {
          whoCanAccess:
            | 'anyone'
            | 'authenticated_users'
            | 'selected_roles'
            | 'selected_users';
          allowedRoles: string[];
          allowedUsers: string[];
          restrictByLocation: boolean;
          allowedCountries: string[];
        };
        authentication: {
          requireLogin: boolean;
          allowAnonymous: boolean;
          requireOtp: boolean;
        };
        submissionProtection: {
          preventDuplicateSubmission: boolean;
          duplicateCheckField: string | null;
          rateLimitEnabled: boolean;
          maxSubmissionsPerUser: number | null;
        };
        channels: (
          | 'web'
          | 'api'
          | 'embedded'
          | 'javascript'
          | 'mobile'
          | 'whatsapp'
          | 'telegram'
        )[];
      };
      behavior: Record<string, unknown>;
      distribution: Record<string, unknown>;
      notifications: Record<string, unknown>;
      compliance: Record<string, unknown>;
      workflow: {
        enabled: boolean;
        approvalMode: string;
        triggerOn: string;
        workflows: Array<Record<string, unknown>>;
      };
    };
    transaction: {
      payment: TransactionPaymentPayload;
      remittance: TransactionRemittancePayload;
      invoice: TransactionInvoicePayload;
    };
    automation: {
      rules: AutomationRulePayload[];
      connectedActions: ConnectedActionPayload[];
      operationalVisibility: AutomationOperationalVisibilityPayload;
    };
  };
  smartMappings: {
    enabled: boolean;
    autoDetect: boolean;
    allowManualOverride: boolean;
    fields: Record<string, string>;
  };
  analytics: {
    profile: Record<string, unknown>;
  };
  ui: Record<string, unknown>;
  metadata: {
    schemaVersion: '2.0.0';
    elementsCount: number;
    hasValidation: boolean;
    reviewStatus?: 'draft' | 'in_review' | 'approved';
    moduleStudio?: Record<string, unknown>;
    integrations?: string[];
  };
};

const normalizeElementType = (kind: string) => {
  if (kind === 'date') return 'datepicker';
  if (kind === 'select') return 'dropdown';
  if (kind === 'file') return 'fileupload';
  return kind;
};

export const lintDraftForSubmission = (
  draft: ModuleDraftV2
): SubmissionLint => {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!draft.metadata.projectName?.trim()) {
    blockers.push('Project name is required.');
  }

  if (!Array.isArray(draft.fields) || draft.fields.length === 0) {
    blockers.push('At least one field is required.');
  }

  const keys = new Set<string>();
  for (const field of draft.fields || []) {
    if (!field.key?.trim()) {
      blockers.push(`Field "${field.label || field.id}" is missing a key.`);
      continue;
    }
    const key = field.key.trim().toLowerCase();
    if (keys.has(key)) blockers.push(`Duplicate field key: "${field.key}".`);
    keys.add(key);
    if (!field.label?.trim())
      warnings.push(`Field "${field.key}" has no label.`);
  }

  if (draft.workflow.enabled && draft.workflow.steps.length === 0) {
    blockers.push('Workflow is enabled but no steps are configured.');
  }
  if (draft.workflow.enabled) {
    (draft.workflow.steps || []).forEach((step, index) => {
      const prefix = `Workflow step #${index + 1}`;
      if (!String(step?.name || '').trim()) {
        blockers.push(`${prefix} name is required.`);
      }
      const actionType = String(step?.actionType || 'REVIEW').toUpperCase();
      const needsAssignee = ['REVIEW', 'APPROVE', 'ESCALATE'].includes(
        actionType
      );
      if (
        needsAssignee &&
        (!Array.isArray(step?.allowedRoles) || step.allowedRoles.length === 0)
      ) {
        blockers.push(`${prefix} requires at least one role.`);
      }
      if (
        ['REVIEW', 'APPROVE'].includes(actionType) &&
        Number(step?.requiredApprovals || 0) <= 0
      ) {
        blockers.push(`${prefix} requires approvals greater than 0.`);
      }
    });
  }

  const policies = Array.isArray(draft.payment?.policies)
    ? draft.payment.policies
    : [];
  const paymentConfig =
    draft.payment?.config && typeof draft.payment.config === 'object'
      ? draft.payment.config
      : null;
  if (draft.payment.enabled && !paymentConfig?.enabled) {
    blockers.push(
      'Payment is enabled but payment config (processor/channel) is not enabled.'
    );
  }
  const enabledChannels = Array.isArray(paymentConfig?.enabledChannels)
    ? paymentConfig.enabledChannels
    : [];
  if (paymentConfig?.enabled && enabledChannels.length === 0) {
    blockers.push(
      'Payment config is enabled but no payment channel has been selected.'
    );
  }
  if (
    paymentConfig?.enabled &&
    !String(paymentConfig?.defaultChannel || '').trim()
  ) {
    blockers.push(
      'Payment config is enabled but default channel is not configured.'
    );
  }
  if (
    paymentConfig?.enabled &&
    paymentConfig?.defaultChannel &&
    !enabledChannels.includes(String(paymentConfig.defaultChannel))
  ) {
    blockers.push(
      'Payment config default channel must be included in enabled channels.'
    );
  }

  const utilities = Array.isArray(draft.behaviorHooks?.utilities)
    ? draft.behaviorHooks.utilities
    : [];
  utilities.forEach((util, index) => {
    const prefix = `Utility #${index + 1}`;
    if (!String(util?.type || '').trim())
      blockers.push(`${prefix} is missing utility type.`);
    if (!String(util?.name || '').trim())
      warnings.push(`${prefix} has no display name.`);
    if (util?.fieldKey) {
      const hasField = (draft.fields || []).some(
        (field) => field.key === util.fieldKey
      );
      if (!hasField)
        blockers.push(
          `${prefix} references unknown field key "${util.fieldKey}".`
        );
    }
  });

  if (!draft.metadata.tags?.length) {
    warnings.push('No tags set; discovery/search quality may be lower.');
  }

  return { blockers, warnings };
};

const defaultAutomationOperationalVisibility =
  (): AutomationOperationalVisibilityPayload => ({
    showRunLog: true,
    showStatuses: true,
    showOwners: true,
    showAuditTrail: true,
    showRuleMatches: true,
    showLastRunAt: true,
  });

const normalizeLegacyAutomationRules = (
  rawRules: unknown
): AutomationRulePayload[] =>
  (Array.isArray(rawRules) ? rawRules : []).map((rule, index) => {
    const item = rule as Record<string, unknown>;
    return {
      id: String(item.id || item._id || `rule_${index + 1}`),
      name: String(item.name || item.label || `Rule ${index + 1}`),
      enabled: item.enabled !== false,
      priority:
        typeof item.priority === 'number' && item.priority > 0
          ? item.priority
          : index + 1,
      matchMode: item.matchMode === 'any' ? 'any' : 'all',
      scope: {
        source: item?.scope && (item.scope as any).source === 'workflow' ? 'workflow' : 'submission',
        trigger:
          item?.scope && ['updated', 'approved', 'rejected', 'completed', 'manual'].includes(String((item.scope as any).trigger || ''))
            ? ((item.scope as any).trigger as AutomationRulePayload['scope']['trigger'])
            : 'created',
      },
      conditions: Array.isArray(item.conditions)
        ? item.conditions.map((condition, conditionIndex) => {
            const next = condition as Record<string, unknown>;
            return {
              id: String(next.id || `condition_${index + 1}_${conditionIndex + 1}`),
              sourceType:
                next.sourceType === 'submission_status' || next.sourceType === 'workflow_status'
                  ? (next.sourceType as AutomationRuleConditionPayload['sourceType'])
                  : 'field',
              fieldId: next.fieldId ? String(next.fieldId) : null,
              statusKey: next.statusKey ? String(next.statusKey) : null,
              operator:
                ['neq', 'gt', 'gte', 'lt', 'lte', 'contains', 'in'].includes(String(next.operator || ''))
                  ? (next.operator as AutomationRuleConditionPayload['operator'])
                  : 'eq',
              value: next.value ?? null,
            };
          })
        : [],
      actionRefs: Array.isArray(item.actionRefs)
        ? item.actionRefs.map((entry) => String(entry)).filter(Boolean)
        : [],
      outcome: {
        statusOnMatch: item?.outcome && (item.outcome as any).statusOnMatch
          ? String((item.outcome as any).statusOnMatch)
          : null,
        note: item?.outcome && (item.outcome as any).note
          ? String((item.outcome as any).note)
          : '',
      },
    };
  });

const normalizeLegacyConnectedActions = (
  rawActions: unknown
): ConnectedActionPayload[] =>
  (Array.isArray(rawActions) ? rawActions : []).map((action, index) => {
    const item = action as Record<string, unknown>;
    const provider =
      ['webhook', 'email', 'slack', 'zapier', 'power_automate'].includes(String(item.provider || ''))
        ? (item.provider as ConnectedActionPayload['provider'])
        : 'internal';
    const actionType =
      ['status_update', 'integration_sync', 'assign', 'webhook_call'].includes(
        String(item.actionType || item.type || '')
      )
        ? (String(item.actionType || item.type) as ConnectedActionPayload['actionType'])
        : 'notify';
    return {
      id: String(item.id || item._id || `action_${index + 1}`),
      name: String(item.name || item.label || `Action ${index + 1}`),
      enabled: item.enabled !== false,
      provider,
      actionType,
      target: item.target ? String(item.target) : null,
      config:
        item.config && typeof item.config === 'object'
          ? (item.config as Record<string, unknown>)
          : {},
      retryPolicy: {
        enabled: Boolean(item?.retryPolicy && (item.retryPolicy as any).enabled),
        maxAttempts:
          typeof item?.retryPolicy === 'object' &&
          typeof (item.retryPolicy as any).maxAttempts === 'number'
            ? Math.max(1, Number((item.retryPolicy as any).maxAttempts))
            : 3,
      },
    };
  });

export const draftToProjectFormPayload = (
  draft: ModuleDraftV2
): ProjectFormPayload => {
  const elements = (draft.fields || []).map((field, index) => {
    const properties: Record<string, unknown> = {
      label: field.label,
      required: Boolean(field.validation?.required),
      validation: {
        required: Boolean(field.validation?.required),
        ...(field.validation?.minLength != null
          ? { minLength: field.validation.minLength }
          : {}),
        ...(field.validation?.maxLength != null
          ? { maxLength: field.validation.maxLength }
          : {}),
        ...(field.validation?.min != null ? { min: field.validation.min } : {}),
        ...(field.validation?.max != null ? { max: field.validation.max } : {}),
        ...(field.validation?.pattern
          ? { pattern: field.validation.pattern }
          : {}),
      },
      ...(field.placeholder ? { placeholder: field.placeholder } : {}),
      ...(field.helpText ? { helpText: field.helpText } : {}),
      ...(Array.isArray(field.options) && field.options.length > 0
        ? { options: field.options }
        : {}),
      ...(field.defaultValue !== undefined
        ? { defaultValue: field.defaultValue }
        : {}),
    };

    return {
      id: field.key || field.id,
      type: normalizeElementType(field.kind),
      properties,
      position: {
        x: 0,
        y: Number(field.layout?.order || index + 1),
      },
    };
  });

  const columnSpans = Object.fromEntries(
    (draft.fields || []).map((field) => [
      field.key || field.id,
      Number(field.layout?.colSpan || 1),
    ])
  );

  const workflowMeta =
    draft.workflow?.meta && typeof draft.workflow.meta === 'object'
      ? draft.workflow.meta
      : {};
  const workflows = draft.workflow.enabled
    ? [
        {
          ...workflowMeta,
          id: String((workflowMeta as any)?.id || 'wf_main'),
          name: String((workflowMeta as any)?.name || 'Approval Workflow'),
          type: String((workflowMeta as any)?.type || 'custom'),
          enabled: true,
          triggerOn: String((workflowMeta as any)?.triggerOn || 'submission'),
          notifications: {
            ...(((workflowMeta as any)?.notifications &&
            typeof (workflowMeta as any).notifications === 'object'
              ? (workflowMeta as any).notifications
              : {}) as Record<string, unknown>),
            onEveryIncident: Boolean(
              draft.workflow.notifications?.onEveryIncident
            ),
          },
          steps: (draft.workflow.steps || []).map((step) => ({
            ...((step?.meta && typeof step.meta === 'object'
              ? step.meta
              : {}) as Record<string, unknown>),
            id: step.id,
            name: step.name,
            stepOrder: step.order,
            actionType: step.actionType,
            type:
              step.actionType === 'NOTIFY'
                ? 'notification'
                : step.actionType === 'REVIEW'
                  ? 'review'
                  : 'approval',
            assigneeType: 'role',
            assigneeRole: step.allowedRoles?.[0] || null,
            assigneeRoles: step.allowedRoles || [],
            assigneeUsers: [],
            sla: { hours: 48 },
            requiredApprovals: Number(step.requiredApprovals || 1),
          })),
        },
      ]
    : [];

  const accessConfig: Record<string, unknown> = {
      allowedRoles: [],
      allowedUsers: [],
      restrictByLocation: false,
      allowedCountries: [],
    };
  const behaviorConfig: Record<string, unknown> = {
      allowMultipleSubmissions: true,
      enableProgressSave: true,
      autoSave: false,
      submitOnComplete: true,
    };
  const distributionConfig: Record<string, unknown> = {
      enableSharing: true,
      allowEmbedding: true,
      generateQR: false,
      enableDeepLinking: true,
    };
  const notificationConfig: Record<string, unknown> = {
      emailOnSubmission: false,
      notifyOwner: true,
      customEmails: [],
      smsNotifications: false,
  };
  const builderConfig: Record<string, unknown> = {
    gridSize: 12,
    snapToGrid: true,
    showGridLines: false,
    autoArrange: true,
  };

  const complianceConfig: Record<string, unknown> = {
    enabled: Boolean(draft.perm.enabled),
    trackingMode: draft.perm.trackingMode,
    frequency: draft.perm.trackingMode,
    requireNodeId: Boolean(draft.perm.requireNodeId),
    requireMonth: Boolean(draft.perm.requireMonth),
    trackCompliance: true,
    autoGenerateCalendar: Boolean(draft.perm.autoGenerateCalendar),
    calendarRequired: false,
    ...(draft.perm.calendar
      ? {
          calendarGeneration: {
            ...(draft.perm.calendar.startDate
              ? { startDate: draft.perm.calendar.startDate }
              : {}),
            ...(draft.perm.calendar.endDate
              ? { endDate: draft.perm.calendar.endDate }
              : {}),
            allowBackdating: Boolean(draft.perm.calendar.allowBackdating),
          },
        }
      : {}),
  };

  const paymentPolicies = Array.isArray(draft.payment?.policies)
    ? draft.payment.policies
    : [];
  const { config: draftPaymentConfig, ...paymentPolicyPayload } =
    draft.payment || {};
  const paymentPolicyConfig = {
    requirePaymentBeforeSubmit:
      String(draft.payment?.collectionStage || '') === 'before_submit',
    allowPartialPayment: false,
    allowOverpayment: false,
    refundPolicy: 'none',
  };
  const transactionEnabledChannels = Array.isArray(
    draftPaymentConfig?.enabledChannels
  )
    ? Array.from(
        new Set(
          draftPaymentConfig.enabledChannels
            .map((value) => normalizeTransactionPaymentChannel(value))
            .filter(Boolean)
        )
      )
    : [];
  const normalizedDefaultChannel = normalizeTransactionPaymentChannel(
    draftPaymentConfig?.defaultChannel
  );
  const legacyCollectionStage = String(draft.payment.collectionStage || '')
    .trim()
    .toLowerCase();
  const transactionDefaultChannel =
    normalizedDefaultChannel &&
    transactionEnabledChannels.includes(String(normalizedDefaultChannel))
      ? String(normalizedDefaultChannel)
      : (transactionEnabledChannels[0] || null);
  const transactionPayment: TransactionPaymentPayload = {
    enabled: Boolean(draft.payment.enabled),
    mode: draft.payment.enabled ? 'invoice' : 'none',
    currency: draft.payment.currency || null,
    enabledChannels: transactionEnabledChannels,
    defaultChannel: transactionDefaultChannel,
    collectionStage:
      legacyCollectionStage === 'before_submit' ||
      legacyCollectionStage === 'submission'
        ? 'submission'
        : legacyCollectionStage === 'before_approval' ||
            legacyCollectionStage === 'pre_approval'
          ? 'pre_approval'
          : legacyCollectionStage === 'after_approval' ||
              legacyCollectionStage === 'post_approval'
            ? 'post_approval'
            : 'submission',
    settlementType: 'none',
    receivingAccount: null,
    channelConfigs:
      draftPaymentConfig?.processorSettings &&
      typeof draftPaymentConfig.processorSettings === 'object'
        ? draftPaymentConfig.processorSettings
        : {},
    policies: paymentPolicyConfig,
  };
  const transactionRemittance: TransactionRemittancePayload = {
    enabled: false,
    accountSource: 'tenant_global',
    specificNodeId: null,
    targetLevelId: null,
    requireNodeAccount: false,
    nodeAccountField: null,
    inheritParentAccount: false,
    settlementRule: {
      mode: 'single',
      splitType: 'selection',
      targets: [],
    },
    routing: {
      byNode: false,
      bySubmissionValue: false,
      fallbackAccountId: null,
    },
  };
  const transactionInvoice: TransactionInvoicePayload = {
    enabled: Boolean(draft.payment.enabled),
    calculationMode: 'fixed',
    currency: draft.payment.currency || null,
    baseAmount: Number(draft.payment?.fixedAmount || 0),
    amountSourceField: null,
    lineItemsEnabled: false,
    lineItems: [],
    discountsEnabled: false,
    taxEnabled: false,
    discounts: {
      enabled: false,
      mode: 'none',
      value: 0,
      expression: null,
      conditions: [],
    },
    tax: {
      enabled: false,
      mode: 'none',
      value: 0,
      expression: null,
      conditions: [],
    },
    totals: {
      subtotalExpression: null,
      discountExpression: null,
      taxExpression: null,
      grandTotalExpression: null,
    },
    invoiceNumbering: {
      mode: 'auto',
      prefix: '',
      nextNumber: 1,
    },
    presentation: {
      showPaymentInstructions: true,
      showRemittanceDetails: true,
      showDueDate: true,
      showSubtotal: true,
      showDiscount: true,
      showTax: true,
      showGrandTotal: true,
    },
  };
  const moduleStudioMetadata: Record<string, unknown> = {
    payment: {
      ...paymentPolicyPayload,
      policies: paymentPolicyConfig,
    },
    paymentConfig:
      draftPaymentConfig && typeof draftPaymentConfig === 'object'
        ? draftPaymentConfig
        : {
            enabled: false,
            enabledChannels: [],
          },
    behaviorHooks: draft.behaviorHooks || {},
    analysis: draft.analysis || {},
    perm: {
      calendar: draft.perm.calendar || {},
    },
  };

  return {
    schemaVersion: '2.0.0',
    identity: {
      name: draft.metadata.projectName,
      description: '',
      category: 'standard',
      tags: Array.from(
        new Set([
          ...(draft.metadata.tags || []),
          ...(draft.metadata.additionalTags || []),
        ])
      ),
      status: draft.status === 'published' ? 'published' : 'draft',
    },
    elements,
    layout: {
      style: draft.ui.style || 'default',
      wizardMode: Boolean(draft.ui.wizardMode),
      grid: {
        columns: 12,
        columnSpans,
      },
      builder: builderConfig,
    },
    capabilities: {
      experience: {
        security: {
          profile: 'private_safe',
          mode: draft.metadata.security,
          publicSecureMode: 'off',
          access: {
            whoCanAccess: 'authenticated_users',
            allowedRoles: Array.isArray((accessConfig as any)?.allowedRoles)
              ? ((accessConfig as any).allowedRoles as string[])
              : [],
            allowedUsers: Array.isArray((accessConfig as any)?.allowedUsers)
              ? ((accessConfig as any).allowedUsers as string[])
              : [],
            restrictByLocation: Boolean(
              (accessConfig as any)?.restrictByLocation
            ),
            allowedCountries: Array.isArray((accessConfig as any)?.allowedCountries)
              ? ((accessConfig as any).allowedCountries as string[])
              : [],
          },
          authentication: {
            requireLogin: true,
            allowAnonymous: false,
            requireOtp: false,
          },
          submissionProtection: {
            preventDuplicateSubmission: false,
            duplicateCheckField: null,
            rateLimitEnabled: false,
            maxSubmissionsPerUser: null,
          },
          channels: draft.metadata.accessibility,
        },
        behavior: behaviorConfig,
        distribution: distributionConfig,
        notifications: notificationConfig,
        compliance: complianceConfig,
        workflow: {
          enabled: draft.workflow.enabled,
          approvalMode: draft.workflow.enabled ? 'custom' : 'none',
          triggerOn: 'submission',
          workflows,
        },
      },
      transaction: {
        payment: transactionPayment,
        remittance: transactionRemittance,
        invoice: transactionInvoice,
      },
      automation: {
        rules: normalizeLegacyAutomationRules(draft.behaviorHooks?.dateTriggers),
        connectedActions: normalizeLegacyConnectedActions(draft.behaviorHooks?.utilities),
        operationalVisibility: defaultAutomationOperationalVisibility(),
      },
    },
    smartMappings: {
      enabled: true,
      autoDetect: true,
      allowManualOverride: true,
      fields: {},
    },
    analytics: {
      profile: draft.analysis || {},
    },
    ui: {
      theme: draft.ui.theme || 'default',
      primaryColor: draft.ui.primaryColor || '#3b82f6',
      secondaryColor: draft.ui.secondaryColor || '#dbeafe',
      companyLogoUrl: draft.ui.companyLogoUrl || '',
      conversationTitle: draft.ui.conversationTitle || '',
      conversationDescription: draft.ui.conversationDescription || '',
      layout: draft.ui.wizardMode ? 'multi-step' : 'single',
      showProgressBar: Boolean(draft.ui.showProgressBar),
    },
    metadata: {
      schemaVersion: '2.0.0',
      elementsCount: elements.length,
      hasValidation: elements.some((element) =>
        Boolean((element.properties as any)?.validation)
      ),
      reviewStatus: draft.status === 'ready' ? 'approved' : 'draft',
      moduleStudio: moduleStudioMetadata,
      integrations: draft.metadata.accessibility,
    },
  };
};
