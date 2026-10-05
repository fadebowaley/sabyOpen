import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { buildInternalApiUrl } from '../../../_lib/backend-url';

const pickArray = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.docs)) return value.docs;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.data?.results)) return value.data.results;
  return [];
};

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const accessToken = (token as any)?.accessToken || (token as any)?.user?.accessToken;

    if (!token || !accessToken) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const [levelsUpstream, nodesUpstream] = await Promise.all([
      fetch(buildInternalApiUrl('/levels?limit=200&sortBy=createdAt:asc'), {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
      fetch(buildInternalApiUrl('/nodes?limit=2000&sortBy=name:asc'), {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    ]);

    const levelsData: any = await levelsUpstream
      .json()
      .catch(() => ({ message: 'Invalid levels response' }));
    const nodesData: any = await nodesUpstream
      .json()
      .catch(() => ({ message: 'Invalid nodes response' }));

    if (!nodesUpstream.ok) {
      return NextResponse.json(
        { ok: false, error: nodesData?.message || nodesData?.error || 'Failed to load nodes.' },
        { status: nodesUpstream.status }
      );
    }
    const levels = levelsUpstream.ok
      ? pickArray(levelsData).map((level: any, index: number) => ({
          id: String(level?._id || level?.id || ''),
          name: String(level?.name || level?.label || 'Unknown Level'),
          order:
            Number.isFinite(Number(level?.levelNo))
              ? Number(level.levelNo)
              : Number.isFinite(Number(level?.order))
                ? Number(level.order)
                : index + 1,
        }))
      : [];

    const levelNameById = new Map(levels.map((level: any) => [String(level.id), level.name]));

    const attributeKeys = new Set<string>([
      'address',
      'city',
      'state',
      'country',
      'postalCode',
      'profile.averageAttendance',
      'profile.averageIncome',
    ]);

    const nodes = pickArray(nodesData)
      .filter((node: any) => !node?.deletedAt)
      .map((node: any) => {
        const rawLevelId = String(node?.level?._id || node?.level || '');
        const levelId = rawLevelId || '__unknown_level__';
        const levelName = String(
          node?.level?.name || levelNameById.get(rawLevelId) || 'Unknown Level'
        );
        const customFieldKeys = Object.keys(
          node?.customFields && typeof node.customFields === 'object'
            ? node.customFields
            : {}
        );
        for (const key of customFieldKeys) {
          attributeKeys.add(`customFields.${key}`);
        }
        return {
          id: String(node?._id || node?.id || ''),
          name: String(node?.name || node?.nodeId || 'Unnamed Node'),
          levelId,
          levelName,
          parentId: node?.parent ? String(node.parent?._id || node.parent) : null,
          attributes: {
            address: node?.address || '',
            city: node?.city || '',
            state: node?.state || '',
            country: node?.country || '',
            postalCode: node?.postalCode || '',
            profile: {
              averageAttendance: Number(node?.profile?.averageAttendance || 0),
              averageIncome:
                node?.profile?.averageIncome == null
                  ? 0
                  : Number(node.profile.averageIncome?.$numberDecimal || node.profile.averageIncome),
            },
            customFields: node?.customFields && typeof node.customFields === 'object' ? node.customFields : {},
          },
        };
      })
      .filter((node: any) => node.id);

    const byId = new Map(nodes.map((node: any) => [node.id, node]));
    const families = nodes
      .filter((node: any) => !node.parentId || !byId.has(String(node.parentId)))
      .map((node: any) => ({
        id: node.id,
        name: node.name,
        levelId: node.levelId,
        levelName: node.levelName,
      }));

    const nodesByLevel: Record<string, any[]> = {};
    for (const level of levels) {
      nodesByLevel[level.id] = [];
    }
    for (const node of nodes) {
      if (!nodesByLevel[node.levelId]) nodesByLevel[node.levelId] = [];
      nodesByLevel[node.levelId].push(node);
    }

    for (const key of Object.keys(nodesByLevel)) {
      nodesByLevel[key].sort((a, b) => a.name.localeCompare(b.name));
    }

    const knownLevelIds = new Set(levels.map((level: any) => String(level.id)));
    const inferredLevels = new Map<string, { id: string; name: string; order: number }>();
    nodes.forEach((node: any, index: number) => {
      const levelId = String(node.levelId || '');
      if (!levelId || knownLevelIds.has(levelId) || inferredLevels.has(levelId)) return;
      inferredLevels.set(levelId, {
        id: levelId,
        name: String(node.levelName || 'Unknown Level'),
        order: levels.length + index + 1,
      });
    });
    if (inferredLevels.size > 0) {
      levels.push(...Array.from(inferredLevels.values()));
    }
    levels.sort((a: any, b: any) => Number(a.order || 0) - Number(b.order || 0));

    return NextResponse.json({
      ok: true,
      levels,
      nodesByLevel,
      nodes,
      families,
      attributeKeys: Array.from(attributeKeys).sort((a, b) => a.localeCompare(b)),
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to load node levels.' },
      { status: 500 }
    );
  }
}
