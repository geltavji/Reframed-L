/**
 * StringTheory.ts - Phase 5.4: String Theory Elements
 * 
 * Implements basic string theory concepts including:
 * - String worldsheet geometry
 * - Vibrational modes (open/closed strings)
 * - String spectrum and mass formula
 * - Polyakov action
 * - Conformal field theory on worldsheet
 * - T-duality and compactification
 * 
 * @module StringTheory
 * @version 1.0.0
 */

import { createHash } from 'crypto';

// Physical constants for string theory
const PLANCK_LENGTH = 1.616255e-35; // meters
const HBAR = 1.054571817e-34; // J⋅s
const C = 299792458; // m/s

/**
 * Generate SHA-256 hash for verification
 */
function generateHash(data: string): string {
  return createHash('sha256').update(data).digest('hex').substring(0, 16);
}

/**
 * StringConstants - Fundamental constants for string theory
 */
export class StringConstants {
  /** String length scale l_s = √(α') */
  static readonly STRING_LENGTH = PLANCK_LENGTH * 10; // ~10 Planck lengths typical
  
  /** Regge slope parameter α' = l_s² */
  static readonly REGGE_SLOPE = StringConstants.STRING_LENGTH ** 2;
  
  /** String tension T = 1/(2πα') */
  static readonly STRING_TENSION = 1 / (2 * Math.PI * StringConstants.REGGE_SLOPE);
  
  /** Critical dimension for bosonic strings */
  static readonly BOSONIC_CRITICAL_DIM = 26;
  
  /** Critical dimension for superstrings */
  static readonly SUPERSTRING_CRITICAL_DIM = 10;
  
  /** Planck mass scale */
  static readonly PLANCK_MASS = Math.sqrt(HBAR * C / (6.674e-11));
  
  static getHash(): string {
    return generateHash(`StringConstants:${this.STRING_LENGTH}:${this.REGGE_SLOPE}`);
  }
}

/**
 * WorldsheetPoint - A point on the string worldsheet
 */
export interface WorldsheetPoint {
  tau: number;   // Worldsheet time (proper time along string)
  sigma: number; // Spatial coordinate along string (0 to π for open, 0 to 2π for closed)
}

/**
 * SpacetimePoint - Target space coordinate
 */
export interface SpacetimePoint {
  coordinates: number[]; // X^μ coordinates in target space
  dimension: number;
}

/**
 * StringType - Open or closed string
 */
export type StringType = 'open' | 'closed';

/**
 * StringWorldsheet - Represents the 2D worldsheet swept by a string
 * 
 * The worldsheet is parameterized by (τ, σ) where:
 * - τ: worldsheet time
 * - σ: spatial coordinate along string
 */
export class StringWorldsheet {
  private readonly stringType: StringType;
  private readonly targetDimension: number;
  private readonly stringLength: number;
  private embedding: Map<string, number[]>; // Maps worldsheet coords to target space
  
  constructor(
    stringType: StringType = 'closed',
    targetDimension: number = 26,
    stringLength: number = StringConstants.STRING_LENGTH
  ) {
    this.stringType = stringType;
    this.targetDimension = targetDimension;
    this.stringLength = stringLength;
    this.embedding = new Map();
  }
  
  /**
   * Get the string type
   */
  getStringType(): StringType {
    return this.stringType;
  }
  
  /**
   * Get target space dimension
   */
  getTargetDimension(): number {
    return this.targetDimension;
  }
  
  /**
   * Get the sigma range for this string type
   */
  getSigmaRange(): [number, number] {
    return this.stringType === 'open' ? [0, Math.PI] : [0, 2 * Math.PI];
  }
  
  /**
   * Set embedding coordinate X^μ(τ, σ)
   */
  setEmbedding(tau: number, sigma: number, coordinates: number[]): void {
    if (coordinates.length !== this.targetDimension) {
      throw new Error(`Coordinates must have ${this.targetDimension} components`);
    }
    const key = `${tau.toFixed(6)},${sigma.toFixed(6)}`;
    this.embedding.set(key, [...coordinates]);
  }
  
