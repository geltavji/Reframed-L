/**
 * Qlaws Ham - Complex Number Module (M01.04)
 * 
 * Complex number representation and operations.
 * Supports polar and rectangular forms.
 * All operations use BigNumber for precision.
 * 
 * @module Complex
 * @version 1.0.0
 * @dependencies Logger (M01.01), BigNumber (M01.03)
 */

import { Logger } from '../logger/Logger';
import { BigNumber } from './BigNumber';

/**
 * Complex number class
 */
export class Complex {
  public readonly real: BigNumber;
  public readonly imag: BigNumber;
  private static logger: Logger | null = null;

  /**
   * Create a complex number from real and imaginary parts
   */
  constructor(
    real: BigNumber | number | string = 0,
    imag: BigNumber | number | string = 0
  ) {
    this.real = real instanceof BigNumber ? real : new BigNumber(real);
    this.imag = imag instanceof BigNumber ? imag : new BigNumber(imag);
  }

  /**
   * Set logger for Complex operations
   */
  public static setLogger(logger: Logger): void {
    Complex.logger = logger;
  }

  /**
   * Create complex from polar coordinates (magnitude and phase)
   */
  public static fromPolar(magnitude: BigNumber | number, phase: BigNumber | number): Complex {
    const r = magnitude instanceof BigNumber ? magnitude : new BigNumber(magnitude);
    const theta = phase instanceof BigNumber ? phase.toNumber() : phase;
    
    const real = r.multiply(Math.cos(theta));
    const imag = r.multiply(Math.sin(theta));
    
    return new Complex(real, imag);
  }

  /**
   * Create complex from just real part
   */
  public static fromReal(real: BigNumber | number | string): Complex {
    return new Complex(real, 0);
  }

  /**
   * Create complex from just imaginary part
   */
  public static fromImaginary(imag: BigNumber | number | string): Complex {
    return new Complex(0, imag);
  }

  /**
   * Zero complex number
   */
  public static zero(): Complex {
    return new Complex(0, 0);
  }

  /**
   * One (real)
   */
  public static one(): Complex {
    return new Complex(1, 0);
  }

  /**
   * Imaginary unit i
   */
  public static i(): Complex {
    return new Complex(0, 1);
  }

  /**
   * Check if zero
   */
  public isZero(): boolean {
    return this.real.isZero() && this.imag.isZero();
  }

  /**
   * Check if purely real (no imaginary part)
   */
  public isReal(): boolean {
    return this.imag.isZero();
  }

  /**
   * Check if purely imaginary (no real part)
   */
  public isImaginary(): boolean {
    return this.real.isZero() && !this.imag.isZero();
  }

  /**
   * Get magnitude (absolute value) |z| = sqrt(a² + b²)
   */
  public magnitude(): BigNumber {
    const realSquared = this.real.multiply(this.real);
    const imagSquared = this.imag.multiply(this.imag);
    return realSquared.add(imagSquared).sqrt();
  }

  /**
   * Alias for magnitude
   */
  public abs(): BigNumber {
    return this.magnitude();
  }

  /**
   * Get phase (argument) θ = atan2(b, a)
   */
  public phase(): number {
    return Math.atan2(this.imag.toNumber(), this.real.toNumber());
  }

  /**
   * Alias for phase
   */
  public arg(): number {
    return this.phase();
  }

  /**
   * Get conjugate (a - bi)
   */
  public conjugate(): Complex {
    return new Complex(this.real, this.imag.negate());
  }

  /**
   * Negate the complex number
   */
  public negate(): Complex {
    return new Complex(this.real.negate(), this.imag.negate());
  }

  /**
   * Add two complex numbers
   */
  public add(other: Complex | number): Complex {
    if (typeof other === 'number') {
      return new Complex(this.real.add(other), this.imag);
    }
    return new Complex(
      this.real.add(other.real),
      this.imag.add(other.imag)
    );
  }

  /**
   * Subtract two complex numbers
   */
  public subtract(other: Complex | number): Complex {
    if (typeof other === 'number') {
      return new Complex(this.real.subtract(other), this.imag);
    }
    return new Complex(
      this.real.subtract(other.real),
      this.imag.subtract(other.imag)
    );
  }

  /**
   * Multiply two complex numbers
   * (a + bi)(c + di) = (ac - bd) + (ad + bc)i
   */
  public multiply(other: Complex | number): Complex {
    if (typeof other === 'number') {
      return new Complex(
        this.real.multiply(other),
        this.imag.multiply(other)
      );
    }
    
    const ac = this.real.multiply(other.real);
    const bd = this.imag.multiply(other.imag);
    const ad = this.real.multiply(other.imag);
    const bc = this.imag.multiply(other.real);
    
    return new Complex(
      ac.subtract(bd),
      ad.add(bc)
    );
  }

