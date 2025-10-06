export interface Plugin {
  name: string;
  version: string;
  description: string;
  author?: string;
  enabled: boolean;
  hooks: PluginHook[];
  config?: Record<string, any>;
}

export interface PluginHook {
  event: string;
  handler: string; // Function name or path to handler
  priority?: number;
  async?: boolean;
}

export interface PluginEvent {
  type: string;
  data: any;
  context?: Record<string, any>;
}

export interface PluginResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface PluginManager {
  loadPlugins(): Promise<void>;
  enablePlugin(name: string): Promise<void>;
  disablePlugin(name: string): Promise<void>;
  executeHook(event: string, data: any, context?: Record<string, any>): Promise<PluginResult[]>;
  getPlugins(): Plugin[];
  getPlugin(name: string): Plugin | null;
}