// Export all agent types and interfaces
export type {
  IAgent,
  AgentOutput,
  AgentArtifact,
  AgentContext,
  AgentExecutionPlan,
  AgentRegistration,
  OrchestrationOptions,
  OrchestrationResult,
  AgentEvent,
  AgentEventType,
} from './types';

// Export base classes and core functionality
export { BaseAgent } from './base-agent';
export { AgentRegistry } from './registry';
export { AgentOrchestrator } from './orchestrator';
export { LoggingService } from './logging';

// Export all agent implementations
export { UIUXAgent } from './implementations/uiux-agent';
export { PerformanceAgent } from './implementations/performance-agent';
export { AccessibilityAgent } from './implementations/accessibility-agent';
export { TestingAgent } from './implementations/testing-agent';
export { DocumentationAgent } from './implementations/documentation-agent';
export { DataAgent } from './implementations/data-agent';
export { DeploymentAgent } from './implementations/deployment-agent';
export { RefactoringAgent } from './implementations/refactoring-agent';

// Agent manager for initialization and auto-registration
import { AgentRegistry } from './registry';
import { UIUXAgent } from './implementations/uiux-agent';
import { PerformanceAgent } from './implementations/performance-agent';
import { AccessibilityAgent } from './implementations/accessibility-agent';
import { TestingAgent } from './implementations/testing-agent';
import { DocumentationAgent } from './implementations/documentation-agent';
import { DataAgent } from './implementations/data-agent';
import { DeploymentAgent } from './implementations/deployment-agent';
import { RefactoringAgent } from './implementations/refactoring-agent';

/**
 * Agent Manager class for initializing and managing the agent system
 */
export class AgentManager {
  private static instance: AgentManager;
  private registry: AgentRegistry;
  private initialized = false;

  private constructor() {
    this.registry = AgentRegistry.getInstance();
  }

  /**
   * Get the singleton instance of AgentManager
   */
  static getInstance(): AgentManager {
    if (!AgentManager.instance) {
      AgentManager.instance = new AgentManager();
    }
    return AgentManager.instance;
  }

  /**
   * Initialize the agent system with all available agents
   */
  initialize(): void {
    if (this.initialized) {
      return;
    }

    // Register all agents with their default configurations
    const agents = [
      { agent: new UIUXAgent(), priority: 10, enabled: true },
      { agent: new PerformanceAgent(), priority: 9, enabled: true },
      { agent: new AccessibilityAgent(), priority: 8, enabled: true },
      { agent: new TestingAgent(), priority: 7, enabled: true },
      { agent: new DocumentationAgent(), priority: 6, enabled: true },
      { agent: new DataAgent(), priority: 5, enabled: true },
      { agent: new DeploymentAgent(), priority: 4, enabled: true },
      { agent: new RefactoringAgent(), priority: 3, enabled: true },
    ];

    agents.forEach(({ agent, priority, enabled }) => {
      this.registry.register(agent, { priority, enabled });
    });

    this.initialized = true;
    console.log('✅ Agent system initialized with', agents.length, 'agents');
  }

  /**
   * Get the registry instance
   */
  getRegistry(): AgentRegistry {
    return this.registry;
  }

  /**
   * Get all available agents
   */
  getAvailableAgents() {
    return this.registry.getAllAgents();
  }

  /**
   * Get enabled agents only
   */
  getEnabledAgents() {
    return this.registry.getEnabledAgents();
  }

  /**
   * Get agents by tags
   */
  getAgentsByTags(tags: string[]) {
    return this.registry.getAgentsByTags(tags);
  }

  /**
   * Get agent statistics
   */
  getStats() {
    return this.registry.getStats();
  }

  /**
   * Enable/disable an agent
   */
  setAgentEnabled(agentName: string, enabled: boolean): boolean {
    return this.registry.setAgentEnabled(agentName, enabled);
  }

  /**
   * Set agent priority
   */
  setAgentPriority(agentName: string, priority: number): boolean {
    return this.registry.setAgentPriority(agentName, priority);
  }

  /**
   * Reset the agent system (for testing)
   */
  reset(): void {
    this.registry.clear();
    this.initialized = false;
  }
}

// Auto-initialize the agent system
const agentManager = AgentManager.getInstance();
agentManager.initialize();

// Export the manager instance
export { agentManager };

// Convenience function to get the registry
export const getAgentRegistry = () => AgentRegistry.getInstance();

// Convenience function to list all agents (for CLI)
export const listAgents = () => {
  const registry = AgentRegistry.getInstance();
  const agents = registry.getAllAgents();
  
  return agents.map(agent => ({
    name: agent.name,
    description: agent.description,
    version: agent.version,
    tags: agent.tags,
    enabled: registry.isEnabled(agent.name),
    priority: registry.getRegistration(agent.name)?.priority || 0,
  }));
};