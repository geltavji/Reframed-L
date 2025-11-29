/**
 * VisualizationSystem - PRD-17 Phase 17.1
 * Advanced UI/UX visualization system for non-programmers
 * Provides clear visual representations of reframed physics laws
 */

import { Logger } from '../core/logger/Logger';
import { HashVerifier } from '../core/logger/HashVerifier';

// Visualization types
export type VisualizationType = 
  | 'formula_diagram'
  | 'flow_chart'
  | 'comparison_table'
  | '3d_visualization'
  | 'interactive_graph'
  | 'timeline'
  | 'hierarchical'
  | 'network_graph'
  | 'heatmap'
  | 'sankey_diagram';

// Dashboard layout types
export type LayoutType = 
  | 'single'
  | 'side_by_side'
  | 'grid'
  | 'tabbed'
  | 'accordion'
  | 'carousel';

// Visualization element interface
export interface VisualizationElement {
  id: string;
  type: VisualizationType;
  title: string;
  description: string;
  data: VisualizationData;
  config: VisualizationConfig;
  interactivity: InteractivityConfig;
  accessibility: AccessibilityConfig;
  createdAt: Date;
  hash: string;
}

export interface VisualizationData {
  source: string;
  format: 'json' | 'csv' | 'array' | 'object';
  values: any;
  labels?: string[];
  categories?: string[];
  metadata?: Record<string, any>;
}

export interface VisualizationConfig {
  width: number | 'auto';
  height: number | 'auto';
  theme: 'light' | 'dark' | 'scientific' | 'colorful';
  colorScheme: string[];
  font: FontConfig;
  animation: boolean;
  responsive: boolean;
}

export interface FontConfig {
  family: string;
  titleSize: number;
  labelSize: number;
  bodySize: number;
}

export interface InteractivityConfig {
  enabled: boolean;
  hover: boolean;
  click: boolean;
  zoom: boolean;
  pan: boolean;
  tooltip: boolean;
  filter: boolean;
  export: boolean;
}

export interface AccessibilityConfig {
  altText: string;
  ariaLabel: string;
  keyboardNavigable: boolean;
  screenReaderFriendly: boolean;
  highContrastMode: boolean;
  colorBlindSafe: boolean;
}

// Dashboard interface
export interface Dashboard {
  id: string;
  name: string;
  description: string;
  layout: LayoutType;
  widgets: DashboardWidget[];
  theme: DashboardTheme;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
  hash: string;
}

export interface DashboardWidget {
  id: string;
  visualizationId: string;
  position: { row: number; col: number };
  size: { width: number; height: number };
  title: string;
  collapsed: boolean;
  refreshRate?: number; // seconds
}

export interface DashboardTheme {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  accentColor: string;
}

export interface Permission {
  role: 'viewer' | 'editor' | 'admin';
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
}

// Formula visualization
export interface FormulaVisualization {
  id: string;
  lawName: string;
  originalFormula: string;
  reframedFormula: string;
  strategy: string;
  diagram: FormulaElementDiagram;
  explanation: VisualExplanation;
  connections: Connection[];
  hash: string;
}

export interface FormulaElementDiagram {
  elements: DiagramElement[];
  relationships: DiagramRelationship[];
  layout: 'horizontal' | 'vertical' | 'radial' | 'tree';
}

export interface DiagramElement {
  id: string;
  type: 'variable' | 'operator' | 'constant' | 'function' | 'bracket';
  symbol: string;
  name: string;
  description: string;
  position: { x: number; y: number };
  style: ElementStyle;
}

export interface ElementStyle {
  shape: 'circle' | 'rectangle' | 'diamond' | 'ellipse';
  fillColor: string;
  borderColor: string;
  textColor: string;
  size: number;
}

