/**
 * PublicationSystem Tests (M09.05)
 * PRD-09 Phase 9.5: Publication Preparation
 */

import {
  PublicationSystem,
  PublicationFactory,
  LaTeXGenerator,
  FigureGenerator,
  DefaultConfigs,
  PaperMetadata,
  Figure,
  TableData,
  BibEntry,
  DataSeries
} from '../../../src/validation/publication/PublicationSystem';

describe('PublicationSystem', () => {
  let system: PublicationSystem;

  beforeEach(() => {
    system = new PublicationSystem();
  });

  describe('LaTeXGenerator', () => {
    let generator: LaTeXGenerator;

    beforeEach(() => {
      generator = new LaTeXGenerator();
    });

    describe('Document Generation', () => {
      const metadata: PaperMetadata = {
        title: 'Test Paper Title',
        authors: [
          { name: 'John Doe', affiliation: 'Test University', email: 'john@test.edu' },
          { name: 'Jane Smith', affiliation: 'Another University' }
        ],
        abstract: 'This is a test abstract describing our research.',
        keywords: ['test', 'research', 'paper'],
        date: new Date('2024-01-15')
      };

      it('should generate complete LaTeX document', () => {
        const doc = generator.generateDocument(
          metadata,
          [
            { title: 'Introduction', content: 'Introduction content.' },
            { title: 'Methods', content: 'Methods content.' }
          ]
        );

        expect(doc.preamble).toContain('\\documentclass');
        expect(doc.body).toContain('\\maketitle');
        expect(doc.body).toContain('\\begin{abstract}');
        expect(doc.full).toContain('\\begin{document}');
        expect(doc.hash).toBeDefined();
      });

      it('should include all sections', () => {
        const doc = generator.generateDocument(
          metadata,
          [
            { title: 'Introduction', content: 'Intro' },
            { title: 'Methods', content: 'Methods' },
            { title: 'Results', content: 'Results' },
            { title: 'Discussion', content: 'Discussion' }
          ]
        );

        expect(doc.body).toContain('\\section{Introduction}');
        expect(doc.body).toContain('\\section{Methods}');
        expect(doc.body).toContain('\\section{Results}');
        expect(doc.body).toContain('\\section{Discussion}');
      });

      it('should include keywords', () => {
        const doc = generator.generateDocument(metadata, []);

        expect(doc.body).toContain('Keywords:');
        expect(doc.body).toContain('test');
        expect(doc.body).toContain('research');
      });
    });

    describe('Figure Generation', () => {
      it('should generate figure LaTeX', () => {
        const figure: Figure = {
          id: 'fig1',
          type: 'plot',
          caption: 'Test figure',
          label: 'test-figure',
          width: 0.8,
          position: 'h'
        };

        const latex = generator.generateFigureLatex(figure);

        expect(latex).toContain('\\begin{figure}');
        expect(latex).toContain('\\caption{Test figure}');
        expect(latex).toContain('\\label{fig:test-figure}');
        expect(latex).toContain('\\end{figure}');
      });

      it('should generate figure with data', () => {
        const figure: Figure = {
          id: 'fig1',
          type: 'plot',
          caption: 'Data plot',
          label: 'data-plot',
          data: {
            xLabel: 'X Axis',
            yLabel: 'Y Axis',
            series: [
              { name: 'Series 1', x: [1, 2, 3], y: [1, 4, 9] }
            ]
          }
        };

        const latex = generator.generateFigureLatex(figure);

        expect(latex).toContain('\\begin{tikzpicture}');
        expect(latex).toContain('\\begin{axis}');
        expect(latex).toContain('xlabel={X Axis}');
        expect(latex).toContain('ylabel={Y Axis}');
      });
    });

    describe('Table Generation', () => {
      it('should generate table LaTeX', () => {
        const table: TableData = {
          id: 'tab1',
          caption: 'Test table',
          label: 'test-table',
          headers: ['A', 'B', 'C'],
          rows: [
            [1, 2, 3],
            [4, 5, 6]
          ]
        };

        const latex = generator.generateTableLatex(table);

        expect(latex).toContain('\\begin{table}');
        expect(latex).toContain('\\caption{Test table}');
        expect(latex).toContain('\\label{tab:test-table}');
        expect(latex).toContain('\\begin{tabular}');
        expect(latex).toContain('A & B & C');
        expect(latex).toContain('\\toprule');
        expect(latex).toContain('\\midrule');
        expect(latex).toContain('\\bottomrule');
      });

      it('should handle custom alignment', () => {
        const table: TableData = {
          id: 'tab1',
          caption: 'Aligned table',
          label: 'aligned',
          headers: ['Left', 'Center', 'Right'],
          rows: [[1, 2, 3]],
          alignment: ['l', 'c', 'r']
        };

        const latex = generator.generateTableLatex(table);

        expect(latex).toContain('\\begin{tabular}{lcr}');
      });
    });

    describe('Equation Generation', () => {
      it('should generate numbered equation', () => {
        const latex = generator.generateEquationLatex({
          id: 'eq1',
          latex: 'E = mc^2',
          label: 'einstein',
          numbered: true
        });

        expect(latex).toContain('\\begin{equation}');
        expect(latex).toContain('\\label{eq:einstein}');
        expect(latex).toContain('E = mc^2');
        expect(latex).toContain('\\end{equation}');
      });

      it('should generate unnumbered equation', () => {
        const latex = generator.generateEquationLatex({
          id: 'eq1',
          latex: 'a^2 + b^2 = c^2',
          numbered: false
        });

        expect(latex).toContain('\\begin{equation*}');
        expect(latex).toContain('\\end{equation*}');
      });
    });

    describe('Bibliography Generation', () => {
      it('should generate BibTeX entry', () => {
        const entry: BibEntry = {
          key: 'doe2024',
          type: 'article',
          title: 'Test Article',
          authors: ['John Doe', 'Jane Smith'],
          year: 2024,
          journal: 'Test Journal',
          volume: '10',
          pages: '1-10',
          doi: '10.1234/test'
        };

        const bibtex = generator.generateBibTexEntry(entry);

        expect(bibtex).toContain('@article{doe2024,');
        expect(bibtex).toContain('author = {John Doe and Jane Smith}');
        expect(bibtex).toContain('title = {Test Article}');
        expect(bibtex).toContain('year = {2024}');
        expect(bibtex).toContain('journal = {Test Journal}');
        expect(bibtex).toContain('doi = {10.1234/test}');
      });
    });

    describe('LaTeX Escaping', () => {
      it('should escape special characters', () => {
        const escaped = generator.escapeLatex('Test & special $ characters # %');

        expect(escaped).toContain('\\&');
        expect(escaped).toContain('\\$');
        expect(escaped).toContain('\\#');
        expect(escaped).toContain('\\%');
      });

      it('should escape underscores', () => {
        const escaped = generator.escapeLatex('variable_name');
        expect(escaped).toContain('\\_');
      });
    });

    describe('Configuration', () => {
      it('should allow setting config', () => {
        generator.setConfig({ fontSize: 10 });
        expect(generator.getHash()).toBeDefined();
      });
    });
  });

  describe('FigureGenerator', () => {
    let figGen: FigureGenerator;

    beforeEach(() => {
      figGen = new FigureGenerator();
    });

    describe('Line Plot', () => {
      it('should generate line plot', () => {
        const data: DataSeries[] = [
          { name: 'Series 1', x: [1, 2, 3, 4, 5], y: [1, 4, 9, 16, 25] }
        ];

        const figure = figGen.generateLinePlot(data, { xLabel: 'X', yLabel: 'Y' });

        expect(figure.id).toBeDefined();
        expect(figure.tikzCode).toContain('\\begin{tikzpicture}');
        expect(figure.tikzCode).toContain('\\addplot');
        expect(figure.hash).toBeDefined();
      });

      it('should handle multiple series', () => {
        const data: DataSeries[] = [
          { name: 'Series 1', x: [1, 2, 3], y: [1, 2, 3] },
          { name: 'Series 2', x: [1, 2, 3], y: [1, 4, 9] }
        ];

        const figure = figGen.generateLinePlot(data);

        expect(figure.tikzCode).toContain('\\addlegendentry{Series 1}');
        expect(figure.tikzCode).toContain('\\addlegendentry{Series 2}');
      });
    });

    describe('Scatter Plot', () => {
      it('should generate scatter plot', () => {
        const data: DataSeries[] = [
          { name: 'Points', x: [1, 2, 3, 4, 5], y: [2, 4, 3, 5, 4] }
        ];

        const figure = figGen.generateScatterPlot(data, { xLabel: 'X', yLabel: 'Y' });

        expect(figure.tikzCode).toContain('only marks');
        expect(figure.hash).toBeDefined();
      });
    });

    describe('Bar Chart', () => {
      it('should generate bar chart', () => {
        const figure = figGen.generateBarChart(
          ['A', 'B', 'C', 'D'],
          [10, 25, 15, 30],
          { title: 'Test Bar Chart', xLabel: 'Category', yLabel: 'Value' }
        );

        expect(figure.tikzCode).toContain('ybar');
        expect(figure.tikzCode).toContain('symbolic x coords={A,B,C,D}');
        expect(figure.hash).toBeDefined();
      });
    });

    describe('Histogram', () => {
      it('should generate histogram', () => {
        const data = Array.from({ length: 100 }, () => Math.random() * 10);
        const figure = figGen.generateHistogram(data, 10, { title: 'Distribution' });

        expect(figure.tikzCode).toContain('ybar interval');
        expect(figure.hash).toBeDefined();
      });
    });

    describe('Figure Management', () => {
      it('should store generated figures', () => {
        const data: DataSeries[] = [{ name: 'Test', x: [1, 2, 3], y: [1, 2, 3] }];
        
        figGen.generateLinePlot(data);
        figGen.generateScatterPlot(data);

        const figures = figGen.getAllFigures();
        expect(figures.length).toBe(2);
      });

      it('should retrieve figure by ID', () => {
        const data: DataSeries[] = [{ name: 'Test', x: [1, 2, 3], y: [1, 2, 3] }];
        const figure = figGen.generateLinePlot(data);

        const retrieved = figGen.getFigure(figure.id);
        expect(retrieved).toBeDefined();
        expect(retrieved?.id).toBe(figure.id);
      });
    });

    describe('Hash Generation', () => {
      it('should generate consistent hash', () => {
        const hash = figGen.getHash();
        expect(hash).toBeDefined();
        expect(typeof hash).toBe('string');
      });
    });
  });

  describe('PublicationSystem Integration', () => {
    const metadata: PaperMetadata = {
      title: 'Integration Test Paper',
      authors: [{ name: 'Test Author', affiliation: 'Test Affiliation' }],
      abstract: 'Test abstract',
      keywords: ['test'],
      date: new Date()
    };

    it('should create complete publication', () => {
      const doc = system.createPublication(
        metadata,
        [
          { title: 'Introduction', content: 'Intro' },
          { title: 'Methods', content: 'Methods' }
        ]
      );

      expect(doc.full).toContain('\\documentclass');
      expect(doc.full).toContain('Integration Test Paper');
      expect(doc.hash).toBeDefined();
    });

    it('should generate figures for publication', () => {
      const figure = system.generateFigure(
        'line',
        [{ name: 'Data', x: [1, 2, 3], y: [1, 4, 9] }],
        { xLabel: 'X', yLabel: 'Y' }
      );

      expect(figure.tikzCode).toBeDefined();
    });

    it('should generate scatter figures', () => {
      const figure = system.generateFigure(
        'scatter',
        [{ name: 'Points', x: [1, 2, 3], y: [2, 3, 4] }]
      );

      expect(figure.tikzCode).toContain('only marks');
    });

    it('should generate bar charts', () => {
      const figure = system.generateFigure(
        'bar',
        [10, 20, 30],
        { categories: ['A', 'B', 'C'] }
      );

      expect(figure.tikzCode).toContain('ybar');
    });

    it('should generate histograms', () => {
      const data = Array.from({ length: 50 }, () => Math.random() * 10);
      const figure = system.generateFigure('histogram', data, { bins: 10 });

      expect(figure.tikzCode).toContain('ybar interval');
    });

    it('should throw error for bar chart without categories', () => {
      expect(() => system.generateFigure('bar', [1, 2, 3])).toThrow();
    });

    it('should generate BibTeX file content', () => {
      const entries: BibEntry[] = [
        { key: 'ref1', type: 'article', title: 'Article 1', authors: ['Author 1'], year: 2024, journal: 'Journal' },
        { key: 'ref2', type: 'book', title: 'Book 1', authors: ['Author 2'], year: 2023, publisher: 'Publisher' }
      ];

      const bibContent = system.generateBibFile(entries);

      expect(bibContent).toContain('@article{ref1,');
      expect(bibContent).toContain('@book{ref2,');
    });

    it('should provide access to generators', () => {
      expect(system.getLatexGenerator()).toBeInstanceOf(LaTeXGenerator);
      expect(system.getFigureGenerator()).toBeInstanceOf(FigureGenerator);
    });

    it('should track all documents', () => {
      system.createPublication(metadata, []);
      system.createPublication(metadata, []);

      const docs = system.getAllDocuments();
      expect(docs.length).toBe(2);
    });
  });

  describe('PublicationFactory', () => {
    it('should create article system', () => {
      const sys = PublicationFactory.article();
      expect(sys).toBeInstanceOf(PublicationSystem);
    });

    it('should create IEEE system', () => {
      const sys = PublicationFactory.ieee();
      expect(sys).toBeInstanceOf(PublicationSystem);
    });

    it('should create physics system', () => {
      const sys = PublicationFactory.physics();
      expect(sys).toBeInstanceOf(PublicationSystem);
    });

    it('should create custom system', () => {
      const sys = PublicationFactory.custom({
        documentClass: 'article',
        fontSize: 11,
        paperSize: 'letter',
        columns: 1,
        packages: ['amsmath'],
        bibliography: 'bibtex'
      });
      expect(sys).toBeInstanceOf(PublicationSystem);
    });
  });

  describe('DefaultConfigs', () => {
    it('should have article config', () => {
      expect(DefaultConfigs.ARTICLE.documentClass).toBe('article');
      expect(DefaultConfigs.ARTICLE.fontSize).toBe(12);
    });

    it('should have IEEE config', () => {
      expect(DefaultConfigs.IEEE.documentClass).toBe('ieeetran');
      expect(DefaultConfigs.IEEE.columns).toBe(2);
    });

    it('should have physics config', () => {
      expect(DefaultConfigs.PHYSICS.documentClass).toBe('revtex4');
    });
  });

  describe('Proof Chain', () => {
    it('should export proof chain', () => {
      const chain = system.exportProofChain();
      expect(chain.documents).toBeDefined();
      expect(chain.figures).toBeDefined();
    });

    it('should generate hash', () => {
      const hash = system.getHash();
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });
  });
});
