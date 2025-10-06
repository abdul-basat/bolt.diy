import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  savedComponents,
  componentSearchFilter,
  isComponentLibraryVisible,
  toggleComponentLibraryVisibility,
  setComponentSearchFilter,
} from '~/lib/stores/componentLibrary';
import { componentLibraryManager } from '~/lib/modules/ComponentLibrary';
import type { SavedComponent } from '~/types/componentLibrary';
import { Dialog, DialogRoot } from '~/components/ui/Dialog';

export const ComponentLibraryPanel: React.FC = () => {
  const components = useStore(savedComponents);
  const searchFilter = useStore(componentSearchFilter);
  const isVisible = useStore(isComponentLibraryVisible);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComponent, setSelectedComponent] = useState<SavedComponent | null>(null);
  const [filteredComponents, setFilteredComponents] = useState<SavedComponent[]>([]);

  useEffect(() => {
    const loadComponents = async () => {
      try {
        const allComponents = await componentLibraryManager.listComponents(searchFilter);
        setFilteredComponents(allComponents);
      } catch (error) {
        console.error('Failed to load components:', error);
      }
    };

    if (isVisible) {
      loadComponents();
    }
  }, [isVisible, searchFilter]);

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      try {
        const results = await componentLibraryManager.searchComponents(searchQuery);
        setFilteredComponents(results);
      } catch (error) {
        console.error('Search failed:', error);
      }
    } else {
      const allComponents = await componentLibraryManager.listComponents();
      setFilteredComponents(allComponents);
    }
  };

  const handleComponentSelect = (component: SavedComponent) => {
    setSelectedComponent(component);
    componentLibraryManager.trackUsage(component.metadata.name);
  };

  const handleDeleteComponent = async (componentName: string) => {
    try {
      await componentLibraryManager.deleteComponent(componentName);

      const updatedComponents = await componentLibraryManager.listComponents();
      setFilteredComponents(updatedComponents);
    } catch (error) {
      console.error('Failed to delete component:', error);
    }
  };

  const handleFilterChange = (type: 'framework' | 'category', value: string) => {
    const newFilter = {
      ...searchFilter,
      [type]: value || undefined,
    };
    setComponentSearchFilter(newFilter);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <DialogRoot open={isVisible} onOpenChange={(v) => !v && toggleComponentLibraryVisibility()}>
      <Dialog
        className="max-w-4xl w-full !max-h-[80vh] overflow-hidden flex flex-col"
        showCloseButton={true}
        onClose={() => toggleComponentLibraryVisibility()}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="border-b border-bolt-elements-borderColor p-4">
            <h2 className="text-xl font-bold text-bolt-elements-textPrimary mb-4">📦 Component Library</h2>

            {/* Search and Filters */}
            <div className="flex gap-2 flex-wrap">
              <div className="flex-1 min-w-64">
                <input
                  type="text"
                  placeholder="Search components..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full px-3 py-2 border border-bolt-elements-borderColor rounded-md bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text rounded-md hover:bg-bolt-elements-button-primary-backgroundHover"
              >
                Search
              </button>

              <select
                value={searchFilter.framework || ''}
                onChange={(e) => handleFilterChange('framework', e.target.value)}
                className="px-3 py-2 border border-bolt-elements-borderColor rounded-md bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary"
              >
                <option value="">All Frameworks</option>
                <option value="react">React</option>
                <option value="react-native">React Native</option>
                <option value="vue">Vue</option>
                <option value="angular">Angular</option>
              </select>

              <select
                value={searchFilter.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="px-3 py-2 border border-bolt-elements-borderColor rounded-md bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary"
              >
                <option value="">All Categories</option>
                <option value="ui">UI Components</option>
                <option value="ui-design">UI Design</option>
                <option value="mobile">Mobile</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Component List */}
            <div className="w-1/3 border-r border-bolt-elements-borderColor overflow-y-auto">
              <div className="p-4">
                <h3 className="font-semibold text-bolt-elements-textPrimary mb-3">
                  Components ({filteredComponents.length})
                </h3>
                {filteredComponents.length === 0 ? (
                  <div className="text-center text-bolt-elements-textSecondary py-8">
                    <div className="text-4xl mb-2">📦</div>
                    <p>No components found</p>
                    <p className="text-sm mt-1">Use "save-component" in terminal to add components</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredComponents.map((component) => (
                      <div
                        key={component.metadata.name}
                        className={`p-3 border border-bolt-elements-borderColor rounded-md cursor-pointer hover:bg-bolt-elements-background-depth-3 ${
                          selectedComponent?.metadata.name === component.metadata.name
                            ? 'bg-bolt-elements-background-depth-3 border-bolt-elements-focus'
                            : ''
                        }`}
                        onClick={() => handleComponentSelect(component)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-bolt-elements-textPrimary">{component.metadata.name}</h4>
                            <p className="text-sm text-bolt-elements-textSecondary mt-1">
                              {component.metadata.description || 'No description'}
                            </p>
                            <div className="flex gap-2 mt-2">
                              <span className="text-xs px-2 py-1 bg-bolt-elements-background-depth-4 rounded">
                                {component.metadata.framework}
                              </span>
                              <span className="text-xs px-2 py-1 bg-bolt-elements-background-depth-4 rounded">
                                {component.metadata.category}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteComponent(component.metadata.name);
                            }}
                            className="text-red-500 hover:text-red-700 ml-2"
                            title="Delete component"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Component Preview */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                {selectedComponent ? (
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-bolt-elements-textPrimary">
                          {selectedComponent.metadata.name}
                        </h3>
                        <p className="text-bolt-elements-textSecondary">{selectedComponent.metadata.description}</p>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedComponent.code);
                        }}
                        className="px-3 py-1 bg-bolt-elements-button-secondary-background text-bolt-elements-button-secondary-text rounded-md hover:bg-bolt-elements-button-secondary-backgroundHover"
                      >
                        Copy Code
                      </button>
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="font-medium text-bolt-elements-textPrimary mb-2">Details</h4>
                        <div className="space-y-1 text-sm">
                          <div>
                            <span className="text-bolt-elements-textSecondary">Framework: </span>
                            <span className="text-bolt-elements-textPrimary">
                              {selectedComponent.metadata.framework}
                            </span>
                          </div>
                          <div>
                            <span className="text-bolt-elements-textSecondary">Category: </span>
                            <span className="text-bolt-elements-textPrimary">
                              {selectedComponent.metadata.category}
                            </span>
                          </div>
                          <div>
                            <span className="text-bolt-elements-textSecondary">Created: </span>
                            <span className="text-bolt-elements-textPrimary">
                              {new Date(selectedComponent.metadata.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {selectedComponent.metadata.tags.length > 0 && (
                        <div>
                          <h4 className="font-medium text-bolt-elements-textPrimary mb-2">Tags</h4>
                          <div className="flex flex-wrap gap-1">
                            {selectedComponent.metadata.tags.map((tag) => (
                              <span key={tag} className="text-xs px-2 py-1 bg-bolt-elements-background-depth-4 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Props */}
                    {selectedComponent.metadata.props.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-bolt-elements-textPrimary mb-2">Props</h4>
                        <div className="space-y-2">
                          {selectedComponent.metadata.props.map((prop) => (
                            <div
                              key={prop.name}
                              className="flex justify-between items-center p-2 bg-bolt-elements-background-depth-3 rounded"
                            >
                              <div>
                                <span className="font-mono text-sm text-bolt-elements-textPrimary">
                                  {prop.name}
                                  {prop.required && <span className="text-red-500">*</span>}
                                </span>
                                <span className="text-bolt-elements-textSecondary text-sm ml-2">{prop.type}</span>
                              </div>
                              {prop.description && (
                                <span className="text-xs text-bolt-elements-textSecondary">{prop.description}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Code */}
                    <div>
                      <h4 className="font-medium text-bolt-elements-textPrimary mb-2">Code</h4>
                      <div className="bg-bolt-elements-background-depth-4 rounded-md p-3 overflow-x-auto">
                        <pre className="text-sm text-bolt-elements-textPrimary">
                          <code>{selectedComponent.code}</code>
                        </pre>
                      </div>
                    </div>

                    {/* Usage Example */}
                    {selectedComponent.metadata.usageExample && (
                      <div className="mt-4">
                        <h4 className="font-medium text-bolt-elements-textPrimary mb-2">Usage Example</h4>
                        <div className="bg-bolt-elements-background-depth-4 rounded-md p-3 overflow-x-auto">
                          <pre className="text-sm text-bolt-elements-textPrimary">
                            <code>{selectedComponent.metadata.usageExample}</code>
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-bolt-elements-textSecondary py-12">
                    <div className="text-4xl mb-4">👈</div>
                    <p>Select a component to view details</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-bolt-elements-borderColor p-4 bg-bolt-elements-background-depth-1">
            <div className="flex justify-between items-center text-sm text-bolt-elements-textSecondary">
              <div>Use terminal commands: save-component, list-components, use-component</div>
              <div>Total: {filteredComponents.length} components</div>
            </div>
          </div>
        </div>
      </Dialog>
    </DialogRoot>
  );
};
