/**
 * Qlaws Ham - Quantum Circuit Module (M08.03)
 * 
 * Implements quantum circuit composition and simulation.
 * Supports circuit optimization and measurement.
 * 
 * @module QuantumCircuit
 * @version 1.0.0
 * @dependencies QuantumGates (M08.02), Qubit (M08.01), Logger (M01.01)
 */

import { Logger } from '../../core/logger/Logger';
import { HashVerifier } from '../../core/logger/HashVerifier';
import { Complex } from '../../core/math/Complex';
import { QubitState, MultiQubitState, Qubit, QubitRegister } from '../qubit/Qubit';
import { 
  Gate, 
  Hadamard, 
  PauliX, 
  PauliZ, 
  CNOT, 
  QuantumGatesFactory,
  GateLibrary 
} from '../gates/QuantumGates';

// ============================================================================
// Interfaces & Types
// ============================================================================

/**
 * Circuit operation
 */
export interface CircuitOperation {
  gate: Gate;
  targetQubits: number[];
  controlQubits?: number[];
  label?: string;
  depth?: number;
}

/**
 * Measurement operation
 */
export interface MeasurementOp {
  qubitIndex: number;
  classicalBit?: number;
  basis?: 'Z' | 'X' | 'Y';
}

/**
 * Circuit execution result
 */
export interface CircuitResult {
  finalState: MultiQubitState;
  measurements: Map<number, number>;
  bitString: string;
  probability: number;
  hash: string;
}

/**
 * Multiple shots result
 */
export interface ShotResults {
  counts: Map<string, number>;
  totalShots: number;
  probabilities: Map<string, number>;
  hash: string;
}

/**
 * Circuit statistics
 */
export interface CircuitStats {
  numQubits: number;
  depth: number;
  gateCount: number;
  singleQubitGates: number;
  twoQubitGates: number;
  multiQubitGates: number;
  measurements: number;
}

/**
 * Circuit optimization options
 */
export interface OptimizationOptions {
  removeIdentities?: boolean;
  mergeRotations?: boolean;
  cancelInverses?: boolean;
  reorderGates?: boolean;
}

// ============================================================================
// QuantumCircuit Class
// ============================================================================

/**
 * Quantum circuit builder and simulator
 */
export class QuantumCircuit {
  private numQubits: number;
  private operations: CircuitOperation[];
  private measurements: MeasurementOp[];
  private classicalBits: number;
  private name: string;
  private static logger: Logger | null = null;

  constructor(numQubits: number, name: string = 'circuit') {
    if (numQubits < 1 || numQubits > 20) {
      throw new Error('Number of qubits must be between 1 and 20');
    }
    
    this.numQubits = numQubits;
    this.operations = [];
    this.measurements = [];
    this.classicalBits = numQubits;
    this.name = name;
  }

  /**
   * Set logger for QuantumCircuit operations
   */
  public static setLogger(logger: Logger): void {
    QuantumCircuit.logger = logger;
  }

  /**
   * Get number of qubits
   */
  public getNumQubits(): number {
    return this.numQubits;
  }

  /**
   * Get circuit name
   */
  public getName(): string {
    return this.name;
  }

  /**
   * Set circuit name
   */
  public setName(name: string): void {
    this.name = name;
  }

  /**
   * Get number of classical bits
   */
  public getClassicalBits(): number {
    return this.classicalBits;
  }

  /**
   * Set number of classical bits
   */
  public setClassicalBits(bits: number): void {
    this.classicalBits = bits;
  }

  // ============================================================================
  // Gate Application Methods
  // ============================================================================

  /**
   * Apply a gate to specified qubits
   */
  public apply(gate: Gate, ...targetQubits: number[]): QuantumCircuit {
    this.validateQubits(targetQubits);
    
    if (gate.getNumQubits() !== targetQubits.length) {
      throw new Error(`Gate ${gate.getName()} requires ${gate.getNumQubits()} qubits, got ${targetQubits.length}`);
    }
    
    this.operations.push({
      gate,
      targetQubits,
      depth: this.calculateDepth(targetQubits)
    });
    
    return this;
  }

  /**
   * Apply Hadamard gate
   */
  public h(qubit: number): QuantumCircuit {
    return this.apply(new Hadamard(), qubit);
  }

  /**
   * Apply Pauli-X gate
   */
  public x(qubit: number): QuantumCircuit {
    return this.apply(QuantumGatesFactory.X(), qubit);
  }

