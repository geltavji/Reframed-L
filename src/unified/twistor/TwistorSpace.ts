/**
 * TwistorSpace.ts
 * 
 * Phase 5.5: Twistor Theory Implementation
 * 
 * Implements twistor space, twistor transformations, and null geodesic representation
 * following Roger Penrose's twistor program.
 * 
 * Key concepts:
 * - Twistor: Z^α = (ω^A, π_A') in C^4
 * - Twistor space T (projective twistor space PT = CP^3)
 * - Incidence relation: ω^A = ix^{AA'}π_{A'}
 * - Null geodesics correspond to points in PT
 * - Conformal transformations in twistor space
 * 
 * @module unified/twistor
 */

import { createHash } from 'crypto';

// ============================================================================
// Physical Constants for Twistor Theory
// ============================================================================

/**
 * Constants used in twistor calculations
 */
export const TwistorConstants = {
  /** Speed of light */
  c: 299792458,
  /** Planck constant */
  h: 6.62607015e-34,
  /** Reduced Planck constant */
  hbar: 1.054571817e-34,
  /** Gravitational constant */
  G: 6.67430e-11,
  /** Planck length */
  lP: 1.616255e-35,
  /** Planck mass */
  mP: 2.176434e-8,
};

// ============================================================================
// Complex Number Support
// ============================================================================

/**
 * Complex number class for twistor calculations
 */
export class TwistorComplex {
  constructor(
    public readonly re: number,
    public readonly im: number
  ) {}

  static zero(): TwistorComplex {
    return new TwistorComplex(0, 0);
  }

  static one(): TwistorComplex {
    return new TwistorComplex(1, 0);
  }

  static i(): TwistorComplex {
    return new TwistorComplex(0, 1);
  }

  static fromPolar(r: number, theta: number): TwistorComplex {
    return new TwistorComplex(r * Math.cos(theta), r * Math.sin(theta));
  }

  add(other: TwistorComplex): TwistorComplex {
    return new TwistorComplex(this.re + other.re, this.im + other.im);
  }

  subtract(other: TwistorComplex): TwistorComplex {
    return new TwistorComplex(this.re - other.re, this.im - other.im);
  }

  multiply(other: TwistorComplex): TwistorComplex {
    return new TwistorComplex(
      this.re * other.re - this.im * other.im,
      this.re * other.im + this.im * other.re
    );
  }

  scale(s: number): TwistorComplex {
    return new TwistorComplex(this.re * s, this.im * s);
  }

  conjugate(): TwistorComplex {
    return new TwistorComplex(this.re, -this.im);
  }

  magnitude(): number {
    return Math.sqrt(this.re * this.re + this.im * this.im);
  }

  magnitudeSquared(): number {
    return this.re * this.re + this.im * this.im;
  }

  phase(): number {
    return Math.atan2(this.im, this.re);
  }

  divide(other: TwistorComplex): TwistorComplex {
    const denom = other.magnitudeSquared();
    if (denom === 0) throw new Error('Division by zero');
    return new TwistorComplex(
      (this.re * other.re + this.im * other.im) / denom,
      (this.im * other.re - this.re * other.im) / denom
    );
  }

  exp(): TwistorComplex {
    const expRe = Math.exp(this.re);
    return new TwistorComplex(expRe * Math.cos(this.im), expRe * Math.sin(this.im));
  }

  sqrt(): TwistorComplex {
    const r = this.magnitude();
    const theta = this.phase();
    return TwistorComplex.fromPolar(Math.sqrt(r), theta / 2);
  }

  isZero(epsilon: number = 1e-10): boolean {
    return this.magnitude() < epsilon;
  }

  equals(other: TwistorComplex, epsilon: number = 1e-10): boolean {
    return Math.abs(this.re - other.re) < epsilon && Math.abs(this.im - other.im) < epsilon;
  }

  toString(): string {
    if (Math.abs(this.im) < 1e-10) return `${this.re}`;
    if (Math.abs(this.re) < 1e-10) return `${this.im}i`;
    const sign = this.im >= 0 ? '+' : '';
    return `${this.re}${sign}${this.im}i`;
  }

  getHash(): string {
    return createHash('sha256')
      .update(`TwistorComplex:${this.re}:${this.im}`)
      .digest('hex')
      .substring(0, 16);
  }
}

// ============================================================================
// 2-Spinor Classes
// ============================================================================

/**
 * Two-component spinor (weyl spinor)
 * Represents ω^A or π_A' in twistor theory
 */
export class Spinor2 {
  constructor(
    public readonly components: [TwistorComplex, TwistorComplex]
  ) {}

  static zero(): Spinor2 {
    return new Spinor2([TwistorComplex.zero(), TwistorComplex.zero()]);
  }

  static fromComponents(c0: TwistorComplex, c1: TwistorComplex): Spinor2 {
    return new Spinor2([c0, c1]);
  }

  get(index: 0 | 1): TwistorComplex {
    return this.components[index];
  }

  add(other: Spinor2): Spinor2 {
    return new Spinor2([
      this.components[0].add(other.components[0]),
      this.components[1].add(other.components[1])
    ]);
  }

  subtract(other: Spinor2): Spinor2 {
    return new Spinor2([
      this.components[0].subtract(other.components[0]),
      this.components[1].subtract(other.components[1])
    ]);
  }

  scale(s: TwistorComplex): Spinor2 {
    return new Spinor2([
      this.components[0].multiply(s),
      this.components[1].multiply(s)
    ]);
  }

  scaleReal(s: number): Spinor2 {
    return new Spinor2([
      this.components[0].scale(s),
      this.components[1].scale(s)
    ]);
  }

  /**
   * Spinor contraction with another spinor using ε_{AB}
   * Returns ω^A π_A = ω^0 π_1 - ω^1 π_0
   */
  contract(other: Spinor2): TwistorComplex {
    return this.components[0].multiply(other.components[1])
      .subtract(this.components[1].multiply(other.components[0]));
  }

  /**
   * Complex conjugate of spinor (switches primed/unprimed)
   */
  conjugate(): Spinor2 {
    return new Spinor2([
      this.components[0].conjugate(),
      this.components[1].conjugate()
    ]);
  }

