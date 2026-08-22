import { NextRequest, NextResponse } from 'next/server';
import { getLabById } from '@/lib/labs';

// In-memory session store (replace with Redis/DynamoDB in production)
const sessions = new Map<string, {
  sessionId: string;
  labId: string;
  status: string;
  startedAt: string;
  expiresAt: string;
  terminalUrl?: string;
  ip: string;
}>();

// Rate limiting: max 3 sessions per IP per hour
const rateLimiter = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const maxRequests = 3;

  const timestamps = rateLimiter.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < windowMs);

  if (recent.length >= maxRequests) {
    return true;
  }

  recent.push(now);
  rateLimiter.set(ip, recent);
  return false;
}

function generateSessionId(): string {
  return `lab-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { labId, userName } = body;

    if (!labId || !userName?.trim()) {
      return NextResponse.json(
        { error: 'labId and userName are required' },
        { status: 400 }
      );
    }

    const lab = getLabById(labId);
    if (!lab) {
      return NextResponse.json(
        { error: 'Lab not found' },
        { status: 404 }
      );
    }

    if (lab.status !== 'available') {
      return NextResponse.json(
        { error: 'Lab is not currently available' },
        { status: 400 }
      );
    }

    // Get client IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';

    // Check rate limit
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 3 lab sessions per hour.' },
        { status: 429 }
      );
    }

    // Generate session
    const sessionId = generateSessionId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes

    const session = {
      sessionId,
      labId,
      status: 'provisioning',
      startedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      ip,
    };

    sessions.set(sessionId, session);

    // Trigger GitHub Actions workflow (when configured)
    // This is where you'd call the GitHub API to trigger workflow_dispatch
    const githubToken = process.env.GITHUB_TOKEN;
    const githubRepo = process.env.GITHUB_REPO || 'DevOps-Duoo/Devopsduoo_Site';

    if (githubToken) {
      try {
        const githubRes = await fetch(
          `https://api.github.com/repos/${githubRepo}/actions/workflows/provision-lab.yml/dispatches`,
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
                lab_id: labId,
                docker_image: lab.dockerImage,
                docker_run_flags: lab.dockerRunFlags || '',
                ttl_minutes: '30',
                user_name: userName || 'Anonymous',
              },
            }),
          }
        );
        
        if (!githubRes.ok) {
          const errorText = await githubRes.text();
          console.error(`GitHub API Error (${githubRes.status}):`, errorText);
          // Return the error to the frontend so we can see it
          return NextResponse.json(
            { error: `GitHub API Error: ${githubRes.status} - ${errorText}` },
            { status: 500 }
          );
        }
        console.log('Successfully triggered provision-lab.yml on GitHub');
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
      status: 'provisioning',
      message: 'Lab environment is being provisioned. Poll /api/labs/status for updates.',
    });
  } catch (error) {
    console.error('Error starting lab:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
