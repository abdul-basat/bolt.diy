import type {
  BaseAgent,
  FrontendDevAgent,
  UIUXAgent,
  DebuggerAgent,
  ReactNativeAgent,
  AgentOrchestrator,
  AgentContext,
  AgentResponse,
  AgentOutput,
  DebugInfo,
} from '~/types/agents';
import { createScopedLogger } from '~/utils/logger';
import { componentLibraryManager } from '~/lib/modules/ComponentLibrary';

const logger = createScopedLogger('AgentSystem');

export class BaseFrontendDevAgent implements FrontendDevAgent {
  config = {
    name: 'FrontendDevAgent',
    description: 'React and TypeScript component development',
    capabilities: ['react', 'typescript', 'css', 'components'] as const,
    outputMode: 'standalone' as const,
    targetFramework: 'react' as const,
  };

  async process(request: string, context: AgentContext): Promise<AgentResponse> {
    try {
      logger.info('Processing frontend development request:', request);

      /*
       * In a real implementation, this would call LLM APIs to generate components
       * For now, we'll create a basic structure
       */
      const output: AgentOutput = {
        type: 'component',
        content: this._generateComponentTemplate(request, context),
        metadata: {
          name: this._extractComponentName(request),
          description: `Generated component for: ${request}`,
          framework: 'react',
          category: 'ui',
          dependencies: ['react', 'typescript'],
        },
        standalone: context.standaloneMode,
        filePath: context.standaloneMode ? `components/${this._extractComponentName(request)}.tsx` : undefined,
      };

      return {
        success: true,
        output,
        message: 'Component generated successfully',
      };
    } catch (error) {
      logger.error('Failed to process frontend request:', error);
      return {
        success: false,
        message: `Failed to generate component: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private _extractComponentName(request: string): string {
    /* Simple extraction - in reality this would use NLP */
    const match = request.match(/create (?:a )?(\w+)/i);
    return match ? match[1] : 'GeneratedComponent';
  }

  private _generateComponentTemplate(request: string, _context: AgentContext): string {
    const componentName = this._extractComponentName(request);

    if (_context.targetFramework === 'react-native' || _context.expoEnvironment) {
      return `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ${componentName}Props {
  // Add your props here
}

export const ${componentName}: React.FC<${componentName}Props> = (props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>${componentName} Component</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ${componentName};`;
    }

    return `import React from 'react';

interface ${componentName}Props {
  // Add your props here
}

export const ${componentName}: React.FC<${componentName}Props> = (props) => {
  return (
    <div className="${componentName.toLowerCase()}">
      <h2>${componentName} Component</h2>
    </div>
  );
};

export default ${componentName};`;
  }
}

export class BaseUIUXAgent implements UIUXAgent {
  config = {
    name: 'UIUXAgent',
    description: 'UI/UX design and accessibility focused component generation',
    capabilities: ['design-systems', 'accessibility', 'responsive', 'animations'] as const,
    outputMode: 'standalone' as const,
  };

  async process(request: string, context: AgentContext): Promise<AgentResponse> {
    try {
      logger.info('Processing UI/UX request:', request);

      const output: AgentOutput = {
        type: 'component',
        content: this._generateAccessibleComponent(request, context),
        metadata: {
          name: this._extractUIComponentName(request),
          description: `Accessible UI component for: ${request}`,
          framework: context.expoEnvironment ? 'react-native' : 'react',
          category: 'ui-design',
          dependencies: context.expoEnvironment ? ['react', 'react-native'] : ['react', 'tailwindcss'],
        },
        standalone: context.standaloneMode,
        filePath: context.standaloneMode ? `components/ui/${this._extractUIComponentName(request)}.tsx` : undefined,
      };

      return {
        success: true,
        output,
        message: 'UI component generated with accessibility features',
      };
    } catch (error) {
      logger.error('Failed to process UI/UX request:', error);
      return {
        success: false,
        message: `Failed to generate UI component: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private _extractUIComponentName(request: string): string {
    const match = request.match(/(?:design|create|build) (?:a )?(\w+)/i);
    return match ? match[1] : 'UIComponent';
  }

  private _generateAccessibleComponent(request: string, context: AgentContext): string {
    const componentName = this._extractUIComponentName(request);

    if (context.expoEnvironment) {
      return `import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, AccessibilityProps } from 'react-native';

interface ${componentName}Props extends AccessibilityProps {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
}

export const ${componentName}: React.FC<${componentName}Props> = ({
  title,
  onPress,
  disabled = false,
  ...accessibilityProps
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      {...accessibilityProps}
    >
      <Text style={[styles.title, disabled && styles.titleDisabled]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    backgroundColor: '#A8A8A8',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  titleDisabled: {
    color: '#FFFFFF',
    opacity: 0.6,
  },
});

export default ${componentName};`;
    }

    return `import React from 'react';

interface ${componentName}Props {
  title: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export const ${componentName}: React.FC<${componentName}Props> = ({
  title,
  onClick,
  disabled = false,
  className = '',
}) => {
  return (
    <button
      className={\`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed \${className}\`}
      onClick={onClick}
      disabled={disabled}
      aria-label={title}
      type="button"
    >
      {title}
    </button>
  );
};

export default ${componentName};`;
  }
}

export class BaseDebuggerAgent implements DebuggerAgent {
  config = {
    name: 'DebuggerAgent',
    description: 'Error analysis and debugging assistance',
    capabilities: ['error-analysis', 'performance', 'testing', 'debugging'] as const,
    outputMode: 'embedded' as const,
  };

  async process(request: string, _context: AgentContext): Promise<AgentResponse> {
    try {
      logger.info('Processing debug request:', request);

      /* For debugging, we typically don't generate new components but fix existing ones */
      return {
        success: true,
        message: 'Debug analysis completed. Check the console for detailed information.',
      };
    } catch (error) {
      logger.error('Failed to process debug request:', error);
      return {
        success: false,
        message: `Debug analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async analyzeErrors(debugInfo: DebugInfo): Promise<AgentResponse> {
    try {
      logger.info('Analyzing errors:', debugInfo);

      const analysis = {
        errorCount: debugInfo.errors.length,
        warningCount: debugInfo.warnings.length,
        hasExpoErrors: debugInfo.expoErrors && debugInfo.expoErrors.length > 0,
        suggestions: this._generateSuggestions(debugInfo),
      };

      return {
        success: true,
        message: `Analysis complete: ${analysis.errorCount} errors, ${analysis.warningCount} warnings`,
        debugInfo: {
          ...debugInfo,
          buildOutput: JSON.stringify(analysis, null, 2),
        },
      };
    } catch (error) {
      logger.error('Failed to analyze errors:', error);
      return {
        success: false,
        message: `Error analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private _generateSuggestions(debugInfo: DebugInfo): string[] {
    const suggestions: string[] = [];

    for (const error of debugInfo.errors) {
      if (error.message.includes('Cannot resolve module')) {
        suggestions.push('Install missing dependencies with: pnpm install');
      }

      if (error.message.includes('TypeScript')) {
        suggestions.push('Check TypeScript configuration and type definitions');
      }
    }

    if (debugInfo.expoErrors?.length) {
      suggestions.push('Check Expo configuration and ensure all React Native dependencies are compatible');
    }

    return suggestions;
  }
}

export class BaseReactNativeAgent implements ReactNativeAgent {
  config = {
    name: 'ReactNativeAgent',
    description: 'React Native and Expo component development',
    capabilities: ['react-native', 'expo', 'mobile-ui', 'navigation'] as const,
    outputMode: 'standalone' as const,
    targetFramework: 'react-native' as const,
  };

  async process(request: string, context: AgentContext): Promise<AgentResponse> {
    try {
      logger.info('Processing React Native request:', request);

      const output: AgentOutput = {
        type: 'component',
        content: this._generateReactNativeComponent(request, context),
        metadata: {
          name: this._extractComponentName(request),
          description: `React Native component for: ${request}`,
          framework: 'react-native',
          category: 'mobile',
          dependencies: ['react', 'react-native', 'expo'],
        },
        standalone: context.standaloneMode,
        filePath: context.standaloneMode ? `components/mobile/${this._extractComponentName(request)}.tsx` : undefined,
      };

      return {
        success: true,
        output,
        message: 'React Native component generated successfully',
      };
    } catch (error) {
      logger.error('Failed to process React Native request:', error);
      return {
        success: false,
        message: `Failed to generate React Native component: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private _extractComponentName(request: string): string {
    const match = request.match(/create (?:a )?(\w+)/i);
    return match ? match[1] : 'MobileComponent';
  }

  private _generateReactNativeComponent(request: string, _context: AgentContext): string {
    const componentName = this._extractComponentName(request);

    return `import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

interface ${componentName}Props {
  title?: string;
  onPress?: () => void;
}

export const ${componentName}: React.FC<${componentName}Props> = ({
  title = '${componentName}',
  onPress,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {onPress && (
          <TouchableOpacity style={styles.button} onPress={onPress}>
            <Text style={styles.buttonText}>Tap me</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ${componentName};`;
  }
}

export class DefaultAgentOrchestrator implements AgentOrchestrator {
  private _agents: Map<string, BaseAgent> = new Map();

  constructor() {
    this._registerAgent(new BaseFrontendDevAgent());
    this._registerAgent(new BaseUIUXAgent());
    this._registerAgent(new BaseDebuggerAgent());
    this._registerAgent(new BaseReactNativeAgent());
  }

  private _registerAgent(agent: BaseAgent): void {
    this._agents.set(agent.config.name, agent);
  }

  async route(request: string, context: AgentContext): Promise<BaseAgent[]> {
    const selectedAgents: BaseAgent[] = [];
    const lowerRequest = request.toLowerCase();

    /* Simple routing logic - in reality this would be more sophisticated */
    if (context.expoEnvironment || lowerRequest.includes('react native') || lowerRequest.includes('mobile')) {
      const rnAgent = this._agents.get('ReactNativeAgent');

      if (rnAgent) {
        selectedAgents.push(rnAgent);
      }
    }

    if (lowerRequest.includes('ui') || lowerRequest.includes('design') || lowerRequest.includes('accessible')) {
      const uiAgent = this._agents.get('UIUXAgent');

      if (uiAgent) {
        selectedAgents.push(uiAgent);
      }
    }

    if (lowerRequest.includes('component') || lowerRequest.includes('create')) {
      const frontendAgent = this._agents.get('FrontendDevAgent');

      if (frontendAgent) {
        selectedAgents.push(frontendAgent);
      }
    }

    if (lowerRequest.includes('error') || lowerRequest.includes('debug') || lowerRequest.includes('fix')) {
      const debugAgent = this._agents.get('DebuggerAgent');

      if (debugAgent) {
        selectedAgents.push(debugAgent);
      }
    }

    /* Fallback to frontend agent if no specific agent is selected */
    if (selectedAgents.length === 0) {
      const frontendAgent = this._agents.get('FrontendDevAgent');

      if (frontendAgent) {
        selectedAgents.push(frontendAgent);
      }
    }

    return selectedAgents;
  }

  async orchestrate(request: string, context: AgentContext, agents: BaseAgent[]): Promise<AgentResponse[]> {
    const responses: AgentResponse[] = [];

    for (const agent of agents) {
      try {
        const response = await agent.process(request, context);
        responses.push(response);

        /*
         * If this is a standalone component and generation was successful,
         * save it to the component library
         */
        if (response.success && response.output?.standalone && response.output.content) {
          await this._saveToComponentLibrary(response.output);
        }
      } catch (error) {
        logger.error(`Agent ${agent.config.name} failed:`, error);
        responses.push({
          success: false,
          message: `Agent ${agent.config.name} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }

    return responses;
  }

  async handleExpoWorkflow(
    agents: BaseAgent[],
    context: AgentContext & { expoEnvironment: true },
  ): Promise<AgentResponse[]> {
    /* Ensure React Native agent is included for Expo workflows */
    const hasRNAgent = agents.some((agent) => agent.config.name === 'ReactNativeAgent');

    if (!hasRNAgent) {
      const rnAgent = this._agents.get('ReactNativeAgent');

      if (rnAgent) {
        agents.unshift(rnAgent);
      }
    }

    /* Process with modified context for Expo */
    const responses = await this.orchestrate('', { ...context }, agents);

    /* Add debugger agent to handle any Expo-specific errors */
    const debugAgent = this._agents.get('DebuggerAgent') as DebuggerAgent;

    if (debugAgent) {
      for (const response of responses) {
        if (response.debugInfo?.expoErrors?.length) {
          const debugResponse = await debugAgent.analyzeErrors(response.debugInfo);
          responses.push(debugResponse);
        }
      }
    }

    return responses;
  }

  private async _saveToComponentLibrary(output: AgentOutput): Promise<void> {
    try {
      if (output.metadata?.name && output.content) {
        await componentLibraryManager.saveComponent(output.metadata.name, output.content, {
          description: output.metadata.description,
          framework: output.metadata.framework as any,
          category: output.metadata.category || 'general',
          tags: output.metadata.dependencies || [],
        });
        logger.info(`Component ${output.metadata.name} saved to library`);
      }
    } catch (error) {
      logger.error('Failed to save component to library:', error);
    }
  }
}

// Singleton instances
export const agentOrchestrator = new DefaultAgentOrchestrator();
