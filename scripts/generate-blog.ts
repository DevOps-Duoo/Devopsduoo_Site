/**
 * DevOps Duoo - AI Blog Generator
 * 
 * This script uses Google Gemini API (free tier) to generate SEO-optimized blog posts
 * for the DevOps Duoo website.
 * 
 * Usage:
 *   npx tsx scripts/generate-blog.ts
 * 
 * Environment Variables:
 *   GROQ_API_KEY - Your Groq API key (free from https://console.groq.com)
 */

import fs from 'fs';
import path from 'path';

interface BlogTopic {
  topic: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  category: 'kubernetes' | 'cicd' | 'cloud' | 'monitoring' | 'security' | 'automation' | 'interview';
  intent: 'tutorial' | 'troubleshooting' | 'guide' | 'interview' | 'comparison';
  targetLength: number;
}

interface GeneratedBlog {
  title: string;
  slug: string;
  description: string;
  content: string;
  keywords: string[];
  category: string;
  readTime: number;
}

// ============================================
// TOPIC QUEUE - Add your topics here
// ============================================
const TOPICS_QUEUE: BlogTopic[] = [
  {
    topic: "Kubernetes CPU Alert Not Firing - Complete Troubleshooting Guide",
    primaryKeyword: "kubernetes cpu alert not firing",
    secondaryKeywords: ["prometheus alerting", "kubernetes monitoring", "cpu throttling", "alertmanager troubleshooting"],
    category: "kubernetes",
    intent: "troubleshooting",
    targetLength: 1800
  },
  {
    topic: "GitLab CI/CD Pipeline Optimization for Large Monorepos",
    primaryKeyword: "gitlab ci cd pipeline optimization",
    secondaryKeywords: ["monorepo ci cd", "gitlab runner optimization", "pipeline caching", "parallel jobs"],
    category: "cicd",
    intent: "tutorial",
    targetLength: 2000
  },
  {
    topic: "Terraform State Management Best Practices for Production",
    primaryKeyword: "terraform state management best practices",
    secondaryKeywords: ["terraform remote state", "state locking", "terraform workspaces", "state migration"],
    category: "automation",
    intent: "guide",
    targetLength: 1800
  },
  {
    topic: "Kubernetes Pod Stuck in Terminating State - How to Fix",
    primaryKeyword: "kubernetes pod stuck terminating",
    secondaryKeywords: ["kubectl delete force", "finalizers removal", "pod eviction", "graceful shutdown"],
    category: "kubernetes",
    intent: "troubleshooting",
    targetLength: 1500
  },
  {
    topic: "AWS EKS vs Self-Managed Kubernetes - Production Comparison",
    primaryKeyword: "eks vs self managed kubernetes",
    secondaryKeywords: ["kubernetes production", "eks cost comparison", "managed kubernetes", "kubernetes operations"],
    category: "cloud",
    intent: "comparison",
    targetLength: 2200
  },
  {
    topic: "Docker Build Cache Optimization - Reduce Build Times by 80%",
    primaryKeyword: "docker build cache optimization",
    secondaryKeywords: ["dockerfile optimization", "docker layer caching", "multi-stage builds", "buildkit cache"],
    category: "cicd",
    intent: "tutorial",
    targetLength: 1600
  },
  {
    topic: "Prometheus Memory Usage Too High - Optimization Guide",
    primaryKeyword: "prometheus memory usage optimization",
    secondaryKeywords: ["prometheus cardinality", "metric retention", "prometheus federation", "thanos"],
    category: "monitoring",
    intent: "troubleshooting",
    targetLength: 1800
  },
  {
    topic: "Kubernetes RBAC Best Practices for Multi-Tenant Clusters",
    primaryKeyword: "kubernetes rbac best practices",
    secondaryKeywords: ["kubernetes multi-tenancy", "namespace isolation", "service account security", "cluster roles"],
    category: "security",
    intent: "guide",
    targetLength: 2000
  },
  {
    topic: "Jenkins to GitHub Actions Migration - Complete Guide",
    primaryKeyword: "jenkins to github actions migration",
    secondaryKeywords: ["github actions tutorial", "cicd migration", "jenkins replacement", "workflow conversion"],
    category: "cicd",
    intent: "tutorial",
    targetLength: 2200
  },
  {
    topic: "Helm Chart Development Best Practices",
    primaryKeyword: "helm chart best practices",
    secondaryKeywords: ["helm templates", "helm values", "chart testing", "helm dependencies"],
    category: "kubernetes",
    intent: "guide",
    targetLength: 1800
  },
  {
    topic: "Top 25 Kubernetes Interview Questions for Senior DevOps Engineers",
    primaryKeyword: "kubernetes interview questions",
    secondaryKeywords: ["devops interview", "k8s troubleshooting questions", "kubernetes scenarios", "senior devops interview"],
    category: "interview",
    intent: "interview",
    targetLength: 2500
  },
  {
    topic: "ArgoCD vs Flux - GitOps Tool Comparison for 2026",
    primaryKeyword: "argocd vs flux",
    secondaryKeywords: ["gitops tools", "kubernetes deployment", "argocd tutorial", "flux cd"],
    category: "cicd",
    intent: "comparison",
    targetLength: 2000
  },
  {
    topic: "Kubernetes Ingress Controller Comparison - Nginx vs Traefik vs HAProxy",
    primaryKeyword: "kubernetes ingress controller comparison",
    secondaryKeywords: ["nginx ingress", "traefik kubernetes", "haproxy ingress", "ingress best practices"],
    category: "kubernetes",
    intent: "comparison",
    targetLength: 2000
  },
  {
    topic: "GitHub Actions Self-Hosted Runners - Setup and Security Guide",
    primaryKeyword: "github actions self hosted runners",
    secondaryKeywords: ["self hosted runner setup", "runner security", "autoscaling runners", "github actions optimization"],
    category: "cicd",
    intent: "tutorial",
    targetLength: 1800
  },
  {
    topic: "Kubernetes Network Policies - Complete Security Guide",
    primaryKeyword: "kubernetes network policies",
    secondaryKeywords: ["pod network security", "calico network policy", "cilium network policy", "zero trust kubernetes"],
    category: "security",
    intent: "guide",
    targetLength: 2000
  },
  {
    topic: "Grafana Dashboard Best Practices for DevOps Teams",
    primaryKeyword: "grafana dashboard best practices",
    secondaryKeywords: ["grafana monitoring", "dashboard design", "prometheus grafana", "alerting dashboards"],
    category: "monitoring",
    intent: "guide",
    targetLength: 1800
  },
  {
    topic: "AWS Lambda Cold Start Optimization Techniques",
    primaryKeyword: "aws lambda cold start optimization",
    secondaryKeywords: ["serverless performance", "lambda provisioned concurrency", "cold start reduction", "lambda best practices"],
    category: "cloud",
    intent: "tutorial",
    targetLength: 1600
  },
  {
    topic: "Kubernetes HPA vs VPA - Autoscaling Deep Dive",
    primaryKeyword: "kubernetes hpa vs vpa autoscaling",
    secondaryKeywords: ["horizontal pod autoscaler", "vertical pod autoscaler", "kubernetes scaling", "custom metrics autoscaling"],
    category: "kubernetes",
    intent: "comparison",
    targetLength: 2000
  },
  {
    topic: "Ansible vs Terraform - When to Use Each for Infrastructure",
    primaryKeyword: "ansible vs terraform",
    secondaryKeywords: ["infrastructure as code", "configuration management", "ansible playbooks", "terraform modules"],
    category: "automation",
    intent: "comparison",
    targetLength: 2000
  },
  {
    topic: "Container Security Scanning - Tools and Best Practices",
    primaryKeyword: "container security scanning",
    secondaryKeywords: ["trivy container scanning", "docker security", "vulnerability scanning", "image signing"],
    category: "security",
    intent: "guide",
    targetLength: 1800
  },
  {
    topic: "Kubernetes Troubleshooting - CrashLoopBackOff Complete Fix Guide",
    primaryKeyword: "kubernetes crashloopbackoff fix",
    secondaryKeywords: ["pod crash debugging", "container restart", "kubernetes logs", "oomkilled troubleshooting"],
    category: "kubernetes",
    intent: "troubleshooting",
    targetLength: 1800
  },
  {
    topic: "Terraform Modules - Building Reusable Infrastructure Components",
    primaryKeyword: "terraform modules best practices",
    secondaryKeywords: ["terraform module structure", "module registry", "reusable infrastructure", "terraform composition"],
    category: "automation",
    intent: "tutorial",
    targetLength: 2000
  },
  {
    topic: "Kubernetes Secrets Management with HashiCorp Vault",
    primaryKeyword: "kubernetes secrets vault",
    secondaryKeywords: ["hashicorp vault kubernetes", "secret injection", "vault agent", "external secrets operator"],
    category: "security",
    intent: "tutorial",
    targetLength: 2000
  },
  {
    topic: "CI/CD Pipeline Security - Shift Left Best Practices",
    primaryKeyword: "cicd pipeline security",
    secondaryKeywords: ["shift left security", "devsecops", "pipeline vulnerability scanning", "supply chain security"],
    category: "security",
    intent: "guide",
    targetLength: 1800
  },
  {
    topic: "Kubernetes Resource Limits and Requests - Complete Guide",
    primaryKeyword: "kubernetes resource limits requests",
    secondaryKeywords: ["cpu memory limits", "resource quota", "limit range", "quality of service"],
    category: "kubernetes",
    intent: "guide",
    targetLength: 1800
  },
  {
    topic: "Azure DevOps vs GitHub Actions - Which CI/CD to Choose",
    primaryKeyword: "azure devops vs github actions",
    secondaryKeywords: ["azure pipelines", "cicd comparison", "azure devops migration", "github actions enterprise"],
    category: "cicd",
    intent: "comparison",
    targetLength: 2000
  },
  {
    topic: "Kubernetes Service Mesh - Istio vs Linkerd Comparison",
    primaryKeyword: "istio vs linkerd service mesh",
    secondaryKeywords: ["service mesh kubernetes", "istio setup", "linkerd tutorial", "microservices networking"],
    category: "kubernetes",
    intent: "comparison",
    targetLength: 2200
  },
  {
    topic: "AWS S3 Bucket Security Best Practices",
    primaryKeyword: "aws s3 security best practices",
    secondaryKeywords: ["s3 bucket policy", "s3 encryption", "s3 access control", "s3 compliance"],
    category: "cloud",
    intent: "guide",
    targetLength: 1600
  },
  {
    topic: "Linux Performance Troubleshooting for DevOps Engineers",
    primaryKeyword: "linux performance troubleshooting",
    secondaryKeywords: ["linux monitoring commands", "cpu troubleshooting", "memory leak linux", "disk io performance"],
    category: "automation",
    intent: "troubleshooting",
    targetLength: 2000
  },
  {
    topic: "Kubernetes Disaster Recovery - Backup and Restore Strategies",
    primaryKeyword: "kubernetes disaster recovery backup",
    secondaryKeywords: ["velero backup", "etcd backup restore", "cluster recovery", "kubernetes dr strategy"],
    category: "kubernetes",
    intent: "guide",
    targetLength: 2000
  },
  {
    topic: "Top 30 DevOps Interview Questions and Answers for 2026",
    primaryKeyword: "devops interview questions 2026",
    secondaryKeywords: ["devops interview preparation", "senior devops questions", "cicd interview", "infrastructure interview"],
    category: "interview",
    intent: "interview",
    targetLength: 2500
  },
  {
    topic: "Nginx Configuration Best Practices for Production",
    primaryKeyword: "nginx configuration best practices",
    secondaryKeywords: ["nginx reverse proxy", "nginx performance tuning", "nginx security", "nginx load balancing"],
    category: "automation",
    intent: "guide",
    targetLength: 1800
  },
  {
    topic: "Kubernetes Pod Scheduling - Affinity and Anti-Affinity Explained",
    primaryKeyword: "kubernetes pod affinity anti-affinity",
    secondaryKeywords: ["node affinity", "pod topology", "taints tolerations", "kubernetes scheduling"],
    category: "kubernetes",
    intent: "tutorial",
    targetLength: 1800
  },
  {
    topic: "Monitoring Kubernetes with Datadog - Complete Setup Guide",
    primaryKeyword: "kubernetes datadog monitoring",
    secondaryKeywords: ["datadog kubernetes", "datadog agent", "apm kubernetes", "datadog dashboards"],
    category: "monitoring",
    intent: "tutorial",
    targetLength: 1800
  },
  {
    topic: "Git Branching Strategies for DevOps Teams",
    primaryKeyword: "git branching strategy devops",
    secondaryKeywords: ["gitflow", "trunk based development", "feature branching", "release management"],
    category: "cicd",
    intent: "guide",
    targetLength: 1600
  },
  {
    topic: "AWS CloudFormation vs Terraform - Infrastructure as Code Comparison",
    primaryKeyword: "cloudformation vs terraform",
    secondaryKeywords: ["infrastructure as code comparison", "aws iac", "terraform aws", "cloudformation templates"],
    category: "cloud",
    intent: "comparison",
    targetLength: 2000
  },
  {
    topic: "Kubernetes Persistent Volumes - Storage Best Practices",
    primaryKeyword: "kubernetes persistent volumes best practices",
    secondaryKeywords: ["pv pvc kubernetes", "storage class", "dynamic provisioning", "stateful applications"],
    category: "kubernetes",
    intent: "guide",
    targetLength: 1800
  },
  {
    topic: "ELK Stack Setup for Kubernetes Log Management",
    primaryKeyword: "elk stack kubernetes logging",
    secondaryKeywords: ["elasticsearch kubernetes", "fluentd logging", "kibana dashboards", "centralized logging"],
    category: "monitoring",
    intent: "tutorial",
    targetLength: 2000
  },
  {
    topic: "Kubernetes Multi-Cluster Management Best Practices",
    primaryKeyword: "kubernetes multi cluster management",
    secondaryKeywords: ["multi cluster kubernetes", "cluster federation", "kubefed", "multi cluster networking"],
    category: "kubernetes",
    intent: "guide",
    targetLength: 2000
  },
  {
    topic: "SonarQube Integration in CI/CD Pipeline - Quality Gate Setup",
    primaryKeyword: "sonarqube cicd integration",
    secondaryKeywords: ["code quality gate", "sonarqube github actions", "static code analysis", "sonarqube docker"],
    category: "cicd",
    intent: "tutorial",
    targetLength: 1800
  },
,
  {
    topic: "Prometheus Alertmanager High Availability Setup",
    primaryKeyword: "alertmanager high availability",
    secondaryKeywords: ["prometheus ha","alertmanager clustering","monitoring reliability","gossip protocol"],
    category: "monitoring",
    intent: "tutorial",
    targetLength: 2000
  },
  {
    topic: "How to Secure Kubernetes API Server",
    primaryKeyword: "secure kubernetes api server",
    secondaryKeywords: ["k8s api security","api server audit","kubernetes hardening","kube-apiserver"],
    category: "security",
    intent: "guide",
    targetLength: 1800
  },
  {
    topic: "Using External Secrets Operator with AWS Secrets Manager",
    primaryKeyword: "external secrets operator aws",
    secondaryKeywords: ["kubernetes secrets manager","aws sm kubernetes","eso setup","secret synchronization"],
    category: "security",
    intent: "tutorial",
    targetLength: 1800
  },
  {
    topic: "Setting up a GitOps Workflow with Flux v2",
    primaryKeyword: "gitops workflow flux v2",
    secondaryKeywords: ["flux cd tutorial","gitops kubernetes","flux bootstrap","kustomize flux"],
    category: "cicd",
    intent: "tutorial",
    targetLength: 2200
  },
  {
    topic: "Terraform vs OpenTofu - Which one to choose in 2026?",
    primaryKeyword: "terraform vs opentofu",
    secondaryKeywords: ["opentofu migration","iac tools 2026","hashicorp license change","opentofu features"],
    category: "automation",
    intent: "comparison",
    targetLength: 2000
  },
  {
    topic: "Docker Security Best Practices for Production Images",
    primaryKeyword: "docker security best practices",
    secondaryKeywords: ["docker image hardening","non-root containers","docker vulnerability scanning","minimal base images"],
    category: "security",
    intent: "guide",
    targetLength: 1800
  },
  {
    topic: "Managing Multiple EKS Clusters with Terraform",
    primaryKeyword: "manage multiple eks clusters terraform",
    secondaryKeywords: ["terraform eks module","aws multi cluster","infrastructure scaling","eks lifecycle"],
    category: "automation",
    intent: "guide",
    targetLength: 2200
  },
  {
    topic: "How to Configure HPA based on Custom Prometheus Metrics",
    primaryKeyword: "kubernetes hpa custom metrics prometheus",
    secondaryKeywords: ["prometheus adapter","custom metrics api","hpa scaling rules","k8s autoscaling"],
    category: "kubernetes",
    intent: "tutorial",
    targetLength: 2000
  },
  {
    topic: "CI/CD for Serverless Applications on AWS",
    primaryKeyword: "cicd serverless aws",
    secondaryKeywords: ["serverless framework cicd","aws sam pipelines","lambda deployment","github actions serverless"],
    category: "cicd",
    intent: "guide",
    targetLength: 1800
  },
  {
    topic: "Linux System Performance Tuning for High Load Servers",
    primaryKeyword: "linux performance tuning high load",
    secondaryKeywords: ["sysctl tuning","tcp/ip stack optimization","linux kernel parameters","ulimit configuration"],
    category: "automation",
    intent: "guide",
    targetLength: 2000
  },
  {
    topic: "Debugging DNS Issues in Kubernetes Clusters",
    primaryKeyword: "kubernetes dns troubleshooting",
    secondaryKeywords: ["coredns debugging","ndots issue","k8s service discovery","dns resolution timeout"],
    category: "kubernetes",
    intent: "troubleshooting",
    targetLength: 1800
  },
  {
    topic: "Creating Reusable GitHub Actions Workflows",
    primaryKeyword: "reusable github actions workflows",
    secondaryKeywords: ["github actions templates","workflow_call","composite actions","cicd standardization"],
    category: "cicd",
    intent: "tutorial",
    targetLength: 1600
  },
  {
    topic: "Securing CI/CD Secrets in GitHub Actions",
    primaryKeyword: "github actions secrets security",
    secondaryKeywords: ["oidc github actions","github environments","secret masking","github token permissions"],
    category: "security",
    intent: "guide",
    targetLength: 1800
  },
  {
    topic: "Implementing Zero Downtime Deployments in Kubernetes",
    primaryKeyword: "zero downtime deployment kubernetes",
    secondaryKeywords: ["rolling updates k8s","readiness probes","graceful termination","blue green deployment"],
    category: "kubernetes",
    intent: "guide",
    targetLength: 2000
  },
  {
    topic: "AWS IAM Roles for Service Accounts (IRSA) Explained",
    primaryKeyword: "aws irsa eks",
    secondaryKeywords: ["eks pod security","iam roles for service accounts","oidc provider aws","least privilege eks"],
    category: "cloud",
    intent: "tutorial",
    targetLength: 1800
  },
  {
    topic: "Setting up Distributed Tracing with OpenTelemetry and Jaeger",
    primaryKeyword: "opentelemetry jaeger setup",
    secondaryKeywords: ["distributed tracing kubernetes","otel collector","microservices observability","jaeger tracing"],
    category: "monitoring",
    intent: "tutorial",
    targetLength: 2200
  },
  {
    topic: "How to Build Minimal Docker Images using Alpine and Distroless",
    primaryKeyword: "minimal docker images distroless alpine",
    secondaryKeywords: ["distroless vs alpine","docker multistage build","reduce image size","secure base images"],
    category: "automation",
    intent: "tutorial",
    targetLength: 1600
  },
  {
    topic: "Cost Optimization Strategies for AWS EKS",
    primaryKeyword: "eks cost optimization",
    secondaryKeywords: ["karpenter autoscaling","spot instances eks","fargate pricing","rightsizing pods"],
    category: "cloud",
    intent: "guide",
    targetLength: 1800
  },
  {
    topic: "Automating Database Migrations in CI/CD Pipelines",
    primaryKeyword: "database migrations cicd",
    secondaryKeywords: ["flyway cicd","liquibase automation","schema migration strategy","zero downtime database deployment"],
    category: "cicd",
    intent: "guide",
    targetLength: 2000
  },
  {
    topic: "Understanding Kubernetes Node Affinity and Taints",
    primaryKeyword: "kubernetes node affinity taints",
    secondaryKeywords: ["node selector","tolerations","pod scheduling","dedicated nodes k8s"],
    category: "kubernetes",
    intent: "guide",
    targetLength: 1800
  },
  {
    topic: "Implementing Network Policies with Cilium",
    primaryKeyword: "cilium network policies",
    secondaryKeywords: ["ebpf kubernetes","cilium security","l7 network policy","container network interface"],
    category: "security",
    intent: "tutorial",
    targetLength: 2000
  },
  {
    topic: "Top 20 Terraform Interview Questions and Answers",
    primaryKeyword: "terraform interview questions",
    secondaryKeywords: ["iac interview","terraform state questions","terraform modules interview","devops interview prep"],
    category: "interview",
    intent: "interview",
    targetLength: 2500
  },
  {
    topic: "How to Write Custom Prometheus Exporters in Python",
    primaryKeyword: "custom prometheus exporter python",
    secondaryKeywords: ["prometheus client library","monitoring custom metrics","python metric exposition","prometheus integration"],
    category: "monitoring",
    intent: "tutorial",
    targetLength: 1800
  },
  {
    topic: "Scaling GitLab Runners on Kubernetes",
    primaryKeyword: "gitlab runner kubernetes executor",
    secondaryKeywords: ["autoscaling gitlab runners","k8s executor","ci cd scalability","gitlab runner helm"],
    category: "cicd",
    intent: "guide",
    targetLength: 2000
  },
  {
    topic: "AWS VPC Peering vs Transit Gateway",
    primaryKeyword: "vpc peering vs transit gateway",
    secondaryKeywords: ["aws networking","multi vpc architecture","transit gateway cost","network topology aws"],
    category: "cloud",
    intent: "comparison",
    targetLength: 1800
  },
  {
    topic: "Using Kustomize for Environment Specific Kubernetes Deployments",
    primaryKeyword: "kustomize environment deployments",
    secondaryKeywords: ["kubernetes configuration management","kustomize overlays","kustomize bases","helm vs kustomize"],
    category: "kubernetes",
    intent: "tutorial",
    targetLength: 1800
  },
  {
    topic: "Setting up Log Retention and Archiving in Elasticsearch",
    primaryKeyword: "elasticsearch log retention",
    secondaryKeywords: ["ilm elasticsearch","index lifecycle management","elk stack storage","log archiving strategy"],
    category: "monitoring",
    intent: "guide",
    targetLength: 1800
  },
  {
    topic: "Best Practices for Writing Bash Scripts in DevOps",
    primaryKeyword: "bash scripting best practices devops",
    secondaryKeywords: ["shell script error handling","bash strict mode","shellcheck","automation scripts"],
    category: "automation",
    intent: "guide",
    targetLength: 1600
  },
  {
    topic: "Understanding Istio Traffic Management and Routing",
    primaryKeyword: "istio traffic management",
    secondaryKeywords: ["virtual service istio","destination rule","canary deployment istio","service mesh routing"],
    category: "kubernetes",
    intent: "guide",
    targetLength: 2000
  },
  {
    topic: "Top 15 CI/CD Interview Questions for DevOps Engineers",
    primaryKeyword: "cicd interview questions",
    secondaryKeywords: ["continuous integration interview","deployment strategies questions","pipeline security interview","jenkins github actions prep"],
    category: "interview",
    intent: "interview",
    targetLength: 2200
  },
  {
    topic: "Securing Kubernetes Dashboard with OIDC Integration",
    primaryKeyword: "kubernetes dashboard oidc",
    secondaryKeywords: ["k8s dashboard security","dex kubernetes","oauth2 proxy","sso kubernetes dashboard"],
    category: "security",
    intent: "tutorial",
    targetLength: 2000
  },
  {
    topic: "How to Troubleshoot High Memory Usage in Java Containers",
    primaryKeyword: "troubleshoot high memory java container",
    secondaryKeywords: ["oomkilled java","jvm memory limits docker","heap dump kubernetes","java container optimization"],
    category: "monitoring",
    intent: "troubleshooting",
    targetLength: 2000
  },
  {
    topic: "AWS ECS vs EKS - Which Container Service to Choose?",
    primaryKeyword: "aws ecs vs eks",
    secondaryKeywords: ["fargate ecs eks","container orchestration aws","ecs simplicity","eks flexibility"],
    category: "cloud",
    intent: "comparison",
    targetLength: 2200
  },
  {
    topic: "Implementing Canary Deployments with Argo Rollouts",
    primaryKeyword: "argo rollouts canary deployment",
    secondaryKeywords: ["kubernetes progressive delivery","argo cd rollouts","metric based promotion","blue green argo"],
    category: "cicd",
    intent: "tutorial",
    targetLength: 2000
  },
  {
    topic: "Setting up Promtail and Loki for Kubernetes Log Aggregation",
    primaryKeyword: "loki promtail kubernetes",
    secondaryKeywords: ["grafana loki setup","log aggregation k8s","promtail configuration","elk alternative"],
    category: "monitoring",
    intent: "tutorial",
    targetLength: 1800
  },
  {
    topic: "Infrastructure as Code Security Scanning with Checkov",
    primaryKeyword: "checkov iac security",
    secondaryKeywords: ["terraform security scan","checkov github actions","cloudformation security","devsecops iac"],
    category: "security",
    intent: "tutorial",
    targetLength: 1800
  },
  {
    topic: "Managing Terraform State in a Team Environment",
    primaryKeyword: "terraform state management team",
    secondaryKeywords: ["terraform cloud","remote backend s3","state locking dynamodb","terraform collaboration"],
    category: "automation",
    intent: "guide",
    targetLength: 1800
  },
  {
    topic: "Optimizing Node.js Application Performance in Docker",
    primaryKeyword: "nodejs performance docker",
    secondaryKeywords: ["pm2 docker","nodejs memory limits","docker node environment","node cluster mode"],
    category: "automation",
    intent: "guide",
    targetLength: 1800
  },
  {
    topic: "How to Create a Highly Available Kubernetes Cluster with Kubeadm",
    primaryKeyword: "ha kubernetes cluster kubeadm",
    secondaryKeywords: ["kubeadm ha setup","stacked etcd","external etcd","kubernetes control plane ha"],
    category: "kubernetes",
    intent: "tutorial",
    targetLength: 2500
  },
  {
    topic: "Using Datadog APM for Microservices Troubleshooting",
    primaryKeyword: "datadog apm troubleshooting",
    secondaryKeywords: ["distributed tracing datadog","apm bottleneck","microservices performance","datadog traces"],
    category: "monitoring",
    intent: "troubleshooting",
    targetLength: 1800
  },
  {
    topic: "Top 25 AWS Interview Questions for Cloud Engineers",
    primaryKeyword: "aws interview questions",
    secondaryKeywords: ["aws solutions architect interview","cloud engineer questions","vpc interview questions","aws security interview"],
    category: "interview",
    intent: "interview",
    targetLength: 2500
  },
  {
    topic: "Automating SSL Certificate Management with cert-manager",
    primaryKeyword: "cert-manager kubernetes setup",
    secondaryKeywords: ["lets encrypt k8s","kubernetes ssl certificates","cert-manager ingress","automated tls"],
    category: "security",
    intent: "tutorial",
    targetLength: 1800
  },
  {
    topic: "Building a Multi-Architecture Docker Image with buildx",
    primaryKeyword: "multi architecture docker image buildx",
    secondaryKeywords: ["docker buildx arm64","cross compilation docker","apple silicon docker build","multi arch manifest"],
    category: "cicd",
    intent: "tutorial",
    targetLength: 1600
  },
  {
    topic: "AWS Route 53 Routing Policies Explained with Examples",
    primaryKeyword: "aws route 53 routing policies",
    secondaryKeywords: ["latency based routing","weighted routing route53","failover routing aws","geolocation routing"],
    category: "cloud",
    intent: "guide",
    targetLength: 1800
  },
  {
    topic: "Understanding Kubernetes Pod Disruption Budgets (PDB)",
    primaryKeyword: "kubernetes pod disruption budget",
    secondaryKeywords: ["pdb k8s","voluntary disruptions","high availability kubernetes","drain node safely"],
    category: "kubernetes",
    intent: "guide",
    targetLength: 1600
  },
  {
    topic: "Configuring Alertmanager Routes and Receivers",
    primaryKeyword: "alertmanager routes configuration",
    secondaryKeywords: ["prometheus alert routing","alertmanager slack integration","pagerduty alertmanager","alert grouping"],
    category: "monitoring",
    intent: "guide",
    targetLength: 1800
  },
  {
    topic: "Securing Docker Daemon and Socket Access",
    primaryKeyword: "secure docker daemon socket",
    secondaryKeywords: ["docker socket vulnerability","docker tls authentication","docker daemon attack surface","rootless docker"],
    category: "security",
    intent: "guide",
    targetLength: 1800
  },
  {
    topic: "Managing Configuration with Consul and Vault in Kubernetes",
    primaryKeyword: "consul vault kubernetes config",
    secondaryKeywords: ["hashicorp consul k8s","dynamic configuration","service mesh consul","vault secret backend"],
    category: "automation",
    intent: "guide",
    targetLength: 2000
  },
  {
    topic: "Troubleshooting AWS Transit Gateway Connectivity Issues",
    primaryKeyword: "aws transit gateway troubleshooting",
    secondaryKeywords: ["tgw routing","vpc attachment issues","transit gateway network analyzer","aws network connectivity"],
    category: "cloud",
    intent: "troubleshooting",
    targetLength: 2000
  },
  {
    topic: "How to Build an Internal Developer Platform (IDP) with Backstage",
    primaryKeyword: "build idp spotify backstage",
    secondaryKeywords: ["internal developer platform","backstage software catalog","developer portal setup","platform engineering"],
    category: "automation",
    intent: "tutorial",
    targetLength: 2200
  }
];

