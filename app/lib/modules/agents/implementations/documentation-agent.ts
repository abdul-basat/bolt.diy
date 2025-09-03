import { BaseAgent } from '../base-agent';
import type { AgentContext, AgentExecutionPlan, AgentOutput } from '../types';

/**
 * DocumentationAgent generates README files, inline comments,
 * API documentation, and developer guides
 */
export class DocumentationAgent extends BaseAgent {
  readonly name = 'documentation';
  readonly description = 'Generates README files, inline comments, API docs, and developer guides';
  readonly version = '1.0.0';
  readonly tags = ['documentation', 'readme', 'api-docs', 'comments', 'guides'];

  async plan(context: AgentContext): Promise<AgentExecutionPlan> {
    return {
      steps: [
        'Analyze project structure and codebase',
        'Generate comprehensive README.md',
        'Create API documentation',
        'Add inline code comments',
        'Generate developer guides',
        'Create contributing guidelines'
      ],
      estimatedTime: 35,
      dependencies: [],
      expectedOutputs: [
        'README.md',
        'API documentation',
        'Developer guides',
        'Contributing guidelines',
        'Code comments'
      ],
    };
  }

  async execute(context: AgentContext, plan: AgentExecutionPlan): Promise<AgentOutput> {
    const artifacts = [];
    const nextSteps = [];
    const structure = this.analyzeProjectStructure(context.projectFiles);

    try {
      // Generate comprehensive README
      const readme = this.generateReadme(structure, context);
      artifacts.push(this.createArtifact(
        'documentation',
        'README.md',
        readme,
        'Comprehensive project README with setup and usage instructions'
      ));

      // Generate API documentation
      const apiDocs = this.generateApiDocumentation(context.projectFiles);
      artifacts.push(this.createArtifact(
        'documentation',
        'API.md',
        apiDocs,
        'API endpoints documentation and examples'
      ));

      // Generate contributing guidelines
      const contributing = this.generateContributingGuidelines();
      artifacts.push(this.createArtifact(
        'documentation',
        'CONTRIBUTING.md',
        contributing,
        'Guidelines for contributing to the project'
      ));

      // Generate development setup guide
      const devGuide = this.generateDevelopmentGuide(structure);
      artifacts.push(this.createArtifact(
        'documentation',
        'DEVELOPMENT.md',
        devGuide,
        'Development environment setup and workflow guide'
      ));

      nextSteps.push('Review and customize generated documentation');
      nextSteps.push('Add project-specific examples and use cases');
      nextSteps.push('Set up automated documentation generation');
      nextSteps.push('Create video tutorials for complex workflows');

      return this.createOutput(
        `Generated comprehensive documentation with ${artifacts.length} documentation files`,
        artifacts,
        nextSteps
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error in DocumentationAgent';
      return this.createOutput(
        `DocumentationAgent execution failed: ${errorMessage}`,
        [],
        [],
        false,
        [errorMessage]
      );
    }
  }

  private generateReadme(structure: any, context: AgentContext): string {
    const projectName = this.extractProjectName(context.projectFiles);
    
    return `# ${projectName}

## Overview
[Brief description of what this project does and its main purpose]

## Features
- ✨ [Feature 1]
- 🚀 [Feature 2]  
- 🛡️ [Feature 3]
- 📱 [Feature 4]

## Tech Stack
- **Framework**: ${structure.frameworkType}
- **Language**: ${structure.hasTypeScript ? 'TypeScript' : 'JavaScript'}
- **Styling**: ${structure.hasCss ? 'CSS/SCSS' : 'CSS-in-JS'}
- **Testing**: ${structure.hasTests ? 'Jest/Vitest' : 'Not configured'}

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm/yarn/pnpm

### Installation
\`\`\`bash
# Clone the repository
git clone [repository-url]
cd ${projectName.toLowerCase()}

# Install dependencies
npm install
# or
yarn install
# or
pnpm install
\`\`\`

### Development
\`\`\`bash
# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
\`\`\`

## Project Structure
\`\`\`
${this.generateProjectStructureTree(context.projectFiles)}
\`\`\`

## Usage

### Basic Example
\`\`\`${structure.hasTypeScript ? 'typescript' : 'javascript'}
// TODO: Add basic usage example
\`\`\`

### Advanced Usage
\`\`\`${structure.hasTypeScript ? 'typescript' : 'javascript'}
// TODO: Add advanced usage examples
\`\`\`

## API Reference
See [API.md](./API.md) for detailed API documentation.

## Development
See [DEVELOPMENT.md](./DEVELOPMENT.md) for development setup and guidelines.

## Contributing
See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## Testing
\`\`\`bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
\`\`\`

## Deployment
\`\`\`bash
# Build for production
npm run build

# Deploy (platform-specific commands)
npm run deploy
\`\`\`

## Environment Variables
Create a \`.env\` file in the root directory:
\`\`\`env
# Example environment variables
NODE_ENV=development
API_URL=http://localhost:3001
DATABASE_URL=your-database-url
\`\`\`

## Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance
- Bundle size: [To be measured]
- Load time: [To be measured]
- Core Web Vitals: [To be measured]

## Security
- [Security considerations and best practices]

## License
[License information]

## Support
- 📧 Email: [support-email]
- 💬 Discord: [discord-invite]
- 🐛 Issues: [GitHub issues link]

## Changelog
See [CHANGELOG.md](./CHANGELOG.md) for version history.

## Acknowledgments
- [Credits and acknowledgments]
`;
  }

  private generateApiDocumentation(projectFiles: Record<string, string>): string {
    // Analyze files for API endpoints
    const apiEndpoints = this.extractApiEndpoints(projectFiles);
    
    return `# API Documentation

## Overview
This document describes the available API endpoints and their usage.

## Base URL
\`\`\`
Development: http://localhost:3000/api
Production: https://your-domain.com/api
\`\`\`

## Authentication
\`\`\`http
Authorization: Bearer <your-jwt-token>
\`\`\`

## Endpoints

${apiEndpoints.length > 0 ? apiEndpoints.map(endpoint => this.formatEndpointDocumentation(endpoint)).join('\n\n') : `
### GET /health
Health check endpoint

**Request:**
\`\`\`http
GET /api/health
\`\`\`

**Response:**
\`\`\`json
{
  "status": "ok",
  "timestamp": "2023-12-01T10:00:00Z"
}
\`\`\`

### POST /users
Create a new user

**Request:**
\`\`\`http
POST /api/users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
\`\`\`

**Response:**
\`\`\`json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2023-12-01T10:00:00Z"
}
\`\`\`

### GET /users/:id
Get user by ID

**Parameters:**
- \`id\` (integer): User ID

**Request:**
\`\`\`http
GET /api/users/1
\`\`\`

**Response:**
\`\`\`json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2023-12-01T10:00:00Z"
}
\`\`\`

### PUT /users/:id
Update user

**Parameters:**
- \`id\` (integer): User ID

**Request:**
\`\`\`http
PUT /api/users/1
Content-Type: application/json

{
  "name": "John Smith",
  "email": "johnsmith@example.com"
}
\`\`\`

**Response:**
\`\`\`json
{
  "id": 1,
  "name": "John Smith",
  "email": "johnsmith@example.com",
  "updatedAt": "2023-12-01T10:30:00Z"
}
\`\`\`

### DELETE /users/:id
Delete user

**Parameters:**
- \`id\` (integer): User ID

**Request:**
\`\`\`http
DELETE /api/users/1
\`\`\`

**Response:**
\`\`\`json
{
  "message": "User deleted successfully"
}
\`\`\`
`}

## Error Responses

### 400 Bad Request
\`\`\`json
{
  "error": "Bad Request",
  "message": "Invalid input data",
  "details": {
    "field": "email",
    "reason": "Invalid email format"
  }
}
\`\`\`

### 401 Unauthorized
\`\`\`json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
\`\`\`

### 403 Forbidden
\`\`\`json
{
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
\`\`\`

### 404 Not Found
\`\`\`json
{
  "error": "Not Found",
  "message": "Resource not found"
}
\`\`\`

### 500 Internal Server Error
\`\`\`json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
\`\`\`

## Rate Limiting
- Limit: 100 requests per minute per IP
- Headers:
  - \`X-RateLimit-Limit\`: Request limit per window
  - \`X-RateLimit-Remaining\`: Requests remaining in window
  - \`X-RateLimit-Reset\`: Time when rate limit resets

## SDKs and Examples

### JavaScript/TypeScript
\`\`\`typescript
// Using fetch
const response = await fetch('/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com'
  })
});

const user = await response.json();
\`\`\`

### cURL
\`\`\`bash
# Create user
curl -X POST \\
  http://localhost:3000/api/users \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer your-token' \\
  -d '{
    "name": "John Doe",
    "email": "john@example.com"
  }'
\`\`\`

## Changelog
- v1.0.0: Initial API release
- v1.1.0: Added user management endpoints
- v1.2.0: Added authentication and rate limiting
`;
  }

