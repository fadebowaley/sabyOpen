import 'server-only';
import { z } from 'zod';
import {
  adaptTemplateToModuleDraftV2,
  getModuleTemplateById,
  listModuleTemplateCatalog,
} from './module-template-adapter';

type BlueprintSection = 'all' | 'fields' | 'workflow' | 'perm';

type GenerateBlueprintInput = {
  brief: string;
  existingDraft?: Record<string, any> | null;
  section?: BlueprintSection;
};

type GenerateBlueprintOutput = {
  draft: Record<string, any>;
  summary: string;
  assumptions: string[];
  missingDecisions: string[];
  suggestedNextPrompts: string[];
};

type TemplateMatch = {
  id: string;
  name: string;
  score: number;
};

const ALLOWED_FIELD_KINDS = [
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
  'header',
  'paragraph',
  'button',
] as const;

const moduleDraftSchema = z.object({
  id: z.string().min(1),
  version: z.literal(2),
  status: z.enum(['draft', 'ready', 'published']),
  updatedAt: z.string().min(1),
  metadata: z.object({
    projectName: z.string().min(1).max(100),
    tags: z.array(z.string()).default([]),
    additionalTags: z.array(z.string()).default([]),
    security: z.enum(['public', 'private']),
    accessibility: z
      .array(z.enum(['web', 'api', 'embedded', 'javascript', 'mobile']))
      .default(['api', 'web', 'embedded']),
  }),
  fields: z.array(
    z.object({
      id: z.string().min(1),
      key: z.string().min(1),
      label: z.string().min(1),
      kind: z.enum(ALLOWED_FIELD_KINDS),
      placeholder: z.string().optional(),
      helpText: z.string().optional(),
      options: z.array(z.string()).optional(),
      validation: z
        .object({
          required: z.boolean().optional(),
          minLength: z.number().optional(),
          maxLength: z.number().optional(),
          min: z.number().optional(),
          max: z.number().optional(),
          pattern: z.string().optional(),
          customMessage: z.string().optional(),
        })
        .optional(),
      layout: z
        .object({
          colSpan: z.number().min(1).max(4).optional(),
          order: z.number().min(1).optional(),
        })
        .optional(),
    })
  ),
  ui: z.object({
    style: z.string().default('default'),
    wizardMode: z.boolean().default(true),
    showProgressBar: z.boolean().default(true),
    primaryColor: z.string().default('#3b82f6'),
    theme: z.string().default('default'),
  }),
  perm: z.object({
    enabled: z.boolean().default(false),
    trackingMode: z.enum(['none', 'daily', 'weekly']).default('none'),
    requireNodeId: z.boolean().default(true),
    requireMonth: z.boolean().default(true),
    autoGenerateCalendar: z.boolean().default(false),
    calendar: z
      .object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        allowBackdating: z.boolean().optional(),
      })
      .optional(),
  }),
  workflow: z.object({
    enabled: z.boolean().default(false),
    notifications: z
      .object({
        onEveryIncident: z.boolean().optional(),
      })
      .optional(),
    steps: z.array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        actionType: z.enum([
          'SUBMIT',
          'REVIEW',
          'APPROVE',
          'ESCALATE',
          'NOTIFY',
        ]),
        allowedRoles: z.array(z.string()).default([]),
        requiredApprovals: z.number().min(1).default(1),
        order: z.number().min(1),
      })
    ),
  }),
  payment: z.object({
    enabled: z.boolean().default(false),
    mode: z.enum(['none', 'fixed', 'formula']).default('none'),
    fixedAmount: z.number().optional(),
    formula: z.string().optional(),
    currency: z.string().optional(),
    collectionStage: z
      .enum(['before_submit', 'before_approval', 'after_approval'])
      .optional(),
    config: z
      .object({
        enabled: z.boolean().default(false),
        defaultChannel: z
          .enum(['sabypipe', 'paystack', 'flutterwave'])
          .optional(),
        enabledChannels: z
          .array(z.enum(['sabypipe', 'paystack', 'flutterwave']))
          .default([]),
        processorSettings: z.record(z.any()).optional(),
      })
      .optional(),
    policies: z
      .array(
        z.object({
          id: z.string().optional(),
          name: z.string().optional(),
          active: z.boolean().optional(),
          priority: z.number().optional(),
          scopeType: z
            .enum(['all', 'node', 'family', 'level', 'category'])
            .optional(),
          scopeRef: z.string().optional(),
          approverRoles: z.array(z.string()).optional(),
          mode: z.enum(['steady', 'active', 'fixed', 'dynamic']).optional(),
          fixedAmount: z.number().optional(),
          formula: z.string().optional(),
          activeConfig: z
            .object({
              deriveFrom: z
                .enum([
                  'field_percentage',
                  'expression',
                  'node_attribute',
                  'combined',
                ])
                .optional(),
              fieldKey: z.string().optional(),
              percentage: z.number().optional(),
              nodeAttributeKey: z.string().optional(),
              expression: z.string().optional(),
              conditionExpression: z.string().optional(),
            })
            .optional(),
          settings: z.record(z.any()).optional(),
          conditions: z.array(z.string()).optional(),
          breakdown: z
            .array(
              z.object({
                id: z.string().optional(),
                recipientType: z
                  .enum([
                    'node',
                    'family',
                    'level',
                    'category',
                    'tenant',
                    'platform',
                  ])
                  .optional(),
                recipientRef: z.string().optional(),
                mode: z.enum(['percentage', 'fixed']).optional(),
                value: z.number().optional(),
                note: z.string().optional(),
              })
            )
            .optional(),
          enforcement: z
            .object({
              requiredOnSubmission: z.boolean().optional(),
              blockSubmissionOnFailure: z.boolean().optional(),
            })
            .optional(),
        })
      )
      .optional(),
  }),
  behaviorHooks: z
    .object({
      onLoad: z.string().optional(),
      onChange: z.string().optional(),
      beforeSubmit: z.string().optional(),
      afterSubmit: z.string().optional(),
      customValidation: z.string().optional(),
      utilities: z.array(z.record(z.any())).optional(),
      dateTriggers: z.array(z.record(z.any())).optional(),
      filePolicies: z.array(z.record(z.any())).optional(),
    })
    .default({}),
  analysis: z
    .object({
      domain: z
        .enum(['finance', 'attendance', 'hr', 'operations', 'custom'])
        .optional(),
      dataNature: z.enum(['qualitative', 'quantitative', 'hybrid']).optional(),
    })
    .optional(),
});