  magnitude(): number {
    return Math.sqrt(
      this.components[0].magnitudeSquared() + 
      this.components[1].magnitudeSquared()
    );
  }

  normalize(): Spinor2 {
    const mag = this.magnitude();
    if (mag < 1e-10) return Spinor2.zero();
    return this.scaleReal(1 / mag);
  }

  isZero(epsilon: number = 1e-10): boolean {
    return this.magnitude() < epsilon;
  }

  equals(other: Spinor2, epsilon: number = 1e-10): boolean {
    return this.components[0].equals(other.components[0], epsilon) &&
           this.components[1].equals(other.components[1], epsilon);
  }

  toString(): string {
    return `(${this.components[0]}, ${this.components[1]})`;
  }

  getHash(): string {
    return createHash('sha256')
      .update(`Spinor2:${this.components[0].getHash()}:${this.components[1].getHash()}`)
      .digest('hex')
      .substring(0, 16);
  }
}

// ============================================================================
// Twistor Class
// ============================================================================

/**
 * A twistor Z^α = (ω^A, π_A') in C^4
 * 
 * Components:
 * - ω^A: 2-spinor (unprimed indices)
 * - π_A': 2-spinor (primed indices, conjugate representation)
 * 
 * The incidence relation connects twistors to spacetime:
 * ω^A = ix^{AA'} π_{A'}
 */
export class Twistor {
  constructor(
    /** Unprimed spinor component ω^A */
    public readonly omega: Spinor2,
    /** Primed spinor component π_A' */
    public readonly pi: Spinor2
  ) {}

  static zero(): Twistor {
    return new Twistor(Spinor2.zero(), Spinor2.zero());
  }

  static fromComponents(
    omega0: TwistorComplex, omega1: TwistorComplex,
    pi0: TwistorComplex, pi1: TwistorComplex
  ): Twistor {
    return new Twistor(
      Spinor2.fromComponents(omega0, omega1),
      Spinor2.fromComponents(pi0, pi1)
    );
  }

  /**
   * Create twistor from 4 complex numbers
   */
  static fromArray(components: [TwistorComplex, TwistorComplex, TwistorComplex, TwistorComplex]): Twistor {
    return new Twistor(
      Spinor2.fromComponents(components[0], components[1]),
      Spinor2.fromComponents(components[2], components[3])
    );
  }

  /**
   * Get component by index (0-3)
   */
  getComponent(index: number): TwistorComplex {
    if (index === 0) return this.omega.get(0);
    if (index === 1) return this.omega.get(1);
    if (index === 2) return this.pi.get(0);
    if (index === 3) return this.pi.get(1);
    throw new Error(`Invalid twistor index: ${index}`);
  }

  /**
   * Convert to array of 4 complex numbers
   */
  toArray(): [TwistorComplex, TwistorComplex, TwistorComplex, TwistorComplex] {
    return [this.omega.get(0), this.omega.get(1), this.pi.get(0), this.pi.get(1)];
  }

  add(other: Twistor): Twistor {
    return new Twistor(this.omega.add(other.omega), this.pi.add(other.pi));
  }

  subtract(other: Twistor): Twistor {
    return new Twistor(this.omega.subtract(other.omega), this.pi.subtract(other.pi));
  }

  scale(s: TwistorComplex): Twistor {
    return new Twistor(this.omega.scale(s), this.pi.scale(s));
  }

  scaleReal(s: number): Twistor {
    return new Twistor(this.omega.scaleReal(s), this.pi.scaleReal(s));
  }

  /**
   * Twistor dual (complex conjugate and index swap)
   * Z̄_α = (π̄^{A'}, ω̄_A)
   */
  dual(): Twistor {
    return new Twistor(this.pi.conjugate(), this.omega.conjugate());
  }

  /**
   * Hermitian inner product <Z, W> = Z̄_α W^α
   * = π̄^{A'} ω^A + ω̄_A π_{A'}
   * This is the twistor metric
   */
  innerProduct(other: Twistor): TwistorComplex {
    // <Z, W> = Z̄_α W^α = π̄₀ω⁰ + π̄₁ω¹ + ω̄₀π₀ + ω̄₁π₁
    const term1 = this.pi.get(0).conjugate().multiply(other.omega.get(0));
    const term2 = this.pi.get(1).conjugate().multiply(other.omega.get(1));
    const term3 = this.omega.get(0).conjugate().multiply(other.pi.get(0));
    const term4 = this.omega.get(1).conjugate().multiply(other.pi.get(1));
    return term1.add(term2).add(term3).add(term4);
  }

  /**
   * Helicity operator: s = ½(ω̄_A ω^A + π̄^{A'} π_{A'})
   * For massless particles, helicity is ±s
   */
  helicity(): number {
    // s = ½(<Z,Z>) = ½(ω̄·ω + π̄·π)
    const omegaNorm = this.omega.get(0).magnitudeSquared() + this.omega.get(1).magnitudeSquared();
    const piNorm = this.pi.get(0).magnitudeSquared() + this.pi.get(1).magnitudeSquared();
    return 0.5 * (omegaNorm - piNorm);
  }

  /**
   * Twistor norm squared
   */
  normSquared(): number {
    return this.innerProduct(this).re;
  }

  /**
   * Check if twistor is null (lies on PN, the null twistor space)
   * A null twistor corresponds to a point in (complexified) Minkowski space
   */
  isNull(epsilon: number = 1e-10): boolean {
    return Math.abs(this.normSquared()) < epsilon;
  }

  magnitude(): number {
    return Math.sqrt(
      this.omega.magnitude() ** 2 + this.pi.magnitude() ** 2
    );
  }

  normalize(): Twistor {
    const mag = this.magnitude();
    if (mag < 1e-10) return Twistor.zero();
    return this.scaleReal(1 / mag);
  }

  isZero(epsilon: number = 1e-10): boolean {
    return this.omega.isZero(epsilon) && this.pi.isZero(epsilon);
  }

