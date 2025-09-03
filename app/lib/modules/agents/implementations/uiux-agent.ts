import { BaseAgent } from '../base-agent';
import type { AgentContext, AgentExecutionPlan, AgentOutput } from '../types';

/**
 * UIUXAgent focuses on improving visual design consistency,
 * user experience patterns, and interface quality
 */
export class UIUXAgent extends BaseAgent {
  readonly name = 'uiux';
  readonly description = 'Improves visual design consistency, UX patterns, and accessibility standards';
  readonly version = '1.0.0';
  readonly tags = ['ui', 'ux', 'design', 'accessibility', 'frontend'];

  async plan(context: AgentContext): Promise<AgentExecutionPlan> {
    const structure = this.analyzeProjectStructure(context.projectFiles);
    const steps: string[] = [];
    const dependencies: string[] = [];
    const expectedOutputs: string[] = [];

    // Analyze current UI/UX state
    steps.push('Analyze existing components and styling');
    steps.push('Identify design inconsistencies');
    steps.push('Review color scheme and typography');
    
    if (structure.hasReact) {
      steps.push('Analyze React component patterns');
      expectedOutputs.push('Component library improvements');
    }

    if (structure.hasCss) {
      steps.push('Analyze CSS architecture and organization');
      expectedOutputs.push('CSS/SCSS optimizations');
    }

    steps.push('Generate design system recommendations');
    steps.push('Create component standardization guidelines');
    
    expectedOutputs.push('Design system documentation');
    expectedOutputs.push('UI/UX improvement suggestions');

    return {
      steps,
      estimatedTime: 45,
      dependencies,
      expectedOutputs,
    };
  }

