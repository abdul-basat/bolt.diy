/**
 * PlannerAgent - Responsible for analyzing user requirements and creating execution plans.
 * 
 * This agent takes user input and creates structured plans that other agents can follow.
 * It identifies required tasks, dependencies, and coordinates the overall workflow.
 * 
 * @module PlannerAgent
 */

import { BaseAgent } from './BaseAgent';
import type { AgentContext, AgentResult, AgentConfig } from './types';
import { AgentEventType } from './types';

/**
 * Interface for a planned task within an execution plan.
 */
interface PlannedTask {
  id: string;
  name: string;
  description: string;
  agentType: string;
  dependencies: string[];
  priority: number;
  estimatedTime: number;
}

/**
 * Interface for the structured plan created by PlannerAgent.
 */
interface ExecutionPlan {
  id: string;
  name: string;
  description: string;
  tasks: PlannedTask[];
  totalEstimatedTime: number;
  createdAt: number;
}

/**
 * PlannerAgent analyzes user requirements and creates structured execution plans.
 * 
 * This agent is typically the first to run in a workflow, analyzing the user's
 * request and breaking it down into discrete tasks that can be handled by
 * specialized agents.
 */
export class PlannerAgent extends BaseAgent {
  readonly id = 'planner';
  readonly name = 'Planner Agent';
  readonly description = 'Analyzes requirements and creates structured execution plans';
  readonly version = '1.0.0';

  constructor(config?: AgentConfig) {
    super(config);
    this.initializeLogger();
  }

  /**
   * Analyze the user's request and create a high-level execution plan.
   */
  protected async doPlan(context: AgentContext): Promise<AgentResult> {
    this.log('info', 'Analyzing user requirements for planning');

    // Simulate planning analysis
    await new Promise(resolve => setTimeout(resolve, 100));

    const planningData = {
      analysisComplete: true,
      requirementsUnderstood: true,
      complexityLevel: this.assessComplexity(context.userInput),
      suggestedApproach: this.suggestApproach(context.userInput)
    };

    return this.createSuccessResult(
      'Requirements analysis completed, ready to create execution plan',
      planningData
    );
  }

  /**
   * Create a detailed execution plan based on the user's requirements.
   */
  protected async doExecute(context: AgentContext): Promise<AgentResult> {
    this.log('info', 'Creating execution plan');

    const plan = await this.createExecutionPlan(context);

    // Emit progress updates
    this.emitEvent(AgentEventType.PROGRESS_UPDATE, {
      message: 'Execution plan created',
      progress: 100,
      plan: plan
    });

    return this.createSuccessResult(
      `Created execution plan with ${plan.tasks.length} tasks`,
      plan,
      [`plan-${plan.id}.json`]
    );
  }

  /**
   * Review the created execution plan for completeness and feasibility.
   */
  protected async doReview(context: AgentContext, executionResult: AgentResult): Promise<AgentResult> {
    this.log('info', 'Reviewing execution plan');

    if (!executionResult.success || !executionResult.data) {
      return this.createErrorResult(
        'Cannot review: execution failed or no plan data available',
        'Invalid execution result'
      );
    }

    const plan = executionResult.data as ExecutionPlan;
    const reviewResult = this.reviewExecutionPlan(plan, context);

    return this.createSuccessResult(
      `Plan review completed: ${reviewResult.isValid ? 'Valid' : 'Issues found'}`,
      reviewResult
    );
  }

  /**
   * Check if this agent can handle the given context.
   * PlannerAgent can handle any context as it's responsible for initial planning.
   */
  canHandle(context: AgentContext): boolean {
    return true; // PlannerAgent can handle any planning request
  }

