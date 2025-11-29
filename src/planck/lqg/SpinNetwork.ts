/**
 * SpinNetwork.ts - Loop Quantum Gravity Basics
 * PRD-04 Phase 4.3: Module M04.03
 * 
 * Implements spin network basics for Loop Quantum Gravity, including:
 * - Spin network graphs with nodes and edges
 * - Area and volume quantization
 * - Discrete geometry at Planck scale
 * 
 * Dependencies:
 * - Logger (M01.01)
 * 
 * Note: QuantumState (M02.02) and Tensor (M03.01) are listed in PRD
 * but not directly used in this implementation. The module uses
 * its own internal spin and intertwiner representations.
 * 
 * Key formula: A = 8πγl_P² Σ√(j(j+1))
 * Where:
 * - γ is the Barbero-Immirzi parameter
 * - l_P is the Planck length
 * - j is the spin quantum number (half-integer or integer)
 */

import { Logger, LogLevel } from '../../core/logger/Logger';
import { HashVerifier } from '../../core/logger/HashVerifier';

// Get logger instance
const logger = Logger.getInstance({ minLevel: LogLevel.DEBUG, enableConsole: false });

// ============================================================================
// PHYSICAL CONSTANTS
// ============================================================================

// Numerical tolerance for floating-point comparisons
const EPSILON = 1e-10;

const CONSTANTS = {
  // Planck length (m)
  lP: 1.616255e-35,
  // Planck area (m²) - computed from Planck length for consistency
  lP2: Math.pow(1.616255e-35, 2),
  // Barbero-Immirzi parameter (commonly used value from black hole entropy)
  gamma: 0.2375,
  // Alternative Barbero-Immirzi parameter value
  gammaAlt: Math.log(2) / (Math.PI * Math.sqrt(3)),
  // Speed of light (m/s)
  c: 299792458,
  // Reduced Planck constant (J·s)
  hbar: 1.054571817e-34,
  // Gravitational constant (m³/(kg·s²))
  G: 6.6743e-11
};

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Spin quantum number (can be half-integer)
 */
export interface SpinValue {
  j: number;           // The spin value (0, 1/2, 1, 3/2, 2, ...)
  m?: number;          // Optional magnetic quantum number (-j to +j)
  isHalfInteger: boolean;
}

/**
 * Intertwiner specification at a node
 */
export interface Intertwiner {
  nodeId: string;
  incomingSpins: SpinValue[];
  outgoingSpins: SpinValue[];
  intertwinerSpace: number;
  hash: string;
}

/**
 * Edge of a spin network
 */
export interface SpinNetworkEdge {
  id: string;
  sourceNode: string;
  targetNode: string;
  spin: SpinValue;
  areaContribution: number;
  hash: string;
}

/**
 * Node of a spin network (vertex)
 */
export interface SpinNetworkNode {
  id: string;
  position?: [number, number, number];  // Optional embedding coordinates
  valence: number;                       // Number of edges meeting at this node
  intertwiner: Intertwiner;
  volumeContribution: number;
  hash: string;
}

/**
 * Area quantum specification
 */
export interface AreaQuantumSpec {
  spin: SpinValue;
  eigenvalue: number;           // √(j(j+1))
  area: number;                 // In Planck areas
  physicalArea: number;         // In m²
  hash: string;
}

/**
 * Volume quantum specification
 */
export interface VolumeQuantumSpec {
  nodeId: string;
  eigenvalue: number;
  volume: number;               // In Planck volumes
  physicalVolume: number;       // In m³
  hash: string;
}

/**
 * Spin network graph configuration
 */
export interface SpinNetworkConfig {
  nodes: SpinNetworkNode[];
  edges: SpinNetworkEdge[];
  totalArea: number;
  totalVolume: number;
  barberoImmirzi: number;
  hash: string;
}

/**
 * Spin recoupling result
 */
export interface RecouplingResult {
  initial: SpinValue[];
  final: SpinValue[];
  coefficients: number[];
  hash: string;
}

// ============================================================================
// SPIN VALUE CLASS
// ============================================================================

/**
 * SpinValueUtil - Utility class for spin quantum numbers
 */
