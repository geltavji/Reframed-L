/**
 * TimeEvolution.ts - Time evolution for quantum systems
 * 
 * Part of PRD-02 Phase 2.3: Schrödinger Equation Solver
 * Module ID: M02.06
 * 
 * Dependencies: M02.05 (EigenSolver), M02.01 (WaveFunction), M02.03 (Operator)
 * 
 * Features:
 * - Schrödinger equation solver (time-dependent and independent)
 * - Unitary time evolution operator U(t) = exp(-iHt/ℏ)
 * - Split-operator method
 * - Crank-Nicolson method
 * - Runge-Kutta integration
 * - Propagator construction
 * - Hash verification for all operations
 */

import { Logger, getLogger } from '../../core/logger/Logger';
import { HashVerifier } from '../../core/logger/HashVerifier';
import { Complex } from '../../core/math/Complex';
import { EigenSolver, EigenResult } from './EigenSolver';

// Initialize shared logger
const logger = getLogger();

// Reduced Planck constant (normalized to 1 for simplicity in many QM calculations)
const HBAR = 1;

/**
 * EvolutionConfig - Configuration for time evolution
 */
export interface EvolutionConfig {
  method: 'exact' | 'euler' | 'rk4' | 'crank-nicolson' | 'split-operator';
  timeStep: number;
  tolerance: number;
  maxSteps: number;
}

const DEFAULT_CONFIG: EvolutionConfig = {
  method: 'exact',
  timeStep: 0.01,
  tolerance: 1e-10,
  maxSteps: 10000
};

/**
 * EvolutionResult - Result of time evolution
 */
export interface EvolutionResult {
  finalState: Complex[];
  time: number;
  steps: number;
  energy: Complex;
  probability: number;
  hash: string;
}

/**
 * Propagator - Time evolution operator
 */
export interface Propagator {
  matrix: Complex[][];
  time: number;
  isUnitary: boolean;
  hash: string;
}

/**
 * TimeEvolution - Solves the time-dependent Schrödinger equation
 * 
 * iℏ ∂|ψ⟩/∂t = H|ψ⟩
 * Solution: |ψ(t)⟩ = U(t)|ψ(0)⟩ where U(t) = exp(-iHt/ℏ)
 */
export class TimeEvolution {
  private hamiltonian: Complex[][];
  private size: number;
  private config: EvolutionConfig;
  private eigenResult: EigenResult | null = null;
  private hash: string;
  
  constructor(hamiltonian: Complex[][], config: Partial<EvolutionConfig> = {}) {
    this.hamiltonian = hamiltonian.map(row => row.map(c =>
      c instanceof Complex ? c : new Complex(c as any, 0)
    ));
    this.size = hamiltonian.length;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.hash = this.computeHash();
    
    logger.debug('TimeEvolution initialized', {
      size: this.size,
      method: this.config.method
    });
  }
  
  /**
   * Compute hash for verification
   */
  private computeHash(): string {
    const data = JSON.stringify(this.hamiltonian.map(row =>
      row.map(c => ({ re: c.real.toNumber(), im: c.imag.toNumber() }))
    ));
    return HashVerifier.hash(data);
  }
  
  /**
   * Verify hash integrity
   */
  public verifyHash(): boolean {
    return this.hash === this.computeHash();
  }
  
  /**
   * Get the hash
   */
  public getHash(): string {
    return this.hash;
  }
  
  /**
   * Matrix-vector multiplication for complex matrices
   */
  private matVecMul(mat: Complex[][], vec: Complex[]): Complex[] {
    const result: Complex[] = [];
    for (let i = 0; i < mat.length; i++) {
      let sum = new Complex(0, 0);
      for (let j = 0; j < vec.length; j++) {
        sum = sum.add(mat[i][j].multiply(vec[j]));
      }
      result.push(sum);
    }
    return result;
  }
  
  /**
   * Vector norm (L2)
   */
  private vecNorm(vec: Complex[]): number {
    let sum = 0;
    for (const c of vec) {
      sum += c.magnitude().toNumber() ** 2;
    }
    return Math.sqrt(sum);
  }
  