// ============================================
// GPT PROMPT TEMPLATES
// ============================================
const SYSTEM_PROMPT = `You are the senior technical writer for DevOps Duoo, a practical DevOps learning platform focused on real-world Kubernetes, CI/CD, and cloud production issues.

Your writing style:
- Practical and production-focused
- Written for DevOps engineers with 2-5 years experience
- Includes real commands and code examples
- Uses clear H2 and H3 structure
- Avoids fluff - every sentence adds value
- Includes warnings for common pitfalls
- References actual tools and versions

Output format:
- Use Markdown format
- Single H1 for title (provided separately)
- Use H2 for major sections
- Use H3 for subsections
- Include code blocks with proper language tags
- Add comments in code for clarity
- End with a clear conclusion and next steps`;

function generateUserPrompt(topic: BlogTopic): string {
  return `Write a comprehensive blog post on the following topic:

**Topic:** ${topic.topic}
**Primary Keyword:** ${topic.primaryKeyword}
**Secondary Keywords:** ${topic.secondaryKeywords.join(', ')}
**Intent:** ${topic.intent}
**Target Length:** ${topic.targetLength} words

Requirements:
1. Start with an engaging introduction paragraph setting up the context
2. Include a "The Problem" or "What You'll Learn" section
3. Provide step-by-step instructions with actual commands
4. Include at least 2 code/command examples with explanations
5. Add a "Common Mistakes" or "Troubleshooting" section
6. End with "Key Takeaways" (3-5 bullet points)
7. Include internal linking placeholders like [INTERNAL_LINK: related-topic]

Target audience: DevOps engineers working in production environments who need practical, tested solutions.

Do NOT include:
- Generic introductions like "In today's fast-paced world..."
- Unnecessary padding or filler content
- Outdated tool versions
- Untested commands

DO include:
- Specific tool versions where relevant
- Production-tested configurations
- Performance considerations
- Security implications where applicable`;
}

