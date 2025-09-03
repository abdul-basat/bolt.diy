/**
 * Configuration Manager for Agent System
 * 
 * This module provides secure configuration management for the agent system,
 * handling environment variables, API keys, and system settings safely.
 * 
 * @module ConfigManager
 */

import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('ConfigManager');

/**
 * Configuration categories for different aspects of the system.
 */
export interface SystemConfig {
  /** Environment mode (development, production, test) */
  environment: 'development' | 'production' | 'test';
  
  /** Debug mode enabled */
  debug: boolean;
  
  /** Application version */
  version: string;
  
  /** Default timeout for operations */
  defaultTimeout: number;
}

/**
 * LLM provider configuration.
 */
export interface LLMConfig {
  /** Available LLM providers and their API keys */
  providers: Record<string, {
    apiKey?: string;
    baseUrl?: string;
    enabled: boolean;
  }>;
  
  /** Default provider to use */
  defaultProvider?: string;
}

/**
 * Agent system configuration.
 */
export interface AgentConfig {
  /** Maximum concurrent agents */
  maxConcurrentAgents: number;
  
  /** Default agent timeout */
  defaultAgentTimeout: number;
  
  /** Enable agent debugging */
  enableAgentDebug: boolean;
  
  /** Auto-select best agent for tasks */
  autoSelectAgent: boolean;
}

/**
 * Security configuration.
 */
export interface SecurityConfig {
  /** Enable security scanning */
  enableSecurityScan: boolean;
  
  /** Security assessment timeout */
  securityTimeout: number;
  
  /** Minimum security score required */
  minSecurityScore: number;
}

/**
 * Complete application configuration.
 */
export interface AppConfig {
  system: SystemConfig;
  llm: LLMConfig;
  agents: AgentConfig;
  security: SecurityConfig;
}

