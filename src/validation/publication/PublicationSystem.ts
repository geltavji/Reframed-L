/**
 * PublicationSystem - Publication Preparation System (M09.05)
 * PRD-09 Phase 9.5: Publication Preparation
 * 
 * Formats papers for publication, generates LaTeX, and creates figures
 */

import { Logger, LogLevel } from '../../core/logger/Logger';
import { HashVerifier } from '../../core/logger/HashVerifier';

// ============================================================================
// INTERFACES
// ============================================================================

export interface DocumentConfig {
  documentClass: 'article' | 'report' | 'book' | 'ieeetran' | 'revtex4';
  fontSize: number;
  paperSize: 'a4' | 'letter';
  columns: 1 | 2;
  packages: string[];
  bibliography: 'bibtex' | 'biblatex' | 'natbib';
}

export interface Author {
  name: string;
  affiliation: string;
  email?: string;
  orcid?: string;
}

export interface PaperMetadata {
  title: string;
  authors: Author[];
  abstract: string;
  keywords: string[];
  date: Date;
  journal?: string;
  volume?: string;
  pages?: string;
  doi?: string;
}

export interface LatexDocument {
  preamble: string;
  body: string;
  bibliography: string;
  full: string;
  hash: string;
}

export interface Figure {
  id: string;
  type: 'plot' | 'diagram' | 'image' | 'schematic';
  caption: string;
  label: string;
  width?: number; // fraction of textwidth
  data?: FigureData;
  position?: 'h' | 't' | 'b' | 'p' | 'H';
}

export interface FigureData {
  xLabel: string;
  yLabel: string;
  title?: string;
  series: DataSeries[];
  xRange?: [number, number];
  yRange?: [number, number];
  legend?: boolean;
  grid?: boolean;
}

export interface DataSeries {
  name: string;
  x: number[];
  y: number[];
  style?: 'line' | 'scatter' | 'bar' | 'area';
  color?: string;
  marker?: string;
}

export interface TableData {
  id: string;
  caption: string;
  label: string;
  headers: string[];
  rows: (string | number)[][];
  alignment?: ('l' | 'c' | 'r')[];
  position?: 'h' | 't' | 'b' | 'p' | 'H';
}

export interface Equation {
  id: string;
  latex: string;
  label?: string;
  numbered?: boolean;
  description?: string;
}

export interface BibEntry {
  key: string;
  type: 'article' | 'book' | 'inproceedings' | 'misc' | 'thesis' | 'techreport';
  title: string;
  authors: string[];
  year: number;
  journal?: string;
  booktitle?: string;
  volume?: string;
  number?: string;
  pages?: string;
  publisher?: string;
  doi?: string;
  url?: string;
  note?: string;
}

export interface GeneratedFigure {
  id: string;
  tikzCode: string;
  pgfplotsCode?: string;
  svgPath?: string;
  pdfPath?: string;
  hash: string;
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

export const DefaultConfigs = {
  ARTICLE: {
    documentClass: 'article' as const,
    fontSize: 12,
    paperSize: 'a4' as const,
    columns: 1 as const,
    packages: ['amsmath', 'amssymb', 'graphicx', 'hyperref', 'booktabs'],
    bibliography: 'bibtex' as const
  },
  IEEE: {
    documentClass: 'ieeetran' as const,
    fontSize: 10,
    paperSize: 'letter' as const,
    columns: 2 as const,
    packages: ['amsmath', 'amssymb', 'graphicx', 'cite', 'algorithm', 'algorithmic'],
    bibliography: 'bibtex' as const
  },
  PHYSICS: {
    documentClass: 'revtex4' as const,
    fontSize: 10,
    paperSize: 'letter' as const,
    columns: 2 as const,
    packages: ['amsmath', 'amssymb', 'graphicx', 'bm', 'physics'],
    bibliography: 'bibtex' as const
  }
};

// ============================================================================
// LATEX GENERATOR
// ============================================================================

export class LaTeXGenerator {
  private logger: Logger;
  private config: DocumentConfig;

