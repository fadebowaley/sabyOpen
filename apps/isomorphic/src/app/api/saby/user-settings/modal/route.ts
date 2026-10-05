import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { z } from 'zod';
import { buildInternalApiUrl } from '../../../_lib/backend-url';

const alertScheduleSchema = z.object({
  id: z.string(),
  name: z.string(),
  alertType: z.string(),
  frequency: z.string(),
  time: z.string(),
  recipients: z.string(),
  channel: z.string(),
  active: z.boolean(),
});

const modalPreferencesSchema = z.object({
  appearance: z.enum(['system', 'light', 'dark']),
  accentColor: z.enum(['Default', 'Ocean', 'Slate']),
  language: z.enum([
    'Auto-detect',
    'English',
    'French',
    'Spanish',
    'Portuguese',
    'Arabic',
    'Hausa',
    'Swahili',
  ]),
  spokenLanguage: z.enum(['Auto-detect', 'English', 'French']),
  responsesChannel: z.enum(['Push', 'Email', 'Push, Email']),
  groupChatsChannel: z.enum(['Push', 'Email', 'Push, Email']),
  tasksChannel: z.enum(['Push', 'Email', 'Push, Email']),
  projectsChannel: z.enum(['Push', 'Email', 'Push, Email']),
  recommendationsChannel: z.enum(['Push', 'Email', 'Push, Email']),
  usageChannel: z.enum(['Push', 'Email', 'Push, Email']),
  authenticatorAppEnabled: z.boolean(),
  pushVerificationEnabled: z.boolean(),
  matureFilterEnabled: z.boolean(),
  purchaseConfirmEnabled: z.boolean(),
  enabledApps: z.array(z.string()),
  alertSchedules: z.array(alertScheduleSchema),
});

const modalPreferencesPatchSchema = z.object({
  preferences: modalPreferencesSchema.partial(),
});

const defaultPreferences: z.infer<typeof modalPreferencesSchema> = {
  appearance: 'light',
  accentColor: 'Default',
  language: 'English',
  spokenLanguage: 'Auto-detect',
  responsesChannel: 'Push',
  groupChatsChannel: 'Push',
  tasksChannel: 'Push, Email',
  projectsChannel: 'Email',
  recommendationsChannel: 'Push, Email',
  usageChannel: 'Push, Email',
  authenticatorAppEnabled: false,
  pushVerificationEnabled: false,
  matureFilterEnabled: true,
  purchaseConfirmEnabled: false,
  enabledApps: [],
  alertSchedules: [],
};

type ResolvedAuth = {
  accessToken: string;
  userId: string;
};

const resolveAuth = async (request: NextRequest): Promise<ResolvedAuth | null> => {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const accessToken =
    (token as any)?.accessToken || (token as any)?.user?.accessToken || null;
  const userId = String(
    token?.sub ||
      (token as any)?.user?.id ||
      (token as any)?.id ||
      ''
  ).trim();
  if (!accessToken || !userId) return null;
  return { accessToken: String(accessToken), userId };
};

const normalizePreferences = (raw: unknown) => {
  const parsed = modalPreferencesSchema.partial().safeParse(raw);
  return {
    ...defaultPreferences,
    ...(parsed.success ? parsed.data : {}),
  };
};

const stripThemePreference = (preferences: Partial<z.infer<typeof modalPreferencesSchema>>) => {
  const { appearance: _appearance, ...settingsPreferences } = preferences;
  return settingsPreferences;
};

const getDefaultFormSettings = (payload: any): Record<string, any> => {
  if (payload?.defaultFormSettings && typeof payload.defaultFormSettings === 'object') {
    return payload.defaultFormSettings;
  }
  return {};
};

const fetchUserFormSettings = async (auth: ResolvedAuth) => {
  const response = await fetch(
    buildInternalApiUrl(`/user-form-settings/user/${encodeURIComponent(auth.userId)}`),
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
      },
      cache: 'no-store',
    }
  );

  const payload = await response
    .json()
    .catch(() => ({ message: 'Invalid user settings response' }));

  return { response, payload };
};

export async function GET(request: NextRequest) {
  try {
    const auth = await resolveAuth(request);
    if (!auth) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { response, payload } = await fetchUserFormSettings(auth);
    if (response.status === 404) {
      return NextResponse.json({
        ok: true,
        preferences: stripThemePreference(defaultPreferences),
        source: 'default',
      });
    }
    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: payload?.message || payload?.error || 'Failed to load modal settings',
        },
        { status: response.status }
      );
    }

    const defaultFormSettings = getDefaultFormSettings(payload);
    const preferences = normalizePreferences(defaultFormSettings.profileModal);

    return NextResponse.json({
      ok: true,
      preferences: stripThemePreference(preferences),
      source: 'backend',
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to load modal settings' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await resolveAuth(request);
    if (!auth) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const rawBody = await request.json().catch(() => ({}));
    const parsedBody = modalPreferencesPatchSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return NextResponse.json(
        { ok: false, error: 'Invalid modal settings payload' },
        { status: 400 }
      );
    }

    const { response: readResponse, payload: readPayload } =
      await fetchUserFormSettings(auth);
    const hasExistingUserSettings = readResponse.ok;

    if (!hasExistingUserSettings && readResponse.status !== 404) {
      return NextResponse.json(
        {
          ok: false,
          error: readPayload?.message || readPayload?.error || 'Failed to load current user settings',
        },
        { status: readResponse.status }
      );
    }

    const currentDefaultFormSettings = hasExistingUserSettings
      ? getDefaultFormSettings(readPayload)
      : {};
    const currentPreferences = normalizePreferences(
      currentDefaultFormSettings.profileModal
    );
    const incomingPreferences = stripThemePreference(parsedBody.data.preferences);
    const nextPreferences = {
      ...currentPreferences,
      ...incomingPreferences,
    };

    const nextDefaultFormSettings = {
      ...currentDefaultFormSettings,
      profileModal: stripThemePreference(nextPreferences),
      ui: currentDefaultFormSettings.ui || {},
    };

    const saveResponse = await fetch(
      buildInternalApiUrl(`/user-form-settings/user/${encodeURIComponent(auth.userId)}`),
      {
        method: hasExistingUserSettings ? 'PATCH' : 'PUT',
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          defaultFormSettings: nextDefaultFormSettings,
        }),
      }
    );

    const savePayload = await saveResponse
      .json()
      .catch(() => ({ message: 'Invalid modal settings save response' }));

    if (!saveResponse.ok) {
      return NextResponse.json(
        {
          ok: false,
          error:
            savePayload?.message ||
            savePayload?.error ||
            'Failed to save modal settings',
        },
        { status: saveResponse.status }
      );
    }

    return NextResponse.json({
      ok: true,
      preferences: normalizePreferences(nextPreferences),
      data: savePayload,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to save modal settings' },
      { status: 500 }
    );
  }
}