  /**
   * Apply Pauli-Y gate
   */
  public y(qubit: number): QuantumCircuit {
    return this.apply(QuantumGatesFactory.Y(), qubit);
  }

  /**
   * Apply Pauli-Z gate
   */
  public z(qubit: number): QuantumCircuit {
    return this.apply(QuantumGatesFactory.Z(), qubit);
  }

  /**
   * Apply S gate
   */
  public s(qubit: number): QuantumCircuit {
    return this.apply(QuantumGatesFactory.S(), qubit);
  }

  /**
   * Apply T gate
   */
  public t(qubit: number): QuantumCircuit {
    return this.apply(QuantumGatesFactory.T(), qubit);
  }

  /**
   * Apply rotation around X axis
   */
  public rx(angle: number, qubit: number): QuantumCircuit {
    return this.apply(QuantumGatesFactory.Rx(angle), qubit);
  }

  /**
   * Apply rotation around Y axis
   */
  public ry(angle: number, qubit: number): QuantumCircuit {
    return this.apply(QuantumGatesFactory.Ry(angle), qubit);
  }

  /**
   * Apply rotation around Z axis
   */
  public rz(angle: number, qubit: number): QuantumCircuit {
    return this.apply(QuantumGatesFactory.Rz(angle), qubit);
  }

  /**
   * Apply CNOT gate
   */
  public cx(control: number, target: number): QuantumCircuit {
    return this.apply(new CNOT(), control, target);
  }

  /**
   * Apply CZ gate
   */
  public cz(control: number, target: number): QuantumCircuit {
    return this.apply(QuantumGatesFactory.CZ(), control, target);
  }

  /**
   * Apply SWAP gate
   */
  public swap(qubit1: number, qubit2: number): QuantumCircuit {
    return this.apply(QuantumGatesFactory.SWAP(), qubit1, qubit2);
  }

  /**
   * Apply Toffoli (CCX) gate
   */
  public ccx(control1: number, control2: number, target: number): QuantumCircuit {
    return this.apply(QuantumGatesFactory.Toffoli(), control1, control2, target);
  }

  /**
   * Apply barrier (no-op marker for visualization)
   */
  public barrier(...qubits: number[]): QuantumCircuit {
    // Barriers are visual markers, no actual operation
    return this;
  }

  // ============================================================================
  // Measurement Methods
  // ============================================================================

  /**
   * Add measurement operation
   */
  public measure(qubit: number, classicalBit?: number, basis: 'Z' | 'X' | 'Y' = 'Z'): QuantumCircuit {
    this.validateQubits([qubit]);
    
    this.measurements.push({
      qubitIndex: qubit,
      classicalBit: classicalBit ?? qubit,
      basis
    });
    
    return this;
  }

  /**
   * Measure all qubits
   */
  public measureAll(): QuantumCircuit {
    for (let i = 0; i < this.numQubits; i++) {
      this.measure(i, i);
    }
    return this;
  }

  // ============================================================================
  // Execution Methods
  // ============================================================================

  /**
   * Execute circuit once
   */
  public run(initialState?: MultiQubitState): CircuitResult {
    let state = initialState ?? MultiQubitState.zeros(this.numQubits);
    
    // Apply all gates
    for (const op of this.operations) {
      state = op.gate.applyTo(state, op.targetQubits);
    }
    
    // Perform measurements
    const measurementResults = new Map<number, number>();
    
    for (const meas of this.measurements) {
      // Apply basis change if needed
      if (meas.basis === 'X') {
        const H = new Hadamard();
        state = H.applyTo(state, [meas.qubitIndex]);
      } else if (meas.basis === 'Y') {
        // Y-basis measurement: apply S†H
        const Sd = QuantumGatesFactory.S().dagger();
        const H = new Hadamard();
        state = Sd.applyTo(state, [meas.qubitIndex]);
        state = H.applyTo(state, [meas.qubitIndex]);
      }
      
      // Measure in computational basis
      const result = state.measureQubit(meas.qubitIndex);
      measurementResults.set(meas.classicalBit ?? meas.qubitIndex, result.outcome);
      state = result.newState;
    }
    
    // Build bit string from measurements
    const bits: string[] = new Array(this.classicalBits).fill('0');
    measurementResults.forEach((value, key) => {
      if (key < bits.length) {
        bits[key] = value.toString();
      }
    });
    const bitString = bits.join('');
    
    const hash = HashVerifier.hash(
      `circuit:${this.name}:${bitString}:${Date.now()}`
    );
    
    return {
      finalState: state,
      measurements: measurementResults,
      bitString,
      probability: 1, // Single shot
      hash
    };
  }

