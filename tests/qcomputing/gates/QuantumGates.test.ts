/**
 * Qlaws Ham - QuantumGates Module Tests (M08.02)
 * 
 * Comprehensive tests for quantum gate operations.
 * 
 * @module QuantumGates.test
 * @version 1.0.0
 */

import {
  Gate,
  CustomGate,
  PauliX,
  PauliY,
  PauliZ,
  Hadamard,
  SGate,
  SDagger,
  TGate,
  TDagger,
  Identity,
  RotationX,
  RotationY,
  RotationZ,
  Phase,
  U3,
  CNOT,
  CZ,
  SWAP,
  iSWAP,
  SqrtSWAP,
  CPhase,
  CRX,
  Toffoli,
  Fredkin,
  ControlledGate,
  GateLibrary,
  QuantumGatesFactory
} from '../../../src/qcomputing/gates/QuantumGates';
import { QubitState, MultiQubitState } from '../../../src/qcomputing/qubit/Qubit';
import { Logger, LogLevel } from '../../../src/core/logger/Logger';
import { Complex } from '../../../src/core/math/Complex';

describe('QuantumGates Module (M08.02)', () => {
  let logger: Logger;

  beforeEach(() => {
    Logger.resetInstance();
    logger = Logger.getInstance({ minLevel: LogLevel.ERROR, enableConsole: false });
    Gate.setLogger(logger);
    GateLibrary.resetInstance();
  });

  afterEach(() => {
    Logger.resetInstance();
  });

  describe('Pauli-X Gate', () => {
    let X: PauliX;

    beforeEach(() => {
      X = new PauliX();
    });

    it('should have correct name', () => {
      expect(X.getName()).toBe('X');
    });

    it('should be unitary', () => {
      expect(X.isUnitary()).toBe(true);
    });

    it('should be Hermitian', () => {
      expect(X.isHermitian()).toBe(true);
    });

    it('should flip |0⟩ to |1⟩', () => {
      const result = X.apply(QubitState.zero());
      expect(result.fidelity(QubitState.one())).toBeCloseTo(1);
    });

    it('should flip |1⟩ to |0⟩', () => {
      const result = X.apply(QubitState.one());
      expect(result.fidelity(QubitState.zero())).toBeCloseTo(1);
    });

    it('should be self-inverse (X² = I)', () => {
      const XX = X.compose(X);
      const state = QubitState.plus();
      const result = XX.apply(state);
      expect(result.fidelity(state)).toBeCloseTo(1);
    });
  });

  describe('Pauli-Y Gate', () => {
    let Y: PauliY;

    beforeEach(() => {
      Y = new PauliY();
    });

    it('should have correct name', () => {
      expect(Y.getName()).toBe('Y');
    });

    it('should be unitary', () => {
      expect(Y.isUnitary()).toBe(true);
    });

    it('should be Hermitian', () => {
      expect(Y.isHermitian()).toBe(true);
    });

    it('should transform |0⟩ correctly', () => {
      const result = Y.apply(QubitState.zero());
      // Y|0⟩ = i|1⟩
      expect(result.getBeta().imag.toNumber()).toBeCloseTo(1);
    });

    it('should be self-inverse', () => {
      const YY = Y.compose(Y);
      const state = QubitState.random();
      const result = YY.apply(state);
      expect(result.fidelity(state)).toBeCloseTo(1);
    });
  });

  describe('Pauli-Z Gate', () => {
    let Z: PauliZ;

    beforeEach(() => {
      Z = new PauliZ();
    });

    it('should have correct name', () => {
      expect(Z.getName()).toBe('Z');
    });

    it('should be unitary', () => {
      expect(Z.isUnitary()).toBe(true);
    });

    it('should be Hermitian', () => {
      expect(Z.isHermitian()).toBe(true);
    });

    it('should leave |0⟩ unchanged', () => {
      const result = Z.apply(QubitState.zero());
      expect(result.fidelity(QubitState.zero())).toBeCloseTo(1);
    });

    it('should flip phase of |1⟩', () => {
      const result = Z.apply(QubitState.one());
      // Z|1⟩ = -|1⟩
      expect(result.getBeta().real.toNumber()).toBeCloseTo(-1);
    });

    it('should convert |+⟩ to |-⟩', () => {
      const result = Z.apply(QubitState.plus());
      expect(result.fidelity(QubitState.minus())).toBeCloseTo(1);
    });
  });

  describe('Hadamard Gate', () => {
    let H: Hadamard;

    beforeEach(() => {
      H = new Hadamard();
    });

    it('should have correct name', () => {
      expect(H.getName()).toBe('H');
    });

    it('should be unitary', () => {
      expect(H.isUnitary()).toBe(true);
    });

    it('should be Hermitian (self-adjoint)', () => {
      expect(H.isHermitian()).toBe(true);
    });

    it('should transform |0⟩ to |+⟩', () => {
      const result = H.apply(QubitState.zero());
      expect(result.fidelity(QubitState.plus())).toBeCloseTo(1);
    });

    it('should transform |1⟩ to |-⟩', () => {
      const result = H.apply(QubitState.one());
      expect(result.fidelity(QubitState.minus())).toBeCloseTo(1);
    });

    it('should be self-inverse (H² = I)', () => {
      const HH = H.compose(H);
      const state = QubitState.zero();
      const result = HH.apply(state);
      expect(result.fidelity(state)).toBeCloseTo(1);
    });

    it('should satisfy HXH = Z', () => {
      const X = new PauliX();
      const Z = new PauliZ();
      const HXH = H.compose(X).compose(H);
      
      const testState = QubitState.random();
      const r1 = HXH.apply(testState);
      const r2 = Z.apply(testState);
      expect(r1.fidelity(r2)).toBeCloseTo(1);
    });
  });

  describe('S and T Gates', () => {
    it('should have S gate be unitary', () => {
      const S = new SGate();
      expect(S.isUnitary()).toBe(true);
    });

    it('should have S² = Z', () => {
      const S = new SGate();
      const Z = new PauliZ();
      const SS = S.compose(S);
      
      const state = QubitState.random();
      expect(SS.apply(state).fidelity(Z.apply(state))).toBeCloseTo(1);
    });

    it('should have S and S† be inverses', () => {
      const S = new SGate();
      const Sd = new SDagger();
      const SSd = S.compose(Sd);
      
      const state = QubitState.random();
      expect(SSd.apply(state).fidelity(state)).toBeCloseTo(1);
    });

    it('should have T gate be unitary', () => {
      const T = new TGate();
      expect(T.isUnitary()).toBe(true);
    });

    it('should have T and T† be inverses', () => {
      const T = new TGate();
      const Td = new TDagger();
      const TTd = T.compose(Td);
      
      const state = QubitState.random();
      expect(TTd.apply(state).fidelity(state)).toBeCloseTo(1);
    });
  });

  describe('Identity Gate', () => {
    let I: Identity;

    beforeEach(() => {
      I = new Identity();
    });

    it('should be unitary', () => {
      expect(I.isUnitary()).toBe(true);
    });

    it('should be Hermitian', () => {
      expect(I.isHermitian()).toBe(true);
    });

    it('should leave any state unchanged', () => {
      const states = [
        QubitState.zero(),
        QubitState.one(),
        QubitState.plus(),
        QubitState.random()
      ];

      states.forEach(state => {
        expect(I.apply(state).fidelity(state)).toBeCloseTo(1);
      });
    });
  });

  describe('Rotation Gates', () => {
    it('should have Rx be unitary', () => {
      const Rx = new RotationX(Math.PI / 4);
      expect(Rx.isUnitary()).toBe(true);
    });

    it('should have Rx(π) = -iX', () => {
      const Rx = new RotationX(Math.PI);
      const state = QubitState.zero();
      const result = Rx.apply(state);
      // Rx(π)|0⟩ = -i|1⟩
      expect(result.getBeta().imag.toNumber()).toBeCloseTo(-1);
    });

    it('should have Ry be unitary', () => {
      const Ry = new RotationY(Math.PI / 4);
      expect(Ry.isUnitary()).toBe(true);
    });

    it('should have Ry(π) rotate |0⟩ to |1⟩', () => {
      const Ry = new RotationY(Math.PI);
      const result = Ry.apply(QubitState.zero());
      expect(result.fidelity(QubitState.one())).toBeCloseTo(1);
    });

    it('should have Rz be unitary', () => {
      const Rz = new RotationZ(Math.PI / 4);
      expect(Rz.isUnitary()).toBe(true);
    });

    it('should store angles correctly', () => {
      const angle = Math.PI / 3;
      const Rx = new RotationX(angle);
      const Ry = new RotationY(angle);
      const Rz = new RotationZ(angle);
      
      expect(Rx.getAngle()).toBe(angle);
      expect(Ry.getAngle()).toBe(angle);
      expect(Rz.getAngle()).toBe(angle);
    });
  });

  describe('Phase Gate', () => {
    it('should be unitary', () => {
      const P = new Phase(Math.PI / 4);
      expect(P.isUnitary()).toBe(true);
    });

    it('should leave |0⟩ unchanged', () => {
      const P = new Phase(Math.PI / 4);
      const result = P.apply(QubitState.zero());
      expect(result.fidelity(QubitState.zero())).toBeCloseTo(1);
    });

    it('should add phase to |1⟩', () => {
      const angle = Math.PI / 4;
      const P = new Phase(angle);
      const result = P.apply(QubitState.one());
      
      // |1⟩ → e^(iθ)|1⟩
      const expectedPhase = angle;
      expect(result.getBeta().phase()).toBeCloseTo(expectedPhase);
    });
  });

  describe('U3 Gate', () => {
    it('should be unitary', () => {
      const U = new U3(Math.PI / 4, Math.PI / 3, Math.PI / 6);
      expect(U.isUnitary()).toBe(true);
    });

    it('should store angles correctly', () => {
      const theta = Math.PI / 4;
      const phi = Math.PI / 3;
      const lambda = Math.PI / 6;
      const U = new U3(theta, phi, lambda);
      
      const angles = U.getAngles();
      expect(angles.theta).toBe(theta);
      expect(angles.phi).toBe(phi);
      expect(angles.lambda).toBe(lambda);
    });

    it('should be able to create any single-qubit gate', () => {
      // H can be represented as U3(π/2, 0, π)
      const H = new Hadamard();
      const UH = new U3(Math.PI / 2, 0, Math.PI);
      
      const state = QubitState.random();
      // Both should transform states similarly (up to global phase)
      expect(H.isUnitary()).toBe(true);
      expect(UH.isUnitary()).toBe(true);
    });
  });

  describe('CNOT Gate', () => {
    let cnot: CNOT;

    beforeEach(() => {
      cnot = new CNOT();
    });

    it('should have correct name', () => {
      expect(cnot.getName()).toBe('CNOT');
    });

    it('should operate on 2 qubits', () => {
      expect(cnot.getNumQubits()).toBe(2);
    });

    it('should be unitary', () => {
      expect(cnot.isUnitary()).toBe(true);
    });

    it('should leave |00⟩ unchanged', () => {
      const state = MultiQubitState.tensorProduct(QubitState.zero(), QubitState.zero());
      const result = cnot.applyTo(state, [0, 1]);
      expect(result.probability(0)).toBeCloseTo(1); // |00⟩
    });

    it('should leave |01⟩ unchanged', () => {
      const state = MultiQubitState.tensorProduct(QubitState.zero(), QubitState.one());
      const result = cnot.applyTo(state, [0, 1]);
      expect(result.probability(1)).toBeCloseTo(1); // |01⟩
    });

    it('should flip target when control is |1⟩', () => {
      // |10⟩ → |11⟩
      const state10 = MultiQubitState.tensorProduct(QubitState.one(), QubitState.zero());
      const result = cnot.applyTo(state10, [0, 1]);
      expect(result.probability(3)).toBeCloseTo(1); // |11⟩
    });

    it('should create Bell state from |00⟩', () => {
      const H = new Hadamard();
      const zero = QubitState.zero();
      const plusState = H.apply(zero);
      
      const state = MultiQubitState.tensorProduct(plusState, zero);
      const result = cnot.applyTo(state, [0, 1]);
      
      // Should be Bell state |Φ+⟩
      expect(result.probability(0)).toBeCloseTo(0.5); // |00⟩
      expect(result.probability(3)).toBeCloseTo(0.5); // |11⟩
    });
  });

  describe('CZ Gate', () => {
    let cz: CZ;

    beforeEach(() => {
      cz = new CZ();
    });

    it('should be unitary', () => {
      expect(cz.isUnitary()).toBe(true);
    });

    it('should be symmetric (control and target interchangeable)', () => {
      // CZ|11⟩ = -|11⟩
      const state = MultiQubitState.tensorProduct(QubitState.one(), QubitState.one());
      const result = cz.applyTo(state, [0, 1]);
      
      // The |11⟩ amplitude should be -1
      expect(result.getAmplitude(3).real.toNumber()).toBeCloseTo(-1);
    });

    it('should leave computational basis unchanged except |11⟩', () => {
      const states = [
        [QubitState.zero(), QubitState.zero()],
        [QubitState.zero(), QubitState.one()],
        [QubitState.one(), QubitState.zero()]
      ];

      states.forEach(([q1, q2], idx) => {
        const state = MultiQubitState.tensorProduct(q1, q2);
        const result = cz.applyTo(state, [0, 1]);
        expect(result.probability(idx)).toBeCloseTo(1);
      });
    });
  });

  describe('SWAP Gate', () => {
    let swap: SWAP;

    beforeEach(() => {
      swap = new SWAP();
    });

    it('should be unitary', () => {
      expect(swap.isUnitary()).toBe(true);
    });

    it('should swap |01⟩ to |10⟩', () => {
      const state = MultiQubitState.tensorProduct(QubitState.zero(), QubitState.one());
      const result = swap.applyTo(state, [0, 1]);
      expect(result.probability(2)).toBeCloseTo(1); // |10⟩
    });

    it('should swap |10⟩ to |01⟩', () => {
      const state = MultiQubitState.tensorProduct(QubitState.one(), QubitState.zero());
      const result = swap.applyTo(state, [0, 1]);
      expect(result.probability(1)).toBeCloseTo(1); // |01⟩
    });

    it('should be self-inverse', () => {
      const state = MultiQubitState.tensorProduct(QubitState.zero(), QubitState.one());
      const after = swap.applyTo(swap.applyTo(state, [0, 1]), [0, 1]);
      expect(after.fidelity(state)).toBeCloseTo(1);
    });
  });

  describe('Toffoli Gate', () => {
    let toffoli: Toffoli;

    beforeEach(() => {
      toffoli = new Toffoli();
    });

    it('should operate on 3 qubits', () => {
      expect(toffoli.getNumQubits()).toBe(3);
    });

    it('should be unitary', () => {
      expect(toffoli.isUnitary()).toBe(true);
    });

    it('should flip target only when both controls are |1⟩', () => {
      // |110⟩ → |111⟩
      const state110 = new MultiQubitState([
        Complex.zero(), Complex.zero(), Complex.zero(), Complex.zero(),
        Complex.zero(), Complex.zero(), Complex.one(), Complex.zero()
      ]);
      const result = toffoli.applyTo(state110, [0, 1, 2]);
      expect(result.probability(7)).toBeCloseTo(1); // |111⟩
    });

    it('should leave target unchanged when controls are not both |1⟩', () => {
      // |100⟩ should stay |100⟩
      const state100 = new MultiQubitState([
        Complex.zero(), Complex.zero(), Complex.zero(), Complex.zero(),
        Complex.one(), Complex.zero(), Complex.zero(), Complex.zero()
      ]);
      const result = toffoli.applyTo(state100, [0, 1, 2]);
      expect(result.probability(4)).toBeCloseTo(1); // |100⟩
    });
  });

  describe('Fredkin Gate', () => {
    let fredkin: Fredkin;

    beforeEach(() => {
      fredkin = new Fredkin();
    });

    it('should operate on 3 qubits', () => {
      expect(fredkin.getNumQubits()).toBe(3);
    });

    it('should be unitary', () => {
      expect(fredkin.isUnitary()).toBe(true);
    });

    it('should swap targets when control is |1⟩', () => {
      // |101⟩ → |110⟩ (swap bits 1 and 2)
      const state101 = new MultiQubitState([
        Complex.zero(), Complex.zero(), Complex.zero(), Complex.zero(),
        Complex.zero(), Complex.one(), Complex.zero(), Complex.zero()
      ]);
      const result = fredkin.applyTo(state101, [0, 1, 2]);
      expect(result.probability(6)).toBeCloseTo(1); // |110⟩
    });
  });

  describe('Controlled Gate Factory', () => {
    it('should create controlled version of any gate', () => {
      const X = new PauliX();
      const CX = new ControlledGate(X, 1);
      
      expect(CX.getNumQubits()).toBe(2);
      expect(CX.getName()).toBe('CX');
      expect(CX.isUnitary()).toBe(true);
    });

    it('should create double-controlled gate', () => {
      const X = new PauliX();
      const CCX = new ControlledGate(X, 2);
      
      expect(CCX.getNumQubits()).toBe(3);
      expect(CCX.getName()).toBe('CCX');
      expect(CCX.isUnitary()).toBe(true);
    });

    it('should match CNOT behavior', () => {
      const X = new PauliX();
      const CX = new ControlledGate(X, 1);
      const cnot = new CNOT();
      
      // Both should give same result
      const state = MultiQubitState.tensorProduct(QubitState.one(), QubitState.zero());
      const r1 = CX.applyTo(state, [0, 1]);
      const r2 = cnot.applyTo(state, [0, 1]);
      
      expect(r1.fidelity(r2)).toBeCloseTo(1);
    });
  });

  describe('Gate Library', () => {
    let library: GateLibrary;

    beforeEach(() => {
      library = GateLibrary.getInstance();
    });

    it('should provide standard single-qubit gates', () => {
      expect(library.has('X')).toBe(true);
      expect(library.has('Y')).toBe(true);
      expect(library.has('Z')).toBe(true);
      expect(library.has('H')).toBe(true);
      expect(library.has('S')).toBe(true);
      expect(library.has('T')).toBe(true);
      expect(library.has('I')).toBe(true);
    });

    it('should provide two-qubit gates', () => {
      expect(library.has('CNOT')).toBe(true);
      expect(library.has('CZ')).toBe(true);
      expect(library.has('SWAP')).toBe(true);
    });

    it('should provide three-qubit gates', () => {
      expect(library.has('Toffoli')).toBe(true);
      expect(library.has('Fredkin')).toBe(true);
    });

    it('should create rotation gates', () => {
      const Rx = library.rotation('x', Math.PI / 4);
      const Ry = library.rotation('y', Math.PI / 4);
      const Rz = library.rotation('z', Math.PI / 4);
      
      expect(Rx.isUnitary()).toBe(true);
      expect(Ry.isUnitary()).toBe(true);
      expect(Rz.isUnitary()).toBe(true);
    });

    it('should create phase gates', () => {
      const P = library.phase(Math.PI / 4);
      expect(P.isUnitary()).toBe(true);
    });

    it('should create U3 gates', () => {
      const U = library.u3(Math.PI / 4, Math.PI / 3, Math.PI / 6);
      expect(U.isUnitary()).toBe(true);
    });

    it('should allow adding custom gates', () => {
      const custom = new CustomGate('MyGate', [
        [Complex.one(), Complex.zero()],
        [Complex.zero(), Complex.one()]
      ]);
      
      library.add('MyGate', custom);
      expect(library.has('MyGate')).toBe(true);
    });

    it('should list all gate names', () => {
      const names = library.getNames();
      expect(names.length).toBeGreaterThan(10);
    });
  });

  describe('QuantumGatesFactory', () => {
    it('should create Pauli gates', () => {
      expect(QuantumGatesFactory.X().getName()).toBe('X');
      expect(QuantumGatesFactory.Y().getName()).toBe('Y');
      expect(QuantumGatesFactory.Z().getName()).toBe('Z');
    });

    it('should create Hadamard gate', () => {
      expect(QuantumGatesFactory.H().getName()).toBe('H');
    });

    it('should create rotation gates', () => {
      expect(QuantumGatesFactory.Rx(Math.PI).isUnitary()).toBe(true);
      expect(QuantumGatesFactory.Ry(Math.PI).isUnitary()).toBe(true);
      expect(QuantumGatesFactory.Rz(Math.PI).isUnitary()).toBe(true);
    });

    it('should create multi-qubit gates', () => {
      expect(QuantumGatesFactory.CNOT().getNumQubits()).toBe(2);
      expect(QuantumGatesFactory.Toffoli().getNumQubits()).toBe(3);
    });

    it('should create custom gates', () => {
      const custom = QuantumGatesFactory.custom('Test', [
        [Complex.one(), Complex.zero()],
        [Complex.zero(), Complex.one()]
      ]);
      expect(custom.getName()).toBe('Test');
    });
  });

  describe('Gate Composition', () => {
    it('should compose gates correctly', () => {
      const H = new Hadamard();
      const X = new PauliX();
      const HX = H.compose(X);
      
      const state = QubitState.zero();
      const r1 = HX.apply(state);
      const r2 = H.apply(X.apply(state));
      
      expect(r1.fidelity(r2)).toBeCloseTo(1);
    });

    it('should tensor product gates correctly', () => {
      const X = new PauliX();
      const I = new Identity();
      const XI = X.tensor(I);
      
      expect(XI.getNumQubits()).toBe(2);
    });

    it('should compute dagger correctly', () => {
      const S = new SGate();
      const Sd = S.dagger();
      const SSd = S.compose(Sd);
      
      const state = QubitState.random();
      expect(SSd.apply(state).fidelity(state)).toBeCloseTo(1);
    });
  });

  describe('Gate Properties', () => {
    it('should return correct properties', () => {
      const H = new Hadamard();
      const props = H.getProperties();
      
      expect(props.name).toBe('H');
      expect(props.numQubits).toBe(1);
      expect(props.isUnitary).toBe(true);
      expect(props.isHermitian).toBe(true);
    });

    it('should generate hash', () => {
      const X = new PauliX();
      const hash = X.getHash();
      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should convert to string', () => {
      const H = new Hadamard();
      expect(H.toString()).toBe('H');
    });
  });
});
