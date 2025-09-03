import type {
  SavedComponent,
  ComponentMetadata,
  ComponentSearchFilter,
  ComponentUsageStats,
} from '~/types/componentLibrary';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('ComponentLibrary');

export class ComponentLibraryManager {
  private _componentsPath: string;

  constructor(componentsPath: string = '.bolt/components') {
    this._componentsPath = componentsPath;
  }

  /**
   * Save a component to the component library
   */
  async saveComponent(name: string, code: string, metadata: Partial<ComponentMetadata>): Promise<SavedComponent> {
    try {
      const component: SavedComponent = {
        metadata: {
          name: name.replace(/[^a-zA-Z0-9-_]/g, ''),
          description: metadata.description || '',
          tags: metadata.tags || [],
          props: metadata.props || [],
          usageExample: metadata.usageExample || '',
          createdAt: new Date(),
          updatedAt: new Date(),
          framework: metadata.framework || 'react',
          category: metadata.category || 'general',
        },
        code,
        filePath: `${this._componentsPath}/${name}.tsx`,
      };

      /*
       * In a real implementation, this would save to file system
       * For now, we'll use localStorage as a fallback
       */
      await this._persistComponent(component);

      logger.info(`Component "${name}" saved successfully`);

      return component;
    } catch (error) {
      logger.error(`Failed to save component "${name}":`, error);
      throw error;
    }
  }

  /**
   * List all saved components with optional filtering
   */
  async listComponents(filter?: ComponentSearchFilter): Promise<SavedComponent[]> {
    try {
      const allComponents = await this._loadAllComponents();

      if (!filter) {
        return allComponents;
      }

      return allComponents.filter((component) => {
        const { metadata } = component;

        if (filter.name && !metadata.name.toLowerCase().includes(filter.name.toLowerCase())) {
          return false;
        }

        if (filter.framework && metadata.framework !== filter.framework) {
          return false;
        }

        if (filter.category && metadata.category !== filter.category) {
          return false;
        }

        if (filter.tags && filter.tags.length > 0) {
          const hasMatchingTag = filter.tags.some((tag) => metadata.tags.includes(tag));

          if (!hasMatchingTag) {
            return false;
          }
        }

        return true;
      });
    } catch (error) {
      logger.error('Failed to list components:', error);
      throw error;
    }
  }

  /**
   * Get a specific component by name
   */
  async getComponent(name: string): Promise<SavedComponent | null> {
    try {
      const components = await this._loadAllComponents();
      return components.find((c) => c.metadata.name === name) || null;
    } catch (error) {
      logger.error(`Failed to get component "${name}":`, error);
      throw error;
    }
  }

  /**
   * Delete a component from the library
   */
  async deleteComponent(name: string): Promise<boolean> {
    try {
      const components = await this._loadAllComponents();
      const filteredComponents = components.filter((c) => c.metadata.name !== name);

      await this.persistAllComponents(filteredComponents);
      logger.info(`Component "${name}" deleted successfully`);

      return true;
    } catch (error) {
      logger.error(`Failed to delete component "${name}":`, error);
      throw error;
    }
  }

  /**
   * Update component metadata
   */
  async updateComponent(name: string, updates: Partial<ComponentMetadata>): Promise<SavedComponent | null> {
    try {
      const component = await this.getComponent(name);

      if (!component) {
        return null;
      }

      const updatedComponent: SavedComponent = {
        ...component,
        metadata: {
          ...component.metadata,
          ...updates,
          updatedAt: new Date(),
        },
      };

      const allComponents = await this._loadAllComponents();
      const index = allComponents.findIndex((c) => c.metadata.name === name);

      if (index !== -1) {
        allComponents[index] = updatedComponent;
        await this.persistAllComponents(allComponents);
      }

      return updatedComponent;
    } catch (error) {
      logger.error(`Failed to update component "${name}":`, error);
      throw error;
    }
  }

