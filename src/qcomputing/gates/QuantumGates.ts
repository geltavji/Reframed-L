/**
 * Qlaws Ham - Quantum Gates Module (M08.02)
 * 
 * Implements quantum gate operations for circuit simulation.
 * Supports single-qubit, multi-qubit, and custom gates.
 * 
 * @module QuantumGates
 * @version 1.0.0
 * @dependencies Qubit (M08.01), Complex (M01.04), Matrix (M01.05), Logger (M01.01)
 */

import { Logger } from '../../core/logger/Logger';
import { HashVerifier } from '../../core/logger/HashVerifier';
import { Complex } from '../../core/math/Complex';
import { QubitState, MultiQubitState } from '../qubit/Qubit';

// ============================================================================
// Interfaces & Types
// ============================================================================

/**
 * Gate type classification
 */
export type GateType = 'single' | 'controlled' | 'multi' | 'custom';

/**
 * Gate properties
 */
export interface GateProperties {
  name: string;
  type: GateType;
  numQubits: number;
  isUnitary: boolean;
  isHermitian: boolean;
  description: string;
}

/**
 * Gate application result
 */
export interface GateResult {
  inputState: Complex[];
  outputState: Complex[];
  gate: string;
  hash: string;
}

// ============================================================================
// Gate Base Class
// ============================================================================

/**
 * Abstract base class for quantum gates
 */
export abstract class Gate {
  protected name: string;
  protected matrix: Complex[][];
  protected numQubits: number;
  protected static logger: Logger | null = null;

  constructor(name: string, matrix: Complex[][], numQubits: number = 1) {
    this.name = name;
    this.matrix = matrix;
    this.numQubits = numQubits;
  }

  /**
   * Set logger for Gate operations
   */
  public static setLogger(logger: Logger): void {
    Gate.logger = logger;
  }

  /**
   * Get gate name
   */
  public getName(): string {
    return this.name;
  }

  /**
   * Get gate matrix
   */
  public getMatrix(): Complex[][] {
    return this.matrix.map(row => [...row]);
  }

  /**
   * Get number of qubits this gate operates on
   */
  public getNumQubits(): number {
    return this.numQubits;
  }

  /**
   * Check if gate is unitary (U†U = I)
   */
  public isUnitary(tolerance: number = 1e-10): boolean {
    const n = this.matrix.length;
    const dagger = this.dagger().getMatrix();
    
    // Compute U†U
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        let sum = Complex.zero();
        for (let k = 0; k < n; k++) {
          sum = sum.add(dagger[i][k].multiply(this.matrix[k][j]));
        }
        
        const expected = i === j ? 1 : 0;
        if (Math.abs(sum.real.toNumber() - expected) > tolerance ||
            Math.abs(sum.imag.toNumber()) > tolerance) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Check if gate is Hermitian (U† = U)
   */
  public isHermitian(tolerance: number = 1e-10): boolean {
    const n = this.matrix.length;
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const conj = this.matrix[j][i].conjugate();
        if (Math.abs(this.matrix[i][j].real.toNumber() - conj.real.toNumber()) > tolerance ||
            Math.abs(this.matrix[i][j].imag.toNumber() - conj.imag.toNumber()) > tolerance) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Get conjugate transpose (dagger)
   */
  public dagger(): Gate {
    const n = this.matrix.length;
    const dagMatrix: Complex[][] = Array(n).fill(null).map(() => Array(n).fill(Complex.zero()));
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        dagMatrix[i][j] = this.matrix[j][i].conjugate();
      }
    }
    
    return new CustomGate(`${this.name}†`, dagMatrix, this.numQubits);
  }

  /**
   * Apply gate to single qubit state
   */
  public apply(state: QubitState): QubitState {
    if (this.numQubits !== 1) {
      throw new Error(`Cannot apply ${this.numQubits}-qubit gate to single qubit`);
    }
    
    const input = [state.getAlpha(), state.getBeta()];
    const output: Complex[] = [];
    
    for (let i = 0; i < 2; i++) {
      let sum = Complex.zero();
      for (let j = 0; j < 2; j++) {
        sum = sum.add(this.matrix[i][j].multiply(input[j]));
      }
      output.push(sum);
    }
    
    return new QubitState(output[0], output[1]);
  }

