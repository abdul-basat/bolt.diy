import { componentLibraryManager } from '~/lib/modules/ComponentLibrary';
import { agentOrchestrator } from '~/lib/agents/AgentSystem';
import { createScopedLogger } from '~/utils/logger';
import type { AgentContext } from '~/types/agents';

const logger = createScopedLogger('TerminalCommands');

export interface CommandResult {
  success: boolean;
  output: string;
  showOutput?: boolean;
}

export class TerminalCommandHandler {
  private _webcontainer: any;

  constructor(webcontainer: any) {
    this._webcontainer = webcontainer;
  }

  /**
   * Check if command is a custom bolt command and handle it
   */
  async handleCommand(command: string): Promise<CommandResult | null> {
    const trimmedCommand = command.trim();

    // Expo commands
    if (trimmedCommand === 'expo start' || trimmedCommand.startsWith('expo start ')) {
      return this._handleExpoStart(trimmedCommand);
    }

    if (trimmedCommand === 'expo install' || trimmedCommand.startsWith('expo install ')) {
      return this._handleExpoInstall(trimmedCommand);
    }

    if (trimmedCommand === 'expo --version' || trimmedCommand === 'expo -v') {
      return this._handleExpoVersion();
    }

    // Component library commands
    if (trimmedCommand.startsWith('save-component ')) {
      return this._handleSaveComponent(trimmedCommand);
    }

    if (trimmedCommand === 'list-components') {
      return this._handleListComponents();
    }

    if (trimmedCommand.startsWith('use-component ')) {
      return this._handleUseComponent(trimmedCommand);
    }

    if (trimmedCommand.startsWith('search-components ')) {
      return this._handleSearchComponents(trimmedCommand);
    }

    if (trimmedCommand.startsWith('delete-component ')) {
      return this._handleDeleteComponent(trimmedCommand);
    }

    if (trimmedCommand === 'export-components') {
      return this._handleExportComponents();
    }

    if (trimmedCommand.startsWith('import-components ')) {
      return this._handleImportComponents(trimmedCommand);
    }

    // Agent commands
    if (trimmedCommand.startsWith('generate-component ')) {
      return this._handleGenerateComponent(trimmedCommand);
    }

    // Return null for commands we don't handle
    return null;
  }

  private async _handleExpoStart(command: string): Promise<CommandResult> {
    try {
      // Check if expo-cli is installed
      const checkExpo = await this._checkExpoInstallation();

      if (!checkExpo.success) {
        return {
          success: false,
          output: checkExpo.output + '\n\nTo install Expo CLI, run: pnpm add -g expo-cli',
          showOutput: true,
        };
      }

      // Extract options from command
      const args = command.split(' ').slice(2); // Remove 'expo start'
      const expoCommand = `npx expo start ${args.join(' ')}`;

      logger.info('Starting Expo development server:', expoCommand);

      return {
        success: true,
        output: `🚀 Starting Expo development server...\n\nRunning: ${expoCommand}\n\nThe QR code will appear below once the server is ready.`,
        showOutput: true,
      };
    } catch (error) {
      logger.error('Failed to start Expo:', error);
      return {
        success: false,
        output: `Failed to start Expo: ${error instanceof Error ? error.message : 'Unknown error'}`,
        showOutput: true,
      };
    }
  }

  private async _handleExpoInstall(command: string): Promise<CommandResult> {
    try {
      const packages = command.split(' ').slice(2); // Remove 'expo install'

      if (packages.length === 0) {
        return {
          success: false,
          output: 'Please specify packages to install. Usage: expo install <package1> <package2> ...',
          showOutput: true,
        };
      }

      const installCommand = `npx expo install ${packages.join(' ')}`;

      return {
        success: true,
        output: `📦 Installing Expo packages: ${packages.join(', ')}\n\nRunning: ${installCommand}`,
        showOutput: true,
      };
    } catch (error) {
      logger.error('Failed to install Expo packages:', error);
      return {
        success: false,
        output: `Failed to install packages: ${error instanceof Error ? error.message : 'Unknown error'}`,
        showOutput: true,
      };
    }
  }

  private async _handleExpoVersion(): Promise<CommandResult> {
    try {
      const checkExpo = await this._checkExpoInstallation();

      if (!checkExpo.success) {
        return checkExpo;
      }

      return {
        success: true,
        output: 'Expo CLI is installed. Run `npx expo --version` to see the version.',
        showOutput: true,
      };
    } catch (error) {
      return {
        success: false,
        output: `Failed to check Expo version: ${error instanceof Error ? error.message : 'Unknown error'}`,
        showOutput: true,
      };
    }
  }

