import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    // In production, this would:
    // 1. Trigger the cleanup GitHub Actions workflow
    // 2. Stop the ECS task
    // 3. Remove security groups and networking
    // 4. Mark session as terminated in the database

    const githubToken = process.env.GITHUB_TOKEN;
    const githubRepo = process.env.GITHUB_REPO || 'DevOps-Duoo/Devopsduoo_Site';

    if (githubToken) {
      try {
        await fetch(
          `https://api.github.com/repos/${githubRepo}/actions/workflows/cleanup-labs.yml/dispatches`,
          {
            method: 'POST',
            headers: {
              Authorization: `token ${githubToken}`,
              Accept: 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ref: 'main',
              inputs: {
                session_id: sessionId,
              },
            }),
          }
        );
      } catch (error) {
        console.error('Failed to trigger cleanup workflow:', error);
      }
    }

    return NextResponse.json({
      sessionId,
      status: 'terminated',
      message: 'Lab environment is being terminated.',
    });
  } catch (error) {
    console.error('Error terminating lab:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
