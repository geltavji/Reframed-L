/**
 * QuantumHardware - PRD-15 Phase 15.5
 * Quantum hardware abstraction and noise modeling
 */

import { Logger } from '../core/logger/Logger';
import { HashVerifier } from '../core/logger/HashVerifier';

// Hardware types
export type HardwareType = 
  | 'superconducting'
  | 'ion_trap'
  | 'photonic'
  | 'neutral_atom'
  | 'topological'
  | 'silicon_spin';

// Hardware abstraction
export interface HardwareAbstraction {
  id: string;
  name: string;
  type: HardwareType;
  qubits: number;
  connectivity: string;
  gateSet: string[];
  t1Time: number; // microseconds
  t2Time: number; // microseconds
  gateError: number;
  readoutError: number;
  hash: string;
}

// Noise model
export interface NoiseModel {
  id: string;
  hardwareId: string;
  depolarizing: number;
  amplitude_damping: number;
  phase_damping: number;
  measurement_error: number;
  crosstalk: number;
  hash: string;
}

// Calibration tools
export interface CalibrationResult {
  hardwareId: string;
  timestamp: Date;
  qubitFrequencies: number[];
  gateParameters: Record<string, number>;
  readoutFidelity: number[];
  overall_fidelity: number;
  hash: string;
}

/**
 * QuantumHardware - Main quantum hardware class
 */
export class QuantumHardware {
  private logger: Logger;
  private hardware: Map<string, HardwareAbstraction> = new Map();
  private noiseModels: Map<string, NoiseModel> = new Map();
  private hardwareCount: number = 0;

  constructor() {
    this.logger = Logger.getInstance();
    this.initializeHardware();
  }

  private initializeHardware(): void {
    // IBM Quantum (Superconducting)
    this.createHardware({
      name: 'IBM Quantum Eagle (127 qubits)',
      type: 'superconducting',
      qubits: 127,
      connectivity: 'Heavy-hex',
      gateSet: ['X', 'SX', 'RZ', 'CNOT'],
      t1Time: 100,
      t2Time: 80,
      gateError: 0.001,
      readoutError: 0.01
    });

    // Google Sycamore
    this.createHardware({
      name: 'Google Sycamore (72 qubits)',
      type: 'superconducting',
      qubits: 72,
      connectivity: 'Grid',
      gateSet: ['X', 'Y', 'Z', 'H', 'T', 'iSWAP', 'fSim'],
      t1Time: 15,
      t2Time: 10,
      gateError: 0.005,
      readoutError: 0.03
    });

    // IonQ Trapped Ion
    this.createHardware({
      name: 'IonQ Aria (25 qubits)',
      type: 'ion_trap',
      qubits: 25,
      connectivity: 'All-to-all',
      gateSet: ['X', 'Y', 'Z', 'H', 'RXX', 'RYY', 'RZZ'],
      t1Time: 10000000,
      t2Time: 200000,
      gateError: 0.005,
      readoutError: 0.005
    });

    // Xanadu Photonic
    this.createHardware({
      name: 'Xanadu Borealis (216 modes)',
      type: 'photonic',
      qubits: 216,
      connectivity: 'Programmable',
      gateSet: ['Squeezing', 'Displacement', 'Rotation', 'Beamsplitter'],
      t1Time: 1,
      t2Time: 0.001,
      gateError: 0.01,
      readoutError: 0.05
    });

    // Neutral Atom
    this.createHardware({
      name: 'QuEra Aquila (256 atoms)',
      type: 'neutral_atom',
      qubits: 256,
      connectivity: 'Reconfigurable',
      gateSet: ['X', 'Y', 'Z', 'CZ', 'Global'],
      t1Time: 1000,
      t2Time: 100,
      gateError: 0.01,
      readoutError: 0.02
    });

    // Silicon Spin
    this.createHardware({
      name: 'Intel Tunnel Falls (12 qubits)',
      type: 'silicon_spin',
      qubits: 12,
      connectivity: 'Linear',
      gateSet: ['X', 'Y', 'Z', 'H', 'CNOT'],
      t1Time: 1000,
      t2Time: 500,
      gateError: 0.01,
      readoutError: 0.05
    });
  }

