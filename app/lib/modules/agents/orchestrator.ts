import type {
  IAgent,
  AgentContext,
  AgentOutput,
  OrchestrationOptions,
  OrchestrationResult,
} from './types';
import { AgentRegistry } from './registry';
import { LoggingService } from './logging';

/**
 * Orchestrates the execution of multiple agents with support for
 * sequential/parallel execution, output chaining, and error handling
 */
export class AgentOrchestrator {
  private registry: AgentRegistry;
  private logger: LoggingService;

  constructor() {
    this.registry = AgentRegistry.getInstance();
    this.logger = LoggingService.getInstance();
  }

  /**
   * Execute a specific set of agents
   */
  async executeAgents(
    agentNames: string[],
    context: AgentContext,
    options: Partial<OrchestrationOptions> = {}
  ): Promise<OrchestrationResult> {
    const opts: OrchestrationOptions = {
      parallel: false,
      chainOutputs: true,
      stopOnError: true,
      timeout: 300, // 5 minutes default
      ...options,
    };

    const startTime = Date.now();
    const agents = agentNames
      .map(name => this.registry.getAgent(name))
      .filter((agent): agent is IAgent => agent !== undefined);

    if (agents.length === 0) {
      return this.createEmptyResult('No valid agents found');
    }

    this.logger.log('orchestration', 'info', `Starting orchestration of ${agents.length} agents`, {
      agentNames: agents.map(a => a.name),
      options: opts,
    });

    try {
      const results = opts.parallel
        ? await this.executeInParallel(agents, context, opts)
        : await this.executeSequentially(agents, context, opts);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      const orchestrationResult: OrchestrationResult = {
        results,
        summary: {
          totalAgents: agents.length,
          successfulAgents: results.filter(r => r.metadata.success).length,
          failedAgents: results.filter(r => !r.metadata.success).length,
          totalExecutionTime: executionTime,
        },
        errors: [],
      };

      this.logger.log('orchestration', 'info', 'Orchestration completed', {
        summary: orchestrationResult.summary,
      });

      return orchestrationResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.log('orchestration', 'error', `Orchestration failed: ${errorMessage}`, { error });
      
      return this.createEmptyResult(errorMessage);
    }
  }

  /**
   * Execute agents by tags
   */
  async executeAgentsByTags(
    tags: string[],
    context: AgentContext,
    options: Partial<OrchestrationOptions> = {}
  ): Promise<OrchestrationResult> {
    const agents = this.registry.getAgentsByTags(tags);
    return this.executeAgents(
      agents.map(a => a.name),
      context,
      options
    );
  }

  /**
   * Execute all enabled agents
   */
  async executeAllAgents(
    context: AgentContext,
    options: Partial<OrchestrationOptions> = {}
  ): Promise<OrchestrationResult> {
    const agents = this.registry.getEnabledAgents();
    return this.executeAgents(
      agents.map(a => a.name),
      context,
      options
    );
  }

