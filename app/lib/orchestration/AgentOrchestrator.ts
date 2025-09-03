/**
 * Agent Orchestration System
 * 
 * This module provides a centralized orchestration system for managing
 * multiple agents, coordinating their execution, and passing context
 * between them.
 * 
 * @module AgentOrchestrator
 */

import { createScopedLogger } from '~/utils/logger';
import type { 
  IAgent, 
  AgentContext, 
  AgentResult,
  AgentEvent,
  AgentEventListener,
  AgentEventType
} from '../agents/types';
import { createAgent, findBestAgent, getAvailableAgentIds, type AgentId } from '../agents';

/**
 * Configuration for the orchestrator.
 */
export interface OrchestratorConfig {
  /** Maximum number of agents that can run concurrently */
  maxConcurrentAgents?: number;
  
  /** Default timeout for agent operations in milliseconds */
  defaultTimeout?: number;
  
  /** Whether to enable debug logging */
  debug?: boolean;
  
  /** Whether to auto-select the best agent if none specified */
  autoSelectAgent?: boolean;
}

/**
 * Represents a scheduled or running agent task.
 */
interface AgentTask {
  id: string;
  agentId: AgentId;
  agent: IAgent;
  context: AgentContext;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: AgentResult;
  error?: string;
  startTime?: number;
  endTime?: number;
}

/**
 * Orchestration session tracking multiple related agent executions.
 */
export interface OrchestrationSession {
  id: string;
  startTime: number;
  endTime?: number;
  status: 'active' | 'completed' | 'failed';
  tasks: AgentTask[];
  totalAgents: number;
  completedAgents: number;
  failedAgents: number;
}

/**
 * Central orchestrator for managing agent execution and coordination.
 */
export class AgentOrchestrator {
  private readonly logger = createScopedLogger('AgentOrchestrator');
  private readonly config: Required<OrchestratorConfig>;
  private readonly registeredAgents: Map<AgentId, IAgent> = new Map();
  private readonly sessions: Map<string, OrchestrationSession> = new Map();
  private readonly eventListeners: AgentEventListener[] = [];
  private readonly runningTasks: Map<string, AgentTask> = new Map();

  constructor(config: OrchestratorConfig = {}) {
    this.config = {
      maxConcurrentAgents: 3,
      defaultTimeout: 30000,
      debug: false,
      autoSelectAgent: true,
      ...config
    };

    this.logger.debug('Agent orchestrator initialized', { config: this.config });
  }