const normalizeFieldKey = (value: string) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const TEMPLATE_WEAK_TOKENS = new Set([
  'form',
  'module',
  'project',
  'template',
  'create',
  'build',
  'design',
  'generate',
  'new',
  'with',
  'for',
  'and',
  'data',
  'report',
  'registration',
  'submission',
  'management',
]);

const tokenize = (value: string) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .map((x) => x.trim())
    .filter(Boolean);

const extractProjectNameFromBrief = (brief: string) => {
  const raw = String(brief || '').trim();
  if (!raw) return '';
  const explicit =
    raw.match(
      /\b(?:named|called)\s+["']?(.+?)["']?(?=\s+\b(with|for|fields?|using|that)\b|$)/i
    ) || raw.match(/\b(?:module|project|form)\s+["']([^"']+)["']/i);
  if (explicit?.[1]) return String(explicit[1]).trim();
  const cleaned = raw
    .replace(/^(please\s+)?(create|build|design|generate)\s+(a|an)?\s*/i, '')
    .replace(/\b(module|project|form)\b/gi, '')
    .trim();
  return cleaned.slice(0, 90);
};

const matchTemplateFromBrief = (brief: string): TemplateMatch | null => {
  const catalog = listModuleTemplateCatalog(200);
  const tokens = tokenize(brief);
  if (!tokens.length) return null;

  const strongTokens = tokens.filter(
    (t) => t.length >= 4 && !TEMPLATE_WEAK_TOKENS.has(t)
  );
  const weakTokens = tokens.filter((t) => !strongTokens.includes(t));
  let best: TemplateMatch | null = null;

  for (const template of catalog) {
    const blob = `${template.id} ${template.name} ${template.industry} ${template.category} ${template.tags.join(' ')}`;
    const candidateTokens = new Set(tokenize(blob));
    let score = 0;

    for (const token of strongTokens) {
      if (candidateTokens.has(token)) score += 4;
    }
    for (const token of weakTokens) {
      if (candidateTokens.has(token)) score += 1;
    }
    const normalizedName = String(template.name || '').toLowerCase();
    const normalizedId = String(template.id || '').toLowerCase();
    const input = String(brief || '').toLowerCase();
    if (input.includes(normalizedId)) score += 8;
    if (input.includes(normalizedName)) score += 10;

    if (!best || score > best.score) {
      best = {
        id: String(template.id),
        name: String(template.name),
        score,
      };
    }
  }

  // Only accept confident matches with at least one strong token overlap.
  if (!best) return null;
  const hasStrongOverlap = best.score >= 4;
  const confident = best.score >= 4;
  if (!hasStrongOverlap || !confident) return null;
  return best;
};

const normalizeFieldOptions = (rawOptions: any): string[] | undefined => {
  if (!Array.isArray(rawOptions)) return undefined;
  const values = rawOptions
    .map((option) => {
      if (typeof option === 'string' || typeof option === 'number') {
        return String(option).trim();
      }
      if (option && typeof option === 'object') {
        const item = option as Record<string, any>;
        const label = item.label ?? item.name ?? item.value ?? item.id;
        return label == null ? '' : String(label).trim();
      }
      return '';
    })
    .filter(Boolean);
  return values.length ? values : undefined;
};

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const getCopilotAgentCandidates = () => {
  const configured = [
    process.env.INTERNAL_COPILOT_URL,
    process.env.COPILOT_AGENT_URL,
    process.env.NEXT_PUBLIC_COPILOT_AGENT_URL,
  ].filter((value): value is string => Boolean(value && value.trim()));
  const defaults = [
    'http://copilot:3333',
    'http://saby-local-copilot:3333',
    'http://host.docker.internal:3333',
    'http://localhost:3333',
  ];
  return Array.from(
    new Set(
      [...configured, ...defaults].map((value) => trimTrailingSlash(value))
    )
  );
};

const emptyDraft = () => ({
  id: `draft_${Date.now().toString(36)}`,
  version: 2,
  status: 'draft',
  updatedAt: new Date().toISOString(),
  metadata: {
    projectName: 'Untitled Module',
    tags: [],
    additionalTags: [],
    security: 'private',
    accessibility: ['api', 'web', 'embedded'],
  },
  fields: [],
  ui: {
    style: 'default',
    wizardMode: true,
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
    enabled: false,
    notifications: {
      onEveryIncident: false,
    },
    steps: [],
  },
  payment: {
    enabled: false,
    mode: 'none',
    currency: 'NGN',
    collectionStage: 'before_submit',
    config: {
      enabled: false,
      enabledChannels: [],
    },
    policies: [],
  },
  behaviorHooks: {},
  analysis: {
    domain: 'custom',
    dataNature: 'hybrid',
  },
});

const mergeSection = ({
  base,
  generated,
  section,
}: {
  base: Record<string, any>;
  generated: Record<string, any>;
  section: BlueprintSection;
}) => {
  if (section === 'all') return generated;
  if (!base || typeof base !== 'object') return generated;

  if (section === 'fields') {
    return {
      ...base,
      fields: generated.fields || base.fields || [],
      updatedAt: new Date().toISOString(),
    };
  }
  if (section === 'workflow') {
    return {
      ...base,
      workflow: generated.workflow ||
        base.workflow || { enabled: false, steps: [] },
      updatedAt: new Date().toISOString(),
    };
  }
  if (section === 'perm') {
    return {
      ...base,
      perm: generated.perm ||
        base.perm || { enabled: false, trackingMode: 'none' },
      updatedAt: new Date().toISOString(),
    };
  }
  return generated;
};

const extractJsonObject = (text: string) => {
  const raw = String(text || '').trim();
  if (!raw) throw new Error('Empty LLM response.');

  const normalizeCandidate = (value: string) =>
    value
      .replace(/^\uFEFF/, '')
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .trim();

  const sanitizeLikelyJson = (value: string) =>
    value
      // remove trailing commas before object/array close
      .replace(/,\s*([}\]])/g, '$1')
      .trim();

  const tryParse = (candidate: string) => {
    const normalized = normalizeCandidate(candidate);
    if (!normalized) return null;
    try {
      return JSON.parse(normalized);
    } catch {
      try {
        return JSON.parse(sanitizeLikelyJson(normalized));
      } catch {
        return null;
      }
    }
  };

  const findBalancedJsonObject = (value: string): string | null => {
    const start = value.indexOf('{');
    if (start < 0) return null;
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = start; i < value.length; i += 1) {
      const ch = value[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === '\\') {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (ch === '{') depth += 1;
      else if (ch === '}') {
        depth -= 1;
        if (depth === 0) return value.slice(start, i + 1);
      }
    }
    return null;
  };

  const direct = tryParse(raw);
  if (direct) return direct;

  const fencedBlocks = raw.match(/```(?:json)?\s*([\s\S]*?)```/gi) || [];
  for (const block of fencedBlocks) {
    const body = block
      .replace(/```(?:json)?/i, '')
      .replace(/```$/, '')
      .trim();
    const parsed = tryParse(body);
    if (parsed) return parsed;
  }

  const balanced = findBalancedJsonObject(raw);
  if (balanced) {
    const parsed = tryParse(balanced);
    if (parsed) return parsed;
  }

  const preview = raw.slice(0, 220).replace(/\s+/g, ' ');
  throw new Error(
    `Could not parse JSON from LLM response. Preview: ${preview}`
  );
};

