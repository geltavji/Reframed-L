/**
 * SpacetimeLattice.ts - Discrete Spacetime Model at Planck Scale
 * PRD-04 Phase 4.1: Module M04.01
 * 
 * Implements discrete spacetime lattice where:
 * - Minimum length = Planck length (l_P ≈ 1.616255 × 10^-35 m)
 * - Minimum time = Planck time (t_P ≈ 5.391247 × 10^-44 s)
 * - Spacetime is fundamentally discrete at Planck scale
 */

import { Logger, LogLevel } from '../../core/logger/Logger';
import { HashVerifier } from '../../core/logger/HashVerifier';

// Get logger instance
const logger = Logger.getInstance({ minLevel: LogLevel.DEBUG, enableConsole: false });

// Physical constants at Planck scale (SI units)
const PLANCK_LENGTH = 1.616255e-35;  // meters
const PLANCK_TIME = 5.391247e-44;    // seconds
const PLANCK_MASS = 2.176434e-8;     // kg
const PLANCK_ENERGY = 1.956e9;       // Joules (≈ 1.22 × 10^19 GeV)
const PLANCK_TEMPERATURE = 1.416784e32; // Kelvin
const SPEED_OF_LIGHT = 299792458;    // m/s

/**
 * Represents discrete coordinates at Planck scale
 * Coordinates are integer multiples of Planck length/time
 */
export interface DiscreteCoordinates {
  t: number;  // Integer units of Planck time
  x: number;  // Integer units of Planck length
  y: number;
  z: number;
}

/**
 * Represents a causal edge in discrete spacetime
 */
export interface CausalEdge {
  from: string;   // Node ID
  to: string;     // Node ID
  type: 'timelike' | 'spacelike' | 'lightlike';
  weight: number; // Proper interval
}

/**
 * Information content of a Planck cell
 */
export interface CellInformation {
  entropy: number;         // In bits
  energyDensity: number;   // In Planck energy per Planck volume
  spinState: number;       // Spin quantum number
  causalLinks: number;     // Number of causal connections
}

/**
 * PlanckCell - A single cell of discrete spacetime
 * The fundamental unit of spacetime at Planck scale
 */
export class PlanckCell {
  private readonly id: string;
  private readonly coords: DiscreteCoordinates;
  private information: CellInformation;
  private neighbors: Map<string, PlanckCell>;
  private causalFuture: Set<string>;
  private causalPast: Set<string>;
  private hash: string;

  constructor(coords: DiscreteCoordinates, info?: Partial<CellInformation>) {
    this.coords = { ...coords };
    this.id = `cell_${coords.t}_${coords.x}_${coords.y}_${coords.z}`;
    this.information = {
      entropy: info?.entropy ?? 0,
      energyDensity: info?.energyDensity ?? 0,
      spinState: info?.spinState ?? 0,
      causalLinks: info?.causalLinks ?? 0
    };
    this.neighbors = new Map();
    this.causalFuture = new Set();
    this.causalPast = new Set();
    this.hash = this.computeHash();
  }

  private computeHash(): string {
    const data = JSON.stringify({
      id: this.id,
      coords: this.coords,
      info: this.information
    });
    return HashVerifier.hash(data);
  }

  getId(): string {
    return this.id;
  }

  getCoords(): DiscreteCoordinates {
    return { ...this.coords };
  }

  getInformation(): CellInformation {
    return { ...this.information };
  }

  setInformation(info: Partial<CellInformation>): void {
    this.information = { ...this.information, ...info };
    this.hash = this.computeHash();
  }

  /**
   * Physical position in SI units
   */
  getPhysicalPosition(): { t: number; x: number; y: number; z: number } {
    return {
      t: this.coords.t * PLANCK_TIME,
      x: this.coords.x * PLANCK_LENGTH,
      y: this.coords.y * PLANCK_LENGTH,
      z: this.coords.z * PLANCK_LENGTH
    };
  }

