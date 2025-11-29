/**
 * AutoExplorer - Automated Exploration System (M10.03)
 * PRD-10 Phase 10.3: Automated Exploration
 * 
 * Performs autonomous parameter exploration, self-directed research,
 * and learns from results to guide discovery.
 */

import { Logger, LogLevel } from '../../core/logger/Logger';
import { HashVerifier } from '../../core/logger/HashVerifier';
import { HypothesisEngine, Hypothesis, GenerationConfig } from '../hypothesis/HypothesisEngine';
import { AnomalyDetector, Anomaly, BreakthroughCandidate } from '../anomaly/AnomalyDetector';

// ============================================================================
// INTERFACES
// ============================================================================

export interface ExplorationPath {
  id: string;
  name: string;
  description: string;
  startPoint: ParameterPoint;
  currentPoint: ParameterPoint;
  trajectory: ParameterPoint[];
  discoveries: Discovery[];
  status: 'active' | 'completed' | 'abandoned' | 'promising';
  score: number;
  hash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ParameterPoint {
  parameters: Record<string, number>;
  value: number;
  metadata: Record<string, unknown>;
  timestamp: Date;
}

export interface Discovery {
  id: string;
  type: DiscoveryType;
  description: string;
  significance: number;
  relatedHypothesis?: string;
  relatedAnomaly?: string;
  evidence: Evidence[];
  status: 'preliminary' | 'verified' | 'published' | 'retracted';
  hash: string;
  createdAt: Date;
}

export type DiscoveryType = 
  | 'pattern'
  | 'correlation'
  | 'breakthrough'
  | 'optimization'
  | 'anomaly'
  | 'law';

export interface Evidence {
  id: string;
  type: 'experimental' | 'computational' | 'theoretical';
  description: string;
  strength: number;
  reproducible: boolean;
}

export interface ExplorationConfig {
  maxIterations: number;
  convergenceThreshold: number;
  explorationRate: number; // Balance between exploration and exploitation
  learningRate: number;
  parallelPaths: number;
  parameterBounds: Record<string, { min: number; max: number }>;
  objectiveFunction: (params: Record<string, number>) => number;
  seed?: number;
}

export interface ExplorationResult {
  paths: ExplorationPath[];
  discoveries: Discovery[];
  bestPoint: ParameterPoint;
  statistics: ExplorationStatistics;
  hash: string;
}

export interface ExplorationStatistics {
  totalIterations: number;
  pathsExplored: number;
  discoveriesMade: number;
  improvementRate: number;
  convergenceAchieved: boolean;
  executionTime: number;
}

export interface SearchStrategy {
  name: string;
  selectNextPoint: (
    currentPoint: ParameterPoint,
    history: ParameterPoint[],
    config: ExplorationConfig,
    rng: () => number
  ) => Record<string, number>;
}

// ============================================================================
// AUTO EXPLORER
// ============================================================================

export class AutoExplorer {
  private logger: Logger;
  private hypothesisEngine: HypothesisEngine;
  private anomalyDetector: AnomalyDetector;
  private paths: Map<string, ExplorationPath> = new Map();
  private discoveries: Map<string, Discovery> = new Map();
  private strategies: Map<string, SearchStrategy> = new Map();
  private rng: () => number;

  constructor(
    hypothesisEngine?: HypothesisEngine,
    anomalyDetector?: AnomalyDetector,
    logger?: Logger,
    seed?: number
  ) {
    this.logger = logger || Logger.getInstance({ minLevel: LogLevel.INFO, enableConsole: false });
    this.hypothesisEngine = hypothesisEngine || new HypothesisEngine();
    this.anomalyDetector = anomalyDetector || new AnomalyDetector();
    this.rng = seed !== undefined ? this.seededRandom(seed) : Math.random;
    this.initializeStrategies();
  }

