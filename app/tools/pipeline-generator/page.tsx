'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';

// ─── Types ──────────────────────────────────────────────────────────────────

type Platform = 'github-actions' | 'gitlab-ci' | 'jenkins';
type Language = 'nodejs' | 'python' | 'java-maven' | 'java-gradle' | 'go' | 'php' | 'ruby' | 'dotnet';
type Registry  = 'dockerhub' | 'ecr' | 'ghcr' | 'gitlab-registry';
type DeployTarget = 'none' | 'k8s' | 'ecs' | 'ec2';

interface FormState {
  platform: Platform;
  language: Language;
  registry: Registry;
  deployTarget: DeployTarget;
  branch: string;
  appName: string;
  dockerUser: string;
  imageName: string;
  runTests: boolean;
  runLint: boolean;
  buildDocker: boolean;
  pushImage: boolean;
  k8sDeployment: string;
  k8sNamespace: string;
  ecsCluster: string;
  ecsService: string;
}

// ─── Generator Logic ────────────────────────────────────────────────────────

function getInstallCmd(lang: Language): string {
  switch (lang) {
    case 'nodejs':     return 'npm ci';
    case 'python':     return 'pip install -r requirements.txt';
    case 'java-maven': return 'mvn dependency:resolve';
    case 'java-gradle':return './gradlew dependencies';
    case 'go':         return 'go mod download';
    case 'php':        return 'composer install --no-interaction';
    case 'ruby':       return 'bundle install';
    case 'dotnet':     return 'dotnet restore';
  }
}

function getTestCmd(lang: Language): string {
  switch (lang) {
    case 'nodejs':     return 'npm test';
    case 'python':     return 'pytest --tb=short';
    case 'java-maven': return 'mvn test';
    case 'java-gradle':return './gradlew test';
    case 'go':         return 'go test ./...';
    case 'php':        return 'vendor/bin/phpunit';
    case 'ruby':       return 'bundle exec rspec';
    case 'dotnet':     return 'dotnet test';
  }
}

function getLintCmd(lang: Language): string {
  switch (lang) {
    case 'nodejs':     return 'npm run lint';
    case 'python':     return 'flake8 . && black --check .';
    case 'java-maven': return 'mvn checkstyle:check';
    case 'java-gradle':return './gradlew checkstyleMain';
    case 'go':         return 'golangci-lint run';
    case 'php':        return 'vendor/bin/phpcs';
    case 'ruby':       return 'bundle exec rubocop';
    case 'dotnet':     return 'dotnet format --verify-no-changes';
  }
}

function getBuildCmd(lang: Language): string {
  switch (lang) {
    case 'nodejs':     return 'npm run build';
    case 'python':     return '# Python — no build step needed';
    case 'java-maven': return 'mvn package -DskipTests';
    case 'java-gradle':return './gradlew build -x test';
    case 'go':         return 'go build -o app ./...';
    case 'php':        return '# PHP — no build step needed';
    case 'ruby':       return '# Ruby — no build step needed';
    case 'dotnet':     return 'dotnet publish -c Release -o out';
  }
}

function getSetupStep(lang: Language): string {
  switch (lang) {
    case 'nodejs':
      return `
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'`;
    case 'python':
      return `
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
          cache: 'pip'`;
    case 'java-maven':
      return `
      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: 'maven'`;
    case 'java-gradle':
      return `
      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: 'gradle'`;
    case 'go':
      return `
      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.22'
          cache: true`;
    case 'php':
      return `
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.3'
          extensions: mbstring, xml, ctype, iconv`;
    case 'ruby':
      return `
      - name: Setup Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.3'
          bundler-cache: true`;
    case 'dotnet':
      return `
      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'`;
  }
}

