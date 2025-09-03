import { BaseAgent } from '../base-agent';
import type { AgentContext, AgentExecutionPlan, AgentOutput } from '../types';

/**
 * DeploymentAgent manages Docker configuration, CI/CD pipelines,
 * and deployment automation
 */
export class DeploymentAgent extends BaseAgent {
  readonly name = 'deployment';
  readonly description = 'Manages Docker/CI-CD config generation and deployment automation';
  readonly version = '1.0.0';
  readonly tags = ['deployment', 'docker', 'ci-cd', 'automation', 'devops'];

  async plan(context: AgentContext): Promise<AgentExecutionPlan> {
    const structure = this.analyzeProjectStructure(context.projectFiles);
    
    return {
      steps: [
        'Analyze project deployment requirements',
        'Generate Docker configuration',
        'Create CI/CD pipeline files',
        'Set up environment configurations',
        'Generate deployment scripts',
        'Create monitoring and health check configs'
      ],
      estimatedTime: 45,
      dependencies: [],
      expectedOutputs: [
        'Dockerfile',
        'Docker Compose files',
        'CI/CD pipeline configs',
        'Deployment scripts',
        'Environment configurations'
      ],
    };
  }

  async execute(context: AgentContext, plan: AgentExecutionPlan): Promise<AgentOutput> {
    const artifacts = [];
    const nextSteps = [];
    const structure = this.analyzeProjectStructure(context.projectFiles);

    try {
      // Generate Dockerfile
      const dockerfile = this.generateDockerfile(structure);
      artifacts.push(this.createArtifact(
        'config',
        'Dockerfile',
        dockerfile,
        'Multi-stage Docker configuration for production builds'
      ));

      // Generate Docker Compose
      const dockerCompose = this.generateDockerCompose();
      artifacts.push(this.createArtifact(
        'config',
        'docker-compose.yml',
        dockerCompose,
        'Docker Compose configuration for local development'
      ));

      // Generate GitHub Actions workflow
      const githubActions = this.generateGitHubActionsWorkflow(structure);
      artifacts.push(this.createArtifact(
        'config',
        '.github/workflows/deploy.yml',
        githubActions,
        'GitHub Actions CI/CD pipeline'
      ));

      // Generate deployment scripts
      const deployScript = this.generateDeploymentScript();
      artifacts.push(this.createArtifact(
        'config',
        'scripts/deploy.sh',
        deployScript,
        'Deployment automation script'
      ));

      // Generate environment configurations
      const envConfig = this.generateEnvironmentConfig();
      artifacts.push(this.createArtifact(
        'config',
        '.env.production.example',
        envConfig,
        'Production environment variables template'
      ));

      nextSteps.push('Configure deployment secrets and environment variables');
      nextSteps.push('Set up monitoring and logging services');
      nextSteps.push('Configure domain and SSL certificates');
      nextSteps.push('Test deployment pipeline in staging environment');
      nextSteps.push('Set up backup and disaster recovery procedures');

      return this.createOutput(
        `Generated deployment infrastructure with ${artifacts.length} configuration files`,
        artifacts,
        nextSteps
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error in DeploymentAgent';
      return this.createOutput(
        `DeploymentAgent execution failed: ${errorMessage}`,
        [],
        [],
        false,
        [errorMessage]
      );
    }
  }

  private generateDockerfile(structure: any): string {
    const isNode = structure.hasPackageJson;
    const hasTypeScript = structure.hasTypeScript;
    
    return `# Dockerfile
# Multi-stage build for ${structure.frameworkType} application

# Stage 1: Dependencies
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \\
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \\
  elif [ -f package-lock.json ]; then npm ci; \\
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \\
  else echo "Lockfile not found." && exit 1; \\
  fi

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build application
ENV NODE_ENV=production
${hasTypeScript ? 'RUN npm run build' : 'RUN npm run build'}

# Stage 3: Runner
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
${structure.frameworkType === 'nextjs' ? `
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
` : `
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
`}

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/api/health || exit 1

${structure.frameworkType === 'nextjs' ? 
  'CMD ["node", "server.js"]' : 
  'CMD ["npm", "start"]'
}
`;
  }

  private generateDockerCompose(): string {
    return `# docker-compose.yml
# Docker Compose configuration for local development

version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: builder
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@db:5432/myapp
      - REDIS_URL=redis://redis:6379
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - db
      - redis
    develop:
      watch:
        - action: sync
          path: ./src
          target: /app/src
        - action: rebuild
          path: package.json

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app

volumes:
  postgres_data:
  redis_data:

networks:
  default:
    name: myapp-network
`;
  }

  private generateGitHubActionsWorkflow(structure: any): string {
    return `# .github/workflows/deploy.yml
# GitHub Actions CI/CD Pipeline

name: Deploy Application

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'
  REGISTRY: ghcr.io
  IMAGE_NAME: \${{ github.repository }}

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: \${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      ${structure.hasTypeScript ? `
      - name: Type checking
        run: npm run typecheck
      ` : ''}

      - name: Run tests
        run: npm run test
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          token: \${{ secrets.CODECOV_TOKEN }}

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: \${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build
        env:
          NODE_ENV: production

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-files
          path: |
            dist/
            build/
            .next/
          retention-days: 1

  security:
    name: Security Scan
    runs-on: ubuntu-latest
    needs: test

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy scan results to GitHub Security tab
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: 'trivy-results.sarif'

  docker:
    name: Build Docker Image
    runs-on: ubuntu-latest
    needs: [test, build]
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: \${{ env.REGISTRY }}
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: \${{ steps.meta.outputs.tags }}
          labels: \${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: [docker]
    if: github.ref == 'refs/heads/develop'
    environment: staging

    steps:
      - name: Deploy to staging
        run: |
          echo "Deploying to staging environment"
          # Add staging deployment commands here

  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [docker]
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
      - name: Deploy to production
        run: |
          echo "Deploying to production environment"
          # Add production deployment commands here

      - name: Notify deployment
        if: success()
        uses: 8398a7/action-slack@v3
        with:
          status: success
          channel: '#deployments'
          text: 'Production deployment successful! 🚀'
        env:
          SLACK_WEBHOOK_URL: \${{ secrets.SLACK_WEBHOOK_URL }}

      - name: Notify failure
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: failure
          channel: '#deployments'
          text: 'Production deployment failed! ❌'
        env:
          SLACK_WEBHOOK_URL: \${{ secrets.SLACK_WEBHOOK_URL }}
`;
  }

  private generateDeploymentScript(): string {
    return `#!/bin/bash
# scripts/deploy.sh
# Deployment automation script

set -e  # Exit on any error

# Configuration
DOCKER_IMAGE="myapp"
CONTAINER_NAME="myapp-container"
NETWORK_NAME="myapp-network"
BACKUP_DIR="/opt/backups"
LOG_FILE="/var/log/deploy.log"

# Colors for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
NC='\\033[0m' # No Color

# Logging function
log() {
    echo "[\$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "\$LOG_FILE"
}

info() {
    echo -e "\${GREEN}[INFO]\${NC} $1" | tee -a "\$LOG_FILE"
}

warn() {
    echo -e "\${YELLOW}[WARN]\${NC} $1" | tee -a "\$LOG_FILE"
}

error() {
    echo -e "\${RED}[ERROR]\${NC} $1" | tee -a "\$LOG_FILE"
}

# Check if running as root
check_root() {
    if [[ \$EUID -ne 0 ]]; then
        error "This script must be run as root"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    info "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
        exit 1
    fi
    
    info "Prerequisites check passed"
}

# Create backup
create_backup() {
    info "Creating backup..."
    
    mkdir -p "\$BACKUP_DIR"
    BACKUP_FILE="\$BACKUP_DIR/backup-\$(date +%Y%m%d-%H%M%S).tar.gz"
    
    # Backup database
    docker exec \$CONTAINER_NAME-db pg_dump -U postgres myapp > "\$BACKUP_DIR/db-backup-\$(date +%Y%m%d-%H%M%S).sql"
    
    # Backup application data
    docker run --rm -v myapp_data:/data -v \$BACKUP_DIR:/backup alpine tar czf /backup/data-backup-\$(date +%Y%m%d-%H%M%S).tar.gz -C /data .
    
    info "Backup created: \$BACKUP_FILE"
}

# Pull latest images
pull_images() {
    info "Pulling latest Docker images..."
    docker-compose pull
    info "Images pulled successfully"
}

# Deploy application
deploy() {
    info "Starting deployment..."
    
    # Stop existing containers
    if docker ps -q --filter "name=\$CONTAINER_NAME" | grep -q .; then
        info "Stopping existing containers..."
        docker-compose down --remove-orphans
    fi
    
    # Start new containers
    info "Starting new containers..."
    docker-compose up -d
    
    # Wait for services to be ready
    info "Waiting for services to be ready..."
    sleep 30
    
    # Run health checks
    health_check
    
    info "Deployment completed successfully"
}

# Health check
health_check() {
    info "Running health checks..."
    
    local max_attempts=30
    local attempt=1
    
    while [ \$attempt -le \$max_attempts ]; do
        if curl -f http://localhost/api/health &> /dev/null; then
            info "Health check passed"
            return 0
        fi
        
        warn "Health check attempt \$attempt/\$max_attempts failed, retrying..."
        sleep 10
        ((attempt++))
    done
    
    error "Health check failed after \$max_attempts attempts"
    exit 1
}

# Rollback to previous version
rollback() {
    error "Deployment failed, rolling back..."
    
    # Stop current containers
    docker-compose down
    
    # Restore from backup if needed
    # ... restoration logic ...
    
    # Start previous version
    docker-compose up -d
    
    info "Rollback completed"
}

# Cleanup old images and containers
cleanup() {
    info "Cleaning up old images and containers..."
    
    # Remove unused images
    docker image prune -f
    
    # Remove old backups (keep last 7 days)
    find "\$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
    find "\$BACKUP_DIR" -name "*.sql" -mtime +7 -delete
    
    info "Cleanup completed"
}

# Main deployment function
main() {
    info "Starting deployment process..."
    
    trap rollback ERR
    
    check_root
    check_prerequisites
    create_backup
    pull_images
    deploy
    cleanup
    
    info "Deployment process completed successfully!"
}

# Script usage
usage() {
    echo "Usage: \$0 [deploy|rollback|health-check|cleanup]"
    echo "  deploy      - Deploy the application"
    echo "  rollback    - Rollback to previous version"
    echo "  health-check - Run health checks"
    echo "  cleanup     - Clean up old images and backups"
    exit 1
}

# Parse command line arguments
case "\${1:-deploy}" in
    deploy)
        main
        ;;
    rollback)
        rollback
        ;;
    health-check)
        health_check
        ;;
    cleanup)
        cleanup
        ;;
    *)
        usage
        ;;
esac
`;
  }

  private generateEnvironmentConfig(): string {
    return `# .env.production.example
# Production environment variables template
# Copy this file to .env.production and fill in the actual values

# Application
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/myapp
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp
DB_USERNAME=user
DB_PASSWORD=password
DB_SSL=true

# Redis (for caching/sessions)
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h
SESSION_SECRET=your-session-secret-here

# API Keys
OPENAI_API_KEY=your-openai-api-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=your-email@gmail.com

# File Storage (AWS S3)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET=your-s3-bucket-name

# Monitoring & Logging
LOG_LEVEL=info
SENTRY_DSN=your-sentry-dsn
NEW_RELIC_LICENSE_KEY=your-newrelic-key

# Security
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Performance
ENABLE_COMPRESSION=true
CACHE_TTL=3600

# Feature Flags
FEATURE_NEW_UI=true
FEATURE_ANALYTICS=true
MAINTENANCE_MODE=false

# External Services
WEBHOOK_URL=https://yourdomain.com/webhooks
API_BASE_URL=https://api.yourdomain.com

# SSL/TLS
SSL_CERT_PATH=/etc/ssl/certs/cert.pem
SSL_KEY_PATH=/etc/ssl/private/key.pem

# Docker
DOCKER_IMAGE_TAG=latest
CONTAINER_MEMORY_LIMIT=1g
CONTAINER_CPU_LIMIT=1

# Backup
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
BACKUP_S3_BUCKET=your-backup-bucket

# Health Check
HEALTH_CHECK_INTERVAL=30s
HEALTH_CHECK_TIMEOUT=10s
HEALTH_CHECK_RETRIES=3
`;
  }
}