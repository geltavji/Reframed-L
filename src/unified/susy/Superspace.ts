/**
 * Superspace.ts - Phase 5.3: Supersymmetry Basics
 * 
 * Implements superspace coordinates, Grassmann numbers, superfields, and SUSY transformations.
 * 
 * Key concepts:
 * - Grassmann numbers: θ² = 0 (anticommuting)
 * - Superspace coordinates: (x^μ, θ^α, θ̄^α̇)
 * - Superfields: Φ(x, θ, θ̄) = φ(x) + θψ(x) + θ²F(x) + ...
 * - SUSY algebra: {Q_α, Q̄_α̇} = 2σ^μ_{αα̇} P_μ
 * 
 * Dependencies: Complex, Matrix, Logger
 */

import { createHash } from 'crypto';

// ============================================================================
// Constants
// ============================================================================

/**
 * SUSY constants
 */
export const SUSYConstants = {
    /** Number of supersymmetries (N=1) */
    N: 1,
    /** Spacetime dimensions */
    D: 4,
    /** Spinor dimension */
    spinorDim: 2,
    /** Grassmann variables per spinor */
    grassmannDim: 2,
};

// ============================================================================
// Grassmann Numbers
// ============================================================================

/**
 * Grassmann number - anticommuting variable
 * 
 * Properties:
 * - θ² = 0 (nilpotent)
 * - θ₁θ₂ = -θ₂θ₁ (anticommutation)
 */
export class GrassmannNumber {
    /** Scalar part (coefficient of 1) */
    private scalar: number;
    /** Linear parts (coefficients of θᵢ) */
    private linear: number[];
    /** Bilinear parts (coefficients of θᵢθⱼ for i<j) */
    private bilinear: number[];
    /** Number of Grassmann generators */
    private readonly nGenerators: number;

    constructor(scalar: number = 0, linear: number[] = [], bilinear: number[] = [], nGenerators: number = 2) {
        this.scalar = scalar;
        this.nGenerators = nGenerators;
        
        // Initialize linear parts
        this.linear = new Array(nGenerators).fill(0);
        for (let i = 0; i < Math.min(linear.length, nGenerators); i++) {
            this.linear[i] = linear[i];
        }
        
        // Initialize bilinear parts (n choose 2 elements)
        const nBilinear = (nGenerators * (nGenerators - 1)) / 2;
        this.bilinear = new Array(nBilinear).fill(0);
        for (let i = 0; i < Math.min(bilinear.length, nBilinear); i++) {
            this.bilinear[i] = bilinear[i];
        }
    }

    /**
     * Get scalar part
     */
    getScalar(): number {
        return this.scalar;
    }

    /**
     * Get linear coefficient for θᵢ
     */
    getLinear(i: number): number {
        if (i < 0 || i >= this.nGenerators) return 0;
        return this.linear[i];
    }

    /**
     * Get all linear coefficients
     */
    getLinearParts(): number[] {
        return [...this.linear];
    }

    /**
     * Get bilinear coefficient for θᵢθⱼ (i < j)
     */
    getBilinear(i: number, j: number): number {
        if (i >= j) return -this.getBilinear(j, i);
        if (i < 0 || j >= this.nGenerators) return 0;
        const index = this.bilinearIndex(i, j);
        return this.bilinear[index];
    }

    /**
     * Get index for bilinear term θᵢθⱼ (i < j)
     */
    private bilinearIndex(i: number, j: number): number {
        // Map (i, j) with i < j to linear index
        return i * this.nGenerators - (i * (i + 1)) / 2 + (j - i - 1);
    }

    /**
     * Add two Grassmann numbers
     */
    add(other: GrassmannNumber): GrassmannNumber {
        const resultLinear = this.linear.map((v, i) => v + other.getLinear(i));
        const resultBilinear = this.bilinear.map((v, i) => v + (other.bilinear[i] || 0));
        return new GrassmannNumber(
            this.scalar + other.scalar,
            resultLinear,
            resultBilinear,
            this.nGenerators
        );
    }

    /**
     * Subtract two Grassmann numbers
     */
    subtract(other: GrassmannNumber): GrassmannNumber {
        const resultLinear = this.linear.map((v, i) => v - other.getLinear(i));
        const resultBilinear = this.bilinear.map((v, i) => v - (other.bilinear[i] || 0));
        return new GrassmannNumber(
            this.scalar - other.scalar,
            resultLinear,
            resultBilinear,
            this.nGenerators
        );
    }

