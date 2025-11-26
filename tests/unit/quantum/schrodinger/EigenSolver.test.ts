/**
 * EigenSolver.test.ts - Tests for eigenvalue solver
 * PRD-02 Phase 2.3, Module M02.05
 */

import { EigenSolver, EigenFactory, EigenResult } from '../../../../src/quantum/schrodinger/EigenSolver';
import { Complex } from '../../../../src/core/math/Complex';

describe('EigenSolver', () => {
  describe('Constructor and Hash', () => {
    test('should initialize with complex matrix', () => {
      const mat = [
        [new Complex(1, 0), new Complex(0, 0)],
        [new Complex(0, 0), new Complex(2, 0)]
      ];
      const solver = new EigenSolver(mat);
      expect(solver).toBeDefined();
    });
    
    test('should compute and verify hash', () => {
      const mat = [
        [new Complex(1, 0), new Complex(0, 0)],
        [new Complex(0, 0), new Complex(2, 0)]
      ];
      const solver = new EigenSolver(mat);
      expect(solver.verifyHash()).toBe(true);
    });
    
    test('should return hash string', () => {
      const mat = [[new Complex(1, 0)]];
      const solver = new EigenSolver(mat);
      expect(typeof solver.getHash()).toBe('string');
      expect(solver.getHash().length).toBeGreaterThan(0);
    });
  });
  
  describe('Diagonal Matrix Eigenvalues', () => {
    test('should find eigenvalues of 2x2 diagonal matrix', () => {
      const mat = [
        [new Complex(3, 0), new Complex(0, 0)],
        [new Complex(0, 0), new Complex(5, 0)]
      ];
      const solver = new EigenSolver(mat);
      const result = solver.solve();
      
      const eigenvaluesReal = result.eigenvalues
        .map((e: Complex) => e.real.toNumber())
        .sort((a: number, b: number) => a - b);
      expect(eigenvaluesReal[0]).toBeCloseTo(3, 5);
      expect(eigenvaluesReal[1]).toBeCloseTo(5, 5);
    });
    
    test('should find eigenvalues of 3x3 diagonal matrix', () => {
      const mat = [
        [new Complex(1, 0), new Complex(0, 0), new Complex(0, 0)],
        [new Complex(0, 0), new Complex(2, 0), new Complex(0, 0)],
        [new Complex(0, 0), new Complex(0, 0), new Complex(3, 0)]
      ];
      const solver = new EigenSolver(mat);
      const result = solver.solve();
      
      expect(result.eigenvalues).toHaveLength(3);
    });
  });
  
  describe('Power Iteration', () => {
    test('should find dominant eigenvalue', () => {
      const mat = [
        [new Complex(2, 0), new Complex(1, 0)],
        [new Complex(1, 0), new Complex(2, 0)]
      ];
      const solver = new EigenSolver(mat);
      const result = solver.powerIteration();
      
      // Dominant eigenvalue should be 3
      expect(result.eigenvalue.real.toNumber()).toBeCloseTo(3, 1);
    });
    
    test('should return hash for eigenvalue result', () => {
      const mat = [
        [new Complex(1, 0), new Complex(0, 0)],
        [new Complex(0, 0), new Complex(2, 0)]
      ];
      const solver = new EigenSolver(mat);
      const result = solver.powerIteration();
      expect(result.hash).toBeDefined();
      expect(result.hash.length).toBeGreaterThan(0);
    });
    
    test('should find normalized eigenvector', () => {
      const mat = [
        [new Complex(2, 0), new Complex(0, 0)],
        [new Complex(0, 0), new Complex(1, 0)]
      ];
      const solver = new EigenSolver(mat);
      const result = solver.powerIteration();
      
      // Check normalization
      let norm = 0;
      for (const c of result.eigenvector) {
        norm += c.magnitude().toNumber() ** 2;
      }
      expect(Math.sqrt(norm)).toBeCloseTo(1, 3);
    });
  });
  
  describe('Rayleigh Quotient Iteration', () => {
    test('should converge to eigenvalue', () => {
      const mat = [
        [new Complex(4, 0), new Complex(1, 0)],
        [new Complex(1, 0), new Complex(3, 0)]
      ];
      const solver = new EigenSolver(mat);
      const result = solver.rayleighIteration();
      
      expect(result.eigenvalue).toBeDefined();
      expect(result.eigenvector.length).toBe(2);
    });
    
    test('should return hash', () => {
      const mat = [[new Complex(5, 0)]];
      const solver = new EigenSolver(mat);
      const result = solver.rayleighIteration();
      expect(result.hash.length).toBeGreaterThan(0);
    });
  });
  
  describe('Jacobi Algorithm', () => {
    test('should solve symmetric matrix', () => {
      const mat = [
        [new Complex(1, 0), new Complex(1, 0)],
        [new Complex(1, 0), new Complex(1, 0)]
      ];
      const solver = new EigenSolver(mat, { method: 'jacobi' });
      const result = solver.jacobiEigen();
      
      expect(result.eigenvalues.length).toBe(2);
      expect(result.isHermitian).toBe(true);
    });
    
    test('should find eigenvalues of identity matrix', () => {
      const mat = [
        [new Complex(1, 0), new Complex(0, 0)],
        [new Complex(0, 0), new Complex(1, 0)]
      ];
      const solver = new EigenSolver(mat, { method: 'jacobi' });
      const result = solver.jacobiEigen();
      
      result.eigenvalues.forEach((e: Complex) => {
        expect(e.real.toNumber()).toBeCloseTo(1, 5);
      });
    });
  });
  
  describe('QR Algorithm', () => {
    test('should decompose 2x2 matrix', () => {
      const mat = [
        [new Complex(1, 0), new Complex(2, 0)],
        [new Complex(0, 0), new Complex(3, 0)]
      ];
      const solver = new EigenSolver(mat, { method: 'qr' });
      const result = solver.qrAlgorithm();
      
      expect(result.eigenvalues.length).toBe(2);
    });
    
    test('should return condition number', () => {
      const mat = [
        [new Complex(1, 0), new Complex(0, 0)],
        [new Complex(0, 0), new Complex(2, 0)]
      ];
      const solver = new EigenSolver(mat);
      const result = solver.qrAlgorithm();
      
      expect(result.conditionNumber).toBeGreaterThan(0);
    });
  });
  
  describe('Spectrum Analysis', () => {
    test('should get sorted spectrum', () => {
      const mat = [
        [new Complex(3, 0), new Complex(0, 0)],
        [new Complex(0, 0), new Complex(1, 0)]
      ];
      const solver = new EigenSolver(mat);
      const spectrum = solver.getSpectrum();
      
      expect(spectrum[0].real.toNumber()).toBeLessThanOrEqual(spectrum[1].real.toNumber());
    });
    
    test('should compute spectral radius', () => {
      const mat = [
        [new Complex(2, 0), new Complex(0, 0)],
        [new Complex(0, 0), new Complex(-3, 0)]
      ];
      const solver = new EigenSolver(mat);
      const radius = solver.spectralRadius();
      
      expect(radius).toBeCloseTo(3, 1);
    });
    
    test('should detect positive definite matrix', () => {
      const mat = [
        [new Complex(2, 0), new Complex(0, 0)],
        [new Complex(0, 0), new Complex(3, 0)]
      ];
      const solver = new EigenSolver(mat);
      expect(solver.isPositiveDefinite()).toBe(true);
    });
    
    test('should detect non-positive definite matrix', () => {
      const mat = [
        [new Complex(1, 0), new Complex(0, 0)],
        [new Complex(0, 0), new Complex(-1, 0)]
      ];
      const solver = new EigenSolver(mat);
      expect(solver.isPositiveDefinite()).toBe(false);
    });
  });
  
  describe('Diagonalization', () => {
    test('should diagonalize matrix', () => {
      const mat = [
        [new Complex(2, 0), new Complex(0, 0)],
        [new Complex(0, 0), new Complex(3, 0)]
      ];
      const solver = new EigenSolver(mat);
      const { P, D, Pinv } = solver.diagonalize();
      
      expect(P.length).toBe(2);
      expect(D.length).toBe(2);
      expect(Pinv.length).toBe(2);
    });
  });
  
  describe('EigenFactory', () => {
    test('should create Pauli X solver', () => {
      const solver = EigenFactory.pauliX();
      const result = solver.solve();
      
      // Pauli X eigenvalues: +1, -1
      const eigenvaluesReal = result.eigenvalues
        .map((e: Complex) => e.real.toNumber())
        .sort((a: number, b: number) => a - b);
      expect(eigenvaluesReal[0]).toBeCloseTo(-1, 1);
      expect(eigenvaluesReal[1]).toBeCloseTo(1, 1);
    });
    
    test('should create Pauli Y solver', () => {
      const solver = EigenFactory.pauliY();
      const result = solver.solve();
      
      expect(result.eigenvalues.length).toBe(2);
    });
    
    test('should create Pauli Z solver', () => {
      const solver = EigenFactory.pauliZ();
      const result = solver.solve();
      
      // Pauli Z eigenvalues: +1, -1
      const eigenvaluesReal = result.eigenvalues
        .map((e: Complex) => e.real.toNumber())
        .sort((a: number, b: number) => a - b);
      expect(eigenvaluesReal[0]).toBeCloseTo(-1, 3);
      expect(eigenvaluesReal[1]).toBeCloseTo(1, 3);
    });
    
    test('should create Hadamard solver', () => {
      const solver = EigenFactory.hadamard();
      const result = solver.solve();
      
      expect(result.eigenvalues.length).toBe(2);
    });
    
    test('should create harmonic oscillator solver', () => {
      const solver = EigenFactory.harmonicOscillator(5);
      const result = solver.solve();
      
      // Energy levels: (n + 0.5)
      expect(result.eigenvalues.length).toBe(5);
    });
    
    test('should create identity solver', () => {
      const solver = EigenFactory.identity(3);
      const result = solver.solve();
      
      // All eigenvalues should be 1
      result.eigenvalues.forEach((e: Complex) => {
        expect(e.real.toNumber()).toBeCloseTo(1, 5);
      });
    });
  });
  
  describe('Hermitian and Unitary Checks', () => {
    test('should identify Hermitian matrix', () => {
      const mat = [
        [new Complex(1, 0), new Complex(2, 1)],
        [new Complex(2, -1), new Complex(3, 0)]
      ];
      const solver = new EigenSolver(mat);
      const result = solver.solve();
      expect(result.isHermitian).toBe(true);
    });
    
    test('should identify non-Hermitian matrix', () => {
      const mat = [
        [new Complex(1, 0), new Complex(2, 0)],
        [new Complex(3, 0), new Complex(4, 0)]
      ];
      const solver = new EigenSolver(mat);
      const result = solver.solve();
      expect(result.isHermitian).toBe(false);
    });
  });
  
  describe('Edge Cases', () => {
    test('should handle 1x1 matrix', () => {
      const mat = [[new Complex(7, 0)]];
      const solver = new EigenSolver(mat);
      const result = solver.solve();
      
      expect(result.eigenvalues[0].real.toNumber()).toBeCloseTo(7, 5);
    });
    
    test('should handle zero matrix', () => {
      const mat = [
        [new Complex(0, 0), new Complex(0, 0)],
        [new Complex(0, 0), new Complex(0, 0)]
      ];
      const solver = new EigenSolver(mat);
      const result = solver.solve();
      
      expect(result.eigenvalues.length).toBe(2);
    });
    
    test('should handle complex eigenvalues', () => {
      // Rotation matrix has complex eigenvalues
      const theta = Math.PI / 4;
      const mat = [
        [new Complex(Math.cos(theta), 0), new Complex(-Math.sin(theta), 0)],
        [new Complex(Math.sin(theta), 0), new Complex(Math.cos(theta), 0)]
      ];
      const solver = new EigenSolver(mat);
      const result = solver.solve();
      
      expect(result.eigenvalues.length).toBe(2);
    });
  });
  
  describe('Configuration Options', () => {
    test('should accept custom tolerance', () => {
      const mat = [[new Complex(1, 0)]];
      const solver = new EigenSolver(mat, { tolerance: 1e-15 });
      expect(solver).toBeDefined();
    });
    
    test('should accept custom max iterations', () => {
      const mat = [[new Complex(1, 0)]];
      const solver = new EigenSolver(mat, { maxIterations: 500 });
      expect(solver).toBeDefined();
    });
    
    test('should accept method selection', () => {
      const mat = [[new Complex(1, 0)]];
      const solver = new EigenSolver(mat, { method: 'power' });
      expect(solver).toBeDefined();
    });
  });
});
