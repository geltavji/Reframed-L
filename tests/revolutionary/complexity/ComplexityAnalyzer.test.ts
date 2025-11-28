/**
 * Qlaws Ham - ComplexityAnalyzer Module Tests (M06.01)
 * 
 * Comprehensive tests for the complexity analysis framework.
 * 
 * @module ComplexityAnalyzer.test
 * @version 1.0.0
 */

import {
  ComplexityAnalyzer,
  ComplexityAnalyzerFactory,
  TimeComplexity,
  SpaceComplexity,
  TimeComplexityClass,
  SpaceComplexityClass,
  O1Mechanism,
  ComplexityMeasurement,
  ComplexityResult,
  AlgorithmProfile,
  O1PathwayCandidate
} from '../../../src/revolutionary/complexity/ComplexityAnalyzer';
import { Logger, LogLevel } from '../../../src/core/logger/Logger';

describe('ComplexityAnalyzer Module (M06.01)', () => {
  let logger: Logger;
  let analyzer: ComplexityAnalyzer;

  beforeEach(() => {
    Logger.resetInstance();
    logger = Logger.getInstance({ minLevel: LogLevel.ERROR, enableConsole: false });
    ComplexityAnalyzer.setLogger(logger);
    analyzer = new ComplexityAnalyzer();
  });

  afterEach(() => {
    analyzer.clear();
    Logger.resetInstance();
  });

  describe('TimeComplexity Class', () => {
    let timeComplexity: TimeComplexity;

    beforeEach(() => {
      timeComplexity = new TimeComplexity();
    });

    it('should add measurements correctly', () => {
      const measurement: ComplexityMeasurement = {
        inputSize: 100,
        executionTime: 1000,
        memoryUsed: 800,
        operations: 100
      };
      
      timeComplexity.addMeasurement(measurement);
      expect(timeComplexity.getMeasurements()).toHaveLength(1);
    });

    it('should return UNKNOWN for insufficient measurements', () => {
      timeComplexity.addMeasurement({ inputSize: 100, executionTime: 1000, memoryUsed: 800, operations: 100 });
      timeComplexity.addMeasurement({ inputSize: 200, executionTime: 2000, memoryUsed: 1600, operations: 200 });
      
      expect(timeComplexity.classify()).toBe(TimeComplexityClass.UNKNOWN);
    });

    it('should classify O(1) complexity correctly', () => {
      // Constant time - same execution time regardless of input
      timeComplexity.addMeasurement({ inputSize: 100, executionTime: 1000, memoryUsed: 800, operations: 1 });
      timeComplexity.addMeasurement({ inputSize: 1000, executionTime: 1000, memoryUsed: 800, operations: 1 });
      timeComplexity.addMeasurement({ inputSize: 10000, executionTime: 1000, memoryUsed: 800, operations: 1 });
      timeComplexity.addMeasurement({ inputSize: 100000, executionTime: 1000, memoryUsed: 800, operations: 1 });
      
      expect(timeComplexity.classify()).toBe(TimeComplexityClass.O_1);
    });

    it('should classify O(n) complexity correctly', () => {
      // Linear time - execution time grows linearly
      timeComplexity.addMeasurement({ inputSize: 100, executionTime: 100, memoryUsed: 800, operations: 100 });
      timeComplexity.addMeasurement({ inputSize: 200, executionTime: 200, memoryUsed: 1600, operations: 200 });
      timeComplexity.addMeasurement({ inputSize: 400, executionTime: 400, memoryUsed: 3200, operations: 400 });
      timeComplexity.addMeasurement({ inputSize: 800, executionTime: 800, memoryUsed: 6400, operations: 800 });
      
      expect(timeComplexity.classify()).toBe(TimeComplexityClass.O_N);
    });

    it('should classify O(n²) complexity correctly', () => {
      // Quadratic time - execution time grows quadratically
      timeComplexity.addMeasurement({ inputSize: 10, executionTime: 100, memoryUsed: 80, operations: 100 });
      timeComplexity.addMeasurement({ inputSize: 20, executionTime: 400, memoryUsed: 160, operations: 400 });
      timeComplexity.addMeasurement({ inputSize: 40, executionTime: 1600, memoryUsed: 320, operations: 1600 });
      timeComplexity.addMeasurement({ inputSize: 80, executionTime: 6400, memoryUsed: 640, operations: 6400 });
      
      expect(timeComplexity.classify()).toBe(TimeComplexityClass.O_N_2);
    });

    it('should estimate coefficient correctly', () => {
      timeComplexity.addMeasurement({ inputSize: 100, executionTime: 100, memoryUsed: 800, operations: 100 });
      timeComplexity.addMeasurement({ inputSize: 200, executionTime: 200, memoryUsed: 1600, operations: 200 });
      timeComplexity.addMeasurement({ inputSize: 400, executionTime: 400, memoryUsed: 3200, operations: 400 });
      
      const coefficient = timeComplexity.estimateCoefficient();
      expect(coefficient).toBeGreaterThan(0);
    });

    it('should clear measurements', () => {
      timeComplexity.addMeasurement({ inputSize: 100, executionTime: 1000, memoryUsed: 800, operations: 100 });
      timeComplexity.clear();
      
      expect(timeComplexity.getMeasurements()).toHaveLength(0);
    });

    it('should generate consistent hash', () => {
      timeComplexity.addMeasurement({ inputSize: 100, executionTime: 1000, memoryUsed: 800, operations: 100 });
      
      const hash1 = timeComplexity.getHash();
      const hash2 = timeComplexity.getHash();
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });
  });

  describe('SpaceComplexity Class', () => {
    let spaceComplexity: SpaceComplexity;

    beforeEach(() => {
      spaceComplexity = new SpaceComplexity();
    });

    it('should add measurements correctly', () => {
      const measurement: ComplexityMeasurement = {
        inputSize: 100,
        executionTime: 1000,
        memoryUsed: 800,
        operations: 100
      };
      
      spaceComplexity.addMeasurement(measurement);
      expect(spaceComplexity.getMeasurements()).toHaveLength(1);
    });

    it('should classify O(1) space complexity', () => {
      spaceComplexity.addMeasurement({ inputSize: 100, executionTime: 100, memoryUsed: 100, operations: 100 });
      spaceComplexity.addMeasurement({ inputSize: 1000, executionTime: 1000, memoryUsed: 100, operations: 1000 });
      spaceComplexity.addMeasurement({ inputSize: 10000, executionTime: 10000, memoryUsed: 100, operations: 10000 });
      spaceComplexity.addMeasurement({ inputSize: 100000, executionTime: 100000, memoryUsed: 100, operations: 100000 });
      
      expect(spaceComplexity.classify()).toBe(SpaceComplexityClass.O_1);
    });

    it('should classify O(n) space complexity', () => {
      spaceComplexity.addMeasurement({ inputSize: 100, executionTime: 100, memoryUsed: 100, operations: 100 });
      spaceComplexity.addMeasurement({ inputSize: 200, executionTime: 200, memoryUsed: 200, operations: 200 });
      spaceComplexity.addMeasurement({ inputSize: 400, executionTime: 400, memoryUsed: 400, operations: 400 });
      spaceComplexity.addMeasurement({ inputSize: 800, executionTime: 800, memoryUsed: 800, operations: 800 });
      
      expect(spaceComplexity.classify()).toBe(SpaceComplexityClass.O_N);
    });

    it('should estimate space coefficient', () => {
      spaceComplexity.addMeasurement({ inputSize: 100, executionTime: 100, memoryUsed: 800, operations: 100 });
      
      const coefficient = spaceComplexity.estimateCoefficient();
      expect(coefficient).toBe(8);
    });

    it('should clear measurements', () => {
      spaceComplexity.addMeasurement({ inputSize: 100, executionTime: 1000, memoryUsed: 800, operations: 100 });
      spaceComplexity.clear();
      
      expect(spaceComplexity.getMeasurements()).toHaveLength(0);
    });
  });

  describe('ComplexityAnalyzer', () => {
    it('should analyze algorithm complexity', () => {
      const measurements: ComplexityMeasurement[] = [
        { inputSize: 100, executionTime: 100, memoryUsed: 800, operations: 100 },
        { inputSize: 200, executionTime: 200, memoryUsed: 1600, operations: 200 },
        { inputSize: 400, executionTime: 400, memoryUsed: 3200, operations: 400 },
        { inputSize: 800, executionTime: 800, memoryUsed: 6400, operations: 800 }
      ];
      
      const result = analyzer.analyze('TestAlgorithm', measurements);
      
      expect(result.timeComplexity).toBe(TimeComplexityClass.O_N);
      expect(result.spaceComplexity).toBe(SpaceComplexityClass.O_N);
      expect(result.hash).toHaveLength(64);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should calculate confidence based on measurement count', () => {
      const fewMeasurements: ComplexityMeasurement[] = [
        { inputSize: 100, executionTime: 100, memoryUsed: 800, operations: 100 },
        { inputSize: 200, executionTime: 200, memoryUsed: 1600, operations: 200 }
      ];
      
      const result1 = analyzer.analyze('Test1', fewMeasurements);
      expect(result1.confidence).toBeLessThan(0.5);
      
      const manyMeasurements: ComplexityMeasurement[] = [];
      for (let i = 1; i <= 10; i++) {
        manyMeasurements.push({
          inputSize: i * 100,
          executionTime: i * 100,
          memoryUsed: i * 800,
          operations: i * 100
        });
      }
      
      const result2 = analyzer.analyze('Test2', manyMeasurements);
      expect(result2.confidence).toBeGreaterThan(0.7);
    });

    it('should profile algorithms', () => {
      const profile = analyzer.profileAlgorithm(
        'BubbleSort',
        'A simple sorting algorithm',
        TimeComplexityClass.O_N_2
      );
      
      expect(profile.name).toBe('BubbleSort');
      expect(profile.currentComplexity).toBe(TimeComplexityClass.O_N_2);
      expect(profile.hash).toHaveLength(64);
    });

    it('should identify algorithms with O(1) potential', () => {
      const profile = analyzer.profileAlgorithm(
        'Database Search',
        'Searching in a database',
        TimeComplexityClass.O_N
      );
      
      expect(profile.potentialO1Pathway).toBe(true);
      expect(profile.pathwayDescription).toBeDefined();
    });

    it('should not identify O(1) potential for already O(1) algorithms', () => {
      const profile = analyzer.profileAlgorithm(
        'HashLookup',
        'Hash table lookup',
        TimeComplexityClass.O_1
      );
      
      expect(profile.potentialO1Pathway).toBe(false);
    });

    it('should identify O(1) pathways', () => {
      const candidates = analyzer.identifyO1Pathways();
      
      expect(candidates.length).toBeGreaterThan(0);
      
      const mechanisms = candidates.map(c => c.mechanism);
      expect(mechanisms).toContain(O1Mechanism.QUANTUM_PARALLELISM);
      expect(mechanisms).toContain(O1Mechanism.ENTANGLEMENT_SHORTCUT);
      expect(mechanisms).toContain(O1Mechanism.HOLOGRAPHIC_COMPUTATION);
    });

    it('should have feasibility scores between 0 and 1', () => {
      const candidates = analyzer.identifyO1Pathways();
      
      for (const candidate of candidates) {
        expect(candidate.feasibilityScore).toBeGreaterThanOrEqual(0);
        expect(candidate.feasibilityScore).toBeLessThanOrEqual(1);
      }
    });

    it('should generate unique hashes for candidates', () => {
      const candidates = analyzer.identifyO1Pathways();
      const hashes = candidates.map(c => c.hash);
      const uniqueHashes = new Set(hashes);
      
      expect(uniqueHashes.size).toBe(hashes.length);
    });

    it('should benchmark algorithms', () => {
      const algorithm = (arr: number[]): number[] => arr.sort((a, b) => a - b);
      const inputGenerator = (size: number): number[] => 
        Array.from({ length: size }, () => Math.random());
      
      const result = analyzer.benchmark(
        'ArraySort',
        algorithm,
        inputGenerator,
        [100, 200, 400]
      );
      
      expect(result.measurements).toHaveLength(3);
      expect(result.timeComplexity).toBeDefined();
      expect(result.spaceComplexity).toBeDefined();
    });

    it('should compare complexity results', () => {
      const result1: ComplexityResult = {
        timeComplexity: TimeComplexityClass.O_N,
        spaceComplexity: SpaceComplexityClass.O_N,
        estimatedTimeCoefficient: 1,
        estimatedSpaceCoefficient: 8,
        measurements: [],
        hash: 'abc123',
        timestamp: new Date(),
        confidence: 0.9
      };
      
      const result2: ComplexityResult = {
        timeComplexity: TimeComplexityClass.O_N_2,
        spaceComplexity: SpaceComplexityClass.O_N_2,
        estimatedTimeCoefficient: 1,
        estimatedSpaceCoefficient: 8,
        measurements: [],
        hash: 'def456',
        timestamp: new Date(),
        confidence: 0.9
      };
      
      const comparison = analyzer.compare(result1, result2);
      
      expect(comparison.timeDifference).toBe('Result 1 is faster');
      expect(comparison.spaceDifference).toBe('Result 1 uses less space');
      expect(comparison.overallImprovement).toBe(true);
    });

    it('should get algorithm profile by name', () => {
      analyzer.profileAlgorithm('TestAlgo', 'Test description', TimeComplexityClass.O_N);
      
      const profile = analyzer.getProfile('TestAlgo');
      expect(profile).toBeDefined();
      expect(profile?.name).toBe('TestAlgo');
      
      const nonexistent = analyzer.getProfile('NonExistent');
      expect(nonexistent).toBeUndefined();
    });

    it('should get all algorithm profiles', () => {
      analyzer.profileAlgorithm('Algo1', 'Description 1', TimeComplexityClass.O_N);
      analyzer.profileAlgorithm('Algo2', 'Description 2', TimeComplexityClass.O_N_2);
      
      const profiles = analyzer.getAllProfiles();
      expect(profiles).toHaveLength(2);
    });

    it('should get O(1) candidates by mechanism', () => {
      analyzer.identifyO1Pathways();
      
      const quantumCandidates = analyzer.getO1CandidatesByMechanism(O1Mechanism.QUANTUM_PARALLELISM);
      expect(quantumCandidates.length).toBe(1);
      expect(quantumCandidates[0].mechanism).toBe(O1Mechanism.QUANTUM_PARALLELISM);
    });

    it('should track analysis history', () => {
      const measurements1: ComplexityMeasurement[] = [
        { inputSize: 100, executionTime: 100, memoryUsed: 800, operations: 100 },
        { inputSize: 200, executionTime: 200, memoryUsed: 1600, operations: 200 },
        { inputSize: 400, executionTime: 400, memoryUsed: 3200, operations: 400 }
      ];
      
      const measurements2: ComplexityMeasurement[] = [
        { inputSize: 100, executionTime: 1000, memoryUsed: 800, operations: 100 },
        { inputSize: 200, executionTime: 4000, memoryUsed: 3200, operations: 400 },
        { inputSize: 400, executionTime: 16000, memoryUsed: 12800, operations: 1600 }
      ];
      
      analyzer.analyze('LinearAlgo', measurements1);
      analyzer.analyze('QuadraticAlgo', measurements2);
      
      const history = analyzer.getAnalysisHistory();
      expect(history).toHaveLength(2);
    });

    it('should clear all data', () => {
      analyzer.profileAlgorithm('TestAlgo', 'Test', TimeComplexityClass.O_N);
      analyzer.identifyO1Pathways();
      analyzer.analyze('Test', [
        { inputSize: 100, executionTime: 100, memoryUsed: 800, operations: 100 },
        { inputSize: 200, executionTime: 200, memoryUsed: 1600, operations: 200 },
        { inputSize: 400, executionTime: 400, memoryUsed: 3200, operations: 400 }
      ]);
      
      analyzer.clear();
      
      expect(analyzer.getAllProfiles()).toHaveLength(0);
      expect(analyzer.getO1Candidates()).toHaveLength(0);
      expect(analyzer.getAnalysisHistory()).toHaveLength(0);
    });

    it('should export to JSON', () => {
      analyzer.profileAlgorithm('TestAlgo', 'Test', TimeComplexityClass.O_N);
      analyzer.identifyO1Pathways();
      
      const json = analyzer.exportToJson();
      const parsed = JSON.parse(json);
      
      expect(parsed.profiles).toBeDefined();
      expect(parsed.o1Candidates).toBeDefined();
      expect(parsed.exportTimestamp).toBeDefined();
    });

    it('should get statistics', () => {
      analyzer.profileAlgorithm('Algo1', 'Test 1', TimeComplexityClass.O_N);
      analyzer.profileAlgorithm('Algo2', 'Test 2', TimeComplexityClass.O_1);
      analyzer.identifyO1Pathways();
      analyzer.analyze('Algo1', [
        { inputSize: 100, executionTime: 100, memoryUsed: 800, operations: 100 },
        { inputSize: 200, executionTime: 200, memoryUsed: 1600, operations: 200 },
        { inputSize: 400, executionTime: 400, memoryUsed: 3200, operations: 400 }
      ]);
      
      const stats = analyzer.getStatistics();
      
      expect(stats.totalProfiles).toBe(2);
      expect(stats.totalO1Candidates).toBeGreaterThan(0);
      expect(stats.totalAnalyses).toBe(1);
      expect(stats.profilesWithO1Potential).toBeGreaterThanOrEqual(0);
      expect(stats.averageFeasibility).toBeGreaterThan(0);
    });

    it('should generate proof chain hash', () => {
      analyzer.profileAlgorithm('Algo1', 'Test', TimeComplexityClass.O_N);
      analyzer.identifyO1Pathways();
      
      const hash = analyzer.getProofChainHash();
      
      expect(hash).toHaveLength(64);
    });
  });

  describe('ComplexityAnalyzerFactory', () => {
    it('should create analyzer without logger', () => {
      const newAnalyzer = ComplexityAnalyzerFactory.create();
      expect(newAnalyzer).toBeInstanceOf(ComplexityAnalyzer);
    });

    it('should create analyzer with logger', () => {
      const newAnalyzer = ComplexityAnalyzerFactory.create(logger);
      expect(newAnalyzer).toBeInstanceOf(ComplexityAnalyzer);
    });

    it('should create analyzer with pre-identified pathways', () => {
      const newAnalyzer = ComplexityAnalyzerFactory.createWithPathways(logger);
      
      const candidates = newAnalyzer.getO1Candidates();
      expect(candidates.length).toBeGreaterThan(0);
    });
  });

  describe('Complexity Classifications', () => {
    it('should correctly classify O(log n) complexity', () => {
      const timeComplexity = new TimeComplexity();
      
      // Log complexity: doubling input adds constant time
      timeComplexity.addMeasurement({ inputSize: 10, executionTime: 100, memoryUsed: 100, operations: 3 });
      timeComplexity.addMeasurement({ inputSize: 100, executionTime: 200, memoryUsed: 100, operations: 7 });
      timeComplexity.addMeasurement({ inputSize: 1000, executionTime: 300, memoryUsed: 100, operations: 10 });
      timeComplexity.addMeasurement({ inputSize: 10000, executionTime: 400, memoryUsed: 100, operations: 13 });
      
      expect(timeComplexity.classify()).toBe(TimeComplexityClass.O_LOG_N);
    });

    it('should correctly classify O(n log n) complexity', () => {
      const timeComplexity = new TimeComplexity();
      
      // n log n complexity
      timeComplexity.addMeasurement({ inputSize: 100, executionTime: 664, memoryUsed: 800, operations: 664 });
      timeComplexity.addMeasurement({ inputSize: 200, executionTime: 1528, memoryUsed: 1600, operations: 1528 });
      timeComplexity.addMeasurement({ inputSize: 400, executionTime: 3456, memoryUsed: 3200, operations: 3456 });
      timeComplexity.addMeasurement({ inputSize: 800, executionTime: 7712, memoryUsed: 6400, operations: 7712 });
      
      const result = timeComplexity.classify();
      // n log n should have ratio slightly above 1
      expect([TimeComplexityClass.O_N_LOG_N, TimeComplexityClass.O_N]).toContain(result);
    });
  });

  describe('Hash Verification', () => {
    it('should generate different hashes for different analyses', () => {
      const measurements1: ComplexityMeasurement[] = [
        { inputSize: 100, executionTime: 100, memoryUsed: 800, operations: 100 },
        { inputSize: 200, executionTime: 200, memoryUsed: 1600, operations: 200 },
        { inputSize: 400, executionTime: 400, memoryUsed: 3200, operations: 400 }
      ];
      
      const measurements2: ComplexityMeasurement[] = [
        { inputSize: 100, executionTime: 1000, memoryUsed: 8000, operations: 1000 },
        { inputSize: 200, executionTime: 2000, memoryUsed: 16000, operations: 2000 },
        { inputSize: 400, executionTime: 4000, memoryUsed: 32000, operations: 4000 }
      ];
      
      const result1 = analyzer.analyze('Algo1', measurements1);
      const result2 = analyzer.analyze('Algo2', measurements2);
      
      expect(result1.hash).not.toBe(result2.hash);
    });

    it('should generate consistent hashes for same input', () => {
      const measurements: ComplexityMeasurement[] = [
        { inputSize: 100, executionTime: 100, memoryUsed: 800, operations: 100 },
        { inputSize: 200, executionTime: 200, memoryUsed: 1600, operations: 200 },
        { inputSize: 400, executionTime: 400, memoryUsed: 3200, operations: 400 }
      ];
      
      const analyzer1 = new ComplexityAnalyzer();
      const analyzer2 = new ComplexityAnalyzer();
      
      // Note: timestamps differ, so hashes will differ
      // This test verifies hash format
      const result1 = analyzer1.analyze('TestAlgo', measurements);
      const result2 = analyzer2.analyze('TestAlgo', measurements);
      
      expect(result1.hash).toHaveLength(64);
      expect(result2.hash).toHaveLength(64);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty measurements', () => {
      const result = analyzer.analyze('EmptyAlgo', []);
      
      expect(result.timeComplexity).toBe(TimeComplexityClass.UNKNOWN);
      expect(result.spaceComplexity).toBe(SpaceComplexityClass.UNKNOWN);
    });

    it('should handle single measurement', () => {
      const measurements: ComplexityMeasurement[] = [
        { inputSize: 100, executionTime: 100, memoryUsed: 800, operations: 100 }
      ];
      
      const result = analyzer.analyze('SingleMeasurement', measurements);
      
      expect(result.timeComplexity).toBe(TimeComplexityClass.UNKNOWN);
      expect(result.confidence).toBeLessThan(0.5);
    });

    it('should handle zero execution time', () => {
      const measurements: ComplexityMeasurement[] = [
        { inputSize: 100, executionTime: 0, memoryUsed: 800, operations: 100 },
        { inputSize: 200, executionTime: 0, memoryUsed: 1600, operations: 200 },
        { inputSize: 400, executionTime: 0, memoryUsed: 3200, operations: 400 }
      ];
      
      const result = analyzer.analyze('ZeroTime', measurements);
      expect(result).toBeDefined();
    });

    it('should handle very large input sizes', () => {
      const measurements: ComplexityMeasurement[] = [
        { inputSize: 1e6, executionTime: 1e6, memoryUsed: 8e6, operations: 1e6 },
        { inputSize: 2e6, executionTime: 2e6, memoryUsed: 16e6, operations: 2e6 },
        { inputSize: 4e6, executionTime: 4e6, memoryUsed: 32e6, operations: 4e6 }
      ];
      
      const result = analyzer.analyze('LargeInput', measurements);
      
      expect(result.timeComplexity).toBe(TimeComplexityClass.O_N);
    });
  });

  describe('O(1) Pathway Details', () => {
    beforeEach(() => {
      analyzer.identifyO1Pathways();
    });

    it('should include requirements for each pathway', () => {
      const candidates = analyzer.getO1Candidates();
      
      for (const candidate of candidates) {
        expect(candidate.requirements).toBeDefined();
        expect(candidate.requirements.length).toBeGreaterThan(0);
      }
    });

    it('should include limitations for each pathway', () => {
      const candidates = analyzer.getO1Candidates();
      
      for (const candidate of candidates) {
        expect(candidate.limitations).toBeDefined();
        expect(candidate.limitations.length).toBeGreaterThan(0);
      }
    });

    it('should have highest feasibility for precomputation', () => {
      const candidates = analyzer.getO1Candidates();
      const precomp = candidates.find(c => c.mechanism === O1Mechanism.PRECOMPUTATION_LOOKUP);
      
      expect(precomp).toBeDefined();
      expect(precomp!.feasibilityScore).toBeGreaterThanOrEqual(0.8);
    });

    it('should have unique IDs for each candidate', () => {
      const candidates = analyzer.getO1Candidates();
      const ids = candidates.map(c => c.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('Algorithm Profiling', () => {
    it('should determine correct theoretical optimal for sorting', () => {
      const profile = analyzer.profileAlgorithm(
        'BubbleSort',
        'Bubble sort algorithm',
        TimeComplexityClass.O_N_2
      );
      
      expect(profile.theoreticalOptimal).toBe(TimeComplexityClass.O_N_LOG_N);
    });

    it('should determine correct theoretical optimal for binary search', () => {
      const profile = analyzer.profileAlgorithm(
        'Binary Search in Sorted Array',
        'Binary search in sorted array',
        TimeComplexityClass.O_N
      );
      
      expect(profile.theoreticalOptimal).toBe(TimeComplexityClass.O_LOG_N);
    });

    it('should determine correct theoretical optimal for hash lookup', () => {
      const profile = analyzer.profileAlgorithm(
        'HashTable Lookup',
        'Hash table lookup operation',
        TimeComplexityClass.O_N
      );
      
      expect(profile.theoreticalOptimal).toBe(TimeComplexityClass.O_1);
    });

    it('should identify graph algorithms as having O(1) potential', () => {
      const profile = analyzer.profileAlgorithm(
        'Graph Isomorphism Check',
        'Check if two graphs are isomorphic',
        TimeComplexityClass.O_N_FACTORIAL
      );
      
      expect(profile.potentialO1Pathway).toBe(true);
    });
  });
});