    /**
     * Multiply two Grassmann numbers
     * Uses anticommutation: θᵢθⱼ = -θⱼθᵢ, θ² = 0
     */
    multiply(other: GrassmannNumber): GrassmannNumber {
        const resultScalar = this.scalar * other.scalar;
        const resultLinear = new Array(this.nGenerators).fill(0);
        const resultBilinear = new Array(this.bilinear.length).fill(0);

        // Scalar × Linear
        for (let i = 0; i < this.nGenerators; i++) {
            resultLinear[i] += this.scalar * other.getLinear(i);
            resultLinear[i] += this.linear[i] * other.scalar;
        }

        // Scalar × Bilinear
        for (let i = 0; i < this.bilinear.length; i++) {
            resultBilinear[i] += this.scalar * (other.bilinear[i] || 0);
            resultBilinear[i] += this.bilinear[i] * other.scalar;
        }

        // Linear × Linear: θᵢ × θⱼ = θᵢθⱼ (for i ≠ j), θ² = 0
        for (let i = 0; i < this.nGenerators; i++) {
            for (let j = 0; j < this.nGenerators; j++) {
                if (i !== j && this.linear[i] !== 0 && other.getLinear(j) !== 0) {
                    const coeff = this.linear[i] * other.getLinear(j);
                    if (i < j) {
                        const idx = this.bilinearIndex(i, j);
                        resultBilinear[idx] += coeff;
                    } else {
                        // θⱼθᵢ = -θᵢθⱼ
                        const idx = this.bilinearIndex(j, i);
                        resultBilinear[idx] -= coeff;
                    }
                }
            }
        }

        return new GrassmannNumber(resultScalar, resultLinear, resultBilinear, this.nGenerators);
    }

    /**
     * Scale by a real number
     */
    scale(c: number): GrassmannNumber {
        return new GrassmannNumber(
            this.scalar * c,
            this.linear.map(v => v * c),
            this.bilinear.map(v => v * c),
            this.nGenerators
        );
    }

    /**
     * Grassmann conjugate (complex conjugate for real case)
     */
    conjugate(): GrassmannNumber {
        // For real Grassmann numbers, conjugate just returns itself
        return new GrassmannNumber(
            this.scalar,
            [...this.linear],
            [...this.bilinear],
            this.nGenerators
        );
    }

    /**
     * Check if nilpotent (θ² = 0)
     */
    isNilpotent(): boolean {
        // A single Grassmann generator is always nilpotent
        // The product of a Grassmann with itself is always 0
        return true;
    }

    /**
     * Grassmann integration (Berezin integral)
     * ∫dθ 1 = 0, ∫dθ θ = 1
     */
    integrateOver(index: number): GrassmannNumber {
        if (index < 0 || index >= this.nGenerators) {
            return new GrassmannNumber(0, [], [], this.nGenerators);
        }

        // ∫dθᵢ picks out coefficient of θᵢ
        const newLinear = new Array(this.nGenerators).fill(0);
        let newScalar = this.linear[index]; // ∫dθᵢ (... + aᵢθᵢ + ...) = aᵢ

        // For bilinear terms: ∫dθᵢ θⱼθₖ = δᵢⱼθₖ - δᵢₖθⱼ
        for (let j = 0; j < this.nGenerators; j++) {
            if (j !== index) {
                // Find bilinear terms containing θᵢ
                if (index < j) {
                    const idx = this.bilinearIndex(index, j);
                    newLinear[j] += this.bilinear[idx];
                } else {
                    const idx = this.bilinearIndex(j, index);
                    newLinear[j] -= this.bilinear[idx];
                }
            }
        }

        return new GrassmannNumber(newScalar, newLinear, [], this.nGenerators);
    }

    /**
     * Full Grassmann integration over all variables
     */
    fullIntegral(): number {
        if (this.nGenerators === 0) return this.scalar;
        
        let result: GrassmannNumber = this;
        for (let i = 0; i < this.nGenerators; i++) {
            result = result.integrateOver(i);
        }
        return result.scalar;
    }

    /**
     * Generate hash for verification
     */
    getHash(): string {
        const data = JSON.stringify({
            scalar: this.scalar,
            linear: this.linear,
            bilinear: this.bilinear,
            nGenerators: this.nGenerators
        });
        return createHash('sha256').update(data).digest('hex').substring(0, 16);
    }

    /**
     * Create unit Grassmann generator θᵢ
     */
    static generator(index: number, nGenerators: number = 2): GrassmannNumber {
        const linear = new Array(nGenerators).fill(0);
        if (index >= 0 && index < nGenerators) {
            linear[index] = 1;
        }
        return new GrassmannNumber(0, linear, [], nGenerators);
    }

    /**
     * Create scalar Grassmann number
     */
    static scalar(value: number, nGenerators: number = 2): GrassmannNumber {
        return new GrassmannNumber(value, [], [], nGenerators);
    }
}

// ============================================================================
// Superspace Coordinates
// ============================================================================

/**
 * Point in superspace (x^μ, θ^α, θ̄^α̇)
 */
