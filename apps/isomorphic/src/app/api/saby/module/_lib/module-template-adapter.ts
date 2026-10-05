import 'server-only';

import {
  formTemplates,
  type FormTemplate,
} from '@/app/(berrylium)/haloform/templates/formTemplates';
import { toTemplateV2, type TemplateV2 } from './template-v2';

const EXCLUDED_TEMPLATE_IDS = new Set(['kyc-onboarding']);

export type ModuleTemplateSummary = {
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
  payloadVersion: number;
  fieldCount: number;
  readiness: {
    workflow: boolean;
    paymentPolicy: boolean;
    paymentConfig: boolean;
    utilities: boolean;
  };
  taxonomy: {
    isNonProfit: boolean;
    isChurch: boolean;
  };
};

const normalizeFieldKey = (value: string) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const normalizeElementKind = (type: string) => {
  const t = String(type || '').toLowerCase();
  if (t === 'datepicker') return 'date';
  if (t === 'fileupload') return 'file';
  if (t === 'dropdown') return 'select';
  if (t === 'rating') return 'number';
  if (t === 'header') return 'header';
  if (t === 'paragraph') return 'paragraph';
  if (
    [
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
      'button',
    ].includes(t)
  ) {
    return t;
  }
  return 'text';
};

const normalizeTemplateOption = (option: any): string => {
  if (option == null) return '';
  if (
    typeof option === 'string' ||
    typeof option === 'number' ||
    typeof option === 'boolean'
  ) {
    return String(option);
  }
  if (typeof option === 'object') {
    return String(
      option.label ?? option.value ?? option.name ?? option.id ?? ''
    ).trim();
  }
  return '';
};

const toDraftPaymentMode = (
  defaults: TemplateV2['paymentPolicyDefaults']
): 'none' | 'fixed' | 'formula' => {
  if (!defaults.enabled) return 'none';
  if (defaults.mode === 'steady') return 'fixed';
  return 'formula';
};

const assertTemplateV2Shape = (template: TemplateV2) => {
  if (!template?.templateMeta?.id) {
    throw new Error('Invalid template payload: templateMeta.id missing');
  }
  if (!Array.isArray(template?.formStructure?.elements)) {
    throw new Error(
      `Invalid template payload (${template.templateMeta.id}): formStructure.elements missing`
    );
  }
  if (!template?.workflowPolicyDefaults) {
    throw new Error(
      `Invalid template payload (${template.templateMeta.id}): workflowPolicyDefaults missing`
    );
  }
  if (!template?.paymentPolicyDefaults) {
    throw new Error(
      `Invalid template payload (${template.templateMeta.id}): paymentPolicyDefaults missing`
    );
  }
  if (!template?.paymentConfigDefaults) {
    throw new Error(
      `Invalid template payload (${template.templateMeta.id}): paymentConfigDefaults missing`
    );
  }
  if (!template?.utilityDefaults) {
    throw new Error(
      `Invalid template payload (${template.templateMeta.id}): utilityDefaults missing`
    );
  }
};