  /**
   * Initialize search strategies
   */
  private initializeStrategies(): void {
    // Random search
    this.registerStrategy({
      name: 'random',
      selectNextPoint: (current, history, config, rng) => {
        const params: Record<string, number> = {};
        for (const [key, bounds] of Object.entries(config.parameterBounds)) {
          params[key] = bounds.min + rng() * (bounds.max - bounds.min);
        }
        return params;
      }
    });

    // Gradient-based search
    this.registerStrategy({
      name: 'gradient',
      selectNextPoint: (current, history, config, rng) => {
        if (history.length < 2) {
          return this.strategies.get('random')!.selectNextPoint(current, history, config, rng);
        }

        const gradient = this.estimateGradient(history, config);
        const params: Record<string, number> = {};
        
        for (const [key, bounds] of Object.entries(config.parameterBounds)) {
          let newValue = current.parameters[key] + config.learningRate * gradient[key];
          // Add small noise for exploration
          newValue += (rng() - 0.5) * config.explorationRate * (bounds.max - bounds.min);
          params[key] = Math.max(bounds.min, Math.min(bounds.max, newValue));
        }
        
        return params;
      }
    });

    // Simulated annealing
    this.registerStrategy({
      name: 'annealing',
      selectNextPoint: (current, history, config, rng) => {
        const temperature = 1 / (1 + history.length * 0.01);
        const params: Record<string, number> = {};
        
        for (const [key, bounds] of Object.entries(config.parameterBounds)) {
          const range = bounds.max - bounds.min;
          const step = temperature * range * (rng() - 0.5) * 2;
          let newValue = current.parameters[key] + step;
          params[key] = Math.max(bounds.min, Math.min(bounds.max, newValue));
        }
        
        return params;
      }
    });

    // Bayesian-inspired search
    this.registerStrategy({
      name: 'bayesian',
      selectNextPoint: (current, history, config, rng) => {
        // Simplified acquisition function
        const params: Record<string, number> = {};
        const bestValue = history.length > 0 
          ? Math.max(...history.map(h => h.value))
          : current.value;
        
        for (const [key, bounds] of Object.entries(config.parameterBounds)) {
          // Balance exploitation (near best) and exploration (uncertainty)
          const exploitation = current.parameters[key];
          const exploration = bounds.min + rng() * (bounds.max - bounds.min);
          const alpha = config.explorationRate;
          params[key] = (1 - alpha) * exploitation + alpha * exploration;
        }
        
        return params;
      }
    });
  }

  /**
   * Register a custom search strategy
   */
  registerStrategy(strategy: SearchStrategy): void {
    this.strategies.set(strategy.name, strategy);
    this.logger.info(`Registered strategy: ${strategy.name}`);
  }

  /**
   * Start autonomous exploration
   */
  explore(config: ExplorationConfig, strategyName: string = 'gradient'): ExplorationResult {
    const startTime = Date.now();
    this.logger.info(`Starting exploration with strategy: ${strategyName}`);

    if (config.seed !== undefined) {
      this.rng = this.seededRandom(config.seed);
    }

    const strategy = this.strategies.get(strategyName);
    if (!strategy) {
      throw new Error(`Strategy ${strategyName} not found`);
    }

    const paths: ExplorationPath[] = [];
    const allDiscoveries: Discovery[] = [];
    let bestPoint: ParameterPoint | null = null;
    let totalIterations = 0;

    // Initialize parallel paths
    for (let p = 0; p < config.parallelPaths; p++) {
      const path = this.initializePath(config, p);
      paths.push(path);
      this.paths.set(path.id, path);
    }

    // Main exploration loop
    let converged = false;
    let iteration = 0;

    while (iteration < config.maxIterations && !converged) {
      iteration++;
      totalIterations++;

      for (const path of paths) {
        if (path.status === 'abandoned') continue;

        // Select next point
        const nextParams = strategy.selectNextPoint(
          path.currentPoint,
          path.trajectory,
          config,
          this.rng
        );

        // Evaluate
        const value = config.objectiveFunction(nextParams);
        const nextPoint: ParameterPoint = {
          parameters: nextParams,
          value,
          metadata: { iteration, pathId: path.id },
          timestamp: new Date()
        };

        // Update path
        path.trajectory.push(nextPoint);
        path.currentPoint = nextPoint;
        path.updatedAt = new Date();

        // Track best
        if (!bestPoint || value > bestPoint.value) {
          bestPoint = nextPoint;
        }

        // Check for anomalies/discoveries
        const values = path.trajectory.map(p => p.value);
        if (values.length >= 5) {
          const detectionResult = this.anomalyDetector.detect(values);
          
          for (const anomaly of detectionResult.anomalies) {
            const discovery = this.createDiscoveryFromAnomaly(anomaly);
            allDiscoveries.push(discovery);
            path.discoveries.push(discovery);
            this.discoveries.set(discovery.id, discovery);
          }
        }

        // Check for convergence on this path
        if (this.checkConvergence(path.trajectory, config.convergenceThreshold)) {
          path.status = 'completed';
        }

        // Update path score
        path.score = this.calculatePathScore(path);
      }

      // Check global convergence
      converged = paths.every(p => p.status === 'completed' || p.status === 'abandoned');

      // Abandon low-performing paths
      if (iteration > 10 && iteration % 10 === 0) {
        this.pruneWeakPaths(paths);
      }
    }

    // Update path hashes
    for (const path of paths) {
      path.hash = HashVerifier.hash(JSON.stringify(path));
    }

    const executionTime = Date.now() - startTime;

    const result: Omit<ExplorationResult, 'hash'> = {
      paths,
      discoveries: allDiscoveries,
      bestPoint: bestPoint!,
      statistics: {
        totalIterations,
        pathsExplored: paths.length,
        discoveriesMade: allDiscoveries.length,
        improvementRate: this.calculateImprovementRate(paths),
        convergenceAchieved: converged,
        executionTime
      }
    };

    return {
      ...result,
      hash: HashVerifier.hash(JSON.stringify(result))
    };
  }