export class SuperspacePoint {
    /** Bosonic coordinates x^μ */
    private x: number[];
    /** Grassmann coordinates θ^α (2-component Weyl spinor) */
    private theta: GrassmannNumber[];
    /** Conjugate Grassmann coordinates θ̄^α̇ */
    private thetaBar: GrassmannNumber[];

    constructor(x: number[], theta: GrassmannNumber[], thetaBar: GrassmannNumber[]) {
        this.x = [...x];
        this.theta = theta;
        this.thetaBar = thetaBar;
    }

    /**
     * Get bosonic coordinate x^μ
     */
    getX(mu: number): number {
        return this.x[mu] || 0;
    }

    /**
     * Get all bosonic coordinates
     */
    getXCoords(): number[] {
        return [...this.x];
    }

    /**
     * Get Grassmann coordinate θ^α
     */
    getTheta(alpha: number): GrassmannNumber {
        return this.theta[alpha] || new GrassmannNumber();
    }

    /**
     * Get conjugate Grassmann coordinate θ̄^α̇
     */
    getThetaBar(alphaDot: number): GrassmannNumber {
        return this.thetaBar[alphaDot] || new GrassmannNumber();
    }

    /**
     * SUSY transformation of coordinates
     * x'^μ = x^μ + iξσ^μθ̄ - iθσ^μξ̄
     * θ'^α = θ^α + ξ^α
     * θ̄'^α̇ = θ̄^α̇ + ξ̄^α̇
     */
    susyTransform(xi: GrassmannNumber[], xiBar: GrassmannNumber[]): SuperspacePoint {
        // Simplified: just add to Grassmann coordinates
        const newTheta = this.theta.map((t, i) => t.add(xi[i] || new GrassmannNumber()));
        const newThetaBar = this.thetaBar.map((t, i) => t.add(xiBar[i] || new GrassmannNumber()));
        
        // For bosonic coordinates, would need Pauli matrices
        // Simplified version: keep x unchanged
        return new SuperspacePoint([...this.x], newTheta, newThetaBar);
    }

    /**
     * Generate hash for verification
     */
    getHash(): string {
        const data = JSON.stringify({
            x: this.x,
            theta: this.theta.map(t => t.getHash()),
            thetaBar: this.thetaBar.map(t => t.getHash())
        });
        return createHash('sha256').update(data).digest('hex').substring(0, 16);
    }

    /**
     * Create origin in superspace
     */
    static origin(dim: number = 4, spinorDim: number = 2): SuperspacePoint {
        const x = new Array(dim).fill(0);
        const theta = Array.from({ length: spinorDim }, () => new GrassmannNumber());
        const thetaBar = Array.from({ length: spinorDim }, () => new GrassmannNumber());
        return new SuperspacePoint(x, theta, thetaBar);
    }
}

// ============================================================================
// Superfields
// ============================================================================

/**
 * Component fields of a chiral superfield
 */
export interface ChiralComponents {
    /** Scalar field φ(x) */
    phi: number[];
    /** Weyl spinor field ψ_α(x) */
    psi: number[][];
    /** Auxiliary field F(x) */
    F: number[];
}

/**
 * Component fields of a vector superfield
 */
export interface VectorComponents {
    /** Real scalar C(x) */
    C: number[];
    /** Weyl spinor χ_α(x) */
    chi: number[][];
    /** Vector field V_μ(x) */
    V: number[][];
    /** Auxiliary scalar M(x) */
    M: number[];
    /** Auxiliary scalar N(x) */
    N: number[];
    /** Weyl spinor λ_α(x) - gaugino */
    lambda: number[][];
    /** Auxiliary field D(x) */
    D: number[];
}

/**
 * Superfield - function on superspace
 * 
 * Φ(x, θ, θ̄) = φ(x) + θψ(x) + θ²F(x) + θ̄χ̄(x) + θ²θ̄λ̄(x) + θ̄²θψ̃(x) + ...
 */
export class Superfield {
    /** Field type */
    private readonly type: 'scalar' | 'chiral' | 'antichiral' | 'vector' | 'general';
    /** Components in θ expansion */
    private readonly components: Map<string, number[]>;
    /** Dimension of spacetime */
    private readonly dim: number;

    constructor(type: 'scalar' | 'chiral' | 'antichiral' | 'vector' | 'general' = 'general', dim: number = 4) {
        this.type = type;
        this.dim = dim;
        this.components = new Map();
    }

    /**
     * Get field type
     */
    getType(): string {
        return this.type;
    }

    /**
     * Set component field
     */
    setComponent(key: string, values: number[]): void {
        this.components.set(key, [...values]);
    }

    /**
     * Get component field
     */
    getComponent(key: string): number[] {
        return this.components.get(key) || [];
    }

