import { api } from '../axios';

type JsonObject = Record<string, unknown>;

const parseJsonResponse = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};


const getJson = async (endpoint: string): Promise<any> => {
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  const data = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(
      (data as any)?.message || (data as any)?.error || 'Request failed'
    );
  }
  return data;
};


const postJson = async <T extends JsonObject>(
  endpoint: string,
  payload: T
): Promise<any> => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(
      (data as any)?.message || (data as any)?.error || 'Request failed'
    );
  }

  return data;
};

export const submitPublicFormSubmission = async (payload: {
  projectId: string;
  formData: Record<string, unknown>;
  submittedAt?: string;
  metadata?: Record<string, unknown>;
}) => postJson('/api/form-submissions', payload);




// this is the one that works 
export const submitPublicFormSubmissionByReference = async (
  reference: string,
  payload: {
    submissionData: Record<string, unknown>;
    submittedAt?: string;
    metadata?: Record<string, unknown>;
    nodeId?: string;
    event_date?: string;
    submission_date?: string;
    month?: string;
    year?: number;
  }
) => {
  const { data } = await api.post(`/submissions/public/ref/${reference}`, {
    payload: payload.submissionData,
    meta: {
      ...(payload.metadata || {}),
      submittedAt: payload.submittedAt,
      source: 'public-conversational-form',
    },
    nodeId: payload.nodeId,
    event_date: payload.event_date,
    submission_date: payload.submission_date,
    month: payload.month,
    year: payload.year,
  });

  return data;
};


export const submitProjectFormSubmission = async (payload: {
  projectId: string;
  submissionData: Record<string, unknown>;
  submittedAt?: string;
  metadata?: Record<string, unknown>;
}) => postJson('/api/project-form-submissions', payload);

export const requestPublicAccessLink = async (payload: {
  reference: string;
  identifier: string;
  qrContextToken?: string;
}) => postJson('/api/public/forms/access/request-link', payload);

export const requestPublicAccessCode = async (payload: {
  reference: string;
  channel: 'email' | 'phone';
  identifier: string;
  qrContextToken?: string;
}) => postJson('/api/public/forms/access/request-code', payload);

export const verifyPublicAccessCode = async (payload: {
  challengeId: string;
  otp: string;
}) => postJson('/api/public/forms/access/verify-code', payload);

export const verifyPublicFormAccessCode = async (payload: {
  reference: string;
  accessCode: string;
  qrContextToken?: string;
}) => postJson('/api/public/forms/access/verify-access-code', payload);

export const resendPublicAccessCode = async (payload: {
  challengeId: string;
}) => postJson('/api/public/forms/access/resend-code', payload);

export const consumePublicAccessLink = async (accessToken: string) => {
  return getJson(
    `/api/public/forms/access/consume-link?accessToken=${encodeURIComponent(accessToken)}`
  );
};

export const getPublicAccessPrefill = async (payload: {
  accessToken: string;
  nodeId?: string;
}) => {
  const params = new URLSearchParams();
  params.set('accessToken', payload.accessToken);
  if (payload.nodeId) {
    params.set('nodeId', payload.nodeId);
  }
  return getJson(`/api/public/forms/access/prefill?${params.toString()}`);
};

export const submitSecurePublicForm = async (payload: {
  accessToken: string;
  reference?: string;
  nodeId?: string;
  submissionData: Record<string, unknown>;
  submittedAt?: string;
  metadata?: Record<string, unknown>;
  event_date?: string;
  submission_date?: string;
  month?: string;
  year?: number;
}) => postJson('/api/public/forms/access/submit', payload);

export const requestPublicFieldVerificationCode = async (payload: {
  formId: string;
  fieldKey: string;
  channel: 'email' | 'phone';
  identifier: string;
  submissionId?: string;
  accessToken?: string;
}) => postJson('/api/public/forms/verification/request-code', payload);

export const verifyPublicFieldVerificationCode = async (payload: {
  challengeId: string;
  otp: string;
}) => postJson('/api/public/forms/verification/verify-code', payload);

export const generatePublicFormFieldId = async (payload: {
  formId: string;
  fieldKey: string;
  prefix?: string;
  separator?: string;
  length?: number;
}) => {
  const { formId, ...body } = payload;
  return postJson(
    `/api/public/forms/id/${encodeURIComponent(formId)}/generate-id`,
    body
  );
};

export const evaluatePublicFormInvoice = async (payload: {
  formId: string;
  submissionData: Record<string, unknown>;
  tenantId?: string;
  projectId?: string;
}) => {
  const { formId, ...body } = payload;
  return postJson(
    `/api/public/forms/id/${encodeURIComponent(formId)}/evaluate-invoice`,
    body
  );
};

export const createPublicFormPaymentIntent = async (payload: {
  formId: string;
  submissionData: Record<string, unknown>;
  tenantId?: string;
  projectId?: string;
  submissionId?: string;
  requestedChannel?: string;
  triggerStage?: 'submission' | 'pre_approval' | 'post_approval';
  respondentContext?: Record<string, unknown>;
}) => {
  const { formId, ...body } = payload;
  return postJson(
    `/api/public/forms/id/${encodeURIComponent(formId)}/create-payment-intent`,
    body
  );
};

export const getPublicFormPaymentStatus = async (payload: {
  formId: string;
  reference: string;
  tenantId?: string;
  projectId?: string;
  provider?: string;
  transactionId?: string;
  txRef?: string;
  status?: string;
}) => {
  const {
    formId,
    reference,
    tenantId,
    projectId,
    provider,
    transactionId,
    txRef,
    status,
  } = payload;
  const params = new URLSearchParams();
  if (tenantId) params.set('tenantId', tenantId);
  if (projectId) params.set('projectId', projectId);
  if (provider) params.set('provider', provider);
  if (transactionId) params.set('transaction_id', transactionId);
  if (txRef) params.set('tx_ref', txRef);
  if (status) params.set('status', status);
  const suffix = params.toString() ? `?${params.toString()}` : '';
  return getJson(
    `/api/public/forms/id/${encodeURIComponent(formId)}/payment-status/${encodeURIComponent(reference)}${suffix}`
  );
};
