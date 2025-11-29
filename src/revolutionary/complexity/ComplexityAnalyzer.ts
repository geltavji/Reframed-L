/**
 * Qlaws Ham - Complexity Analyzer Module (M06.01)
 * 
 * Analyzes computational complexity of algorithms and identifies
 * potential O(1) pathways using quantum, information-theoretic,
 * and emergent computation approaches.
 * 
 * @module ComplexityAnalyzer
 * @version 1.0.0
 * @dependencies Logger (M01.01), BigNumber (M01.03)
 */

import * as crypto from 'crypto';
import { Logger, LogLevel } from '../../core/logger/Logger';
import { BigNumber } from '../../core/math/BigNumber';

/**
 * Complexity classification thresholds
 * These constants control the boundaries for complexity class determination
 */
export const ComplexityThresholds = {
  /** Growth ratio threshold for O(1) classification - time doesn't grow significantly with input */
  O_1_THRESHOLD: 0.15,
  /** Upper bound for logarithmic growth ratio */
  LOG_N_THRESHOLD: 0.5,
  /** Linear growth ratio lower bound */
  LINEAR_LOWER: 0.85,
  /** Linear growth ratio upper bound */
  LINEAR_UPPER: 1.15,
  /** Linearithmic growth ratio upper bound */
  N_LOG_N_UPPER: 1.6,
  /** Quadratic growth ratio upper bound */
  QUADRATIC_UPPER: 3.5,
  /** Cubic growth ratio upper bound */
  CUBIC_UPPER: 10,
  /** Ratio multiplier for decreasing sequence check */
  DECREASING_TOLERANCE: 1.2
};

/**
 * Time complexity classes
 */
export enum TimeComplexityClass {
  O_1 = 'O(1)',
  O_LOG_N = 'O(log n)',
  O_N = 'O(n)',
  O_N_LOG_N = 'O(n log n)',
  O_N_2 = 'O(n²)',
  O_N_3 = 'O(n³)',
  O_2_N = 'O(2^n)',
  O_N_FACTORIAL = 'O(n!)',
  UNKNOWN = 'Unknown'
}

/**
 * Space complexity classes
 */
export enum SpaceComplexityClass {
  O_1 = 'O(1)',
  O_LOG_N = 'O(log n)',
  O_N = 'O(n)',
  O_N_2 = 'O(n²)',
  UNKNOWN = 'Unknown'
}

/**
 * Interface for complexity analysis result
 */
export interface ComplexityResult {
  timeComplexity: TimeComplexityClass;
  spaceComplexity: SpaceComplexityClass;
  estimatedTimeCoefficient: number;
  estimatedSpaceCoefficient: number;
  measurements: ComplexityMeasurement[];
  hash: string;
  timestamp: Date;
  confidence: number;
}

/**
 * Interface for a single complexity measurement
 */
export interface ComplexityMeasurement {
  inputSize: number;
  executionTime: number;  // in nanoseconds
  memoryUsed: number;     // in bytes
  operations: number;
}

/**
 * Interface for algorithm analysis
 */
export interface AlgorithmProfile {
  name: string;
  description: string;
  currentComplexity: TimeComplexityClass;
  theoreticalOptimal: TimeComplexityClass;
  potentialO1Pathway: boolean;
  pathwayDescription?: string;
  hash: string;
}

/**
 * Interface for O(1) pathway candidate
 */
export interface O1PathwayCandidate {
  id: string;
  mechanism: O1Mechanism;
  feasibilityScore: number;
  description: string;
  requirements: string[];
  limitations: string[];
  hash: string;
}

/**
 * Mechanisms that could enable O(1) computation
 */