  private generateContributingGuidelines(): string {
    return `# Contributing Guidelines

Thank you for your interest in contributing to this project! This document provides guidelines and information for contributors.

## Code of Conduct
Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Git
- Familiarity with the project's tech stack

### Development Setup
1. Fork the repository
2. Clone your fork locally
3. Install dependencies: \`npm install\`
4. Create a new branch: \`git checkout -b feature/your-feature-name\`
5. Make your changes
6. Test your changes: \`npm run test\`
7. Commit your changes
8. Push to your fork
9. Create a pull request

## Development Workflow

### Branch Naming
- Feature branches: \`feature/description\`
- Bug fixes: \`fix/description\`
- Documentation: \`docs/description\`
- Refactoring: \`refactor/description\`

### Commit Messages
Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

\`\`\`
type(scope): description

feat(auth): add OAuth2 integration
fix(api): resolve user creation bug
docs(readme): update installation instructions
test(users): add integration tests
refactor(utils): simplify data validation
\`\`\`

### Code Style
- Use Prettier for code formatting
- Follow ESLint rules
- Write TypeScript (if applicable)
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### Testing Requirements
- Write unit tests for new features
- Ensure all tests pass: \`npm run test\`
- Maintain or improve code coverage
- Add integration tests for complex features
- Test edge cases and error conditions

## Pull Request Process

### Before Submitting
- [ ] Tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation is updated
- [ ] No merge conflicts
- [ ] Branch is up to date with main

### PR Template
\`\`\`markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests pass
\`\`\`

### Review Process
1. Automated checks must pass
2. At least one maintainer review required
3. Address feedback promptly
4. Maintainer will merge when approved

## Issue Guidelines

### Bug Reports
Include:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)
- Screenshots (if applicable)

### Feature Requests
Include:
- Clear description of the feature
- Use case and motivation
- Proposed implementation (if any)
- Alternative solutions considered

## Development Standards

### Code Quality
- Follow SOLID principles
- Write clean, readable code
- Use TypeScript for type safety
- Handle errors appropriately
- Add logging where appropriate

### Performance
- Consider performance implications
- Avoid unnecessary re-renders (React)
- Optimize bundle size
- Use appropriate data structures

### Security
- Validate all inputs
- Sanitize outputs
- Follow security best practices
- Never commit secrets or API keys

### Accessibility
- Follow WCAG guidelines
- Test with screen readers
- Ensure keyboard navigation
- Maintain color contrast standards

## Release Process

### Versioning
We use [Semantic Versioning](https://semver.org/):
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes (backward compatible)

### Changelog
Update CHANGELOG.md with:
- New features
- Bug fixes
- Breaking changes
- Deprecations

## Resources

### Documentation
- [Project README](README.md)
- [API Documentation](API.md)
- [Development Guide](DEVELOPMENT.md)

### Tools and Commands
\`\`\`bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run lint         # Run linting
npm run lint:fix     # Fix linting issues
npm run format       # Format code with Prettier
\`\`\`

### Getting Help
- Check existing issues and discussions
- Ask questions in discussions
- Reach out to maintainers
- Join our Discord/Slack (if available)

## Recognition
Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project website (if applicable)

Thank you for contributing! 🎉
`;
  }