  /**
   * Apply gate to multi-qubit state at specified qubit indices
   */
  public applyTo(state: MultiQubitState, targetQubits: number[]): MultiQubitState {
    if (targetQubits.length !== this.numQubits) {
      throw new Error(`Gate requires ${this.numQubits} qubits, got ${targetQubits.length}`);
    }
    
    const numQubits = state.getNumQubits();
    const stateSize = 2 ** numQubits;
    const amplitudes = state.getAmplitudes();
    const newAmplitudes: Complex[] = Array(stateSize).fill(Complex.zero());
    
    // For single-qubit gates
    if (this.numQubits === 1) {
      const target = targetQubits[0];
      
      for (let i = 0; i < stateSize; i++) {
        const bit = (i >> (numQubits - 1 - target)) & 1;
        
        for (let newBit = 0; newBit < 2; newBit++) {
          const coeff = this.matrix[newBit][bit];
          if (coeff.magnitude().toNumber() > 1e-15) {
            // Calculate new index with changed bit
            const newIdx = bit === newBit ? i : i ^ (1 << (numQubits - 1 - target));
            newAmplitudes[newIdx] = newAmplitudes[newIdx].add(
              coeff.multiply(amplitudes[i])
            );
          }
        }
      }
    } else {
      // For multi-qubit gates
      const gateSize = 2 ** this.numQubits;
      
      for (let i = 0; i < stateSize; i++) {
        // Extract bits at target positions
        let targetBits = 0;
        for (let t = 0; t < this.numQubits; t++) {
          const bit = (i >> (numQubits - 1 - targetQubits[t])) & 1;
          targetBits |= bit << (this.numQubits - 1 - t);
        }
        
        for (let newTargetBits = 0; newTargetBits < gateSize; newTargetBits++) {
          const coeff = this.matrix[newTargetBits][targetBits];
          if (coeff.magnitude().toNumber() > 1e-15) {
            // Calculate new index
            let newIdx = i;
            for (let t = 0; t < this.numQubits; t++) {
              const oldBit = (targetBits >> (this.numQubits - 1 - t)) & 1;
              const newBit = (newTargetBits >> (this.numQubits - 1 - t)) & 1;
              if (oldBit !== newBit) {
                newIdx ^= 1 << (numQubits - 1 - targetQubits[t]);
              }
            }
            
            newAmplitudes[newIdx] = newAmplitudes[newIdx].add(
              coeff.multiply(amplitudes[i])
            );
          }
        }
      }
    }
    
    return new MultiQubitState(newAmplitudes);
  }

  /**
   * Tensor product with another gate
   */
  public tensor(other: Gate): Gate {
    const n1 = this.matrix.length;
    const n2 = other.matrix.length;
    const newSize = n1 * n2;
    const newMatrix: Complex[][] = Array(newSize).fill(null).map(() => 
      Array(newSize).fill(Complex.zero())
    );
    
    for (let i = 0; i < n1; i++) {
      for (let j = 0; j < n1; j++) {
        for (let k = 0; k < n2; k++) {
          for (let l = 0; l < n2; l++) {
            newMatrix[i * n2 + k][j * n2 + l] = 
              this.matrix[i][j].multiply(other.matrix[k][l]);
          }
        }
      }
    }
    
    return new CustomGate(
      `${this.name}⊗${other.name}`,
      newMatrix,
      this.numQubits + other.numQubits
    );
  }