  /**
   * Volume of cell in SI units (cubic meters)
   */
  getVolume(): number {
    return Math.pow(PLANCK_LENGTH, 3);
  }

  /**
   * Duration of cell in SI units (seconds)
   */
  getDuration(): number {
    return PLANCK_TIME;
  }

  /**
   * Spacetime 4-volume in SI units (m³·s)
   */
  getSpacetimeVolume(): number {
    return Math.pow(PLANCK_LENGTH, 3) * PLANCK_TIME;
  }

  addNeighbor(cell: PlanckCell): void {
    this.neighbors.set(cell.getId(), cell);
  }

  getNeighbors(): PlanckCell[] {
    return Array.from(this.neighbors.values());
  }

  addToCausalFuture(cellId: string): void {
    this.causalFuture.add(cellId);
    this.information.causalLinks = this.causalFuture.size + this.causalPast.size;
    this.hash = this.computeHash();
  }

  addToCausalPast(cellId: string): void {
    this.causalPast.add(cellId);
    this.information.causalLinks = this.causalFuture.size + this.causalPast.size;
    this.hash = this.computeHash();
  }

  getCausalFuture(): string[] {
    return Array.from(this.causalFuture);
  }

  getCausalPast(): string[] {
    return Array.from(this.causalPast);
  }

  getHash(): string {
    return this.hash;
  }

  /**
   * Maximum information that can be stored in this cell (Bekenstein bound)
   * S_max = (2π k_B R E) / (ħ c)
   * For a Planck cell, this is approximately 1 bit
   */
  getMaximumEntropy(): number {
    // For a Planck cell, the maximum entropy is approximately ln(2) ≈ 0.693 nats ≈ 1 bit
    return 1; // In bits
  }

  /**
   * Check if entropy satisfies Bekenstein bound
   */
  satisfiesBekensteinBound(): boolean {
    return this.information.entropy <= this.getMaximumEntropy();
  }

  clone(): PlanckCell {
    const cell = new PlanckCell(this.coords, this.information);
    this.neighbors.forEach((neighbor, id) => cell.neighbors.set(id, neighbor));
    this.causalFuture.forEach(id => cell.causalFuture.add(id));
    this.causalPast.forEach(id => cell.causalPast.add(id));
    return cell;
  }
}

/**
 * DiscreteMetric - Metric tensor for discrete spacetime
 * Provides distance calculations on the lattice
 */
export class DiscreteMetric {
  private readonly signature: [number, number, number, number];
  private readonly hash: string;

  constructor(signature: [number, number, number, number] = [-1, 1, 1, 1]) {
    this.signature = signature;
    this.hash = HashVerifier.hash(JSON.stringify({ signature }));
  }

  getSignature(): [number, number, number, number] {
    return [...this.signature];
  }

  /**
   * Discrete spacetime interval squared (in Planck units)
   * ds² = g_μν dx^μ dx^ν
   */
  intervalSquared(cell1: PlanckCell, cell2: PlanckCell): number {
    const c1 = cell1.getCoords();
    const c2 = cell2.getCoords();
    
    const dt = c2.t - c1.t;
    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;
    const dz = c2.z - c1.z;
    
    return this.signature[0] * dt * dt +
           this.signature[1] * dx * dx +
           this.signature[2] * dy * dy +
           this.signature[3] * dz * dz;
  }

  /**
   * Physical interval in SI units (seconds for timelike, meters for spacelike)
   */
  physicalInterval(cell1: PlanckCell, cell2: PlanckCell): number {
    const intervalSq = this.intervalSquared(cell1, cell2);
    
    if (intervalSq < 0) {
      // Timelike interval (in seconds)
      return Math.sqrt(-intervalSq) * PLANCK_TIME;
    } else if (intervalSq > 0) {
      // Spacelike interval (in meters)
      return Math.sqrt(intervalSq) * PLANCK_LENGTH;
    } else {
      // Lightlike
      return 0;
    }
  }