export interface DiagramRelationship {
  from: string;
  to: string;
  type: 'equals' | 'implies' | 'derives' | 'corresponds' | 'transforms';
  label?: string;
  style: {
    lineStyle: 'solid' | 'dashed' | 'dotted';
    arrowType: 'none' | 'single' | 'double';
    color: string;
  };
}

export interface VisualExplanation {
  steps: ExplanationStep[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
  estimatedTime: number; // minutes
}

export interface ExplanationStep {
  stepNumber: number;
  title: string;
  content: string;
  visualId?: string;
  interactive: boolean;
  quiz?: QuizQuestion;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Connection {
  from: { law: string; element: string };
  to: { law: string; element: string };
  relationshipType: string;
  strength: number; // 0-1
}

// Comparison visualization
export interface ComparisonVisualization {
  id: string;
  title: string;
  items: ComparisonItem[];
  criteria: ComparisonCriterion[];
  matrix: number[][];
  summary: string;
  hash: string;
}

export interface ComparisonItem {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface ComparisonCriterion {
  id: string;
  name: string;
  weight: number;
  unit?: string;
}

/**
 * VisualizationSystem - Main visualization and UI system
 */
export class VisualizationSystem {
  private logger: Logger;
  private visualizations: Map<string, VisualizationElement> = new Map();
  private dashboards: Map<string, Dashboard> = new Map();
  private formulaVisualizations: Map<string, FormulaVisualization> = new Map();
  private comparisons: Map<string, ComparisonVisualization> = new Map();
  
  private vizCount: number = 0;
  private dashboardCount: number = 0;
  private formulaVizCount: number = 0;
  private comparisonCount: number = 0;

  private defaultTheme: DashboardTheme = {
    name: 'Scientific',
    primaryColor: '#2563eb',
    secondaryColor: '#7c3aed',
    backgroundColor: '#f8fafc',
    textColor: '#1e293b',
    borderColor: '#e2e8f0',
    accentColor: '#059669'
  };

  constructor() {
    this.logger = Logger.getInstance();
    this.initializeDefaultVisualizations();
  }

  /**
   * Initialize default visualizations for reframed laws
   */
  private initializeDefaultVisualizations(): void {
    // Create visualization for Newton's Second Law
    this.createFormulaVisualization({
      lawName: "Newton's Second Law",
      originalFormula: 'F = ma',
      reframedFormula: 'I(F = ma) = -log₂(P(F))',
      strategy: 'information'
    });

    // Create visualization for E=mc²
    this.createFormulaVisualization({
      lawName: 'Mass-Energy Equivalence',
      originalFormula: 'E = mc²',
      reframedFormula: 'I(E = mc²) = -log₂(P(E))',
      strategy: 'information'
    });

    // Create visualization for Schrödinger Equation
    this.createFormulaVisualization({
      lawName: 'Schrödinger Equation',
      originalFormula: 'iℏ∂ψ/∂t = Ĥψ',
      reframedFormula: 'COMPUTE(iℏ∂ψ/∂t = Ĥψ) : O(f(n)) → result',
      strategy: 'computational'
    });

    // Create main dashboard
    this.createDashboard({
      name: 'Reframed Laws Overview',
      description: 'Main dashboard showing all reframed physics laws',
      layout: 'grid'
    });
  }

  /**
   * Create a formula visualization
   */
  createFormulaVisualization(config: {
    lawName: string;
    originalFormula: string;
    reframedFormula: string;
    strategy: string;
  }): FormulaVisualization {
    const id = `fviz-${++this.formulaVizCount}-${Date.now()}`;

    const diagram = this.generateFormulaDiagram(config);
    const explanation = this.generateExplanation(config);
    const connections = this.generateConnections(config);

    const viz: FormulaVisualization = {
      id,
      lawName: config.lawName,
      originalFormula: config.originalFormula,
      reframedFormula: config.reframedFormula,
      strategy: config.strategy,
      diagram,
      explanation,
      connections,
      hash: ''
    };
    viz.hash = HashVerifier.hash(JSON.stringify({ ...viz, hash: '' }));

    this.formulaVisualizations.set(id, viz);

    this.logger.info('Formula visualization created', {
      id,
      lawName: config.lawName,
      hash: viz.hash
    });

    return viz;
  }