  /**
   * Compose with another gate (matrix multiplication)
   */
  public compose(other: Gate): Gate {
    if (this.matrix.length !== other.matrix.length) {
      throw new Error('Gates must have same dimension for composition');
    }
    
    const n = this.matrix.length;
    const newMatrix: Complex[][] = Array(n).fill(null).map(() => 
      Array(n).fill(Complex.zero())
    );
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        let sum = Complex.zero();
        for (let k = 0; k < n; k++) {
          sum = sum.add(this.matrix[i][k].multiply(other.matrix[k][j]));
        }
        newMatrix[i][j] = sum;
      }
    }
    
    return new CustomGate(
      `${this.name}∘${other.name}`,
      newMatrix,
      this.numQubits
    );
  }

  /**
   * Get gate properties
   */
  public getProperties(): GateProperties {
    return {
      name: this.name,
      type: this.numQubits === 1 ? 'single' : 'multi',
      numQubits: this.numQubits,
      isUnitary: this.isUnitary(),
      isHermitian: this.isHermitian(),
      description: `${this.name} gate operating on ${this.numQubits} qubit(s)`
    };
  }

  /**
   * Get hash
   */
  public getHash(): string {
    const matrixStr = this.matrix.map(row => 
      row.map(c => c.toString()).join(',')
    ).join(';');
    return HashVerifier.hash(`gate:${this.name}:${matrixStr}`);
  }

  /**
   * String representation
   */
  public toString(): string {
    return this.name;
  }
}

// ============================================================================
// Custom Gate
// ============================================================================

/**
 * Custom gate with arbitrary matrix
 */
export class CustomGate extends Gate {
  constructor(name: string, matrix: Complex[][], numQubits?: number) {
    const size = matrix.length;
    const qubits = numQubits ?? Math.log2(size);
    super(name, matrix, qubits);
  }
}

// ============================================================================
// Single-Qubit Gates
// ============================================================================

/**
 * Pauli-X (NOT) gate
 */
export class PauliX extends Gate {
  constructor() {
    super('X', [
      [Complex.zero(), Complex.one()],
      [Complex.one(), Complex.zero()]
    ], 1);
  }
}

/**
 * Pauli-Y gate
 */
export class PauliY extends Gate {
  constructor() {
    super('Y', [
      [Complex.zero(), new Complex(0, -1)],
      [new Complex(0, 1), Complex.zero()]
    ], 1);
  }
}

/**
 * Pauli-Z gate
 */
export class PauliZ extends Gate {
  constructor() {
    super('Z', [
      [Complex.one(), Complex.zero()],
      [Complex.zero(), new Complex(-1, 0)]
    ], 1);
  }
}

/**
 * Hadamard gate
 */
export class Hadamard extends Gate {
  constructor() {
    const sqrt2Inv = 1 / Math.sqrt(2);
    super('H', [
      [new Complex(sqrt2Inv, 0), new Complex(sqrt2Inv, 0)],
      [new Complex(sqrt2Inv, 0), new Complex(-sqrt2Inv, 0)]
    ], 1);
  }
}

/**
 * S (Phase) gate
 */
export class SGate extends Gate {
  constructor() {
    super('S', [
      [Complex.one(), Complex.zero()],
      [Complex.zero(), new Complex(0, 1)]
    ], 1);
  }
}

/**
 * S† gate
 */
export class SDagger extends Gate {
  constructor() {
    super('S†', [
      [Complex.one(), Complex.zero()],
      [Complex.zero(), new Complex(0, -1)]
    ], 1);
  }
}

/**
 * T gate (π/8 gate)
 */
export class TGate extends Gate {
  constructor() {
    const angle = Math.PI / 4;
    super('T', [
      [Complex.one(), Complex.zero()],
      [Complex.zero(), new Complex(Math.cos(angle), Math.sin(angle))]
    ], 1);
  }
}

/**
 * T† gate
 */
export class TDagger extends Gate {
  constructor() {
    const angle = Math.PI / 4;
    super('T†', [
      [Complex.one(), Complex.zero()],
      [Complex.zero(), new Complex(Math.cos(angle), -Math.sin(angle))]
    ], 1);
  }
}

/**
 * Identity gate
 */
