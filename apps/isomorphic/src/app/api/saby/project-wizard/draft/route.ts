import { NextRequest, NextResponse } from 'next/server';
import {
  callProjectWizardBackend,
  getProjectWizardAccessToken,
} from '../_lib/project-wizard-backend';

export async function POST(request: NextRequest) {
  const accessToken = await getProjectWizardAccessToken(request);
  if (!accessToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const { response, data } = await callProjectWizardBackend(
    accessToken,
    '/copilot/project-wizard/draft',
    {
      method: 'POST',
      body: JSON.stringify(body || {}),
    }
  );

  return NextResponse.json(data, { status: response.status });
}

export async function GET(request: NextRequest) {
  const accessToken = await getProjectWizardAccessToken(request);
  if (!accessToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { response, data } = await callProjectWizardBackend(
    accessToken,
    '/copilot/project-wizard/draft',
    {
      method: 'GET',
    }
  );

  return NextResponse.json(data, { status: response.status });
}

export async function DELETE(request: NextRequest) {
  const accessToken = await getProjectWizardAccessToken(request);
  if (!accessToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { response, data } = await callProjectWizardBackend(
    accessToken,
    '/copilot/project-wizard/draft',
    {
      method: 'DELETE',
    }
  );

  return NextResponse.json(data, { status: response.status });
}
