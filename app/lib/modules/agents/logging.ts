import { existsSync, mkdirSync, writeFileSync, appendFileSync } from 'fs';
import { join } from 'path';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogCategory = 'agent-execution' | 'orchestration' | 'system' | 'user';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: unknown;
  agentName?: string;
}

/**
 * Logging service for agent system that writes logs to .bolt/logs/ directory
 */
export class LoggingService {
  private static instance: LoggingService;
  private logDir: string;
  private sessionId: string;

  private constructor() {
    this.logDir = join(process.cwd(), '.bolt', 'logs');
    this.sessionId = new Date().toISOString().replace(/[:.]/g, '-');
    this.ensureLogDirectory();
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  /**
   * Log a message with specified level and category
   */
  log(category: LogCategory, level: LogLevel, message: string, data?: unknown, agentName?: string): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      agentName,
    };

    // Write to console in development
    if (process.env.NODE_ENV === 'development') {
      this.logToConsole(entry);
    }

    // Write to file
    this.logToFile(entry);
  }

  /**
   * Log agent-specific messages
   */
  logAgent(agentName: string, level: LogLevel, message: string, data?: unknown): void {
    this.log('agent-execution', level, message, data, agentName);
  }

  /**
   * Log orchestration messages
   */
  logOrchestration(level: LogLevel, message: string, data?: unknown): void {
    this.log('orchestration', level, message, data);
  }

  /**
   * Log system messages
   */
  logSystem(level: LogLevel, message: string, data?: unknown): void {
    this.log('system', level, message, data);
  }

  /**
   * Get log file path for current session
   */
  getLogFilePath(category?: LogCategory): string {
    const filename = category 
      ? `${this.sessionId}-${category}.json`
      : `${this.sessionId}-all.json`;
    return join(this.logDir, filename);
  }

  /**
   * Get all log entries for the current session
   */
  getSessionLogs(category?: LogCategory): LogEntry[] {
    try {
      const logFile = this.getLogFilePath(category);
      if (!existsSync(logFile)) {
        return [];
      }

      const content = require('fs').readFileSync(logFile, 'utf-8');
      const lines = content.trim().split('\n').filter(line => line.trim());
      return lines.map(line => JSON.parse(line));
    } catch (error) {
      console.error('Error reading log file:', error);
      return [];
    }
  }

  /**
   * Get agent execution summary from logs
   */
  getAgentExecutionSummary(): Record<string, { success: number; failed: number; totalTime: number }> {
    const logs = this.getSessionLogs('agent-execution');
    const summary: Record<string, { success: number; failed: number; totalTime: number }> = {};

    for (const log of logs) {
      if (log.agentName && log.data && typeof log.data === 'object') {
        const data = log.data as any;
        
        if (!summary[log.agentName]) {
          summary[log.agentName] = { success: 0, failed: 0, totalTime: 0 };
        }

        if (log.message.includes('Completed agent')) {
          if (data.success) {
            summary[log.agentName].success++;
          } else {
            summary[log.agentName].failed++;
          }
          
          if (data.executionTime) {
            summary[log.agentName].totalTime += data.executionTime;
          }
        }
      }
    }

    return summary;
  }

  /**
   * Clear logs for current session
   */
  clearSessionLogs(): void {
    try {
      const logFiles = [
        this.getLogFilePath(),
        this.getLogFilePath('agent-execution'),
        this.getLogFilePath('orchestration'),
        this.getLogFilePath('system'),
        this.getLogFilePath('user'),
      ];

      for (const file of logFiles) {
        if (existsSync(file)) {
          require('fs').unlinkSync(file);
        }
      }
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  }

  /**
   * Ensure the log directory exists
   */
  private ensureLogDirectory(): void {
    try {
      if (!existsSync(this.logDir)) {
        mkdirSync(this.logDir, { recursive: true });
      }
    } catch (error) {
      console.error('Error creating log directory:', error);
    }
  }

  /**
   * Write log entry to file
   */
  private logToFile(entry: LogEntry): void {
    try {
      const logLine = JSON.stringify(entry) + '\n';
      
      // Write to main log file
      const mainLogFile = this.getLogFilePath();
      appendFileSync(mainLogFile, logLine);

      // Write to category-specific log file
      const categoryLogFile = this.getLogFilePath(entry.category);
      appendFileSync(categoryLogFile, logLine);
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  }

  /**
   * Write log entry to console (development only)
   */
  private logToConsole(entry: LogEntry): void {
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.category}]`;
    const message = entry.agentName ? `[${entry.agentName}] ${entry.message}` : entry.message;
    
    switch (entry.level) {
      case 'error':
        console.error(prefix, message, entry.data || '');
        break;
      case 'warn':
        console.warn(prefix, message, entry.data || '');
        break;
      case 'info':
        console.info(prefix, message, entry.data || '');
        break;
      case 'debug':
        console.debug(prefix, message, entry.data || '');
        break;
    }
  }
}