export class Identity extends Gate {
  constructor() {
    super('I', [
      [Complex.one(), Complex.zero()],
      [Complex.zero(), Complex.one()]
    ], 1);
  }
}

// ============================================================================
// Rotation Gates
// ============================================================================

/**
 * Rotation around X axis
 */
export class RotationX extends Gate {
  private angle: number;

  constructor(angle: number) {
    const cosHalf = Math.cos(angle / 2);
    const sinHalf = Math.sin(angle / 2);
    super(`Rx(${angle.toFixed(3)})`, [
      [new Complex(cosHalf, 0), new Complex(0, -sinHalf)],
      [new Complex(0, -sinHalf), new Complex(cosHalf, 0)]
    ], 1);
    this.angle = angle;
  }

  public getAngle(): number {
    return this.angle;
  }
}

/**
 * Rotation around Y axis
 */
export class RotationY extends Gate {
  private angle: number;

  constructor(angle: number) {
    const cosHalf = Math.cos(angle / 2);
    const sinHalf = Math.sin(angle / 2);
    super(`Ry(${angle.toFixed(3)})`, [
      [new Complex(cosHalf, 0), new Complex(-sinHalf, 0)],
      [new Complex(sinHalf, 0), new Complex(cosHalf, 0)]
    ], 1);
    this.angle = angle;
  }

  public getAngle(): number {
    return this.angle;
  }
}

/**
 * Rotation around Z axis
 */
export class RotationZ extends Gate {
  private angle: number;

  constructor(angle: number) {
    const halfAngle = angle / 2;
    super(`Rz(${angle.toFixed(3)})`, [
      [new Complex(Math.cos(halfAngle), -Math.sin(halfAngle)), Complex.zero()],
      [Complex.zero(), new Complex(Math.cos(halfAngle), Math.sin(halfAngle))]
    ], 1);
    this.angle = angle;
  }

  public getAngle(): number {
    return this.angle;
  }
}

/**
 * Phase gate with arbitrary angle
 */
export class Phase extends Gate {
  private angle: number;

  constructor(angle: number) {
    super(`P(${angle.toFixed(3)})`, [
      [Complex.one(), Complex.zero()],
      [Complex.zero(), new Complex(Math.cos(angle), Math.sin(angle))]
    ], 1);
    this.angle = angle;
  }

  public getAngle(): number {
    return this.angle;
  }
}

/**
 * U3 gate (most general single-qubit gate)
 */
export class U3 extends Gate {
  private theta: number;
  private phi: number;
  private lambda: number;

  constructor(theta: number, phi: number, lambda: number) {
    const cosHalf = Math.cos(theta / 2);
    const sinHalf = Math.sin(theta / 2);
    
    super(`U3(${theta.toFixed(3)},${phi.toFixed(3)},${lambda.toFixed(3)})`, [
      [
        new Complex(cosHalf, 0),
        new Complex(-Math.cos(lambda) * sinHalf, -Math.sin(lambda) * sinHalf)
      ],
      [
        new Complex(Math.cos(phi) * sinHalf, Math.sin(phi) * sinHalf),
        new Complex(
          Math.cos(phi + lambda) * cosHalf,
          Math.sin(phi + lambda) * cosHalf
        )
      ]
    ], 1);
    
    this.theta = theta;
    this.phi = phi;
    this.lambda = lambda;
  }

  public getAngles(): { theta: number; phi: number; lambda: number } {
    return { theta: this.theta, phi: this.phi, lambda: this.lambda };
  }
}

// ============================================================================
// Two-Qubit Gates
// ============================================================================

/**
 * CNOT (Controlled-NOT) gate
 */
export class CNOT extends Gate {
  constructor() {
    super('CNOT', [
      [Complex.one(), Complex.zero(), Complex.zero(), Complex.zero()],
      [Complex.zero(), Complex.one(), Complex.zero(), Complex.zero()],
      [Complex.zero(), Complex.zero(), Complex.zero(), Complex.one()],
      [Complex.zero(), Complex.zero(), Complex.one(), Complex.zero()]
    ], 2);
  }
}