const normalizeDraft = (draft: Record<string, any>) => {
  const baseline = emptyDraft();
  const workflowSteps = Array.isArray(draft?.workflow?.steps)
    ? draft.workflow.steps
    : [];
  const normalized = {
    ...baseline,
    ...draft,
    id: String(draft?.id || `draft_${Date.now().toString(36)}`),
    version: 2,
    status: ['draft', 'ready', 'published'].includes(String(draft?.status))
      ? draft.status
      : 'draft',
    updatedAt: new Date().toISOString(),
    metadata: {
      ...baseline.metadata,
      ...(draft?.metadata || {}),
      projectName: String(
        draft?.metadata?.projectName ||
          draft?.projectName ||
          baseline.metadata.projectName
      ).slice(0, 100),
      tags: Array.isArray(draft?.metadata?.tags)
        ? draft.metadata.tags.map((value: any) => String(value)).filter(Boolean)
        : baseline.metadata.tags,
      additionalTags: Array.isArray(draft?.metadata?.additionalTags)
        ? draft.metadata.additionalTags
            .map((value: any) => String(value))
            .filter(Boolean)
        : baseline.metadata.additionalTags,
      accessibility: Array.isArray(draft?.metadata?.accessibility)
        ? draft.metadata.accessibility
            .map((value: any) => String(value))
            .filter((value: string) =>
              ['web', 'api', 'embedded', 'javascript', 'mobile'].includes(value)
            )
        : baseline.metadata.accessibility,
    },
    fields: (Array.isArray(draft?.fields) ? draft.fields : []).map(
      (field: any, index: number) => ({
        ...field,
        id: String(field?.id || `fld_${index + 1}`),
        key: normalizeFieldKey(
          String(field?.key || field?.label || `field_${index + 1}`)
        ),
        label: String(field?.label || `Field ${index + 1}`),
        kind: ALLOWED_FIELD_KINDS.includes(field?.kind) ? field.kind : 'text',
        options: normalizeFieldOptions(field?.options),
        validation: {
          ...(field?.validation || {}),
          required: Boolean(field?.validation?.required),
        },
        layout: {
          colSpan: Number(field?.layout?.colSpan || 1),
          order: Number(field?.layout?.order || index + 1),
        },
      })
    ),
    workflow: {
      ...baseline.workflow,
      ...(draft?.workflow || {}),
      enabled: Boolean(draft?.workflow?.enabled),
      notifications: {
        ...(baseline.workflow?.notifications || {}),
        ...(draft?.workflow?.notifications || {}),
        onEveryIncident: Boolean(
          draft?.workflow?.notifications?.onEveryIncident
        ),
      },
      steps: workflowSteps.map((step: any, index: number) => ({
        id: String(step?.id || `wf_${index + 1}`),
        name: String(step?.name || `Step ${index + 1}`),
        actionType: [
          'SUBMIT',
          'REVIEW',
          'APPROVE',
          'ESCALATE',
          'NOTIFY',
        ].includes(String(step?.actionType || '').toUpperCase())
          ? String(step?.actionType || '').toUpperCase()
          : 'REVIEW',
        allowedRoles: Array.isArray(step?.allowedRoles)
          ? step.allowedRoles.map((role: any) => String(role)).filter(Boolean)
          : step?.allowedRoles
            ? [String(step.allowedRoles)]
            : [],
        requiredApprovals: Math.max(1, Number(step?.requiredApprovals || 1)),
        order: Math.max(1, Number(step?.order || index + 1)),
      })),
    },
    payment: {
      ...baseline.payment,
      ...(draft?.payment || {}),
      enabled: Boolean(draft?.payment?.enabled),
      mode: ['none', 'fixed', 'formula'].includes(String(draft?.payment?.mode))
        ? draft.payment.mode
        : 'none',
      fixedAmount:
        draft?.payment?.fixedAmount == null
          ? undefined
          : Number.isFinite(Number(draft.payment.fixedAmount))
            ? Number(draft.payment.fixedAmount)
            : undefined,
      formula:
        draft?.payment?.formula == null
          ? undefined
          : String(draft.payment.formula || '').trim(),
      currency:
        draft?.payment?.currency == null
          ? undefined
          : String(draft.payment.currency || '').trim(),
      collectionStage: [
        'before_submit',
        'before_approval',
        'after_approval',
      ].includes(String(draft?.payment?.collectionStage))
        ? draft.payment.collectionStage
        : undefined,
      config:
        draft?.payment?.config && typeof draft.payment.config === 'object'
          ? {
              enabled: Boolean(draft.payment.config.enabled),
              defaultChannel: ['sabypipe', 'paystack', 'flutterwave'].includes(
                String(draft.payment.config.defaultChannel || '').toLowerCase()
              )
                ? String(
                    draft.payment.config.defaultChannel || ''
                  ).toLowerCase()
                : undefined,
              enabledChannels: Array.isArray(
                draft.payment.config.enabledChannels
              )
                ? draft.payment.config.enabledChannels
                    .map((channel: any) => String(channel || '').toLowerCase())
                    .filter((channel: string) =>
                      ['sabypipe', 'paystack', 'flutterwave'].includes(channel)
                    )
                : [],
              processorSettings:
                draft.payment.config.processorSettings &&
                typeof draft.payment.config.processorSettings === 'object'
                  ? draft.payment.config.processorSettings
                  : undefined,
            }
          : undefined,
      policies: Array.isArray(draft?.payment?.policies)
        ? draft.payment.policies.map((policy: any, index: number) => ({
            id: String(policy?.id || `pay_policy_${index + 1}`),
            name: String(policy?.name || `Policy ${index + 1}`),
            active: policy?.active == null ? true : Boolean(policy.active),
            priority: Math.max(1, Number(policy?.priority || index + 1)),
            scopeType: ['all', 'node', 'family', 'level', 'category'].includes(
              String(policy?.scopeType)
            )
              ? policy.scopeType
              : 'node',
            scopeRef: String(policy?.scopeRef || ''),
            approverRoles: Array.isArray(policy?.approverRoles)
              ? policy.approverRoles
                  .map((role: any) => String(role))
                  .filter(Boolean)
              : [],
            mode:
              String(policy?.mode) === 'dynamic'
                ? 'active'
                : String(policy?.mode) === 'fixed'
                  ? 'steady'
                  : ['steady', 'active'].includes(String(policy?.mode))
                    ? policy.mode
                    : 'steady',
            fixedAmount:
              policy?.fixedAmount == null
                ? undefined
                : Number.isFinite(Number(policy.fixedAmount))
                  ? Number(policy.fixedAmount)
                  : undefined,
            formula:
              policy?.formula == null
                ? undefined
                : String(policy.formula || '').trim(),
            activeConfig:
              policy?.activeConfig && typeof policy.activeConfig === 'object'
                ? {
                    deriveFrom: [
                      'field_percentage',
                      'expression',
                      'node_attribute',
                      'combined',
                    ].includes(String(policy.activeConfig.deriveFrom))
                      ? String(policy.activeConfig.deriveFrom)
                      : undefined,
                    fieldKey:
                      policy.activeConfig.fieldKey == null
                        ? undefined
                        : String(policy.activeConfig.fieldKey || '').trim(),
                    percentage:
                      policy.activeConfig.percentage == null
                        ? undefined
                        : Number.isFinite(
                              Number(policy.activeConfig.percentage)
                            )
                          ? Number(policy.activeConfig.percentage)
                          : undefined,
                    nodeAttributeKey:
                      policy.activeConfig.nodeAttributeKey == null
                        ? undefined
                        : String(
                            policy.activeConfig.nodeAttributeKey || ''
                          ).trim(),
                    expression:
                      policy.activeConfig.expression == null
                        ? undefined
                        : String(policy.activeConfig.expression || '').trim(),
                    conditionExpression:
                      policy.activeConfig.conditionExpression == null
                        ? undefined
                        : String(
                            policy.activeConfig.conditionExpression || ''
                          ).trim(),
                  }
                : undefined,
            settings:
              policy?.settings && typeof policy.settings === 'object'
                ? policy.settings
                : undefined,
            conditions: Array.isArray(policy?.conditions)
              ? policy.conditions.map((x: any) => String(x)).filter(Boolean)
              : [],
            breakdown: Array.isArray(policy?.breakdown)
              ? policy.breakdown.map((line: any, lineIndex: number) => ({
                  id: String(line?.id || `line_${lineIndex + 1}`),
                  recipientType: [
                    'node',
                    'family',
                    'level',
                    'category',
                    'tenant',
                    'platform',
                  ].includes(String(line?.recipientType))
                    ? line.recipientType
                    : 'platform',
                  recipientRef:
                    line?.recipientRef == null
                      ? undefined
                      : String(line.recipientRef || ''),
                  mode: ['percentage', 'fixed'].includes(String(line?.mode))
                    ? line.mode
                    : 'percentage',
                  value: Number.isFinite(Number(line?.value))
                    ? Number(line.value)
                    : 0,
                  note:
                    line?.note == null ? undefined : String(line.note || ''),
                }))
              : [],
            enforcement: {
              requiredOnSubmission:
                policy?.enforcement?.requiredOnSubmission == null
                  ? true
                  : Boolean(policy.enforcement.requiredOnSubmission),
              blockSubmissionOnFailure:
                policy?.enforcement?.blockSubmissionOnFailure == null
                  ? true
                  : Boolean(policy.enforcement.blockSubmissionOnFailure),
            },
          }))
        : [],
    },
    behaviorHooks: {
      ...(baseline.behaviorHooks || {}),
      ...(draft?.behaviorHooks || {}),
      utilities: Array.isArray(draft?.behaviorHooks?.utilities)
        ? draft.behaviorHooks.utilities
        : [],
      dateTriggers: Array.isArray(draft?.behaviorHooks?.dateTriggers)
        ? draft.behaviorHooks.dateTriggers
        : [],
      filePolicies: Array.isArray(draft?.behaviorHooks?.filePolicies)
        ? draft.behaviorHooks.filePolicies
        : [],
    },
  };
  return normalized;
};