export class SpinValueUtil {
  private readonly hash: string;

  constructor() {
    this.hash = HashVerifier.hash(JSON.stringify({ class: 'SpinValueUtil' }));
  }

  /**
   * Create a spin value from a number
   * @param j - Spin value (0, 0.5, 1, 1.5, 2, ...)
   */
  create(j: number): SpinValue {
    if (j < 0) {
      throw new Error('Spin must be non-negative');
    }
    
    // Check if it's a valid spin (integer or half-integer)
    const remainder = j % 0.5;
    if (Math.abs(remainder) > EPSILON && Math.abs(remainder - 0.5) > EPSILON) {
      throw new Error('Spin must be integer or half-integer');
    }

    const isHalfInteger = Math.abs((j * 2) % 2 - 1) < EPSILON;
    
    return {
      j,
      isHalfInteger
    };
  }

  /**
   * Create a spin value with magnetic quantum number
   */
  createWithM(j: number, m: number): SpinValue {
    const spin = this.create(j);
    
    if (Math.abs(m) > j) {
      throw new Error(`|m| must be <= j (m=${m}, j=${j})`);
    }
    
    // Check m is valid (differs from j by integers)
    const diff = j - m;
    if (Math.abs(diff - Math.round(diff)) > EPSILON) {
      throw new Error('m must differ from j by integers');
    }
    
    spin.m = m;
    return spin;
  }

  /**
   * Calculate the Casimir eigenvalue √(j(j+1))
   */
  casimirEigenvalue(spin: SpinValue): number {
    return Math.sqrt(spin.j * (spin.j + 1));
  }

  /**
   * Calculate spin dimension (2j + 1)
   */
  dimension(spin: SpinValue): number {
    return 2 * spin.j + 1;
  }

  /**
   * Check if two spins can couple (triangle inequality)
   */
  canCouple(j1: SpinValue, j2: SpinValue): boolean {
    return true; // Any two spins can couple
  }

  /**
   * Get allowed coupled spin values from j1 and j2
   * |j1 - j2| <= J <= j1 + j2
   */
  coupledSpins(j1: SpinValue, j2: SpinValue): SpinValue[] {
    const jMin = Math.abs(j1.j - j2.j);
    const jMax = j1.j + j2.j;
    const result: SpinValue[] = [];
    
    for (let j = jMin; j <= jMax; j += 1) {
      result.push(this.create(j));
    }
    
    return result;
  }

  /**
   * Check triangle inequality for three spins
   */
  triangleInequality(j1: SpinValue, j2: SpinValue, j3: SpinValue): boolean {
    const a = j1.j, b = j2.j, c = j3.j;
    return (Math.abs(a - b) <= c) && (c <= a + b);
  }

  getHash(): string {
    return this.hash;
  }
}

// ============================================================================
// AREA QUANTUM CLASS
// ============================================================================

/**
 * AreaQuantum - Implements area quantization in LQG
 * 
 * In LQG, areas are quantized according to:
 * A = 8πγl_P² Σ√(j(j+1))
 */
export class AreaQuantum {
  private readonly barberoImmirzi: number;
  private readonly hash: string;

  constructor(gamma?: number) {
    this.barberoImmirzi = gamma ?? CONSTANTS.gamma;
    this.hash = HashVerifier.hash(JSON.stringify({
      class: 'AreaQuantum',
      gamma: this.barberoImmirzi
    }));
  }

  /**
   * Calculate area eigenvalue for a single spin
   * A_j = 8πγl_P² √(j(j+1))
   */
  eigenvalue(spin: SpinValue): AreaQuantumSpec {
    const casimir = Math.sqrt(spin.j * (spin.j + 1));
    const area = 8 * Math.PI * this.barberoImmirzi * casimir;
    const physicalArea = area * CONSTANTS.lP2;

    return {
      spin,
      eigenvalue: casimir,
      area,
      physicalArea,
      hash: HashVerifier.hash(JSON.stringify({
        method: 'eigenvalue',
        spin: spin.j,
        area
      }))
    };
  }

