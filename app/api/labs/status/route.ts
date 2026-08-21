import { NextRequest, NextResponse } from 'next/server';
import { EC2Client, DescribeInstancesCommand } from '@aws-sdk/client-ec2';
import { SSMClient, SendCommandCommand, GetCommandInvocationCommand } from '@aws-sdk/client-ssm';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'sessionId query parameter is required' },
      { status: 400 }
    );
  }

  // Netlify reserves standard AWS_* variables, so we use LAB_AWS_* instead
  if (!process.env.LAB_AWS_ACCESS_KEY_ID || !process.env.LAB_AWS_SECRET_ACCESS_KEY) {
    return NextResponse.json({
      sessionId,
      status: 'provisioning',
      message: 'Demo mode active. Add AWS credentials for real provisioning.',
    });
  }

  try {
    const region = process.env.LAB_AWS_REGION || 'ap-south-1';
    
    // Configure AWS clients with custom credentials
    const awsConfig = {
      region,
      credentials: {
        accessKeyId: process.env.LAB_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.LAB_AWS_SECRET_ACCESS_KEY,
      }
    };
    
    // 1. Find the EC2 instance
    const ec2 = new EC2Client(awsConfig);
    const describeCmd = new DescribeInstancesCommand({
      Filters: [
        { Name: 'tag:Name', Values: ['devops-duoo-lab-server'] },
        { Name: 'instance-state-name', Values: ['running'] }
      ]
    });
    
    const ec2Res = await ec2.send(describeCmd);
    const instance = ec2Res.Reservations?.[0]?.Instances?.[0];
    
    if (!instance || !instance.InstanceId || !instance.PublicIpAddress) {
      return NextResponse.json({
        sessionId,
        status: 'provisioning',
        message: 'Waiting for EC2 server to start...'
      });
    }

    const instanceId = instance.InstanceId;
    const publicIp = instance.PublicIpAddress;

    // 2. Query SSM to see if the container is running and what port it is on
    const ssm = new SSMClient(awsConfig);
    const ssmCmd = new SendCommandCommand({
      InstanceIds: [instanceId],
      DocumentName: 'AWS-RunShellScript',
      Parameters: {
        commands: [`docker ps --filter "name=lab-${sessionId}" --format "{{.Ports}}"`]
      }
    });

    const ssmRes = await ssm.send(ssmCmd);
    const commandId = ssmRes.Command?.CommandId;

    if (!commandId) {
      throw new Error("Failed to send SSM command");
    }

    // Wait briefly for the command to execute
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get the output
    const invocationCmd = new GetCommandInvocationCommand({
      CommandId: commandId,
      InstanceId: instanceId,
    });

    const invocationRes = await ssm.send(invocationCmd);
    const output = (invocationRes.StandardOutputContent || '').trim();

    // Parse docker output (e.g., "0.0.0.0:7681->7681/tcp")
    const portMatch = output.match(/:(\d+)->/);

    if (invocationRes.Status === 'Success' && portMatch && portMatch[1]) {
      const labDomain = process.env.LAB_DOMAIN || 'lab.devopsduoo.in';
      
      // Use HTTPS via Nginx reverse proxy with session-based routing
      const terminalUrl = `https://${labDomain}/s/${sessionId}/`;
      
      return NextResponse.json({
        sessionId,
        status: 'ready',
        terminalUrl,
        message: 'Lab is ready!',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      });
    } else {
      // Container not found or still building
      return NextResponse.json({
        sessionId,
        status: 'provisioning',
        message: 'Container is building or starting...'
      });
    }

  } catch (error) {
    console.error('Error checking lab status:', error);
    // If we error out checking AWS, just return provisioning so it keeps trying
    return NextResponse.json({
      sessionId,
      status: 'provisioning',
      message: 'Checking status...'
    });
  }
}
