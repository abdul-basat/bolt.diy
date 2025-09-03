import type { MemoryItem, MemoryFilter, MemoryStorage, MemoryConfig } from './types';
import { IndexedDBMemoryStorage } from './storage/indexeddb';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('MemoryManager');

export class MemoryManager {
  private storage: MemoryStorage;
  private config: MemoryConfig;
  private initialized = false;
  private sessionItems = new Map<string, MemoryItem>();

  constructor(config: Partial<MemoryConfig> = {}) {
    this.config = {
      enabled: true,
      storageBackend: 'indexeddb',
      maxItems: 1000,
      retentionDays: 30,
      autoCleanup: true,
      ...config,
    };

    // Initialize storage based on backend
    switch (this.config.storageBackend) {
      case 'indexeddb':
        this.storage = new IndexedDBMemoryStorage();
        break;
      default:
        throw new Error(`Unsupported storage backend: ${this.config.storageBackend}`);
    }
  }

  async init(): Promise<void> {
    if (!this.config.enabled) {
      logger.info('Memory system is disabled');
      return;
    }

    try {
      await this.storage.init();
      this.initialized = true;
      
      if (this.config.autoCleanup) {
        await this.cleanup();
      }
      
      logger.info('Memory system initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize memory system:', error);
      throw error;
    }
  }

  async storeDecision(
    title: string,
    content: string,
    metadata?: Record<string, any>,
    chatId?: string,
    projectId?: string,
    scope: 'session' | 'project' = 'project'
  ): Promise<string> {
    return this.store({
      type: 'decision',
      scope,
      title,
      content,
      metadata,
      chatId,
      projectId,
    });
  }

  async storePreference(
    title: string,
    content: string,
    metadata?: Record<string, any>,
    scope: 'session' | 'project' = 'project'
  ): Promise<string> {
    return this.store({
      type: 'preference',
      scope,
      title,
      content,
      metadata,
    });
  }

  async storeOutput(
    title: string,
    content: string,
    metadata?: Record<string, any>,
    chatId?: string,
    projectId?: string,
    scope: 'session' | 'project' = 'session'
  ): Promise<string> {
    return this.store({
      type: 'output',
      scope,
      title,
      content,
      metadata,
      chatId,
      projectId,
    });
  }

  async storeContext(
    title: string,
    content: string,
    metadata?: Record<string, any>,
    chatId?: string,
    projectId?: string,
    scope: 'session' | 'project' = 'session'
  ): Promise<string> {
    return this.store({
      type: 'context',
      scope,
      title,
      content,
      metadata,
      chatId,
      projectId,
    });
  }

  private async store(item: Omit<MemoryItem, 'id' | 'timestamp'>): Promise<string> {
    if (!this.config.enabled) {
      throw new Error('Memory system is disabled');
    }

    if (!this.initialized) {
      await this.init();
    }

    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const memoryItem: MemoryItem = { ...item, id, timestamp };

    if (item.scope === 'session') {
      // Store in session memory (in-memory)
      this.sessionItems.set(id, memoryItem);
      logger.debug(`Stored session memory item: ${item.title}`);
    } else {
      // Store in persistent storage
      await this.storage.store(item);
      logger.debug(`Stored persistent memory item: ${item.title}`);
    }

    return id;
  }

  async retrieve(filter?: MemoryFilter): Promise<MemoryItem[]> {
    if (!this.config.enabled) {
      return [];
    }

    if (!this.initialized) {
      await this.init();
    }

    let results: MemoryItem[] = [];

    // Get session items
    if (!filter?.scope || filter.scope === 'session') {
      const sessionItems = Array.from(this.sessionItems.values());
      results.push(...this.applyFilter(sessionItems, filter));
    }

    // Get persistent items
    if (!filter?.scope || filter.scope === 'project') {
      const persistentItems = await this.storage.retrieve(filter);
      results.push(...persistentItems);
    }

    // Sort by timestamp (newest first)
    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply pagination
    if (filter?.offset) {
      results = results.slice(filter.offset);
    }
    if (filter?.limit) {
      results = results.slice(0, filter.limit);
    }

    return results;
  }

  async get(id: string): Promise<MemoryItem | null> {
    if (!this.config.enabled) {
      return null;
    }

    // Check session memory first
    const sessionItem = this.sessionItems.get(id);
    if (sessionItem) {
      return sessionItem;
    }

    if (!this.initialized) {
      await this.init();
    }

    // Check persistent storage
    return this.storage.get(id);
  }

