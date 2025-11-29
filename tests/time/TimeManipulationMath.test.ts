/**
 * Tests for TimeManipulationMath
 * PRD-14: Time Manipulation Mathematics
 */

import { TimeManipulationMath, TimeManipulationMathFactory } from '../../src/time/TimeManipulationMath';

describe('TimeManipulationMath', () => {
  let timeMath: TimeManipulationMath;

  beforeEach(() => {
    timeMath = TimeManipulationMathFactory.createDefault();
  });

  describe('Initialization', () => {
    it('should initialize with foundational formulas', () => {
      const formulas = timeMath.getAllFormulas();
      expect(formulas.length).toBeGreaterThan(0);
    });

    it('should have formulas with valid hashes', () => {
      const formulas = timeMath.getAllFormulas();
      for (const formula of formulas) {
        expect(formula.hash).toBeDefined();
        expect(formula.hash.length).toBe(64);
      }
    });

    it('should have formulas with consistency scores', () => {
      const formulas = timeMath.getAllFormulas();
      for (const formula of formulas) {
        expect(formula.consistencyScore).toBeGreaterThanOrEqual(0);
        expect(formula.consistencyScore).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Time Dilation Types', () => {
    it('should have relativistic dilation formulas', () => {
      const formulas = timeMath.getAllFormulas().filter(f => 
        f.mechanism === 'relativistic_dilation'
      );
      expect(formulas.length).toBeGreaterThan(0);
    });

    it('should have gravitational dilation formulas', () => {
      const formulas = timeMath.getAllFormulas().filter(f => 
        f.mechanism === 'gravitational_dilation'
      );
      expect(formulas.length).toBeGreaterThan(0);
    });

    it('should have quantum retrocausality formulas', () => {
      const formulas = timeMath.getAllFormulas().filter(f => 
        f.mechanism === 'quantum_retrocausality'
      );
      expect(formulas.length).toBeGreaterThan(0);
    });
  });

  describe('Causality Analysis', () => {
    it('should have causality-preserving formulas', () => {
      const causalFormulas = timeMath.getCausalFormulas();
      expect(causalFormulas.length).toBeGreaterThan(0);
      
      for (const formula of causalFormulas) {
        expect(formula.causalityStatus.preservesCausality).toBe(true);
      }
    });

    it('should have formulas with paradox information', () => {
      const formulas = timeMath.getAllFormulas();
      for (const formula of formulas) {
        expect(formula.causalityStatus).toBeDefined();
        expect(formula.causalityStatus.paradoxType).toBeDefined();
      }
    });
  });

  describe('Time Dilation Calculation', () => {
    it('should calculate relativistic time dilation', () => {
      const formulas = timeMath.getAllFormulas().filter(f => 
        f.mechanism === 'relativistic_dilation'
      );
      
      if (formulas.length > 0) {
        const dilation = timeMath.calculateDilation(formulas[0].id, {
          velocity: 0.9 * 299792458 // 0.9c
        });
        
        // Lorentz factor at 0.9c should be about 2.29
        expect(dilation).toBeGreaterThan(2);
        expect(dilation).toBeLessThan(3);
      }
    });

    it('should calculate gravitational time dilation', () => {
      const formulas = timeMath.getAllFormulas().filter(f => 
        f.mechanism === 'gravitational_dilation'
      );
      
      if (formulas.length > 0) {
        const dilation = timeMath.calculateDilation(formulas[0].id, {
          mass: 1.989e30, // Solar mass
          radius: 1e9 // 1 million km
        });
        
        expect(dilation).toBeGreaterThan(1);
      }
    });
  });

  describe('Simulation', () => {
    it('should simulate time manipulation effect', () => {
      const formulas = timeMath.getAllFormulas();
      const formula = formulas[0];
      
      const result = timeMath.simulate(formula.id, {
        properTime: 1.0,
        velocity: 0.5 * 299792458
      });
      
      expect(result).toBeDefined();
      expect(result?.dilationFactor).toBeGreaterThanOrEqual(1);
      expect(result?.coordinateTimeElapsed).toBeGreaterThanOrEqual(result?.properTimeElapsed || 0);
    });

    it('should return null for invalid formula ID', () => {
      const result = timeMath.simulate('invalid-id', { properTime: 1.0 });
      expect(result).toBeNull();
    });
  });

  describe('Feasibility', () => {
    it('should return most feasible formulas', () => {
      const feasible = timeMath.getMostFeasible(3);
      expect(feasible.length).toBeLessThanOrEqual(3);
      
      // Should be sorted by feasibility
      for (let i = 0; i < feasible.length - 1; i++) {
        expect(feasible[i].energyRequirement.feasibilityScore)
          .toBeGreaterThanOrEqual(feasible[i + 1].energyRequirement.feasibilityScore);
      }
    });
  });

  describe('Hash Verification', () => {
    it('should verify formula hashes', () => {
      const formulas = timeMath.getAllFormulas();
      for (const formula of formulas) {
        expect(timeMath.verifyFormula(formula.id)).toBe(true);
      }
    });
  });

  describe('Export', () => {
    it('should export research data', () => {
      const data = timeMath.exportResearchData();
      expect(data).toHaveProperty('formulas');
      expect(data).toHaveProperty('constants');
      expect(data).toHaveProperty('hash');
    });
  });
});
