import { BaseAgent } from '../base-agent';
import type { AgentContext, AgentExecutionPlan, AgentOutput } from '../types';

/**
 * RefactoringAgent splits large components, enforces naming conventions,
 * and improves code organization and maintainability
 */
export class RefactoringAgent extends BaseAgent {
  readonly name = 'refactoring';
  readonly description = 'Splits large components, enforces naming conventions, and improves code organization';
  readonly version = '1.0.0';
  readonly tags = ['refactoring', 'code-quality', 'organization', 'maintainability'];

  async plan(context: AgentContext): Promise<AgentExecutionPlan> {
    return {
      steps: [
        'Analyze codebase for refactoring opportunities',
        'Identify large components and functions',
        'Check naming convention compliance',
        'Analyze code complexity and dependencies',
        'Generate refactoring recommendations',
        'Create code organization guidelines'
      ],
      estimatedTime: 40,
      dependencies: [],
      expectedOutputs: [
        'Refactoring analysis report',
        'Component splitting recommendations',
        'Naming convention guidelines',
        'Code organization improvements'
      ],
    };
  }

  async execute(context: AgentContext, plan: AgentExecutionPlan): Promise<AgentOutput> {
    const artifacts = [];
    const nextSteps = [];
    const structure = this.analyzeProjectStructure(context.projectFiles);

    try {
      // Analyze codebase for refactoring opportunities
      const refactoringAnalysis = this.analyzeCodeForRefactoring(context.projectFiles);
      
      // Generate refactoring report
      const refactoringReport = this.generateRefactoringReport(refactoringAnalysis, structure);
      artifacts.push(this.createArtifact(
        'documentation',
        'refactoring-analysis.md',
        refactoringReport,
        'Comprehensive code refactoring analysis and recommendations'
      ));

      // Generate naming convention guidelines
      const namingGuidelines = this.generateNamingConventionGuidelines();
      artifacts.push(this.createArtifact(
        'documentation',
        'naming-conventions.md',
        namingGuidelines,
        'Naming convention standards and guidelines'
      ));

      // Generate component splitting examples
      const componentSplitting = this.generateComponentSplittingExamples();
      artifacts.push(this.createArtifact(
        'code',
        'refactoring-examples.tsx',
        componentSplitting,
        'Examples of component splitting and refactoring'
      ));

      // Generate code organization guidelines
      const organizationGuidelines = this.generateCodeOrganizationGuidelines();
      artifacts.push(this.createArtifact(
        'documentation',
        'code-organization.md',
        organizationGuidelines,
        'Code organization and architecture guidelines'
      ));

      nextSteps.push('Review and prioritize refactoring recommendations');
      nextSteps.push('Implement component splitting in phases');
      nextSteps.push('Set up linting rules for naming conventions');
      nextSteps.push('Create refactoring checklist for code reviews');
      nextSteps.push('Plan technical debt reduction sprints');

      return this.createOutput(
        `Analyzed codebase and generated ${artifacts.length} refactoring artifacts`,
        artifacts,
        nextSteps
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error in RefactoringAgent';
      return this.createOutput(
        `RefactoringAgent execution failed: ${errorMessage}`,
        [],
        [],
        false,
        [errorMessage]
      );
    }
  }

  private analyzeCodeForRefactoring(projectFiles: Record<string, string>) {
    const analysis = {
      largeFiles: [],
      complexFunctions: [],
      namingIssues: [],
      duplicateCode: [],
      organizationIssues: [],
      dependencies: [],
    };

    for (const [path, content] of Object.entries(projectFiles)) {
      if (this.isCodeFile(path)) {
        // Analyze file size
        const lines = content.split('\n').length;
        if (lines > 300) {
          analysis.largeFiles.push({ path, lines, suggestion: 'Consider splitting into smaller modules' });
        }

        // Analyze function complexity
        const functions = this.extractFunctions(content);
        functions.forEach(func => {
          if (func.lines > 50) {
            analysis.complexFunctions.push({
              path,
              name: func.name,
              lines: func.lines,
              suggestion: 'Break down into smaller functions'
            });
          }
        });

        // Analyze naming conventions
        const namingIssues = this.checkNamingConventions(content, path);
        analysis.namingIssues.push(...namingIssues);

        // Check for potential code duplication
        const duplicates = this.findDuplicatePatterns(content, path);
        analysis.duplicateCode.push(...duplicates);
      }
    }

    return analysis;
  }

  private isCodeFile(path: string): boolean {
    const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte'];
    return codeExtensions.some(ext => path.endsWith(ext));
  }

  private extractFunctions(content: string) {
    const functions = [];
    const functionRegex = /(?:function\s+(\w+)|const\s+(\w+)\s*=|(\w+)\s*:\s*\()/g;
    let match;

    while ((match = functionRegex.exec(content)) !== null) {
      const name = match[1] || match[2] || match[3];
      const startIndex = match.index;
      const lines = this.countFunctionLines(content, startIndex);
      
      functions.push({ name, lines });
    }

    return functions;
  }

  private countFunctionLines(content: string, startIndex: number): number {
    // Simple heuristic to count function lines
    const lines = content.substring(startIndex).split('\n');
    let braceCount = 0;
    let lineCount = 0;

    for (const line of lines) {
      lineCount++;
      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;
      
      if (braceCount === 0 && lineCount > 1) {
        break;
      }
    }

    return lineCount;
  }

  private checkNamingConventions(content: string, path: string) {
    const issues = [];
    
    // Check camelCase for variables
    const variableRegex = /(?:let|const|var)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
    let match;
    
    while ((match = variableRegex.exec(content)) !== null) {
      const varName = match[1];
      if (!/^[a-z][a-zA-Z0-9]*$/.test(varName) && !varName.startsWith('_')) {
        issues.push({
          path,
          type: 'variable',
          name: varName,
          issue: 'Should use camelCase naming',
          line: this.getLineNumber(content, match.index)
        });
      }
    }

    // Check PascalCase for React components
    if (path.endsWith('.tsx') || path.endsWith('.jsx')) {
      const componentRegex = /(?:function|const)\s+([A-Z][a-zA-Z0-9]*)/g;
      while ((match = componentRegex.exec(content)) !== null) {
        const compName = match[1];
        if (!/^[A-Z][a-zA-Z0-9]*$/.test(compName)) {
          issues.push({
            path,
            type: 'component',
            name: compName,
            issue: 'Components should use PascalCase naming',
            line: this.getLineNumber(content, match.index)
          });
        }
      }
    }

    return issues;
  }

  private findDuplicatePatterns(content: string, path: string) {
    // Simple duplicate detection - could be enhanced
    const duplicates = [];
    const lines = content.split('\n');
    
    // Look for repeated code blocks (simplified)
    for (let i = 0; i < lines.length - 5; i++) {
      const block = lines.slice(i, i + 5).join('\n').trim();
      if (block.length > 50) {
        const regex = new RegExp(block.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const matches = content.match(regex);
        if (matches && matches.length > 1) {
          duplicates.push({
            path,
            block: block.substring(0, 100) + '...',
            occurrences: matches.length,
            suggestion: 'Extract into reusable function or component'
          });
        }
      }
    }

    return duplicates.slice(0, 5); // Limit to prevent spam
  }

  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
  }

  private generateRefactoringReport(analysis: any, structure: any): string {
    return `# Code Refactoring Analysis Report

## Executive Summary
This report identifies refactoring opportunities to improve code maintainability, readability, and organization.

## Project Overview
- **Framework**: ${structure.frameworkType}
- **TypeScript**: ${structure.hasTypeScript ? 'Yes' : 'No'}
- **Total Files Analyzed**: ${Object.keys(analysis).length}

## Key Findings

### 🔴 High Priority Issues

#### Large Files (${analysis.largeFiles.length})
Files with over 300 lines that should be split:
${analysis.largeFiles.map(file => 
  `- **${file.path}** (${file.lines} lines): ${file.suggestion}`
).join('\n')}

#### Complex Functions (${analysis.complexFunctions.length})
Functions with over 50 lines that need refactoring:
${analysis.complexFunctions.map(func => 
  `- **${func.name}** in ${func.path} (${func.lines} lines): ${func.suggestion}`
).join('\n')}

### 🟡 Medium Priority Issues

#### Naming Convention Violations (${analysis.namingIssues.length})
${analysis.namingIssues.slice(0, 10).map(issue => 
  `- **${issue.name}** (${issue.type}) in ${issue.path}:${issue.line} - ${issue.issue}`
).join('\n')}

#### Code Duplication (${analysis.duplicateCode.length})
${analysis.duplicateCode.map(dup => 
  `- **${dup.path}**: ${dup.block} (${dup.occurrences} occurrences) - ${dup.suggestion}`
).join('\n')}

## Refactoring Recommendations

### 1. Component Splitting Strategy
For large React components (>200 lines):
1. **Extract Custom Hooks**: Move state logic to custom hooks
2. **Separate Presentational Components**: Extract UI-only components
3. **Create Sub-components**: Break down complex UI into smaller pieces
4. **Extract Business Logic**: Move data processing to utility functions

### 2. Function Decomposition
For complex functions (>30 lines):
1. **Single Responsibility**: Each function should do one thing
2. **Extract Helper Functions**: Move repeated logic to utilities
3. **Use Pure Functions**: Prefer functions without side effects
4. **Reduce Parameters**: Use objects for multiple parameters

### 3. File Organization
Current issues and improvements:
- Group related functionality into modules
- Separate concerns (UI, logic, data)
- Use index files for clean imports
- Follow consistent folder structure

### 4. Naming Improvements
Implement consistent naming conventions:
- **Variables**: camelCase (\`userName\`, \`isLoggedIn\`)
- **Functions**: camelCase verbs (\`getUserData\`, \`handleClick\`)
- **Components**: PascalCase (\`UserProfile\`, \`NavBar\`)
- **Constants**: UPPER_SNAKE_CASE (\`API_BASE_URL\`)
- **Files**: kebab-case (\`user-profile.tsx\`, \`api-client.ts\`)

## Implementation Plan

### Phase 1: Critical Refactoring (Week 1-2)
- [ ] Split the largest files (>500 lines)
- [ ] Break down most complex functions (>100 lines)
- [ ] Fix critical naming violations

### Phase 2: Structural Improvements (Week 3-4)
- [ ] Reorganize file structure
- [ ] Extract custom hooks
- [ ] Create reusable components

### Phase 3: Code Quality (Week 5-6)
- [ ] Eliminate code duplication
- [ ] Implement consistent naming
- [ ] Add proper TypeScript types

### Phase 4: Documentation & Guidelines (Week 7-8)
- [ ] Update code documentation
- [ ] Create refactoring guidelines
- [ ] Set up automated checks

## Automated Tools Setup

### ESLint Rules
\`\`\`json
{
  "rules": {
    "max-lines": ["error", 300],
    "max-lines-per-function": ["error", 50],
    "complexity": ["error", 10],
    "camelcase": ["error", { "properties": "always" }]
  }
}
\`\`\`

### Pre-commit Hooks
- Lint check for naming conventions
- Complexity analysis
- Duplicate code detection

## Success Metrics
- Reduce average file size by 30%
- Reduce function complexity scores
- Achieve 95% naming convention compliance
- Eliminate duplicate code blocks
- Improve code maintainability index

## Resources
- [Clean Code Principles](https://clean-code-javascript.com/)
- [React Refactoring Guide](https://reactjs.org/docs/thinking-in-react.html)
- [TypeScript Best Practices](https://typescript-eslint.io/rules/)
`;
  }

  private generateNamingConventionGuidelines(): string {
    return `# Naming Convention Guidelines

## Overview
Consistent naming conventions improve code readability, maintainability, and team collaboration.

## General Principles
1. **Be Descriptive**: Names should clearly indicate purpose
2. **Be Consistent**: Follow the same patterns throughout
3. **Avoid Abbreviations**: Use full words when possible
4. **Use Searchable Names**: Avoid single letters or cryptic names

## JavaScript/TypeScript Conventions

### Variables and Functions
Use **camelCase** for variables and functions:
\`\`\`typescript
// ✅ Good
const userName = 'john_doe';
const isLoggedIn = true;
const userAccountBalance = 1000.50;

function getUserData() { }
function calculateTotalPrice() { }
function handleButtonClick() { }

// ❌ Bad
const user_name = 'john_doe';
const IsLoggedIn = true;
const UsrAccBal = 1000.50;

function get_user_data() { }
function Calculate_Total_Price() { }
function HandleButtonClick() { }
\`\`\`

### Constants
Use **UPPER_SNAKE_CASE** for constants:
\`\`\`typescript
// ✅ Good
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_TIMEOUT_MS = 5000;

// ❌ Bad
const apiBaseUrl = 'https://api.example.com';
const maxRetryAttempts = 3;
const defaultTimeoutMs = 5000;
\`\`\`

### Classes and Interfaces
Use **PascalCase** for classes and interfaces:
\`\`\`typescript
// ✅ Good
class UserManager { }
class HttpClient { }
interface ApiResponse { }
interface UserPreferences { }

// ❌ Bad
class userManager { }
class httpClient { }
interface apiResponse { }
interface user_preferences { }
\`\`\`

### Types and Enums
Use **PascalCase** for types and enums:
\`\`\`typescript
// ✅ Good
type UserRole = 'admin' | 'user' | 'guest';
enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered'
}

// ❌ Bad
type userRole = 'admin' | 'user' | 'guest';
enum orderStatus {
  pending = 'pending',
  confirmed = 'confirmed'
}
\`\`\`

## React Conventions

### Components
Use **PascalCase** for React components:
\`\`\`typescript
// ✅ Good
const UserProfile = () => { };
const NavigationBar = () => { };
const ShoppingCartItem = () => { };

// ❌ Bad
const userProfile = () => { };
const navigationBar = () => { };
const shopping_cart_item = () => { };
\`\`\`

### Props and State
Use **camelCase** for props and state:
\`\`\`typescript
// ✅ Good
interface UserProfileProps {
  userName: string;
  isActive: boolean;
  onUserClick: (id: string) => void;
}

const [userData, setUserData] = useState();
const [isLoading, setIsLoading] = useState(false);

// ❌ Bad
interface UserProfileProps {
  user_name: string;
  IsActive: boolean;
  OnUserClick: (id: string) => void;
}

const [user_data, set_user_data] = useState();
const [IsLoading, SetIsLoading] = useState(false);
\`\`\`

### Hooks
Use **camelCase** starting with "use":
\`\`\`typescript
// ✅ Good
const useUserData = () => { };
const useLocalStorage = () => { };
const useApiCall = () => { };

// ❌ Bad
const UseUserData = () => { };
const use_local_storage = () => { };
const hookApiCall = () => { };
\`\`\`

## File and Folder Conventions

### Files
Use **kebab-case** for file names:
\`\`\`
// ✅ Good
user-profile.tsx
api-client.ts
form-validation.ts
shopping-cart.component.tsx

// ❌ Bad
UserProfile.tsx
apiClient.ts
form_validation.ts
ShoppingCart.component.tsx
\`\`\`

### Folders
Use **kebab-case** for folder names:
\`\`\`
// ✅ Good
src/
├── components/
│   ├── user-profile/
│   ├── navigation-bar/
│   └── shopping-cart/
├── api-clients/
├── utils/
└── custom-hooks/

// ❌ Bad
src/
├── Components/
│   ├── UserProfile/
│   ├── Navigation_Bar/
│   └── shoppingcart/
\`\`\`

## API and Database Conventions

### REST Endpoints
Use **kebab-case** for URLs:
\`\`\`
// ✅ Good
GET /api/user-profiles
POST /api/shopping-carts
PUT /api/order-items

// ❌ Bad
GET /api/userProfiles
POST /api/shopping_carts
PUT /api/OrderItems
\`\`\`

### Database Tables and Columns
Use **snake_case** for database naming:
\`\`\`sql
-- ✅ Good
CREATE TABLE user_profiles (
  id SERIAL PRIMARY KEY,
  user_name VARCHAR(255),
  created_at TIMESTAMP,
  is_active BOOLEAN
);

-- ❌ Bad
CREATE TABLE UserProfiles (
  ID SERIAL PRIMARY KEY,
  UserName VARCHAR(255),
  CreatedAt TIMESTAMP,
  IsActive BOOLEAN
);
\`\`\`

## CSS Conventions

### Class Names
Use **BEM methodology** or **kebab-case**:
\`\`\`css
/* ✅ Good - BEM */
.user-profile { }
.user-profile__header { }
.user-profile__header--highlighted { }

/* ✅ Good - kebab-case */
.navigation-bar { }
.shopping-cart-item { }
.form-input-error { }

/* ❌ Bad */
.UserProfile { }
.user_profile { }
.userprofile { }
\`\`\`

### CSS Variables
Use **kebab-case** with prefixes:
\`\`\`css
/* ✅ Good */
:root {
  --color-primary: #007bff;
  --color-secondary: #6c757d;
  --spacing-small: 0.5rem;
  --spacing-large: 2rem;
}

/* ❌ Bad */
:root {
  --colorPrimary: #007bff;
  --Color_Secondary: #6c757d;
  --spacingSmall: 0.5rem;
}
\`\`\`

## Environment Variables
Use **UPPER_SNAKE_CASE** for environment variables:
\`\`\`bash
# ✅ Good
API_BASE_URL=https://api.example.com
DATABASE_CONNECTION_STRING=postgresql://...
JWT_SECRET_KEY=your-secret-key

# ❌ Bad
apiBaseUrl=https://api.example.com
databaseConnectionString=postgresql://...
jwtSecretKey=your-secret-key
\`\`\`

## Boolean Naming

### Use Prefixes
Use clear boolean prefixes:
\`\`\`typescript
// ✅ Good
const isLoading = true;
const hasError = false;
const canEdit = true;
const shouldUpdate = false;
const didComplete = true;

// ❌ Bad
const loading = true;
const error = false;
const edit = true;
const update = false;
const complete = true;
\`\`\`

## Event Handlers
Use "handle" or "on" prefixes:
\`\`\`typescript
// ✅ Good
const handleSubmit = () => { };
const handleUserClick = () => { };
const onFormSubmit = () => { };
const onButtonClick = () => { };

// ❌ Bad
const submit = () => { };
const userClick = () => { };
const formSubmit = () => { };
const clickButton = () => { };
\`\`\`

## Linting Configuration
Set up ESLint rules to enforce naming conventions:
\`\`\`json
{
  "rules": {
    "camelcase": ["error", { "properties": "always" }],
    "@typescript-eslint/naming-convention": [
      "error",
      {
        "selector": "variableLike",
        "format": ["camelCase"]
      },
      {
        "selector": "typeLike",
        "format": ["PascalCase"]
      },
      {
        "selector": "property",
        "format": ["camelCase", "PascalCase"]
      }
    ]
  }
}
\`\`\`

## Tools and Resources
- **ESLint**: Automated naming convention checking
- **Prettier**: Consistent code formatting
- **TypeScript**: Type-safe naming
- **VS Code Extensions**: Auto-completion and validation

Remember: Consistency is more important than perfection. Choose conventions that work for your team and stick to them!
`;
  }

  private generateComponentSplittingExamples(): string {
    return `// refactoring-examples.tsx
// Examples of component splitting and refactoring techniques

import React, { useState, useEffect, useCallback, useMemo } from 'react';

// ❌ BAD: Large, monolithic component
const BadUserDashboard = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 100+ lines of mixed logic, API calls, event handlers, and JSX...
  
  return (
    <div className="dashboard">
      {/* 200+ lines of JSX with complex nested structures */}
    </div>
  );
};

// ✅ GOOD: Split into focused components and custom hooks

// 1. Custom hook for user data management
const useUserData = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, isLoading, error, refetch: fetchUsers };
};

// 2. Custom hook for search and filtering
const useUserFilters = (users) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  const filteredUsers = useMemo(() => {
    let filtered = users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filter === 'all' || user.status === filter;
      return matchesSearch && matchesFilter;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'date') return new Date(b.createdAt) - new Date(a.createdAt);
      return 0;
    });
  }, [users, searchTerm, filter, sortBy]);

  return {
    searchTerm,
    setSearchTerm,
    filter,
    setFilter,
    sortBy,
    setSortBy,
    filteredUsers
  };
};

// 3. Search and filter controls component
const UserFilters = ({ 
  searchTerm, 
  onSearchChange, 
  filter, 
  onFilterChange, 
  sortBy, 
  onSortChange 
}) => (
  <div className="user-filters">
    <div className="search-group">
      <input
        type="text"
        placeholder="Search users..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="search-input"
      />
    </div>
    
    <div className="filter-group">
      <select 
        value={filter} 
        onChange={(e) => onFilterChange(e.target.value)}
        className="filter-select"
      >
        <option value="all">All Users</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>
    
    <div className="sort-group">
      <select 
        value={sortBy} 
        onChange={(e) => onSortChange(e.target.value)}
        className="sort-select"
      >
        <option value="name">Sort by Name</option>
        <option value="date">Sort by Date</option>
      </select>
    </div>
  </div>
);

// 4. Individual user card component
const UserCard = ({ user, onSelect, onEdit, onDelete }) => (
  <div className="user-card" onClick={() => onSelect(user)}>
    <div className="user-avatar">
      <img src={user.avatar} alt={\`\${user.name} avatar\`} />
    </div>
    
    <div className="user-info">
      <h3 className="user-name">{user.name}</h3>
      <p className="user-email">{user.email}</p>
      <span className={\`user-status user-status--\${user.status}\`}>
        {user.status}
      </span>
    </div>
    
    <div className="user-actions">
      <button 
        onClick={(e) => { e.stopPropagation(); onEdit(user); }}
        className="btn btn--secondary"
      >
        Edit
      </button>
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(user.id); }}
        className="btn btn--danger"
      >
        Delete
      </button>
    </div>
  </div>
);

// 5. User list component
const UserList = ({ users, onUserSelect, onUserEdit, onUserDelete, isLoading }) => {
  if (isLoading) {
    return <div className="loading">Loading users...</div>;
  }

  if (users.length === 0) {
    return <div className="empty-state">No users found</div>;
  }

  return (
    <div className="user-list">
      {users.map(user => (
        <UserCard
          key={user.id}
          user={user}
          onSelect={onUserSelect}
          onEdit={onUserEdit}
          onDelete={onUserDelete}
        />
      ))}
    </div>
  );
};

// 6. User details modal component
const UserDetailsModal = ({ user, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState(user || {});

  useEffect(() => {
    setFormData(user || {});
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>User Details</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn--secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn--primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 7. Main dashboard component (now clean and focused)
const GoodUserDashboard = () => {
  const { users, isLoading, error } = useUserData();
  const {
    searchTerm,
    setSearchTerm,
    filter,
    setFilter,
    sortBy,
    setSortBy,
    filteredUsers
  } = useUserFilters(users);
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleUserSelect = useCallback((user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  }, []);

  const handleUserEdit = useCallback((user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  }, []);

  const handleUserDelete = useCallback(async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      // Delete logic here
      console.log('Deleting user:', userId);
    }
  }, []);

  const handleUserSave = useCallback((userData) => {
    // Save logic here
    console.log('Saving user:', userData);
  }, []);

  if (error) {
    return <div className="error">Error loading users: {error}</div>;
  }

  return (
    <div className="user-dashboard">
      <div className="dashboard-header">
        <h1>User Management</h1>
        <button className="btn btn--primary">Add User</button>
      </div>

      <UserFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filter={filter}
        onFilterChange={setFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      <UserList
        users={filteredUsers}
        onUserSelect={handleUserSelect}
        onUserEdit={handleUserEdit}
        onUserDelete={handleUserDelete}
        isLoading={isLoading}
      />

      <UserDetailsModal
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleUserSave}
      />
    </div>
  );
};

// Additional refactoring patterns

// Pattern 1: Extract business logic to services
class UserService {
  static async fetchUsers() {
    const response = await fetch('/api/users');
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  }

  static async createUser(userData) {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!response.ok) throw new Error('Failed to create user');
    return response.json();
  }

  static async updateUser(id, userData) {
    const response = await fetch(\`/api/users/\${id}\`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
  }

  static async deleteUser(id) {
    const response = await fetch(\`/api/users/\${id}\`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete user');
    return true;
  }
}

// Pattern 2: Extract validation logic
const userValidation = {
  validateEmail: (email) => {
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    return emailRegex.test(email);
  },

  validateName: (name) => {
    return name && name.trim().length >= 2;
  },

  validateUser: (user) => {
    const errors = {};
    
    if (!userValidation.validateName(user.name)) {
      errors.name = 'Name must be at least 2 characters';
    }
    
    if (!userValidation.validateEmail(user.email)) {
      errors.email = 'Invalid email format';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};

// Pattern 3: Extract constants and configuration
const USER_CONFIG = {
  ITEMS_PER_PAGE: 20,
  SEARCH_DEBOUNCE_MS: 300,
  CACHE_DURATION_MS: 5 * 60 * 1000, // 5 minutes
  
  STATUS_OPTIONS: [
    { value: 'all', label: 'All Users' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ],
  
  SORT_OPTIONS: [
    { value: 'name', label: 'Sort by Name' },
    { value: 'date', label: 'Sort by Date' },
    { value: 'status', label: 'Sort by Status' }
  ]
};

export {
  GoodUserDashboard,
  UserService,
  userValidation,
  USER_CONFIG
};
`;
  }

  private generateCodeOrganizationGuidelines(): string {
    return `# Code Organization Guidelines

## Overview
Well-organized code improves maintainability, reduces complexity, and makes onboarding easier for new team members.

## Project Structure

### Recommended Folder Structure
\`\`\`
src/
├── components/           # Reusable UI components
│   ├── ui/              # Basic UI elements (Button, Input, etc.)
│   ├── forms/           # Form-specific components
│   ├── layout/          # Layout components (Header, Sidebar, etc.)
│   └── features/        # Feature-specific components
├── pages/               # Application pages/routes
├── hooks/               # Custom React hooks
├── services/            # API services and external integrations
├── utils/               # Utility functions and helpers
├── types/               # TypeScript type definitions
├── constants/           # Application constants
├── contexts/            # React contexts
├── stores/              # State management (Redux, Zustand, etc.)
├── styles/              # Global styles and themes
├── assets/              # Static assets (images, fonts, etc.)
├── config/              # Configuration files
└── tests/               # Test utilities and setup files
\`\`\`

### Component Organization
\`\`\`
components/
├── ui/
│   ├── button/
│   │   ├── index.ts         # Barrel export
│   │   ├── button.tsx       # Component implementation
│   │   ├── button.test.tsx  # Component tests
│   │   ├── button.stories.tsx # Storybook stories
│   │   └── button.styles.css # Component styles
│   └── input/
│       ├── index.ts
│       ├── input.tsx
│       └── input.test.tsx
└── features/
    ├── user-profile/
    │   ├── index.ts
    │   ├── user-profile.tsx
    │   ├── user-profile.test.tsx
    │   ├── hooks/
    │   │   └── use-user-data.ts
    │   └── components/
    │       ├── profile-header.tsx
    │       └── profile-settings.tsx
    └── dashboard/
        ├── index.ts
        ├── dashboard.tsx
        └── components/
            ├── stats-card.tsx
            └── activity-feed.tsx
\`\`\`

## File Organization Principles

### 1. Single Responsibility
Each file should have a single, clear purpose:
\`\`\`typescript
// ✅ Good: Each file has one responsibility
// user-service.ts - API calls
// user-types.ts - Type definitions
// user-utils.ts - Utility functions
// user-component.tsx - UI component

// ❌ Bad: Mixed responsibilities
// user-everything.ts - API calls, types, utils, and components
\`\`\`

### 2. Barrel Exports
Use index files to create clean import paths:
\`\`\`typescript
// components/ui/index.ts
export { Button } from './button';
export { Input } from './input';
export { Modal } from './modal';

// Usage
import { Button, Input, Modal } from '@/components/ui';
\`\`\`

### 3. Feature-Based Organization
Group related files by feature rather than by file type:
\`\`\`
// ✅ Good: Feature-based
features/
├── authentication/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── types/
└── user-management/
    ├── components/
    ├── hooks/
    ├── services/
    └── types/

// ❌ Bad: Type-based
src/
├── components/
│   ├── login-form.tsx
│   ├── user-list.tsx
│   └── user-profile.tsx
├── hooks/
│   ├── use-auth.ts
│   └── use-users.ts
└── services/
    ├── auth-service.ts
    └── user-service.ts
\`\`\`

## Import Organization

### Import Order
Organize imports in this order:
\`\`\`typescript
// 1. External libraries
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import axios from 'axios';

// 2. Internal utilities and services
import { apiClient } from '@/services/api-client';
import { formatDate } from '@/utils/date-helpers';

// 3. Internal components
import { Button } from '@/components/ui';
import { UserCard } from '@/components/features';

// 4. Relative imports
import './component.styles.css';
import { LocalHelper } from './helpers';
\`\`\`

### Path Aliases
Set up path aliases for cleaner imports:
\`\`\`typescript
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/utils/*": ["src/utils/*"],
      "@/services/*": ["src/services/*"],
      "@/types/*": ["src/types/*"]
    }
  }
}

// Usage
import { Button } from '@/components/ui';
import { formatCurrency } from '@/utils/formatters';
import { UserService } from '@/services/user-service';
\`\`\`

## Component Architecture

### Component Hierarchy
\`\`\`
App
├── Layout Components
│   ├── Header
│   ├── Navigation
│   ├── Sidebar
│   └── Footer
├── Page Components
│   ├── HomePage
│   ├── AboutPage
│   └── ContactPage
├── Feature Components
│   ├── UserProfile
│   ├── ShoppingCart
│   └── ProductCatalog
└── UI Components
    ├── Button
    ├── Input
    ├── Modal
    └── Loading
\`\`\`

### Component Composition
Prefer composition over inheritance:
\`\`\`typescript
// ✅ Good: Composition
const UserProfile = ({ user }) => (
  <Card>
    <CardHeader>
      <Avatar src={user.avatar} />
      <UserInfo user={user} />
    </CardHeader>
    <CardBody>
      <UserStats stats={user.stats} />
      <UserActions user={user} />
    </CardBody>
  </Card>
);

// ❌ Bad: Complex monolithic component
const UserProfile = ({ user }) => (
  <div className="user-profile">
    {/* 200+ lines of mixed content */}
  </div>
);
\`\`\`

## State Management Organization

### Context Structure
\`\`\`
contexts/
├── auth-context.tsx        # Authentication state
├── theme-context.tsx       # Theme and UI preferences
├── app-context.tsx         # Global app state
└── providers/
    ├── index.tsx           # Combined providers
    └── providers.tsx       # Individual provider components
\`\`\`

### Store Structure (Redux/Zustand)
\`\`\`
stores/
├── auth/
│   ├── auth-slice.ts       # Auth state slice
│   ├── auth-actions.ts     # Auth actions
│   └── auth-selectors.ts   # Auth selectors
├── users/
│   ├── users-slice.ts
│   ├── users-actions.ts
│   └── users-selectors.ts
└── index.ts                # Store configuration
\`\`\`

## Service Layer Organization

### API Services
\`\`\`typescript
// services/api/
├── base-api.ts             # Base API configuration
├── auth-api.ts             # Authentication endpoints
├── users-api.ts            # User management endpoints
└── products-api.ts         # Product endpoints

// services/
├── auth-service.ts         # Business logic layer
├── notification-service.ts # Notification handling
└── storage-service.ts      # Local storage management
\`\`\`

### Service Pattern
\`\`\`typescript
// base-api.ts
class BaseApiService {
  protected baseURL: string;
  protected headers: Record<string, string>;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  protected async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    // Common request logic
  }
}

// users-api.ts
class UsersApiService extends BaseApiService {
  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/users');
  }

  async createUser(user: CreateUserRequest): Promise<User> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }
}

export const usersApi = new UsersApiService('/api');
\`\`\`

## Utility Organization

### Utility Categories
\`\`\`
utils/
├── formatters/
│   ├── date-formatters.ts
│   ├── currency-formatters.ts
│   └── text-formatters.ts
├── validators/
│   ├── form-validators.ts
│   ├── email-validators.ts
│   └── password-validators.ts
├── helpers/
│   ├── array-helpers.ts
│   ├── object-helpers.ts
│   └── string-helpers.ts
└── constants/
    ├── api-constants.ts
    ├── ui-constants.ts
    └── validation-constants.ts
\`\`\`

### Pure Functions
Keep utilities as pure functions:
\`\`\`typescript
// ✅ Good: Pure function
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

// ❌ Bad: Side effects
let lastFormattedAmount = 0;
export const formatCurrency = (amount: number): string => {
  lastFormattedAmount = amount; // Side effect
  return \`$\${amount.toFixed(2)}\`;
};
\`\`\`

## Testing Organization

### Test Structure
\`\`\`
src/
├── components/
│   └── button/
│       ├── button.tsx
│       └── button.test.tsx
├── utils/
│   └── formatters/
│       ├── currency.ts
│       └── currency.test.ts
└── tests/
    ├── setup.ts            # Test configuration
    ├── utils/              # Test utilities
    │   ├── render-helpers.ts
    │   └── mock-data.ts
    └── __mocks__/          # Mock implementations
        └── api-client.ts
\`\`\`

## Configuration Organization

### Environment Configuration
\`\`\`
config/
├── database.ts             # Database configuration
├── api.ts                  # API configuration
├── auth.ts                 # Authentication configuration
└── index.ts                # Combined configuration
\`\`\`

### Environment Variables
\`\`\`typescript
// config/index.ts
export const config = {
  api: {
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
    timeout: parseInt(process.env.REACT_APP_API_TIMEOUT || '5000'),
  },
  auth: {
    tokenKey: 'auth_token',
    refreshTokenKey: 'refresh_token',
  },
  features: {
    enableAnalytics: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
    enableNotifications: process.env.REACT_APP_ENABLE_NOTIFICATIONS === 'true',
  },
};
\`\`\`

## Documentation Organization

### Documentation Structure
\`\`\`
docs/
├── README.md               # Project overview
├── CONTRIBUTING.md         # Contribution guidelines
├── DEPLOYMENT.md           # Deployment instructions
├── api/                    # API documentation
│   ├── authentication.md
│   └── endpoints.md
└── guides/                 # Development guides
    ├── getting-started.md
    ├── coding-standards.md
    └── testing-guide.md
\`\`\`

## Best Practices Summary

1. **Keep Related Files Together**: Group by feature, not by file type
2. **Use Barrel Exports**: Simplify import paths with index files
3. **Maintain Consistent Structure**: Follow established patterns throughout
4. **Separate Concerns**: Keep UI, logic, and data layers distinct
5. **Use Meaningful Names**: Make file and folder purposes clear
6. **Avoid Deep Nesting**: Keep folder hierarchy shallow and logical
7. **Document Organization**: Maintain clear documentation of structure
8. **Regular Refactoring**: Continuously improve organization as code grows

## Tools for Organization

- **ESLint**: Enforce import order and organization rules
- **Prettier**: Consistent code formatting
- **Path Mapping**: Clean import paths with TypeScript/Webpack
- **Bundle Analyzers**: Understand code organization impact on bundles
- **Documentation Generators**: Automatic documentation from code

Remember: Good organization is not just about following rules—it's about making your code easier to understand, maintain, and extend.
`;
  }
}