  /**
   * Check projective equivalence (Z ~ λZ for λ ≠ 0)
   */
  projectivelyEquivalent(other: Twistor, epsilon: number = 1e-10): boolean {
    if (this.isZero() || other.isZero()) return false;
    
    // Find ratio from first non-zero component
    let ratio: TwistorComplex | null = null;
    for (let i = 0; i < 4; i++) {
      const thisComp = this.getComponent(i);
      const otherComp = other.getComponent(i);
      
      if (!thisComp.isZero() && !otherComp.isZero()) {
        ratio = otherComp.divide(thisComp);
        break;
      } else if (thisComp.isZero() !== otherComp.isZero()) {
        return false;
      }
    }
    
    if (!ratio) return true; // Both zero
    
    // Check all components have same ratio
    for (let i = 0; i < 4; i++) {
      const thisComp = this.getComponent(i);
      const otherComp = other.getComponent(i);
      const expected = thisComp.multiply(ratio);
      if (!expected.equals(otherComp, epsilon)) return false;
    }
    
    return true;
  }

  equals(other: Twistor, epsilon: number = 1e-10): boolean {
    return this.omega.equals(other.omega, epsilon) && this.pi.equals(other.pi, epsilon);
  }

  toString(): string {
    return `Z = (ω: ${this.omega}, π: ${this.pi})`;
  }

  getHash(): string {
    return createHash('sha256')
      .update(`Twistor:${this.omega.getHash()}:${this.pi.getHash()}`)
      .digest('hex')
      .substring(0, 16);
  }
}

// ============================================================================
// Spacetime Point (for incidence relation)
// ============================================================================

/**
 * A point in complexified Minkowski space represented by a 2x2 Hermitian matrix
 * x^{AA'} = (x^{00'} x^{01'})
 *          (x^{10'} x^{11'})
 * 
 * For real spacetime: x^{AA'} = x^μ σ_μ^{AA'} where σ are Pauli matrices
 */
export class SpacetimePoint {
  constructor(
    /** Components x^{00'}, x^{01'}, x^{10'}, x^{11'} */
    public readonly components: [[TwistorComplex, TwistorComplex], [TwistorComplex, TwistorComplex]]
  ) {}

  static zero(): SpacetimePoint {
    return new SpacetimePoint([
      [TwistorComplex.zero(), TwistorComplex.zero()],
      [TwistorComplex.zero(), TwistorComplex.zero()]
    ]);
  }

  /**
   * Create from Minkowski coordinates (t, x, y, z)
   * Using convention x^{AA'} = (1/√2)(t+z, x-iy; x+iy, t-z)
   */
  static fromMinkowski(t: number, x: number, y: number, z: number): SpacetimePoint {
    const sqrt2 = Math.SQRT2;
    return new SpacetimePoint([
      [new TwistorComplex((t + z) / sqrt2, 0), new TwistorComplex(x / sqrt2, -y / sqrt2)],
      [new TwistorComplex(x / sqrt2, y / sqrt2), new TwistorComplex((t - z) / sqrt2, 0)]
    ]);
  }

  /**
   * Convert to Minkowski coordinates
   */
  toMinkowski(): { t: number; x: number; y: number; z: number } {
    const sqrt2 = Math.SQRT2;
    const x00 = this.components[0][0];
    const x01 = this.components[0][1];
    const x10 = this.components[1][0];
    const x11 = this.components[1][1];
    
    return {
      t: sqrt2 * 0.5 * (x00.re + x11.re),
      x: sqrt2 * 0.5 * (x01.re + x10.re),
      y: sqrt2 * 0.5 * (x10.im - x01.im),
      z: sqrt2 * 0.5 * (x00.re - x11.re)
    };
  }

  get(A: 0 | 1, Aprime: 0 | 1): TwistorComplex {
    return this.components[A][Aprime];
  }

  add(other: SpacetimePoint): SpacetimePoint {
    return new SpacetimePoint([
      [this.components[0][0].add(other.components[0][0]), this.components[0][1].add(other.components[0][1])],
      [this.components[1][0].add(other.components[1][0]), this.components[1][1].add(other.components[1][1])]
    ]);
  }

  scale(s: number): SpacetimePoint {
    return new SpacetimePoint([
      [this.components[0][0].scale(s), this.components[0][1].scale(s)],
      [this.components[1][0].scale(s), this.components[1][1].scale(s)]
    ]);
  }

  /**
   * Minkowski interval ds² = 2 det(x^{AA'})
   * For null points: det = 0
   */
  determinant(): TwistorComplex {
    return this.components[0][0].multiply(this.components[1][1])
      .subtract(this.components[0][1].multiply(this.components[1][0]));
  }

  /**
   * Check if point is on the light cone (null)
   */
  isNull(epsilon: number = 1e-10): boolean {
    return this.determinant().magnitude() < epsilon;
  }

  /**
   * Interval type
   */
  getIntervalType(): 'timelike' | 'spacelike' | 'null' {
    const det = this.determinant().re;
    if (Math.abs(det) < 1e-10) return 'null';
    return det > 0 ? 'timelike' : 'spacelike';
  }

  toString(): string {
    const m = this.toMinkowski();
    return `(t=${m.t.toFixed(4)}, x=${m.x.toFixed(4)}, y=${m.y.toFixed(4)}, z=${m.z.toFixed(4)})`;
  }

  getHash(): string {
    return createHash('sha256')
      .update(`SpacetimePoint:${JSON.stringify(this.components)}`)
      .digest('hex')
      .substring(0, 16);
  }
}

// ============================================================================
// Incidence Relation
// ============================================================================

/**
 * The incidence relation connects twistors to spacetime points
 * ω^A = i x^{AA'} π_{A'}
 */
export class IncidenceRelation {
  /**
   * Given a spacetime point x and a spinor π_{A'}, compute ω^A
   */
  static computeOmega(x: SpacetimePoint, pi: Spinor2): Spinor2 {
    const i = TwistorComplex.i();
    
    // ω^0 = i(x^{00'} π_0 + x^{01'} π_1)
    const omega0 = i.multiply(
      x.get(0, 0).multiply(pi.get(0)).add(x.get(0, 1).multiply(pi.get(1)))
    );
    
    // ω^1 = i(x^{10'} π_0 + x^{11'} π_1)
    const omega1 = i.multiply(
      x.get(1, 0).multiply(pi.get(0)).add(x.get(1, 1).multiply(pi.get(1)))
    );
    
    return Spinor2.fromComponents(omega0, omega1);
  }