  /**
   * Assess the complexity of the user's request.
   */
  private assessComplexity(userInput: string): 'low' | 'medium' | 'high' {
    const input = userInput.toLowerCase();
    
    // Simple heuristics for complexity assessment
    if (input.includes('complex') || input.includes('advanced') || input.includes('enterprise')) {
      return 'high';
    }
    
    if (input.includes('multiple') || input.includes('integration') || input.includes('database')) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Suggest an approach based on the user's input.
   */
  private suggestApproach(userInput: string): string {
    const input = userInput.toLowerCase();
    
    if (input.includes('react') || input.includes('frontend') || input.includes('ui')) {
      return 'frontend-focused';
    }
    
    if (input.includes('api') || input.includes('backend') || input.includes('server')) {
      return 'backend-focused';
    }
    
    if (input.includes('fix') || input.includes('debug') || input.includes('error')) {
      return 'debugging';
    }
    
    if (input.includes('secure') || input.includes('auth') || input.includes('permission')) {
      return 'security-focused';
    }
    
    return 'full-stack';
  }

  /**
   * Create a detailed execution plan from the user's requirements.
   */
  private async createExecutionPlan(context: AgentContext): Promise<ExecutionPlan> {
    const planId = `plan-${Date.now()}`;
    const userInput = context.userInput.toLowerCase();
    
    // Analyze the request and create appropriate tasks
    const tasks: PlannedTask[] = [];
    let taskId = 1;

    // Always start with analysis if it's a complex request
    if (this.assessComplexity(context.userInput) !== 'low') {
      tasks.push({
        id: `task-${taskId++}`,
        name: 'Requirement Analysis',
        description: 'Detailed analysis of requirements and constraints',
        agentType: 'planner',
        dependencies: [],
        priority: 1,
        estimatedTime: 300 // 5 minutes
      });
    }

    // Add frontend tasks if needed
    if (userInput.includes('frontend') || userInput.includes('ui') || userInput.includes('react')) {
      tasks.push({
        id: `task-${taskId++}`,
        name: 'Frontend Development',
        description: 'Implement user interface components and interactions',
        agentType: 'frontend',
        dependencies: tasks.length > 0 ? [tasks[0].id] : [],
        priority: 2,
        estimatedTime: 1200 // 20 minutes
      });
    }

    // Add debugging tasks if needed
    if (userInput.includes('debug') || userInput.includes('fix') || userInput.includes('error')) {
      tasks.push({
        id: `task-${taskId++}`,
        name: 'Debug and Fix Issues',
        description: 'Identify and resolve bugs or errors in the codebase',
        agentType: 'debugger',
        dependencies: [],
        priority: 1,
        estimatedTime: 900 // 15 minutes
      });
    }

    // Add security tasks if needed
    if (userInput.includes('secure') || userInput.includes('auth') || userInput.includes('permission')) {
      tasks.push({
        id: `task-${taskId++}`,
        name: 'Security Implementation',
        description: 'Implement security measures and authentication',
        agentType: 'security',
        dependencies: tasks.filter(t => t.agentType === 'frontend').map(t => t.id),
        priority: 2,
        estimatedTime: 800 // 13 minutes
      });
    }

    // If no specific tasks were identified, create a general development task
    if (tasks.length === 0) {
      tasks.push({
        id: `task-${taskId++}`,
        name: 'General Development',
        description: 'Implement the requested functionality',
        agentType: 'frontend',
        dependencies: [],
        priority: 1,
        estimatedTime: 600 // 10 minutes
      });
    }

    const totalEstimatedTime = tasks.reduce((sum, task) => sum + task.estimatedTime, 0);

    return {
      id: planId,
      name: `Execution Plan for: ${context.userInput.substring(0, 50)}...`,
      description: `Planned approach: ${this.suggestApproach(context.userInput)}`,
      tasks,
      totalEstimatedTime,
      createdAt: Date.now()
    };
  }

  /**
   * Review an execution plan for completeness and feasibility.
   */
  private reviewExecutionPlan(plan: ExecutionPlan, context: AgentContext): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check for empty plan
    if (plan.tasks.length === 0) {
      issues.push('Execution plan contains no tasks');
    }

    // Check for circular dependencies
    const hasCycles = this.checkForCircularDependencies(plan.tasks);
    if (hasCycles) {
      issues.push('Circular dependencies detected in task plan');
    }

    // Check for unrealistic time estimates
    if (plan.totalEstimatedTime > 3600000) { // 1 hour
      suggestions.push('Consider breaking down the plan into smaller phases');
    }

    // Check for missing critical agents
    const agentTypes = new Set(plan.tasks.map(task => task.agentType));
    if (context.userInput.toLowerCase().includes('security') && !agentTypes.has('security')) {
      suggestions.push('Consider adding security review tasks');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }

  /**
   * Check for circular dependencies in the task plan.
   */
  private checkForCircularDependencies(tasks: PlannedTask[]): boolean {
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (taskId: string): boolean => {
      if (visiting.has(taskId)) {
        return true; // Circular dependency found
      }
      if (visited.has(taskId)) {
        return false;
      }

      visiting.add(taskId);
      
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        for (const depId of task.dependencies) {
          if (visit(depId)) {
            return true;
          }
        }
      }

      visiting.delete(taskId);
      visited.add(taskId);
      return false;
    };

    return tasks.some(task => visit(task.id));
  }
}