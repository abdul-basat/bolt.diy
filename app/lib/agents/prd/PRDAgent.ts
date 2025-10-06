import { BaseAgent, AgentInput, AgentOutput, AgentConfig } from '../base/AgentInterface';
import { writeFile, mkdir } from 'fs/promises';
import { join, resolve } from 'path';
import { existsSync } from 'fs';

export interface PRDInput extends AgentInput {
  options?: {
    includeUserStories?: boolean;
    includeTechnicalNotes?: boolean;
    includeRisks?: boolean;
    customSections?: string[];
  };
}

export class PRDAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      name: 'PRDAgent',
      version: '1.0.0',
      description: 'Generates Product Requirement Documents in markdown format',
      outputDirectory: '.bolt/prd',
      supportedFormats: ['md', 'markdown'],
    };
    super(config);
  }

  async execute(input: PRDInput): Promise<AgentOutput> {
    const validationErrors = this.validateInput(input);
    if (validationErrors.length > 0) {
      return this.createOutput(false, 'Validation failed', undefined, undefined, validationErrors);
    }

    try {
      const prdContent = this.generatePRDContent(input);
      const outputPath = await this.savePRD(input.projectName, prdContent, input.projectPath);
      
      return this.createOutput(
        true,
        `PRD generated successfully for project '${input.projectName}'`,
        outputPath,
        prdContent
      );
    } catch (error) {
      return this.createOutput(
        false,
        'Failed to generate PRD',
        undefined,
        undefined,
        [error instanceof Error ? error.message : 'Unknown error']
      );
    }
  }

  private generatePRDContent(input: PRDInput): string {
    const { projectName, options = {} } = input;
    const {
      includeUserStories = true,
      includeTechnicalNotes = true,
      includeRisks = true,
      customSections = []
    } = options;

    const sections: string[] = [];

    // Title and overview
    sections.push(`# Product Requirements Document: ${projectName}`);
    sections.push('');
    sections.push(`**Generated on:** ${new Date().toLocaleDateString()}`);
    sections.push(`**Project Name:** ${projectName}`);
    sections.push('');

    // Overview section
    sections.push('## Overview');
    sections.push('');
    sections.push(`${projectName} is a [brief description of the product/application].`);
    sections.push('');
    sections.push('### Purpose');
    sections.push('- Define the main purpose and goals of the application');
    sections.push('- Identify target users and their needs');
    sections.push('- Establish success criteria and metrics');
    sections.push('');

    // Features section
    sections.push('## Features');
    sections.push('');
    sections.push('### Core Features');
    sections.push('- [ ] Feature 1: [Description]');
    sections.push('- [ ] Feature 2: [Description]');
    sections.push('- [ ] Feature 3: [Description]');
    sections.push('');
    sections.push('### Nice-to-Have Features');
    sections.push('- [ ] Enhancement 1: [Description]');
    sections.push('- [ ] Enhancement 2: [Description]');
    sections.push('');

    // User Stories section
    if (includeUserStories) {
      sections.push('## User Stories');
      sections.push('');
      sections.push('### Primary User Stories');
      sections.push('');
      sections.push('**As a** [user type]');
      sections.push('**I want** [functionality]');
      sections.push('**So that** [benefit]');
      sections.push('');
      sections.push('**Acceptance Criteria:**');
      sections.push('- [ ] Criterion 1');
      sections.push('- [ ] Criterion 2');
      sections.push('- [ ] Criterion 3');
      sections.push('');
      sections.push('### Secondary User Stories');
      sections.push('');
      sections.push('**As a** [user type]');
      sections.push('**I want** [functionality]');
      sections.push('**So that** [benefit]');
      sections.push('');
      sections.push('**Acceptance Criteria:**');
      sections.push('- [ ] Criterion 1');
      sections.push('- [ ] Criterion 2');
      sections.push('');
    }

    // Technical Notes section
    if (includeTechnicalNotes) {
      sections.push('## Technical Notes');
      sections.push('');
      sections.push('### Technology Stack');
      sections.push('- **Frontend:** [Framework/Library]');
      sections.push('- **Backend:** [Framework/Runtime]');
      sections.push('- **Database:** [Database type]');
      sections.push('- **Authentication:** [Auth solution]');
      sections.push('- **Deployment:** [Platform]');
      sections.push('');
      sections.push('### Architecture Considerations');
      sections.push('- Scalability requirements');
      sections.push('- Performance requirements');
      sections.push('- Security considerations');
      sections.push('- Integration requirements');
      sections.push('');
      sections.push('### Development Guidelines');
      sections.push('- Code style and conventions');
      sections.push('- Testing requirements');
      sections.push('- Documentation standards');
      sections.push('- Version control workflow');
      sections.push('');
    }

    // Risks section
    if (includeRisks) {
      sections.push('## Risks and Mitigation');
      sections.push('');
      sections.push('### Technical Risks');
      sections.push('| Risk | Impact | Probability | Mitigation Strategy |');
      sections.push('|------|--------|-------------|-------------------|');
      sections.push('| [Risk 1] | High/Medium/Low | High/Medium/Low | [Strategy] |');
      sections.push('| [Risk 2] | High/Medium/Low | High/Medium/Low | [Strategy] |');
      sections.push('');
      sections.push('### Business Risks');
      sections.push('| Risk | Impact | Probability | Mitigation Strategy |');
      sections.push('|------|--------|-------------|-------------------|');
      sections.push('| [Risk 1] | High/Medium/Low | High/Medium/Low | [Strategy] |');
      sections.push('| [Risk 2] | High/Medium/Low | High/Medium/Low | [Strategy] |');
      sections.push('');
    }

    // Custom sections
    customSections.forEach(sectionName => {
      sections.push(`## ${sectionName}`);
      sections.push('');
      sections.push(`[Content for ${sectionName} section]`);
      sections.push('');
    });

    // Timeline and milestones
    sections.push('## Timeline and Milestones');
    sections.push('');
    sections.push('### Phase 1: Foundation (Weeks 1-2)');
    sections.push('- [ ] Project setup and environment configuration');
    sections.push('- [ ] Basic project structure');
    sections.push('- [ ] Initial wireframes and designs');
    sections.push('');
    sections.push('### Phase 2: Core Development (Weeks 3-6)');
    sections.push('- [ ] Implement core features');
    sections.push('- [ ] Database setup and integration');
    sections.push('- [ ] Basic user interface');
    sections.push('');
    sections.push('### Phase 3: Enhancement and Testing (Weeks 7-8)');
    sections.push('- [ ] Feature enhancement and optimization');
    sections.push('- [ ] Testing and bug fixes');
    sections.push('- [ ] Documentation and deployment preparation');
    sections.push('');

    // Success criteria
    sections.push('## Success Criteria');
    sections.push('');
    sections.push('### Key Performance Indicators (KPIs)');
    sections.push('- [ ] [Metric 1]: [Target value]');
    sections.push('- [ ] [Metric 2]: [Target value]');
    sections.push('- [ ] [Metric 3]: [Target value]');
    sections.push('');
    sections.push('### Quality Gates');
    sections.push('- [ ] All tests pass with >95% coverage');
    sections.push('- [ ] Performance meets specified requirements');
    sections.push('- [ ] Security audit completed');
    sections.push('- [ ] User acceptance testing completed');
    sections.push('');

    // Footer
    sections.push('---');
    sections.push('');
    sections.push('*This document was generated using bolt.diy PRDAgent. Please customize the content according to your specific project requirements.*');

    return sections.join('\n');
  }

  private async savePRD(projectName: string, content: string, basePath?: string): Promise<string> {
    const outputDir = basePath ? join(basePath, this.config.outputDirectory) : this.config.outputDirectory;
    const outputPath = join(outputDir, `${projectName}.md`);

    // Ensure directory exists
    if (!existsSync(outputDir)) {
      await mkdir(outputDir, { recursive: true });
    }

    await writeFile(outputPath, content, 'utf-8');
    return resolve(outputPath);
  }
}