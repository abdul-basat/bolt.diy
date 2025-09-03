/**
 * FrontendDevAgent - Responsible for frontend development tasks.
 * 
 * This agent handles UI/UX implementation, React component development,
 * styling, and frontend-specific optimizations.
 * 
 * @module FrontendDevAgent
 */

import { BaseAgent } from './BaseAgent';
import type { AgentContext, AgentResult, AgentConfig } from './types';
import { AgentEventType } from './types';

/**
 * Interface for frontend development task specifications.
 */
interface FrontendTask {
  type: 'component' | 'styling' | 'optimization' | 'testing';
  name: string;
  description: string;
  files: string[];
  dependencies: string[];
}

/**
 * Interface for frontend development results.
 */
interface FrontendResult {
  tasksCompleted: FrontendTask[];
  filesModified: string[];
  componentsCreated: string[];
  testsCovered: number;
  performanceImpact: 'positive' | 'neutral' | 'negative';
}

/**
 * FrontendDevAgent specializes in frontend development tasks.
 * 
 * This agent handles React component creation, styling implementation,
 * UI optimization, and frontend-specific debugging.
 */
export class FrontendDevAgent extends BaseAgent {
  readonly id = 'frontend-dev';
  readonly name = 'Frontend Development Agent';
  readonly description = 'Handles UI/UX implementation, React components, and frontend optimization';
  readonly version = '1.0.0';

  constructor(config?: AgentConfig) {
    super(config);
    this.initializeLogger();
  }

  /**
   * Plan frontend development tasks based on requirements.
   */
  protected async doPlan(context: AgentContext): Promise<AgentResult> {
    this.log('info', 'Planning frontend development tasks');

    const analysis = this.analyzeFrontendRequirements(context.userInput);
    const tasks = this.identifyFrontendTasks(context);

    const planData = {
      analysis,
      tasks,
      estimatedComplexity: this.estimateComplexity(tasks),
      recommendedApproach: this.recommendApproach(context.userInput)
    };

    return this.createSuccessResult(
      `Identified ${tasks.length} frontend development tasks`,
      planData
    );
  }

  /**
   * Execute frontend development tasks.
   */
  protected async doExecute(context: AgentContext): Promise<AgentResult> {
    this.log('info', 'Executing frontend development tasks');

    // Simulate frontend development work
    const result = await this.performFrontendDevelopment(context);

    this.emitEvent(AgentEventType.PROGRESS_UPDATE, {
      message: 'Frontend development completed',
      progress: 100,
      result
    });

    return this.createSuccessResult(
      `Frontend development completed: ${result.componentsCreated.length} components created`,
      result,
      result.filesModified
    );
  }

  /**
   * Review frontend development results.
   */
  protected async doReview(context: AgentContext, executionResult: AgentResult): Promise<AgentResult> {
    this.log('info', 'Reviewing frontend development results');

    if (!executionResult.success || !executionResult.data) {
      return this.createErrorResult(
        'Cannot review: execution failed or no result data available',
        'Invalid execution result'
      );
    }

    const result = executionResult.data as FrontendResult;
    const review = this.reviewFrontendWork(result);

    return this.createSuccessResult(
      `Frontend review completed: ${review.quality} quality`,
      review
    );
  }

  /**
   * Check if this agent can handle the given context.
   */
  canHandle(context: AgentContext): boolean {
    const input = context.userInput.toLowerCase();
    
    // Frontend-related keywords
    const frontendKeywords = [
      'react', 'component', 'ui', 'frontend', 'interface', 'styling',
      'css', 'html', 'responsive', 'mobile', 'design', 'layout'
    ];

    return frontendKeywords.some(keyword => input.includes(keyword));
  }

  /**
   * Analyze frontend requirements from user input.
   */
  private analyzeFrontendRequirements(userInput: string): {
    hasUIComponents: boolean;
    needsResponsive: boolean;
    requiresInteractivity: boolean;
    stylingNeeds: string[];
    frameworkPreferences: string[];
  } {
    const input = userInput.toLowerCase();

    return {
      hasUIComponents: input.includes('component') || input.includes('ui'),
      needsResponsive: input.includes('responsive') || input.includes('mobile'),
      requiresInteractivity: input.includes('interactive') || input.includes('click') || input.includes('form'),
      stylingNeeds: this.extractStylingNeeds(input),
      frameworkPreferences: this.extractFrameworkPreferences(input)
    };
  }

  /**
   * Extract styling requirements from user input.
   */
  private extractStylingNeeds(input: string): string[] {
    const needs: string[] = [];

    if (input.includes('dark mode') || input.includes('theme')) {
      needs.push('theming');
    }
    if (input.includes('animation') || input.includes('transition')) {
      needs.push('animations');
    }
    if (input.includes('responsive')) {
      needs.push('responsive-design');
    }
    if (input.includes('css') || input.includes('style')) {
      needs.push('custom-styling');
    }

    return needs;
  }

