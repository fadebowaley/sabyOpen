export type ProjectWizardElement = {
  id: string;
  type: string;
  properties?: Record<string, any>;
};

export type TransactionPayment = {
  enabled?: boolean;
  mode?: string;
  currency?: string | null;
  enabledChannels?: Array<'card' | 'bank_transfer' | 'ussd' | 'wallet' | 'cash' | string>;
  defaultChannel?: string | null;
  collectionStage?: string;
  settlementType?: string;
  receivingAccount?: Record<string, any> | string | null;
  channelConfigs?: Record<string, any>;
  policies?: {
    requirePaymentBeforeSubmit?: boolean;
    allowPartialPayment?: boolean;
    allowOverpayment?: boolean;
    refundPolicy?: string;
  };
};

export type ReceivingAccount = {
  id?: string | null;
  label?: string;
  accountNumber?: string;
  bankName?: string;
  accountName?: string;
  isPrimary?: boolean;
  isActive?: boolean;
};

export type TransactionRemittance = {
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
};

export type TransactionInvoiceCondition = {
  sourceType?: 'field' | 'submission_status' | 'workflow_status' | string;
  fieldId?: string | null;
  statusKey?: string | null;
  operator?: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in' | string;
  value?: string | number | boolean | null;
};

export type TransactionInvoiceLineItem = {
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
};

export type TransactionInvoiceAdjustment = {
  enabled?: boolean;
  mode?: 'none' | 'fixed' | 'percentage' | 'formula' | string;
  value?: number;
  expression?: string | null;
  conditions?: TransactionInvoiceCondition[];
};

export type TransactionInvoice = {
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
};

export type ProjectWizardDraft = {
  schemaVersion: '2.0.0';
  identity: {
    name: string;
    description?: string;
    category?: string;
    tags?: string[];
    status?: 'draft' | 'published' | 'archived';
  };
  elements: ProjectWizardElement[];
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
        profile?: string;
        mode?: string;
        publicSecureMode?: string;
        access?: {
          whoCanAccess?: string;
          allowedRoles?: string[];
          allowedUsers?: string[];
          restrictByLocation?: boolean;
          allowedCountries?: string[];
        };
        authentication?: {
          requireLogin?: boolean;
          allowAnonymous?: boolean;
          requireOtp?: boolean;
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
      distribution?: Record<string, any>;
      notifications?: Record<string, any>;
      compliance?: {
        enabled?: boolean;
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
      rules?: Array<{
        id?: string;
        name?: string;
        enabled?: boolean;
        priority?: number;
        matchMode?: 'all' | 'any';
        scope?: {
          source?: 'submission' | 'workflow';
          trigger?: 'created' | 'updated' | 'approved' | 'rejected' | 'completed' | 'manual';
        };
        conditions?: Array<{
          id?: string;
          sourceType?: 'field' | 'submission_status' | 'workflow_status';
          fieldId?: string | null;
          statusKey?: string | null;
          operator?: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in';
          value?: any;
        }>;
        actionRefs?: string[];
        outcome?: {
          statusOnMatch?: string | null;
          note?: string;
        };
      }>;
      connectedActions?: Array<{
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
      }>;
      operationalVisibility?: {
        showRunLog?: boolean;
        showStatuses?: boolean;
        showOwners?: boolean;
        showAuditTrail?: boolean;
        showRuleMatches?: boolean;
        showLastRunAt?: boolean;
      };
    };
  };
  smartMappings?: Record<string, any>;
  analytics?: {
    profile?: Record<string, any>;
  };
  ui?: Record<string, any>;
  metadata?: Record<string, any>;
};

export type ProjectWizardGenerateResponse = {
  draft: ProjectWizardDraft;
  summary?: Record<string, any>;
  checklist?: Record<string, any>;
  suggestedNextPrompts?: string[];
};

const parseJson = async (response: Response) => response.json().catch(() => null);

export const generateProjectWizardDraft = async (payload: {
  prompt: string;
  projectName?: string;
  options?: Record<string, any>;
}) => {
  const response = await fetch('/api/saby/project-wizard/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(response);
  if (!response.ok || !data?.draft) {
    throw new Error(data?.message || data?.error || 'Failed to generate draft');
  }
  return data as ProjectWizardGenerateResponse;
};

export const saveProjectWizardDraft = async (payload: {
  draft: ProjectWizardDraft;
  summary?: Record<string, any>;
  prompt?: string | null;
}) => {
  const response = await fetch('/api/saby/project-wizard/draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(response);
  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'Failed to save draft');
  }
  return data;
};

export const getProjectWizardDraft = async () => {
  const response = await fetch('/api/saby/project-wizard/draft', {
    method: 'GET',
  });
  const data = await parseJson(response);
  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'Failed to load draft');
  }
  return data;
};

export const clearProjectWizardDraft = async () => {
  const response = await fetch('/api/saby/project-wizard/draft', {
    method: 'DELETE',
  });
  const data = await parseJson(response);
  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'Failed to clear draft');
  }
  return data;
};
