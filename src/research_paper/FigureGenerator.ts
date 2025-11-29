/**
 * FigureGenerator - PRD-16 Phase 16.3
 * Automated figure and diagram generation
 */

import { Logger } from '../core/logger/Logger';
import { HashVerifier } from '../core/logger/HashVerifier';

// Figure types
export type FigureType = 
  | 'schematic'
  | 'graph'
  | 'diagram'
  | 'flowchart'
  | 'comparison'
  | 'visualization';

// Figure definition
export interface Figure {
  id: string;
  type: FigureType;
  caption: string;
  description: string;
  elements: FigureElement[];
  width: number;
  height: number;
  hash: string;
}

export interface FigureElement {
  type: string;
  properties: Record<string, string | number>;
  label?: string;
}

// Diagram
export interface Diagram {
  id: string;
  name: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  layout: string;
  hash: string;
}

export interface DiagramNode {
  id: string;
  label: string;
  type: string;
  position?: { x: number; y: number };
}

export interface DiagramEdge {
  source: string;
  target: string;
  label?: string;
  style?: string;
}

// Chart
export interface Chart {
  id: string;
  type: 'line' | 'bar' | 'scatter' | 'pie' | 'area';
  title: string;
  data: ChartData;
  options: Record<string, unknown>;
  hash: string;
}

export interface ChartData {
  labels: string[];
  datasets: { label: string; data: number[] }[];
}

/**
 * FigureGenerator - Main figure generation class
 */
export class FigureGenerator {
  private logger: Logger;
  private figures: Map<string, Figure> = new Map();
  private diagrams: Map<string, Diagram> = new Map();
  private charts: Map<string, Chart> = new Map();
  private figureCount: number = 0;

  constructor() {
    this.logger = Logger.getInstance();
  }

  /**
   * Create schematic figure
   */
  createSchematic(config: {
    caption: string;
    description: string;
    elements: FigureElement[];
  }): Figure {
    return this.createFigure('schematic', config);
  }

  /**
   * Create diagram
   */
  createDiagram(config: {
    name: string;
    nodes: DiagramNode[];
    edges: DiagramEdge[];
    layout: string;
  }): Diagram {
    const id = `diagram-${++this.figureCount}`;
    
    const diagram: Diagram = {
      id,
      ...config,
      hash: ''
    };
    diagram.hash = HashVerifier.hash(JSON.stringify({ ...diagram, hash: '' }));

    this.diagrams.set(id, diagram);

    this.logger.info('Diagram created', {
      id,
      name: config.name,
      nodes: config.nodes.length,
      edges: config.edges.length,
      hash: diagram.hash
    });

    return diagram;
  }

  /**
   * Create chart
   */
  createChart(config: {
    type: Chart['type'];
    title: string;
    data: ChartData;
    options?: Record<string, unknown>;
  }): Chart {
    const id = `chart-${++this.figureCount}`;
    
    const chart: Chart = {
      id,
      ...config,
      options: config.options || {},
      hash: ''
    };
    chart.hash = HashVerifier.hash(JSON.stringify({ ...chart, hash: '' }));

    this.charts.set(id, chart);

    this.logger.info('Chart created', {
      id,
      type: config.type,
      title: config.title,
      hash: chart.hash
    });

    return chart;
  }

  private createFigure(type: FigureType, config: {
    caption: string;
    description: string;
    elements: FigureElement[];
  }): Figure {
    const id = `fig-${++this.figureCount}`;
    
    const figure: Figure = {
      id,
      type,
      caption: config.caption,
      description: config.description,
      elements: config.elements,
      width: 800,
      height: 600,
      hash: ''
    };
    figure.hash = HashVerifier.hash(JSON.stringify({ ...figure, hash: '' }));

    this.figures.set(id, figure);

    this.logger.info('Figure created', {
      id,
      type,
      caption: config.caption,
      hash: figure.hash
    });

    return figure;
  }

  /**
   * Generate formula transformation figure
   */
  generateFormulaTransformation(originalFormula: string, reframedFormula: string, strategy: string): Figure {
    return this.createFigure('visualization', {
      caption: `Formula transformation using ${strategy} reframing`,
      description: `Visual representation of the transformation from ${originalFormula} to ${reframedFormula}`,
      elements: [
        { type: 'box', properties: { content: originalFormula, style: 'original' }, label: 'Original' },
        { type: 'arrow', properties: { direction: 'down', style: 'transformation' } },
        { type: 'box', properties: { content: reframedFormula, style: 'reframed' }, label: 'Reframed' }
      ]
    });
  }

  /**
   * Generate comparison chart
   */
  generateComparisonChart(title: string, categories: string[], values: number[][]): Chart {
    return this.createChart({
      type: 'bar',
      title,
      data: {
        labels: categories,
        datasets: values.map((v, i) => ({
          label: `Dataset ${i + 1}`,
          data: v
        }))
      }
    });
  }

  /**
   * Get all figures
   */
  getAllFigures(): Figure[] {
    return Array.from(this.figures.values());
  }

  /**
   * Get all diagrams
   */
  getAllDiagrams(): Diagram[] {
    return Array.from(this.diagrams.values());
  }

  /**
   * Get all charts
   */
  getAllCharts(): Chart[] {
    return Array.from(this.charts.values());
  }

  /**
   * Get hash
   */
  getHash(): string {
    return HashVerifier.hash(JSON.stringify({
      figureCount: this.figures.size,
      diagramCount: this.diagrams.size,
      chartCount: this.charts.size
    }));
  }
}

/**
 * Factory for creating FigureGenerator
 */
export class FigureGeneratorFactory {
  static createDefault(): FigureGenerator {
    return new FigureGenerator();
  }
}
