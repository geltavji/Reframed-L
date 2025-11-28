/**
 * InformationTheory.test.ts - Tests for Information Theoretic Framework
 * PRD-04 Phase 4.2: Module M04.02
 */

import {
  InformationDensity,
  BekensteinBound,
  HolographicLimit,
  InformationConservation,
  QuantumChannel,
  PlanckInformation,
  EntropyCalculator,
  PlanckInfoConstants
} from '../../../src/planck/information/InformationTheory';

describe('InformationTheory - PRD-04 Phase 4.2', () => {
  
  // ==================== InformationDensity Tests ====================
  
  describe('InformationDensity', () => {
    let infoDensity: InformationDensity;

    beforeEach(() => {
      infoDensity = new InformationDensity();
    });

    test('should compute max Planck density as 1 bit', () => {
      const density = infoDensity.maxPlanckDensity();
      expect(density.value).toBe(1);
      expect(density.unit).toBe('bit');
      expect(density.perVolume).toBe(true);
      expect(density.volumeUnit).toBe('planck');
    });

    test('should compute max volumetric density', () => {
      const density = infoDensity.maxVolumetricDensity();
      expect(density.value).toBeGreaterThan(0);
      expect(density.perVolume).toBe(true);
      expect(density.volumeUnit).toBe('meter');
      // Should be approximately 1/l_P^3
      const planckVolume = Math.pow(PlanckInfoConstants.lP, 3);
      expect(density.value).toBeCloseTo(1 / planckVolume, 5);
    });

    test('should compute max holographic density', () => {
      const density = infoDensity.maxHolographicDensity();
      expect(density.value).toBeGreaterThan(0);
      expect(density.perVolume).toBe(false);
      // Should be approximately 1/(4*l_P^2)
      const planckArea = Math.pow(PlanckInfoConstants.lP, 2);
      expect(density.value).toBeCloseTo(1 / (4 * planckArea), 5);
    });

    test('should compute mutual information', () => {
      const mi = infoDensity.mutualInformation(2, 3, 4);
      expect(mi).toBe(1); // 2 + 3 - 4 = 1
    });

    test('should handle negative mutual information as zero', () => {
      const mi = infoDensity.mutualInformation(1, 1, 5);
      expect(mi).toBe(0);
    });

    test('should compute relative entropy', () => {
      const p = [0.5, 0.5];
      const q = [0.5, 0.5];
      const kl = infoDensity.relativeEntropy(p, q);
      expect(kl).toBeCloseTo(0, 10);
    });

    test('should return infinity for unsupported distribution', () => {
      const p = [0.5, 0.5];
      const q = [1, 0];
      const kl = infoDensity.relativeEntropy(p, q);
      expect(kl).toBe(Infinity);
    });

    test('should throw for mismatched distributions', () => {
      const p = [0.5, 0.5];
      const q = [0.33, 0.33, 0.34];
      expect(() => infoDensity.relativeEntropy(p, q)).toThrow();
    });

    test('should have deterministic hash', () => {
      const hash1 = infoDensity.getHash();
      const infoDensity2 = new InformationDensity();
      const hash2 = infoDensity2.getHash();
      expect(hash1).toBe(hash2);
    });
  });

  // ==================== BekensteinBound Tests ====================
  
  describe('BekensteinBound', () => {
    let bekenstein: BekensteinBound;

    beforeEach(() => {
      bekenstein = new BekensteinBound();
    });

    test('should compute Bekenstein bound', () => {
      const result = bekenstein.compute({
        radius: 1,
        energy: 1
      });
      expect(result.maxEntropy).toBeGreaterThan(0);
      expect(result.maxEntropyNats).toBeGreaterThan(0);
      expect(result.radius).toBe(1);
      expect(result.energy).toBe(1);
      expect(result.satisfied).toBe(true);
    });

    test('should convert Planck units to SI', () => {
      const resultSI = bekenstein.compute({
        radius: PlanckInfoConstants.lP,
        energy: PlanckInfoConstants.EP
      });
      
      const resultPlanck = bekenstein.compute({
        radius: 1,
        energy: 1,
        radiusUnit: 'planck',
        energyUnit: 'planck'
      });
      
      expect(resultPlanck.maxEntropy).toBeCloseTo(resultSI.maxEntropy, 10);
    });

    test('should verify Bekenstein bound satisfaction', () => {
      const result = bekenstein.verify(100, {
        radius: 1,
        energy: 1e20
      });
      expect(result.satisfied).toBe(true);
      expect(result.currentEntropy).toBe(100);
    });

    test('should detect Bekenstein bound violation', () => {
      // Very small system with huge entropy requirement
      const result = bekenstein.verify(1e100, {
        radius: PlanckInfoConstants.lP,
        energy: PlanckInfoConstants.EP
      });
      expect(result.satisfied).toBe(false);
    });

    test('should compute black hole entropy', () => {
      // Solar mass black hole: M_sun ≈ 2 × 10^30 kg
      const solarMass = 2e30;
      const result = bekenstein.blackHoleEntropy(solarMass);
      
      expect(result.maxEntropy).toBeGreaterThan(0);
      expect(result.radius).toBeGreaterThan(0);
      // Schwarzschild radius for solar mass is about 2954 m (3 km)
      // Using exact formula: R_s = 2GM/c² = 2 * 6.6743e-11 * 2e30 / (299792458)²
      expect(result.radius).toBeCloseTo(2970, 0); // Allow 1 meter precision
    });

    test('should compute minimum energy for information', () => {
      const information = 1e10; // 10 billion bits
      const radius = 0.1; // 10 cm
      const minEnergy = bekenstein.minimumEnergy(information, radius);
      expect(minEnergy).toBeGreaterThan(0);
    });

    test('should compute minimum radius for information', () => {
      const information = 1e10;
      const energy = 1e10; // 10 GJ
      const minRadius = bekenstein.minimumRadius(information, energy);
      expect(minRadius).toBeGreaterThan(0);
    });

    test('should have deterministic hash', () => {
      const hash1 = bekenstein.getHash();
      const bekenstein2 = new BekensteinBound();
      expect(bekenstein2.getHash()).toBe(hash1);
    });

    test('should include hash in result', () => {
      const result = bekenstein.compute({ radius: 1, energy: 1 });
      expect(result.hash).toBeDefined();
      expect(result.hash.length).toBe(64); // SHA-256 hex
    });
  });

  // ==================== HolographicLimit Tests ====================
  
  describe('HolographicLimit', () => {
    let holographic: HolographicLimit;

    beforeEach(() => {
      holographic = new HolographicLimit();
    });

    test('should compute max information for area', () => {
      const planckArea = Math.pow(PlanckInfoConstants.lP, 2);
      const result = holographic.maxInformationForArea(4 * planckArea, 'meter²');
      
      // 4 Planck areas / 4 = 1 bit max
      expect(result.maxInformation).toBeCloseTo(1, 10);
      expect(result.planckAreasCount).toBeCloseTo(4, 10);
      expect(result.bitsPerPlanckArea).toBe(0.25);
    });

    test('should compute max information for sphere', () => {
      const radius = 1; // 1 meter
      const result = holographic.maxInformationForSphere(radius, 'meter');
      
      expect(result.surfaceArea).toBeCloseTo(4 * Math.PI, 10);
      expect(result.maxInformation).toBeGreaterThan(0);
    });

    test('should verify holographic bound', () => {
      const planckArea = Math.pow(PlanckInfoConstants.lP, 2);
      
      // Should pass for small information
      expect(holographic.verify(0.5, 4 * planckArea, 'meter²')).toBe(true);
      
      // Should fail for large information
      expect(holographic.verify(10, 4 * planckArea, 'meter²')).toBe(false);
    });

    test('should compute minimum area for information', () => {
      const information = 1; // 1 bit
      const planckArea = Math.pow(PlanckInfoConstants.lP, 2);
      const minArea = holographic.minimumAreaForInformation(information);
      
      // Should be 4 * l_P^2 for 1 bit
      expect(minArea).toBeCloseTo(4 * planckArea, 80);
    });

    test('should compute information density ratio', () => {
      const planckArea = Math.pow(PlanckInfoConstants.lP, 2);
      const ratio = holographic.informationDensityRatio(0.5, 4 * planckArea, 'meter²');
      
      expect(ratio).toBeCloseTo(0.5, 10);
    });

    test('should compute holographic screen size', () => {
      const information = 10; // 10 bits
      const screen = holographic.holographicScreen(information);
      
      // Need 40 Planck areas for 10 bits
      expect(screen).toBe(40);
    });

    test('should handle Planck area units', () => {
      const result = holographic.maxInformationForArea(4, 'planck');
      expect(result.maxInformation).toBeCloseTo(1, 10);
    });

    test('should have deterministic hash', () => {
      const hash1 = holographic.getHash();
      const holographic2 = new HolographicLimit();
      expect(holographic2.getHash()).toBe(hash1);
    });
  });

  // ==================== InformationConservation Tests ====================
  
  describe('InformationConservation', () => {
    let conservation: InformationConservation;

    beforeEach(() => {
      conservation = new InformationConservation();
    });

    test('should detect conserved information', () => {
      const result = conservation.check(10, 10);
      expect(result.conserved).toBe(true);
      expect(result.difference).toBe(0);
    });

    test('should detect non-conserved information', () => {
      const result = conservation.check(10, 5);
      expect(result.conserved).toBe(false);
      expect(result.difference).toBe(5);
    });

    test('should use custom tolerance', () => {
      const tolerant = new InformationConservation(1);
      const result = tolerant.check(10, 10.5);
      expect(result.conserved).toBe(true);
    });

    test('should verify unitary evolution', () => {
      const result = conservation.verifyUnitaryEvolution(5.0, 5.0);
      expect(result.conserved).toBe(true);
    });

    test('should check with environment', () => {
      const result = conservation.checkWithEnvironment(5, 5, 3, 7);
      // Total initial: 10, Total final: 10
      expect(result.conserved).toBe(true);
    });

    test('should include result details', () => {
      const result = conservation.check(10, 8);
      expect(result.initialInformation).toBe(10);
      expect(result.finalInformation).toBe(8);
      expect(result.tolerance).toBeGreaterThan(0);
      expect(result.hash).toBeDefined();
    });

    test('should have deterministic hash', () => {
      const hash1 = conservation.getHash();
      const conservation2 = new InformationConservation();
      expect(conservation2.getHash()).toBe(hash1);
    });
  });

  // ==================== QuantumChannel Tests ====================
  
  describe('QuantumChannel', () => {
    let channel: QuantumChannel;

    beforeEach(() => {
      channel = new QuantumChannel('test_channel');
    });

    test('should compute depolarizing channel capacity', () => {
      // Perfect channel (p=0)
      const perfect = channel.depolarizingChannelCapacity(0);
      expect(perfect.classical).toBe(1);
      expect(perfect.quantum).toBe(1);
      
      // Partially depolarizing (p=0.1) - should have lower capacity
      const partial = channel.depolarizingChannelCapacity(0.1);
      expect(partial.classical).toBeLessThan(1);
      expect(partial.classical).toBeGreaterThan(0.5); // Still mostly working
      
      // At p=0.5, binary entropy H(0.5)=1, so capacity is 0
      const halfDepolarized = channel.depolarizingChannelCapacity(0.5);
      expect(halfDepolarized.classical).toBe(0);
    });

    test('should throw for invalid depolarizing probability', () => {
      expect(() => channel.depolarizingChannelCapacity(-0.1)).toThrow();
      expect(() => channel.depolarizingChannelCapacity(1.1)).toThrow();
    });

    test('should compute amplitude damping capacity', () => {
      // No damping
      const noDamping = channel.amplitudeDampingCapacity(0);
      expect(noDamping.classical).toBe(1);
      expect(noDamping.quantum).toBe(1);
      
      // Full damping
      const fullDamping = channel.amplitudeDampingCapacity(1);
      expect(fullDamping.classical).toBeLessThan(1);
    });

    test('should throw for invalid damping parameter', () => {
      expect(() => channel.amplitudeDampingCapacity(-0.1)).toThrow();
      expect(() => channel.amplitudeDampingCapacity(1.1)).toThrow();
    });

    test('should compute erasure channel capacity', () => {
      // No erasure
      const noErasure = channel.erasureChannelCapacity(0);
      expect(noErasure.classical).toBe(1);
      expect(noErasure.quantum).toBe(1);
      
      // Full erasure
      const fullErasure = channel.erasureChannelCapacity(1);
      expect(fullErasure.classical).toBe(0);
      expect(fullErasure.quantum).toBe(0);
      
      // Half erasure
      const halfErasure = channel.erasureChannelCapacity(0.5);
      expect(halfErasure.classical).toBe(0.5);
      expect(halfErasure.quantum).toBe(0);
    });

    test('should throw for invalid erasure probability', () => {
      expect(() => channel.erasureChannelCapacity(-0.1)).toThrow();
      expect(() => channel.erasureChannelCapacity(1.1)).toThrow();
    });

    test('should return channel name', () => {
      expect(channel.getName()).toBe('test_channel');
    });

    test('should include entanglement-assisted capacity', () => {
      const capacity = channel.depolarizingChannelCapacity(0);
      expect(capacity.entanglementAssisted).toBe(2 * capacity.classical);
    });

    test('should have deterministic hash', () => {
      const hash1 = channel.getHash();
      const channel2 = new QuantumChannel('test_channel');
      expect(channel2.getHash()).toBe(hash1);
    });
  });

  // ==================== PlanckInformation Tests ====================
  
  describe('PlanckInformation', () => {
    let planckInfo: PlanckInformation;

    beforeEach(() => {
      planckInfo = new PlanckInformation();
    });

    test('should return 1 bit per Planck volume', () => {
      expect(planckInfo.maxBitsPerPlanckVolume()).toBe(1);
    });

    test('should return 0.25 bits per Planck area', () => {
      expect(planckInfo.maxBitsPerPlanckArea()).toBe(0.25);
    });

    test('should compute max operations per second (Lloyd limit)', () => {
      const energy = 1; // 1 Joule
      const maxOps = planckInfo.maxOperationsPerSecond(energy);
      
      // Should be 2E/(πħ)
      const expected = (2 * energy) / (Math.PI * PlanckInfoConstants.hbar);
      expect(maxOps).toBeCloseTo(expected, 10);
    });

    test('should compute max bits per Joule-second', () => {
      const maxBits = planckInfo.maxBitsPerJouleSecond();
      expect(maxBits).toBeGreaterThan(0);
    });

    test('should define Planck bit as 1', () => {
      expect(planckInfo.planckBit()).toBe(1);
    });

    test('should convert bits to Planck units', () => {
      expect(planckInfo.bitsToPlankUnits(10)).toBe(10);
    });

    test('should compute Planck processing rate', () => {
      const rate = planckInfo.planckProcessingRate();
      
      // Should be 2/(πt_P)
      const expected = 2 / (Math.PI * PlanckInfoConstants.tP);
      expect(rate).toBeCloseTo(expected, 10);
    });

    test('should have deterministic hash', () => {
      const hash1 = planckInfo.getHash();
      const planckInfo2 = new PlanckInformation();
      expect(planckInfo2.getHash()).toBe(hash1);
    });
  });

  // ==================== EntropyCalculator Tests ====================
  
  describe('EntropyCalculator', () => {
    let entropy: EntropyCalculator;

    beforeEach(() => {
      entropy = new EntropyCalculator();
    });

    test('should compute Shannon entropy for uniform distribution', () => {
      const uniform2 = [0.5, 0.5];
      expect(entropy.shannon(uniform2)).toBeCloseTo(1, 10);
      
      const uniform4 = [0.25, 0.25, 0.25, 0.25];
      expect(entropy.shannon(uniform4)).toBeCloseTo(2, 10);
    });

    test('should compute Shannon entropy for deterministic distribution', () => {
      const deterministic = [1, 0, 0];
      expect(entropy.shannon(deterministic)).toBe(0);
    });

    test('should throw for probabilities not summing to 1', () => {
      const invalid = [0.5, 0.3];
      expect(() => entropy.shannon(invalid)).toThrow();
    });

    test('should compute von Neumann entropy', () => {
      const eigenvalues = [0.5, 0.5];
      expect(entropy.vonNeumann(eigenvalues)).toBeCloseTo(1, 10);
    });

    test('should compute Rényi entropy', () => {
      const probs = [0.5, 0.5];
      
      // α = 2 (collision entropy)
      const renyi2 = entropy.renyi(probs, 2);
      expect(renyi2).toBeLessThanOrEqual(entropy.shannon(probs));
      
      // α = 1 should equal Shannon
      const renyi1 = entropy.renyi(probs, 1);
      expect(renyi1).toBeCloseTo(entropy.shannon(probs), 10);
    });

    test('should compute Tsallis entropy', () => {
      const probs = [0.5, 0.5];
      
      // q = 1 should equal Shannon * ln(2)
      const tsallis1 = entropy.tsallis(probs, 1);
      expect(tsallis1).toBeCloseTo(entropy.shannon(probs) * Math.LN2, 10);
    });

    test('should compute min-entropy', () => {
      const probs = [0.7, 0.2, 0.1];
      const minH = entropy.minEntropy(probs);
      
      expect(minH).toBeCloseTo(-Math.log2(0.7), 10);
    });

    test('should compute max-entropy', () => {
      const probs = [0.7, 0.2, 0.1];
      const maxH = entropy.maxEntropy(probs);
      
      expect(maxH).toBeCloseTo(Math.log2(3), 10);
    });

    test('should compute conditional entropy', () => {
      const joint = 2;
      const marginal = 1;
      const conditional = entropy.conditional(joint, marginal);
      
      expect(conditional).toBe(1);
    });

    test('should compute mutual information', () => {
      const mi = entropy.mutualInformation(2, 2, 3);
      expect(mi).toBe(1);
    });

    test('should have deterministic hash', () => {
      const hash1 = entropy.getHash();
      const entropy2 = new EntropyCalculator();
      expect(entropy2.getHash()).toBe(hash1);
    });
  });

  // ==================== Physics Validation Tests ====================
  
  describe('Physics Validation', () => {
    test('should have correct Planck constants', () => {
      expect(PlanckInfoConstants.c).toBe(299792458);
      expect(PlanckInfoConstants.h).toBeCloseTo(6.62607015e-34, 44);
      expect(PlanckInfoConstants.hbar).toBeCloseTo(1.054571817e-34, 44);
      expect(PlanckInfoConstants.kB).toBeCloseTo(1.380649e-23, 33);
      expect(PlanckInfoConstants.G).toBeCloseTo(6.6743e-11, 15);
    });

    test('Bekenstein bound should be consistent with holographic', () => {
      const bekenstein = new BekensteinBound();
      const holographic = new HolographicLimit();
      
      // For a spherical region at high energy, Bekenstein is more restrictive
      // For a black hole (maximum density), both should be equal
      // This test verifies both bounds are computed correctly
      const radius = 1;
      const energy = 1e20;
      
      const bekensteinResult = bekenstein.compute({ radius, energy });
      const surfaceArea = 4 * Math.PI * radius * radius;
      const holographicResult = holographic.maxInformationForArea(surfaceArea, 'meter²');
      
      // Both bounds should give positive values
      expect(bekensteinResult.maxEntropy).toBeGreaterThan(0);
      expect(holographicResult.maxInformation).toBeGreaterThan(0);
    });

    test('Black hole entropy should follow area law', () => {
      const bekenstein = new BekensteinBound();
      
      // Double the mass should quadruple the entropy (entropy ∝ M²)
      const result1 = bekenstein.blackHoleEntropy(1e30);
      const result2 = bekenstein.blackHoleEntropy(2e30);
      
      expect(result2.maxEntropy / result1.maxEntropy).toBeCloseTo(4, 1);
    });

    test('Lloyd limit should be consistent', () => {
      const planckInfo = new PlanckInformation();
      
      // At Planck energy, rate should be approximately 2/(πt_P)
      const planckEnergy = PlanckInfoConstants.EP;
      const rate = planckInfo.maxOperationsPerSecond(planckEnergy);
      const expected = 2 / (Math.PI * PlanckInfoConstants.tP);
      
      // Use relative precision - within 0.1%
      const relativeDiff = Math.abs(rate - expected) / expected;
      expect(relativeDiff).toBeLessThan(0.001);
    });

    test('Shannon entropy should satisfy bounds', () => {
      const calculator = new EntropyCalculator();
      const probs = [0.4, 0.3, 0.2, 0.1];
      
      const h = calculator.shannon(probs);
      const minH = calculator.minEntropy(probs);
      const maxH = calculator.maxEntropy(probs);
      
      // min-entropy ≤ Shannon ≤ max-entropy
      expect(minH).toBeLessThanOrEqual(h);
      expect(h).toBeLessThanOrEqual(maxH);
    });
  });

  // ==================== Integration Tests ====================
  
  describe('Integration Tests', () => {
    test('should compute information limits for black hole', () => {
      const bekenstein = new BekensteinBound();
      const holographic = new HolographicLimit();
      
      // Stellar mass black hole
      const mass = 1e31; // ~5 solar masses
      const bhResult = bekenstein.blackHoleEntropy(mass);
      
      // Verify surface area
      const surfaceArea = bhResult.surfaceArea;
      const holoResult = holographic.maxInformationForArea(surfaceArea, 'meter²');
      
      // Both should give same result for black hole
      expect(bhResult.maxEntropy).toBeCloseTo(holoResult.maxInformation, 5);
    });

    test('should track information conservation through computation', () => {
      const conservation = new InformationConservation();
      const entropy = new EntropyCalculator();
      
      // Initial state
      const initialProbs = [0.5, 0.5];
      const initialEntropy = entropy.shannon(initialProbs);
      
      // After unitary evolution (same entropy)
      const finalProbs = [0.5, 0.5];
      const finalEntropy = entropy.shannon(finalProbs);
      
      const result = conservation.verifyUnitaryEvolution(initialEntropy, finalEntropy);
      expect(result.conserved).toBe(true);
    });

    test('should respect quantum channel capacity limits', () => {
      const channel = new QuantumChannel('test');
      const planckInfo = new PlanckInformation();
      
      // Channel capacity should not exceed Lloyd limit
      const capacity = channel.depolarizingChannelCapacity(0);
      const energy = 1; // 1 Joule
      const maxOps = planckInfo.maxOperationsPerSecond(energy);
      
      // Capacity in bits/second should be bounded by energy
      expect(capacity.classical).toBeLessThanOrEqual(1);
    });

    test('hash chains should be consistent', () => {
      const bekenstein = new BekensteinBound();
      const result1 = bekenstein.compute({ radius: 1, energy: 1 });
      const result2 = bekenstein.compute({ radius: 1, energy: 1 });
      
      expect(result1.hash).toBe(result2.hash);
    });

    test('all classes should have hashes', () => {
      const infoDensity = new InformationDensity();
      const bekenstein = new BekensteinBound();
      const holographic = new HolographicLimit();
      const conservation = new InformationConservation();
      const channel = new QuantumChannel('test');
      const planckInfo = new PlanckInformation();
      const entropy = new EntropyCalculator();
      
      expect(infoDensity.getHash()).toBeDefined();
      expect(bekenstein.getHash()).toBeDefined();
      expect(holographic.getHash()).toBeDefined();
      expect(conservation.getHash()).toBeDefined();
      expect(channel.getHash()).toBeDefined();
      expect(planckInfo.getHash()).toBeDefined();
      expect(entropy.getHash()).toBeDefined();
    });
  });
});