// ============================================
// GROQ API INTEGRATION (FREE TIER - 30 req/min)
// https://console.groq.com - No credit card required
// ============================================
async function callGroqAPI(topic: BlogTopic): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error('GROQ_API_KEY environment variable is not set. Get a free key at https://console.groq.com');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: generateUserPrompt(topic) }
      ],
      max_tokens: 8000,
      temperature: 0.7,
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Groq API error (${response.status}): ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  
  if (!data.choices?.[0]?.message?.content) {
    throw new Error('Groq API returned empty response');
  }

  return data.choices[0].message.content;
}

// ============================================
// POST-PROCESSING
// ============================================
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60);
}

function calculateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

function generateDescription(content: string, primaryKeyword: string): string {
  // Extract first meaningful paragraph after TL;DR
  const lines = content.split('\n').filter(line => 
    line.trim() && 
    !line.startsWith('#') && 
    !line.startsWith('-') &&
    !line.startsWith('*') &&
    line.length > 50
  );
  
  let description = lines[0] || `Learn about ${primaryKeyword} with practical examples and production-tested solutions.`;
  
  // Ensure it's within SEO limits (150-160 chars)
  if (description.length > 155) {
    description = description.substring(0, 152) + '...';
  }
  
  return description;
}

function createFrontMatter(blog: GeneratedBlog, topic: BlogTopic): string {
  const date = new Date().toISOString().split('T')[0];
  
  return `---
title: "${blog.title}"
description: "${blog.description}"
date: "${date}"
lastModified: "${date}"
author: "DevOps Duoo"
category: "${topic.category}"
tags:
${blog.keywords.map(k => `  - "${k}"`).join('\n')}
readTime: ${blog.readTime}
featured: false
draft: false
seo:
  title: "${blog.title} | DevOps Duoo"
  description: "${blog.description}"
  keywords: "${blog.keywords.join(', ')}"
  canonical: "/blog/${blog.slug}"
---

`;
}