  /**
   * Classify the causal relationship between two cells
   */
  classifyInterval(cell1: PlanckCell, cell2: PlanckCell): 'timelike' | 'spacelike' | 'lightlike' {
    const intervalSq = this.intervalSquared(cell1, cell2);
    
    if (intervalSq < 0) {
      return 'timelike';
    } else if (intervalSq > 0) {
      return 'spacelike';
    } else {
      return 'lightlike';
    }
  }

  /**
   * Check if two cells are causally connected
   * (timelike or lightlike separated)
   */
  areCausallyConnected(cell1: PlanckCell, cell2: PlanckCell): boolean {
    const type = this.classifyInterval(cell1, cell2);
    return type === 'timelike' || type === 'lightlike';
  }

  /**
   * Proper distance on a spacelike hypersurface
   */
  properDistance(cell1: PlanckCell, cell2: PlanckCell): number {
    const c1 = cell1.getCoords();
    const c2 = cell2.getCoords();
    
    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;
    const dz = c2.z - c1.z;
    
    const distSq = dx * dx + dy * dy + dz * dz;
    return Math.sqrt(distSq); // In Planck length units
  }

  /**
   * Proper distance in SI units (meters)
   */
  physicalProperDistance(cell1: PlanckCell, cell2: PlanckCell): number {
    return this.properDistance(cell1, cell2) * PLANCK_LENGTH;
  }

  getHash(): string {
    return this.hash;
  }
}

/**
 * LatticeEvolution - Discrete time evolution on the lattice
 */
export interface EvolutionRule {
  name: string;
  apply: (cell: PlanckCell, neighbors: PlanckCell[]) => CellInformation;
  hash: string;
}

/**
 * CausalSet - Represents causal structure of discrete spacetime
 */
export class CausalSet {
  private readonly elements: Map<string, PlanckCell>;
  private readonly edges: CausalEdge[];
  private readonly metric: DiscreteMetric;
  private hash: string;

  constructor(metric?: DiscreteMetric) {
    this.elements = new Map();
    this.edges = [];
    this.metric = metric ?? new DiscreteMetric();
    this.hash = this.computeHash();
  }

  private computeHash(): string {
    const data = JSON.stringify({
      elementCount: this.elements.size,
      edgeCount: this.edges.length,
      metricHash: this.metric.getHash()
    });
    return HashVerifier.hash(data);
  }

  addElement(cell: PlanckCell): void {
    this.elements.set(cell.getId(), cell);
    this.hash = this.computeHash();
  }

  getElement(id: string): PlanckCell | undefined {
    return this.elements.get(id);
  }

  getAllElements(): PlanckCell[] {
    return Array.from(this.elements.values());
  }

  getElementCount(): number {
    return this.elements.size;
  }

  /**
   * Add causal relation between two elements
   * The "from" element must be in the causal past of "to" element
   */
  addCausalRelation(fromId: string, toId: string): boolean {
    const fromCell = this.elements.get(fromId);
    const toCell = this.elements.get(toId);
    
    if (!fromCell || !toCell) {
      return false;
    }
    
    // Verify causality: from must have smaller or equal time coordinate
    const fromCoords = fromCell.getCoords();
    const toCoords = toCell.getCoords();
    
    if (fromCoords.t > toCoords.t) {
      return false; // Cannot go backward in time
    }
    
    // Check if causally connected
    const type = this.metric.classifyInterval(fromCell, toCell);
    if (type === 'spacelike') {
      return false; // Cannot have causal relation for spacelike separation
    }
    
    // Add the relation
    const weight = this.metric.physicalInterval(fromCell, toCell);
    this.edges.push({
      from: fromId,
      to: toId,
      type,
      weight
    });
    
    fromCell.addToCausalFuture(toId);
    toCell.addToCausalPast(fromId);
    
    this.hash = this.computeHash();
    return true;
  }

  getEdges(): CausalEdge[] {
    return [...this.edges];
  }