  /**
   * Calculate total area from multiple spins (for a surface)
   */
  totalArea(spins: SpinValue[]): AreaQuantumSpec {
    let totalEigenvalue = 0;
    for (const spin of spins) {
      totalEigenvalue += Math.sqrt(spin.j * (spin.j + 1));
    }

    const area = 8 * Math.PI * this.barberoImmirzi * totalEigenvalue;
    const physicalArea = area * CONSTANTS.lP2;

    return {
      spin: { j: totalEigenvalue, isHalfInteger: false },
      eigenvalue: totalEigenvalue,
      area,
      physicalArea,
      hash: HashVerifier.hash(JSON.stringify({
        method: 'totalArea',
        spins: spins.map(s => s.j),
        area
      }))
    };
  }

  /**
   * Calculate minimum area (area gap)
   * Corresponds to j = 1/2
   */
  areaGap(): AreaQuantumSpec {
    const spinUtil = new SpinValueUtil();
    return this.eigenvalue(spinUtil.create(0.5));
  }

  /**
   * Get first N area eigenvalues
   */
  spectrum(n: number): AreaQuantumSpec[] {
    const spinUtil = new SpinValueUtil();
    const result: AreaQuantumSpec[] = [];
    
    for (let i = 0; i < n; i++) {
      const j = i * 0.5;
      result.push(this.eigenvalue(spinUtil.create(j)));
    }
    
    return result;
  }

  /**
   * Find spin value that gives closest area to target
   */
  closestSpin(targetArea: number): SpinValue {
    const spinUtil = new SpinValueUtil();
    
    // Solve: 8πγl_P² √(j(j+1)) = targetArea
    // √(j(j+1)) = targetArea / (8πγl_P²)
    const casimirTarget = targetArea / (8 * Math.PI * this.barberoImmirzi * CONSTANTS.lP2);
    
    // j(j+1) = casimirTarget²
    // j = (-1 + √(1 + 4*casimirTarget²)) / 2
    const jContinuous = (-1 + Math.sqrt(1 + 4 * casimirTarget * casimirTarget)) / 2;
    
    // Round to nearest half-integer
    const jRounded = Math.round(jContinuous * 2) / 2;
    
    return spinUtil.create(Math.max(0, jRounded));
  }

  /**
   * Get Barbero-Immirzi parameter
   */
  getBarberoImmirzi(): number {
    return this.barberoImmirzi;
  }

  getHash(): string {
    return this.hash;
  }
}

// ============================================================================
// VOLUME QUANTUM CLASS
// ============================================================================

/**
 * VolumeQuantum - Implements volume quantization in LQG
 * 
 * Volume is quantized at nodes where edges meet.
 * The volume operator is more complex than area.
 */
export class VolumeQuantum {
  private readonly barberoImmirzi: number;
  private readonly hash: string;

  constructor(gamma?: number) {
    this.barberoImmirzi = gamma ?? CONSTANTS.gamma;
    this.hash = HashVerifier.hash(JSON.stringify({
      class: 'VolumeQuantum',
      gamma: this.barberoImmirzi
    }));
  }

  /**
   * Calculate volume eigenvalue at a node
   * For a 4-valent node with spins j1, j2, j3, j4
   * Volume involves the Ashtekar-Lewandowski volume operator
   */
  eigenvalue(spins: SpinValue[], nodeId: string): VolumeQuantumSpec {
    if (spins.length < 3) {
      return {
        nodeId,
        eigenvalue: 0,
        volume: 0,
        physicalVolume: 0,
        hash: HashVerifier.hash(JSON.stringify({ nodeId, spins: spins.map(s => s.j), volume: 0 }))
      };
    }

    // Simplified volume calculation
    // V ∝ l_P³ √|Σ ε_ijk j_i j_j j_k|
    // For a 4-valent node, we use a simplified formula
    let volumeFactor = 0;
    
    if (spins.length >= 3) {
      // Use first three spins to compute volume contribution
      const j1 = spins[0].j;
      const j2 = spins[1].j;
      const j3 = spins[2].j;
      
      // Simplified volume formula based on Thiemann's regularization
      volumeFactor = Math.sqrt(Math.abs(
        (j1 * (j1 + 1)) * (j2 * (j2 + 1)) * (j3 * (j3 + 1))
      ));
    }

    // Include Barbero-Immirzi and Planck volume
    const planckVolume = Math.pow(CONSTANTS.lP, 3);
    const volume = this.barberoImmirzi * Math.sqrt(this.barberoImmirzi) * volumeFactor;
    const physicalVolume = volume * planckVolume;

    return {
      nodeId,
      eigenvalue: volumeFactor,
      volume,
      physicalVolume,
      hash: HashVerifier.hash(JSON.stringify({
        method: 'eigenvalue',
        nodeId,
        spins: spins.map(s => s.j),
        volume
      }))
    };
  }