  constructor(config: DocumentConfig = DefaultConfigs.ARTICLE, logger?: Logger) {
    this.config = config;
    this.logger = logger || Logger.getInstance({ minLevel: LogLevel.INFO, enableConsole: false });
  }

  /**
   * Generate complete LaTeX document
   */
  generateDocument(
    metadata: PaperMetadata,
    sections: { title: string; content: string }[],
    figures: Figure[] = [],
    tables: TableData[] = [],
    equations: Equation[] = [],
    bibliography: BibEntry[] = []
  ): LatexDocument {
    const preamble = this.generatePreamble(metadata);
    const body = this.generateBody(metadata, sections, figures, tables, equations);
    const biblio = this.generateBibliography(bibliography);

    const full = `${preamble}\n\n\\begin{document}\n\n${body}\n\n${biblio}\n\n\\end{document}`;

    const doc: Omit<LatexDocument, 'hash'> = {
      preamble,
      body,
      bibliography: biblio,
      full
    };

    return {
      ...doc,
      hash: HashVerifier.hash(full)
    };
  }

  /**
   * Generate document preamble
   */
  private generatePreamble(metadata: PaperMetadata): string {
    const lines: string[] = [];

    // Document class
    const classOptions: string[] = [];
    classOptions.push(`${this.config.fontSize}pt`);
    classOptions.push(this.config.paperSize + 'paper');
    if (this.config.columns === 2) classOptions.push('twocolumn');

    lines.push(`\\documentclass[${classOptions.join(',')}]{${this.config.documentClass}}`);
    lines.push('');

    // Packages
    for (const pkg of this.config.packages) {
      lines.push(`\\usepackage{${pkg}}`);
    }
    lines.push('');

    // Title and author
    lines.push(`\\title{${this.escapeLatex(metadata.title)}}`);
    lines.push('');

    const authorLines = metadata.authors.map(a => {
      let author = this.escapeLatex(a.name);
      if (a.affiliation) {
        author += `\\\\${this.escapeLatex(a.affiliation)}`;
      }
      if (a.email) {
        author += `\\\\\\texttt{${this.escapeLatex(a.email)}}`;
      }
      return author;
    });

    lines.push(`\\author{${authorLines.join(' \\and ')}}`);
    lines.push('');

    lines.push(`\\date{${metadata.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}}`);

    return lines.join('\n');
  }

