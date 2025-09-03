import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryManager } from './MemoryManager';

// Mock IndexedDB for testing
const mockIndexedDB = {
  open: () => {
    const request = {
      onsuccess: null as any,
      onerror: null as any,
      onupgradeneeded: null as any,
      result: {
        objectStoreNames: { contains: () => false },
        createObjectStore: () => ({
          createIndex: () => {},
        }),
        transaction: () => ({
          objectStore: () => ({
            add: () => ({ onsuccess: null, onerror: null }),
            getAll: () => ({ onsuccess: null, onerror: null, result: [] }),
            get: () => ({ onsuccess: null, onerror: null, result: null }),
            put: () => ({ onsuccess: null, onerror: null }),
            delete: () => ({ onsuccess: null, onerror: null }),
            clear: () => ({ onsuccess: null, onerror: null }),
          }),
        }),
      },
    };
    setTimeout(() => {
      if (request.onupgradeneeded) {
        request.onupgradeneeded({ target: request, oldVersion: 0 } as any);
      }
      if (request.onsuccess) {
        request.onsuccess({ target: request } as any);
      }
    }, 0);
    return request;
  },
};

// Mock crypto.randomUUID
const mockCrypto = {
  randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
};

describe('MemoryManager', () => {
  let memoryManager: MemoryManager;

  beforeEach(() => {
    // Mock globals
    (global as any).indexedDB = mockIndexedDB;
    (global as any).crypto = mockCrypto;
    
    memoryManager = new MemoryManager({
      enabled: true,
      storageBackend: 'indexeddb',
      maxItems: 100,
      retentionDays: 7,
      autoCleanup: false,
    });
  });

  it('should be enabled by default', () => {
    expect(memoryManager.isEnabled()).toBe(true);
  });

  it('should return correct config', () => {
    const config = memoryManager.getConfig();
    expect(config.enabled).toBe(true);
    expect(config.storageBackend).toBe('indexeddb');
    expect(config.maxItems).toBe(100);
  });

  it('should store decisions', async () => {
    const id = await memoryManager.storeDecision(
      'Test Decision',
      'This is a test decision',
      { importance: 'high' }
    );
    
    expect(id).toBeDefined();
    expect(typeof id).toBe('string');
  });

  it('should store preferences', async () => {
    const id = await memoryManager.storePreference(
      'Test Preference',
      'This is a test preference'
    );
    
    expect(id).toBeDefined();
    expect(typeof id).toBe('string');
  });

  it('should get memory summary', async () => {
    await memoryManager.init();
    const summary = await memoryManager.getMemorySummary();
    
    expect(summary).toHaveProperty('totalItems');
    expect(summary).toHaveProperty('sessionItems');
    expect(summary).toHaveProperty('projectItems');
    expect(summary).toHaveProperty('byType');
  });
});