import { BaseAgent } from '../base-agent';
import type { AgentContext, AgentExecutionPlan, AgentOutput } from '../types';

/**
 * TestingAgent scaffolds unit tests, E2E tests, and testing infrastructure
 * using frameworks like Jest, Playwright, and Vitest
 */
export class TestingAgent extends BaseAgent {
  readonly name = 'testing';
  readonly description = 'Scaffolds unit tests, E2E tests, and testing infrastructure (Jest/Playwright/Vitest)';
  readonly version = '1.0.0';
  readonly tags = ['testing', 'jest', 'playwright', 'vitest', 'e2e', 'unit'];

  async plan(context: AgentContext): Promise<AgentExecutionPlan> {
    const structure = this.analyzeProjectStructure(context.projectFiles);
    
    return {
      steps: [
        'Analyze existing testing setup',
        'Identify components needing tests',
        'Generate unit test scaffolds',
        'Create E2E test scenarios',
        'Set up testing infrastructure',
        'Generate test utilities and helpers'
      ],
      estimatedTime: 50,
      dependencies: [],
      expectedOutputs: [
        'Unit test files',
        'E2E test scenarios',
        'Testing configuration',
        'Test utilities',
        'CI/CD test integration'
      ],
    };
  }

  async execute(context: AgentContext, plan: AgentExecutionPlan): Promise<AgentOutput> {
    const artifacts = [];
    const nextSteps = [];
    const structure = this.analyzeProjectStructure(context.projectFiles);

    try {
      // Generate testing strategy document
      const testingStrategy = this.generateTestingStrategy(structure);
      artifacts.push(this.createArtifact(
        'documentation',
        'testing-strategy.md',
        testingStrategy,
        'Comprehensive testing strategy and guidelines'
      ));

      // Generate unit test examples
      const unitTests = this.generateUnitTestScaffolds(structure);
      artifacts.push(this.createArtifact(
        'test',
        'example.test.ts',
        unitTests,
        'Unit test scaffolds and examples'
      ));

      // Generate E2E test examples
      const e2eTests = this.generateE2ETestScaffolds(structure);
      artifacts.push(this.createArtifact(
        'test',
        'e2e/example.spec.ts',
        e2eTests,
        'End-to-end test scenarios'
      ));

      // Generate test configuration
      const testConfig = this.generateTestConfiguration(structure);
      artifacts.push(this.createArtifact(
        'config',
        'jest.config.js',
        testConfig,
        'Jest testing configuration'
      ));

      // Generate test utilities
      const testUtils = this.generateTestUtilities();
      artifacts.push(this.createArtifact(
        'code',
        'test-utils.ts',
        testUtils,
        'Testing utilities and helpers'
      ));

      nextSteps.push('Install testing dependencies (Jest, @testing-library, Playwright)');
      nextSteps.push('Set up test coverage reporting');
      nextSteps.push('Configure CI/CD test automation');
      nextSteps.push('Add test scripts to package.json');
      nextSteps.push('Set up visual regression testing');

      return this.createOutput(
        `Generated comprehensive testing scaffolds with ${artifacts.length} test artifacts`,
        artifacts,
        nextSteps
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error in TestingAgent';
      return this.createOutput(
        `TestingAgent execution failed: ${errorMessage}`,
        [],
        [],
        false,
        [errorMessage]
      );
    }
  }

  private generateTestingStrategy(structure: any): string {
    return `# Testing Strategy

## Overview
This document outlines the testing strategy for the project, including unit tests, integration tests, and E2E tests.

## Project Analysis
- Framework: ${structure.frameworkType}
- TypeScript: ${structure.hasTypeScript ? 'Yes' : 'No'}
- React: ${structure.hasReact ? 'Yes' : 'No'}
- Existing Tests: ${structure.hasTests ? 'Yes' : 'No'}

## Testing Pyramid

### 1. Unit Tests (70%)
- **Purpose**: Test individual functions, components, and modules in isolation
- **Tools**: Jest, Vitest, @testing-library/react
- **Coverage Target**: 80%+ for utility functions and business logic

### 2. Integration Tests (20%)
- **Purpose**: Test component interactions and API integrations
- **Tools**: Jest with mocked dependencies
- **Coverage**: Critical user workflows and data flows

### 3. E2E Tests (10%)
- **Purpose**: Test complete user journeys
- **Tools**: Playwright, Cypress
- **Coverage**: Happy paths and critical business scenarios

## Testing Standards

### Unit Testing Guidelines
1. **Naming Convention**: \`describe\` → Component/Function name, \`it\` → behavior
2. **AAA Pattern**: Arrange, Act, Assert
3. **Test Isolation**: Each test should be independent
4. **Mock External Dependencies**: APIs, third-party libraries
5. **Test Edge Cases**: Error conditions, boundary values

### Component Testing (React)
\`\`\`javascript
// Good example
describe('Button Component', () => {
  it('should render with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });
});
\`\`\`

### E2E Testing Guidelines
1. **Page Object Model**: Encapsulate page interactions
2. **Data Management**: Use test fixtures and factories
3. **Environment Isolation**: Separate test databases/APIs
4. **Parallel Execution**: Run tests concurrently when possible
5. **Retry Logic**: Handle flaky tests with retries

## Test Organization

### File Structure
\`\`\`
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   └── __snapshots__/
└── utils/
    ├── helpers.ts
    └── helpers.test.ts

tests/
├── e2e/
│   ├── auth.spec.ts
│   ├── dashboard.spec.ts
│   └── fixtures/
├── integration/
│   └── api.test.ts
└── setup/
    ├── jest.setup.ts
    └── test-utils.tsx
\`\`\`

### Naming Conventions
- Unit tests: \`*.test.ts\` or \`*.spec.ts\`
- E2E tests: \`*.e2e.ts\` or \`*.spec.ts\` in e2e folder
- Test utilities: \`test-utils.ts\`, \`helpers.ts\`

## Coverage Requirements
- **Minimum**: 70% overall coverage
- **Critical paths**: 90%+ coverage
- **Utilities/helpers**: 95%+ coverage
- **UI components**: Focus on behavior, not implementation

## CI/CD Integration
1. **Pre-commit hooks**: Run unit tests on changed files
2. **Pull request checks**: Full test suite must pass
3. **Deployment gates**: E2E tests must pass for production
4. **Coverage reporting**: Fail builds if coverage drops

## Testing Tools Setup

### Required Dependencies
\`\`\`json
{
  "devDependencies": {
    "jest": "^29.0.0",
    "@testing-library/react": "^13.0.0",
    "@testing-library/jest-dom": "^5.16.0",
    "@testing-library/user-event": "^14.0.0",
    "playwright": "^1.40.0",
    "msw": "^1.0.0"
  }
}
\`\`\`

### Package.json Scripts
\`\`\`json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
\`\`\`

## Best Practices
1. **Write tests first** (TDD approach when possible)
2. **Keep tests simple** and focused on one behavior
3. **Use descriptive test names** that explain the expected behavior
4. **Mock external dependencies** to ensure test isolation
5. **Test user behavior**, not implementation details
6. **Maintain test data** with factories and fixtures
7. **Review test coverage** regularly and add tests for uncovered code
`;
  }

  private generateUnitTestScaffolds(structure: any): string {
    const isReact = structure.hasReact;
    const isTypeScript = structure.hasTypeScript;
    
    return `// example.test.${isTypeScript ? 'ts' : 'js'}
// Unit test scaffolds and examples

${isReact ? `import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';` : ''}
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

${isReact ? `
// React Component Testing Example
describe('ExampleComponent', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
    jest.clearAllMocks();
  });

  it('should render with default props', () => {
    render(<ExampleComponent />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    
    render(<ExampleComponent onClick={handleClick} />);
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should display loading state', () => {
    render(<ExampleComponent loading={true} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should handle error states', () => {
    const error = new Error('Test error');
    render(<ExampleComponent error={error} />);
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });
});

// Custom Hook Testing Example
describe('useExampleHook', () => {
  it('should return initial state', () => {
    const { result } = renderHook(() => useExampleHook());
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should handle state updates', () => {
    const { result } = renderHook(() => useExampleHook());
    
    act(() => {
      result.current.fetchData();
    });
    
    expect(result.current.loading).toBe(true);
  });
});` : ''}

// Utility Function Testing Example
describe('utilityFunction', () => {
  it('should return correct result for valid input', () => {
    const input = 'test input';
    const expected = 'expected output';
    
    const result = utilityFunction(input);
    
    expect(result).toBe(expected);
  });

  it('should handle edge cases', () => {
    expect(utilityFunction('')).toBe('');
    expect(utilityFunction(null)).toBe(null);
    expect(utilityFunction(undefined)).toBe(undefined);
  });

  it('should throw error for invalid input', () => {
    expect(() => {
      utilityFunction('invalid');
    }).toThrow('Invalid input provided');
  });
});

// Async Function Testing Example
describe('asyncFunction', () => {
  it('should resolve with correct data', async () => {
    const mockData = { id: 1, name: 'Test' };
    
    // Mock API call
    jest.spyOn(api, 'fetchData').mockResolvedValue(mockData);
    
    const result = await asyncFunction();
    
    expect(result).toEqual(mockData);
    expect(api.fetchData).toHaveBeenCalledTimes(1);
  });

  it('should handle API errors', async () => {
    const error = new Error('API Error');
    jest.spyOn(api, 'fetchData').mockRejectedValue(error);
    
    await expect(asyncFunction()).rejects.toThrow('API Error');
  });
});

// Class Testing Example
describe('ExampleClass', () => {
  let instance${isTypeScript ? ': ExampleClass' : ''};

  beforeEach(() => {
    instance = new ExampleClass();
  });

  it('should initialize with default values', () => {
    expect(instance.value).toBe(0);
    expect(instance.isActive).toBe(false);
  });

  it('should update state correctly', () => {
    instance.setValue(10);
    expect(instance.value).toBe(10);
    
    instance.activate();
    expect(instance.isActive).toBe(true);
  });

  it('should handle method chaining', () => {
    const result = instance
      .setValue(5)
      .activate()
      .process();
    
    expect(result).toBe(instance);
    expect(instance.value).toBe(5);
    expect(instance.isActive).toBe(true);
  });
});

// Mock Examples
describe('Testing with Mocks', () => {
  it('should mock external dependencies', () => {
    // Mock module
    jest.mock('./external-module', () => ({
      externalFunction: jest.fn(() => 'mocked result')
    }));
    
    const result = functionUsingExternalModule();
    expect(result).toBe('mocked result');
  });

  it('should mock API calls', async () => {
    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
      })
    );

    const result = await fetchDataFromAPI();
    expect(result.data).toBe('test');
    expect(fetch).toHaveBeenCalledWith('/api/data');
  });
});
`;
  }

  private generateE2ETestScaffolds(structure: any): string {
    return `// e2e/example.spec.ts
