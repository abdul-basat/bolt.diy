import type { 
  IAgent, 
  AgentRegistration, 
  AgentEvent, 
  AgentEventType 
} from './types';

/**
 * Registry for managing agent instances and their lifecycle
 * Provides dynamic loading, registration, and discovery of agents
 */
export class AgentRegistry {
  private static instance: AgentRegistry;
  private agents = new Map<string, AgentRegistration>();
  private eventListeners = new Map<AgentEventType, Array<(event: AgentEvent) => void>>();

  private constructor() {}

  /**
   * Get the singleton instance of the AgentRegistry
   */
  static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  /**
   * Register a new agent with the registry
   */
  register(agent: IAgent, options: { enabled?: boolean; priority?: number } = {}): void {
    const { enabled = true, priority = 0 } = options;
    
    if (this.agents.has(agent.name)) {
      throw new Error(`Agent '${agent.name}' is already registered`);
    }

    const registration: AgentRegistration = {
      agent,
      enabled,
      priority,
      registeredAt: new Date(),
    };

    this.agents.set(agent.name, registration);
    this.emitEvent('registered', agent.name, { registration });
  }

  /**
   * Unregister an agent from the registry
   */
  unregister(agentName: string): boolean {
    const registration = this.agents.get(agentName);
    if (!registration) {
      return false;
    }

    this.agents.delete(agentName);
    this.emitEvent('unregistered', agentName, { registration });
    return true;
  }

  /**
   * Get a specific agent by name
   */
  getAgent(name: string): IAgent | undefined {
    const registration = this.agents.get(name);
    return registration?.agent;
  }

  /**
   * Get all registered agents
   */
  getAllAgents(): IAgent[] {
    return Array.from(this.agents.values()).map(reg => reg.agent);
  }

  /**
   * Get enabled agents only
   */
  getEnabledAgents(): IAgent[] {
    return Array.from(this.agents.values())
      .filter(reg => reg.enabled)
      .sort((a, b) => b.priority - a.priority) // Higher priority first
      .map(reg => reg.agent);
  }

  /**
   * Get agents by tags
   */
  getAgentsByTags(tags: string[]): IAgent[] {
    return Array.from(this.agents.values())
      .filter(reg => reg.enabled && reg.agent.tags.some(tag => tags.includes(tag)))
      .sort((a, b) => b.priority - a.priority)
      .map(reg => reg.agent);
  }

  /**
   * Enable or disable an agent
   */
  setAgentEnabled(agentName: string, enabled: boolean): boolean {
    const registration = this.agents.get(agentName);
    if (!registration) {
      return false;
    }

    registration.enabled = enabled;
    return true;
  }

  /**
   * Set agent priority
   */
  setAgentPriority(agentName: string, priority: number): boolean {
    const registration = this.agents.get(agentName);
    if (!registration) {
      return false;
    }

    registration.priority = priority;
    return true;
  }

  /**
   * Check if an agent is registered
   */
  isRegistered(agentName: string): boolean {
    return this.agents.has(agentName);
  }

  /**
   * Check if an agent is enabled
   */
  isEnabled(agentName: string): boolean {
    const registration = this.agents.get(agentName);
    return registration?.enabled ?? false;
  }

  /**
   * Get registration info for an agent
   */
  getRegistration(agentName: string): AgentRegistration | undefined {
    return this.agents.get(agentName);
  }

  /**
   * Get all registrations
   */
  getAllRegistrations(): AgentRegistration[] {
    return Array.from(this.agents.values());
  }

  /**
   * Clear all registered agents
   */
  clear(): void {
    const agentNames = Array.from(this.agents.keys());
    this.agents.clear();
    
    agentNames.forEach(name => {
      this.emitEvent('unregistered', name);
    });
  }

  /**
   * Get agent statistics
   */
  getStats() {
    const registrations = Array.from(this.agents.values());
    const enabled = registrations.filter(reg => reg.enabled);
    
    return {
      total: registrations.length,
      enabled: enabled.length,
      disabled: registrations.length - enabled.length,
      tagDistribution: this.getTagDistribution(),
    };
  }

  /**
   * Get distribution of tags across all agents
   */
  private getTagDistribution(): Record<string, number> {
    const tagCounts: Record<string, number> = {};
    
    for (const registration of this.agents.values()) {
      for (const tag of registration.agent.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }
    
    return tagCounts;
  }

  /**
   * Add event listener for agent events
   */
  addEventListener(eventType: AgentEventType, listener: (event: AgentEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(eventType: AgentEventType, listener: (event: AgentEvent) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event to all listeners
   */
  private emitEvent(type: AgentEventType, agentName: string, data?: unknown): void {
    const event: AgentEvent = {
      type,
      agentName,
      timestamp: new Date(),
      data,
    };

    const listeners = this.eventListeners.get(type) || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error(`Error in agent event listener for ${type}:`, error);
      }
    });
  }

  /**
   * Emit execution events (used by orchestrator)
   */
  emitExecutionEvent(type: 'executionStarted' | 'executionCompleted' | 'executionFailed', agentName: string, data?: unknown): void {
    this.emitEvent(type, agentName, data);
  }
}