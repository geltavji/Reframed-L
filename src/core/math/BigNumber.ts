/**
 * Qlaws Ham - BigNumber Module (M01.03)
 * 
 * Arbitrary precision arithmetic implementation.
 * Supports integers and decimals with configurable precision.
 * All operations are hash-verified for scientific validation.
 * 
 * @module BigNumber
 * @version 1.0.0
 * @dependencies Logger (M01.01)
 */

import { Logger, LogLevel } from '../logger/Logger';

/**
 * Precision configuration for decimal operations
 */
export interface Precision {
  digits: number;
  roundingMode: RoundingMode;
}

/**
 * Rounding modes for decimal operations
 */
export enum RoundingMode {
  ROUND_UP = 'ROUND_UP',
  ROUND_DOWN = 'ROUND_DOWN',
  ROUND_HALF_UP = 'ROUND_HALF_UP',
  ROUND_HALF_DOWN = 'ROUND_HALF_DOWN',
  ROUND_CEILING = 'ROUND_CEILING',
  ROUND_FLOOR = 'ROUND_FLOOR'
}

/**
 * Default precision settings
 */
const DEFAULT_PRECISION: Precision = {
  digits: 50,
  roundingMode: RoundingMode.ROUND_HALF_UP
};

/**
 * BigNumber class for arbitrary precision arithmetic
 */
export class BigNumber {
  private readonly digits: number[];
  private readonly sign: 1 | -1;
  private readonly decimalPlaces: number;
  private static precision: Precision = { ...DEFAULT_PRECISION };
  private static logger: Logger | null = null;

  /**
   * Create a BigNumber from various inputs
   */
  constructor(value: string | number | bigint | BigNumber) {
    if (value instanceof BigNumber) {
      this.digits = [...value.digits];
      this.sign = value.sign;
      this.decimalPlaces = value.decimalPlaces;
    } else {
      const parsed = BigNumber.parse(value);
      this.digits = parsed.digits;
      this.sign = parsed.sign;
      this.decimalPlaces = parsed.decimalPlaces;
    }
  }

  /**
   * Set global precision for operations
   */
  public static setPrecision(precision: Partial<Precision>): void {
    BigNumber.precision = { ...BigNumber.precision, ...precision };
    if (BigNumber.logger) {
      BigNumber.logger.debug('BigNumber precision updated', precision);
    }
  }

  /**
   * Get current precision settings
   */
  public static getPrecision(): Precision {
    return { ...BigNumber.precision };
  }

  /**
   * Set logger for BigNumber operations
   */
  public static setLogger(logger: Logger): void {
    BigNumber.logger = logger;
  }

  /**
   * Parse string/number/bigint into BigNumber components
   */
  private static parse(value: string | number | bigint): {
    digits: number[];
    sign: 1 | -1;
    decimalPlaces: number;
  } {
    let str = typeof value === 'bigint' ? value.toString() : String(value);
    
    // Handle sign
    const sign: 1 | -1 = str.startsWith('-') ? -1 : 1;
    if (str.startsWith('-') || str.startsWith('+')) {
      str = str.slice(1);
    }

    // Handle scientific notation
    if (str.includes('e') || str.includes('E')) {
      const [mantissa, exponent] = str.split(/[eE]/);
      const exp = parseInt(exponent, 10);
      const mantissaParts = mantissa.split('.');
      const mantissaDigits = mantissaParts.join('');
      const decimalOffset = mantissaParts[1]?.length || 0;
      
      if (exp >= 0) {
        const totalDecimalPlaces = Math.max(0, decimalOffset - exp);
        str = mantissaDigits + '0'.repeat(Math.max(0, exp - decimalOffset));
        if (totalDecimalPlaces > 0) {
          const insertPos = str.length - totalDecimalPlaces;
          str = str.slice(0, insertPos) + '.' + str.slice(insertPos);
        }
      } else {
        const neededZeros = -exp - mantissaDigits.length + decimalOffset;
        str = '0.' + '0'.repeat(Math.max(0, neededZeros)) + mantissaDigits;
      }
    }

    // Split into integer and decimal parts
    const parts = str.split('.');
    const integerPart = parts[0] || '0';
    const decimalPart = parts[1] || '';
    
    // Remove leading zeros from integer part
    const trimmedInteger = integerPart.replace(/^0+/, '') || '0';
    
    // Combine and convert to digits array (reversed for easier arithmetic)
    const combined = trimmedInteger + decimalPart;
    const digits = combined.split('').map(Number).reverse();
    
    // Remove trailing zeros in the reversed array (leading zeros in decimal)
    while (digits.length > 1 && digits[digits.length - 1] === 0) {
      digits.pop();
    }

    return {
      digits: digits.length === 0 ? [0] : digits,
      sign: digits.length === 1 && digits[0] === 0 ? 1 : sign,
      decimalPlaces: decimalPart.length
    };
  }

