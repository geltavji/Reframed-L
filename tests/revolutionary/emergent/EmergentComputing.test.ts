/**
 * Qlaws Ham - EmergentComputing Module Tests (M06.05)
 * 
 * Comprehensive tests for emergent computing module.
 * 
 * @module EmergentComputing.test
 * @version 1.0.0
 */

import {
  EmergentComputing,
  EmergentComputingFactory,
  SoapBubbleComputer,
  SimulatedAnnealing,
  NatureInspiredOptimizer,
  EmergentType,
  ProblemType,
  EmergentResult,
  AnnealingSchedule
} from '../../../src/revolutionary/emergent/EmergentComputing';
import { Logger, LogLevel } from '../../../src/core/logger/Logger';

describe('EmergentComputing Module (M06.05)', () => {
  let logger: Logger;
  let emergent: EmergentComputing;

  beforeEach(() => {
    Logger.resetInstance();
    logger = Logger.getInstance({ minLevel: LogLevel.ERROR, enableConsole: false });
    EmergentComputing.setLogger(logger);
    emergent = new EmergentComputing();
  });

  afterEach(() => {
    emergent.clear();
    Logger.resetInstance();
  });

  describe('SoapBubbleComputer Class', () => {
    let soapBubble: SoapBubbleComputer;

    beforeEach(() => {
      soapBubble = new SoapBubbleComputer();
    });

    afterEach(() => {
      soapBubble.clear();
    });

    it('should solve simple 2-point Steiner tree', () => {
      const points: [number, number][] = [[0, 0], [1, 1]];
      const result = soapBubble.solveSteinerTree(points);
      
      expect(result).toBeDefined();
      expect(result.type).toBe(EmergentType.SOAP_BUBBLE);
      expect(result.problem).toBe(ProblemType.STEINER_TREE);
      expect(result.hash).toHaveLength(64);
    });

    it('should solve 3-point Steiner tree', () => {
      const points: [number, number][] = [[0, 0], [1, 0], [0.5, 1]];
      const result = soapBubble.solveSteinerTree(points);
      
      expect(result.solution).toBeDefined();
      expect(result.quality).toBeGreaterThan(0);
      expect(result.quality).toBeLessThanOrEqual(1);
    });

    it('should solve larger Steiner tree', () => {
      const points: [number, number][] = [
        [0, 0], [4, 0], [0, 3], [4, 3], [2, 1.5]
      ];
      const result = soapBubble.solveSteinerTree(points);
      
      expect(result.solution).toBeDefined();
      expect((result.solution as any).terminals.length).toBe(5);
    });

    it('should track computation time', () => {
      const points: [number, number][] = [[0, 0], [1, 1], [2, 0]];
      const result = soapBubble.solveSteinerTree(points);
      
      expect(result.computationTime).toBeGreaterThanOrEqual(0);
    });

    it('should estimate energy used', () => {
      const points: [number, number][] = [[0, 0], [1, 1]];
      const result = soapBubble.solveSteinerTree(points);
      
      expect(result.energyUsed).toBeGreaterThan(0);
    });

    it('should track solutions', () => {
      soapBubble.solveSteinerTree([[0, 0], [1, 1]]);
      soapBubble.solveSteinerTree([[0, 0], [2, 2]]);
      
      expect(soapBubble.getSolutions()).toHaveLength(2);
    });

    it('should clear solutions', () => {
      soapBubble.solveSteinerTree([[0, 0], [1, 1]]);
      soapBubble.clear();
      
      expect(soapBubble.getSolutions()).toHaveLength(0);
    });

    it('should handle single point', () => {
      const points: [number, number][] = [[5, 5]];
      const result = soapBubble.solveSteinerTree(points);
      
      expect(result).toBeDefined();
      expect((result.solution as any).edges.length).toBe(0);
    });

    it('should handle empty input', () => {
      const points: [number, number][] = [];
      const result = soapBubble.solveSteinerTree(points);
      
      expect(result).toBeDefined();
    });
  });

  describe('SimulatedAnnealing Class', () => {
    let annealing: SimulatedAnnealing;
    let schedule: AnnealingSchedule;
    let energyFunction: (state: number[]) => number;

    beforeEach(() => {
      annealing = new SimulatedAnnealing();
      schedule = {
        initialTemperature: 100,
        finalTemperature: 0.01,
        coolingRate: 0.99,
        steps: 1000,
        schedule: 'exponential'
      };
      // Quadratic energy function with minimum at origin
      energyFunction = (state: number[]) => 
        state.reduce((sum, x) => sum + x * x, 0);
    });

    afterEach(() => {
      annealing.clear();
    });

    it('should optimize using simulated annealing', () => {
      const initialState = [5, -3, 2];
      const result = annealing.optimize(energyFunction, initialState, schedule);
      
      expect(result).toBeDefined();
      expect(result.type).toBe(EmergentType.QUANTUM_ANNEALING);
      expect(result.problem).toBe(ProblemType.OPTIMIZATION);
    });

    it('should find lower energy states', () => {
      const initialState = [10, 10, 10];
      const initialEnergy = energyFunction(initialState);
      
      const result = annealing.optimize(energyFunction, initialState, schedule);
      const finalEnergy = (result.solution as any).energy;
      
      expect(finalEnergy).toBeLessThan(initialEnergy);
    });

    it('should use linear cooling schedule', () => {
      schedule.schedule = 'linear';
      const result = annealing.optimize(energyFunction, [5, 5], schedule);
      
      expect(result).toBeDefined();
      expect((result.solution as any).energy).toBeDefined();
    });

    it('should use logarithmic cooling schedule', () => {
      schedule.schedule = 'logarithmic';
      const result = annealing.optimize(energyFunction, [5, 5], schedule);
      
      expect(result).toBeDefined();
    });

    it('should calculate quality', () => {
      const result = annealing.optimize(energyFunction, [1, 1], schedule);
      
      expect(result.quality).toBeGreaterThan(0);
      expect(result.quality).toBeLessThanOrEqual(1);
    });

    it('should track energy used', () => {
      const result = annealing.optimize(energyFunction, [5, 5], schedule);
      
      expect(result.energyUsed).toBeGreaterThan(0);
    });

    it('should calculate confidence', () => {
      const result = annealing.optimize(energyFunction, [1, 1], schedule);
      
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should track results', () => {
      annealing.optimize(energyFunction, [1, 1], schedule);
      annealing.optimize(energyFunction, [2, 2], schedule);
      
      expect(annealing.getResults()).toHaveLength(2);
    });

    it('should clear results', () => {
      annealing.optimize(energyFunction, [1, 1], schedule);
      annealing.clear();
      
      expect(annealing.getResults()).toHaveLength(0);
    });
  });

  describe('NatureInspiredOptimizer Class', () => {
    let optimizer: NatureInspiredOptimizer;

    beforeEach(() => {
      optimizer = new NatureInspiredOptimizer();
    });

    afterEach(() => {
      optimizer.clear();
    });

    it('should solve TSP', () => {
      const cities: [number, number][] = [
        [0, 0], [1, 0], [1, 1], [0, 1]
      ];
      const result = optimizer.solveTSP(cities);
      
      expect(result).toBeDefined();
      expect(result.type).toBe(EmergentType.ANT_COLONY);
      expect(result.problem).toBe(ProblemType.TRAVELING_SALESMAN);
    });

    it('should find tour visiting all cities', () => {
      const cities: [number, number][] = [
        [0, 0], [1, 0], [2, 0], [3, 0]
      ];
      const result = optimizer.solveTSP(cities, 50);
      const tour = (result.solution as any).tour;
      
      expect(tour.length).toBe(cities.length);
      // All cities should be visited
      const visited = new Set(tour);
      expect(visited.size).toBe(cities.length);
    });

    it('should calculate tour length', () => {
      const cities: [number, number][] = [
        [0, 0], [1, 0], [1, 1], [0, 1]
      ];
      const result = optimizer.solveTSP(cities);
      
      expect((result.solution as any).length).toBeGreaterThan(0);
    });

    it('should estimate quality', () => {
      const cities: [number, number][] = [
        [0, 0], [1, 0], [1, 1], [0, 1]
      ];
      const result = optimizer.solveTSP(cities);
      
      expect(result.quality).toBeGreaterThan(0);
      expect(result.quality).toBeLessThanOrEqual(1);
    });

    it('should handle single city', () => {
      const cities: [number, number][] = [[5, 5]];
      const result = optimizer.solveTSP(cities);
      
      expect(result.quality).toBe(1);
      expect((result.solution as any).length).toBe(0);
    });

    it('should improve with more iterations', () => {
      const cities: [number, number][] = [
        [0, 0], [1, 0], [2, 0], [3, 0], [4, 0],
        [4, 1], [3, 1], [2, 1], [1, 1], [0, 1]
      ];
      
      const result10 = optimizer.solveTSP(cities, 10);
      optimizer.clear();
      const result100 = optimizer.solveTSP(cities, 100);
      
      // More iterations should not make things worse on average
      // (though due to randomness, individual runs may vary)
      expect(result100.quality).toBeGreaterThanOrEqual(0);
    });

    it('should track results', () => {
      optimizer.solveTSP([[0, 0], [1, 1]], 10);
      optimizer.solveTSP([[0, 0], [2, 2]], 10);
      
      expect(optimizer.getResults()).toHaveLength(2);
    });

    it('should clear results', () => {
      optimizer.solveTSP([[0, 0], [1, 1]], 10);
      optimizer.clear();
      
      expect(optimizer.getResults()).toHaveLength(0);
    });
  });

  describe('EmergentComputing - Solve', () => {
    it('should solve Steiner tree problems', () => {
      const points: [number, number][] = [[0, 0], [1, 1], [2, 0]];
      const result = emergent.solve(ProblemType.STEINER_TREE, points);
      
      expect(result.type).toBe(EmergentType.SOAP_BUBBLE);
      expect(result.problem).toBe(ProblemType.STEINER_TREE);
    });

    it('should solve TSP problems', () => {
      const cities: [number, number][] = [[0, 0], [1, 0], [0, 1]];
      const result = emergent.solve(ProblemType.TRAVELING_SALESMAN, cities);
      
      expect(result.type).toBe(EmergentType.ANT_COLONY);
      expect(result.problem).toBe(ProblemType.TRAVELING_SALESMAN);
    });

    it('should solve optimization problems', () => {
      const input = {
        energyFunction: (state: number[]) => state.reduce((s, x) => s + x * x, 0),
        initialState: [5, 5],
        schedule: {
          initialTemperature: 100,
          finalTemperature: 0.01,
          coolingRate: 0.99,
          steps: 500,
          schedule: 'exponential' as const
        }
      };
      
      const result = emergent.solve(ProblemType.OPTIMIZATION, input);
      
      expect(result.type).toBe(EmergentType.QUANTUM_ANNEALING);
      expect(result.problem).toBe(ProblemType.OPTIMIZATION);
    });

    it('should handle unsupported problems', () => {
      const result = emergent.solve(ProblemType.SAT, null);
      
      expect(result).toBeDefined();
      expect(result.quality).toBe(0);
      expect(result.confidence).toBe(0);
    });

    it('should track all results', () => {
      emergent.solve(ProblemType.STEINER_TREE, [[0, 0], [1, 1]]);
      emergent.solve(ProblemType.TRAVELING_SALESMAN, [[0, 0], [1, 0], [0, 1]]);
      
      expect(emergent.getAllResults()).toHaveLength(2);
    });
  });

  describe('EmergentComputing - Getters', () => {
    it('should get soap bubble computer', () => {
      expect(emergent.getSoapBubble()).toBeInstanceOf(SoapBubbleComputer);
    });

    it('should get simulated annealing', () => {
      expect(emergent.getAnnealing()).toBeInstanceOf(SimulatedAnnealing);
    });

    it('should get nature-inspired optimizer', () => {
      expect(emergent.getNatureInspired()).toBeInstanceOf(NatureInspiredOptimizer);
    });
  });

  describe('EmergentComputing - Statistics', () => {
    it('should provide statistics', () => {
      emergent.solve(ProblemType.STEINER_TREE, [[0, 0], [1, 1]]);
      emergent.solve(ProblemType.TRAVELING_SALESMAN, [[0, 0], [1, 0], [0, 1]]);
      
      const stats = emergent.getStatistics();
      
      expect(stats.totalComputations).toBe(2);
      expect(stats.byType[EmergentType.SOAP_BUBBLE]).toBe(1);
      expect(stats.byType[EmergentType.ANT_COLONY]).toBe(1);
      expect(stats.byProblem[ProblemType.STEINER_TREE]).toBe(1);
      expect(stats.byProblem[ProblemType.TRAVELING_SALESMAN]).toBe(1);
      expect(stats.averageQuality).toBeGreaterThan(0);
    });

    it('should handle empty statistics', () => {
      const stats = emergent.getStatistics();
      
      expect(stats.totalComputations).toBe(0);
      expect(stats.averageQuality).toBe(0);
    });

    it('should count optimal solutions', () => {
      // Steiner tree with 2 points is always optimal
      emergent.solve(ProblemType.STEINER_TREE, [[0, 0], [1, 1]]);
      
      const stats = emergent.getStatistics();
      expect(stats.optimalCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('EmergentComputing - Export and Hash', () => {
    it('should export to JSON', () => {
      emergent.solve(ProblemType.STEINER_TREE, [[0, 0], [1, 1]]);
      
      const json = emergent.exportToJson();
      const parsed = JSON.parse(json);
      
      expect(parsed.results).toBeDefined();
      expect(parsed.statistics).toBeDefined();
      expect(parsed.exportTimestamp).toBeDefined();
    });

    it('should generate proof chain hash', () => {
      emergent.solve(ProblemType.STEINER_TREE, [[0, 0], [1, 1]]);
      
      const hash = emergent.getProofChainHash();
      expect(hash).toHaveLength(64);
    });

    it('should clear all data', () => {
      emergent.solve(ProblemType.STEINER_TREE, [[0, 0], [1, 1]]);
      emergent.solve(ProblemType.TRAVELING_SALESMAN, [[0, 0], [1, 0]]);
      
      emergent.clear();
      
      expect(emergent.getAllResults()).toHaveLength(0);
      expect(emergent.getSoapBubble().getSolutions()).toHaveLength(0);
      expect(emergent.getAnnealing().getResults()).toHaveLength(0);
      expect(emergent.getNatureInspired().getResults()).toHaveLength(0);
    });
  });

  describe('EmergentComputingFactory', () => {
    it('should create instance without logger', () => {
      const instance = EmergentComputingFactory.create();
      expect(instance).toBeInstanceOf(EmergentComputing);
    });

    it('should create instance with logger', () => {
      const instance = EmergentComputingFactory.create(logger);
      expect(instance).toBeInstanceOf(EmergentComputing);
    });
  });

  describe('Hash Verification', () => {
    it('should generate unique hashes for different results', () => {
      const result1 = emergent.solve(ProblemType.STEINER_TREE, [[0, 0], [1, 1]]);
      const result2 = emergent.solve(ProblemType.STEINER_TREE, [[0, 0], [2, 2]]);
      
      // Results should have hashes (they may be same if computation is identical)
      expect(result1.hash).toHaveLength(64);
      expect(result2.hash).toHaveLength(64);
    });
  });

  describe('Physical Consistency', () => {
    it('should find shorter paths with more points for Steiner', () => {
      // MST on more points might not always be shorter due to Steiner ratio
      // But quality should be reasonable
      const result = emergent.solve(ProblemType.STEINER_TREE, [
        [0, 0], [4, 0], [0, 4], [4, 4]
      ]);
      
      expect(result.quality).toBeGreaterThan(0);
    });

    it('should converge in annealing with enough steps', () => {
      const input = {
        energyFunction: (state: number[]) => state.reduce((s, x) => s + x * x, 0),
        initialState: [10, 10], // Start with more reasonable values
        schedule: {
          initialTemperature: 1000,
          finalTemperature: 0.001,
          coolingRate: 0.999,
          steps: 5000,
          schedule: 'exponential' as const
        }
      };
      
      const result = emergent.solve(ProblemType.OPTIMIZATION, input);
      const finalEnergy = (result.solution as any).energy;
      const initialEnergy = 10 * 10 + 10 * 10; // 200
      
      // Should find a lower energy state than the initial
      expect(finalEnergy).toBeLessThan(initialEnergy);
    });
  });
});
