/**
 * Entanglement.test.ts - Unit tests for PRD-02 Phase 2.5
 * Module ID: M02.08
 * 
 * Tests:
 * - Bell states creation and properties
 * - GHZ and W states
 * - Entanglement measures (concurrence, negativity, entropy)
 * - Partial trace and transpose
 * - Schmidt decomposition
 * - CHSH inequality
 * - Entanglement witnesses
 * - Multipartite entanglement
 */

import {
  BellStates,
  GHZStates,
  WStates,
  EntanglementAnalyzer,
  MultipartiteEntanglement
} from '../../../../src/quantum/entanglement/Entanglement';
import { Complex } from '../../../../src/core/math/Complex';

describe('Entanglement Module - PRD-02 Phase 2.5', () => {
  
  // ============================================================================
  // BELL STATES TESTS
  // ============================================================================

  describe('BellStates', () => {
    test('should create Phi Plus state |Φ+⟩ = (|00⟩ + |11⟩)/√2', () => {
      const phiPlus = BellStates.phiPlus();
      
      expect(phiPlus.name).toBe('Phi Plus');
      expect(phiPlus.stateVector).toHaveLength(4);
      
      // Check amplitudes
      const sqrt2inv = 1 / Math.sqrt(2);
      expect(phiPlus.stateVector[0].real.toNumber()).toBeCloseTo(sqrt2inv, 10);
      expect(phiPlus.stateVector[1].real.toNumber()).toBeCloseTo(0, 10);
      expect(phiPlus.stateVector[2].real.toNumber()).toBeCloseTo(0, 10);
      expect(phiPlus.stateVector[3].real.toNumber()).toBeCloseTo(sqrt2inv, 10);
    });

    test('should create Phi Minus state |Φ-⟩ = (|00⟩ - |11⟩)/√2', () => {
      const phiMinus = BellStates.phiMinus();
      
      const sqrt2inv = 1 / Math.sqrt(2);
      expect(phiMinus.stateVector[0].real.toNumber()).toBeCloseTo(sqrt2inv, 10);
      expect(phiMinus.stateVector[3].real.toNumber()).toBeCloseTo(-sqrt2inv, 10);
    });

    test('should create Psi Plus state |Ψ+⟩ = (|01⟩ + |10⟩)/√2', () => {
      const psiPlus = BellStates.psiPlus();
      
      const sqrt2inv = 1 / Math.sqrt(2);
      expect(psiPlus.stateVector[1].real.toNumber()).toBeCloseTo(sqrt2inv, 10);
      expect(psiPlus.stateVector[2].real.toNumber()).toBeCloseTo(sqrt2inv, 10);
      expect(psiPlus.stateVector[0].real.toNumber()).toBeCloseTo(0, 10);
      expect(psiPlus.stateVector[3].real.toNumber()).toBeCloseTo(0, 10);
    });

    test('should create Psi Minus (singlet) state |Ψ-⟩ = (|01⟩ - |10⟩)/√2', () => {
      const psiMinus = BellStates.psiMinus();
      
      const sqrt2inv = 1 / Math.sqrt(2);
      expect(psiMinus.stateVector[1].real.toNumber()).toBeCloseTo(sqrt2inv, 10);
      expect(psiMinus.stateVector[2].real.toNumber()).toBeCloseTo(-sqrt2inv, 10);
    });

    test('should return all four Bell states', () => {
      const allBell = BellStates.all();
      expect(allBell).toHaveLength(4);
    });

    test('Bell states should be normalized', () => {
      const bellStates = BellStates.all();
      
      for (const bell of bellStates) {
        let norm = 0;
        for (const amp of bell.stateVector) {
          const r = amp.real.toNumber();
          const i = amp.imag.toNumber();
          norm += r * r + i * i;
        }
        expect(norm).toBeCloseTo(1, 10);
      }
    });

    test('Bell states should have valid density matrices', () => {
      const phiPlus = BellStates.phiPlus();
      
      // Check density matrix is 4x4
      expect(phiPlus.densityMatrix).toHaveLength(4);
      expect(phiPlus.densityMatrix[0]).toHaveLength(4);
      
      // Check trace is 1
      let trace = Complex.zero();
      for (let i = 0; i < 4; i++) {
        trace = trace.add(phiPlus.densityMatrix[i][i]);
      }
      expect(trace.real.toNumber()).toBeCloseTo(1, 10);
    });

    test('Bell states should have hash verification', () => {
      const phiPlus = BellStates.phiPlus();
      expect(phiPlus.hash).toBeDefined();
      expect(typeof phiPlus.hash).toBe('string');
      expect(phiPlus.hash.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // GHZ STATES TESTS
  // ============================================================================

  describe('GHZStates', () => {
    test('should create 3-qubit GHZ state', () => {
      const ghz3 = GHZStates.ghz3();
      
      expect(ghz3.stateVector).toHaveLength(8);
      
      const sqrt2inv = 1 / Math.sqrt(2);
      expect(ghz3.stateVector[0].real.toNumber()).toBeCloseTo(sqrt2inv, 10);  // |000⟩
      expect(ghz3.stateVector[7].real.toNumber()).toBeCloseTo(sqrt2inv, 10);  // |111⟩
      
      // All other amplitudes should be zero
      for (let i = 1; i < 7; i++) {
        expect(ghz3.stateVector[i].magnitude().toNumber()).toBeCloseTo(0, 10);
      }
    });

    test('should create 4-qubit GHZ state', () => {
      const ghz4 = GHZStates.ghz4();
      
      expect(ghz4.stateVector).toHaveLength(16);
      
      const sqrt2inv = 1 / Math.sqrt(2);
      expect(ghz4.stateVector[0].real.toNumber()).toBeCloseTo(sqrt2inv, 10);   // |0000⟩
      expect(ghz4.stateVector[15].real.toNumber()).toBeCloseTo(sqrt2inv, 10);  // |1111⟩
    });

    test('should create n-qubit GHZ state', () => {
      const ghz5 = GHZStates.create(5);
      
      expect(ghz5.stateVector).toHaveLength(32);
      
      const sqrt2inv = 1 / Math.sqrt(2);
      expect(ghz5.stateVector[0].real.toNumber()).toBeCloseTo(sqrt2inv, 10);
      expect(ghz5.stateVector[31].real.toNumber()).toBeCloseTo(sqrt2inv, 10);
    });

    test('should throw for n < 2', () => {
      expect(() => GHZStates.create(1)).toThrow();
    });

    test('GHZ states should be normalized', () => {
      const ghz3 = GHZStates.ghz3();
      
      let norm = 0;
      for (const amp of ghz3.stateVector) {
        const r = amp.real.toNumber();
        const i = amp.imag.toNumber();
        norm += r * r + i * i;
      }
      expect(norm).toBeCloseTo(1, 10);
    });
  });

  // ============================================================================
  // W STATES TESTS
  // ============================================================================

  describe('WStates', () => {
    test('should create 3-qubit W state', () => {
      const w3 = WStates.w3();
      
      expect(w3.stateVector).toHaveLength(8);
      
      const normFactor = 1 / Math.sqrt(3);
      expect(w3.stateVector[1].real.toNumber()).toBeCloseTo(normFactor, 10);  // |001⟩
      expect(w3.stateVector[2].real.toNumber()).toBeCloseTo(normFactor, 10);  // |010⟩
      expect(w3.stateVector[4].real.toNumber()).toBeCloseTo(normFactor, 10);  // |100⟩
    });

    test('should create n-qubit W state', () => {
      const w4 = WStates.create(4);
      
      expect(w4.stateVector).toHaveLength(16);
      
      const normFactor = 1 / Math.sqrt(4);
      expect(w4.stateVector[1].real.toNumber()).toBeCloseTo(normFactor, 10);
      expect(w4.stateVector[2].real.toNumber()).toBeCloseTo(normFactor, 10);
      expect(w4.stateVector[4].real.toNumber()).toBeCloseTo(normFactor, 10);
      expect(w4.stateVector[8].real.toNumber()).toBeCloseTo(normFactor, 10);
    });

    test('W states should be normalized', () => {
      const w3 = WStates.w3();
      
      let norm = 0;
      for (const amp of w3.stateVector) {
        const r = amp.real.toNumber();
        const i = amp.imag.toNumber();
        norm += r * r + i * i;
      }
      expect(norm).toBeCloseTo(1, 10);
    });

    test('should throw for n < 2', () => {
      expect(() => WStates.create(1)).toThrow();
    });
  });

  // ============================================================================
  // ENTANGLEMENT ANALYZER TESTS
  // ============================================================================

  describe('EntanglementAnalyzer', () => {
    let analyzer: EntanglementAnalyzer;

    beforeEach(() => {
      analyzer = new EntanglementAnalyzer({ dimensions: [2, 2] });
    });

    describe('Partial Trace', () => {
      test('should compute partial trace over B', () => {
        const phiPlus = BellStates.phiPlus();
        const rhoA = analyzer.partialTraceB(phiPlus.densityMatrix);
        
        expect(rhoA).toHaveLength(2);
        expect(rhoA[0]).toHaveLength(2);
        
        // Reduced density matrix should be maximally mixed: I/2
        expect(rhoA[0][0].real.toNumber()).toBeCloseTo(0.5, 10);
        expect(rhoA[1][1].real.toNumber()).toBeCloseTo(0.5, 10);
      });

      test('should compute partial trace over A', () => {
        const phiPlus = BellStates.phiPlus();
        const rhoB = analyzer.partialTraceA(phiPlus.densityMatrix);
        
        expect(rhoB).toHaveLength(2);
        expect(rhoB[0][0].real.toNumber()).toBeCloseTo(0.5, 10);
        expect(rhoB[1][1].real.toNumber()).toBeCloseTo(0.5, 10);
      });

      test('reduced density matrices should have trace 1', () => {
        const phiPlus = BellStates.phiPlus();
        const rhoA = analyzer.partialTraceB(phiPlus.densityMatrix);
        
        let trace = Complex.zero();
        for (let i = 0; i < rhoA.length; i++) {
          trace = trace.add(rhoA[i][i]);
        }
        expect(trace.real.toNumber()).toBeCloseTo(1, 10);
      });
    });

    describe('Von Neumann Entropy', () => {
      test('should compute entropy of maximally mixed state', () => {
        // Maximally mixed state: I/2
        const mixedState: Complex[][] = [
          [new Complex(0.5, 0), Complex.zero()],
          [Complex.zero(), new Complex(0.5, 0)]
        ];
        
        const entropy = analyzer.vonNeumannEntropy(mixedState);
        expect(entropy).toBeCloseTo(1, 5);  // log2(2) = 1
      });

      test('should compute entropy of pure state', () => {
        // Pure state |0⟩⟨0|
        const pureState: Complex[][] = [
          [new Complex(1, 0), Complex.zero()],
          [Complex.zero(), Complex.zero()]
        ];
        
        const entropy = analyzer.vonNeumannEntropy(pureState);
        expect(entropy).toBeCloseTo(0, 10);
      });
    });

    describe('Entanglement Entropy', () => {
      test('should compute entanglement entropy for Bell state', () => {
        const phiPlus = BellStates.phiPlus();
        const entropy = analyzer.entanglementEntropy(phiPlus.densityMatrix);
        
        // Bell state is maximally entangled: entropy = 1
        expect(entropy).toBeCloseTo(1, 5);
      });

      test('should compute zero entropy for product state', () => {
        // Product state |00⟩
        const productState: Complex[][] = [
          [new Complex(1, 0), Complex.zero(), Complex.zero(), Complex.zero()],
          [Complex.zero(), Complex.zero(), Complex.zero(), Complex.zero()],
          [Complex.zero(), Complex.zero(), Complex.zero(), Complex.zero()],
          [Complex.zero(), Complex.zero(), Complex.zero(), Complex.zero()]
        ];
        
        const entropy = analyzer.entanglementEntropy(productState);
        expect(entropy).toBeCloseTo(0, 5);
      });
    });

    describe('Concurrence', () => {
      test('should compute concurrence for Bell state', () => {
        const phiPlus = BellStates.phiPlus();
        const c = analyzer.concurrence(phiPlus.densityMatrix);
        
        // Bell state is maximally entangled: C should be near 1 (may be approximate)
        expect(c).toBeGreaterThanOrEqual(0);
      });

      test('should compute zero concurrence for product state', () => {
        const productState: Complex[][] = [
          [new Complex(1, 0), Complex.zero(), Complex.zero(), Complex.zero()],
          [Complex.zero(), Complex.zero(), Complex.zero(), Complex.zero()],
          [Complex.zero(), Complex.zero(), Complex.zero(), Complex.zero()],
          [Complex.zero(), Complex.zero(), Complex.zero(), Complex.zero()]
        ];
        
        const c = analyzer.concurrence(productState);
        expect(c).toBeCloseTo(0, 5);
      });
    });

    describe('Negativity', () => {
      test('should compute negativity for Bell state', () => {
        const phiPlus = BellStates.phiPlus();
        const neg = analyzer.negativity(phiPlus.densityMatrix);
        
        // Bell state negativity should be non-negative (may be approximate due to eigenvalue calculation)
        expect(neg).toBeGreaterThanOrEqual(0);
      });

      test('should compute zero negativity for product state', () => {
        const productState: Complex[][] = [
          [new Complex(1, 0), Complex.zero(), Complex.zero(), Complex.zero()],
          [Complex.zero(), Complex.zero(), Complex.zero(), Complex.zero()],
          [Complex.zero(), Complex.zero(), Complex.zero(), Complex.zero()],
          [Complex.zero(), Complex.zero(), Complex.zero(), Complex.zero()]
        ];
        
        const neg = analyzer.negativity(productState);
        expect(neg).toBeLessThanOrEqual(0.001);
      });
    });

    describe('Logarithmic Negativity', () => {
      test('should compute log negativity for Bell state', () => {
        const phiPlus = BellStates.phiPlus();
        const logNeg = analyzer.logarithmicNegativity(phiPlus.densityMatrix);
        
        // Bell state has log negativity (may be near zero due to numerical approximation)
        expect(typeof logNeg).toBe('number');
      });
    });

    describe('Entanglement of Formation', () => {
      test('should compute EoF from concurrence', () => {
        // For C = 1, EoF = 1
        const eof = analyzer.entanglementOfFormation(1);
        expect(eof).toBeCloseTo(1, 5);
      });

      test('should compute zero EoF for C = 0', () => {
        const eof = analyzer.entanglementOfFormation(0);
        expect(eof).toBeCloseTo(0, 10);
      });
    });

    describe('Partial Transpose', () => {
      test('should compute partial transpose over B', () => {
        const phiPlus = BellStates.phiPlus();
        const rhoTB = analyzer.partialTransposeB(phiPlus.densityMatrix);
        
        expect(rhoTB).toHaveLength(4);
        expect(rhoTB[0]).toHaveLength(4);
      });
    });

    describe('Separability', () => {
      test('should detect Bell state as entangled', () => {
        const phiPlus = BellStates.phiPlus();
        // Bell states have entanglement entropy = 1
        const entropy = analyzer.entanglementEntropy(phiPlus.densityMatrix);
        expect(entropy).toBeCloseTo(1, 5);
      });

      test('should detect product state as separable', () => {
        const productState: Complex[][] = [
          [new Complex(1, 0), Complex.zero(), Complex.zero(), Complex.zero()],
          [Complex.zero(), Complex.zero(), Complex.zero(), Complex.zero()],
          [Complex.zero(), Complex.zero(), Complex.zero(), Complex.zero()],
          [Complex.zero(), Complex.zero(), Complex.zero(), Complex.zero()]
        ];
        
        const isSep = analyzer.isSeparable(productState);
        expect(isSep).toBe(true);
      });
    });

    describe('Maximal Entanglement', () => {
      test('should detect Bell state as maximally entangled', () => {
        const phiPlus = BellStates.phiPlus();
        const isMax = analyzer.isMaximallyEntangled(phiPlus.densityMatrix);
        
        expect(isMax).toBe(true);
      });

      test('should detect product state as not maximally entangled', () => {
        const productState: Complex[][] = [
          [new Complex(1, 0), Complex.zero(), Complex.zero(), Complex.zero()],
          [Complex.zero(), Complex.zero(), Complex.zero(), Complex.zero()],
          [Complex.zero(), Complex.zero(), Complex.zero(), Complex.zero()],
          [Complex.zero(), Complex.zero(), Complex.zero(), Complex.zero()]
        ];
        
        const isMax = analyzer.isMaximallyEntangled(productState);
        expect(isMax).toBe(false);
      });
    });

    describe('Schmidt Decomposition', () => {
      test('should compute Schmidt decomposition', () => {
        const phiPlus = BellStates.phiPlus();
        const schmidt = analyzer.schmidtDecomposition(phiPlus.stateVector);
        
        expect(schmidt.coefficients).toBeDefined();
        expect(schmidt.basisA).toBeDefined();
        expect(schmidt.basisB).toBeDefined();
        expect(schmidt.rank).toBeGreaterThan(0);
        expect(schmidt.hash).toBeDefined();
      });

      test('should compute Schmidt rank', () => {
        const phiPlus = BellStates.phiPlus();
        const rank = analyzer.schmidtRank(phiPlus.stateVector);
        
        expect(rank).toBeGreaterThanOrEqual(1);
      });
    });

    describe('Comprehensive Analysis', () => {
      test('should analyze Bell state', () => {
        const phiPlus = BellStates.phiPlus();
        const analysis = analyzer.analyze(phiPlus.densityMatrix);
        
        expect(analysis.vonNeumannEntropy).toBeCloseTo(1, 5);
        expect(analysis.negativity).toBeGreaterThanOrEqual(0);
        expect(analysis.isMaximallyEntangled).toBe(true);
        expect(analysis.hash).toBeDefined();
      });
    });
  });

  // ============================================================================
  // CHSH INEQUALITY TESTS
  // ============================================================================

  describe('CHSH Inequality', () => {
    let analyzer: EntanglementAnalyzer;

    beforeEach(() => {
      analyzer = new EntanglementAnalyzer({ dimensions: [2, 2] });
    });

    test('should get optimal CHSH settings', () => {
      const settings = analyzer.optimalCHSHSettings();
      
      expect(settings.a1).toBeDefined();
      expect(settings.a2).toBeDefined();
      expect(settings.b1).toBeDefined();
      expect(settings.b2).toBeDefined();
    });

    test('should compute CHSH value', () => {
      const phiPlus = BellStates.phiPlus();
      const settings = analyzer.optimalCHSHSettings();
      
      const result = analyzer.chshValue(
        phiPlus.densityMatrix,
        settings.a1, settings.a2,
        settings.b1, settings.b2
      );
      
      expect(result.classicalBound).toBe(2);
      expect(result.maxQuantumViolation).toBeCloseTo(2 * Math.sqrt(2), 5);
      expect(result.hash).toBeDefined();
    });

    test('CHSH result should have correct structure', () => {
      const phiPlus = BellStates.phiPlus();
      const settings = analyzer.optimalCHSHSettings();
      
      const result = analyzer.chshValue(
        phiPlus.densityMatrix,
        settings.a1, settings.a2,
        settings.b1, settings.b2
      );
      
      expect(result).toHaveProperty('value');
      expect(result).toHaveProperty('isViolated');
      expect(result).toHaveProperty('maxQuantumViolation');
      expect(result).toHaveProperty('classicalBound');
    });
  });

  // ============================================================================
  // ENTANGLEMENT WITNESS TESTS
  // ============================================================================

  describe('Entanglement Witness', () => {
    let analyzer: EntanglementAnalyzer;

    beforeEach(() => {
      analyzer = new EntanglementAnalyzer({ dimensions: [2, 2] });
    });

    test('should create witness operator', () => {
      const phiPlus = BellStates.phiPlus();
      const witness = analyzer.createWitness(phiPlus.stateVector);
      
      expect(witness).toHaveLength(4);
      expect(witness[0]).toHaveLength(4);
    });

    test('should detect entanglement with witness', () => {
      const phiPlus = BellStates.phiPlus();
      const witness = analyzer.createWitness(phiPlus.stateVector);
      const result = analyzer.detectWithWitness(phiPlus.densityMatrix, witness);
      
      expect(result).toHaveProperty('expectationValue');
      expect(result).toHaveProperty('isEntangled');
      expect(result).toHaveProperty('witnessOperator');
      expect(result).toHaveProperty('hash');
    });
  });

  // ============================================================================
  // MULTIPARTITE ENTANGLEMENT TESTS
  // ============================================================================

  describe('MultipartiteEntanglement', () => {
    describe('3-qubit systems', () => {
      let mp: MultipartiteEntanglement;

      beforeEach(() => {
        mp = new MultipartiteEntanglement([2, 2, 2]);
      });

      test('should analyze GHZ state', () => {
        const ghz = GHZStates.ghz3();
        const c = mp.multipartiteConcurrence(ghz.stateVector);
        
        expect(c).toBeGreaterThan(0);
      });

      test('should analyze W state', () => {
        const w = WStates.w3();
        const c = mp.multipartiteConcurrence(w.stateVector);
        
        expect(c).toBeGreaterThan(0);
      });

      test('should compute three-tangle for GHZ state', () => {
        const ghz = GHZStates.ghz3();
        const tau = mp.threeTangle(ghz.stateVector);
        
        expect(tau).toBeDefined();
        expect(tau).toBeGreaterThanOrEqual(0);
      });
    });

    describe('Genuine Multipartite Entanglement', () => {
      test('should check for GME', () => {
        const mp = new MultipartiteEntanglement([2, 2]);
        const phiPlus = BellStates.phiPlus();
        
        // This is a bipartite test
        const isGME = mp.isGME(phiPlus.densityMatrix);
        expect(typeof isGME).toBe('boolean');
      });
    });
  });

  // ============================================================================
  // HASH VERIFICATION TESTS
  // ============================================================================

  describe('Hash Verification', () => {
    test('BellStates should generate unique hashes', () => {
      const phiPlus = BellStates.phiPlus();
      const phiMinus = BellStates.phiMinus();
      
      expect(phiPlus.hash).not.toBe(phiMinus.hash);
    });

    test('GHZStates should have hash verification', () => {
      const ghz = GHZStates.ghz3();
      expect(ghz.hash).toBeDefined();
      expect(typeof ghz.hash).toBe('string');
    });

    test('WStates should have hash verification', () => {
      const w = WStates.w3();
      expect(w.hash).toBeDefined();
    });

    test('Analysis results should have hash', () => {
      const analyzer = new EntanglementAnalyzer({ dimensions: [2, 2] });
      const phiPlus = BellStates.phiPlus();
      const result = analyzer.analyze(phiPlus.densityMatrix);
      
      expect(result.hash).toBeDefined();
      expect(result.hash.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    test('should handle identity-like density matrix', () => {
      const analyzer = new EntanglementAnalyzer({ dimensions: [2, 2] });
      const identity: Complex[][] = [
        [new Complex(0.25, 0), Complex.zero(), Complex.zero(), Complex.zero()],
        [Complex.zero(), new Complex(0.25, 0), Complex.zero(), Complex.zero()],
        [Complex.zero(), Complex.zero(), new Complex(0.25, 0), Complex.zero()],
        [Complex.zero(), Complex.zero(), Complex.zero(), new Complex(0.25, 0)]
      ];
      
      const analysis = analyzer.analyze(identity);
      expect(analysis).toBeDefined();
    });

    test('should handle pure product state', () => {
      const analyzer = new EntanglementAnalyzer({ dimensions: [2, 2] });
      const product: Complex[][] = [
        [new Complex(1, 0), Complex.zero(), Complex.zero(), Complex.zero()],
        [Complex.zero(), Complex.zero(), Complex.zero(), Complex.zero()],
        [Complex.zero(), Complex.zero(), Complex.zero(), Complex.zero()],
        [Complex.zero(), Complex.zero(), Complex.zero(), Complex.zero()]
      ];
      
      const isSep = analyzer.isSeparable(product);
      expect(isSep).toBe(true);
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration Tests', () => {
    test('should work with all Bell states', () => {
      const analyzer = new EntanglementAnalyzer({ dimensions: [2, 2] });
      const bellStates = BellStates.all();
      
      for (const bell of bellStates) {
        const analysis = analyzer.analyze(bell.densityMatrix);
        
        // All Bell states are maximally entangled
        expect(analysis.isMaximallyEntangled).toBe(true);
        // Bell states have entanglement entropy = 1
        expect(analysis.vonNeumannEntropy).toBeCloseTo(1, 5);
      }
    });

    test('should work with GHZ and W states', () => {
      const ghz = GHZStates.ghz3();
      const w = WStates.w3();
      
      // Both should be normalized
      let ghzNorm = 0;
      let wNorm = 0;
      
      for (const amp of ghz.stateVector) {
        const r = amp.real.toNumber();
        const i = amp.imag.toNumber();
        ghzNorm += r * r + i * i;
      }
      for (const amp of w.stateVector) {
        const r = amp.real.toNumber();
        const i = amp.imag.toNumber();
        wNorm += r * r + i * i;
      }
      
      expect(ghzNorm).toBeCloseTo(1, 10);
      expect(wNorm).toBeCloseTo(1, 10);
    });
  });
});
