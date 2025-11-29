/**
 * PropulsionSystem - PRD-13 Phase 13.2
 * Propulsion system designs based on anti-gravity mechanisms
 */

import { Logger } from '../core/logger/Logger';
import { HashVerifier } from '../core/logger/HashVerifier';

// Propulsion types
export type PropulsionType = 
  | 'gravity_drive'
  | 'warp_drive'
  | 'em_drive'
  | 'ion_propulsion'
  | 'photon_sail'
  | 'antimatter_engine';

// Thrust profile interface
export interface ThrustProfile {
  id: string;
  type: PropulsionType;
  name: string;
  maxThrust: number; // Newtons
  specificImpulse: number; // seconds
  efficiency: number; // 0-1
  powerRequirement: number; // Watts
  fuelConsumption: number; // kg/s
  operationalRange: { min: number; max: number };
  constraints: string[];
  hash: string;
}

// Propulsion efficiency analysis
export interface PropulsionEfficiency {
  type: PropulsionType;
  thrustToWeight: number;
  energyEfficiency: number;
  massEfficiency: number;
  overallScore: number;
  recommendations: string[];
  hash: string;
}

// Mission propulsion requirements
export interface PropulsionRequirements {
  missionType: string;
  deltaV: number; // m/s
  payloadMass: number; // kg
  missionDuration: number; // seconds
  recommendedSystems: PropulsionType[];
  hash: string;
}

/**
 * PropulsionSystem - Main propulsion system class
 */
export class PropulsionSystem {
  private logger: Logger;
  private profiles: Map<string, ThrustProfile> = new Map();
  private profileCount: number = 0;

  constructor() {
    this.logger = Logger.getInstance();
    this.initializeProfiles();
  }

  private initializeProfiles(): void {
    // Gravity Drive
    this.createProfile({
      type: 'gravity_drive',
      name: 'Anti-Gravity Propulsion Drive',
      maxThrust: 1e6,
      specificImpulse: 1e6,
      efficiency: 0.3,
      powerRequirement: 1e12,
      fuelConsumption: 0,
      operationalRange: { min: 0, max: 1e12 },
      constraints: ['Requires anti-gravity field generator', 'Theoretical technology']
    });

    // Warp Drive
    this.createProfile({
      type: 'warp_drive',
      name: 'Alcubierre Warp Drive',
      maxThrust: 0, // Warp doesn't use thrust
      specificImpulse: Infinity,
      efficiency: 0.01,
      powerRequirement: 1e40,
      fuelConsumption: 0,
      operationalRange: { min: 0, max: 1e20 },
      constraints: ['Requires exotic matter', 'Extreme energy requirements']
    });

    // EM Drive (theoretical)
    this.createProfile({
      type: 'em_drive',
      name: 'Electromagnetic Resonance Drive',
      maxThrust: 0.1,
      specificImpulse: 1e8,
      efficiency: 0.001,
      powerRequirement: 1e6,
      fuelConsumption: 0,
      operationalRange: { min: 0, max: 1e6 },
      constraints: ['Controversial physics', 'Low thrust']
    });

    // Ion Propulsion
    this.createProfile({
      type: 'ion_propulsion',
      name: 'Advanced Ion Engine',
      maxThrust: 10,
      specificImpulse: 10000,
      efficiency: 0.8,
      powerRequirement: 1e5,
      fuelConsumption: 1e-4,
      operationalRange: { min: 0, max: 1e9 },
      constraints: ['Low thrust', 'Long acceleration times']
    });

    // Photon Sail
    this.createProfile({
      type: 'photon_sail',
      name: 'Laser-Pushed Photon Sail',
      maxThrust: 0.01,
      specificImpulse: 3e7,
      efficiency: 0.9,
      powerRequirement: 1e11,
      fuelConsumption: 0,
      operationalRange: { min: 0, max: 1e13 },
      constraints: ['Requires external power source', 'One-way propulsion']
    });

    // Antimatter Engine
    this.createProfile({
      type: 'antimatter_engine',
      name: 'Antimatter Annihilation Engine',
      maxThrust: 1e5,
      specificImpulse: 1e7,
      efficiency: 0.5,
      powerRequirement: 0,
      fuelConsumption: 1e-6,
      operationalRange: { min: 0, max: 1e15 },
      constraints: ['Antimatter production', 'Containment challenges']
    });
  }

