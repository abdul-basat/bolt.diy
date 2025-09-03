/**
 * Base implementation for all agents in the system.
 * 
 * This abstract class provides common functionality and a template for
 * implementing the IAgent interface. All concrete agent implementations
 * should extend this base class.
 * 
 * @module BaseAgent
 */

import { createScopedLogger } from '~/utils/logger';
import type { 
  IAgent, 
  AgentContext, 
  AgentResult, 
  AgentConfig,
  AgentEvent,
  AgentEventListener
} from './types';
import { AgentStatus, AgentEventType } from './types';

/**
 * Abstract base class for all agents.
 * 
 * Provides common functionality like logging, event emission, timing,
 * and error handling that all agents need.
 */
export abstract class BaseAgent implements IAgent {
  protected logger;
  protected status: AgentStatus = AgentStatus.IDLE;
  protected config: AgentConfig;
  protected eventListeners: AgentEventListener[] = [];

  constructor(config: AgentConfig = {}) {
    this.config = {
      debug: false,
      timeout: 30000, // 30 seconds default
      ...config
    };
    
    // Initialize logger with a generic name that will be overridden
    this.logger = createScopedLogger('BaseAgent');
  }

  // Initialize logger with proper name after construction
  protected initializeLogger(): void {
    this.logger = createScopedLogger(this.name);
  }

  // Abstract properties that must be implemented by concrete classes
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly version: string;

  /**
   * Add an event listener for agent events.
   */
  addEventListener(listener: AgentEventListener): void {
    this.eventListeners.push(listener);
  }

  /**
   * Remove an event listener.
   */
  removeEventListener(listener: AgentEventListener): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * Emit an event to all registered listeners.
   */
  protected emitEvent(type: AgentEventType, data: unknown = {}): void {
    const event: AgentEvent = {
      type,
      agentId: this.id,
      timestamp: Date.now(),
      data
    };

    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        this.logger.error('Error in event listener:', error);
      }
    });
  }

  /**
   * Update the agent status and emit a status change event.
   */
  protected setStatus(status: AgentStatus): void {
    const previousStatus = this.status;
    this.status = status;
    
    if (this.config.debug) {
      this.logger.debug(`Status changed: ${previousStatus} → ${status}`);
    }
    
    this.emitEvent(AgentEventType.STATUS_CHANGED, { 
      previousStatus, 
      currentStatus: status 
    });
  }

  /**
   * Log a message and optionally emit a log event.
   */
  protected log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: unknown): void {
    this.logger[level](message, data);
    
    if (this.config.debug) {
      this.emitEvent(AgentEventType.LOG_MESSAGE, { level, message, data });
    }
  }

  /**
   * Execute an operation with timeout and error handling.
   */
  protected async executeWithTimeout<T>(
    operation: () => Promise<T>,
    context: AgentContext,
    phase: string
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`${phase} phase timed out after ${this.config.timeout}ms`));
        }, this.config.timeout);
      });

      // Race between the operation and timeout
      const result = await Promise.race([operation(), timeoutPromise]);
      
      const executionTime = Date.now() - startTime;
      this.log('debug', `${phase} completed in ${executionTime}ms`);
      
      return result;
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.log('error', `${phase} failed after ${executionTime}ms: ${errorMessage}`, error);
      this.emitEvent(AgentEventType.ERROR_OCCURRED, { phase, error: errorMessage });
      
      throw error;
    }
  }

  /**
   * Create a standardized success result.
   */
  protected createSuccessResult(
    message: string,
    data?: unknown,
    artifacts?: string[],
    executionTime: number = 0
  ): AgentResult {
    return {
      success: true,
      message,
      data,
      artifacts,
      executionTime
    };
  }

  /**
   * Create a standardized error result.
   */
  protected createErrorResult(
    message: string,
    error: string,
    executionTime: number = 0
  ): AgentResult {
    return {
      success: false,
      message,
      error,
      executionTime
    };
  }

  // IAgent interface implementation with timing and status management

  async plan(context: AgentContext): Promise<AgentResult> {
    this.setStatus(AgentStatus.PLANNING);
    const startTime = Date.now();

    try {
      this.log('info', 'Starting planning phase', { sessionId: context.sessionId });
      
      const result = await this.executeWithTimeout(
        () => this.doPlan(context),
        context,
        'Planning'
      );

      result.executionTime = Date.now() - startTime;
      this.log('info', 'Planning phase completed successfully');
      
      return result;
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown planning error';
      
      this.setStatus(AgentStatus.FAILED);
      return this.createErrorResult(
        'Planning phase failed',
        errorMessage,
        executionTime
      );
    }
  }

  async execute(context: AgentContext): Promise<AgentResult> {
    this.setStatus(AgentStatus.EXECUTING);
    const startTime = Date.now();

    try {
      this.log('info', 'Starting execution phase', { sessionId: context.sessionId });
      
      const result = await this.executeWithTimeout(
        () => this.doExecute(context),
        context,
        'Execution'
      );

      result.executionTime = Date.now() - startTime;
      this.log('info', 'Execution phase completed successfully');
      
      return result;
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown execution error';
      
      this.setStatus(AgentStatus.FAILED);
      return this.createErrorResult(
        'Execution phase failed',
        errorMessage,
        executionTime
      );
    }
  }

  async review(context: AgentContext, executionResult: AgentResult): Promise<AgentResult> {
    this.setStatus(AgentStatus.REVIEWING);
    const startTime = Date.now();

    try {
      this.log('info', 'Starting review phase', { sessionId: context.sessionId });
      
      const result = await this.executeWithTimeout(
        () => this.doReview(context, executionResult),
        context,
        'Review'
      );

      result.executionTime = Date.now() - startTime;
      this.log('info', 'Review phase completed successfully');
      this.setStatus(AgentStatus.COMPLETED);
      
      return result;
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown review error';
      
      this.setStatus(AgentStatus.FAILED);
      return this.createErrorResult(
        'Review phase failed',
        errorMessage,
        executionTime
      );
    }
  }

  // Abstract methods that concrete agents must implement
  
  /**
   * Implement the actual planning logic.
   * This method is called by the plan() wrapper with proper error handling.
   */
  protected abstract doPlan(context: AgentContext): Promise<AgentResult>;
  
  /**
   * Implement the actual execution logic.
   * This method is called by the execute() wrapper with proper error handling.
   */
  protected abstract doExecute(context: AgentContext): Promise<AgentResult>;
  
  /**
   * Implement the actual review logic.
   * This method is called by the review() wrapper with proper error handling.
   */
  protected abstract doReview(context: AgentContext, executionResult: AgentResult): Promise<AgentResult>;

  /**
   * Default implementation that can be overridden by concrete agents.
   * By default, agents can handle any context, but specific agents should
   * implement more sophisticated logic.
   */
  canHandle(context: AgentContext): boolean {
    return true;
  }

  /**
   * Get the current status of the agent.
   */
  getStatus(): AgentStatus {
    return this.status;
  }

  /**
   * Get agent configuration.
   */
  getConfig(): AgentConfig {
    return { ...this.config };
  }
}