  private createHardware(config: Omit<HardwareAbstraction, 'id' | 'hash'>): void {
    const id = `hw-${++this.hardwareCount}`;
    
    const hw: HardwareAbstraction = {
      id,
      ...config,
      hash: ''
    };
    hw.hash = HashVerifier.hash(JSON.stringify({ ...hw, hash: '' }));

    this.hardware.set(id, hw);

    // Create corresponding noise model
    this.createNoiseModel(id, config.gateError, config.readoutError, config.t1Time, config.t2Time);

    this.logger.info('Hardware abstraction created', {
      id,
      name: config.name,
      type: config.type,
      qubits: config.qubits,
      hash: hw.hash
    });
  }

  private createNoiseModel(hardwareId: string, gateError: number, readoutError: number, t1: number, t2: number): void {
    const noiseModel: NoiseModel = {
      id: `noise-${hardwareId}`,
      hardwareId,
      depolarizing: gateError * 0.5,
      amplitude_damping: 1 / t1,
      phase_damping: (1 / t2) - (1 / (2 * t1)),
      measurement_error: readoutError,
      crosstalk: gateError * 0.1,
      hash: ''
    };
    noiseModel.hash = HashVerifier.hash(JSON.stringify({ ...noiseModel, hash: '' }));

    this.noiseModels.set(noiseModel.id, noiseModel);

    this.logger.info('Noise model created', {
      id: noiseModel.id,
      hardwareId,
      hash: noiseModel.hash
    });
  }

  /**
   * Run calibration
   */
  calibrate(hardwareId: string): CalibrationResult | null {
    const hw = this.hardware.get(hardwareId);
    if (!hw) return null;

    // Simulate calibration
    const qubitFrequencies = Array(hw.qubits).fill(0).map(() => 5.0 + Math.random() * 0.5);
    const readoutFidelity = Array(hw.qubits).fill(0).map(() => 1 - hw.readoutError * (0.8 + Math.random() * 0.4));
    const overall_fidelity = readoutFidelity.reduce((a, b) => a + b, 0) / hw.qubits;

    const result: CalibrationResult = {
      hardwareId,
      timestamp: new Date(),
      qubitFrequencies,
      gateParameters: {
        x_amplitude: 0.25,
        x_duration: 35,
        cnot_duration: 300,
        readout_duration: 1000
      },
      readoutFidelity,
      overall_fidelity,
      hash: ''
    };
    result.hash = HashVerifier.hash(JSON.stringify({ ...result, hash: '' }));

    this.logger.proof('Calibration complete', {
      hardwareId,
      qubits: hw.qubits,
      overall_fidelity,
      hash: result.hash
    });

    return result;
  }

  /**
   * Get circuit depth limit
   */
  getCircuitDepthLimit(hardwareId: string): number {
    const hw = this.hardware.get(hardwareId);
    if (!hw) return 0;

    // Depth limited by coherence time and gate time
    const avgGateTime = 0.1; // microseconds
    return Math.floor(hw.t2Time / avgGateTime);
  }

  /**
   * Check hardware availability
   */
  checkAvailability(hardwareId: string): { available: boolean; queueLength: number } {
    const hw = this.hardware.get(hardwareId);
    if (!hw) return { available: false, queueLength: 0 };

    // Simulate availability
    return {
      available: Math.random() > 0.3,
      queueLength: Math.floor(Math.random() * 100)
    };
  }

  /**
   * Get all hardware
   */
  getAllHardware(): HardwareAbstraction[] {
    return Array.from(this.hardware.values());
  }

  /**
   * Get noise model
   */
  getNoiseModel(hardwareId: string): NoiseModel | undefined {
    return this.noiseModels.get(`noise-${hardwareId}`);
  }

  /**
   * Get all noise models
   */
  getAllNoiseModels(): NoiseModel[] {
    return Array.from(this.noiseModels.values());
  }

  /**
   * Get hash
   */
  getHash(): string {
    return HashVerifier.hash(JSON.stringify({
      hardwareCount: this.hardware.size,
      noiseModelCount: this.noiseModels.size
    }));
  }
}

/**
 * Factory for creating QuantumHardware
 */
export class QuantumHardwareFactory {
  static createDefault(): QuantumHardware {
    return new QuantumHardware();
  }
}