  private generateDevelopmentGuide(structure: any): string {
    return `# Development Guide

This guide covers the development environment setup, workflow, and best practices for this project.

## Environment Setup

### Required Tools
- **Node.js**: v18+ (recommend using nvm/fnm)
- **Package Manager**: npm/yarn/pnpm
- **Git**: Latest version
- **Code Editor**: VS Code (recommended)

### Recommended VS Code Extensions
\`\`\`json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    ${structure.hasTypeScript ? '"ms-vscode.vscode-typescript-next",' : ''}
    "ms-vscode.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
\`\`\`

### Initial Setup
\`\`\`bash
# Clone repository
git clone [repository-url]
cd [project-name]

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
\`\`\`

## Project Architecture

### Directory Structure
\`\`\`
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI elements
│   ├── forms/          # Form components
│   └── layout/         # Layout components
├── pages/              # Application pages/routes
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── services/           # API services
├── types/              # TypeScript type definitions
├── styles/             # Global styles and themes
└── tests/              # Test utilities and setup
\`\`\`

### Technology Stack
- **Frontend**: ${structure.frameworkType}
- **Language**: ${structure.hasTypeScript ? 'TypeScript' : 'JavaScript'}
- **Styling**: ${structure.hasCss ? 'CSS/SCSS' : 'CSS-in-JS'}
- **Testing**: ${structure.hasTests ? 'Jest/Vitest + Testing Library' : 'Not configured'}
- **Linting**: ESLint + Prettier

## Development Workflow

### 1. Creating New Features
\`\`\`bash
# Create feature branch
git checkout -b feature/feature-name

# Make changes
# ... code changes ...

# Test changes
npm run test
npm run lint

# Commit changes
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/feature-name

# Create pull request
\`\`\`

### 2. Component Development
\`\`\`typescript
// components/Button/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  children,
  onClick,
}) => {
  return (
    <button
      className={\`btn btn--\${variant} btn--\${size}\`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

// Export with types
export type { ButtonProps };
\`\`\`

### 3. Writing Tests
\`\`\`typescript
// components/Button/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
\`\`\`

## Code Standards

### TypeScript Guidelines
- Use strict TypeScript configuration
- Define interfaces for all props and data structures
- Use type guards for runtime type checking
- Prefer \`interface\` over \`type\` for object shapes

### React Best Practices
- Use functional components with hooks
- Implement proper prop drilling avoidance
- Use React.memo for performance optimization
- Follow the single responsibility principle

### Styling Guidelines
- Use consistent naming conventions (BEM, CSS Modules)
- Implement responsive design from mobile-first
- Use CSS custom properties for theming
- Follow accessibility guidelines

### Performance Considerations
- Implement code splitting for routes
- Use React.lazy for component lazy loading
- Optimize images (WebP, proper sizing)
- Minimize bundle size with tree shaking

## Testing Strategy

### Unit Tests
- Test component behavior, not implementation
- Use Testing Library for user-centric tests
- Mock external dependencies
- Aim for 80%+ code coverage

### Integration Tests
- Test component interactions
- Test API integrations with MSW
- Test user workflows end-to-end

### E2E Tests
- Test critical user journeys
- Use Playwright for cross-browser testing
- Test in production-like environment

## Debugging

### Development Tools
\`\`\`bash
# React Developer Tools
# Redux DevTools (if using Redux)
# Network tab for API debugging
# Performance tab for optimization
\`\`\`

### Common Issues
1. **Module not found**: Check import paths and file extensions
2. **TypeScript errors**: Verify type definitions and interfaces
3. **Build failures**: Check for syntax errors and missing dependencies
4. **Runtime errors**: Use browser dev tools and error boundaries

## Performance Monitoring

### Development Metrics
\`\`\`bash
# Bundle analysis
npm run build:analyze

# Performance testing
npm run lighthouse

# Load testing
npm run test:load
\`\`\`

### Key Metrics
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Bundle size: < 250KB initial
- Lighthouse score: > 90

## Deployment

### Build Process
\`\`\`bash
# Production build
npm run build

# Test production build locally
npm run preview

# Deploy
npm run deploy
\`\`\`

### Environment Variables
\`\`\`env
# Development
NODE_ENV=development
VITE_API_URL=http://localhost:3001

# Production
NODE_ENV=production
VITE_API_URL=https://api.production.com
\`\`\`

## Troubleshooting

### Common Commands
\`\`\`bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
npm run clean

# Reset git changes
git reset --hard HEAD
git clean -fd

# Update dependencies
npm update
npm audit fix
\`\`\`

### Getting Help
- Check documentation and README
- Search existing issues on GitHub
- Ask in team chat or discussions
- Create detailed bug reports with reproduction steps

## Resources
- [Project README](README.md)
- [API Documentation](API.md)
- [Contributing Guidelines](CONTRIBUTING.md)
- [Framework Documentation](https://framework-docs-url.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
`;
  }