  async search(query: string, filter?: MemoryFilter): Promise<MemoryItem[]> {
    if (!this.config.enabled) {
      return [];
    }

    const allItems = await this.retrieve(filter);
    const lowerQuery = query.toLowerCase();
    
    return allItems.filter(item => 
      item.title.toLowerCase().includes(lowerQuery) ||
      item.content.toLowerCase().includes(lowerQuery) ||
      (item.metadata && JSON.stringify(item.metadata).toLowerCase().includes(lowerQuery))
    );
  }

  async update(id: string, updates: Partial<MemoryItem>): Promise<void> {
    if (!this.config.enabled) {
      throw new Error('Memory system is disabled');
    }

    // Check session memory first
    const sessionItem = this.sessionItems.get(id);
    if (sessionItem) {
      this.sessionItems.set(id, { ...sessionItem, ...updates });
      return;
    }

    if (!this.initialized) {
      await this.init();
    }

    // Update in persistent storage
    await this.storage.update(id, updates);
  }

  async delete(id: string): Promise<void> {
    if (!this.config.enabled) {
      throw new Error('Memory system is disabled');
    }

    // Check session memory first
    if (this.sessionItems.has(id)) {
      this.sessionItems.delete(id);
      return;
    }

    if (!this.initialized) {
      await this.init();
    }

    // Delete from persistent storage
    await this.storage.delete(id);
  }

  async clear(scope?: MemoryItem['scope']): Promise<void> {
    if (!this.config.enabled) {
      throw new Error('Memory system is disabled');
    }

    if (!scope || scope === 'session') {
      this.sessionItems.clear();
      logger.info('Cleared session memory');
    }

    if (!scope || scope === 'project') {
      if (!this.initialized) {
        await this.init();
      }
      await this.storage.clear('project');
      logger.info('Cleared persistent memory');
    }
  }

  async getMemorySummary(): Promise<{
    totalItems: number;
    sessionItems: number;
    projectItems: number;
    byType: Record<string, number>;
  }> {
    if (!this.config.enabled) {
      return { totalItems: 0, sessionItems: 0, projectItems: 0, byType: {} };
    }

    const allItems = await this.retrieve();
    const sessionItems = allItems.filter(item => item.scope === 'session').length;
    const projectItems = allItems.filter(item => item.scope === 'project').length;
    
    const byType = allItems.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalItems: allItems.length,
      sessionItems,
      projectItems,
      byType,
    };
  }

  private applyFilter(items: MemoryItem[], filter?: MemoryFilter): MemoryItem[] {
    if (!filter) return items;

    return items.filter(item => {
      if (filter.type && item.type !== filter.type) return false;
      if (filter.scope && item.scope !== filter.scope) return false;
      if (filter.chatId && item.chatId !== filter.chatId) return false;
      if (filter.projectId && item.projectId !== filter.projectId) return false;
      return true;
    });
  }

  private async cleanup(): Promise<void> {
    if (!this.config.autoCleanup || !this.initialized) {
      return;
    }

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);
      
      const allItems = await this.storage.retrieve();
      const itemsToDelete = allItems.filter(item => 
        new Date(item.timestamp) < cutoffDate
      );

      const deletePromises = itemsToDelete.map(item => this.storage.delete(item.id));
      await Promise.all(deletePromises);

      if (itemsToDelete.length > 0) {
        logger.info(`Cleaned up ${itemsToDelete.length} old memory items`);
      }

      // Also check if we have too many items
      if (allItems.length > this.config.maxItems) {
        const sortedItems = allItems.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        const itemsToRemove = sortedItems.slice(0, allItems.length - this.config.maxItems);
        
        const removePromises = itemsToRemove.map(item => this.storage.delete(item.id));
        await Promise.all(removePromises);
        
        logger.info(`Removed ${itemsToRemove.length} oldest memory items to stay within limit`);
      }
    } catch (error) {
      logger.error('Error during memory cleanup:', error);
    }
  }

  getConfig(): MemoryConfig {
    return { ...this.config };
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }
}

// Global instance
let memoryManager: MemoryManager | null = null;

export function getMemoryManager(config?: Partial<MemoryConfig>): MemoryManager {
  if (!memoryManager) {
    memoryManager = new MemoryManager(config);
  }
  return memoryManager;
}

export function resetMemoryManager(): void {
  memoryManager = null;
}