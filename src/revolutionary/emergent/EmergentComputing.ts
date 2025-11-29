/**
 * Qlaws Ham - Emergent Computing Module (M06.05)
 * 
 * Models computation that emerges from physical processes.
 * Explores analog computing, DNA computing, quantum annealing,
 * and natural optimization processes.
 * 
 * @module EmergentComputing
 * @version 1.0.0
 * @dependencies Logger (M01.01), ComplexityAnalyzer (M06.01)
 */

import * as crypto from 'crypto';
import { Logger, LogLevel } from '../../core/logger/Logger';

/**
 * Types of emergent computation
 */
export enum EmergentType {
  SOAP_BUBBLE = 'Soap Bubble Network',
  DNA_COMPUTING = 'DNA Computing',
  QUANTUM_ANNEALING = 'Quantum Annealing',
  NEUROMORPHIC = 'Neuromorphic Computing',
  OPTICAL_COMPUTING = 'Optical Computing',
  REACTION_DIFFUSION = 'Reaction-Diffusion',
  SLIME_MOLD = 'Slime Mold Optimization',
  ANT_COLONY = 'Ant Colony Optimization',
  GRAVITY_ANALOG = 'Gravitational Analog'
}

/**
 * Problem types suitable for emergent computation
 */
export enum ProblemType {
  STEINER_TREE = 'Steiner Tree',
  SHORTEST_PATH = 'Shortest Path',
  TRAVELING_SALESMAN = 'Traveling Salesman',
  GRAPH_COLORING = 'Graph Coloring',
  SAT = 'Boolean Satisfiability',
  MAX_CUT = 'Maximum Cut',
  OPTIMIZATION = 'General Optimization',
  PATTERN_RECOGNITION = 'Pattern Recognition'
}

/**
 * Interface for emergent computation result
 */
export interface EmergentResult {
  type: EmergentType;
  problem: ProblemType;
  solution: unknown;
  quality: number;
  computationTime: number;
  energyUsed: number;
  isOptimal: boolean;
  confidence: number;
  hash: string;
}

/**
 * Interface for physical system state
 */
export interface PhysicalState {
  energy: number;
  entropy: number;
  temperature: number;
  isEquilibrium: boolean;
  configuration: unknown;
  hash: string;
}

/**
 * Interface for optimization landscape
 */
export interface OptimizationLandscape {
  dimensions: number;
  localMinima: number[];
  globalMinimum: number;
  barrierHeights: number[];
  hash: string;
}

/**
 * Interface for annealing schedule
 */
export interface AnnealingSchedule {
  initialTemperature: number;
  finalTemperature: number;
  coolingRate: number;
  steps: number;
  schedule: 'linear' | 'exponential' | 'logarithmic';
}

/**
 * SoapBubbleComputer - Models soap film computation for Steiner trees
 */
export class SoapBubbleComputer {
  private static logger: Logger | null = null;
  private solutions: EmergentResult[] = [];

  /**
   * Set logger
   */
  public static setLogger(logger: Logger): void {
    SoapBubbleComputer.logger = logger;
  }

  /**
   * Solve Steiner tree problem using soap bubble model
   * Soap films naturally minimize total surface area
   */
  public solveSteinerTree(points: [number, number][]): EmergentResult {
    const startTime = Date.now();
    
    // Physical principle: soap film minimizes total length
    // Simulate by finding minimum spanning tree and adding Steiner points
    
    const solution = this.findMinimalNetwork(points);
    const totalLength = this.calculateTotalLength(solution.edges);
    
    // Quality: ratio to optimal (Steiner ratio theorem: worst case sqrt(3)/2)
    const mstLength = this.calculateMSTLength(points);
    const quality = mstLength / Math.max(totalLength, 1e-10);
    
    const result: EmergentResult = {
      type: EmergentType.SOAP_BUBBLE,
      problem: ProblemType.STEINER_TREE,
      solution,
      quality: Math.min(quality, 1.0),
      computationTime: Date.now() - startTime,
      energyUsed: this.estimateSurfaceEnergy(totalLength),
      isOptimal: quality > 0.99,
      confidence: 0.9,
      hash: ''
    };
    result.hash = this.hashResult(result);

    this.solutions.push(result);

    if (SoapBubbleComputer.logger) {
      SoapBubbleComputer.logger.log(LogLevel.DEBUG, '[SoapBubble] Solved Steiner tree', {
        points: points.length,
        totalLength,
        quality
      });
    }

    return result;
  }

