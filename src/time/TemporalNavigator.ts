/**
 * TemporalNavigator - PRD-14 Phase 14.2
 * Temporal coordinate systems and navigation for time travel
 */

import { Logger } from '../core/logger/Logger';
import { HashVerifier } from '../core/logger/HashVerifier';

// Temporal coordinate types
export type TemporalCoordinateSystem = 
  | 'absolute'
  | 'relative'
  | 'light_cone'
  | 'closed_timelike'
  | 'branching'
  | 'block_universe';

// Temporal coordinates interface
export interface TemporalCoordinates {
  id: string;
  system: TemporalCoordinateSystem;
  time: number; // seconds from reference
  referencePoint: string;
  spatialPosition: { x: number; y: number; z: number };
  worldlineIndex: number;
  uncertaintyRange: number;
  hash: string;
}

// Time trajectory
export interface TimeTrajectory {
  id: string;
  name: string;
  waypoints: TemporalWaypoint[];
  totalTemporalDisplacement: number;
  totalSpatialDisplacement: number;
  causalityPreserved: boolean;
  energyRequirement: number;
  feasibilityScore: number;
  hash: string;
}

export interface TemporalWaypoint {
  coordinates: TemporalCoordinates;
  arrivalMethod: 'continuous' | 'discontinuous' | 'wormhole';
  dwellDuration: number;
  actions: string[];
}

// Navigation result
export interface NavigationResult {
  success: boolean;
  trajectory: TimeTrajectory;
  warnings: string[];
  paradoxRisk: number;
  energyConsumed: number;
  hash: string;
}

/**
 * TemporalNavigator - Main temporal navigation class
 */
export class TemporalNavigator {
  private logger: Logger;
  private trajectories: Map<string, TimeTrajectory> = new Map();
  private trajectoryCount: number = 0;
  private referenceTime: number = Date.now() / 1000;

  constructor() {
    this.logger = Logger.getInstance();
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    // Short-range past jump
    this.createTrajectory({
      name: 'Local Past Jump (1 hour)',
      waypoints: [
        this.createWaypoint('present', 0, 'continuous'),
        this.createWaypoint('1 hour ago', -3600, 'discontinuous')
      ],
      energyRequirement: 1e15
    });

    // Future observation
    this.createTrajectory({
      name: 'Future Observation (1 day)',
      waypoints: [
        this.createWaypoint('present', 0, 'continuous'),
        this.createWaypoint('1 day future', 86400, 'discontinuous'),
        this.createWaypoint('return to present', 0, 'discontinuous')
      ],
      energyRequirement: 1e16
    });

    // Historical observation
    this.createTrajectory({
      name: 'Historical Observation (100 years)',
      waypoints: [
        this.createWaypoint('present', 0, 'continuous'),
        this.createWaypoint('100 years ago', -3.15e9, 'wormhole'),
        this.createWaypoint('return to present', 0, 'wormhole')
      ],
      energyRequirement: 1e25
    });

    // Deep past journey
    this.createTrajectory({
      name: 'Deep Past Journey (1 million years)',
      waypoints: [
        this.createWaypoint('present', 0, 'continuous'),
        this.createWaypoint('1 million years ago', -3.15e13, 'wormhole')
      ],
      energyRequirement: 1e35
    });

    // Far future exploration
    this.createTrajectory({
      name: 'Far Future Exploration (1000 years)',
      waypoints: [
        this.createWaypoint('present', 0, 'continuous'),
        this.createWaypoint('1000 years future', 3.15e10, 'wormhole')
      ],
      energyRequirement: 1e20
    });
  }