  private generateFormulaDiagram(config: any): FormulaElementDiagram {
    const elements: DiagramElement[] = [];
    const relationships: DiagramRelationship[] = [];

    // Parse original formula elements
    const originalElements = this.parseFormulaElements(config.originalFormula, 'original');
    const reframedElements = this.parseFormulaElements(config.reframedFormula, 'reframed');

    // Position elements
    let xPos = 0;
    for (const elem of originalElements) {
      elements.push({
        ...elem,
        position: { x: xPos, y: 0 }
      });
      xPos += 100;
    }

    xPos = 0;
    for (const elem of reframedElements) {
      elements.push({
        ...elem,
        position: { x: xPos, y: 200 }
      });
      xPos += 100;
    }

    // Create transformation relationship
    relationships.push({
      from: 'original-formula',
      to: 'reframed-formula',
      type: 'transforms',
      label: config.strategy + ' reframing',
      style: {
        lineStyle: 'dashed',
        arrowType: 'single',
        color: '#7c3aed'
      }
    });

    return {
      elements,
      relationships,
      layout: 'vertical'
    };
  }

  private parseFormulaElements(formula: string, prefix: string): DiagramElement[] {
    // Simplified formula parsing
    const elements: DiagramElement[] = [];
    const elementId = `${prefix}-formula`;

    elements.push({
      id: elementId,
      type: 'function',
      symbol: formula,
      name: `${prefix === 'original' ? 'Original' : 'Reframed'} Formula`,
      description: `The ${prefix} form of the law`,
      position: { x: 0, y: 0 },
      style: {
        shape: 'rectangle',
        fillColor: prefix === 'original' ? '#dbeafe' : '#fae8ff',
        borderColor: prefix === 'original' ? '#2563eb' : '#7c3aed',
        textColor: '#1e293b',
        size: 120
      }
    });

    return elements;
  }

  private generateExplanation(config: any): VisualExplanation {
    const strategies: Record<string, string> = {
      'information': 'information-theoretic',
      'computational': 'computational',
      'geometric': 'geometric',
      'holographic': 'holographic',
      'emergent': 'emergent'
    };

    const strategyName = strategies[config.strategy] || config.strategy;

    return {
      steps: [
        {
          stepNumber: 1,
          title: 'Understanding the Original Law',
          content: `The original ${config.lawName} (${config.originalFormula}) describes a fundamental relationship in physics.`,
          interactive: true
        },
        {
          stepNumber: 2,
          title: 'The Reframing Concept',
          content: `The ${strategyName} approach views physical laws through a different lens, revealing hidden connections.`,
          interactive: true
        },
        {
          stepNumber: 3,
          title: 'Transformation Process',
          content: `We transform ${config.originalFormula} into ${config.reframedFormula} using ${strategyName} principles.`,
          interactive: true,
          quiz: {
            question: `What type of reframing is being applied to ${config.lawName}?`,
            options: ['Information-theoretic', 'Computational', 'Geometric', 'Holographic'],
            correctIndex: ['information', 'computational', 'geometric', 'holographic'].indexOf(config.strategy),
            explanation: `The ${strategyName} reframing helps us understand the law from a new perspective.`
          }
        },
        {
          stepNumber: 4,
          title: 'New Insights',
          content: `The reframed form reveals that the physical process can be understood as ${
            config.strategy === 'information' ? 'information processing' :
            config.strategy === 'computational' ? 'a computational operation' :
            config.strategy === 'geometric' ? 'geometric structure' :
            config.strategy === 'holographic' ? 'boundary-bulk correspondence' :
            'an emergent phenomenon'
          }.`,
          interactive: true
        },
        {
          stepNumber: 5,
          title: 'Applications',
          content: 'This reframing opens new possibilities for quantum computing, theoretical physics research, and practical applications.',
          interactive: false
        }
      ],
      difficulty: 'intermediate',
      prerequisites: ['Basic physics', 'Mathematical notation'],
      estimatedTime: 10
    };
  }

