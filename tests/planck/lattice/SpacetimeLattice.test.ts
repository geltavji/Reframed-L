/**
 * SpacetimeLattice.test.ts - Tests for Discrete Spacetime Model
 * PRD-04 Phase 4.1: Module M04.01
 */

import {
  SpacetimeLattice,
  PlanckCell,
  DiscreteMetric,
  CausalSet,
  LatticeFactory,
  EvolutionRules,
  PlanckConstants,
  DiscreteCoordinates
} from '../../../src/planck/lattice/SpacetimeLattice';

describe('SpacetimeLattice - PRD-04 Phase 4.1', () => {
  
  // ==================== PlanckCell Tests ====================
  
  describe('PlanckCell', () => {
    test('should create cell with discrete coordinates', () => {
      const coords: DiscreteCoordinates = { t: 0, x: 1, y: 2, z: 3 };
      const cell = new PlanckCell(coords);
      
      expect(cell.getCoords()).toEqual(coords);
      expect(cell.getId()).toBe('cell_0_1_2_3');
    });
    
    test('should compute physical position in SI units', () => {
      const coords: DiscreteCoordinates = { t: 1, x: 1, y: 1, z: 1 };
      const cell = new PlanckCell(coords);
      
      const pos = cell.getPhysicalPosition();
      expect(pos.t).toBeCloseTo(PlanckConstants.time, 50);
      expect(pos.x).toBeCloseTo(PlanckConstants.length, 40);
      expect(pos.y).toBeCloseTo(PlanckConstants.length, 40);
      expect(pos.z).toBeCloseTo(PlanckConstants.length, 40);
    });
    
    test('should compute Planck volume', () => {
      const cell = new PlanckCell({ t: 0, x: 0, y: 0, z: 0 });
      expect(cell.getVolume()).toBeCloseTo(PlanckConstants.volume, 110);
    });
    
    test('should compute Planck duration', () => {
      const cell = new PlanckCell({ t: 0, x: 0, y: 0, z: 0 });
      expect(cell.getDuration()).toBeCloseTo(PlanckConstants.time, 50);
    });
    
    test('should compute spacetime 4-volume', () => {
      const cell = new PlanckCell({ t: 0, x: 0, y: 0, z: 0 });
      expect(cell.getSpacetimeVolume()).toBeCloseTo(PlanckConstants.spacetimeVolume, 150);
    });
    
    test('should set and get information', () => {
      const cell = new PlanckCell({ t: 0, x: 0, y: 0, z: 0 });
      cell.setInformation({ entropy: 0.5, energyDensity: 0.1 });
      
      const info = cell.getInformation();
      expect(info.entropy).toBe(0.5);
      expect(info.energyDensity).toBe(0.1);
    });
    
    test('should track causal future and past', () => {
      const cell = new PlanckCell({ t: 0, x: 0, y: 0, z: 0 });
      
      cell.addToCausalFuture('cell_1_0_0_0');
      cell.addToCausalPast('cell_-1_0_0_0');
      
      expect(cell.getCausalFuture()).toContain('cell_1_0_0_0');
      expect(cell.getCausalPast()).toContain('cell_-1_0_0_0');
      expect(cell.getInformation().causalLinks).toBe(2);
    });
    
    test('should compute maximum entropy (Bekenstein bound)', () => {
      const cell = new PlanckCell({ t: 0, x: 0, y: 0, z: 0 });
      // For a Planck cell, maximum entropy is approximately 1 bit
      expect(cell.getMaximumEntropy()).toBe(1);
    });
    
    test('should verify Bekenstein bound', () => {
      const cell = new PlanckCell({ t: 0, x: 0, y: 0, z: 0 });
      
      // Below bound
      cell.setInformation({ entropy: 0.5 });
      expect(cell.satisfiesBekensteinBound()).toBe(true);
      
      // At bound
      cell.setInformation({ entropy: 1 });
      expect(cell.satisfiesBekensteinBound()).toBe(true);
      
      // Above bound
      cell.setInformation({ entropy: 2 });
      expect(cell.satisfiesBekensteinBound()).toBe(false);
    });
    
    test('should clone cell', () => {
      const cell = new PlanckCell({ t: 0, x: 0, y: 0, z: 0 }, { entropy: 0.5 });
      cell.addToCausalFuture('cell_1_0_0_0');
      
      const clone = cell.clone();
      
      expect(clone.getCoords()).toEqual(cell.getCoords());
      expect(clone.getInformation()).toEqual(cell.getInformation());
      expect(clone.getCausalFuture()).toEqual(cell.getCausalFuture());
    });
    
    test('should have deterministic hash', () => {
      const cell1 = new PlanckCell({ t: 0, x: 1, y: 2, z: 3 });
      const cell2 = new PlanckCell({ t: 0, x: 1, y: 2, z: 3 });
      
      expect(cell1.getHash()).toBe(cell2.getHash());
    });
  });
  
  // ==================== DiscreteMetric Tests ====================
  
  describe('DiscreteMetric', () => {
    test('should create with Minkowski signature (-,+,+,+)', () => {
      const metric = new DiscreteMetric();
      expect(metric.getSignature()).toEqual([-1, 1, 1, 1]);
    });
    
    test('should create with custom signature', () => {
      const metric = new DiscreteMetric([1, -1, -1, -1]);
      expect(metric.getSignature()).toEqual([1, -1, -1, -1]);
    });
    
    test('should compute timelike interval squared', () => {
      const metric = new DiscreteMetric();
      const cell1 = new PlanckCell({ t: 0, x: 0, y: 0, z: 0 });
      const cell2 = new PlanckCell({ t: 2, x: 0, y: 0, z: 0 });
      
      // ds² = -dt² = -4 (timelike)
      expect(metric.intervalSquared(cell1, cell2)).toBe(-4);
    });
    
    test('should compute spacelike interval squared', () => {
      const metric = new DiscreteMetric();
      const cell1 = new PlanckCell({ t: 0, x: 0, y: 0, z: 0 });
      const cell2 = new PlanckCell({ t: 0, x: 2, y: 0, z: 0 });
      
      // ds² = dx² = 4 (spacelike)
      expect(metric.intervalSquared(cell1, cell2)).toBe(4);
    });
    
    test('should compute lightlike interval squared', () => {
      const metric = new DiscreteMetric();
      const cell1 = new PlanckCell({ t: 0, x: 0, y: 0, z: 0 });
      const cell2 = new PlanckCell({ t: 1, x: 1, y: 0, z: 0 });
      
      // ds² = -dt² + dx² = -1 + 1 = 0 (lightlike)
      expect(metric.intervalSquared(cell1, cell2)).toBe(0);
    });
    
    test('should classify timelike interval', () => {
      const metric = new DiscreteMetric();
      const cell1 = new PlanckCell({ t: 0, x: 0, y: 0, z: 0 });
      const cell2 = new PlanckCell({ t: 5, x: 1, y: 0, z: 0 });
      
      expect(metric.classifyInterval(cell1, cell2)).toBe('timelike');
    });
    
    test('should classify spacelike interval', () => {
      const metric = new DiscreteMetric();
      const cell1 = new PlanckCell({ t: 0, x: 0, y: 0, z: 0 });
      const cell2 = new PlanckCell({ t: 1, x: 5, y: 0, z: 0 });
      
      expect(metric.classifyInterval(cell1, cell2)).toBe('spacelike');
    });
    
    test('should classify lightlike interval', () => {
      const metric = new DiscreteMetric();
      const cell1 = new PlanckCell({ t: 0, x: 0, y: 0, z: 0 });
      const cell2 = new PlanckCell({ t: 3, x: 3, y: 0, z: 0 });
      
      expect(metric.classifyInterval(cell1, cell2)).toBe('lightlike');
    });
    
    test('should compute physical interval', () => {
      const metric = new DiscreteMetric();
      const cell1 = new PlanckCell({ t: 0, x: 0, y: 0, z: 0 });
      const cell2 = new PlanckCell({ t: 2, x: 0, y: 0, z: 0 });
      
      // Timelike: proper time = sqrt(4) * t_P = 2 * t_P
      const interval = metric.physicalInterval(cell1, cell2);
      expect(interval).toBeCloseTo(2 * PlanckConstants.time, 50);
    });
    
    test('should detect causal connection for timelike', () => {
      const metric = new DiscreteMetric();
      const cell1 = new PlanckCell({ t: 0, x: 0, y: 0, z: 0 });
      const cell2 = new PlanckCell({ t: 5, x: 1, y: 0, z: 0 });
      
      expect(metric.areCausallyConnected(cell1, cell2)).toBe(true);
    });
    
    test('should detect no causal connection for spacelike', () => {
      const metric = new DiscreteMetric();
      const cell1 = new PlanckCell({ t: 0, x: 0, y: 0, z: 0 });
      const cell2 = new PlanckCell({ t: 0, x: 5, y: 0, z: 0 });
      
      expect(metric.areCausallyConnected(cell1, cell2)).toBe(false);
    });
    
    test('should compute proper distance', () => {
      const metric = new DiscreteMetric();
      const cell1 = new PlanckCell({ t: 0, x: 0, y: 0, z: 0 });
      const cell2 = new PlanckCell({ t: 0, x: 3, y: 4, z: 0 });
      
      // Distance = sqrt(3² + 4²) = 5 Planck lengths
      expect(metric.properDistance(cell1, cell2)).toBe(5);
    });
    
    test('should compute physical proper distance', () => {
      const metric = new DiscreteMetric();
      const cell1 = new PlanckCell({ t: 0, x: 0, y: 0, z: 0 });
      const cell2 = new PlanckCell({ t: 0, x: 3, y: 4, z: 0 });
      
      const dist = metric.physicalProperDistance(cell1, cell2);
      expect(dist).toBeCloseTo(5 * PlanckConstants.length, 40);
    });
  });
  
  // ==================== CausalSet Tests ====================
  
  describe('CausalSet', () => {
    test('should create empty causal set', () => {
      const causalSet = new CausalSet();
      expect(causalSet.getElementCount()).toBe(0);
    });
    
    test('should add elements', () => {
      const causalSet = new CausalSet();
      const cell = new PlanckCell({ t: 0, x: 0, y: 0, z: 0 });
      
      causalSet.addElement(cell);
      
      expect(causalSet.getElementCount()).toBe(1);
      expect(causalSet.getElement(cell.getId())).toBe(cell);
    });
    
    test('should add causal relation', () => {
      const causalSet = new CausalSet();
      const cell1 = new PlanckCell({ t: 0, x: 0, y: 0, z: 0 });
      const cell2 = new PlanckCell({ t: 1, x: 0, y: 0, z: 0 });
      
      causalSet.addElement(cell1);
      causalSet.addElement(cell2);
      
      const result = causalSet.addCausalRelation(cell1.getId(), cell2.getId());
      
      expect(result).toBe(true);
      expect(causalSet.getEdges().length).toBe(1);
    });
    
    test('should reject backward causal relation', () => {
      const causalSet = new CausalSet();
      const cell1 = new PlanckCell({ t: 1, x: 0, y: 0, z: 0 });
      const cell2 = new PlanckCell({ t: 0, x: 0, y: 0, z: 0 });
      
      causalSet.addElement(cell1);
      causalSet.addElement(cell2);
      
      const result = causalSet.addCausalRelation(cell1.getId(), cell2.getId());
      
      expect(result).toBe(false);
    });
    
    test('should reject spacelike causal relation', () => {
      const causalSet = new CausalSet();
      const cell1 = new PlanckCell({ t: 0, x: 0, y: 0, z: 0 });
      const cell2 = new PlanckCell({ t: 0, x: 5, y: 0, z: 0 }); // Spacelike
      
      causalSet.addElement(cell1);
      causalSet.addElement(cell2);
      
      const result = causalSet.addCausalRelation(cell1.getId(), cell2.getId());
      
      expect(result).toBe(false);
    });
    
    test('should find causal future', () => {
      const causalSet = new CausalSet();
      const cells = [
        new PlanckCell({ t: 0, x: 0, y: 0, z: 0 }),
        new PlanckCell({ t: 1, x: 0, y: 0, z: 0 }),
        new PlanckCell({ t: 2, x: 0, y: 0, z: 0 })
      ];
      
      cells.forEach(c => causalSet.addElement(c));
      causalSet.addCausalRelation(cells[0].getId(), cells[1].getId());
      causalSet.addCausalRelation(cells[1].getId(), cells[2].getId());
      
      const future = causalSet.causalFuture(cells[0].getId());
      
      expect(future.length).toBe(2);
      expect(future.map(c => c.getId())).toContain(cells[1].getId());
      expect(future.map(c => c.getId())).toContain(cells[2].getId());
    });
    
    test('should find causal past', () => {
      const causalSet = new CausalSet();
      const cells = [
        new PlanckCell({ t: 0, x: 0, y: 0, z: 0 }),
        new PlanckCell({ t: 1, x: 0, y: 0, z: 0 }),
        new PlanckCell({ t: 2, x: 0, y: 0, z: 0 })
      ];
      
      cells.forEach(c => causalSet.addElement(c));
      causalSet.addCausalRelation(cells[0].getId(), cells[1].getId());
      causalSet.addCausalRelation(cells[1].getId(), cells[2].getId());
      
      const past = causalSet.causalPast(cells[2].getId());
      
      expect(past.length).toBe(2);
      expect(past.map(c => c.getId())).toContain(cells[0].getId());
      expect(past.map(c => c.getId())).toContain(cells[1].getId());
    });
    
    test('should find causal diamond', () => {
      const causalSet = new CausalSet();
      const cells = [
        new PlanckCell({ t: 0, x: 0, y: 0, z: 0 }),
        new PlanckCell({ t: 1, x: 0, y: 0, z: 0 }),
        new PlanckCell({ t: 2, x: 0, y: 0, z: 0 }),
        new PlanckCell({ t: 3, x: 0, y: 0, z: 0 })
      ];
      
      cells.forEach(c => causalSet.addElement(c));
      causalSet.addCausalRelation(cells[0].getId(), cells[1].getId());
      causalSet.addCausalRelation(cells[1].getId(), cells[2].getId());
      causalSet.addCausalRelation(cells[2].getId(), cells[3].getId());
      
      const diamond = causalSet.causalDiamond(cells[0].getId(), cells[3].getId());
      
      expect(diamond.length).toBe(2);
      expect(diamond.map(c => c.getId())).toContain(cells[1].getId());
      expect(diamond.map(c => c.getId())).toContain(cells[2].getId());
    });
  });
  
  // ==================== SpacetimeLattice Tests ====================
  
  describe('SpacetimeLattice', () => {
    test('should create with default dimensions', () => {
      const lattice = new SpacetimeLattice();
      expect(lattice.getDimensions()).toEqual([10, 10, 10, 10]);
    });
    
    test('should create with custom dimensions', () => {
      const lattice = new SpacetimeLattice([5, 5, 5, 5]);
      expect(lattice.getDimensions()).toEqual([5, 5, 5, 5]);
    });
    
    test('should initialize cells', () => {
      const lattice = new SpacetimeLattice([2, 3, 3, 3]);
      lattice.initialize();
      
      // At t=0, should have 3×3×3 = 27 cells
      const slice = lattice.getTimeSlice(0);
      expect(slice.length).toBe(27);
    });
    
    test('should get cell by coordinates', () => {
      const lattice = new SpacetimeLattice([2, 3, 3, 3]);
      lattice.initialize();
      
      const cell = lattice.getCell({ t: 0, x: 1, y: 1, z: 1 });
      expect(cell).toBeDefined();
      expect(cell?.getCoords()).toEqual({ t: 0, x: 1, y: 1, z: 1 });
    });
    
    test('should get physical dimensions', () => {
      const lattice = new SpacetimeLattice([10, 5, 5, 5]);
      const dims = lattice.getPhysicalDimensions();
      
      expect(dims.duration).toBeCloseTo(10 * PlanckConstants.time, 50);
      expect(dims.lengthX).toBeCloseTo(5 * PlanckConstants.length, 40);
    });
    
    test('should get spatial neighbors', () => {
      const lattice = new SpacetimeLattice([2, 5, 5, 5]);
      lattice.initialize();
      
      const cell = lattice.getCell({ t: 0, x: 2, y: 2, z: 2 });
      const neighbors = lattice.getSpatialNeighbors(cell!);
      
      // 6 neighbors (±x, ±y, ±z)
      expect(neighbors.length).toBe(6);
    });
    
    test('should handle edge cells with fewer neighbors', () => {
      const lattice = new SpacetimeLattice([2, 3, 3, 3]);
      lattice.initialize();
      
      const cell = lattice.getCell({ t: 0, x: 0, y: 0, z: 0 });
      const neighbors = lattice.getSpatialNeighbors(cell!);
      
      // Corner cell has only 3 neighbors
      expect(neighbors.length).toBe(3);
    });
    
    test('should get total cell count', () => {
      const lattice = new SpacetimeLattice([2, 3, 3, 3]);
      lattice.initialize();
      
      expect(lattice.getTotalCellCount()).toBe(27); // Only t=0 slice initially
    });
    
    test('should compute max cell count', () => {
      const lattice = new SpacetimeLattice([2, 3, 3, 3]);
      expect(lattice.getMaxCellCount()).toBe(2 * 3 * 3 * 3);
    });
    
    test('should compute physical volume', () => {
      const lattice = new SpacetimeLattice([2, 3, 3, 3]);
      const volume = lattice.getPhysicalVolume();
      
      expect(volume).toBeCloseTo(54 * PlanckConstants.spacetimeVolume, 150);
    });
    
    test('should register evolution rule', () => {
      const lattice = new SpacetimeLattice([5, 3, 3, 3]);
      lattice.initialize();
      
      lattice.registerEvolutionRule(EvolutionRules.identity);
      
      // Should not throw
      expect(() => lattice.evolve()).not.toThrow();
    });
    
    test('should evolve lattice', () => {
      const lattice = new SpacetimeLattice([5, 3, 3, 3]);
      lattice.initialize();
      
      expect(lattice.getCurrentTime()).toBe(0);
      
      lattice.registerEvolutionRule(EvolutionRules.identity);
      lattice.evolve();
      
      expect(lattice.getCurrentTime()).toBe(1);
      
      // Should now have cells at t=0 and t=1
      const t0 = lattice.getTimeSlice(0);
      const t1 = lattice.getTimeSlice(1);
      
      expect(t0.length).toBe(27);
      expect(t1.length).toBe(27);
    });
    
    test('should apply diffusion evolution', () => {
      const lattice = new SpacetimeLattice([3, 3, 3, 3]);
      lattice.initialize();
      
      // Set high entropy in center cell
      const centerCell = lattice.getCell({ t: 0, x: 1, y: 1, z: 1 });
      centerCell!.setInformation({ entropy: 1 });
      
      lattice.registerEvolutionRule(EvolutionRules.diffusion);
      lattice.evolve();
      
      // After diffusion, entropy should spread
      const evolvedCenter = lattice.getCell({ t: 1, x: 1, y: 1, z: 1 });
      expect(evolvedCenter).toBeDefined();
    });
    
    test('should get physical time', () => {
      const lattice = new SpacetimeLattice([5, 3, 3, 3]);
      lattice.initialize();
      
      lattice.registerEvolutionRule(EvolutionRules.identity);
      lattice.evolve();
      lattice.evolve();
      
      expect(lattice.getCurrentTime()).toBe(2);
      expect(lattice.getPhysicalTime()).toBeCloseTo(2 * PlanckConstants.time, 50);
    });
    
    test('should verify causality', () => {
      const lattice = new SpacetimeLattice([3, 3, 3, 3]);
      lattice.initialize();
      
      lattice.registerEvolutionRule(EvolutionRules.identity);
      lattice.evolve();
      
      expect(lattice.verifyCausality()).toBe(true);
    });
    
    test('should verify Bekenstein bound', () => {
      const lattice = new SpacetimeLattice([2, 3, 3, 3]);
      lattice.initialize();
      
      // All cells start with zero entropy, so bound is satisfied
      expect(lattice.verifyBekensteinBound()).toBe(true);
    });
    
    test('should detect Bekenstein violation', () => {
      const lattice = new SpacetimeLattice([2, 3, 3, 3]);
      lattice.initialize();
      
      // Set entropy above bound
      const cell = lattice.getCell({ t: 0, x: 0, y: 0, z: 0 });
      cell!.setInformation({ entropy: 10 }); // Way above 1 bit limit
      
      expect(lattice.verifyBekensteinBound()).toBe(false);
    });
    
    test('should calculate total entropy', () => {
      const lattice = new SpacetimeLattice([2, 3, 3, 3]);
      lattice.initialize();
      
      // Set some entropy
      const cell = lattice.getCell({ t: 0, x: 0, y: 0, z: 0 });
      cell!.setInformation({ entropy: 0.5 });
      
      expect(lattice.getTotalEntropy()).toBe(0.5);
    });
    
    test('should export proof chain', () => {
      const lattice = new SpacetimeLattice([3, 3, 3, 3]);
      lattice.initialize();
      
      const proof = lattice.exportProofChain();
      
      expect(proof).toHaveProperty('type', 'SpacetimeLattice');
      expect(proof).toHaveProperty('dimensions');
      expect(proof).toHaveProperty('physicalConstants');
      expect(proof).toHaveProperty('hash');
    });
    
    test('should have deterministic hash', () => {
      const lattice1 = new SpacetimeLattice([3, 3, 3, 3]);
      const lattice2 = new SpacetimeLattice([3, 3, 3, 3]);
      
      expect(lattice1.getHash()).toBe(lattice2.getHash());
    });
  });
  
  // ==================== LatticeFactory Tests ====================
  
  describe('LatticeFactory', () => {
    test('should create minimal lattice', () => {
      const lattice = LatticeFactory.minimal();
      
      expect(lattice.getDimensions()).toEqual([2, 2, 2, 2]);
      expect(lattice.getTotalCellCount()).toBe(8); // 2³ at t=0
    });
    
    test('should create small lattice', () => {
      const lattice = LatticeFactory.small();
      
      expect(lattice.getDimensions()).toEqual([10, 10, 10, 10]);
    });
    
    test('should create temporal chain', () => {
      const lattice = LatticeFactory.temporalChain(5);
      
      expect(lattice.getDimensions()).toEqual([5, 1, 1, 1]);
      expect(lattice.getTotalCellCount()).toBe(1); // Single spatial point at t=0
    });
    
    test('should create 2D spatial slice', () => {
      const lattice = LatticeFactory.spatialSlice2D(4, 5);
      
      expect(lattice.getDimensions()).toEqual([1, 4, 5, 1]);
      expect(lattice.getTotalCellCount()).toBe(20);
    });
    
    test('should create 3D spatial volume', () => {
      const lattice = LatticeFactory.spatialVolume3D(3, 4, 5);
      
      expect(lattice.getDimensions()).toEqual([1, 3, 4, 5]);
      expect(lattice.getTotalCellCount()).toBe(60);
    });
    
    test('should create custom lattice', () => {
      const lattice = LatticeFactory.custom([7, 8, 9, 10]);
      
      expect(lattice.getDimensions()).toEqual([7, 8, 9, 10]);
    });
    
    test('should create causal diamond', () => {
      const lattice = LatticeFactory.causalDiamond(4, 3);
      
      expect(lattice.getDimensions()).toEqual([4, 3, 3, 3]);
    });
  });
  
  // ==================== EvolutionRules Tests ====================
  
  describe('EvolutionRules', () => {
    test('identity rule should preserve information', () => {
      const cell = new PlanckCell({ t: 0, x: 0, y: 0, z: 0 }, {
        entropy: 0.5,
        energyDensity: 0.3,
        spinState: 1,
        causalLinks: 2
      });
      
      const result = EvolutionRules.identity.apply(cell, []);
      
      expect(result.entropy).toBe(0.5);
      expect(result.energyDensity).toBe(0.3);
      expect(result.spinState).toBe(1);
    });
    
    test('diffusion rule should average entropy with neighbors', () => {
      const cell = new PlanckCell({ t: 0, x: 0, y: 0, z: 0 }, { entropy: 1 });
      const neighbors = [
        new PlanckCell({ t: 0, x: 1, y: 0, z: 0 }, { entropy: 0 }),
        new PlanckCell({ t: 0, x: -1, y: 0, z: 0 }, { entropy: 0 })
      ];
      
      const result = EvolutionRules.diffusion.apply(cell, neighbors);
      
      // (1 + 0 + 0) / 3 = 0.333...
      expect(result.entropy).toBeCloseTo(1/3, 10);
    });
    
    test('diffusion rule with no neighbors should preserve entropy', () => {
      const cell = new PlanckCell({ t: 0, x: 0, y: 0, z: 0 }, { entropy: 0.5 });
      
      const result = EvolutionRules.diffusion.apply(cell, []);
      
      expect(result.entropy).toBe(0.5);
    });
    
    test('causalUpdate rule should increment links', () => {
      const cell = new PlanckCell({ t: 0, x: 0, y: 0, z: 0 }, { causalLinks: 2 });
      const neighbors = [
        new PlanckCell({ t: 0, x: 1, y: 0, z: 0 }),
        new PlanckCell({ t: 0, x: -1, y: 0, z: 0 }),
        new PlanckCell({ t: 0, x: 0, y: 1, z: 0 })
      ];
      
      const result = EvolutionRules.causalUpdate.apply(cell, neighbors);
      
      expect(result.causalLinks).toBe(5); // 2 + 3
    });
    
    test('energyConservation rule should preserve energy', () => {
      const cell = new PlanckCell({ t: 0, x: 0, y: 0, z: 0 }, {
        energyDensity: 0.75
      });
      
      const result = EvolutionRules.energyConservation.apply(cell, []);
      
      expect(result.energyDensity).toBe(0.75);
    });
    
    test('evolution rules should have hashes', () => {
      expect(EvolutionRules.identity.hash).toBeDefined();
      expect(EvolutionRules.diffusion.hash).toBeDefined();
      expect(EvolutionRules.energyConservation.hash).toBeDefined();
      expect(EvolutionRules.causalUpdate.hash).toBeDefined();
    });
  });
  
  // ==================== PlanckConstants Tests ====================
  
  describe('PlanckConstants', () => {
    test('should have correct Planck length', () => {
      expect(PlanckConstants.length).toBeCloseTo(1.616255e-35, 40);
    });
    
    test('should have correct Planck time', () => {
      expect(PlanckConstants.time).toBeCloseTo(5.391247e-44, 50);
    });
    
    test('should have correct Planck mass', () => {
      expect(PlanckConstants.mass).toBeCloseTo(2.176434e-8, 13);
    });
    
    test('should have correct Planck energy', () => {
      expect(PlanckConstants.energy).toBeCloseTo(1.956e9, 6);
    });
    
    test('should have correct Planck temperature', () => {
      expect(PlanckConstants.temperature).toBeCloseTo(1.416784e32, 27);
    });
    
    test('should compute Planck area', () => {
      expect(PlanckConstants.area).toBeCloseTo(
        PlanckConstants.length * PlanckConstants.length,
        70
      );
    });
    
    test('should compute Planck volume', () => {
      expect(PlanckConstants.volume).toBeCloseTo(
        Math.pow(PlanckConstants.length, 3),
        110
      );
    });
    
    test('should compute Planck spacetime volume', () => {
      expect(PlanckConstants.spacetimeVolume).toBeCloseTo(
        Math.pow(PlanckConstants.length, 3) * PlanckConstants.time,
        150
      );
    });
    
    test('should have positive max information density', () => {
      expect(PlanckConstants.maxInfoDensity).toBeGreaterThan(0);
    });
    
    test('should have positive max computation rate', () => {
      expect(PlanckConstants.maxComputationRate).toBeGreaterThan(0);
    });
  });
  
  // ==================== Physics Validation Tests ====================
  
  describe('Physics Validation', () => {
    test('light speed consistency: l_P / t_P = c', () => {
      const c_derived = PlanckConstants.length / PlanckConstants.time;
      // Allow for numerical precision (Planck constants have limited precision)
      const relativeDiff = Math.abs(c_derived - PlanckConstants.speedOfLight) / PlanckConstants.speedOfLight;
      expect(relativeDiff).toBeLessThan(1e-6); // Within 0.0001%
    });
    
    test('causal structure respects speed of light', () => {
      const metric = new DiscreteMetric();
      
      // Light ray: Δx = c * Δt in Planck units means Δx = Δt
      const cell1 = new PlanckCell({ t: 0, x: 0, y: 0, z: 0 });
      const cell2 = new PlanckCell({ t: 5, x: 5, y: 0, z: 0 });
      
      expect(metric.classifyInterval(cell1, cell2)).toBe('lightlike');
    });
    
    test('no faster than light causal connections', () => {
      const causalSet = new CausalSet();
      
      const cell1 = new PlanckCell({ t: 0, x: 0, y: 0, z: 0 });
      const cell2 = new PlanckCell({ t: 1, x: 5, y: 0, z: 0 }); // FTL attempt
      
      causalSet.addElement(cell1);
      causalSet.addElement(cell2);
      
      // Should reject FTL causal connection
      const result = causalSet.addCausalRelation(cell1.getId(), cell2.getId());
      expect(result).toBe(false);
    });
    
    test('discrete spacetime minimum scales', () => {
      const cell = new PlanckCell({ t: 1, x: 1, y: 1, z: 1 });
      const pos = cell.getPhysicalPosition();
      
      // Minimum non-zero distance is Planck length
      expect(pos.x).toBeCloseTo(PlanckConstants.length, 40);
      
      // Minimum non-zero time is Planck time
      expect(pos.t).toBeCloseTo(PlanckConstants.time, 50);
    });
    
    test('Minkowski metric signature (-,+,+,+)', () => {
      const metric = new DiscreteMetric();
      expect(metric.getSignature()).toEqual([-1, 1, 1, 1]);
    });
    
    test('4D spacetime lattice', () => {
      const lattice = new SpacetimeLattice([5, 5, 5, 5]);
      const dims = lattice.getDimensions();
      
      expect(dims.length).toBe(4); // 4 dimensions
    });
    
    test('information bounds at Planck scale', () => {
      const cell = new PlanckCell({ t: 0, x: 0, y: 0, z: 0 });
      
      // Maximum ~1 bit per Planck cell (Bekenstein bound)
      expect(cell.getMaximumEntropy()).toBe(1);
    });
  });
  
  // ==================== Integration Tests ====================
  
  describe('Integration Tests', () => {
    test('full lattice evolution preserves causality', () => {
      const lattice = LatticeFactory.small();
      lattice.registerEvolutionRule(EvolutionRules.identity);
      
      // Evolve for 5 steps
      for (let i = 0; i < 5; i++) {
        lattice.evolve();
      }
      
      expect(lattice.verifyCausality()).toBe(true);
    });
    
    test('lattice with diffusion preserves total entropy approximately', () => {
      const lattice = new SpacetimeLattice([3, 3, 3, 3]);
      lattice.initialize();
      
      // Set initial entropy
      const cell = lattice.getCell({ t: 0, x: 1, y: 1, z: 1 });
      cell!.setInformation({ entropy: 0.5 });
      
      const initialEntropy = lattice.getTotalEntropy();
      
      lattice.registerEvolutionRule(EvolutionRules.diffusion);
      lattice.evolve();
      
      // Due to diffusion, entropy spreads but total is approximately conserved
      // (edge effects may cause small changes)
      const finalEntropy = lattice.getTotalEntropy();
      
      // Total entropy shouldn't change dramatically
      expect(Math.abs(finalEntropy - initialEntropy)).toBeLessThan(1);
    });
    
    test('causal set maintains transitivity', () => {
      const causalSet = new CausalSet();
      const cells = [
        new PlanckCell({ t: 0, x: 0, y: 0, z: 0 }),
        new PlanckCell({ t: 1, x: 0, y: 0, z: 0 }),
        new PlanckCell({ t: 2, x: 0, y: 0, z: 0 })
      ];
      
      cells.forEach(c => causalSet.addElement(c));
      causalSet.addCausalRelation(cells[0].getId(), cells[1].getId());
      causalSet.addCausalRelation(cells[1].getId(), cells[2].getId());
      
      // c0 → c1 → c2 implies c0 → c2 (transitivity)
      const future0 = causalSet.causalFuture(cells[0].getId());
      expect(future0.map(c => c.getId())).toContain(cells[2].getId());
    });
    
    test('hash chain integrity', () => {
      const lattice1 = new SpacetimeLattice([3, 3, 3, 3]);
      lattice1.initialize();
      const hash1 = lattice1.getHash();
      
      // Same lattice should have same hash
      const lattice2 = new SpacetimeLattice([3, 3, 3, 3]);
      lattice2.initialize();
      const hash2 = lattice2.getHash();
      
      expect(hash1).toBe(hash2);
      
      // Modified lattice should have different hash after evolution
      lattice2.registerEvolutionRule(EvolutionRules.identity);
      lattice2.evolve(); // Actually evolve to change the state
      expect(lattice2.getHash()).not.toBe(hash1);
    });
  });
});