// End-to-end test scenarios using Playwright

import { test, expect, Page } from '@playwright/test';

// Page Object Model Example
class HomePage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('/');
  }

  async clickLoginButton() {
    await this.page.click('[data-testid="login-button"]');
  }

  async fillLoginForm(email: string, password: string) {
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="submit-button"]');
  }

  async expectWelcomeMessage() {
    await expect(this.page.locator('[data-testid="welcome-message"]')).toBeVisible();
  }
}

// Authentication Tests
test.describe('Authentication Flow', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.navigate();
  });

  test('should login with valid credentials', async ({ page }) => {
    await homePage.clickLoginButton();
    await homePage.fillLoginForm('user@example.com', 'password123');
    await homePage.expectWelcomeMessage();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await homePage.clickLoginButton();
    await homePage.fillLoginForm('invalid@example.com', 'wrongpassword');
    
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials');
  });

  test('should validate required fields', async ({ page }) => {
    await homePage.clickLoginButton();
    await page.click('[data-testid="submit-button"]');
    
    await expect(page.locator('[data-testid="email-error"]')).toContainText('Email is required');
    await expect(page.locator('[data-testid="password-error"]')).toContainText('Password is required');
  });
});

// Navigation Tests
test.describe('Navigation', () => {
  test('should navigate between pages', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to about page
    await page.click('nav a[href="/about"]');
    await expect(page).toHaveURL('/about');
    await expect(page.locator('h1')).toContainText('About');
    
    // Navigate back to home
    await page.click('nav a[href="/"]');
    await expect(page).toHaveURL('/');
  });

  test('should handle 404 pages', async ({ page }) => {
    await page.goto('/nonexistent-page');
    await expect(page.locator('h1')).toContainText('404');
    await expect(page.locator('[data-testid="not-found-message"]')).toBeVisible();
  });
});

