import type { SchemaDefinition, TableDefinition, ColumnDefinition } from './types';

export class SchemaGenerator {
  generatePostgresSchema(schema: SchemaDefinition): string {
    let sql = `-- Generated PostgreSQL Schema v${schema.version}\n`;
    if (schema.description) {
      sql += `-- ${schema.description}\n`;
    }
    sql += `\n`;

    for (const table of schema.tables) {
      sql += this.generatePostgresTable(table);
      sql += `\n`;
    }

    return sql;
  }

  generateSQLiteSchema(schema: SchemaDefinition): string {
    let sql = `-- Generated SQLite Schema v${schema.version}\n`;
    if (schema.description) {
      sql += `-- ${schema.description}\n`;
    }
    sql += `\n`;

    for (const table of schema.tables) {
      sql += this.generateSQLiteTable(table);
      sql += `\n`;
    }

    return sql;
  }

  private generatePostgresTable(table: TableDefinition): string {
    let sql = `CREATE TABLE ${table.name} (\n`;
    
    const columnDefs = table.columns.map(col => {
      return `  ${this.generatePostgresColumn(col)}`;
    });
    
    sql += columnDefs.join(',\n');
    sql += `\n);\n`;

    // Generate indexes
    if (table.indexes) {
      for (const index of table.indexes) {
        sql += this.generatePostgresIndex(table.name, index);
      }
    }

    return sql;
  }

  private generateSQLiteTable(table: TableDefinition): string {
    let sql = `CREATE TABLE ${table.name} (\n`;
    
    const columnDefs = table.columns.map(col => {
      return `  ${this.generateSQLiteColumn(col)}`;
    });
    
    sql += columnDefs.join(',\n');
    sql += `\n);\n`;

    // Generate indexes
    if (table.indexes) {
      for (const index of table.indexes) {
        sql += this.generateSQLiteIndex(table.name, index);
      }
    }

    return sql;
  }

  private generatePostgresColumn(column: ColumnDefinition): string {
    let def = `${column.name} ${this.mapPostgresType(column.type)}`;
    
    if (column.primaryKey) {
      def += ` PRIMARY KEY`;
    }
    
    if (!column.nullable && !column.primaryKey) {
      def += ` NOT NULL`;
    }
    
    if (column.unique && !column.primaryKey) {
      def += ` UNIQUE`;
    }
    
    if (column.defaultValue !== undefined) {
      def += ` DEFAULT ${this.formatDefaultValue(column.defaultValue)}`;
    }
    
    if (column.references) {
      def += ` REFERENCES ${column.references.table}(${column.references.column})`;
    }
    
    return def;
  }

  private generateSQLiteColumn(column: ColumnDefinition): string {
    let def = `${column.name} ${this.mapSQLiteType(column.type)}`;
    
    if (column.primaryKey) {
      def += ` PRIMARY KEY`;
    }
    
    if (!column.nullable && !column.primaryKey) {
      def += ` NOT NULL`;
    }
    
    if (column.unique && !column.primaryKey) {
      def += ` UNIQUE`;
    }
    
    if (column.defaultValue !== undefined) {
      def += ` DEFAULT ${this.formatDefaultValue(column.defaultValue)}`;
    }
    
    if (column.references) {
      def += ` REFERENCES ${column.references.table}(${column.references.column})`;
    }
    
    return def;
  }

  private generatePostgresIndex(tableName: string, index: any): string {
    const uniqueStr = index.unique ? 'UNIQUE ' : '';
    const columnsStr = index.columns.join(', ');
    return `CREATE ${uniqueStr}INDEX ${index.name} ON ${tableName} (${columnsStr});\n`;
  }

  private generateSQLiteIndex(tableName: string, index: any): string {
    const uniqueStr = index.unique ? 'UNIQUE ' : '';
    const columnsStr = index.columns.join(', ');
    return `CREATE ${uniqueStr}INDEX ${index.name} ON ${tableName} (${columnsStr});\n`;
  }

  private mapPostgresType(type: string): string {
    const typeMap: Record<string, string> = {
      'string': 'VARCHAR(255)',
      'text': 'TEXT',
      'integer': 'INTEGER',
      'bigint': 'BIGINT',
      'float': 'REAL',
      'double': 'DOUBLE PRECISION',
      'decimal': 'DECIMAL',
      'boolean': 'BOOLEAN',
      'date': 'DATE',
      'datetime': 'TIMESTAMP',
      'timestamp': 'TIMESTAMP',
      'json': 'JSONB',
      'uuid': 'UUID',
      'binary': 'BYTEA',
    };
    
    return typeMap[type] || type;
  }

  private mapSQLiteType(type: string): string {
    const typeMap: Record<string, string> = {
      'string': 'TEXT',
      'text': 'TEXT',
      'integer': 'INTEGER',
      'bigint': 'INTEGER',
      'float': 'REAL',
      'double': 'REAL',
      'decimal': 'REAL',
      'boolean': 'INTEGER',
      'date': 'TEXT',
      'datetime': 'TEXT',
      'timestamp': 'TEXT',
      'json': 'TEXT',
      'uuid': 'TEXT',
      'binary': 'BLOB',
    };
    
    return typeMap[type] || type;
  }

  private formatDefaultValue(value: any): string {
    if (typeof value === 'string') {
      return `'${value}'`;
    }
    if (typeof value === 'boolean') {
      return value ? 'TRUE' : 'FALSE';
    }
    if (value === null) {
      return 'NULL';
    }
    return String(value);
  }

  generateMigration(
    fromSchema: SchemaDefinition,
    toSchema: SchemaDefinition,
    dbType: 'postgres' | 'sqlite'
  ): string {
    let migration = `-- Migration from v${fromSchema.version} to v${toSchema.version}\n\n`;
    
    // Simple implementation - just drop and recreate
    // In production, you'd want more sophisticated diffing
    const generator = dbType === 'postgres' 
      ? (schema: SchemaDefinition) => this.generatePostgresSchema(schema)
      : (schema: SchemaDefinition) => this.generateSQLiteSchema(schema);
    
    migration += `-- Drop existing tables\n`;
    for (const table of fromSchema.tables.reverse()) {
      migration += `DROP TABLE IF EXISTS ${table.name};\n`;
    }
    
    migration += `\n-- Create new schema\n`;
    migration += generator(toSchema);
    
    return migration;
  }
}