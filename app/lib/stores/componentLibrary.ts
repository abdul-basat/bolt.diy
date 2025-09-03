import { atom, map } from 'nanostores';
import type { SavedComponent, ComponentLibraryConfig, ComponentSearchFilter } from '~/types/componentLibrary';

export const componentLibraryConfig = atom<ComponentLibraryConfig>({
  componentsPath: '.bolt/components',
  autoSave: false,
  includeDependencies: true,
});

export const savedComponents = map<Record<string, SavedComponent>>({});

export const componentSearchFilter = atom<ComponentSearchFilter>({});

export const lastGeneratedComponent = atom<SavedComponent | null>(null);

export const isComponentLibraryVisible = atom<boolean>(false);

// Actions
export const setSavedComponents = (components: Record<string, SavedComponent>) => {
  savedComponents.set(components);
};

export const addSavedComponent = (component: SavedComponent) => {
  savedComponents.setKey(component.metadata.name, component);
};

export const removeSavedComponent = (componentName: string) => {
  const current = savedComponents.get();
  const updated = { ...current };
  delete updated[componentName];
  savedComponents.set(updated);
};

export const setLastGeneratedComponent = (component: SavedComponent) => {
  lastGeneratedComponent.set(component);
};

export const updateComponentLibraryConfig = (config: Partial<ComponentLibraryConfig>) => {
  componentLibraryConfig.set({
    ...componentLibraryConfig.get(),
    ...config,
  });
};

export const setComponentSearchFilter = (filter: ComponentSearchFilter) => {
  componentSearchFilter.set(filter);
};

export const toggleComponentLibraryVisibility = () => {
  isComponentLibraryVisible.set(!isComponentLibraryVisible.get());
};