  private createWaypoint(name: string, temporalOffset: number, method: 'continuous' | 'discontinuous' | 'wormhole'): TemporalWaypoint {
    return {
      coordinates: {
        id: `coord-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        system: method === 'wormhole' ? 'closed_timelike' : 'relative',
        time: this.referenceTime + temporalOffset,
        referencePoint: name,
        spatialPosition: { x: 0, y: 0, z: 0 },
        worldlineIndex: 0,
        uncertaintyRange: Math.abs(temporalOffset) * 0.001,
        hash: ''
      },
      arrivalMethod: method,
      dwellDuration: 3600,
      actions: ['Observation', 'Data collection']
    };
  }

  private createTrajectory(config: { name: string; waypoints: TemporalWaypoint[]; energyRequirement: number }): void {
    const id = `ttraj-${++this.trajectoryCount}`;
    
    // Calculate total displacements
    let totalTemporal = 0;
    let totalSpatial = 0;
    for (let i = 1; i < config.waypoints.length; i++) {
      const prev = config.waypoints[i - 1].coordinates;
      const curr = config.waypoints[i].coordinates;
      totalTemporal += Math.abs(curr.time - prev.time);
      totalSpatial += Math.sqrt(
        Math.pow(curr.spatialPosition.x - prev.spatialPosition.x, 2) +
        Math.pow(curr.spatialPosition.y - prev.spatialPosition.y, 2) +
        Math.pow(curr.spatialPosition.z - prev.spatialPosition.z, 2)
      );
    }

    // Check causality preservation
    const causalityPreserved = this.checkCausality(config.waypoints);
    
    // Calculate feasibility
    const feasibilityScore = this.calculateFeasibility(totalTemporal, config.energyRequirement);

    const trajectory: TimeTrajectory = {
      id,
      name: config.name,
      waypoints: config.waypoints,
      totalTemporalDisplacement: totalTemporal,
      totalSpatialDisplacement: totalSpatial,
      causalityPreserved,
      energyRequirement: config.energyRequirement,
      feasibilityScore,
      hash: ''
    };
    trajectory.hash = HashVerifier.hash(JSON.stringify({ ...trajectory, hash: '' }));

    this.trajectories.set(id, trajectory);

    this.logger.info('Time trajectory created', {
      id,
      name: config.name,
      temporalDisplacement: totalTemporal,
      causalityPreserved,
      hash: trajectory.hash
    });
  }

  private checkCausality(waypoints: TemporalWaypoint[]): boolean {
    // Simple causality check - no backward time travel to before observer's birth
    for (const wp of waypoints) {
      if (wp.arrivalMethod === 'discontinuous' && wp.coordinates.time < this.referenceTime - 3.15e9) {
        return false; // More than 100 years in past is risky
      }
    }
    return true;
  }

  private calculateFeasibility(temporalDisplacement: number, energy: number): number {
    // Feasibility decreases with temporal displacement and energy
    const timeFactor = Math.exp(-temporalDisplacement / 1e10);
    const energyFactor = Math.exp(-Math.log10(energy) / 40);
    return Math.min(1, Math.max(0, timeFactor * energyFactor));
  }

  /**
   * Navigate to temporal coordinates
   */
  navigate(trajectoryId: string): NavigationResult | null {
    const trajectory = this.trajectories.get(trajectoryId);
    if (!trajectory) {
      this.logger.error('Trajectory not found', { trajectoryId });
      return null;
    }

    const warnings: string[] = [];
    if (!trajectory.causalityPreserved) {
      warnings.push('Causality violation risk detected');
    }
    if (trajectory.feasibilityScore < 0.1) {
      warnings.push('Very low feasibility - technology not currently available');
    }
    if (trajectory.energyRequirement > 1e20) {
      warnings.push('Energy requirement exceeds current civilization capacity');
    }

    const paradoxRisk = trajectory.causalityPreserved ? 0.1 : 0.8;

    const result: NavigationResult = {
      success: trajectory.feasibilityScore > 0.01,
      trajectory,
      warnings,
      paradoxRisk,
      energyConsumed: trajectory.energyRequirement,
      hash: ''
    };
    result.hash = HashVerifier.hash(JSON.stringify({ ...result, hash: '' }));

    this.logger.proof('Navigation result', {
      trajectoryId,
      success: result.success,
      paradoxRisk,
      hash: result.hash
    });

    return result;
  }

  /**
   * Calculate optimal trajectory between two times
   */
  calculateOptimalTrajectory(targetTime: number, spatialTarget: { x: number; y: number; z: number }): TimeTrajectory {
    const id = `ttraj-opt-${Date.now()}`;
    const temporalDisplacement = Math.abs(targetTime - this.referenceTime);
    
    // Determine best arrival method
    let method: 'continuous' | 'discontinuous' | 'wormhole' = 'continuous';
    let energyRequirement = 1e10;

    if (temporalDisplacement > 86400) {
      method = 'discontinuous';
      energyRequirement = 1e15 * Math.log10(temporalDisplacement);
    }
    if (temporalDisplacement > 3.15e7) {
      method = 'wormhole';
      energyRequirement = 1e20 * Math.log10(temporalDisplacement);
    }

    const waypoints: TemporalWaypoint[] = [
      this.createWaypoint('origin', 0, 'continuous'),
      {
        coordinates: {
          id: `coord-target-${Date.now()}`,
          system: method === 'wormhole' ? 'closed_timelike' : 'relative',
          time: targetTime,
          referencePoint: 'target',
          spatialPosition: spatialTarget,
          worldlineIndex: 0,
          uncertaintyRange: temporalDisplacement * 0.001,
          hash: ''
        },
        arrivalMethod: method,
        dwellDuration: 3600,
        actions: ['Mission objective']
      }
    ];

    const trajectory: TimeTrajectory = {
      id,
      name: 'Optimal Calculated Trajectory',
      waypoints,
      totalTemporalDisplacement: temporalDisplacement,
      totalSpatialDisplacement: Math.sqrt(spatialTarget.x ** 2 + spatialTarget.y ** 2 + spatialTarget.z ** 2),
      causalityPreserved: this.checkCausality(waypoints),
      energyRequirement,
      feasibilityScore: this.calculateFeasibility(temporalDisplacement, energyRequirement),
      hash: ''
    };
    trajectory.hash = HashVerifier.hash(JSON.stringify({ ...trajectory, hash: '' }));

    return trajectory;
  }

  /**
   * Get all trajectories
   */
  getAllTrajectories(): TimeTrajectory[] {
    return Array.from(this.trajectories.values());
  }

  /**
   * Get trajectory by ID
   */
  getTrajectory(id: string): TimeTrajectory | undefined {
    return this.trajectories.get(id);
  }

  /**
   * Verify trajectory hash
   */
  verifyTrajectory(id: string): boolean {
    const trajectory = this.trajectories.get(id);
    if (!trajectory) return false;

    const expectedHash = HashVerifier.hash(JSON.stringify({ ...trajectory, hash: '' }));
    return expectedHash === trajectory.hash;
  }

  /**
   * Get hash
   */
  getHash(): string {
    return HashVerifier.hash(JSON.stringify({
      trajectoryCount: this.trajectories.size,
      referenceTime: this.referenceTime
    }));
  }
}

/**
 * Factory for creating temporal navigators
 */
export class TemporalNavigatorFactory {
  static createDefault(): TemporalNavigator {
    return new TemporalNavigator();
  }
}