function getDockerLoginStep(registry: Registry, dockerUser: string): string {
  switch (registry) {
    case 'dockerhub':
      return `
      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: \${{ secrets.DOCKER_USERNAME }}
          password: \${{ secrets.DOCKER_PASSWORD }}`;
    case 'ecr':
      return `
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: \${{ secrets.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2`;
    case 'ghcr':
      return `
      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}`;
    case 'gitlab-registry':
      return `
      - name: Login to GitLab Container Registry
        uses: docker/login-action@v3
        with:
          registry: registry.gitlab.com
          username: \${{ secrets.REGISTRY_USER }}
          password: \${{ secrets.REGISTRY_TOKEN }}`;
  }
}

function getImageRef(registry: Registry, dockerUser: string, imageName: string): string {
  switch (registry) {
    case 'dockerhub':      return `${dockerUser || 'your-username'}/${imageName || 'your-app'}`;
    case 'ecr':            return `\${{ steps.login-ecr.outputs.registry }}/${imageName || 'your-app'}`;
    case 'ghcr':           return `ghcr.io/\${{ github.repository_owner }}/${imageName || 'your-app'}`;
    case 'gitlab-registry':return `registry.gitlab.com/${dockerUser || 'your-group'}/${imageName || 'your-app'}`;
  }
}

function getDeploySteps(f: FormState): string {
  if (f.deployTarget === 'none') return '';

  const imageRef = getImageRef(f.registry, f.dockerUser, f.imageName);

  if (f.deployTarget === 'k8s') {
    return `
      - name: Set up Kubeconfig
        run: echo "\${{ secrets.KUBECONFIG }}" | base64 -d > kubeconfig.yaml

      - name: Deploy to Kubernetes
        env:
          KUBECONFIG: ./kubeconfig.yaml
        run: |
          kubectl set image deployment/${f.k8sDeployment || 'your-deployment'} \\
            ${f.appName || 'app'}=${imageRef}:\${{ github.sha }} \\
            -n ${f.k8sNamespace || 'default'}
          kubectl rollout status deployment/${f.k8sDeployment || 'your-deployment'} \\
            -n ${f.k8sNamespace || 'default'} --timeout=120s`;
  }

  if (f.deployTarget === 'ecs') {
    return `
      - name: Download ECS task definition
        run: |
          aws ecs describe-task-definition --task-definition ${f.appName || 'your-task'} \\
            --query taskDefinition > task-definition.json

      - name: Update ECS task definition with new image
        id: task-def
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: task-definition.json
          container-name: ${f.appName || 'your-container'}
          image: ${imageRef}:\${{ github.sha }}

      - name: Deploy to ECS
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: \${{ steps.task-def.outputs.task-definition }}
          service: ${f.ecsService || 'your-service'}
          cluster: ${f.ecsCluster || 'your-cluster'}
          wait-for-service-stability: true`;
  }

  if (f.deployTarget === 'ec2') {
    return `
      - name: Deploy to EC2 via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: \${{ secrets.EC2_HOST }}
          username: \${{ secrets.EC2_USER }}
          key: \${{ secrets.EC2_SSH_KEY }}
          script: |
            docker pull ${imageRef}:\${{ github.sha }}
            docker stop ${f.appName || 'app'} || true
            docker rm ${f.appName || 'app'} || true
            docker run -d --name ${f.appName || 'app'} --restart=always \\
              -p 80:3000 ${imageRef}:\${{ github.sha }}`;
  }

  return '';
}

// ─── GitHub Actions Generator ────────────────────────────────────────────────