/**
 * CZ (Controlled-Z) gate
 */
export class CZ extends Gate {
  constructor() {
    super('CZ', [
      [Complex.one(), Complex.zero(), Complex.zero(), Complex.zero()],
      [Complex.zero(), Complex.one(), Complex.zero(), Complex.zero()],
      [Complex.zero(), Complex.zero(), Complex.one(), Complex.zero()],
      [Complex.zero(), Complex.zero(), Complex.zero(), new Complex(-1, 0)]
    ], 2);
  }
}

/**
 * SWAP gate
 */
export class SWAP extends Gate {
  constructor() {
    super('SWAP', [
      [Complex.one(), Complex.zero(), Complex.zero(), Complex.zero()],
      [Complex.zero(), Complex.zero(), Complex.one(), Complex.zero()],
      [Complex.zero(), Complex.one(), Complex.zero(), Complex.zero()],
      [Complex.zero(), Complex.zero(), Complex.zero(), Complex.one()]
    ], 2);
  }
}

/**
 * iSWAP gate
 */
export class iSWAP extends Gate {
  constructor() {
    super('iSWAP', [
      [Complex.one(), Complex.zero(), Complex.zero(), Complex.zero()],
      [Complex.zero(), Complex.zero(), new Complex(0, 1), Complex.zero()],
      [Complex.zero(), new Complex(0, 1), Complex.zero(), Complex.zero()],
      [Complex.zero(), Complex.zero(), Complex.zero(), Complex.one()]
    ], 2);
  }
}

/**
 * Square root of SWAP
 */
export class SqrtSWAP extends Gate {
  constructor() {
    const half = new Complex(0.5, 0);
    const halfPlusI = new Complex(0.5, 0.5);
    const halfMinusI = new Complex(0.5, -0.5);
    
    super('√SWAP', [
      [Complex.one(), Complex.zero(), Complex.zero(), Complex.zero()],
      [Complex.zero(), halfPlusI, halfMinusI, Complex.zero()],
      [Complex.zero(), halfMinusI, halfPlusI, Complex.zero()],
      [Complex.zero(), Complex.zero(), Complex.zero(), Complex.one()]
    ], 2);
  }
}

/**
 * Controlled-Phase gate
 */
export class CPhase extends Gate {
  private angle: number;

  constructor(angle: number) {
    super(`CP(${angle.toFixed(3)})`, [
      [Complex.one(), Complex.zero(), Complex.zero(), Complex.zero()],
      [Complex.zero(), Complex.one(), Complex.zero(), Complex.zero()],
      [Complex.zero(), Complex.zero(), Complex.one(), Complex.zero()],
      [Complex.zero(), Complex.zero(), Complex.zero(), new Complex(Math.cos(angle), Math.sin(angle))]
    ], 2);
    this.angle = angle;
  }

  public getAngle(): number {
    return this.angle;
  }
}

/**
 * Controlled rotation around X
 */
export class CRX extends Gate {
  private angle: number;

  constructor(angle: number) {
    const cosHalf = Math.cos(angle / 2);
    const sinHalf = Math.sin(angle / 2);
    
    super(`CRx(${angle.toFixed(3)})`, [
      [Complex.one(), Complex.zero(), Complex.zero(), Complex.zero()],
      [Complex.zero(), Complex.one(), Complex.zero(), Complex.zero()],
      [Complex.zero(), Complex.zero(), new Complex(cosHalf, 0), new Complex(0, -sinHalf)],
      [Complex.zero(), Complex.zero(), new Complex(0, -sinHalf), new Complex(cosHalf, 0)]
    ], 2);
    this.angle = angle;
  }

  public getAngle(): number {
    return this.angle;
  }
}

// ============================================================================
// Three-Qubit Gates
// ============================================================================

/**
 * Toffoli (CCNOT) gate
 */