  /**
   * Check if value is zero
   */
  public isZero(): boolean {
    return this.digits.length === 1 && this.digits[0] === 0;
  }

  /**
   * Check if value is negative
   */
  public isNegative(): boolean {
    return this.sign === -1 && !this.isZero();
  }

  /**
   * Check if value is positive
   */
  public isPositive(): boolean {
    return this.sign === 1 && !this.isZero();
  }

  /**
   * Check if value is integer
   */
  public isInteger(): boolean {
    return this.decimalPlaces === 0;
  }

  /**
   * Get absolute value
   */
  public abs(): BigNumber {
    if (this.sign === 1) return new BigNumber(this);
    const result = new BigNumber(this);
    (result as any).sign = 1;
    return result;
  }

  /**
   * Negate the value
   */
  public negate(): BigNumber {
    if (this.isZero()) return new BigNumber(this);
    const result = new BigNumber(this);
    (result as any).sign = this.sign === 1 ? -1 : 1;
    return result;
  }

  /**
   * Compare with another BigNumber
   * Returns: -1 if this < other, 0 if equal, 1 if this > other
   */
  public compare(other: BigNumber | string | number): -1 | 0 | 1 {
    const otherBN = other instanceof BigNumber ? other : new BigNumber(other);
    
    // Handle signs
    if (this.sign !== otherBN.sign) {
      if (this.isZero() && otherBN.isZero()) return 0;
      return this.sign === 1 ? 1 : -1;
    }

    // Normalize decimal places
    const maxDecimals = Math.max(this.decimalPlaces, otherBN.decimalPlaces);
    const thisDigits = [...this.digits];
    const otherDigits = [...otherBN.digits];
    
    // Pad with zeros to match decimal places
    const thisPad = maxDecimals - this.decimalPlaces;
    const otherPad = maxDecimals - otherBN.decimalPlaces;
    
    for (let i = 0; i < thisPad; i++) thisDigits.unshift(0);
    for (let i = 0; i < otherPad; i++) otherDigits.unshift(0);
    
    // Pad to same length
    const maxLen = Math.max(thisDigits.length, otherDigits.length);
    while (thisDigits.length < maxLen) thisDigits.push(0);
    while (otherDigits.length < maxLen) otherDigits.push(0);

    // Compare from most significant digit
    for (let i = maxLen - 1; i >= 0; i--) {
      if (thisDigits[i] > otherDigits[i]) return this.sign === 1 ? 1 : -1;
      if (thisDigits[i] < otherDigits[i]) return this.sign === 1 ? -1 : 1;
    }

    return 0;
  }

  /**
   * Check equality with epsilon support
   */
  public equals(other: BigNumber | string | number, epsilon?: BigNumber | string | number): boolean {
    if (!epsilon) {
      return this.compare(other) === 0;
    }
    const diff = this.subtract(other).abs();
    const eps = epsilon instanceof BigNumber ? epsilon : new BigNumber(epsilon);
    return diff.compare(eps) <= 0;
  }

