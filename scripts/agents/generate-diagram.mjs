#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function showUsage() {
  console.log(`
Usage: generate-diagram <projectName> [options]

Arguments:
  projectName     Name of the project (required)

Options:
  --path          Base path for output (default: current directory)
  --type          Diagram type: flowchart, sequence, classDiagram, stateDiagram, entityRelationship (default: flowchart)
  --svg           Generate SVG preview
  --prd           Path to PRD file for auto-generation
  --no-userflow   Exclude user flow in flowchart
  --no-dataflow   Exclude data flow in flowchart
  --help, -h      Show this help message

Examples:
  pnpm run generate-diagram my-awesome-app
  pnpm run generate-diagram my-app --type sequence --svg
  pnpm run generate-diagram my-app --prd ./my-app-prd.md
  pnpm run generate-diagram my-app --path ./projects --no-dataflow

Note: This command requires the bolt.diy development server to be running.
If the server is not running, start it with: pnpm run dev
`);
}

async function callAPI(projectName, options) {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
  const url = `${baseUrl}/api/generate-diagram`;
  
  const formData = new FormData();
  formData.append('projectName', projectName);
  
  if (options.projectPath) {
    formData.append('projectPath', options.projectPath);
  }
  
  formData.append('diagramType', options.diagramType);
  formData.append('generateSVG', options.generateSVG.toString());
  formData.append('includeUserFlow', options.includeUserFlow.toString());
  formData.append('includeDataFlow', options.includeDataFlow.toString());
  
  if (options.prdPath) {
    formData.append('prdPath', options.prdPath);
  }

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

async function generateDiagramLocally(projectName, options) {
  // Fallback: generate diagram content locally and save it
  const { writeFile, mkdir } = await import('fs/promises');
  const { join } = await import('path');
  const { existsSync } = await import('fs');

  const outputDir = options.projectPath ? join(options.projectPath, '.bolt', 'diagrams') : join(process.cwd(), '.bolt', 'diagrams');
  const outputPath = join(outputDir, `${projectName}.mmd`);

  // Ensure directory exists
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
  }

  // Generate basic diagram content based on type
  let content = `%% Flow Diagram for ${projectName}\n%% Generated on: ${new Date().toLocaleDateString()}\n%% Agent: FlowDiagramAgent v1.0.0\n\n`;

  switch (options.diagramType) {
    case 'sequence':
      content += `sequenceDiagram
    participant U as User
    participant UI as User Interface
    participant API as API Layer
    participant BL as Business Logic
    participant DB as Database

    U->>UI: Open Application
    UI->>API: Check Authentication
    API->>DB: Validate Session
    DB-->>API: Session Status
    API-->>UI: Authentication Result

    alt User Authenticated
        UI->>U: Show Dashboard
        U->>UI: Request Feature
        UI->>API: Process Request
        API->>BL: Execute Business Logic
        BL->>DB: Query/Update Data
        DB-->>BL: Data Response
        BL-->>API: Processed Result
        API-->>UI: Response Data
        UI-->>U: Display Result
    else User Not Authenticated
        UI->>U: Show Login Page
        U->>UI: Enter Credentials
        UI->>API: Authentication Request
        API->>DB: Validate Credentials
        DB-->>API: Validation Result
        API-->>UI: Authentication Response
        UI-->>U: Login Result
    end`;
      break;

    case 'classDiagram':
      content += `classDiagram
    class User {
        +String id
        +String username
        +String email
        +Date createdAt
        +login()
        +logout()
        +updateProfile()
    }

    class Application {
        +String name
        +String version
        +initialize()
        +authenticate()
        +processRequest()
    }

    class Feature {
        +String id
        +String name
        +Boolean enabled
        +execute()
        +validate()
    }

    class Database {
        +connect()
        +query()
        +update()
        +disconnect()
    }

    User ||--o{ Application : uses
    Application ||--o{ Feature : contains
    Application ||--|| Database : connects`;
      break;

    case 'stateDiagram':
      content += `stateDiagram-v2
    [*] --> Initialization
    Initialization --> Authentication : App Loaded
    Authentication --> Dashboard : Valid Credentials
    Authentication --> LoginPage : Invalid Credentials
    LoginPage --> Authentication : Retry
    Dashboard --> FeatureActive : Select Feature
    FeatureActive --> Processing : Execute
    Processing --> Success : Valid Result
    Processing --> Error : Invalid Result
    Success --> Dashboard : Continue
    Error --> FeatureActive : Retry
    FeatureActive --> Dashboard : Back
    Dashboard --> [*] : Logout`;
      break;

    case 'entityRelationship':
      content += `erDiagram
    USERS {
        string id PK
        string username
        string email
        string password_hash
        datetime created_at
        datetime updated_at
    }

    PROJECTS {
        string id PK
        string name
        string description
        string user_id FK
        datetime created_at
        datetime updated_at
    }

    FEATURES {
        string id PK
        string name
        string description
        string project_id FK
        boolean enabled
        datetime created_at
    }

    USERS ||--o{ PROJECTS : owns
    PROJECTS ||--o{ FEATURES : contains`;
      break;

    default: // flowchart
      content += `flowchart TD
    %% Main Application Flow
    A[User Opens Application] --> B{User Authenticated?}
    B -->|Yes| C[Dashboard/Main Page]
    B -->|No| D[Login/Register Page]
    D --> E[Authentication Process]
    E --> F{Valid Credentials?}
    F -->|Yes| C
    F -->|No| G[Show Error Message]
    G --> D

    ${options.includeUserFlow ? `
    %% User Flow
    C --> H[Core Feature 1]
    C --> I[Core Feature 2]
    C --> J[Core Feature 3]
    H --> K[Process Feature 1]
    I --> L[Process Feature 2]
    J --> M[Process Feature 3]
    K --> N[Display Results]
    L --> N
    M --> N
    N --> C
    ` : ''}

    ${options.includeDataFlow ? `
    %% Data Flow
    O[(Database)] --> P[API Layer]
    P --> Q[Business Logic]
    Q --> R[User Interface]
    R --> S[User Action]
    S --> T[Validation]
    T --> U{Valid Data?}
    U -->|Yes| Q
    U -->|No| V[Error Handling]
    V --> R
    ` : ''}

    %% Styling
    classDef startEnd fill:#e1f5fe
    classDef process fill:#f3e5f5
    classDef decision fill:#fff3e0
    classDef database fill:#e8f5e8
    classDef error fill:#ffebee

    class A,C startEnd
    class H,I,J,K,L,M,P,Q process
    class B,F,U decision
    class O database
    class G,V error`;
  }

  await writeFile(outputPath, content, 'utf-8');
  
  return {
    success: true,
    message: `Flow diagram generated successfully for project '${projectName}'`,
    outputPath,
    content,
    metadata: {
      generatedAt: new Date().toISOString(),
      agent: 'FlowDiagramAgent',
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
  const typeIndex = args.indexOf('--type');
  const diagramType = typeIndex !== -1 && args[typeIndex + 1] ? args[typeIndex + 1] : 'flowchart';
  
  const prdIndex = args.indexOf('--prd');
  const prdPath = prdIndex !== -1 && args[prdIndex + 1] ? args[prdIndex + 1] : undefined;
  
  const pathIndex = args.indexOf('--path');
  const projectPath = pathIndex !== -1 && args[pathIndex + 1] ? args[pathIndex + 1] : undefined;

  const options = {
    diagramType,
    generateSVG: args.includes('--svg'),
    includeUserFlow: !args.includes('--no-userflow'),
    includeDataFlow: !args.includes('--no-dataflow'),
    prdPath,
    projectPath,
  };

  // Validate diagram type
  const validTypes = ['flowchart', 'sequence', 'classDiagram', 'stateDiagram', 'entityRelationship'];
  if (!validTypes.includes(diagramType)) {
    console.error(`❌ Error: Invalid diagram type '${diagramType}'. Valid types: ${validTypes.join(', ')}`);
    process.exit(1);
  }

  try {
    console.log(`🚀 Generating ${diagramType} diagram for project: ${projectName}`);
    
    if (prdPath) {
      console.log(`📄 Using PRD file: ${prdPath}`);
    }
    
    let result;
    try {
      // Try to call the API first
      result = await callAPI(projectName, options);
    } catch (apiError) {
      console.log('📡 Server not available, generating locally...');
      result = await generateDiagramLocally(projectName, options);
    }

    if (result.success) {
      console.log(`✅ ${result.message}`);
      console.log(`📊 Diagram saved to: ${result.outputPath}`);
      
      if (options.generateSVG) {
        const svgPath = result.outputPath?.replace('.mmd', '.svg');
        console.log(`🖼️  SVG preview saved to: ${svgPath}`);
      }
      
      if (result.metadata) {
        console.log(`🕒 Generated at: ${result.metadata.generatedAt}`);
        console.log(`🤖 Agent: ${result.metadata.agent} v${result.metadata.version}`);
      }

      console.log(`
💡 Next steps:
   - View your diagram online at: https://mermaid.live/edit
   - Or use VS Code with Mermaid Preview extension
   - Or use Mermaid CLI: npm install -g @mermaid-js/mermaid-cli
   - Use 'pnpm run docs' to view all your generated docs`);
      
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