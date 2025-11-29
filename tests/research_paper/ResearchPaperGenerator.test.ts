/**
 * Tests for ResearchPaperGenerator
 * PRD-16: Research Paper Generator
 */

import { ResearchPaperGenerator, ResearchPaperGeneratorFactory } from '../../src/research_paper/ResearchPaperGenerator';

describe('ResearchPaperGenerator', () => {
  let generator: ResearchPaperGenerator;

  beforeEach(() => {
    generator = ResearchPaperGeneratorFactory.createDefault();
  });

  describe('Paper Generation', () => {
    it('should generate a research paper', () => {
      const paper = generator.generatePaper({
        lawName: "Newton's Second Law",
        reframingStrategy: 'information',
        includeDerivations: true,
        includeExperiments: true,
        includeApplications: true,
        targetJournal: 'Physical Review Letters',
        depth: 'comprehensive'
      });

      expect(paper).toBeDefined();
      expect(paper.id).toBeDefined();
      expect(paper.title).toBeDefined();
      expect(paper.hash.length).toBe(64);
    });

    it('should generate paper with all sections', () => {
      const paper = generator.generatePaper({
        lawName: 'Mass-Energy Equivalence',
        reframingStrategy: 'computational',
        includeDerivations: true,
        includeExperiments: false,
        includeApplications: true,
        targetJournal: 'Nature Physics',
        depth: 'detailed'
      });

      const sectionTypes = paper.sections.map(s => s.type);
      expect(sectionTypes).toContain('introduction');
      expect(sectionTypes).toContain('background');
      expect(sectionTypes).toContain('methodology');
      expect(sectionTypes).toContain('results');
      expect(sectionTypes).toContain('discussion');
      expect(sectionTypes).toContain('conclusion');
    });

    it('should generate paper with figures', () => {
      const paper = generator.generatePaper({
        lawName: 'Schrödinger Equation',
        reframingStrategy: 'geometric',
        includeDerivations: true,
        includeExperiments: true,
        includeApplications: true,
        targetJournal: 'Physical Review D',
        depth: 'comprehensive'
      });

      expect(paper.figures.length).toBeGreaterThan(0);
      for (const fig of paper.figures) {
        expect(fig.id).toBeDefined();
        expect(fig.caption).toBeDefined();
        expect(fig.type).toBeDefined();
      }
    });

    it('should generate paper with tables', () => {
      const paper = generator.generatePaper({
        lawName: "Maxwell's Equations",
        reframingStrategy: 'holographic',
        includeDerivations: true,
        includeExperiments: false,
        includeApplications: true,
        targetJournal: 'Journal of High Energy Physics',
        depth: 'detailed'
      });

      expect(paper.tables.length).toBeGreaterThan(0);
      for (const table of paper.tables) {
        expect(table.id).toBeDefined();
        expect(table.caption).toBeDefined();
        expect(table.headers.length).toBeGreaterThan(0);
        expect(table.rows.length).toBeGreaterThan(0);
      }
    });

    it('should generate paper with equations', () => {
      const paper = generator.generatePaper({
        lawName: 'Heisenberg Uncertainty Principle',
        reframingStrategy: 'emergent',
        includeDerivations: true,
        includeExperiments: false,
        includeApplications: false,
        targetJournal: 'Reviews of Modern Physics',
        depth: 'overview'
      });

      expect(paper.equations.length).toBeGreaterThan(0);
      for (const eq of paper.equations) {
        expect(eq.id).toBeDefined();
        expect(eq.latex).toBeDefined();
        expect(eq.description).toBeDefined();
        expect(eq.variables.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Validation', () => {
    it('should generate validation report', () => {
      const paper = generator.generatePaper({
        lawName: "Newton's Second Law",
        reframingStrategy: 'information',
        includeDerivations: true,
        includeExperiments: true,
        includeApplications: true,
        targetJournal: 'Physical Review Letters',
        depth: 'comprehensive'
      });

      expect(paper.validationReport).toBeDefined();
      expect(paper.validationReport.score).toBeGreaterThanOrEqual(0);
      expect(paper.validationReport.score).toBeLessThanOrEqual(1);
      expect(paper.validationReport.hash.length).toBe(64);
    });

    it('should have higher score with derivations included', () => {
      const withDerivations = generator.generatePaper({
        lawName: "Newton's Second Law",
        reframingStrategy: 'information',
        includeDerivations: true,
        includeExperiments: true,
        includeApplications: true,
        targetJournal: 'Physical Review Letters',
        depth: 'comprehensive'
      });

      const withoutDerivations = generator.generatePaper({
        lawName: "Newton's Second Law",
        reframingStrategy: 'information',
        includeDerivations: false,
        includeExperiments: true,
        includeApplications: true,
        targetJournal: 'Physical Review Letters',
        depth: 'comprehensive'
      });

      expect(withDerivations.validationReport.reproducibility).toBe(true);
      expect(withoutDerivations.validationReport.reproducibility).toBe(false);
    });
  });

  describe('LaTeX Export', () => {
    it('should export to LaTeX format', () => {
      const paper = generator.generatePaper({
        lawName: "Newton's Second Law",
        reframingStrategy: 'information',
        includeDerivations: true,
        includeExperiments: false,
        includeApplications: true,
        targetJournal: 'Physical Review Letters',
        depth: 'detailed'
      });

      const latex = generator.exportToLaTeX(paper.id);
      expect(latex).toContain('\\documentclass');
      expect(latex).toContain('\\title');
      expect(latex).toContain('\\begin{document}');
      expect(latex).toContain('\\end{document}');
      expect(latex).toContain('\\begin{abstract}');
      expect(latex).toContain('\\section');
    });

    it('should return empty string for invalid paper ID', () => {
      const latex = generator.exportToLaTeX('invalid-id');
      expect(latex).toBe('');
    });
  });

  describe('Paper Retrieval', () => {
    it('should retrieve paper by ID', () => {
      const paper = generator.generatePaper({
        lawName: "Newton's Second Law",
        reframingStrategy: 'information',
        includeDerivations: true,
        includeExperiments: false,
        includeApplications: true,
        targetJournal: 'Physical Review Letters',
        depth: 'overview'
      });

      const retrieved = generator.getPaper(paper.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(paper.id);
    });

    it('should return undefined for non-existent paper', () => {
      const retrieved = generator.getPaper('non-existent');
      expect(retrieved).toBeUndefined();
    });

    it('should retrieve all papers', () => {
      generator.generatePaper({
        lawName: 'Law 1',
        reframingStrategy: 'information',
        includeDerivations: true,
        includeExperiments: false,
        includeApplications: true,
        targetJournal: 'Journal',
        depth: 'overview'
      });

      generator.generatePaper({
        lawName: 'Law 2',
        reframingStrategy: 'computational',
        includeDerivations: true,
        includeExperiments: false,
        includeApplications: true,
        targetJournal: 'Journal',
        depth: 'overview'
      });

      const papers = generator.getAllPapers();
      expect(papers.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Hash Verification', () => {
    it('should verify paper hashes', () => {
      const paper = generator.generatePaper({
        lawName: "Newton's Second Law",
        reframingStrategy: 'information',
        includeDerivations: true,
        includeExperiments: false,
        includeApplications: true,
        targetJournal: 'Physical Review Letters',
        depth: 'comprehensive'
      });

      expect(generator.verifyPaper(paper.id)).toBe(true);
    });

    it('should return false for non-existent paper', () => {
      expect(generator.verifyPaper('non-existent')).toBe(false);
    });
  });
});