  /**
   * Run circuit multiple times
   */
  public runShots(shots: number, initialState?: MultiQubitState): ShotResults {
    const counts = new Map<string, number>();
    
    for (let i = 0; i < shots; i++) {
      const result = this.run(initialState?.clone());
      const bitString = result.bitString;
      counts.set(bitString, (counts.get(bitString) ?? 0) + 1);
    }
    
    const probabilities = new Map<string, number>();
    counts.forEach((count, bitString) => {
      probabilities.set(bitString, count / shots);
    });
    
    const hash = HashVerifier.hash(
      `shots:${this.name}:${shots}:${Date.now()}`
    );
    
    return { counts, totalShots: shots, probabilities, hash };
  }

  /**
   * Get statevector without measurement
   */
  public getStatevector(initialState?: MultiQubitState): MultiQubitState {
    let state = initialState ?? MultiQubitState.zeros(this.numQubits);
    
    for (const op of this.operations) {
      state = op.gate.applyTo(state, op.targetQubits);
    }
    
    return state;
  }

  /**
   * Get unitary matrix of circuit
   */
  public getUnitary(): Complex[][] {
    const size = 2 ** this.numQubits;
    
    // Start with identity
    let unitary: Complex[][] = Array(size).fill(null).map((_, i) =>
      Array(size).fill(null).map((_, j) => i === j ? Complex.one() : Complex.zero())
    );
    
    // Apply each gate's matrix
    for (const op of this.operations) {
      const gateUnitary = this.expandGateToFullSize(op.gate, op.targetQubits);
      unitary = this.matrixMultiply(gateUnitary, unitary);
    }
    
    return unitary;
  }

