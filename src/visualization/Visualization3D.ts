/**
 * Visualization3D - PRD-17 Phase 17.3
 * 3D visualization for spacetime, quantum states, and fields
 */

import { Logger } from '../core/logger/Logger';
import { HashVerifier } from '../core/logger/HashVerifier';

// 3D viewer types
export type ViewerType = 
  | 'spacetime'
  | 'quantum_state'
  | 'field'
  | 'trajectory'
  | 'wavefunction'
  | 'lattice';

// Spacetime viewer config
export interface SpacetimeViewer {
  id: string;
  name: string;
  dimensions: number;
  timeRange: { min: number; max: number };
  spaceRange: { x: [number, number]; y: [number, number]; z: [number, number] };
  gridResolution: number;
  renderMode: 'wireframe' | 'solid' | 'transparent';
  colorScheme: string;
  hash: string;
}

// Quantum state viewer
export interface QuantumStateViewer {
  id: string;
  name: string;
  stateVector: { real: number; imaginary: number }[];
  basis: string;
  blochSphere: { theta: number; phi: number } | null;
  probabilityDistribution: number[];
  hash: string;
}

// Field viewer
export interface FieldViewer {
  id: string;
  name: string;
  fieldType: string;
  resolution: { x: number; y: number; z: number };
  values: number[][][];
  vectorField: boolean;
  colorMap: string;
  hash: string;
}

// 3D scene config
export interface Scene3D {
  id: string;
  viewerType: ViewerType;
  camera: CameraConfig;
  lighting: LightingConfig;
  annotations: Annotation3D[];
  hash: string;
}

export interface CameraConfig {
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  fov: number;
  near: number;
  far: number;
}

export interface LightingConfig {
  ambient: number;
  directional: { intensity: number; position: { x: number; y: number; z: number } };
  shadows: boolean;
}

export interface Annotation3D {
  position: { x: number; y: number; z: number };
  text: string;
  style: string;
}

/**
 * Visualization3D - Main 3D visualization class
 */
export class Visualization3D {
  private logger: Logger;
  private spacetimeViewers: Map<string, SpacetimeViewer> = new Map();
  private quantumViewers: Map<string, QuantumStateViewer> = new Map();
  private fieldViewers: Map<string, FieldViewer> = new Map();
  private viewerCount: number = 0;

  constructor() {
    this.logger = Logger.getInstance();
  }

  /**
   * Create spacetime viewer
   */
  createSpacetimeViewer(config: {
    name: string;
    dimensions: number;
    timeRange: { min: number; max: number };
  }): SpacetimeViewer {
    const id = `st-viewer-${++this.viewerCount}`;
    
    const viewer: SpacetimeViewer = {
      id,
      name: config.name,
      dimensions: config.dimensions,
      timeRange: config.timeRange,
      spaceRange: { x: [-10, 10], y: [-10, 10], z: [-10, 10] },
      gridResolution: 50,
      renderMode: 'wireframe',
      colorScheme: 'viridis',
      hash: ''
    };
    viewer.hash = HashVerifier.hash(JSON.stringify({ ...viewer, hash: '' }));

    this.spacetimeViewers.set(id, viewer);

    this.logger.info('Spacetime viewer created', {
      id,
      name: config.name,
      dimensions: config.dimensions,
      hash: viewer.hash
    });

    return viewer;
  }