// Form Interaction Tests
test.describe('Form Interactions', () => {
  test('should submit contact form', async ({ page }) => {
    await page.goto('/contact');
    
    await page.fill('[data-testid="name-input"]', 'John Doe');
    await page.fill('[data-testid="email-input"]', 'john@example.com');
    await page.fill('[data-testid="message-textarea"]', 'This is a test message');
    
    await page.click('[data-testid="submit-button"]');
    
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Message sent successfully');
  });

  test('should handle file uploads', async ({ page }) => {
    await page.goto('/upload');
    
    // Upload a file
    const fileInput = page.locator('[data-testid="file-input"]');
    await fileInput.setInputFiles('tests/fixtures/test-file.pdf');
    
    await page.click('[data-testid="upload-button"]');
    
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();
  });
});

// API Integration Tests
test.describe('API Integration', () => {
  test('should load data from API', async ({ page }) => {
    // Mock API response
    await page.route('/api/users', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: 'John Doe', email: 'john@example.com' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
        ])
      });
    });

    await page.goto('/users');
    
    await expect(page.locator('[data-testid="user-item"]')).toHaveCount(2);
    await expect(page.locator('[data-testid="user-item"]').first()).toContainText('John Doe');
  });

  test('should handle API errors', async ({ page }) => {
    // Mock API error
    await page.route('/api/users', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });

    await page.goto('/users');
    
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Failed to load users');
  });
});

