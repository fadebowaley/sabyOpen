import {
  DraftOperation,
  ModuleDraftV2,
  ModuleFieldV2,
  PaymentProcessorConfigV2,
  WorkflowStepV2,
} from './contracts';
import { evaluateDraftReadiness } from './moduleDraft.validators';

export type ModuleDraftHistoryState = {
  present: ModuleDraftV2 | null;
  past: ModuleDraftV2[];
  future: ModuleDraftV2[];
  lastOperation: DraftOperation | null;
};

export type ModuleDraftAction =
  | { type: 'initialize'; draft: ModuleDraftV2 }
  | { type: 'apply_operation'; operation: DraftOperation }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'reset' };

const cloneDraft = (draft: ModuleDraftV2) =>
  JSON.parse(JSON.stringify(draft)) as ModuleDraftV2;

const normalizeFieldKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || `field_${Date.now()}`;

const buildField = (payload: Record<string, unknown>): ModuleFieldV2 => {
  const label = String(payload.label || payload.key || 'New Field').trim();
  const key = normalizeFieldKey(String(payload.key || label));
  const kind = (payload.kind as ModuleFieldV2['kind']) || 'text';
  const id = String(payload.id || `fld_${Date.now().toString(36)}`);
  const order = Number(payload.order || 0);
  const colSpan = Number(payload.colSpan || 1) as 1 | 2 | 3 | 4;
  return {
    id,
    key,
    label,
    kind,
    placeholder: payload.placeholder ? String(payload.placeholder) : undefined,
    options: Array.isArray(payload.options)
      ? payload.options.map((item) => String(item))
      : undefined,
    validation:
      typeof payload.validation === 'object' && payload.validation !== null
        ? (payload.validation as ModuleFieldV2['validation'])
        : undefined,
    layout: {
      order,
      colSpan: [1, 2, 3, 4].includes(colSpan) ? colSpan : 1,
    },
  };
};

const updateField = (
  field: ModuleFieldV2,
  payload: Record<string, unknown>
): ModuleFieldV2 => {
  const next = { ...field };
  if (payload.label != null) next.label = String(payload.label);
  if (payload.key != null) next.key = normalizeFieldKey(String(payload.key));
  if (payload.kind != null) next.kind = payload.kind as ModuleFieldV2['kind'];
  if (payload.placeholder !== undefined)
    next.placeholder = payload.placeholder
      ? String(payload.placeholder)
      : undefined;
  if (payload.helpText !== undefined)
    next.helpText = payload.helpText ? String(payload.helpText) : undefined;
  if (payload.options !== undefined) {
    next.options = Array.isArray(payload.options)
      ? payload.options.map((item) => String(item))
      : undefined;
  }
  if (payload.validation !== undefined) {
    next.validation =
      payload.validation && typeof payload.validation === 'object'
        ? (payload.validation as ModuleFieldV2['validation'])
        : undefined;
  }
  if (payload.colSpan != null || payload.order != null) {
    const nextColSpan =
      payload.colSpan != null ? Number(payload.colSpan) : next.layout?.colSpan;
    const nextOrder =
      payload.order != null ? Number(payload.order) : next.layout?.order;
    next.layout = {
      colSpan: [1, 2, 3, 4].includes(Number(nextColSpan))
        ? (Number(nextColSpan) as 1 | 2 | 3 | 4)
        : 1,
      order: Number(nextOrder || 0),
    };
  }
  return next;
};

const buildWorkflowStep = (
  payload: Record<string, unknown>
): WorkflowStepV2 => ({
  id: String(payload.id || `wf_${Date.now().toString(36)}`),
  name: String(payload.name || 'Workflow Step'),
  actionType: (payload.actionType as WorkflowStepV2['actionType']) || 'APPROVE',
  allowedRoles: Array.isArray(payload.allowedRoles)
    ? payload.allowedRoles.map((item) => String(item))
    : [],
  requiredApprovals:
    payload.requiredApprovals != null ? Number(payload.requiredApprovals) : 1,
  order: Number(payload.order || 1),
  meta:
    payload.meta &&
    typeof payload.meta === 'object' &&
    !Array.isArray(payload.meta)
      ? (payload.meta as Record<string, unknown>)
      : undefined,
});

const normalizePaymentConfig = (input: unknown): PaymentProcessorConfigV2 => {
  const source =
    input && typeof input === 'object' && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : {};
  const enabledChannels = Array.isArray(source.enabledChannels)
    ? source.enabledChannels
        .map((channel) => {
          const candidate = String(channel || '').toLowerCase();
          return candidate === 'sabypipe' ? 'sabypay' : candidate;
        })
        .filter((channel) =>
          ['sabypay', 'paystack', 'flutterwave', '9psb', 'premium'].includes(
            channel
          )
        )
    : [];
  const defaultChannelRaw = String(source.defaultChannel || '')
    .toLowerCase()
    .replace('sabypipe', 'sabypay');
  const defaultChannel =
    ['sabypay', 'paystack', 'flutterwave', '9psb', 'premium'].includes(
      defaultChannelRaw
    ) &&
    enabledChannels.includes(defaultChannelRaw)
      ? (defaultChannelRaw as
          | 'sabypay'
          | 'paystack'
          | 'flutterwave'
          | '9psb'
          | 'premium')
      : undefined;
  return {
    enabled: Boolean(source.enabled),
    enabledChannels: enabledChannels as Array<
      'sabypay' | 'paystack' | 'flutterwave' | '9psb' | 'premium'
    >,
    defaultChannel,
    processorSettings:
      source.processorSettings &&
      typeof source.processorSettings === 'object' &&
      !Array.isArray(source.processorSettings)
        ? (source.processorSettings as Record<string, unknown>)
        : {},
  };
};