export enum O1Mechanism {
  QUANTUM_PARALLELISM = 'Quantum Parallelism',
  ENTANGLEMENT_SHORTCUT = 'Entanglement Shortcut',
  HOLOGRAPHIC_COMPUTATION = 'Holographic Computation',
  PLANCK_SCALE_PROCESSING = 'Planck Scale Processing',
  INFORMATION_GEOMETRY = 'Information Geometry',
  PRECOMPUTATION_LOOKUP = 'Precomputation Lookup',
  EMERGENT_COMPUTATION = 'Emergent Computation'
}

/**
 * TimeComplexity class for measuring and analyzing time complexity
 */
export class TimeComplexity {
  private measurements: ComplexityMeasurement[] = [];
  private static logger: Logger | null = null;

  /**
   * Set logger for TimeComplexity
   */
  public static setLogger(logger: Logger): void {
    TimeComplexity.logger = logger;
  }

  /**
   * Add a measurement
   */
  public addMeasurement(measurement: ComplexityMeasurement): void {
    this.measurements.push(measurement);
  }

  /**
   * Get all measurements
   */
  public getMeasurements(): ComplexityMeasurement[] {
    return [...this.measurements];
  }

  /**
   * Classify complexity based on measurements
   */
  public classify(): TimeComplexityClass {
    if (this.measurements.length < 3) {
      return TimeComplexityClass.UNKNOWN;
    }

    // Sort by input size
    const sorted = [...this.measurements].sort((a, b) => a.inputSize - b.inputSize);
    
    // Analyze growth patterns
    const growthRatios = this.calculateGrowthRatios(sorted);
    
    return this.determineComplexityClass(growthRatios, sorted);
  }

  /**
   * Calculate growth ratios between consecutive measurements
   */
  private calculateGrowthRatios(measurements: ComplexityMeasurement[]): number[] {
    const ratios: number[] = [];
    for (let i = 1; i < measurements.length; i++) {
      const sizeRatio = measurements[i].inputSize / measurements[i-1].inputSize;
      const timeRatio = measurements[i].executionTime / measurements[i-1].executionTime;
      ratios.push(timeRatio / sizeRatio);
    }
    return ratios;
  }

  /**
   * Determine complexity class based on growth ratios
   */
  private determineComplexityClass(
    growthRatios: number[],
    measurements: ComplexityMeasurement[]
  ): TimeComplexityClass {
    const avgRatio = growthRatios.reduce((a, b) => a + b, 0) / growthRatios.length;
    
    // O(1): Constant time - ratio close to 0 (time doesn't grow with input)
    if (avgRatio <= ComplexityThresholds.O_1_THRESHOLD) {
      return TimeComplexityClass.O_1;
    }
    
    // O(log n): Logarithmic - ratio decreasing and small
    const isDecreasing = growthRatios.every((r, i) => 
      i === 0 || r <= growthRatios[i-1] * ComplexityThresholds.DECREASING_TOLERANCE
    );
    if (isDecreasing && avgRatio < ComplexityThresholds.LOG_N_THRESHOLD) {
      return TimeComplexityClass.O_LOG_N;
    }
    
    // O(n): Linear - ratio close to 1
    if (avgRatio >= ComplexityThresholds.LINEAR_LOWER && avgRatio <= ComplexityThresholds.LINEAR_UPPER) {
      return TimeComplexityClass.O_N;
    }
    
    // O(n log n): Linearithmic - ratio slightly above 1
    if (avgRatio > ComplexityThresholds.LINEAR_UPPER && avgRatio < ComplexityThresholds.N_LOG_N_UPPER) {
      return TimeComplexityClass.O_N_LOG_N;
    }
    
    // O(n²): Quadratic - ratio around 2
    if (avgRatio >= ComplexityThresholds.N_LOG_N_UPPER && avgRatio < ComplexityThresholds.QUADRATIC_UPPER) {
      return TimeComplexityClass.O_N_2;
    }
    
    // O(n³): Cubic - ratio around 3
    if (avgRatio >= ComplexityThresholds.QUADRATIC_UPPER && avgRatio < ComplexityThresholds.CUBIC_UPPER) {
      return TimeComplexityClass.O_N_3;
    }
    
    // O(2^n): Exponential - ratio growing rapidly
    if (avgRatio >= ComplexityThresholds.CUBIC_UPPER) {
      return TimeComplexityClass.O_2_N;
    }
    
    return TimeComplexityClass.UNKNOWN;
  }

