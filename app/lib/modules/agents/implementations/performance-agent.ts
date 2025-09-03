import { BaseAgent } from '../base-agent';
import type { AgentContext, AgentExecutionPlan, AgentOutput } from '../types';

/**
 * PerformanceAgent focuses on optimizing code efficiency,
 * bundle size, and runtime performance
 */
export class PerformanceAgent extends BaseAgent {
  readonly name = 'performance';
  readonly description = 'Optimizes code efficiency, bundle size, and runtime performance';
  readonly version = '1.0.0';
  readonly tags = ['performance', 'optimization', 'bundle', 'efficiency'];

  async plan(context: AgentContext): Promise<AgentExecutionPlan> {
    const structure = this.analyzeProjectStructure(context.projectFiles);
    const steps: string[] = [];
    const dependencies: string[] = [];
    const expectedOutputs: string[] = [];

    // Plan performance analysis steps
    steps.push('Analyze bundle composition and size');
    steps.push('Identify performance bottlenecks');
    steps.push('Review code patterns for optimization opportunities');

    if (structure.hasPackageJson) {
      steps.push('Analyze dependencies for bundle impact');
      expectedOutputs.push('Dependency optimization recommendations');
    }

    if (structure.hasTypeScript || structure.hasReact) {
      steps.push('Analyze React/TypeScript performance patterns');
      expectedOutputs.push('Component optimization suggestions');
    }

    steps.push('Generate performance monitoring setup');
    steps.push('Create optimization recommendations');

    expectedOutputs.push('Performance audit report');
    expectedOutputs.push('Bundle optimization config');
    expectedOutputs.push('Performance monitoring setup');

    return {
      steps,
      estimatedTime: 60,
      dependencies,
      expectedOutputs,
    };
  }