  /**
   * Find all elements in the causal future of a given element
   */
  causalFuture(cellId: string): PlanckCell[] {
    const visited = new Set<string>();
    const result: PlanckCell[] = [];
    const queue = [cellId];
    
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const cell = this.elements.get(currentId);
      
      if (!cell || visited.has(currentId)) continue;
      
      if (currentId !== cellId) {
        result.push(cell);
      }
      visited.add(currentId);
      
      for (const futureId of cell.getCausalFuture()) {
        if (!visited.has(futureId)) {
          queue.push(futureId);
        }
      }
    }
    
    return result;
  }

  /**
   * Find all elements in the causal past of a given element
   */
  causalPast(cellId: string): PlanckCell[] {
    const visited = new Set<string>();
    const result: PlanckCell[] = [];
    const queue = [cellId];
    
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const cell = this.elements.get(currentId);
      
      if (!cell || visited.has(currentId)) continue;
      
      if (currentId !== cellId) {
        result.push(cell);
      }
      visited.add(currentId);
      
      for (const pastId of cell.getCausalPast()) {
        if (!visited.has(pastId)) {
          queue.push(pastId);
        }
      }
    }
    
    return result;
  }

  /**
   * Find the causal diamond (Alexandrov set) between two elements
   * This is the intersection of the future of one and past of the other
   */
  causalDiamond(pastCellId: string, futureCellId: string): PlanckCell[] {
    const future = new Set(this.causalFuture(pastCellId).map(c => c.getId()));
    const past = new Set(this.causalPast(futureCellId).map(c => c.getId()));
    
    const intersection: PlanckCell[] = [];
    for (const id of future) {
      if (past.has(id)) {
        const cell = this.elements.get(id);
        if (cell) {
          intersection.push(cell);
        }
      }
    }
    
    return intersection;
  }

  getHash(): string {
    return this.hash;
  }
}

/**
 * SpacetimeLattice - Main class for discrete spacetime
 */
export class SpacetimeLattice {
  private readonly cells: Map<string, PlanckCell>;
  private readonly metric: DiscreteMetric;
  private readonly causalSet: CausalSet;
  private readonly dimensions: [number, number, number, number]; // t, x, y, z extents
  private readonly evolutionRules: EvolutionRule[];
  private currentTime: number;
  private hash: string;

  constructor(
    dimensions: [number, number, number, number] = [10, 10, 10, 10],
    metric?: DiscreteMetric
  ) {
    this.dimensions = dimensions;
    this.metric = metric ?? new DiscreteMetric();
    this.cells = new Map();
    this.causalSet = new CausalSet(this.metric);
    this.evolutionRules = [];
    this.currentTime = 0;
    this.hash = this.computeHash();
    
    logger.info('SpacetimeLattice initialized', {
      dimensions,
      planckLength: PLANCK_LENGTH,
      planckTime: PLANCK_TIME
    });
  }

  private computeHash(): string {
    const data = JSON.stringify({
      dimensions: this.dimensions,
      cellCount: this.cells.size,
      currentTime: this.currentTime,
      metricHash: this.metric.getHash()
    });
    return HashVerifier.hash(data);
  }

  /**
   * Initialize lattice with cells
   */
  initialize(): void {
    const [tMax, xMax, yMax, zMax] = this.dimensions;
    
    // Only initialize spatial cells at t=0 initially
    for (let x = 0; x < xMax; x++) {
      for (let y = 0; y < yMax; y++) {
        for (let z = 0; z < zMax; z++) {
          const coords: DiscreteCoordinates = { t: 0, x, y, z };
          const cell = new PlanckCell(coords);
          this.cells.set(cell.getId(), cell);
          this.causalSet.addElement(cell);
        }
      }
    }
    
    this.hash = this.computeHash();
    logger.info('Lattice initialized', { cellCount: this.cells.size });
  }

  /**
   * Get cell at given discrete coordinates
   */
  getCell(coords: DiscreteCoordinates): PlanckCell | undefined {
    const id = `cell_${coords.t}_${coords.x}_${coords.y}_${coords.z}`;
    return this.cells.get(id);
  }

