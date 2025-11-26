/**
 * Qlaws Ham - Complex Number Module Tests
 * 
 * Comprehensive test suite for Complex (M01.04)
 */

import { Complex, ComplexOperations } from '../../../src/core/math/Complex';
import { BigNumber } from '../../../src/core/math/BigNumber';

describe('Complex Module (M01.04)', () => {
  describe('Constructor', () => {
    test('should create from numbers', () => {
      const c = new Complex(3, 4);
      expect(c.real.toNumber()).toBe(3);
      expect(c.imag.toNumber()).toBe(4);
    });

    test('should create with default imaginary', () => {
      const c = new Complex(5);
      expect(c.real.toNumber()).toBe(5);
      expect(c.imag.toNumber()).toBe(0);
    });

    test('should create from BigNumber', () => {
      const c = new Complex(new BigNumber(3), new BigNumber(4));
      expect(c.real.toNumber()).toBe(3);
      expect(c.imag.toNumber()).toBe(4);
    });
  });

  describe('Factory Methods', () => {
    test('fromReal should create real number', () => {
      const c = Complex.fromReal(5);
      expect(c.real.toNumber()).toBe(5);
      expect(c.imag.toNumber()).toBe(0);
    });

    test('fromImaginary should create imaginary number', () => {
      const c = Complex.fromImaginary(5);
      expect(c.real.toNumber()).toBe(0);
      expect(c.imag.toNumber()).toBe(5);
    });

    test('fromPolar should create from magnitude and phase', () => {
      const c = Complex.fromPolar(1, Math.PI / 2);
      expect(c.real.toNumber()).toBeCloseTo(0, 10);
      expect(c.imag.toNumber()).toBeCloseTo(1, 10);
    });

    test('zero should return 0+0i', () => {
      const c = Complex.zero();
      expect(c.isZero()).toBe(true);
    });

    test('one should return 1+0i', () => {
      const c = Complex.one();
      expect(c.real.toNumber()).toBe(1);
      expect(c.imag.toNumber()).toBe(0);
    });

    test('i should return 0+1i', () => {
      const c = Complex.i();
      expect(c.real.toNumber()).toBe(0);
      expect(c.imag.toNumber()).toBe(1);
    });
  });

  describe('Properties', () => {
    test('isZero should work', () => {
      expect(new Complex(0, 0).isZero()).toBe(true);
      expect(new Complex(1, 0).isZero()).toBe(false);
      expect(new Complex(0, 1).isZero()).toBe(false);
    });

    test('isReal should work', () => {
      expect(new Complex(5, 0).isReal()).toBe(true);
      expect(new Complex(5, 1).isReal()).toBe(false);
    });

    test('isImaginary should work', () => {
      expect(new Complex(0, 5).isImaginary()).toBe(true);
      expect(new Complex(1, 5).isImaginary()).toBe(false);
      expect(new Complex(0, 0).isImaginary()).toBe(false);
    });

    test('magnitude should compute |z|', () => {
      const c = new Complex(3, 4);
      expect(c.magnitude().toNumber()).toBe(5);
    });

    test('abs should be alias for magnitude', () => {
      const c = new Complex(3, 4);
      expect(c.abs().toNumber()).toBe(5);
    });

    test('phase should compute argument', () => {
      const c = new Complex(1, 1);
      expect(c.phase()).toBeCloseTo(Math.PI / 4, 10);
    });

    test('arg should be alias for phase', () => {
      const c = new Complex(1, 1);
      expect(c.arg()).toBeCloseTo(Math.PI / 4, 10);
    });
  });

  describe('Conjugate and Negate', () => {
    test('conjugate should negate imaginary', () => {
      const c = new Complex(3, 4);
      const conj = c.conjugate();
      expect(conj.real.toNumber()).toBe(3);
      expect(conj.imag.toNumber()).toBe(-4);
    });

    test('negate should negate both parts', () => {
      const c = new Complex(3, 4);
      const neg = c.negate();
      expect(neg.real.toNumber()).toBe(-3);
      expect(neg.imag.toNumber()).toBe(-4);
    });
  });

  describe('Addition', () => {
    test('should add complex numbers', () => {
      const a = new Complex(1, 2);
      const b = new Complex(3, 4);
      const result = a.add(b);
      expect(result.real.toNumber()).toBe(4);
      expect(result.imag.toNumber()).toBe(6);
    });

    test('should add with real number', () => {
      const c = new Complex(1, 2);
      const result = c.add(3);
      expect(result.real.toNumber()).toBe(4);
      expect(result.imag.toNumber()).toBe(2);
    });
  });

  describe('Subtraction', () => {
    test('should subtract complex numbers', () => {
      const a = new Complex(5, 7);
      const b = new Complex(3, 4);
      const result = a.subtract(b);
      expect(result.real.toNumber()).toBe(2);
      expect(result.imag.toNumber()).toBe(3);
    });

    test('should subtract real number', () => {
      const c = new Complex(5, 7);
      const result = c.subtract(3);
      expect(result.real.toNumber()).toBe(2);
      expect(result.imag.toNumber()).toBe(7);
    });
  });

  describe('Multiplication', () => {
    test('should multiply complex numbers', () => {
      // (1+2i)(3+4i) = 3+4i+6i+8i² = 3+10i-8 = -5+10i
      const a = new Complex(1, 2);
      const b = new Complex(3, 4);
      const result = a.multiply(b);
      expect(result.real.toNumber()).toBe(-5);
      expect(result.imag.toNumber()).toBe(10);
    });

    test('should multiply by scalar', () => {
      const c = new Complex(3, 4);
      const result = c.multiply(2);
      expect(result.real.toNumber()).toBe(6);
      expect(result.imag.toNumber()).toBe(8);
    });

    test('i * i should equal -1', () => {
      const i = Complex.i();
      const result = i.multiply(i);
      expect(result.real.toNumber()).toBe(-1);
      expect(result.imag.toNumber()).toBe(0);
    });
  });

  describe('Division', () => {
    test('should divide complex numbers', () => {
      // (10+5i)/(3+4i) = (10+5i)(3-4i)/25 = (30-40i+15i+20)/25 = (50-25i)/25 = 2-i
      const a = new Complex(10, 5);
      const b = new Complex(3, 4);
      const result = a.divide(b);
      expect(result.real.toNumber()).toBeCloseTo(2, 10);
      expect(result.imag.toNumber()).toBeCloseTo(-1, 10);
    });

    test('should divide by scalar', () => {
      const c = new Complex(6, 8);
      const result = c.divide(2);
      expect(result.real.toNumber()).toBe(3);
      expect(result.imag.toNumber()).toBe(4);
    });

    test('should throw on division by zero', () => {
      const c = new Complex(1, 1);
      expect(() => c.divide(0)).toThrow();
      expect(() => c.divide(Complex.zero())).toThrow();
    });
  });

  describe('Reciprocal', () => {
    test('should compute 1/z', () => {
      const c = new Complex(3, 4);
      const rec = c.reciprocal();
      const product = c.multiply(rec);
      expect(product.real.toNumber()).toBeCloseTo(1, 10);
      expect(product.imag.toNumber()).toBeCloseTo(0, 10);
    });
  });

  describe('Power', () => {
    test('should compute z^n', () => {
      const c = new Complex(1, 1);
      const result = c.pow(2);
      expect(result.real.toNumber()).toBeCloseTo(0, 10);
      expect(result.imag.toNumber()).toBeCloseTo(2, 10);
    });

    test('z^0 should equal 1', () => {
      const c = new Complex(3, 4);
      const result = c.pow(0);
      expect(result.real.toNumber()).toBe(1);
      expect(result.imag.toNumber()).toBe(0);
    });

    test('z^1 should equal z', () => {
      const c = new Complex(3, 4);
      const result = c.pow(1);
      expect(result.equals(c, 1e-10)).toBe(true);
    });

    test('negative power should work', () => {
      const c = new Complex(2, 0);
      const result = c.pow(-1);
      expect(result.real.toNumber()).toBeCloseTo(0.5, 10);
    });
  });

  describe('Exponential and Logarithm', () => {
    test('exp should compute e^z', () => {
      const c = new Complex(0, Math.PI);
      const result = c.exp();
      // e^(iπ) = -1
      expect(result.real.toNumber()).toBeCloseTo(-1, 10);
      expect(result.imag.toNumber()).toBeCloseTo(0, 10);
    });

    test('log should compute ln(z)', () => {
      const c = new Complex(Math.E, 0);
      const result = c.log();
      expect(result.real.toNumber()).toBeCloseTo(1, 10);
      expect(result.imag.toNumber()).toBeCloseTo(0, 10);
    });
  });

  describe('Trigonometric Functions', () => {
    test('sin should work for real input', () => {
      const c = new Complex(Math.PI / 2, 0);
      const result = c.sin();
      expect(result.real.toNumber()).toBeCloseTo(1, 10);
      expect(result.imag.toNumber()).toBeCloseTo(0, 10);
    });

    test('cos should work for real input', () => {
      const c = new Complex(0, 0);
      const result = c.cos();
      expect(result.real.toNumber()).toBeCloseTo(1, 10);
      expect(result.imag.toNumber()).toBeCloseTo(0, 10);
    });

    test('tan should be sin/cos', () => {
      const c = new Complex(0.5, 0.5);
      const tan = c.tan();
      const sinCos = c.sin().divide(c.cos());
      expect(tan.equals(sinCos, 1e-10)).toBe(true);
    });
  });

  describe('Hyperbolic Functions', () => {
    test('sinh should work', () => {
      const c = new Complex(1, 0);
      const result = c.sinh();
      expect(result.real.toNumber()).toBeCloseTo(Math.sinh(1), 10);
    });

    test('cosh should work', () => {
      const c = new Complex(1, 0);
      const result = c.cosh();
      expect(result.real.toNumber()).toBeCloseTo(Math.cosh(1), 10);
    });

    test('tanh should be sinh/cosh', () => {
      const c = new Complex(0.5, 0.5);
      const tanh = c.tanh();
      const sinhCosh = c.sinh().divide(c.cosh());
      expect(tanh.equals(sinhCosh, 1e-10)).toBe(true);
    });
  });

  describe('Square Root', () => {
    test('sqrt of real positive', () => {
      const c = new Complex(4, 0);
      const result = c.sqrt();
      expect(result.real.toNumber()).toBeCloseTo(2, 10);
      expect(result.imag.toNumber()).toBeCloseTo(0, 10);
    });

    test('sqrt of -1 should be i', () => {
      const c = new Complex(-1, 0);
      const result = c.sqrt();
      expect(result.real.toNumber()).toBeCloseTo(0, 10);
      expect(result.imag.toNumber()).toBeCloseTo(1, 10);
    });
  });

  describe('Nth Root', () => {
    test('nthRoot should compute principal root', () => {
      const c = new Complex(8, 0);
      const result = c.nthRoot(3);
      expect(result.real.toNumber()).toBeCloseTo(2, 10);
    });

    test('allNthRoots should return n roots', () => {
      const c = new Complex(1, 0);
      const roots = c.allNthRoots(3);
      expect(roots.length).toBe(3);
      // Each root^3 should equal 1
      for (const root of roots) {
        const cubed = root.pow(3);
        expect(cubed.equals(Complex.one(), 1e-10)).toBe(true);
      }
    });
  });

  describe('Equality', () => {
    test('equals should work without epsilon', () => {
      const a = new Complex(3, 4);
      const b = new Complex(3, 4);
      expect(a.equals(b)).toBe(true);
    });

    test('equals should work with epsilon', () => {
      const a = new Complex(3.0001, 4.0001);
      const b = new Complex(3, 4);
      expect(a.equals(b, 0.001)).toBe(true);
      expect(a.equals(b, 0.00001)).toBe(false);
    });
  });

  describe('String Representation', () => {
    test('toString for positive imaginary', () => {
      expect(new Complex(3, 4).toString()).toBe('3 + 4i');
    });

    test('toString for negative imaginary', () => {
      expect(new Complex(3, -4).toString()).toBe('3 - 4i');
    });

    test('toString for purely real', () => {
      expect(new Complex(3, 0).toString()).toBe('3');
    });

    test('toString for purely imaginary', () => {
      expect(new Complex(0, 4).toString()).toBe('4i');
    });

    test('toString for i', () => {
      expect(new Complex(0, 1).toString()).toBe('i');
    });

    test('toPolarString should work', () => {
      const c = new Complex(1, 0);
      expect(c.toPolarString()).toContain('e^');
    });
  });

  describe('Conversion', () => {
    test('toTuple should return [real, imag]', () => {
      const [r, i] = new Complex(3, 4).toTuple();
      expect(r).toBe(3);
      expect(i).toBe(4);
    });

    test('toObject should return {real, imag}', () => {
      const obj = new Complex(3, 4).toObject();
      expect(obj.real).toBe(3);
      expect(obj.imag).toBe(4);
    });
  });
});