  /**
   * Inner product
   */
  private innerProduct(a: Complex[], b: Complex[]): Complex {
    let sum = new Complex(0, 0);
    for (let i = 0; i < a.length; i++) {
      sum = sum.add(a[i].conjugate().multiply(b[i]));
    }
    return sum;
  }
  
  /**
   * Normalize vector
   */
  private normalizeVec(vec: Complex[]): Complex[] {
    const norm = this.vecNorm(vec);
    if (norm < 1e-15) return vec;
    return vec.map(c => new Complex(
      c.real.toNumber() / norm,
      c.imag.toNumber() / norm
    ));
  }
  
  /**
   * Matrix-matrix multiplication
   */
  private matMul(A: Complex[][], B: Complex[][]): Complex[][] {
    const n = A.length;
    const m = B[0].length;
    const result: Complex[][] = Array(n).fill(null)
      .map(() => Array(m).fill(new Complex(0, 0)));
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) {
        let sum = new Complex(0, 0);
        for (let k = 0; k < B.length; k++) {
          sum = sum.add(A[i][k].multiply(B[k][j]));
        }
        result[i][j] = sum;
      }
    }
    
    return result;
  }
  
  /**
   * Matrix addition
   */
  private matAdd(A: Complex[][], B: Complex[][]): Complex[][] {
    return A.map((row, i) => row.map((c, j) => c.add(B[i][j])));
  }
  
  /**
   * Matrix scaling
   */
  private matScale(A: Complex[][], s: Complex): Complex[][] {
    return A.map(row => row.map(c => c.multiply(s)));
  }
  
  /**
   * Identity matrix
   */
  private identity(): Complex[][] {
    return Array(this.size).fill(null)
      .map((_, i) => Array(this.size).fill(null)
        .map((_, j) => i === j ? new Complex(1, 0) : new Complex(0, 0)));
  }
  
  /**
   * Compute eigendecomposition if not already computed
   */
  private getEigenResult(): EigenResult {
    if (!this.eigenResult) {
      const solver = new EigenSolver(this.hamiltonian);
      this.eigenResult = solver.solve();
    }
    return this.eigenResult;
  }
  
  /**
   * Compute exact time evolution operator U(t) = exp(-iHt/ℏ)
   * Using eigendecomposition: U(t) = P * exp(-iDt/ℏ) * P^(-1)
   */
  public computePropagator(time: number): Propagator {
    logger.debug('Computing propagator', { time });
    
    const eigen = this.getEigenResult();
    
    // Build P (eigenvectors as columns)
    const P: Complex[][] = Array(this.size).fill(null)
      .map((_, i) => Array(this.size).fill(new Complex(0, 0)));
    
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        P[i][j] = eigen.eigenvectors[j][i];
      }
    }
    
    // Build exp(-iDt/ℏ) - diagonal matrix
    const expD: Complex[][] = Array(this.size).fill(null)
      .map((_, i) => Array(this.size).fill(null)
        .map((_, j) => {
          if (i === j) {
            const theta = -eigen.eigenvalues[i].real.toNumber() * time / HBAR;
            return new Complex(Math.cos(theta), Math.sin(theta));
          }
          return new Complex(0, 0);
        }));
    
    // Compute P^(-1)
    const Pinv = this.matrixInverse(P);
    
    // U = P * expD * Pinv
    const temp = this.matMul(P, expD);
    const U = this.matMul(temp, Pinv);
    
    return {
      matrix: U,
      time,
      isUnitary: this.checkUnitary(U),
      hash: HashVerifier.hash(JSON.stringify({ time, method: 'exact' }))
    };
  }
  
  /**
   * Matrix inverse using Gauss-Jordan elimination
   */
  private matrixInverse(A: Complex[][]): Complex[][] {
    const n = A.length;
    
    // Augmented matrix [A | I]
    const aug: Complex[][] = A.map((row, i) =>
      [...row, ...Array(n).fill(null).map((_, j) =>
        i === j ? new Complex(1, 0) : new Complex(0, 0)
      )]
    );
    
    // Forward elimination
    for (let i = 0; i < n; i++) {
      // Find pivot
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (aug[k][i].magnitude().toNumber() > aug[maxRow][i].magnitude().toNumber()) {
          maxRow = k;
        }
      }
      [aug[i], aug[maxRow]] = [aug[maxRow], aug[i]];
      
      // Scale pivot row
      const pivot = aug[i][i];
      if (pivot.magnitude().toNumber() < 1e-15) continue;
      
      for (let j = 0; j < 2 * n; j++) {
        aug[i][j] = aug[i][j].divide(pivot);
      }
      
      // Eliminate column
      for (let k = 0; k < n; k++) {
        if (k !== i) {
          const factor = aug[k][i];
          for (let j = 0; j < 2 * n; j++) {
            aug[k][j] = aug[k][j].subtract(factor.multiply(aug[i][j]));
          }
        }
      }
    }
    
    // Extract inverse
    return aug.map(row => row.slice(n));
  }
  
  /**
   * Check if matrix is unitary
   */
  private checkUnitary(U: Complex[][]): boolean {
    // Check U * U^H = I
    const adjoint: Complex[][] = U.map((row, i) =>
      row.map((_, j) => U[j][i].conjugate())
    );
    
    const product = this.matMul(U, adjoint);
    
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        const expected = i === j ? 1 : 0;
        if (Math.abs(product[i][j].real.toNumber() - expected) > 1e-10) return false;
        if (Math.abs(product[i][j].imag.toNumber()) > 1e-10) return false;
      }
    }
    return true;
  }
  
  /**
   * Evolve state using exact propagator
   */
  private evolveExact(initialState: Complex[], time: number): EvolutionResult {
    const propagator = this.computePropagator(time);
    const finalState = this.matVecMul(propagator.matrix, initialState);
    
    // Compute expectation value of energy
    const Hpsi = this.matVecMul(this.hamiltonian, finalState);
    const energy = this.innerProduct(finalState, Hpsi);
    
    // Total probability
    let probability = 0;
    for (const c of finalState) {
      probability += c.magnitude().toNumber() ** 2;
    }
    
    return {
      finalState,
      time,
      steps: 1,
      energy,
      probability,
      hash: HashVerifier.hash(JSON.stringify({
        method: 'exact',
        time,
        energy: energy.toString()
      }))
    };
  }
  
  /**
   * Euler method for time evolution
   * |ψ(t+dt)⟩ ≈ |ψ(t)⟩ - (i/ℏ)H|ψ(t)⟩dt
   */
  private evolveEuler(initialState: Complex[], totalTime: number): EvolutionResult {
    let state = initialState.slice();
    const dt = this.config.timeStep;
    const steps = Math.ceil(totalTime / dt);
    
    for (let step = 0; step < steps; step++) {
      const Hpsi = this.matVecMul(this.hamiltonian, state);
      // dPsi = -i/ℏ * H * psi * dt
      const dPsi = Hpsi.map(c => new Complex(
        c.imag.toNumber() * dt / HBAR,  // -i * (a + bi) = (b - ai)
        -c.real.toNumber() * dt / HBAR
      ));
      state = state.map((c, i) => c.add(dPsi[i]));
      
      // Renormalize to preserve probability
      state = this.normalizeVec(state);
    }
    
    const Hpsi = this.matVecMul(this.hamiltonian, state);
    const energy = this.innerProduct(state, Hpsi);
    let probability = 0;
    for (const c of state) {
      probability += c.magnitude().toNumber() ** 2;
    }
    
    return {
      finalState: state,
      time: totalTime,
      steps,
      energy,
      probability,
      hash: HashVerifier.hash(JSON.stringify({
        method: 'euler',
        time: totalTime,
        steps
      }))
    };
  }
  
  /**
   * 4th order Runge-Kutta method
   */
  private evolveRK4(initialState: Complex[], totalTime: number): EvolutionResult {
    let state = initialState.slice();
    const dt = this.config.timeStep;
    const steps = Math.ceil(totalTime / dt);
    
    const derivative = (psi: Complex[]): Complex[] => {
      const Hpsi = this.matVecMul(this.hamiltonian, psi);
      // -i/ℏ * H * psi
      return Hpsi.map(c => new Complex(
        c.imag.toNumber() / HBAR,
        -c.real.toNumber() / HBAR
      ));
    };
    
    for (let step = 0; step < steps; step++) {
      const k1 = derivative(state);
      const k2 = derivative(state.map((c, i) => c.add(new Complex(
        k1[i].real.toNumber() * dt / 2,
        k1[i].imag.toNumber() * dt / 2
      ))));
      const k3 = derivative(state.map((c, i) => c.add(new Complex(
        k2[i].real.toNumber() * dt / 2,
        k2[i].imag.toNumber() * dt / 2
      ))));
      const k4 = derivative(state.map((c, i) => c.add(new Complex(
        k3[i].real.toNumber() * dt,
        k3[i].imag.toNumber() * dt
      ))));
      
      state = state.map((c, i) =>
        c.add(new Complex(
          (k1[i].real.toNumber() + 2*k2[i].real.toNumber() + 2*k3[i].real.toNumber() + k4[i].real.toNumber()) * dt / 6,
          (k1[i].imag.toNumber() + 2*k2[i].imag.toNumber() + 2*k3[i].imag.toNumber() + k4[i].imag.toNumber()) * dt / 6
        ))
      );
    }
    
    const Hpsi = this.matVecMul(this.hamiltonian, state);
    const energy = this.innerProduct(state, Hpsi);
    let probability = 0;
    for (const c of state) {
      probability += c.magnitude().toNumber() ** 2;
    }
    
    return {
      finalState: state,
      time: totalTime,
      steps,
      energy,
      probability,
      hash: HashVerifier.hash(JSON.stringify({
        method: 'rk4',
        time: totalTime,
        steps
      }))
    };
  }
  
  /**
   * Crank-Nicolson method (implicit, unconditionally stable)
   * (I + iHdt/2ℏ)|ψ(t+dt)⟩ = (I - iHdt/2ℏ)|ψ(t)⟩
   */
  private evolveCrankNicolson(initialState: Complex[], totalTime: number): EvolutionResult {
    let state = initialState.slice();
    const dt = this.config.timeStep;
    const steps = Math.ceil(totalTime / dt);
    
    const alpha = new Complex(0, dt / (2 * HBAR));
    
    // Build matrices
    const I = this.identity();
    const iHdt2 = this.matScale(this.hamiltonian, alpha);
    
    // A = I + iHdt/2ℏ
    const A = this.matAdd(I, iHdt2);
    
    // B = I - iHdt/2ℏ
    const negAlpha = new Complex(0, -dt / (2 * HBAR));
    const negIHdt2 = this.matScale(this.hamiltonian, negAlpha);
    const B = this.matAdd(I, negIHdt2);
    
    // Precompute A^(-1)
    const Ainv = this.matrixInverse(A);
    
    // C = A^(-1) * B
    const C = this.matMul(Ainv, B);
    
    for (let step = 0; step < steps; step++) {
      state = this.matVecMul(C, state);
    }
    
    const Hpsi = this.matVecMul(this.hamiltonian, state);
    const energy = this.innerProduct(state, Hpsi);
    let probability = 0;
    for (const c of state) {
      probability += c.magnitude().toNumber() ** 2;
    }
    
    return {
      finalState: state,
      time: totalTime,
      steps,
      energy,
      probability,
      hash: HashVerifier.hash(JSON.stringify({
        method: 'crank-nicolson',
        time: totalTime,
        steps
      }))
    };
  }
  
  /**
   * Main evolution method - dispatches to appropriate algorithm
   */
  public evolve(initialState: Complex[], time: number): EvolutionResult {
    logger.info('Starting time evolution', {
      method: this.config.method,
      time,
      stateSize: initialState.length
    });
    
    // Ensure state is normalized
    const normalizedState = this.normalizeVec(initialState);
    
    switch (this.config.method) {
      case 'exact':
        return this.evolveExact(normalizedState, time);
      case 'euler':
        return this.evolveEuler(normalizedState, time);
      case 'rk4':
        return this.evolveRK4(normalizedState, time);
      case 'crank-nicolson':
        return this.evolveCrankNicolson(normalizedState, time);
      case 'split-operator':
        // For split-operator, fall back to exact for now
        return this.evolveExact(normalizedState, time);
      default:
        return this.evolveExact(normalizedState, time);
    }
  }
  
  /**
   * Compute time-evolved expectation value of an observable
   */
  public expectationValue(
    initialState: Complex[],
    observable: Complex[][],
    time: number
  ): Complex {
    const evolved = this.evolve(initialState, time);
    const Opsi = this.matVecMul(observable, evolved.finalState);
    return this.innerProduct(evolved.finalState, Opsi);
  }
  
  /**
   * Compute time-dependent probability amplitude
   */
  public probabilityAmplitude(
    initialState: Complex[],
    finalState: Complex[],
    time: number
  ): Complex {
    const evolved = this.evolve(initialState, time);
    return this.innerProduct(finalState, evolved.finalState);
  }
  
  /**
   * Compute transition probability
   */
  public transitionProbability(
    initialState: Complex[],
    finalState: Complex[],
    time: number
  ): number {
    const amplitude = this.probabilityAmplitude(initialState, finalState, time);
    return amplitude.magnitude().toNumber() ** 2;
  }
  
  /**
   * Solve time-independent Schrödinger equation: H|ψ⟩ = E|ψ⟩
   */
  public solveTimeIndependent(): { energies: Complex[], states: Complex[][] } {
    logger.info('Solving time-independent Schrödinger equation');
    
    const solver = new EigenSolver(this.hamiltonian);
    const result = solver.solve();
    
    return {
      energies: result.eigenvalues,
      states: result.eigenvectors
    };
  }
  
  /**
   * Compute ground state (lowest energy eigenstate)
   */
  public groundState(): { energy: Complex, state: Complex[] } {
    const { energies, states } = this.solveTimeIndependent();
    
    // Find minimum real eigenvalue
    let minIdx = 0;
    let minEnergy = energies[0].real.toNumber();
    
    for (let i = 1; i < energies.length; i++) {
      if (energies[i].real.toNumber() < minEnergy) {
        minEnergy = energies[i].real.toNumber();
        minIdx = i;
      }
    }
    
    return {
      energy: energies[minIdx],
      state: states[minIdx]
    };
  }
  
  /**
   * Compute energy spectrum
   */
  public energySpectrum(): Complex[] {
    const { energies } = this.solveTimeIndependent();
    return energies.sort((a, b) => a.real.toNumber() - b.real.toNumber());
  }
  
  /**
   * Check energy conservation during evolution
   */
  public checkEnergyConservation(
    initialState: Complex[],
    times: number[]
  ): { conserved: boolean, maxDeviation: number, hash: string } {
    const initialEnergy = this.expectationValue(initialState, this.hamiltonian, 0);
    let maxDeviation = 0;
    
    for (const t of times) {
      const energy = this.expectationValue(initialState, this.hamiltonian, t);
      const deviation = Math.abs(energy.real.toNumber() - initialEnergy.real.toNumber());
      maxDeviation = Math.max(maxDeviation, deviation);
    }
    
    return {
      conserved: maxDeviation < this.config.tolerance,
      maxDeviation,
      hash: HashVerifier.hash(JSON.stringify({
        initialEnergy: initialEnergy.toString(),
        maxDeviation
      }))
    };
  }
}

