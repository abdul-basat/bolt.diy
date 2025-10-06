import type { BoltConfig } from './types';
import { defaultBoltConfig } from './types';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('ConfigManager');

export class ConfigManager {
  private config: BoltConfig;
  private configPath: string;

  constructor(configPath = 'bolt.config.json') {
    this.configPath = configPath;
    this.config = { ...defaultBoltConfig };
  }

  async load(): Promise<BoltConfig> {
    try {
      // In a browser environment, we'll use localStorage
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('bolt-config');
        if (stored) {
          const parsed = JSON.parse(stored);
          this.config = this.mergeConfig(defaultBoltConfig, parsed);
          logger.info('Loaded config from localStorage');
        }
      }
      // In server environment, we could load from file system
      // For now, just use defaults
      return this.config;
    } catch (error) {
      logger.warn('Failed to load config, using defaults:', error);
      return this.config;
    }
  }

  async save(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('bolt-config', JSON.stringify(this.config, null, 2));
        logger.info('Saved config to localStorage');
      }
      // In server environment, we could save to file system
    } catch (error) {
      logger.error('Failed to save config:', error);
      throw error;
    }
  }

  get(): BoltConfig {
    return { ...this.config };
  }

  update(updates: Partial<BoltConfig>): void {
    this.config = this.mergeConfig(this.config, updates);
  }

  reset(): void {
    this.config = { ...defaultBoltConfig };
  }

  isMemoryEnabled(): boolean {
    return this.config.memory.enabled;
  }

  isGitHubEnabled(): boolean {
    return this.config.github.enabled;
  }

  isDatabaseEnabled(): boolean {
    return this.config.database.enabled;
  }

  arePluginsEnabled(): boolean {
    return this.config.plugins.enabled;
  }

  getMemoryConfig() {
    return this.config.memory;
  }

  getGitHubConfig() {
    return this.config.github;
  }

  getDatabaseConfig() {
    return this.config.database;
  }

  getPluginsConfig() {
    return this.config.plugins;
  }

  getIntegrationsConfig() {
    return this.config.integrations;
  }

  private mergeConfig(base: BoltConfig, updates: Partial<BoltConfig>): BoltConfig {
    const merged = { ...base };
    
    for (const [key, value] of Object.entries(updates)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        merged[key as keyof BoltConfig] = {
          ...merged[key as keyof BoltConfig],
          ...value,
        } as any;
      } else {
        merged[key as keyof BoltConfig] = value as any;
      }
    }
    
    return merged;
  }
}

// Global instance
let configManager: ConfigManager | null = null;

export function getConfigManager(): ConfigManager {
  if (!configManager) {
    configManager = new ConfigManager();
  }
  return configManager;
}

export function resetConfigManager(): void {
  configManager = null;
}