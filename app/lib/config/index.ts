/**
 * Configuration System Entry Point
 * 
 * This module exports the configuration management system for secure
 * handling of environment variables and application settings.
 * 
 * @module Config
 */

export { ConfigManager, getConfigManager, validateConfig, getClientEnvVars } from './ConfigManager';
export type { 
  SystemConfig, 
  LLMConfig, 
  AgentConfig, 
  SecurityConfig, 
  AppConfig, 
  ValidationResult 
} from './ConfigManager';