function processContent(content: string): string {
  // Add internal link placeholders processing
  let processed = content;
  
  // Replace internal link placeholders with actual links
  // These should be manually reviewed and updated
  processed = processed.replace(
    /\[INTERNAL_LINK: ([^\]]+)\]/g,
    '<!-- TODO: Add internal link to: $1 -->'
  );
  
  // Ensure proper spacing
  processed = processed.replace(/\n{3,}/g, '\n\n');
  
  return processed;
}

// ============================================
// MAIN GENERATION FUNCTION
// ============================================
async function generateBlogPost(topic: BlogTopic): Promise<void> {
  console.log(`\n📝 Generating blog post: "${topic.topic}"`);
  console.log(`   Primary keyword: ${topic.primaryKeyword}`);
  console.log(`   Category: ${topic.category}`);
  console.log(`   Intent: ${topic.intent}\n`);

  try {
    // Generate content via Groq (free tier)
    console.log('🤖 Calling Groq API (Llama 3.3 70B)...');
    const rawContent = await callGroqAPI(topic);
    console.log('✅ Content generated successfully');

    // Process and structure the blog
    const slug = generateSlug(topic.topic);
    const readTime = calculateReadTime(rawContent);
    const description = generateDescription(rawContent, topic.primaryKeyword);
    const processedContent = processContent(rawContent);

    const blog: GeneratedBlog = {
      title: topic.topic,
      slug,
      description,
      content: processedContent,
      keywords: [topic.primaryKeyword, ...topic.secondaryKeywords],
      category: topic.category,
      readTime
    };

    // Create front matter
    const frontMatter = createFrontMatter(blog, topic);
    const finalContent = frontMatter + processedContent;

    // Save to file
    const date = new Date().toISOString().split('T')[0];
    const filename = `${date}-${slug}.md`;
    const filepath = path.join(process.cwd(), 'content', 'blog', filename);

    // Ensure directory exists
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filepath, finalContent, 'utf-8');
    
    console.log(`\n✅ Blog post saved: ${filename}`);
    console.log(`   📖 Read time: ${readTime} minutes`);
    console.log(`   🏷️  Keywords: ${blog.keywords.slice(0, 3).join(', ')}...`);
    console.log(`   ⚠️  Status: DRAFT - Review before publishing\n`);

  } catch (error) {
    console.error(`\n❌ Error generating blog post:`, error);
    throw error;
  }
}