  /**
   * Get embedding coordinate X^μ(τ, σ)
   */
  getEmbedding(tau: number, sigma: number): number[] | undefined {
    const key = `${tau.toFixed(6)},${sigma.toFixed(6)}`;
    return this.embedding.get(key);
  }
  
  /**
   * Calculate induced metric on worldsheet (pullback of target metric)
   * h_αβ = ∂_α X^μ ∂_β X_μ
   */
  inducedMetric(tau: number, sigma: number, epsilon: number = 1e-6): number[][] {
    const X = this.getEmbedding(tau, sigma);
    const X_tau = this.getEmbedding(tau + epsilon, sigma);
    const X_sigma = this.getEmbedding(tau, sigma + epsilon);
    
    if (!X || !X_tau || !X_sigma) {
      // Return flat metric if embedding not defined
      return [[-1, 0], [0, 1]];
    }
    
    // Calculate partial derivatives
    const dX_dtau = X_tau.map((x, i) => (x - X[i]) / epsilon);
    const dX_dsigma = X_sigma.map((x, i) => (x - X[i]) / epsilon);
    
    // Induced metric components (Minkowski signature in target space)
    // h_ττ = -Ẋ·Ẋ (timelike)
    // h_σσ = X'·X' (spacelike)
    // h_τσ = Ẋ·X'
    const h_tt = -this.dotProduct(dX_dtau, dX_dtau);
    const h_ss = this.dotProduct(dX_dsigma, dX_dsigma);
    const h_ts = this.dotProduct(dX_dtau, dX_dsigma);
    
    return [[h_tt, h_ts], [h_ts, h_ss]];
  }
  
  /**
   * Calculate the Nambu-Goto action
   * S_NG = -T ∫ dτ dσ √(-det(h_αβ))
   */
  nambuGotoAction(tauRange: [number, number], steps: number = 100): number {
    const [tauMin, tauMax] = tauRange;
    const [sigmaMin, sigmaMax] = this.getSigmaRange();
    
    const dtau = (tauMax - tauMin) / steps;
    const dsigma = (sigmaMax - sigmaMin) / steps;
    
    let action = 0;
    
    for (let i = 0; i < steps; i++) {
      for (let j = 0; j < steps; j++) {
        const tau = tauMin + i * dtau;
        const sigma = sigmaMin + j * dsigma;
        
        const h = this.inducedMetric(tau, sigma);
        const det = h[0][0] * h[1][1] - h[0][1] * h[1][0];
        
        if (det < 0) {
          action += Math.sqrt(-det) * dtau * dsigma;
        }
      }
    }
    
    return -StringConstants.STRING_TENSION * action;
  }
  
  /**
   * Dot product with Minkowski metric
   */
  private dotProduct(v1: number[], v2: number[]): number {
    let result = -v1[0] * v2[0]; // Timelike component
    for (let i = 1; i < v1.length; i++) {
      result += v1[i] * v2[i]; // Spacelike components
    }
    return result;
  }
  
  /**
   * Generate hash for verification
   */
  getHash(): string {
    return generateHash(`Worldsheet:${this.stringType}:${this.targetDimension}:${this.embedding.size}`);
  }
}

/**
 * VibrationMode - Represents a vibrational mode of the string
 * 
 * For closed strings: α_n (right-moving) and α̃_n (left-moving)
 * For open strings: α_n only
 */
export interface VibrationMode {
  n: number;           // Mode number (n > 0 for creation, n < 0 for annihilation)
  mu: number;          // Spacetime index
  amplitude: number;   // Mode amplitude
  isLeftMoving: boolean; // For closed strings: true = α̃, false = α
}

/**
 * StringMode - Class representing string oscillation modes
 */
export class StringMode {
  private readonly stringType: StringType;
  private readonly dimension: number;
  private modes: VibrationMode[];
  
