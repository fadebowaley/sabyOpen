import { DraftOperation, ModuleDraftV2 } from './contracts';
import { evaluateDraftReadiness } from './moduleDraft.validators';

type ModuleIntentResult = {
  handled: boolean;
  operation?: DraftOperation;
  assistantText: string;
  chips?: Array<{ id: string; text: string }>;
};

const FIELD_KIND_MAP: Record<string, string> = {
  text: 'text',
  textarea: 'textarea',
  number: 'number',
  numeric: 'number',
  email: 'email',
  phone: 'phone',
  date: 'date',
  time: 'time',
  datetime: 'datetime',
  select: 'select',
  dropdown: 'select',
  radio: 'radio',
  checkbox: 'checkbox',
  file: 'file',
  header: 'header',
  paragraph: 'paragraph',
};

const toOperation = (
  type: DraftOperation['type'],
  payload: Record<string, unknown>
): DraftOperation => ({
  type,
  payload,
  source: 'chat',
  createdAt: new Date().toISOString(),
});

const stripModulePrefix = (raw: string) =>
  raw.replace(/^\/module\s*/i, '').trim();

const defaultHelpText = () =>
  'Module mode commands: "list templates", "use template <id>", "show template diff", "create module named <name>", "add field <label> as <type>", "set security public|private", "set tags operations,finance", "set analysis finance quantitative", "set accessibility api,mobile", "enable perm", "set perm tracking daily|weekly|none", "set calendar 2026-01-01 to 2026-12-31 backdating true|false", "enable workflow", "show module draft json", "module readiness", "preview payload", "submit module".';