function generateGitHubActions(f: FormState): string {
  const imageRef = getImageRef(f.registry, f.dockerUser, f.imageName);
  const buildStepName = f.language.includes('java') ? 'Build Application' : 'Build Application';

  let yaml = `# .github/workflows/ci-cd.yml
# Generated by DevOps Duoo - Pipeline Generator
# https://devopsduoo.com/tools/pipeline-generator

name: CI/CD Pipeline

on:
  push:
    branches: ["${f.branch || 'main'}"]
  pull_request:
    branches: ["${f.branch || 'main'}"]

env:
  IMAGE_NAME: ${imageRef}

jobs:
  build-test-deploy:
    name: Build, Test & Deploy
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
${getSetupStep(f.language)}

      - name: Install dependencies
        run: ${getInstallCmd(f.language)}
`;

  if (f.runLint) {
    yaml += `
      - name: Lint
        run: ${getLintCmd(f.language)}
`;
  }

  if (f.runTests) {
    yaml += `
      - name: Run tests
        run: ${getTestCmd(f.language)}
`;
  }

  yaml += `
      - name: ${buildStepName}
        run: ${getBuildCmd(f.language)}
`;

  if (f.buildDocker) {
    yaml += `
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
`;
  }

  if (f.buildDocker && f.pushImage) {
    yaml += `${getDockerLoginStep(f.registry, f.dockerUser)}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            \${{ env.IMAGE_NAME }}:latest
            \${{ env.IMAGE_NAME }}:\${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
`;
  } else if (f.buildDocker) {
    yaml += `
      - name: Build Docker image (no push)
        uses: docker/build-push-action@v5
        with:
          context: .
          push: false
          tags: \${{ env.IMAGE_NAME }}:\${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
`;
  }

  if (f.deployTarget !== 'none' && f.buildDocker && f.pushImage) {
    yaml += `${getDeploySteps(f)}
`;
  }

  return yaml;
}

// ─── GitLab CI Generator ─────────────────────────────────────────────────────

function generateGitLabCI(f: FormState): string {
  const imageRef = getImageRef(f.registry, f.dockerUser, f.imageName);

  let yaml = `# .gitlab-ci.yml
# Generated by DevOps Duoo - Pipeline Generator
# https://devopsduoo.com/tools/pipeline-generator

stages:
  - install
  - lint
  - test
  - build
  - docker
  - deploy

variables:
  IMAGE_NAME: "${imageRef}"
  DOCKER_TLS_CERTDIR: "/certs"

default:
  image: ${f.language === 'nodejs' ? 'node:20-alpine' : f.language === 'python' ? 'python:3.12-slim' : f.language.includes('java') ? 'maven:3.9-eclipse-temurin-21' : f.language === 'go' ? 'golang:1.22-alpine' : 'alpine:latest'}
  before_script:
    - echo "Pipeline started for branch \$CI_COMMIT_REF_NAME"

install:
  stage: install
  script:
    - ${getInstallCmd(f.language)}
  cache:
    paths:
      - ${f.language === 'nodejs' ? 'node_modules/' : f.language === 'python' ? '.pip_cache/' : 'vendor/'}
`;

  if (f.runLint) {
    yaml += `
lint:
  stage: lint
  script:
    - ${getLintCmd(f.language)}
`;
  }

  if (f.runTests) {
    yaml += `
test:
  stage: test
  script:
    - ${getInstallCmd(f.language)}
    - ${getTestCmd(f.language)}
  coverage: '/TOTAL.*\\s+(\\d+%)$/'
  artifacts:
    reports:
      junit: test-results.xml
`;
  }

  yaml += `
build:
  stage: build
  script:
    - ${getInstallCmd(f.language)}
    - ${getBuildCmd(f.language)}
  artifacts:
    paths:
      - dist/
    expire_in: 1 hour
`;

  if (f.buildDocker) {
    yaml += `
docker-build:
  stage: docker
  image: docker:24
  services:
    - docker:24-dind
  before_script:`;

    if (f.registry === 'dockerhub') {
      yaml += `
    - echo "\$DOCKER_PASSWORD" | docker login -u "\$DOCKER_USERNAME" --password-stdin`;
    } else if (f.registry === 'ecr') {
      yaml += `
    - aws ecr get-login-password --region \$AWS_REGION | docker login --username AWS --password-stdin \$ECR_REGISTRY`;
    } else if (f.registry === 'ghcr') {
      yaml += `
    - echo "\$CI_JOB_TOKEN" | docker login ghcr.io -u \$CI_REGISTRY_USER --password-stdin`;
    } else {
      yaml += `
    - echo "\$CI_REGISTRY_PASSWORD" | docker login registry.gitlab.com -u "\$CI_REGISTRY_USER" --password-stdin`;
    }

    yaml += `
  script:
    - docker build -t \${IMAGE_NAME}:\${CI_COMMIT_SHA} -t \${IMAGE_NAME}:latest .
    - docker push \${IMAGE_NAME}:\${CI_COMMIT_SHA}
    - docker push \${IMAGE_NAME}:latest
  only:
    - ${f.branch || 'main'}
`;
  }

  if (f.deployTarget === 'k8s') {
    yaml += `
deploy:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - echo "\$KUBECONFIG" | base64 -d > kubeconfig.yaml
    - kubectl set image deployment/${f.k8sDeployment || 'your-deployment'}
        ${f.appName || 'app'}=\${IMAGE_NAME}:\${CI_COMMIT_SHA}
        -n ${f.k8sNamespace || 'default'} --kubeconfig kubeconfig.yaml
    - kubectl rollout status deployment/${f.k8sDeployment || 'your-deployment'}
        -n ${f.k8sNamespace || 'default'} --timeout=120s --kubeconfig kubeconfig.yaml
  only:
    - ${f.branch || 'main'}
`;
  }

  return yaml;
}