  constructor(stringType: StringType = 'closed', dimension: number = 26) {
    this.stringType = stringType;
    this.dimension = dimension;
    this.modes = [];
  }
  
  /**
   * Add a vibrational mode
   */
  addMode(n: number, mu: number, amplitude: number, isLeftMoving: boolean = false): void {
    if (mu < 0 || mu >= this.dimension) {
      throw new Error(`Spacetime index must be 0 to ${this.dimension - 1}`);
    }
    if (this.stringType === 'open' && isLeftMoving) {
      throw new Error('Open strings do not have independent left-moving modes');
    }
    
    this.modes.push({ n, mu, amplitude, isLeftMoving });
  }
  
  /**
   * Get all modes
   */
  getModes(): VibrationMode[] {
    return [...this.modes];
  }
  
  /**
   * Get modes by spacetime index
   */
  getModesByIndex(mu: number): VibrationMode[] {
    return this.modes.filter(m => m.mu === mu);
  }
  
  /**
   * Calculate the level number N (occupation number)
   * N = Σ n·N_n where N_n is the number of oscillators in mode n
   */
  levelNumber(rightMoving: boolean = true): number {
    let N = 0;
    for (const mode of this.modes) {
      if (mode.n > 0) { // Only count creation operators
        if (this.stringType === 'closed') {
          if ((rightMoving && !mode.isLeftMoving) || (!rightMoving && mode.isLeftMoving)) {
            N += mode.n;
          }
        } else {
          N += mode.n;
        }
      }
    }
    return N;
  }
  
  /**
   * Check level matching condition for closed strings
   * N = Ñ (level matching)
   */
  isLevelMatched(): boolean {
    if (this.stringType === 'open') return true;
    return this.levelNumber(true) === this.levelNumber(false);
  }
  
  /**
   * Clear all modes
   */
  clear(): void {
    this.modes = [];
  }
  
  getHash(): string {
    return generateHash(`StringMode:${this.stringType}:${this.modes.length}`);
  }
}

/**
 * StringState - Quantum state of a string
 */
export class StringState {
  private readonly stringType: StringType;
  private readonly dimension: number;
  private momentum: number[]; // Center of mass momentum p^μ
  private modes: StringMode;
  private readonly reggeSlopeAlphaPrime: number;
  
  constructor(
    stringType: StringType = 'closed',
    dimension: number = 26,
    reggeSlopeAlphaPrime: number = StringConstants.REGGE_SLOPE
  ) {
    this.stringType = stringType;
    this.dimension = dimension;
    this.reggeSlopeAlphaPrime = reggeSlopeAlphaPrime;
    this.momentum = new Array(dimension).fill(0);
    this.modes = new StringMode(stringType, dimension);
  }
  
  /**
   * Set center of mass momentum
   */
  setMomentum(momentum: number[]): void {
    if (momentum.length !== this.dimension) {
      throw new Error(`Momentum must have ${this.dimension} components`);
    }
    this.momentum = [...momentum];
  }
  
  /**
   * Get center of mass momentum
   */
  getMomentum(): number[] {
    return [...this.momentum];
  }
  
  /**
   * Add oscillator excitation
   */
  addExcitation(n: number, mu: number, amplitude: number = 1, isLeftMoving: boolean = false): void {
    this.modes.addMode(n, mu, amplitude, isLeftMoving);
  }
  
  /**
   * Get the oscillator modes
   */
  getModes(): StringMode {
    return this.modes;
  }
  
  /**
   * Calculate mass squared using the mass-shell condition
   * 
   * For closed bosonic string:
   * M² = (2/α')(N + Ñ - 2)
   * 
   * For open bosonic string:
   * M² = (1/α')(N - 1)
   */
  massSquared(): number {
    const N = this.modes.levelNumber(true);
    
    if (this.stringType === 'closed') {
      const N_tilde = this.modes.levelNumber(false);
      // a = 1 for bosonic string (normal ordering constant)
      return (2 / this.reggeSlopeAlphaPrime) * (N + N_tilde - 2);
    } else {
      // Open string
      return (1 / this.reggeSlopeAlphaPrime) * (N - 1);
    }
  }
  
