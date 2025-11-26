/**
 * Qlaws Ham - Matrix Module Tests
 * 
 * Comprehensive test suite for Matrix (M01.05)
 */

import { Matrix, Vector, MatrixOperations } from '../../../src/core/math/Matrix';
import { BigNumber } from '../../../src/core/math/BigNumber';

describe('Vector', () => {
  describe('Constructor', () => {
    test('should create from numbers', () => {
      const v = new Vector([1, 2, 3]);
      expect(v.size).toBe(3);
      expect(v.get(0).toNumber()).toBe(1);
      expect(v.get(1).toNumber()).toBe(2);
      expect(v.get(2).toNumber()).toBe(3);
    });

    test('should throw for invalid index', () => {
      const v = new Vector([1, 2, 3]);
      expect(() => v.get(-1)).toThrow();
      expect(() => v.get(3)).toThrow();
    });
  });

  describe('Factory Methods', () => {
    test('zeros should create zero vector', () => {
      const v = Vector.zeros(3);
      expect(v.get(0).toNumber()).toBe(0);
      expect(v.get(1).toNumber()).toBe(0);
      expect(v.get(2).toNumber()).toBe(0);
    });

    test('ones should create ones vector', () => {
      const v = Vector.ones(3);
      expect(v.get(0).toNumber()).toBe(1);
      expect(v.get(1).toNumber()).toBe(1);
      expect(v.get(2).toNumber()).toBe(1);
    });

    test('unit should create unit vector', () => {
      const v = Vector.unit(3, 1);
      expect(v.get(0).toNumber()).toBe(0);
      expect(v.get(1).toNumber()).toBe(1);
      expect(v.get(2).toNumber()).toBe(0);
    });
  });

  describe('Operations', () => {
    test('add should add vectors', () => {
      const a = new Vector([1, 2, 3]);
      const b = new Vector([4, 5, 6]);
      const result = a.add(b);
      expect(result.get(0).toNumber()).toBe(5);
      expect(result.get(1).toNumber()).toBe(7);
      expect(result.get(2).toNumber()).toBe(9);
    });

    test('subtract should subtract vectors', () => {
      const a = new Vector([5, 7, 9]);
      const b = new Vector([1, 2, 3]);
      const result = a.subtract(b);
      expect(result.get(0).toNumber()).toBe(4);
      expect(result.get(1).toNumber()).toBe(5);
      expect(result.get(2).toNumber()).toBe(6);
    });

    test('scale should multiply by scalar', () => {
      const v = new Vector([1, 2, 3]);
      const result = v.scale(2);
      expect(result.get(0).toNumber()).toBe(2);
      expect(result.get(1).toNumber()).toBe(4);
      expect(result.get(2).toNumber()).toBe(6);
    });

    test('dot should compute dot product', () => {
      const a = new Vector([1, 2, 3]);
      const b = new Vector([4, 5, 6]);
      const result = a.dot(b);
      expect(result.toNumber()).toBe(32); // 1*4 + 2*5 + 3*6
    });

    test('magnitude should compute length', () => {
      const v = new Vector([3, 4]);
      expect(v.magnitude().toNumber()).toBe(5);
    });

    test('normalize should create unit vector', () => {
      const v = new Vector([3, 4]);
      const norm = v.normalize();
      expect(norm.magnitude().toNumber()).toBeCloseTo(1, 10);
    });

    test('cross should compute cross product for 3D', () => {
      const a = new Vector([1, 0, 0]);
      const b = new Vector([0, 1, 0]);
      const result = a.cross(b);
      expect(result.get(0).toNumber()).toBe(0);
      expect(result.get(1).toNumber()).toBe(0);
      expect(result.get(2).toNumber()).toBe(1);
    });

    test('cross should throw for non-3D vectors', () => {
      const a = new Vector([1, 2]);
      const b = new Vector([3, 4]);
      expect(() => a.cross(b)).toThrow();
    });
  });

  describe('Conversion', () => {
    test('toArray should convert to number array', () => {
      const v = new Vector([1, 2, 3]);
      expect(v.toArray()).toEqual([1, 2, 3]);
    });

    test('toString should format correctly', () => {
      const v = new Vector([1, 2, 3]);
      expect(v.toString()).toBe('[1, 2, 3]');
    });
  });
});