  /**
   * Set cell at given coordinates
   */
  setCell(cell: PlanckCell): void {
    this.cells.set(cell.getId(), cell);
    this.causalSet.addElement(cell);
    this.hash = this.computeHash();
  }

  /**
   * Get all cells at a given time slice
   */
  getTimeSlice(t: number): PlanckCell[] {
    const result: PlanckCell[] = [];
    for (const cell of this.cells.values()) {
      if (cell.getCoords().t === t) {
        result.push(cell);
      }
    }
    return result;
  }

  /**
   * Get spatial neighbors of a cell
   */
  getSpatialNeighbors(cell: PlanckCell): PlanckCell[] {
    const coords = cell.getCoords();
    const neighbors: PlanckCell[] = [];
    
    const offsets = [
      [1, 0, 0], [-1, 0, 0],
      [0, 1, 0], [0, -1, 0],
      [0, 0, 1], [0, 0, -1]
    ];
    
    for (const [dx, dy, dz] of offsets) {
      const neighborCoords: DiscreteCoordinates = {
        t: coords.t,
        x: coords.x + dx,
        y: coords.y + dy,
        z: coords.z + dz
      };
      const neighbor = this.getCell(neighborCoords);
      if (neighbor) {
        neighbors.push(neighbor);
      }
    }
    
    return neighbors;
  }

  /**
   * Get dimensions of the lattice
   */
  getDimensions(): [number, number, number, number] {
    return [...this.dimensions];
  }

  /**
   * Get physical dimensions in SI units
   */
  getPhysicalDimensions(): { duration: number; lengthX: number; lengthY: number; lengthZ: number } {
    return {
      duration: this.dimensions[0] * PLANCK_TIME,
      lengthX: this.dimensions[1] * PLANCK_LENGTH,
      lengthY: this.dimensions[2] * PLANCK_LENGTH,
      lengthZ: this.dimensions[3] * PLANCK_LENGTH
    };
  }

  /**
   * Total number of cells (4-volume in Planck units)
   */
  getTotalCellCount(): number {
    return this.cells.size;
  }

  /**
   * Maximum theoretical cells for this lattice
   */
  getMaxCellCount(): number {
    return this.dimensions[0] * this.dimensions[1] * this.dimensions[2] * this.dimensions[3];
  }

  /**
   * Physical 4-volume in SI units (m³·s)
   */
  getPhysicalVolume(): number {
    return this.getMaxCellCount() * Math.pow(PLANCK_LENGTH, 3) * PLANCK_TIME;
  }

  /**
   * Register an evolution rule
   */
  registerEvolutionRule(rule: EvolutionRule): void {
    this.evolutionRules.push(rule);
    this.hash = this.computeHash();
    logger.info('Evolution rule registered', { name: rule.name });
  }

  /**
   * Evolve the lattice by one Planck time step
   */
  evolve(): void {
    const currentSlice = this.getTimeSlice(this.currentTime);
    const nextTime = this.currentTime + 1;
    
    if (nextTime >= this.dimensions[0]) {
      logger.warn('Cannot evolve: reached maximum time extent');
      return;
    }
    
    // Create next time slice
    for (const cell of currentSlice) {
      const coords = cell.getCoords();
      const newCoords: DiscreteCoordinates = {
        t: nextTime,
        x: coords.x,
        y: coords.y,
        z: coords.z
      };
      
      // Apply evolution rules to compute new information
      const neighbors = this.getSpatialNeighbors(cell);
      let newInfo = { ...cell.getInformation() };
      
      for (const rule of this.evolutionRules) {
        newInfo = rule.apply(cell, neighbors);
      }
      
      const newCell = new PlanckCell(newCoords, newInfo);
      this.setCell(newCell);
      
      // Establish causal relation
      this.causalSet.addCausalRelation(cell.getId(), newCell.getId());
    }
    
    this.currentTime = nextTime;
    this.hash = this.computeHash();
    logger.info('Lattice evolved', { time: this.currentTime });
  }

