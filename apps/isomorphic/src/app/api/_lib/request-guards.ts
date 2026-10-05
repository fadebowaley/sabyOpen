import { z } from 'zod';

export class ApiRequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

const getPayloadSize = (rawBody: string) =>
  new TextEncoder().encode(rawBody).length;

export const parseJsonBodyWithLimit = async (
  request: Request,
  maxBytes: number
): Promise<unknown> => {
  const contentLength = request.headers.get('content-length');
  if (contentLength) {
    const declaredSize = Number(contentLength);
    if (Number.isFinite(declaredSize) && declaredSize > maxBytes) {
      throw new ApiRequestError(413, 'Payload too large');
    }
  }

  const rawBody = await request.text();
  if (!rawBody) {
    throw new ApiRequestError(400, 'Request body is required');
  }

  if (getPayloadSize(rawBody) > maxBytes) {
    throw new ApiRequestError(413, 'Payload too large');
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    throw new ApiRequestError(400, 'Invalid JSON body');
  }
};

export const validateBody = <T>(schema: z.ZodType<T>, payload: unknown): T => {
  const result = schema.safeParse(payload);
  if (!result.success) {
    const message =
      result.error.issues
        .slice(0, 3)
        .map((issue) => {
          const path = issue.path.length ? issue.path.join('.') : 'body';
          return `${path}: ${issue.message}`;
        })
        .join('; ') || 'Invalid request body';
    throw new ApiRequestError(400, message);
  }

  return result.data;
};