// ─── Jenkins Generator ───────────────────────────────────────────────────────

function generateJenkins(f: FormState): string {
  const imageRef = getImageRef(f.registry, f.dockerUser, f.imageName);

  let pipeline = `// Jenkinsfile
// Generated by DevOps Duoo - Pipeline Generator
// https://devopsduoo.com/tools/pipeline-generator

pipeline {
  agent any

  environment {
    IMAGE_NAME = "${imageRef}"
    APP_NAME   = "${f.appName || 'your-app'}"
  }

  options {
    timestamps()
    timeout(time: 30, unit: 'MINUTES')
    disableConcurrentBuilds()
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        echo "Building branch: \${env.BRANCH_NAME} | commit: \${env.GIT_COMMIT}"
      }
    }

    stage('Install Dependencies') {
      steps {
        sh '${getInstallCmd(f.language)}'
      }
    }
`;

  if (f.runLint) {
    pipeline += `
    stage('Lint') {
      steps {
        sh '${getLintCmd(f.language)}'
      }
    }
`;
  }

  if (f.runTests) {
    pipeline += `
    stage('Test') {
      steps {
        sh '${getTestCmd(f.language)}'
      }
      post {
        always {
          junit '**/test-results/*.xml'
        }
      }
    }
`;
  }

  pipeline += `
    stage('Build') {
      steps {
        sh '${getBuildCmd(f.language)}'
      }
    }
`;

  if (f.buildDocker) {
    pipeline += `
    stage('Docker Build & Push') {
      when {
        branch '${f.branch || 'main'}'
      }
      steps {
        script {`;

    if (f.registry === 'dockerhub') {
      pipeline += `
          docker.withRegistry('https://registry-1.docker.io', 'dockerhub-credentials') {
            def img = docker.build("\${IMAGE_NAME}:\${env.GIT_COMMIT}")
            img.push()
            img.push('latest')
          }`;
    } else if (f.registry === 'ecr') {
      pipeline += `
          sh """
            aws ecr get-login-password --region \${AWS_REGION} | \\
              docker login --username AWS --password-stdin \${ECR_REGISTRY}
            docker build -t \${IMAGE_NAME}:\${GIT_COMMIT} .
            docker push \${IMAGE_NAME}:\${GIT_COMMIT}
            docker tag \${IMAGE_NAME}:\${GIT_COMMIT} \${IMAGE_NAME}:latest
            docker push \${IMAGE_NAME}:latest
          """`;
    } else {
      pipeline += `
          sh """
            docker build -t \${IMAGE_NAME}:\${GIT_COMMIT} .
            docker push \${IMAGE_NAME}:\${GIT_COMMIT}
            docker tag \${IMAGE_NAME}:\${GIT_COMMIT} \${IMAGE_NAME}:latest
            docker push \${IMAGE_NAME}:latest
          """`;
    }

    pipeline += `
        }
      }
    }
`;
  }

  if (f.deployTarget === 'k8s') {
    pipeline += `
    stage('Deploy to Kubernetes') {
      when {
        branch '${f.branch || 'main'}'
      }
      steps {
        withKubeConfig([credentialsId: 'kubeconfig']) {
          sh """
            kubectl set image deployment/${f.k8sDeployment || 'your-deployment'} \\
              ${f.appName || 'app'}=\${IMAGE_NAME}:\${GIT_COMMIT} \\
              -n ${f.k8sNamespace || 'default'}
            kubectl rollout status deployment/${f.k8sDeployment || 'your-deployment'} \\
              -n ${f.k8sNamespace || 'default'} --timeout=120s
          """
        }
      }
    }
`;
  }

  pipeline += `  }

  post {
    success {
      echo '✅ Pipeline completed successfully!'
    }
    failure {
      echo '❌ Pipeline failed. Check the logs above.'
    }
    always {
      cleanWs()
    }
  }
}`;

  return pipeline;
}

