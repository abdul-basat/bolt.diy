export interface ComponentMetadata {
  name: string;
  description?: string;
  tags: string[];
  props: ComponentProp[];
  usageExample: string;
  createdAt: Date;
  updatedAt: Date;
  framework: 'react' | 'react-native' | 'vue' | 'angular';
  category: string;
}

export interface ComponentProp {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  defaultValue?: string;
}

export interface SavedComponent {
  metadata: ComponentMetadata;
  code: string;
  filePath: string;
}

export interface ComponentLibraryConfig {
  componentsPath: string;
  autoSave: boolean;
  includeDependencies: boolean;
}

export interface ComponentSearchFilter {
  tags?: string[];
  framework?: string;
  category?: string;
  name?: string;
}

export interface ComponentUsageStats {
  componentName: string;
  usageCount: number;
  lastUsed: Date;
}