// ============================================
// TOPIC SELECTION
// ============================================
function getExistingBlogSlugs(): string[] {
  const blogDir = path.join(process.cwd(), 'content', 'blog');
  if (!fs.existsSync(blogDir)) return [];
  return fs.readdirSync(blogDir)
    .filter(f => f.endsWith('.md') && f !== '.gitkeep')
    .map(f => f.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, ''));
}

function getNextTopic(): BlogTopic | null {
  const existingSlugs = getExistingBlogSlugs();
  console.log(`📂 Found ${existingSlugs.length} existing blog posts`);

  // Find the first topic that hasn't been generated yet
  for (const topic of TOPICS_QUEUE) {
    const slug = generateSlug(topic.topic);
    if (!existingSlugs.some(s => s.includes(slug) || slug.includes(s))) {
      return topic;
    }
  }

  console.log('⚠️  All topics have been generated. Add more topics to the queue.');
  return null;
}

function getTopicByIndex(index: number): BlogTopic {
  if (index < 0 || index >= TOPICS_QUEUE.length) {
    throw new Error(`Topic index ${index} is out of range (0-${TOPICS_QUEUE.length - 1})`);
  }
  return TOPICS_QUEUE[index];
}

// ============================================
// CLI ENTRY POINT
// ============================================
async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🚀 DevOps Duoo - AI Blog Generator');
  console.log('═══════════════════════════════════════════════════════════');

  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage:
  npx ts-node scripts/generate-blog.ts [options]