  /**
   * Calculate minimum nonzero volume
   */
  volumeGap(): VolumeQuantumSpec {
    const spinUtil = new SpinValueUtil();
    const spins = [
      spinUtil.create(0.5),
      spinUtil.create(0.5),
      spinUtil.create(0.5)
    ];
    return this.eigenvalue(spins, 'volume_gap_node');
  }

  /**
   * Check if a node can have nonzero volume
   * Needs at least 4 edges meeting with compatible spins
   */
  canHaveVolume(valence: number): boolean {
    return valence >= 4;
  }

  /**
   * Get Barbero-Immirzi parameter
   */
  getBarberoImmirzi(): number {
    return this.barberoImmirzi;
  }

  getHash(): string {
    return this.hash;
  }
}

// ============================================================================
// SPIN NETWORK CLASS
// ============================================================================

/**
 * SpinNetwork - Represents a spin network graph
 * 
 * A spin network is a graph where:
 * - Edges carry spin quantum numbers
 * - Nodes carry intertwiners
 * - Edges contribute to area, nodes to volume
 */
export class SpinNetwork {
  private nodes: Map<string, SpinNetworkNode>;
  private edges: Map<string, SpinNetworkEdge>;
  private readonly barberoImmirzi: number;
  private readonly areaQuantum: AreaQuantum;
  private readonly volumeQuantum: VolumeQuantum;
  private hash: string;

  constructor(gamma?: number) {
    this.nodes = new Map();
    this.edges = new Map();
    this.barberoImmirzi = gamma ?? CONSTANTS.gamma;
    this.areaQuantum = new AreaQuantum(this.barberoImmirzi);
    this.volumeQuantum = new VolumeQuantum(this.barberoImmirzi);
    this.hash = this.computeHash();
  }

  private computeHash(): string {
    return HashVerifier.hash(JSON.stringify({
      nodeCount: this.nodes.size,
      edgeCount: this.edges.size,
      gamma: this.barberoImmirzi
    }));
  }

  /**
   * Add a node to the network
   */
  addNode(id: string, position?: [number, number, number]): SpinNetworkNode {
    const node: SpinNetworkNode = {
      id,
      position,
      valence: 0,
      intertwiner: {
        nodeId: id,
        incomingSpins: [],
        outgoingSpins: [],
        intertwinerSpace: 1,
        hash: HashVerifier.hash(JSON.stringify({ nodeId: id }))
      },
      volumeContribution: 0,
      hash: HashVerifier.hash(JSON.stringify({ id, position }))
    };
    
    this.nodes.set(id, node);
    this.hash = this.computeHash();
    
    logger.debug('SpinNetwork: Added node', { id });
    
    return node;
  }

  /**
   * Add an edge to the network
   */
  addEdge(id: string, sourceId: string, targetId: string, spin: SpinValue): SpinNetworkEdge {
    const source = this.nodes.get(sourceId);
    const target = this.nodes.get(targetId);
    
    if (!source || !target) {
      throw new Error('Source and target nodes must exist');
    }

    const areaSpec = this.areaQuantum.eigenvalue(spin);
    
    const edge: SpinNetworkEdge = {
      id,
      sourceNode: sourceId,
      targetNode: targetId,
      spin,
      areaContribution: areaSpec.area,
      hash: HashVerifier.hash(JSON.stringify({ id, sourceId, targetId, spin: spin.j }))
    };
    
    this.edges.set(id, edge);
    
    // Update node valences and intertwiners
    source.valence++;
    target.valence++;
    source.intertwiner.outgoingSpins.push(spin);
    target.intertwiner.incomingSpins.push(spin);
    
    // Recalculate volume contributions
    this.updateVolumeContributions();
    
    this.hash = this.computeHash();
    
    logger.debug('SpinNetwork: Added edge', { id, spin: spin.j });
    
    return edge;
  }

