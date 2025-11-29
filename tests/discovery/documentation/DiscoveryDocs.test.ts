/**
 * DiscoveryDocs Tests (M10.05)
 * PRD-10 Phase 10.5: Discovery Documentation
 */

import {
  DiscoveryDocs,
  DiscoveryDocsFactory,
  ReproducibilityGuide,
  ProofDocument,
  DiscoveryReport
} from '../../../src/discovery/documentation/DiscoveryDocs';
import { Discovery } from '../../../src/discovery/explorer/AutoExplorer';
import { ValidationResult, Certainty } from '../../../src/discovery/validation/BreakthroughValidator';

describe('DiscoveryDocs', () => {
  let docs: DiscoveryDocs;

  function createTestDiscovery(): Discovery {
    return {
      id: `DISC-TEST-${Date.now()}`,
      type: 'pattern',
      description: 'Test discovery for documentation',
      significance: 0.85,
      evidence: [
        {
          id: 'EV-1',
          type: 'computational',
          description: 'Computational evidence',
          strength: 0.9,
          reproducible: true
        }
      ],
      status: 'preliminary',
      hash: 'test-hash',
      createdAt: new Date()
    };
  }

  function createTestValidation(): ValidationResult {
    return {
      id: 'VAL-TEST',
      candidateId: 'BTC-TEST',
      methods: [
        { method: 'statistical', passed: true, confidence: 0.85, details: {}, hash: 'h1' },
        { method: 'reproduction', passed: true, confidence: 0.8, details: {}, hash: 'h2' }
      ],
      overallCertainty: {
        level: 'high',
        score: 0.82,
        factors: [
          { name: 'statistical', weight: 0.3, contribution: 0.25, description: 'Statistical validation' }
        ]
      },
      falsePositiveProbability: 0.05,
      recommendation: 'confirm',
      evidence: [
        { id: 'EV-V1', type: 'statistical', strength: 0.85, description: 'Test evidence', reproducible: true }
      ],
      hash: 'val-hash',
      validatedAt: new Date()
    };
  }

  beforeEach(() => {
    docs = new DiscoveryDocs();
  });

  describe('Hash Chain', () => {
    it('should initialize hash chain', () => {
      const chain = docs.getHashChain();
      expect(chain.length).toBe(1);
      expect(chain[0].operation).toBe('genesis');
    });

    it('should verify hash chain integrity', () => {
      const isValid = docs.verifyHashChain();
      expect(isValid).toBe(true);
    });

    it('should maintain chain integrity after operations', () => {
      const discovery = createTestDiscovery();
      docs.createReproducibilityGuide(discovery);
      docs.createProofDocument('Test', discovery);

      const isValid = docs.verifyHashChain();
      expect(isValid).toBe(true);
    });
  });

  describe('Reproducibility Guide', () => {
    it('should create reproducibility guide', () => {
      const discovery = createTestDiscovery();
      const guide = docs.createReproducibilityGuide(discovery);

      expect(guide.id).toBeDefined();
      expect(guide.discoveryId).toBe(discovery.id);
      expect(guide.version).toBe('1.0.0');
      expect(guide.hash).toBeDefined();
    });

    it('should generate summary', () => {
      const discovery = createTestDiscovery();
      const guide = docs.createReproducibilityGuide(discovery);

      expect(guide.summary).toBeDefined();
      expect(guide.summary.length).toBeGreaterThan(0);
      expect(guide.summary).toContain(discovery.type);
    });

    it('should generate prerequisites', () => {
      const discovery = createTestDiscovery();
      const guide = docs.createReproducibilityGuide(discovery);

      expect(guide.prerequisites.length).toBeGreaterThan(0);
      for (const prereq of guide.prerequisites) {
        expect(prereq.id).toBeDefined();
        expect(prereq.description).toBeDefined();
        expect(['knowledge', 'equipment', 'software', 'data']).toContain(prereq.category);
      }
    });

    it('should generate materials list', () => {
      const discovery = createTestDiscovery();
      const guide = docs.createReproducibilityGuide(discovery);

      expect(guide.materials.length).toBeGreaterThan(0);
      for (const material of guide.materials) {
        expect(material.name).toBeDefined();
        expect(material.specification).toBeDefined();
      }
    });

    it('should generate procedure steps', () => {
      const discovery = createTestDiscovery();
      const guide = docs.createReproducibilityGuide(discovery);

      expect(guide.procedure.length).toBeGreaterThan(0);
      for (const step of guide.procedure) {
        expect(step.stepNumber).toBeGreaterThan(0);
        expect(step.title).toBeDefined();
        expect(step.description).toBeDefined();
        expect(step.criticalPoints).toBeDefined();
      }
    });

    it('should generate expected results', () => {
      const discovery = createTestDiscovery();
      const guide = docs.createReproducibilityGuide(discovery);

      expect(guide.expectedResults.length).toBeGreaterThan(0);
      for (const result of guide.expectedResults) {
        expect(result.metric).toBeDefined();
        expect(result.value).toBeDefined();
      }
    });

    it('should generate troubleshooting entries', () => {
      const discovery = createTestDiscovery();
      const guide = docs.createReproducibilityGuide(discovery);

      expect(guide.troubleshooting.length).toBeGreaterThan(0);
      for (const entry of guide.troubleshooting) {
        expect(entry.issue).toBeDefined();
        expect(entry.possibleCauses.length).toBeGreaterThan(0);
        expect(entry.solutions.length).toBeGreaterThan(0);
      }
    });

    it('should accept custom materials and prerequisites', () => {
      const discovery = createTestDiscovery();
      const guide = docs.createReproducibilityGuide(discovery, {
        title: 'Custom Title',
        materials: [{ name: 'Custom Material', specification: 'Spec', quantity: '1' }],
        prerequisites: [{ id: 'P-CUSTOM', description: 'Custom prereq', category: 'knowledge', required: true }]
      });

      expect(guide.title).toBe('Custom Title');
      expect(guide.materials.some(m => m.name === 'Custom Material')).toBe(true);
      expect(guide.prerequisites.some(p => p.id === 'P-CUSTOM')).toBe(true);
    });

    it('should store and retrieve guide', () => {
      const discovery = createTestDiscovery();
      const guide = docs.createReproducibilityGuide(discovery);

      const retrieved = docs.getGuide(guide.id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(guide.id);
    });

    it('should list all guides', () => {
      docs.createReproducibilityGuide(createTestDiscovery());
      docs.createReproducibilityGuide(createTestDiscovery());

      const all = docs.getAllGuides();
      expect(all.length).toBe(2);
    });
  });

  describe('Proof Document', () => {
    it('should create proof document', () => {
      const discovery = createTestDiscovery();
      const proof = docs.createProofDocument('Test Proof', discovery);

      expect(proof.id).toBeDefined();
      expect(proof.title).toBe('Test Proof');
      expect(proof.type).toBe('discovery');
      expect(proof.hash).toBeDefined();
    });

    it('should generate abstract', () => {
      const discovery = createTestDiscovery();
      const proof = docs.createProofDocument('Test', discovery);

      expect(proof.abstract).toBeDefined();
      expect(proof.abstract.length).toBeGreaterThan(0);
      expect(proof.abstract).toContain(discovery.type);
    });

    it('should generate sections', () => {
      const discovery = createTestDiscovery();
      const proof = docs.createProofDocument('Test', discovery);

      expect(proof.sections.length).toBeGreaterThan(0);
      const titles = proof.sections.map(s => s.title);
      expect(titles).toContain('Introduction');
      expect(titles).toContain('Discovery Description');
      expect(titles).toContain('Evidence');
    });

    it('should include validation results when provided', () => {
      const discovery = createTestDiscovery();
      const validation = createTestValidation();
      const proof = docs.createProofDocument('Test', discovery, validation);

      const validationSection = proof.sections.find(s => s.title === 'Validation Results');
      expect(validationSection).toBeDefined();
      expect(validationSection!.content).toContain('high');
    });

    it('should collect evidence', () => {
      const discovery = createTestDiscovery();
      const proof = docs.createProofDocument('Test', discovery);

      expect(proof.evidence.length).toBeGreaterThan(0);
      for (const ev of proof.evidence) {
        expect(ev.id).toBeDefined();
        expect(ev.type).toBeDefined();
        expect(ev.hash).toBeDefined();
      }
    });

    it('should generate conclusions', () => {
      const discovery = createTestDiscovery();
      const proof = docs.createProofDocument('Test', discovery);

      expect(proof.conclusions.length).toBeGreaterThan(0);
      expect(proof.conclusions.some(c => c.includes(discovery.status))).toBe(true);
    });

    it('should include hash chain', () => {
      const discovery = createTestDiscovery();
      const proof = docs.createProofDocument('Test', discovery);

      expect(proof.hashChain.length).toBeGreaterThan(0);
    });

    it('should generate metadata', () => {
      const discovery = createTestDiscovery();
      const proof = docs.createProofDocument('Test', discovery);

      expect(proof.metadata.version).toBeDefined();
      expect(proof.metadata.authors.length).toBeGreaterThan(0);
      expect(proof.metadata.date).toBeInstanceOf(Date);
      expect(proof.metadata.keywords.length).toBeGreaterThan(0);
    });

    it('should store and retrieve proof', () => {
      const discovery = createTestDiscovery();
      const proof = docs.createProofDocument('Test', discovery);

      const retrieved = docs.getProof(proof.id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(proof.id);
    });
  });

  describe('Discovery Report', () => {
    it('should create complete discovery report', () => {
      const discovery = createTestDiscovery();
      const report = docs.createDiscoveryReport(discovery);

      expect(report.id).toBeDefined();
      expect(report.discovery).toBe(discovery);
      expect(report.guide).toBeDefined();
      expect(report.proof).toBeDefined();
      expect(report.status).toBe('draft');
      expect(report.hash).toBeDefined();
    });

    it('should include validation when provided', () => {
      const discovery = createTestDiscovery();
      const validation = createTestValidation();
      const report = docs.createDiscoveryReport(discovery, validation);

      expect(report.validation).toBeDefined();
      expect(report.validation!.id).toBe(validation.id);
    });

    it('should update report status', () => {
      const discovery = createTestDiscovery();
      const report = docs.createDiscoveryReport(discovery);

      docs.updateReportStatus(report.id, 'reviewed');
      
      const updated = docs.getReport(report.id);
      expect(updated!.status).toBe('reviewed');
    });

    it('should store and retrieve report', () => {
      const discovery = createTestDiscovery();
      const report = docs.createDiscoveryReport(discovery);

      const retrieved = docs.getReport(report.id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(report.id);
    });

    it('should list all reports', () => {
      docs.createDiscoveryReport(createTestDiscovery());
      docs.createDiscoveryReport(createTestDiscovery());

      const all = docs.getAllReports();
      expect(all.length).toBe(2);
    });
  });

  describe('Hash Verification', () => {
    it('should generate valid hash', () => {
      const hash = docs.getHash();
      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should export complete proof chain', () => {
      const discovery = createTestDiscovery();
      docs.createReproducibilityGuide(discovery);
      docs.createProofDocument('Test', discovery);
      docs.createDiscoveryReport(createTestDiscovery());

      const proofChain = docs.exportProofChain();

      expect(proofChain.guides.length).toBeGreaterThan(0);
      expect(proofChain.proofs.length).toBeGreaterThan(0);
      expect(proofChain.reports.length).toBeGreaterThan(0);
      expect(proofChain.hashChain.length).toBeGreaterThan(0);
      expect(proofChain.integrity).toBe(true);
    });
  });

  describe('Factory', () => {
    it('should create default docs', () => {
      const d = DiscoveryDocsFactory.default();
      expect(d).toBeInstanceOf(DiscoveryDocs);
    });
  });
});