// Performance Tests
test.describe('Performance', () => {
  test('should load page within performance budget', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000); // 3 seconds max
  });

  test('should have good Core Web Vitals', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Check if page is interactive
    await expect(page.locator('button').first()).toBeEnabled();
  });
});

// Accessibility Tests
test.describe('Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    
    // Check for ARIA labels on interactive elements
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();
      
      expect(ariaLabel || text).toBeTruthy();
    }
  });
});
`;
  }

  private generateTestConfiguration(structure: any): string {
    const isTypeScript = structure.hasTypeScript;
    const isReact = structure.hasReact;
    
    return `// jest.config.js
// Jest testing configuration

module.exports = {
  // Test environment
  testEnvironment: '${isReact ? 'jsdom' : 'node'}',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.${isTypeScript ? 'ts' : 'js'}'],
  
  // Module paths
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^~/(.*)$': '<rootDir>/src/$1',
    '\\\\.(css|less|scss)$': 'identity-obj-proxy',
    '\\\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/tests/__mocks__/fileMock.js',
  },
  
  // File extensions
  moduleFileExtensions: [${isTypeScript ? "'ts', 'tsx', " : ""}'js', 'jsx', 'json'],
  
  // Transform files
  transform: {
    ${isTypeScript ? `'^.+\\\\.(ts|tsx)$': 'ts-jest',` : ''}
    '^.+\\\\.(js|jsx)$': 'babel-jest',
  },
  
  // Test patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/tests/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/build/',
    '<rootDir>/dist/',
    '<rootDir>/tests/e2e/',
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.{js,jsx,ts,tsx}',
    '!src/serviceWorker.{js,ts}',
    '!src/test-utils.{js,jsx,ts,tsx}',
  ],
  
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Globals (for TypeScript)
  ${isTypeScript ? `globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },` : ''}
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Watch plugins for better development experience
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
};
`;
  }

  private generateTestUtilities(): string {
    return `// test-utils.ts
// Testing utilities and helpers

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Test providers wrapper
interface ProvidersProps {
  children: ReactNode;
}

const TestProviders = ({ children }: ProvidersProps) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Custom render function
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: TestProviders, ...options });

// Test factories
export const createMockUser = (overrides = {}) => ({
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  role: 'user',
  ...overrides,
});

export const createMockPost = (overrides = {}) => ({
  id: 1,
  title: 'Test Post',
  content: 'This is a test post content',
  authorId: 1,
  createdAt: new Date().toISOString(),
  ...overrides,
});

// Mock API responses
export const mockApiResponse = (data: any, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
  text: async () => JSON.stringify(data),
});

// Custom matchers
export const expectToBeVisible = (element: any) => {
  expect(element).toBeInTheDocument();
  expect(element).toBeVisible();
};

export const expectToHaveAccessibleName = (element: any, name: string) => {
  expect(element).toHaveAccessibleName(name);
};

// Mock implementations
export const mockLocalStorage = () => {
  const storage: { [key: string]: string } = {};
  
  return {
    getItem: jest.fn((key: string) => storage[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete storage[key];
    }),
    clear: jest.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key]);
    }),
  };
};

export const mockFetch = (mockResponse: any) => {
  global.fetch = jest.fn(() =>
    Promise.resolve(mockApiResponse(mockResponse))
  );
};

// Wait utilities
export const waitForApiCall = () => new Promise(resolve => setTimeout(resolve, 0));

export const waitForRerender = () => new Promise(resolve => setTimeout(resolve, 10));

// Export everything
export * from '@testing-library/react';
export { customRender as render };
export { default as userEvent } from '@testing-library/user-event';
`;
  }
}