export interface DatabaseConfig {
  type: 'postgres' | 'sqlite';
  host?: string;
  port?: number;
  database: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  filename?: string; // For SQLite
}

export interface ColumnDefinition {
  name: string;
  type: string;
  nullable?: boolean;
  primaryKey?: boolean;
  unique?: boolean;
  defaultValue?: any;
  references?: {
    table: string;
    column: string;
  };
}

export interface TableDefinition {
  name: string;
  columns: ColumnDefinition[];
  indexes?: {
    name: string;
    columns: string[];
    unique?: boolean;
  }[];
}

export interface SchemaDefinition {
  tables: TableDefinition[];
  version: string;
  description?: string;
}

export interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  table: string;
  operation: 'list' | 'create' | 'read' | 'update' | 'delete';
  middleware?: string[];
}

export interface APIScaffold {
  type: 'rest' | 'graphql';
  endpoints: APIEndpoint[];
  authentication?: {
    type: 'jwt' | 'session' | 'api-key';
    middleware: string;
  };
  validation?: boolean;
  documentation?: boolean;
}

export interface DatabaseAgentResult {
  success: boolean;
  data?: any;
  error?: string;
  files?: Array<{
    path: string;
    content: string;
  }>;
}