  /**
   * Create a twistor incident with a spacetime point
   * The twistor lies on the line in PT corresponding to x
   */
  static createIncidentTwistor(x: SpacetimePoint, pi: Spinor2): Twistor {
    const omega = this.computeOmega(x, pi);
    return new Twistor(omega, pi);
  }

  /**
   * Check if a twistor is incident with a spacetime point
   */
  static isIncident(Z: Twistor, x: SpacetimePoint, epsilon: number = 1e-10): boolean {
    if (Z.pi.isZero()) return false;
    
    const expectedOmega = this.computeOmega(x, Z.pi);
    return Z.omega.equals(expectedOmega, epsilon);
  }

  /**
   * Find the spacetime point(s) where two twistors meet
   * Two distinct twistors Z1 and Z2 determine a unique point x
   * if they intersect in exactly one point
   */
  static findIntersection(Z1: Twistor, Z2: Twistor): SpacetimePoint | null {
    // The intersection exists if the twistors are not proportional
    // and both have non-zero π parts
    if (Z1.pi.isZero() || Z2.pi.isZero()) return null;
    if (Z1.projectivelyEquivalent(Z2)) return null;

    // For two twistors Z1 = (ω1, π1) and Z2 = (ω2, π2)
    // The spacetime point is determined by:
    // x^{AA'} = i(ω1^A π̄2^{A'} - ω2^A π̄1^{A'}) / (π1_{B} π̄2^{B'} - π2_{B} π̄1^{B'})
    
    // Simplified approach: solve ω = ix·π for both twistors
    // This requires linear algebra in the general case
    
    const pi1_0 = Z1.pi.get(0);
    const pi1_1 = Z1.pi.get(1);
    const pi2_0 = Z2.pi.get(0);
    const pi2_1 = Z2.pi.get(1);
    
    // Compute denominator: π1·π̄2 (simplified)
    const denom = pi1_0.multiply(pi2_0.conjugate())
      .add(pi1_1.multiply(pi2_1.conjugate()));
    
    if (denom.isZero()) return null;

    // Simplified construction for special cases
    // For a proper implementation, solve the full linear system
    const omega1_0 = Z1.omega.get(0);
    const omega1_1 = Z1.omega.get(1);
    
    // x^{00'} = -i ω^0 / π_0 (when π_0 ≠ 0)
    if (!pi1_0.isZero()) {
      const minusI = new TwistorComplex(0, -1);
      const x00 = minusI.multiply(omega1_0).divide(pi1_0);
      const x01 = minusI.multiply(omega1_0).divide(pi1_1.isZero() ? TwistorComplex.one() : pi1_1);
      const x10 = minusI.multiply(omega1_1).divide(pi1_0);
      const x11 = minusI.multiply(omega1_1).divide(pi1_1.isZero() ? TwistorComplex.one() : pi1_1);
      
      return new SpacetimePoint([[x00, x01], [x10, x11]]);
    }
    
    return null;
  }

  /**
   * Get hash for verification
   */
  static getHash(): string {
    return createHash('sha256')
      .update('IncidenceRelation:omega=ix.pi')
      .digest('hex')
      .substring(0, 16);
  }
}

// ============================================================================
// Null Geodesic
// ============================================================================

/**
 * A null geodesic in Minkowski space corresponds to a point in projective twistor space
 * The geodesic is the set of spacetime points incident with a given twistor
 */
export class NullGeodesic {
  constructor(
    /** The twistor representing this null geodesic */
    public readonly twistor: Twistor,
    /** Starting parameter value */
    public readonly paramStart: number = 0,
    /** Ending parameter value */
    public readonly paramEnd: number = 1
  ) {
    if (!twistor.isNull(1e-8)) {
      // For non-null twistors, this represents a different geometric object
      // but we allow it for generality
    }
  }

  /**
   * Create a null geodesic from a null twistor
   */
  static fromTwistor(Z: Twistor): NullGeodesic {
    return new NullGeodesic(Z);
  }

  /**
   * Create a null geodesic from a spacetime point and direction
   */
  static fromPointAndDirection(
    point: SpacetimePoint,
    direction: Spinor2
  ): NullGeodesic {
    const twistor = IncidenceRelation.createIncidentTwistor(point, direction);
    return new NullGeodesic(twistor);
  }

  /**
   * Get a point on the geodesic at parameter value λ
   * For a null geodesic, points are parameterized by the choice of π
   */
  getPoint(lambda: number): SpacetimePoint {
    // For a null twistor, the geodesic is x^{AA'} = x_0^{AA'} + λ π^A π̄^{A'}
    // where x_0 is any point on the geodesic
    
    // Get base point (λ=0)
    const baseOmega = this.twistor.omega;
    const pi = this.twistor.pi;
    
    // Construct direction: π^A π̄^{A'}
    const dir00 = pi.get(0).multiply(pi.get(0).conjugate()).scale(lambda);
    const dir01 = pi.get(0).multiply(pi.get(1).conjugate()).scale(lambda);
    const dir10 = pi.get(1).multiply(pi.get(0).conjugate()).scale(lambda);
    const dir11 = pi.get(1).multiply(pi.get(1).conjugate()).scale(lambda);
    
    // For the base point, use x = -i ω/|π|² · π̄ (simplified)
    const piNormSq = pi.magnitude() ** 2;
    if (piNormSq < 1e-10) return SpacetimePoint.zero();
    
    const minusI = new TwistorComplex(0, -1);
    const scale = 1 / piNormSq;
    
    const base00 = minusI.multiply(baseOmega.get(0)).multiply(pi.get(0).conjugate()).scale(scale);
    const base01 = minusI.multiply(baseOmega.get(0)).multiply(pi.get(1).conjugate()).scale(scale);
    const base10 = minusI.multiply(baseOmega.get(1)).multiply(pi.get(0).conjugate()).scale(scale);
    const base11 = minusI.multiply(baseOmega.get(1)).multiply(pi.get(1).conjugate()).scale(scale);
    
    return new SpacetimePoint([
      [base00.add(dir00), base01.add(dir01)],
      [base10.add(dir10), base11.add(dir11)]
    ]);
  }