  /**
   * Expand gate matrix to full circuit size
   */
  private expandGateToFullSize(gate: Gate, targetQubits: number[]): Complex[][] {
    const size = 2 ** this.numQubits;
    const result: Complex[][] = Array(size).fill(null).map(() =>
      Array(size).fill(Complex.zero())
    );
    
    const gateMatrix = gate.getMatrix();
    const gateSize = gateMatrix.length;
    
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        // Check if non-target qubits match
        let match = true;
        for (let q = 0; q < this.numQubits; q++) {
          if (!targetQubits.includes(q)) {
            const bitI = (i >> (this.numQubits - 1 - q)) & 1;
            const bitJ = (j >> (this.numQubits - 1 - q)) & 1;
            if (bitI !== bitJ) {
              match = false;
              break;
            }
          }
        }
        
        if (match) {
          // Extract target qubit bits
          let targetI = 0;
          let targetJ = 0;
          for (let t = 0; t < targetQubits.length; t++) {
            const q = targetQubits[t];
            const bitI = (i >> (this.numQubits - 1 - q)) & 1;
            const bitJ = (j >> (this.numQubits - 1 - q)) & 1;
            targetI |= bitI << (targetQubits.length - 1 - t);
            targetJ |= bitJ << (targetQubits.length - 1 - t);
          }
          
          result[i][j] = gateMatrix[targetI][targetJ];
        }
      }
    }
    
    return result;
  }

  /**
   * Matrix multiplication
   */
  private matrixMultiply(A: Complex[][], B: Complex[][]): Complex[][] {
    const n = A.length;
    const result: Complex[][] = Array(n).fill(null).map(() =>
      Array(n).fill(Complex.zero())
    );
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        let sum = Complex.zero();
        for (let k = 0; k < n; k++) {
          sum = sum.add(A[i][k].multiply(B[k][j]));
        }
        result[i][j] = sum;
      }
    }
    
    return result;
  }

  // ============================================================================
  // Circuit Manipulation
  // ============================================================================

  /**
   * Clone the circuit
   */
  public clone(): QuantumCircuit {
    const circuit = new QuantumCircuit(this.numQubits, this.name);
    circuit.operations = [...this.operations];
    circuit.measurements = [...this.measurements];
    circuit.classicalBits = this.classicalBits;
    return circuit;
  }

  /**
   * Compose with another circuit
   */
  public compose(other: QuantumCircuit): QuantumCircuit {
    if (this.numQubits !== other.numQubits) {
      throw new Error('Circuits must have same number of qubits');
    }
    
    const combined = this.clone();
    combined.operations.push(...other.operations);
    combined.measurements.push(...other.measurements);
    return combined;
  }

  /**
   * Get inverse circuit
   */
  public inverse(): QuantumCircuit {
    const invCircuit = new QuantumCircuit(this.numQubits, `${this.name}_inv`);
    
    // Apply inverse gates in reverse order
    for (let i = this.operations.length - 1; i >= 0; i--) {
      const op = this.operations[i];
      invCircuit.apply(op.gate.dagger(), ...op.targetQubits);
    }
    
    return invCircuit;
  }

  /**
   * Clear all operations
   */
  public clear(): void {
    this.operations = [];
    this.measurements = [];
  }

  // ============================================================================
  // Statistics and Information
  // ============================================================================

  /**
   * Calculate circuit depth
   */
  public getDepth(): number {
    if (this.operations.length === 0) return 0;
    
    const qubitDepths = new Array(this.numQubits).fill(0);
    
    for (const op of this.operations) {
      const maxDepth = Math.max(...op.targetQubits.map(q => qubitDepths[q]));
      for (const q of op.targetQubits) {
        qubitDepths[q] = maxDepth + 1;
      }
    }
    
    return Math.max(...qubitDepths);
  }

  /**
   * Get circuit statistics
   */
  public getStats(): CircuitStats {
    let singleQubitGates = 0;
    let twoQubitGates = 0;
    let multiQubitGates = 0;
    
    for (const op of this.operations) {
      const n = op.gate.getNumQubits();
      if (n === 1) singleQubitGates++;
      else if (n === 2) twoQubitGates++;
      else multiQubitGates++;
    }
    
    return {
      numQubits: this.numQubits,
      depth: this.getDepth(),
      gateCount: this.operations.length,
      singleQubitGates,
      twoQubitGates,
      multiQubitGates,
      measurements: this.measurements.length
    };
  }

  /**
   * Get operations list
   */
  public getOperations(): CircuitOperation[] {
    return [...this.operations];
  }

  /**
   * Get measurements list
   */
  public getMeasurements(): MeasurementOp[] {
    return [...this.measurements];
  }

  // ============================================================================
  // Validation
  // ============================================================================

  /**
   * Validate qubit indices
   */
  private validateQubits(qubits: number[]): void {
    for (const q of qubits) {
      if (q < 0 || q >= this.numQubits) {
        throw new Error(`Qubit index ${q} out of range [0, ${this.numQubits - 1}]`);
      }
    }
  }

  /**
   * Calculate depth for a new operation
   */
  private calculateDepth(targetQubits: number[]): number {
    const qubitDepths = new Array(this.numQubits).fill(0);
    
    for (const op of this.operations) {
      const maxDepth = Math.max(...op.targetQubits.map(q => qubitDepths[q]));
      for (const q of op.targetQubits) {
        qubitDepths[q] = maxDepth + 1;
      }
    }
    
    return Math.max(...targetQubits.map(q => qubitDepths[q])) + 1;
  }

  // ============================================================================
  // Serialization
  // ============================================================================

  /**
   * Generate hash for circuit
   */
  public getHash(): string {
    const opsStr = this.operations.map(op => 
      `${op.gate.getName()}:${op.targetQubits.join(',')}`
    ).join(';');
    
    return HashVerifier.hash(
      `circuit:${this.name}:${this.numQubits}:${opsStr}`
    );
  }

  /**
   * Convert to string representation
   */
  public toString(): string {
    const lines: string[] = [`Circuit: ${this.name} (${this.numQubits} qubits)`];
    
    for (const op of this.operations) {
      const qubits = op.targetQubits.join(', ');
      lines.push(`  ${op.gate.getName()} on q[${qubits}]`);
    }
    
    for (const meas of this.measurements) {
      lines.push(`  Measure q[${meas.qubitIndex}] → c[${meas.classicalBit}] (${meas.basis}-basis)`);
    }
    
    return lines.join('\n');
  }

  /**
   * Draw circuit as ASCII art
   */
  public draw(): string {
    const lines: string[][] = [];
    
    for (let q = 0; q < this.numQubits; q++) {
      lines.push([`q${q}: |0⟩─`]);
    }
    
    for (const op of this.operations) {
      const gateName = op.gate.getName().substring(0, 3);
      
      for (let q = 0; q < this.numQubits; q++) {
        if (op.targetQubits.includes(q)) {
          if (op.targetQubits.length === 1) {
            lines[q].push(`─[${gateName}]─`);
          } else if (q === op.targetQubits[0]) {
            lines[q].push(`─[${gateName}●]─`);
          } else {
            lines[q].push(`─[  ●  ]─`);
          }
        } else {
          lines[q].push(`─────────`);
        }
      }
    }
    
    for (const meas of this.measurements) {
      for (let q = 0; q < this.numQubits; q++) {
        if (q === meas.qubitIndex) {
          lines[q].push(`─[M]→c${meas.classicalBit}`);
        } else {
          lines[q].push(`────────`);
        }
      }
    }
    
    return lines.map(l => l.join('')).join('\n');
  }
}

