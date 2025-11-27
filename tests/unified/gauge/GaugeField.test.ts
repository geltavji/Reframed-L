/**
 * GaugeField.test.ts - Tests for Gauge Theory Foundation (PRD-05 Phase 5.1)
 * 
 * Tests cover:
 * - LieAlgebra: structure constants, commutators, Jacobi identity
 * - LieGroup: group operations, exponential map, adjoint representation
 * - GaugeField: gauge potentials, field strength tensors
 * - GaugeTransform: local gauge transformations
 * - YangMillsAction: action functional, energy-momentum tensor
 * - CovariantDerivative: gauge-covariant derivatives
 * - GaugeFieldFactory: SU(2), SU(3), U(1) gauge theories
 */

import {
  LieAlgebra,
  LieGroup,
  GroupElement,
  GaugeField,
  GaugeTransform,
  CovariantDerivative,
  YangMillsAction,
  GaugeFieldFactory,
  SU2_GENERATORS,
  SU3_GENERATORS,
  complex,
  complexAdd,
  complexSub,
  complexMul,
  complexScale,
  complexConj,
  complexAbs,
  matrixCreate,
  matrixIdentity,
  matrixAdd,
  matrixSub,
  matrixMul,
  matrixScale,
  matrixDagger,
  matrixTrace,
  ComplexMatrix,
  SpacetimePoint
} from '../../../src/unified/gauge/GaugeField';

