/**
 * Core agent types and interfaces for the multi-agent system
 */

export interface AgentOutput {
  /** Short text summary of what the agent accomplished */
  summary: string;
  
  /** Code snippets, configs, tests, or other generated artifacts */
  artifacts: AgentArtifact[];
  
  /** Suggested follow-up actions for other agents or the user */
  nextSteps: string[];
  
  /** Agent execution metadata */
  metadata: {
    agentName: string;
    executionTime: number;
    success: boolean;
    errors?: string[];
  };
}

export interface AgentArtifact {
  /** Type of artifact (e.g., 'code', 'config', 'test', 'documentation') */
  type: string;
  
  /** File path or identifier for the artifact */
  path: string;
  
  /** Content of the artifact */
  content: string;
  
  /** Optional description of the artifact */
  description?: string;
}

export interface AgentContext {
  /** Current project files and structure */
  projectFiles: Record<string, string>;
  
  /** Previous agent outputs that can be used as input */
  previousOutputs: AgentOutput[];
  
  /** User-provided requirements or constraints */
  requirements: string;
  
  /** Configuration options for the agent */
  config?: Record<string, unknown>;
}

export interface AgentExecutionPlan {
  /** List of steps the agent plans to execute */
  steps: string[];
  
  /** Estimated execution time in seconds */
  estimatedTime: number;
  
  /** Dependencies on other agents or external resources */
  dependencies: string[];
  
  /** Expected outputs/artifacts */
  expectedOutputs: string[];
}

/**
 * Base interface that all agents must implement
 */
export interface IAgent {
  /** Unique identifier for the agent */
  readonly name: string;
  
  /** Human-readable description of what the agent does */
  readonly description: string;
  
  /** Version of the agent implementation */
  readonly version: string;
  
  /** Tags for categorizing the agent (e.g., 'ui', 'performance', 'testing') */
  readonly tags: string[];
  
  /**
   * Plan phase: Analyze the context and create an execution plan
   */
  plan(context: AgentContext): Promise<AgentExecutionPlan>;
  
  /**
   * Execute phase: Perform the actual work based on the plan
   */
  execute(context: AgentContext, plan: AgentExecutionPlan): Promise<AgentOutput>;
  
  /**
   * Review phase: Validate the output and suggest improvements
   */
  review(output: AgentOutput, context: AgentContext): Promise<AgentOutput>;
}

export interface AgentRegistration {
  agent: IAgent;
  enabled: boolean;
  priority: number;
  registeredAt: Date;
}

export interface OrchestrationOptions {
  /** Whether to run agents in parallel (default: false for sequential) */
  parallel: boolean;
  
  /** Maximum number of agents to run concurrently when parallel=true */
  maxConcurrency?: number;
  
  /** Whether to chain outputs between agents */
  chainOutputs: boolean;
  
  /** Stop execution if any agent fails */
  stopOnError: boolean;
  
  /** Timeout for each agent execution in seconds */
  timeout?: number;
}

export interface OrchestrationResult {
  /** Results from all executed agents */
  results: AgentOutput[];
  
  /** Overall execution summary */
  summary: {
    totalAgents: number;
    successfulAgents: number;
    failedAgents: number;
    totalExecutionTime: number;
  };
  
  /** Any orchestration-level errors */
  errors: string[];
}

export type AgentEventType = 'registered' | 'unregistered' | 'executionStarted' | 'executionCompleted' | 'executionFailed';

export interface AgentEvent {
  type: AgentEventType;
  agentName: string;
  timestamp: Date;
  data?: unknown;
}