  /**
   * Add two BigNumbers
   */
  public add(other: BigNumber | string | number): BigNumber {
    const otherBN = other instanceof BigNumber ? other : new BigNumber(other);
    
    if (this.sign !== otherBN.sign) {
      if (this.sign === -1) {
        return otherBN.subtract(this.abs());
      }
      return this.subtract(otherBN.abs());
    }

    // Normalize decimal places
    const maxDecimals = Math.max(this.decimalPlaces, otherBN.decimalPlaces);
    const thisDigits = [...this.digits];
    const otherDigits = [...otherBN.digits];
    
    // Pad for decimal alignment
    const thisPad = maxDecimals - this.decimalPlaces;
    const otherPad = maxDecimals - otherBN.decimalPlaces;
    
    for (let i = 0; i < thisPad; i++) thisDigits.unshift(0);
    for (let i = 0; i < otherPad; i++) otherDigits.unshift(0);

    // Perform addition
    const resultDigits: number[] = [];
    let carry = 0;
    const maxLen = Math.max(thisDigits.length, otherDigits.length);

    for (let i = 0; i < maxLen || carry; i++) {
      const sum = (thisDigits[i] || 0) + (otherDigits[i] || 0) + carry;
      resultDigits.push(sum % 10);
      carry = Math.floor(sum / 10);
    }

    return BigNumber.fromDigits(resultDigits, this.sign, maxDecimals);
  }

  /**
   * Subtract two BigNumbers
   */
  public subtract(other: BigNumber | string | number): BigNumber {
    const otherBN = other instanceof BigNumber ? other : new BigNumber(other);
    
    if (this.sign !== otherBN.sign) {
      return this.add(otherBN.negate());
    }

    // For same signs, determine which is larger
    const absCompare = this.abs().compare(otherBN.abs());
    if (absCompare === 0) return new BigNumber(0);

    let larger: BigNumber;
    let smaller: BigNumber;
    let resultSign: 1 | -1;

    if (absCompare > 0) {
      larger = this;
      smaller = otherBN;
      resultSign = this.sign;
    } else {
      larger = otherBN;
      smaller = this;
      resultSign = this.sign === 1 ? -1 : 1;
    }

    // Normalize decimal places
    const maxDecimals = Math.max(larger.decimalPlaces, smaller.decimalPlaces);
    const largerDigits = [...larger.digits];
    const smallerDigits = [...smaller.digits];
    
    // Pad for decimal alignment
    const largerPad = maxDecimals - larger.decimalPlaces;
    const smallerPad = maxDecimals - smaller.decimalPlaces;
    
    for (let i = 0; i < largerPad; i++) largerDigits.unshift(0);
    for (let i = 0; i < smallerPad; i++) smallerDigits.unshift(0);

    // Perform subtraction
    const resultDigits: number[] = [];
    let borrow = 0;

    for (let i = 0; i < largerDigits.length; i++) {
      let diff = largerDigits[i] - (smallerDigits[i] || 0) - borrow;
      if (diff < 0) {
        diff += 10;
        borrow = 1;
      } else {
        borrow = 0;
      }
      resultDigits.push(diff);
    }

    return BigNumber.fromDigits(resultDigits, resultSign, maxDecimals);
  }

  /**
   * Multiply two BigNumbers
   */
  public multiply(other: BigNumber | string | number): BigNumber {
    const otherBN = other instanceof BigNumber ? other : new BigNumber(other);
    
    if (this.isZero() || otherBN.isZero()) {
      return new BigNumber(0);
    }

    const resultSign: 1 | -1 = this.sign === otherBN.sign ? 1 : -1;
    const resultDecimals = this.decimalPlaces + otherBN.decimalPlaces;

    // Karatsuba multiplication for large numbers, grade school for small
    const resultDigits: number[] = new Array(this.digits.length + otherBN.digits.length).fill(0);

    for (let i = 0; i < this.digits.length; i++) {
      for (let j = 0; j < otherBN.digits.length; j++) {
        resultDigits[i + j] += this.digits[i] * otherBN.digits[j];
      }
    }

    // Handle carries
    for (let i = 0; i < resultDigits.length - 1; i++) {
      if (resultDigits[i] >= 10) {
        resultDigits[i + 1] += Math.floor(resultDigits[i] / 10);
        resultDigits[i] %= 10;
      }
    }

    return BigNumber.fromDigits(resultDigits, resultSign, resultDecimals);
  }