  async execute(context: AgentContext, plan: AgentExecutionPlan): Promise<AgentOutput> {
    const artifacts = [];
    const nextSteps = [];
    const structure = this.analyzeProjectStructure(context.projectFiles);

    try {
      // Analyze existing components
      const componentAnalysis = this.analyzeComponents(context.projectFiles);
      
      // Generate design system suggestions
      const designSystem = this.generateDesignSystemGuidelines(structure, componentAnalysis);
      artifacts.push(this.createArtifact(
        'documentation',
        'design-system.md',
        designSystem,
        'Design system guidelines and standards'
      ));

      // Generate CSS improvements if CSS files exist
      if (structure.hasCss) {
        const cssImprovements = this.generateCSSImprovements(context.projectFiles);
        artifacts.push(this.createArtifact(
          'config',
          'css-improvements.md',
          cssImprovements,
          'CSS architecture and organization improvements'
        ));
      }

      // Generate component library suggestions
      if (structure.hasReact) {
        const componentLibrary = this.generateComponentLibraryGuidelines();
        artifacts.push(this.createArtifact(
          'documentation',
          'component-library.md',
          componentLibrary,
          'Component library structure and guidelines'
        ));
      }

      // Generate accessibility checklist
      const a11yChecklist = this.generateAccessibilityChecklist();
      artifacts.push(this.createArtifact(
        'documentation',
        'accessibility-checklist.md',
        a11yChecklist,
        'Accessibility guidelines and checklist'
      ));

      nextSteps.push('Implement design system tokens');
      nextSteps.push('Create reusable component library');
      nextSteps.push('Run accessibility audit with tools like axe-core');
      nextSteps.push('Set up design review process');

      return this.createOutput(
        `Analyzed UI/UX patterns and generated ${artifacts.length} design improvement artifacts`,
        artifacts,
        nextSteps
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error in UIUXAgent';
      return this.createOutput(
        `UIUXAgent execution failed: ${errorMessage}`,
        [],
        [],
        false,
        [errorMessage]
      );
    }
  }

  private analyzeComponents(projectFiles: Record<string, string>) {
    const components = [];
    const patterns = [];

    for (const [path, content] of Object.entries(projectFiles)) {
      if (path.endsWith('.tsx') || path.endsWith('.jsx')) {
        // Basic component analysis
        const hasStyledComponents = content.includes('styled-components');
        const hasTailwind = content.includes('className=');
        const hasInlineStyles = content.includes('style={{');
        
        components.push({
          path,
          hasStyledComponents,
          hasTailwind,
          hasInlineStyles,
          linesOfCode: content.split('\n').length,
        });

        // Look for common patterns
        if (content.includes('useState')) patterns.push('React Hooks');
        if (content.includes('useEffect')) patterns.push('Side Effects');
        if (content.includes('memo')) patterns.push('Performance Optimization');
      }
    }

    return { components, patterns: [...new Set(patterns)] };
  }

  private generateDesignSystemGuidelines(structure: any, componentAnalysis: any): string {
    return `# Design System Guidelines

## Overview
This design system aims to create consistent, accessible, and maintainable UI components.

## Framework Analysis
- Framework: ${structure.frameworkType}
- TypeScript: ${structure.hasTypeScript ? 'Yes' : 'No'}
- CSS Architecture: ${structure.hasCss ? 'Present' : 'Not detected'}

## Component Analysis
- Total Components: ${componentAnalysis.components.length}
- Common Patterns: ${componentAnalysis.patterns.join(', ')}

## Color Palette
Define a consistent color palette with semantic naming:
\`\`\`css
:root {
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-neutral: #6b7280;
}
\`\`\`

## Typography Scale
\`\`\`css
:root {
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
}
\`\`\`

## Spacing System
\`\`\`css
:root {
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
}
\`\`\`

## Component Guidelines
1. Use semantic HTML elements
2. Implement consistent prop interfaces
3. Support dark/light mode
4. Include accessibility attributes
5. Provide loading and error states

## Recommended Tools
- CSS-in-JS or CSS Modules for styling
- Storybook for component documentation
- Design tokens for consistency
- Accessibility testing tools
`;
  }

  private generateCSSImprovements(projectFiles: Record<string, string>): string {
    const cssFiles = Object.keys(projectFiles).filter(path => 
      path.endsWith('.css') || path.endsWith('.scss') || path.endsWith('.sass')
    );

    return `# CSS Architecture Improvements

## Current CSS Files
${cssFiles.map(file => `- ${file}`).join('\n')}

## Recommended Architecture

### 1. File Organization
\`\`\`
styles/
├── base/
│   ├── reset.css
│   ├── typography.css
│   └── variables.css
├── components/
│   ├── button.css
│   ├── card.css
│   └── modal.css
├── layouts/
│   ├── grid.css
│   └── header.css
└── utilities/
    ├── spacing.css
    └── colors.css
\`\`\`

### 2. Naming Convention (BEM)
\`\`\`css
/* Block */
.card { }

/* Element */
.card__header { }
.card__body { }

/* Modifier */
.card--large { }
.card--highlighted { }
\`\`\`

### 3. CSS Custom Properties
Use CSS custom properties for theming and consistency:
\`\`\`css
.card {
  background: var(--color-surface);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-sm);
}
\`\`\`

### 4. Performance Optimizations
- Use \`contain\` property for layout isolation
- Minimize CSS bundle size with tree-shaking
- Use \`will-change\` sparingly for animations
- Optimize critical CSS for above-the-fold content

### 5. Accessibility
- Ensure sufficient color contrast (WCAG AA)
- Use relative units for scalability
- Provide focus indicators
- Support reduced motion preferences
`;
  }

  private generateComponentLibraryGuidelines(): string {
    return `# Component Library Guidelines

## Component Structure
Each component should follow this structure:

\`\`\`typescript
interface ComponentProps {
  // Props definition
}

export const Component: React.FC<ComponentProps> = ({ ...props }) => {
  // Component implementation
};

Component.displayName = 'Component';
\`\`\`

## Recommended Components

### 1. Base Components
- Button (with variants)
- Input (text, email, password)
- Select
- Checkbox
- Radio
- Label

### 2. Layout Components
- Container
- Grid
- Stack
- Spacer

### 3. Feedback Components
- Alert
- Toast
- Loading Spinner
- Progress Bar

### 4. Navigation Components
- Header
- Sidebar
- Breadcrumb
- Pagination

### 5. Data Display
- Table
- Card
- Badge
- Avatar

## Component Guidelines
1. Use TypeScript for all components
2. Export prop interfaces
3. Include default props where appropriate
4. Add JSDoc comments for documentation
5. Support ref forwarding
6. Implement compound components where suitable

## Testing Strategy
- Unit tests for component logic
- Visual regression tests
- Accessibility tests
- Performance tests
`;
  }

  private generateAccessibilityChecklist(): string {
    return `# Accessibility (A11y) Checklist

## Semantic HTML
- [ ] Use proper heading hierarchy (h1-h6)
- [ ] Use semantic landmarks (nav, main, aside, footer)
- [ ] Use proper form labels and associations
- [ ] Use button elements for interactive actions
- [ ] Use link elements for navigation

## Keyboard Navigation
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible and clear
- [ ] Tab order is logical and intuitive
- [ ] Escape key closes modals/dropdowns
- [ ] Arrow keys work in custom components

## Screen Reader Support
- [ ] Images have descriptive alt text
- [ ] Form inputs have labels or aria-labels
- [ ] Dynamic content changes are announced
- [ ] Error messages are programmatically associated
- [ ] Loading states are announced

## Color and Contrast
- [ ] Text contrast meets WCAG AA standards (4.5:1)
- [ ] Interactive elements have sufficient contrast
- [ ] Color is not the only way to convey information
- [ ] Focus indicators have sufficient contrast

## Responsive Design
- [ ] Content is readable at 200% zoom
- [ ] Horizontal scrolling is not required
- [ ] Touch targets are at least 44x44px
- [ ] Content reflows properly on mobile

## Testing Tools
- axe-core browser extension
- WAVE accessibility evaluator
- Lighthouse accessibility audit
- Screen reader testing (NVDA, JAWS, VoiceOver)

## Implementation Notes
- Use aria-* attributes sparingly and correctly
- Test with actual assistive technologies
- Consider cognitive disabilities in design
- Provide skip links for navigation
`;
  }
}