  /**
   * Find minimal network using simplified Steiner heuristic
   */
  private findMinimalNetwork(points: [number, number][]): { 
    terminals: [number, number][]; 
    steinerPoints: [number, number][]; 
    edges: [[number, number], [number, number]][];
  } {
    const steinerPoints: [number, number][] = [];
    const edges: [[number, number], [number, number]][] = [];
    
    if (points.length <= 2) {
      if (points.length === 2) {
        edges.push([points[0], points[1]]);
      }
      return { terminals: points, steinerPoints, edges };
    }
    
    // For 3 points, optimal Steiner point is at Fermat point if all angles < 120°
    if (points.length === 3) {
      const fermat = this.findFermatPoint(points[0], points[1], points[2]);
      if (fermat) {
        steinerPoints.push(fermat);
        edges.push([points[0], fermat]);
        edges.push([points[1], fermat]);
        edges.push([points[2], fermat]);
      } else {
        // Use MST
        edges.push([points[0], points[1]]);
        edges.push([points[1], points[2]]);
      }
      return { terminals: points, steinerPoints, edges };
    }
    
    // For more points, use MST as approximation
    const mstEdges = this.findMST(points);
    for (const [i, j] of mstEdges) {
      edges.push([points[i], points[j]]);
    }
    
    return { terminals: points, steinerPoints, edges };
  }

  /**
   * Find Fermat point of triangle using Weiszfeld's algorithm
   * The Fermat point minimizes the sum of distances to the three vertices.
   * If any angle is >= 120°, the obtuse vertex is the optimal point.
   */
  private findFermatPoint(
    a: [number, number], 
    b: [number, number], 
    c: [number, number]
  ): [number, number] | null {
    // Check if any angle >= 120°
    const angleA = this.calculateAngle(b, a, c);
    const angleB = this.calculateAngle(a, b, c);
    const angleC = this.calculateAngle(a, c, b);
    
    if (angleA >= 120 || angleB >= 120 || angleC >= 120) {
      return null; // No Fermat point improves on MST
    }
    
    // Use Weiszfeld's algorithm to find Fermat point
    // Start from centroid as initial guess
    let x = (a[0] + b[0] + c[0]) / 3;
    let y = (a[1] + b[1] + c[1]) / 3;
    
    const points = [a, b, c];
    const maxIterations = 100;
    const tolerance = 1e-10;
    
    for (let iter = 0; iter < maxIterations; iter++) {
      let numeratorX = 0;
      let numeratorY = 0;
      let denominator = 0;
      
      for (const p of points) {
        const dist = Math.sqrt((x - p[0]) ** 2 + (y - p[1]) ** 2);
        if (dist < tolerance) {
          // Already at one of the vertices
          continue;
        }
        const weight = 1 / dist;
        numeratorX += p[0] * weight;
        numeratorY += p[1] * weight;
        denominator += weight;
      }
      
      if (denominator === 0) break;
      
      const newX = numeratorX / denominator;
      const newY = numeratorY / denominator;
      
      // Check convergence
      if (Math.abs(newX - x) < tolerance && Math.abs(newY - y) < tolerance) {
        break;
      }
      
      x = newX;
      y = newY;
    }
    
    return [x, y];
  }

  /**
   * Calculate angle at vertex v in triangle u-v-w
   */
  private calculateAngle(
    u: [number, number], 
    v: [number, number], 
    w: [number, number]
  ): number {
    const uv = [u[0] - v[0], u[1] - v[1]];
    const wv = [w[0] - v[0], w[1] - v[1]];
    
    const dot = uv[0] * wv[0] + uv[1] * wv[1];
    const magU = Math.sqrt(uv[0] * uv[0] + uv[1] * uv[1]);
    const magW = Math.sqrt(wv[0] * wv[0] + wv[1] * wv[1]);
    
    return Math.acos(dot / (magU * magW)) * 180 / Math.PI;
  }

