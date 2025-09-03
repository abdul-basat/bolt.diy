import type { MemoryItem, MemoryFilter, MemoryStorage } from '../types';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('MemoryStorage');

export class IndexedDBMemoryStorage implements MemoryStorage {
  private db?: IDBDatabase;
  private readonly dbName = 'boltMemory';
  private readonly version = 1;
  private readonly storeName = 'memory';

  async init(): Promise<void> {
    if (typeof indexedDB === 'undefined') {
      throw new Error('IndexedDB is not available in this environment');
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('scope', 'scope', { unique: false });
          store.createIndex('chatId', 'chatId', { unique: false });
          store.createIndex('projectId', 'projectId', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };

      request.onsuccess = (event: Event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = (event: Event) => {
        logger.error('Failed to open IndexedDB:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  async store(item: Omit<MemoryItem, 'id' | 'timestamp'>): Promise<string> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const memoryItem: MemoryItem = { ...item, id, timestamp };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.add(memoryItem);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  async retrieve(filter?: MemoryFilter): Promise<MemoryItem[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      let request: IDBRequest;
      
      if (filter?.type) {
        const index = store.index('type');
        request = index.getAll(filter.type);
      } else if (filter?.scope) {
        const index = store.index('scope');
        request = index.getAll(filter.scope);
      } else if (filter?.chatId) {
        const index = store.index('chatId');
        request = index.getAll(filter.chatId);
      } else if (filter?.projectId) {
        const index = store.index('projectId');
        request = index.getAll(filter.projectId);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        let results = request.result as MemoryItem[];
        
        // Apply additional filters
        if (filter) {
          if (filter.type && !filter.type) {
            results = results.filter(item => item.type === filter.type);
          }
          if (filter.scope && !filter.scope) {
            results = results.filter(item => item.scope === filter.scope);
          }
          if (filter.chatId && !filter.chatId) {
            results = results.filter(item => item.chatId === filter.chatId);
          }
          if (filter.projectId && !filter.projectId) {
            results = results.filter(item => item.projectId === filter.projectId);
          }
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

        resolve(results);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async get(id: string): Promise<MemoryItem | null> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async update(id: string, updates: Partial<MemoryItem>): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const existing = await this.get(id);
    if (!existing) {
      throw new Error(`Memory item with id ${id} not found`);
    }

    const updated = { ...existing, ...updates };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(updated);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(id: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(scope?: MemoryItem['scope']): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    if (!scope) {
      // Clear all items
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    // Clear items by scope
    const items = await this.retrieve({ scope });
    const promises = items.map(item => this.delete(item.id));
    await Promise.all(promises);
  }

  async search(query: string, filter?: MemoryFilter): Promise<MemoryItem[]> {
    const items = await this.retrieve(filter);
    const lowerQuery = query.toLowerCase();
    
    return items.filter(item => 
      item.title.toLowerCase().includes(lowerQuery) ||
      item.content.toLowerCase().includes(lowerQuery) ||
      (item.metadata && JSON.stringify(item.metadata).toLowerCase().includes(lowerQuery))
    );
  }
}