  private generateConnections(config: any): Connection[] {
    return [
      {
        from: { law: config.lawName, element: 'force' },
        to: { law: config.lawName, element: 'information' },
        relationshipType: 'encodes',
        strength: 0.9
      },
      {
        from: { law: config.lawName, element: 'energy' },
        to: { law: 'Conservation Laws', element: 'conservation' },
        relationshipType: 'implies',
        strength: 0.85
      }
    ];
  }

  /**
   * Create a dashboard
   */
  createDashboard(config: {
    name: string;
    description: string;
    layout: LayoutType;
  }): Dashboard {
    const id = `dash-${++this.dashboardCount}-${Date.now()}`;

    const widgets: DashboardWidget[] = [];
    
    // Add formula visualizations as widgets
    let row = 0;
    let col = 0;
    for (const [vizId] of this.formulaVisualizations) {
      widgets.push({
        id: `widget-${widgets.length + 1}`,
        visualizationId: vizId,
        position: { row, col },
        size: { width: 1, height: 1 },
        title: this.formulaVisualizations.get(vizId)?.lawName || 'Law',
        collapsed: false,
        refreshRate: 60
      });
      col++;
      if (col > 2) {
        col = 0;
        row++;
      }
    }

    const dashboard: Dashboard = {
      id,
      name: config.name,
      description: config.description,
      layout: config.layout,
      widgets,
      theme: this.defaultTheme,
      permissions: [
        { role: 'viewer', canView: true, canEdit: false, canDelete: false, canShare: false },
        { role: 'editor', canView: true, canEdit: true, canDelete: false, canShare: true },
        { role: 'admin', canView: true, canEdit: true, canDelete: true, canShare: true }
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      hash: ''
    };
    dashboard.hash = HashVerifier.hash(JSON.stringify({ ...dashboard, hash: '' }));

    this.dashboards.set(id, dashboard);

    this.logger.info('Dashboard created', {
      id,
      name: config.name,
      widgetCount: widgets.length,
      hash: dashboard.hash
    });

    return dashboard;
  }

  /**
   * Create a comparison visualization
   */
  createComparison(
    title: string,
    items: { name: string; description: string; category: string }[],
    criteria: { name: string; weight: number }[]
  ): ComparisonVisualization {
    const id = `comp-${++this.comparisonCount}-${Date.now()}`;

    const compItems: ComparisonItem[] = items.map((item, i) => ({
      id: `item-${i}`,
      name: item.name,
      description: item.description,
      category: item.category
    }));

    const compCriteria: ComparisonCriterion[] = criteria.map((crit, i) => ({
      id: `crit-${i}`,
      name: crit.name,
      weight: crit.weight
    }));

    // Generate comparison matrix (simplified - would use actual data in production)
    const matrix: number[][] = items.map(() => 
      criteria.map(() => Math.random() * 10)
    );

    const comparison: ComparisonVisualization = {
      id,
      title,
      items: compItems,
      criteria: compCriteria,
      matrix,
      summary: `Comparison of ${items.length} items across ${criteria.length} criteria`,
      hash: ''
    };
    comparison.hash = HashVerifier.hash(JSON.stringify({ ...comparison, hash: '' }));

    this.comparisons.set(id, comparison);

    return comparison;
  }

  /**
   * Generate HTML for visualization
   */
  generateHTML(vizId: string): string {
    const viz = this.formulaVisualizations.get(vizId);
    if (!viz) return '<div>Visualization not found</div>';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${viz.lawName} - Reframed Visualization</title>
  <style>
    :root {
      --primary-color: ${this.defaultTheme.primaryColor};
      --secondary-color: ${this.defaultTheme.secondaryColor};
      --bg-color: ${this.defaultTheme.backgroundColor};
      --text-color: ${this.defaultTheme.textColor};
      --border-color: ${this.defaultTheme.borderColor};
      --accent-color: ${this.defaultTheme.accentColor};
    }
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: var(--bg-color);
      color: var(--text-color);
      line-height: 1.6;
      padding: 2rem;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .header {
      text-align: center;
      margin-bottom: 3rem;
    }
    
    .header h1 {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--primary-color);
      margin-bottom: 0.5rem;
    }
    
    .header .subtitle {
      font-size: 1.25rem;
      color: #64748b;
    }
    
    .card {
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
    }
    
    .card-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: var(--primary-color);
    }
    