  /**
   * Calculate mass (can be imaginary for tachyon)
   */
  mass(): number {
    const m2 = this.massSquared();
    if (m2 >= 0) {
      return Math.sqrt(m2);
    } else {
      // Tachyonic state
      return -Math.sqrt(-m2); // Return negative to indicate tachyon
    }
  }
  
  /**
   * Check if state is tachyonic (M² < 0)
   */
  isTachyonic(): boolean {
    return this.massSquared() < 0;
  }
  
  /**
   * Check if state is massless (M² = 0)
   */
  isMassless(): boolean {
    return Math.abs(this.massSquared()) < 1e-30;
  }
  
  /**
   * Check level matching for closed strings
   */
  isPhysical(): boolean {
    if (this.stringType === 'open') return true;
    return this.modes.isLevelMatched();
  }
  
  /**
   * Get spin (for massless states, determined by polarization)
   */
  getSpin(): number {
    const N = this.modes.levelNumber(true);
    if (this.stringType === 'closed') {
      // Graviton at N = Ñ = 1 has spin 2
      if (N === 1 && this.modes.isLevelMatched()) return 2;
    } else {
      // Photon at N = 1 has spin 1
      if (N === 1) return 1;
    }
    return N; // Generic case
  }
  
  getHash(): string {
    return generateHash(`StringState:${this.stringType}:${this.massSquared()}`);
  }
}

/**
 * StringSpectrum - Represents the spectrum of string states
 */
export class StringSpectrum {
  private readonly stringType: StringType;
  private readonly dimension: number;
  private readonly reggeSlopeAlphaPrime: number;
  private states: Map<string, StringState>;
  
  constructor(
    stringType: StringType = 'closed',
    dimension: number = 26,
    reggeSlopeAlphaPrime: number = StringConstants.REGGE_SLOPE
  ) {
    this.stringType = stringType;
    this.dimension = dimension;
    this.reggeSlopeAlphaPrime = reggeSlopeAlphaPrime;
    this.states = new Map();
  }
  
  /**
   * Create the tachyon state (N = 0 or N = Ñ = 0)
   */
  createTachyon(): StringState {
    const state = new StringState(this.stringType, this.dimension, this.reggeSlopeAlphaPrime);
    // No oscillator excitations - ground state
    this.states.set('tachyon', state);
    return state;
  }
  
  /**
   * Create a massless vector (open string photon)
   */
  createPhoton(polarization: number = 1): StringState {
    if (this.stringType !== 'open') {
      throw new Error('Photon only exists in open string spectrum');
    }
    const state = new StringState(this.stringType, this.dimension, this.reggeSlopeAlphaPrime);
    // α_{-1}^μ |0, p⟩ - one oscillator excitation
    state.addExcitation(1, polarization, 1);
    this.states.set('photon', state);
    return state;
  }
  
  /**
   * Create a massless graviton (closed string)
   */
  createGraviton(muRight: number = 1, muLeft: number = 2): StringState {
    if (this.stringType !== 'closed') {
      throw new Error('Graviton only exists in closed string spectrum');
    }
    const state = new StringState(this.stringType, this.dimension, this.reggeSlopeAlphaPrime);
    // α_{-1}^μ α̃_{-1}^ν |0, p⟩
    state.addExcitation(1, muRight, 1, false); // Right-moving
    state.addExcitation(1, muLeft, 1, true);   // Left-moving
    this.states.set('graviton', state);
    return state;
  }
  
  /**
   * Create dilaton (trace part of graviton)
   */
  createDilaton(): StringState {
    if (this.stringType !== 'closed') {
      throw new Error('Dilaton only exists in closed string spectrum');
    }
    const state = new StringState(this.stringType, this.dimension, this.reggeSlopeAlphaPrime);
    // Trace: Σ_μ α_{-1}^μ α̃_{-1}^μ |0, p⟩
    state.addExcitation(1, 1, 1, false);
    state.addExcitation(1, 1, 1, true);
    this.states.set('dilaton', state);
    return state;
  }
  