  /**
   * Find MST using Prim's algorithm
   */
  private findMST(points: [number, number][]): [number, number][] {
    const n = points.length;
    const inMST = new Array(n).fill(false);
    const minDist = new Array(n).fill(Infinity);
    const parent = new Array(n).fill(-1);
    const edges: [number, number][] = [];
    
    minDist[0] = 0;
    
    for (let count = 0; count < n; count++) {
      // Find minimum distance vertex not in MST
      let u = -1;
      for (let i = 0; i < n; i++) {
        if (!inMST[i] && (u === -1 || minDist[i] < minDist[u])) {
          u = i;
        }
      }
      
      inMST[u] = true;
      
      if (parent[u] !== -1) {
        edges.push([parent[u], u]);
      }
      
      // Update distances
      for (let v = 0; v < n; v++) {
        if (!inMST[v]) {
          const dist = this.distance(points[u], points[v]);
          if (dist < minDist[v]) {
            minDist[v] = dist;
            parent[v] = u;
          }
        }
      }
    }
    
    return edges;
  }

  /**
   * Calculate distance between two points
   */
  private distance(a: [number, number], b: [number, number]): number {
    return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
  }

  /**
   * Calculate total length of edges
   */
  private calculateTotalLength(edges: [[number, number], [number, number]][]): number {
    return edges.reduce((sum, [a, b]) => sum + this.distance(a, b), 0);
  }

  /**
   * Calculate MST length
   */
  private calculateMSTLength(points: [number, number][]): number {
    const mstEdges = this.findMST(points);
    return mstEdges.reduce((sum, [i, j]) => sum + this.distance(points[i], points[j]), 0);
  }

  /**
   * Estimate surface energy
   */
  private estimateSurfaceEnergy(length: number): number {
    // Surface tension of soap film ≈ 0.025 N/m
    const surfaceTension = 0.025;
    // Energy = 2 * tension * area (factor of 2 for two sides of film)
    // For linear network, use length * minimal width
    const minWidth = 1e-6; // 1 micrometer
    return 2 * surfaceTension * length * minWidth;
  }

  /**
   * Get all solutions
   */
  public getSolutions(): EmergentResult[] {
    return [...this.solutions];
  }

  /**
   * Clear solutions
   */
  public clear(): void {
    this.solutions = [];
  }