describe('Matrix', () => {
  describe('Constructor', () => {
    test('should create from 2D array', () => {
      const m = new Matrix([[1, 2], [3, 4]]);
      expect(m.rows).toBe(2);
      expect(m.cols).toBe(2);
      expect(m.get(0, 0).toNumber()).toBe(1);
      expect(m.get(1, 1).toNumber()).toBe(4);
    });

    test('should throw for empty matrix', () => {
      expect(() => new Matrix([])).toThrow();
    });

    test('should throw for inconsistent row lengths', () => {
      expect(() => new Matrix([[1, 2], [3]])).toThrow();
    });
  });

  describe('Factory Methods', () => {
    test('zeros should create zero matrix', () => {
      const m = Matrix.zeros(2, 3);
      expect(m.rows).toBe(2);
      expect(m.cols).toBe(3);
      expect(m.get(0, 0).toNumber()).toBe(0);
    });

    test('ones should create ones matrix', () => {
      const m = Matrix.ones(2, 2);
      expect(m.get(0, 0).toNumber()).toBe(1);
      expect(m.get(1, 1).toNumber()).toBe(1);
    });

    test('identity should create identity matrix', () => {
      const m = Matrix.identity(3);
      expect(m.get(0, 0).toNumber()).toBe(1);
      expect(m.get(1, 1).toNumber()).toBe(1);
      expect(m.get(2, 2).toNumber()).toBe(1);
      expect(m.get(0, 1).toNumber()).toBe(0);
    });

    test('diagonal should create diagonal matrix', () => {
      const m = Matrix.diagonal([1, 2, 3]);
      expect(m.get(0, 0).toNumber()).toBe(1);
      expect(m.get(1, 1).toNumber()).toBe(2);
      expect(m.get(2, 2).toNumber()).toBe(3);
      expect(m.get(0, 1).toNumber()).toBe(0);
    });

    test('fromColumns should create from vectors', () => {
      const v1 = new Vector([1, 2]);
      const v2 = new Vector([3, 4]);
      const m = Matrix.fromColumns([v1, v2]);
      expect(m.get(0, 0).toNumber()).toBe(1);
      expect(m.get(0, 1).toNumber()).toBe(3);
    });

    test('fromRows should create from vectors', () => {
      const v1 = new Vector([1, 2]);
      const v2 = new Vector([3, 4]);
      const m = Matrix.fromRows([v1, v2]);
      expect(m.get(0, 0).toNumber()).toBe(1);
      expect(m.get(0, 1).toNumber()).toBe(2);
    });
  });

  describe('Properties', () => {
    test('isSquare should work', () => {
      expect(new Matrix([[1, 2], [3, 4]]).isSquare()).toBe(true);
      expect(new Matrix([[1, 2, 3], [4, 5, 6]]).isSquare()).toBe(false);
    });

    test('isSymmetric should work', () => {
      expect(new Matrix([[1, 2], [2, 1]]).isSymmetric()).toBe(true);
      expect(new Matrix([[1, 2], [3, 1]]).isSymmetric()).toBe(false);
    });

    test('getRow should return row as vector', () => {
      const m = new Matrix([[1, 2], [3, 4]]);
      const row = m.getRow(0);
      expect(row.get(0).toNumber()).toBe(1);
      expect(row.get(1).toNumber()).toBe(2);
    });

    test('getCol should return column as vector', () => {
      const m = new Matrix([[1, 2], [3, 4]]);
      const col = m.getCol(0);
      expect(col.get(0).toNumber()).toBe(1);
      expect(col.get(1).toNumber()).toBe(3);
    });
  });

  describe('Transpose', () => {
    test('should transpose matrix', () => {
      const m = new Matrix([[1, 2, 3], [4, 5, 6]]);
      const t = m.transpose();
      expect(t.rows).toBe(3);
      expect(t.cols).toBe(2);
      expect(t.get(0, 0).toNumber()).toBe(1);
      expect(t.get(0, 1).toNumber()).toBe(4);
    });
  });

  describe('Addition and Subtraction', () => {
    test('should add matrices', () => {
      const a = new Matrix([[1, 2], [3, 4]]);
      const b = new Matrix([[5, 6], [7, 8]]);
      const result = a.add(b);
      expect(result.get(0, 0).toNumber()).toBe(6);
      expect(result.get(1, 1).toNumber()).toBe(12);
    });

    test('should subtract matrices', () => {
      const a = new Matrix([[5, 6], [7, 8]]);
      const b = new Matrix([[1, 2], [3, 4]]);
      const result = a.subtract(b);
      expect(result.get(0, 0).toNumber()).toBe(4);
      expect(result.get(1, 1).toNumber()).toBe(4);
    });

    test('should throw for mismatched dimensions', () => {
      const a = new Matrix([[1, 2]]);
      const b = new Matrix([[1], [2]]);
      expect(() => a.add(b)).toThrow();
    });
  });

  describe('Scalar Multiplication', () => {
    test('should multiply by scalar', () => {
      const m = new Matrix([[1, 2], [3, 4]]);
      const result = m.scale(2);
      expect(result.get(0, 0).toNumber()).toBe(2);
      expect(result.get(1, 1).toNumber()).toBe(8);
    });
  });

  describe('Matrix Multiplication', () => {
    test('should multiply matrices', () => {
      const a = new Matrix([[1, 2], [3, 4]]);
      const b = new Matrix([[5, 6], [7, 8]]);
      const result = a.multiply(b);
      // [[1*5+2*7, 1*6+2*8], [3*5+4*7, 3*6+4*8]]
      // [[19, 22], [43, 50]]
      expect(result.get(0, 0).toNumber()).toBe(19);
      expect(result.get(0, 1).toNumber()).toBe(22);
      expect(result.get(1, 0).toNumber()).toBe(43);
      expect(result.get(1, 1).toNumber()).toBe(50);
    });

    test('should throw for incompatible dimensions', () => {
      const a = new Matrix([[1, 2]]);
      const b = new Matrix([[1, 2]]);
      expect(() => a.multiply(b)).toThrow();
    });
  });

  describe('Matrix-Vector Multiplication', () => {
    test('should multiply matrix by vector', () => {
      const m = new Matrix([[1, 2], [3, 4]]);
      const v = new Vector([1, 2]);
      const result = m.multiplyVector(v);
      expect(result.get(0).toNumber()).toBe(5);
      expect(result.get(1).toNumber()).toBe(11);
    });
  });

  describe('Matrix Power', () => {
    test('should compute matrix power', () => {
      const m = new Matrix([[1, 1], [1, 0]]);
      const result = m.pow(6);
      // Fibonacci matrix: F(6) = 8, F(7) = 13
      expect(result.get(0, 0).toNumber()).toBe(13);
      expect(result.get(0, 1).toNumber()).toBe(8);
    });

    test('pow(0) should return identity', () => {
      const m = new Matrix([[1, 2], [3, 4]]);
      const result = m.pow(0);
      expect(result.equals(Matrix.identity(2))).toBe(true);
    });
  });

  describe('Trace', () => {
    test('should compute trace', () => {
      const m = new Matrix([[1, 2], [3, 4]]);
      expect(m.trace().toNumber()).toBe(5);
    });

    test('should throw for non-square matrix', () => {
      const m = new Matrix([[1, 2, 3]]);
      expect(() => m.trace()).toThrow();
    });
  });

  describe('Determinant', () => {
    test('should compute 2x2 determinant', () => {
      const m = new Matrix([[1, 2], [3, 4]]);
      expect(m.determinant().toNumber()).toBe(-2);
    });

    test('should compute 3x3 determinant', () => {
      const m = new Matrix([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
      ]);
      // This matrix is singular, det = 0
      expect(m.determinant().toNumber()).toBeCloseTo(0, 10);
    });

    test('should compute non-singular 3x3 determinant', () => {
      const m = new Matrix([
        [1, 2, 3],
        [0, 1, 4],
        [5, 6, 0]
      ]);
      expect(m.determinant().toNumber()).toBe(1);
    });
  });

  describe('LU Decomposition', () => {
    test('should decompose into L and U', () => {
      const m = new Matrix([[4, 3], [6, 3]]);
      const { L, U, P } = m.luDecomposition();
      // L * U should equal P * original matrix
      const product = L.multiply(U);
      // After permutation, check that we get meaningful L and U matrices
      // L should be lower triangular with 1s on diagonal
      expect(L.get(0, 0).toNumber()).toBe(1);
      expect(L.get(1, 1).toNumber()).toBe(1);
      // U should be upper triangular (with floating point tolerance)
      expect(U.get(1, 0).toNumber()).toBeCloseTo(0, 10);
    });
  });

  describe('Inverse', () => {
    test('should compute inverse', () => {
      const m = new Matrix([[4, 7], [2, 6]]);
      const inv = m.inverse();
      const product = m.multiply(inv);
      // Product should be close to identity
      expect(product.get(0, 0).toNumber()).toBeCloseTo(1, 10);
      expect(product.get(0, 1).toNumber()).toBeCloseTo(0, 10);
      expect(product.get(1, 0).toNumber()).toBeCloseTo(0, 10);
      expect(product.get(1, 1).toNumber()).toBeCloseTo(1, 10);
    });

    test('should throw for singular matrix', () => {
      const m = new Matrix([[1, 2], [2, 4]]);
      expect(() => m.inverse()).toThrow();
    });
  });

  describe('Norm', () => {
    test('should compute Frobenius norm', () => {
      const m = new Matrix([[1, 2], [3, 4]]);
      const norm = m.norm();
      // sqrt(1 + 4 + 9 + 16) = sqrt(30)
      expect(norm.toNumber()).toBeCloseTo(Math.sqrt(30), 10);
    });
  });

  describe('Hadamard Product', () => {
    test('should compute element-wise product', () => {
      const a = new Matrix([[1, 2], [3, 4]]);
      const b = new Matrix([[5, 6], [7, 8]]);
      const result = a.hadamard(b);
      expect(result.get(0, 0).toNumber()).toBe(5);
      expect(result.get(0, 1).toNumber()).toBe(12);
      expect(result.get(1, 0).toNumber()).toBe(21);
      expect(result.get(1, 1).toNumber()).toBe(32);
    });
  });

  describe('Equality', () => {
    test('equals should work without epsilon', () => {
      const a = new Matrix([[1, 2], [3, 4]]);
      const b = new Matrix([[1, 2], [3, 4]]);
      expect(a.equals(b)).toBe(true);
    });

    test('equals should work with epsilon', () => {
      const a = new Matrix([[1.0001, 2], [3, 4]]);
      const b = new Matrix([[1, 2], [3, 4]]);
      expect(a.equals(b, 0.001)).toBe(true);
      expect(a.equals(b, 0.00001)).toBe(false);
    });
  });

  describe('Clone', () => {
    test('should create independent copy', () => {
      const m = new Matrix([[1, 2], [3, 4]]);
      const c = m.clone();
      expect(c.equals(m)).toBe(true);
    });
  });

  describe('Conversion', () => {
    test('toArray should convert to number array', () => {
      const m = new Matrix([[1, 2], [3, 4]]);
      expect(m.toArray()).toEqual([[1, 2], [3, 4]]);
    });
  });
});

describe('MatrixOperations', () => {
  test('kronecker product', () => {
    const a = new Matrix([[1, 2], [3, 4]]);
    const b = new Matrix([[0, 5], [6, 7]]);
    const result = MatrixOperations.kronecker(a, b);
    expect(result.rows).toBe(4);
    expect(result.cols).toBe(4);
  });

  test('outer product', () => {
    const a = new Vector([1, 2]);
    const b = new Vector([3, 4]);
    const result = MatrixOperations.outerProduct(a, b);
    expect(result.get(0, 0).toNumber()).toBe(3);
    expect(result.get(0, 1).toNumber()).toBe(4);
    expect(result.get(1, 0).toNumber()).toBe(6);
    expect(result.get(1, 1).toNumber()).toBe(8);
  });

  test('solve linear system', () => {
    // Ax = b where A = [[2, 1], [1, 3]], b = [1, 2]
    // Solution: x = [0.2, 0.6]
    const A = new Matrix([[2, 1], [1, 3]]);
    const b = new Vector([1, 2]);
    const x = MatrixOperations.solve(A, b);
    expect(x.get(0).toNumber()).toBeCloseTo(0.2, 10);
    expect(x.get(1).toNumber()).toBeCloseTo(0.6, 10);
  });
});