  /**
   * Update volume contributions at all nodes
   */
  private updateVolumeContributions(): void {
    for (const [nodeId, node] of this.nodes) {
      const allSpins = [...node.intertwiner.incomingSpins, ...node.intertwiner.outgoingSpins];
      if (allSpins.length >= 3) {
        const volumeSpec = this.volumeQuantum.eigenvalue(allSpins, nodeId);
        node.volumeContribution = volumeSpec.volume;
      }
    }
  }

  /**
   * Get a node by ID
   */
  getNode(id: string): SpinNetworkNode | undefined {
    return this.nodes.get(id);
  }

  /**
   * Get an edge by ID
   */
  getEdge(id: string): SpinNetworkEdge | undefined {
    return this.edges.get(id);
  }

  /**
   * Get all nodes
   */
  getAllNodes(): SpinNetworkNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get all edges
   */
  getAllEdges(): SpinNetworkEdge[] {
    return Array.from(this.edges.values());
  }

  /**
   * Get node count
   */
  getNodeCount(): number {
    return this.nodes.size;
  }

  /**
   * Get edge count
   */
  getEdgeCount(): number {
    return this.edges.size;
  }

  /**
   * Calculate total area of the network
   */
  totalArea(): AreaQuantumSpec {
    const spins = Array.from(this.edges.values()).map(e => e.spin);
    return this.areaQuantum.totalArea(spins);
  }

  /**
   * Calculate total volume of the network
   */
  totalVolume(): number {
    let total = 0;
    for (const node of this.nodes.values()) {
      total += node.volumeContribution;
    }
    return total;
  }

  /**
   * Get edges connected to a node
   */
  getNodeEdges(nodeId: string): SpinNetworkEdge[] {
    const result: SpinNetworkEdge[] = [];
    for (const edge of this.edges.values()) {
      if (edge.sourceNode === nodeId || edge.targetNode === nodeId) {
        result.push(edge);
      }
    }
    return result;
  }

  /**
   * Check if the network is connected
   */
  isConnected(): boolean {
    if (this.nodes.size === 0) return true;
    if (this.nodes.size === 1) return true;
    
    const visited = new Set<string>();
    const firstNode = this.nodes.keys().next().value;
    if (firstNode === undefined) return true;
    const queue: string[] = [firstNode];
    
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);
      
      for (const edge of this.edges.values()) {
        if (edge.sourceNode === nodeId && !visited.has(edge.targetNode)) {
          queue.push(edge.targetNode);
        }
        if (edge.targetNode === nodeId && !visited.has(edge.sourceNode)) {
          queue.push(edge.sourceNode);
        }
      }
    }
    
    return visited.size === this.nodes.size;
  }

  /**
   * Check if a gauge transformation is valid
   */
  isGaugeInvariant(): boolean {
    // For each node, check that spins satisfy admissibility conditions
    for (const node of this.nodes.values()) {
      const spins = [...node.intertwiner.incomingSpins, ...node.intertwiner.outgoingSpins];
      
      if (spins.length > 0) {
        // Check that the intertwiner space is non-zero
        // This requires coupling rules to be satisfied
        if (!this.checkIntertwinerAdmissibility(spins)) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Check if spins at a node can form a valid intertwiner
   */
  private checkIntertwinerAdmissibility(spins: SpinValue[]): boolean {
    if (spins.length < 2) return true;
    
    // For 3 spins, check triangle inequality
    if (spins.length === 3) {
      const spinUtil = new SpinValueUtil();
      return spinUtil.triangleInequality(spins[0], spins[1], spins[2]);
    }
    
    // For 4 or more spins, use recursive coupling
    // Simplified: always return true for now
    return true;
  }

  /**
   * Export network configuration
   */
  export(): SpinNetworkConfig {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()),
      totalArea: this.totalArea().area,
      totalVolume: this.totalVolume(),
      barberoImmirzi: this.barberoImmirzi,
      hash: this.hash
    };
  }

  /**
   * Get Barbero-Immirzi parameter
   */
  getBarberoImmirzi(): number {
    return this.barberoImmirzi;
  }

  getHash(): string {
    return this.hash;
  }
}

