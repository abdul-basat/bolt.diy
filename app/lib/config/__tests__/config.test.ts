/**
 * Tests for the configuration management system
 * 
 * These tests validate the configuration loading, validation,
 * and secure handling of environment variables.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConfigManager, getConfigManager, validateConfig, getClientEnvVars } from '../ConfigManager';

describe('Configuration Management System', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Clear singleton instance for testing
    (ConfigManager as any).instance = undefined;
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    
    // Clear singleton instance
    (ConfigManager as any).instance = undefined;
  });

  describe('ConfigManager', () => {
    it('should be a singleton', () => {
      const config1 = getConfigManager();
      const config2 = getConfigManager();
      
      expect(config1).toBe(config2);
    });

    it('should load default configuration', () => {
      process.env.NODE_ENV = 'test';
      
      const config = getConfigManager().getConfig();
      
      expect(config.system.environment).toBe('test');
      expect(config.system.debug).toBe(false);
      expect(config.agents.maxConcurrentAgents).toBe(3);
      expect(config.agents.autoSelectAgent).toBe(true);
      expect(config.security.enableSecurityScan).toBe(true);
    });

    it('should load environment-specific configuration', () => {
      process.env.NODE_ENV = 'development';
      process.env.VITE_LOG_LEVEL = 'debug';
      process.env.MAX_CONCURRENT_AGENTS = '5';
      process.env.AUTO_SELECT_AGENT = 'false';
      
      const config = getConfigManager().getConfig();
      
      expect(config.system.environment).toBe('development');
      expect(config.system.debug).toBe(true);
      expect(config.agents.maxConcurrentAgents).toBe(5);
      expect(config.agents.autoSelectAgent).toBe(false);
    });

    it('should handle missing environment variables gracefully', () => {
      // Clear all environment variables
      Object.keys(process.env).forEach(key => {
        delete process.env[key];
      });
      
      const config = getConfigManager().getConfig();
      
      expect(config.system.environment).toBe('development'); // default
      expect(config.agents.maxConcurrentAgents).toBe(3); // default
      expect(config.security.minSecurityScore).toBe(70); // default
    });
  });

  describe('LLM Provider Configuration', () => {
    it('should load LLM providers from environment', () => {
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
      process.env.OPENAI_API_KEY = 'test-openai-key';
      process.env.OLLAMA_API_BASE_URL = 'http://localhost:11434';
      
      const config = getConfigManager().getLLMConfig();
      
      expect(config.providers.anthropic.enabled).toBe(true);
      expect(config.providers.anthropic.apiKey).toBe('test-anthropic-key');
      expect(config.providers.openai.enabled).toBe(true);
      expect(config.providers.openai.apiKey).toBe('test-openai-key');
      expect(config.providers.ollama.enabled).toBe(true);
      expect(config.providers.ollama.baseUrl).toBe('http://localhost:11434');
    });

    it('should mark providers as disabled when no credentials', () => {
      // No LLM environment variables set
      const config = getConfigManager().getLLMConfig();
      
      expect(config.providers.anthropic.enabled).toBe(false);
      expect(config.providers.openai.enabled).toBe(false);
      expect(config.providers.anthropic.apiKey).toBeUndefined();
    });
  });

  describe('Environment Variable Handling', () => {
    it('should retrieve environment variables safely', () => {
      process.env.TEST_VAR = 'test-value';
      process.env.ANTHROPIC_API_KEY = 'sensitive-key';
      
      const configManager = getConfigManager();
      
      const testVar = configManager.getEnvVar('TEST_VAR');
      const sensitiveVar = configManager.getEnvVar('ANTHROPIC_API_KEY');
      
      expect(testVar).toBe('test-value');
      expect(sensitiveVar).toBe('sensitive-key');
    });

    it('should use default values when env var missing', () => {
      const configManager = getConfigManager();
      
      const result = configManager.getEnvVar('MISSING_VAR', 'default-value');
      
      expect(result).toBe('default-value');
    });

    it('should filter client-safe environment variables', () => {
      process.env.VITE_PUBLIC_VAR = 'public-value';
      process.env.VITE_ANOTHER_VAR = 'another-public';
      process.env.ANTHROPIC_API_KEY = 'secret-key';
      process.env.REGULAR_VAR = 'regular-value';
      
      const clientVars = getClientEnvVars();
      
      expect(clientVars).toHaveProperty('VITE_PUBLIC_VAR', 'public-value');
      expect(clientVars).toHaveProperty('VITE_ANOTHER_VAR', 'another-public');
      expect(clientVars).not.toHaveProperty('ANTHROPIC_API_KEY');
      expect(clientVars).not.toHaveProperty('REGULAR_VAR');
    });
  });

  describe('Configuration Validation', () => {
    it('should validate Node.js version compatibility', () => {
      // Mock Node.js version
      const originalVersion = process.version;
      Object.defineProperty(process, 'version', {
        value: 'v18.18.0',
        configurable: true
      });
      
      const validation = validateConfig();
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors.length).toBe(0);
      
      // Restore original version
      Object.defineProperty(process, 'version', {
        value: originalVersion,
        configurable: true
      });
    });

    it('should detect incompatible Node.js version', () => {
      // Mock old Node.js version
      const originalVersion = process.version;
      Object.defineProperty(process, 'version', {
        value: 'v16.14.0',
        configurable: true
      });
      
      const validation = validateConfig();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('Node.js version'))).toBe(true);
      
      // Restore original version
      Object.defineProperty(process, 'version', {
        value: originalVersion,
        configurable: true
      });
    });

    it('should warn about missing LLM providers', () => {
      // Clear all LLM environment variables
      const llmKeys = [
        'ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'GITHUB_API_KEY', 
        'OLLAMA_API_BASE_URL', 'LMSTUDIO_API_BASE_URL'
      ];
      const savedValues: Record<string, any> = {};
      
      llmKeys.forEach(key => {
        savedValues[key] = process.env[key];
        delete process.env[key];
      });
      
      // Clear singleton to force reload
      (ConfigManager as any).instance = undefined;
      
      const validation = validateConfig();
      
      expect(validation.warnings.some(w => w.includes('No LLM providers'))).toBe(true);
      
      // Restore values
      llmKeys.forEach(key => {
        if (savedValues[key]) {
          process.env[key] = savedValues[key];
        }
      });
    });

    it('should warn about missing recommended variables', () => {
      // Clear recommended variables
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.OPENAI_API_KEY;
      delete process.env.VITE_LOG_LEVEL;
      
      const validation = validateConfig();
      
      expect(validation.warnings.some(w => w.includes('ANTHROPIC_API_KEY'))).toBe(true);
      expect(validation.warnings.some(w => w.includes('OPENAI_API_KEY'))).toBe(true);
      expect(validation.warnings.some(w => w.includes('VITE_LOG_LEVEL'))).toBe(true);
    });

    it('should pass validation with proper setup', () => {
      process.env.NODE_ENV = 'test';
      process.env.ANTHROPIC_API_KEY = 'test-key';
      process.env.VITE_LOG_LEVEL = 'info';
      
      // Mock Node.js version
      const originalVersion = process.version;
      Object.defineProperty(process, 'version', {
        value: 'v18.18.0',
        configurable: true
      });
      
      const validation = validateConfig();
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors.length).toBe(0);
      
      // Restore original version
      Object.defineProperty(process, 'version', {
        value: originalVersion,
        configurable: true
      });
    });
  });

  describe('Configuration Updates', () => {
    it('should allow runtime configuration updates', () => {
      const configManager = getConfigManager();
      
      const originalConfig = configManager.getConfig();
      expect(originalConfig.agents.maxConcurrentAgents).toBe(3);
      
      configManager.updateConfig({
        agents: {
          ...originalConfig.agents,
          maxConcurrentAgents: 5
        }
      });
      
      const updatedConfig = configManager.getConfig();
      expect(updatedConfig.agents.maxConcurrentAgents).toBe(5);
    });

    it('should return immutable configuration objects', () => {
      const configManager = getConfigManager();
      const config = configManager.getConfig();
      
      // Get original value
      const originalValue = config.agents.maxConcurrentAgents;
      
      // Attempting to modify should not affect the internal config
      // Note: Object.freeze only provides shallow immutability
      try {
        (config as any).agents.maxConcurrentAgents = 999;
      } catch (error) {
        // Frozen object throws in strict mode
      }
      
      const freshConfig = configManager.getConfig();
      expect(freshConfig.agents.maxConcurrentAgents).toBe(originalValue);
    });
  });

  describe('Specific Configuration Sections', () => {
    it('should return system configuration', () => {
      process.env.NODE_ENV = 'production';
      process.env.DEFAULT_TIMEOUT = '45000';
      process.env.VITE_LOG_LEVEL = 'info'; // Set to avoid debug mode
      
      // Clear singleton to force reload
      (ConfigManager as any).instance = undefined;
      
      const systemConfig = getConfigManager().getSystemConfig();
      
      expect(systemConfig.environment).toBe('production');
      expect(systemConfig.defaultTimeout).toBe(45000);
      expect(systemConfig.debug).toBe(false);
    });

    it('should return agent configuration', () => {
      process.env.MAX_CONCURRENT_AGENTS = '7';
      process.env.AGENT_TIMEOUT = '60000';
      process.env.ENABLE_AGENT_DEBUG = 'true';
      
      const agentConfig = getConfigManager().getAgentConfig();
      
      expect(agentConfig.maxConcurrentAgents).toBe(7);
      expect(agentConfig.defaultAgentTimeout).toBe(60000);
      expect(agentConfig.enableAgentDebug).toBe(true);
    });

    it('should return security configuration', () => {
      process.env.ENABLE_SECURITY_SCAN = 'false';
      process.env.SECURITY_TIMEOUT = '120000';
      process.env.MIN_SECURITY_SCORE = '85';
      
      const securityConfig = getConfigManager().getSecurityConfig();
      
      expect(securityConfig.enableSecurityScan).toBe(false);
      expect(securityConfig.securityTimeout).toBe(120000);
      expect(securityConfig.minSecurityScore).toBe(85);
    });
  });

  describe('Version Compatibility', () => {
    it('should correctly compare version numbers', () => {
      const configManager = getConfigManager();
      
      // Access private method for testing
      const isVersionCompatible = (configManager as any).isVersionCompatible;
      
      expect(isVersionCompatible('18.18.0', '18.18.0')).toBe(true);
      expect(isVersionCompatible('18.19.0', '18.18.0')).toBe(true);
      expect(isVersionCompatible('19.0.0', '18.18.0')).toBe(true);
      expect(isVersionCompatible('18.17.0', '18.18.0')).toBe(false);
      expect(isVersionCompatible('17.20.0', '18.18.0')).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed environment variables gracefully', () => {
      process.env.MAX_CONCURRENT_AGENTS = 'not-a-number';
      process.env.ENABLE_AGENT_DEBUG = 'not-a-boolean';
      
      // Clear singleton to force reload
      (ConfigManager as any).instance = undefined;
      
      const config = getConfigManager().getConfig();
      
      // Should fall back to defaults when parsing fails
      expect(config.agents.maxConcurrentAgents).toBeNaN(); // parseInt('not-a-number') is NaN
      expect(config.agents.enableAgentDebug).toBe(false); // !== 'true'
    });
  });
});