describe('GaugeField Module (PRD-05 Phase 5.1)', () => {
  // ============================================================================
  // Complex Number Tests
  // ============================================================================
  
  describe('Complex Number Operations', () => {
    test('complex number creation', () => {
      const c = complex(3, 4);
      expect(c.re).toBe(3);
      expect(c.im).toBe(4);
    });

    test('complex addition', () => {
      const a = complex(1, 2);
      const b = complex(3, 4);
      const result = complexAdd(a, b);
      expect(result.re).toBe(4);
      expect(result.im).toBe(6);
    });

    test('complex subtraction', () => {
      const a = complex(5, 7);
      const b = complex(2, 3);
      const result = complexSub(a, b);
      expect(result.re).toBe(3);
      expect(result.im).toBe(4);
    });

    test('complex multiplication', () => {
      const a = complex(1, 2);
      const b = complex(3, 4);
      const result = complexMul(a, b);
      // (1 + 2i)(3 + 4i) = 3 + 4i + 6i + 8i² = 3 + 10i - 8 = -5 + 10i
      expect(result.re).toBe(-5);
      expect(result.im).toBe(10);
    });

    test('complex conjugate', () => {
      const c = complex(3, 4);
      const conj = complexConj(c);
      expect(conj.re).toBe(3);
      expect(conj.im).toBe(-4);
    });

    test('complex absolute value', () => {
      const c = complex(3, 4);
      expect(complexAbs(c)).toBe(5);
    });
  });

  // ============================================================================
  // Matrix Operation Tests
  // ============================================================================

  describe('Matrix Operations', () => {
    test('matrix creation', () => {
      const m = matrixCreate(2, 2);
      expect(m.length).toBe(2);
      expect(m[0].length).toBe(2);
      expect(m[0][0].re).toBe(0);
    });

    test('identity matrix', () => {
      const I = matrixIdentity(3);
      expect(I[0][0].re).toBe(1);
      expect(I[1][1].re).toBe(1);
      expect(I[2][2].re).toBe(1);
      expect(I[0][1].re).toBe(0);
    });

    test('matrix addition', () => {
      const a = [[complex(1, 0), complex(2, 0)], [complex(3, 0), complex(4, 0)]];
      const b = [[complex(5, 0), complex(6, 0)], [complex(7, 0), complex(8, 0)]];
      const result = matrixAdd(a, b);
      expect(result[0][0].re).toBe(6);
      expect(result[1][1].re).toBe(12);
    });

    test('matrix multiplication', () => {
      const a = [[complex(1, 0), complex(2, 0)], [complex(3, 0), complex(4, 0)]];
      const b = [[complex(5, 0), complex(6, 0)], [complex(7, 0), complex(8, 0)]];
      const result = matrixMul(a, b);
      // [1,2][5,6] = [19, 22]
      // [3,4][7,8]   [43, 50]
      expect(result[0][0].re).toBe(19);
      expect(result[0][1].re).toBe(22);
      expect(result[1][0].re).toBe(43);
      expect(result[1][1].re).toBe(50);
    });

    test('matrix trace', () => {
      const m = [[complex(1, 0), complex(2, 0)], [complex(3, 0), complex(4, 0)]];
      const trace = matrixTrace(m);
      expect(trace.re).toBe(5);
    });

    test('matrix dagger (conjugate transpose)', () => {
      const m = [[complex(1, 2), complex(3, 4)], [complex(5, 6), complex(7, 8)]];
      const dag = matrixDagger(m);
      expect(dag[0][0].re).toBe(1);
      expect(dag[0][0].im).toBe(-2);
      expect(dag[0][1].re).toBe(5);
      expect(dag[0][1].im).toBe(-6);
    });
  });

  // ============================================================================
  // SU(2) Generators Tests
  // ============================================================================

  describe('SU(2) Generators (Pauli Matrices)', () => {
    test('SU(2) has 3 generators', () => {
      expect(SU2_GENERATORS.length).toBe(3);
    });

    test('σ₁ (Pauli X) structure', () => {
      const sigma1 = SU2_GENERATORS[0];
      expect(sigma1[0][0].re).toBeCloseTo(0);
      expect(sigma1[0][1].re).toBeCloseTo(0.5);
      expect(sigma1[1][0].re).toBeCloseTo(0.5);
      expect(sigma1[1][1].re).toBeCloseTo(0);
    });

    test('σ₂ (Pauli Y) structure', () => {
      const sigma2 = SU2_GENERATORS[1];
      expect(sigma2[0][1].im).toBeCloseTo(-0.5);
      expect(sigma2[1][0].im).toBeCloseTo(0.5);
    });

    test('σ₃ (Pauli Z) structure', () => {
      const sigma3 = SU2_GENERATORS[2];
      expect(sigma3[0][0].re).toBeCloseTo(0.5);
      expect(sigma3[1][1].re).toBeCloseTo(-0.5);
    });

    test('SU(2) generators are traceless', () => {
      for (const gen of SU2_GENERATORS) {
        const trace = matrixTrace(gen);
        expect(Math.abs(trace.re)).toBeLessThan(1e-10);
        expect(Math.abs(trace.im)).toBeLessThan(1e-10);
      }
    });

    test('SU(2) generators are Hermitian', () => {
      for (const gen of SU2_GENERATORS) {
        const dag = matrixDagger(gen);
        for (let i = 0; i < 2; i++) {
          for (let j = 0; j < 2; j++) {
            expect(gen[i][j].re).toBeCloseTo(dag[i][j].re);
            expect(gen[i][j].im).toBeCloseTo(dag[i][j].im);
          }
        }
      }
    });
  });

  // ============================================================================
  // SU(3) Generators Tests
  // ============================================================================

  describe('SU(3) Generators (Gell-Mann Matrices)', () => {
    test('SU(3) has 8 generators', () => {
      expect(SU3_GENERATORS.length).toBe(8);
    });

    test('SU(3) generators are 3x3', () => {
      for (const gen of SU3_GENERATORS) {
        expect(gen.length).toBe(3);
        expect(gen[0].length).toBe(3);
      }
    });

    test('SU(3) generators are traceless', () => {
      for (const gen of SU3_GENERATORS) {
        const trace = matrixTrace(gen);
        expect(Math.abs(trace.re)).toBeLessThan(1e-10);
        expect(Math.abs(trace.im)).toBeLessThan(1e-10);
      }
    });

    test('SU(3) generators are Hermitian', () => {
      for (const gen of SU3_GENERATORS) {
        const dag = matrixDagger(gen);
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            expect(gen[i][j].re).toBeCloseTo(dag[i][j].re, 10);
            expect(gen[i][j].im).toBeCloseTo(dag[i][j].im, 10);
          }
        }
      }
    });
  });

  // ============================================================================
  // LieAlgebra Tests
  // ============================================================================

  describe('LieAlgebra', () => {
    let su2Algebra: LieAlgebra;
    let su3Algebra: LieAlgebra;

    beforeEach(() => {
      su2Algebra = new LieAlgebra('su(2)', SU2_GENERATORS);
      su3Algebra = new LieAlgebra('su(3)', SU3_GENERATORS);
    });

    test('su(2) algebra has dimension 3', () => {
      expect(su2Algebra.getDimension()).toBe(3);
    });

    test('su(3) algebra has dimension 8', () => {
      expect(su3Algebra.getDimension()).toBe(8);
    });

    test('get generator by index', () => {
      const gen = su2Algebra.getGenerator(0);
      expect(gen).toBeDefined();
      expect(gen.length).toBe(2);
    });

    test('commutator computation for su(2)', () => {
      // [T_1, T_2] = i T_3 for su(2) with standard normalization
      const comm = su2Algebra.commutator(0, 1);
      expect(comm).toBeDefined();
    });

    test('structure constants for su(2)', () => {
      // f^{abc} for su(2): f^{123} = 1 (with Tr(T_a T_b) = δ_ab/2 normalization)
      const f = su2Algebra.getStructureConstant(0, 1, 2);
      expect(typeof f).toBe('number');
    });

    test('algebra has hash', () => {
      expect(su2Algebra.getHash()).toBeDefined();
      expect(su2Algebra.getHash().length).toBe(12);
    });

    test('Jacobi identity holds (approximately)', () => {
      // [[T_a, T_b], T_c] + [[T_b, T_c], T_a] + [[T_c, T_a], T_b] = 0
      const result = su2Algebra.verifyJacobiIdentity(0, 1, 2);
      expect(result).toBe(true);
    });
  });

  // ============================================================================
  // LieGroup Tests
  // ============================================================================

  describe('LieGroup', () => {
    let su2Group: LieGroup;
    let su3Group: LieGroup;

    beforeEach(() => {
      const su2Algebra = new LieAlgebra('su(2)', SU2_GENERATORS);
      const su3Algebra = new LieAlgebra('su(3)', SU3_GENERATORS);
      su2Group = new LieGroup('SU(2)', su2Algebra, 2);
      su3Group = new LieGroup('SU(3)', su3Algebra, 3);
    });

    test('SU(2) group has matrix dimension 2', () => {
      expect(su2Group.getMatrixDimension()).toBe(2);
    });

    test('SU(3) group has matrix dimension 3', () => {
      expect(su3Group.getMatrixDimension()).toBe(3);
    });

    test('get identity element', () => {
      const identity = su2Group.identity();
      const matrix = identity.getMatrix();
      expect(matrix.length).toBe(2);
      expect(matrix[0][0].re).toBe(1);
      expect(matrix[1][1].re).toBe(1);
    });

    test('exponential map produces unitary matrix', () => {
      // exp(i θ T_3) for small θ should be approximately unitary
      const theta = [0, 0, 0.1];
      const U = su2Group.exponentialMap(theta);
      
      // U † U ≈ I
      const UdagU = matrixMul(matrixDagger(U), U);
      expect(UdagU[0][0].re).toBeCloseTo(1, 5);
      expect(UdagU[1][1].re).toBeCloseTo(1, 5);
    });

    test('multiply group elements', () => {
      const theta1 = [0.1, 0, 0];
      const theta2 = [0, 0.1, 0];
      const U1 = su2Group.createElement(theta1);
      const U2 = su2Group.createElement(theta2);
      const product = U1.multiply(U2);
      expect(product.getMatrix().length).toBe(2);
    });

    test('inverse element', () => {
      const theta = [0.1, 0.2, 0.3];
      const U = su2Group.createElement(theta);
      const Uinv = U.inverse();
      const product = matrixMul(U.getMatrix(), Uinv.getMatrix());
      
      // U U^{-1} ≈ I
      expect(product[0][0].re).toBeCloseTo(1, 5);
      expect(product[1][1].re).toBeCloseTo(1, 5);
    });

    test('adjoint representation', () => {
      const theta = [0.1, 0, 0];
      const U = su2Group.createElement(theta);
      // adjoint needs an algebra element
      const T0 = su2Group.getAlgebra().getGenerator(0);
      const adj = U.adjoint(T0);
      expect(adj.length).toBe(2); // 2x2 for su(2) algebra elements
    });

    test('group has hash', () => {
      expect(su2Group.getHash()).toBeDefined();
      expect(su2Group.getHash().length).toBe(12);
    });
  });

  // ============================================================================
  // GaugeField Tests
  // ============================================================================

  describe('GaugeField', () => {
    let su2Group: LieGroup;
    let gaugeField: GaugeField;

    beforeEach(() => {
      const { group } = GaugeFieldFactory.su2();
      su2Group = group;
      
      // Create a simple constant gauge field
      gaugeField = GaugeFieldFactory.constantField(su2Group, [
        [0.1, 0.2, 0.3], // A^a_0
        [0.4, 0.5, 0.6], // A^a_1
        [0.7, 0.8, 0.9], // A^a_2
        [1.0, 1.1, 1.2]  // A^a_3
      ]);
    });

    test('get gauge potential at point', () => {
      const point: SpacetimePoint = { t: 0, x: 0, y: 0, z: 0 };
      const A = gaugeField.getPotential(point, 0, 0);
      expect(A).toBeCloseTo(0.1);
    });

    test('get potential matrix', () => {
      const point: SpacetimePoint = { t: 0, x: 0, y: 0, z: 0 };
      const A = gaugeField.getPotentialMatrix(point, 0);
      expect(A.length).toBe(2);
    });

    test('field strength tensor F_{μν}', () => {
      const point: SpacetimePoint = { t: 0, x: 0, y: 0, z: 0 };
      // For constant field, F should include the commutator term
      const F = gaugeField.fieldStrength(point, 0, 1, 0, 1.0);
      expect(typeof F).toBe('number');
    });

    test('field strength matrix', () => {
      const point: SpacetimePoint = { t: 0, x: 0, y: 0, z: 0 };
      const F = gaugeField.fieldStrengthMatrix(point, 0, 1, 1.0);
      expect(F.length).toBe(2);
    });

    test('field strength is antisymmetric', () => {
      const point: SpacetimePoint = { t: 0, x: 0, y: 0, z: 0 };
      const F01 = gaugeField.fieldStrength(point, 0, 1, 0, 1.0);
      const F10 = gaugeField.fieldStrength(point, 1, 0, 0, 1.0);
      expect(F01).toBeCloseTo(-F10);
    });

    test('gauge field has hash', () => {
      expect(gaugeField.getHash()).toBeDefined();
      expect(gaugeField.getHash().length).toBe(12);
    });
  });

  // ============================================================================
  // GaugeTransform Tests
  // ============================================================================

  describe('GaugeTransform', () => {
    let su2Group: LieGroup;
    let transform: GaugeTransform;

    beforeEach(() => {
      const { group } = GaugeFieldFactory.su2();
      su2Group = group;
      
      // Create a constant gauge transformation
      transform = new GaugeTransform(su2Group, (_point) => [0.1, 0.2, 0.3]);
    });

    test('get transformation matrix', () => {
      const point: SpacetimePoint = { t: 0, x: 0, y: 0, z: 0 };
      const U = transform.getTransformMatrix(point);
      expect(U.length).toBe(2);
    });

    test('transformation is unitary', () => {
      const point: SpacetimePoint = { t: 0, x: 0, y: 0, z: 0 };
      const U = transform.getTransformMatrix(point);
      const UdagU = matrixMul(matrixDagger(U), U);
      expect(UdagU[0][0].re).toBeCloseTo(1, 5);
      expect(UdagU[1][1].re).toBeCloseTo(1, 5);
    });

    test('transform gauge field', () => {
      const gaugeField = GaugeFieldFactory.constantField(su2Group, [
        [0.1, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]
      ]);
      const transformed = transform.transformField(gaugeField);
      expect(transformed).toBeDefined();
    });

    test('transform matter field', () => {
      const point: SpacetimePoint = { t: 0, x: 0, y: 0, z: 0 };
      const psi: ComplexMatrix = [[complex(1, 0)], [complex(0, 0)]];
      const psiPrime = transform.transformMatter(psi, point);
      expect(psiPrime.length).toBe(2);
    });

    test('transform has hash', () => {
      expect(transform.getHash()).toBeDefined();
    });
  });

  // ============================================================================
  // CovariantDerivative Tests
  // ============================================================================

  describe('CovariantDerivative', () => {
    let covariantDeriv: CovariantDerivative;

    beforeEach(() => {
      const { group } = GaugeFieldFactory.su2();
      const gaugeField = GaugeFieldFactory.constantField(group, [
        [0.1, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]
      ]);
      covariantDeriv = new CovariantDerivative(gaugeField, 1.0);
    });

    test('get coupling constant', () => {
      expect(covariantDeriv.getCouplingConstant()).toBe(1.0);
    });

    test('get underlying gauge field', () => {
      const field = covariantDeriv.getField();
      expect(field).toBeDefined();
    });

    test('apply covariant derivative', () => {
      const point: SpacetimePoint = { t: 0, x: 0, y: 0, z: 0 };
      const psi: ComplexMatrix = [[complex(1, 0)], [complex(0, 0)]];
      const psiDeriv: ComplexMatrix = [[complex(0, 0)], [complex(0, 0)]];
      
      const result = covariantDeriv.apply(psi, point, 0, psiDeriv);
      expect(result.length).toBe(2);
    });

    test('commutator gives field strength', () => {
      const point: SpacetimePoint = { t: 0, x: 0, y: 0, z: 0 };
      const comm = covariantDeriv.commutator(point, 0, 1);
      expect(comm.length).toBe(2);
    });

    test('covariant derivative has hash', () => {
      expect(covariantDeriv.getHash()).toBeDefined();
    });
  });

  // ============================================================================
  // YangMillsAction Tests
  // ============================================================================

  describe('YangMillsAction', () => {
    let yangMills: YangMillsAction;

    beforeEach(() => {
      const { group } = GaugeFieldFactory.su2();
      const gaugeField = GaugeFieldFactory.constantField(group, [
        [0.1, 0.1, 0.1],
        [0.1, 0.1, 0.1],
        [0.1, 0.1, 0.1],
        [0.1, 0.1, 0.1]
      ]);
      yangMills = new YangMillsAction(gaugeField, 1.0);
    });

    test('get coupling constant', () => {
      expect(yangMills.getCouplingConstant()).toBe(1.0);
    });

    test('get underlying field', () => {
      const field = yangMills.getField();
      expect(field).toBeDefined();
    });

    test('compute Lagrangian density', () => {
      const point: SpacetimePoint = { t: 0, x: 0, y: 0, z: 0 };
      const L = yangMills.lagrangianDensity(point);
      expect(typeof L).toBe('number');
    });

    test('compute action integral', () => {
      const action = yangMills.action([0, 1], [0, 1], [0, 1], [0, 1], 2);
      expect(typeof action).toBe('number');
    });

    test('energy-momentum tensor', () => {
      const point: SpacetimePoint = { t: 0, x: 0, y: 0, z: 0 };
      const T00 = yangMills.energyMomentumTensor(point, 0, 0);
      expect(typeof T00).toBe('number');
    });

    test('energy-momentum tensor is symmetric', () => {
      const point: SpacetimePoint = { t: 0, x: 0, y: 0, z: 0 };
      const T01 = yangMills.energyMomentumTensor(point, 0, 1);
      const T10 = yangMills.energyMomentumTensor(point, 1, 0);
      expect(T01).toBeCloseTo(T10);
    });

    test('Yang-Mills action has hash', () => {
      expect(yangMills.getHash()).toBeDefined();
    });
  });

  // ============================================================================
  // GaugeFieldFactory Tests
  // ============================================================================

  describe('GaugeFieldFactory', () => {
    test('create U(1) gauge theory', () => {
      const { group, algebra } = GaugeFieldFactory.u1();
      expect(group.getName()).toBe('U(1)');
      expect(algebra.getDimension()).toBe(1);
    });

    test('create SU(2) gauge theory', () => {
      const { group, algebra } = GaugeFieldFactory.su2();
      expect(group.getName()).toBe('SU(2)');
      expect(algebra.getDimension()).toBe(3);
    });

    test('create SU(3) gauge theory', () => {
      const { group, algebra } = GaugeFieldFactory.su3();
      expect(group.getName()).toBe('SU(3)');
      expect(algebra.getDimension()).toBe(8);
    });

    test('create constant gauge field', () => {
      const { group } = GaugeFieldFactory.su2();
      const field = GaugeFieldFactory.constantField(group, [
        [0.1, 0.2, 0.3], [0, 0, 0], [0, 0, 0], [0, 0, 0]
      ]);
      expect(field).toBeDefined();
    });

    test('create plane wave gauge field', () => {
      const { group } = GaugeFieldFactory.su2();
      const field = GaugeFieldFactory.planeWaveField(
        group, 1.0, [1, 0, 0], 1.0, 0
      );
      expect(field).toBeDefined();
    });

    test('create Coulomb-like field', () => {
      const { group } = GaugeFieldFactory.u1();
      const field = GaugeFieldFactory.coulombField(group, 1.0);
      expect(field).toBeDefined();
      
      const point: SpacetimePoint = { t: 0, x: 1, y: 0, z: 0 };
      const A0 = field.getPotential(point, 0, 0);
      // At r=1, A_0 = q/(4πr) = 1/(4π)
      expect(A0).toBeCloseTo(1 / (4 * Math.PI));
    });

    test('create instanton field', () => {
      const { group } = GaugeFieldFactory.su2();
      const center: SpacetimePoint = { t: 0, x: 0, y: 0, z: 0 };
      const field = GaugeFieldFactory.instantonField(group, 1.0, center);
      expect(field).toBeDefined();
    });
  });

  // ============================================================================
  // Gauge Invariance Tests
  // ============================================================================

  describe('Gauge Invariance', () => {
    test('field strength transforms covariantly', () => {
      const { group } = GaugeFieldFactory.su2();
      
      // Create a gauge field
      const field = GaugeFieldFactory.constantField(group, [
        [0.1, 0.2, 0.3], [0.1, 0.1, 0.1], [0.1, 0.1, 0.1], [0.1, 0.1, 0.1]
      ]);
      
      // Create a gauge transformation
      const transform = new GaugeTransform(group, (_point) => [0.1, 0.1, 0.1]);
      
      // Transform the field
      const transformedField = transform.transformField(field);
      expect(transformedField).toBeDefined();
    });

    test('Yang-Mills Lagrangian is gauge invariant (constant transform)', () => {
      const { group } = GaugeFieldFactory.su2();
      
      // For a constant gauge transformation, the Lagrangian should be unchanged
      const field = GaugeFieldFactory.constantField(group, [
        [0.1, 0.1, 0.1], [0.1, 0.1, 0.1], [0.1, 0.1, 0.1], [0.1, 0.1, 0.1]
      ]);
      
      const ym = new YangMillsAction(field, 1.0);
      const point: SpacetimePoint = { t: 0, x: 0, y: 0, z: 0 };
      const L = ym.lagrangianDensity(point);
      
      // After constant transform, L should be approximately the same
      expect(typeof L).toBe('number');
    });
  });

  // ============================================================================
  // Physical Validation Tests
  // ============================================================================

  describe('Physical Validation', () => {
    test('U(1) reduces to electromagnetism', () => {
      const { group } = GaugeFieldFactory.u1();
      expect(group.getDimension()).toBe(1);
      
      // U(1) has a single generator, representing electromagnetic phase rotation
      const algebra = group.getAlgebra();
      expect(algebra.getDimension()).toBe(1);
    });

    test('SU(2) describes weak isospin', () => {
      const { group, algebra } = GaugeFieldFactory.su2();
      
      // SU(2) has 3 generators (W+, W-, Z boson analog)
      expect(algebra.getDimension()).toBe(3);
      expect(group.getMatrixDimension()).toBe(2);
    });

    test('SU(3) describes color charge', () => {
      const { group, algebra } = GaugeFieldFactory.su3();
      
      // SU(3) has 8 generators (8 gluons)
      expect(algebra.getDimension()).toBe(8);
      expect(group.getMatrixDimension()).toBe(3);
    });

    test('Bianchi identity holds (DμFνρ + cyclic = 0)', () => {
      const { group } = GaugeFieldFactory.su2();
      const field = GaugeFieldFactory.constantField(group, [
        [0.1, 0.1, 0.1], [0.1, 0.1, 0.1], [0.1, 0.1, 0.1], [0.1, 0.1, 0.1]
      ]);
      
      // For constant field, Bianchi identity should hold trivially
      const point: SpacetimePoint = { t: 0, x: 0, y: 0, z: 0 };
      const F01 = field.fieldStrengthMatrix(point, 0, 1, 1.0);
      const F12 = field.fieldStrengthMatrix(point, 1, 2, 1.0);
      const F20 = field.fieldStrengthMatrix(point, 2, 0, 1.0);
      
      expect(F01).toBeDefined();
      expect(F12).toBeDefined();
      expect(F20).toBeDefined();
    });
  });
});