  /**
   * Get current time (in Planck time units)
   */
  getCurrentTime(): number {
    return this.currentTime;
  }

  /**
   * Get current physical time in SI units (seconds)
   */
  getPhysicalTime(): number {
    return this.currentTime * PLANCK_TIME;
  }

  /**
   * Get the metric
   */
  getMetric(): DiscreteMetric {
    return this.metric;
  }

  /**
   * Get the causal set
   */
  getCausalSet(): CausalSet {
    return this.causalSet;
  }

  /**
   * Calculate total information (entropy) in lattice
   */
  getTotalEntropy(): number {
    let totalEntropy = 0;
    for (const cell of this.cells.values()) {
      totalEntropy += cell.getInformation().entropy;
    }
    return totalEntropy;
  }

  /**
   * Calculate total energy in lattice (in Planck units)
   */
  getTotalEnergy(): number {
    let totalEnergy = 0;
    for (const cell of this.cells.values()) {
      totalEnergy += cell.getInformation().energyDensity;
    }
    return totalEnergy * PLANCK_ENERGY;
  }

  /**
   * Check if lattice satisfies discrete causality
   * (no spacelike causal relations)
   */
  verifyCausality(): boolean {
    for (const edge of this.causalSet.getEdges()) {
      if (edge.type === 'spacelike') {
        logger.warn('Causality violation detected', { edge });
        return false;
      }
    }
    return true;
  }

  /**
   * Check if all cells satisfy Bekenstein bound
   */
  verifyBekensteinBound(): boolean {
    for (const cell of this.cells.values()) {
      if (!cell.satisfiesBekensteinBound()) {
        logger.warn('Bekenstein bound violated', { cellId: cell.getId() });
        return false;
      }
    }
    return true;
  }

  getHash(): string {
    return this.hash;
  }

  /**
   * Export proof chain for scientific validation
   */
  exportProofChain(): object {
    return {
      type: 'SpacetimeLattice',
      dimensions: this.dimensions,
      cellCount: this.cells.size,
      currentTime: this.currentTime,
      causalEdges: this.causalSet.getEdges().length,
      metricSignature: this.metric.getSignature(),
      physicalConstants: {
        planckLength: PLANCK_LENGTH,
        planckTime: PLANCK_TIME,
        planckMass: PLANCK_MASS,
        planckEnergy: PLANCK_ENERGY
      },
      verifications: {
        causality: this.verifyCausality(),
        bekensteinBound: this.verifyBekensteinBound()
      },
      hash: this.hash
    };
  }
}

/**
 * LatticeFactory - Factory for creating pre-configured lattices
 */
export class LatticeFactory {
  /**
   * Create a minimal Planck-scale lattice (2x2x2x2)
   */
  static minimal(): SpacetimeLattice {
    const lattice = new SpacetimeLattice([2, 2, 2, 2]);
    lattice.initialize();
    return lattice;
  }

  /**
   * Create a small lattice for testing (10x10x10x10)
   */
  static small(): SpacetimeLattice {
    const lattice = new SpacetimeLattice([10, 10, 10, 10]);
    lattice.initialize();
    return lattice;
  }

  /**
   * Create a 1D temporal chain (time evolution only)
   */
  static temporalChain(length: number): SpacetimeLattice {
    const lattice = new SpacetimeLattice([length, 1, 1, 1]);
    lattice.initialize();
    return lattice;
  }

  /**
   * Create a 2D spatial slice at fixed time
   */
  static spatialSlice2D(width: number, height: number): SpacetimeLattice {
    const lattice = new SpacetimeLattice([1, width, height, 1]);
    lattice.initialize();
    return lattice;
  }

  /**
   * Create a 3D spatial volume at fixed time
   */
  static spatialVolume3D(x: number, y: number, z: number): SpacetimeLattice {
    const lattice = new SpacetimeLattice([1, x, y, z]);
    lattice.initialize();
    return lattice;
  }

