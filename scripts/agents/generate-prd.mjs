#!/usr/bin/env node

import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function showUsage() {
  console.log(`
Usage: generate-prd <projectName> [options]

Arguments:
  projectName     Name of the project (required)

Options:
  --path          Base path for output (default: current directory)
  --no-stories    Exclude user stories section
  --no-technical  Exclude technical notes section
  --no-risks      Exclude risks section
  --help, -h      Show this help message

Examples:
  pnpm run generate-prd my-awesome-app
  pnpm run generate-prd my-app --path ./projects
  pnpm run generate-prd my-app --no-risks --no-technical

Note: This command requires the bolt.diy development server to be running.
If the server is not running, start it with: pnpm run dev
`);
}

async function callAPI(projectName, options) {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
  const url = `${baseUrl}/api/generate-prd`;
  
  const formData = new FormData();
  formData.append('projectName', projectName);
  
  if (options.projectPath) {
    formData.append('projectPath', options.projectPath);
  }
  
  formData.append('includeUserStories', options.includeUserStories.toString());
  formData.append('includeTechnicalNotes', options.includeTechnicalNotes.toString());
  formData.append('includeRisks', options.includeRisks.toString());

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    return result;
  } catch (error) {
    throw new Error(`Failed to connect to bolt.diy server at ${baseUrl}. Make sure the server is running with 'pnpm run dev'.`);
  }
}

async function generatePRDLocally(projectName, options) {
  // Fallback: generate PRD content locally and save it
  const { writeFile, mkdir } = await import('fs/promises');
  const { join } = await import('path');
  const { existsSync } = await import('fs');

  const outputDir = options.projectPath ? join(options.projectPath, '.bolt', 'prd') : join(process.cwd(), '.bolt', 'prd');
  const outputPath = join(outputDir, `${projectName}.md`);

  // Ensure directory exists
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
  }

  // Generate basic PRD content
  const content = `# Product Requirements Document: ${projectName}

**Generated on:** ${new Date().toLocaleDateString()}
**Project Name:** ${projectName}

## Overview

${projectName} is a [brief description of the product/application].

### Purpose
- Define the main purpose and goals of the application
- Identify target users and their needs
- Establish success criteria and metrics

## Features

### Core Features
- [ ] Feature 1: [Description]
- [ ] Feature 2: [Description]
- [ ] Feature 3: [Description]

### Nice-to-Have Features
- [ ] Enhancement 1: [Description]
- [ ] Enhancement 2: [Description]

${options.includeUserStories ? `
## User Stories

### Primary User Stories

**As a** [user type]
**I want** [functionality]
**So that** [benefit]

**Acceptance Criteria:**
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

### Secondary User Stories

**As a** [user type]
**I want** [functionality]
**So that** [benefit]

**Acceptance Criteria:**
- [ ] Criterion 1
- [ ] Criterion 2
` : ''}

${options.includeTechnicalNotes ? `
## Technical Notes

### Technology Stack
- **Frontend:** [Framework/Library]
- **Backend:** [Framework/Runtime]
- **Database:** [Database type]
- **Authentication:** [Auth solution]
- **Deployment:** [Platform]

### Architecture Considerations
- Scalability requirements
- Performance requirements
- Security considerations
- Integration requirements

### Development Guidelines
- Code style and conventions
- Testing requirements
- Documentation standards
- Version control workflow
` : ''}

${options.includeRisks ? `
## Risks and Mitigation

### Technical Risks
| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|-------------------|
| [Risk 1] | High/Medium/Low | High/Medium/Low | [Strategy] |
| [Risk 2] | High/Medium/Low | High/Medium/Low | [Strategy] |

### Business Risks
| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|-------------------|
| [Risk 1] | High/Medium/Low | High/Medium/Low | [Strategy] |
| [Risk 2] | High/Medium/Low | High/Medium/Low | [Strategy] |
` : ''}

## Timeline and Milestones

### Phase 1: Foundation (Weeks 1-2)
- [ ] Project setup and environment configuration
- [ ] Basic project structure
- [ ] Initial wireframes and designs

### Phase 2: Core Development (Weeks 3-6)
- [ ] Implement core features
- [ ] Database setup and integration
- [ ] Basic user interface

### Phase 3: Enhancement and Testing (Weeks 7-8)
- [ ] Feature enhancement and optimization
- [ ] Testing and bug fixes
- [ ] Documentation and deployment preparation

## Success Criteria

### Key Performance Indicators (KPIs)
- [ ] [Metric 1]: [Target value]
- [ ] [Metric 2]: [Target value]
- [ ] [Metric 3]: [Target value]

### Quality Gates
- [ ] All tests pass with >95% coverage
- [ ] Performance meets specified requirements
- [ ] Security audit completed
- [ ] User acceptance testing completed

---

*This document was generated using bolt.diy PRDAgent. Please customize the content according to your specific project requirements.*
`;

  await writeFile(outputPath, content, 'utf-8');
  
  return {
    success: true,
    message: `PRD generated successfully for project '${projectName}'`,
    outputPath,
    content,
    metadata: {
      generatedAt: new Date().toISOString(),
      agent: 'PRDAgent',
      version: '1.0.0',
    },
  };
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showUsage();
    process.exit(0);
  }

  const projectName = args[0];
  
  if (!projectName) {
    console.error('❌ Error: Project name is required');
    showUsage();
    process.exit(1);
  }

  // Parse options
  const options = {
    includeUserStories: !args.includes('--no-stories'),
    includeTechnicalNotes: !args.includes('--no-technical'),
    includeRisks: !args.includes('--no-risks'),
  };

  const pathIndex = args.indexOf('--path');
  const projectPath = pathIndex !== -1 && args[pathIndex + 1] ? args[pathIndex + 1] : undefined;
  options.projectPath = projectPath;

  try {
    console.log(`🚀 Generating PRD for project: ${projectName}`);
    
    let result;
    try {
      // Try to call the API first
      result = await callAPI(projectName, options);
    } catch (apiError) {
      console.log('📡 Server not available, generating locally...');
      result = await generatePRDLocally(projectName, options);
    }

    if (result.success) {
      console.log(`✅ ${result.message}`);
      console.log(`📄 PRD saved to: ${result.outputPath}`);
      
      if (result.metadata) {
        console.log(`🕒 Generated at: ${result.metadata.generatedAt}`);
        console.log(`🤖 Agent: ${result.metadata.agent} v${result.metadata.version}`);
      }

      console.log(`
💡 Next steps:
   - Edit the PRD file to customize for your project
   - Use 'pnpm run docs' to view the PRD in a web browser
   - Generate a flow diagram with: pnpm run generate-diagram ${projectName}`);
      
    } else {
      console.error(`❌ ${result.message}`);
      if (result.errors) {
        result.errors.forEach(error => console.error(`   - ${error}`));
      }
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});