  async execute(context: AgentContext, plan: AgentExecutionPlan): Promise<AgentOutput> {
    const artifacts = [];
    const nextSteps = [];
    const structure = this.analyzeProjectStructure(context.projectFiles);

    try {
      // Analyze current performance state
      const performanceAnalysis = this.analyzePerformancePatterns(context.projectFiles, structure);
      
      // Generate performance audit report
      const auditReport = this.generatePerformanceAuditReport(performanceAnalysis, structure);
      artifacts.push(this.createArtifact(
        'documentation',
        'performance-audit.md',
        auditReport,
        'Comprehensive performance analysis and recommendations'
      ));

      // Generate bundle optimization configuration
      if (structure.hasPackageJson) {
        const bundleConfig = this.generateBundleOptimizationConfig(context.projectFiles);
        artifacts.push(this.createArtifact(
          'config',
          'webpack.optimization.js',
          bundleConfig,
          'Webpack optimization configuration'
        ));

        // Generate dependency analysis
        const depAnalysis = this.analyzeDependencies(context.projectFiles);
        artifacts.push(this.createArtifact(
          'documentation',
          'dependency-analysis.md',
          depAnalysis,
          'Dependency impact analysis and optimization suggestions'
        ));
      }

      // Generate performance monitoring setup
      const monitoringSetup = this.generatePerformanceMonitoringSetup(structure);
      artifacts.push(this.createArtifact(
        'code',
        'performance-monitoring.ts',
        monitoringSetup,
        'Performance monitoring and metrics collection'
      ));

      // Generate React-specific optimizations
      if (structure.hasReact) {
        const reactOptimizations = this.generateReactOptimizations();
        artifacts.push(this.createArtifact(
          'documentation',
          'react-performance.md',
          reactOptimizations,
          'React-specific performance optimization techniques'
        ));
      }

      nextSteps.push('Implement code splitting for route-based chunks');
      nextSteps.push('Add performance monitoring to CI/CD pipeline');
      nextSteps.push('Set up bundle analyzer in build process');
      nextSteps.push('Implement lazy loading for components and images');
      nextSteps.push('Configure service worker for caching');

      return this.createOutput(
        `Analyzed performance patterns and generated ${artifacts.length} optimization artifacts`,
        artifacts,
        nextSteps
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error in PerformanceAgent';
      return this.createOutput(
        `PerformanceAgent execution failed: ${errorMessage}`,
        [],
        [],
        false,
        [errorMessage]
      );
    }
  }

  private analyzePerformancePatterns(projectFiles: Record<string, string>, structure: any) {
    const analysis: {
      codePatterns: string[];
      bundleIssues: string[];
      optimizationOpportunities: string[];
      fileAnalysis: Record<string, any>;
    } = {
      codePatterns: [],
      bundleIssues: [],
      optimizationOpportunities: [],
      fileAnalysis: {},
    };

    // Analyze each file for performance patterns
    for (const [path, content] of Object.entries(projectFiles)) {
      const fileAnalysis = this.analyzeFilePerformance(path, content);
      analysis.fileAnalysis[path] = fileAnalysis;
      
      // Collect patterns and issues
      analysis.codePatterns.push(...fileAnalysis.patterns);
      analysis.bundleIssues.push(...fileAnalysis.bundleIssues);
      analysis.optimizationOpportunities.push(...fileAnalysis.optimizations);
    }

    return analysis;
  }

  private analyzeFilePerformance(path: string, content: string) {
    const patterns = [];
    const bundleIssues = [];
    const optimizations = [];

    // Analyze JavaScript/TypeScript files
    if (path.endsWith('.js') || path.endsWith('.ts') || path.endsWith('.jsx') || path.endsWith('.tsx')) {
      // Check for performance anti-patterns
      if (content.includes('document.querySelector') && content.includes('loop')) {
        patterns.push('DOM queries in loops detected');
        optimizations.push('Cache DOM queries outside loops');
      }

      if (content.includes('useState') && content.includes('useEffect')) {
        patterns.push('React hooks usage detected');
      }

      if (content.match(/import.*from.*['"][^'"]*\.css['"]/)) {
        bundleIssues.push('CSS imports in JS detected');
        optimizations.push('Consider CSS-in-JS or separate CSS bundles');
      }

      // Check for large imports
      if (content.includes('import * as')) {
        bundleIssues.push('Wildcard imports detected');
        optimizations.push('Use named imports to enable tree shaking');
      }

      // Check for unoptimized images
      if (content.match(/\.(jpg|jpeg|png|gif|bmp)/i)) {
        optimizations.push('Consider WebP format and lazy loading for images');
      }

      // Check for synchronous operations
      if (content.includes('JSON.parse') && !content.includes('try')) {
        patterns.push('Unsafe JSON parsing detected');
        optimizations.push('Add error handling for JSON operations');
      }
    }

    // Analyze CSS files
    if (path.endsWith('.css') || path.endsWith('.scss') || path.endsWith('.sass')) {
      if (content.includes('@import')) {
        bundleIssues.push('CSS @import statements can block rendering');
        optimizations.push('Use build-time CSS concatenation instead of @import');
      }

      // Check for unused vendor prefixes
      if (content.includes('-webkit-') || content.includes('-moz-')) {
        optimizations.push('Review vendor prefixes - some may no longer be needed');
      }
    }

    return { patterns, bundleIssues, optimizations };
  }

  private generatePerformanceAuditReport(analysis: any, structure: any): string {
    const totalPatterns = analysis.codePatterns.length;
    const totalIssues = analysis.bundleIssues.length;
    const totalOptimizations = analysis.optimizationOpportunities.length;

    return `# Performance Audit Report

## Project Overview
- Framework: ${structure.frameworkType}
- TypeScript: ${structure.hasTypeScript ? 'Yes' : 'No'}
- Testing: ${structure.hasTests ? 'Yes' : 'No'}
- Files Analyzed: ${Object.keys(analysis.fileAnalysis).length}

## Executive Summary
- Code Patterns Identified: ${totalPatterns}
- Bundle Issues Found: ${totalIssues}
- Optimization Opportunities: ${totalOptimizations}

## Performance Issues

### High Priority
1. **Bundle Size Optimization**
   - Use code splitting for route-based chunks
   - Implement dynamic imports for large dependencies
   - Remove unused dependencies

2. **Runtime Performance**
   - Minimize DOM manipulations
   - Use React.memo for component optimization
   - Implement virtual scrolling for large lists

3. **Loading Performance**
   - Implement lazy loading for images and components
   - Use service workers for caching
   - Optimize critical rendering path

## Code Patterns Analysis
${analysis.codePatterns.slice(0, 10).map((pattern: string) => `- ${pattern}`).join('\n')}

## Bundle Issues
${analysis.bundleIssues.slice(0, 10).map((issue: string) => `- ${issue}`).join('\n')}

## Optimization Recommendations

### Immediate Actions
1. **Code Splitting**
   \`\`\`javascript
   // Route-based splitting
   const HomePage = lazy(() => import('./pages/Home'));
   const AboutPage = lazy(() => import('./pages/About'));
   \`\`\`

2. **Bundle Analysis**
   \`\`\`bash
   npm install --save-dev webpack-bundle-analyzer
   npm run build && npx webpack-bundle-analyzer build/static/js/*.js
   \`\`\`

3. **Performance Monitoring**
   \`\`\`javascript
   // Add to your app
   import { reportWebVitals } from './reportWebVitals';
   reportWebVitals(console.log);
   \`\`\`

### Medium Priority
- Implement image optimization pipeline
- Set up performance budgets in CI/CD
- Add performance regression testing

### Long Term
- Consider micro-frontends for large applications
- Implement progressive enhancement strategies
- Set up real user monitoring (RUM)

## Performance Metrics Targets
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- First Input Delay (FID): < 100ms
- Cumulative Layout Shift (CLS): < 0.1
- Time to Interactive (TTI): < 3.5s

## Tools and Resources
- Lighthouse for performance audits
- WebPageTest for detailed analysis
- Chrome DevTools Performance tab
- React DevTools Profiler
- Bundle analyzers (webpack-bundle-analyzer, source-map-explorer)
`;
  }

  private generateBundleOptimizationConfig(projectFiles: Record<string, string>): string {
    const hasReact = Object.keys(projectFiles).some(path => path.endsWith('.tsx') || path.endsWith('.jsx'));
    
    return `// webpack.optimization.js
// Bundle optimization configuration

const path = require('path');
const CompressionPlugin = require('compression-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  optimization: {
    // Split chunks for better caching
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Vendor chunk for external dependencies
        vendor: {
          test: /[\\\\/]node_modules[\\\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
        },
        ${hasReact ? `
        // React chunk
        react: {
          test: /[\\\\/]node_modules[\\\\/](react|react-dom)[\\\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 20,
        },` : ''}
        // Common chunk for shared modules
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 5,
          reuseExistingChunk: true,
        },
      },
    },
    
    // Runtime chunk for webpack runtime
    runtimeChunk: {
      name: 'runtime',
    },
    
    // Minimize bundle size
    minimize: true,
    
    // Module concatenation for smaller bundles
    concatenateModules: true,
  },
  
  plugins: [
    // Gzip compression
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\\.(js|css|html|svg)$/,
      threshold: 8192,
      minRatio: 0.8,
    }),
    
    // Bundle analyzer (only in analyze mode)
    ...(process.env.ANALYZE === 'true' ? [
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        openAnalyzer: false,
        generateStatsFile: true,
        statsFilename: 'bundle-stats.json',
      }),
    ] : []),
  ],
  
  resolve: {
    // Import resolution optimization
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
    
    // Reduce resolve attempts
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    
    // Alias for common paths
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'components': path.resolve(__dirname, 'src/components'),
      'utils': path.resolve(__dirname, 'src/utils'),
    },
  },
  
  // Performance hints
  performance: {
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
    hints: 'warning',
  },
};

// Usage:
// 1. Install dependencies: npm install --save-dev compression-webpack-plugin webpack-bundle-analyzer
// 2. Merge with your webpack config
// 3. Run with analysis: ANALYZE=true npm run build
`;
  }

  private analyzeDependencies(projectFiles: Record<string, string>): string {
    const packageJson = projectFiles['package.json'];
    if (!packageJson) {
      return '# No package.json found for dependency analysis';
    }

    try {
      const pkg = JSON.parse(packageJson);
      const deps = pkg.dependencies || {};
      const devDeps = pkg.devDependencies || {};
      
      return `# Dependency Analysis

## Current Dependencies (${Object.keys(deps).length})
${Object.entries(deps).map(([name, version]) => `- ${name}: ${version}`).join('\n')}

## Dev Dependencies (${Object.keys(devDeps).length})
${Object.entries(devDeps).map(([name, version]) => `- ${name}: ${version}`).join('\n')}

## Optimization Recommendations

### Large Dependencies to Review
- Check if you need the full library or can use a smaller alternative
- Consider tree-shaking opportunities
- Look for unnecessary polyfills

### Bundle Impact Analysis
Run this command to analyze dependency sizes:
\`\`\`bash
npx bundlephobia-cli list-dependencies
\`\`\`

### Common Optimizations
1. **Date libraries**: Replace moment.js with date-fns or dayjs
2. **Utility libraries**: Use specific lodash functions instead of full library
3. **UI libraries**: Import only needed components
4. **Polyfills**: Remove unnecessary polyfills for modern browsers

### Tree Shaking Setup
Ensure your bundler supports tree shaking:
\`\`\`json
{
  "sideEffects": false
}
\`\`\`

### Dynamic Imports
Use dynamic imports for large dependencies:
\`\`\`javascript
const heavyLibrary = await import('heavy-library');
\`\`\`
`;
    } catch {
      return '# Invalid package.json - unable to analyze dependencies';
    }
  }

  private generatePerformanceMonitoringSetup(structure: any): string {
    return `// performance-monitoring.ts
// Performance monitoring and metrics collection

interface PerformanceMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private observer?: PerformanceObserver;

  constructor() {
    this.initializeObserver();
    this.measureNavigationTiming();
  }

  private initializeObserver() {
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processEntry(entry);
        }
      });

      // Observe paint and layout shift metrics
      this.observer.observe({ type: 'paint', buffered: true });
      this.observer.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observer.observe({ type: 'layout-shift', buffered: true });
      this.observer.observe({ type: 'first-input', buffered: true });
    }
  }

  private processEntry(entry: PerformanceEntry) {
    switch (entry.entryType) {
      case 'paint':
        if (entry.name === 'first-contentful-paint') {
          this.metrics.fcp = entry.startTime;
        }
        break;
      
      case 'largest-contentful-paint':
        this.metrics.lcp = entry.startTime;
        break;
      
      case 'first-input':
        this.metrics.fid = (entry as any).processingStart - entry.startTime;
        break;
      
      case 'layout-shift':
        if (!(entry as any).hadRecentInput) {
          this.metrics.cls = (this.metrics.cls || 0) + (entry as any).value;
        }
        break;
    }
  }

  private measureNavigationTiming() {
    if ('performance' in window && 'timing' in performance) {
      window.addEventListener('load', () => {
        const timing = performance.timing;
        this.metrics.ttfb = timing.responseStart - timing.navigationStart;
      });
    }
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public reportMetrics(callback?: (metrics: PerformanceMetrics) => void) {
    // Report after page is fully loaded
    if (document.readyState === 'complete') {
      this.sendMetrics(callback);
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => this.sendMetrics(callback), 0);
      });
    }
  }

  private sendMetrics(callback?: (metrics: PerformanceMetrics) => void) {
    const metrics = this.getMetrics();
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.table(metrics);
    }
    
    // Send to analytics service
    this.sendToAnalytics(metrics);
    
    // Execute callback if provided
    if (callback) {
      callback(metrics);
    }
  }

  private sendToAnalytics(metrics: PerformanceMetrics) {
    // Example: Send to Google Analytics
    if (typeof gtag !== 'undefined') {
      Object.entries(metrics).forEach(([key, value]) => {
        if (value !== undefined) {
          gtag('event', 'performance_metric', {
            metric_name: key,
            metric_value: Math.round(value),
          });
        }
      });
    }
    
    // Example: Send to custom analytics endpoint
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/performance', JSON.stringify(metrics));
    }
  }

  public disconnect() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Usage
export const performanceMonitor = new PerformanceMonitor();

// For React applications
export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});

  useEffect(() => {
    const monitor = new PerformanceMonitor();
    
    const timer = setTimeout(() => {
      monitor.reportMetrics((reportedMetrics) => {
        setMetrics(reportedMetrics);
      });
    }, 5000); // Report after 5 seconds

    return () => {
      clearTimeout(timer);
      monitor.disconnect();
    };
  }, []);

  return metrics;
}

// Core Web Vitals thresholds
export const PERFORMANCE_THRESHOLDS = {
  fcp: { good: 1800, poor: 3000 },
  lcp: { good: 2500, poor: 4000 },
  fid: { good: 100, poor: 300 },
  cls: { good: 0.1, poor: 0.25 },
} as const;

export function getMetricScore(metric: keyof PerformanceMetrics, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = PERFORMANCE_THRESHOLDS[metric];
  if (!threshold || value === undefined) return 'poor';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}
`;
  }

  private generateReactOptimizations(): string {
    return `# React Performance Optimization Guide

## Component Optimization

### 1. React.memo for Pure Components
\`\`\`javascript
const ExpensiveComponent = React.memo(({ data, onClick }) => {
  return (
    <div onClick={onClick}>
      {data.map(item => <Item key={item.id} item={item} />)}
    </div>
  );
});
\`\`\`

### 2. useMemo for Expensive Calculations
\`\`\`javascript
const ExpensiveCalculation = ({ items }) => {
  const expensiveValue = useMemo(() => {
    return items.reduce((sum, item) => sum + item.value * item.multiplier, 0);
  }, [items]);

  return <div>{expensiveValue}</div>;
};
\`\`\`

### 3. useCallback for Stable References
\`\`\`javascript
const ParentComponent = ({ items }) => {
  const handleClick = useCallback((id) => {
    // Handle click logic
  }, []);

  return (
    <div>
      {items.map(item => (
        <ChildComponent 
          key={item.id} 
          item={item} 
          onClick={handleClick} 
        />
      ))}
    </div>
  );
};
\`\`\`

## State Management Optimization

### 1. State Colocation
Keep state as close to where it's used as possible:
\`\`\`javascript
// Instead of global state for UI-only concerns
const Modal = () => {
  const [isOpen, setIsOpen] = useState(false);
  // Modal-specific state stays here
};
\`\`\`

### 2. State Normalization
For complex state, normalize the structure:
\`\`\`javascript
// Normalized state structure
const initialState = {
  users: {
    byId: {},
    allIds: [],
  },
  posts: {
    byId: {},
    allIds: [],
  },
};
\`\`\`

## Rendering Optimization

### 1. Virtual Scrolling for Large Lists
\`\`\`javascript
import { FixedSizeList } from 'react-window';

const LargeList = ({ items }) => (
  <FixedSizeList
    height={600}
    itemCount={items.length}
    itemSize={50}
    itemData={items}
  >
    {({ index, style, data }) => (
      <div style={style}>
        <Item item={data[index]} />
      </div>
    )}
  </FixedSizeList>
);
\`\`\`

### 2. Code Splitting with Suspense
\`\`\`javascript
const LazyComponent = lazy(() => import('./LazyComponent'));

const App = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <LazyComponent />
  </Suspense>
);
\`\`\`

## Bundle Optimization

### 1. Tree Shaking Friendly Imports
\`\`\`javascript
// Good: Named imports
import { debounce, throttle } from 'lodash';

// Bad: Default import
import _ from 'lodash';
\`\`\`

### 2. Dynamic Imports
\`\`\`javascript
const loadChartLibrary = async () => {
  const { Chart } = await import('chart.js');
  return Chart;
};
\`\`\`

## Performance Monitoring

### 1. React DevTools Profiler
Use the Profiler to identify slow components:
\`\`\`javascript
<Profiler id="App" onRender={onRenderCallback}>
  <App />
</Profiler>
\`\`\`

### 2. Performance Markers
\`\`\`javascript
useEffect(() => {
  performance.mark('component-start');
  return () => {
    performance.mark('component-end');
    performance.measure('component-time', 'component-start', 'component-end');
  };
}, []);
\`\`\`

## Common Anti-patterns to Avoid

1. **Inline Objects/Functions in Render**
2. **Unnecessary Re-renders**
3. **Large Component Trees**
4. **Blocking the Main Thread**
5. **Not Using Keys in Lists**
6. **Mutating Props/State**

## Performance Budget
Set up performance budgets for your builds:
- Initial bundle size: < 250KB
- Individual chunks: < 100KB
- TTI: < 3.5s on 3G
- LCP: < 2.5s
`;
  }
}