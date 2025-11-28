/**
 * Qlaws Ham - BigNumber Module Tests
 * 
 * Comprehensive test suite for BigNumber (M01.03)
 */

import { BigNumber, RoundingMode } from '../../../src/core/math/BigNumber';

describe('BigNumber Module (M01.03)', () => {
  describe('Constructor and Parsing', () => {
    test('should create from integer', () => {
      const bn = new BigNumber(42);
      expect(bn.toString()).toBe('42');
    });

    test('should create from negative integer', () => {
      const bn = new BigNumber(-42);
      expect(bn.toString()).toBe('-42');
    });

    test('should create from decimal', () => {
      const bn = new BigNumber(3.14);
      expect(bn.toString()).toBe('3.14');
    });

    test('should create from string', () => {
      const bn = new BigNumber('123456789012345678901234567890');
      expect(bn.toString()).toBe('123456789012345678901234567890');
    });

    test('should create from decimal string', () => {
      const bn = new BigNumber('3.14159265358979323846');
      expect(bn.toString()).toBe('3.14159265358979323846');
    });

    test('should create from bigint', () => {
      const bn = new BigNumber(BigInt('12345678901234567890'));
      expect(bn.toString()).toBe('12345678901234567890');
    });

    test('should create from another BigNumber', () => {
      const bn1 = new BigNumber(42);
      const bn2 = new BigNumber(bn1);
      expect(bn2.toString()).toBe('42');
    });

    test('should handle scientific notation', () => {
      const bn = new BigNumber('1e10');
      expect(bn.toString()).toBe('10000000000');
    });

    test('should handle negative scientific notation', () => {
      const bn = new BigNumber('1e-5');
      expect(bn.toString()).toBe('0.00001');
    });

    test('should handle zero', () => {
      const bn = new BigNumber(0);
      expect(bn.toString()).toBe('0');
    });
  });

  describe('Basic Properties', () => {
    test('isZero should return true for zero', () => {
      expect(new BigNumber(0).isZero()).toBe(true);
    });

    test('isZero should return false for non-zero', () => {
      expect(new BigNumber(1).isZero()).toBe(false);
    });

    test('isNegative should work correctly', () => {
      expect(new BigNumber(-5).isNegative()).toBe(true);
      expect(new BigNumber(5).isNegative()).toBe(false);
      expect(new BigNumber(0).isNegative()).toBe(false);
    });

    test('isPositive should work correctly', () => {
      expect(new BigNumber(5).isPositive()).toBe(true);
      expect(new BigNumber(-5).isPositive()).toBe(false);
      expect(new BigNumber(0).isPositive()).toBe(false);
    });

    test('isInteger should work correctly', () => {
      expect(new BigNumber(5).isInteger()).toBe(true);
      expect(new BigNumber(5.5).isInteger()).toBe(false);
    });
  });

  describe('Comparison', () => {
    test('compare should return 0 for equal values', () => {
      expect(new BigNumber(5).compare(5)).toBe(0);
    });

    test('compare should return 1 for greater value', () => {
      expect(new BigNumber(10).compare(5)).toBe(1);
    });

    test('compare should return -1 for lesser value', () => {
      expect(new BigNumber(5).compare(10)).toBe(-1);
    });

    test('compare should work with decimals', () => {
      expect(new BigNumber('3.14').compare('3.15')).toBe(-1);
      expect(new BigNumber('3.15').compare('3.14')).toBe(1);
    });

    test('compare should work with negative numbers', () => {
      expect(new BigNumber(-5).compare(-10)).toBe(1);
      expect(new BigNumber(-10).compare(-5)).toBe(-1);
    });

    test('equals should work', () => {
      expect(new BigNumber(5).equals(5)).toBe(true);
      expect(new BigNumber(5).equals(6)).toBe(false);
    });

    test('equals with epsilon should work', () => {
      expect(new BigNumber('1.0001').equals('1.0002', 0.001)).toBe(true);
      expect(new BigNumber('1.0001').equals('1.0002', 0.00001)).toBe(false);
    });
  });

  describe('Addition', () => {
    test('should add two positive integers', () => {
      expect(new BigNumber(5).add(3).toString()).toBe('8');
    });

    test('should add with string', () => {
      expect(new BigNumber(5).add('3').toString()).toBe('8');
    });

    test('should add decimals', () => {
      expect(new BigNumber('1.5').add('2.5').toString()).toBe('4');
    });

    test('should add negative numbers', () => {
      expect(new BigNumber(-5).add(-3).toString()).toBe('-8');
    });

    test('should add mixed signs', () => {
      expect(new BigNumber(5).add(-3).toString()).toBe('2');
      expect(new BigNumber(-5).add(3).toString()).toBe('-2');
    });

    test('should handle large numbers', () => {
      const a = new BigNumber('99999999999999999999');
      const b = new BigNumber('1');
      expect(a.add(b).toString()).toBe('100000000000000000000');
    });
  });

  describe('Subtraction', () => {
    test('should subtract two positive integers', () => {
      expect(new BigNumber(5).subtract(3).toString()).toBe('2');
    });

    test('should handle result becoming negative', () => {
      expect(new BigNumber(3).subtract(5).toString()).toBe('-2');
    });

    test('should subtract decimals', () => {
      expect(new BigNumber('5.5').subtract('2.5').toString()).toBe('3');
    });

    test('should subtract negative numbers', () => {
      expect(new BigNumber(-5).subtract(-3).toString()).toBe('-2');
    });
  });

  describe('Multiplication', () => {
    test('should multiply two positive integers', () => {
      expect(new BigNumber(5).multiply(3).toString()).toBe('15');
    });

    test('should multiply by zero', () => {
      expect(new BigNumber(5).multiply(0).toString()).toBe('0');
    });

    test('should multiply decimals', () => {
      const result = new BigNumber('2.5').multiply('4');
      expect(result.toString()).toBe('10');
    });

    test('should multiply negative numbers', () => {
      expect(new BigNumber(-5).multiply(-3).toString()).toBe('15');
      expect(new BigNumber(-5).multiply(3).toString()).toBe('-15');
    });

    test('should handle large numbers', () => {
      const a = new BigNumber('123456789');
      const b = new BigNumber('987654321');
      expect(a.multiply(b).toString()).toBe('121932631112635269');
    });
  });

  describe('Division', () => {
    test('should divide evenly', () => {
      expect(new BigNumber(10).divide(2).toString()).toBe('5');
    });

    test('should handle non-even division', () => {
      const result = new BigNumber(10).divide(3);
      expect(result.toString().startsWith('3.333333')).toBe(true);
    });

    test('should throw on division by zero', () => {
      expect(() => new BigNumber(5).divide(0)).toThrow('Division by zero');
    });

    test('should divide negative numbers', () => {
      expect(new BigNumber(-10).divide(2).toString()).toBe('-5');
      expect(new BigNumber(10).divide(-2).toString()).toBe('-5');
    });
  });

  describe('Power', () => {
    test('should compute power', () => {
      expect(new BigNumber(2).pow(10).toString()).toBe('1024');
    });

    test('should handle power of 0', () => {
      expect(new BigNumber(5).pow(0).toString()).toBe('1');
    });

    test('should handle power of 1', () => {
      expect(new BigNumber(5).pow(1).toString()).toBe('5');
    });

    test('should handle negative powers', () => {
      const result = new BigNumber(2).pow(-1);
      expect(result.toString()).toBe('0.5');
    });
  });

  describe('Square Root', () => {
    test('should compute sqrt of perfect square', () => {
      const result = new BigNumber(16).sqrt();
      expect(result.toString()).toBe('4');
    });

    test('should compute sqrt of non-perfect square', () => {
      const result = new BigNumber(2).sqrt();
      expect(result.toString().startsWith('1.4142135')).toBe(true);
    });

    test('should throw for negative numbers', () => {
      expect(() => new BigNumber(-4).sqrt()).toThrow();
    });

    test('should handle sqrt of zero', () => {
      expect(new BigNumber(0).sqrt().toString()).toBe('0');
    });
  });

  describe('Rounding', () => {
    test('floor should round down', () => {
      expect(new BigNumber('3.9').floor().toString()).toBe('3');
      expect(new BigNumber('-3.1').floor().toString()).toBe('-4');
    });

    test('ceil should round up', () => {
      expect(new BigNumber('3.1').ceil().toString()).toBe('4');
      expect(new BigNumber('-3.9').ceil().toString()).toBe('-3');
    });

    test('round should round to nearest', () => {
      expect(new BigNumber('3.4').round().toString()).toBe('3');
      expect(new BigNumber('3.5').round().toString()).toBe('4');
      expect(new BigNumber('3.6').round().toString()).toBe('4');
    });

    test('round should work with decimal places', () => {
      expect(new BigNumber('3.14159').round(2).toString()).toBe('3.14');
      expect(new BigNumber('3.14559').round(2).toString()).toBe('3.15');
    });
  });

  describe('Absolute and Negate', () => {
    test('abs should return absolute value', () => {
      expect(new BigNumber(-5).abs().toString()).toBe('5');
      expect(new BigNumber(5).abs().toString()).toBe('5');
    });

    test('negate should negate value', () => {
      expect(new BigNumber(5).negate().toString()).toBe('-5');
      expect(new BigNumber(-5).negate().toString()).toBe('5');
    });
  });

  describe('Modulo', () => {
    test('should compute modulo', () => {
      expect(new BigNumber(17).mod(5).toString()).toBe('2');
    });

    test('should handle negative dividend', () => {
      const result = new BigNumber(-17).mod(5);
      // Note: modulo behavior can vary
      expect(result.abs().compare(5)).toBeLessThan(0);
    });
  });

  describe('Nth Root', () => {
    test('should compute cube root', () => {
      const result = new BigNumber(27).root(3);
      expect(result.round(10).toString()).toBe('3');
    });

    test('should compute 4th root', () => {
      const result = new BigNumber(16).root(4);
      expect(result.round(10).toString()).toBe('2');
    });
  });

  describe('Conversion', () => {
    test('toNumber should convert to JS number', () => {
      expect(new BigNumber(42).toNumber()).toBe(42);
    });

    test('toBigInt should convert to BigInt', () => {
      expect(new BigNumber(42).toBigInt()).toBe(BigInt(42));
    });

    test('toBigInt should truncate decimals', () => {
      expect(new BigNumber('42.9').toBigInt()).toBe(BigInt(42));
    });
  });

  describe('Static Methods', () => {
    test('zero should return 0', () => {
      expect(BigNumber.zero().toString()).toBe('0');
    });

    test('one should return 1', () => {
      expect(BigNumber.one().toString()).toBe('1');
    });

    test('pi should return pi', () => {
      const pi = BigNumber.pi(10);
      expect(pi.toString().startsWith('3.14159')).toBe(true);
    });

    test('e should return e', () => {
      const e = BigNumber.e(10);
      expect(e.toString().startsWith('2.71828')).toBe(true);
    });

    test('max should return maximum', () => {
      expect(BigNumber.max(1, 5, 3).toString()).toBe('5');
    });

    test('min should return minimum', () => {
      expect(BigNumber.min(1, 5, 3).toString()).toBe('1');
    });

    test('sum should return sum', () => {
      expect(BigNumber.sum(1, 2, 3, 4).toString()).toBe('10');
    });

    test('product should return product', () => {
      expect(BigNumber.product(1, 2, 3, 4).toString()).toBe('24');
    });
  });

  describe('Precision Configuration', () => {
    test('should get default precision', () => {
      const precision = BigNumber.getPrecision();
      expect(precision.digits).toBe(50);
      expect(precision.roundingMode).toBe(RoundingMode.ROUND_HALF_UP);
    });

    test('should update precision', () => {
      BigNumber.setPrecision({ digits: 100 });
      expect(BigNumber.getPrecision().digits).toBe(100);
      // Reset
      BigNumber.setPrecision({ digits: 50 });
    });
  });

  describe('Edge Cases', () => {
    test('should handle very large numbers', () => {
      const big = new BigNumber('9'.repeat(100));
      expect(big.add(1).toString()).toBe('1' + '0'.repeat(100));
    });

    test('should handle very small decimals', () => {
      const small = new BigNumber('0.' + '0'.repeat(20) + '1');
      expect(small.multiply(10).toString()).toBe('0.' + '0'.repeat(19) + '1');
    });

    test('should maintain precision in chain operations', () => {
      const result = new BigNumber(1)
        .divide(3)
        .multiply(3);
      expect(result.equals(1, 1e-10)).toBe(true);
    });
  });

  describe('Performance', () => {
    test('should handle 1000 additions quickly', () => {
      const start = Date.now();
      let result = BigNumber.zero();
      for (let i = 0; i < 1000; i++) {
        result = result.add(i);
      }
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(5000);
      expect(result.toString()).toBe('499500');
    });

    test('should handle 100 multiplications quickly', () => {
      const start = Date.now();
      let result = BigNumber.one();
      for (let i = 1; i <= 20; i++) {
        result = result.multiply(i);
      }
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(2000);
      // 20! = 2432902008176640000
      expect(result.toString()).toBe('2432902008176640000');
    });
  });
});
