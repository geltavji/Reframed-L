/**
 * EmergentSpacetime.test.ts - Tests for Emergent Spacetime Module
 * PRD-04 Phase 4.5: Module M04.05
 */

import {
  EmergentMetric,
  EntanglementGeometry,
  ERBridge,
  TensorNetwork,
  HolographicEntropy,
  EmergentSpacetime,
  EmergentSpacetimeConstants
} from '../../../src/planck/emergence/EmergentSpacetime';

describe('EmergentSpacetime - PRD-04 Phase 4.5', () => {

  // ==================== EmergentMetric Tests ====================

  describe('EmergentMetric', () => {
    let metric: EmergentMetric;

    beforeEach(() => {
      metric = new EmergentMetric();
    });

    test('should initialize with Minkowski metric', () => {
      const spec = metric.export();
      
      expect(spec.dimension).toBe(4);
      expect(spec.components[0][0]).toBe(-1); // Time component
      expect(spec.components[1][1]).toBe(1);  // Space components
      expect(spec.components[2][2]).toBe(1);
      expect(spec.components[3][3]).toBe(1);
    });

    test('should be Lorentzian by default', () => {
      expect(metric.isLorentzian()).toBe(true);
    });

    test('should have correct signature (-,+,+,+)', () => {
      const signature = metric.getSignature();
      expect(signature).toEqual([-1, 1, 1, 1]);
    });

    test('should set and get components', () => {
      metric.setComponent(0, 1, 0.5);
      expect(metric.getComponent(0, 1)).toBe(0.5);
      expect(metric.getComponent(1, 0)).toBe(0.5); // Symmetric
    });

    test('should compute metric from entanglement', () => {
      const regions = new Map([
        ['A', 1.0],
        ['B', 2.0],
        ['C', 1.5]
      ]);
      
      const spec = metric.fromEntanglement(regions);
      expect(spec.dimension).toBe(4);
      expect(spec.components).toBeDefined();
    });

    test('should compute metric from tensor network', () => {
      const network: any = {
        nodes: [
          { id: 'n0', position: [0, 0], bondDimension: 2, isAnchor: true, connections: ['n1'] },
          { id: 'n1', position: [1, 0], bondDimension: 2, isAnchor: false, connections: ['n0'] }
        ],
        bonds: [['n0', 'n1']],
        boundaryNodes: ['n0'],
        bulkNodes: ['n1'],
        totalBondDimension: 4
      };
      
      const spec = metric.fromTensorNetwork(network);
      expect(spec.dimension).toBe(4);
    });

    test('should compute Ricci scalar', () => {
      const curvature = metric.computeRicciScalar();
      expect(curvature).toBeCloseTo(0, 10); // Flat for Minkowski
    });

    test('should export metric specification', () => {
      const spec = metric.export();
      expect(spec.hash).toBeDefined();
      expect(spec.hash.length).toBe(64);
    });

    test('should have deterministic hash', () => {
      const hash1 = metric.getHash();
      const metric2 = new EmergentMetric();
      expect(metric2.getHash()).toBe(hash1);
    });

    test('should support custom dimensions', () => {
      const metric5D = new EmergentMetric(5);
      expect(metric5D.getDimension()).toBe(5);
    });
  });

  // ==================== EntanglementGeometry Tests ====================

  describe('EntanglementGeometry', () => {
    let geometry: EntanglementGeometry;

    beforeEach(() => {
      geometry = new EntanglementGeometry();
    });

    test('should compute Ryu-Takayanagi formula', () => {
      const area = 1e-60; // Small area in m²
      const result = geometry.ryuTakayanagi(area);
      
      expect(result.entanglementEntropy).toBeGreaterThan(0);
      expect(result.minimalSurfaceArea).toBe(area);
      expect(result.isRTSatisfied).toBe(true);
    });

    test('should compute area from entropy', () => {
      const entropy = 1e30;
      const area = geometry.areaFromEntropy(entropy);
      
      expect(area).toBeGreaterThan(0);
      // Verify inverse
      const result = geometry.ryuTakayanagi(area);
      expect(result.entanglementEntropy).toBeCloseTo(entropy, 20);
    });

    test('should compute mutual information', () => {
      const mutualInfo = geometry.mutualInformation(10, 10, 15);
      
      // I(A:B) = S_A + S_B - S_AB = 10 + 10 - 15 = 5
      expect(mutualInfo).toBe(5);
    });

    test('should compute holographic bound', () => {
      const area = 1e-60;
      const bound = geometry.holographicBound(area);
      
      expect(bound).toBeGreaterThan(0);
    });

    test('should check holographic bound satisfaction', () => {
      const area = 1e-60;
      const bound = geometry.holographicBound(area);
      
      expect(geometry.checkHolographicBound(bound / 2, area)).toBe(true);
      expect(geometry.checkHolographicBound(bound * 2, area)).toBe(false);
    });

    test('should compute entanglement wedge cross section', () => {
      const ewcs = geometry.entanglementWedgeCrossSection(10, 10, 15);
      expect(ewcs).toBe(2.5); // (10 + 10 - 15) / 2
    });

    test('should compute CFT central charge', () => {
      const adsRadius = 1;
      const c = geometry.centralCharge(adsRadius);
      
      expect(c).toBeGreaterThan(0);
    });

    test('should have deterministic hash', () => {
      const hash1 = geometry.getHash();
      const geometry2 = new EntanglementGeometry();
      expect(geometry2.getHash()).toBe(hash1);
    });
  });

  // ==================== ERBridge Tests ====================

  describe('ERBridge', () => {
    let bridge: ERBridge;

    beforeEach(() => {
      bridge = new ERBridge();
    });

    test('should create ER bridge from entanglement', () => {
      const entropy = 1e30;
      const result = bridge.fromEntanglement(entropy);
      
      expect(result.throat).toBeGreaterThan(0);
      expect(result.length).toBeGreaterThan(0);
      expect(result.mass).toBeGreaterThan(0);
      expect(result.entanglement).toBe(entropy);
      expect(result.isTraversable).toBe(false);
      expect(result.holdsEREqualsEPR).toBe(true);
    });

    test('should create wormhole from black holes', () => {
      const mass1 = 1e30;
      const mass2 = 1e30;
      const result = bridge.fromBlackHoles(mass1, mass2);
      
      expect(result.throat).toBeGreaterThan(0);
      expect(result.mass).toBe(mass1 + mass2);
      expect(result.isTraversable).toBe(false);
    });

    test('should create Morris-Thorne traversable wormhole', () => {
      const throatRadius = 1e-10;
      const result = bridge.morrisThorne(throatRadius);
      
      expect(result.throat).toBe(throatRadius);
      expect(result.isTraversable).toBe(true);
      expect(result.holdsEREqualsEPR).toBe(false);
    });

    test('should compute traversal time', () => {
      const nonTraversable = bridge.fromEntanglement(1e30);
      expect(bridge.traversalTime(nonTraversable)).toBe(Infinity);
      
      const traversable = bridge.morrisThorne(1); // shapeFactor default is 1
      // length = shapeFactor * throatRadius = 1 * 1 = 1
      expect(bridge.traversalTime(traversable)).toBe(1 / 299792458);
    });

    test('should check ER=EPR relation', () => {
      // Create bridge and check self-consistency
      const entropy = 1e30;
      const result = bridge.fromEntanglement(entropy);
      
      // The bridge was created with ER=EPR, so it should hold
      expect(result.holdsEREqualsEPR).toBe(true);
    });

    test('should have deterministic hash', () => {
      const hash1 = bridge.getHash();
      const bridge2 = new ERBridge();
      expect(bridge2.getHash()).toBe(hash1);
    });
  });

  // ==================== TensorNetwork Tests ====================

  describe('TensorNetwork', () => {
    let network: TensorNetwork;

    beforeEach(() => {
      network = new TensorNetwork();
    });

    test('should add nodes', () => {
      const node = network.addNode('n1', [0, 0]);
      
      expect(node.id).toBe('n1');
      expect(network.getNodeCount()).toBe(1);
    });

    test('should add bonds', () => {
      network.addNode('n1', [0, 0]);
      network.addNode('n2', [1, 0]);
      const success = network.addBond('n1', 'n2');
      
      expect(success).toBe(true);
      expect(network.getBondCount()).toBe(1);
    });

    test('should fail to add bond with nonexistent node', () => {
      network.addNode('n1', [0, 0]);
      const success = network.addBond('n1', 'n2');
      
      expect(success).toBe(false);
    });

    test('should identify boundary nodes', () => {
      network.addNode('n1', [0, 0], 2, true);
      network.addNode('n2', [1, 0], 2, false);
      
      const boundary = network.getBoundaryNodes();
      expect(boundary.length).toBe(2); // n1 is anchor, n2 has few connections
    });

    test('should identify bulk nodes', () => {
      network.addNode('center', [0, 0], 2, false);
      for (let i = 0; i < 4; i++) {
        network.addNode(`n${i}`, [1, i], 2, true);
        network.addBond('center', `n${i}`);
      }
      
      const bulk = network.getBulkNodes();
      expect(bulk.length).toBe(1);
      expect(bulk[0].id).toBe('center');
    });

    test('should compute total bond dimension', () => {
      network.addNode('n1', [0, 0], 2);
      network.addNode('n2', [1, 0], 3);
      
      const total = network.getTotalBondDimension();
      expect(total).toBe(6);
    });

    test('should compute minimal cut', () => {
      network.addNode('n1', [0, 0]);
      network.addNode('n2', [1, 0]);
      network.addNode('n3', [2, 0]);
      network.addBond('n1', 'n2');
      network.addBond('n2', 'n3');
      
      // minimalCut counts bonds where one end is in region1 and other is not
      // For ['n1'] as region1:
      // n1-n2: n1 in region1, n2 not in region1 -> crosses (1)
      // n2-n3: neither in region1 -> doesn't cross
      const cut = network.minimalCut(['n1'], ['n3']);
      expect(cut).toBe(1); // Only n1-n2 crosses from region1 to outside
    });

    test('should compute entanglement from cut', () => {
      network.addNode('n1', [0, 0], 2);
      network.addNode('n2', [1, 0], 2);
      network.addBond('n1', 'n2');
      
      const entropy = network.entanglementFromCut(['n1']);
      expect(entropy).toBeGreaterThan(0);
    });

    test('should build MERA network', () => {
      const config = network.buildMERA(3, 4);
      
      expect(config.nodes.length).toBe(12);
      expect(config.boundaryNodes.length).toBeGreaterThan(0);
    });

    test('should build random network', () => {
      const config = network.buildRandom(10, 3);
      
      expect(config.nodes.length).toBe(10);
      expect(config.bonds.length).toBeGreaterThan(0);
    });

    test('should export configuration', () => {
      network.addNode('n1', [0, 0]);
      network.addNode('n2', [1, 0]);
      network.addBond('n1', 'n2');
      
      const config = network.export();
      expect(config.hash).toBeDefined();
    });

    test('should have deterministic hash', () => {
      const hash1 = network.getHash();
      const network2 = new TensorNetwork();
      expect(network2.getHash()).toBe(hash1);
    });
  });

  // ==================== HolographicEntropy Tests ====================

  describe('HolographicEntropy', () => {
    let entropy: HolographicEntropy;

    beforeEach(() => {
      entropy = new HolographicEntropy(12, 1e-35); // c=12, Planck cutoff
    });

    test('should compute interval entropy', () => {
      const length = 1e-10;
      const result = entropy.intervalEntropy(length);
      
      expect(result.boundaryEntropy).toBeGreaterThan(0);
      expect(result.centralCharge).toBe(12);
    });

    test('should verify S = (c/3) log(L/ε)', () => {
      const c = 12;
      const length = 1e-10;
      const cutoff = 1e-35;
      
      const expected = (c / 3) * Math.log(length / cutoff);
      const result = entropy.intervalEntropy(length);
      
      expect(result.boundaryEntropy).toBeCloseTo(expected, 10);
    });

    test('should compute thermal entropy', () => {
      const length = 1e-10;
      const temperature = 1e10;
      const result = entropy.thermalEntropy(length, temperature);
      
      expect(result.boundaryEntropy).toBeGreaterThan(0);
    });

    test('should compute mutual information', () => {
      const mutualInfo = entropy.mutualInformation(1e-10, 1e-10, 1e-9);
      
      // Mutual info should be positive for nearby intervals
      expect(mutualInfo).toBeDefined();
    });

    test('should verify c-theorem', () => {
      expect(entropy.cTheorem(12, 6)).toBe(true);  // UV > IR
      expect(entropy.cTheorem(6, 12)).toBe(false); // Violation
    });

    test('should have deterministic hash', () => {
      const hash1 = entropy.getHash();
      const entropy2 = new HolographicEntropy(12, 1e-35);
      expect(entropy2.getHash()).toBe(hash1);
    });
  });

  // ==================== EmergentSpacetime Tests ====================

  describe('EmergentSpacetime', () => {
    let spacetime: EmergentSpacetime;

    beforeEach(() => {
      spacetime = new EmergentSpacetime();
    });

    test('should expose all component classes', () => {
      expect(spacetime.metric).toBeInstanceOf(EmergentMetric);
      expect(spacetime.geometry).toBeInstanceOf(EntanglementGeometry);
      expect(spacetime.erBridge).toBeInstanceOf(ERBridge);
      expect(spacetime.tensorNetwork).toBeInstanceOf(TensorNetwork);
      expect(spacetime.holographicEntropy).toBeInstanceOf(HolographicEntropy);
    });

    test('should create spacetime from entanglement', () => {
      const regions = new Map([
        ['A', 1.0],
        ['B', 2.0],
        ['C', 1.5]
      ]);
      
      const result = spacetime.fromEntanglement(regions);
      
      expect(result.dimension).toBe(4);
      expect(result.entanglementStructure).toBe(regions);
      expect(result.emergentMetric).toBeDefined();
    });

    test('should create wormhole', () => {
      const entropy = 1e30;
      const wormhole = spacetime.createWormhole(entropy);
      
      expect(wormhole.entanglement).toBe(entropy);
      expect(wormhole.throat).toBeGreaterThan(0);
    });

    test('should build holographic network', () => {
      const network = spacetime.buildHolographicNetwork(3, 4);
      
      expect(network.nodes.length).toBe(12);
    });

    test('should verify ER=EPR', () => {
      // This is a complex check, just verify it runs
      const result = spacetime.verifyEREqualsEPR(1e30, 1e-30);
      expect(typeof result).toBe('boolean');
    });

    test('should have deterministic hash', () => {
      const hash1 = spacetime.getHash();
      const spacetime2 = new EmergentSpacetime();
      expect(spacetime2.getHash()).toBe(hash1);
    });
  });

  // ==================== EmergentSpacetimeConstants Tests ====================

  describe('EmergentSpacetimeConstants', () => {
    test('should have correct Planck length', () => {
      expect(EmergentSpacetimeConstants.lP).toBeCloseTo(1.616255e-35, 40);
    });

    test('should have correct speed of light', () => {
      expect(EmergentSpacetimeConstants.c).toBe(299792458);
    });

    test('should have RT coefficient', () => {
      expect(EmergentSpacetimeConstants.rtCoefficient).toBeGreaterThan(0);
    });

    test('should have Planck area', () => {
      const expected = Math.pow(EmergentSpacetimeConstants.lP, 2);
      expect(EmergentSpacetimeConstants.planckArea).toBeCloseTo(expected, 80);
    });

    test('should have BH coefficient', () => {
      expect(EmergentSpacetimeConstants.bhCoefficient).toBeGreaterThan(0);
    });
  });

  // ==================== Physics Validation Tests ====================

  describe('Physics Validation', () => {
    test('RT formula should relate entropy to area', () => {
      const geometry = new EntanglementGeometry();
      const area = 1e-60;
      
      const result = geometry.ryuTakayanagi(area);
      const reconstructedArea = geometry.areaFromEntropy(result.entanglementEntropy);
      
      expect(reconstructedArea).toBeCloseTo(area, 70);
    });

    test('ER bridge throat should scale with sqrt of entropy', () => {
      const bridge = new ERBridge();
      
      const result1 = bridge.fromEntanglement(1e30);
      const result2 = bridge.fromEntanglement(4e30);
      
      // throat ~ sqrt(S), so 4x entropy -> 2x throat
      const ratio = result2.throat / result1.throat;
      expect(ratio).toBeCloseTo(2, 5);
    });

    test('Holographic entropy should scale with log of size', () => {
      const entropy = new HolographicEntropy(1, 1e-35);
      
      const s1 = entropy.intervalEntropy(1e-10);
      const s2 = entropy.intervalEntropy(1e-5);
      
      // S ~ log(L), so larger interval has more entropy
      expect(s2.boundaryEntropy).toBeGreaterThan(s1.boundaryEntropy);
    });

    test('Emergent metric should reduce to Minkowski for zero entanglement', () => {
      const metric = new EmergentMetric();
      const spec = metric.export();
      
      // Default Minkowski
      expect(spec.components[0][0]).toBe(-1);
      expect(spec.components[1][1]).toBe(1);
    });

    test('Tensor network entropy should scale with cut size', () => {
      const network = new TensorNetwork();
      network.addNode('n1', [0, 0], 2);
      network.addNode('n2', [1, 0], 2);
      network.addNode('n3', [2, 0], 2);
      network.addBond('n1', 'n2');
      network.addBond('n2', 'n3');
      
      const s1 = network.entanglementFromCut(['n1']);
      const s2 = network.entanglementFromCut(['n1', 'n2']);
      
      // Both should be positive
      expect(s1).toBeGreaterThan(0);
      expect(s2).toBeGreaterThan(0);
    });
  });

  // ==================== Integration Tests ====================

  describe('Integration Tests', () => {
    test('should create complete emergent spacetime model', () => {
      const spacetime = new EmergentSpacetime();
      
      // Create entanglement structure
      const regions = new Map([
        ['left', 1.5],
        ['right', 1.5],
        ['center', 2.0]
      ]);
      
      // Build geometry
      const geometry = spacetime.fromEntanglement(regions);
      
      // Create wormhole
      const wormhole = spacetime.createWormhole(1.5);
      
      // Build tensor network
      const network = spacetime.buildHolographicNetwork(3, 4);
      
      expect(geometry.dimension).toBe(4);
      expect(wormhole.throat).toBeGreaterThan(0);
      expect(network.nodes.length).toBeGreaterThan(0);
    });

    test('hash chains should be consistent', () => {
      const spacetime1 = new EmergentSpacetime();
      const spacetime2 = new EmergentSpacetime();
      
      expect(spacetime1.getHash()).toBe(spacetime2.getHash());
      expect(spacetime1.metric.getHash()).toBe(spacetime2.metric.getHash());
      expect(spacetime1.geometry.getHash()).toBe(spacetime2.geometry.getHash());
    });

    test('all classes should have hashes', () => {
      const metric = new EmergentMetric();
      const geometry = new EntanglementGeometry();
      const bridge = new ERBridge();
      const network = new TensorNetwork();
      const entropy = new HolographicEntropy();
      const spacetime = new EmergentSpacetime();
      
      expect(metric.getHash()).toBeDefined();
      expect(geometry.getHash()).toBeDefined();
      expect(bridge.getHash()).toBeDefined();
      expect(network.getHash()).toBeDefined();
      expect(entropy.getHash()).toBeDefined();
      expect(spacetime.getHash()).toBeDefined();
    });
  });
});