  /**
   * Create Kalb-Ramond B-field (antisymmetric tensor)
   */
  createKalbRamond(mu: number = 1, nu: number = 2): StringState {
    if (this.stringType !== 'closed') {
      throw new Error('Kalb-Ramond field only exists in closed string spectrum');
    }
    if (mu === nu) {
      throw new Error('Antisymmetric tensor requires different indices');
    }
    const state = new StringState(this.stringType, this.dimension, this.reggeSlopeAlphaPrime);
    // Antisymmetric combination
    state.addExcitation(1, mu, 1, false);
    state.addExcitation(1, nu, 1, true);
    this.states.set('kalb-ramond', state);
    return state;
  }
  
  /**
   * Get a state by name
   */
  getState(name: string): StringState | undefined {
    return this.states.get(name);
  }
  
  /**
   * Get all states
   */
  getAllStates(): Map<string, StringState> {
    return new Map(this.states);
  }
  
  /**
   * Generate states up to a given level
   */
  generateLevel(maxLevel: number): StringState[] {
    const states: StringState[] = [];
    
    // Level 0: Tachyon
    if (maxLevel >= 0) {
      states.push(this.createTachyon());
    }
    
    // Level 1: Massless states
    if (maxLevel >= 1) {
      if (this.stringType === 'open') {
        for (let mu = 1; mu < this.dimension; mu++) {
          const state = new StringState(this.stringType, this.dimension, this.reggeSlopeAlphaPrime);
          state.addExcitation(1, mu, 1);
          states.push(state);
        }
      } else {
        // Closed string massless states (graviton, dilaton, B-field)
        for (let mu = 1; mu < this.dimension; mu++) {
          for (let nu = 1; nu < this.dimension; nu++) {
            const state = new StringState(this.stringType, this.dimension, this.reggeSlopeAlphaPrime);
            state.addExcitation(1, mu, 1, false);
            state.addExcitation(1, nu, 1, true);
            states.push(state);
          }
        }
      }
    }
    
    return states;
  }
  
  /**
   * Count states at a given mass level
   */
  countStatesAtLevel(level: number): number {
    // Partition function counting - simplified
    if (level === 0) return 1; // Tachyon
    if (level === 1) {
      return this.stringType === 'open' 
        ? this.dimension - 2 // Transverse polarizations
        : (this.dimension - 2) ** 2; // Tensor product
    }
    // Higher levels have exponentially growing degeneracy
    // d(N) ~ exp(4π√(N(D-2)/24)) for large N
    const D = this.dimension;
    return Math.floor(Math.exp(4 * Math.PI * Math.sqrt(level * (D - 2) / 24)));
  }
  
  getHash(): string {
    return generateHash(`Spectrum:${this.stringType}:${this.states.size}`);
  }
}

/**
 * PolyakovAction - The Polyakov action for string theory
 * 
 * S_P = -T/2 ∫ d²σ √(-h) h^αβ ∂_α X^μ ∂_β X_μ
 */
export class PolyakovAction {
  private readonly tension: number;
  private readonly dimension: number;
  
  constructor(
    tension: number = StringConstants.STRING_TENSION,
    dimension: number = 26
  ) {
    this.tension = tension;
    this.dimension = dimension;
  }
  