  /**
   * Generate document body
   */
  private generateBody(
    metadata: PaperMetadata,
    sections: { title: string; content: string }[],
    figures: Figure[],
    tables: TableData[],
    equations: Equation[]
  ): string {
    const lines: string[] = [];

    // Title
    lines.push('\\maketitle');
    lines.push('');

    // Abstract
    lines.push('\\begin{abstract}');
    lines.push(this.escapeLatex(metadata.abstract));
    lines.push('\\end{abstract}');
    lines.push('');

    // Keywords
    if (metadata.keywords.length > 0) {
      lines.push(`\\textbf{Keywords:} ${metadata.keywords.map(k => this.escapeLatex(k)).join(', ')}`);
      lines.push('');
    }

    // Sections
    for (const section of sections) {
      lines.push(`\\section{${this.escapeLatex(section.title)}}`);
      lines.push(this.escapeLatex(section.content));
      lines.push('');
    }

    // Add figures section if any
    if (figures.length > 0) {
      lines.push('% Figures');
      for (const fig of figures) {
        lines.push(this.generateFigureLatex(fig));
        lines.push('');
      }
    }

    // Add tables section if any
    if (tables.length > 0) {
      lines.push('% Tables');
      for (const table of tables) {
        lines.push(this.generateTableLatex(table));
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * Generate LaTeX for a figure
   */
  generateFigureLatex(figure: Figure): string {
    const position = figure.position || 'htbp';
    const width = figure.width || 0.8;

    const lines: string[] = [];
    lines.push(`\\begin{figure}[${position}]`);
    lines.push('\\centering');
    
    if (figure.data) {
      lines.push(this.generatePgfPlot(figure.data, width));
    } else {
      lines.push(`\\includegraphics[width=${width}\\textwidth]{${figure.id}}`);
    }
    
    lines.push(`\\caption{${this.escapeLatex(figure.caption)}}`);
    lines.push(`\\label{fig:${figure.label}}`);
    lines.push('\\end{figure}');

    return lines.join('\n');
  }

  /**
   * Generate PGFPlots code for data visualization
   */
  private generatePgfPlot(data: FigureData, width: number): string {
    const lines: string[] = [];

    lines.push('\\begin{tikzpicture}');
    lines.push('\\begin{axis}[');
    lines.push(`    width=${width}\\textwidth,`);
    lines.push(`    xlabel={${this.escapeLatex(data.xLabel)}},`);
    lines.push(`    ylabel={${this.escapeLatex(data.yLabel)}},`);
    
    if (data.title) {
      lines.push(`    title={${this.escapeLatex(data.title)}},`);
    }
    if (data.legend !== false) {
      lines.push('    legend pos=north west,');
    }
    if (data.grid) {
      lines.push('    grid=major,');
    }
    if (data.xRange) {
      lines.push(`    xmin=${data.xRange[0]}, xmax=${data.xRange[1]},`);
    }
    if (data.yRange) {
      lines.push(`    ymin=${data.yRange[0]}, ymax=${data.yRange[1]},`);
    }
    
    lines.push(']');

    // Add data series
    for (const series of data.series) {
      const style = series.style || 'line';
      const marker = series.marker || 'none';
      const color = series.color || 'blue';

      if (style === 'scatter') {
        lines.push(`\\addplot[only marks, mark=${marker === 'none' ? '*' : marker}, color=${color}] coordinates {`);
      } else {
        lines.push(`\\addplot[${color}, mark=${marker}] coordinates {`);
      }

      const coords = series.x.map((x, i) => `    (${x}, ${series.y[i]})`);
      lines.push(coords.join('\n'));
      lines.push('};');
      
      if (data.legend !== false) {
        lines.push(`\\addlegendentry{${this.escapeLatex(series.name)}}`);
      }
    }

    lines.push('\\end{axis}');
    lines.push('\\end{tikzpicture}');

    return lines.join('\n');
  }

  /**
   * Generate LaTeX for a table
   */
  generateTableLatex(table: TableData): string {
    const position = table.position || 'htbp';
    const alignment = table.alignment || table.headers.map(() => 'c');
    const alignStr = alignment.join('');

    const lines: string[] = [];
    lines.push(`\\begin{table}[${position}]`);
    lines.push('\\centering');
    lines.push(`\\caption{${this.escapeLatex(table.caption)}}`);
    lines.push(`\\label{tab:${table.label}}`);
    lines.push(`\\begin{tabular}{${alignStr}}`);
    lines.push('\\toprule');

    // Headers
    lines.push(table.headers.map(h => this.escapeLatex(String(h))).join(' & ') + ' \\\\');
    lines.push('\\midrule');

    // Data rows
    for (const row of table.rows) {
      lines.push(row.map(cell => this.escapeLatex(String(cell))).join(' & ') + ' \\\\');
    }

    lines.push('\\bottomrule');
    lines.push('\\end{tabular}');
    lines.push('\\end{table}');

    return lines.join('\n');
  }

  /**
   * Generate LaTeX for an equation
   */
  generateEquationLatex(equation: Equation): string {
    if (equation.numbered && equation.label) {
      return `\\begin{equation}\n\\label{eq:${equation.label}}\n${equation.latex}\n\\end{equation}`;
    } else if (equation.numbered) {
      return `\\begin{equation}\n${equation.latex}\n\\end{equation}`;
    } else {
      return `\\begin{equation*}\n${equation.latex}\n\\end{equation*}`;
    }
  }

  /**
   * Generate bibliography
   */
  private generateBibliography(entries: BibEntry[]): string {
    if (entries.length === 0) {
      return '';
    }

    const lines: string[] = [];
    lines.push('\\bibliographystyle{plain}');
    lines.push('% Bibliography entries would be in a .bib file');
    lines.push('% \\bibliography{references}');
    lines.push('');
    lines.push('% For inline references:');
    lines.push('\\begin{thebibliography}{99}');

    for (const entry of entries) {
      lines.push(this.generateBibItem(entry));
    }

    lines.push('\\end{thebibliography}');

    return lines.join('\n');
  }

  /**
   * Generate a bibliography item
   */
  private generateBibItem(entry: BibEntry): string {
    const authors = entry.authors.join(', ');
    let text = `${authors}. `;
    text += `\\textit{${this.escapeLatex(entry.title)}}. `;
    
    if (entry.journal) {
      text += `${entry.journal}`;
      if (entry.volume) text += `, ${entry.volume}`;
      if (entry.number) text += `(${entry.number})`;
      if (entry.pages) text += `:${entry.pages}`;
      text += `, ${entry.year}.`;
    } else if (entry.booktitle) {
      text += `In ${entry.booktitle}, ${entry.year}.`;
    } else {
      text += `${entry.year}.`;
    }

    return `\\bibitem{${entry.key}} ${text}`;
  }

  /**
   * Generate BibTeX entry
   */
  generateBibTexEntry(entry: BibEntry): string {
    const lines: string[] = [];
    lines.push(`@${entry.type}{${entry.key},`);
    lines.push(`  author = {${entry.authors.join(' and ')}},`);
    lines.push(`  title = {${entry.title}},`);
    lines.push(`  year = {${entry.year}},`);
    
    if (entry.journal) lines.push(`  journal = {${entry.journal}},`);
    if (entry.booktitle) lines.push(`  booktitle = {${entry.booktitle}},`);
    if (entry.volume) lines.push(`  volume = {${entry.volume}},`);
    if (entry.number) lines.push(`  number = {${entry.number}},`);
    if (entry.pages) lines.push(`  pages = {${entry.pages}},`);
    if (entry.publisher) lines.push(`  publisher = {${entry.publisher}},`);
    if (entry.doi) lines.push(`  doi = {${entry.doi}},`);
    if (entry.url) lines.push(`  url = {${entry.url}},`);
    
    lines.push('}');
    return lines.join('\n');
  }

  /**
   * Escape LaTeX special characters
   */
  escapeLatex(text: string): string {
    const replacements: [RegExp, string][] = [
      [/\\/g, '\\textbackslash{}'],
      [/\{/g, '\\{'],
      [/\}/g, '\\}'],
      [/\$/g, '\\$'],
      [/&/g, '\\&'],
      [/#/g, '\\#'],
      [/%/g, '\\%'],
      [/_/g, '\\_'],
      [/\^/g, '\\textasciicircum{}'],
      [/~/g, '\\textasciitilde{}']
    ];

    let escaped = text;
    for (const [pattern, replacement] of replacements) {
      escaped = escaped.replace(pattern, replacement);
    }
    return escaped;
  }

  /**
   * Set configuration
   */
  setConfig(config: Partial<DocumentConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get hash for verification
   */
  getHash(): string {
    return HashVerifier.hash(JSON.stringify(this.config));
  }
}

// ============================================================================
// FIGURE GENERATOR
// ============================================================================

export class FigureGenerator {
  private logger: Logger;
  private figures: Map<string, GeneratedFigure> = new Map();

  constructor(logger?: Logger) {
    this.logger = logger || Logger.getInstance({ minLevel: LogLevel.INFO, enableConsole: false });
  }

  /**
   * Generate a line plot
   */
  generateLinePlot(
    data: DataSeries[],
    options: Partial<FigureData> = {}
  ): GeneratedFigure {
    const id = `fig-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    const figureData: FigureData = {
      xLabel: options.xLabel || 'x',
      yLabel: options.yLabel || 'y',
      title: options.title,
      series: data,
      xRange: options.xRange,
      yRange: options.yRange,
      legend: options.legend !== false,
      grid: options.grid || false
    };

    const tikzCode = this.generateTikzCode(figureData, 'line');
    
    const figure: Omit<GeneratedFigure, 'hash'> = {
      id,
      tikzCode,
      pgfplotsCode: tikzCode
    };

    const result: GeneratedFigure = {
      ...figure,
      hash: HashVerifier.hash(tikzCode)
    };

    this.figures.set(id, result);
    return result;
  }

  /**
   * Generate a scatter plot
   */
  generateScatterPlot(
    data: DataSeries[],
    options: Partial<FigureData> = {}
  ): GeneratedFigure {
    const id = `fig-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    const scatterData = data.map(series => ({ ...series, style: 'scatter' as const }));
    
    const figureData: FigureData = {
      xLabel: options.xLabel || 'x',
      yLabel: options.yLabel || 'y',
      title: options.title,
      series: scatterData,
      xRange: options.xRange,
      yRange: options.yRange,
      legend: options.legend !== false,
      grid: options.grid || false
    };

    const tikzCode = this.generateTikzCode(figureData, 'scatter');
    
    const figure: Omit<GeneratedFigure, 'hash'> = {
      id,
      tikzCode,
      pgfplotsCode: tikzCode
    };

    const result: GeneratedFigure = {
      ...figure,
      hash: HashVerifier.hash(tikzCode)
    };

    this.figures.set(id, result);
    return result;
  }

  /**
   * Generate a bar chart
   */
  generateBarChart(
    categories: string[],
    values: number[],
    options: { title?: string; xLabel?: string; yLabel?: string; color?: string } = {}
  ): GeneratedFigure {
    const id = `fig-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    const lines: string[] = [];
    lines.push('\\begin{tikzpicture}');
    lines.push('\\begin{axis}[');
    lines.push('    ybar,');
    lines.push('    width=0.8\\textwidth,');
    lines.push('    height=0.5\\textwidth,');
    lines.push(`    xlabel={${options.xLabel || ''}},`);
    lines.push(`    ylabel={${options.yLabel || ''}},`);
    
    if (options.title) {
      lines.push(`    title={${options.title}},`);
    }
    
    lines.push('    symbolic x coords={' + categories.join(',') + '},');
    lines.push('    xtick=data,');
    lines.push('    nodes near coords,');
    lines.push('    nodes near coords align={vertical},');
    lines.push(']');

    const color = options.color || 'blue!70';
    lines.push(`\\addplot[fill=${color}] coordinates {`);
    categories.forEach((cat, i) => {
      lines.push(`    (${cat}, ${values[i]})`);
    });
    lines.push('};');
    
    lines.push('\\end{axis}');
    lines.push('\\end{tikzpicture}');

    const tikzCode = lines.join('\n');
    
    const figure: Omit<GeneratedFigure, 'hash'> = {
      id,
      tikzCode
    };

    const result: GeneratedFigure = {
      ...figure,
      hash: HashVerifier.hash(tikzCode)
    };

    this.figures.set(id, result);
    return result;
  }

  /**
   * Generate a histogram
   */
  generateHistogram(
    data: number[],
    bins: number = 10,
    options: { title?: string; xLabel?: string; yLabel?: string; color?: string } = {}
  ): GeneratedFigure {
    const id = `fig-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    // Calculate histogram bins
    const min = Math.min(...data);
    const max = Math.max(...data);
    const binWidth = (max - min) / bins;
    const counts = new Array(bins).fill(0);
    
    for (const value of data) {
      const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
      counts[binIndex]++;
    }

    const lines: string[] = [];
    lines.push('\\begin{tikzpicture}');
    lines.push('\\begin{axis}[');
    lines.push('    ybar interval,');
    lines.push('    width=0.8\\textwidth,');
    lines.push('    height=0.5\\textwidth,');
    lines.push(`    xlabel={${options.xLabel || 'Value'}},`);
    lines.push(`    ylabel={${options.yLabel || 'Frequency'}},`);
    
    if (options.title) {
      lines.push(`    title={${options.title}},`);
    }
    
    lines.push(']');

    const color = options.color || 'blue!70';
    lines.push(`\\addplot[fill=${color}] coordinates {`);
    for (let i = 0; i < bins; i++) {
      const binStart = min + i * binWidth;
      lines.push(`    (${binStart.toFixed(2)}, ${counts[i]})`);
    }
    lines.push(`    (${max.toFixed(2)}, 0)`);
    lines.push('};');
    
    lines.push('\\end{axis}');
    lines.push('\\end{tikzpicture}');

    const tikzCode = lines.join('\n');
    
    const figure: Omit<GeneratedFigure, 'hash'> = {
      id,
      tikzCode
    };

    const result: GeneratedFigure = {
      ...figure,
      hash: HashVerifier.hash(tikzCode)
    };

    this.figures.set(id, result);
    return result;
  }

  /**
   * Generate TikZ code for a figure
   */
  private generateTikzCode(data: FigureData, plotType: 'line' | 'scatter'): string {
    const lines: string[] = [];
    lines.push('\\begin{tikzpicture}');
    lines.push('\\begin{axis}[');
    lines.push('    width=0.8\\textwidth,');
    lines.push('    height=0.6\\textwidth,');
    lines.push(`    xlabel={${data.xLabel}},`);
    lines.push(`    ylabel={${data.yLabel}},`);
    
    if (data.title) {
      lines.push(`    title={${data.title}},`);
    }
    if (data.legend) {
      lines.push('    legend pos=north west,');
    }
    if (data.grid) {
      lines.push('    grid=major,');
    }
    if (data.xRange) {
      lines.push(`    xmin=${data.xRange[0]}, xmax=${data.xRange[1]},`);
    }
    if (data.yRange) {
      lines.push(`    ymin=${data.yRange[0]}, ymax=${data.yRange[1]},`);
    }
    
    lines.push(']');

    const colors = ['blue', 'red', 'green!60!black', 'orange', 'purple', 'cyan', 'brown'];
    const markers = ['*', 'square*', 'triangle*', 'diamond*', 'pentagon*', 'o', '+'];

    data.series.forEach((series, idx) => {
      const color = series.color || colors[idx % colors.length];
      const marker = series.marker || (plotType === 'scatter' ? markers[idx % markers.length] : 'none');
      const style = plotType === 'scatter' ? 'only marks' : '';
      
      lines.push(`\\addplot[${style}${style ? ', ' : ''}color=${color}, mark=${marker}] coordinates {`);
      for (let i = 0; i < series.x.length; i++) {
        lines.push(`    (${series.x[i]}, ${series.y[i]})`);
      }
      lines.push('};');
      
      if (data.legend) {
        lines.push(`\\addlegendentry{${series.name}}`);
      }
    });

    lines.push('\\end{axis}');
    lines.push('\\end{tikzpicture}');

    return lines.join('\n');
  }

  /**
   * Get all generated figures
   */
  getAllFigures(): GeneratedFigure[] {
    return Array.from(this.figures.values());
  }

  /**
   * Get figure by ID
   */
  getFigure(id: string): GeneratedFigure | undefined {
    return this.figures.get(id);
  }

  /**
   * Get hash for verification
   */
  getHash(): string {
    const ids = Array.from(this.figures.keys()).sort().join(',');
    return HashVerifier.hash(`FigureGenerator-${ids}`);
  }
}

// ============================================================================
// PUBLICATION SYSTEM
// ============================================================================

export class PublicationSystem {
  private logger: Logger;
  private latexGenerator: LaTeXGenerator;
  private figureGenerator: FigureGenerator;
  private documents: Map<string, LatexDocument> = new Map();

  constructor(config: DocumentConfig = DefaultConfigs.ARTICLE, logger?: Logger) {
    this.logger = logger || Logger.getInstance({ minLevel: LogLevel.INFO, enableConsole: false });
    this.latexGenerator = new LaTeXGenerator(config, this.logger);
    this.figureGenerator = new FigureGenerator(this.logger);
  }

  /**
   * Create a complete publication
   */
  createPublication(
    metadata: PaperMetadata,
    sections: { title: string; content: string }[],
    figures: Figure[] = [],
    tables: TableData[] = [],
    equations: Equation[] = [],
    bibliography: BibEntry[] = []
  ): LatexDocument {
    const doc = this.latexGenerator.generateDocument(
      metadata,
      sections,
      figures,
      tables,
      equations,
      bibliography
    );

    const docId = `DOC-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    this.documents.set(docId, doc);
    
    this.logger.info(`Created publication: ${metadata.title}`);
    return doc;
  }

  /**
   * Generate figure for publication
   */
  generateFigure(
    type: 'line' | 'scatter' | 'bar' | 'histogram',
    data: DataSeries[] | number[],
    options: Partial<FigureData> & { categories?: string[]; bins?: number } = {}
  ): GeneratedFigure {
    switch (type) {
      case 'line':
        return this.figureGenerator.generateLinePlot(data as DataSeries[], options);
      case 'scatter':
        return this.figureGenerator.generateScatterPlot(data as DataSeries[], options);
      case 'bar':
        if (!options.categories) throw new Error('Bar chart requires categories');
        return this.figureGenerator.generateBarChart(options.categories, data as number[], options);
      case 'histogram':
        return this.figureGenerator.generateHistogram(data as number[], options.bins, options);
      default:
        throw new Error(`Unknown figure type: ${type}`);
    }
  }

  /**
   * Generate BibTeX file content
   */
  generateBibFile(entries: BibEntry[]): string {
    return entries.map(e => this.latexGenerator.generateBibTexEntry(e)).join('\n\n');
  }

  /**
   * Get LaTeX generator
   */
  getLatexGenerator(): LaTeXGenerator {
    return this.latexGenerator;
  }

  /**
   * Get figure generator
   */
  getFigureGenerator(): FigureGenerator {
    return this.figureGenerator;
  }

  /**
   * Get all documents
   */
  getAllDocuments(): LatexDocument[] {
    return Array.from(this.documents.values());
  }

  /**
   * Get hash for verification
   */
  getHash(): string {
    return HashVerifier.hash(`PublicationSystem-${this.documents.size}`);
  }

  /**
   * Export proof chain
   */
  exportProofChain(): { documents: number; figures: number } {
    return {
      documents: this.documents.size,
      figures: this.figureGenerator.getAllFigures().length
    };
  }
}

// ============================================================================
// PUBLICATION FACTORY
// ============================================================================

export class PublicationFactory {
  /**
   * Create system for standard articles
   */
  static article(): PublicationSystem {
    return new PublicationSystem(DefaultConfigs.ARTICLE);
  }

  /**
   * Create system for IEEE publications
   */
  static ieee(): PublicationSystem {
    return new PublicationSystem(DefaultConfigs.IEEE);
  }

  /**
   * Create system for physics publications
   */
  static physics(): PublicationSystem {
    return new PublicationSystem(DefaultConfigs.PHYSICS);
  }

  /**
   * Create system with custom config
   */
  static custom(config: DocumentConfig): PublicationSystem {
    return new PublicationSystem(config);
  }
}