Options:
  --help, -h        Show this help message
  --list            List all topics in queue
  --topic <index>   Generate specific topic by index
  --next            Generate next topic in rotation (default)
  --all             Generate all topics (use with caution)

Environment:
  GROQ_API_KEY     Required. Free key from https://console.groq.com

Examples:
  npx ts-node scripts/generate-blog.ts --list
  npx ts-node scripts/generate-blog.ts --topic 0
  GROQ_API_KEY=xxx npx tsx scripts/generate-blog.ts --next
`);
    process.exit(0);
  }

  if (args.includes('--list')) {
    console.log('\n📋 Topics Queue:\n');
    TOPICS_QUEUE.forEach((topic, index) => {
      console.log(`  [${index}] ${topic.topic}`);
      console.log(`      Category: ${topic.category} | Intent: ${topic.intent}`);
      console.log(`      Keywords: ${topic.primaryKeyword}\n`);
    });
    process.exit(0);
  }

  let topic: BlogTopic;

  const topicIndex = args.indexOf('--topic');
  if (topicIndex !== -1 && args[topicIndex + 1]) {
    const index = parseInt(args[topicIndex + 1], 10);
    topic = getTopicByIndex(index);
  } else if (args.includes('--all')) {
    console.log('\n⚠️  Generating ALL topics. This will make multiple API calls.\n');
    for (const t of TOPICS_QUEUE) {
      await generateBlogPost(t);
      // Small delay between API calls
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    console.log('\n✅ All topics generated!\n');
    process.exit(0);
  } else {
    const nextTopic = getNextTopic();
    if (!nextTopic) {
      console.log('\n✅ No new topics to generate. All topics have been published.');
      process.exit(0);
    }
    topic = nextTopic;
  }

  await generateBlogPost(topic);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