export const applyOperationToDraft = (
  current: ModuleDraftV2,
  operation: DraftOperation
): ModuleDraftV2 => {
  const next = cloneDraft(current);
  const payload = operation.payload || {};

  switch (operation.type) {
    case 'create_module': {
      if (payload.projectName) {
        next.metadata.projectName = String(payload.projectName).trim();
      }
      if (Array.isArray(payload.tags)) {
        next.metadata.tags = payload.tags.map((item) => String(item));
      }
      break;
    }
    case 'set_module_name':
      next.metadata.projectName = String(payload.projectName || '').trim();
      break;
    case 'set_industry':
      next.metadata.tags = Array.isArray(payload.tags)
        ? payload.tags.map((item) => String(item))
        : payload.industry
          ? [String(payload.industry)]
          : [];
      break;
    case 'set_tags':
      next.metadata.tags = Array.isArray(payload.tags)
        ? payload.tags.map((item) => String(item))
        : next.metadata.tags;
      next.metadata.additionalTags = Array.isArray(payload.additionalTags)
        ? payload.additionalTags.map((item) => String(item))
        : next.metadata.additionalTags;
      break;
    case 'add_field':
      next.fields.push(buildField(payload));
      break;
    case 'update_field': {
      const fieldId = String(payload.fieldId || payload.id || '');
      next.fields = next.fields.map((field) =>
        field.id === fieldId ? updateField(field, payload) : field
      );
      break;
    }
    case 'remove_field': {
      const fieldId = String(payload.fieldId || payload.id || '');
      next.fields = next.fields.filter((field) => field.id !== fieldId);
      break;
    }
    case 'reorder_field': {
      const fieldId = String(payload.fieldId || payload.id || '');
      const toIndex = Number(payload.toIndex);
      const source = next.fields.findIndex((field) => field.id === fieldId);
      if (
        source >= 0 &&
        Number.isInteger(toIndex) &&
        toIndex >= 0 &&
        toIndex < next.fields.length
      ) {
        const [moved] = next.fields.splice(source, 1);
        next.fields.splice(toIndex, 0, moved);
      }
      break;
    }
    case 'set_security':
      next.metadata.security =
        payload.security === 'public' ? 'public' : 'private';
      break;
    case 'set_accessibility':
      next.metadata.accessibility = Array.isArray(payload.accessibility)
        ? (payload.accessibility.map((item) =>
            String(item)
          ) as ModuleDraftV2['metadata']['accessibility'])
        : next.metadata.accessibility;
      break;
    case 'toggle_perm':
      next.perm.enabled = Boolean(payload.enabled);
      break;
    case 'set_perm_tracking':
      next.perm.trackingMode =
        (payload.trackingMode as ModuleDraftV2['perm']['trackingMode']) ||
        'none';
      break;
    case 'set_calendar_generation':
      next.perm.calendar = {
        startDate: payload.startDate
          ? String(payload.startDate)
          : next.perm.calendar?.startDate,
        endDate: payload.endDate
          ? String(payload.endDate)
          : next.perm.calendar?.endDate,
        allowBackdating:
          payload.allowBackdating != null
            ? Boolean(payload.allowBackdating)
            : next.perm.calendar?.allowBackdating,
      };
      break;
    case 'toggle_workflow':
      next.workflow.enabled = Boolean(payload.enabled);
      break;
    case 'set_workflow_notifications':
      next.workflow = {
        ...next.workflow,
        notifications: {
          ...(next.workflow.notifications || {}),
          ...(payload || {}),
        },
      };
      break;
    case 'add_workflow_step':
      next.workflow.steps.push(buildWorkflowStep(payload));
      break;
    case 'update_workflow_step': {
      const stepId = String(payload.stepId || payload.id || '');
      next.workflow.steps = next.workflow.steps.map((step) =>
        step.id === stepId
          ? {
              ...step,
              name: payload.name != null ? String(payload.name) : step.name,
              actionType:
                (payload.actionType as WorkflowStepV2['actionType']) ||
                step.actionType,
              allowedRoles: Array.isArray(payload.allowedRoles)
                ? payload.allowedRoles.map((item) => String(item))
                : step.allowedRoles,
              requiredApprovals:
                payload.requiredApprovals != null
                  ? Number(payload.requiredApprovals)
                  : step.requiredApprovals,
              ...(payload.meta &&
              typeof payload.meta === 'object' &&
              !Array.isArray(payload.meta)
                ? { meta: payload.meta as Record<string, unknown> }
                : {}),
            }
          : step
      );
      break;
    }
    case 'remove_workflow_step': {
      const stepId = String(payload.stepId || payload.id || '');
      next.workflow.steps = next.workflow.steps.filter(
        (step) => step.id !== stepId
      );
      break;
    }
    case 'set_payment_config':
      next.payment = {
        ...next.payment,
        ...(payload || {}),
      };
      break;
    case 'set_behavior_hooks':
      next.behaviorHooks = {
        ...next.behaviorHooks,
        ...(payload || {}),
      };
      break;
    case 'set_analysis_profile':
      next.analysis = {
        domain:
          (payload.domain as NonNullable<
            ModuleDraftV2['analysis']
          >['domain']) || next.analysis?.domain,
        dataNature:
          (payload.dataNature as NonNullable<
            ModuleDraftV2['analysis']
          >['dataNature']) || next.analysis?.dataNature,
      };
      break;
    default:
      return current;
  }

  next.updatedAt = new Date().toISOString();
  next.status = evaluateDraftReadiness(next).isReady ? 'ready' : 'draft';
  return next;
};

