export interface MemoryItem {
  id: string;
  type: 'decision' | 'preference' | 'output' | 'context';
  scope: 'session' | 'project';
  title: string;
  content: string;
  metadata?: Record<string, any>;
  timestamp: string;
  chatId?: string;
  projectId?: string;
}

export interface MemoryFilter {
  type?: MemoryItem['type'];
  scope?: MemoryItem['scope'];
  chatId?: string;
  projectId?: string;
  limit?: number;
  offset?: number;
}

export interface MemoryStorage {
  init(): Promise<void>;
  store(item: Omit<MemoryItem, 'id' | 'timestamp'>): Promise<string>;
  retrieve(filter?: MemoryFilter): Promise<MemoryItem[]>;
  get(id: string): Promise<MemoryItem | null>;
  update(id: string, updates: Partial<MemoryItem>): Promise<void>;
  delete(id: string): Promise<void>;
  clear(scope?: MemoryItem['scope']): Promise<void>;
  search(query: string, filter?: MemoryFilter): Promise<MemoryItem[]>;
}

export interface MemoryConfig {
  enabled: boolean;
  storageBackend: 'json' | 'sqlite' | 'indexeddb';
  maxItems: number;
  retentionDays: number;
  autoCleanup: boolean;
}