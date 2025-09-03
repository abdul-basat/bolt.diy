/**
 * Agent System Entry Point
 * 
 * This module exports all available agents and their types for use throughout
 * the application. It provides a centralized location for agent imports.
 * 
 * @module Agents
 */

// Export all types and interfaces
export * from './types';

// Export base agent class
export { BaseAgent } from './BaseAgent';

// Export specific agent implementations
export { PlannerAgent } from './PlannerAgent';
export { FrontendDevAgent } from './FrontendDevAgent';
export { DebuggerAgent } from './DebuggerAgent';
export { SecurityAgent } from './SecurityAgent';

// Export utility functions for working with agents
import type { IAgent, AgentContext } from './types';
import { PlannerAgent } from './PlannerAgent';
import { FrontendDevAgent } from './FrontendDevAgent';
import { DebuggerAgent } from './DebuggerAgent';
import { SecurityAgent } from './SecurityAgent';

/**
 * Available agent classes mapped by their IDs.
 */
export const AGENT_CLASSES = {
  'planner': PlannerAgent,
  'frontend-dev': FrontendDevAgent,
  'debugger': DebuggerAgent,
  'security': SecurityAgent,
} as const;

/**
 * Type representing available agent IDs.
 */
export type AgentId = keyof typeof AGENT_CLASSES;

/**
 * Create an agent instance by ID with optional configuration.
 * 
 * @param agentId - The ID of the agent to create
 * @param config - Optional configuration for the agent
 * @returns A new agent instance
 */
export function createAgent(agentId: AgentId, config?: any): IAgent {
  const AgentClass = AGENT_CLASSES[agentId];
  if (!AgentClass) {
    throw new Error(`Unknown agent ID: ${agentId}`);
  }
  return new AgentClass(config);
}

/**
 * Get all available agent IDs.
 * 
 * @returns Array of available agent IDs
 */
export function getAvailableAgentIds(): AgentId[] {
  return Object.keys(AGENT_CLASSES) as AgentId[];
}

/**
 * Find the best agent for handling a given context.
 * Returns the first agent that can handle the context, or null if none can.
 * 
 * @param context - The execution context
 * @param excludeIds - Agent IDs to exclude from selection
 * @returns The best matching agent ID, or null if none found
 */
export function findBestAgent(context: AgentContext, excludeIds: AgentId[] = []): AgentId | null {
  const availableIds = getAvailableAgentIds().filter(id => !excludeIds.includes(id));
  
  for (const agentId of availableIds) {
    const agent = createAgent(agentId);
    if (agent.canHandle(context)) {
      return agentId;
    }
  }
  
  return null;
}

/**
 * Get metadata about all available agents.
 * 
 * @returns Array of agent metadata
 */
export function getAgentMetadata(): Array<{
  id: AgentId;
  name: string;
  description: string;
  version: string;
}> {
  return getAvailableAgentIds().map(id => {
    const agent = createAgent(id);
    return {
      id,
      name: agent.name,
      description: agent.description,
      version: agent.version
    };
  });
}