import type { MemoryConfig } from '../memory/types';

export interface BoltConfig {
  memory: MemoryConfig;
  github: {
    enabled: boolean;
    autoCommit: boolean;
    autoPR: boolean;
    safetyChecks: boolean;
  };
  database: {
    enabled: boolean;
    defaultType: 'postgres' | 'sqlite';
    autoMigrate: boolean;
  };
  plugins: {
    enabled: boolean;
    directory: string;
    autoLoad: boolean;
  };
  integrations: {
    slack: {
      enabled: boolean;
      webhookUrl?: string;
    };
    discord: {
      enabled: boolean;
      webhookUrl?: string;
    };
    jira: {
      enabled: boolean;
      baseUrl?: string;
      apiToken?: string;
    };
    trello: {
      enabled: boolean;
      apiKey?: string;
      token?: string;
    };
  };
}

export const defaultBoltConfig: BoltConfig = {
  memory: {
    enabled: true,
    storageBackend: 'indexeddb',
    maxItems: 1000,
    retentionDays: 30,
    autoCleanup: true,
  },
  github: {
    enabled: false,
    autoCommit: false,
    autoPR: false,
    safetyChecks: true,
  },
  database: {
    enabled: false,
    defaultType: 'sqlite',
    autoMigrate: true,
  },
  plugins: {
    enabled: true,
    directory: 'plugins',
    autoLoad: true,
  },
  integrations: {
    slack: {
      enabled: false,
    },
    discord: {
      enabled: false,
    },
    jira: {
      enabled: false,
    },
    trello: {
      enabled: false,
    },
  },
};