  /**
   * Create quantum state viewer
   */
  createQuantumStateViewer(config: {
    name: string;
    stateVector: { real: number; imaginary: number }[];
    basis: string;
  }): QuantumStateViewer {
    const id = `qs-viewer-${++this.viewerCount}`;
    
    // Calculate probability distribution
    const probabilityDistribution = config.stateVector.map(c => 
      c.real * c.real + c.imaginary * c.imaginary
    );

    // Calculate Bloch sphere coordinates for 2-level systems
    let blochSphere = null;
    if (config.stateVector.length === 2) {
      const [a, b] = config.stateVector;
      const theta = 2 * Math.acos(Math.sqrt(a.real * a.real + a.imaginary * a.imaginary));
      const phi = Math.atan2(b.imaginary, b.real) - Math.atan2(a.imaginary, a.real);
      blochSphere = { theta, phi };
    }

    const viewer: QuantumStateViewer = {
      id,
      name: config.name,
      stateVector: config.stateVector,
      basis: config.basis,
      blochSphere,
      probabilityDistribution,
      hash: ''
    };
    viewer.hash = HashVerifier.hash(JSON.stringify({ ...viewer, hash: '' }));

    this.quantumViewers.set(id, viewer);

    this.logger.info('Quantum state viewer created', {
      id,
      name: config.name,
      stateSize: config.stateVector.length,
      hash: viewer.hash
    });

    return viewer;
  }

  /**
   * Create field viewer
   */
  createFieldViewer(config: {
    name: string;
    fieldType: string;
    resolution: { x: number; y: number; z: number };
    vectorField: boolean;
  }): FieldViewer {
    const id = `field-viewer-${++this.viewerCount}`;
    
    // Generate sample field values
    const values: number[][][] = [];
    for (let i = 0; i < config.resolution.x; i++) {
      values[i] = [];
      for (let j = 0; j < config.resolution.y; j++) {
        values[i][j] = [];
        for (let k = 0; k < config.resolution.z; k++) {
          // Sample field - could be customized
          values[i][j][k] = Math.sin(i * 0.1) * Math.cos(j * 0.1) * Math.sin(k * 0.1);
        }
      }
    }

    const viewer: FieldViewer = {
      id,
      name: config.name,
      fieldType: config.fieldType,
      resolution: config.resolution,
      values,
      vectorField: config.vectorField,
      colorMap: 'coolwarm',
      hash: ''
    };
    viewer.hash = HashVerifier.hash(JSON.stringify({ ...viewer, hash: '' }));

    this.fieldViewers.set(id, viewer);

    this.logger.info('Field viewer created', {
      id,
      name: config.name,
      fieldType: config.fieldType,
      hash: viewer.hash
    });

    return viewer;
  }

  /**
   * Generate 3D scene configuration
   */
  generateScene(viewerId: string, viewerType: ViewerType): Scene3D {
    const id = `scene-${Date.now()}`;
    
    const scene: Scene3D = {
      id,
      viewerType,
      camera: {
        position: { x: 20, y: 20, z: 20 },
        target: { x: 0, y: 0, z: 0 },
        fov: 60,
        near: 0.1,
        far: 1000
      },
      lighting: {
        ambient: 0.3,
        directional: { intensity: 0.7, position: { x: 10, y: 10, z: 10 } },
        shadows: true
      },
      annotations: [],
      hash: ''
    };
    scene.hash = HashVerifier.hash(JSON.stringify({ ...scene, hash: '' }));

    return scene;
  }

  /**
   * Get all spacetime viewers
   */
  getAllSpacetimeViewers(): SpacetimeViewer[] {
    return Array.from(this.spacetimeViewers.values());
  }

  /**
   * Get all quantum viewers
   */
  getAllQuantumViewers(): QuantumStateViewer[] {
    return Array.from(this.quantumViewers.values());
  }

  /**
   * Get all field viewers
   */
  getAllFieldViewers(): FieldViewer[] {
    return Array.from(this.fieldViewers.values());
  }

  /**
   * Get hash
   */
  getHash(): string {
    return HashVerifier.hash(JSON.stringify({
      spacetimeCount: this.spacetimeViewers.size,
      quantumCount: this.quantumViewers.size,
      fieldCount: this.fieldViewers.size
    }));
  }
}

/**
 * Factory for creating Visualization3D
 */
export class Visualization3DFactory {
  static createDefault(): Visualization3D {
    return new Visualization3D();
  }
}
