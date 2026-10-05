import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { buildInternalApiUrl } from '../../../_lib/backend-url';

type ModuleListItem = {
  projectFormId: string;
  projectId: string;
  name: string;
  status: string;
  updatedAt: string | null;
  tags: string[];
  draft: Record<string, any>;
};

const pickArray = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.docs)) return value.docs;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.data?.results)) return value.data.results;
  if (Array.isArray(value?.data?.docs)) return value.data.docs;
  if (Array.isArray(value?.data?.items)) return value.data.items;
  return [];
};

const normalizeFieldKey = (value: string) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || `field_${Date.now()}`;

const normalizeElementKind = (type: string) => {
  const t = String(type || '').toLowerCase();
  if (t === 'datepicker') return 'date';
  if (t === 'fileupload') return 'file';
  if (t === 'dropdown') return 'select';
  if (t === 'rating') return 'number';
  return t || 'text';
};

const asStringArray = (input: any): string[] => {
  if (!Array.isArray(input)) return [];
  return input.map((value) => String(value)).filter(Boolean);
};

const asNumber = (value: any, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const pickMeta = (input: any, omittedKeys: string[]) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const omit = new Set(omittedKeys);
  return Object.fromEntries(
    Object.entries(input).filter(([key]) => !omit.has(String(key)))
  );
};

