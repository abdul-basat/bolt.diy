/**
 * Tests for the agent system
 * 
 * These tests validate the core agent functionality including base agent
 * behavior, specific agent implementations, and orchestration.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlannerAgent } from '../PlannerAgent';
import { FrontendDevAgent } from '../FrontendDevAgent';
import { DebuggerAgent } from '../DebuggerAgent';
import { SecurityAgent } from '../SecurityAgent';
import { createAgent, getAvailableAgentIds, findBestAgent } from '../index';
import type { AgentContext } from '../types';

describe('Agent System', () => {
  let mockContext: AgentContext;

  beforeEach(() => {
    mockContext = {
      sessionId: 'test-session-123',
      workingDirectory: '/test/project',
      environment: {
        NODE_ENV: 'test'
      },
      userInput: 'Create a React component for user authentication',
      metadata: {
        testMode: true
      }
    };
  });

  describe('PlannerAgent', () => {
    let agent: PlannerAgent;

    beforeEach(() => {
      agent = new PlannerAgent();
    });

    it('should have correct metadata', () => {
      expect(agent.id).toBe('planner');
      expect(agent.name).toBe('Planner Agent');
      expect(agent.description).toContain('execution plans');
      expect(agent.version).toBe('1.0.0');
    });

    it('can handle any context', () => {
      expect(agent.canHandle(mockContext)).toBe(true);
    });

    it('should complete planning phase', async () => {
      const result = await agent.plan(mockContext);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('planning');
      expect(result.data).toBeDefined();
      expect(typeof result.executionTime).toBe('number');
    });

    it('should create execution plan', async () => {
      const result = await agent.execute(mockContext);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.artifacts).toBeDefined();
      expect(result.artifacts!.length).toBeGreaterThan(0);
    });

    it('should review execution plan', async () => {
      const executeResult = await agent.execute(mockContext);
      const reviewResult = await agent.review(mockContext, executeResult);
      
      expect(reviewResult.success).toBe(true);
      expect(reviewResult.data).toBeDefined();
    });
  });

  describe('FrontendDevAgent', () => {
    let agent: FrontendDevAgent;

    beforeEach(() => {
      agent = new FrontendDevAgent();
    });

    it('should have correct metadata', () => {
      expect(agent.id).toBe('frontend-dev');
      expect(agent.name).toBe('Frontend Development Agent');
      expect(agent.description).toContain('frontend');
      expect(agent.version).toBe('1.0.0');
    });

    it('can handle frontend-related contexts', () => {
      const frontendContext = {
        ...mockContext,
        userInput: 'Create a React component with styling'
      };
      expect(agent.canHandle(frontendContext)).toBe(true);
    });

    it('should not handle non-frontend contexts', () => {
      const backendContext = {
        ...mockContext,
        userInput: 'Fix database connection issues'
      };
      expect(agent.canHandle(backendContext)).toBe(false);
    });

    it('should complete frontend development workflow', async () => {
      const planResult = await agent.plan(mockContext);
      expect(planResult.success).toBe(true);

      const executeResult = await agent.execute(mockContext);
      expect(executeResult.success).toBe(true);
      expect(executeResult.data).toBeDefined();

      const reviewResult = await agent.review(mockContext, executeResult);
      expect(reviewResult.success).toBe(true);
    });
  });

  describe('DebuggerAgent', () => {
    let agent: DebuggerAgent;

    beforeEach(() => {
      agent = new DebuggerAgent();
    });

    it('should have correct metadata', () => {
      expect(agent.id).toBe('debugger');
      expect(agent.name).toBe('Debugger Agent');
      expect(agent.description).toContain('bugs');
      expect(agent.version).toBe('1.0.0');
    });

    it('can handle debugging contexts', () => {
      const debugContext = {
        ...mockContext,
        userInput: 'Fix the error in the authentication component'
      };
      expect(agent.canHandle(debugContext)).toBe(true);
    });

    it('should not handle non-debugging contexts', () => {
      const createContext = {
        ...mockContext,
        userInput: 'Create a new feature for user profiles'
      };
      expect(agent.canHandle(createContext)).toBe(false);
    });

    it('should complete debugging workflow', async () => {
      const debugContext = {
        ...mockContext,
        userInput: 'Debug runtime error in user login'
      };

      const executeResult = await agent.execute(debugContext);
      expect(executeResult.success).toBe(true);
      expect(executeResult.data).toBeDefined();
      
      const data = executeResult.data as any;
      expect(data.bugsFound).toBeDefined();
      expect(data.bugsFixed).toBeDefined();
      expect(Array.isArray(data.bugsFound)).toBe(true);
      expect(Array.isArray(data.bugsFixed)).toBe(true);
    });
  });

  describe('SecurityAgent', () => {
    let agent: SecurityAgent;

    beforeEach(() => {
      agent = new SecurityAgent();
    });

    it('should have correct metadata', () => {
      expect(agent.id).toBe('security');
      expect(agent.name).toBe('Security Agent');
      expect(agent.description).toContain('security');
      expect(agent.version).toBe('1.0.0');
    });

    it('can handle security contexts', () => {
      const securityContext = {
        ...mockContext,
        userInput: 'Implement authentication and secure the API'
      };
      expect(agent.canHandle(securityContext)).toBe(true);
    });

    it('should complete security assessment workflow', async () => {
      const securityContext = {
        ...mockContext,
        userInput: 'Perform security audit and implement authentication'
      };

      const executeResult = await agent.execute(securityContext);
      expect(executeResult.success).toBe(true);
      expect(executeResult.data).toBeDefined();
      
      const assessment = executeResult.data as any;
      expect(assessment.vulnerabilities).toBeDefined();
      expect(assessment.securityScore).toBeDefined();
      expect(assessment.riskLevel).toBeDefined();
      expect(typeof assessment.securityScore).toBe('number');
    });
  });

  describe('Agent Factory Functions', () => {
    it('should return all available agent IDs', () => {
      const agentIds = getAvailableAgentIds();
      
      expect(agentIds).toContain('planner');
      expect(agentIds).toContain('frontend-dev');
      expect(agentIds).toContain('debugger');
      expect(agentIds).toContain('security');
      expect(agentIds.length).toBe(4);
    });

    it('should create agents by ID', () => {
      const planner = createAgent('planner');
      expect(planner).toBeInstanceOf(PlannerAgent);

      const frontend = createAgent('frontend-dev');
      expect(frontend).toBeInstanceOf(FrontendDevAgent);

      const debuggerAgent = createAgent('debugger');
      expect(debuggerAgent).toBeInstanceOf(DebuggerAgent);

      const security = createAgent('security');
      expect(security).toBeInstanceOf(SecurityAgent);
    });

    it('should throw error for invalid agent ID', () => {
      expect(() => createAgent('invalid-agent' as any)).toThrow('Unknown agent ID');
    });

    it('should find best agent for frontend context', () => {
      const frontendContext = {
        ...mockContext,
        userInput: 'Create a React component with TypeScript'
      };

      const bestAgent = findBestAgent(frontendContext);
      expect(bestAgent).toBe('frontend-dev');
    });

    it('should find best agent for debugging context', () => {
      const debugContext = {
        ...mockContext,
        userInput: 'Fix the error in the login component'
      };

      const bestAgent = findBestAgent(debugContext);
      expect(bestAgent).toBe('debugger');
    });

    it('should find best agent for security context', () => {
      const securityContext = {
        ...mockContext,
        userInput: 'Implement secure authentication'
      };

      const bestAgent = findBestAgent(securityContext);
      expect(bestAgent).toBe('security');
    });

    it('should return planner as fallback for general context', () => {
      const generalContext = {
        ...mockContext,
        userInput: 'Help me with my project'
      };

      const bestAgent = findBestAgent(generalContext);
      expect(bestAgent).toBe('planner');
    });
  });

  describe('Agent Event Handling', () => {
    it('should emit events during execution', async () => {
      const agent = new PlannerAgent();
      const events: any[] = [];

      agent.addEventListener((event) => {
        events.push(event);
      });

      await agent.execute(mockContext);

      expect(events.length).toBeGreaterThan(0);
      expect(events.some(e => e.type === 'status_changed')).toBe(true);
    });

    it('should allow removing event listeners', () => {
      const agent = new PlannerAgent();
      const listener = vi.fn();

      agent.addEventListener(listener);
      agent.removeEventListener(listener);

      // This should not trigger the listener
      agent.plan(mockContext);

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle plan phase errors gracefully', async () => {
      const agent = new PlannerAgent();
      
      // Mock a planning error by overriding the doPlan method
      const originalDoPlan = (agent as any).doPlan;
      (agent as any).doPlan = vi.fn().mockRejectedValue(new Error('Planning failed'));

      const result = await agent.plan(mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Planning failed');
      expect(typeof result.executionTime).toBe('number');

      // Restore original method
      (agent as any).doPlan = originalDoPlan;
    });

    it('should handle execution phase errors gracefully', async () => {
      const agent = new FrontendDevAgent();
      
      // Mock an execution error
      const originalDoExecute = (agent as any).doExecute;
      (agent as any).doExecute = vi.fn().mockRejectedValue(new Error('Execution failed'));

      const result = await agent.execute(mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Execution failed');

      // Restore original method
      (agent as any).doExecute = originalDoExecute;
    });
  });
});