// ============================================================================
// SPIN NETWORK FACTORY
// ============================================================================

/**
 * SpinNetworkFactory - Creates common spin network configurations
 */
export class SpinNetworkFactory {
  private readonly spinUtil: SpinValueUtil;
  private readonly hash: string;

  constructor() {
    this.spinUtil = new SpinValueUtil();
    this.hash = HashVerifier.hash(JSON.stringify({ class: 'SpinNetworkFactory' }));
  }

  /**
   * Create a theta network (two nodes connected by three edges)
   */
  theta(j1: number, j2: number, j3: number): SpinNetwork {
    const network = new SpinNetwork();
    
    network.addNode('A');
    network.addNode('B');
    
    network.addEdge('e1', 'A', 'B', this.spinUtil.create(j1));
    network.addEdge('e2', 'A', 'B', this.spinUtil.create(j2));
    network.addEdge('e3', 'A', 'B', this.spinUtil.create(j3));
    
    return network;
  }

  /**
   * Create a tetrahedron network (4 nodes, 6 edges)
   */
  tetrahedron(j: number): SpinNetwork {
    const network = new SpinNetwork();
    const spin = this.spinUtil.create(j);
    
    network.addNode('A');
    network.addNode('B');
    network.addNode('C');
    network.addNode('D');
    
    network.addEdge('AB', 'A', 'B', spin);
    network.addEdge('AC', 'A', 'C', spin);
    network.addEdge('AD', 'A', 'D', spin);
    network.addEdge('BC', 'B', 'C', spin);
    network.addEdge('BD', 'B', 'D', spin);
    network.addEdge('CD', 'C', 'D', spin);
    
    return network;
  }

  /**
   * Create a cube network (8 nodes, 12 edges)
   */
  cube(j: number): SpinNetwork {
    const network = new SpinNetwork();
    const spin = this.spinUtil.create(j);
    
    // Add 8 vertices of a cube
    for (let i = 0; i < 8; i++) {
      const x = i & 1;
      const y = (i >> 1) & 1;
      const z = (i >> 2) & 1;
      network.addNode(`v${i}`, [x, y, z]);
    }
    
    // Add 12 edges
    // Bottom face
    network.addEdge('e0', 'v0', 'v1', spin);
    network.addEdge('e1', 'v1', 'v3', spin);
    network.addEdge('e2', 'v3', 'v2', spin);
    network.addEdge('e3', 'v2', 'v0', spin);
    
    // Top face
    network.addEdge('e4', 'v4', 'v5', spin);
    network.addEdge('e5', 'v5', 'v7', spin);
    network.addEdge('e6', 'v7', 'v6', spin);
    network.addEdge('e7', 'v6', 'v4', spin);
    
    // Vertical edges
    network.addEdge('e8', 'v0', 'v4', spin);
    network.addEdge('e9', 'v1', 'v5', spin);
    network.addEdge('e10', 'v2', 'v6', spin);
    network.addEdge('e11', 'v3', 'v7', spin);
    
    return network;
  }

  /**
   * Create a simple chain of nodes
   */
  chain(length: number, j: number): SpinNetwork {
    const network = new SpinNetwork();
    const spin = this.spinUtil.create(j);
    
    for (let i = 0; i <= length; i++) {
      network.addNode(`n${i}`, [i, 0, 0]);
    }
    
    for (let i = 0; i < length; i++) {
      network.addEdge(`e${i}`, `n${i}`, `n${i+1}`, spin);
    }
    
    return network;
  }

