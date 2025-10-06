import { BaseAgent, AgentInput, AgentOutput } from '../base/AgentInterface';
import { PRDAgent } from '../prd/PRDAgent';
import { FlowDiagramAgent } from '../diagram/FlowDiagramAgent';

export interface OrchestrationInput {
  projectName: string;
  projectPath?: string;
  steps: OrchestrationStep[];
  options?: {
    stopOnError?: boolean;
    chainOutputs?: boolean;
  };
}

export interface OrchestrationStep {
  agent: 'prd' | 'diagram';
  options?: Record<string, any>;
  dependsOn?: string[]; // Names of previous steps that must complete successfully
}

export interface OrchestrationOutput {
  success: boolean;
  message: string;
  results: Record<string, AgentOutput>;
  errors?: string[];
  executionOrder: string[];
}

export class AgentOrchestrator {
  private agents: Map<string, BaseAgent>;

  constructor() {
    this.agents = new Map();
    this.agents.set('prd', new PRDAgent());
    this.agents.set('diagram', new FlowDiagramAgent());
  }

  async execute(input: OrchestrationInput): Promise<OrchestrationOutput> {
    const { projectName, projectPath, steps, options = {} } = input;
    const { stopOnError = true, chainOutputs = true } = options;

    const results: Record<string, AgentOutput> = {};
    const errors: string[] = [];
    const executionOrder: string[] = [];

    try {
      // Validate steps
      const validationErrors = this.validateSteps(steps);
      if (validationErrors.length > 0) {
        return {
          success: false,
          message: 'Orchestration validation failed',
          results,
          errors: validationErrors,
          executionOrder,
        };
      }

      // Sort steps by dependencies
      const sortedSteps = this.topologicalSort(steps);

      for (const step of sortedSteps) {
        const stepName = `${step.agent}-${Date.now()}`;
        executionOrder.push(stepName);

        try {
          // Check dependencies
          if (step.dependsOn) {
            const dependencyErrors = this.checkDependencies(step.dependsOn, results);
            if (dependencyErrors.length > 0) {
              errors.push(...dependencyErrors);
              if (stopOnError) {
                break;
              }
              continue;
            }
          }

          // Prepare input for the agent
          const agentInput = this.prepareAgentInput(
            projectName,
            projectPath,
            step,
            results,
            chainOutputs
          );

          // Execute the agent
          const agent = this.agents.get(step.agent);
          if (!agent) {
            throw new Error(`Unknown agent: ${step.agent}`);
          }

          const result = await agent.execute(agentInput);
          results[stepName] = result;

          if (!result.success && stopOnError) {
            errors.push(`Agent ${step.agent} failed: ${result.message}`);
            break;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Error executing ${step.agent}: ${errorMessage}`);
          
          if (stopOnError) {
            break;
          }
        }
      }

      const overallSuccess = errors.length === 0 && Object.values(results).every(r => r.success);

      return {
        success: overallSuccess,
        message: overallSuccess
          ? `Successfully executed ${executionOrder.length} agents`
          : `Orchestration completed with ${errors.length} errors`,
        results,
        errors: errors.length > 0 ? errors : undefined,
        executionOrder,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Orchestration failed',
        results,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        executionOrder,
      };
    }
  }

  private validateSteps(steps: OrchestrationStep[]): string[] {
    const errors: string[] = [];

    if (steps.length === 0) {
      errors.push('No steps provided for orchestration');
      return errors;
    }

    const stepNames = new Set<string>();
    const supportedAgents = Array.from(this.agents.keys());

    steps.forEach((step, index) => {
      if (!supportedAgents.includes(step.agent)) {
        errors.push(`Step ${index}: Unsupported agent '${step.agent}'`);
      }

      if (step.dependsOn) {
        step.dependsOn.forEach(dep => {
          if (!stepNames.has(dep)) {
            errors.push(`Step ${index}: Dependency '${dep}' not found`);
          }
        });
      }

      stepNames.add(`${step.agent}-${index}`);
    });

    return errors;
  }

  private topologicalSort(steps: OrchestrationStep[]): OrchestrationStep[] {
    // Simple topological sort for dependency resolution
    const sorted: OrchestrationStep[] = [];
    const visited = new Set<number>();
    const visiting = new Set<number>();

    const visit = (stepIndex: number) => {
      if (visiting.has(stepIndex)) {
        throw new Error('Circular dependency detected');
      }
      if (visited.has(stepIndex)) {
        return;
      }

      visiting.add(stepIndex);

      const step = steps[stepIndex];
      if (step.dependsOn) {
        step.dependsOn.forEach(depName => {
          const depIndex = steps.findIndex((s, i) => `${s.agent}-${i}` === depName);
          if (depIndex !== -1) {
            visit(depIndex);
          }
        });
      }

      visiting.delete(stepIndex);
      visited.add(stepIndex);
      sorted.push(step);
    };

    steps.forEach((_, index) => {
      if (!visited.has(index)) {
        visit(index);
      }
    });

    return sorted;
  }

  private checkDependencies(dependencies: string[], results: Record<string, AgentOutput>): string[] {
    const errors: string[] = [];

    dependencies.forEach(dep => {
      if (!results[dep]) {
        errors.push(`Dependency '${dep}' has not been executed`);
      } else if (!results[dep].success) {
        errors.push(`Dependency '${dep}' failed: ${results[dep].message}`);
      }
    });

    return errors;
  }

  private prepareAgentInput(
    projectName: string,
    projectPath: string | undefined,
    step: OrchestrationStep,
    results: Record<string, AgentOutput>,
    chainOutputs: boolean
  ): AgentInput {
    const input: AgentInput = {
      projectName,
      projectPath,
      options: { ...step.options },
    };

    // Chain outputs if enabled
    if (chainOutputs && step.agent === 'diagram') {
      // If generating a diagram and there's a PRD result, use it
      const prdResult = Object.values(results).find(r => r.metadata?.agent === 'PRDAgent');
      if (prdResult && prdResult.outputPath) {
        input.options = {
          ...input.options,
          prdPath: prdResult.outputPath,
        };
      }
    }

    return input;
  }

  // Convenience methods for common orchestration patterns
  async generatePRDAndDiagram(
    projectName: string,
    projectPath?: string,
    options?: {
      prdOptions?: Record<string, any>;
      diagramOptions?: Record<string, any>;
    }
  ): Promise<OrchestrationOutput> {
    const steps: OrchestrationStep[] = [
      {
        agent: 'prd',
        options: options?.prdOptions,
      },
      {
        agent: 'diagram',
        options: options?.diagramOptions,
        // No dependency needed for simplified orchestration
      },
    ];

    return this.execute({
      projectName,
      projectPath,
      steps,
      options: {
        stopOnError: false,
        chainOutputs: true,
      },
    });
  }

  getAvailableAgents(): string[] {
    return Array.from(this.agents.keys());
  }

  getAgentInfo(agentName: string): any {
    const agent = this.agents.get(agentName);
    return agent ? agent.getConfig() : null;
  }
}