const mapProjectFormToDraft = (row: any): Record<string, any> => {
  const fields = (Array.isArray(row?.elements) ? row.elements : []).map(
    (el: any, index: number) => {
      const properties = el?.properties || {};
      const label = String(properties?.label || el?.id || `Field ${index + 1}`);
      const key = normalizeFieldKey(String(el?.id || label));
      const options = Array.isArray(properties?.options)
        ? properties.options
            .map((option: any) => {
              if (typeof option === 'string' || typeof option === 'number')
                return String(option);
              if (option && typeof option === 'object') {
                return String(
                  option.label ?? option.value ?? option.name ?? option.id ?? ''
                );
              }
              return '';
            })
            .filter(Boolean)
        : undefined;

      return {
        id: String(el?.id || `fld_${index + 1}`),
        key,
        label,
        kind: normalizeElementKind(String(el?.type || 'text')),
        placeholder: properties?.placeholder
          ? String(properties.placeholder)
          : undefined,
        helpText: properties?.helpText
          ? String(properties.helpText)
          : undefined,
        options,
        validation:
          properties?.validation && typeof properties.validation === 'object'
            ? properties.validation
            : { required: Boolean(properties?.required) },
        layout: {
          colSpan: asNumber(row?.columnSpans?.[String(el?.id)], 1),
          order: asNumber(el?.position?.y, index + 1),
        },
      };
    }
  );

  const firstWorkflow = Array.isArray(row?.workflows) ? row.workflows[0] : null;
  const workflowSteps = Array.isArray(firstWorkflow?.steps)
    ? firstWorkflow.steps.map((step: any, index: number) => ({
        id: String(step?.id || `wf_${index + 1}`),
        name: String(step?.name || `Step ${index + 1}`),
        actionType: String(step?.actionType || 'REVIEW').toUpperCase(),
        allowedRoles: asStringArray(
          step?.assigneeRoles || step?.allowedRoles || []
        ),
        requiredApprovals: Math.max(1, asNumber(step?.requiredApprovals, 1)),
        order: Math.max(1, asNumber(step?.stepOrder || step?.order, index + 1)),
        meta: pickMeta(step, [
          'id',
          'name',
          'stepOrder',
          'order',
          'actionType',
          'type',
          'assigneeType',
          'assigneeRole',
          'assigneeRoles',
          'assigneeUsers',
          'sla',
          'requiredApprovals',
        ]),
      }))
    : [];

  const permSettings = row?.permSettings || {};
  const moduleStudio = row?.metadata?.moduleStudio || {};
  const payment = moduleStudio?.payment || {};
  const paymentConfig = moduleStudio?.paymentConfig || row?.paymentConfig || {};

  return {
    id: String(row?.projectId || `draft_${Date.now().toString(36)}`),
    version: 2,
    status:
      String(row?.metadata?.deploymentStatus || '').toLowerCase() ===
      'published'
        ? 'published'
        : String(row?.metadata?.reviewStatus || '').toLowerCase() === 'approved'
          ? 'ready'
          : 'draft',
    updatedAt: row?.updatedAt || row?.createdAt || new Date().toISOString(),
    metadata: {
      projectName: String(
        row?.configuration?.projectName || row?.projectId || 'Untitled Module'
      ),
      tags: asStringArray(row?.configuration?.tags),
      additionalTags: [],
      security:
        row?.configuration?.security === 'public' ? 'public' : 'private',
      accessibility: asStringArray(row?.configuration?.accessibility).length
        ? asStringArray(row?.configuration?.accessibility)
        : ['api'],
    },
    fields,
    ui: {
      style: String(row?.style || 'default'),
      wizardMode: Boolean(row?.wizardMode),
      showProgressBar: Boolean(row?.userSettings?.ui?.showProgressBar ?? true),
      primaryColor: String(row?.userSettings?.ui?.primaryColor || '#3b82f6'),
      theme: String(row?.userSettings?.ui?.theme || 'default'),
    },
    perm: {
      enabled: Boolean(permSettings?.enabled),
      trackingMode: ['none', 'daily', 'weekly'].includes(
        String(permSettings?.trackingMode)
      )
        ? String(permSettings?.trackingMode)
        : 'none',
      requireNodeId: Boolean(permSettings?.requireNodeId ?? true),
      requireMonth: Boolean(permSettings?.requireMonth ?? true),
      autoGenerateCalendar: Boolean(permSettings?.autoGenerateCalendar),
      calendar:
        permSettings?.calendarGeneration || moduleStudio?.perm?.calendar || {},
    },
    workflow: {
      enabled: Boolean(firstWorkflow?.enabled && workflowSteps.length > 0),
      steps: workflowSteps,
      notifications: {
        onEveryIncident: Boolean(firstWorkflow?.notifications?.onEveryIncident),
      },
      meta: pickMeta(firstWorkflow, [
        'id',
        'name',
        'type',
        'enabled',
        'triggerOn',
        'notifications',
        'steps',
      ]),
    },
    payment: {
      enabled: Boolean(payment?.enabled),
      mode: ['none', 'fixed', 'formula'].includes(String(payment?.mode))
        ? payment.mode
        : 'none',
      fixedAmount:
        payment?.fixedAmount == null
          ? undefined
          : asNumber(payment.fixedAmount, 0),
      formula: payment?.formula ? String(payment.formula) : undefined,
      currency: payment?.currency ? String(payment.currency) : 'NGN',
      collectionStage: [
        'before_submit',
        'before_approval',
        'after_approval',
      ].includes(String(payment?.collectionStage))
        ? payment.collectionStage
        : 'before_submit',
      nodeAllocations: Array.isArray(payment?.nodeAllocations)
        ? payment.nodeAllocations
        : [],
      policies: Array.isArray(payment?.policies)
        ? payment.policies.map((policy: any) => ({
            ...policy,
            mode:
              String(policy?.mode) === 'fixed'
                ? 'steady'
                : String(policy?.mode) === 'dynamic'
                  ? 'active'
                  : policy?.mode || 'steady',
          }))
        : [],
      config: {
        ...(paymentConfig && typeof paymentConfig === 'object'
          ? paymentConfig
          : {}),
        enabled: Boolean(paymentConfig?.enabled),
        defaultChannel: ['sabypipe', 'paystack', 'flutterwave'].includes(
          String(paymentConfig?.defaultChannel || '').toLowerCase()
        )
          ? String(paymentConfig.defaultChannel).toLowerCase()
          : undefined,
        enabledChannels: Array.isArray(paymentConfig?.enabledChannels)
          ? paymentConfig.enabledChannels
              .map((channel: any) => String(channel || '').toLowerCase())
              .filter((channel: string) =>
                ['sabypipe', 'paystack', 'flutterwave'].includes(channel)
              )
          : [],
        processorSettings:
          paymentConfig?.processorSettings &&
          typeof paymentConfig.processorSettings === 'object'
            ? paymentConfig.processorSettings
            : {},
      },
    },
    behaviorHooks: {
      ...(moduleStudio?.behaviorHooks || {}),
    },
    analysis:
      moduleStudio?.analysis && typeof moduleStudio.analysis === 'object'
        ? moduleStudio.analysis
        : {
            domain: 'custom',
            dataNature: 'hybrid',
          },
  };
};

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    const accessToken =
      (token as any)?.accessToken || (token as any)?.user?.accessToken;

    if (!token || !accessToken) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const params = new URLSearchParams({
      limit: '100',
      sortBy: 'updatedAt:desc',
    });

    const upstream = await fetch(
      buildInternalApiUrl(`/project-forms?${params.toString()}`),
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data: any = await upstream
      .json()
      .catch(() => ({ message: 'Invalid module list response' }));

    if (!upstream.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: data?.message || data?.error || 'Failed to load modules.',
        },
        { status: upstream.status }
      );
    }

    const rows = pickArray(data);
    const items: ModuleListItem[] = rows
      .filter((row: any) => !row?.deletedAt)
      .map((row: any) => ({
        projectFormId: String(row?._id || row?.id || ''),
        projectId: String(row?.projectId || row?._id || row?.id || ''),
        name: String(
          row?.configuration?.projectName || row?.projectId || 'Untitled Module'
        ),
        status:
          String(row?.metadata?.deploymentStatus || '').toLowerCase() ===
          'published'
            ? 'published'
            : String(row?.metadata?.reviewStatus || '').toLowerCase() ===
                'approved'
              ? 'approved'
              : String(row?.status || 'draft'),
        updatedAt: row?.updatedAt || row?.createdAt || null,
        tags: asStringArray(row?.configuration?.tags),
        draft: mapProjectFormToDraft(row),
      }))
      .filter((item) => item.projectFormId && item.projectId);

    return NextResponse.json({ ok: true, items });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to load module list.' },
      { status: 500 }
    );
  }
}