  /**
   * Estimate coefficient for the complexity function
   */
  public estimateCoefficient(): number {
    if (this.measurements.length === 0) return 0;
    
    const complexityClass = this.classify();
    const sorted = [...this.measurements].sort((a, b) => a.inputSize - b.inputSize);
    const last = sorted[sorted.length - 1];
    
    switch (complexityClass) {
      case TimeComplexityClass.O_1:
        return last.executionTime;
      case TimeComplexityClass.O_LOG_N:
        return last.executionTime / Math.log2(last.inputSize);
      case TimeComplexityClass.O_N:
        return last.executionTime / last.inputSize;
      case TimeComplexityClass.O_N_LOG_N:
        return last.executionTime / (last.inputSize * Math.log2(last.inputSize));
      case TimeComplexityClass.O_N_2:
        return last.executionTime / (last.inputSize * last.inputSize);
      default:
        return last.executionTime / last.inputSize;
    }
  }

  /**
   * Clear measurements
   */
  public clear(): void {
    this.measurements = [];
  }

  /**
   * Generate hash for current state
   */
  public getHash(): string {
    const data = JSON.stringify(this.measurements);
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

/**
 * SpaceComplexity class for measuring and analyzing space complexity
 */
export class SpaceComplexity {
  private measurements: ComplexityMeasurement[] = [];

  /**
   * Add a measurement
   */
  public addMeasurement(measurement: ComplexityMeasurement): void {
    this.measurements.push(measurement);
  }

  /**
   * Get all measurements
   */
  public getMeasurements(): ComplexityMeasurement[] {
    return [...this.measurements];
  }

  /**
   * Classify space complexity based on measurements
   */
  public classify(): SpaceComplexityClass {
    if (this.measurements.length < 3) {
      return SpaceComplexityClass.UNKNOWN;
    }

    const sorted = [...this.measurements].sort((a, b) => a.inputSize - b.inputSize);
    const growthRatios = this.calculateGrowthRatios(sorted);
    
    return this.determineComplexityClass(growthRatios);
  }

  /**
   * Calculate growth ratios for space
   */
  private calculateGrowthRatios(measurements: ComplexityMeasurement[]): number[] {
    const ratios: number[] = [];
    for (let i = 1; i < measurements.length; i++) {
      const sizeRatio = measurements[i].inputSize / measurements[i-1].inputSize;
      const memoryRatio = measurements[i].memoryUsed / measurements[i-1].memoryUsed;
      ratios.push(memoryRatio / sizeRatio);
    }
    return ratios;
  }

  /**
   * Determine space complexity class
   */
  private determineComplexityClass(growthRatios: number[]): SpaceComplexityClass {
    const avgRatio = growthRatios.reduce((a, b) => a + b, 0) / growthRatios.length;
    
    if (avgRatio <= 0.15) {
      return SpaceComplexityClass.O_1;
    }
    if (avgRatio < 0.5) {
      return SpaceComplexityClass.O_LOG_N;
    }
    if (avgRatio >= 0.9 && avgRatio <= 1.1) {
      return SpaceComplexityClass.O_N;
    }
    if (avgRatio > 1.5) {
      return SpaceComplexityClass.O_N_2;
    }
    
    return SpaceComplexityClass.UNKNOWN;
  }

  /**
   * Estimate coefficient for space complexity
   */
  public estimateCoefficient(): number {
    if (this.measurements.length === 0) return 0;
    
    const last = this.measurements[this.measurements.length - 1];
    return last.memoryUsed / last.inputSize;
  }

  /**
   * Clear measurements
   */
  public clear(): void {
    this.measurements = [];
  }

  /**
   * Generate hash for current state
   */
  public getHash(): string {
    const data = JSON.stringify(this.measurements);
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

/**
 * ComplexityAnalyzer - Main class for analyzing algorithm complexity
 * and identifying potential O(1) pathways
 */
export class ComplexityAnalyzer {
  private static logger: Logger | null = null;
  private algorithmProfiles: Map<string, AlgorithmProfile> = new Map();
  private o1Candidates: O1PathwayCandidate[] = [];
  private analysisHistory: ComplexityResult[] = [];

  /**
   * Set logger for ComplexityAnalyzer
   */
  public static setLogger(logger: Logger): void {
    ComplexityAnalyzer.logger = logger;
    TimeComplexity.setLogger(logger);
  }

  /**
   * Get logger instance
   */
  private log(level: LogLevel, message: string, data?: unknown): void {
    if (ComplexityAnalyzer.logger) {
      ComplexityAnalyzer.logger.log(level, `[ComplexityAnalyzer] ${message}`, data);
    }
  }

  /**
   * Analyze an algorithm's complexity
   */
  public analyze(
    algorithmName: string,
    measurements: ComplexityMeasurement[]
  ): ComplexityResult {
    this.log(LogLevel.DEBUG, `Analyzing algorithm: ${algorithmName}`, { measurementCount: measurements.length });

    const timeComplexity = new TimeComplexity();
    const spaceComplexity = new SpaceComplexity();

    for (const m of measurements) {
      timeComplexity.addMeasurement(m);
      spaceComplexity.addMeasurement(m);
    }

    const result: ComplexityResult = {
      timeComplexity: timeComplexity.classify(),
      spaceComplexity: spaceComplexity.classify(),
      estimatedTimeCoefficient: timeComplexity.estimateCoefficient(),
      estimatedSpaceCoefficient: spaceComplexity.estimateCoefficient(),
      measurements: [...measurements],
      timestamp: new Date(),
      confidence: this.calculateConfidence(measurements),
      hash: ''
    };

    result.hash = this.generateResultHash(result);
    this.analysisHistory.push(result);

    this.log(LogLevel.INFO, `Analysis complete for ${algorithmName}`, {
      timeComplexity: result.timeComplexity,
      spaceComplexity: result.spaceComplexity,
      confidence: result.confidence
    });

    return result;
  }

  /**
   * Calculate confidence score for analysis
   */
  private calculateConfidence(measurements: ComplexityMeasurement[]): number {
    if (measurements.length < 3) return 0.1;
    if (measurements.length < 5) return 0.5;
    if (measurements.length < 10) return 0.7;
    return 0.9;
  }

  /**
   * Generate hash for complexity result
   */
  private generateResultHash(result: Omit<ComplexityResult, 'hash'>): string {
    const data = JSON.stringify({
      timeComplexity: result.timeComplexity,
      spaceComplexity: result.spaceComplexity,
      timestamp: result.timestamp.toISOString(),
      measurements: result.measurements
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Profile an algorithm for O(1) potential
   */
  public profileAlgorithm(
    name: string,
    description: string,
    currentComplexity: TimeComplexityClass
  ): AlgorithmProfile {
    this.log(LogLevel.DEBUG, `Profiling algorithm: ${name}`);

    const theoreticalOptimal = this.determineTheoreticalOptimal(name, currentComplexity);
    const potentialO1Pathway = this.assessO1Potential(name, currentComplexity);
    
    const profile: AlgorithmProfile = {
      name,
      description,
      currentComplexity,
      theoreticalOptimal,
      potentialO1Pathway,
      pathwayDescription: potentialO1Pathway ? this.generatePathwayDescription(name) : undefined,
      hash: ''
    };

    profile.hash = this.generateProfileHash(profile);
    this.algorithmProfiles.set(name, profile);

    this.log(LogLevel.INFO, `Algorithm profiled: ${name}`, { potentialO1Pathway });

    return profile;
  }

  /**
   * Determine theoretical optimal complexity for known algorithms
   */
  private determineTheoreticalOptimal(
    name: string,
    current: TimeComplexityClass
  ): TimeComplexityClass {
    const lowerName = name.toLowerCase();
    
    // Known theoretical limits
    // Check for binary search first since it might contain "sorted"
    if (lowerName.includes('search') && lowerName.includes('sorted')) {
      return TimeComplexityClass.O_LOG_N; // Binary search lower bound
    }
    // Check for sorting algorithms (avoid matching "sorted" which is for binary search)
    if ((lowerName.includes('sort') && !lowerName.includes('sorted')) && 
        !lowerName.includes('count') && !lowerName.includes('radix')) {
      return TimeComplexityClass.O_N_LOG_N; // Comparison-based sorting lower bound
    }
    if (lowerName.includes('hash') || lowerName.includes('lookup')) {
      return TimeComplexityClass.O_1; // Hash table lookup
    }
    
    return current; // Default to current if no known optimal
  }

  /**
   * Assess potential for O(1) transformation
   */
  private assessO1Potential(
    name: string,
    current: TimeComplexityClass
  ): boolean {
    // Algorithms that already have known O(1) solutions don't need assessment
    if (current === TimeComplexityClass.O_1) return false;

    const lowerName = name.toLowerCase();
    
    // Algorithms with potential quantum speedup to O(1)-like behavior
    const quantumSpeedupCandidates = [
      'database search', 'unstructured search', 'oracle',
      'period finding', 'hidden subgroup'
    ];
    
    // Algorithms with potential holographic computation
    const holographicCandidates = [
      'graph isomorphism', 'traveling salesman', 'np-complete'
    ];
    
    // Algorithms with potential precomputation strategies
    const precomputationCandidates = [
      'polynomial evaluation', 'matrix multiplication', 'convolution'
    ];
    
    for (const candidate of [...quantumSpeedupCandidates, ...holographicCandidates, ...precomputationCandidates]) {
      if (lowerName.includes(candidate)) {
        return true;
      }
    }
    
    // General assessment: Any algorithm with complexity worse than O(n) might have O(1) potential
    // through advanced techniques. Exclude O(log n) as it's already near-optimal and UNKNOWN as
    // we can't assess it.
    const excludedClasses = [
      TimeComplexityClass.O_LOG_N,
      TimeComplexityClass.UNKNOWN
    ];
    
    return !excludedClasses.includes(current);
  }

  /**
   * Generate pathway description for O(1) potential
   */
  private generatePathwayDescription(name: string): string {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('search')) {
      return 'Potential O(1) via Grover\'s algorithm providing quadratic speedup, ' +
             'or quantum oracle exploitation for specific search structures.';
    }
    if (lowerName.includes('sort')) {
      return 'Potential O(1) via quantum sorting networks or ' +
             'information-theoretic entropy reduction techniques.';
    }
    if (lowerName.includes('graph')) {
      return 'Potential O(1) via holographic computation mapping ' +
             'graph structure to spacetime geometry.';
    }
    
    return 'Potential O(1) via quantum parallelism, entanglement shortcuts, ' +
           'or emergent computation from physical processes.';
  }

  /**
   * Generate hash for algorithm profile
   */
  private generateProfileHash(profile: Omit<AlgorithmProfile, 'hash'>): string {
    const data = JSON.stringify({
      name: profile.name,
      currentComplexity: profile.currentComplexity,
      theoreticalOptimal: profile.theoreticalOptimal,
      potentialO1Pathway: profile.potentialO1Pathway
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Identify O(1) pathway candidates
   */
  public identifyO1Pathways(): O1PathwayCandidate[] {
    this.log(LogLevel.DEBUG, 'Identifying O(1) pathways');

    this.o1Candidates = [];

    // Quantum Parallelism Pathway
    this.o1Candidates.push(this.createPathwayCandidate(
      O1Mechanism.QUANTUM_PARALLELISM,
      0.7,
      'Exploit quantum superposition to evaluate all possibilities simultaneously. ' +
      'Grover\'s algorithm achieves O(√n) which approaches O(1) for finite problem sizes.',
      [
        'Quantum computer with sufficient qubits',
        'Problem must be expressible as quantum oracle',
        'Coherence time must exceed computation time'
      ],
      [
        'Measurement collapses superposition',
        'Error correction overhead',
        'Not all problems are amenable'
      ]
    ));

    // Entanglement Shortcut Pathway
    this.o1Candidates.push(this.createPathwayCandidate(
      O1Mechanism.ENTANGLEMENT_SHORTCUT,
      0.5,
      'Use quantum entanglement to create correlations that bypass classical computation. ' +
      'Bell pairs could enable instant state correlation independent of input size.',
      [
        'Entangled qubit pairs',
        'No-cloning theorem considerations',
        'Decoherence protection'
      ],
      [
        'Cannot transmit classical information faster than light',
        'Entanglement is consumed on measurement',
        'Requires prior entanglement distribution'
      ]
    ));

    // Holographic Computation Pathway
    this.o1Candidates.push(this.createPathwayCandidate(
      O1Mechanism.HOLOGRAPHIC_COMPUTATION,
      0.4,
      'Map computation to boundary of spacetime region using AdS/CFT correspondence. ' +
      'Bulk complexity may map to boundary operations with different scaling.',
      [
        'Problem mapping to AdS geometry',
        'Understanding of holographic dictionary',
        'Control over boundary degrees of freedom'
      ],
      [
        'Theoretical framework not fully established',
        'Physical realization challenging',
        'Mapping may introduce overhead'
      ]
    ));

    // Planck Scale Processing Pathway
    this.o1Candidates.push(this.createPathwayCandidate(
      O1Mechanism.PLANCK_SCALE_PROCESSING,
      0.3,
      'Utilize maximum information density at Planck scale. ' +
      'Lloyd\'s limit suggests ultimate computational capacity proportional to energy.',
      [
        'Control at Planck scale',
        'Energy-efficient encoding',
        'Bekenstein bound considerations'
      ],
      [
        'Technology far beyond current capabilities',
        'Quantum gravity effects unknown',
        'Thermodynamic constraints'
      ]
    ));

    // Information Geometry Pathway
    this.o1Candidates.push(this.createPathwayCandidate(
      O1Mechanism.INFORMATION_GEOMETRY,
      0.6,
      'Map computational problems to geometric spaces where solutions are geodesics. ' +
      'Finding shortest paths in information space could be O(1) with proper embedding.',
      [
        'Riemannian manifold representation',
        'Efficient geodesic computation',
        'Problem-specific metric'
      ],
      [
        'Finding correct metric is problem-dependent',
        'Embedding may not preserve complexity',
        'Numeric precision requirements'
      ]
    ));

    // Precomputation Lookup Pathway
    this.o1Candidates.push(this.createPathwayCandidate(
      O1Mechanism.PRECOMPUTATION_LOOKUP,
      0.9,
      'Precompute all possible results and store for O(1) lookup. ' +
      'Trade space for time using hash tables or memory-mapped structures.',
      [
        'Sufficient storage capacity',
        'Problem with bounded input space',
        'One-time precomputation cost acceptable'
      ],
      [
        'Exponential space for large input domains',
        'Update cost if problem changes',
        'Memory access may dominate'
      ]
    ));

    // Emergent Computation Pathway
    this.o1Candidates.push(this.createPathwayCandidate(
      O1Mechanism.EMERGENT_COMPUTATION,
      0.4,
      'Utilize physical systems where computation emerges from natural dynamics. ' +
      'Physical processes may solve optimization problems in constant time.',
      [
        'Appropriate physical system',
        'Problem-physics correspondence',
        'Reliable readout mechanism'
      ],
      [
        'Limited problem types',
        'Noise and error sensitivity',
        'Scaling to large problems uncertain'
      ]
    ));

    this.log(LogLevel.INFO, `Identified ${this.o1Candidates.length} O(1) pathways`);

    return [...this.o1Candidates];
  }

  /**
   * Create an O(1) pathway candidate
   */
  private createPathwayCandidate(
    mechanism: O1Mechanism,
    feasibilityScore: number,
    description: string,
    requirements: string[],
    limitations: string[]
  ): O1PathwayCandidate {
    const candidate: O1PathwayCandidate = {
      id: `O1-${mechanism.replace(/\s+/g, '-')}-${Date.now()}`,
      mechanism,
      feasibilityScore,
      description,
      requirements,
      limitations,
      hash: ''
    };

    candidate.hash = this.generateCandidateHash(candidate);
    return candidate;
  }

  /**
   * Generate hash for pathway candidate
   */
  private generateCandidateHash(candidate: Omit<O1PathwayCandidate, 'hash'>): string {
    const data = JSON.stringify({
      id: candidate.id,
      mechanism: candidate.mechanism,
      feasibilityScore: candidate.feasibilityScore
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Benchmark an algorithm with various input sizes
   */
  public benchmark<T, R>(
    algorithmName: string,
    algorithm: (input: T) => R,
    inputGenerator: (size: number) => T,
    sizes: number[]
  ): ComplexityResult {
    this.log(LogLevel.DEBUG, `Benchmarking algorithm: ${algorithmName}`, { sizes });

    const measurements: ComplexityMeasurement[] = [];

    for (const size of sizes) {
      const input = inputGenerator(size);
      
      // Warm-up run
      algorithm(input);

      // Measure execution time
      const startTime = process.hrtime.bigint();
      algorithm(input);
      const endTime = process.hrtime.bigint();

      const executionTime = Number(endTime - startTime);
      
      // Estimate memory (rough approximation)
      const memoryUsed = this.estimateMemoryUsage(size);

      measurements.push({
        inputSize: size,
        executionTime,
        memoryUsed,
        operations: this.estimateOperations(size, algorithm)
      });
    }

    return this.analyze(algorithmName, measurements);
  }

  /**
   * Estimate memory usage based on input size
   */
  private estimateMemoryUsage(size: number): number {
    // Simple estimation: 8 bytes per element (typical for numbers)
    return size * 8;
  }

  /**
   * Estimate number of operations based on empirical execution time
   */
  private estimateOperations<T, R>(size: number, algorithm: (input: T) => R): number {
    // Estimate operations from execution time patterns
    // For typical algorithms, operations correlate with time complexity
    // This provides a rough estimate based on input size
    
    // Use a calibration factor based on typical CPU speeds
    // Assume ~1 billion simple operations per second as baseline
    const calibrationFactor = 1e9;
    
    // The operation count scales with the complexity class
    // For now, use linear estimation as baseline
    // More sophisticated analysis would track actual instruction counts
    return Math.floor(size * Math.log2(size + 1));
  }

  /**
   * Compare two complexity results
   */
  public compare(result1: ComplexityResult, result2: ComplexityResult): {
    timeDifference: string;
    spaceDifference: string;
    overallImprovement: boolean;
  } {
    const complexityOrder = [
      TimeComplexityClass.O_1,
      TimeComplexityClass.O_LOG_N,
      TimeComplexityClass.O_N,
      TimeComplexityClass.O_N_LOG_N,
      TimeComplexityClass.O_N_2,
      TimeComplexityClass.O_N_3,
      TimeComplexityClass.O_2_N,
      TimeComplexityClass.O_N_FACTORIAL
    ];

    const time1Index = complexityOrder.indexOf(result1.timeComplexity);
    const time2Index = complexityOrder.indexOf(result2.timeComplexity);
    const space1Index = complexityOrder.indexOf(result1.spaceComplexity as any);
    const space2Index = complexityOrder.indexOf(result2.spaceComplexity as any);

    return {
      timeDifference: time1Index < time2Index ? 'Result 1 is faster' :
                      time1Index > time2Index ? 'Result 2 is faster' : 'Same time complexity',
      spaceDifference: space1Index < space2Index ? 'Result 1 uses less space' :
                       space1Index > space2Index ? 'Result 2 uses less space' : 'Same space complexity',
      overallImprovement: time1Index < time2Index || space1Index < space2Index
    };
  }

  /**
   * Get algorithm profile
   */
  public getProfile(name: string): AlgorithmProfile | undefined {
    return this.algorithmProfiles.get(name);
  }

  /**
   * Get all algorithm profiles
   */
  public getAllProfiles(): AlgorithmProfile[] {
    return Array.from(this.algorithmProfiles.values());
  }

  /**
   * Get O(1) candidates
   */
  public getO1Candidates(): O1PathwayCandidate[] {
    return [...this.o1Candidates];
  }

  /**
   * Get O(1) candidates by mechanism
   */
  public getO1CandidatesByMechanism(mechanism: O1Mechanism): O1PathwayCandidate[] {
    return this.o1Candidates.filter(c => c.mechanism === mechanism);
  }

  /**
   * Get analysis history
   */
  public getAnalysisHistory(): ComplexityResult[] {
    return [...this.analysisHistory];
  }

  /**
   * Clear all data
   */
  public clear(): void {
    this.algorithmProfiles.clear();
    this.o1Candidates = [];
    this.analysisHistory = [];
  }

  /**
   * Export to JSON
   */
  public exportToJson(): string {
    return JSON.stringify({
      profiles: Array.from(this.algorithmProfiles.entries()),
      o1Candidates: this.o1Candidates,
      analysisHistory: this.analysisHistory,
      exportTimestamp: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Get statistics
   */
  public getStatistics(): {
    totalProfiles: number;
    totalO1Candidates: number;
    totalAnalyses: number;
    profilesWithO1Potential: number;
    averageFeasibility: number;
  } {
    const profilesWithO1 = Array.from(this.algorithmProfiles.values())
      .filter(p => p.potentialO1Pathway).length;
    
    const avgFeasibility = this.o1Candidates.length > 0
      ? this.o1Candidates.reduce((sum, c) => sum + c.feasibilityScore, 0) / this.o1Candidates.length
      : 0;

    return {
      totalProfiles: this.algorithmProfiles.size,
      totalO1Candidates: this.o1Candidates.length,
      totalAnalyses: this.analysisHistory.length,
      profilesWithO1Potential: profilesWithO1,
      averageFeasibility: avgFeasibility
    };
  }

  /**
   * Generate proof chain hash for all analyses
   */
  public getProofChainHash(): string {
    const data = JSON.stringify({
      profiles: Array.from(this.algorithmProfiles.values()).map(p => p.hash),
      candidates: this.o1Candidates.map(c => c.hash),
      history: this.analysisHistory.map(h => h.hash)
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

/**
 * Factory for creating ComplexityAnalyzer instances
 */
export class ComplexityAnalyzerFactory {
  /**
   * Create a new analyzer with logger
   */
  public static create(logger?: Logger): ComplexityAnalyzer {
    if (logger) {
      ComplexityAnalyzer.setLogger(logger);
    }
    return new ComplexityAnalyzer();
  }

  /**
   * Create with all O(1) pathways pre-identified
   */
  public static createWithPathways(logger?: Logger): ComplexityAnalyzer {
    const analyzer = ComplexityAnalyzerFactory.create(logger);
    analyzer.identifyO1Pathways();
    return analyzer;
  }
}