  /**
   * Calculate the action for a given worldsheet metric and embedding
   */
  calculate(
    worldsheetMetric: number[][],
    embedding: (tau: number, sigma: number) => number[],
    tauRange: [number, number],
    sigmaRange: [number, number],
    steps: number = 100
  ): number {
    const [tauMin, tauMax] = tauRange;
    const [sigmaMin, sigmaMax] = sigmaRange;
    const dtau = (tauMax - tauMin) / steps;
    const dsigma = (sigmaMax - sigmaMin) / steps;
    
    // Worldsheet metric determinant and inverse
    const h = worldsheetMetric;
    const detH = h[0][0] * h[1][1] - h[0][1] * h[1][0];
    const sqrtMinusDetH = Math.sqrt(-detH);
    
    // Inverse metric h^αβ
    const hInv = [
      [h[1][1] / detH, -h[0][1] / detH],
      [-h[1][0] / detH, h[0][0] / detH]
    ];
    
    let action = 0;
    const epsilon = 1e-6;
    
    for (let i = 0; i < steps; i++) {
      for (let j = 0; j < steps; j++) {
        const tau = tauMin + i * dtau;
        const sigma = sigmaMin + j * dsigma;
        
        const X = embedding(tau, sigma);
        const X_tau = embedding(tau + epsilon, sigma);
        const X_sigma = embedding(tau, sigma + epsilon);
        
        // Derivatives
        const dX_dtau = X_tau.map((x, k) => (x - X[k]) / epsilon);
        const dX_dsigma = X_sigma.map((x, k) => (x - X[k]) / epsilon);
        
        // Contract with inverse metric: h^αβ ∂_α X · ∂_β X
        let contraction = 0;
        
        // ττ term
        let dot_tt = 0;
        for (let mu = 0; mu < this.dimension; mu++) {
          dot_tt += (mu === 0 ? -1 : 1) * dX_dtau[mu] * dX_dtau[mu];
        }
        contraction += hInv[0][0] * dot_tt;
        
        // σσ term
        let dot_ss = 0;
        for (let mu = 0; mu < this.dimension; mu++) {
          dot_ss += (mu === 0 ? -1 : 1) * dX_dsigma[mu] * dX_dsigma[mu];
        }
        contraction += hInv[1][1] * dot_ss;
        
        // τσ cross terms
        let dot_ts = 0;
        for (let mu = 0; mu < this.dimension; mu++) {
          dot_ts += (mu === 0 ? -1 : 1) * dX_dtau[mu] * dX_dsigma[mu];
        }
        contraction += 2 * hInv[0][1] * dot_ts;
        
        action += sqrtMinusDetH * contraction * dtau * dsigma;
      }
    }
    
    return -this.tension / 2 * action;
  }
  
  /**
   * Get the equations of motion from variation
   * ∂_α(√(-h) h^αβ ∂_β X^μ) = 0
   */
  equationsOfMotion(): string {
    return '∂_α(√(-h) h^αβ ∂_β X^μ) = 0';
  }
  
  /**
   * Conformal gauge: h_αβ = e^φ η_αβ
   * In this gauge: □X^μ = 0 (free wave equation)
   */
  conformalGaugeMetric(phi: number = 0): number[][] {
    const factor = Math.exp(phi);
    return [[-factor, 0], [0, factor]];
  }
  
  getHash(): string {
    return generateHash(`Polyakov:${this.tension}:${this.dimension}`);
  }
}

/**
 * TDuality - T-duality transformation
 * 
 * Under T-duality on a compact dimension of radius R:
 * R → α'/R (or R → l_s²/R)
 * Winding ↔ Momentum
 */
export class TDuality {
  private readonly reggeSlopeAlphaPrime: number;
  
  constructor(reggeSlopeAlphaPrime: number = StringConstants.REGGE_SLOPE) {
    this.reggeSlopeAlphaPrime = reggeSlopeAlphaPrime;
  }
  
  /**
   * Get the T-dual radius
   * R' = α'/R
   */
  dualRadius(R: number): number {
    return this.reggeSlopeAlphaPrime / R;
  }
  
  /**
   * Get the self-dual radius
   * R_sd = √α' = l_s
   */
  selfDualRadius(): number {
    return Math.sqrt(this.reggeSlopeAlphaPrime);
  }
  
  /**
   * Check if radius is at self-dual point
   */
  isSelfDual(R: number, tolerance: number = 1e-10): boolean {
    return Math.abs(R - this.selfDualRadius()) < tolerance;
  }
  