  private extractProjectName(projectFiles: Record<string, string>): string {
    const packageJson = projectFiles['package.json'];
    if (packageJson) {
      try {
        const pkg = JSON.parse(packageJson);
        return pkg.name || 'Project';
      } catch {
        // Invalid package.json
      }
    }
    return 'Project';
  }

  private generateProjectStructureTree(projectFiles: Record<string, string>): string {
    const paths = Object.keys(projectFiles)
      .filter(path => !path.includes('node_modules'))
      .sort();
    
    // Simple tree structure representation
    const tree = paths.slice(0, 20).map(path => {
      const depth = path.split('/').length - 1;
      const indent = '  '.repeat(depth);
      const filename = path.split('/').pop();
      return `${indent}${filename}`;
    }).join('\n');
    
    return tree + (paths.length > 20 ? '\n  ...' : '');
  }

  private extractApiEndpoints(projectFiles: Record<string, string>): Array<{ method: string; path: string; description: string }> {
    // Simple endpoint extraction - could be enhanced
    const endpoints: Array<{ method: string; path: string; description: string }> = [];
    
    for (const [path, content] of Object.entries(projectFiles)) {
      if (path.includes('api') || path.includes('route')) {
        // Look for HTTP method patterns
        const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
        methods.forEach(method => {
          if (content.includes(method)) {
            endpoints.push({
              method,
              path: path.replace(/\.(js|ts|tsx?)$/, ''),
              description: `${method} endpoint`,
            });
          }
        });
      }
    }
    
    return endpoints.slice(0, 10); // Limit to prevent overly long docs
  }

  private formatEndpointDocumentation(endpoint: { method: string; path: string; description: string }): string {
    return `### ${endpoint.method} ${endpoint.path}
${endpoint.description}

**Request:**
\`\`\`http
${endpoint.method} ${endpoint.path}
\`\`\`

**Response:**
\`\`\`json
{
  "message": "Success"
}
\`\`\``;
  }
}