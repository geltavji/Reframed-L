/**
 * Tensor.test.ts - PRD-03 Phase 3.1 Tests
 * 
 * Tests for tensor algebra implementation including:
 * - Tensor creation and access
 * - Tensor arithmetic operations
 * - Index contraction
 * - Tensor products
 * - Coordinate transformations
 * - Symmetrization/antisymmetrization
 */

import { 
  Tensor, 
  TensorFactory, 
  IndexType,
  TensorConfig 
} from '../../../src/spacetime/tensor/Tensor';

describe('Tensor (M03.01) - Phase 3.1', () => {
  describe('Tensor Creation', () => {
    it('should create a rank-0 tensor (scalar)', () => {
      const scalar = new Tensor({ rank: 0, dimensions: [], indexTypes: [] }, [42]);
      expect(scalar.getRank()).toBe(0);
      expect(scalar.getComponents()).toEqual([42]);
    });

    it('should create a rank-1 tensor (vector)', () => {
      const vector = new Tensor({
        rank: 1,
        dimensions: [4],
        indexTypes: [IndexType.CONTRAVARIANT]
      }, [1, 2, 3, 4]);
      
      expect(vector.getRank()).toBe(1);
      expect(vector.getDimensions()).toEqual([4]);
      expect(vector.get(0)).toBe(1);
      expect(vector.get(3)).toBe(4);
    });

    it('should create a rank-2 tensor (matrix)', () => {
      const matrix = new Tensor({
        rank: 2,
        dimensions: [3, 3],
        indexTypes: [IndexType.COVARIANT, IndexType.COVARIANT]
      });
      
      expect(matrix.getRank()).toBe(2);
      expect(matrix.getType()).toEqual([0, 2]); // 0 contravariant, 2 covariant
    });

    it('should create a mixed tensor', () => {
      const mixed = new Tensor({
        rank: 3,
        dimensions: [4, 4, 4],
        indexTypes: [IndexType.CONTRAVARIANT, IndexType.COVARIANT, IndexType.COVARIANT]
      });
      
      expect(mixed.getRank()).toBe(3);
      expect(mixed.getType()).toEqual([1, 2]); // 1 contravariant, 2 covariant
      expect(mixed.getContravariantCount()).toBe(1);
      expect(mixed.getCovariantCount()).toBe(2);
    });

    it('should initialize with zero components by default', () => {
      const tensor = new Tensor({
        rank: 2,
        dimensions: [2, 2],
        indexTypes: [IndexType.COVARIANT, IndexType.COVARIANT]
      });
      
      expect(tensor.get(0, 0)).toBe(0);
      expect(tensor.get(1, 1)).toBe(0);
    });

    it('should accept initial components', () => {
      const tensor = new Tensor({
        rank: 2,
        dimensions: [2, 2],
        indexTypes: [IndexType.COVARIANT, IndexType.COVARIANT]
      }, [1, 2, 3, 4]);
      
      expect(tensor.get(0, 0)).toBe(1);
      expect(tensor.get(0, 1)).toBe(2);
      expect(tensor.get(1, 0)).toBe(3);
      expect(tensor.get(1, 1)).toBe(4);
    });

    it('should throw on dimension mismatch', () => {
      expect(() => new Tensor({
        rank: 2,
        dimensions: [3],  // Wrong: should have 2 dimensions
        indexTypes: [IndexType.COVARIANT, IndexType.COVARIANT]
      })).toThrow();
    });

    it('should throw on component count mismatch', () => {
      expect(() => new Tensor({
        rank: 2,
        dimensions: [2, 2],
        indexTypes: [IndexType.COVARIANT, IndexType.COVARIANT]
      }, [1, 2, 3])).toThrow(); // Need 4 components, not 3
    });
  });

  describe('Tensor Access', () => {
    let tensor: Tensor;

    beforeEach(() => {
      tensor = new Tensor({
        rank: 3,
        dimensions: [2, 3, 2],
        indexTypes: [IndexType.CONTRAVARIANT, IndexType.COVARIANT, IndexType.COVARIANT]
      }, Array.from({ length: 12 }, (_, i) => i));
    });

    it('should get components correctly', () => {
      expect(tensor.get(0, 0, 0)).toBe(0);
      expect(tensor.get(0, 0, 1)).toBe(1);
      expect(tensor.get(0, 1, 0)).toBe(2);
      expect(tensor.get(1, 2, 1)).toBe(11);
    });

    it('should set components correctly', () => {
      tensor.set(99, 1, 1, 1);
      expect(tensor.get(1, 1, 1)).toBe(99);
    });

    it('should throw on out of bounds access', () => {
      expect(() => tensor.get(2, 0, 0)).toThrow(); // First index max is 1
      expect(() => tensor.get(0, 3, 0)).toThrow(); // Second index max is 2
    });

    it('should throw on wrong number of indices', () => {
      expect(() => tensor.get(0, 0)).toThrow();
      expect(() => tensor.get(0, 0, 0, 0)).toThrow();
    });
  });

  describe('Tensor Arithmetic', () => {
    let t1: Tensor, t2: Tensor;

    beforeEach(() => {
      t1 = new Tensor({
        rank: 2,
        dimensions: [2, 2],
        indexTypes: [IndexType.COVARIANT, IndexType.COVARIANT]
      }, [1, 2, 3, 4]);

      t2 = new Tensor({
        rank: 2,
        dimensions: [2, 2],
        indexTypes: [IndexType.COVARIANT, IndexType.COVARIANT]
      }, [5, 6, 7, 8]);
    });

    it('should add tensors correctly', () => {
      const sum = t1.add(t2);
      expect(sum.get(0, 0)).toBe(6);
      expect(sum.get(0, 1)).toBe(8);
      expect(sum.get(1, 0)).toBe(10);
      expect(sum.get(1, 1)).toBe(12);
    });

    it('should subtract tensors correctly', () => {
      const diff = t1.subtract(t2);
      expect(diff.get(0, 0)).toBe(-4);
      expect(diff.get(0, 1)).toBe(-4);
    });

    it('should scale tensor correctly', () => {
      const scaled = t1.scale(2);
      expect(scaled.get(0, 0)).toBe(2);
      expect(scaled.get(1, 1)).toBe(8);
    });

    it('should throw when adding tensors of different structure', () => {
      const different = new Tensor({
        rank: 2,
        dimensions: [3, 3],
        indexTypes: [IndexType.COVARIANT, IndexType.COVARIANT]
      });
      expect(() => t1.add(different)).toThrow();
    });

    it('should throw when adding tensors of different index types', () => {
      const different = new Tensor({
        rank: 2,
        dimensions: [2, 2],
        indexTypes: [IndexType.CONTRAVARIANT, IndexType.COVARIANT] // Different type
      }, [5, 6, 7, 8]);
      expect(() => t1.add(different)).toThrow();
    });
  });

  describe('Tensor Product', () => {
    it('should compute tensor product of two vectors', () => {
      const v1 = TensorFactory.vector([1, 2], true);
      const v2 = TensorFactory.vector([3, 4], true);
      
      const result = v1.tensorProduct(v2);
      expect(result.tensor.getRank()).toBe(2);
      expect(result.tensor.getDimensions()).toEqual([2, 2]);
      expect(result.tensor.get(0, 0)).toBe(3);  // 1*3
      expect(result.tensor.get(0, 1)).toBe(4);  // 1*4
      expect(result.tensor.get(1, 0)).toBe(6);  // 2*3
      expect(result.tensor.get(1, 1)).toBe(8);  // 2*4
    });

    it('should compute tensor product preserving index types', () => {
      const t1 = new Tensor({
        rank: 1,
        dimensions: [2],
        indexTypes: [IndexType.CONTRAVARIANT]
      }, [1, 2]);
      
      const t2 = new Tensor({
        rank: 1,
        dimensions: [2],
        indexTypes: [IndexType.COVARIANT]
      }, [3, 4]);
      
      const result = t1.tensorProduct(t2);
      expect(result.tensor.getIndexTypes()).toEqual([
        IndexType.CONTRAVARIANT,
        IndexType.COVARIANT
      ]);
    });

    it('should have valid hash', () => {
      const v1 = TensorFactory.vector([1, 2], true);
      const v2 = TensorFactory.vector([3, 4], true);
      const result = v1.tensorProduct(v2);
      expect(result.hash).toHaveLength(64);
    });
  });

  describe('Index Contraction', () => {
    it('should contract rank-2 tensor to scalar', () => {
      const tensor = new Tensor({
        rank: 2,
        dimensions: [3, 3],
        indexTypes: [IndexType.CONTRAVARIANT, IndexType.COVARIANT]
      }, [1, 0, 0, 0, 2, 0, 0, 0, 3]);
      
      const contracted = tensor.contract(0, 1);
      expect(contracted.getRank()).toBe(0);
      expect(contracted.getComponents()[0]).toBe(6); // 1 + 2 + 3 = trace
    });

    it('should contract higher rank tensors correctly', () => {
      // Create T^{μ}_{νρ} and contract μ and ν
      const tensor = new Tensor({
        rank: 3,
        dimensions: [2, 2, 2],
        indexTypes: [IndexType.CONTRAVARIANT, IndexType.COVARIANT, IndexType.COVARIANT]
      });
      
      // Set up: T^0_{00} = 1, T^1_{10} = 2
      tensor.set(1, 0, 0, 0);
      tensor.set(2, 1, 1, 0);
      
      const contracted = tensor.contract(0, 1);
      expect(contracted.getRank()).toBe(1);
      expect(contracted.get(0)).toBe(3); // Sum of diagonal: T^0_{00} + T^1_{10}
    });

    it('should throw when contracting same index', () => {
      const tensor = new Tensor({
        rank: 2,
        dimensions: [2, 2],
        indexTypes: [IndexType.CONTRAVARIANT, IndexType.COVARIANT]
      });
      expect(() => tensor.contract(0, 0)).toThrow();
    });

    it('should throw when dimensions do not match', () => {
      const tensor = new Tensor({
        rank: 2,
        dimensions: [2, 3],
        indexTypes: [IndexType.CONTRAVARIANT, IndexType.COVARIANT]
      });
      expect(() => tensor.contract(0, 1)).toThrow();
    });
  });

  describe('Symmetrization', () => {
    let tensor: Tensor;

    beforeEach(() => {
      tensor = new Tensor({
        rank: 2,
        dimensions: [3, 3],
        indexTypes: [IndexType.COVARIANT, IndexType.COVARIANT]
      }, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it('should symmetrize tensor correctly', () => {
      const sym = tensor.symmetrize(0, 1);
      
      // T_{(ij)} = (T_{ij} + T_{ji}) / 2
      expect(sym.get(0, 1)).toBe((2 + 4) / 2); // 3
      expect(sym.get(1, 0)).toBe((4 + 2) / 2); // 3
      expect(sym.isSymmetric(0, 1)).toBe(true);
    });

    it('should antisymmetrize tensor correctly', () => {
      const asym = tensor.antisymmetrize(0, 1);
      
      // T_{[ij]} = (T_{ij} - T_{ji}) / 2
      expect(asym.get(0, 1)).toBe((2 - 4) / 2); // -1
      expect(asym.get(1, 0)).toBe((4 - 2) / 2); // 1
      expect(asym.isAntisymmetric(0, 1)).toBe(true);
    });

    it('should detect symmetric tensor', () => {
      const symTensor = new Tensor({
        rank: 2,
        dimensions: [2, 2],
        indexTypes: [IndexType.COVARIANT, IndexType.COVARIANT]
      }, [1, 2, 2, 3]);
      
      expect(symTensor.isSymmetric(0, 1)).toBe(true);
      expect(symTensor.isAntisymmetric(0, 1)).toBe(false);
    });

    it('should detect antisymmetric tensor', () => {
      const asymTensor = new Tensor({
        rank: 2,
        dimensions: [2, 2],
        indexTypes: [IndexType.COVARIANT, IndexType.COVARIANT]
      }, [0, 1, -1, 0]);
      
      expect(asymTensor.isSymmetric(0, 1)).toBe(false);
      expect(asymTensor.isAntisymmetric(0, 1)).toBe(true);
    });
  });

  describe('TensorFactory', () => {
    it('should create zero tensor', () => {
      const zero = TensorFactory.zero([2, 2], [IndexType.COVARIANT, IndexType.COVARIANT]);
      expect(zero.getComponents().every(c => c === 0)).toBe(true);
    });

    it('should create Kronecker delta', () => {
      const delta = TensorFactory.kroneckerDelta(3);
      
      expect(delta.get(0, 0)).toBe(1);
      expect(delta.get(1, 1)).toBe(1);
      expect(delta.get(2, 2)).toBe(1);
      expect(delta.get(0, 1)).toBe(0);
      expect(delta.get(1, 2)).toBe(0);
    });

    it('should create Levi-Civita symbol in 3D', () => {
      const eps = TensorFactory.leviCivita(3);
      
      expect(eps.get(0, 1, 2)).toBe(1);   // ε_{012} = +1
      expect(eps.get(1, 2, 0)).toBe(1);   // ε_{120} = +1 (cyclic)
      expect(eps.get(2, 0, 1)).toBe(1);   // ε_{201} = +1 (cyclic)
      expect(eps.get(0, 2, 1)).toBe(-1);  // ε_{021} = -1 (odd permutation)
      expect(eps.get(0, 0, 1)).toBe(0);   // Repeated index = 0
    });

    it('should create Minkowski metric', () => {
      const eta = TensorFactory.minkowskiMetric();
      
      expect(eta.get(0, 0)).toBe(-1);
      expect(eta.get(1, 1)).toBe(1);
      expect(eta.get(2, 2)).toBe(1);
      expect(eta.get(3, 3)).toBe(1);
      expect(eta.get(0, 1)).toBe(0);
    });

    it('should create inverse Minkowski metric', () => {
      const etaInv = TensorFactory.inverseMinkowskiMetric();
      
      expect(etaInv.getIndexTypes()).toEqual([IndexType.CONTRAVARIANT, IndexType.CONTRAVARIANT]);
      expect(etaInv.get(0, 0)).toBe(-1);
      expect(etaInv.get(1, 1)).toBe(1);
    });

    it('should create Euclidean metric', () => {
      const g = TensorFactory.euclideanMetric(3);
      
      expect(g.get(0, 0)).toBe(1);
      expect(g.get(1, 1)).toBe(1);
      expect(g.get(2, 2)).toBe(1);
      expect(g.get(0, 1)).toBe(0);
    });

    it('should create vector from components', () => {
      const v = TensorFactory.vector([1, 2, 3, 4], true);
      
      expect(v.getRank()).toBe(1);
      expect(v.get(0)).toBe(1);
      expect(v.get(3)).toBe(4);
      expect(v.getIndexTypes()[0]).toBe(IndexType.CONTRAVARIANT);
    });

    it('should create tensor from matrix', () => {
      const t = TensorFactory.fromMatrix(
        [[1, 2], [3, 4]],
        [IndexType.COVARIANT, IndexType.CONTRAVARIANT]
      );
      
      expect(t.get(0, 0)).toBe(1);
      expect(t.get(0, 1)).toBe(2);
      expect(t.get(1, 0)).toBe(3);
      expect(t.get(1, 1)).toBe(4);
    });
  });

  describe('Index Raising/Lowering', () => {
    it('should raise index using inverse metric', () => {
      // Create covariant vector A_μ
      const A_cov = TensorFactory.vector([1, 2, 3, 4], false);
      
      // Inverse Minkowski metric η^μν
      const etaInv = TensorFactory.inverseMinkowskiMetric();
      
      // Raise index: A^μ = η^μν A_ν
      const A_contra = A_cov.raiseIndex(0, etaInv);
      
      expect(A_contra.getIndexTypes()[0]).toBe(IndexType.CONTRAVARIANT);
      // A^0 = η^00 A_0 = -1 * 1 = -1
      expect(A_contra.get(0)).toBe(-1);
      // A^1 = η^11 A_1 = 1 * 2 = 2
      expect(A_contra.get(1)).toBe(2);
    });

    it('should lower index using metric', () => {
      // Create contravariant vector A^μ
      const A_contra = TensorFactory.vector([1, 2, 3, 4], true);
      
      // Minkowski metric η_μν
      const eta = TensorFactory.minkowskiMetric();
      
      // Lower index: A_μ = η_μν A^ν
      const A_cov = A_contra.lowerIndex(0, eta);
      
      expect(A_cov.getIndexTypes()[0]).toBe(IndexType.COVARIANT);
      // A_0 = η_00 A^0 = -1 * 1 = -1
      expect(A_cov.get(0)).toBe(-1);
      // A_1 = η_11 A^1 = 1 * 2 = 2
      expect(A_cov.get(1)).toBe(2);
    });
  });

  describe('Coordinate Transformation', () => {
    it('should transform contravariant vector', () => {
      // Create a 2D vector
      const v = TensorFactory.vector([1, 0], true);
      
      // Rotation by 90 degrees
      const theta = Math.PI / 2;
      const jacobian = [
        [Math.cos(theta), -Math.sin(theta)],
        [Math.sin(theta), Math.cos(theta)]
      ];
      const invJacobian = [
        [Math.cos(theta), Math.sin(theta)],
        [-Math.sin(theta), Math.cos(theta)]
      ];
      
      const transformed = v.transform({ jacobian, inverseJacobian: invJacobian });
      
      // [1, 0] rotated 90° should give [0, 1]
      expect(Math.abs(transformed.get(0))).toBeLessThan(1e-10);
      expect(Math.abs(transformed.get(1) - 1)).toBeLessThan(1e-10);
    });
  });

  describe('Trace', () => {
    it('should compute trace of rank-2 tensor', () => {
      const tensor = new Tensor({
        rank: 2,
        dimensions: [3, 3],
        indexTypes: [IndexType.CONTRAVARIANT, IndexType.COVARIANT]
      }, [1, 0, 0, 0, 2, 0, 0, 0, 3]);
      
      expect(tensor.trace()).toBe(6); // 1 + 2 + 3
    });
  });

  describe('Utilities', () => {
    it('should clone tensor correctly', () => {
      const original = new Tensor({
        rank: 2,
        dimensions: [2, 2],
        indexTypes: [IndexType.COVARIANT, IndexType.COVARIANT]
      }, [1, 2, 3, 4]);
      
      const clone = original.clone();
      
      expect(clone.equals(original)).toBe(true);
      
      // Modify clone, original should be unchanged
      clone.set(99, 0, 0);
      expect(original.get(0, 0)).toBe(1);
    });

    it('should compare tensors for equality', () => {
      const t1 = new Tensor({
        rank: 2,
        dimensions: [2, 2],
        indexTypes: [IndexType.COVARIANT, IndexType.COVARIANT]
      }, [1, 2, 3, 4]);
      
      const t2 = new Tensor({
        rank: 2,
        dimensions: [2, 2],
        indexTypes: [IndexType.COVARIANT, IndexType.COVARIANT]
      }, [1, 2, 3, 4]);
      
      const t3 = new Tensor({
        rank: 2,
        dimensions: [2, 2],
        indexTypes: [IndexType.COVARIANT, IndexType.COVARIANT]
      }, [1, 2, 3, 5]);
      
      expect(t1.equals(t2)).toBe(true);
      expect(t1.equals(t3)).toBe(false);
    });

    it('should convert to string representation', () => {
      const tensor = new Tensor({
        rank: 2,
        dimensions: [4, 4],
        indexTypes: [IndexType.CONTRAVARIANT, IndexType.COVARIANT]
      });
      
      expect(tensor.toString()).toBe('Tensor(1,1)[4×4]');
    });

    it('should generate unique hash', () => {
      const t1 = new Tensor({
        rank: 2,
        dimensions: [2, 2],
        indexTypes: [IndexType.COVARIANT, IndexType.COVARIANT]
      }, [1, 2, 3, 4]);
      
      const hash = t1.getHash();
      expect(hash).toHaveLength(64);
    });

    it('should export to JSON', () => {
      const tensor = new Tensor({
        rank: 2,
        dimensions: [2, 2],
        indexTypes: [IndexType.COVARIANT, IndexType.COVARIANT]
      }, [1, 2, 3, 4]);
      
      const json = tensor.toJSON();
      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('rank', 2);
      expect(json).toHaveProperty('dimensions', [2, 2]);
      expect(json).toHaveProperty('components', [1, 2, 3, 4]);
      expect(json).toHaveProperty('hash');
    });
  });

  describe('Physics Applications', () => {
    it('should compute metric contraction for Minkowski spacetime', () => {
      const eta = TensorFactory.minkowskiMetric();
      const etaInv = TensorFactory.inverseMinkowskiMetric();
      
      // η_μρ η^ρν should give δ_μ^ν (Kronecker delta)
      // First create tensor product η_μρ ⊗ η^σν
      const product = eta.tensorProduct(etaInv);
      
      // Contract ρ and σ (indices 1 and 2)
      const contracted = product.tensor.contract(1, 2);
      
      // Should give Kronecker delta
      expect(Math.abs(contracted.get(0, 0) - 1)).toBeLessThan(1e-10);
      expect(Math.abs(contracted.get(1, 1) - 1)).toBeLessThan(1e-10);
      expect(Math.abs(contracted.get(0, 1))).toBeLessThan(1e-10);
    });

    it('should compute spacetime interval', () => {
      // ds² = η_μν dx^μ dx^ν for a timelike interval
      const eta = TensorFactory.minkowskiMetric();
      const dx = TensorFactory.vector([1, 0.5, 0, 0], true); // dt=1, dx=0.5, c=1
      
      // First lower the index: dx_μ = η_μν dx^ν
      const dx_lower = dx.lowerIndex(0, eta);
      
      // Then contract: ds² = dx_μ dx^μ
      const product = dx_lower.tensorProduct(dx);
      const ds_squared = product.tensor.contract(0, 1).getComponents()[0];
      
      // ds² = -1*1² + 1*0.5² = -1 + 0.25 = -0.75 (timelike)
      expect(Math.abs(ds_squared + 0.75)).toBeLessThan(1e-10);
    });
  });
});