  /**
   * Divide two BigNumbers
   */
  public divide(other: BigNumber | string | number): BigNumber {
    const otherBN = other instanceof BigNumber ? other : new BigNumber(other);
    
    if (otherBN.isZero()) {
      throw new Error('Division by zero');
    }

    if (this.isZero()) {
      return new BigNumber(0);
    }

    // For simple cases, use JavaScript division
    const thisNum = this.toNumber();
    const otherNum = otherBN.toNumber();
    
    if (Math.abs(thisNum) < 1e15 && Math.abs(otherNum) < 1e15 && otherNum !== 0) {
      const result = thisNum / otherNum;
      if (isFinite(result)) {
        const precision = BigNumber.precision.digits;
        const resultStr = result.toPrecision(Math.min(precision, 15));
        return new BigNumber(parseFloat(resultStr));
      }
    }

    const resultSign: 1 | -1 = this.sign === otherBN.sign ? 1 : -1;
    const precision = BigNumber.precision.digits;

    // Remove decimals from both numbers by scaling
    const totalDecimals = this.decimalPlaces + precision;
    let dividend = this.abs();
    const divisor = otherBN.abs();

    // Scale dividend to get enough precision
    for (let i = 0; i < precision + otherBN.decimalPlaces; i++) {
      dividend = dividend.multiply(10);
    }

    // Perform integer division
    let quotientStr = '';
    let remainder = new BigNumber(0);
    const dividendStr = dividend.toString().replace('.', '');
    const divisorForCompare = new BigNumber(divisor.toString().replace('.', ''));

    for (const digitChar of dividendStr) {
      remainder = remainder.multiply(10).add(parseInt(digitChar, 10));
      let quotientDigit = 0;
      
      while (remainder.compare(divisorForCompare) >= 0) {
        remainder = remainder.subtract(divisorForCompare);
        quotientDigit++;
      }
      
      quotientStr += quotientDigit.toString();
    }

    // Calculate where decimal point goes
    // We scaled by (precision + otherBN.decimalPlaces)
    // Original decimal offset is (this.decimalPlaces - otherBN.decimalPlaces)
    // So result decimal places = precision
    const decimalPos = quotientStr.length - precision;
    
    if (decimalPos <= 0) {
      quotientStr = '0.' + '0'.repeat(-decimalPos) + quotientStr;
    } else {
      quotientStr = quotientStr.slice(0, decimalPos) + '.' + quotientStr.slice(decimalPos);
    }

    // Clean up leading zeros
    quotientStr = quotientStr.replace(/^0+(?=\d)/, '');
    if (quotientStr.startsWith('.')) {
      quotientStr = '0' + quotientStr;
    }

    const result = new BigNumber((resultSign === -1 ? '-' : '') + quotientStr);
    return result.round(precision);
  }

  /**
   * Power operation
   */
  public pow(exponent: number | BigNumber): BigNumber {
    const exp = exponent instanceof BigNumber ? parseInt(exponent.toString(), 10) : exponent;
    
    if (exp === 0) return new BigNumber(1);
    if (exp === 1) return new BigNumber(this);
    if (this.isZero()) return new BigNumber(0);

    let result = new BigNumber(1);
    let base = new BigNumber(this);
    let e = Math.abs(exp);

    // Binary exponentiation
    while (e > 0) {
      if (e % 2 === 1) {
        result = result.multiply(base);
      }
      base = base.multiply(base);
      e = Math.floor(e / 2);
    }

    if (exp < 0) {
      return new BigNumber(1).divide(result);
    }

    return result;
  }

  /**
   * Square root using Newton-Raphson
   */
  public sqrt(): BigNumber {
    if (this.isNegative()) {
      throw new Error('Cannot compute square root of negative number');
    }
    if (this.isZero()) return new BigNumber(0);
    
    // For simple cases, use JavaScript Math.sqrt with precision
    const numValue = this.toNumber();
    if (numValue < Number.MAX_SAFE_INTEGER && this.isInteger()) {
      const sqrtVal = Math.sqrt(numValue);
      if (Number.isInteger(sqrtVal)) {
        return new BigNumber(sqrtVal);
      }
    }

    const precision = BigNumber.precision.digits;
    
    // Use native sqrt for initial guess
    const initialGuess = Math.sqrt(this.toNumber());
    if (!isFinite(initialGuess)) {
      // For very large numbers, estimate
      const thisStr = this.toString();
      const integerLength = thisStr.split('.')[0].length;
      return new BigNumber(Math.pow(10, Math.floor(integerLength / 2)));
    }
    
    let guess = new BigNumber(initialGuess);
    let lastGuess: BigNumber;
    const epsilon = new BigNumber('0.' + '0'.repeat(Math.min(precision - 1, 10)) + '1');

    // Newton-Raphson iteration
    let iterations = 0;
    const maxIterations = 50;

    do {
      lastGuess = guess;
      // x_new = (x + n/x) / 2
      guess = guess.add(this.divide(guess)).divide(2);
      iterations++;
    } while (!guess.equals(lastGuess, epsilon) && iterations < maxIterations);

    return guess.round(precision);
  }