// ============================================================================
// Circuit Optimizer
// ============================================================================

/**
 * Quantum circuit optimizer
 */
export class CircuitOptimizer {

  /**
   * Optimize a circuit
   */
  public static optimize(circuit: QuantumCircuit, options: OptimizationOptions = {}): QuantumCircuit {
    let optimized = circuit.clone();
    
    if (options.cancelInverses !== false) {
      optimized = this.cancelInverses(optimized);
    }
    
    if (options.removeIdentities !== false) {
      optimized = this.removeIdentities(optimized);
    }
    
    return optimized;
  }

  /**
   * Remove identity gates
   */
  private static removeIdentities(circuit: QuantumCircuit): QuantumCircuit {
    const newCircuit = new QuantumCircuit(circuit.getNumQubits(), circuit.getName());
    
    for (const op of circuit.getOperations()) {
      if (op.gate.getName() !== 'I') {
        newCircuit.apply(op.gate, ...op.targetQubits);
      }
    }
    
    for (const meas of circuit.getMeasurements()) {
      newCircuit.measure(meas.qubitIndex, meas.classicalBit, meas.basis);
    }
    
    return newCircuit;
  }

  /**
   * Cancel adjacent inverse gates
   */
  private static cancelInverses(circuit: QuantumCircuit): QuantumCircuit {
    const operations = circuit.getOperations();
    const cancelled = new Set<number>();
    
    // Find pairs of adjacent inverses
    for (let i = 0; i < operations.length - 1; i++) {
      if (cancelled.has(i)) continue;
      
      const op1 = operations[i];
      
      for (let j = i + 1; j < operations.length; j++) {
        if (cancelled.has(j)) continue;
        
        const op2 = operations[j];
        
        // Check if ops are on same qubits
        if (op1.targetQubits.length !== op2.targetQubits.length) break;
        if (!op1.targetQubits.every((q, idx) => q === op2.targetQubits[idx])) break;
        
        // Check if inverse
        if (this.areInverses(op1.gate, op2.gate)) {
          cancelled.add(i);
          cancelled.add(j);
          break;
        }
        
        // If another gate on same qubits, stop checking
        if (op1.targetQubits.some(q => op2.targetQubits.includes(q))) break;
      }
    }
    
    // Build new circuit without cancelled gates
    const newCircuit = new QuantumCircuit(circuit.getNumQubits(), circuit.getName());
    
    for (let i = 0; i < operations.length; i++) {
      if (!cancelled.has(i)) {
        const op = operations[i];
        newCircuit.apply(op.gate, ...op.targetQubits);
      }
    }
    
    for (const meas of circuit.getMeasurements()) {
      newCircuit.measure(meas.qubitIndex, meas.classicalBit, meas.basis);
    }
    
    return newCircuit;
  }

  /**
   * Check if two gates are inverses of each other
   */
  private static areInverses(g1: Gate, g2: Gate): boolean {
    // Self-inverse gates
    const selfInverse = ['X', 'Y', 'Z', 'H', 'CNOT', 'CX', 'CZ', 'SWAP'];
    if (selfInverse.includes(g1.getName()) && g1.getName() === g2.getName()) {
      return true;
    }
    
    // S and S†
    if ((g1.getName() === 'S' && g2.getName() === 'S†') ||
        (g1.getName() === 'S†' && g2.getName() === 'S')) {
      return true;
    }
    
    // T and T†
    if ((g1.getName() === 'T' && g2.getName() === 'T†') ||
        (g1.getName() === 'T†' && g2.getName() === 'T')) {
      return true;
    }
    
    return false;
  }

  /**
   * Get hash
   */
  public static getHash(): string {
    return HashVerifier.hash('circuit-optimizer');
  }
}

// ============================================================================
// Common Circuit Patterns
// ============================================================================

/**
 * Factory for common quantum circuits
 */