function generatePipeline(f: FormState): string {
  switch (f.platform) {
    case 'github-actions': return generateGitHubActions(f);
    case 'gitlab-ci':      return generateGitLabCI(f);
    case 'jenkins':        return generateJenkins(f);
  }
}

// ─── Required Secrets ────────────────────────────────────────────────────────

function getRequiredSecrets(f: FormState): { name: string; description: string }[] {
  const secrets: { name: string; description: string }[] = [];

  if (f.registry === 'dockerhub') {
    secrets.push(
      { name: 'DOCKER_USERNAME', description: 'Your Docker Hub username' },
      { name: 'DOCKER_PASSWORD', description: 'Your Docker Hub password or access token' }
    );
  }
  if (f.registry === 'ecr') {
    secrets.push(
      { name: 'AWS_ACCESS_KEY_ID', description: 'AWS access key with ECR push permissions' },
      { name: 'AWS_SECRET_ACCESS_KEY', description: 'AWS secret access key' },
      { name: 'AWS_REGION', description: 'AWS region (e.g. us-east-1)' }
    );
  }
  if (f.registry === 'gitlab-registry') {
    secrets.push(
      { name: 'REGISTRY_USER', description: 'GitLab registry username' },
      { name: 'REGISTRY_TOKEN', description: 'GitLab registry access token' }
    );
  }
  if (f.deployTarget === 'k8s') {
    secrets.push({ name: 'KUBECONFIG', description: 'Base64-encoded kubeconfig file (run: base64 -w0 ~/.kube/config)' });
  }
  if (f.deployTarget === 'ecs') {
    if (f.registry !== 'ecr') {
      secrets.push(
        { name: 'AWS_ACCESS_KEY_ID', description: 'AWS access key with ECS deploy permissions' },
        { name: 'AWS_SECRET_ACCESS_KEY', description: 'AWS secret access key' },
        { name: 'AWS_REGION', description: 'AWS region (e.g. us-east-1)' }
      );
    }
  }
  if (f.deployTarget === 'ec2') {
    secrets.push(
      { name: 'EC2_HOST', description: 'EC2 instance public IP or hostname' },
      { name: 'EC2_USER', description: 'SSH user (e.g. ubuntu, ec2-user)' },
      { name: 'EC2_SSH_KEY', description: 'Private SSH key for EC2 access' }
    );
  }
  return secrets;
}

// ─── Required Files ──────────────────────────────────────────────────────────

function getRequiredFiles(f: FormState): string[] {
  const files: string[] = [];
  if (f.buildDocker) files.push('Dockerfile at project root');
  if (f.buildDocker) files.push('.dockerignore (recommended)');
  if (f.platform === 'github-actions') files.push('.github/workflows/ci-cd.yml');
  if (f.platform === 'gitlab-ci') files.push('.gitlab-ci.yml at project root');
  if (f.platform === 'jenkins') files.push('Jenkinsfile at project root');
  return files;
}