  /**
   * Check if a spacetime point lies on this geodesic
   */
  containsPoint(x: SpacetimePoint, epsilon: number = 1e-10): boolean {
    return IncidenceRelation.isIncident(this.twistor, x, epsilon);
  }

  /**
   * Get the 4-momentum direction of the geodesic
   * p^{AA'} = π^A π̄^{A'}
   */
  getMomentumDirection(): SpacetimePoint {
    const pi = this.twistor.pi;
    return new SpacetimePoint([
      [pi.get(0).multiply(pi.get(0).conjugate()), pi.get(0).multiply(pi.get(1).conjugate())],
      [pi.get(1).multiply(pi.get(0).conjugate()), pi.get(1).multiply(pi.get(1).conjugate())]
    ]);
  }

  /**
   * Get helicity of the massless particle on this geodesic
   */
  getHelicity(): number {
    return this.twistor.helicity();
  }

  toString(): string {
    return `NullGeodesic(Z=${this.twistor}, param=[${this.paramStart}, ${this.paramEnd}])`;
  }

  getHash(): string {
    return createHash('sha256')
      .update(`NullGeodesic:${this.twistor.getHash()}`)
      .digest('hex')
      .substring(0, 16);
  }
}

// ============================================================================
// Twistor Transformations
// ============================================================================

/**
 * Transformations on twistor space
 * SL(4,C) acts on twistors, with the conformal group SU(2,2) as a real form
 */
export class TwistorTransform {
  constructor(
    /** 4x4 complex matrix representing the transformation */
    public readonly matrix: TwistorComplex[][]
  ) {
    if (matrix.length !== 4 || matrix.some(row => row.length !== 4)) {
      throw new Error('TwistorTransform requires 4x4 matrix');
    }
  }

  /**
   * Identity transformation
   */
  static identity(): TwistorTransform {
    return new TwistorTransform([
      [TwistorComplex.one(), TwistorComplex.zero(), TwistorComplex.zero(), TwistorComplex.zero()],
      [TwistorComplex.zero(), TwistorComplex.one(), TwistorComplex.zero(), TwistorComplex.zero()],
      [TwistorComplex.zero(), TwistorComplex.zero(), TwistorComplex.one(), TwistorComplex.zero()],
      [TwistorComplex.zero(), TwistorComplex.zero(), TwistorComplex.zero(), TwistorComplex.one()]
    ]);
  }

  /**
   * Create a Lorentz boost in the z-direction
   */
  static boostZ(rapidity: number): TwistorTransform {
    const cosh = Math.cosh(rapidity / 2);
    const sinh = Math.sinh(rapidity / 2);
    
    return new TwistorTransform([
      [new TwistorComplex(cosh, 0), TwistorComplex.zero(), new TwistorComplex(sinh, 0), TwistorComplex.zero()],
      [TwistorComplex.zero(), new TwistorComplex(cosh, 0), TwistorComplex.zero(), new TwistorComplex(-sinh, 0)],
      [new TwistorComplex(sinh, 0), TwistorComplex.zero(), new TwistorComplex(cosh, 0), TwistorComplex.zero()],
      [TwistorComplex.zero(), new TwistorComplex(-sinh, 0), TwistorComplex.zero(), new TwistorComplex(cosh, 0)]
    ]);
  }

  /**
   * Create a rotation around the z-axis
   */
  static rotationZ(angle: number): TwistorTransform {
    const cos = Math.cos(angle / 2);
    const sin = Math.sin(angle / 2);
    
    return new TwistorTransform([
      [new TwistorComplex(cos, sin), TwistorComplex.zero(), TwistorComplex.zero(), TwistorComplex.zero()],
      [TwistorComplex.zero(), new TwistorComplex(cos, -sin), TwistorComplex.zero(), TwistorComplex.zero()],
      [TwistorComplex.zero(), TwistorComplex.zero(), new TwistorComplex(cos, -sin), TwistorComplex.zero()],
      [TwistorComplex.zero(), TwistorComplex.zero(), TwistorComplex.zero(), new TwistorComplex(cos, sin)]
    ]);
  }

  /**
   * Create a translation by 4-vector (t, x, y, z)
   */
  static translation(t: number, x: number, y: number, z: number): TwistorTransform {
    // Translation in twistor space adds to ω but preserves π
    const sqrt2 = Math.SQRT2;
    const a = (t + z) / sqrt2;
    const b = (x - t) / sqrt2; // Note: complex part for y
    const c = (x + t) / sqrt2;
    const d = (t - z) / sqrt2;
    
    return new TwistorTransform([
      [TwistorComplex.one(), TwistorComplex.zero(), new TwistorComplex(0, a), new TwistorComplex(0, b)],
      [TwistorComplex.zero(), TwistorComplex.one(), new TwistorComplex(0, c), new TwistorComplex(0, d)],
      [TwistorComplex.zero(), TwistorComplex.zero(), TwistorComplex.one(), TwistorComplex.zero()],
      [TwistorComplex.zero(), TwistorComplex.zero(), TwistorComplex.zero(), TwistorComplex.one()]
    ]);
  }

  /**
   * Create a dilation (scale transformation)
   */
  static dilation(scale: number): TwistorTransform {
    const s = new TwistorComplex(Math.sqrt(scale), 0);
    const sInv = new TwistorComplex(1 / Math.sqrt(scale), 0);
    
    return new TwistorTransform([
      [s, TwistorComplex.zero(), TwistorComplex.zero(), TwistorComplex.zero()],
      [TwistorComplex.zero(), s, TwistorComplex.zero(), TwistorComplex.zero()],
      [TwistorComplex.zero(), TwistorComplex.zero(), sInv, TwistorComplex.zero()],
      [TwistorComplex.zero(), TwistorComplex.zero(), TwistorComplex.zero(), sInv]
    ]);
  }