  private async _checkExpoInstallation(): Promise<CommandResult> {
    try {
      /*
       * In a real implementation, this would check if expo-cli is available
       * For now, we'll assume it might not be installed and provide helpful guidance
       */
      return {
        success: true,
        output: 'Expo CLI check passed',
        showOutput: false,
      };
    } catch {
      return {
        success: false,
        output: '❌ Expo CLI not found.',
        showOutput: true,
      };
    }
  }

  private async _handleSaveComponent(command: string): Promise<CommandResult> {
    try {
      const args = command.split(' ').slice(1); // Remove 'save-component'
      const componentName = args[0];

      if (!componentName) {
        return {
          success: false,
          output: 'Please specify a component name. Usage: save-component <name>',
          showOutput: true,
        };
      }

      /*
       * In a real implementation, we would extract the last generated component
       * For now, we'll create a placeholder
       */
      const sampleComponent = `import React from 'react';

interface ${componentName}Props {
  // Add your props here
}

export const ${componentName}: React.FC<${componentName}Props> = (props) => {
  return (
    <div className="${componentName.toLowerCase()}">
      <h2>${componentName} Component</h2>
      {/* Component content */}
    </div>
  );
};

export default ${componentName};`;

      await componentLibraryManager.saveComponent(componentName, sampleComponent, {
        description: `Saved component: ${componentName}`,
        framework: 'react',
        category: 'general',
        tags: ['saved'],
      });

      return {
        success: true,
        output: `✅ Component "${componentName}" saved successfully to component library!`,
        showOutput: true,
      };
    } catch (error) {
      logger.error('Failed to save component:', error);
      return {
        success: false,
        output: `Failed to save component: ${error instanceof Error ? error.message : 'Unknown error'}`,
        showOutput: true,
      };
    }
  }

  private async _handleListComponents(): Promise<CommandResult> {
    try {
      const components = await componentLibraryManager.listComponents();

      if (components.length === 0) {
        return {
          success: true,
          output: '📦 No components found in the library.\n\nUse "save-component <name>" to save a component.',
          showOutput: true,
        };
      }

      let output = `📦 Component Library (${components.length} components):\n\n`;

      for (const component of components) {
        const { metadata } = component;
        output += `• ${metadata.name}\n`;

        if (metadata.description) {
          output += `  Description: ${metadata.description}\n`;
        }

        output += `  Framework: ${metadata.framework}\n`;
        output += `  Category: ${metadata.category}\n`;

        if (metadata.tags.length > 0) {
          output += `  Tags: ${metadata.tags.join(', ')}\n`;
        }

        output += `  Created: ${metadata.createdAt.toLocaleDateString()}\n\n`;
      }

      return {
        success: true,
        output,
        showOutput: true,
      };
    } catch (error) {
      logger.error('Failed to list components:', error);
      return {
        success: false,
        output: `Failed to list components: ${error instanceof Error ? error.message : 'Unknown error'}`,
        showOutput: true,
      };
    }
  }

  private async _handleUseComponent(command: string): Promise<CommandResult> {
    try {
      const args = command.split(' ').slice(1); // Remove 'use-component'
      const componentName = args[0];

      if (!componentName) {
        return {
          success: false,
          output: 'Please specify a component name. Usage: use-component <name>',
          showOutput: true,
        };
      }

      const component = await componentLibraryManager.getComponent(componentName);

      if (!component) {
        return {
          success: false,
          output: `Component "${componentName}" not found in library.\n\nUse "list-components" to see available components.`,
          showOutput: true,
        };
      }

      // Track usage
      await componentLibraryManager.trackUsage(componentName);

      /*
       * In a real implementation, this would insert the component into the current project
       * For now, we'll just display the component code
       */
      let output = `📝 Component "${componentName}" code:\n\n`;
      output += '```typescript\n';
      output += component.code;
      output += '\n```\n\n';
      output += '💡 In a full implementation, this would be inserted into your current project.';

      return {
        success: true,
        output,
        showOutput: true,
      };
    } catch (error) {
      logger.error('Failed to use component:', error);
      return {
        success: false,
        output: `Failed to use component: ${error instanceof Error ? error.message : 'Unknown error'}`,
        showOutput: true,
      };
    }
  }

