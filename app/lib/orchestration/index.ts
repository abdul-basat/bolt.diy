/**
 * Orchestration System Entry Point
 * 
 * This module exports the orchestration system for managing agent workflows
 * and provides utility functions for common orchestration patterns.
 * 
 * @module Orchestration
 */

export { AgentOrchestrator } from './AgentOrchestrator';
export type { 
  OrchestratorConfig, 
  OrchestrationSession 
} from './AgentOrchestrator';

// Re-export agent types for convenience
export type { 
  AgentContext, 
  AgentResult, 
  AgentEvent, 
  AgentEventListener 
} from '../agents/types';

import { AgentOrchestrator } from './AgentOrchestrator';
import type { AgentContext } from '../agents/types';
import type { AgentId } from '../agents';

/**
 * Create a pre-configured orchestrator instance with commonly used agents.
 * 
 * @param config - Optional orchestrator configuration
 * @returns A configured orchestrator instance
 */
export function createDefaultOrchestrator(config?: any): AgentOrchestrator {
  const orchestrator = new AgentOrchestrator(config);
  
  // Register all available agents
  orchestrator.registerAgent('planner');
  orchestrator.registerAgent('frontend-dev');
  orchestrator.registerAgent('debugger');
  orchestrator.registerAgent('security');
  
  return orchestrator;
}

/**
 * Execute a standard development workflow with planning, execution, and review.
 * 
 * @param userInput - The user's requirements
 * @param workingDirectory - The working directory path
 * @param sessionId - Optional session ID
 * @returns Promise resolving to the orchestration session
 */
export async function executeStandardWorkflow(
  userInput: string,
  workingDirectory: string,
  sessionId?: string
) {
  const orchestrator = createDefaultOrchestrator();
  
  const context: AgentContext = {
    sessionId: sessionId || `workflow-${Date.now()}`,
    workingDirectory,
    environment: {}, // Will be populated by config manager
    userInput,
    metadata: {
      workflowType: 'standard',
      startTime: Date.now()
    }
  };

  // Execute agents in sequence: plan -> execute -> review
  return orchestrator.executeAgentSequence(
    ['planner', 'frontend-dev', 'security'], 
    context
  );
}

/**
 * Execute a debugging workflow focused on finding and fixing issues.
 * 
 * @param userInput - The error description or debugging request
 * @param workingDirectory - The working directory path
 * @param sessionId - Optional session ID
 * @returns Promise resolving to the orchestration session
 */
export async function executeDebuggingWorkflow(
  userInput: string,
  workingDirectory: string,
  sessionId?: string
) {
  const orchestrator = createDefaultOrchestrator();
  
  const context: AgentContext = {
    sessionId: sessionId || `debug-${Date.now()}`,
    workingDirectory,
    environment: {},
    userInput,
    metadata: {
      workflowType: 'debugging',
      startTime: Date.now()
    }
  };

  // Execute debugger agent followed by security review
  return orchestrator.executeAgentSequence(['debugger', 'security'], context);
}

/**
 * Execute a security-focused workflow.
 * 
 * @param userInput - The security requirements or assessment request
 * @param workingDirectory - The working directory path
 * @param sessionId - Optional session ID
 * @returns Promise resolving to the orchestration session
 */
export async function executeSecurityWorkflow(
  userInput: string,
  workingDirectory: string,
  sessionId?: string
) {
  const orchestrator = createDefaultOrchestrator();
  
  const context: AgentContext = {
    sessionId: sessionId || `security-${Date.now()}`,
    workingDirectory,
    environment: {},
    userInput,
    metadata: {
      workflowType: 'security',
      startTime: Date.now()
    }
  };

  // Execute security agent with optional planning
  const agents: AgentId[] = userInput.toLowerCase().includes('plan') 
    ? ['planner', 'security'] 
    : ['security'];
    
  return orchestrator.executeAgentSequence(agents, context);
}

/**
 * Execute a comprehensive workflow that includes all agent types.
 * 
 * @param userInput - The comprehensive requirements
 * @param workingDirectory - The working directory path
 * @param sessionId - Optional session ID
 * @returns Promise resolving to the orchestration session
 */
export async function executeComprehensiveWorkflow(
  userInput: string,
  workingDirectory: string,
  sessionId?: string
) {
  const orchestrator = createDefaultOrchestrator();
  
  const context: AgentContext = {
    sessionId: sessionId || `comprehensive-${Date.now()}`,
    workingDirectory,
    environment: {},
    userInput,
    metadata: {
      workflowType: 'comprehensive',
      startTime: Date.now()
    }
  };

  // Execute all agents in logical order
  return orchestrator.executeAgentSequence(
    ['planner', 'frontend-dev', 'debugger', 'security'],
    context
  );
}