  /**
   * Mass formula for compactified closed string
   * M² = (n/R)² + (wR/α')² + (2/α')(N + Ñ - 2)
   * 
   * where n = momentum number, w = winding number
   */
  massSquaredCompact(
    momentumNumber: number,
    windingNumber: number,
    N: number,
    N_tilde: number,
    R: number
  ): number {
    const p = momentumNumber / R; // Momentum contribution
    const w = windingNumber * R / this.reggeSlopeAlphaPrime; // Winding contribution
    const oscillator = (2 / this.reggeSlopeAlphaPrime) * (N + N_tilde - 2);
    
    return p * p + w * w + oscillator;
  }
  
  /**
   * Under T-duality, momentum and winding exchange
   */
  dualQuantumNumbers(
    momentumNumber: number,
    windingNumber: number
  ): { momentum: number; winding: number } {
    return {
      momentum: windingNumber,
      winding: momentumNumber
    };
  }
  
  getHash(): string {
    return generateHash(`TDuality:${this.reggeSlopeAlphaPrime}`);
  }
}

/**
 * Compactification - String compactification on tori
 */
export class Compactification {
  private readonly uncompactifiedDimensions: number;
  private readonly compactRadii: number[];
  private readonly reggeSlopeAlphaPrime: number;
  
  constructor(
    totalDimensions: number = 26,
    compactRadii: number[] = [],
    reggeSlopeAlphaPrime: number = StringConstants.REGGE_SLOPE
  ) {
    this.uncompactifiedDimensions = totalDimensions - compactRadii.length;
    this.compactRadii = [...compactRadii];
    this.reggeSlopeAlphaPrime = reggeSlopeAlphaPrime;
    
    if (this.uncompactifiedDimensions < 4) {
      throw new Error('Must have at least 4 uncompactified dimensions');
    }
  }
  
  /**
   * Get number of compact dimensions
   */
  getCompactDimensions(): number {
    return this.compactRadii.length;
  }
  
  /**
   * Get number of uncompactified dimensions
   */
  getUncompactifiedDimensions(): number {
    return this.uncompactifiedDimensions;
  }
  
  /**
   * Get the compact radii
   */
  getRadii(): number[] {
    return [...this.compactRadii];
  }
  
  /**
   * Calculate volume of compact space (torus)
   */
  compactVolume(): number {
    if (this.compactRadii.length === 0) return 1;
    
    let volume = 1;
    for (const R of this.compactRadii) {
      volume *= 2 * Math.PI * R; // Circle circumference
    }
    return volume;
  }
  
  /**
   * Calculate the effective 4D Planck mass
   * M_P^2 ∝ M_s^2 (V/l_s^n) where n = compact dimensions
   */
  effective4DPlanckMass(stringMass: number): number {
    const V = this.compactVolume();
    const l_s = Math.sqrt(this.reggeSlopeAlphaPrime);
    const n = this.compactRadii.length;
    
    return stringMass * Math.sqrt(V / Math.pow(l_s, n));
  }
  
  /**
   * Get Kaluza-Klein tower masses for a compact dimension
   */
  kkTowerMasses(dimIndex: number, maxN: number = 5): number[] {
    if (dimIndex >= this.compactRadii.length) {
      throw new Error('Invalid compact dimension index');
    }
    
    const R = this.compactRadii[dimIndex];
    const masses: number[] = [];
    
    for (let n = 0; n <= maxN; n++) {
      masses.push(n / R);
    }
    
    return masses;
  }
  
  getHash(): string {
    return generateHash(`Compact:${this.uncompactifiedDimensions}:${this.compactRadii.length}`);
  }
}

/**
 * WorldsheetCFT - Conformal Field Theory on the worldsheet
 */
export class WorldsheetCFT {
  private readonly centralCharge: number;
  private readonly dimension: number;
  
  constructor(dimension: number = 26) {
    this.dimension = dimension;
    // For free bosons, c = D (one for each spacetime dimension)
    this.centralCharge = dimension;
  }
  