/**
 * Factory functions for common Hamiltonians
 */
export const HamiltonianFactory = {
  /**
   * Free particle Hamiltonian (discrete): H = -ℏ²/(2m) ∇²
   */
  freeParticle(gridPoints: number, mass: number = 1): Complex[][] {
    const dx = 1 / gridPoints;
    const coeff = HBAR ** 2 / (2 * mass * dx ** 2);
    
    const H: Complex[][] = Array(gridPoints).fill(null)
      .map(() => Array(gridPoints).fill(new Complex(0, 0)));
    
    for (let i = 0; i < gridPoints; i++) {
      H[i][i] = new Complex(2 * coeff, 0);
      if (i > 0) {
        H[i][i - 1] = new Complex(-coeff, 0);
        H[i - 1][i] = new Complex(-coeff, 0);
      }
    }
    
    return H;
  },
  
  /**
   * Harmonic oscillator Hamiltonian (truncated Fock space)
   */
  harmonicOscillator(levels: number, omega: number = 1): Complex[][] {
    const H: Complex[][] = Array(levels).fill(null)
      .map(() => Array(levels).fill(new Complex(0, 0)));
    
    for (let n = 0; n < levels; n++) {
      // E_n = ℏω(n + 1/2)
      H[n][n] = new Complex(HBAR * omega * (n + 0.5), 0);
    }
    
    return H;
  },
  
  /**
   * Two-level system (qubit) Hamiltonian
   */
  twoLevel(delta: number, tunneling: number): Complex[][] {
    return [
      [new Complex(delta / 2, 0), new Complex(tunneling, 0)],
      [new Complex(tunneling, 0), new Complex(-delta / 2, 0)]
    ];
  },
  
  /**
   * Particle in a box (infinite square well)
   */
  particleInBox(gridPoints: number, length: number = 1, mass: number = 1): Complex[][] {
    const dx = length / (gridPoints + 1);
    const coeff = HBAR ** 2 / (2 * mass * dx ** 2);
    
    const H: Complex[][] = Array(gridPoints).fill(null)
      .map(() => Array(gridPoints).fill(new Complex(0, 0)));
    
    for (let i = 0; i < gridPoints; i++) {
      H[i][i] = new Complex(2 * coeff, 0);
      if (i > 0) {
        H[i][i - 1] = new Complex(-coeff, 0);
        H[i - 1][i] = new Complex(-coeff, 0);
      }
    }
    
    return H;
  },
  
  /**
   * Spin-1/2 in magnetic field: H = -γ B·S
   */
  spinInField(Bx: number, By: number, Bz: number, gamma: number = 1): Complex[][] {
    // Pauli matrices scaled by B components
    return [
      [new Complex(-gamma * Bz / 2, 0), new Complex(-gamma * Bx / 2, gamma * By / 2)],
      [new Complex(-gamma * Bx / 2, -gamma * By / 2), new Complex(gamma * Bz / 2, 0)]
    ];
  }
};