export const createEmptyDraft = (
  seed?: Partial<ModuleDraftV2>
): ModuleDraftV2 => {
  const now = new Date().toISOString();
  const base: ModuleDraftV2 = {
    id: `draft_${Date.now().toString(36)}`,
    version: 2,
    status: 'draft',
    updatedAt: now,
    metadata: {
      projectName: '',
      tags: [],
      additionalTags: [],
      security: 'private',
      accessibility: ['api', 'web', 'embedded'],
    },
    fields: [],
    ui: {
      style: 'default',
      wizardMode: false,
      showProgressBar: false,
      primaryColor: '#3b82f6',
      secondaryColor: '#dbeafe',
      companyLogoUrl: '',
      conversationTitle: '',
      conversationDescription: '',
      theme: 'default',
    },
    perm: {
      enabled: false,
      trackingMode: 'none',
      requireNodeId: true,
      requireMonth: true,
      autoGenerateCalendar: true,
    },
    workflow: {
      enabled: false,
      steps: [],
      notifications: {
        onEveryIncident: false,
      },
    },
    payment: {
      enabled: false,
      mode: 'none',
      currency: 'NGN',
      collectionStage: 'submission',
      policies: [],
      config: {
        enabled: false,
        enabledChannels: [],
      },
    },
    behaviorHooks: {},
    analysis: {
      domain: 'custom',
      dataNature: 'hybrid',
    },
  };

  return {
    ...base,
    ...seed,
    metadata: { ...base.metadata, ...(seed?.metadata || {}) },
    ui: { ...base.ui, ...(seed?.ui || {}) },
    perm: { ...base.perm, ...(seed?.perm || {}) },
    workflow: { ...base.workflow, ...(seed?.workflow || {}) },
    payment: {
      ...base.payment,
      ...(seed?.payment || {}),
      policies: Array.isArray(seed?.payment?.policies)
        ? [...seed.payment.policies]
        : [...(base.payment.policies || [])],
      config: normalizePaymentConfig(
        seed?.payment?.config || base.payment.config
      ),
    },
    behaviorHooks: { ...base.behaviorHooks, ...(seed?.behaviorHooks || {}) },
    fields: seed?.fields ? [...seed.fields] : [],
  };
};

export const initialModuleDraftHistoryState: ModuleDraftHistoryState = {
  present: null,
  past: [],
  future: [],
  lastOperation: null,
};

export const moduleDraftReducer = (
  state: ModuleDraftHistoryState,
  action: ModuleDraftAction
): ModuleDraftHistoryState => {
  switch (action.type) {
    case 'initialize':
      return {
        present: cloneDraft(action.draft),
        past: [],
        future: [],
        lastOperation: null,
      };
    case 'apply_operation': {
      if (!state.present) return state;
      const nextPresent = applyOperationToDraft(
        state.present,
        action.operation
      );
      if (nextPresent === state.present) return state;
      return {
        present: nextPresent,
        past: [...state.past, cloneDraft(state.present)],
        future: [],
        lastOperation: action.operation,
      };
    }
    case 'undo': {
      if (state.past.length === 0 || !state.present) return state;
      const previous = state.past[state.past.length - 1];
      return {
        present: cloneDraft(previous),
        past: state.past.slice(0, -1),
        future: [cloneDraft(state.present), ...state.future],
        lastOperation: null,
      };
    }
    case 'redo': {
      if (state.future.length === 0 || !state.present) return state;
      const [next, ...rest] = state.future;
      return {
        present: cloneDraft(next),
        past: [...state.past, cloneDraft(state.present)],
        future: rest,
        lastOperation: null,
      };
    }
    case 'reset':
      return initialModuleDraftHistoryState;
    default:
      return state;
  }
};