export const interpretModuleDraftIntent = (
  rawMessage: string,
  draft: ModuleDraftV2
): ModuleIntentResult => {
  const raw = String(rawMessage || '').trim();
  const clean = stripModulePrefix(raw);
  const lower = clean.toLowerCase();
  if (!clean) {
    return { handled: true, assistantText: defaultHelpText() };
  }

  if (/^(help|commands|what can you do)/i.test(clean)) {
    return { handled: true, assistantText: defaultHelpText() };
  }

  if (/^(show|preview)\s+(module\s+)?draft\s+json$/i.test(clean)) {
    return {
      handled: true,
      assistantText: `Current module draft JSON:\n\n${JSON.stringify(draft, null, 2)}`,
    };
  }

  if (/^(module\s+)?readiness$/i.test(clean)) {
    const readiness = evaluateDraftReadiness(draft);
    const blockerText =
      readiness.blockers.length > 0
        ? `Blockers: ${readiness.blockers.join(' | ')}`
        : 'Blockers: none';
    const warningText =
      readiness.warnings.length > 0
        ? `Warnings: ${readiness.warnings.join(' | ')}`
        : 'Warnings: none';
    return {
      handled: true,
      assistantText: `Readiness: ${readiness.isReady ? 'ready' : 'not ready'}\n${blockerText}\n${warningText}`,
      chips: [
        { id: 'module-add-field', text: 'add field Branch Pastor as text' },
        { id: 'module-enable-perm', text: 'enable perm' },
      ],
    };
  }

  const createMatch = clean.match(/^create\s+module(?:\s+named)?\s+(.+)$/i);
  if (createMatch?.[1]) {
    const projectName = createMatch[1].trim();
    return {
      handled: true,
      operation: toOperation('create_module', { projectName }),
      assistantText: `Draft initialized for module "${projectName}".`,
      chips: [
        { id: 'module-add-field', text: 'add field Service Date as date' },
        { id: 'module-security', text: 'set security private' },
      ],
    };
  }

  const setNameMatch = clean.match(/^set\s+module\s+name\s+to\s+(.+)$/i);
  if (setNameMatch?.[1]) {
    return {
      handled: true,
      operation: toOperation('set_module_name', {
        projectName: setNameMatch[1].trim(),
      }),
      assistantText: 'Module name updated.',
    };
  }

  const addFieldMatch = clean.match(/^add\s+field\s+(.+?)\s+as\s+([a-z\- ]+)$/i);
  if (addFieldMatch?.[1] && addFieldMatch?.[2]) {
    const label = addFieldMatch[1].trim();
    const kindToken = addFieldMatch[2].trim().toLowerCase();
    const kind = FIELD_KIND_MAP[kindToken] || 'text';
    return {
      handled: true,
      operation: toOperation('add_field', {
        label,
        kind,
      }),
      assistantText: `Added field "${label}" as ${kind}.`,
      chips: [
        { id: 'module-add-required', text: `update field ${label} required true` },
        { id: 'module-readiness', text: 'module readiness' },
      ],
    };
  }

  const updateRequiredMatch = clean.match(
    /^update\s+field\s+(.+?)\s+required\s+(true|false)$/i
  );
  if (updateRequiredMatch?.[1]) {
    const fieldRef = updateRequiredMatch[1].trim().toLowerCase();
    const required = updateRequiredMatch[2].toLowerCase() === 'true';
    const field = draft.fields.find(
      (item) => item.label.toLowerCase() === fieldRef || item.key.toLowerCase() === fieldRef
    );
    if (!field) {
      return {
        handled: true,
        assistantText: `Field "${updateRequiredMatch[1].trim()}" not found in draft.`,
      };
    }
    return {
      handled: true,
      operation: toOperation('update_field', {
        fieldId: field.id,
        validation: {
          ...(field.validation || {}),
          required,
        },
      }),
      assistantText: `Updated required=${required} on field "${field.label}".`,
    };
  }

  const removeFieldMatch = clean.match(/^remove\s+field\s+(.+)$/i);
  if (removeFieldMatch?.[1]) {
    const fieldRef = removeFieldMatch[1].trim().toLowerCase();
    const field = draft.fields.find(
      (item) => item.label.toLowerCase() === fieldRef || item.key.toLowerCase() === fieldRef
    );
    if (!field) {
      return {
        handled: true,
        assistantText: `Field "${removeFieldMatch[1].trim()}" not found in draft.`,
      };
    }
    return {
      handled: true,
      operation: toOperation('remove_field', { fieldId: field.id }),
      assistantText: `Removed field "${field.label}".`,
    };
  }

  const securityMatch = clean.match(/^set\s+security\s+(public|private)$/i);
  if (securityMatch?.[1]) {
    return {
      handled: true,
      operation: toOperation('set_security', {
        security: securityMatch[1].toLowerCase(),
      }),
      assistantText: `Security set to ${securityMatch[1].toLowerCase()}.`,
    };
  }

  const tagsMatch = clean.match(/^set\s+tags\s+(.+)$/i);
  if (tagsMatch?.[1]) {
    const tags = tagsMatch[1]
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    return {
      handled: true,
      operation: toOperation('set_tags', {
        tags,
      }),
      assistantText: `Tags updated (${tags.length}).`,
    };
  }

  const additionalTagsMatch = clean.match(/^set\s+additional\s+tags\s+(.+)$/i);
  if (additionalTagsMatch?.[1]) {
    const additionalTags = additionalTagsMatch[1]
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    return {
      handled: true,
      operation: toOperation('set_tags', {
        additionalTags,
      }),
      assistantText: `Additional tags updated (${additionalTags.length}).`,
    };
  }

  const analysisMatch = clean.match(
    /^set\s+analysis\s+(finance|attendance|hr|operations|custom)\s+(qualitative|quantitative|hybrid)$/i
  );
  if (analysisMatch?.[1] && analysisMatch?.[2]) {
    const domain = analysisMatch[1].toLowerCase();
    const dataNature = analysisMatch[2].toLowerCase();
    return {
      handled: true,
      operation: toOperation('set_analysis_profile', {
        domain,
        dataNature,
      }),
      assistantText: `Analysis profile set to ${domain}/${dataNature}.`,
    };
  }

  const accessibilityMatch = clean.match(/^set\s+accessibility\s+(.+)$/i);
  if (accessibilityMatch?.[1]) {
    const allowed = new Set(['web', 'api', 'embedded', 'javascript', 'mobile']);
    const accessibility = accessibilityMatch[1]
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter((item) => allowed.has(item));
    if (accessibility.length === 0) {
      return {
        handled: true,
        assistantText:
          'No valid accessibility channels found. Use any of: web, api, embedded, javascript, mobile.',
      };
    }
    return {
      handled: true,
      operation: toOperation('set_accessibility', {
        accessibility,
      }),
      assistantText: `Accessibility channels set: ${accessibility.join(', ')}.`,
    };
  }

  if (/^enable\s+perm$/i.test(clean)) {
    return {
      handled: true,
      operation: toOperation('toggle_perm', { enabled: true }),
      assistantText: 'PERM enabled.',
    };
  }

  if (/^disable\s+perm$/i.test(clean)) {
    return {
      handled: true,
      operation: toOperation('toggle_perm', { enabled: false }),
      assistantText: 'PERM disabled.',
    };
  }

  const permTrackingMatch = clean.match(
    /^set\s+perm\s+tracking\s+(none|daily|weekly)$/i
  );
  if (permTrackingMatch?.[1]) {
    const trackingMode = permTrackingMatch[1].toLowerCase();
    return {
      handled: true,
      operation: toOperation('set_perm_tracking', { trackingMode }),
      assistantText: `PERM tracking mode set to ${trackingMode}.`,
    };
  }

  const calendarMatch = clean.match(
    /^set\s+calendar\s+(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})(?:\s+backdating\s+(true|false))?$/i
  );
  if (calendarMatch?.[1] && calendarMatch?.[2]) {
    const startDate = calendarMatch[1];
    const endDate = calendarMatch[2];
    const allowBackdating = calendarMatch[3]
      ? calendarMatch[3].toLowerCase() === 'true'
      : undefined;
    return {
      handled: true,
      operation: toOperation('set_calendar_generation', {
        startDate,
        endDate,
        allowBackdating,
      }),
      assistantText: `Calendar window set: ${startDate} to ${endDate}${allowBackdating == null ? '' : ` (backdating ${allowBackdating ? 'on' : 'off'})`}.`,
    };
  }

  if (/^enable\s+workflow$/i.test(clean)) {
    return {
      handled: true,
      operation: toOperation('toggle_workflow', { enabled: true }),
      assistantText: 'Workflow enabled.',
      chips: [{ id: 'module-step', text: 'add workflow step Approve Submission by role Senior Pastor' }],
    };
  }

  if (/^disable\s+workflow$/i.test(clean)) {
    return {
      handled: true,
      operation: toOperation('toggle_workflow', { enabled: false }),
      assistantText: 'Workflow disabled.',
    };
  }

  const addWorkflowStepMatch = clean.match(
    /^add\s+workflow\s+step\s+(.+?)\s+by\s+role\s+(.+)$/i
  );
  if (addWorkflowStepMatch?.[1] && addWorkflowStepMatch?.[2]) {
    return {
      handled: true,
      operation: toOperation('add_workflow_step', {
        name: addWorkflowStepMatch[1].trim(),
        actionType: 'APPROVE',
        allowedRoles: [addWorkflowStepMatch[2].trim()],
        requiredApprovals: 1,
        order: draft.workflow.steps.length + 1,
      }),
      assistantText: `Workflow step "${addWorkflowStepMatch[1].trim()}" added.`,
    };
  }

  return {
    handled: true,
    assistantText: `I couldn't map that module command yet. ${defaultHelpText()}`,
  };
};
