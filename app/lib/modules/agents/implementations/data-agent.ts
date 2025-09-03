import { BaseAgent } from '../base-agent';
import type { AgentContext, AgentExecutionPlan, AgentOutput } from '../types';

/**
 * DataAgent handles database schema design, CRUD API scaffolding,
 * and database integration setup
 */
export class DataAgent extends BaseAgent {
  readonly name = 'data';
  readonly description = 'Handles database schema design, CRUD API scaffolding, and DB integration';
  readonly version = '1.0.0';
  readonly tags = ['database', 'schema', 'api', 'crud', 'orm', 'sql'];

  async plan(context: AgentContext): Promise<AgentExecutionPlan> {
    return {
      steps: [
        'Analyze data requirements from project context',
        'Design database schema and relationships',
        'Generate migration files',
        'Create ORM models and entities',
        'Scaffold CRUD API endpoints',
        'Set up database connection and configuration'
      ],
      estimatedTime: 55,
      dependencies: [],
      expectedOutputs: [
        'Database schema design',
        'Migration files',
        'ORM models',
        'CRUD API endpoints',
        'Database configuration'
      ],
    };
  }

  async execute(context: AgentContext, plan: AgentExecutionPlan): Promise<AgentOutput> {
    const artifacts = [];
    const nextSteps = [];

    try {
      // TODO: Implement data analysis and schema generation
      
      const schemaDesign = this.generateSchemaDesign();
      artifacts.push(this.createArtifact(
        'documentation',
        'database-schema.md',
        schemaDesign,
        'Database schema design and relationships'
      ));

      const migrations = this.generateMigrations();
      artifacts.push(this.createArtifact(
        'code',
        'migrations/001_initial.sql',
        migrations,
        'Initial database migration'
      ));

      const ormModels = this.generateOrmModels();
      artifacts.push(this.createArtifact(
        'code',
        'models/user.ts',
        ormModels,
        'ORM model definitions'
      ));

      const crudApi = this.generateCrudApiScaffold();
      artifacts.push(this.createArtifact(
        'code',
        'api/users.ts',
        crudApi,
        'CRUD API endpoint scaffolds'
      ));

      const dbConfig = this.generateDatabaseConfig();
      artifacts.push(this.createArtifact(
        'config',
        'database.config.ts',
        dbConfig,
        'Database connection configuration'
      ));

      nextSteps.push('Review and customize database schema');
      nextSteps.push('Set up database migrations in CI/CD');
      nextSteps.push('Configure database environment variables');
      nextSteps.push('Add data validation and sanitization');
      nextSteps.push('Implement database connection pooling');

      return this.createOutput(
        `Generated database architecture with ${artifacts.length} data artifacts`,
        artifacts,
        nextSteps
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error in DataAgent';
      return this.createOutput(
        `DataAgent execution failed: ${errorMessage}`,
        [],
        [],
        false,
        [errorMessage]
      );
    }
  }

  private generateSchemaDesign(): string {
    return `# Database Schema Design

## Overview
This document outlines the database schema, relationships, and design decisions.

## Entities and Relationships

### Users Table
\`\`\`sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

### Posts Table
\`\`\`sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  slug VARCHAR(255) UNIQUE,
  status VARCHAR(20) DEFAULT 'draft',
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

### Comments Table
\`\`\`sql
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

### Tags Table
\`\`\`sql
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

### Post Tags Junction Table
\`\`\`sql
CREATE TABLE post_tags (
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);
\`\`\`

## Indexes
\`\`\`sql
-- Performance indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_published_at ON posts(published_at);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_tags_slug ON tags(slug);

-- Full-text search indexes
CREATE INDEX idx_posts_title_content ON posts USING gin(to_tsvector('english', title || ' ' || content));
\`\`\`

## Relationships
- Users can have many Posts (1:N)
- Posts can have many Comments (1:N)
- Comments can have nested Comments (self-referencing)
- Posts can have many Tags through PostTags (N:M)
- Users can have many Comments (1:N)

## Design Decisions

### Normalization
- 3NF normalized to reduce data redundancy
- Junction table for many-to-many relationships
- Separate tables for different entity types

### Data Types
- SERIAL for auto-incrementing primary keys
- VARCHAR with appropriate limits for text fields
- TEXT for long content
- TIMESTAMP for date/time tracking
- BOOLEAN for flags

### Constraints
- NOT NULL for required fields
- UNIQUE constraints for email, username, slug
- Foreign key constraints with CASCADE delete
- Default values for timestamps and flags

### Performance Considerations
- Indexes on frequently queried columns
- Full-text search capabilities
- Efficient junction table for tags

## Future Enhancements
- Add audit trail tables
- Implement soft deletes
- Add caching layer
- Consider partitioning for large datasets
- Add database-level security policies
`;
  }

  private generateMigrations(): string {
    return `-- migrations/001_initial.sql
-- Initial database schema migration

-- Enable UUID extension if needed
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Posts table
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    slug VARCHAR(255) UNIQUE,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Comments table
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tags table
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Post tags junction table
CREATE TABLE post_tags (
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_published_at ON posts(published_at);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_tags_slug ON tags(slug);

-- Full-text search index
CREATE INDEX idx_posts_search ON posts USING gin(to_tsvector('english', title || ' ' || COALESCE(content, '')));

-- Trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional)
INSERT INTO users (email, username, password_hash, first_name, last_name, is_verified) VALUES
('admin@example.com', 'admin', '$2b$10$hash...', 'Admin', 'User', true),
('user@example.com', 'user', '$2b$10$hash...', 'Regular', 'User', true);

INSERT INTO tags (name, slug, description) VALUES
('Technology', 'technology', 'Posts about technology and programming'),
('Tutorial', 'tutorial', 'Step-by-step guides and tutorials'),
('News', 'news', 'Latest news and updates');
`;
  }

  private generateOrmModels(): string {
    return `// models/user.ts
// ORM model definitions using TypeORM/Prisma patterns

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Post } from './post';
import { Comment } from './comment';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column({ unique: true, length: 50 })
  username!: string;

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Column({ name: 'first_name', nullable: true, length: 100 })
  firstName?: string;

  @Column({ name: 'last_name', nullable: true, length: 100 })
  lastName?: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl?: string;

  @Column({ name: 'is_verified', default: false })
  isVerified!: boolean;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relationships
  @OneToMany(() => Post, post => post.user)
  posts!: Post[];

  @OneToMany(() => Comment, comment => comment.user)
  comments!: Comment[];

  // Computed properties
  get fullName(): string {
    return [this.firstName, this.lastName].filter(Boolean).join(' ') || this.username;
  }

  // Instance methods
  toJSON() {
    const { passwordHash, ...publicData } = this;
    return publicData;
  }

  static findByEmail(email: string) {
    return this.findOne({ where: { email } });
  }

  static findByUsername(username: string) {
    return this.findOne({ where: { username } });
  }
}

// models/post.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { User } from './user';
import { Comment } from './comment';
import { Tag } from './tag';

export enum PostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id' })
  userId!: number;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  content?: string;

  @Column({ unique: true, nullable: true })
  slug?: string;

  @Column({ type: 'enum', enum: PostStatus, default: PostStatus.DRAFT })
  status!: PostStatus;

  @Column({ name: 'published_at', nullable: true })
  publishedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relationships
  @ManyToOne(() => User, user => user.posts)
  user!: User;

  @OneToMany(() => Comment, comment => comment.post)
  comments!: Comment[];

  @ManyToMany(() => Tag, tag => tag.posts)
  @JoinTable({
    name: 'post_tags',
    joinColumn: { name: 'post_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' }
  })
  tags!: Tag[];

  // Instance methods
  publish() {
    this.status = PostStatus.PUBLISHED;
    this.publishedAt = new Date();
  }

  archive() {
    this.status = PostStatus.ARCHIVED;
  }

  generateSlug() {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  static findPublished() {
    return this.find({
      where: { status: PostStatus.PUBLISHED },
      order: { publishedAt: 'DESC' }
    });
  }

  static findBySlug(slug: string) {
    return this.findOne({ where: { slug } });
  }
}

// models/comment.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user';
import { Post } from './post';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'post_id' })
  postId!: number;

  @Column({ name: 'user_id' })
  userId!: number;

  @Column({ name: 'parent_id', nullable: true })
  parentId?: number;

  @Column({ type: 'text' })
  content!: string;

  @Column({ name: 'is_approved', default: false })
  isApproved!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relationships
  @ManyToOne(() => Post, post => post.comments)
  post!: Post;

  @ManyToOne(() => User, user => user.comments)
  user!: User;

  @ManyToOne(() => Comment, { nullable: true })
  parent?: Comment;

  // Instance methods
  approve() {
    this.isApproved = true;
  }

  static findApproved() {
    return this.find({
      where: { isApproved: true },
      order: { createdAt: 'ASC' }
    });
  }
}

// models/tag.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToMany } from 'typeorm';
import { Post } from './post';

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 100 })
  name!: string;

  @Column({ unique: true, length: 100 })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Relationships
  @ManyToMany(() => Post, post => post.tags)
  posts!: Post[];

  // Instance methods
  generateSlug() {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  static findBySlug(slug: string) {
    return this.findOne({ where: { slug } });
  }

  static findPopular(limit = 10) {
    return this.createQueryBuilder('tag')
      .leftJoin('tag.posts', 'post')
      .addSelect('COUNT(post.id) as post_count')
      .groupBy('tag.id')
      .orderBy('post_count', 'DESC')
      .limit(limit)
      .getMany();
  }
}

// Export all models
export { User, Post, Comment, Tag, PostStatus };
`;
  }

  private generateCrudApiScaffold(): string {
    return `// api/users.ts
// CRUD API endpoint scaffolds

import { Request, Response } from 'express';
import { AppDataSource } from '../database/connection';
import { User } from '../models/user';
import { validateCreateUser, validateUpdateUser } from '../validators/user';
import { hashPassword, comparePassword } from '../utils/auth';

const userRepository = AppDataSource.getRepository(User);

// GET /api/users
export const getUsers = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    const queryBuilder = userRepository.createQueryBuilder('user');
    
    if (search) {
      queryBuilder.where(
        'user.username ILIKE :search OR user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search',
        { search: \`%\${search}%\` }
      );
    }
    
    const [users, total] = await queryBuilder
      .skip(skip)
      .take(Number(limit))
      .orderBy('user.createdAt', 'DESC')
      .getManyAndCount();
    
    res.json({
      data: users.map(user => user.toJSON()),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/users/:id
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const user = await userRepository.findOne({
      where: { id: Number(id) },
      relations: ['posts', 'comments']
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ data: user.toJSON() });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/users
export const createUser = async (req: Request, res: Response) => {
  try {
    const validation = validateCreateUser(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: validation.errors 
      });
    }
    
    const { email, username, password, firstName, lastName } = validation.data;
    
    // Check if user already exists
    const existingUser = await userRepository.findOne({
      where: [{ email }, { username }]
    });
    
    if (existingUser) {
      return res.status(409).json({ 
        error: 'User already exists with this email or username' 
      });
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Create user
    const user = userRepository.create({
      email,
      username,
      passwordHash,
      firstName,
      lastName
    });
    
    await userRepository.save(user);
    
    res.status(201).json({ 
      data: user.toJSON(),
      message: 'User created successfully' 
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/users/:id
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const validation = validateUpdateUser(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: validation.errors 
      });
    }
    
    const user = await userRepository.findOne({
      where: { id: Number(id) }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update user properties
    Object.assign(user, validation.data);
    
    await userRepository.save(user);
    
    res.json({ 
      data: user.toJSON(),
      message: 'User updated successfully' 
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/users/:id
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const user = await userRepository.findOne({
      where: { id: Number(id) }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await userRepository.remove(user);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PATCH /api/users/:id/activate
export const activateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const user = await userRepository.findOne({
      where: { id: Number(id) }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    user.isActive = true;
    await userRepository.save(user);
    
    res.json({ 
      data: user.toJSON(),
      message: 'User activated successfully' 
    });
  } catch (error) {
    console.error('Error activating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PATCH /api/users/:id/deactivate
export const deactivateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const user = await userRepository.findOne({
      where: { id: Number(id) }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    user.isActive = false;
    await userRepository.save(user);
    
    res.json({ 
      data: user.toJSON(),
      message: 'User deactivated successfully' 
    });
  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Export route handlers
export const userRoutes = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  activateUser,
  deactivateUser
};
`;
  }

  private generateDatabaseConfig(): string {
    return `// database.config.ts
// Database connection configuration

import { DataSource } from 'typeorm';
import { User, Post, Comment, Tag } from '../models';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'myapp',
  
  // SSL configuration for production
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  
  // Entity configuration
  entities: [User, Post, Comment, Tag],
  
  // Migration configuration
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'migrations',
  
  // Development settings
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  
  // Connection pool settings
  extra: {
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
  },
});

// Connection utilities
export const connectDatabase = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Database connected successfully');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

export const disconnectDatabase = async () => {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('✅ Database disconnected successfully');
    }
  } catch (error) {
    console.error('❌ Database disconnection failed:', error);
  }
};

// Health check
export const checkDatabaseHealth = async () => {
  try {
    await AppDataSource.query('SELECT 1');
    return { status: 'healthy', timestamp: new Date() };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date() 
    };
  }
};

// Transaction helper
export const runInTransaction = async <T>(
  callback: (manager: any) => Promise<T>
): Promise<T> => {
  return AppDataSource.transaction(callback);
};

// Alternative configuration for different databases
export const configs = {
  postgres: {
    type: 'postgres' as const,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  
  mysql: {
    type: 'mysql' as const,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  
  sqlite: {
    type: 'sqlite' as const,
    database: process.env.DB_PATH || './database.sqlite',
  },
};

// Export configured data source
export default AppDataSource;
`;
  }
}