const buildPolicyPrompt = ({
  brief,
  section,
  existingDraft,
  validationErrors,
}: {
  brief: string;
  section: BlueprintSection;
  existingDraft: Record<string, any> | null;
  validationErrors: string[];
}) => {
  const policy = {
    goal: 'Generate a rich FINAL module draft JSON in a SINGLE PASS that strictly fits Saby module system.',
    generationMode: 'single_pass_final_only',
    hardRules: {
      output: 'Return ONLY JSON. No markdown. No prose outside JSON.',
      singlePass: [
        'Return final enriched draft in one response.',
        'Do not return minimal draft.',
        'Do not return TODO/TBC/MISSING placeholders.',
        'Prefer completeness; user can remove unwanted fields later.',
      ],
      format: {
        root: [
          'draft',
          'summary',
          'assumptions',
          'missingDecisions',
          'suggestedNextPrompts',
        ],
        draftVersion: 2,
      },
      module: {
        status: ['draft', 'ready', 'published'],
        security: ['public', 'private'],
        accessibility: ['web', 'api', 'embedded', 'javascript', 'mobile'],
        fieldKinds: ALLOWED_FIELD_KINDS,
        workflowActionTypes: [
          'SUBMIT',
          'REVIEW',
          'APPROVE',
          'ESCALATE',
          'NOTIFY',
        ],
        permTrackingMode: ['none', 'daily', 'weekly'],
        paymentMode: ['none', 'fixed', 'formula'],
        paymentPolicyScopeType: ['all', 'node', 'family', 'level', 'category'],
        paymentPolicyMode: ['steady', 'active'],
      },
      quality: [
        'No duplicate field keys.',
        'Every field must have id,key,label,kind.',
        'If workflow.enabled=true then at least 1 step.',
        'If payment policy mode is steady then fixedAmount > 0.',
        'If payment policy mode is active then formula is non-empty.',
        'projectName must be <= 100 chars.',
      ],
      richnessCoverage: [
        'Include broad useful coverage for unknown requests.',
        'Prefer fields spanning identity/context, contact, timeline/date, metrics/number, status/decision.',
        'Include evidence/file and consent/compliance fields when applicable.',
        'For registration-like flows, include emergency contact and onboarding status.',
        'Do not output attendance/church-specific templates unless the user brief explicitly requests attendance/church context.',
      ],
      sectionMode: `Current section mode: ${section}. If section is not all, keep other sections compatible with existing draft context.`,
    },
    userBrief: brief,
    existingDraft,
    previousValidationErrors: validationErrors,
    responseShape: {
      draft: 'ModuleDraftV2 JSON object',
      summary: 'short summary string',
      assumptions: ['string'],
      missingDecisions: ['string'],
      suggestedNextPrompts: ['string'],
    },
  };

  return [
    '[tool_mode] /module',
    'Generate a complete module draft JSON now. Do not ask follow-up template questions.',
    JSON.stringify(policy, null, 2),
  ].join('\n');
};

