import { NextRequest, NextResponse } from 'next/server';

// This would be shared with the start route in production (via Redis/DynamoDB)
// For now, we return a demo response
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'sessionId query parameter is required' },
      { status: 400 }
    );
  }

  // In production, this would check:
  // 1. The GitHub Actions run status
  // 2. The ECS task status
  // 3. The container health check
  // 4. Return the terminal URL once ready

  // For now, return a demo response
  // The frontend handles this gracefully and falls back to demo mode

  return NextResponse.json({
    sessionId,
    status: 'provisioning',
    message: 'Environment is being provisioned. This is a demo response — configure AWS credentials for real provisioning.',
    startedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  });
}
