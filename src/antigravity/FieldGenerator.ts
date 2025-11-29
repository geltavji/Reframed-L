/**
 * FieldGenerator - PRD-13 Phase 13.3
 * Field generator mathematics for anti-gravity systems
 */

import { Logger } from '../core/logger/Logger';
import { HashVerifier } from '../core/logger/HashVerifier';

// Field types
export type FieldType = 
  | 'gravitational'
  | 'electromagnetic'
  | 'torsion'
  | 'scalar'
  | 'quantum_vacuum'
  | 'dark_energy';

// Field configuration interface
export interface FieldConfiguration {
  id: string;
  type: FieldType;
  name: string;
  strength: number;
  range: number; // meters
  shape: 'spherical' | 'cylindrical' | 'planar' | 'toroidal';
  powerInput: number; // Watts
  efficiency: number;
  stability: number; // 0-1
  hash: string;
}

// Stability analysis interface
export interface StabilityAnalysis {
  fieldId: string;
  isStable: boolean;
  stabilityScore: number;
  oscillationFrequency: number;
  dampingFactor: number;
  criticalPoints: CriticalPoint[];
  recommendations: string[];
  hash: string;
}

export interface CriticalPoint {
  position: { x: number; y: number; z: number };
  type: 'minimum' | 'maximum' | 'saddle';
  strength: number;
}

// Field interaction result
export interface FieldInteraction {
  fields: string[];
  resultantStrength: number;
  interactionType: 'constructive' | 'destructive' | 'neutral';
  energyExchange: number;
  hash: string;
}

/**
 * FieldGenerator - Main field generator class
 */
export class FieldGenerator {
  private logger: Logger;
  private configurations: Map<string, FieldConfiguration> = new Map();
  private configCount: number = 0;

  constructor() {
    this.logger = Logger.getInstance();
    this.initializeConfigurations();
  }

  private initializeConfigurations(): void {
    // Gravitational Field Nullifier
    this.createConfiguration({
      type: 'gravitational',
      name: 'Gravity Nullification Field',
      strength: 9.81,
      range: 100,
      shape: 'spherical',
      powerInput: 1e12,
      efficiency: 0.1,
      stability: 0.7
    });

    // EM Field Generator
    this.createConfiguration({
      type: 'electromagnetic',
      name: 'High-Frequency EM Field',
      strength: 1e6,
      range: 50,
      shape: 'toroidal',
      powerInput: 1e9,
      efficiency: 0.8,
      stability: 0.9
    });

    // Torsion Field Generator
    this.createConfiguration({
      type: 'torsion',
      name: 'Spacetime Torsion Generator',
      strength: 1e-10,
      range: 10,
      shape: 'cylindrical',
      powerInput: 1e15,
      efficiency: 0.01,
      stability: 0.3
    });

    // Scalar Field Generator
    this.createConfiguration({
      type: 'scalar',
      name: 'Scalar Field Emitter',
      strength: 1e-5,
      range: 1000,
      shape: 'spherical',
      powerInput: 1e10,
      efficiency: 0.05,
      stability: 0.5
    });

    // Quantum Vacuum Manipulator
    this.createConfiguration({
      type: 'quantum_vacuum',
      name: 'Casimir Effect Generator',
      strength: 1e-8,
      range: 1e-6,
      shape: 'planar',
      powerInput: 1e3,
      efficiency: 0.6,
      stability: 0.95
    });

    // Dark Energy Coupler
    this.createConfiguration({
      type: 'dark_energy',
      name: 'Dark Energy Coupling Field',
      strength: 1e-52,
      range: 1e6,
      shape: 'spherical',
      powerInput: 1e30,
      efficiency: 0.001,
      stability: 0.1
    });
  }

  private createConfiguration(config: Omit<FieldConfiguration, 'id' | 'hash'>): void {
    const id = `field-${++this.configCount}`;
    
    const fieldConfig: FieldConfiguration = {
      id,
      ...config,
      hash: ''
    };
    fieldConfig.hash = HashVerifier.hash(JSON.stringify({ ...fieldConfig, hash: '' }));

    this.configurations.set(id, fieldConfig);

    this.logger.info('Field configuration created', {
      id,
      type: config.type,
      name: config.name,
      hash: fieldConfig.hash
    });
  }