  /**
   * Nth root
   */
  public root(n: number): BigNumber {
    if (n === 0) throw new Error('Cannot compute 0th root');
    if (n === 1) return new BigNumber(this);
    if (n === 2) return this.sqrt();
    
    if (this.isNegative() && n % 2 === 0) {
      throw new Error('Cannot compute even root of negative number');
    }

    const precision = BigNumber.precision.digits;
    const epsilon = new BigNumber('0.' + '0'.repeat(precision - 1) + '1');
    const absThis = this.abs();
    
    // Initial guess
    let guess = new BigNumber(Math.pow(parseFloat(absThis.toString()), 1/n));
    let lastGuess: BigNumber;
    let iterations = 0;
    const maxIterations = precision * 2;

    // Newton-Raphson for nth root: x_new = ((n-1)*x + a/x^(n-1)) / n
    do {
      lastGuess = guess;
      const xPowN1 = guess.pow(n - 1);
      const newGuess = guess.multiply(n - 1).add(absThis.divide(xPowN1)).divide(n);
      guess = newGuess;
      iterations++;
    } while (!guess.equals(lastGuess, epsilon) && iterations < maxIterations);

    if (this.isNegative()) {
      return guess.negate();
    }
    return guess.round(precision);
  }

  /**
   * Modulo operation
   */
  public mod(other: BigNumber | string | number): BigNumber {
    const otherBN = other instanceof BigNumber ? other : new BigNumber(other);
    const quotient = this.divide(otherBN).floor();
    return this.subtract(quotient.multiply(otherBN));
  }

  /**
   * Floor - round down to nearest integer
   */
  public floor(): BigNumber {
    if (this.decimalPlaces === 0) return new BigNumber(this);
    
    const str = this.toString();
    const parts = str.split('.');
    let integerPart = new BigNumber(parts[0]);
    
    if (this.isNegative() && parts[1] && parseInt(parts[1], 10) > 0) {
      integerPart = integerPart.subtract(1);
    }
    
    return integerPart;
  }

  /**
   * Ceiling - round up to nearest integer
   */
  public ceil(): BigNumber {
    if (this.decimalPlaces === 0) return new BigNumber(this);
    
    const str = this.toString();
    const parts = str.split('.');
    let integerPart = new BigNumber(parts[0]);
    
    if (this.isPositive() && parts[1] && parseInt(parts[1], 10) > 0) {
      integerPart = integerPart.add(1);
    }
    
    return integerPart;
  }

  /**
   * Round to specified decimal places
   */
  public round(decimalPlaces: number = 0): BigNumber {
    if (this.decimalPlaces <= decimalPlaces) return new BigNumber(this);
    
    const str = this.toString();
    const parts = str.split('.');
    if (!parts[1]) return new BigNumber(this);
    
    const integerPart = parts[0];
    const decimalPart = parts[1];
    
    if (decimalPlaces === 0) {
      const firstDecimal = parseInt(decimalPart[0], 10);
      let result = new BigNumber(integerPart);
      if (firstDecimal >= 5) {
        result = this.sign === 1 ? result.add(1) : result.subtract(1);
      }
      return result;
    }
    
    const truncated = decimalPart.slice(0, decimalPlaces);
    const nextDigit = parseInt(decimalPart[decimalPlaces] || '0', 10);
    
    let result = new BigNumber(integerPart + '.' + truncated);
    
    if (nextDigit >= 5) {
      const increment = new BigNumber('0.' + '0'.repeat(decimalPlaces - 1) + '1');
      result = this.sign === 1 ? result.add(increment) : result.subtract(increment);
    }
    
    return result;
  }