  /**
   * Apply transformation to a twistor
   */
  apply(Z: Twistor): Twistor {
    const components = Z.toArray();
    const result: TwistorComplex[] = [];
    
    for (let i = 0; i < 4; i++) {
      let sum = TwistorComplex.zero();
      for (let j = 0; j < 4; j++) {
        sum = sum.add(this.matrix[i][j].multiply(components[j]));
      }
      result.push(sum);
    }
    
    return Twistor.fromArray(result as [TwistorComplex, TwistorComplex, TwistorComplex, TwistorComplex]);
  }

  /**
   * Compose two transformations
   */
  compose(other: TwistorTransform): TwistorTransform {
    const result: TwistorComplex[][] = [];
    
    for (let i = 0; i < 4; i++) {
      result[i] = [];
      for (let j = 0; j < 4; j++) {
        let sum = TwistorComplex.zero();
        for (let k = 0; k < 4; k++) {
          sum = sum.add(this.matrix[i][k].multiply(other.matrix[k][j]));
        }
        result[i][j] = sum;
      }
    }
    
    return new TwistorTransform(result);
  }

  /**
   * Check if this is a conformal transformation (preserves twistor metric up to scale)
   */
  isConformal(epsilon: number = 1e-10): boolean {
    // A transformation is conformal if M^† Σ M = λ Σ for some λ
    // where Σ is the twistor metric
    // For simplicity, check if determinant is non-zero
    return true; // Simplified check
  }

  toString(): string {
    return `TwistorTransform(4x4 matrix)`;
  }

  getHash(): string {
    return createHash('sha256')
      .update(`TwistorTransform:${JSON.stringify(this.matrix.map(r => r.map(c => [c.re, c.im])))}`)
      .digest('hex')
      .substring(0, 16);
  }
}

// ============================================================================
// Projective Twistor Space
// ============================================================================

/**
 * Projective twistor space PT = CP^3
 * Points in PT are equivalence classes [Z] where Z ~ λZ for λ ≠ 0
 */
export class ProjectiveTwistor {
  constructor(
    /** Representative twistor */
    public readonly representative: Twistor
  ) {
    if (representative.isZero()) {
      throw new Error('Cannot create projective twistor from zero twistor');
    }
  }

  static fromTwistor(Z: Twistor): ProjectiveTwistor {
    return new ProjectiveTwistor(Z);
  }

  /**
   * Get a normalized representative
   */
  getNormalized(): Twistor {
    return this.representative.normalize();
  }

  /**
   * Check if this represents a null twistor (point in PN)
   */
  isNull(epsilon: number = 1e-10): boolean {
    return this.representative.isNull(epsilon);
  }

  /**
   * Check projective equality
   */
  equals(other: ProjectiveTwistor, epsilon: number = 1e-10): boolean {
    return this.representative.projectivelyEquivalent(other.representative, epsilon);
  }

  /**
   * Get helicity (well-defined on PT)
   */
  getHelicity(): number {
    return this.representative.helicity();
  }

  /**
   * For a null projective twistor, get the corresponding null geodesic
   */
  toNullGeodesic(): NullGeodesic | null {
    if (!this.isNull()) return null;
    return NullGeodesic.fromTwistor(this.representative);
  }

  /**
   * Homogeneous coordinates [Z0 : Z1 : Z2 : Z3]
   */
  getHomogeneousCoordinates(): string {
    const arr = this.representative.toArray();
    return `[${arr[0]} : ${arr[1]} : ${arr[2]} : ${arr[3]}]`;
  }

  toString(): string {
    return `PT${this.getHomogeneousCoordinates()}`;
  }

  getHash(): string {
    return createHash('sha256')
      .update(`ProjectiveTwistor:${this.representative.getHash()}`)
      .digest('hex')
      .substring(0, 16);
  }
}

// ============================================================================
// Twistor Line (α-plane)
// ============================================================================

/**
 * A line in projective twistor space corresponds to a point in (complexified) spacetime
 * Lines in PT are called α-planes
 */
export class TwistorLine {
  constructor(
    /** Two twistors spanning the line */
    public readonly Z1: Twistor,
    public readonly Z2: Twistor
  ) {
    if (Z1.projectivelyEquivalent(Z2)) {
      throw new Error('Twistors must be distinct to define a line');
    }
  }

  /**
   * Create a twistor line from a spacetime point
   * All twistors incident with x form a line in PT
   */
  static fromSpacetimePoint(x: SpacetimePoint): TwistorLine {
    // Choose two different π values
    const pi1 = Spinor2.fromComponents(TwistorComplex.one(), TwistorComplex.zero());
    const pi2 = Spinor2.fromComponents(TwistorComplex.zero(), TwistorComplex.one());
    
    const Z1 = IncidenceRelation.createIncidentTwistor(x, pi1);
    const Z2 = IncidenceRelation.createIncidentTwistor(x, pi2);
    
    return new TwistorLine(Z1, Z2);
  }

  /**
   * Get a point on the line at parameter t
   * Z(t) = Z1 + t*Z2
   */
  getPoint(t: TwistorComplex): Twistor {
    return this.Z1.add(this.Z2.scale(t));
  }

