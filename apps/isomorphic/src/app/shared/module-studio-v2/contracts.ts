export type FieldKind =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'phone'
  | 'date'
  | 'time'
  | 'datetime'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'file'
  | 'header'
  | 'paragraph'
  | 'button';

export type ValidationRule = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  customMessage?: string;
};

export type ModuleFieldV2 = {
  id: string;
  key: string;
  label: string;
  kind: FieldKind;
  placeholder?: string;
  helpText?: string;
  options?: string[];
  defaultValue?: unknown;
  validation?: ValidationRule;
  layout?: {
    colSpan?: 1 | 2 | 3 | 4;
    order?: number;
  };
  semantic?: {
    role?: 'measure' | 'dimension' | 'status' | 'label' | 'ignore';
    valueType?:
      | 'number'
      | 'currency'
      | 'percent'
      | 'boolean'
      | 'text'
      | 'enum'
      | 'date'
      | 'datetime'
      | 'time';
  };
};

export type WorkflowStepV2 = {
  id: string;
  name: string;
  actionType: 'SUBMIT' | 'REVIEW' | 'APPROVE' | 'ESCALATE' | 'NOTIFY';
  allowedRoles: string[];
  requiredApprovals?: number;
  order: number;
  meta?: Record<string, unknown>;
};

export type PaymentPolicyScopeType =
  | 'all'
  | 'node'
  | 'family'
  | 'level'
  | 'category';
export type PaymentPolicyMode = 'steady' | 'active';
export type PaymentPolicyBreakdownMode = 'percentage' | 'fixed';

export type PaymentPolicyBreakdown = {
  id: string;
  recipientType:
    | 'node'
    | 'family'
    | 'level'
    | 'category'
    | 'tenant'
    | 'platform';
  recipientRef?: string;
  mode: PaymentPolicyBreakdownMode;
  value: number;
  note?: string;
};

export type PaymentPolicyV2 = {
  id: string;
  name: string;
  active: boolean;
  priority: number;
  scopeType: PaymentPolicyScopeType;
  scopeRef: string;
  approverRoles?: string[];
  mode: PaymentPolicyMode;
  fixedAmount?: number;
  formula?: string;
  activeConfig?: {
    deriveFrom?:
      | 'field_percentage'
      | 'expression'
      | 'node_attribute'
      | 'combined';
    fieldKey?: string;
    percentage?: number;
    nodeAttributeKey?: string;
    expression?: string;
    conditionExpression?: string;
  };
  settings?: Record<string, unknown>;
  conditions?: string[];
  breakdown?: PaymentPolicyBreakdown[];
  enforcement?: {
    requiredOnSubmission: boolean;
    blockSubmissionOnFailure: boolean;
  };
};

export type PaymentProcessorConfigV2 = {
  enabled: boolean;
  defaultChannel?: 'sabypay' | 'paystack' | 'flutterwave' | '9psb' | 'premium';
  enabledChannels?: Array<
    'sabypay' | 'paystack' | 'flutterwave' | '9psb' | 'premium'
  >;
  processorSettings?: Record<string, unknown>;
};

export type ModuleUtilityType =
  | 'payment_policy'
  | 'file_storage'
  | 'date_event'
  | 'threshold_guard'
  | 'status_route'
  | 'consent_gate'
  | 'text_intelligence'
  | 'contact_automation'
  | 'geo_policy'
  | 'repeatable_aggregate'
  | 'identity_validation'
  | 'reference_integrity';

export type ModuleUtilityV2 = {
  id: string;
  type: ModuleUtilityType;
  name: string;
  enabled: boolean;
  priority: number;
  fieldKey?: string;
  config?: Record<string, unknown>;
  conditions?: string[];
  actions?: Array<Record<string, unknown>>;
  enforcement?: {
    required?: boolean;
    blockOnFailure?: boolean;
  };
};

export type ModuleDraftV2 = {
  id: string;
  version: 2;
  status: 'draft' | 'ready' | 'published';
  updatedAt: string;
  metadata: {
    projectName: string;
    tags: string[];
    additionalTags: string[];
    security: 'public' | 'private';
    accessibility: ('web' | 'api' | 'embedded' | 'javascript' | 'mobile')[];
  };
  fields: ModuleFieldV2[];
  ui: {
    style: string;
    wizardMode: boolean;
    showProgressBar: boolean;
    primaryColor: string;
    secondaryColor?: string;
    companyLogoUrl?: string;
    conversationTitle?: string;
    conversationDescription?: string;
    theme: string;
  };
  perm: {
    enabled: boolean;
    trackingMode: 'none' | 'daily' | 'weekly';
    requireNodeId: boolean;
    requireMonth: boolean;
    autoGenerateCalendar: boolean;
    calendar?: {
      startDate?: string;
      endDate?: string;
      allowBackdating?: boolean;
    };
  };
  workflow: {
    enabled: boolean;
    steps: WorkflowStepV2[];
    notifications?: {
      onEveryIncident?: boolean;
    };
    meta?: Record<string, unknown>;
  };
  payment: {
    enabled: boolean;
    mode: 'none' | 'fixed' | 'formula';
    fixedAmount?: number;
    formula?: string;
    currency?: string;
    collectionStage?: 'submission' | 'pre_approval' | 'post_approval';
    policies?: PaymentPolicyV2[];
    config?: PaymentProcessorConfigV2;
  };
  behaviorHooks: {
    onLoad?: string;
    onChange?: string;
    beforeSubmit?: string;
    afterSubmit?: string;
    customValidation?: string;
    utilities?: ModuleUtilityV2[];
    dateTriggers?: Array<Record<string, unknown>>;
    filePolicies?: Array<Record<string, unknown>>;
  };
  analysis?: {
    domain?: 'finance' | 'attendance' | 'hr' | 'operations' | 'custom';
    dataNature?: 'qualitative' | 'quantitative' | 'hybrid';
  };
};

export type DraftOperationType =
  | 'create_module'
  | 'set_module_name'
  | 'set_industry'
  | 'add_field'
  | 'update_field'
  | 'remove_field'
  | 'reorder_field'
  | 'set_security'
  | 'set_accessibility'
  | 'toggle_perm'
  | 'set_perm_tracking'
  | 'set_calendar_generation'
  | 'toggle_workflow'
  | 'set_workflow_notifications'
  | 'add_workflow_step'
  | 'update_workflow_step'
  | 'remove_workflow_step'
  | 'set_payment_config'
  | 'set_behavior_hooks'
  | 'set_tags'
  | 'set_analysis_profile';

export type DraftOperation = {
  type: DraftOperationType;
  payload: Record<string, unknown>;
  source: 'chat' | 'ui' | 'template';
  createdAt: string;
};

export type DraftReadiness = {
  isReady: boolean;
  blockers: string[];
  warnings: string[];
};