  /**
   * Search components by various criteria
   */
  async searchComponents(query: string): Promise<SavedComponent[]> {
    try {
      const allComponents = await this._loadAllComponents();
      const lowerQuery = query.toLowerCase();

      return allComponents.filter((component) => {
        const { metadata, code } = component;

        return (
          metadata.name.toLowerCase().includes(lowerQuery) ||
          metadata.description?.toLowerCase().includes(lowerQuery) ||
          metadata.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
          metadata.category.toLowerCase().includes(lowerQuery) ||
          code.toLowerCase().includes(lowerQuery)
        );
      });
    } catch (error) {
      logger.error('Failed to search components:', error);
      throw error;
    }
  }

  /**
   * Get usage statistics for components
   */
  async getUsageStats(): Promise<ComponentUsageStats[]> {
    try {
      const statsJson = localStorage.getItem('bolt-component-usage-stats');
      return statsJson ? JSON.parse(statsJson) : [];
    } catch (error) {
      logger.error('Failed to get usage stats:', error);
      return [];
    }
  }

  /**
   * Track component usage
   */
  async trackUsage(componentName: string): Promise<void> {
    try {
      const stats = await this.getUsageStats();
      const existingIndex = stats.findIndex((s) => s.componentName === componentName);

      if (existingIndex !== -1) {
        stats[existingIndex].usageCount++;
        stats[existingIndex].lastUsed = new Date();
      } else {
        stats.push({
          componentName,
          usageCount: 1,
          lastUsed: new Date(),
        });
      }

      localStorage.setItem('bolt-component-usage-stats', JSON.stringify(stats));
    } catch (error) {
      logger.error(`Failed to track usage for "${componentName}":`, error);
    }
  }

  /**
   * Export components as JSON
   */
  async exportComponents(): Promise<string> {
    try {
      const components = await this._loadAllComponents();
      return JSON.stringify(components, null, 2);
    } catch (error) {
      logger.error('Failed to export components:', error);
      throw error;
    }
  }

  /**
   * Import components from JSON
   */
  async importComponents(jsonData: string): Promise<SavedComponent[]> {
    try {
      const importedComponents: SavedComponent[] = JSON.parse(jsonData);
      const existingComponents = await this._loadAllComponents();

      // Merge with existing components (imported ones take precedence)
      const mergedComponents = [...existingComponents];

      for (const imported of importedComponents) {
        const existingIndex = mergedComponents.findIndex((c) => c.metadata.name === imported.metadata.name);

        if (existingIndex !== -1) {
          mergedComponents[existingIndex] = imported;
        } else {
          mergedComponents.push(imported);
        }
      }

      await this.persistAllComponents(mergedComponents);

      return importedComponents;
    } catch (error) {
      logger.error('Failed to import components:', error);
      throw error;
    }
  }

  private async _persistComponent(component: SavedComponent): Promise<void> {
    try {
      const allComponents = await this._loadAllComponents();
      const existingIndex = allComponents.findIndex((c) => c.metadata.name === component.metadata.name);

      if (existingIndex !== -1) {
        allComponents[existingIndex] = component;
      } else {
        allComponents.push(component);
      }

      await this._persistAllComponents(allComponents);
    } catch (error) {
      throw error;
    }
  }

  private async _loadAllComponents(): Promise<SavedComponent[]> {
    try {
      const componentsJson = localStorage.getItem('bolt-saved-components');
      return componentsJson ? JSON.parse(componentsJson) : [];
    } catch (error) {
      logger.error('Failed to load components from storage:', error);
      return [];
    }
  }

  private async _persistAllComponents(components: SavedComponent[]): Promise<void> {
    try {
      localStorage.setItem('bolt-saved-components', JSON.stringify(components));
    } catch (error) {
      logger.error('Failed to persist components to storage:', error);
      throw error;
    }
  }
}

// Singleton instance
export const componentLibraryManager = new ComponentLibraryManager();