  /**
   * Register an agent for use in orchestration.
   * 
   * @param agentId - The ID of the agent to register
   * @param config - Optional configuration for the agent
   */
  registerAgent(agentId: AgentId, config?: any): void {
    try {
      const agent = createAgent(agentId, config);
      this.registeredAgents.set(agentId, agent);
      
      // Listen to agent events
      agent.addEventListener(this.handleAgentEvent.bind(this));
      
      this.logger.info(`Registered agent: ${agent.name} (${agentId})`);
    } catch (error) {
      this.logger.error(`Failed to register agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Unregister an agent.
   * 
   * @param agentId - The ID of the agent to unregister
   */
  unregisterAgent(agentId: AgentId): void {
    const agent = this.registeredAgents.get(agentId);
    if (agent) {
      this.registeredAgents.delete(agentId);
      this.logger.info(`Unregistered agent: ${agent.name} (${agentId})`);
    }
  }

  /**
   * Get a registered agent by ID.
   * 
   * @param agentId - The ID of the agent to retrieve
   * @returns The agent instance or undefined if not found
   */
  getAgent(agentId: AgentId): IAgent | undefined {
    return this.registeredAgents.get(agentId);
  }

  /**
   * Get all registered agent IDs.
   * 
   * @returns Array of registered agent IDs
   */
  getRegisteredAgentIds(): AgentId[] {
    return Array.from(this.registeredAgents.keys());
  }

  /**
   * Add an event listener for orchestration events.
   * 
   * @param listener - The event listener function
   */
  addEventListener(listener: AgentEventListener): void {
    this.eventListeners.push(listener);
  }

  /**
   * Remove an event listener.
   * 
   * @param listener - The event listener function to remove
   */
  removeEventListener(listener: AgentEventListener): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * Execute a single agent with the given context.
   * 
   * @param agentId - The ID of the agent to execute (optional if auto-select is enabled)
   * @param context - The execution context
   * @returns Promise resolving to the orchestration session
   */
  async executeAgent(agentId: AgentId | null, context: AgentContext): Promise<OrchestrationSession> {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Auto-select agent if none specified and auto-select is enabled
    if (!agentId && this.config.autoSelectAgent) {
      agentId = findBestAgent(context, []);
      if (!agentId) {
        throw new Error('No suitable agent found for the given context');
      }
      this.logger.info(`Auto-selected agent: ${agentId}`);
    }

    if (!agentId) {
      throw new Error('No agent specified and auto-select is disabled');
    }

    const session = this.createSession(sessionId);
    
    try {
      await this.executeAgentTask(session, agentId, context);
      this.completeSession(session);
    } catch (error) {
      this.failSession(session, error);
    }

    return session;
  }

  /**
   * Execute multiple agents in sequence, passing context between them.
   * 
   * @param agentIds - Array of agent IDs to execute in order
   * @param initialContext - The initial execution context
   * @returns Promise resolving to the orchestration session
   */
  async executeAgentSequence(agentIds: AgentId[], initialContext: AgentContext): Promise<OrchestrationSession> {
    const sessionId = `sequence-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const session = this.createSession(sessionId);
    
    let currentContext = { ...initialContext };

    try {
      for (const agentId of agentIds) {
        const result = await this.executeAgentTask(session, agentId, currentContext);
        
        // Pass results to next agent's context
        if (result.success) {
          currentContext.previousResults = [
            ...(currentContext.previousResults || []),
            result
          ];
          currentContext.metadata = {
            ...currentContext.metadata,
            lastAgentResult: result
          };
        } else {
          // Stop execution on failure unless configured otherwise
          throw new Error(`Agent ${agentId} failed: ${result.error}`);
        }
      }
      
      this.completeSession(session);
    } catch (error) {
      this.failSession(session, error);
    }

    return session;
  }

  /**
   * Execute agents in parallel.
   * 
   * @param agentIds - Array of agent IDs to execute in parallel
   * @param context - The execution context (shared among all agents)
   * @returns Promise resolving to the orchestration session
   */
  async executeAgentsParallel(agentIds: AgentId[], context: AgentContext): Promise<OrchestrationSession> {
    const sessionId = `parallel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const session = this.createSession(sessionId);

    try {
      // Limit concurrent executions
      const chunks = this.chunkArray(agentIds, this.config.maxConcurrentAgents);
      
      for (const chunk of chunks) {
        const promises = chunk.map(agentId => this.executeAgentTask(session, agentId, context));
        await Promise.allSettled(promises);
      }
      
      this.completeSession(session);
    } catch (error) {
      this.failSession(session, error);
    }

    return session;
  }

  /**
   * Get a session by ID.
   * 
   * @param sessionId - The session ID
   * @returns The session or undefined if not found
   */
  getSession(sessionId: string): OrchestrationSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all active sessions.
   * 
   * @returns Array of active sessions
   */
  getActiveSessions(): OrchestrationSession[] {
    return Array.from(this.sessions.values()).filter(session => session.status === 'active');
  }

  /**
   * Cancel a running session.
   * 
   * @param sessionId - The session ID to cancel
   */
  async cancelSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'active') {
      return;
    }

    // Mark session as failed
    session.status = 'failed';
    session.endTime = Date.now();

    // Cancel running tasks
    const runningTasks = session.tasks.filter(task => task.status === 'running');
    for (const task of runningTasks) {
      task.status = 'failed';
      task.error = 'Cancelled by user';
      task.endTime = Date.now();
      this.runningTasks.delete(task.id);
    }

    this.logger.info(`Cancelled session: ${sessionId}`);
  }

  /**
   * Create a new orchestration session.
   */
  private createSession(sessionId: string): OrchestrationSession {
    const session: OrchestrationSession = {
      id: sessionId,
      startTime: Date.now(),
      status: 'active',
      tasks: [],
      totalAgents: 0,
      completedAgents: 0,
      failedAgents: 0
    };

    this.sessions.set(sessionId, session);
    this.logger.info(`Created orchestration session: ${sessionId}`);
    
    return session;
  }

  /**
   * Execute a single agent task within a session.
   */
  private async executeAgentTask(session: OrchestrationSession, agentId: AgentId, context: AgentContext): Promise<AgentResult> {
    const agent = this.registeredAgents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not registered: ${agentId}`);
    }

    const taskId = `${session.id}-${agentId}-${Date.now()}`;
    const task: AgentTask = {
      id: taskId,
      agentId,
      agent,
      context,
      status: 'pending'
    };

    session.tasks.push(task);
    session.totalAgents++;
    this.runningTasks.set(taskId, task);

    try {
      this.logger.info(`Starting agent task: ${agent.name} (${taskId})`);
      
      task.status = 'running';
      task.startTime = Date.now();

      // Execute agent phases
      const planResult = await agent.plan(context);
      const executeResult = await agent.execute(context);
      const reviewResult = await agent.review(context, executeResult);

      // Use the execute result as the primary result
      task.result = executeResult;
      task.status = 'completed';
      task.endTime = Date.now();
      
      session.completedAgents++;
      
      this.logger.info(`Completed agent task: ${agent.name} (${taskId})`, {
        executionTime: task.endTime - task.startTime!,
        success: executeResult.success
      });

      return executeResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      task.status = 'failed';
      task.error = errorMessage;
      task.endTime = Date.now();
      task.result = {
        success: false,
        message: 'Agent execution failed',
        error: errorMessage,
        executionTime: task.endTime - (task.startTime || task.endTime)
      };
      
      session.failedAgents++;
      
      this.logger.error(`Failed agent task: ${agent.name} (${taskId})`, error);
      
      throw error;
    } finally {
      this.runningTasks.delete(taskId);
    }
  }

  /**
   * Mark a session as completed.
   */
  private completeSession(session: OrchestrationSession): void {
    session.status = 'completed';
    session.endTime = Date.now();
    
    this.logger.info(`Completed orchestration session: ${session.id}`, {
      duration: session.endTime - session.startTime,
      totalAgents: session.totalAgents,
      completedAgents: session.completedAgents,
      failedAgents: session.failedAgents
    });
  }

  /**
   * Mark a session as failed.
   */
  private failSession(session: OrchestrationSession, error: unknown): void {
    session.status = 'failed';
    session.endTime = Date.now();
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    this.logger.error(`Failed orchestration session: ${session.id}`, { error: errorMessage });
  }

  /**
   * Handle events from agents.
   */
  private handleAgentEvent(event: AgentEvent): void {
    if (this.config.debug) {
      this.logger.debug(`Agent event: ${event.type}`, event);
    }

    // Forward event to orchestrator listeners
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        this.logger.error('Error in orchestrator event listener:', error);
      }
    });

    // Handle specific event types
    switch (event.type) {
      case 'status_changed':
        this.logger.debug(`Agent ${event.agentId} status changed:`, event.data);
        break;
      case 'error_occurred':
        this.logger.warn(`Agent ${event.agentId} error:`, event.data);
        break;
    }
  }

  /**
   * Utility function to chunk an array into smaller arrays.
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}