/**
 * Configuration manager class for handling secure configuration.
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfig;
  private readonly sensitiveKeys = new Set([
    'ANTHROPIC_API_KEY',
    'OPENAI_API_KEY',
    'GITHUB_API_KEY',
    'PERPLEXITY_API_KEY',
    'DEEPSEEK_API_KEY',
    'GOOGLE_GENERATIVE_AI_API_KEY',
    'COHERE_API_KEY',
    'GROQ_API_KEY',
    'MISTRAL_API_KEY',
    'TOGETHER_API_KEY',
    'XAI_API_KEY',
    'MOONSHOT_API_KEY',
    'HuggingFace_API_KEY',
    'HYPERBOLIC_API_KEY',
    'OPEN_ROUTER_API_KEY',
    'OPENAI_LIKE_API_KEY',
    'LMSTUDIO_API_BASE_URL',
    'AWS_BEDROCK_CONFIG'
  ]);

  private constructor() {
    this.config = this.loadConfiguration();
    logger.info('Configuration manager initialized');
  }

  /**
   * Get the singleton instance of ConfigManager.
   */
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Get the complete configuration.
   */
  getConfig(): Readonly<AppConfig> {
    return Object.freeze({ ...this.config });
  }

  /**
   * Get system configuration.
   */
  getSystemConfig(): Readonly<SystemConfig> {
    return Object.freeze({ ...this.config.system });
  }

  /**
   * Get LLM configuration.
   */
  getLLMConfig(): Readonly<LLMConfig> {
    return Object.freeze({ ...this.config.llm });
  }

  /**
   * Get agent configuration.
   */
  getAgentConfig(): Readonly<AgentConfig> {
    return Object.freeze({ ...this.config.agents });
  }

  /**
   * Get security configuration.
   */
  getSecurityConfig(): Readonly<SecurityConfig> {
    return Object.freeze({ ...this.config.security });
  }

  /**
   * Get a specific environment variable safely.
   * Sensitive keys are masked in logs.
   */
  getEnvVar(key: string, defaultValue?: string): string | undefined {
    const value = process.env[key] || defaultValue;
    
    if (this.sensitiveKeys.has(key)) {
      if (value) {
        logger.debug(`Retrieved sensitive env var: ${key}=[MASKED]`);
      } else {
        logger.warn(`Missing sensitive env var: ${key}`);
      }
    } else {
      logger.debug(`Retrieved env var: ${key}=${value}`);
    }
    
    return value;
  }

  /**
   * Check if all required environment variables are present.
   */
  validateConfiguration(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check Node.js version
    const nodeVersion = process.version;
    const requiredNodeVersion = '18.18.0';
    if (!this.isVersionCompatible(nodeVersion.substring(1), requiredNodeVersion)) {
      errors.push(`Node.js version ${nodeVersion} is not compatible. Required: ${requiredNodeVersion}+`);
    }

    // Check if at least one LLM provider is configured
    const hasLLMProvider = Object.values(this.config.llm.providers).some(provider => 
      provider.enabled && provider.apiKey
    );
    
    if (!hasLLMProvider) {
      warnings.push('No LLM providers are configured. Some features may not work.');
    }

    // Check for missing recommended environment variables
    const recommendedVars = [
      'ANTHROPIC_API_KEY',
      'OPENAI_API_KEY',
      'VITE_LOG_LEVEL'
    ];

    for (const varName of recommendedVars) {
      if (!this.getEnvVar(varName)) {
        warnings.push(`Recommended environment variable missing: ${varName}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get filtered environment variables safe for client-side use.
   * Only includes VITE_ prefixed variables and excludes sensitive data.
   */
  getClientSafeEnvVars(): Record<string, string> {
    const safeVars: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith('VITE_') && !this.sensitiveKeys.has(key) && value) {
        safeVars[key] = value;
      }
    }
    
    return safeVars;
  }

  /**
   * Update configuration at runtime (for non-sensitive settings).
   */
  updateConfig(updates: Partial<AppConfig>): void {
    this.config = {
      ...this.config,
      ...updates
    };
    
    logger.info('Configuration updated', { updates });
  }

  /**
   * Load configuration from environment variables and defaults.
   */
  private loadConfiguration(): AppConfig {
    const environment = (this.getEnvVar('NODE_ENV') || 'development') as 'development' | 'production' | 'test';
    
    return {
      system: {
        environment,
        debug: environment === 'development' || this.getEnvVar('VITE_LOG_LEVEL') === 'debug',
        version: this.getEnvVar('npm_package_version') || '1.0.0',
        defaultTimeout: parseInt(this.getEnvVar('DEFAULT_TIMEOUT', '30000')!, 10)
      },
      
      llm: {
        providers: this.loadLLMProviders(),
        defaultProvider: this.getEnvVar('DEFAULT_LLM_PROVIDER')
      },
      
      agents: {
        maxConcurrentAgents: parseInt(this.getEnvVar('MAX_CONCURRENT_AGENTS', '3')!, 10),
        defaultAgentTimeout: parseInt(this.getEnvVar('AGENT_TIMEOUT', '30000')!, 10),
        enableAgentDebug: this.getEnvVar('ENABLE_AGENT_DEBUG') === 'true',
        autoSelectAgent: this.getEnvVar('AUTO_SELECT_AGENT', 'true') === 'true'
      },
      
      security: {
        enableSecurityScan: this.getEnvVar('ENABLE_SECURITY_SCAN', 'true') === 'true',
        securityTimeout: parseInt(this.getEnvVar('SECURITY_TIMEOUT', '60000')!, 10),
        minSecurityScore: parseInt(this.getEnvVar('MIN_SECURITY_SCORE', '70')!, 10)
      }
    };
  }

  /**
   * Load LLM provider configurations.
   */
  private loadLLMProviders(): Record<string, { apiKey?: string; baseUrl?: string; enabled: boolean }> {
    const providers: Record<string, { apiKey?: string; baseUrl?: string; enabled: boolean }> = {};
    
    // Define provider configurations
    const providerConfigs = [
      { name: 'anthropic', apiKeyVar: 'ANTHROPIC_API_KEY' },
      { name: 'openai', apiKeyVar: 'OPENAI_API_KEY' },
      { name: 'github', apiKeyVar: 'GITHUB_API_KEY' },
      { name: 'perplexity', apiKeyVar: 'PERPLEXITY_API_KEY' },
      { name: 'deepseek', apiKeyVar: 'DEEPSEEK_API_KEY' },
      { name: 'google', apiKeyVar: 'GOOGLE_GENERATIVE_AI_API_KEY' },
      { name: 'cohere', apiKeyVar: 'COHERE_API_KEY' },
      { name: 'groq', apiKeyVar: 'GROQ_API_KEY' },
      { name: 'mistral', apiKeyVar: 'MISTRAL_API_KEY' },
      { name: 'together', apiKeyVar: 'TOGETHER_API_KEY', baseUrlVar: 'TOGETHER_API_BASE_URL' },
      { name: 'xai', apiKeyVar: 'XAI_API_KEY' },
      { name: 'moonshot', apiKeyVar: 'MOONSHOT_API_KEY' },
      { name: 'huggingface', apiKeyVar: 'HuggingFace_API_KEY' },
      { name: 'hyperbolic', apiKeyVar: 'HYPERBOLIC_API_KEY', baseUrlVar: 'HYPERBOLIC_API_BASE_URL' },
      { name: 'openrouter', apiKeyVar: 'OPEN_ROUTER_API_KEY' },
      { name: 'ollama', baseUrlVar: 'OLLAMA_API_BASE_URL' },
      { name: 'lmstudio', baseUrlVar: 'LMSTUDIO_API_BASE_URL' }
    ];
    
    for (const config of providerConfigs) {
      const apiKey = config.apiKeyVar ? this.getEnvVar(config.apiKeyVar) : undefined;
      const baseUrl = config.baseUrlVar ? this.getEnvVar(config.baseUrlVar) : undefined;
      
      providers[config.name] = {
        apiKey,
        baseUrl,
        enabled: !!(apiKey || baseUrl)
      };
    }
    
    return providers;
  }

  /**
   * Check if a version is compatible with the required version.
   */
  private isVersionCompatible(currentVersion: string, requiredVersion: string): boolean {
    const current = currentVersion.split('.').map(Number);
    const required = requiredVersion.split('.').map(Number);
    
    for (let i = 0; i < Math.max(current.length, required.length); i++) {
      const currentPart = current[i] || 0;
      const requiredPart = required[i] || 0;
      
      if (currentPart > requiredPart) return true;
      if (currentPart < requiredPart) return false;
    }
    
    return true; // Equal versions are compatible
  }
}

/**
 * Configuration validation result.
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Get the global configuration manager instance.
 */
export function getConfigManager(): ConfigManager {
  return ConfigManager.getInstance();
}

/**
 * Validate the current configuration and return results.
 */
export function validateConfig(): ValidationResult {
  return getConfigManager().validateConfiguration();
}

/**
 * Get environment variables safe for client-side use.
 */
export function getClientEnvVars(): Record<string, string> {
  return getConfigManager().getClientSafeEnvVars();
}