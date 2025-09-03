/**
 * Core types and interfaces for the agent system.
 * 
 * This module defines the fundamental contracts that all agents must implement,
 * providing a consistent interface for planning, execution, and review across
 * different agent types.
 * 
 * @module AgentTypes
 */

/**
 * Execution context passed between agents containing shared state and resources.
 */
export interface AgentContext {
  /** Unique identifier for the current session/conversation */
  sessionId: string;
  
  /** Current working directory path */
  workingDirectory: string;
  
  /** Available environment variables (securely filtered) */
  environment: Record<string, string>;
  
  /** Previous agent results for context chaining */
  previousResults?: AgentResult[];
  
  /** User input or requirements */
  userInput: string;
  
  /** Additional metadata that can be passed between agents */
  metadata?: Record<string, unknown>;
}

/**
 * Result returned by agent operations.
 */
export interface AgentResult {
  /** Whether the operation succeeded */
  success: boolean;
  
  /** Human-readable message describing the result */
  message: string;
  
  /** Structured data produced by the agent */
  data?: unknown;
  
  /** Any artifacts created (file paths, URLs, etc.) */
  artifacts?: string[];
  
  /** Execution time in milliseconds */
  executionTime: number;
  
  /** Error details if the operation failed */
  error?: string;
}

/**
 * Base interface that all agents must implement.
 * 
 * This interface provides the core contract for all agent operations:
 * planning, execution, and review phases.
 */
export interface IAgent {
  /** Unique identifier for this agent type */
  readonly id: string;
  
  /** Human-readable name for this agent */
  readonly name: string;
  
  /** Description of what this agent does */
  readonly description: string;
  
  /** Version of this agent implementation */
  readonly version: string;
  
  /**
   * Plan phase: Analyze the context and create an execution plan.
   * 
   * @param context - The execution context
   * @returns Promise resolving to the planning result
   */
  plan(context: AgentContext): Promise<AgentResult>;
  
  /**
   * Execute phase: Carry out the planned operations.
   * 
   * @param context - The execution context
   * @returns Promise resolving to the execution result
   */
  execute(context: AgentContext): Promise<AgentResult>;
  
  /**
   * Review phase: Validate and review the results of execution.
   * 
   * @param context - The execution context
   * @param executionResult - The result from the execute phase
   * @returns Promise resolving to the review result
   */
  review(context: AgentContext, executionResult: AgentResult): Promise<AgentResult>;
  
  /**
   * Check if this agent can handle the given context.
   * 
   * @param context - The execution context to evaluate
   * @returns true if this agent can handle the context
   */
  canHandle(context: AgentContext): boolean;

  /**
   * Add an event listener for agent events.
   * 
   * @param listener - The event listener function
   */
  addEventListener(listener: AgentEventListener): void;
}

/**
 * Configuration options for agent initialization.
 */
export interface AgentConfig {
  /** Enable debug logging for this agent */
  debug?: boolean;
  
  /** Maximum execution time in milliseconds */
  timeout?: number;
  
  /** Agent-specific configuration */
  options?: Record<string, unknown>;
}

/**
 * Status of an agent during execution.
 */
export enum AgentStatus {
  IDLE = 'idle',
  PLANNING = 'planning', 
  EXECUTING = 'executing',
  REVIEWING = 'reviewing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * Event types emitted by agents during execution.
 */
export enum AgentEventType {
  STATUS_CHANGED = 'status_changed',
  PROGRESS_UPDATE = 'progress_update',
  LOG_MESSAGE = 'log_message',
  ERROR_OCCURRED = 'error_occurred'
}

/**
 * Event data structure for agent events.
 */
export interface AgentEvent {
  type: AgentEventType;
  agentId: string;
  timestamp: number;
  data: unknown;
}

/**
 * Interface for objects that can listen to agent events.
 */
export interface AgentEventListener {
  (event: AgentEvent): void;
}