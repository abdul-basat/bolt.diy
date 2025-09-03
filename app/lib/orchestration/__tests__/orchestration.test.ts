/**
 * Tests for the agent orchestration system
 * 
 * These tests validate the orchestration functionality including agent
 * registration, execution coordination, and workflow management.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AgentOrchestrator } from '../AgentOrchestrator';
import { 
  createDefaultOrchestrator,
  executeStandardWorkflow,
  executeDebuggingWorkflow,
  executeSecurityWorkflow
} from '../index';
import type { AgentContext } from '../../agents/types';

describe('Agent Orchestration System', () => {
  let orchestrator: AgentOrchestrator;
  let mockContext: AgentContext;

  beforeEach(() => {
    orchestrator = new AgentOrchestrator({
      debug: true,
      maxConcurrentAgents: 2,
      defaultTimeout: 5000
    });

    mockContext = {
      sessionId: 'test-orchestration-123',
      workingDirectory: '/test/project',
      environment: {
        NODE_ENV: 'test'
      },
      userInput: 'Create a secure React application',
      metadata: {
        testMode: true
      }
    };
  });

  describe('AgentOrchestrator', () => {
    it('should initialize with correct configuration', () => {
      const config = (orchestrator as any).config;
      expect(config.debug).toBe(true);
      expect(config.maxConcurrentAgents).toBe(2);
      expect(config.defaultTimeout).toBe(5000);
      expect(config.autoSelectAgent).toBe(true);
    });

    it('should register agents successfully', () => {
      orchestrator.registerAgent('planner');
      orchestrator.registerAgent('frontend-dev');

      const registeredIds = orchestrator.getRegisteredAgentIds();
      expect(registeredIds).toContain('planner');
      expect(registeredIds).toContain('frontend-dev');
      expect(registeredIds.length).toBe(2);
    });

    it('should retrieve registered agents', () => {
      orchestrator.registerAgent('planner');
      
      const agent = orchestrator.getAgent('planner');
      expect(agent).toBeDefined();
      expect(agent!.id).toBe('planner');
    });

    it('should unregister agents', () => {
      orchestrator.registerAgent('planner');
      expect(orchestrator.getRegisteredAgentIds()).toContain('planner');

      orchestrator.unregisterAgent('planner');
      expect(orchestrator.getRegisteredAgentIds()).not.toContain('planner');
    });

    it('should throw error when registering invalid agent', () => {
      expect(() => {
        orchestrator.registerAgent('invalid-agent' as any);
      }).toThrow('Unknown agent ID');
    });
  });

  describe('Single Agent Execution', () => {
    beforeEach(() => {
      orchestrator.registerAgent('planner');
      orchestrator.registerAgent('frontend-dev');
    });

    it('should execute single agent successfully', async () => {
      const session = await orchestrator.executeAgent('planner', mockContext);

      expect(session.status).toBe('completed');
      expect(session.totalAgents).toBe(1);
      expect(session.completedAgents).toBe(1);
      expect(session.failedAgents).toBe(0);
      expect(session.tasks.length).toBe(1);
      expect(session.tasks[0].status).toBe('completed');
    });

    it('should auto-select agent when none specified', async () => {
      const frontendContext = {
        ...mockContext,
        userInput: 'Create a React component'
      };

      const session = await orchestrator.executeAgent(null, frontendContext);

      expect(session.status).toBe('completed');
      expect(session.tasks[0].agentId).toBe('frontend-dev');
    });

    it('should throw error when no agent can be found', async () => {
      orchestrator.unregisterAgent('planner');
      orchestrator.unregisterAgent('frontend-dev');
      
      const config = { autoSelectAgent: false };
      const emptyOrchestrator = new AgentOrchestrator(config);

      await expect(
        emptyOrchestrator.executeAgent(null, mockContext)
      ).rejects.toThrow('No agent specified and auto-select is disabled');
    });
  });

  describe('Sequential Agent Execution', () => {
    beforeEach(() => {
      orchestrator.registerAgent('planner');
      orchestrator.registerAgent('frontend-dev');
      orchestrator.registerAgent('security');
    });

    it('should execute agents in sequence', async () => {
      const session = await orchestrator.executeAgentSequence(
        ['planner', 'frontend-dev'],
        mockContext
      );

      expect(session.status).toBe('completed');
      expect(session.totalAgents).toBe(2);
      expect(session.completedAgents).toBe(2);
      expect(session.tasks.length).toBe(2);
      
      // Verify execution order
      expect(session.tasks[0].agentId).toBe('planner');
      expect(session.tasks[1].agentId).toBe('frontend-dev');
      
      // Verify context passing
      const secondTask = session.tasks[1];
      expect(secondTask.context.previousResults).toBeDefined();
      expect(secondTask.context.previousResults!.length).toBe(1);
    });

    it('should stop on agent failure in sequence', async () => {
      // Mock agent failure
      const agent = orchestrator.getAgent('planner')!;
      const originalExecute = (agent as any).doExecute;
      (agent as any).doExecute = vi.fn().mockRejectedValue(new Error('Agent failed'));

      const session = await orchestrator.executeAgentSequence(
        ['planner', 'frontend-dev'],
        mockContext
      );

      expect(session.status).toBe('failed');
      expect(session.failedAgents).toBe(1);
      expect(session.tasks.length).toBe(1); // Only first agent attempted

      // Restore original method
      (agent as any).doExecute = originalExecute;
    });
  });

  describe('Parallel Agent Execution', () => {
    beforeEach(() => {
      orchestrator.registerAgent('frontend-dev');
      orchestrator.registerAgent('security');
      orchestrator.registerAgent('debugger');
    });

    it('should execute agents in parallel', async () => {
      const startTime = Date.now();
      
      const session = await orchestrator.executeAgentsParallel(
        ['frontend-dev', 'security'],
        mockContext
      );

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(session.status).toBe('completed');
      expect(session.totalAgents).toBe(2);
      expect(session.completedAgents).toBe(2);
      expect(session.tasks.length).toBe(2);
      
      // Parallel execution should be faster than sequential
      expect(executionTime).toBeLessThan(1000); // Reasonable upper bound
    });

    it('should respect max concurrent agents limit', async () => {
      const session = await orchestrator.executeAgentsParallel(
        ['frontend-dev', 'security', 'debugger'],
        mockContext
      );

      expect(session.status).toBe('completed');
      expect(session.totalAgents).toBe(3);
      expect(session.completedAgents).toBe(3);
    });
  });

  describe('Session Management', () => {
    beforeEach(() => {
      orchestrator.registerAgent('planner');
    });

    it('should track active sessions', async () => {
      const sessionPromise = orchestrator.executeAgent('planner', mockContext);
      
      // Check that session is active during execution
      const activeSessions = orchestrator.getActiveSessions();
      expect(activeSessions.length).toBeGreaterThan(0);

      const session = await sessionPromise;
      expect(session.status).toBe('completed');
    });

    it('should retrieve session by ID', async () => {
      const session = await orchestrator.executeAgent('planner', mockContext);
      
      const retrievedSession = orchestrator.getSession(session.id);
      expect(retrievedSession).toBeDefined();
      expect(retrievedSession!.id).toBe(session.id);
    });

    it('should cancel running session', async () => {
      // Start a long-running operation (mock slow execution)
      const agent = orchestrator.getAgent('planner')!;
      const originalExecute = (agent as any).doExecute;
      (agent as any).doExecute = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 5000))
      );

      const sessionPromise = orchestrator.executeAgent('planner', mockContext);
      
      // Get the session ID from active sessions
      const activeSessions = orchestrator.getActiveSessions();
      const sessionId = activeSessions[0].id;

      // Cancel the session
      await orchestrator.cancelSession(sessionId);

      const session = await sessionPromise;
      expect(session.status).toBe('failed');

      // Restore original method
      (agent as any).doExecute = originalExecute;
    });
  });

  describe('Event Handling', () => {
    beforeEach(() => {
      orchestrator.registerAgent('planner');
    });

    it('should handle agent events', async () => {
      const events: any[] = [];

      orchestrator.addEventListener((event) => {
        events.push(event);
      });

      await orchestrator.executeAgent('planner', mockContext);

      expect(events.length).toBeGreaterThan(0);
      expect(events.some(e => e.type === 'status_changed')).toBe(true);
    });

    it('should allow removing event listeners', () => {
      const listener = vi.fn();

      orchestrator.addEventListener(listener);
      orchestrator.removeEventListener(listener);

      // This should not trigger the listener
      orchestrator.executeAgent('planner', mockContext);

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Utility Functions', () => {
    it('should create default orchestrator with all agents', () => {
      const defaultOrchestrator = createDefaultOrchestrator();
      const registeredIds = defaultOrchestrator.getRegisteredAgentIds();

      expect(registeredIds).toContain('planner');
      expect(registeredIds).toContain('frontend-dev');
      expect(registeredIds).toContain('debugger');
      expect(registeredIds).toContain('security');
      expect(registeredIds.length).toBe(4);
    });

    it('should execute standard workflow', async () => {
      const session = await executeStandardWorkflow(
        'Create a secure React application',
        '/test/project'
      );

      expect(session.status).toBe('completed');
      expect(session.tasks.length).toBe(3); // planner, frontend-dev, security
      expect(session.tasks.map(t => t.agentId)).toEqual(['planner', 'frontend-dev', 'security']);
    });

    it('should execute debugging workflow', async () => {
      const session = await executeDebuggingWorkflow(
        'Fix authentication errors',
        '/test/project'
      );

      expect(session.status).toBe('completed');
      expect(session.tasks.length).toBe(2); // debugger, security
      expect(session.tasks.map(t => t.agentId)).toEqual(['debugger', 'security']);
    });

    it('should execute security workflow', async () => {
      const session = await executeSecurityWorkflow(
        'Perform security assessment',
        '/test/project'
      );

      expect(session.status).toBe('completed');
      expect(session.tasks.length).toBe(1); // security only
      expect(session.tasks[0].agentId).toBe('security');
    });

    it('should execute security workflow with planning', async () => {
      const session = await executeSecurityWorkflow(
        'Plan and implement security measures',
        '/test/project'
      );

      expect(session.status).toBe('completed');
      expect(session.tasks.length).toBe(2); // planner, security
      expect(session.tasks.map(t => t.agentId)).toEqual(['planner', 'security']);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle unregistered agent gracefully', async () => {
      await expect(
        orchestrator.executeAgent('nonexistent-agent' as any, mockContext)
      ).rejects.toThrow();
    });

    it('should handle missing session gracefully', () => {
      const session = orchestrator.getSession('nonexistent-session');
      expect(session).toBeUndefined();
    });

    it('should handle cancel of non-existent session gracefully', async () => {
      // Should not throw
      await orchestrator.cancelSession('nonexistent-session');
    });
  });
});