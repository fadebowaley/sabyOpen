import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/saby/intelligence/alerts
 * Legacy incident alerts endpoint deprecated — Copilot agent handles intelligence on-demand.
 */
export async function GET(_request: NextRequest) {
  return NextResponse.json({
    ok: true,
    anomalies: [],
    incidents: [],
    criticalAnomalies: [],
    criticalIncidents: [],
    criticalCount: 0,
    fetchedAt: new Date().toISOString(),
  });
}