  /**
   * Divide two complex numbers
   * (a + bi)/(c + di) = [(ac + bd) + (bc - ad)i] / (c² + d²)
   */
  public divide(other: Complex | number): Complex {
    if (typeof other === 'number') {
      if (other === 0) throw new Error('Division by zero');
      return new Complex(
        this.real.divide(other),
        this.imag.divide(other)
      );
    }
    
    if (other.isZero()) {
      throw new Error('Division by zero');
    }
    
    const denom = other.real.multiply(other.real)
      .add(other.imag.multiply(other.imag));
    
    const ac = this.real.multiply(other.real);
    const bd = this.imag.multiply(other.imag);
    const bc = this.imag.multiply(other.real);
    const ad = this.real.multiply(other.imag);
    
    return new Complex(
      ac.add(bd).divide(denom),
      bc.subtract(ad).divide(denom)
    );
  }

  /**
   * Reciprocal 1/z
   */
  public reciprocal(): Complex {
    return Complex.one().divide(this);
  }

  /**
   * Power z^n for integer exponent
   */
  public pow(n: number): Complex {
    if (n === 0) return Complex.one();
    if (n === 1) return new Complex(this.real, this.imag);
    if (this.isZero()) return Complex.zero();
    
    if (n < 0) {
      return this.pow(-n).reciprocal();
    }
    
    // Use De Moivre's theorem: z^n = r^n * (cos(nθ) + i*sin(nθ))
    const r = this.magnitude();
    const theta = this.phase();
    
    const rn = r.pow(n);
    const nTheta = n * theta;
    
    return new Complex(
      rn.multiply(Math.cos(nTheta)),
      rn.multiply(Math.sin(nTheta))
    );
  }

  /**
   * Complex exponential e^z = e^a * (cos(b) + i*sin(b))
   */
  public exp(): Complex {
    const ea = Math.exp(this.real.toNumber());
    const b = this.imag.toNumber();
    
    return new Complex(
      ea * Math.cos(b),
      ea * Math.sin(b)
    );
  }

  /**
   * Complex natural logarithm ln(z) = ln|z| + i*arg(z)
   */
  public log(): Complex {
    const r = this.magnitude();
    const theta = this.phase();
    
    return new Complex(
      Math.log(r.toNumber()),
      theta
    );
  }

  /**
   * Complex sine sin(z) = sin(a)cosh(b) + i*cos(a)sinh(b)
   */
  public sin(): Complex {
    const a = this.real.toNumber();
    const b = this.imag.toNumber();
    
    return new Complex(
      Math.sin(a) * Math.cosh(b),
      Math.cos(a) * Math.sinh(b)
    );
  }

  /**
   * Complex cosine cos(z) = cos(a)cosh(b) - i*sin(a)sinh(b)
   */
  public cos(): Complex {
    const a = this.real.toNumber();
    const b = this.imag.toNumber();
    
    return new Complex(
      Math.cos(a) * Math.cosh(b),
      -Math.sin(a) * Math.sinh(b)
    );
  }

  /**
   * Complex tangent tan(z) = sin(z)/cos(z)
   */
  public tan(): Complex {
    return this.sin().divide(this.cos());
  }

  /**
   * Complex hyperbolic sine sinh(z)
   */
  public sinh(): Complex {
    const a = this.real.toNumber();
    const b = this.imag.toNumber();
    
    return new Complex(
      Math.sinh(a) * Math.cos(b),
      Math.cosh(a) * Math.sin(b)
    );
  }

  /**
   * Complex hyperbolic cosine cosh(z)
   */
  public cosh(): Complex {
    const a = this.real.toNumber();
    const b = this.imag.toNumber();
    
    return new Complex(
      Math.cosh(a) * Math.cos(b),
      Math.sinh(a) * Math.sin(b)
    );
  }

  /**
   * Complex hyperbolic tangent tanh(z)
   */
  public tanh(): Complex {
    return this.sinh().divide(this.cosh());
  }

  /**
   * Square root using polar form
   */
  public sqrt(): Complex {
    const r = this.magnitude();
    const theta = this.phase();
    
    const sqrtR = r.sqrt();
    const halfTheta = theta / 2;
    
    return new Complex(
      sqrtR.multiply(Math.cos(halfTheta)),
      sqrtR.multiply(Math.sin(halfTheta))
    );
  }