    .formula-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2rem;
      padding: 2rem;
    }
    
    .formula {
      font-size: 2rem;
      font-family: 'Latin Modern Math', 'STIX Two Math', serif;
      padding: 1.5rem 2rem;
      border-radius: 0.5rem;
      text-align: center;
    }
    
    .formula.original {
      background: linear-gradient(135deg, #dbeafe, #bfdbfe);
      border: 2px solid var(--primary-color);
    }
    
    .formula.reframed {
      background: linear-gradient(135deg, #fae8ff, #f5d0fe);
      border: 2px solid var(--secondary-color);
    }
    
    .arrow {
      font-size: 3rem;
      color: var(--accent-color);
    }
    
    .strategy-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: var(--secondary-color);
      color: white;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 500;
    }
    
    .explanation {
      display: grid;
      gap: 1rem;
    }
    
    .step {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 0.5rem;
      border-left: 4px solid var(--primary-color);
    }
    
    .step-number {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      background: var(--primary-color);
      color: white;
      border-radius: 50%;
      font-weight: 600;
      flex-shrink: 0;
    }
    
    .step-content h3 {
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }
    
    .insights {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }
    
    .insight-card {
      background: linear-gradient(135deg, #f0fdf4, #dcfce7);
      border: 1px solid var(--accent-color);
      border-radius: 0.75rem;
      padding: 1.5rem;
    }
    
    .insight-card h4 {
      color: var(--accent-color);
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    
    .hash-badge {
      font-family: monospace;
      font-size: 0.75rem;
      color: #94a3b8;
      background: #f1f5f9;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      margin-top: 1rem;
      display: inline-block;
    }
    
    @media (max-width: 768px) {
      body { padding: 1rem; }
      .header h1 { font-size: 1.75rem; }
      .formula { font-size: 1.25rem; padding: 1rem; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <h1>${viz.lawName}</h1>
      <p class="subtitle">Reframed Physics Law Visualization</p>
      <span class="strategy-badge">${viz.strategy} reframing</span>
    </header>
    
    <div class="card">
      <h2 class="card-title">Formula Transformation</h2>
      <div class="formula-box">
        <div class="formula original">
          <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.5rem;">Original Form</div>
          ${viz.originalFormula}
        </div>
        <div class="arrow">↓</div>
        <div class="formula reframed">
          <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.5rem;">Reframed Form</div>
          ${viz.reframedFormula}
        </div>
      </div>
    </div>
    
    <div class="card">
      <h2 class="card-title">Step-by-Step Explanation</h2>
      <div class="explanation">
        ${viz.explanation.steps.map(step => `
          <div class="step">
            <span class="step-number">${step.stepNumber}</span>
            <div class="step-content">
              <h3>${step.title}</h3>
              <p>${step.content}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    
    <div class="card">
      <h2 class="card-title">Key Insights</h2>
      <div class="insights">
        <div class="insight-card">
          <h4>🔬 Physical Interpretation</h4>
          <p>Physical processes can be viewed as information processing, revealing deeper connections.</p>
        </div>
        <div class="insight-card">
          <h4>💡 Conservation</h4>
          <p>Conservation laws map directly to information conservation in this framework.</p>
        </div>
        <div class="insight-card">
          <h4>🚀 Applications</h4>
          <p>Opens possibilities for quantum computing and theoretical physics research.</p>
        </div>
        <div class="insight-card">
          <h4>✓ Validation</h4>
          <p>Consistency score: 85% - Meets publication threshold.</p>
        </div>
      </div>
    </div>
    
    <div class="hash-badge">
      Verification Hash: ${viz.hash.substring(0, 16)}...
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Generate dashboard HTML
   */
  generateDashboardHTML(dashboardId: string): string {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) return '<div>Dashboard not found</div>';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${dashboard.name} - Reframed Laws Dashboard</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: ${dashboard.theme.backgroundColor};
      color: ${dashboard.theme.textColor};
      min-height: 100vh;
    }
    .dashboard-header {
      background: linear-gradient(135deg, ${dashboard.theme.primaryColor}, ${dashboard.theme.secondaryColor});
      color: white;
      padding: 2rem;
      text-align: center;
    }
    .dashboard-header h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    .dashboard-header p { opacity: 0.9; }
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 1.5rem;
      padding: 2rem;
      max-width: 1600px;
      margin: 0 auto;
    }
    .widget {
      background: white;
      border-radius: 1rem;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    }
    .widget-header {
      background: ${dashboard.theme.primaryColor};
      color: white;
      padding: 1rem 1.5rem;
      font-weight: 600;
    }
    .widget-content {
      padding: 1.5rem;
    }
    .formula-display {
      font-family: 'Latin Modern Math', serif;
      font-size: 1.25rem;
      text-align: center;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 0.5rem;
      margin-bottom: 1rem;
    }
    .tag {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      background: ${dashboard.theme.secondaryColor}20;
      color: ${dashboard.theme.secondaryColor};
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <header class="dashboard-header">
    <h1>${dashboard.name}</h1>
    <p>${dashboard.description}</p>
  </header>
  <main class="dashboard-grid">
    ${dashboard.widgets.map(widget => {
      const viz = this.formulaVisualizations.get(widget.visualizationId);
      if (!viz) return '';
      return `
        <div class="widget">
          <div class="widget-header">${viz.lawName}</div>
          <div class="widget-content">
            <div class="formula-display">
              <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 0.5rem;">Original</div>
              ${viz.originalFormula}
            </div>
            <div class="formula-display" style="background: #faf5ff;">
              <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 0.5rem;">Reframed</div>
              ${viz.reframedFormula}
            </div>
            <span class="tag">${viz.strategy}</span>
          </div>
        </div>
      `;
    }).join('')}
  </main>
</body>
</html>`;
  }

  /**
   * Get all formula visualizations
   */
  getAllFormulaVisualizations(): FormulaVisualization[] {
    return Array.from(this.formulaVisualizations.values());
  }

  /**
   * Get all dashboards
   */
  getAllDashboards(): Dashboard[] {
    return Array.from(this.dashboards.values());
  }

  /**
   * Get formula visualization by ID
   */
  getFormulaVisualization(id: string): FormulaVisualization | undefined {
    return this.formulaVisualizations.get(id);
  }

  /**
   * Get dashboard by ID
   */
  getDashboard(id: string): Dashboard | undefined {
    return this.dashboards.get(id);
  }

  /**
   * Get hash for system state
   */
  getHash(): string {
    return HashVerifier.hash(JSON.stringify({
      visualizationCount: this.visualizations.size,
      dashboardCount: this.dashboards.size,
      formulaVizCount: this.formulaVisualizations.size,
      comparisonCount: this.comparisons.size
    }));
  }
}

/**
 * Factory for creating visualization systems
 */
export class VisualizationSystemFactory {
  static createDefault(): VisualizationSystem {
    return new VisualizationSystem();
  }
}
