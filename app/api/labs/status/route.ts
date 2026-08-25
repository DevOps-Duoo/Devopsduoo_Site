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
    const labDomain = process.env.LAB_DOMAIN || 'lab.devopsduoo.in';

    // 2. Query SSM to see if the container(s) are running
    // Check both single-node (lab-{sessionId}) and multi-node (lab-{sessionId}-*) patterns
    const ssm = new SSMClient(awsConfig);
    const ssmCmd = new SendCommandCommand({
      InstanceIds: [instanceId],
      DocumentName: 'AWS-RunShellScript',
      Parameters: {
        commands: [`docker ps --filter "name=lab-${sessionId}" --format "{{.Names}} {{.Ports}}"`]
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

    if (invocationRes.Status !== 'Success' || !output) {
      return NextResponse.json({
        sessionId,
        status: 'provisioning',
        message: 'Container is building or starting...'
      });
    }

    // Parse container output lines
    // Single-node:  "lab-session123 0.0.0.0:7681->7681/tcp"
    // Multi-node:   "lab-session123-master 0.0.0.0:7681->7681/tcp"
    //               "lab-session123-worker 0.0.0.0:7682->7681/tcp"
    const lines = output.split('\n').filter(l => l.trim());
    
    // Check if this is a multi-node lab (containers named lab-{sessionId}-{nodeId})
    const multiNodePattern = new RegExp(`^lab-${sessionId}-(\\w+)\\s`);
    const isMultiNode = lines.some(l => multiNodePattern.test(l));

    if (isMultiNode) {
      // Multi-node: build terminalUrls map
      const terminalUrls: Record<string, string> = {};
      
      for (const line of lines) {
        const nodeMatch = line.match(multiNodePattern);
        if (nodeMatch) {
          const nodeId = nodeMatch[1];
          const subSessionId = `${sessionId}-${nodeId}`;
          terminalUrls[nodeId] = `https://${labDomain}/s/${subSessionId}/`;
        }
      }

      if (Object.keys(terminalUrls).length === 0) {
        return NextResponse.json({
          sessionId,
          status: 'provisioning',
          message: 'Multi-node containers starting...'
        });
      }

      // Use the first node's URL as the primary terminalUrl
      const primaryUrl = terminalUrls['master'] || Object.values(terminalUrls)[0];

      return NextResponse.json({
        sessionId,
        status: 'ready',
        terminalUrl: primaryUrl,
        terminalUrls,
        message: 'Lab is ready!',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      });
    } else {
      // Single-node: original logic
      const portMatch = output.match(/:(\d+)->/);

      if (portMatch && portMatch[1]) {
        const terminalUrl = `https://${labDomain}/s/${sessionId}/`;
        
        // Verify Nginx has actually reloaded and mapped the route
        try {
          const checkRes = await fetch(terminalUrl, { method: 'HEAD' });
          if (!checkRes.ok && checkRes.status === 404) {
            return NextResponse.json({
              sessionId,
              status: 'provisioning',
              message: 'Waiting for reverse proxy mapping...'
            });
          }
        } catch (err) {
          // Ignore network errors here, just wait
        }
        
        return NextResponse.json({
          sessionId,
          status: 'ready',
          terminalUrl,
          message: 'Lab is ready!',
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        });
      } else {
        return NextResponse.json({
          sessionId,
          status: 'provisioning',
          message: 'Container is building or starting...'
        });
      }
    }

  } catch (error) {
    console.error('Error checking lab status:', error);
    return NextResponse.json({
      sessionId,
      status: 'provisioning',
      message: 'Checking status...'
    });
  }
}