describe('ComplexOperations', () => {
  test('dot product', () => {
    const a = new Complex(1, 2);
    const b = new Complex(3, 4);
    const dot = ComplexOperations.dot(a, b);
    expect(dot.toNumber()).toBe(11); // 1*3 + 2*4
  });

  test('cross product', () => {
    const a = new Complex(1, 2);
    const b = new Complex(3, 4);
    const cross = ComplexOperations.cross(a, b);
    expect(cross.toNumber()).toBe(-2); // 1*4 - 2*3
  });

  test('distance', () => {
    const a = new Complex(0, 0);
    const b = new Complex(3, 4);
    const dist = ComplexOperations.distance(a, b);
    expect(dist.toNumber()).toBe(5);
  });

  test('lerp', () => {
    const a = new Complex(0, 0);
    const b = new Complex(10, 10);
    const mid = ComplexOperations.lerp(a, b, 0.5);
    expect(mid.real.toNumber()).toBe(5);
    expect(mid.imag.toNumber()).toBe(5);
  });

  test('sum', () => {
    const values = [new Complex(1, 1), new Complex(2, 2), new Complex(3, 3)];
    const sum = ComplexOperations.sum(values);
    expect(sum.real.toNumber()).toBe(6);
    expect(sum.imag.toNumber()).toBe(6);
  });

  test('product', () => {
    const values = [new Complex(1, 0), new Complex(2, 0), new Complex(3, 0)];
    const prod = ComplexOperations.product(values);
    expect(prod.real.toNumber()).toBe(6);
  });

  test('average', () => {
    const values = [new Complex(0, 0), new Complex(10, 10)];
    const avg = ComplexOperations.average(values);
    expect(avg.real.toNumber()).toBe(5);
    expect(avg.imag.toNumber()).toBe(5);
  });

  test('rotation', () => {
    const rot = ComplexOperations.rotation(Math.PI / 2);
    expect(rot.real.toNumber()).toBeCloseTo(0, 10);
    expect(rot.imag.toNumber()).toBeCloseTo(1, 10);
  });

  test('rotate', () => {
    const c = new Complex(1, 0);
    const rotated = ComplexOperations.rotate(c, Math.PI / 2);
    expect(rotated.real.toNumber()).toBeCloseTo(0, 10);
    expect(rotated.imag.toNumber()).toBeCloseTo(1, 10);
  });
});