export class Toffoli extends Gate {
  constructor() {
    const matrix: Complex[][] = Array(8).fill(null).map(() => 
      Array(8).fill(Complex.zero())
    );
    
    // Identity for all states except |110⟩ and |111⟩
    for (let i = 0; i < 6; i++) {
      matrix[i][i] = Complex.one();
    }
    // Swap |110⟩ and |111⟩
    matrix[6][7] = Complex.one();
    matrix[7][6] = Complex.one();
    
    super('Toffoli', matrix, 3);
  }
}

/**
 * Fredkin (CSWAP) gate
 */
export class Fredkin extends Gate {
  constructor() {
    const matrix: Complex[][] = Array(8).fill(null).map(() => 
      Array(8).fill(Complex.zero())
    );
    
    // Identity for most states
    for (let i = 0; i < 8; i++) {
      if (i !== 5 && i !== 6) {
        matrix[i][i] = Complex.one();
      }
    }
    // Swap |101⟩ and |110⟩ (controlled by first qubit)
    matrix[5][6] = Complex.one();
    matrix[6][5] = Complex.one();
    
    super('Fredkin', matrix, 3);
  }
}

// ============================================================================
// Controlled Gate Factory
// ============================================================================

/**
 * Factory for creating controlled gates
 */
export class ControlledGate extends Gate {
  private baseGate: Gate;
  private numControls: number;

  constructor(baseGate: Gate, numControls: number = 1) {
    const baseSize = baseGate.getMatrix().length;
    const totalQubits = baseGate.getNumQubits() + numControls;
    const size = 2 ** totalQubits;
    
    const matrix: Complex[][] = Array(size).fill(null).map(() => 
      Array(size).fill(Complex.zero())
    );
    
    // Identity for states where control qubits are not all 1
    const controlMask = (2 ** numControls - 1) << baseGate.getNumQubits();
    
    for (let i = 0; i < size; i++) {
      const controlBits = (i >> baseGate.getNumQubits()) & (2 ** numControls - 1);
      
      if (controlBits !== (2 ** numControls - 1)) {
        // Control not satisfied - identity
        matrix[i][i] = Complex.one();
      } else {
        // Apply base gate to target qubits
        const targetIn = i & (baseSize - 1);
        for (let targetOut = 0; targetOut < baseSize; targetOut++) {
          const j = (i & ~(baseSize - 1)) | targetOut;
          matrix[j][i] = baseGate.getMatrix()[targetOut][targetIn];
        }
      }
    }
    
    const name = 'C'.repeat(numControls) + baseGate.getName();
    super(name, matrix, totalQubits);
    
    this.baseGate = baseGate;
    this.numControls = numControls;
  }

  public getBaseGate(): Gate {
    return this.baseGate;
  }

  public getNumControls(): number {
    return this.numControls;
  }
}

// ============================================================================
// Gate Library
// ============================================================================

/**
 * Library of standard quantum gates
 */
export class GateLibrary {
  private static instance: GateLibrary | null = null;
  private gates: Map<string, Gate> = new Map();

  private constructor() {
    this.initializeStandardGates();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): GateLibrary {
    if (!GateLibrary.instance) {
      GateLibrary.instance = new GateLibrary();
    }
    return GateLibrary.instance;
  }

  /**
   * Reset instance (for testing)
   */
  public static resetInstance(): void {
    GateLibrary.instance = null;
  }

  /**
   * Initialize standard gates
   */
  private initializeStandardGates(): void {
    // Single-qubit gates
    this.gates.set('I', new Identity());
    this.gates.set('X', new PauliX());
    this.gates.set('Y', new PauliY());
    this.gates.set('Z', new PauliZ());
    this.gates.set('H', new Hadamard());
    this.gates.set('S', new SGate());
    this.gates.set('S†', new SDagger());
    this.gates.set('T', new TGate());
    this.gates.set('T†', new TDagger());
    
    // Two-qubit gates
    this.gates.set('CNOT', new CNOT());
    this.gates.set('CX', new CNOT()); // Alias
    this.gates.set('CZ', new CZ());
    this.gates.set('SWAP', new SWAP());
    this.gates.set('iSWAP', new iSWAP());
    this.gates.set('√SWAP', new SqrtSWAP());
    
    // Three-qubit gates
    this.gates.set('Toffoli', new Toffoli());
    this.gates.set('CCNOT', new Toffoli()); // Alias
    this.gates.set('CCX', new Toffoli()); // Alias
    this.gates.set('Fredkin', new Fredkin());
    this.gates.set('CSWAP', new Fredkin()); // Alias
  }