  /**
   * Create a custom lattice with specific dimensions
   */
  static custom(
    dimensions: [number, number, number, number],
    metric?: DiscreteMetric
  ): SpacetimeLattice {
    const lattice = new SpacetimeLattice(dimensions, metric);
    lattice.initialize();
    return lattice;
  }

  /**
   * Create a causal diamond lattice between two events
   */
  static causalDiamond(temporalExtent: number, spatialExtent: number): SpacetimeLattice {
    // The causal diamond is constrained by light cone
    const lattice = new SpacetimeLattice([temporalExtent, spatialExtent, spatialExtent, spatialExtent]);
    lattice.initialize();
    return lattice;
  }
}

/**
 * Standard evolution rules
 */
export const EvolutionRules = {
  /**
   * Identity evolution - no change
   */
  identity: {
    name: 'identity',
    apply: (cell: PlanckCell, _neighbors: PlanckCell[]): CellInformation => {
      return cell.getInformation();
    },
    hash: HashVerifier.hash('evolution_rule_identity')
  } as EvolutionRule,

  /**
   * Diffusion - entropy spreads to neighbors
   */
  diffusion: {
    name: 'diffusion',
    apply: (cell: PlanckCell, neighbors: PlanckCell[]): CellInformation => {
      const info = cell.getInformation();
      
      if (neighbors.length === 0) {
        return info;
      }
      
      // Average entropy with neighbors
      let totalEntropy = info.entropy;
      for (const neighbor of neighbors) {
        totalEntropy += neighbor.getInformation().entropy;
      }
      const avgEntropy = totalEntropy / (neighbors.length + 1);
      
      return {
        ...info,
        entropy: avgEntropy
      };
    },
    hash: HashVerifier.hash('evolution_rule_diffusion')
  } as EvolutionRule,

  /**
   * Energy conservation - total energy is preserved
   */
  energyConservation: {
    name: 'energyConservation',
    apply: (cell: PlanckCell, _neighbors: PlanckCell[]): CellInformation => {
      // Energy stays constant in each cell (conservation)
      return cell.getInformation();
    },
    hash: HashVerifier.hash('evolution_rule_energy_conservation')
  } as EvolutionRule,

  /**
   * Causal update - increment causal links
   */
  causalUpdate: {
    name: 'causalUpdate',
    apply: (cell: PlanckCell, neighbors: PlanckCell[]): CellInformation => {
      const info = cell.getInformation();
      return {
        ...info,
        causalLinks: info.causalLinks + neighbors.length
      };
    },
    hash: HashVerifier.hash('evolution_rule_causal_update')
  } as EvolutionRule
};

/**
 * PlanckConstants - Planck scale constants
 */
export const PlanckConstants = {
  length: PLANCK_LENGTH,
  time: PLANCK_TIME,
  mass: PLANCK_MASS,
  energy: PLANCK_ENERGY,
  temperature: PLANCK_TEMPERATURE,
  speedOfLight: SPEED_OF_LIGHT,
  
  /**
   * Planck area (for area quantization in LQG)
   */
  area: PLANCK_LENGTH * PLANCK_LENGTH,
  
  /**
   * Planck volume
   */
  volume: Math.pow(PLANCK_LENGTH, 3),
  
  /**
   * Planck 4-volume (spacetime volume)
   */
  spacetimeVolume: Math.pow(PLANCK_LENGTH, 3) * PLANCK_TIME,
  
  /**
   * Maximum information density (bits per Planck volume)
   * From holographic principle: ~1 bit per Planck area
   */
  maxInfoDensity: 1 / (PLANCK_LENGTH * PLANCK_LENGTH),
  
  /**
   * Maximum computation rate (operations per second per Planck mass of energy)
   * Lloyd's limit: 2E/(πħ)
   */
  maxComputationRate: 2 * PLANCK_ENERGY / (Math.PI * 1.054571817e-34)
};