  /**
   * Execute agents sequentially
   */
  private async executeSequentially(
    agents: IAgent[],
    context: AgentContext,
    options: OrchestrationOptions
  ): Promise<AgentOutput[]> {
    const results: AgentOutput[] = [];
    let currentContext = { ...context };

    for (const agent of agents) {
      try {
        const result = await this.executeAgent(agent, currentContext, options);
        results.push(result);

        // Chain outputs if enabled
        if (options.chainOutputs && result.metadata.success) {
          currentContext = {
            ...currentContext,
            previousOutputs: [...currentContext.previousOutputs, result],
          };
        }

        // Stop on error if configured
        if (!result.metadata.success && options.stopOnError) {
          this.logger.log('orchestration', 'error', `Stopping execution due to agent failure: ${agent.name}`);
          break;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.log('agent-execution', 'error', `Agent ${agent.name} execution failed`, { error });
        
        const failedResult: AgentOutput = {
          summary: `Agent execution failed: ${errorMessage}`,
          artifacts: [],
          nextSteps: [],
          metadata: {
            agentName: agent.name,
            executionTime: 0,
            success: false,
            errors: [errorMessage],
          },
        };
        
        results.push(failedResult);
        
        if (options.stopOnError) {
          break;
        }
      }
    }

    return results;
  }

  /**
   * Execute agents in parallel
   */
  private async executeInParallel(
    agents: IAgent[],
    context: AgentContext,
    options: OrchestrationOptions
  ): Promise<AgentOutput[]> {
    const maxConcurrency = options.maxConcurrency || agents.length;
    const results: AgentOutput[] = [];

    // Execute in batches if concurrency limit is set
    for (let i = 0; i < agents.length; i += maxConcurrency) {
      const batch = agents.slice(i, i + maxConcurrency);
      const batchPromises = batch.map(agent => this.executeAgent(agent, context, options));
      
      try {
        const batchResults = await Promise.allSettled(batchPromises);
        
        for (let j = 0; j < batchResults.length; j++) {
          const result = batchResults[j];
          const agent = batch[j];
          
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            const errorMessage = result.reason instanceof Error ? result.reason.message : 'Unknown error';
            this.logger.log('agent-execution', 'error', `Agent ${agent.name} execution failed`, { 
              error: result.reason 
            });
            
            results.push({
              summary: `Agent execution failed: ${errorMessage}`,
              artifacts: [],
              nextSteps: [],
              metadata: {
                agentName: agent.name,
                executionTime: 0,
                success: false,
                errors: [errorMessage],
              },
            });
          }
        }
      } catch (error) {
        this.logger.log('orchestration', 'error', 'Batch execution failed', { error });
        throw error;
      }
    }

    return results;
  }

  /**
   * Execute a single agent with timeout and logging
   */
  private async executeAgent(
    agent: IAgent,
    context: AgentContext,
    options: OrchestrationOptions
  ): Promise<AgentOutput> {
    const startTime = Date.now();
    
    this.registry.emitExecutionEvent('executionStarted', agent.name, { startTime });
    this.logger.log('agent-execution', 'info', `Starting agent: ${agent.name}`);

    try {
      // Execute with timeout
      const result = await this.withTimeout(
        this.executeAgentLifecycle(agent, context),
        options.timeout || 300
      );

      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // Update execution time in metadata
      result.metadata.executionTime = executionTime;

      this.registry.emitExecutionEvent('executionCompleted', agent.name, { 
        executionTime,
        success: result.metadata.success,
      });
      
      this.logger.log('agent-execution', 'info', `Completed agent: ${agent.name}`, {
        executionTime,
        success: result.metadata.success,
        artifactCount: result.artifacts.length,
      });

      return result;
    } catch (error) {
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.registry.emitExecutionEvent('executionFailed', agent.name, { 
        executionTime,
        error: errorMessage,
      });

      throw error;
    }
  }

  /**
   * Execute the full agent lifecycle: plan -> execute -> review
   */
  private async executeAgentLifecycle(agent: IAgent, context: AgentContext): Promise<AgentOutput> {
    // Plan phase
    const plan = await agent.plan(context);
    this.logger.log('agent-execution', 'debug', `Agent ${agent.name} plan created`, { plan });

    // Execute phase
    const output = await agent.execute(context, plan);
    this.logger.log('agent-execution', 'debug', `Agent ${agent.name} execution completed`, { 
      artifactCount: output.artifacts.length,
      success: output.metadata.success,
    });

    // Review phase
    const reviewedOutput = await agent.review(output, context);
    this.logger.log('agent-execution', 'debug', `Agent ${agent.name} review completed`, {
      finalSuccess: reviewedOutput.metadata.success,
    });

    return reviewedOutput;
  }

  /**
   * Execute a function with timeout
   */
  private async withTimeout<T>(promise: Promise<T>, timeoutSeconds: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Agent execution timed out after ${timeoutSeconds} seconds`));
      }, timeoutSeconds * 1000);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Create an empty result for error cases
   */
  private createEmptyResult(error: string): OrchestrationResult {
    return {
      results: [],
      summary: {
        totalAgents: 0,
        successfulAgents: 0,
        failedAgents: 0,
        totalExecutionTime: 0,
      },
      errors: [error],
    };
  }
}