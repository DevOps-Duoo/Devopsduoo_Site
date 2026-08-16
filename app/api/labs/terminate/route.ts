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
        const githubRes = await fetch(
          `https://api.github.com/repos/${githubRepo}/actions/workflows/terminate-lab.yml/dispatches`,
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
        
        if (!githubRes.ok) {
          const errorText = await githubRes.text();
          console.error(`GitHub API Error (${githubRes.status}):`, errorText);
          return NextResponse.json(
            { error: `GitHub API Error: ${githubRes.status} - ${errorText}` },
            { status: 500 }
          );
        }
        console.log('Successfully triggered terminate-lab.yml on GitHub');
      } catch (error) {
        console.error('Network failure triggering GitHub Actions:', error);
        return NextResponse.json(
          { error: 'Failed to reach GitHub API' },
          { status: 500 }
        );
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
