/**
 * Tensor.ts - PRD-03 Phase 3.1
 * Module ID: M03.01
 * 
 * Implements general tensor algebra for spacetime mathematics.
 * Supports arbitrary rank tensors with covariant/contravariant indices,
 * index contraction, tensor products, and coordinate transformations.
 * 
 * Dependencies:
 * - Logger (M01.01)
 * - BigNumber (M01.03)
 * - Matrix (M01.05)
 */

import { Logger, LogLevel } from '../../core/logger/Logger';
import { HashVerifier, HashChain, ProofType } from '../../core/logger/HashVerifier';

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Index type: covariant (lower) or contravariant (upper)
 */
export enum IndexType {
  COVARIANT = 'covariant',       // Lower index (subscript)
  CONTRAVARIANT = 'contravariant' // Upper index (superscript)
}

/**
 * Tensor index configuration
 */
export interface TensorIndex {
  position: number;      // Position of the index
  type: IndexType;       // Covariant or contravariant
  dimension: number;     // Range of the index (0 to dimension-1)
  label?: string;        // Optional label (μ, ν, etc.)
}

/**
 * Tensor configuration
 */
export interface TensorConfig {
  rank: number;                    // Total number of indices
  dimensions: number[];            // Dimension of each index
  indexTypes: IndexType[];         // Type of each index
  labels?: string[];               // Optional labels for indices
}

/**
 * Contraction specification
 */
export interface ContractionSpec {
  index1: number;  // First index to contract
  index2: number;  // Second index to contract
}

/**
 * Tensor product result
 */
export interface TensorProductResult {
  tensor: Tensor;
  hash: string;
}

/**
 * Coordinate transformation
 */
export interface CoordinateTransform {
  jacobian: number[][];           // Jacobian matrix ∂x'/∂x
  inverseJacobian: number[][];    // Inverse Jacobian ∂x/∂x'
}

// ============================================================================
// TENSOR CLASS
// ============================================================================

/**
 * General tensor class supporting arbitrary rank and index types.
 * 
 * A tensor T with indices (i,j,k,...) stores components T^{ij...}_{kl...}
 * where upper indices are contravariant and lower indices are covariant.
 */
export class Tensor {
  private rank: number;
  private dimensions: number[];
  private indexTypes: IndexType[];
  private labels: string[];
  private components: number[];
  private strides: number[];
  private logger: Logger;
  private hashChain: HashChain;
  private id: string;

