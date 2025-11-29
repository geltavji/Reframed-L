/**
 * Tests for AntiGravityFramework
 * PRD-13: Anti-Gravity Framework
 */

import { AntiGravityFramework, AntiGravityFrameworkFactory } from '../../src/antigravity/AntiGravityFramework';

describe('AntiGravityFramework', () => {
  let framework: AntiGravityFramework;

  beforeEach(() => {
    framework = AntiGravityFrameworkFactory.createDefault();
  });

  describe('Initialization', () => {
    it('should initialize with foundational formulas', () => {
      const formulas = framework.getAllFormulas();
      expect(formulas.length).toBeGreaterThan(0);
    });

    it('should have formulas with valid hashes', () => {
      const formulas = framework.getAllFormulas();
      for (const formula of formulas) {
        expect(formula.hash).toBeDefined();
        expect(formula.hash.length).toBe(64);
      }
    });

    it('should have formulas with consistency scores', () => {
      const formulas = framework.getAllFormulas();
      for (const formula of formulas) {
        expect(formula.consistencyScore).toBeGreaterThanOrEqual(0);
        expect(formula.consistencyScore).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Formula Types', () => {
    it('should have spacetime manipulation formulas', () => {
      const formulas = framework.getFormulasByMechanism('spacetime_manipulation');
      expect(formulas.length).toBeGreaterThan(0);
    });

    it('should have vacuum engineering formulas', () => {
      const formulas = framework.getFormulasByMechanism('vacuum_engineering');
      expect(formulas.length).toBeGreaterThan(0);
    });

    it('should have electromagnetic coupling formulas', () => {
      const formulas = framework.getFormulasByMechanism('electromagnetic_coupling');
      expect(formulas.length).toBeGreaterThan(0);
    });
  });

  describe('Formula Structure', () => {
    it('should have formulas with variables', () => {
      const formulas = framework.getAllFormulas();
      for (const formula of formulas) {
        expect(formula.variables.length).toBeGreaterThan(0);
      }
    });

    it('should have formulas with constraints', () => {
      const formulas = framework.getAllFormulas();
      for (const formula of formulas) {
        expect(formula.constraints.length).toBeGreaterThan(0);
      }
    });

    it('should have formulas with energy requirements', () => {
      const formulas = framework.getAllFormulas();
      for (const formula of formulas) {
        expect(formula.energyRequirement).toBeDefined();
        expect(formula.energyRequirement.minimumEnergy).toBeGreaterThan(0);
      }
    });

    it('should have formulas with predictions', () => {
      const formulas = framework.getAllFormulas();
      for (const formula of formulas) {
        expect(formula.predictions.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Feasibility', () => {
    it('should return most feasible formulas', () => {
      const feasible = framework.getMostFeasible(3);
      expect(feasible.length).toBeLessThanOrEqual(3);
      
      // Should be sorted by feasibility
      for (let i = 0; i < feasible.length - 1; i++) {
        expect(feasible[i].energyRequirement.feasibilityScore)
          .toBeGreaterThanOrEqual(feasible[i + 1].energyRequirement.feasibilityScore);
      }
    });

    it('should have vacuum engineering as most feasible', () => {
      const feasible = framework.getMostFeasible(1);
      expect(feasible[0].mechanism).toBe('vacuum_engineering');
    });
  });

  describe('Simulation', () => {
    it('should simulate anti-gravity effect', () => {
      const formulas = framework.getAllFormulas();
      const formula = formulas[0];
      
      const result = framework.simulate(formula.id, {
        mass: 100,
        energy: 1e20,
        duration: 1
      });
      
      expect(result).toBeDefined();
      expect(result?.outputForce).toBeDefined();
      expect(result?.effectiveAcceleration).toBeDefined();
    });

    it('should return null for invalid formula ID', () => {
      const result = framework.simulate('invalid-id', { mass: 100 });
      expect(result).toBeNull();
    });
  });

  describe('Hash Verification', () => {
    it('should verify formula hashes', () => {
      const formulas = framework.getAllFormulas();
      for (const formula of formulas) {
        expect(framework.verifyFormula(formula.id)).toBe(true);
      }
    });

    it('should return false for non-existent formula', () => {
      expect(framework.verifyFormula('non-existent')).toBe(false);
    });
  });

  describe('Export', () => {
    it('should export research data', () => {
      const data = framework.exportResearchData();
      expect(data).toHaveProperty('formulas');
      expect(data).toHaveProperty('constants');
      expect(data).toHaveProperty('hash');
    });
  });
});
