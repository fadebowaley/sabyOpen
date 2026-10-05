import { DraftReadiness, ModuleDraftV2, ModuleFieldV2 } from './contracts';

const NON_INPUT_FIELD_KINDS = new Set(['header', 'paragraph', 'button']);

const isInputField = (field: ModuleFieldV2) =>
  !NON_INPUT_FIELD_KINDS.has(field.kind);

export const evaluateDraftReadiness = (
  draft: ModuleDraftV2
): DraftReadiness => {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!draft.metadata.projectName?.trim()) {
    blockers.push('Project name is required.');
  }

  const inputFields = draft.fields.filter(isInputField);
  if (inputFields.length === 0) {
    blockers.push('At least one input field is required.');
  }

  const duplicateFieldKeys = new Set<string>();
  const seenFieldKeys = new Set<string>();
  draft.fields.forEach((field) => {
    const normalized = field.key.trim().toLowerCase();
    if (!normalized) {
      blockers.push(`Field "${field.label || field.id}" is missing a key.`);
      return;
    }
    if (seenFieldKeys.has(normalized)) {
      duplicateFieldKeys.add(normalized);
    } else {
      seenFieldKeys.add(normalized);
    }
  });
  if (duplicateFieldKeys.size > 0) {
    blockers.push(
      `Duplicate field keys: ${Array.from(duplicateFieldKeys).join(', ')}`
    );
  }

  if (draft.perm.enabled && draft.perm.trackingMode === 'none') {
    blockers.push('PERM is enabled but tracking mode is not selected.');
  }

  if (draft.workflow.enabled) {
    if (!draft.workflow.steps.length) {
      blockers.push('Workflow is enabled but has no steps.');
    }
    draft.workflow.steps.forEach((step, index) => {
      if (!step.name.trim()) {
        blockers.push(`Workflow step ${index + 1} has no name.`);
      }
      if (!step.allowedRoles?.length) {
        const needsAssignee = ['REVIEW', 'APPROVE', 'ESCALATE'].includes(
          String(step.actionType || '').toUpperCase()
        );
        if (!needsAssignee) return;
        blockers.push(
          `Workflow step "${step.name || index + 1}" has no assigned roles.`
        );
      }
      if (
        ['REVIEW', 'APPROVE'].includes(
          String(step.actionType || '').toUpperCase()
        ) &&
        Number(step.requiredApprovals || 0) <= 0
      ) {
        blockers.push(
          `Workflow step "${step.name || index + 1}" requires at least 1 approval.`
        );
      }
    });
  }

  if (draft.payment?.enabled) {
    const policies = Array.isArray(draft.payment.policies)
      ? draft.payment.policies
      : [];
    const paymentConfig = draft.payment.config || {
      enabled: false,
      enabledChannels: [],
    };
    if (policies.length === 0) {
      blockers.push('Payment policy is enabled but no income policy exists.');
    }
    const activePolicies = policies.filter(
      (policy) => policy?.active !== false
    );
    if (activePolicies.length === 0) {
      blockers.push('Payment policy is enabled but no active policy exists.');
    }
    if (!paymentConfig.enabled) {
      blockers.push(
        'Payment policy is enabled but payment config is not enabled.'
      );
    }
    const enabledChannels = Array.isArray(paymentConfig.enabledChannels)
      ? paymentConfig.enabledChannels
      : [];
    if (paymentConfig.enabled && enabledChannels.length === 0) {
      blockers.push(
        'Payment config is enabled but no payment channel is selected.'
      );
    }
    if (
      paymentConfig.enabled &&
      !String(paymentConfig.defaultChannel || '').trim()
    ) {
      blockers.push(
        'Payment config is enabled but default channel is not set.'
      );
    }
    if (
      paymentConfig.enabled &&
      paymentConfig.defaultChannel &&
      !enabledChannels.includes(String(paymentConfig.defaultChannel))
    ) {
      blockers.push(
        'Payment config default channel must be one of the enabled channels.'
      );
    }
    policies.forEach((policy, index) => {
      const mode =
        String(policy?.mode) === 'fixed'
          ? 'steady'
          : String(policy?.mode) === 'dynamic'
            ? 'active'
            : String(policy?.mode || 'steady');
      if (mode === 'steady' && Number(policy?.fixedAmount || 0) <= 0) {
        blockers.push(
          `Payment policy #${index + 1} steady income needs amount > 0.`
        );
      }
      if (mode === 'active' && !String(policy?.formula || '').trim()) {
        blockers.push(
          `Payment policy #${index + 1} active income needs derivation expression.`
        );
      }
      if (
        String(policy?.scopeType || '') !== 'all' &&
        !String(policy?.scopeRef || '').trim()
      ) {
        blockers.push(`Payment policy #${index + 1} must target scope.`);
      }
    });
    if (!String(draft.payment.currency || '').trim()) {
      warnings.push('Payment currency is not set.');
    }
  }

  if (draft.metadata.security === 'public') {
    warnings.push('Public module: ensure no sensitive fields are collected.');
  }

  if (!draft.metadata.tags?.length) {
    warnings.push('No industry selected. Analytics profiling may be weak.');
  }

  if (!draft.analysis?.domain) {
    warnings.push(
      'Analysis domain is not set. Use tags or set analysis profile.'
    );
  }

  return {
    isReady: blockers.length === 0,
    blockers,
    warnings,
  };
};
