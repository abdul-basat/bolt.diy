import { getMemoryManager } from './MemoryManager';
import { coloredText } from '~/utils/terminal';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('MemoryCommands');

export interface MemoryCommandResult {
  success: boolean;
  output: string;
  exitCode: number;
}

export class MemoryCommandHandler {
  private memoryManager = getMemoryManager();

  async executeCommand(command: string): Promise<MemoryCommandResult> {
    const args = command.trim().split(/\s+/);
    const baseCommand = args[0];

    try {
      switch (baseCommand) {
        case 'show-memory':
          return await this.showMemory(args.slice(1));
        case 'clear-memory':
          return await this.clearMemory(args.slice(1));
        default:
          return {
            success: false,
            output: coloredText.red(`Unknown memory command: ${baseCommand}\n\nAvailable commands:\n  show-memory [--type=<type>] [--scope=<scope>] [--limit=<n>]\n  clear-memory [--scope=<scope>]`),
            exitCode: 1,
          };
      }
    } catch (error) {
      logger.error('Error executing memory command:', error);
      return {
        success: false,
        output: coloredText.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`),
        exitCode: 1,
      };
    }
  }

  private async showMemory(args: string[]): Promise<MemoryCommandResult> {
    try {
      await this.memoryManager.init();

      const filter: any = {};
      const options: any = {};

      // Parse arguments
      for (const arg of args) {
        if (arg.startsWith('--type=')) {
          filter.type = arg.split('=')[1];
        } else if (arg.startsWith('--scope=')) {
          filter.scope = arg.split('=')[1];
        } else if (arg.startsWith('--limit=')) {
          filter.limit = parseInt(arg.split('=')[1], 10);
        } else if (arg.startsWith('--chat=')) {
          filter.chatId = arg.split('=')[1];
        } else if (arg.startsWith('--project=')) {
          filter.projectId = arg.split('=')[1];
        }
      }

      const items = await this.memoryManager.retrieve(filter);
      const summary = await this.memoryManager.getMemorySummary();

      let output = '\n=== Memory Summary ===\n';
      output += `Total Items: ${summary.totalItems}\n`;
      output += `Session Items: ${summary.sessionItems}\n`;
      output += `Project Items: ${summary.projectItems}\n`;
      output += `By Type: ${Object.entries(summary.byType).map(([type, count]) => `${type}(${count})`).join(', ')}\n\n`;

      if (items.length === 0) {
        output += 'No memory items found.\n';
      } else {
        output += `=== Memory Items (${items.length}) ===\n\n`;
        
        for (const item of items) {
          output += `ID: ${item.id}\n`;
          output += `Type: ${item.type}\n`;
          output += `Scope: ${item.scope}\n`;
          output += `Title: ${item.title}\n`;
          output += `Timestamp: ${new Date(item.timestamp).toLocaleString()}\n`;
          
          if (item.chatId) {
            output += `Chat ID: ${item.chatId}\n`;
          }
          
          if (item.projectId) {
            output += `Project ID: ${item.projectId}\n`;
          }
          
          output += `Content: ${item.content.length > 100 ? item.content.substring(0, 100) + '...' : item.content}\n`;
          
          if (item.metadata) {
            output += `Metadata: ${JSON.stringify(item.metadata, null, 2)}\n`;
          }
          
          output += '---\n\n';
        }
      }

      return {
        success: true,
        output,
        exitCode: 0,
      };
    } catch (error) {
      logger.error('Error showing memory:', error);
      return {
        success: false,
        output: coloredText.red(`Failed to retrieve memory: ${error instanceof Error ? error.message : 'Unknown error'}`),
        exitCode: 1,
      };
    }
  }

  private async clearMemory(args: string[]): Promise<MemoryCommandResult> {
    try {
      await this.memoryManager.init();

      let scope: 'session' | 'project' | undefined;

      // Parse arguments
      for (const arg of args) {
        if (arg.startsWith('--scope=')) {
          const scopeValue = arg.split('=')[1];
          if (scopeValue === 'session' || scopeValue === 'project') {
            scope = scopeValue;
          } else {
            return {
              success: false,
              output: coloredText.red(`Invalid scope: ${scopeValue}. Must be 'session' or 'project'.`),
              exitCode: 1,
            };
          }
        }
      }

      await this.memoryManager.clear(scope);

      let output: string;
      if (scope) {
        output = `Successfully cleared ${scope} memory.\n`;
      } else {
        output = 'Successfully cleared all memory.\n';
      }

      return {
        success: true,
        output,
        exitCode: 0,
      };
    } catch (error) {
      logger.error('Error clearing memory:', error);
      return {
        success: false,
        output: coloredText.red(`Failed to clear memory: ${error instanceof Error ? error.message : 'Unknown error'}`),
        exitCode: 1,
      };
    }
  }

  isMemoryCommand(command: string): boolean {
    const trimmed = command.trim();
    return trimmed.startsWith('show-memory') || trimmed.startsWith('clear-memory');
  }
}

// Global instance
let memoryCommandHandler: MemoryCommandHandler | null = null;

export function getMemoryCommandHandler(): MemoryCommandHandler {
  if (!memoryCommandHandler) {
    memoryCommandHandler = new MemoryCommandHandler();
  }
  return memoryCommandHandler;
}