  /**
   * Get gate by name
   */
  public get(name: string): Gate | undefined {
    return this.gates.get(name);
  }

  /**
   * Check if gate exists
   */
  public has(name: string): boolean {
    return this.gates.has(name);
  }

  /**
   * Add custom gate
   */
  public add(name: string, gate: Gate): void {
    this.gates.set(name, gate);
  }

  /**
   * Get all gate names
   */
  public getNames(): string[] {
    return Array.from(this.gates.keys());
  }

  /**
   * Get rotation gate
   */
  public rotation(axis: 'x' | 'y' | 'z', angle: number): Gate {
    switch (axis) {
      case 'x': return new RotationX(angle);
      case 'y': return new RotationY(angle);
      case 'z': return new RotationZ(angle);
    }
  }

  /**
   * Get phase gate
   */
  public phase(angle: number): Gate {
    return new Phase(angle);
  }

  /**
   * Get U3 gate
   */
  public u3(theta: number, phi: number, lambda: number): Gate {
    return new U3(theta, phi, lambda);
  }

  /**
   * Get controlled version of a gate
   */
  public controlled(gate: Gate, numControls: number = 1): Gate {
    return new ControlledGate(gate, numControls);
  }

  /**
   * Get controlled phase gate
   */
  public cphase(angle: number): Gate {
    return new CPhase(angle);
  }

  /**
   * Get CRX gate
   */
  public crx(angle: number): Gate {
    return new CRX(angle);
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Factory for creating quantum gates
 */
export class QuantumGatesFactory {
  /**
   * Create Pauli-X gate
   */
  public static X(): PauliX {
    return new PauliX();
  }

  /**
   * Create Pauli-Y gate
   */
  public static Y(): PauliY {
    return new PauliY();
  }

  /**
   * Create Pauli-Z gate
   */
  public static Z(): PauliZ {
    return new PauliZ();
  }

  /**
   * Create Hadamard gate
   */
  public static H(): Hadamard {
    return new Hadamard();
  }

  /**
   * Create S gate
   */
  public static S(): SGate {
    return new SGate();
  }

  /**
   * Create T gate
   */
  public static T(): TGate {
    return new TGate();
  }

  /**
   * Create Identity gate
   */
  public static I(): Identity {
    return new Identity();
  }

  /**
   * Create rotation gates
   */
  public static Rx(angle: number): RotationX {
    return new RotationX(angle);
  }

  public static Ry(angle: number): RotationY {
    return new RotationY(angle);
  }

  public static Rz(angle: number): RotationZ {
    return new RotationZ(angle);
  }

  /**
   * Create CNOT gate
   */
  public static CNOT(): CNOT {
    return new CNOT();
  }

  /**
   * Create CZ gate
   */
  public static CZ(): CZ {
    return new CZ();
  }

  /**
   * Create SWAP gate
   */
  public static SWAP(): SWAP {
    return new SWAP();
  }

  /**
   * Create Toffoli gate
   */
  public static Toffoli(): Toffoli {
    return new Toffoli();
  }

  /**
   * Create Fredkin gate
   */
  public static Fredkin(): Fredkin {
    return new Fredkin();
  }

  /**
   * Create custom gate from matrix
   */
  public static custom(name: string, matrix: Complex[][]): CustomGate {
    return new CustomGate(name, matrix);
  }

  /**
   * Create controlled version of any gate
   */
  public static controlled(gate: Gate, numControls: number = 1): ControlledGate {
    return new ControlledGate(gate, numControls);
  }
}
