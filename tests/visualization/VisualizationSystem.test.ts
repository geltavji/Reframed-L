/**
 * Tests for VisualizationSystem
 * PRD-17: Visualization UI/UX System
 */

import { VisualizationSystem, VisualizationSystemFactory } from '../../src/visualization/VisualizationSystem';

describe('VisualizationSystem', () => {
  let vizSystem: VisualizationSystem;

  beforeEach(() => {
    vizSystem = VisualizationSystemFactory.createDefault();
  });

  describe('Initialization', () => {
    it('should initialize with default visualizations', () => {
      const vizs = vizSystem.getAllFormulaVisualizations();
      expect(vizs.length).toBeGreaterThan(0);
    });

    it('should initialize with default dashboard', () => {
      const dashboards = vizSystem.getAllDashboards();
      expect(dashboards.length).toBeGreaterThan(0);
    });
  });

  describe('Formula Visualizations', () => {
    it('should create formula visualization', () => {
      const viz = vizSystem.createFormulaVisualization({
        lawName: 'Test Law',
        originalFormula: 'E = mc²',
        reframedFormula: 'I(E) = -log₂(P(E))',
        strategy: 'information'
      });

      expect(viz).toBeDefined();
      expect(viz.id).toBeDefined();
      expect(viz.lawName).toBe('Test Law');
      expect(viz.hash.length).toBe(64);
    });

    it('should have diagram with elements', () => {
      const viz = vizSystem.createFormulaVisualization({
        lawName: 'Test Law',
        originalFormula: 'F = ma',
        reframedFormula: 'COMPUTE(F = ma)',
        strategy: 'computational'
      });

      expect(viz.diagram).toBeDefined();
      expect(viz.diagram.elements.length).toBeGreaterThan(0);
      expect(viz.diagram.relationships.length).toBeGreaterThan(0);
    });

    it('should have explanation with steps', () => {
      const viz = vizSystem.createFormulaVisualization({
        lawName: 'Test Law',
        originalFormula: 'F = ma',
        reframedFormula: '∇_μ(F = ma) = 0',
        strategy: 'geometric'
      });

      expect(viz.explanation).toBeDefined();
      expect(viz.explanation.steps.length).toBeGreaterThan(0);
      expect(viz.explanation.difficulty).toBeDefined();
      expect(viz.explanation.estimatedTime).toBeGreaterThan(0);
    });

    it('should have quiz in explanation steps', () => {
      const viz = vizSystem.createFormulaVisualization({
        lawName: 'Test Law',
        originalFormula: 'F = ma',
        reframedFormula: 'F_boundary ↔ F_bulk',
        strategy: 'holographic'
      });

      const stepWithQuiz = viz.explanation.steps.find(s => s.quiz);
      expect(stepWithQuiz).toBeDefined();
      expect(stepWithQuiz?.quiz?.question).toBeDefined();
      expect(stepWithQuiz?.quiz?.options.length).toBeGreaterThan(0);
    });
  });

  describe('Dashboard', () => {
    it('should create dashboard', () => {
      const dashboard = vizSystem.createDashboard({
        name: 'Test Dashboard',
        description: 'Test description',
        layout: 'grid'
      });

      expect(dashboard).toBeDefined();
      expect(dashboard.id).toBeDefined();
      expect(dashboard.name).toBe('Test Dashboard');
      expect(dashboard.hash.length).toBe(64);
    });

    it('should have widgets linked to visualizations', () => {
      const dashboards = vizSystem.getAllDashboards();
      const dashboard = dashboards[0];

      expect(dashboard.widgets.length).toBeGreaterThan(0);
      for (const widget of dashboard.widgets) {
        expect(widget.visualizationId).toBeDefined();
      }
    });

    it('should have theme configuration', () => {
      const dashboards = vizSystem.getAllDashboards();
      const dashboard = dashboards[0];

      expect(dashboard.theme).toBeDefined();
      expect(dashboard.theme.primaryColor).toBeDefined();
      expect(dashboard.theme.backgroundColor).toBeDefined();
    });

    it('should have permissions', () => {
      const dashboards = vizSystem.getAllDashboards();
      const dashboard = dashboards[0];

      expect(dashboard.permissions.length).toBeGreaterThan(0);
      expect(dashboard.permissions.some(p => p.role === 'viewer')).toBe(true);
      expect(dashboard.permissions.some(p => p.role === 'admin')).toBe(true);
    });
  });

  describe('HTML Generation', () => {
    it('should generate visualization HTML', () => {
      const vizs = vizSystem.getAllFormulaVisualizations();
      const html = vizSystem.generateHTML(vizs[0].id);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
      expect(html).toContain('</html>');
      expect(html).toContain(vizs[0].lawName);
    });

    it('should generate dashboard HTML', () => {
      const dashboards = vizSystem.getAllDashboards();
      const html = vizSystem.generateDashboardHTML(dashboards[0].id);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
      expect(html).toContain('</html>');
      expect(html).toContain(dashboards[0].name);
    });

    it('should include styling in generated HTML', () => {
      const vizs = vizSystem.getAllFormulaVisualizations();
      const html = vizSystem.generateHTML(vizs[0].id);

      expect(html).toContain('<style>');
      expect(html).toContain('</style>');
      expect(html).toContain('--primary-color');
    });

    it('should include formula display in HTML', () => {
      const viz = vizSystem.createFormulaVisualization({
        lawName: 'HTML Test',
        originalFormula: 'E = mc²',
        reframedFormula: 'I(E) = -log₂(P(E))',
        strategy: 'information'
      });

      const html = vizSystem.generateHTML(viz.id);
      expect(html).toContain('E = mc²');
      expect(html).toContain('I(E) = -log₂(P(E))');
    });

    it('should return error message for invalid ID', () => {
      const html = vizSystem.generateHTML('invalid-id');
      expect(html).toContain('not found');
    });
  });

  describe('Comparison', () => {
    it('should create comparison visualization', () => {
      const comparison = vizSystem.createComparison(
        'Strategy Comparison',
        [
          { name: 'Information', description: 'Info theory', category: 'theory' },
          { name: 'Computational', description: 'Computation', category: 'theory' }
        ],
        [
          { name: 'Feasibility', weight: 0.3 },
          { name: 'Insight', weight: 0.4 }
        ]
      );

      expect(comparison).toBeDefined();
      expect(comparison.id).toBeDefined();
      expect(comparison.items.length).toBe(2);
      expect(comparison.criteria.length).toBe(2);
      expect(comparison.matrix.length).toBe(2);
    });
  });

  describe('Retrieval', () => {
    it('should retrieve visualization by ID', () => {
      const created = vizSystem.createFormulaVisualization({
        lawName: 'Retrieve Test',
        originalFormula: 'F = ma',
        reframedFormula: 'I(F)',
        strategy: 'information'
      });

      const retrieved = vizSystem.getFormulaVisualization(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
    });

    it('should retrieve dashboard by ID', () => {
      const created = vizSystem.createDashboard({
        name: 'Retrieve Dashboard',
        description: 'Test',
        layout: 'grid'
      });

      const retrieved = vizSystem.getDashboard(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
    });
  });

  describe('Accessibility', () => {
    it('should include accessibility features in HTML', () => {
      const vizs = vizSystem.getAllFormulaVisualizations();
      const html = vizSystem.generateHTML(vizs[0].id);

      expect(html).toContain('lang="en"');
      expect(html).toContain('viewport');
    });
  });

  describe('Hash', () => {
    it('should compute system hash', () => {
      const hash = vizSystem.getHash();
      expect(hash).toBeDefined();
      expect(hash.length).toBe(64);
    });
  });
});