  /**
   * Nth root - returns principal root
   */
  public nthRoot(n: number): Complex {
    if (n === 0) throw new Error('Cannot compute 0th root');
    if (n === 1) return new Complex(this.real, this.imag);
    if (n === 2) return this.sqrt();
    
    const r = this.magnitude();
    const theta = this.phase();
    
    const nthR = r.root(n);
    const nthTheta = theta / n;
    
    return new Complex(
      nthR.multiply(Math.cos(nthTheta)),
      nthR.multiply(Math.sin(nthTheta))
    );
  }

  /**
   * Get all n roots
   */
  public allNthRoots(n: number): Complex[] {
    if (n <= 0) throw new Error('n must be positive');
    
    const r = this.magnitude();
    const theta = this.phase();
    const nthR = r.root(n);
    
    const roots: Complex[] = [];
    for (let k = 0; k < n; k++) {
      const angle = (theta + 2 * Math.PI * k) / n;
      roots.push(new Complex(
        nthR.multiply(Math.cos(angle)),
        nthR.multiply(Math.sin(angle))
      ));
    }
    
    return roots;
  }

  /**
   * Check equality with another complex number
   */
  public equals(other: Complex, epsilon?: number): boolean {
    if (epsilon) {
      const realDiff = Math.abs(this.real.toNumber() - other.real.toNumber());
      const imagDiff = Math.abs(this.imag.toNumber() - other.imag.toNumber());
      return realDiff <= epsilon && imagDiff <= epsilon;
    }
    return this.real.compare(other.real) === 0 && 
           this.imag.compare(other.imag) === 0;
  }

  /**
   * Convert to string representation
   */
  public toString(): string {
    const realStr = this.real.toString();
    const imagStr = this.imag.toString();
    
    if (this.imag.isZero()) {
      return realStr;
    }
    
    if (this.real.isZero()) {
      if (this.imag.compare(1) === 0) return 'i';
      if (this.imag.compare(-1) === 0) return '-i';
      return `${imagStr}i`;
    }
    
    if (this.imag.isPositive()) {
      if (this.imag.compare(1) === 0) return `${realStr} + i`;
      return `${realStr} + ${imagStr}i`;
    } else {
      if (this.imag.compare(-1) === 0) return `${realStr} - i`;
      return `${realStr} - ${this.imag.abs().toString()}i`;
    }
  }

  /**
   * Convert to polar string representation
   */
  public toPolarString(): string {
    const r = this.magnitude().toString();
    const theta = this.phase().toFixed(6);
    return `${r} * e^(${theta}i)`;
  }

  /**
   * Get as tuple [real, imag]
   */
  public toTuple(): [number, number] {
    return [this.real.toNumber(), this.imag.toNumber()];
  }

  /**
   * Get as object {real, imag}
   */
  public toObject(): { real: number; imag: number } {
    return {
      real: this.real.toNumber(),
      imag: this.imag.toNumber()
    };
  }
}

/**
 * Complex operations utility class
 */
export class ComplexOperations {
  /**
   * Dot product of two complex numbers (as 2D vectors)
   */
  public static dot(a: Complex, b: Complex): BigNumber {
    return a.real.multiply(b.real).add(a.imag.multiply(b.imag));
  }

  /**
   * Cross product (z-component of 3D cross product with z=0)
   */
  public static cross(a: Complex, b: Complex): BigNumber {
    return a.real.multiply(b.imag).subtract(a.imag.multiply(b.real));
  }

  /**
   * Squared distance between two complex numbers
   */
  public static distanceSquared(a: Complex, b: Complex): BigNumber {
    const diff = a.subtract(b);
    return diff.real.multiply(diff.real).add(diff.imag.multiply(diff.imag));
  }

  /**
   * Distance between two complex numbers
   */
  public static distance(a: Complex, b: Complex): BigNumber {
    return this.distanceSquared(a, b).sqrt();
  }

  /**
   * Linear interpolation between two complex numbers
   */
  public static lerp(a: Complex, b: Complex, t: number): Complex {
    return a.add(b.subtract(a).multiply(t));
  }

  /**
   * Sum of array of complex numbers
   */
  public static sum(values: Complex[]): Complex {
    return values.reduce((acc, v) => acc.add(v), Complex.zero());
  }

  /**
   * Product of array of complex numbers
   */
  public static product(values: Complex[]): Complex {
    return values.reduce((acc, v) => acc.multiply(v), Complex.one());
  }

  /**
   * Average of array of complex numbers
   */
  public static average(values: Complex[]): Complex {
    if (values.length === 0) return Complex.zero();
    return this.sum(values).divide(values.length);
  }

  /**
   * Create rotation by angle
   */
  public static rotation(angle: number): Complex {
    return new Complex(Math.cos(angle), Math.sin(angle));
  }

  /**
   * Rotate a complex number by angle
   */
  public static rotate(z: Complex, angle: number): Complex {
    return z.multiply(this.rotation(angle));
  }
}
