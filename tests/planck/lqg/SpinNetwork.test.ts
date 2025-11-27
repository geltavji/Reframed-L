/**
 * SpinNetwork.test.ts - Tests for Loop Quantum Gravity Basics
 * PRD-04 Phase 4.3: Module M04.03
 */

import {
  SpinValueUtil,
  AreaQuantum,
  VolumeQuantum,
  SpinNetwork,
  SpinNetworkFactory,
  ClebschGordan,
  LQGConstants
} from '../../../src/planck/lqg/SpinNetwork';

describe('SpinNetwork - PRD-04 Phase 4.3', () => {

  // ==================== SpinValueUtil Tests ====================

  describe('SpinValueUtil', () => {
    let spinUtil: SpinValueUtil;

    beforeEach(() => {
      spinUtil = new SpinValueUtil();
    });

    test('should create integer spin', () => {
      const spin = spinUtil.create(1);
      expect(spin.j).toBe(1);
      expect(spin.isHalfInteger).toBe(false);
    });

    test('should create half-integer spin', () => {
      const spin = spinUtil.create(0.5);
      expect(spin.j).toBe(0.5);
      expect(spin.isHalfInteger).toBe(true);
    });

    test('should create spin with magnetic quantum number', () => {
      const spin = spinUtil.createWithM(1, 0);
      expect(spin.j).toBe(1);
      expect(spin.m).toBe(0);
    });

    test('should throw for negative spin', () => {
      expect(() => spinUtil.create(-0.5)).toThrow();
    });

    test('should throw for invalid spin value', () => {
      expect(() => spinUtil.create(0.3)).toThrow();
    });

    test('should throw for invalid m value', () => {
      expect(() => spinUtil.createWithM(1, 2)).toThrow();
    });

    test('should calculate Casimir eigenvalue', () => {
      const spin = spinUtil.create(1);
      const eigenvalue = spinUtil.casimirEigenvalue(spin);
      expect(eigenvalue).toBeCloseTo(Math.sqrt(2), 10);
    });

    test('should calculate Casimir eigenvalue for j=0.5', () => {
      const spin = spinUtil.create(0.5);
      const eigenvalue = spinUtil.casimirEigenvalue(spin);
      expect(eigenvalue).toBeCloseTo(Math.sqrt(0.75), 10);
    });

    test('should calculate spin dimension', () => {
      const spin = spinUtil.create(1);
      expect(spinUtil.dimension(spin)).toBe(3);
    });

    test('should calculate dimension for j=0.5', () => {
      const spin = spinUtil.create(0.5);
      expect(spinUtil.dimension(spin)).toBe(2);
    });

    test('should get coupled spins', () => {
      const j1 = spinUtil.create(1);
      const j2 = spinUtil.create(0.5);
      const coupled = spinUtil.coupledSpins(j1, j2);
      
      expect(coupled.length).toBe(2);
      expect(coupled[0].j).toBe(0.5);
      expect(coupled[1].j).toBe(1.5);
    });

    test('should verify triangle inequality', () => {
      const j1 = spinUtil.create(1);
      const j2 = spinUtil.create(1);
      const j3 = spinUtil.create(1);
      
      expect(spinUtil.triangleInequality(j1, j2, j3)).toBe(true);
    });

    test('should fail triangle inequality for incompatible spins', () => {
      const j1 = spinUtil.create(1);
      const j2 = spinUtil.create(1);
      const j3 = spinUtil.create(5);
      
      expect(spinUtil.triangleInequality(j1, j2, j3)).toBe(false);
    });

    test('should have deterministic hash', () => {
      const hash1 = spinUtil.getHash();
      const spinUtil2 = new SpinValueUtil();
      expect(spinUtil2.getHash()).toBe(hash1);
    });
  });

  // ==================== AreaQuantum Tests ====================

  describe('AreaQuantum', () => {
    let areaQuantum: AreaQuantum;
    let spinUtil: SpinValueUtil;

    beforeEach(() => {
      areaQuantum = new AreaQuantum();
      spinUtil = new SpinValueUtil();
    });

    test('should compute area eigenvalue for j=0.5', () => {
      const spin = spinUtil.create(0.5);
      const result = areaQuantum.eigenvalue(spin);
      
      expect(result.spin.j).toBe(0.5);
      expect(result.eigenvalue).toBeCloseTo(Math.sqrt(0.75), 10);
      expect(result.area).toBeGreaterThan(0);
      expect(result.physicalArea).toBeGreaterThan(0);
    });

    test('should compute area eigenvalue for j=1', () => {
      const spin = spinUtil.create(1);
      const result = areaQuantum.eigenvalue(spin);
      
      expect(result.eigenvalue).toBeCloseTo(Math.sqrt(2), 10);
    });

    test('should compute total area from multiple spins', () => {
      const spins = [spinUtil.create(0.5), spinUtil.create(1)];
      const result = areaQuantum.totalArea(spins);
      
      const expectedEigenvalue = Math.sqrt(0.75) + Math.sqrt(2);
      expect(result.eigenvalue).toBeCloseTo(expectedEigenvalue, 10);
    });

    test('should compute area gap (minimum area)', () => {
      const gap = areaQuantum.areaGap();
      expect(gap.spin.j).toBe(0.5);
      expect(gap.area).toBeGreaterThan(0);
    });

    test('should generate area spectrum', () => {
      const spectrum = areaQuantum.spectrum(5);
      expect(spectrum.length).toBe(5);
      
      // Areas should increase
      for (let i = 1; i < spectrum.length; i++) {
        expect(spectrum[i].area).toBeGreaterThan(spectrum[i-1].area);
      }
    });

    test('should find closest spin for target area', () => {
      const targetSpin = spinUtil.create(1);
      const targetArea = areaQuantum.eigenvalue(targetSpin).physicalArea;
      
      const foundSpin = areaQuantum.closestSpin(targetArea);
      expect(foundSpin.j).toBe(1);
    });

    test('should return Barbero-Immirzi parameter', () => {
      const gamma = areaQuantum.getBarberoImmirzi();
      expect(gamma).toBeCloseTo(0.2375, 5);
    });

    test('should use custom Barbero-Immirzi', () => {
      const customArea = new AreaQuantum(0.5);
      expect(customArea.getBarberoImmirzi()).toBe(0.5);
    });

    test('should include hash in results', () => {
      const spin = spinUtil.create(0.5);
      const result = areaQuantum.eigenvalue(spin);
      expect(result.hash).toBeDefined();
      expect(result.hash.length).toBe(64);
    });

    test('should have deterministic hash', () => {
      const hash1 = areaQuantum.getHash();
      const areaQuantum2 = new AreaQuantum();
      expect(areaQuantum2.getHash()).toBe(hash1);
    });
  });

  // ==================== VolumeQuantum Tests ====================

  describe('VolumeQuantum', () => {
    let volumeQuantum: VolumeQuantum;
    let spinUtil: SpinValueUtil;

    beforeEach(() => {
      volumeQuantum = new VolumeQuantum();
      spinUtil = new SpinValueUtil();
    });

    test('should compute volume eigenvalue for 3 spins', () => {
      const spins = [
        spinUtil.create(0.5),
        spinUtil.create(0.5),
        spinUtil.create(0.5)
      ];
      const result = volumeQuantum.eigenvalue(spins, 'node1');
      
      expect(result.nodeId).toBe('node1');
      expect(result.volume).toBeGreaterThan(0);
      expect(result.physicalVolume).toBeGreaterThan(0);
    });

    test('should return zero volume for less than 3 spins', () => {
      const spins = [spinUtil.create(0.5), spinUtil.create(0.5)];
      const result = volumeQuantum.eigenvalue(spins, 'node1');
      
      expect(result.volume).toBe(0);
    });

    test('should compute volume gap', () => {
      const gap = volumeQuantum.volumeGap();
      expect(gap.volume).toBeGreaterThan(0);
    });

    test('should check if node can have volume', () => {
      expect(volumeQuantum.canHaveVolume(4)).toBe(true);
      expect(volumeQuantum.canHaveVolume(3)).toBe(false);
    });

    test('should return Barbero-Immirzi parameter', () => {
      const gamma = volumeQuantum.getBarberoImmirzi();
      expect(gamma).toBeCloseTo(0.2375, 5);
    });

    test('should use custom Barbero-Immirzi', () => {
      const customVolume = new VolumeQuantum(0.5);
      expect(customVolume.getBarberoImmirzi()).toBe(0.5);
    });

    test('should include hash in results', () => {
      const spins = [
        spinUtil.create(0.5),
        spinUtil.create(0.5),
        spinUtil.create(0.5)
      ];
      const result = volumeQuantum.eigenvalue(spins, 'node1');
      expect(result.hash).toBeDefined();
    });

    test('should have deterministic hash', () => {
      const hash1 = volumeQuantum.getHash();
      const volumeQuantum2 = new VolumeQuantum();
      expect(volumeQuantum2.getHash()).toBe(hash1);
    });
  });

  // ==================== SpinNetwork Tests ====================

  describe('SpinNetwork', () => {
    let network: SpinNetwork;
    let spinUtil: SpinValueUtil;

    beforeEach(() => {
      network = new SpinNetwork();
      spinUtil = new SpinValueUtil();
    });

    test('should add nodes', () => {
      const node = network.addNode('A');
      expect(node.id).toBe('A');
      expect(network.getNodeCount()).toBe(1);
    });

    test('should add nodes with position', () => {
      const node = network.addNode('A', [1, 2, 3]);
      expect(node.position).toEqual([1, 2, 3]);
    });

    test('should add edges', () => {
      network.addNode('A');
      network.addNode('B');
      const edge = network.addEdge('e1', 'A', 'B', spinUtil.create(1));
      
      expect(edge.id).toBe('e1');
      expect(edge.spin.j).toBe(1);
      expect(network.getEdgeCount()).toBe(1);
    });

    test('should throw when adding edge with nonexistent node', () => {
      network.addNode('A');
      expect(() => network.addEdge('e1', 'A', 'B', spinUtil.create(1))).toThrow();
    });

    test('should update node valence when adding edges', () => {
      network.addNode('A');
      network.addNode('B');
      network.addEdge('e1', 'A', 'B', spinUtil.create(1));
      
      const nodeA = network.getNode('A');
      const nodeB = network.getNode('B');
      
      expect(nodeA?.valence).toBe(1);
      expect(nodeB?.valence).toBe(1);
    });

    test('should compute area contribution of edges', () => {
      network.addNode('A');
      network.addNode('B');
      const edge = network.addEdge('e1', 'A', 'B', spinUtil.create(1));
      
      expect(edge.areaContribution).toBeGreaterThan(0);
    });

    test('should compute total area', () => {
      network.addNode('A');
      network.addNode('B');
      network.addEdge('e1', 'A', 'B', spinUtil.create(0.5));
      network.addEdge('e2', 'A', 'B', spinUtil.create(1));
      
      const totalArea = network.totalArea();
      expect(totalArea.area).toBeGreaterThan(0);
    });

    test('should compute total volume', () => {
      network.addNode('A');
      network.addNode('B');
      network.addNode('C');
      network.addNode('D');
      
      network.addEdge('e1', 'A', 'B', spinUtil.create(0.5));
      network.addEdge('e2', 'A', 'C', spinUtil.create(0.5));
      network.addEdge('e3', 'A', 'D', spinUtil.create(0.5));
      
      const totalVolume = network.totalVolume();
      expect(totalVolume).toBeGreaterThan(0);
    });

    test('should get all nodes', () => {
      network.addNode('A');
      network.addNode('B');
      
      const nodes = network.getAllNodes();
      expect(nodes.length).toBe(2);
    });

    test('should get all edges', () => {
      network.addNode('A');
      network.addNode('B');
      network.addEdge('e1', 'A', 'B', spinUtil.create(1));
      
      const edges = network.getAllEdges();
      expect(edges.length).toBe(1);
    });

    test('should get edges connected to a node', () => {
      network.addNode('A');
      network.addNode('B');
      network.addNode('C');
      network.addEdge('e1', 'A', 'B', spinUtil.create(1));
      network.addEdge('e2', 'A', 'C', spinUtil.create(1));
      
      const nodeEdges = network.getNodeEdges('A');
      expect(nodeEdges.length).toBe(2);
    });

    test('should check if network is connected', () => {
      network.addNode('A');
      network.addNode('B');
      network.addEdge('e1', 'A', 'B', spinUtil.create(1));
      
      expect(network.isConnected()).toBe(true);
    });

    test('should detect disconnected network', () => {
      network.addNode('A');
      network.addNode('B');
      network.addNode('C');
      network.addEdge('e1', 'A', 'B', spinUtil.create(1));
      // C is not connected
      
      expect(network.isConnected()).toBe(false);
    });

    test('should check gauge invariance', () => {
      network.addNode('A');
      network.addNode('B');
      network.addNode('C');
      network.addEdge('e1', 'A', 'B', spinUtil.create(1));
      network.addEdge('e2', 'B', 'C', spinUtil.create(1));
      network.addEdge('e3', 'A', 'C', spinUtil.create(1));
      
      expect(network.isGaugeInvariant()).toBe(true);
    });

    test('should export network configuration', () => {
      network.addNode('A');
      network.addNode('B');
      network.addEdge('e1', 'A', 'B', spinUtil.create(1));
      
      const config = network.export();
      expect(config.nodes.length).toBe(2);
      expect(config.edges.length).toBe(1);
      expect(config.barberoImmirzi).toBeCloseTo(0.2375, 5);
    });

    test('should have deterministic hash', () => {
      const hash1 = network.getHash();
      const network2 = new SpinNetwork();
      expect(network2.getHash()).toBe(hash1);
    });
  });

  // ==================== SpinNetworkFactory Tests ====================

  describe('SpinNetworkFactory', () => {
    let factory: SpinNetworkFactory;

    beforeEach(() => {
      factory = new SpinNetworkFactory();
    });

    test('should create theta network', () => {
      const network = factory.theta(1, 1, 1);
      expect(network.getNodeCount()).toBe(2);
      expect(network.getEdgeCount()).toBe(3);
    });

    test('should create tetrahedron network', () => {
      const network = factory.tetrahedron(1);
      expect(network.getNodeCount()).toBe(4);
      expect(network.getEdgeCount()).toBe(6);
    });

    test('should create cube network', () => {
      const network = factory.cube(1);
      expect(network.getNodeCount()).toBe(8);
      expect(network.getEdgeCount()).toBe(12);
    });

    test('should create chain network', () => {
      const network = factory.chain(5, 1);
      expect(network.getNodeCount()).toBe(6);
      expect(network.getEdgeCount()).toBe(5);
      expect(network.isConnected()).toBe(true);
    });

    test('should create loop network', () => {
      const network = factory.loop(6, 1);
      expect(network.getNodeCount()).toBe(6);
      expect(network.getEdgeCount()).toBe(6);
      expect(network.isConnected()).toBe(true);
    });

    test('should create 4-valent node', () => {
      const network = factory.fourValentNode(0.5, 0.5, 0.5, 0.5);
      expect(network.getNodeCount()).toBe(5);
      expect(network.getEdgeCount()).toBe(4);
      
      const center = network.getNode('center');
      expect(center?.valence).toBe(4);
    });

    test('theta network should be connected', () => {
      const network = factory.theta(1, 1, 1);
      expect(network.isConnected()).toBe(true);
    });

    test('tetrahedron should have non-zero area', () => {
      const network = factory.tetrahedron(1);
      const area = network.totalArea();
      expect(area.area).toBeGreaterThan(0);
    });

    test('should have deterministic hash', () => {
      const hash1 = factory.getHash();
      const factory2 = new SpinNetworkFactory();
      expect(factory2.getHash()).toBe(hash1);
    });
  });

  // ==================== ClebschGordan Tests ====================

  describe('ClebschGordan', () => {
    let cg: ClebschGordan;

    beforeEach(() => {
      cg = new ClebschGordan();
    });

    test('should return 0 for M ≠ m1 + m2', () => {
      const coeff = cg.coefficient(1, 1, 1, 0, 2, 0);
      expect(coeff).toBe(0);
    });

    test('should return 0 for J outside range', () => {
      const coeff = cg.coefficient(1, 0, 1, 0, 5, 0);
      expect(coeff).toBe(0);
    });

    test('should return 1 when j1 = 0', () => {
      const coeff = cg.coefficient(0, 0, 1, 0, 1, 0);
      expect(coeff).toBe(1);
    });

    test('should return 1 when j2 = 0', () => {
      const coeff = cg.coefficient(1, 0, 0, 0, 1, 0);
      expect(coeff).toBe(1);
    });

    test('should compute CG for j1=j2=0.5, J=1, M=1', () => {
      const coeff = cg.coefficient(0.5, 0.5, 0.5, 0.5, 1, 1);
      expect(coeff).toBe(1);
    });

    test('should compute CG for j1=j2=0.5, J=0, M=0', () => {
      const coeff = cg.coefficient(0.5, 0.5, 0.5, -0.5, 0, 0);
      expect(Math.abs(coeff)).toBeCloseTo(1 / Math.sqrt(2), 10);
    });

    test('should compute 6j symbol for simple case', () => {
      const symbol = cg.sixJSymbol(0.5, 0.5, 1, 0.5, 0.5, 1);
      expect(symbol).toBe(0.5);
    });

    test('should return 0 for 6j when triangle inequality fails', () => {
      const symbol = cg.sixJSymbol(0.5, 0.5, 5, 0.5, 0.5, 1);
      expect(symbol).toBe(0);
    });

    test('should cache coefficients', () => {
      const coeff1 = cg.coefficient(0.5, 0.5, 0.5, 0.5, 1, 1);
      const coeff2 = cg.coefficient(0.5, 0.5, 0.5, 0.5, 1, 1);
      expect(coeff1).toBe(coeff2);
    });

    test('should have deterministic hash', () => {
      const hash1 = cg.getHash();
      const cg2 = new ClebschGordan();
      expect(cg2.getHash()).toBe(hash1);
    });
  });

  // ==================== LQGConstants Tests ====================

  describe('LQGConstants', () => {
    test('should have correct Planck length', () => {
      expect(LQGConstants.lP).toBeCloseTo(1.616255e-35, 40);
    });

    test('should have correct Planck area', () => {
      expect(LQGConstants.lP2).toBeCloseTo(2.612e-70, 73);
    });

    test('should have Barbero-Immirzi parameter', () => {
      expect(LQGConstants.barberoImmirzi).toBeCloseTo(0.2375, 5);
    });

    test('should have area gap defined', () => {
      expect(LQGConstants.areaGap).toBeGreaterThan(0);
    });

    test('should have Planck volume', () => {
      expect(LQGConstants.planckVolume).toBeCloseTo(Math.pow(LQGConstants.lP, 3), 110);
    });

    test('should have speed of light', () => {
      expect(LQGConstants.c).toBe(299792458);
    });

    test('should have reduced Planck constant', () => {
      expect(LQGConstants.hbar).toBeCloseTo(1.054571817e-34, 44);
    });

    test('should have gravitational constant', () => {
      expect(LQGConstants.G).toBeCloseTo(6.6743e-11, 15);
    });
  });

  // ==================== Physics Validation Tests ====================

  describe('Physics Validation', () => {
    test('area gap should be of order Planck area', () => {
      const areaQuantum = new AreaQuantum();
      const gap = areaQuantum.areaGap();
      
      // Area gap should be O(l_P^2)
      expect(gap.physicalArea).toBeGreaterThan(0);
      expect(gap.physicalArea).toBeLessThan(1e-60); // Much less than macroscopic
    });

    test('area eigenvalues should be discrete', () => {
      const areaQuantum = new AreaQuantum();
      const spinUtil = new SpinValueUtil();
      
      const a1 = areaQuantum.eigenvalue(spinUtil.create(0.5));
      const a2 = areaQuantum.eigenvalue(spinUtil.create(1));
      
      // Should be distinct values
      expect(a1.area).not.toBe(a2.area);
    });

    test('volume should require at least 4-valent node', () => {
      const volumeQuantum = new VolumeQuantum();
      expect(volumeQuantum.canHaveVolume(4)).toBe(true);
      expect(volumeQuantum.canHaveVolume(3)).toBe(false);
    });

    test('spin network should conserve total spin', () => {
      const factory = new SpinNetworkFactory();
      const network = factory.theta(1, 1, 1);
      
      // All edges have same spin
      const edges = network.getAllEdges();
      for (const edge of edges) {
        expect(edge.spin.j).toBe(1);
      }
    });

    test('area formula A = 8πγl_P² √(j(j+1))', () => {
      const gamma = 0.2375;
      const lP2 = 2.612e-70;
      const j = 1;
      
      const expectedCasimir = Math.sqrt(j * (j + 1));
      const expectedArea = 8 * Math.PI * gamma * lP2 * expectedCasimir;
      
      const areaQuantum = new AreaQuantum(gamma);
      const spinUtil = new SpinValueUtil();
      const result = areaQuantum.eigenvalue(spinUtil.create(j));
      
      expect(result.physicalArea).toBeCloseTo(expectedArea, 80);
    });
  });

  // ==================== Integration Tests ====================

  describe('Integration Tests', () => {
    test('should create complex network and compute properties', () => {
      const factory = new SpinNetworkFactory();
      const network = factory.tetrahedron(1);
      
      const area = network.totalArea();
      const volume = network.totalVolume();
      
      expect(area.area).toBeGreaterThan(0);
      expect(volume).toBeGreaterThan(0);
      expect(network.isConnected()).toBe(true);
    });

    test('should maintain consistency after multiple operations', () => {
      const network = new SpinNetwork();
      const spinUtil = new SpinValueUtil();
      
      // Build a network incrementally
      network.addNode('A');
      network.addNode('B');
      network.addNode('C');
      
      network.addEdge('e1', 'A', 'B', spinUtil.create(0.5));
      network.addEdge('e2', 'B', 'C', spinUtil.create(1));
      network.addEdge('e3', 'A', 'C', spinUtil.create(0.5));
      
      // Check consistency
      const config = network.export();
      expect(config.nodes.length).toBe(3);
      expect(config.edges.length).toBe(3);
      expect(config.totalArea).toBeGreaterThan(0);
    });

    test('all factory methods should produce valid networks', () => {
      const factory = new SpinNetworkFactory();
      
      const networks = [
        factory.theta(1, 1, 1),
        factory.tetrahedron(0.5),
        factory.cube(1),
        factory.chain(3, 1),
        factory.loop(4, 0.5),
        factory.fourValentNode(1, 1, 1, 1)
      ];
      
      for (const network of networks) {
        expect(network.isConnected()).toBe(true);
        expect(network.totalArea().area).toBeGreaterThan(0);
      }
    });

    test('hash chains should be consistent', () => {
      const factory = new SpinNetworkFactory();
      const network1 = factory.tetrahedron(1);
      const network2 = factory.tetrahedron(1);
      
      // Same construction should give same hash
      expect(network1.getHash()).toBe(network2.getHash());
    });

    test('all classes should have hashes', () => {
      const spinUtil = new SpinValueUtil();
      const areaQuantum = new AreaQuantum();
      const volumeQuantum = new VolumeQuantum();
      const network = new SpinNetwork();
      const factory = new SpinNetworkFactory();
      const cg = new ClebschGordan();
      
      expect(spinUtil.getHash()).toBeDefined();
      expect(areaQuantum.getHash()).toBeDefined();
      expect(volumeQuantum.getHash()).toBeDefined();
      expect(network.getHash()).toBeDefined();
      expect(factory.getHash()).toBeDefined();
      expect(cg.getHash()).toBeDefined();
    });
  });
});