const callCopilotAgent = async ({
  authToken,
  message,
}: {
  authToken: string;
  message: string;
}) => {
  class AgentHttpError extends Error {}
  const candidates = getCopilotAgentCandidates();
  let lastError: unknown = null;

  for (const baseUrl of candidates) {
    try {
      const response = await fetch(`${baseUrl}/agent`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context: { toolMode: '/module' },
        }),
      });
      const data: any = await response.json().catch(() => ({
        ok: false,
        error: 'Invalid response from Saby agent',
      }));
      if (!response.ok || data?.ok === false) {
        // Terminal error: upstream is reachable, so rotating hosts won't help.
        throw new AgentHttpError(
          data?.error || `Agent request failed (${response.status})`
        );
      }
      const answer = String(data?.answer || '').trim();
      if (!answer) throw new Error('Agent returned empty response.');
      return answer;
    } catch (error) {
      if (error instanceof AgentHttpError) {
        throw error;
      }
      lastError = error;
    }
  }

  throw new Error(
    lastError instanceof Error
      ? `${lastError.message}. Tried: ${candidates.join(', ')}`
      : `Unable to reach Saby agent service. Tried: ${candidates.join(', ')}`
  );
};

export async function generateModuleBlueprintViaBackend({
  backendBaseUrl: _backendBaseUrl,
  authToken,
  input,
}: {
  backendBaseUrl: string;
  authToken: string;
  input: GenerateBlueprintInput;
}): Promise<GenerateBlueprintOutput> {
  const section = input.section || 'all';
  const existingDraft =
    input.existingDraft && typeof input.existingDraft === 'object'
      ? input.existingDraft
      : emptyDraft();

  // Template-only generation policy:
  // 1) Try a direct template match.
  // 2) If no match, return available template options (no generic/LLM generation).
  // 3) Do not call LLM in this flow.
  if (section === 'all') {
    const matched = matchTemplateFromBrief(input.brief);
    if (matched) {
      const template = getModuleTemplateById(matched.id);
      if (template) {
        const adapted = normalizeDraft(adaptTemplateToModuleDraftV2(template));
        const renamed = extractProjectNameFromBrief(input.brief);
        if (renamed) {
          adapted.metadata = {
            ...(adapted.metadata || {}),
            projectName: renamed,
          };
        }
        return {
          draft: adapted,
          summary: `[Source: Template Library] Loaded template "${matched.name}" and prepared a module draft.`,
          assumptions: [
            'Matched your request to a template in the module library.',
            'You can now refine fields, workflow, rules, utilities, and payment.',
          ],
          missingDecisions: [],
          suggestedNextPrompts: [
            'open module workspace',
            'enable workflow',
            'set security private',
            'preview payload',
          ],
        };
      }
    }

    const available = listModuleTemplateCatalog(200);
    const industries = Array.from(
      new Set(available.map((item) => item.industry))
    ).sort((a, b) => a.localeCompare(b));
    return {
      draft: normalizeDraft(existingDraft),
      summary:
        `[Source: Template Library] No direct template match found. ` +
        `Template generation is strict library-only. Available industries: ${industries.join(', ')}.`,
      assumptions: [
        'Template-only generation mode is active.',
        'When no template matches, user should pick an industry and template from library.',
      ],
      missingDecisions: [],
      suggestedNextPrompts: [
        'choose industry Non-Profit & Faith-Based',
        'choose industry Healthcare & Life Sciences',
        'list templates in selected industry',
        'pick template by number',
      ],
    };
  }

  return {
    draft: normalizeDraft(existingDraft),
    summary:
      '[Source: Template Mode] Section regeneration is disabled in template-only mode. Continue editing manually in Module Workspace.',
    assumptions: [],
    missingDecisions: [],
    suggestedNextPrompts: ['open module workspace', 'show module draft json'],
  };
}
