import { BaseAgent, AgentInput, AgentOutput, AgentConfig } from '../base/AgentInterface';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { existsSync } from 'fs';

export interface DiagramInput extends AgentInput {
  options?: {
    diagramType?: 'flowchart' | 'sequence' | 'classDiagram' | 'stateDiagram' | 'entityRelationship';
    generateSVG?: boolean;
    includeUserFlow?: boolean;
    includeDataFlow?: boolean;
    prdPath?: string; // Path to PRD file for auto-generation
  };
}

export class FlowDiagramAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      name: 'FlowDiagramAgent',
      version: '1.0.0',
      description: 'Converts app logic into visual flow diagrams using Mermaid.js',
      outputDirectory: '.bolt/diagrams',
      supportedFormats: ['mmd', 'svg'],
    };
    super(config);
  }

  async execute(input: DiagramInput): Promise<AgentOutput> {
    const validationErrors = this.validateInput(input);
    if (validationErrors.length > 0) {
      return this.createOutput(false, 'Validation failed', undefined, undefined, validationErrors);
    }

    try {
      const mermaidContent = await this.generateMermaidContent(input);
      const outputPath = await this.saveDiagram(input.projectName, mermaidContent, input.projectPath);
      
      // Optionally generate SVG preview
      if (input.options?.generateSVG) {
        try {
          await this.generateSVGPreview(input.projectName, mermaidContent, input.projectPath);
        } catch (error) {
          console.warn('Failed to generate SVG preview:', error);
        }
      }
      
      return this.createOutput(
        true,
        `Flow diagram generated successfully for project '${input.projectName}'`,
        outputPath,
        mermaidContent
      );
    } catch (error) {
      return this.createOutput(
        false,
        'Failed to generate flow diagram',
        undefined,
        undefined,
        [error instanceof Error ? error.message : 'Unknown error']
      );
    }
  }

  private async generateMermaidContent(input: DiagramInput): Promise<string> {
    const { projectName, options = {} } = input;
    const {
      diagramType = 'flowchart',
      includeUserFlow = true,
      includeDataFlow = true,
      prdPath
    } = options;

    let prdContent = '';
    if (prdPath && existsSync(prdPath)) {
      try {
        prdContent = await readFile(prdPath, 'utf-8');
      } catch (error) {
        console.warn('Could not read PRD file:', error);
      }
    }

    const diagrams: string[] = [];

    // Add title and metadata
    diagrams.push(`%% Flow Diagram for ${projectName}`);
    diagrams.push(`%% Generated on: ${new Date().toLocaleDateString()}`);
    diagrams.push(`%% Agent: ${this.config.name} v${this.config.version}`);
    diagrams.push('');

    // Generate different diagram types based on the selected type
    switch (diagramType) {
      case 'flowchart':
        diagrams.push(...this.generateFlowchart(projectName, includeUserFlow, includeDataFlow, prdContent));
        break;
      case 'sequence':
        diagrams.push(...this.generateSequenceDiagram(projectName, prdContent));
        break;
      case 'classDiagram':
        diagrams.push(...this.generateClassDiagram(projectName, prdContent));
        break;
      case 'stateDiagram':
        diagrams.push(...this.generateStateDiagram(projectName, prdContent));
        break;
      case 'entityRelationship':
        diagrams.push(...this.generateERDiagram(projectName, prdContent));
        break;
      default:
        diagrams.push(...this.generateFlowchart(projectName, includeUserFlow, includeDataFlow, prdContent));
    }

    return diagrams.join('\n');
  }

  private generateFlowchart(projectName: string, includeUserFlow: boolean, includeDataFlow: boolean, prdContent: string): string[] {
    const lines: string[] = [];
    
    lines.push('flowchart TD');
    lines.push('    %% Main Application Flow');
    lines.push('    A[User Opens Application] --> B{User Authenticated?}');
    lines.push('    B -->|Yes| C[Dashboard/Main Page]');
    lines.push('    B -->|No| D[Login/Register Page]');
    lines.push('    D --> E[Authentication Process]');
    lines.push('    E --> F{Valid Credentials?}');
    lines.push('    F -->|Yes| C');
    lines.push('    F -->|No| G[Show Error Message]');
    lines.push('    G --> D');
    lines.push('');

    if (includeUserFlow) {
      lines.push('    %% User Flow');
      lines.push('    C --> H[Core Feature 1]');
      lines.push('    C --> I[Core Feature 2]');
      lines.push('    C --> J[Core Feature 3]');
      lines.push('    H --> K[Process Feature 1]');
      lines.push('    I --> L[Process Feature 2]');
      lines.push('    J --> M[Process Feature 3]');
      lines.push('    K --> N[Display Results]');
      lines.push('    L --> N');
      lines.push('    M --> N');
      lines.push('    N --> C');
      lines.push('');
    }

    if (includeDataFlow) {
      lines.push('    %% Data Flow');
      lines.push('    O[(Database)] --> P[API Layer]');
      lines.push('    P --> Q[Business Logic]');
      lines.push('    Q --> R[User Interface]');
      lines.push('    R --> S[User Action]');
      lines.push('    S --> T[Validation]');
      lines.push('    T --> U{Valid Data?}');
      lines.push('    U -->|Yes| Q');
      lines.push('    U -->|No| V[Error Handling]');
      lines.push('    V --> R');
      lines.push('');
    }

    // Style definitions
    lines.push('    %% Styling');
    lines.push('    classDef startEnd fill:#e1f5fe');
    lines.push('    classDef process fill:#f3e5f5');
    lines.push('    classDef decision fill:#fff3e0');
    lines.push('    classDef database fill:#e8f5e8');
    lines.push('    classDef error fill:#ffebee');
    lines.push('');
    lines.push('    class A,C startEnd');
    lines.push('    class H,I,J,K,L,M,P,Q process');
    lines.push('    class B,F,U decision');
    lines.push('    class O database');
    lines.push('    class G,V error');

    return lines;
  }

  private generateSequenceDiagram(projectName: string, prdContent: string): string[] {
    const lines: string[] = [];
    
    lines.push('sequenceDiagram');
    lines.push('    participant U as User');
    lines.push('    participant UI as User Interface');
    lines.push('    participant API as API Layer');
    lines.push('    participant BL as Business Logic');
    lines.push('    participant DB as Database');
    lines.push('');
    lines.push('    U->>UI: Open Application');
    lines.push('    UI->>API: Check Authentication');
    lines.push('    API->>DB: Validate Session');
    lines.push('    DB-->>API: Session Status');
    lines.push('    API-->>UI: Authentication Result');
    lines.push('');
    lines.push('    alt User Authenticated');
    lines.push('        UI->>U: Show Dashboard');
    lines.push('        U->>UI: Request Feature');
    lines.push('        UI->>API: Process Request');
    lines.push('        API->>BL: Execute Business Logic');
    lines.push('        BL->>DB: Query/Update Data');
    lines.push('        DB-->>BL: Data Response');
    lines.push('        BL-->>API: Processed Result');
    lines.push('        API-->>UI: Response Data');
    lines.push('        UI-->>U: Display Result');
    lines.push('    else User Not Authenticated');
    lines.push('        UI->>U: Show Login Page');
    lines.push('        U->>UI: Enter Credentials');
    lines.push('        UI->>API: Authentication Request');
    lines.push('        API->>DB: Validate Credentials');
    lines.push('        DB-->>API: Validation Result');
    lines.push('        API-->>UI: Authentication Response');
    lines.push('        UI-->>U: Login Result');
    lines.push('    end');

    return lines;
  }

  private generateClassDiagram(projectName: string, prdContent: string): string[] {
    const lines: string[] = [];
    
    lines.push('classDiagram');
    lines.push('    class User {');
    lines.push('        +String id');
    lines.push('        +String username');
    lines.push('        +String email');
    lines.push('        +Date createdAt');
    lines.push('        +login()');
    lines.push('        +logout()');
    lines.push('        +updateProfile()');
    lines.push('    }');
    lines.push('');
    lines.push('    class Application {');
    lines.push('        +String name');
    lines.push('        +String version');
    lines.push('        +initialize()');
    lines.push('        +authenticate()');
    lines.push('        +processRequest()');
    lines.push('    }');
    lines.push('');
    lines.push('    class Feature {');
    lines.push('        +String id');
    lines.push('        +String name');
    lines.push('        +Boolean enabled');
    lines.push('        +execute()');
    lines.push('        +validate()');
    lines.push('    }');
    lines.push('');
    lines.push('    class Database {');
    lines.push('        +connect()');
    lines.push('        +query()');
    lines.push('        +update()');
    lines.push('        +disconnect()');
    lines.push('    }');
    lines.push('');
    lines.push('    User ||--o{ Application : uses');
    lines.push('    Application ||--o{ Feature : contains');
    lines.push('    Application ||--|| Database : connects');

    return lines;
  }

  private generateStateDiagram(projectName: string, prdContent: string): string[] {
    const lines: string[] = [];
    
    lines.push('stateDiagram-v2');
    lines.push('    [*] --> Initialization');
    lines.push('    Initialization --> Authentication : App Loaded');
    lines.push('    Authentication --> Dashboard : Valid Credentials');
    lines.push('    Authentication --> LoginPage : Invalid Credentials');
    lines.push('    LoginPage --> Authentication : Retry');
    lines.push('    Dashboard --> FeatureActive : Select Feature');
    lines.push('    FeatureActive --> Processing : Execute');
    lines.push('    Processing --> Success : Valid Result');
    lines.push('    Processing --> Error : Invalid Result');
    lines.push('    Success --> Dashboard : Continue');
    lines.push('    Error --> FeatureActive : Retry');
    lines.push('    FeatureActive --> Dashboard : Back');
    lines.push('    Dashboard --> [*] : Logout');

    return lines;
  }

  private generateERDiagram(projectName: string, prdContent: string): string[] {
    const lines: string[] = [];
    
    lines.push('erDiagram');
    lines.push('    USERS {');
    lines.push('        string id PK');
    lines.push('        string username');
    lines.push('        string email');
    lines.push('        string password_hash');
    lines.push('        datetime created_at');
    lines.push('        datetime updated_at');
    lines.push('    }');
    lines.push('');
    lines.push('    PROJECTS {');
    lines.push('        string id PK');
    lines.push('        string name');
    lines.push('        string description');
    lines.push('        string user_id FK');
    lines.push('        datetime created_at');
    lines.push('        datetime updated_at');
    lines.push('    }');
    lines.push('');
    lines.push('    FEATURES {');
    lines.push('        string id PK');
    lines.push('        string name');
    lines.push('        string description');
    lines.push('        string project_id FK');
    lines.push('        boolean enabled');
    lines.push('        datetime created_at');
    lines.push('    }');
    lines.push('');
    lines.push('    USERS ||--o{ PROJECTS : owns');
    lines.push('    PROJECTS ||--o{ FEATURES : contains');

    return lines;
  }

  private async saveDiagram(projectName: string, content: string, basePath?: string): Promise<string> {
    const outputDir = basePath ? join(basePath, this.config.outputDirectory) : this.config.outputDirectory;
    const outputPath = join(outputDir, `${projectName}.mmd`);

    // Ensure directory exists
    if (!existsSync(outputDir)) {
      await mkdir(outputDir, { recursive: true });
    }

    await writeFile(outputPath, content, 'utf-8');
    return resolve(outputPath);
  }

  private async generateSVGPreview(projectName: string, mermaidContent: string, basePath?: string): Promise<void> {
    // Placeholder for SVG generation
    // In a real implementation, this would use a Mermaid CLI or puppeteer to generate SVG
    const outputDir = basePath ? join(basePath, this.config.outputDirectory) : this.config.outputDirectory;
    const svgPath = join(outputDir, `${projectName}.svg`);
    
    const svgPlaceholder = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f9f9f9" stroke="#ccc"/>
  <text x="400" y="300" text-anchor="middle" font-family="Arial" font-size="16">
    SVG Preview for ${projectName}
  </text>
  <text x="400" y="320" text-anchor="middle" font-family="Arial" font-size="12" fill="#666">
    Generated from Mermaid diagram
  </text>
  <text x="400" y="340" text-anchor="middle" font-family="Arial" font-size="10" fill="#999">
    Use Mermaid CLI or online editor to generate full SVG
  </text>
</svg>`;

    await writeFile(svgPath, svgPlaceholder, 'utf-8');
  }
}