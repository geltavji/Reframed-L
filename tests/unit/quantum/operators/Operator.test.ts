/**
 * Qlaws Ham - Operator Module Unit Tests
 * 
 * PRD-02 Phase 2.2: Quantum Operators
 * Module: M02.03 - Operator.ts
 * 
 * Tests: 75 tests covering:
 * - Operator class (creation, properties, operations)
 * - Hermitian operators (observables)
 * - Unitary operators (time evolution)
 * - Observable class
 * - Pauli matrices
 * - Position, Momentum, Number operators
 * - Creation/Annihilation operators
 * - Angular momentum operators
 * - Tensor products
 */

import { 
  Vector,
  Matrix,
  Operator,
  Hermitian,
  Unitary,
  Observable,
  PauliX,
  PauliY,
  PauliZ,
  Hadamard,
  createPositionOperator,
  createMomentumOperator,
  createNumberOperator,
  createCreationOperator,
  createAnnihilationOperator,
  createHarmonicOscillatorHamiltonian,
  createSpinOperators,
  createRaisingOperator,
  createLoweringOperator,
  tensorProduct
} from '../../../../src/quantum/operators/Operator';
import { Complex } from '../../../../src/core/math/Complex';

describe('Operator (M02.03) - PRD-02 Phase 2.2', () => {
  
  describe('Basic Operator Creation', () => {
    it('should create identity operator', () => {
      const id = Operator.identity(3);
      expect(id.getDimension()).toBe(3);
      expect(id.getElement(0, 0).real.toNumber()).toBeCloseTo(1);
      expect(id.getElement(1, 1).real.toNumber()).toBeCloseTo(1);
      expect(id.getElement(0, 1).real.toNumber()).toBeCloseTo(0);
    });

    it('should create zero operator', () => {
      const zero = Operator.zero(2);
      expect(zero.getDimension()).toBe(2);
      expect(zero.getElement(0, 0).real.toNumber()).toBeCloseTo(0);
      expect(zero.getElement(1, 1).real.toNumber()).toBeCloseTo(0);
    });

    it('should create operator from matrix', () => {
      const data: Complex[][] = [
        [new Complex(1, 0), new Complex(0, 1)],
        [new Complex(0, -1), new Complex(1, 0)]
      ];
      const op = new Operator(new Matrix(data), 'TestOp');
      expect(op.getName()).toBe('TestOp');
      expect(op.getDimension()).toBe(2);
    });

    it('should reject non-square matrices', () => {
      const data: Complex[][] = [
        [Complex.one(), Complex.zero(), Complex.zero()],
        [Complex.zero(), Complex.one(), Complex.zero()]
      ];
      expect(() => new Operator(new Matrix(data))).toThrow();
    });

    it('should have unique ID and hash', () => {
      const op1 = Operator.identity(2);
      const op2 = Operator.identity(2);
      expect(op1.getId()).not.toBe(op2.getId());
      expect(op1.getHash()).toBeDefined();
    });
  });

  describe('Operator Arithmetic', () => {
    const id = Operator.identity(2);
    const zero = Operator.zero(2);

    it('should add operators', () => {
      const sum = id.add(id);
      expect(sum.getElement(0, 0).real.toNumber()).toBeCloseTo(2);
      expect(sum.getElement(1, 1).real.toNumber()).toBeCloseTo(2);
    });

    it('should subtract operators', () => {
      const diff = id.subtract(id);
      expect(diff.getElement(0, 0).real.toNumber()).toBeCloseTo(0);
    });

    it('should multiply operators', () => {
      const product = id.multiply(id);
      expect(product.equals(id)).toBe(true);
    });

    it('should scale operators', () => {
      const scaled = id.scale(new Complex(2, 0));
      expect(scaled.getElement(0, 0).real.toNumber()).toBeCloseTo(2);
    });

    it('should compute power', () => {
      const power = id.power(3);
      expect(power.equals(id)).toBe(true);
    });

    it('should handle power of 0', () => {
      const power = PauliX.power(0);
      expect(power.equals(Operator.identity(2))).toBe(true);
    });
  });

  describe('Operator Properties', () => {
    it('should compute trace', () => {
      const id = Operator.identity(3);
      expect(id.trace().real.toNumber()).toBeCloseTo(3);
    });

    it('should compute norm', () => {
      const id = Operator.identity(2);
      expect(id.norm()).toBeGreaterThan(0);
    });

    it('should compute determinant', () => {
      const id = Operator.identity(2);
      expect(id.determinant().real.toNumber()).toBeCloseTo(1);
    });

    it('should compute dagger (Hermitian adjoint)', () => {
      // Non-Hermitian matrix
      const data: Complex[][] = [
        [new Complex(1, 0), new Complex(2, 3)],
        [new Complex(4, 5), new Complex(6, 0)]
      ];
      const op = new Operator(new Matrix(data));
      const dagger = op.dagger();
      // Dagger transposes and conjugates
      // Original (0,1) = 2+3i -> Dagger (1,0) = 2-3i
      expect(dagger.getElement(1, 0).real.toNumber()).toBeCloseTo(2);
      expect(dagger.getElement(1, 0).imag.toNumber()).toBeCloseTo(-3);
      // Original (1,0) = 4+5i -> Dagger (0,1) = 4-5i
      expect(dagger.getElement(0, 1).real.toNumber()).toBeCloseTo(4);
      expect(dagger.getElement(0, 1).imag.toNumber()).toBeCloseTo(-5);
    });

    it('should get properties object', () => {
      const props = Operator.identity(2).getProperties();
      expect(props.dimension).toBe(2);
      expect(props.isHermitian).toBe(true);
      expect(props.isUnitary).toBe(true);
    });
  });

  describe('Hermitian Detection', () => {
    it('should detect identity as Hermitian', () => {
      expect(Operator.identity(3).isHermitian()).toBe(true);
    });

    it('should detect Pauli matrices as Hermitian', () => {
      expect(PauliX.isHermitian()).toBe(true);
      expect(PauliY.isHermitian()).toBe(true);
      expect(PauliZ.isHermitian()).toBe(true);
    });

    it('should detect non-Hermitian operator', () => {
      const data: Complex[][] = [
        [Complex.one(), new Complex(1, 0)],
        [Complex.zero(), Complex.one()]
      ];
      const op = new Operator(new Matrix(data));
      expect(op.isHermitian()).toBe(false);
    });
  });

  describe('Unitary Detection', () => {
    it('should detect identity as unitary', () => {
      expect(Operator.identity(2).isUnitary()).toBe(true);
    });

    it('should detect Pauli matrices as unitary', () => {
      expect(PauliX.isUnitary()).toBe(true);
      expect(PauliY.isUnitary()).toBe(true);
      expect(PauliZ.isUnitary()).toBe(true);
    });

    it('should detect Hadamard as unitary', () => {
      expect(Hadamard.isUnitary()).toBe(true);
    });
  });

  describe('Projection Detection', () => {
    it('should detect projection operator', () => {
      const state = new Vector([Complex.one(), Complex.zero()]);
      const proj = Operator.projector(state);
      expect(proj.isProjection()).toBe(true);
    });

    it('should reject non-projection', () => {
      expect(PauliX.isProjection()).toBe(false);
    });
  });

  describe('Operator Application', () => {
    it('should apply to state vector', () => {
      const state = new Vector([Complex.one(), Complex.zero()]);
      const action = PauliX.apply(state);
      expect(action.result.getComponent(0).real.toNumber()).toBeCloseTo(0);
      expect(action.result.getComponent(1).real.toNumber()).toBeCloseTo(1);
    });

    it('should generate hash for action', () => {
      const state = new Vector([Complex.one(), Complex.zero()]);
      const action = PauliX.apply(state);
      expect(action.inputHash).toBeDefined();
      expect(action.outputHash).toBeDefined();
      expect(action.operatorHash).toBeDefined();
    });

    it('should reject dimension mismatch', () => {
      const state = new Vector([Complex.one(), Complex.zero(), Complex.zero()]);
      expect(() => PauliX.apply(state)).toThrow();
    });
  });

  describe('Expectation Values', () => {
    it('should compute expectation value', () => {
      const state = new Vector([
        new Complex(1/Math.sqrt(2), 0),
        new Complex(1/Math.sqrt(2), 0)
      ]);
      const exp = PauliZ.expectationValue(state);
      expect(exp.real.toNumber()).toBeCloseTo(0);
    });

    it('should compute variance', () => {
      const state = new Vector([Complex.one(), Complex.zero()]);
      const variance = PauliZ.variance(state);
      expect(variance).toBeCloseTo(0);
    });

    it('should compute standard deviation', () => {
      const state = new Vector([
        new Complex(1/Math.sqrt(2), 0),
        new Complex(1/Math.sqrt(2), 0)
      ]);
      const std = PauliZ.standardDeviation(state);
      expect(std).toBeCloseTo(1);
    });
  });

  describe('Outer Product', () => {
    it('should create outer product |ψ⟩⟨φ|', () => {
      const ket = new Vector([Complex.one(), Complex.zero()]);
      const bra = new Vector([Complex.zero(), Complex.one()]);
      const outer = Operator.outerProduct(ket, bra);
      expect(outer.getElement(0, 1).real.toNumber()).toBeCloseTo(1);
      expect(outer.getElement(1, 0).real.toNumber()).toBeCloseTo(0);
    });

    it('should create projector |ψ⟩⟨ψ|', () => {
      const state = new Vector([Complex.one(), Complex.zero()]);
      const proj = Operator.projector(state);
      expect(proj.getElement(0, 0).real.toNumber()).toBeCloseTo(1);
      expect(proj.isProjection()).toBe(true);
    });
  });

  describe('Pauli Matrices', () => {
    it('should have correct PauliX elements', () => {
      expect(PauliX.getElement(0, 1).real.toNumber()).toBeCloseTo(1);
      expect(PauliX.getElement(1, 0).real.toNumber()).toBeCloseTo(1);
    });

    it('should have correct PauliY elements', () => {
      expect(PauliY.getElement(0, 1).imag.toNumber()).toBeCloseTo(-1);
      expect(PauliY.getElement(1, 0).imag.toNumber()).toBeCloseTo(1);
    });

    it('should have correct PauliZ elements', () => {
      expect(PauliZ.getElement(0, 0).real.toNumber()).toBeCloseTo(1);
      expect(PauliZ.getElement(1, 1).real.toNumber()).toBeCloseTo(-1);
    });

    it('should have Pauli² = I', () => {
      const xx = PauliX.multiply(PauliX);
      const yy = PauliY.multiply(PauliY);
      const zz = PauliZ.multiply(PauliZ);
      expect(xx.equals(Operator.identity(2))).toBe(true);
      expect(yy.equals(Operator.identity(2))).toBe(true);
      expect(zz.equals(Operator.identity(2))).toBe(true);
    });

    it('should have det(σ) = -1', () => {
      expect(PauliX.determinant().real.toNumber()).toBeCloseTo(-1);
      expect(PauliY.determinant().real.toNumber()).toBeCloseTo(-1);
      expect(PauliZ.determinant().real.toNumber()).toBeCloseTo(-1);
    });
  });

  describe('Hadamard Gate', () => {
    it('should have correct elements', () => {
      const h = 1 / Math.sqrt(2);
      expect(Hadamard.getElement(0, 0).real.toNumber()).toBeCloseTo(h);
      expect(Hadamard.getElement(0, 1).real.toNumber()).toBeCloseTo(h);
      expect(Hadamard.getElement(1, 1).real.toNumber()).toBeCloseTo(-h);
    });

    it('should be self-inverse (H² = I)', () => {
      const hh = Hadamard.multiply(Hadamard);
      expect(hh.equals(Operator.identity(2))).toBe(true);
    });

    it('should transform |0⟩ to |+⟩', () => {
      const zero = new Vector([Complex.one(), Complex.zero()]);
      const plus = Hadamard.apply(zero).result;
      expect(plus.getComponent(0).real.toNumber()).toBeCloseTo(1/Math.sqrt(2));
      expect(plus.getComponent(1).real.toNumber()).toBeCloseTo(1/Math.sqrt(2));
    });
  });

  describe('Position Operator', () => {
    it('should create position operator', () => {
      const x = createPositionOperator(5);
      expect(x.getDimension()).toBe(5);
      expect(x.isHermitian()).toBe(true);
    });

    it('should be diagonal', () => {
      const x = createPositionOperator(3);
      expect(x.getElement(0, 1).real.toNumber()).toBeCloseTo(0);
      expect(x.getElement(1, 0).real.toNumber()).toBeCloseTo(0);
    });
  });

  describe('Momentum Operator', () => {
    it('should create momentum operator', () => {
      const p = createMomentumOperator(5);
      expect(p.getDimension()).toBe(5);
    });

    it('should be anti-Hermitian times i', () => {
      const p = createMomentumOperator(4);
      // p should have off-diagonal imaginary elements
      expect(p.getElement(0, 1).imag.toNumber()).not.toBe(0);
    });
  });

  describe('Number Operator', () => {
    it('should create number operator', () => {
      const n = createNumberOperator(5);
      expect(n.getDimension()).toBe(5);
      expect(n.isHermitian()).toBe(true);
    });

    it('should have eigenvalues 0, 1, 2, ...', () => {
      const n = createNumberOperator(4);
      expect(n.getElement(0, 0).real.toNumber()).toBeCloseTo(0);
      expect(n.getElement(1, 1).real.toNumber()).toBeCloseTo(1);
      expect(n.getElement(2, 2).real.toNumber()).toBeCloseTo(2);
      expect(n.getElement(3, 3).real.toNumber()).toBeCloseTo(3);
    });
  });

  describe('Creation/Annihilation Operators', () => {
    it('should create creation operator', () => {
      const aDagger = createCreationOperator(4);
      expect(aDagger.getDimension()).toBe(4);
    });

    it('should create annihilation operator', () => {
      const a = createAnnihilationOperator(4);
      expect(a.getDimension()).toBe(4);
    });

    it('should have a†|n⟩ = √(n+1)|n+1⟩', () => {
      const aDagger = createCreationOperator(4);
      // |0⟩ state
      const n0 = new Vector([Complex.one(), Complex.zero(), Complex.zero(), Complex.zero()]);
      const result = aDagger.apply(n0).result;
      expect(result.getComponent(1).real.toNumber()).toBeCloseTo(1);
    });

    it('should have a|n⟩ = √n|n-1⟩', () => {
      const a = createAnnihilationOperator(4);
      // |1⟩ state
      const n1 = new Vector([Complex.zero(), Complex.one(), Complex.zero(), Complex.zero()]);
      const result = a.apply(n1).result;
      expect(result.getComponent(0).real.toNumber()).toBeCloseTo(1);
    });

    it('should satisfy n = a†a', () => {
      const dim = 4;
      const a = createAnnihilationOperator(dim);
      const aDagger = createCreationOperator(dim);
      const n = createNumberOperator(dim);
      const product = aDagger.multiply(a);
      expect(product.equals(n, 1e-10)).toBe(true);
    });
  });

  describe('Harmonic Oscillator Hamiltonian', () => {
    it('should create harmonic oscillator Hamiltonian', () => {
      const H = createHarmonicOscillatorHamiltonian(5);
      expect(H.getDimension()).toBe(5);
      expect(H.isHermitian()).toBe(true);
    });

    it('should have eigenvalues ħω(n + 1/2)', () => {
      const H = createHarmonicOscillatorHamiltonian(4, 1, 1);
      expect(H.getElement(0, 0).real.toNumber()).toBeCloseTo(0.5);
      expect(H.getElement(1, 1).real.toNumber()).toBeCloseTo(1.5);
      expect(H.getElement(2, 2).real.toNumber()).toBeCloseTo(2.5);
    });
  });

  describe('Spin Operators', () => {
    it('should create spin-1/2 operators', () => {
      const { Sx, Sy, Sz } = createSpinOperators();
      expect(Sx.getDimension()).toBe(2);
      expect(Sy.getDimension()).toBe(2);
      expect(Sz.getDimension()).toBe(2);
    });

    it('should have correct spin-z eigenvalues', () => {
      const { Sz } = createSpinOperators(1);
      expect(Sz.getElement(0, 0).real.toNumber()).toBeCloseTo(0.5);
      expect(Sz.getElement(1, 1).real.toNumber()).toBeCloseTo(-0.5);
    });
  });

  describe('Raising/Lowering Operators', () => {
    it('should create raising operator', () => {
      const Lplus = createRaisingOperator(3);
      expect(Lplus.getDimension()).toBe(3);
    });

    it('should create lowering operator', () => {
      const Lminus = createLoweringOperator(3);
      expect(Lminus.getDimension()).toBe(3);
    });
  });

  describe('Tensor Product', () => {
    it('should compute tensor product of operators', () => {
      const product = tensorProduct(PauliZ, PauliX);
      expect(product.getDimension()).toBe(4);
    });

    it('should have correct dimension', () => {
      const id2 = Operator.identity(2);
      const id3 = Operator.identity(3);
      const product = tensorProduct(id2, id3);
      expect(product.getDimension()).toBe(6);
    });

    it('should preserve identity: I ⊗ I = I', () => {
      const id2 = Operator.identity(2);
      const product = tensorProduct(id2, id2);
      expect(product.equals(Operator.identity(4))).toBe(true);
    });
  });

  describe('Hermitian Class', () => {
    it('should create Hermitian operator', () => {
      const data: Complex[][] = [
        [new Complex(1, 0), new Complex(0, -1)],
        [new Complex(0, 1), new Complex(2, 0)]
      ];
      const H = new Hermitian(new Matrix(data), 'TestHermitian');
      expect(H.getDimension()).toBe(2);
    });

    it('should reject non-Hermitian matrix', () => {
      const data: Complex[][] = [
        [Complex.one(), Complex.one()],
        [Complex.zero(), Complex.one()]
      ];
      expect(() => new Hermitian(new Matrix(data))).toThrow();
    });

    it('should compute real eigenvalues', () => {
      const data: Complex[][] = [
        [new Complex(1, 0), Complex.zero()],
        [Complex.zero(), new Complex(2, 0)]
      ];
      const H = new Hermitian(new Matrix(data));
      const eigenvalues = H.getRealEigenvalues();
      expect(eigenvalues).toContain(1);
      expect(eigenvalues).toContain(2);
    });

    it('should create Hermitian from matrix', () => {
      const data: Complex[][] = [
        [Complex.one(), new Complex(1, 1)],
        [new Complex(0, 1), new Complex(2, 0)]
      ];
      const H = Hermitian.fromMatrix(new Matrix(data));
      expect(H.isHermitian()).toBe(true);
    });
  });

  describe('Unitary Class', () => {
    it('should create unitary operator', () => {
      const id = Operator.identity(2);
      const U = new Unitary(id.getMatrix(), 'TestUnitary');
      expect(U.getDimension()).toBe(2);
    });

    it('should reject non-unitary matrix', () => {
      const data: Complex[][] = [
        [new Complex(2, 0), Complex.zero()],
        [Complex.zero(), Complex.one()]
      ];
      expect(() => new Unitary(new Matrix(data))).toThrow();
    });

    it('should compute inverse', () => {
      const U = new Unitary(PauliX.getMatrix());
      const Uinv = U.inverse();
      const product = U.multiply(Uinv);
      expect(product.equals(Operator.identity(2))).toBe(true);
    });

    it('should create rotation operator', () => {
      const R = Unitary.rotation2D(Math.PI / 4);
      expect(R.isUnitary()).toBe(true);
    });

    it('should create phase shift operator', () => {
      const P = Unitary.phaseShift(Math.PI);
      expect(P.isUnitary()).toBe(true);
    });
  });

  describe('Observable Class', () => {
    it('should create observable with units', () => {
      const data: Complex[][] = [
        [Complex.one(), Complex.zero()],
        [Complex.zero(), new Complex(-1, 0)]
      ];
      const obs = new Observable(new Matrix(data), 'Energy', 'J');
      expect(obs.getUnits()).toBe('J');
    });

    it('should measure observable', () => {
      const data: Complex[][] = [
        [Complex.one(), Complex.zero()],
        [Complex.zero(), new Complex(-1, 0)]
      ];
      const obs = new Observable(new Matrix(data), 'Spin');
      const state = new Vector([Complex.one(), Complex.zero()]);
      const result = obs.measure(state);
      expect(result.expectation).toBeCloseTo(1);
      expect(result.uncertainty).toBeCloseTo(0);
    });
  });

  describe('Exponential', () => {
    it('should compute exp(0) = I', () => {
      const zero = Operator.zero(2);
      const exp = zero.exponential();
      expect(exp.equals(Operator.identity(2), 1e-6)).toBe(true);
    });

    it('should compute exp(iπσz/2) rotation', () => {
      const theta = Math.PI / 4;
      const exponent = PauliZ.scale(new Complex(0, theta));
      const rotation = exponent.exponential(30);
      expect(rotation.isUnitary(0.01)).toBe(true);
    });
  });

  describe('Equality', () => {
    it('should detect equal operators', () => {
      const id1 = Operator.identity(2);
      const id2 = Operator.identity(2);
      expect(id1.equals(id2)).toBe(true);
    });

    it('should detect unequal operators', () => {
      expect(PauliX.equals(PauliZ)).toBe(false);
    });

    it('should reject different dimensions', () => {
      const id2 = Operator.identity(2);
      const id3 = Operator.identity(3);
      expect(id2.equals(id3)).toBe(false);
    });
  });
});