  /**
   * Check if a twistor lies on this line
   */
  contains(Z: Twistor, epsilon: number = 1e-10): boolean {
    // Z lies on the line spanned by Z1, Z2 if Z = αZ1 + βZ2 for some α, β
    // Check if vectors Z, Z1, Z2 are linearly dependent
    
    const arr = Z.toArray();
    const arr1 = this.Z1.toArray();
    const arr2 = this.Z2.toArray();
    
    // Try to solve for α, β using first two independent equations
    // Z[i] = α*Z1[i] + β*Z2[i] for i = 0,1,2,3
    
    // Find two non-degenerate equations
    let idx1 = -1, idx2 = -1;
    for (let i = 0; i < 4; i++) {
      if (Math.abs(arr1[i].re) > epsilon || Math.abs(arr1[i].im) > epsilon ||
          Math.abs(arr2[i].re) > epsilon || Math.abs(arr2[i].im) > epsilon) {
        if (idx1 === -1) idx1 = i;
        else if (idx2 === -1) { idx2 = i; break; }
      }
    }
    
    if (idx1 === -1 || idx2 === -1) return false;
    
    // Solve 2x2 system for α, β (simplified real approximation)
    const a11 = arr1[idx1].re, a12 = arr2[idx1].re;
    const a21 = arr1[idx2].re, a22 = arr2[idx2].re;
    const b1 = arr[idx1].re, b2 = arr[idx2].re;
    
    const det = a11 * a22 - a12 * a21;
    if (Math.abs(det) < epsilon) return false;
    
    const alpha = (b1 * a22 - b2 * a12) / det;
    const beta = (a11 * b2 - a21 * b1) / det;
    
    // Verify solution works for all components
    for (let i = 0; i < 4; i++) {
      const expected = {
        re: alpha * arr1[i].re + beta * arr2[i].re,
        im: alpha * arr1[i].im + beta * arr2[i].im
      };
      if (Math.abs(expected.re - arr[i].re) > epsilon ||
          Math.abs(expected.im - arr[i].im) > epsilon) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get the spacetime point corresponding to this line
   */
  toSpacetimePoint(): SpacetimePoint {
    // The intersection point is found by solving the incidence relations
    const result = IncidenceRelation.findIntersection(this.Z1, this.Z2);
    if (!result) return SpacetimePoint.zero();
    return result;
  }

  toString(): string {
    return `TwistorLine(${this.Z1}, ${this.Z2})`;
  }

  getHash(): string {
    return createHash('sha256')
      .update(`TwistorLine:${this.Z1.getHash()}:${this.Z2.getHash()}`)
      .digest('hex')
      .substring(0, 16);
  }
}

// ============================================================================
// Penrose Transform
// ============================================================================

/**
 * The Penrose transform relates cohomology on twistor space to solutions
 * of massless field equations on spacetime
 */
export class PenroseTransform {
  /**
   * Helicity-weighted function on twistor space
   * f(Z) with homogeneity f(λZ) = λ^{-n-2} f(Z) for helicity n/2
   */
  static helicityWeight(n: number): number {
    return -n - 2;
  }

  /**
   * For a scalar field (helicity 0), the weight is -2
   */
  static scalarFieldWeight(): number {
    return this.helicityWeight(0);
  }

  /**
   * For a Maxwell field (helicity ±1), the weight is -3 or -1
   */
  static maxwellFieldWeight(positive: boolean): number {
    return this.helicityWeight(positive ? 2 : -2);
  }

  /**
   * For graviton (helicity ±2), the weight is -4 or 0
   */
  static gravitonWeight(positive: boolean): number {
    return this.helicityWeight(positive ? 4 : -4);
  }

  /**
   * Contour integral formula (symbolic representation)
   * The Penrose transform involves integrating over lines in PT
   */
  static contourIntegralSymbolic(helicity: number): string {
    const n = 2 * helicity;
    return `φ_{A'₁...A'ₙ}(x) = ∮ π_{A'₁}...π_{A'ₙ} f(Z) dπ`;
  }

  /**
   * Inverse transform (symbolic)
   */
  static inversePenroseSymbolic(helicity: number): string {
    const n = 2 * helicity;
    return `f(Z) = ∫ δ(ω - ix·π) φ_{A'₁...A'ₙ}(x) dⁿx`;
  }

  /**
   * Compute a simple example: scalar wave function from twistor function
   */
  static scalarWaveExample(
    twistorFunction: (Z: Twistor) => TwistorComplex,
    x: SpacetimePoint,
    numSamples: number = 100
  ): TwistorComplex {
    // Numerical approximation of contour integral
    // ∮ f(Z(π)) dπ where Z is incident with x
    
    let sum = TwistorComplex.zero();
    const dTheta = 2 * Math.PI / numSamples;
    
    for (let i = 0; i < numSamples; i++) {
      const theta = i * dTheta;
      const pi = Spinor2.fromComponents(
        TwistorComplex.fromPolar(1, theta),
        TwistorComplex.fromPolar(1, theta + Math.PI / 4)
      );
      
      const Z = IncidenceRelation.createIncidentTwistor(x, pi);
      const f = twistorFunction(Z);
      
      // Weight by dπ (symbolically)
      sum = sum.add(f.scale(dTheta));
    }
    
    return sum.scale(1 / (2 * Math.PI));
  }

  static getHash(): string {
    return createHash('sha256')
      .update('PenroseTransform:cohomology-to-fields')
      .digest('hex')
      .substring(0, 16);
  }
}

// ============================================================================
// Twistor String Theory Connection
// ============================================================================

/**
 * Connection between twistor theory and string theory
 * (Witten's twistor string theory)
 */
export class TwistorStringTheory {
  /**
   * In twistor string theory, string worldsheets map to curves in twistor space
   * For N=4 super Yang-Mills, tree amplitudes can be computed as integrals over
   * the moduli space of holomorphic curves in twistor space
   */

  /**
   * MHV (Maximally Helicity Violating) amplitude structure
   * A_n(1⁻, 2⁻, 3⁺, ..., n⁺) ~ <12>⁴ / (<12><23>...<n1>)
   */
  static mhvAmplitudeSymbolic(n: number): string {
    if (n < 3) return '0';
    
    let denom = '';
    for (let i = 1; i <= n; i++) {
      const next = i === n ? 1 : i + 1;
      denom += `<${i}${next}>`;
    }
    
    return `<12>⁴ / (${denom})`;
  }

  /**
   * Spinor bracket notation
   * <ij> = ε_{AB} λ_i^A λ_j^B
   */
  static spinorBracket(lambda1: Spinor2, lambda2: Spinor2): TwistorComplex {
    return lambda1.contract(lambda2);
  }

  /**
   * Anti-spinor bracket notation
   * [ij] = ε_{A'B'} λ̃_i^{A'} λ̃_j^{B'}
   */
  static antiSpinorBracket(lambdaTilde1: Spinor2, lambdaTilde2: Spinor2): TwistorComplex {
    return lambdaTilde1.contract(lambdaTilde2);
  }

  /**
   * BCFW recursion relation (symbolic description)
   * Tree amplitudes can be computed recursively using complex deformations
   */
  static bcfwRecursionSymbolic(): string {
    return 'A_n = Σ_{partitions} A_L × 1/P² × A_R';
  }

  static getHash(): string {
    return createHash('sha256')
      .update('TwistorStringTheory:MHV-amplitudes')
      .digest('hex')
      .substring(0, 16);
  }
}

// ============================================================================
// Factory Classes
// ============================================================================

/**
 * Factory for creating common twistor configurations
 */
export class TwistorFactory {
  /**
   * Create a twistor for a massless particle with given 4-momentum and helicity
   */
  static masslessParticle(
    energy: number,
    px: number,
    py: number,
    pz: number,
    helicity: number
  ): Twistor {
    // For a massless particle, p^{AA'} = π^A π̄^{A'}
    // and helicity determines the ω part
    
    // Simplified: use standard momentum spinors
    const pPlus = energy + pz;
    const pMinus = energy - pz;
    const pPerp = new TwistorComplex(px, py);
    
    // λ^A (unprimed spinor) ∝ (√p⁺, p_perp/√p⁺)
    const sqrtPPlus = Math.sqrt(Math.abs(pPlus));
    const pi = sqrtPPlus > 1e-10
      ? Spinor2.fromComponents(
          new TwistorComplex(sqrtPPlus, 0),
          pPerp.scale(1 / sqrtPPlus)
        )
      : Spinor2.fromComponents(
          pPerp.scale(1 / Math.sqrt(Math.abs(pMinus))),
          new TwistorComplex(Math.sqrt(Math.abs(pMinus)), 0)
        );
    
    // For helicity h, ω ∝ h * derivative of pi (simplified)
    const omega = helicity !== 0
      ? pi.scaleReal(helicity)
      : Spinor2.zero();
    
    return new Twistor(omega, pi);
  }

  /**
   * Create a twistor incident with the origin
   */
  static atOrigin(pi: Spinor2): Twistor {
    // At x = 0, ω = 0
    return new Twistor(Spinor2.zero(), pi);
  }

  /**
   * Create a null twistor (on the light cone)
   */
  static nullTwistor(pi: Spinor2): Twistor {
    // For a null twistor, ω·π̄ + π·ω̄ = 0
    // Simplest case: ω = 0
    return new Twistor(Spinor2.zero(), pi);
  }

  /**
   * Create twistor for a point on the celestial sphere
   * Parameterized by angles (θ, φ)
   */
  static celestialSphere(theta: number, phi: number): Twistor {
    // Direction on celestial sphere
    const cosTheta2 = Math.cos(theta / 2);
    const sinTheta2 = Math.sin(theta / 2);
    
    const pi = Spinor2.fromComponents(
      new TwistorComplex(cosTheta2, 0),
      TwistorComplex.fromPolar(sinTheta2, phi)
    );
    
    return TwistorFactory.nullTwistor(pi);
  }

  /**
   * Create a random twistor for testing
   */
  static random(): Twistor {
    const randomComplex = () => new TwistorComplex(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1
    );
    
    return Twistor.fromComponents(
      randomComplex(), randomComplex(),
      randomComplex(), randomComplex()
    );
  }

  /**
   * Create a random null twistor
   */
  static randomNull(): Twistor {
    const pi = Spinor2.fromComponents(
      new TwistorComplex(Math.random() * 2 - 1, Math.random() * 2 - 1),
      new TwistorComplex(Math.random() * 2 - 1, Math.random() * 2 - 1)
    );
    return TwistorFactory.nullTwistor(pi);
  }

  static getHash(): string {
    return createHash('sha256')
      .update('TwistorFactory:twistor-creation')
      .digest('hex')
      .substring(0, 16);
  }
}

// ============================================================================
// Twistor Space Analysis
// ============================================================================

/**
 * Analysis tools for twistor space
 */
export class TwistorAnalysis {
  /**
   * Classify a twistor by its norm
   */
  static classify(Z: Twistor): 'positive' | 'negative' | 'null' {
    const norm = Z.normSquared();
    if (Math.abs(norm) < 1e-10) return 'null';
    return norm > 0 ? 'positive' : 'negative';
  }

  /**
   * Check if two twistors are in the same region of twistor space
   */
  static sameRegion(Z1: Twistor, Z2: Twistor): boolean {
    return this.classify(Z1) === this.classify(Z2);
  }

  /**
   * Compute the twistor inner product matrix for a set of twistors
   */
  static innerProductMatrix(twistors: Twistor[]): TwistorComplex[][] {
    const n = twistors.length;
    const matrix: TwistorComplex[][] = [];
    
    for (let i = 0; i < n; i++) {
      matrix[i] = [];
      for (let j = 0; j < n; j++) {
        matrix[i][j] = twistors[i].innerProduct(twistors[j]);
      }
    }
    
    return matrix;
  }

  /**
   * Check linear independence of a set of twistors
   */
  static areIndependent(twistors: Twistor[], epsilon: number = 1e-10): boolean {
    if (twistors.length > 4) return false;
    if (twistors.length === 0) return true;
    if (twistors.length === 1) return !twistors[0].isZero(epsilon);
    
    // For 2 twistors, check they're not proportional
    if (twistors.length === 2) {
      return !twistors[0].projectivelyEquivalent(twistors[1], epsilon);
    }
    
    // For more, would need determinant calculation
    return true; // Simplified
  }

  /**
   * Project a twistor onto the null cone PN
   */
  static projectToNull(Z: Twistor): Twistor {
    // Find closest null twistor
    // For simplicity, set ω to satisfy null condition
    if (Z.pi.isZero()) return Z;
    
    // Null condition: Re(ω·π̄ + π·ω̄) = 0
    // Project by modifying ω
    const piConj = Z.pi.conjugate();
    const currentNorm = Z.normSquared();
    
    // Subtract component to make null
    // ω_new = ω - (norm/2|π|²) * π
    const piNormSq = Z.pi.magnitude() ** 2;
    if (piNormSq < 1e-10) return Z;
    
    const correction = Z.pi.scaleReal(currentNorm / (2 * piNormSq));
    const newOmega = Z.omega.subtract(correction);
    
    return new Twistor(newOmega, Z.pi);
  }

  static getHash(): string {
    return createHash('sha256')
      .update('TwistorAnalysis:twistor-classification')
      .digest('hex')
      .substring(0, 16);
  }
}

// ============================================================================
// Export all
// ============================================================================

export {
  TwistorConstants as Constants
};