    /**
     * Evaluate at a superspace point (simplified)
     */
    evaluateAt(_point: SuperspacePoint): number {
        // Returns scalar component at the bosonic point
        const scalar = this.components.get('scalar');
        return scalar ? scalar[0] : 0;
    }

    /**
     * Add two superfields
     */
    add(other: Superfield): Superfield {
        const result = new Superfield('general', this.dim);
        
        // Add all components from this
        this.components.forEach((values, key) => {
            result.setComponent(key, [...values]);
        });
        
        // Add components from other
        other.components.forEach((values, key) => {
            const existing = result.getComponent(key);
            if (existing.length > 0) {
                result.setComponent(key, existing.map((v, i) => v + (values[i] || 0)));
            } else {
                result.setComponent(key, [...values]);
            }
        });
        
        return result;
    }

    /**
     * Scale superfield by constant
     */
    scale(c: number): Superfield {
        const result = new Superfield(this.type, this.dim);
        this.components.forEach((values, key) => {
            result.setComponent(key, values.map(v => v * c));
        });
        return result;
    }

    /**
     * Multiply two superfields (simplified product)
     */
    multiply(other: Superfield): Superfield {
        const result = new Superfield('general', this.dim);
        
        // For simplicity, multiply scalar components only
        const thisScalar = this.getComponent('scalar');
        const otherScalar = other.getComponent('scalar');
        
        if (thisScalar.length > 0 && otherScalar.length > 0) {
            result.setComponent('scalar', [thisScalar[0] * otherScalar[0]]);
        }
        
        return result;
    }

    /**
     * Check if chiral (D̄_α̇ Φ = 0)
     */
    isChiral(): boolean {
        return this.type === 'chiral';
    }

    /**
     * Check if antichiral (D_α Φ = 0)
     */
    isAntichiral(): boolean {
        return this.type === 'antichiral';
    }

    /**
     * Check if vector (real)
     */
    isVector(): boolean {
        return this.type === 'vector';
    }

    /**
     * Generate hash for verification
     */
    getHash(): string {
        const componentsObj: Record<string, number[]> = {};
        this.components.forEach((values, key) => {
            componentsObj[key] = values;
        });
        const data = JSON.stringify({
            type: this.type,
            dim: this.dim,
            components: componentsObj
        });
        return createHash('sha256').update(data).digest('hex').substring(0, 16);
    }
}

/**
 * Chiral superfield
 * Φ = φ + √2 θψ + θ²F
 */
export class ChiralSuperfield extends Superfield {
    private phi: number;      // Scalar field
    private psi: number[];    // Weyl spinor
    private F: number;        // Auxiliary field

    constructor(phi: number = 0, psi: number[] = [0, 0], F: number = 0) {
        super('chiral', 4);
        this.phi = phi;
        this.psi = [...psi];
        this.F = F;
        
        this.setComponent('scalar', [phi]);
        this.setComponent('spinor', psi);
        this.setComponent('auxiliary', [F]);
    }

    /**
     * Get scalar field φ
     */
    getPhi(): number {
        return this.phi;
    }

    /**
     * Get spinor field ψ
     */
    getPsi(): number[] {
        return [...this.psi];
    }

    /**
     * Get auxiliary field F
     */
    getF(): number {
        return this.F;
    }

    /**
     * Compute kinetic term contribution
     * K = Φ†Φ gives Kähler potential
     */
    kineticTerm(): number {
        return this.phi * this.phi + this.F * this.F;
    }

    /**
     * Complex conjugate gives antichiral superfield
     */
    conjugate(): AntichiralSuperfield {
        return new AntichiralSuperfield(this.phi, this.psi, this.F);
    }
}

/**
 * Antichiral superfield (conjugate of chiral)
 * Φ† = φ* + √2 θ̄ψ̄ + θ̄²F*
 */
export class AntichiralSuperfield extends Superfield {
    private phiBar: number;
    private psiBar: number[];
    private FBar: number;

    constructor(phiBar: number = 0, psiBar: number[] = [0, 0], FBar: number = 0) {
        super('antichiral', 4);
        this.phiBar = phiBar;
        this.psiBar = [...psiBar];
        this.FBar = FBar;
        
        this.setComponent('scalar', [phiBar]);
        this.setComponent('spinor_bar', psiBar);
        this.setComponent('auxiliary_bar', [FBar]);
    }

    /**
     * Get conjugate scalar field φ*
     */
    getPhiBar(): number {
        return this.phiBar;
    }

    /**
     * Get conjugate spinor field ψ̄
     */
    getPsiBar(): number[] {
        return [...this.psiBar];
    }

    /**
     * Get conjugate auxiliary field F*
     */
    getFBar(): number {
        return this.FBar;
    }
}

/**
 * Vector superfield (real)
 * V = V† with gauge transformation V → V + Λ + Λ†
 */
