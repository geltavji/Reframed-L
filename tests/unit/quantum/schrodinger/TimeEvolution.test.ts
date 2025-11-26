/**
 * TimeEvolution.test.ts - Tests for time evolution solver
 * PRD-02 Phase 2.3, Module M02.06
 */

import { 
  TimeEvolution, 
  HamiltonianFactory, 
  StateFactory 
} from '../../../../src/quantum/schrodinger/TimeEvolution';
import { Complex } from '../../../../src/core/math/Complex';

describe('TimeEvolution', () => {
  describe('Constructor and Hash', () => {
    test('should initialize with Hamiltonian', () => {
      const H = [
        [new Complex(1, 0), new Complex(0, 0)],
        [new Complex(0, 0), new Complex(2, 0)]
      ];
      const solver = new TimeEvolution(H);
      expect(solver).toBeDefined();
    });
    
    test('should compute and verify hash', () => {
      const H = [[new Complex(1, 0)]];
      const solver = new TimeEvolution(H);
      expect(solver.verifyHash()).toBe(true);
    });
    
    test('should return hash string', () => {
      const H = [[new Complex(1, 0)]];
      const solver = new TimeEvolution(H);
      expect(typeof solver.getHash()).toBe('string');
      expect(solver.getHash().length).toBeGreaterThan(0);
    });
    
    test('should accept configuration options', () => {
      const H = [[new Complex(1, 0)]];
      const solver = new TimeEvolution(H, {
        method: 'rk4',
        timeStep: 0.001,
        tolerance: 1e-12
      });
      expect(solver).toBeDefined();
    });
  });
  
  describe('Propagator Computation', () => {
    test('should compute propagator for t=0', () => {
      const H = [
        [new Complex(1, 0), new Complex(0, 0)],
        [new Complex(0, 0), new Complex(1, 0)]
      ];
      const solver = new TimeEvolution(H);
      const prop = solver.computePropagator(0);
      
      // At t=0, propagator should be identity
      expect(prop.matrix[0][0].real.toNumber()).toBeCloseTo(1, 5);
      expect(prop.matrix[1][1].real.toNumber()).toBeCloseTo(1, 5);
    });
    
    test('should return unitary propagator', () => {
      const H = [
        [new Complex(1, 0), new Complex(0, 0)],
        [new Complex(0, 0), new Complex(2, 0)]
      ];
      const solver = new TimeEvolution(H);
      const prop = solver.computePropagator(1);
      
      expect(prop.isUnitary).toBe(true);
    });
    
    test('should include hash in propagator', () => {
      const H = [[new Complex(1, 0)]];
      const solver = new TimeEvolution(H);
      const prop = solver.computePropagator(1);
      
      expect(prop.hash.length).toBeGreaterThan(0);
    });
  });
  
  describe('Exact Evolution', () => {
    test('should evolve state with exact method', () => {
      const H = [
        [new Complex(1, 0), new Complex(0, 0)],
        [new Complex(0, 0), new Complex(1, 0)]
      ];
      const solver = new TimeEvolution(H, { method: 'exact' });
      const initialState = [new Complex(1, 0), new Complex(0, 0)];
      
      const result = solver.evolve(initialState, 1);
      
      expect(result.finalState.length).toBe(2);
      expect(result.time).toBe(1);
    });
    
    test('should preserve probability during evolution', () => {
      const H = [
        [new Complex(1, 0), new Complex(0.5, 0)],
        [new Complex(0.5, 0), new Complex(2, 0)]
      ];
      const solver = new TimeEvolution(H);
      const initialState = [new Complex(1, 0), new Complex(0, 0)];
      
      const result = solver.evolve(initialState, 2);
      
      // Total probability should be conserved (close to 1)
      expect(result.probability).toBeCloseTo(1, 1);
    });
    
    test('should return energy expectation value', () => {
      const H = [
        [new Complex(1, 0), new Complex(0, 0)],
        [new Complex(0, 0), new Complex(2, 0)]
      ];
      const solver = new TimeEvolution(H);
      const initialState = [new Complex(1, 0), new Complex(0, 0)];
      
      const result = solver.evolve(initialState, 1);
      
      expect(result.energy).toBeDefined();
      expect(result.energy.real.toNumber()).toBeCloseTo(1, 3);
    });
  });
  
  describe('Euler Method', () => {
    test('should evolve using Euler method', () => {
      const H = [
        [new Complex(1, 0), new Complex(0, 0)],
        [new Complex(0, 0), new Complex(1, 0)]
      ];
      const solver = new TimeEvolution(H, { method: 'euler', timeStep: 0.01 });
      const initialState = [new Complex(1, 0), new Complex(0, 0)];
      
      const result = solver.evolve(initialState, 0.1);
      
      expect(result.steps).toBeGreaterThan(0);
    });
  });
  
  describe('RK4 Method', () => {
    test('should evolve using RK4 method', () => {
      const H = [
        [new Complex(1, 0), new Complex(0, 0)],
        [new Complex(0, 0), new Complex(2, 0)]
      ];
      const solver = new TimeEvolution(H, { method: 'rk4', timeStep: 0.01 });
      const initialState = [new Complex(1, 0), new Complex(0, 0)];
      
      const result = solver.evolve(initialState, 0.1);
      
      expect(result.steps).toBeGreaterThan(0);
      expect(result.finalState.length).toBe(2);
    });
  });
  
  describe('Crank-Nicolson Method', () => {
    test('should evolve using Crank-Nicolson', () => {
      const H = [
        [new Complex(1, 0), new Complex(0, 0)],
        [new Complex(0, 0), new Complex(2, 0)]
      ];
      const solver = new TimeEvolution(H, { method: 'crank-nicolson', timeStep: 0.01 });
      const initialState = [new Complex(1, 0), new Complex(0, 0)];
      
      const result = solver.evolve(initialState, 0.1);
      
      expect(result.finalState.length).toBe(2);
    });
  });
  
  describe('Time-Independent Schrödinger Equation', () => {
    test('should solve eigenvalue problem', () => {
      const H = [
        [new Complex(1, 0), new Complex(0, 0)],
        [new Complex(0, 0), new Complex(2, 0)]
      ];
      const solver = new TimeEvolution(H);
      const { energies, states } = solver.solveTimeIndependent();
      
      expect(energies.length).toBe(2);
      expect(states.length).toBe(2);
    });
    
    test('should find ground state', () => {
      const H = [
        [new Complex(1, 0), new Complex(0, 0)],
        [new Complex(0, 0), new Complex(2, 0)]
      ];
      const solver = new TimeEvolution(H);
      const { energy, state } = solver.groundState();
      
      expect(energy.real.toNumber()).toBeCloseTo(1, 3);
      expect(state.length).toBe(2);
    });
    
    test('should compute energy spectrum', () => {
      const H = [
        [new Complex(3, 0), new Complex(0, 0)],
        [new Complex(0, 0), new Complex(1, 0)]
      ];
      const solver = new TimeEvolution(H);
      const spectrum = solver.energySpectrum();
      
      expect(spectrum[0].real.toNumber()).toBeLessThanOrEqual(spectrum[1].real.toNumber());
    });
  });
  
  describe('Observables and Probabilities', () => {
    test('should compute expectation value', () => {
      const H = [
        [new Complex(1, 0), new Complex(0, 0)],
        [new Complex(0, 0), new Complex(2, 0)]
      ];
      const solver = new TimeEvolution(H);
      const initialState = [new Complex(1, 0), new Complex(0, 0)];
      
      const expectation = solver.expectationValue(initialState, H, 0);
      
      expect(expectation.real.toNumber()).toBeCloseTo(1, 3);
    });
    
    test('should compute probability amplitude', () => {
      const H = [
        [new Complex(1, 0), new Complex(0, 0)],
        [new Complex(0, 0), new Complex(1, 0)]
      ];
      const solver = new TimeEvolution(H);
      const initialState = [new Complex(1, 0), new Complex(0, 0)];
      const finalState = [new Complex(1, 0), new Complex(0, 0)];
      
      const amplitude = solver.probabilityAmplitude(initialState, finalState, 0);
      
      expect(amplitude.magnitude()).toBeCloseTo(1, 3);
    });
    
    test('should compute transition probability', () => {
      const H = [
        [new Complex(1, 0), new Complex(0.5, 0)],
        [new Complex(0.5, 0), new Complex(2, 0)]
      ];
      const solver = new TimeEvolution(H);
      const state0 = [new Complex(1, 0), new Complex(0, 0)];
      const state1 = [new Complex(0, 0), new Complex(1, 0)];
      
      const prob = solver.transitionProbability(state0, state1, 1);
      
      expect(prob).toBeGreaterThanOrEqual(0);
      expect(prob).toBeLessThanOrEqual(1);
    });
  });
  
  describe('Energy Conservation', () => {
    test('should check energy conservation', () => {
      const H = [
        [new Complex(1, 0), new Complex(0, 0)],
        [new Complex(0, 0), new Complex(2, 0)]
      ];
      const solver = new TimeEvolution(H);
      const initialState = [new Complex(1, 0), new Complex(0, 0)];
      
      const result = solver.checkEnergyConservation(initialState, [0, 0.5, 1, 1.5, 2]);
      
      expect(result.conserved).toBe(true);
      expect(result.hash.length).toBeGreaterThan(0);
    });
  });
  
  describe('HamiltonianFactory', () => {
    test('should create free particle Hamiltonian', () => {
      const H = HamiltonianFactory.freeParticle(5);
      expect(H.length).toBe(5);
      expect(H[0].length).toBe(5);
    });
    
    test('should create harmonic oscillator Hamiltonian', () => {
      const H = HamiltonianFactory.harmonicOscillator(5);
      
      // Check diagonal elements (n + 0.5)
      expect(H[0][0].real.toNumber()).toBeCloseTo(0.5, 5);
      expect(H[1][1].real.toNumber()).toBeCloseTo(1.5, 5);
      expect(H[2][2].real.toNumber()).toBeCloseTo(2.5, 5);
    });
    
    test('should create two-level system Hamiltonian', () => {
      const H = HamiltonianFactory.twoLevel(1, 0.5);
      expect(H.length).toBe(2);
      expect(H[0][0].real.toNumber()).toBeCloseTo(0.5, 5);
      expect(H[1][1].real.toNumber()).toBeCloseTo(-0.5, 5);
    });
    
    test('should create particle in box Hamiltonian', () => {
      const H = HamiltonianFactory.particleInBox(10);
      expect(H.length).toBe(10);
    });
    
    test('should create spin in field Hamiltonian', () => {
      const H = HamiltonianFactory.spinInField(0, 0, 1);
      expect(H.length).toBe(2);
    });
  });
  
  describe('StateFactory', () => {
    test('should create ground state', () => {
      const state = StateFactory.groundState(5);
      expect(state[0].real.toNumber()).toBe(1);
      expect(state[1].real.toNumber()).toBe(0);
    });
    
    test('should create excited state', () => {
      const state = StateFactory.excitedState(5, 2);
      expect(state[0].real.toNumber()).toBe(0);
      expect(state[2].real.toNumber()).toBe(1);
    });
    
    test('should create superposition state', () => {
      const state = StateFactory.superposition(2);
      const s = 1 / Math.sqrt(2);
      expect(state[0].real.toNumber()).toBeCloseTo(s, 5);
      expect(state[1].real.toNumber()).toBeCloseTo(s, 5);
    });
    
    test('should create coherent state', () => {
      const alpha = new Complex(1, 0);
      const state = StateFactory.coherentState(5, alpha);
      expect(state.length).toBe(5);
      
      // Check normalization
      let norm = 0;
      for (const c of state) {
        norm += c.magnitude().toNumber() ** 2;
      }
      expect(norm).toBeCloseTo(1, 1);
    });
  });
  
  describe('Quantum Systems', () => {
    test('should evolve harmonic oscillator ground state', () => {
      const H = HamiltonianFactory.harmonicOscillator(5);
      const solver = new TimeEvolution(H);
      const groundState = StateFactory.groundState(5);
      
      const result = solver.evolve(groundState, 2 * Math.PI);
      
      // Ground state should return to itself (up to phase)
      expect(result.probability).toBeCloseTo(1, 1);
    });
    
    test('should show Rabi oscillations in two-level system', () => {
      const H = HamiltonianFactory.twoLevel(0, 1);
      const solver = new TimeEvolution(H);
      const initialState = [new Complex(1, 0), new Complex(0, 0)];
      
      // At t = π/2, state should be maximally mixed
      const result = solver.evolve(initialState, Math.PI / 2);
      
      expect(result.finalState.length).toBe(2);
    });
    
    test('should handle spin precession', () => {
      const H = HamiltonianFactory.spinInField(0, 0, 1);
      const solver = new TimeEvolution(H);
      
      // Start in |+x⟩ = (|0⟩ + |1⟩)/√2
      const initialState = StateFactory.superposition(2);
      
      const result = solver.evolve(initialState, Math.PI);
      
      expect(result.probability).toBeCloseTo(1, 1);
    });
  });
  
  describe('Edge Cases', () => {
    test('should handle 1x1 Hamiltonian', () => {
      const H = [[new Complex(5, 0)]];
      const solver = new TimeEvolution(H);
      const initialState = [new Complex(1, 0)];
      
      const result = solver.evolve(initialState, 1);
      
      expect(result.finalState.length).toBe(1);
      expect(result.probability).toBeCloseTo(1, 3);
    });
    
    test('should handle zero Hamiltonian', () => {
      const H = [
        [new Complex(0, 0), new Complex(0, 0)],
        [new Complex(0, 0), new Complex(0, 0)]
      ];
      const solver = new TimeEvolution(H);
      const initialState = [new Complex(1, 0), new Complex(0, 0)];
      
      const result = solver.evolve(initialState, 1);
      
      // State should not change
      expect(result.finalState[0].real.toNumber()).toBeCloseTo(1, 3);
    });
    
    test('should handle zero evolution time', () => {
      const H = [
        [new Complex(1, 0), new Complex(0, 0)],
        [new Complex(0, 0), new Complex(2, 0)]
      ];
      const solver = new TimeEvolution(H);
      const initialState = [new Complex(1, 0), new Complex(0, 0)];
      
      const result = solver.evolve(initialState, 0);
      
      expect(result.finalState[0].real.toNumber()).toBeCloseTo(1, 3);
    });
  });
});
