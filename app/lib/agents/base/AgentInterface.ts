/**
 * Base interface for all agent implementations in bolt.diy
 * Provides a standardized structure for agent output and execution
 */

export interface AgentInput {
  projectName: string;
  projectPath?: string;
  options?: Record<string, any>;
}

export interface AgentOutput {
  success: boolean;
  message: string;
  outputPath?: string;
  content?: string;
  metadata?: {
    format?: string;
    generatedAt: string;
    agent: string;
    version: string;
  };
  errors?: string[];
}

export interface AgentConfig {
  name: string;
  version: string;
  description: string;
  outputDirectory: string;
  supportedFormats: string[];
}

export abstract class BaseAgent {
  protected config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  /**
   * Execute the agent with the given input
   */
  abstract execute(input: AgentInput): Promise<AgentOutput>;

  /**
   * Validate input before execution
   */
  protected validateInput(input: AgentInput): string[] {
    const errors: string[] = [];
    
    if (!input.projectName || input.projectName.trim() === '') {
      errors.push('Project name is required');
    }
    
    if (input.projectName && !/^[a-zA-Z0-9_-]+$/.test(input.projectName)) {
      errors.push('Project name can only contain alphanumeric characters, underscores, and hyphens');
    }
    
    return errors;
  }

  /**
   * Create standardized output
   */
  protected createOutput(
    success: boolean,
    message: string,
    outputPath?: string,
    content?: string,
    errors?: string[]
  ): AgentOutput {
    return {
      success,
      message,
      outputPath,
      content,
      metadata: {
        generatedAt: new Date().toISOString(),
        agent: this.config.name,
        version: this.config.version,
      },
      errors,
    };
  }

  /**
   * Get agent information
   */
  getConfig(): AgentConfig {
    return { ...this.config };
  }
}