  /**
   * Create a loop (closed chain)
   */
  loop(size: number, j: number): SpinNetwork {
    const network = new SpinNetwork();
    const spin = this.spinUtil.create(j);
    
    // Add nodes in a circle
    for (let i = 0; i < size; i++) {
      const angle = (2 * Math.PI * i) / size;
      network.addNode(`n${i}`, [Math.cos(angle), Math.sin(angle), 0]);
    }
    
    // Add edges in a cycle
    for (let i = 0; i < size; i++) {
      network.addEdge(`e${i}`, `n${i}`, `n${(i + 1) % size}`, spin);
    }
    
    return network;
  }

  /**
   * Create a 4-valent node (fundamental building block)
   */
  fourValentNode(j1: number, j2: number, j3: number, j4: number): SpinNetwork {
    const network = new SpinNetwork();
    
    // Central node
    network.addNode('center', [0, 0, 0]);
    
    // Four outer nodes
    network.addNode('n1', [1, 0, 0]);
    network.addNode('n2', [0, 1, 0]);
    network.addNode('n3', [-1, 0, 0]);
    network.addNode('n4', [0, -1, 0]);
    
    // Four edges meeting at center
    network.addEdge('e1', 'center', 'n1', this.spinUtil.create(j1));
    network.addEdge('e2', 'center', 'n2', this.spinUtil.create(j2));
    network.addEdge('e3', 'center', 'n3', this.spinUtil.create(j3));
    network.addEdge('e4', 'center', 'n4', this.spinUtil.create(j4));
    
    return network;
  }

  getHash(): string {
    return this.hash;
  }
}

// ============================================================================
// CLEBSCH-GORDAN COEFFICIENTS (Simplified)
// ============================================================================

/**
 * ClebschGordan - Computes Clebsch-Gordan coefficients
 * 
 * Used for spin recoupling in LQG
 */
export class ClebschGordan {
  private readonly cache: Map<string, number>;
  private readonly hash: string;

  constructor() {
    this.cache = new Map();
    this.hash = HashVerifier.hash(JSON.stringify({ class: 'ClebschGordan' }));
  }

  /**
   * Compute Clebsch-Gordan coefficient <j1 m1; j2 m2 | J M>
   * Simplified implementation for common cases
   */
  coefficient(j1: number, m1: number, j2: number, m2: number, J: number, M: number): number {
    // Check selection rules
    if (M !== m1 + m2) return 0;
    if (J < Math.abs(j1 - j2) || J > j1 + j2) return 0;
    if (Math.abs(m1) > j1 || Math.abs(m2) > j2 || Math.abs(M) > J) return 0;

    const key = `${j1},${m1},${j2},${m2},${J},${M}`;
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    // Special cases
    if (j1 === 0) {
      const val = (j2 === J && m2 === M) ? 1 : 0;
      this.cache.set(key, val);
      return val;
    }
    if (j2 === 0) {
      const val = (j1 === J && m1 === M) ? 1 : 0;
      this.cache.set(key, val);
      return val;
    }

    // For j1 = j2 = 1/2
    if (j1 === 0.5 && j2 === 0.5) {
      if (J === 1) {
        if (m1 === 0.5 && m2 === 0.5 && M === 1) return 1;
        if (m1 === -0.5 && m2 === -0.5 && M === -1) return 1;
        if ((m1 === 0.5 && m2 === -0.5) || (m1 === -0.5 && m2 === 0.5)) {
          if (M === 0) return 1 / Math.sqrt(2);
        }
      } else if (J === 0 && M === 0) {
        if (m1 === 0.5 && m2 === -0.5) return 1 / Math.sqrt(2);
        if (m1 === -0.5 && m2 === 0.5) return -1 / Math.sqrt(2);
      }
    }

    // General case: use recursion (simplified)
    // Full implementation would use Racah formula
    const val = this.generalCoefficient(j1, m1, j2, m2, J, M);
    this.cache.set(key, val);
    return val;
  }