  /**
   * Extract framework preferences from user input.
   */
  private extractFrameworkPreferences(input: string): string[] {
    const frameworks: string[] = [];

    if (input.includes('react')) {
      frameworks.push('react');
    }
    if (input.includes('tailwind')) {
      frameworks.push('tailwindcss');
    }
    if (input.includes('styled-components')) {
      frameworks.push('styled-components');
    }

    return frameworks;
  }

  /**
   * Identify specific frontend tasks based on context.
   */
  private identifyFrontendTasks(context: AgentContext): FrontendTask[] {
    const tasks: FrontendTask[] = [];
    const input = context.userInput.toLowerCase();

    // Component creation tasks
    if (input.includes('component') || input.includes('ui')) {
      tasks.push({
        type: 'component',
        name: 'Create React Components',
        description: 'Implement required React components with proper props and state management',
        files: ['src/components/*.tsx'],
        dependencies: []
      });
    }

    // Styling tasks
    if (input.includes('style') || input.includes('css') || input.includes('design')) {
      tasks.push({
        type: 'styling',
        name: 'Implement Styling',
        description: 'Apply CSS styles and ensure responsive design',
        files: ['src/styles/*.css', 'src/components/*.tsx'],
        dependencies: tasks.filter(t => t.type === 'component').map(t => t.name)
      });
    }

    // Optimization tasks
    if (input.includes('optimize') || input.includes('performance')) {
      tasks.push({
        type: 'optimization',
        name: 'Frontend Optimization',
        description: 'Optimize bundle size, lazy loading, and performance',
        files: ['src/**/*.tsx', 'vite.config.ts'],
        dependencies: []
      });
    }

    // Testing tasks
    if (input.includes('test') || tasks.length > 1) {
      tasks.push({
        type: 'testing',
        name: 'Frontend Testing',
        description: 'Create unit tests for components and functionality',
        files: ['src/**/*.test.tsx', 'src/**/*.spec.tsx'],
        dependencies: tasks.map(t => t.name)
      });
    }

    return tasks;
  }

  /**
   * Estimate complexity of frontend tasks.
   */
  private estimateComplexity(tasks: FrontendTask[]): 'low' | 'medium' | 'high' {
    if (tasks.length <= 1) return 'low';
    if (tasks.length <= 3) return 'medium';
    return 'high';
  }

  /**
   * Recommend development approach based on requirements.
   */
  private recommendApproach(userInput: string): string {
    const input = userInput.toLowerCase();

    if (input.includes('quick') || input.includes('simple')) {
      return 'rapid-prototyping';
    }
    if (input.includes('enterprise') || input.includes('scalable')) {
      return 'enterprise-architecture';
    }
    if (input.includes('modern') || input.includes('latest')) {
      return 'modern-stack';
    }

    return 'balanced-approach';
  }

  /**
   * Simulate frontend development work.
   */
  private async performFrontendDevelopment(context: AgentContext): Promise<FrontendResult> {
    // Simulate development time
    await new Promise(resolve => setTimeout(resolve, 200));

    const tasks = this.identifyFrontendTasks(context);
    const filesModified: string[] = [];
    const componentsCreated: string[] = [];

    // Process each task
    for (const task of tasks) {
      this.log('debug', `Processing frontend task: ${task.name}`);
      
      filesModified.push(...task.files);
      
      if (task.type === 'component') {
        // Simulate component creation
        componentsCreated.push('UserInterface', 'NavigationMenu', 'ContentPanel');
      }

      // Emit progress for each task
      this.emitEvent(AgentEventType.PROGRESS_UPDATE, {
        message: `Completed: ${task.name}`,
        progress: (tasks.indexOf(task) + 1) / tasks.length * 100
      });
    }

    return {
      tasksCompleted: tasks,
      filesModified: Array.from(new Set(filesModified)), // Remove duplicates
      componentsCreated,
      testsCovered: tasks.filter(t => t.type === 'testing').length > 0 ? 85 : 0,
      performanceImpact: 'positive'
    };
  }

  /**
   * Review frontend development work.
   */
  private reviewFrontendWork(result: FrontendResult): {
    quality: 'excellent' | 'good' | 'fair' | 'poor';
    codeQuality: number;
    testCoverage: number;
    performanceScore: number;
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    
    // Assess code quality based on tasks completed
    const codeQuality = Math.min(
      90,
      result.tasksCompleted.length * 20 + result.componentsCreated.length * 10
    );

    // Check test coverage
    if (result.testsCovered < 70) {
      recommendations.push('Increase test coverage to at least 70%');
    }

    // Performance assessment
    const performanceScore = result.performanceImpact === 'positive' ? 85 : 
                           result.performanceImpact === 'neutral' ? 70 : 50;

    if (performanceScore < 80) {
      recommendations.push('Consider performance optimizations');
    }

    // Determine overall quality
    const averageScore = (codeQuality + result.testsCovered + performanceScore) / 3;
    const quality = averageScore >= 85 ? 'excellent' :
                   averageScore >= 75 ? 'good' :
                   averageScore >= 60 ? 'fair' : 'poor';

    return {
      quality,
      codeQuality,
      testCoverage: result.testsCovered,
      performanceScore,
      recommendations
    };
  }
}