  /**
   * Get the central charge
   */
  getCentralCharge(): number {
    return this.centralCharge;
  }
  
  /**
   * Critical central charge for bosonic string
   * c = 26 for anomaly cancellation
   */
  criticalCentralCharge(): number {
    return 26;
  }
  
  /**
   * Check if theory is critical (anomaly-free)
   */
  isCritical(): boolean {
    return this.centralCharge === this.criticalCentralCharge();
  }
  
  /**
   * Virasoro algebra central extension
   * [L_m, L_n] = (m - n)L_{m+n} + (c/12)(m³ - m)δ_{m+n,0}
   */
  virasoroCommutator(m: number, n: number): { coefficient: number; centralTerm: number } {
    const coefficient = m - n;
    const centralTerm = (m + n === 0) 
      ? (this.centralCharge / 12) * (m * m * m - m)
      : 0;
    
    return { coefficient, centralTerm };
  }
  
  /**
   * Primary field dimension for vertex operator e^{ik·X}
   * h = α' k²/4 for left-movers, same for right
   */
  vertexOperatorDimension(kSquared: number, reggeSlopeAlphaPrime: number): number {
    return reggeSlopeAlphaPrime * kSquared / 4;
  }
  
  /**
   * OPE coefficient for X^μ(z) X^ν(w)
   * X^μ(z) X^ν(w) ~ -α'/2 η^μν ln(z-w) + regular
   */
  xOPECoefficient(reggeSlopeAlphaPrime: number): number {
    return -reggeSlopeAlphaPrime / 2;
  }
  
  getHash(): string {
    return generateHash(`CFT:${this.centralCharge}:${this.dimension}`);
  }
}

/**
 * StringTheoryFactory - Factory for creating common string theory configurations
 */
export class StringTheoryFactory {
  /**
   * Create a bosonic string in 26 dimensions
   */
  static bosonicString26D(): {
    worldsheet: StringWorldsheet;
    spectrum: StringSpectrum;
    action: PolyakovAction;
    cft: WorldsheetCFT;
  } {
    return {
      worldsheet: new StringWorldsheet('closed', 26),
      spectrum: new StringSpectrum('closed', 26),
      action: new PolyakovAction(StringConstants.STRING_TENSION, 26),
      cft: new WorldsheetCFT(26)
    };
  }
  
  /**
   * Create an open bosonic string
   */
  static openBosonicString(): {
    worldsheet: StringWorldsheet;
    spectrum: StringSpectrum;
    action: PolyakovAction;
  } {
    return {
      worldsheet: new StringWorldsheet('open', 26),
      spectrum: new StringSpectrum('open', 26),
      action: new PolyakovAction(StringConstants.STRING_TENSION, 26)
    };
  }
  
  /**
   * Create a compactified string theory
   */
  static compactifiedString(
    compactRadii: number[],
    totalDimensions: number = 26
  ): {
    compactification: Compactification;
    tDuality: TDuality;
    spectrum: StringSpectrum;
  } {
    return {
      compactification: new Compactification(totalDimensions, compactRadii),
      tDuality: new TDuality(),
      spectrum: new StringSpectrum('closed', totalDimensions)
    };
  }
  
  /**
   * Create a string at self-dual radius
   */
  static selfDualCompactification(): {
    compactification: Compactification;
    tDuality: TDuality;
  } {
    const tDuality = new TDuality();
    const R_sd = tDuality.selfDualRadius();
    
    return {
      compactification: new Compactification(26, [R_sd]),
      tDuality: tDuality
    };
  }
  
  static getHash(): string {
    return generateHash('StringTheoryFactory:1.0');
  }
}

// Export default namespace
export default {
  StringConstants,
  StringWorldsheet,
  StringMode,
  StringState,
  StringSpectrum,
  PolyakovAction,
  TDuality,
  Compactification,
  WorldsheetCFT,
  StringTheoryFactory
};