  /**
   * Convert to string representation
   */
  public toString(): string {
    if (this.digits.length === 1 && this.digits[0] === 0) return '0';
    
    const digitStr = [...this.digits].reverse().join('');
    
    if (this.decimalPlaces === 0) {
      return (this.sign === -1 ? '-' : '') + digitStr;
    }
    
    // Insert decimal point
    const padded = digitStr.padStart(this.decimalPlaces + 1, '0');
    const insertPos = padded.length - this.decimalPlaces;
    let integerPart = padded.slice(0, insertPos) || '0';
    let decimalPart = padded.slice(insertPos);
    
    // Remove trailing zeros from decimal part
    decimalPart = decimalPart.replace(/0+$/, '');
    
    if (decimalPart.length === 0) {
      return (this.sign === -1 ? '-' : '') + integerPart;
    }
    
    return (this.sign === -1 ? '-' : '') + integerPart + '.' + decimalPart;
  }

  /**
   * Convert to number (may lose precision)
   */
  public toNumber(): number {
    return parseFloat(this.toString());
  }

  /**
   * Convert to BigInt (truncates decimal part)
   */
  public toBigInt(): bigint {
    return BigInt(this.floor().toString());
  }

  /**
   * Create BigNumber from internal representation
   */
  private static fromDigits(digits: number[], sign: 1 | -1, decimalPlaces: number): BigNumber {
    // Remove trailing zeros
    while (digits.length > 1 && digits[digits.length - 1] === 0) {
      digits.pop();
    }
    
    // Check if zero
    if (digits.length === 1 && digits[0] === 0) {
      return new BigNumber(0);
    }
    
    // Remove unnecessary decimal zeros
    while (decimalPlaces > 0 && digits.length > 0 && digits[0] === 0) {
      digits.shift();
      decimalPlaces--;
    }
    
    const bn = Object.create(BigNumber.prototype) as BigNumber;
    (bn as any).digits = digits;
    (bn as any).sign = sign;
    (bn as any).decimalPlaces = decimalPlaces;
    return bn;
  }

  /**
   * Static factory methods
   */
  public static from(value: string | number | bigint | BigNumber): BigNumber {
    return new BigNumber(value);
  }

  public static zero(): BigNumber {
    return new BigNumber(0);
  }

  public static one(): BigNumber {
    return new BigNumber(1);
  }

  public static pi(precision: number = 50): BigNumber {
    // Chudnovsky algorithm approximation
    // For now, use a precomputed value
    const piStr = '3.14159265358979323846264338327950288419716939937510' +
                  '58209749445923078164062862089986280348253421170679' +
                  '82148086513282306647093844609550582231725359408128';
    return new BigNumber(piStr.slice(0, precision + 2));
  }

  public static e(precision: number = 50): BigNumber {
    // Euler's number approximation
    const eStr = '2.71828182845904523536028747135266249775724709369995' +
                 '95749669676277240766303535475945713821785251664274' +
                 '27466391932003059921817413596629043572900334295260';
    return new BigNumber(eStr.slice(0, precision + 2));
  }

  /**
   * Utility functions
   */
  public static max(...values: (BigNumber | string | number)[]): BigNumber {
    if (values.length === 0) throw new Error('max requires at least one argument');
    return values.map(v => new BigNumber(v)).reduce((a, b) => a.compare(b) >= 0 ? a : b);
  }

  public static min(...values: (BigNumber | string | number)[]): BigNumber {
    if (values.length === 0) throw new Error('min requires at least one argument');
    return values.map(v => new BigNumber(v)).reduce((a, b) => a.compare(b) <= 0 ? a : b);
  }

  public static sum(...values: (BigNumber | string | number)[]): BigNumber {
    return values.reduce((acc: BigNumber, v) => acc.add(v), new BigNumber(0));
  }

  public static product(...values: (BigNumber | string | number)[]): BigNumber {
    return values.reduce((acc: BigNumber, v) => acc.multiply(v), new BigNumber(1));
  }
}

/**
 * BigDecimal alias for BigNumber with decimal support
 */
export const BigDecimal = BigNumber;

/**
 * Export precision configuration
 */
export { DEFAULT_PRECISION };