  private createProfile(config: Omit<ThrustProfile, 'id' | 'hash'>): void {
    const id = `prop-${++this.profileCount}`;
    
    const profile: ThrustProfile = {
      id,
      ...config,
      hash: ''
    };
    profile.hash = HashVerifier.hash(JSON.stringify({ ...profile, hash: '' }));

    this.profiles.set(id, profile);

    this.logger.info('Propulsion profile created', {
      id,
      type: config.type,
      name: config.name,
      hash: profile.hash
    });
  }

  /**
   * Calculate thrust for given conditions
   */
  calculateThrust(profileId: string, power: number, conditions: Record<string, number>): number {
    const profile = this.profiles.get(profileId);
    if (!profile) return 0;

    const powerRatio = Math.min(1, power / profile.powerRequirement);
    return profile.maxThrust * powerRatio * profile.efficiency;
  }

  /**
   * Analyze propulsion efficiency
   */
  analyzeEfficiency(profileId: string, vehicleMass: number): PropulsionEfficiency | null {
    const profile = this.profiles.get(profileId);
    if (!profile) return null;

    const thrustToWeight = profile.maxThrust / (vehicleMass * 9.81);
    const energyEfficiency = profile.efficiency;
    const massEfficiency = profile.fuelConsumption === 0 ? 1 : 
      profile.maxThrust / (profile.fuelConsumption * profile.specificImpulse * 9.81);
    
    const overallScore = (thrustToWeight * 0.3 + energyEfficiency * 0.4 + massEfficiency * 0.3);

    const recommendations: string[] = [];
    if (thrustToWeight < 0.1) recommendations.push('Consider higher thrust system for rapid maneuvers');
    if (energyEfficiency < 0.5) recommendations.push('Energy efficiency could be improved');
    if (massEfficiency < 0.5) recommendations.push('Consider propellantless alternatives');

    const efficiency: PropulsionEfficiency = {
      type: profile.type,
      thrustToWeight,
      energyEfficiency,
      massEfficiency,
      overallScore,
      recommendations,
      hash: ''
    };
    efficiency.hash = HashVerifier.hash(JSON.stringify({ ...efficiency, hash: '' }));

    return efficiency;
  }

  /**
   * Get propulsion requirements for mission
   */
  getMissionRequirements(
    missionType: string,
    deltaV: number,
    payloadMass: number,
    missionDuration: number
  ): PropulsionRequirements {
    const recommendedSystems: PropulsionType[] = [];

    // Recommend based on delta-V
    if (deltaV < 1e4) {
      recommendedSystems.push('ion_propulsion');
    } else if (deltaV < 1e6) {
      recommendedSystems.push('antimatter_engine', 'ion_propulsion');
    } else if (deltaV < 1e8) {
      recommendedSystems.push('photon_sail', 'antimatter_engine');
    } else {
      recommendedSystems.push('warp_drive', 'gravity_drive');
    }

    const requirements: PropulsionRequirements = {
      missionType,
      deltaV,
      payloadMass,
      missionDuration,
      recommendedSystems,
      hash: ''
    };
    requirements.hash = HashVerifier.hash(JSON.stringify({ ...requirements, hash: '' }));

    return requirements;
  }

  /**
   * Get all profiles
   */
  getAllProfiles(): ThrustProfile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Get profile by ID
   */
  getProfile(id: string): ThrustProfile | undefined {
    return this.profiles.get(id);
  }

  /**
   * Get profiles by type
   */
  getProfilesByType(type: PropulsionType): ThrustProfile[] {
    return this.getAllProfiles().filter(p => p.type === type);
  }

  /**
   * Verify profile hash
   */
  verifyProfile(id: string): boolean {
    const profile = this.profiles.get(id);
    if (!profile) return false;

    const expectedHash = HashVerifier.hash(JSON.stringify({ ...profile, hash: '' }));
    return expectedHash === profile.hash;
  }

  /**
   * Get hash
   */
  getHash(): string {
    return HashVerifier.hash(JSON.stringify({
      profileCount: this.profiles.size
    }));
  }
}

/**
 * Factory for creating propulsion systems
 */
export class PropulsionSystemFactory {
  static createDefault(): PropulsionSystem {
    return new PropulsionSystem();
  }
}