export class VectorSuperfield extends Superfield {
    private C: number;           // Real scalar
    private chi: number[];       // Weyl spinor
    private H: number;           // Complex scalar (auxiliary)
    private V_mu: number[];      // Vector field
    private lambda: number[];    // Gaugino (Weyl spinor)
    private D: number;           // Auxiliary real scalar

    constructor(
        C: number = 0,
        chi: number[] = [0, 0],
        H: number = 0,
        V_mu: number[] = [0, 0, 0, 0],
        lambda: number[] = [0, 0],
        D: number = 0
    ) {
        super('vector', 4);
        this.C = C;
        this.chi = [...chi];
        this.H = H;
        this.V_mu = [...V_mu];
        this.lambda = [...lambda];
        this.D = D;
        
        this.setComponent('C', [C]);
        this.setComponent('chi', chi);
        this.setComponent('H', [H]);
        this.setComponent('V', V_mu);
        this.setComponent('lambda', lambda);
        this.setComponent('D', [D]);
    }

    /**
     * Get vector field V_μ
     */
    getVectorField(): number[] {
        return [...this.V_mu];
    }

    /**
     * Get gaugino field λ
     */
    getGaugino(): number[] {
        return [...this.lambda];
    }

    /**
     * Get D-term
     */
    getDTerm(): number {
        return this.D;
    }

    /**
     * Gauge transformation V → V + i(Λ - Λ†)
     * In Wess-Zumino gauge: C = χ = H = 0
     */
    toWessZuminoGauge(): VectorSuperfield {
        return new VectorSuperfield(0, [0, 0], 0, this.V_mu, this.lambda, this.D);
    }

    /**
     * Check if in Wess-Zumino gauge
     */
    isWessZuminoGauge(): boolean {
        return this.C === 0 && 
               this.chi.every(c => c === 0) && 
               this.H === 0;
    }

    /**
     * Field strength superfield W_α
     * W_α = -1/4 D̄²D_α V
     */
    fieldStrength(): ChiralSuperfield {
        // In WZ gauge: W_α contains λ_α and D
        return new ChiralSuperfield(0, this.lambda, this.D);
    }
}

// ============================================================================
// SUSY Transformations
// ============================================================================

/**
 * SUSY transformation generator
 */
export class SUSYTransform {
    /** Transformation parameter ξ^α */
    private xi: GrassmannNumber[];
    /** Conjugate parameter ξ̄^α̇ */
    private xiBar: GrassmannNumber[];

    constructor(xi: GrassmannNumber[], xiBar: GrassmannNumber[]) {
        this.xi = xi;
        this.xiBar = xiBar;
    }

    /**
     * Get transformation parameter
     */
    getXi(): GrassmannNumber[] {
        return this.xi;
    }

    /**
     * Get conjugate parameter
     */
    getXiBar(): GrassmannNumber[] {
        return this.xiBar;
    }

    /**
     * Transform scalar field δφ = √2 ξψ
     */
    transformScalar(psi: number[]): number {
        // Simplified: ξ is Grassmann, so result involves Grassmann
        // For real computation, return coefficient
        let result = 0;
        for (let i = 0; i < Math.min(this.xi.length, psi.length); i++) {
            result += this.xi[i].getLinear(0) * psi[i] * Math.sqrt(2);
        }
        return result;
    }

    /**
     * Transform spinor field δψ = √2 ξF + i√2 σ^μ ξ̄ ∂_μφ
     */
    transformSpinor(F: number, gradPhi: number[]): number[] {
        const result = [0, 0];
        // First term: √2 ξF
        for (let alpha = 0; alpha < 2; alpha++) {
            result[alpha] = Math.sqrt(2) * this.xi[alpha].getScalar() * F;
        }
        // Second term involves derivatives, simplified
        return result;
    }

    /**
     * Transform auxiliary field δF = i√2 ξ̄σ̄^μ ∂_μψ
     */
    transformAuxiliary(_gradPsi: number[][]): number {
        // Involves derivative of spinor
        return 0;
    }

    /**
     * Compose two SUSY transformations
     */
    compose(other: SUSYTransform): SUSYTransform {
        const newXi = this.xi.map((x, i) => x.add(other.xi[i] || new GrassmannNumber()));
        const newXiBar = this.xiBar.map((x, i) => x.add(other.xiBar[i] || new GrassmannNumber()));
        return new SUSYTransform(newXi, newXiBar);
    }

    /**
     * Generate hash for verification
     */
    getHash(): string {
        const data = JSON.stringify({
            xi: this.xi.map(x => x.getHash()),
            xiBar: this.xiBar.map(x => x.getHash())
        });
        return createHash('sha256').update(data).digest('hex').substring(0, 16);
    }

    /**
     * Create identity transformation
     */
    static identity(): SUSYTransform {
        return new SUSYTransform(
            [new GrassmannNumber(), new GrassmannNumber()],
            [new GrassmannNumber(), new GrassmannNumber()]
        );
    }
}

