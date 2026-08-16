// Lab data types and catalog for DevOps Duoo Hands-On Labs Platform

export type LabDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type LabStatus = 'available' | 'coming-soon' | 'maintenance';
export type SessionStatus = 'queued' | 'provisioning' | 'ready' | 'active' | 'terminating' | 'terminated' | 'error';

export interface LabTool {
  name: string;
  icon: string; // react-icons identifier
}

export interface LabStep {
  title: string;
  description: string;
  command?: string;
  hint?: string;
  validation?: string;
}

export interface Lab {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  difficulty: LabDifficulty;
  estimatedMinutes: number;
  tools: string[];
  category: string;
  prerequisites: string[];
  learningObjectives: string[];
  steps: LabStep[];
  dockerImage: string;
  ecsTaskFamily: string;
  status: LabStatus;
  popularityScore: number;
}

export interface LabSession {
  sessionId: string;
  labId: string;
  status: SessionStatus;
  startedAt?: string;
  expiresAt?: string;
  terminalUrl?: string;
  errorMessage?: string;
}

// Difficulty metadata
export const difficultyConfig: Record<LabDifficulty, { label: string; color: string; bgColor: string; borderColor: string }> = {
  beginner: {
    label: 'Beginner',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
  },
  intermediate: {
    label: 'Intermediate',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
  advanced: {
    label: 'Advanced',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
  },
};

// Category metadata
export const categories = [
  { id: 'all', label: 'All Labs', icon: '🧪' },
  { id: 'linux', label: 'Linux', icon: '🐧' },
  { id: 'containers', label: 'Containers', icon: '🐳' },
  { id: 'orchestration', label: 'Orchestration', icon: '☸️' },
  { id: 'iac', label: 'Infrastructure as Code', icon: '🏗️' },
  { id: 'cicd', label: 'CI/CD', icon: '🔄' },
  { id: 'cloud', label: 'Cloud', icon: '☁️' },
  { id: 'monitoring', label: 'Monitoring', icon: '📊' },
];

// ─────────────────────────────────────────────────────────────
// Lab Catalog
// ─────────────────────────────────────────────────────────────

export const labs: Lab[] = [
  {
    id: 'redhat-basic-linux',
    title: 'Red Hat Basic Linux',
    shortDescription: 'Master essential Linux commands on a Red Hat environment. Learn file management, user administration, permissions, and shell scripting fundamentals.',
    fullDescription: `Get hands-on with Red Hat Enterprise Linux — the industry-leading enterprise OS. In this beginner-friendly lab, you'll explore the Linux command line, navigate the filesystem, manage users and permissions, work with processes, and write basic shell scripts.

This lab is perfect for anyone starting their DevOps journey. A solid Linux foundation is the prerequisite for every DevOps tool and practice.`,
    difficulty: 'beginner',
    estimatedMinutes: 25,
    tools: ['Linux', 'Bash', 'Red Hat'],
    category: 'linux',
    prerequisites: ['No prior experience required — just curiosity!'],
    learningObjectives: [
      'Navigate the Linux filesystem with confidence',
      'Manage files and directories (create, copy, move, delete)',
      'Understand and configure file permissions (chmod, chown)',
      'Work with users and groups',
      'Use essential commands: grep, find, pipe, redirection',
      'Write and execute basic Bash scripts',
    ],
    steps: [
      {
        title: 'Explore the System',
        description: 'Check your Linux distribution, kernel version, and system information.',
        command: 'cat /etc/redhat-release && uname -a && hostnamectl',
        hint: 'Red Hat-based systems use /etc/redhat-release for version info',
      },
      {
        title: 'Filesystem Navigation',
        description: 'Navigate the Linux directory structure and understand key directories.',
        command: 'pwd && ls -la / && cd /etc && ls -la',
        hint: 'Key directories: /etc (config), /var (logs), /home (users), /tmp (temporary)',
      },
      {
        title: 'File Management',
        description: 'Create, copy, move, and delete files and directories.',
        command: 'mkdir -p ~/lab/project && echo "Hello Linux!" > ~/lab/project/readme.txt && cp ~/lab/project/readme.txt ~/lab/project/backup.txt && cat ~/lab/project/readme.txt',
        hint: 'Use -p with mkdir to create parent directories automatically',
      },
      {
        title: 'Users & Permissions',
        description: 'Manage file permissions and understand the Linux permission model.',
        command: 'whoami && id && chmod 755 ~/lab/project/readme.txt && ls -la ~/lab/project/',
        hint: '755 = rwxr-xr-x (owner: full, group/others: read+execute)',
      },
      {
        title: 'Text Processing & Pipes',
        description: 'Use grep, find, and pipes to search and process text.',
        command: 'cat /etc/passwd | grep root && find /etc -name "*.conf" -maxdepth 1 2>/dev/null | head -5 && echo "DevOps Duoo" | wc -c',
        hint: 'Pipes (|) connect the output of one command to the input of another',
      },
      {
        title: 'Write a Shell Script',
        description: 'Create and execute your first Bash shell script.',
        command: 'cat > ~/lab/project/hello.sh << \'EOF\'\n#!/bin/bash\necho "=== System Report ==="\necho "Hostname: $(hostname)"\necho "Date: $(date)"\necho "Uptime: $(uptime -p)"\necho "Disk Usage:"\ndf -h / | tail -1\nEOF\nchmod +x ~/lab/project/hello.sh && ~/lab/project/hello.sh',
        hint: 'Always add #!/bin/bash as the first line and chmod +x to make scripts executable',
      },
    ],
    dockerImage: 'registry.access.redhat.com/ubi9/ubi:latest',
    ecsTaskFamily: 'lab-redhat-basic-linux',
    status: 'available',
    popularityScore: 98,
  },
  {
    id: 'docker-fundamentals',
    title: 'Docker Fundamentals',
    shortDescription: 'Learn to build, run, and manage Docker containers from scratch. Master images, volumes, networks, and Docker Compose.',
    fullDescription: `Master the fundamentals of containerization with Docker. In this hands-on lab, you'll learn to create Docker images, run containers, manage volumes and networks, and orchestrate multi-container applications with Docker Compose.

By the end of this lab, you'll be comfortable containerizing any application and understand the core concepts that power modern cloud-native deployments.`,
    difficulty: 'beginner',
    estimatedMinutes: 25,
    tools: ['Docker', 'Docker Compose'],
    category: 'containers',
    prerequisites: ['Basic Linux command line knowledge'],
    learningObjectives: [
      'Understand Docker images and containers',
      'Build custom Docker images with Dockerfiles',
      'Manage container lifecycle (start, stop, remove)',
      'Use volumes for persistent data',
      'Create multi-container apps with Docker Compose',
    ],
    steps: [
      {
        title: 'Verify Docker Installation',
        description: 'Let\'s start by verifying Docker is installed and running correctly.',
        command: 'docker --version && docker info',
        hint: 'Docker should show version 24.x or higher',
      },
      {
        title: 'Run Your First Container',
        description: 'Pull and run the official Nginx web server container.',
        command: 'docker run -d --name my-nginx -p 8080:80 nginx:alpine',
        hint: 'The -d flag runs the container in detached mode',
      },
      {
        title: 'Inspect Running Containers',
        description: 'List all running containers and inspect the Nginx container.',
        command: 'docker ps && docker inspect my-nginx',
      },
      {
        title: 'Build a Custom Image',
        description: 'Create a Dockerfile and build your own image.',
        command: 'echo "FROM nginx:alpine\\nCOPY index.html /usr/share/nginx/html/" > Dockerfile && echo "<h1>Hello DevOps Duoo!</h1>" > index.html && docker build -t my-app .',
        hint: 'The Dockerfile defines the blueprint for your image',
      },
      {
        title: 'Docker Compose',
        description: 'Create a multi-container application with Docker Compose.',
        command: 'cat > docker-compose.yml << EOF\nversion: "3.8"\nservices:\n  web:\n    image: nginx:alpine\n    ports:\n      - "8080:80"\n  redis:\n    image: redis:alpine\nEOF\ndocker compose up -d',
      },
      {
        title: 'Cleanup',
        description: 'Stop and remove all containers and images created during this lab.',
        command: 'docker compose down && docker rm -f my-nginx && docker rmi my-app',
      },
    ],
    dockerImage: 'devopsduoo/lab-docker:latest',
    ecsTaskFamily: 'lab-docker-fundamentals',
    status: 'coming-soon',
    popularityScore: 95,
  },
  {
    id: 'kubernetes-basics',
    title: 'Kubernetes Essentials',
    shortDescription: 'Deploy and manage applications on Kubernetes. Learn pods, services, deployments, and scaling with Minikube.',
    fullDescription: `Dive into Kubernetes — the industry-standard container orchestration platform. Using a local Minikube cluster, you'll learn to deploy applications, manage pods and services, scale workloads, and perform rolling updates.

This lab provides the foundational skills needed to manage production Kubernetes clusters.`,
    difficulty: 'intermediate',
    estimatedMinutes: 30,
    tools: ['Kubernetes', 'Minikube', 'kubectl'],
    category: 'orchestration',
    prerequisites: ['Docker Fundamentals lab or equivalent experience', 'Basic YAML knowledge'],
    learningObjectives: [
      'Understand Kubernetes architecture (pods, nodes, clusters)',
      'Deploy applications using kubectl',
      'Create and manage Services for networking',
      'Scale applications with Deployments',
      'Perform rolling updates and rollbacks',
    ],
    steps: [
      {
        title: 'Start Minikube Cluster',
        description: 'Initialize a local Kubernetes cluster using Minikube.',
        command: 'minikube start --driver=docker',
        hint: 'This will take 1-2 minutes to start',
      },
      {
        title: 'Explore the Cluster',
        description: 'Verify the cluster is running and explore its components.',
        command: 'kubectl cluster-info && kubectl get nodes',
      },
      {
        title: 'Deploy an Application',
        description: 'Create a deployment for an Nginx web server.',
        command: 'kubectl create deployment nginx-app --image=nginx:alpine --replicas=3',
      },
      {
        title: 'Expose with a Service',
        description: 'Create a Service to expose your application.',
        command: 'kubectl expose deployment nginx-app --type=NodePort --port=80',
      },
      {
        title: 'Scale the Application',
        description: 'Scale your deployment up and down.',
        command: 'kubectl scale deployment nginx-app --replicas=5 && kubectl get pods -w',
        hint: 'Watch as new pods are created in real-time',
      },
      {
        title: 'Rolling Update',
        description: 'Perform a rolling update to a new version.',
        command: 'kubectl set image deployment/nginx-app nginx=nginx:latest && kubectl rollout status deployment/nginx-app',
      },
    ],
    dockerImage: 'devopsduoo/lab-kubernetes:latest',
    ecsTaskFamily: 'lab-kubernetes-basics',
    status: 'coming-soon',
    popularityScore: 90,
  },
  {
    id: 'terraform-iac',
    title: 'Terraform Infrastructure as Code',
    shortDescription: 'Provision cloud infrastructure declaratively with Terraform. Learn HCL, state management, modules, and best practices.',
    fullDescription: `Learn Infrastructure as Code with HashiCorp Terraform. This hands-on lab teaches you to define, plan, and provision infrastructure using Terraform's declarative configuration language (HCL).

You'll work with local providers to safely practice Terraform workflows before applying these skills to real cloud resources.`,
    difficulty: 'intermediate',
    estimatedMinutes: 25,
    tools: ['Terraform', 'HCL'],
    category: 'iac',
    prerequisites: ['Basic understanding of cloud concepts', 'Command line familiarity'],
    learningObjectives: [
      'Write Terraform configuration in HCL',
      'Understand the plan-apply workflow',
      'Manage Terraform state',
      'Use variables and outputs',
      'Create reusable modules',
    ],
    steps: [
      {
        title: 'Verify Terraform',
        description: 'Check Terraform is installed and view available commands.',
        command: 'terraform --version && terraform -help',
      },
      {
        title: 'Write Your First Config',
        description: 'Create a simple Terraform configuration using the local provider.',
        command: 'mkdir -p terraform-lab && cd terraform-lab && cat > main.tf << \'EOF\'\nresource "local_file" "hello" {\n  content  = "Hello from Terraform!"\n  filename = "${path.module}/hello.txt"\n}\nEOF',
      },
      {
        title: 'Init & Plan',
        description: 'Initialize Terraform and create an execution plan.',
        command: 'cd terraform-lab && terraform init && terraform plan',
      },
      {
        title: 'Apply Configuration',
        description: 'Apply the configuration to create resources.',
        command: 'cd terraform-lab && terraform apply -auto-approve && cat hello.txt',
      },
      {
        title: 'Use Variables',
        description: 'Add variables to make your configuration dynamic.',
        command: 'cd terraform-lab && cat > variables.tf << \'EOF\'\nvariable "message" {\n  default = "Hello from DevOps Duoo!"\n}\nEOF\nterraform apply -auto-approve -var="message=Custom message!"',
      },
      {
        title: 'Destroy Resources',
        description: 'Clean up by destroying all managed resources.',
        command: 'cd terraform-lab && terraform destroy -auto-approve',
      },
    ],
    dockerImage: 'devopsduoo/lab-terraform:latest',
    ecsTaskFamily: 'lab-terraform-iac',
    status: 'coming-soon',
    popularityScore: 85,
  },
  {
    id: 'cicd-github-actions',
    title: 'CI/CD with GitHub Actions',
    shortDescription: 'Build automated CI/CD pipelines using GitHub Actions. Learn workflows, jobs, steps, and deployment strategies.',
    fullDescription: `Master Continuous Integration and Continuous Deployment with GitHub Actions. In this lab, you'll build real CI/CD pipelines that automate testing, building, and deploying applications.

Learn how to write workflow YAML, use marketplace actions, manage secrets, and implement deployment strategies.`,
    difficulty: 'beginner',
    estimatedMinutes: 20,
    tools: ['GitHub Actions', 'Git', 'YAML'],
    category: 'cicd',
    prerequisites: ['Basic Git knowledge', 'GitHub account familiarity'],
    learningObjectives: [
      'Understand GitHub Actions concepts (workflows, jobs, steps)',
      'Create workflow YAML files',
      'Use marketplace actions',
      'Set up CI pipelines for testing',
      'Implement CD pipelines for deployment',
    ],
    steps: [
      {
        title: 'Initialize a Git Repository',
        description: 'Create a sample project with a Git repository.',
        command: 'mkdir -p cicd-lab && cd cicd-lab && git init && echo "# CI/CD Lab" > README.md',
      },
      {
        title: 'Create a Workflow',
        description: 'Write your first GitHub Actions workflow file.',
        command: 'cd cicd-lab && mkdir -p .github/workflows && cat > .github/workflows/ci.yml << \'EOF\'\nname: CI Pipeline\non: [push]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - name: Run tests\n        run: echo "Running tests..."\nEOF',
      },
      {
        title: 'Add Build Steps',
        description: 'Extend the workflow with build and artifact steps.',
        command: 'cat .github/workflows/ci.yml',
        hint: 'Review the YAML structure: workflow → jobs → steps',
      },
      {
        title: 'Multi-Job Workflow',
        description: 'Create a workflow with multiple dependent jobs.',
        command: 'echo "Creating multi-stage pipeline with build → test → deploy..."',
      },
    ],
    dockerImage: 'devopsduoo/lab-cicd:latest',
    ecsTaskFamily: 'lab-cicd-github-actions',
    status: 'coming-soon',
    popularityScore: 88,
  },
  {
    id: 'aws-ecs-deployment',
    title: 'AWS ECS Deployment',
    shortDescription: 'Deploy containerized applications to AWS ECS with Fargate. Learn task definitions, services, and load balancing.',
    fullDescription: `Learn to deploy and manage containerized applications on AWS Elastic Container Service (ECS) with Fargate — the serverless compute engine for containers.

This lab walks you through creating task definitions, configuring services, setting up load balancers, and implementing auto-scaling for production-grade deployments.`,
    difficulty: 'advanced',
    estimatedMinutes: 30,
    tools: ['AWS ECS', 'AWS Fargate', 'AWS CLI', 'Docker'],
    category: 'cloud',
    prerequisites: ['Docker Fundamentals', 'Basic AWS knowledge', 'AWS CLI experience'],
    learningObjectives: [
      'Understand ECS architecture (clusters, tasks, services)',
      'Create ECS task definitions',
      'Deploy services with Fargate launch type',
      'Configure Application Load Balancer',
      'Implement auto-scaling policies',
    ],
    steps: [
      {
        title: 'Configure AWS CLI',
        description: 'Set up AWS CLI with lab credentials.',
        command: 'aws configure list && aws ecs list-clusters',
      },
      {
        title: 'Create ECS Cluster',
        description: 'Create a new ECS cluster for our deployment.',
        command: 'aws ecs create-cluster --cluster-name lab-cluster',
      },
      {
        title: 'Register Task Definition',
        description: 'Create a task definition for your containerized application.',
        command: 'echo "Creating task definition with Fargate compatibility..."',
      },
      {
        title: 'Create Service',
        description: 'Create an ECS service to run and maintain your tasks.',
        command: 'echo "Creating ECS service with desired count of 2..."',
      },
      {
        title: 'Scale & Monitor',
        description: 'Set up auto-scaling and monitor your deployment.',
        command: 'echo "Configuring target tracking scaling policy..."',
      },
    ],
    dockerImage: 'devopsduoo/lab-aws-ecs:latest',
    ecsTaskFamily: 'lab-aws-ecs-deployment',
    status: 'coming-soon',
    popularityScore: 82,
  },
  {
    id: 'prometheus-grafana-monitoring',
    title: 'Monitoring with Prometheus & Grafana',
    shortDescription: 'Set up a complete monitoring stack with Prometheus for metrics collection and Grafana for visualization and alerting.',
    fullDescription: `Build a production-grade monitoring stack using Prometheus and Grafana. Learn to collect metrics, create dashboards, set up alerts, and gain visibility into your infrastructure and applications.

This lab covers the full observability pipeline from metric collection to beautiful dashboards.`,
    difficulty: 'intermediate',
    estimatedMinutes: 25,
    tools: ['Prometheus', 'Grafana', 'Docker Compose'],
    category: 'monitoring',
    prerequisites: ['Docker Fundamentals', 'Basic networking concepts'],
    learningObjectives: [
      'Set up Prometheus for metrics collection',
      'Configure metric exporters (Node Exporter)',
      'Create Grafana dashboards',
      'Write PromQL queries',
      'Set up alerting rules',
    ],
    steps: [
      {
        title: 'Launch Monitoring Stack',
        description: 'Use Docker Compose to launch Prometheus and Grafana.',
        command: 'docker compose -f monitoring-stack.yml up -d',
      },
      {
        title: 'Explore Prometheus',
        description: 'Access the Prometheus UI and explore available metrics.',
        command: 'curl -s localhost:9090/api/v1/targets | jq .',
      },
      {
        title: 'Write PromQL Queries',
        description: 'Learn to query metrics using PromQL.',
        command: 'curl -s "localhost:9090/api/v1/query?query=up" | jq .',
      },
      {
        title: 'Configure Grafana Dashboard',
        description: 'Create a custom Grafana dashboard with key metrics.',
        command: 'echo "Access Grafana at http://localhost:3000 (admin/admin)"',
      },
      {
        title: 'Set Up Alerts',
        description: 'Configure Prometheus alerting rules.',
        command: 'echo "Creating alert rules for high CPU and memory usage..."',
      },
    ],
    dockerImage: 'devopsduoo/lab-monitoring:latest',
    ecsTaskFamily: 'lab-prometheus-grafana',
    status: 'coming-soon',
    popularityScore: 78,
  },
  {
    id: 'ansible-automation',
    title: 'Ansible Configuration Management',
    shortDescription: 'Automate server configuration with Ansible. Learn playbooks, roles, inventories, and idempotent automation.',
    fullDescription: `Master configuration management and automation with Ansible. This lab teaches you to write playbooks, create roles, manage inventories, and automate repetitive infrastructure tasks — all without agents.

You'll practice on local Docker containers simulating real servers.`,
    difficulty: 'intermediate',
    estimatedMinutes: 25,
    tools: ['Ansible', 'YAML', 'SSH'],
    category: 'iac',
    prerequisites: ['Basic Linux administration', 'SSH familiarity'],
    learningObjectives: [
      'Write Ansible playbooks in YAML',
      'Manage inventories and host groups',
      'Use Ansible modules for common tasks',
      'Create reusable roles',
      'Understand idempotency in automation',
    ],
    steps: [
      {
        title: 'Verify Ansible',
        description: 'Check Ansible is installed and configured.',
        command: 'ansible --version && ansible-config dump --only-changed',
      },
      {
        title: 'Create Inventory',
        description: 'Set up an inventory file with target hosts.',
        command: 'echo "[webservers]\\nlocalhost ansible_connection=local" > inventory.ini',
      },
      {
        title: 'First Playbook',
        description: 'Write and run your first Ansible playbook.',
        command: 'cat > playbook.yml << \'EOF\'\n---\n- hosts: webservers\n  tasks:\n    - name: Create a file\n      file:\n        path: /tmp/ansible-lab\n        state: directory\nEOF\nansible-playbook -i inventory.ini playbook.yml',
      },
      {
        title: 'Use Variables & Templates',
        description: 'Add variables and Jinja2 templates to your playbook.',
        command: 'echo "Adding dynamic configuration with variables..."',
      },
    ],
    dockerImage: 'devopsduoo/lab-ansible:latest',
    ecsTaskFamily: 'lab-ansible-automation',
    status: 'coming-soon',
    popularityScore: 75,
  },
  {
    id: 'helm-charts',
    title: 'Kubernetes Helm Charts',
    shortDescription: 'Package and deploy Kubernetes applications with Helm. Learn chart creation, templating, and release management.',
    fullDescription: `Learn to package, version, and deploy Kubernetes applications using Helm — the package manager for Kubernetes. Create your own Helm charts, use templating for dynamic configurations, and manage application releases.`,
    difficulty: 'advanced',
    estimatedMinutes: 30,
    tools: ['Helm', 'Kubernetes', 'YAML'],
    category: 'orchestration',
    prerequisites: ['Kubernetes Essentials lab', 'YAML proficiency'],
    learningObjectives: [
      'Understand Helm chart structure',
      'Create custom Helm charts',
      'Use Helm templating with Go templates',
      'Manage releases (install, upgrade, rollback)',
      'Use Helm repositories',
    ],
    steps: [
      {
        title: 'Verify Helm',
        description: 'Check Helm is installed and explore available commands.',
        command: 'helm version && helm repo list',
      },
      {
        title: 'Create a Chart',
        description: 'Scaffold a new Helm chart.',
        command: 'helm create my-app && tree my-app/',
      },
      {
        title: 'Install Chart',
        description: 'Deploy your chart to the Kubernetes cluster.',
        command: 'helm install my-release my-app/',
      },
      {
        title: 'Upgrade Release',
        description: 'Update values and perform a Helm upgrade.',
        command: 'helm upgrade my-release my-app/ --set replicaCount=3',
      },
    ],
    dockerImage: 'devopsduoo/lab-helm:latest',
    ecsTaskFamily: 'lab-helm-charts',
    status: 'coming-soon',
    popularityScore: 70,
  },
];

// Helper functions
export function getLabById(id: string): Lab | undefined {
  return labs.find((lab) => lab.id === id);
}

export function getLabsByCategory(category: string): Lab[] {
  if (category === 'all') return labs;
  return labs.filter((lab) => lab.category === category);
}

export function getLabsByDifficulty(difficulty: LabDifficulty): Lab[] {
  return labs.filter((lab) => lab.difficulty === difficulty);
}

export function getAvailableLabs(): Lab[] {
  return labs.filter((lab) => lab.status === 'available');
}

export function searchLabs(query: string): Lab[] {
  const q = query.toLowerCase();
  return labs.filter(
    (lab) =>
      lab.title.toLowerCase().includes(q) ||
      lab.shortDescription.toLowerCase().includes(q) ||
      lab.tools.some((t) => t.toLowerCase().includes(q)) ||
      lab.category.toLowerCase().includes(q)
  );
}