export const listModuleTemplateCatalog = (
  limit = 24
): ModuleTemplateSummary[] => {
  return formTemplates
    .filter(
      (template) =>
        !EXCLUDED_TEMPLATE_IDS.has(String(template.id).toLowerCase())
    )
    .slice(0, Math.max(1, limit))
    .map((template) => {
      const v2 = toTemplateV2(template);
      assertTemplateV2Shape(v2);
      const templateTags = Array.isArray(v2.templateMeta.tags)
        ? v2.templateMeta.tags.map((tag) => String(tag))
        : [];
      const searchable = `${String(v2.templateMeta.name || '')} ${String(
        v2.templateMeta.category || ''
      )} ${templateTags.join(' ')}`.toLowerCase();
      const isNonProfit =
        String(v2.templateMeta.industry || '').toLowerCase() ===
          'non-profit & faith-based' || /non-?profit|faith/.test(searchable);
      const isChurch = /church|parish|offering|tithe|membership/.test(
        searchable
      );
      return {
        id: String(v2.templateMeta.id),
        name: String(v2.templateMeta.name),
        description: String(v2.templateMeta.description || ''),
        industry: String(v2.templateMeta.industry || 'General'),
        category: String(v2.templateMeta.category || 'General'),
        tags: templateTags,
        difficulty: String(v2.templateMeta.difficulty || 'intermediate'),
        estimatedTime: String(v2.templateMeta.estimatedTime || ''),
        icon: String(v2.templateMeta.icon || ''),
        preview: String(v2.templateMeta.preview || ''),
        payloadVersion: 2,
        fieldCount: Array.isArray(v2.formStructure?.elements)
          ? v2.formStructure.elements.length
          : 0,
        readiness: {
          workflow: Boolean(v2.workflowPolicyDefaults?.enabled),
          paymentPolicy: Boolean(v2.paymentPolicyDefaults?.enabled),
          paymentConfig: Boolean(v2.paymentConfigDefaults?.enabled),
          utilities: Array.isArray(v2.utilityDefaults?.suggested)
            ? v2.utilityDefaults.suggested.length > 0
            : false,
        },
        taxonomy: {
          isNonProfit,
          isChurch,
        },
      };
    });
};

export const listModuleTemplateCatalogV2 = (limit = 24): TemplateV2[] => {
  return formTemplates
    .filter(
      (template) =>
        !EXCLUDED_TEMPLATE_IDS.has(String(template.id).toLowerCase())
    )
    .slice(0, Math.max(1, limit))
    .map((template) => toTemplateV2(template));
};

export const getModuleTemplateById = (id: string): FormTemplate | null => {
  const normalized = String(id || '')
    .trim()
    .toLowerCase();
  if (!normalized) return null;
  if (EXCLUDED_TEMPLATE_IDS.has(normalized)) return null;
  return (
    formTemplates.find(
      (template) => String(template.id).toLowerCase() === normalized
    ) || null
  );
};

export const getModuleTemplateV2ById = (id: string): TemplateV2 | null => {
  const template = getModuleTemplateById(id);
  return template ? toTemplateV2(template) : null;
};