  /**
   * Initialize an exploration path
   */
  private initializePath(config: ExplorationConfig, index: number): ExplorationPath {
    const id = `PATH-${Date.now()}-${index}`;
    
    // Random initial point
    const initialParams: Record<string, number> = {};
    for (const [key, bounds] of Object.entries(config.parameterBounds)) {
      initialParams[key] = bounds.min + this.rng() * (bounds.max - bounds.min);
    }

    const initialPoint: ParameterPoint = {
      parameters: initialParams,
      value: config.objectiveFunction(initialParams),
      metadata: { initial: true },
      timestamp: new Date()
    };

    const path: Omit<ExplorationPath, 'hash'> = {
      id,
      name: `Exploration Path ${index + 1}`,
      description: `Autonomous exploration path initialized at random point`,
      startPoint: initialPoint,
      currentPoint: initialPoint,
      trajectory: [initialPoint],
      discoveries: [],
      status: 'active',
      score: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return {
      ...path,
      hash: HashVerifier.hash(JSON.stringify(path))
    };
  }

  /**
   * Estimate gradient from history
   */
  private estimateGradient(
    history: ParameterPoint[],
    config: ExplorationConfig
  ): Record<string, number> {
    const gradient: Record<string, number> = {};
    const keys = Object.keys(config.parameterBounds);
    
    // Use last few points for gradient estimation
    const recentPoints = history.slice(-5);
    
    for (const key of keys) {
      // Finite difference approximation
      let sumGrad = 0;
      let count = 0;
      
      for (let i = 1; i < recentPoints.length; i++) {
        const dx = recentPoints[i].parameters[key] - recentPoints[i-1].parameters[key];
        const dy = recentPoints[i].value - recentPoints[i-1].value;
        
        if (Math.abs(dx) > 1e-10) {
          sumGrad += dy / dx;
          count++;
        }
      }
      
      gradient[key] = count > 0 ? sumGrad / count : 0;
    }
    
    return gradient;
  }

  /**
   * Check for convergence
   */
  private checkConvergence(trajectory: ParameterPoint[], threshold: number): boolean {
    if (trajectory.length < 10) return false;
    
    const recentValues = trajectory.slice(-10).map(p => p.value);
    const range = Math.max(...recentValues) - Math.min(...recentValues);
    const mean = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    
    return mean > 0 ? range / mean < threshold : range < threshold;
  }

  /**
   * Calculate path score
   */
  private calculatePathScore(path: ExplorationPath): number {
    if (path.trajectory.length === 0) return 0;
    
    const values = path.trajectory.map(p => p.value);
    const maxValue = Math.max(...values);
    const improvement = maxValue - path.startPoint.value;
    const discoveryBonus = path.discoveries.length * 0.1;
    
    return improvement + discoveryBonus;
  }

  /**
   * Prune weak paths
   */
  private pruneWeakPaths(paths: ExplorationPath[]): void {
    const activePaths = paths.filter(p => p.status === 'active');
    if (activePaths.length <= 1) return;
    
    // Sort by score
    activePaths.sort((a, b) => b.score - a.score);
    
    // Abandon bottom 25%
    const pruneCount = Math.floor(activePaths.length * 0.25);
    for (let i = activePaths.length - pruneCount; i < activePaths.length; i++) {
      activePaths[i].status = 'abandoned';
    }
  }

  /**
   * Calculate overall improvement rate
   */
  private calculateImprovementRate(paths: ExplorationPath[]): number {
    let totalImprovement = 0;
    let totalSteps = 0;
    
    for (const path of paths) {
      for (let i = 1; i < path.trajectory.length; i++) {
        const improvement = path.trajectory[i].value - path.trajectory[i-1].value;
        if (improvement > 0) totalImprovement += improvement;
        totalSteps++;
      }
    }
    
    return totalSteps > 0 ? totalImprovement / totalSteps : 0;
  }

  /**
   * Create discovery from anomaly
   */
  private createDiscoveryFromAnomaly(anomaly: Anomaly): Discovery {
    const id = `DISC-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    const discovery: Omit<Discovery, 'hash'> = {
      id,
      type: 'anomaly',
      description: `Discovery based on ${anomaly.type}: ${anomaly.description}`,
      significance: anomaly.score,
      relatedAnomaly: anomaly.id,
      evidence: [{
        id: `EV-${Date.now()}`,
        type: 'computational',
        description: 'Detected through automated exploration',
        strength: anomaly.confidence,
        reproducible: true
      }],
      status: 'preliminary',
      createdAt: new Date()
    };

    return {
      ...discovery,
      hash: HashVerifier.hash(JSON.stringify(discovery))
    };
  }

  /**
   * Seeded random number generator
   */
  private seededRandom(seed: number): () => number {
    return () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
  }

  /**
   * Get all exploration paths
   */
  getAllPaths(): ExplorationPath[] {
    return Array.from(this.paths.values());
  }

  /**
   * Get all discoveries
   */
  getAllDiscoveries(): Discovery[] {
    return Array.from(this.discoveries.values());
  }

  /**
   * Get path by ID
   */
  getPath(id: string): ExplorationPath | undefined {
    return this.paths.get(id);
  }

  /**
   * Get discovery by ID
   */
  getDiscovery(id: string): Discovery | undefined {
    return this.discoveries.get(id);
  }

  /**
   * Get hash for verification
   */
  getHash(): string {
    return HashVerifier.hash(`AutoExplorer-${this.paths.size}-${this.discoveries.size}`);
  }

  /**
   * Export proof chain
   */
  exportProofChain(): {
    strategies: string[];
    paths: ExplorationPath[];
    discoveries: Discovery[];
  } {
    return {
      strategies: Array.from(this.strategies.keys()),
      paths: Array.from(this.paths.values()),
      discoveries: Array.from(this.discoveries.values())
    };
  }
}

// ============================================================================
// AUTO EXPLORER FACTORY
// ============================================================================

export class AutoExplorerFactory {
  /**
   * Create default explorer
   */
  static default(): AutoExplorer {
    return new AutoExplorer();
  }

  /**
   * Create explorer with specific seed
   */
  static withSeed(seed: number): AutoExplorer {
    return new AutoExplorer(undefined, undefined, undefined, seed);
  }

  /**
   * Create explorer with custom components
   */
  static custom(
    hypothesisEngine: HypothesisEngine,
    anomalyDetector: AnomalyDetector
  ): AutoExplorer {
    return new AutoExplorer(hypothesisEngine, anomalyDetector);
  }
}