  /**
   * Calculate field strength at distance
   */
  calculateFieldStrength(configId: string, distance: number): number {
    const config = this.configurations.get(configId);
    if (!config) return 0;

    if (distance > config.range) return 0;
    
    // Inverse square law for spherical, linear for planar
    switch (config.shape) {
      case 'spherical':
        return config.strength * Math.pow(config.range / Math.max(distance, 1), 2);
      case 'planar':
        return config.strength * (1 - distance / config.range);
      case 'cylindrical':
        return config.strength * (config.range / Math.max(distance, 1));
      case 'toroidal':
        const r = config.range / 4;
        return config.strength * Math.exp(-Math.pow(distance - r, 2) / (2 * r * r));
      default:
        return config.strength;
    }
  }

  /**
   * Analyze field stability
   */
  analyzeStability(configId: string): StabilityAnalysis | null {
    const config = this.configurations.get(configId);
    if (!config) return null;

    const isStable = config.stability > 0.5;
    const oscillationFrequency = 1e6 * (1 - config.stability);
    const dampingFactor = config.efficiency * config.stability;

    const criticalPoints: CriticalPoint[] = [
      { position: { x: 0, y: 0, z: 0 }, type: 'minimum', strength: config.strength },
      { position: { x: config.range, y: 0, z: 0 }, type: 'saddle', strength: 0 }
    ];

    const recommendations: string[] = [];
    if (!isStable) recommendations.push('Add damping mechanisms');
    if (config.efficiency < 0.5) recommendations.push('Improve power coupling');
    if (oscillationFrequency > 1e5) recommendations.push('Add frequency stabilization');

    const analysis: StabilityAnalysis = {
      fieldId: configId,
      isStable,
      stabilityScore: config.stability,
      oscillationFrequency,
      dampingFactor,
      criticalPoints,
      recommendations,
      hash: ''
    };
    analysis.hash = HashVerifier.hash(JSON.stringify({ ...analysis, hash: '' }));

    return analysis;
  }

  /**
   * Calculate field interaction
   */
  calculateInteraction(configId1: string, configId2: string): FieldInteraction | null {
    const config1 = this.configurations.get(configId1);
    const config2 = this.configurations.get(configId2);
    if (!config1 || !config2) return null;

    // Determine interaction type based on field types
    let interactionType: 'constructive' | 'destructive' | 'neutral';
    let resultantStrength: number;
    let energyExchange: number;

    if (config1.type === config2.type) {
      interactionType = 'constructive';
      resultantStrength = config1.strength + config2.strength;
      energyExchange = 0;
    } else if (
      (config1.type === 'gravitational' && config2.type === 'electromagnetic') ||
      (config1.type === 'electromagnetic' && config2.type === 'gravitational')
    ) {
      interactionType = 'neutral';
      resultantStrength = Math.sqrt(config1.strength ** 2 + config2.strength ** 2);
      energyExchange = 0;
    } else {
      interactionType = 'destructive';
      resultantStrength = Math.abs(config1.strength - config2.strength);
      energyExchange = Math.min(config1.powerInput, config2.powerInput) * 0.1;
    }

    const interaction: FieldInteraction = {
      fields: [configId1, configId2],
      resultantStrength,
      interactionType,
      energyExchange,
      hash: ''
    };
    interaction.hash = HashVerifier.hash(JSON.stringify({ ...interaction, hash: '' }));

    return interaction;
  }

  /**
   * Get all configurations
   */
  getAllConfigurations(): FieldConfiguration[] {
    return Array.from(this.configurations.values());
  }

  /**
   * Get configuration by ID
   */
  getConfiguration(id: string): FieldConfiguration | undefined {
    return this.configurations.get(id);
  }

  /**
   * Get configurations by type
   */
  getConfigurationsByType(type: FieldType): FieldConfiguration[] {
    return this.getAllConfigurations().filter(c => c.type === type);
  }

  /**
   * Verify configuration hash
   */
  verifyConfiguration(id: string): boolean {
    const config = this.configurations.get(id);
    if (!config) return false;

    const expectedHash = HashVerifier.hash(JSON.stringify({ ...config, hash: '' }));
    return expectedHash === config.hash;
  }

  /**
   * Get hash
   */
  getHash(): string {
    return HashVerifier.hash(JSON.stringify({
      configCount: this.configurations.size
    }));
  }
}

/**
 * Factory for creating field generators
 */
export class FieldGeneratorFactory {
  static createDefault(): FieldGenerator {
    return new FieldGenerator();
  }
}