export const adaptTemplateToModuleDraftV2 = (
  templateInput: FormTemplate | TemplateV2
) => {
  const template = toTemplateV2(templateInput);
  assertTemplateV2Shape(template);
  const now = new Date().toISOString();
  const elements = Array.isArray(template.formStructure?.elements)
    ? template.formStructure.elements
    : [];
  const utilityDefaults = Array.isArray(template.utilityDefaults?.suggested)
    ? template.utilityDefaults.suggested
    : [];
  const paymentMode = toDraftPaymentMode(template.paymentPolicyDefaults);
  const firstSteadyPolicy = template.paymentPolicyDefaults.policies.find(
    (policy) => policy.mode === 'steady'
  );
  const firstActivePolicy = template.paymentPolicyDefaults.policies.find(
    (policy) => policy.mode === 'active'
  );

  return {
    id: `tpl_${String(template.templateMeta.id)}`,
    version: 2,
    status: 'draft',
    updatedAt: now,
    metadata: {
      projectName: String(template.templateMeta.name || 'Untitled Template'),
      tags: [
        String(template.templateMeta.industry || 'general').toLowerCase(),
        String(template.templateMeta.category || 'general').toLowerCase(),
      ],
      additionalTags: Array.isArray(template.templateMeta.tags)
        ? template.templateMeta.tags.map((tag) => String(tag).toLowerCase())
        : [],
      security: 'private',
      accessibility: ['api', 'web', 'embedded'],
    },
    fields: elements.map((el: any, index: number) => {
      const props = el?.properties || {};
      const label = String(
        el?.label || props?.label || el?.id || `Field ${index + 1}`
      );
      const key = normalizeFieldKey(el?.id || label) || `field_${index + 1}`;
      const options = Array.isArray(props?.options)
        ? props.options
            .map((option: any) => normalizeTemplateOption(option))
            .filter(Boolean)
        : undefined;
      const validation = props?.validation || {};
      return {
        id: String(el?.id || `fld_${index + 1}`),
        key,
        label,
        kind: normalizeElementKind(el?.type),
        placeholder: props?.placeholder ? String(props.placeholder) : undefined,
        helpText: props?.helpText ? String(props.helpText) : undefined,
        options,
        validation: {
          required: Boolean(validation?.required),
          min: validation?.min,
          max: validation?.max,
          minLength: validation?.minLength,
          maxLength: validation?.maxLength,
        },
        layout: {
          colSpan:
            Number(template.formStructure?.columnSpans?.[String(el?.id)]) > 0
              ? Number(template.formStructure?.columnSpans?.[String(el?.id)])
              : 1,
          order: index + 1,
        },
      };
    }),
    ui: {
      style: String(template.formStructure?.style || 'default'),
      wizardMode: template.formStructure?.wizardMode !== false,
      showProgressBar: true,
      primaryColor: '#3b82f6',
      theme: 'default',
    },
    perm: {
      enabled: false,
      trackingMode: 'none',
      requireNodeId: true,
      requireMonth: true,
      autoGenerateCalendar: false,
      calendar: {},
    },
    workflow: {
      enabled: Boolean(template.workflowPolicyDefaults?.enabled),
      notifications: template.workflowPolicyDefaults?.notifications || {},
      steps: Array.isArray(template.workflowPolicyDefaults?.steps)
        ? template.workflowPolicyDefaults.steps.map((step, index) => ({
            id: String(step.id || `wf_${index + 1}`),
            name: String(step.name || `Step ${index + 1}`),
            actionType:
              String(step.actionType || 'REVIEW').toUpperCase() === 'NOTIFY'
                ? 'NOTIFY'
                : String(step.actionType || 'REVIEW').toUpperCase() ===
                    'ESCALATE'
                  ? 'ESCALATE'
                  : String(step.actionType || 'REVIEW').toUpperCase() ===
                      'APPROVE'
                    ? 'APPROVE'
                    : String(step.actionType || 'REVIEW').toUpperCase() ===
                        'SUBMIT'
                      ? 'SUBMIT'
                      : 'REVIEW',
            allowedRoles: Array.isArray(step.allowedRoles)
              ? step.allowedRoles.map((role) => String(role))
              : [],
            requiredApprovals: Number(step.requiredApprovals || 1),
            order: Number(step.order || index + 1),
          }))
        : [],
    },
    payment: {
      enabled: Boolean(template.paymentPolicyDefaults?.enabled),
      mode: paymentMode,
      ...(firstSteadyPolicy?.fixedAmount != null
        ? { fixedAmount: Number(firstSteadyPolicy.fixedAmount) }
        : {}),
      ...(firstActivePolicy?.formula
        ? { formula: String(firstActivePolicy.formula) }
        : {}),
      currency: 'NGN',
      collectionStage: 'before_submit',
      config: template.paymentConfigDefaults,
      policies: Array.isArray(template.paymentPolicyDefaults?.policies)
        ? template.paymentPolicyDefaults.policies.map((policy, index) => ({
            id: String(policy.id || `pp_${index + 1}`),
            name: String(policy.name || `Policy ${index + 1}`),
            active: policy.active !== false,
            priority: Number(policy.priority || index + 1),
            scopeType: policy.scopeType || 'all',
            scopeRef: String(policy.scopeRef || 'all'),
            mode: policy.mode || 'steady',
            ...(policy.fixedAmount != null
              ? { fixedAmount: Number(policy.fixedAmount) }
              : {}),
            ...(policy.formula ? { formula: String(policy.formula) } : {}),
            settings: policy.settings || {},
            conditions: Array.isArray(policy.conditions)
              ? policy.conditions.map((condition) => String(condition))
              : [],
            enforcement: policy.enforcement || {
              requiredOnSubmission: false,
              blockSubmissionOnFailure: false,
            },
          }))
        : [],
    },
    behaviorHooks: {
      utilities: utilityDefaults.map((utility, index) => ({
        id: `util_${index + 1}`,
        type: utility,
        name: utility
          .split('_')
          .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
          .join(' '),
        enabled: false,
        priority: index + 1,
      })),
    },
    analysis: {
      domain: 'custom',
      dataNature: 'hybrid',
    },
  };
};