// ─── Component ───────────────────────────────────────────────────────────────

const defaultForm: FormState = {
  platform: 'github-actions',
  language: 'nodejs',
  registry: 'dockerhub',
  deployTarget: 'k8s',
  branch: 'main',
  appName: 'my-app',
  dockerUser: '',
  imageName: 'my-app',
  runTests: true,
  runLint: true,
  buildDocker: true,
  pushImage: true,
  k8sDeployment: 'my-app',
  k8sNamespace: 'default',
  ecsCluster: 'my-cluster',
  ecsService: 'my-service',
};

export default function PipelineGenerator() {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [copied, setCopied] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [yaml, setYaml] = useState('');

  const update = useCallback((key: keyof FormState, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setGenerated(false);
  }, []);

  const handleGenerate = useCallback(() => {
    const result = generatePipeline(form);
    setYaml(result);
    setGenerated(true);
  }, [form]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(yaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, [yaml]);

  const handleDownload = useCallback(() => {
    let filename = '.github/workflows/ci-cd.yml';
    if (form.platform === 'gitlab-ci') filename = '.gitlab-ci.yml';
    if (form.platform === 'jenkins') filename = 'Jenkinsfile';
    const blob = new Blob([yaml], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.split('/').pop()!;
    a.click();
    URL.revokeObjectURL(url);
  }, [yaml, form.platform]);

  const secrets = generated ? getRequiredSecrets(form) : [];
  const requiredFiles = generated ? getRequiredFiles(form) : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-blue-950 to-indigo-900 text-white py-14 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            Free DevOps Tool
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-5 leading-tight">
            CI/CD Pipeline Generator
          </h1>
          <p className="text-lg sm:text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
            Generate production-ready CI/CD pipeline configuration files in seconds.
            Supports GitHub Actions, GitLab CI, and Jenkins — no boilerplate, no guessing.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-8 text-sm text-blue-200">
            <span className="flex items-center gap-1.5">✅ GitHub Actions</span>
            <span className="flex items-center gap-1.5">✅ GitLab CI</span>
            <span className="flex items-center gap-1.5">✅ Jenkins</span>
            <span className="flex items-center gap-1.5">✅ Docker + K8s + ECS + EC2</span>
            <span className="flex items-center gap-1.5">✅ 8 Languages</span>
          </div>
        </div>
      </section>

      {/* Main Tool */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid lg:grid-cols-2 gap-8 items-start">

          {/* ── LEFT: Form ─────────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Platform */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">1. Platform</h2>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { value: 'github-actions', label: 'GitHub Actions', emoji: '🐙' },
                  { value: 'gitlab-ci',      label: 'GitLab CI',      emoji: '🦊' },
                  { value: 'jenkins',        label: 'Jenkins',        emoji: '🤖' },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => update('platform', opt.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      form.platform === opt.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-300'
                    }`}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <span className="text-xs text-center">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">2. Language / Runtime</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {([
                  { value: 'nodejs',      label: 'Node.js',     emoji: '🟩' },
                  { value: 'python',      label: 'Python',      emoji: '🐍' },
                  { value: 'java-maven',  label: 'Java (Maven)',emoji: '☕' },
                  { value: 'java-gradle', label: 'Java (Gradle)',emoji: '🐘' },
                  { value: 'go',          label: 'Go',          emoji: '🐹' },
                  { value: 'php',         label: 'PHP',         emoji: '🐘' },
                  { value: 'ruby',        label: 'Ruby',        emoji: '💎' },
                  { value: 'dotnet',      label: '.NET',        emoji: '💜' },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => update('language', opt.value)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm font-medium transition-all ${
                      form.language === opt.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-300'
                    }`}
                  >
                    <span>{opt.emoji}</span>
                    <span className="text-xs">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Pipeline Steps */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">3. Pipeline Steps</h2>
              <div className="space-y-3">
                {([
                  { key: 'runLint',    label: 'Lint / Code Quality Check', desc: 'Run ESLint, flake8, golangci-lint etc.' },
                  { key: 'runTests',   label: 'Run Tests',                  desc: 'Unit & integration tests with coverage' },
                  { key: 'buildDocker',label: 'Build Docker Image',          desc: 'Build with layer caching enabled' },
                  { key: 'pushImage',  label: 'Push Image to Registry',     desc: 'Push latest + commit SHA tags' },
                ] as const).map(step => (
                  <label key={step.key} className="flex items-start gap-3 cursor-pointer group">
                    <div className="mt-0.5">
                      <input
                        type="checkbox"
                        checked={form[step.key]}
                        onChange={e => update(step.key, e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{step.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{step.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Registry */}
            {form.buildDocker && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">4. Container Registry</h2>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {([
                    { value: 'dockerhub',       label: 'Docker Hub',     emoji: '🐳' },
                    { value: 'ecr',             label: 'AWS ECR',         emoji: '🟠' },
                    { value: 'ghcr',            label: 'GitHub Registry', emoji: '🐙' },
                    { value: 'gitlab-registry', label: 'GitLab Registry', emoji: '🦊' },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => update('registry', opt.value)}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm font-medium transition-all ${
                        form.registry === opt.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-300'
                      }`}
                    >
                      <span>{opt.emoji}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {form.registry === 'dockerhub' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Docker Hub Username</label>
                      <input
                        value={form.dockerUser}
                        onChange={e => update('dockerUser', e.target.value)}
                        placeholder="e.g. johndoe"
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Image Name</label>
                    <input
                      value={form.imageName}
                      onChange={e => update('imageName', e.target.value)}
                      placeholder="e.g. my-app"
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Deploy Target */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">5. Deploy Target</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {([
                  { value: 'none', label: 'None',       emoji: '⏭️' },
                  { value: 'k8s',  label: 'Kubernetes', emoji: '☸️' },
                  { value: 'ecs',  label: 'AWS ECS',    emoji: '🟠' },
                  { value: 'ec2',  label: 'AWS EC2',    emoji: '🖥️' },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => update('deployTarget', opt.value)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-sm font-medium transition-all ${
                      form.deployTarget === opt.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-300'
                    }`}
                  >
                    <span className="text-xl">{opt.emoji}</span>
                    <span className="text-xs">{opt.label}</span>
                  </button>
                ))}
              </div>

              {form.deployTarget === 'k8s' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Deployment Name</label>
                    <input
                      value={form.k8sDeployment}
                      onChange={e => update('k8sDeployment', e.target.value)}
                      placeholder="e.g. my-app"
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Namespace</label>
                    <input
                      value={form.k8sNamespace}
                      onChange={e => update('k8sNamespace', e.target.value)}
                      placeholder="e.g. default"
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {form.deployTarget === 'ecs' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">ECS Cluster Name</label>
                    <input
                      value={form.ecsCluster}
                      onChange={e => update('ecsCluster', e.target.value)}
                      placeholder="e.g. my-cluster"
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">ECS Service Name</label>
                    <input
                      value={form.ecsService}
                      onChange={e => update('ecsService', e.target.value)}
                      placeholder="e.g. my-service"
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* App + Branch */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">6. App Settings</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">App Name</label>
                  <input
                    value={form.appName}
                    onChange={e => update('appName', e.target.value)}
                    placeholder="e.g. my-app"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Trigger Branch</label>
                  <input
                    value={form.branch}
                    onChange={e => update('branch', e.target.value)}
                    placeholder="e.g. main"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3"
            >
              <span>⚡</span>
              Generate Pipeline
            </button>
          </div>

          {/* ── RIGHT: Output ───────────────────────────────────────────── */}
          <div className="space-y-6 lg:sticky lg:top-6">
            {generated ? (
              <>
                {/* YAML Output */}
                <div className="bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-700">
                  {/* Header bar */}
                  <div className="flex items-center justify-between px-5 py-3 bg-gray-800 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                      </div>
                      <span className="text-gray-400 text-sm font-mono">
                        {form.platform === 'github-actions' ? '.github/workflows/ci-cd.yml' : form.platform === 'gitlab-ci' ? '.gitlab-ci.yml' : 'Jenkinsfile'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopy}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          copied
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {copied ? '✅ Copied!' : '📋 Copy'}
                      </button>
                      <button
                        onClick={handleDownload}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 rounded-lg transition-all"
                      >
                        ⬇️ Download
                      </button>
                    </div>
                  </div>
                  {/* Code */}
                  <pre className="overflow-auto max-h-[600px] p-5 text-xs leading-6 text-gray-100 font-mono">
                    <code>{yaml}</code>
                  </pre>
                </div>

                {/* Required Secrets */}
                {secrets.length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5">
                    <h3 className="font-bold text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2">
                      🔐 Required Secrets / Environment Variables
                    </h3>
                    <div className="space-y-2">
                      {secrets.map(s => (
                        <div key={s.name} className="flex items-start gap-2">
                          <code className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded font-mono whitespace-nowrap">{s.name}</code>
                          <span className="text-xs text-amber-700 dark:text-amber-400 pt-0.5">— {s.description}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-3">
                      {form.platform === 'github-actions' && '→ Add these in GitHub: Settings → Secrets and variables → Actions'}
                      {form.platform === 'gitlab-ci' && '→ Add these in GitLab: Settings → CI/CD → Variables'}
                      {form.platform === 'jenkins' && '→ Add these in Jenkins: Manage Jenkins → Credentials'}
                    </p>
                  </div>
                )}

                {/* Required Files */}
                {requiredFiles.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-5">
                    <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                      📁 Required Files in Your Repository
                    </h3>
                    <ul className="space-y-1">
                      {requiredFiles.map(f => (
                        <li key={f} className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                          <span className="text-blue-400">›</span> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Next Steps */}
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-5">
                  <h3 className="font-bold text-green-800 dark:text-green-300 mb-3">✅ Next Steps</h3>
                  <ol className="space-y-2 text-sm text-green-700 dark:text-green-300 list-decimal list-inside">
                    <li>Copy the pipeline file to your repository</li>
                    <li>Add the required secrets to your platform</li>
                    {form.buildDocker && <li>Make sure you have a Dockerfile in your repo root</li>}
                    <li>Push a commit to <code className="bg-green-100 dark:bg-green-900/40 px-1 rounded text-xs">{form.branch}</code> to trigger the pipeline</li>
                    {form.deployTarget !== 'none' && <li>Verify the deployment rolled out successfully</li>}
                  </ol>
                </div>
              </>
            ) : (
              /* Placeholder */
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-2 border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
                <div className="text-6xl mb-4">⚡</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Your Pipeline Will Appear Here</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto">
                  Configure your options on the left and click <strong>Generate Pipeline</strong> to get your production-ready CI/CD config.
                </p>
                <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                  {[
                    { emoji: '🐙', label: 'GitHub Actions' },
                    { emoji: '🦊', label: 'GitLab CI' },
                    { emoji: '🤖', label: 'Jenkins' },
                  ].map(p => (
                    <div key={p.label} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div className="text-2xl mb-1">{p.emoji}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{p.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* More Tools CTA */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">Need More DevOps Help?</h2>
          <p className="text-blue-100 mb-6 max-w-xl mx-auto">
            We build and maintain CI/CD pipelines, Kubernetes clusters, and cloud infrastructure for teams worldwide.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/contact"
              className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-full hover:bg-blue-50 transition-colors"
            >
              Get Expert Help →
            </Link>
            <Link
              href="/blog"
              className="px-6 py-3 bg-white/10 border border-white/30 text-white font-semibold rounded-full hover:bg-white/20 transition-colors"
            >
              Read DevOps Guides
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
