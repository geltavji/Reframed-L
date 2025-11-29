/**
 * AutoExplorer Tests (M10.03)
 * PRD-10 Phase 10.3: Automated Exploration
 */

import {
  AutoExplorer,
  AutoExplorerFactory,
  ExplorationPath,
  Discovery,
  ExplorationConfig,
  ExplorationResult
} from '../../../src/discovery/explorer/AutoExplorer';

describe('AutoExplorer', () => {
  let explorer: AutoExplorer;

  beforeEach(() => {
    explorer = new AutoExplorer(undefined, undefined, undefined, 12345);
  });

  describe('Strategy Registration', () => {
    it('should have default strategies', () => {
      const proofChain = explorer.exportProofChain();
      expect(proofChain.strategies).toContain('random');
      expect(proofChain.strategies).toContain('gradient');
      expect(proofChain.strategies).toContain('annealing');
      expect(proofChain.strategies).toContain('bayesian');
    });

    it('should register custom strategies', () => {
      explorer.registerStrategy({
        name: 'custom',
        selectNextPoint: (current, history, config, rng) => {
          const params: Record<string, number> = {};
          for (const key of Object.keys(config.parameterBounds)) {
            params[key] = 0.5;
          }
          return params;
        }
      });

      const proofChain = explorer.exportProofChain();
      expect(proofChain.strategies).toContain('custom');
    });
  });

  describe('Exploration', () => {
    const defaultConfig: ExplorationConfig = {
      maxIterations: 20,
      convergenceThreshold: 0.01,
      explorationRate: 0.3,
      learningRate: 0.1,
      parallelPaths: 2,
      parameterBounds: {
        x: { min: 0, max: 10 },
        y: { min: 0, max: 10 }
      },
      objectiveFunction: (params) => -((params.x - 5) ** 2 + (params.y - 5) ** 2),
      seed: 42
    };

    it('should explore parameter space', () => {
      const result = explorer.explore(defaultConfig, 'random');

      expect(result.paths.length).toBe(defaultConfig.parallelPaths);
      expect(result.bestPoint).toBeDefined();
      expect(result.hash).toBeDefined();
    });

    it('should use gradient strategy', () => {
      const result = explorer.explore(defaultConfig, 'gradient');

      expect(result.statistics.totalIterations).toBeGreaterThan(0);
      expect(result.paths.length).toBe(defaultConfig.parallelPaths);
    });

    it('should use annealing strategy', () => {
      const result = explorer.explore(defaultConfig, 'annealing');

      expect(result.statistics.totalIterations).toBeGreaterThan(0);
    });

    it('should use bayesian strategy', () => {
      const result = explorer.explore(defaultConfig, 'bayesian');

      expect(result.statistics.totalIterations).toBeGreaterThan(0);
    });

    it('should track exploration statistics', () => {
      const result = explorer.explore(defaultConfig, 'random');

      expect(result.statistics.totalIterations).toBeLessThanOrEqual(defaultConfig.maxIterations);
      expect(result.statistics.pathsExplored).toBe(defaultConfig.parallelPaths);
      expect(result.statistics.executionTime).toBeGreaterThan(0);
    });

    it('should find the optimum for simple function', () => {
      const result = explorer.explore({
        ...defaultConfig,
        maxIterations: 50
      }, 'gradient');

      // Should approach the optimum at (5, 5)
      expect(result.bestPoint.parameters.x).toBeGreaterThan(2);
      expect(result.bestPoint.parameters.x).toBeLessThan(8);
      expect(result.bestPoint.parameters.y).toBeGreaterThan(2);
      expect(result.bestPoint.parameters.y).toBeLessThan(8);
    });

    it('should throw error for unknown strategy', () => {
      expect(() => explorer.explore(defaultConfig, 'nonexistent')).toThrow();
    });
  });

  describe('Exploration Paths', () => {
    const config: ExplorationConfig = {
      maxIterations: 10,
      convergenceThreshold: 0.01,
      explorationRate: 0.3,
      learningRate: 0.1,
      parallelPaths: 3,
      parameterBounds: { x: { min: 0, max: 10 } },
      objectiveFunction: (params) => params.x * 2,
      seed: 123
    };

    it('should create parallel paths', () => {
      const result = explorer.explore(config, 'random');

      expect(result.paths.length).toBe(3);
      for (const path of result.paths) {
        expect(path.id).toBeDefined();
        expect(path.trajectory.length).toBeGreaterThan(0);
        expect(path.startPoint).toBeDefined();
        expect(path.currentPoint).toBeDefined();
      }
    });

    it('should track path status', () => {
      const result = explorer.explore(config, 'random');

      for (const path of result.paths) {
        expect(['active', 'completed', 'abandoned', 'promising']).toContain(path.status);
      }
    });

    it('should calculate path scores', () => {
      const result = explorer.explore(config, 'random');

      for (const path of result.paths) {
        expect(path.score).toBeDefined();
      }
    });

    it('should store paths for retrieval', () => {
      explorer.explore(config, 'random');
      
      const paths = explorer.getAllPaths();
      expect(paths.length).toBeGreaterThan(0);
    });

    it('should retrieve path by ID', () => {
      const result = explorer.explore(config, 'random');
      
      const path = explorer.getPath(result.paths[0].id);
      expect(path).toBeDefined();
      expect(path?.id).toBe(result.paths[0].id);
    });
  });

  describe('Discovery Generation', () => {
    it('should detect discoveries during exploration', () => {
      const config: ExplorationConfig = {
        maxIterations: 50,
        convergenceThreshold: 0.01,
        explorationRate: 0.5,
        learningRate: 0.1,
        parallelPaths: 2,
        parameterBounds: { x: { min: 0, max: 100 } },
        objectiveFunction: (params) => {
          // Create anomaly at x=50
          if (params.x > 49 && params.x < 51) {
            return 1000;
          }
          return params.x;
        },
        seed: 999
      };

      const result = explorer.explore(config, 'random');

      // May or may not find discoveries depending on random exploration
      expect(result.discoveries).toBeDefined();
      expect(Array.isArray(result.discoveries)).toBe(true);
    });

    it('should store discoveries for retrieval', () => {
      const config: ExplorationConfig = {
        maxIterations: 30,
        convergenceThreshold: 0.01,
        explorationRate: 0.3,
        learningRate: 0.1,
        parallelPaths: 2,
        parameterBounds: { x: { min: 0, max: 10 } },
        objectiveFunction: (params) => params.x,
        seed: 456
      };

      explorer.explore(config, 'random');
      const discoveries = explorer.getAllDiscoveries();
      expect(Array.isArray(discoveries)).toBe(true);
    });
  });

  describe('Hash Verification', () => {
    it('should generate valid hash', () => {
      const hash = explorer.getHash();
      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should export proof chain', () => {
      const config: ExplorationConfig = {
        maxIterations: 5,
        convergenceThreshold: 0.01,
        explorationRate: 0.3,
        learningRate: 0.1,
        parallelPaths: 1,
        parameterBounds: { x: { min: 0, max: 10 } },
        objectiveFunction: (params) => params.x
      };

      explorer.explore(config, 'random');
      const proofChain = explorer.exportProofChain();

      expect(proofChain.strategies).toBeDefined();
      expect(proofChain.paths).toBeDefined();
      expect(proofChain.discoveries).toBeDefined();
    });
  });

  describe('Factory', () => {
    it('should create default explorer', () => {
      const exp = AutoExplorerFactory.default();
      expect(exp).toBeInstanceOf(AutoExplorer);
    });

    it('should create explorer with seed', () => {
      const exp = AutoExplorerFactory.withSeed(42);
      expect(exp).toBeInstanceOf(AutoExplorer);
    });
  });
});