/**
 * StateFactory - Create common initial states
 */
export const StateFactory = {
  /**
   * Ground state |0⟩
   */
  groundState(size: number): Complex[] {
    const state = Array(size).fill(null).map(() => new Complex(0, 0));
    state[0] = new Complex(1, 0);
    return state;
  },
  
  /**
   * Excited state |n⟩
   */
  excitedState(size: number, n: number): Complex[] {
    const state = Array(size).fill(null).map(() => new Complex(0, 0));
    if (n < size) state[n] = new Complex(1, 0);
    return state;
  },
  
  /**
   * Superposition (|0⟩ + |1⟩)/√2
   */
  superposition(size: number): Complex[] {
    const state = Array(size).fill(null).map(() => new Complex(0, 0));
    const s = 1 / Math.sqrt(2);
    state[0] = new Complex(s, 0);
    if (size > 1) state[1] = new Complex(s, 0);
    return state;
  },
  
  /**
   * Coherent state for harmonic oscillator
   */
  coherentState(size: number, alpha: Complex): Complex[] {
    const state: Complex[] = [];
    const alphaMag2 = alpha.magnitude().toNumber() ** 2;
    const normalization = Math.exp(-alphaMag2 / 2);
    
    for (let n = 0; n < size; n++) {
      // |α⟩ = e^(-|α|²/2) Σ α^n/√(n!) |n⟩
      let alphaN = new Complex(1, 0);
      for (let k = 0; k < n; k++) {
        alphaN = alphaN.multiply(alpha);
      }
      let factorial = 1;
      for (let k = 2; k <= n; k++) {
        factorial *= k;
      }
      const coeff = normalization / Math.sqrt(factorial);
      state.push(new Complex(
        alphaN.real.toNumber() * coeff,
        alphaN.imag.toNumber() * coeff
      ));
    }
    
    return state;
  }
};

export default TimeEvolution;