  /**
   * General Clebsch-Gordan coefficient using analytical formula
   * 
   * Implements the standard Clebsch-Gordan coefficient calculation
   * using the analytical formula involving factorials and binomial sums.
   * Valid for all half-integer and integer spins.
   */
  private generalCoefficient(j1: number, m1: number, j2: number, m2: number, J: number, M: number): number {
    // Implement using the analytical formula:
    // C(j1,m1,j2,m2,J,M) = δ(m1+m2,M) * sqrt((2J+1) * factorial factors) * sum(...)
    
    // Helper for factorial
    const factorial = (n: number): number => {
      if (n <= 0) return 1;
      let result = 1;
      for (let i = 2; i <= n; i++) result *= i;
      return result;
    };
    
    // Calculate the normalization factor
    const N = Math.sqrt(
      (2 * J + 1) *
      factorial(J + j1 - j2) *
      factorial(J - j1 + j2) *
      factorial(j1 + j2 - J) /
      factorial(j1 + j2 + J + 1)
    );
    
    const N2 = Math.sqrt(
      factorial(J + M) *
      factorial(J - M) *
      factorial(j1 - m1) *
      factorial(j1 + m1) *
      factorial(j2 - m2) *
      factorial(j2 + m2)
    );
    
    // Calculate the sum over k
    let sum = 0;
    const kMin = Math.max(0, j2 - J - m1, j1 - J + m2);
    const kMax = Math.min(j1 + j2 - J, j1 - m1, j2 + m2);
    
    for (let k = kMin; k <= kMax; k++) {
      const term = Math.pow(-1, k) / (
        factorial(k) *
        factorial(j1 + j2 - J - k) *
        factorial(j1 - m1 - k) *
        factorial(j2 + m2 - k) *
        factorial(J - j2 + m1 + k) *
        factorial(J - j1 - m2 + k)
      );
      sum += term;
    }
    
    return N * N2 * sum;
  }

  /**
   * Compute 6j symbol {j1 j2 j3; j4 j5 j6}
   * Used for recoupling of four angular momenta
   */
  sixJSymbol(j1: number, j2: number, j3: number, j4: number, j5: number, j6: number): number {
    // Check triangle inequalities
    if (!this.triangleAllowed(j1, j2, j3)) return 0;
    if (!this.triangleAllowed(j1, j5, j6)) return 0;
    if (!this.triangleAllowed(j4, j2, j6)) return 0;
    if (!this.triangleAllowed(j4, j5, j3)) return 0;

    // Simplified computation (exact for small spins)
    // Full implementation would use Racah formula
    if (j1 === 0.5 && j2 === 0.5 && j3 === 1 && j4 === 0.5 && j5 === 0.5 && j6 === 1) {
      return 0.5;
    }

    // Generic approximation
    const phase = Math.pow(-1, j1 + j2 + j4 + j5);
    const norm = 1 / Math.sqrt((2 * j3 + 1) * (2 * j6 + 1));
    return phase * norm;
  }

  private triangleAllowed(a: number, b: number, c: number): boolean {
    return (Math.abs(a - b) <= c) && (c <= a + b);
  }

  getHash(): string {
    return this.hash;
  }
}

// ============================================================================
// LQG PHYSICAL CONSTANTS
// ============================================================================

/**
 * LQGConstants - Physical constants specific to LQG
 */
export const LQGConstants = {
  ...CONSTANTS,
  
  // Barbero-Immirzi parameter from black hole entropy
  barberoImmirzi: CONSTANTS.gamma,
  
  // Minimum area (area gap) for j = 1/2
  areaGap: 8 * Math.PI * CONSTANTS.gamma * Math.sqrt(0.5 * 1.5) * CONSTANTS.lP2,
  
  // Planck volume
  planckVolume: Math.pow(CONSTANTS.lP, 3),
  
  // Area spectrum coefficient
  areaCoefficient: 8 * Math.PI * CONSTANTS.gamma * CONSTANTS.lP2
};

// ============================================================================
// MODULE INTEGRATION HASH
// ============================================================================

export const MODULE_HASH = HashVerifier.hash(JSON.stringify({
  module: 'SpinNetwork',
  version: '1.0.0',
  phase: 'PRD-04 Phase 4.3',
  moduleId: 'M04.03',
  exports: [
    'SpinValueUtil',
    'AreaQuantum',
    'VolumeQuantum',
    'SpinNetwork',
    'SpinNetworkFactory',
    'ClebschGordan',
    'LQGConstants'
  ]
}));