  /**
   * Hash result
   */
  private hashResult(result: Omit<EmergentResult, 'hash'>): string {
    const data = JSON.stringify({
      type: result.type,
      problem: result.problem,
      quality: result.quality,
      computationTime: result.computationTime
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

/**
 * SimulatedAnnealing - Classical annealing optimization
 */
export class SimulatedAnnealing {
  private static logger: Logger | null = null;
  private results: EmergentResult[] = [];

  /**
   * Set logger
   */
  public static setLogger(logger: Logger): void {
    SimulatedAnnealing.logger = logger;
  }

  /**
   * Run simulated annealing optimization
   */
  public optimize(
    energyFunction: (state: number[]) => number,
    initialState: number[],
    schedule: AnnealingSchedule
  ): EmergentResult {
    const startTime = Date.now();
    
    let currentState = [...initialState];
    let currentEnergy = energyFunction(currentState);
    let bestState = [...currentState];
    let bestEnergy = currentEnergy;
    
    let temperature = schedule.initialTemperature;
    let totalEnergyUsed = 0;
    
    for (let step = 0; step < schedule.steps; step++) {
      // Generate neighbor state
      const neighborState = this.generateNeighbor(currentState);
      const neighborEnergy = energyFunction(neighborState);
      totalEnergyUsed += Math.abs(neighborEnergy - currentEnergy);
      
      // Calculate acceptance probability
      const deltaE = neighborEnergy - currentEnergy;
      const acceptanceProbability = deltaE < 0 ? 1 : Math.exp(-deltaE / temperature);
      
      // Accept or reject
      if (Math.random() < acceptanceProbability) {
        currentState = neighborState;
        currentEnergy = neighborEnergy;
        
        if (currentEnergy < bestEnergy) {
          bestState = [...currentState];
          bestEnergy = currentEnergy;
        }
      }
      
      // Cool down
      temperature = this.cool(temperature, schedule, step);
    }
    
    const result: EmergentResult = {
      type: EmergentType.QUANTUM_ANNEALING,
      problem: ProblemType.OPTIMIZATION,
      solution: { state: bestState, energy: bestEnergy },
      quality: 1 / (1 + bestEnergy), // Higher quality for lower energy
      computationTime: Date.now() - startTime,
      energyUsed: totalEnergyUsed,
      isOptimal: bestEnergy < 1e-6,
      confidence: this.calculateConfidence(schedule),
      hash: ''
    };
    result.hash = this.hashResult(result);

    this.results.push(result);

    if (SimulatedAnnealing.logger) {
      SimulatedAnnealing.logger.log(LogLevel.DEBUG, '[SimulatedAnnealing] Optimization complete', {
        finalEnergy: bestEnergy,
        steps: schedule.steps
      });
    }

    return result;
  }

  /**
   * Generate neighbor state by small perturbation
   */
  private generateNeighbor(state: number[]): number[] {
    const neighbor = [...state];
    const index = Math.floor(Math.random() * state.length);
    neighbor[index] += (Math.random() - 0.5) * 0.1;
    return neighbor;
  }

  /**
   * Cool temperature according to schedule
   */
  private cool(temperature: number, schedule: AnnealingSchedule, step: number): number {
    const progress = step / schedule.steps;
    
    switch (schedule.schedule) {
      case 'linear':
        return schedule.initialTemperature - 
               (schedule.initialTemperature - schedule.finalTemperature) * progress;
      case 'exponential':
        return schedule.initialTemperature * Math.pow(schedule.coolingRate, step);
      case 'logarithmic':
        return schedule.initialTemperature / Math.log(2 + step);
      default:
        return temperature * schedule.coolingRate;
    }
  }

  /**
   * Calculate confidence based on schedule
   */
  private calculateConfidence(schedule: AnnealingSchedule): number {
    // More steps and slower cooling → higher confidence
    const stepsScore = Math.min(schedule.steps / 10000, 1);
    const coolingScore = schedule.coolingRate < 0.999 ? 0.5 : 0.9;
    return (stepsScore + coolingScore) / 2;
  }

  /**
   * Get results
   */
  public getResults(): EmergentResult[] {
    return [...this.results];
  }

  /**
   * Clear results
   */
  public clear(): void {
    this.results = [];
  }

  /**
   * Hash result
   */
  private hashResult(result: Omit<EmergentResult, 'hash'>): string {
    const data = JSON.stringify({
      type: result.type,
      quality: result.quality,
      computationTime: result.computationTime
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

/**
 * NatureInspiredOptimizer - Ant colony and similar algorithms
 */
export class NatureInspiredOptimizer {
  private static logger: Logger | null = null;
  private results: EmergentResult[] = [];

  /**
   * Set logger
   */
  public static setLogger(logger: Logger): void {
    NatureInspiredOptimizer.logger = logger;
  }

  /**
   * Solve TSP using ant colony optimization
   */
  public solveTSP(cities: [number, number][], iterations: number = 100): EmergentResult {
    const startTime = Date.now();
    const n = cities.length;
    
    if (n <= 1) {
      return this.createResult(EmergentType.ANT_COLONY, ProblemType.TRAVELING_SALESMAN,
        { tour: [0], length: 0 }, 1, 0, 0, true, 1);
    }
    
    // Initialize pheromones
    const pheromones: number[][] = Array(n).fill(null).map(() => Array(n).fill(1));
    const distances = this.computeDistances(cities);
    
    let bestTour: number[] = [];
    let bestLength = Infinity;
    
    const numAnts = Math.min(n, 20);
    const alpha = 1; // Pheromone importance
    const beta = 2; // Distance importance
    const evaporation = 0.5;
    const Q = 100;
    
    for (let iter = 0; iter < iterations; iter++) {
      const antTours: number[][] = [];
      const antLengths: number[] = [];
      
      // Each ant builds a tour
      for (let ant = 0; ant < numAnts; ant++) {
        const tour = this.buildTour(n, pheromones, distances, alpha, beta);
        const length = this.calculateTourLength(tour, distances);
        antTours.push(tour);
        antLengths.push(length);
        
        if (length < bestLength) {
          bestLength = length;
          bestTour = [...tour];
        }
      }
      
      // Evaporate pheromones
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          pheromones[i][j] *= (1 - evaporation);
        }
      }
      
      // Deposit pheromones
      for (let ant = 0; ant < numAnts; ant++) {
        const deposit = Q / antLengths[ant];
        for (let i = 0; i < n - 1; i++) {
          const from = antTours[ant][i];
          const to = antTours[ant][i + 1];
          pheromones[from][to] += deposit;
          pheromones[to][from] += deposit;
        }
      }
    }
    
    const result = this.createResult(
      EmergentType.ANT_COLONY,
      ProblemType.TRAVELING_SALESMAN,
      { tour: bestTour, length: bestLength },
      this.estimateQuality(bestLength, cities),
      Date.now() - startTime,
      iterations * numAnts,
      false, // Can't guarantee optimality
      Math.min(iterations / 100, 1)
    );

    this.results.push(result);

    if (NatureInspiredOptimizer.logger) {
      NatureInspiredOptimizer.logger.log(LogLevel.DEBUG, '[AntColony] TSP solved', {
        cities: n,
        bestLength,
        iterations
      });
    }

    return result;
  }

  /**
   * Compute distance matrix
   */
  private computeDistances(cities: [number, number][]): number[][] {
    const n = cities.length;
    const distances: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const d = Math.sqrt(
          (cities[i][0] - cities[j][0]) ** 2 +
          (cities[i][1] - cities[j][1]) ** 2
        );
        distances[i][j] = d;
        distances[j][i] = d;
      }
    }
    
    return distances;
  }

  /**
   * Build tour for one ant
   */
  private buildTour(
    n: number,
    pheromones: number[][],
    distances: number[][],
    alpha: number,
    beta: number
  ): number[] {
    const tour = [0];
    const visited = new Set([0]);
    
    while (tour.length < n) {
      const current = tour[tour.length - 1];
      const probabilities: number[] = [];
      let sum = 0;
      
      for (let next = 0; next < n; next++) {
        if (!visited.has(next)) {
          const pheromone = Math.pow(pheromones[current][next], alpha);
          const visibility = Math.pow(1 / Math.max(distances[current][next], 1e-10), beta);
          probabilities[next] = pheromone * visibility;
          sum += probabilities[next];
        } else {
          probabilities[next] = 0;
        }
      }
      
      // Roulette wheel selection
      let random = Math.random() * sum;
      let next = 0;
      for (let i = 0; i < n; i++) {
        random -= probabilities[i];
        if (random <= 0) {
          next = i;
          break;
        }
      }
      
      // Fallback: select first unvisited
      if (visited.has(next)) {
        for (let i = 0; i < n; i++) {
          if (!visited.has(i)) {
            next = i;
            break;
          }
        }
      }
      
      tour.push(next);
      visited.add(next);
    }
    
    return tour;
  }

  /**
   * Calculate tour length
   */
  private calculateTourLength(tour: number[], distances: number[][]): number {
    let length = 0;
    for (let i = 0; i < tour.length - 1; i++) {
      length += distances[tour[i]][tour[i + 1]];
    }
    length += distances[tour[tour.length - 1]][tour[0]]; // Return to start
    return length;
  }

  /**
   * Estimate quality of TSP solution
   */
  private estimateQuality(length: number, cities: [number, number][]): number {
    // Lower bound: 0 (unrealistic)
    // Use simple heuristic: compare to sum of minimum edges
    const n = cities.length;
    if (n <= 2) return 1;
    
    const distances = this.computeDistances(cities);
    let minEdgeSum = 0;
    for (let i = 0; i < n; i++) {
      let min1 = Infinity, min2 = Infinity;
      for (let j = 0; j < n; j++) {
        if (i !== j && distances[i][j] < min1) {
          min2 = min1;
          min1 = distances[i][j];
        } else if (i !== j && distances[i][j] < min2) {
          min2 = distances[i][j];
        }
      }
      minEdgeSum += min1 + min2;
    }
    const lowerBound = minEdgeSum / 2;
    
    return lowerBound / Math.max(length, 1e-10);
  }

  /**
   * Create result
   */
  private createResult(
    type: EmergentType,
    problem: ProblemType,
    solution: unknown,
    quality: number,
    computationTime: number,
    energyUsed: number,
    isOptimal: boolean,
    confidence: number
  ): EmergentResult {
    const result: EmergentResult = {
      type,
      problem,
      solution,
      quality: Math.min(quality, 1),
      computationTime,
      energyUsed,
      isOptimal,
      confidence,
      hash: ''
    };
    result.hash = crypto.createHash('sha256').update(JSON.stringify({
      type, quality, computationTime
    })).digest('hex');
    return result;
  }

  /**
   * Get results
   */
  public getResults(): EmergentResult[] {
    return [...this.results];
  }

  /**
   * Clear results
   */
  public clear(): void {
    this.results = [];
  }
}

/**
 * EmergentComputing - Main class for emergent computation
 */
export class EmergentComputing {
  private static logger: Logger | null = null;
  private soapBubble: SoapBubbleComputer;
  private annealing: SimulatedAnnealing;
  private natureInspired: NatureInspiredOptimizer;
  private allResults: EmergentResult[] = [];

  constructor() {
    this.soapBubble = new SoapBubbleComputer();
    this.annealing = new SimulatedAnnealing();
    this.natureInspired = new NatureInspiredOptimizer();
  }

  /**
   * Set logger
   */
  public static setLogger(logger: Logger): void {
    EmergentComputing.logger = logger;
    SoapBubbleComputer.setLogger(logger);
    SimulatedAnnealing.setLogger(logger);
    NatureInspiredOptimizer.setLogger(logger);
  }

  /**
   * Log message
   */
  private log(level: LogLevel, message: string, data?: unknown): void {
    if (EmergentComputing.logger) {
      EmergentComputing.logger.log(level, `[EmergentComputing] ${message}`, data);
    }
  }

  /**
   * Solve problem using most appropriate emergent method
   */
  public solve(problem: ProblemType, input: unknown): EmergentResult {
    this.log(LogLevel.DEBUG, `Solving ${problem}`, { input });

    let result: EmergentResult;

    switch (problem) {
      case ProblemType.STEINER_TREE:
        result = this.soapBubble.solveSteinerTree(input as [number, number][]);
        break;

      case ProblemType.TRAVELING_SALESMAN:
        result = this.natureInspired.solveTSP(input as [number, number][]);
        break;

      case ProblemType.OPTIMIZATION:
        const { energyFunction, initialState, schedule } = input as {
          energyFunction: (state: number[]) => number;
          initialState: number[];
          schedule: AnnealingSchedule;
        };
        result = this.annealing.optimize(energyFunction, initialState, schedule);
        break;

      default:
        // Default to annealing for unknown problems
        result = this.createDefaultResult(problem);
    }

    this.allResults.push(result);
    return result;
  }

  /**
   * Create default result for unsupported problems
   */
  private createDefaultResult(problem: ProblemType): EmergentResult {
    const result: EmergentResult = {
      type: EmergentType.REACTION_DIFFUSION,
      problem,
      solution: null,
      quality: 0,
      computationTime: 0,
      energyUsed: 0,
      isOptimal: false,
      confidence: 0,
      hash: ''
    };
    result.hash = crypto.createHash('sha256').update(JSON.stringify({ problem })).digest('hex');
    return result;
  }

  /**
   * Get soap bubble computer
   */
  public getSoapBubble(): SoapBubbleComputer {
    return this.soapBubble;
  }

  /**
   * Get simulated annealing
   */
  public getAnnealing(): SimulatedAnnealing {
    return this.annealing;
  }

  /**
   * Get nature-inspired optimizer
   */
  public getNatureInspired(): NatureInspiredOptimizer {
    return this.natureInspired;
  }

  /**
   * Get all results
   */
  public getAllResults(): EmergentResult[] {
    return [...this.allResults];
  }

  /**
   * Get statistics
   */
  public getStatistics(): {
    totalComputations: number;
    byType: Record<string, number>;
    byProblem: Record<string, number>;
    averageQuality: number;
    optimalCount: number;
  } {
    const byType: Record<string, number> = {};
    const byProblem: Record<string, number> = {};
    let totalQuality = 0;
    let optimalCount = 0;

    for (const result of this.allResults) {
      byType[result.type] = (byType[result.type] || 0) + 1;
      byProblem[result.problem] = (byProblem[result.problem] || 0) + 1;
      totalQuality += result.quality;
      if (result.isOptimal) optimalCount++;
    }

    return {
      totalComputations: this.allResults.length,
      byType,
      byProblem,
      averageQuality: this.allResults.length > 0 ? totalQuality / this.allResults.length : 0,
      optimalCount
    };
  }

  /**
   * Clear all data
   */
  public clear(): void {
    this.soapBubble.clear();
    this.annealing.clear();
    this.natureInspired.clear();
    this.allResults = [];
  }

  /**
   * Export to JSON
   */
  public exportToJson(): string {
    return JSON.stringify({
      results: this.allResults,
      statistics: this.getStatistics(),
      exportTimestamp: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Get proof chain hash
   */
  public getProofChainHash(): string {
    const data = JSON.stringify({
      results: this.allResults.map(r => r.hash)
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

/**
 * Factory for creating EmergentComputing instances
 */
export class EmergentComputingFactory {
  /**
   * Create a new EmergentComputing with logger
   */
  public static create(logger?: Logger): EmergentComputing {
    if (logger) {
      EmergentComputing.setLogger(logger);
    }
    return new EmergentComputing();
  }
}