  /**
   * Create a new tensor
   * @param config - Tensor configuration
   * @param components - Optional initial components (flat array in row-major order)
   */
  constructor(config: TensorConfig, components?: number[]) {
    this.id = `T-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.rank = config.rank;
    this.dimensions = [...config.dimensions];
    this.indexTypes = [...config.indexTypes];
    this.labels = config.labels ? [...config.labels] : this.generateDefaultLabels();

    // Validate configuration
    if (this.dimensions.length !== this.rank) {
      throw new Error(`Dimensions array length (${this.dimensions.length}) must equal rank (${this.rank})`);
    }
    if (this.indexTypes.length !== this.rank) {
      throw new Error(`IndexTypes array length (${this.indexTypes.length}) must equal rank (${this.rank})`);
    }

    // Calculate strides for flat array indexing
    this.strides = this.calculateStrides();

    // Calculate total size
    const totalSize = this.dimensions.reduce((a, b) => a * b, 1);

    // Initialize components
    if (components) {
      if (components.length !== totalSize) {
        throw new Error(`Components array length (${components.length}) must equal total size (${totalSize})`);
      }
      this.components = [...components];
    } else {
      this.components = new Array(totalSize).fill(0);
    }

    // Initialize logger
    Logger.resetInstance();
    this.logger = Logger.getInstance({
      minLevel: LogLevel.DEBUG,
      enableConsole: false,
      enableHashChain: true
    });
    this.hashChain = new HashChain(`tensor-${this.id}`);

    this.logger.debug('Tensor created', { rank: this.rank, dimensions: this.dimensions });
  }

  /**
   * Generate default Greek letter labels for indices
   */
  private generateDefaultLabels(): string[] {
    const greekLetters = ['μ', 'ν', 'ρ', 'σ', 'τ', 'λ', 'κ', 'α', 'β', 'γ'];
    return this.dimensions.map((_, i) => greekLetters[i % greekLetters.length]);
  }

  /**
   * Calculate strides for flat array indexing
   */
  private calculateStrides(): number[] {
    const strides: number[] = new Array(this.rank);
    let stride = 1;
    for (let i = this.rank - 1; i >= 0; i--) {
      strides[i] = stride;
      stride *= this.dimensions[i];
    }
    return strides;
  }

  /**
   * Convert multi-dimensional indices to flat array index
   */
  private indicesToFlat(indices: number[]): number {
    let flat = 0;
    for (let i = 0; i < this.rank; i++) {
      if (indices[i] < 0 || indices[i] >= this.dimensions[i]) {
        throw new Error(`Index ${indices[i]} out of bounds for dimension ${i} (max: ${this.dimensions[i] - 1})`);
      }
      flat += indices[i] * this.strides[i];
    }
    return flat;
  }

  /**
   * Convert flat array index to multi-dimensional indices
   */
  private flatToIndices(flat: number): number[] {
    const indices: number[] = new Array(this.rank);
    let remaining = flat;
    for (let i = 0; i < this.rank; i++) {
      indices[i] = Math.floor(remaining / this.strides[i]);
      remaining %= this.strides[i];
    }
    return indices;
  }

  // ============================================================================
  // ACCESSORS
  // ============================================================================

  /**
   * Get tensor component at given indices
   */
  get(...indices: number[]): number {
    if (indices.length !== this.rank) {
      throw new Error(`Expected ${this.rank} indices, got ${indices.length}`);
    }
    return this.components[this.indicesToFlat(indices)];
  }

  /**
   * Set tensor component at given indices
   */
  set(value: number, ...indices: number[]): void {
    if (indices.length !== this.rank) {
      throw new Error(`Expected ${this.rank} indices, got ${indices.length}`);
    }
    this.components[this.indicesToFlat(indices)] = value;
  }

  /**
   * Get all components as flat array
   */
  getComponents(): number[] {
    return [...this.components];
  }

  /**
   * Get tensor rank
   */
  getRank(): number {
    return this.rank;
  }

  /**
   * Get dimensions
   */
  getDimensions(): number[] {
    return [...this.dimensions];
  }

  /**
   * Get index types
   */
  getIndexTypes(): IndexType[] {
    return [...this.indexTypes];
  }

  /**
   * Get index labels
   */
  getLabels(): string[] {
    return [...this.labels];
  }

  /**
   * Get tensor ID
   */
  getId(): string {
    return this.id;
  }

  /**
   * Get number of covariant indices
   */
  getCovariantCount(): number {
    return this.indexTypes.filter(t => t === IndexType.COVARIANT).length;
  }

  /**
   * Get number of contravariant indices
   */
  getContravariantCount(): number {
    return this.indexTypes.filter(t => t === IndexType.CONTRAVARIANT).length;
  }

  /**
   * Get tensor type notation (p, q) where p = contravariant, q = covariant
   */
  getType(): [number, number] {
    return [this.getContravariantCount(), this.getCovariantCount()];
  }

  // ============================================================================
  // TENSOR OPERATIONS
  // ============================================================================

  /**
   * Add two tensors of the same type
   */
  add(other: Tensor): Tensor {
    this.validateSameStructure(other);
    
    const result = new Tensor({
      rank: this.rank,
      dimensions: this.dimensions,
      indexTypes: this.indexTypes,
      labels: this.labels
    });

    for (let i = 0; i < this.components.length; i++) {
      result.components[i] = this.components[i] + other.components[i];
    }

    this.logger.debug('Tensor addition', { rank: this.rank });
    return result;
  }

  /**
   * Subtract two tensors of the same type
   */
  subtract(other: Tensor): Tensor {
    this.validateSameStructure(other);
    
    const result = new Tensor({
      rank: this.rank,
      dimensions: this.dimensions,
      indexTypes: this.indexTypes,
      labels: this.labels
    });

    for (let i = 0; i < this.components.length; i++) {
      result.components[i] = this.components[i] - other.components[i];
    }

    this.logger.debug('Tensor subtraction', { rank: this.rank });
    return result;
  }

  /**
   * Multiply tensor by scalar
   */
  scale(scalar: number): Tensor {
    const result = new Tensor({
      rank: this.rank,
      dimensions: this.dimensions,
      indexTypes: this.indexTypes,
      labels: this.labels
    });

    for (let i = 0; i < this.components.length; i++) {
      result.components[i] = this.components[i] * scalar;
    }

    this.logger.debug('Tensor scaling', { scalar });
    return result;
  }

  /**
   * Tensor product (outer product) with another tensor
   */
  tensorProduct(other: Tensor): TensorProductResult {
    const newRank = this.rank + other.rank;
    const newDimensions = [...this.dimensions, ...other.dimensions];
    const newIndexTypes = [...this.indexTypes, ...other.indexTypes];
    const newLabels = [...this.labels, ...other.labels];

    const result = new Tensor({
      rank: newRank,
      dimensions: newDimensions,
      indexTypes: newIndexTypes,
      labels: newLabels
    });

    // Compute tensor product components
    for (let i = 0; i < this.components.length; i++) {
      for (let j = 0; j < other.components.length; j++) {
        result.components[i * other.components.length + j] = 
          this.components[i] * other.components[j];
      }
    }

    const hash = HashVerifier.hash(`tensorProduct:${this.id}:${other.id}:${Date.now()}`);
    this.hashChain.addRecord(ProofType.COMPUTATION, 'tensorProduct', hash);
    this.logger.debug('Tensor product', { newRank });

    return { tensor: result, hash };
  }

  /**
   * Contract tensor over two indices
   * For a tensor T^{...i...}_{...j...}, contraction over i and j gives
   * a tensor of rank (r-2) with components Σ_k T^{...k...}_{...k...}
   */
  contract(index1: number, index2: number): Tensor {
    if (index1 < 0 || index1 >= this.rank || index2 < 0 || index2 >= this.rank) {
      throw new Error('Contraction indices out of bounds');
    }
    if (index1 === index2) {
      throw new Error('Cannot contract an index with itself');
    }
    if (this.dimensions[index1] !== this.dimensions[index2]) {
      throw new Error('Contracted indices must have the same dimension');
    }
    if (this.indexTypes[index1] === this.indexTypes[index2]) {
      this.logger.warn('Contracting indices of the same type (non-standard)');
    }

    const contractDim = this.dimensions[index1];
    const newRank = this.rank - 2;
    
    // Build new dimensions and index types, removing contracted indices
    const newDimensions: number[] = [];
    const newIndexTypes: IndexType[] = [];
    const newLabels: string[] = [];
    
    for (let i = 0; i < this.rank; i++) {
      if (i !== index1 && i !== index2) {
        newDimensions.push(this.dimensions[i]);
        newIndexTypes.push(this.indexTypes[i]);
        newLabels.push(this.labels[i]);
      }
    }

    if (newRank === 0) {
      // Result is a scalar
      let sum = 0;
      for (let k = 0; k < contractDim; k++) {
        const indices = new Array(this.rank).fill(0);
        indices[index1] = k;
        indices[index2] = k;
        sum += this.get(...indices);
      }
      // Return rank-0 tensor (scalar)
      return new Tensor({ rank: 0, dimensions: [], indexTypes: [], labels: [] }, [sum]);
    }

    const result = new Tensor({
      rank: newRank,
      dimensions: newDimensions,
      indexTypes: newIndexTypes,
      labels: newLabels
    });

    // Iterate over all combinations of remaining indices
    const totalSize = newDimensions.reduce((a, b) => a * b, 1);
    for (let flat = 0; flat < totalSize; flat++) {
      const resultIndices = result.flatToIndices(flat);
      
      // Build full indices for original tensor, inserting contracted index
      let sum = 0;
      for (let k = 0; k < contractDim; k++) {
        const fullIndices: number[] = [];
        let resultIdx = 0;
        for (let i = 0; i < this.rank; i++) {
          if (i === index1 || i === index2) {
            fullIndices.push(k);
          } else {
            fullIndices.push(resultIndices[resultIdx++]);
          }
        }
        sum += this.get(...fullIndices);
      }
      result.components[flat] = sum;
    }

    this.logger.debug('Tensor contraction', { index1, index2, newRank });
    return result;
  }

  /**
   * Raise an index (convert covariant to contravariant using metric)
   */
  raiseIndex(index: number, metric: Tensor): Tensor {
    if (index < 0 || index >= this.rank) {
      throw new Error('Index out of bounds');
    }
    if (this.indexTypes[index] !== IndexType.COVARIANT) {
      throw new Error('Can only raise covariant indices');
    }
    if (metric.getRank() !== 2 || 
        metric.getIndexTypes()[0] !== IndexType.CONTRAVARIANT ||
        metric.getIndexTypes()[1] !== IndexType.CONTRAVARIANT) {
      throw new Error('Metric must be rank-2 contravariant tensor (inverse metric)');
    }

    const dim = this.dimensions[index];
    
    // Create new tensor with raised index
    const newIndexTypes = [...this.indexTypes];
    newIndexTypes[index] = IndexType.CONTRAVARIANT;
    
    const result = new Tensor({
      rank: this.rank,
      dimensions: this.dimensions,
      indexTypes: newIndexTypes,
      labels: this.labels
    });

    // Apply metric: T^{...μ...} = g^{μν} T_{...ν...}
    const totalSize = this.components.length;
    for (let flat = 0; flat < totalSize; flat++) {
      const indices = this.flatToIndices(flat);
      let sum = 0;
      for (let nu = 0; nu < dim; nu++) {
        const oldIndices = [...indices];
        oldIndices[index] = nu;
        sum += metric.get(indices[index], nu) * this.get(...oldIndices);
      }
      result.components[flat] = sum;
    }

    this.logger.debug('Index raised', { index });
    return result;
  }

  /**
   * Lower an index (convert contravariant to covariant using metric)
   */
  lowerIndex(index: number, metric: Tensor): Tensor {
    if (index < 0 || index >= this.rank) {
      throw new Error('Index out of bounds');
    }
    if (this.indexTypes[index] !== IndexType.CONTRAVARIANT) {
      throw new Error('Can only lower contravariant indices');
    }
    if (metric.getRank() !== 2 || 
        metric.getIndexTypes()[0] !== IndexType.COVARIANT ||
        metric.getIndexTypes()[1] !== IndexType.COVARIANT) {
      throw new Error('Metric must be rank-2 covariant tensor');
    }

    const dim = this.dimensions[index];
    
    // Create new tensor with lowered index
    const newIndexTypes = [...this.indexTypes];
    newIndexTypes[index] = IndexType.COVARIANT;
    
    const result = new Tensor({
      rank: this.rank,
      dimensions: this.dimensions,
      indexTypes: newIndexTypes,
      labels: this.labels
    });

    // Apply metric: T_{...μ...} = g_{μν} T^{...ν...}
    const totalSize = this.components.length;
    for (let flat = 0; flat < totalSize; flat++) {
      const indices = this.flatToIndices(flat);
      let sum = 0;
      for (let nu = 0; nu < dim; nu++) {
        const oldIndices = [...indices];
        oldIndices[index] = nu;
        sum += metric.get(indices[index], nu) * this.get(...oldIndices);
      }
      result.components[flat] = sum;
    }

    this.logger.debug('Index lowered', { index });
    return result;
  }

  /**
   * Transform tensor under coordinate transformation
   */
  transform(transformation: CoordinateTransform): Tensor {
    const jacobian = transformation.jacobian;
    const invJacobian = transformation.inverseJacobian;
    const dim = jacobian.length;

    // Validate dimensions
    for (const d of this.dimensions) {
      if (d !== dim) {
        throw new Error('Transformation dimension must match tensor dimensions');
      }
    }

    const result = new Tensor({
      rank: this.rank,
      dimensions: this.dimensions,
      indexTypes: this.indexTypes,
      labels: this.labels
    });

    // Transform each component
    // Contravariant indices transform with Jacobian: T'^μ = (∂x'^μ/∂x^ν) T^ν
    // Covariant indices transform with inverse Jacobian: T'_μ = (∂x^ν/∂x'^μ) T_ν
    
    const totalSize = this.components.length;
    for (let flat = 0; flat < totalSize; flat++) {
      const newIndices = this.flatToIndices(flat);
      let sum = 0;
      
      // Sum over all old index combinations
      for (let oldFlat = 0; oldFlat < totalSize; oldFlat++) {
        const oldIndices = this.flatToIndices(oldFlat);
        let coefficient = 1;
        
        for (let i = 0; i < this.rank; i++) {
          if (this.indexTypes[i] === IndexType.CONTRAVARIANT) {
            coefficient *= jacobian[newIndices[i]][oldIndices[i]];
          } else {
            coefficient *= invJacobian[oldIndices[i]][newIndices[i]];
          }
        }
        
        sum += coefficient * this.components[oldFlat];
      }
      
      result.components[flat] = sum;
    }

    this.logger.debug('Tensor transformed');
    return result;
  }

  /**
   * Symmetrize tensor over specified indices
   */
  symmetrize(index1: number, index2: number): Tensor {
    if (index1 < 0 || index1 >= this.rank || index2 < 0 || index2 >= this.rank) {
      throw new Error('Symmetrization indices out of bounds');
    }
    if (this.dimensions[index1] !== this.dimensions[index2]) {
      throw new Error('Symmetrized indices must have the same dimension');
    }
    if (this.indexTypes[index1] !== this.indexTypes[index2]) {
      throw new Error('Symmetrized indices must have the same type');
    }

    const result = new Tensor({
      rank: this.rank,
      dimensions: this.dimensions,
      indexTypes: this.indexTypes,
      labels: this.labels
    });

    const totalSize = this.components.length;
    for (let flat = 0; flat < totalSize; flat++) {
      const indices = this.flatToIndices(flat);
      const swappedIndices = [...indices];
      swappedIndices[index1] = indices[index2];
      swappedIndices[index2] = indices[index1];
      
      result.components[flat] = 0.5 * (
        this.get(...indices) + this.get(...swappedIndices)
      );
    }

    this.logger.debug('Tensor symmetrized', { index1, index2 });
    return result;
  }

  /**
   * Antisymmetrize tensor over specified indices
   */
  antisymmetrize(index1: number, index2: number): Tensor {
    if (index1 < 0 || index1 >= this.rank || index2 < 0 || index2 >= this.rank) {
      throw new Error('Antisymmetrization indices out of bounds');
    }
    if (this.dimensions[index1] !== this.dimensions[index2]) {
      throw new Error('Antisymmetrized indices must have the same dimension');
    }
    if (this.indexTypes[index1] !== this.indexTypes[index2]) {
      throw new Error('Antisymmetrized indices must have the same type');
    }

    const result = new Tensor({
      rank: this.rank,
      dimensions: this.dimensions,
      indexTypes: this.indexTypes,
      labels: this.labels
    });

    const totalSize = this.components.length;
    for (let flat = 0; flat < totalSize; flat++) {
      const indices = this.flatToIndices(flat);
      const swappedIndices = [...indices];
      swappedIndices[index1] = indices[index2];
      swappedIndices[index2] = indices[index1];
      
      result.components[flat] = 0.5 * (
        this.get(...indices) - this.get(...swappedIndices)
      );
    }

    this.logger.debug('Tensor antisymmetrized', { index1, index2 });
    return result;
  }

  /**
   * Compute trace (contraction of first and last index)
   */
  trace(): number {
    if (this.rank < 2) {
      throw new Error('Trace requires rank >= 2');
    }
    if (this.dimensions[0] !== this.dimensions[this.rank - 1]) {
      throw new Error('First and last dimensions must match for trace');
    }

    const contracted = this.contract(0, this.rank - 1);
    if (contracted.getRank() === 0) {
      return contracted.getComponents()[0];
    }
    
    // For higher rank tensors, return trace over first and last indices
    return contracted.getComponents().reduce((a, b) => a + b, 0);
  }

  /**
   * Check if tensor is symmetric in given indices
   */
  isSymmetric(index1: number, index2: number, tolerance: number = 1e-10): boolean {
    if (this.dimensions[index1] !== this.dimensions[index2]) {
      return false;
    }

    const totalSize = this.components.length;
    for (let flat = 0; flat < totalSize; flat++) {
      const indices = this.flatToIndices(flat);
      const swappedIndices = [...indices];
      swappedIndices[index1] = indices[index2];
      swappedIndices[index2] = indices[index1];
      
      if (Math.abs(this.get(...indices) - this.get(...swappedIndices)) > tolerance) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if tensor is antisymmetric in given indices
   */
  isAntisymmetric(index1: number, index2: number, tolerance: number = 1e-10): boolean {
    if (this.dimensions[index1] !== this.dimensions[index2]) {
      return false;
    }

    const totalSize = this.components.length;
    for (let flat = 0; flat < totalSize; flat++) {
      const indices = this.flatToIndices(flat);
      const swappedIndices = [...indices];
      swappedIndices[index1] = indices[index2];
      swappedIndices[index2] = indices[index1];
      
      if (Math.abs(this.get(...indices) + this.get(...swappedIndices)) > tolerance) {
        return false;
      }
    }
    return true;
  }

  // ============================================================================
  // VALIDATION & UTILITIES
  // ============================================================================

  /**
   * Validate that another tensor has the same structure
   */
  private validateSameStructure(other: Tensor): void {
    if (this.rank !== other.rank) {
      throw new Error(`Rank mismatch: ${this.rank} vs ${other.rank}`);
    }
    for (let i = 0; i < this.rank; i++) {
      if (this.dimensions[i] !== other.dimensions[i]) {
        throw new Error(`Dimension mismatch at index ${i}`);
      }
      if (this.indexTypes[i] !== other.indexTypes[i]) {
        throw new Error(`Index type mismatch at index ${i}`);
      }
    }
  }

  /**
   * Clone tensor
   */
  clone(): Tensor {
    return new Tensor({
      rank: this.rank,
      dimensions: this.dimensions,
      indexTypes: this.indexTypes,
      labels: this.labels
    }, this.components);
  }

  /**
   * Check equality with another tensor
   */
  equals(other: Tensor, tolerance: number = 1e-10): boolean {
    if (this.rank !== other.rank) return false;
    for (let i = 0; i < this.rank; i++) {
      if (this.dimensions[i] !== other.dimensions[i]) return false;
      if (this.indexTypes[i] !== other.indexTypes[i]) return false;
    }
    for (let i = 0; i < this.components.length; i++) {
      if (Math.abs(this.components[i] - other.components[i]) > tolerance) {
        return false;
      }
    }
    return true;
  }

  /**
   * Convert to string representation
   */
  toString(): string {
    const typeStr = this.getType();
    return `Tensor(${typeStr[0]},${typeStr[1]})[${this.dimensions.join('×')}]`;
  }

  /**
   * Get hash for verification
   */
  getHash(): string {
    return HashVerifier.hash(`tensor:${this.id}:${JSON.stringify(this.components)}`);
  }

  /**
   * Export to JSON
   */
  toJSON(): object {
    return {
      id: this.id,
      rank: this.rank,
      dimensions: this.dimensions,
      indexTypes: this.indexTypes,
      labels: this.labels,
      components: this.components,
      hash: this.getHash()
    };
  }
}

// ============================================================================
// TENSOR FACTORY
// ============================================================================

/**
 * Factory for creating common tensors
 */
export class TensorFactory {
  /**
   * Create zero tensor
   */
  static zero(dimensions: number[], indexTypes: IndexType[]): Tensor {
    return new Tensor({
      rank: dimensions.length,
      dimensions,
      indexTypes
    });
  }

  /**
   * Create Kronecker delta (identity tensor)
   */
  static kroneckerDelta(dim: number): Tensor {
    const delta = new Tensor({
      rank: 2,
      dimensions: [dim, dim],
      indexTypes: [IndexType.CONTRAVARIANT, IndexType.COVARIANT],
      labels: ['μ', 'ν']
    });

    for (let i = 0; i < dim; i++) {
      delta.set(1, i, i);
    }

    return delta;
  }

  /**
   * Create Levi-Civita symbol (totally antisymmetric tensor)
   */
  static leviCivita(dim: number): Tensor {
    const epsilon = new Tensor({
      rank: dim,
      dimensions: new Array(dim).fill(dim),
      indexTypes: new Array(dim).fill(IndexType.COVARIANT)
    });

    /**
     * Compute permutation sign using inversion count
     * Returns 0 if indices have duplicates, ±1 otherwise
     */
    const permutationSign = (indices: number[]): number => {
      // Check for duplicates
      const seen = new Set<number>();
      for (const idx of indices) {
        if (seen.has(idx)) return 0;
        seen.add(idx);
      }
      
      // Count inversions
      let inversions = 0;
      for (let i = 0; i < indices.length; i++) {
        for (let j = i + 1; j < indices.length; j++) {
          if (indices[i] > indices[j]) inversions++;
        }
      }
      return inversions % 2 === 0 ? 1 : -1;
    };

    // Iterate over all index combinations directly
    const totalSize = Math.pow(dim, dim);
    for (let flat = 0; flat < totalSize; flat++) {
      // Convert flat index to multi-indices
      const indices: number[] = [];
      let remaining = flat;
      for (let i = 0; i < dim; i++) {
        indices.push(remaining % dim);
        remaining = Math.floor(remaining / dim);
      }
      indices.reverse();
      
      epsilon.set(permutationSign(indices), ...indices);
    }

    return epsilon;
  }

  /**
   * Create metric tensor from matrix
   */
  static metricFromMatrix(matrix: number[][], covariant: boolean = true): Tensor {
    const dim = matrix.length;
    const indexType = covariant ? IndexType.COVARIANT : IndexType.CONTRAVARIANT;
    
    const metric = new Tensor({
      rank: 2,
      dimensions: [dim, dim],
      indexTypes: [indexType, indexType],
      labels: ['μ', 'ν']
    });

    for (let i = 0; i < dim; i++) {
      for (let j = 0; j < dim; j++) {
        metric.set(matrix[i][j], i, j);
      }
    }

    return metric;
  }

  /**
   * Create Minkowski metric η_μν = diag(-1, 1, 1, 1)
   */
  static minkowskiMetric(): Tensor {
    return TensorFactory.metricFromMatrix([
      [-1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1]
    ], true);
  }

  /**
   * Create inverse Minkowski metric η^μν = diag(-1, 1, 1, 1)
   */
  static inverseMinkowskiMetric(): Tensor {
    return TensorFactory.metricFromMatrix([
      [-1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1]
    ], false);
  }

  /**
   * Create Euclidean metric δ_ij = diag(1, 1, 1, ...)
   */
  static euclideanMetric(dim: number): Tensor {
    const matrix = Array.from({ length: dim }, (_, i) =>
      Array.from({ length: dim }, (_, j) => i === j ? 1 : 0)
    );
    return TensorFactory.metricFromMatrix(matrix, true);
  }

  /**
   * Create rank-1 tensor (vector) from components
   */
  static vector(components: number[], contravariant: boolean = true): Tensor {
    return new Tensor({
      rank: 1,
      dimensions: [components.length],
      indexTypes: [contravariant ? IndexType.CONTRAVARIANT : IndexType.COVARIANT]
    }, components);
  }

  /**
   * Create rank-2 tensor from matrix
   */
  static fromMatrix(matrix: number[][], type: [IndexType, IndexType]): Tensor {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const components: number[] = [];
    
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        components.push(matrix[i][j]);
      }
    }

    return new Tensor({
      rank: 2,
      dimensions: [rows, cols],
      indexTypes: type
    }, components);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// IndexType is re-exported with alias for clarity in imports
export { IndexType as TensorIndexType };
