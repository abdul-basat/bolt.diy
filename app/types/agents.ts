export interface AgentConfig {
  name: string;
  description: string;
  capabilities: string[];
  outputMode: 'embedded' | 'standalone';
  targetFramework?: 'react' | 'react-native' | 'vue' | 'angular';
}

export interface AgentContext {
  projectType: string;
  currentFiles: string[];
  targetDirectory: string;
  standaloneMode: boolean;
  expoEnvironment?: boolean;
}

export interface AgentOutput {
  type: 'component' | 'file' | 'command';
  content: string;
  metadata?: {
    name?: string;
    description?: string;
    props?: Array<{
      name: string;
      type: string;
      required: boolean;
    }>;
    dependencies?: string[];
    framework?: string;
    category?: string;
  };
  filePath?: string;
  standalone?: boolean;
}

export interface DebugInfo {
  errors: Array<{
    message: string;
    file?: string;
    line?: number;
    column?: number;
    stack?: string;
  }>;
  warnings: Array<{
    message: string;
    file?: string;
    line?: number;
  }>;
  buildOutput?: string;
  expoErrors?: Array<{
    message: string;
    source: 'metro' | 'expo' | 'react-native';
  }>;
}

export interface AgentResponse {
  success: boolean;
  output?: AgentOutput;
  debugInfo?: DebugInfo;
  message?: string;
}

export interface BaseAgent {
  config: AgentConfig;

  /**
   * Process a request and generate output
   */
  process(request: string, context: AgentContext): Promise<AgentResponse>;

  /**
   * Validate the agent's output
   */
  validate?(output: AgentOutput): Promise<boolean>;
}

export interface FrontendDevAgent extends BaseAgent {
  config: AgentConfig & {
    capabilities: ['react', 'typescript', 'css', 'components'];
  };
}

export interface UIUXAgent extends BaseAgent {
  config: AgentConfig & {
    capabilities: ['design-systems', 'accessibility', 'responsive', 'animations'];
  };
}

export interface DebuggerAgent extends BaseAgent {
  config: AgentConfig & {
    capabilities: ['error-analysis', 'performance', 'testing', 'debugging'];
  };

  /**
   * Analyze errors and provide fixes
   */
  analyzeErrors(debugInfo: DebugInfo): Promise<AgentResponse>;
}

export interface ReactNativeAgent extends BaseAgent {
  config: AgentConfig & {
    capabilities: ['react-native', 'expo', 'mobile-ui', 'navigation'];
    targetFramework: 'react-native';
  };
}

export interface AgentOrchestrator {
  /**
   * Route requests to appropriate agents
   */
  route(request: string, context: AgentContext): Promise<BaseAgent[]>;

  /**
   * Coordinate multiple agents for complex tasks
   */
  orchestrate(request: string, context: AgentContext, agents: BaseAgent[]): Promise<AgentResponse[]>;

  /**
   * Handle Expo-specific workflows
   */
  handleExpoWorkflow(agents: BaseAgent[], context: AgentContext & { expoEnvironment: true }): Promise<AgentResponse[]>;
}