export class CircuitFactory {
  /**
   * Create Bell state preparation circuit
   */
  public static bellState(pair: 0 | 1 | 2 | 3 = 0): QuantumCircuit {
    const circuit = new QuantumCircuit(2, 'bell_state');
    
    // Start with |00⟩
    circuit.h(0);  // Create superposition
    circuit.cx(0, 1);  // Entangle
    
    // Choose which Bell state
    if (pair === 1) circuit.z(0);  // |Φ-⟩
    else if (pair === 2) circuit.x(1);  // |Ψ+⟩
    else if (pair === 3) { circuit.x(1); circuit.z(0); }  // |Ψ-⟩
    
    return circuit;
  }

  /**
   * Create GHZ state preparation circuit
   */
  public static ghzState(numQubits: number): QuantumCircuit {
    const circuit = new QuantumCircuit(numQubits, 'ghz_state');
    
    circuit.h(0);
    for (let i = 1; i < numQubits; i++) {
      circuit.cx(0, i);
    }
    
    return circuit;
  }

  /**
   * Create W state preparation circuit (approximate)
   */
  public static wState(numQubits: number): QuantumCircuit {
    const circuit = new QuantumCircuit(numQubits, 'w_state');
    
    // W state preparation is more complex
    // This is a simplified version
    circuit.x(0);
    
    for (let i = 0; i < numQubits - 1; i++) {
      const angle = Math.acos(Math.sqrt(1 / (numQubits - i)));
      circuit.ry(2 * angle, i);
      circuit.cx(i, i + 1);
    }
    
    return circuit;
  }

  /**
   * Create quantum Fourier transform circuit
   */
  public static qft(numQubits: number): QuantumCircuit {
    const circuit = new QuantumCircuit(numQubits, 'qft');
    
    for (let i = 0; i < numQubits; i++) {
      circuit.h(i);
      
      for (let j = i + 1; j < numQubits; j++) {
        const angle = Math.PI / (2 ** (j - i));
        // Controlled rotation
        circuit.apply(QuantumGatesFactory.controlled(QuantumGatesFactory.Rz(angle)), j, i);
      }
    }
    
    // Swap qubits
    for (let i = 0; i < Math.floor(numQubits / 2); i++) {
      circuit.swap(i, numQubits - 1 - i);
    }
    
    return circuit;
  }

  /**
   * Create inverse QFT circuit
   */
  public static iqft(numQubits: number): QuantumCircuit {
    return CircuitFactory.qft(numQubits).inverse();
  }

  /**
   * Create quantum phase estimation circuit
   */
  public static phaseEstimation(precision: number): QuantumCircuit {
    const circuit = new QuantumCircuit(precision + 1, 'qpe');
    
    // Initialize counting register in superposition
    for (let i = 0; i < precision; i++) {
      circuit.h(i);
    }
    
    // Controlled unitary operations would go here
    // This is a template - actual unitary depends on problem
    
    // Apply inverse QFT to counting register
    // (Simplified - would need to compose with iqft)
    
    return circuit;
  }

  /**
   * Create variational quantum eigensolver ansatz
   */
  public static vqeAnsatz(numQubits: number, depth: number): QuantumCircuit {
    const circuit = new QuantumCircuit(numQubits, 'vqe_ansatz');
    
    for (let d = 0; d < depth; d++) {
      // Rotation layer
      for (let i = 0; i < numQubits; i++) {
        circuit.ry(Math.random() * Math.PI, i);
        circuit.rz(Math.random() * Math.PI, i);
      }
      
      // Entangling layer
      for (let i = 0; i < numQubits - 1; i++) {
        circuit.cx(i, i + 1);
      }
    }
    
    return circuit;
  }

  /**
   * Create random circuit
   */
  public static random(numQubits: number, depth: number): QuantumCircuit {
    const circuit = new QuantumCircuit(numQubits, 'random');
    const gates = [
      () => QuantumGatesFactory.H(),
      () => QuantumGatesFactory.X(),
      () => QuantumGatesFactory.Y(),
      () => QuantumGatesFactory.Z(),
      () => QuantumGatesFactory.T(),
      () => QuantumGatesFactory.S()
    ];
    
    for (let d = 0; d < depth; d++) {
      // Random single-qubit gates
      for (let i = 0; i < numQubits; i++) {
        const gate = gates[Math.floor(Math.random() * gates.length)];
        circuit.apply(gate(), i);
      }
      
      // Random CNOTs
      for (let i = 0; i < numQubits - 1; i++) {
        if (Math.random() > 0.5) {
          circuit.cx(i, i + 1);
        }
      }
    }
    
    return circuit;
  }
}