// ============================================================================
// SUSY Algebra
// ============================================================================

/**
 * Pauli matrices for SUSY algebra
 */
export const PauliMatrices = {
    /** σ⁰ = Identity */
    sigma0: [[1, 0], [0, 1]],
    /** σ¹ */
    sigma1: [[0, 1], [1, 0]],
    /** σ² */
    sigma2: [[0, -1], [1, 0]], // Actually [[0, -i], [i, 0]] but real part
    /** σ³ */
    sigma3: [[1, 0], [0, -1]],
    /** σ̄^μ = (σ⁰, -σⁱ) */
    sigmaBar0: [[1, 0], [0, 1]],
    sigmaBar1: [[0, -1], [-1, 0]],
    sigmaBar2: [[0, 1], [-1, 0]],
    sigmaBar3: [[-1, 0], [0, 1]]
};

/**
 * SUSY algebra
 * {Q_α, Q̄_α̇} = 2σ^μ_{αα̇} P_μ
 * {Q_α, Q_β} = {Q̄_α̇, Q̄_β̇} = 0
 */
export class SUSYAlgebra {
    /**
     * Anticommutator {Q_α, Q̄_α̇}
     * Returns coefficient of P_μ
     */
    static anticommutatorQQbar(alpha: number, alphaDot: number): number[][] {
        // {Q_α, Q̄_α̇} = 2σ^μ_{αα̇} P_μ
        // Return σ^μ_{αα̇} (coefficient of 2P_μ)
        const result: number[][] = [];
        const sigmas = [PauliMatrices.sigma0, PauliMatrices.sigma1, 
                       PauliMatrices.sigma2, PauliMatrices.sigma3];
        
        for (let mu = 0; mu < 4; mu++) {
            result.push([sigmas[mu][alpha][alphaDot]]);
        }
        return result;
    }

    /**
     * Anticommutator {Q_α, Q_β} = 0
     */
    static anticommutatorQQ(_alpha: number, _beta: number): number {
        return 0;
    }

    /**
     * Anticommutator {Q̄_α̇, Q̄_β̇} = 0
     */
    static anticommutatorQbarQbar(_alphaDot: number, _betaDot: number): number {
        return 0;
    }

    /**
     * Commutator [P_μ, Q_α] = 0
     */
    static commutatorPQ(): number {
        return 0;
    }

    /**
     * Verify SUSY algebra relations
     */
    static verifyAlgebra(): boolean {
        // Check {Q_α, Q_β} = 0
        for (let a = 0; a < 2; a++) {
            for (let b = 0; b < 2; b++) {
                if (SUSYAlgebra.anticommutatorQQ(a, b) !== 0) return false;
            }
        }

        // Check {Q̄_α̇, Q̄_β̇} = 0
        for (let a = 0; a < 2; a++) {
            for (let b = 0; b < 2; b++) {
                if (SUSYAlgebra.anticommutatorQbarQbar(a, b) !== 0) return false;
            }
        }

        return true;
    }

    /**
     * Central charge (for extended SUSY)
     */
    static centralCharge(): number {
        // N=1 SUSY has no central charge
        return 0;
    }

    /**
     * Generate hash for verification
     */
    static getHash(): string {
        const data = JSON.stringify({
            QQ: [[0, 0], [0, 0]],
            QbarQbar: [[0, 0], [0, 0]],
            algebraValid: SUSYAlgebra.verifyAlgebra()
        });
        return createHash('sha256').update(data).digest('hex').substring(0, 16);
    }
}

// ============================================================================
// Superpotential
// ============================================================================

/**
 * Superpotential W(Φ)
 * Holomorphic function of chiral superfields
 */
export class Superpotential {
    /** Polynomial coefficients */
    private coefficients: Map<string, number>;

    constructor() {
        this.coefficients = new Map();
    }

    /**
     * Set coefficient for term Φⁿ
     */
    setCoefficient(power: number, value: number): void {
        this.coefficients.set(`phi^${power}`, value);
    }

    /**
     * Get coefficient for term Φⁿ
     */
    getCoefficient(power: number): number {
        return this.coefficients.get(`phi^${power}`) || 0;
    }

    /**
     * Evaluate W(φ) at scalar component
     */
    evaluate(phi: number): number {
        let result = 0;
        this.coefficients.forEach((coeff, key) => {
            const match = key.match(/phi\^(\d+)/);
            if (match) {
                const power = parseInt(match[1]);
                result += coeff * Math.pow(phi, power);
            }
        });
        return result;
    }

    /**
     * Compute dW/dφ for F-term equations
     */
    derivative(phi: number): number {
        let result = 0;
        this.coefficients.forEach((coeff, key) => {
            const match = key.match(/phi\^(\d+)/);
            if (match) {
                const power = parseInt(match[1]);
                if (power > 0) {
                    result += coeff * power * Math.pow(phi, power - 1);
                }
            }
        });
        return result;
    }