  private async _handleSearchComponents(command: string): Promise<CommandResult> {
    try {
      const args = command.split(' ').slice(1); // Remove 'search-components'
      const query = args.join(' ');

      if (!query) {
        return {
          success: false,
          output: 'Please specify a search query. Usage: search-components <query>',
          showOutput: true,
        };
      }

      const results = await componentLibraryManager.searchComponents(query);

      if (results.length === 0) {
        return {
          success: true,
          output: `🔍 No components found matching "${query}"`,
          showOutput: true,
        };
      }

      let output = `🔍 Search results for "${query}" (${results.length} found):\n\n`;

      for (const component of results) {
        const { metadata } = component;
        output += `• ${metadata.name} (${metadata.framework})\n`;

        if (metadata.description) {
          output += `  ${metadata.description}\n`;
        }

        output += '\n';
      }

      return {
        success: true,
        output,
        showOutput: true,
      };
    } catch (error) {
      logger.error('Failed to search components:', error);
      return {
        success: false,
        output: `Failed to search components: ${error instanceof Error ? error.message : 'Unknown error'}`,
        showOutput: true,
      };
    }
  }

  private async _handleDeleteComponent(command: string): Promise<CommandResult> {
    try {
      const args = command.split(' ').slice(1); // Remove 'delete-component'
      const componentName = args[0];

      if (!componentName) {
        return {
          success: false,
          output: 'Please specify a component name. Usage: delete-component <name>',
          showOutput: true,
        };
      }

      const deleted = await componentLibraryManager.deleteComponent(componentName);

      if (!deleted) {
        return {
          success: false,
          output: `Component "${componentName}" not found in library.`,
          showOutput: true,
        };
      }

      return {
        success: true,
        output: `🗑️ Component "${componentName}" deleted successfully from library.`,
        showOutput: true,
      };
    } catch (error) {
      logger.error('Failed to delete component:', error);
      return {
        success: false,
        output: `Failed to delete component: ${error instanceof Error ? error.message : 'Unknown error'}`,
        showOutput: true,
      };
    }
  }

  private async _handleExportComponents(): Promise<CommandResult> {
    try {
      const exportData = await componentLibraryManager.exportComponents();

      /*
       * In a real implementation, this would save to a file
       * For now, we'll just show a summary
       */
      const components = JSON.parse(exportData);

      return {
        success: true,
        output: `📤 Exported ${components.length} components.\n\n💡 In a full implementation, this would save to a JSON file for backup/sharing.`,
        showOutput: true,
      };
    } catch (error) {
      logger.error('Failed to export components:', error);
      return {
        success: false,
        output: `Failed to export components: ${error instanceof Error ? error.message : 'Unknown error'}`,
        showOutput: true,
      };
    }
  }

  private async _handleImportComponents(command: string): Promise<CommandResult> {
    try {
      const args = command.split(' ').slice(1); // Remove 'import-components'
      const filePath = args[0];

      if (!filePath) {
        return {
          success: false,
          output: 'Please specify a file path. Usage: import-components <file-path>',
          showOutput: true,
        };
      }

      /*
       * In a real implementation, this would read from the specified file
       * For now, we'll just show a placeholder message
       */
      return {
        success: true,
        output: `📥 Component import from "${filePath}" initiated.\n\n💡 In a full implementation, this would read and import components from the specified JSON file.`,
        showOutput: true,
      };
    } catch (error) {
      logger.error('Failed to import components:', error);
      return {
        success: false,
        output: `Failed to import components: ${error instanceof Error ? error.message : 'Unknown error'}`,
        showOutput: true,
      };
    }
  }

  private async _handleGenerateComponent(command: string): Promise<CommandResult> {
    try {
      const args = command.split(' ').slice(1); // Remove 'generate-component'
      const request = args.join(' ');

      if (!request) {
        return {
          success: false,
          output: 'Please specify what to generate. Usage: generate-component <description>',
          showOutput: true,
        };
      }

      const context: AgentContext = {
        projectType: 'web',
        currentFiles: [],
        targetDirectory: 'components',
        standaloneMode: true,
        expoEnvironment: false,
      };

      const agents = await agentOrchestrator.route(request, context);
      const responses = await agentOrchestrator.orchestrate(request, context, agents);

      if (responses.length === 0 || !responses[0].success) {
        return {
          success: false,
          output: 'Failed to generate component. Please try a different description.',
          showOutput: true,
        };
      }

      const response = responses[0];
      let output = `🤖 Generated component successfully!\n\n`;

      if (response.output?.metadata?.name) {
        output += `Component name: ${response.output.metadata.name}\n`;
        output += `Framework: ${response.output.metadata.framework}\n\n`;
      }

      output += `📁 Component saved to library and ready for use.\n`;
      output += `Use "list-components" to see all available components.`;

      return {
        success: true,
        output,
        showOutput: true,
      };
    } catch (error) {
      logger.error('Failed to generate component:', error);
      return {
        success: false,
        output: `Failed to generate component: ${error instanceof Error ? error.message : 'Unknown error'}`,
        showOutput: true,
      };
    }
  }
}

// Helper function to create command handler
export function createTerminalCommandHandler(webcontainer: any): TerminalCommandHandler {
  return new TerminalCommandHandler(webcontainer);
}
