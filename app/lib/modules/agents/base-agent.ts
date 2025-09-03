import type { 
  IAgent, 
  AgentContext, 
  AgentExecutionPlan, 
  AgentOutput,
  AgentArtifact 
} from './types';

/**
 * Abstract base class that provides common functionality for all agents
 */
export abstract class BaseAgent implements IAgent {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly version: string;
  abstract readonly tags: string[];

  /**
   * Default implementation of plan phase
   * Can be overridden by specific agents for custom planning logic
   */
  async plan(context: AgentContext): Promise<AgentExecutionPlan> {
    return {
      steps: ['Analyze context', 'Execute main logic', 'Generate output'],
      estimatedTime: 30,
      dependencies: [],
      expectedOutputs: ['Primary artifact'],
    };
  }

  /**
   * Abstract method that must be implemented by each agent
   */
  abstract execute(context: AgentContext, plan: AgentExecutionPlan): Promise<AgentOutput>;

  /**
   * Default implementation of review phase
   * Can be overridden by specific agents for custom review logic
   */
  async review(output: AgentOutput, context: AgentContext): Promise<AgentOutput> {
    // Basic validation - can be extended by specific agents
    const errors: string[] = [];
    
    if (!output.summary || output.summary.trim().length === 0) {
      errors.push('Output summary is empty');
    }
    
    if (output.artifacts.length === 0) {
      errors.push('No artifacts generated');
    }

    // Validate artifacts
    for (const artifact of output.artifacts) {
      if (!artifact.path || !artifact.content) {
        errors.push(`Invalid artifact: ${artifact.path || 'unknown'}`);
      }
    }

    if (errors.length > 0) {
      return {
        ...output,
        metadata: {
          ...output.metadata,
          success: false,
          errors: [...(output.metadata.errors || []), ...errors],
        },
      };
    }

    return output;
  }

  /**
   * Helper method to create standardized agent output
   */
  protected createOutput(
    summary: string,
    artifacts: AgentArtifact[],
    nextSteps: string[] = [],
    success: boolean = true,
    errors: string[] = []
  ): AgentOutput {
    return {
      summary,
      artifacts,
      nextSteps,
      metadata: {
        agentName: this.name,
        executionTime: 0, // Will be set by orchestrator
        success,
        errors: errors.length > 0 ? errors : undefined,
      },
    };
  }

  /**
   * Helper method to create artifacts
   */
  protected createArtifact(
    type: string,
    path: string,
    content: string,
    description?: string
  ): AgentArtifact {
    return {
      type,
      path,
      content,
      description,
    };
  }

  /**
   * Helper method to analyze project files for common patterns
   */
  protected analyzeProjectStructure(projectFiles: Record<string, string>) {
    const structure = {
      hasPackageJson: 'package.json' in projectFiles,
      hasTypeScript: Object.keys(projectFiles).some(path => path.endsWith('.ts') || path.endsWith('.tsx')),
      hasReact: Object.keys(projectFiles).some(path => path.endsWith('.jsx') || path.endsWith('.tsx')),
      hasTests: Object.keys(projectFiles).some(path => path.includes('test') || path.includes('spec')),
      hasCss: Object.keys(projectFiles).some(path => path.endsWith('.css') || path.endsWith('.scss') || path.endsWith('.sass')),
      frameworkType: this.detectFramework(projectFiles),
    };

    return structure;
  }

  /**
   * Helper method to detect the framework being used
   */
  private detectFramework(projectFiles: Record<string, string>): string {
    const packageJson = projectFiles['package.json'];
    if (packageJson) {
      try {
        const pkg = JSON.parse(packageJson);
        const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
        
        if (dependencies['@remix-run/react']) return 'remix';
        if (dependencies['next']) return 'nextjs';
        if (dependencies['react']) return 'react';
        if (dependencies['vue']) return 'vue';
        if (dependencies['angular']) return 'angular';
        if (dependencies['svelte']) return 'svelte';
      } catch {
        // Invalid package.json, continue with file-based detection
      }
    }

    // Fallback to file-based detection
    if (Object.keys(projectFiles).some(path => path.includes('remix'))) return 'remix';
    if (Object.keys(projectFiles).some(path => path.includes('next'))) return 'nextjs';
    
    return 'unknown';
  }
}