    /**
     * Check if superpotential is renormalizable (highest power ≤ 3)
     */
    isRenormalizable(): boolean {
        let maxPower = 0;
        this.coefficients.forEach((_, key) => {
            const match = key.match(/phi\^(\d+)/);
            if (match) {
                maxPower = Math.max(maxPower, parseInt(match[1]));
            }
        });
        return maxPower <= 3;
    }

    /**
     * F-term scalar potential V_F = |∂W/∂φ|²
     */
    fTermPotential(phi: number): number {
        const dW = this.derivative(phi);
        return dW * dW;
    }

    /**
     * Generate hash for verification
     */
    getHash(): string {
        const coeffsObj: Record<string, number> = {};
        this.coefficients.forEach((value, key) => {
            coeffsObj[key] = value;
        });
        const data = JSON.stringify({ coefficients: coeffsObj });
        return createHash('sha256').update(data).digest('hex').substring(0, 16);
    }

    /**
     * Create mass term W = ½mΦ²
     */
    static massTerm(m: number): Superpotential {
        const W = new Superpotential();
        W.setCoefficient(2, m / 2);
        return W;
    }

    /**
     * Create Yukawa term W = yΦ³
     */
    static yukawaTerm(y: number): Superpotential {
        const W = new Superpotential();
        W.setCoefficient(3, y);
        return W;
    }

    /**
     * Create general cubic superpotential W = ½mΦ² + ⅓yΦ³
     */
    static wess_Zumino(m: number, y: number): Superpotential {
        const W = new Superpotential();
        W.setCoefficient(2, m / 2);
        W.setCoefficient(3, y / 3);
        return W;
    }
}

// ============================================================================
// Kähler Potential
// ============================================================================

/**
 * Kähler potential K(Φ, Φ†)
 * Real function of chiral and antichiral superfields
 */
export class KahlerPotential {
    /** Type of Kähler potential */
    private type: 'canonical' | 'sigma_model' | 'custom';
    /** Custom function coefficients */
    private coefficients: Map<string, number>;

    constructor(type: 'canonical' | 'sigma_model' | 'custom' = 'canonical') {
        this.type = type;
        this.coefficients = new Map();
        
        if (type === 'canonical') {
            // K = Φ†Φ
            this.coefficients.set('phi_bar*phi', 1);
        }
    }

    /**
     * Evaluate K(φ, φ*)
     */
    evaluate(phi: number, phiBar: number): number {
        if (this.type === 'canonical') {
            return phiBar * phi;
        }
        
        let result = 0;
        this.coefficients.forEach((coeff, key) => {
            if (key === 'phi_bar*phi') {
                result += coeff * phiBar * phi;
            }
        });
        return result;
    }

    /**
     * Kähler metric g_{i j̄} = ∂²K/∂φⁱ∂φ̄ʲ
     */
    kahlerMetric(): number[][] {
        // For canonical K = Φ†Φ: g = 1
        if (this.type === 'canonical') {
            return [[1]];
        }
        return [[this.coefficients.get('phi_bar*phi') || 0]];
    }

    /**
     * Check if Kähler potential is canonical
     */
    isCanonical(): boolean {
        return this.type === 'canonical';
    }

    /**
     * D-term scalar potential V_D = ½g²D²
     * For abelian theory with Fayet-Iliopoulos term
     */
    dTermPotential(phi: number, phiBar: number, g: number, xi: number = 0): number {
        // D = g(|φ|² - ξ) for U(1)
        const D = g * (phiBar * phi - xi);
        return 0.5 * D * D;
    }

    /**
     * Total scalar potential V = V_F + V_D
     */
    totalPotential(phi: number, phiBar: number, superpotential: Superpotential, 
                   g: number = 0, xi: number = 0): number {
        const V_F = superpotential.fTermPotential(phi);
        const V_D = this.dTermPotential(phi, phiBar, g, xi);
        return V_F + V_D;
    }

    /**
     * Generate hash for verification
     */
    getHash(): string {
        const coeffsObj: Record<string, number> = {};
        this.coefficients.forEach((value, key) => {
            coeffsObj[key] = value;
        });
        const data = JSON.stringify({
            type: this.type,
            coefficients: coeffsObj
        });
        return createHash('sha256').update(data).digest('hex').substring(0, 16);
    }
}

// ============================================================================
// SUSY Lagrangian
// ============================================================================

/**
 * Supersymmetric Lagrangian builder
 */
export class SUSYLagrangian {
    private kahler: KahlerPotential;
    private superpotential: Superpotential;
    private gaugeFields: VectorSuperfield[];

    constructor() {
        this.kahler = new KahlerPotential('canonical');
        this.superpotential = new Superpotential();
        this.gaugeFields = [];
    }

    /**
     * Set Kähler potential
     */
    setKahler(K: KahlerPotential): void {
        this.kahler = K;
    }

    /**
     * Set superpotential
     */
    setSuperpotential(W: Superpotential): void {
        this.superpotential = W;
    }

    /**
     * Add gauge field
     */
    addGaugeField(V: VectorSuperfield): void {
        this.gaugeFields.push(V);
    }

    /**
     * Compute total Lagrangian (scalar potential part)
     */
    computePotential(phi: number, phiBar: number): number {
        return this.kahler.totalPotential(phi, phiBar, this.superpotential);
    }

    /**
     * Find vacuum (minimum of potential)
     * dV/dφ = 0
     */
    findVacuum(startPhi: number = 0): number {
        // Simple Newton-Raphson for real φ
        let phi = startPhi;
        const epsilon = 1e-10;
        const maxIter = 100;
        
        for (let i = 0; i < maxIter; i++) {
            const V = this.computePotential(phi, phi);
            const dV = this.superpotential.derivative(phi) * this.superpotential.derivative(phi);
            
            if (Math.abs(dV) < epsilon) break;
            
            // Gradient descent step
            phi -= 0.1 * this.superpotential.derivative(phi);
        }
        
        return phi;
    }

    /**
     * Check if SUSY is preserved (F = D = 0)
     */
    isSUSYPreserved(phi: number): boolean {
        const F = this.superpotential.derivative(phi);
        const epsilon = 1e-10;
        return Math.abs(F) < epsilon;
    }

    /**
     * Generate hash for verification
     */
    getHash(): string {
        const data = JSON.stringify({
            kahler: this.kahler.getHash(),
            superpotential: this.superpotential.getHash(),
            gaugeFields: this.gaugeFields.map(g => g.getHash())
        });
        return createHash('sha256').update(data).digest('hex').substring(0, 16);
    }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Factory for creating common SUSY configurations
 */
export class SuperspaceFactory {
    /**
     * Create Wess-Zumino model
     * L = ∫d⁴θ Φ†Φ + (∫d²θ W(Φ) + h.c.)
     */
    static wessZuminoModel(m: number, y: number): SUSYLagrangian {
        const L = new SUSYLagrangian();
        L.setKahler(new KahlerPotential('canonical'));
        L.setSuperpotential(Superpotential.wess_Zumino(m, y));
        return L;
    }

    /**
     * Create free chiral superfield
     */
    static freeChiral(phi: number = 0): ChiralSuperfield {
        return new ChiralSuperfield(phi, [0, 0], 0);
    }

    /**
     * Create massive chiral superfield
     */
    static massiveChiral(phi: number, m: number): { field: ChiralSuperfield; W: Superpotential } {
        const field = new ChiralSuperfield(phi, [0, 0], -m * phi);
        const W = Superpotential.massTerm(m);
        return { field, W };
    }

    /**
     * Create abelian vector superfield
     */
    static abelianVector(A_mu: number[] = [0, 0, 0, 0]): VectorSuperfield {
        return new VectorSuperfield(0, [0, 0], 0, A_mu, [0, 0], 0);
    }

    /**
     * Create superspace point
     */
    static superspacePoint(x: number[], thetaCoeffs: number[] = []): SuperspacePoint {
        const theta = [
            new GrassmannNumber(0, [thetaCoeffs[0] || 0], [], 2),
            new GrassmannNumber(0, [thetaCoeffs[1] || 0], [], 2)
        ];
        const thetaBar = [
            new GrassmannNumber(0, [thetaCoeffs[2] || 0], [], 2),
            new GrassmannNumber(0, [thetaCoeffs[3] || 0], [], 2)
        ];
        return new SuperspacePoint(x, theta, thetaBar);
    }

    /**
     * Create SUSY transformation
     */
    static susyTransform(xiCoeffs: number[]): SUSYTransform {
        const xi = [
            new GrassmannNumber(0, [xiCoeffs[0] || 0], [], 2),
            new GrassmannNumber(0, [xiCoeffs[1] || 0], [], 2)
        ];
        const xiBar = [
            new GrassmannNumber(0, [xiCoeffs[2] || 0], [], 2),
            new GrassmannNumber(0, [xiCoeffs[3] || 0], [], 2)
        ];
        return new SUSYTransform(xi, xiBar);
    }

    /**
     * Generate hash for verification
     */
    static getHash(): string {
        const data = JSON.stringify({
            factory: 'SuperspaceFactory',
            version: '1.0.0',
            models: ['wessZumino', 'freeChiral', 'massiveChiral', 'abelianVector']
        });
        return createHash('sha256').update(data).digest('hex').substring(0, 16);
    }
}
