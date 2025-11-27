/**
 * PlanckComputation.test.ts - Tests for Planck Scale Computation Model
 * PRD-04 Phase 4.4: Module M04.04
 */

import {
  ComputationDensity,
  MaximumComputation,
  LloydLimit,
  MargolusLevitin,
  LandauerLimit,
  BremermannLimit,
  BlackHoleComputer,
  ComputationLimits,
  PlanckComputationConstants
} from '../../../src/planck/computation/PlanckComputation';

describe('PlanckComputation - PRD-04 Phase 4.4', () => {

  // ==================== ComputationDensity Tests ====================

  describe('ComputationDensity', () => {
    let density: ComputationDensity;

    beforeEach(() => {
      density = new ComputationDensity();
    });

    test('should compute max Planck density', () => {
      const result = density.maxPlanckDensity();
      
      expect(result.operationsPerSecond).toBeGreaterThan(0);
      expect(result.operationsPerSecondPerVolume).toBeGreaterThan(0);
      expect(result.operationsPerSecondPerMass).toBeGreaterThan(0);
      expect(result.bitsPerSecond).toBeGreaterThan(0);
    });

    test('should compute density for given energy', () => {
      const energy = 1; // 1 Joule
      const result = density.forEnergy(energy);
      
      expect(result.operationsPerSecond).toBeGreaterThan(0);
      expect(result.bitsPerSecond).toBeGreaterThan(0);
      
      // Check Lloyd's formula: 2E/(πħ)
      const hbar = 1.054571817e-34;
      const expected = (2 * energy) / (Math.PI * hbar);
      expect(result.operationsPerSecond).toBeCloseTo(expected, 5);
    });

    test('should compute density for given mass', () => {
      const mass = 1e-10; // 0.1 nanogram
      const result = density.forMass(mass);
      
      expect(result.operationsPerSecond).toBeGreaterThan(0);
      expect(result.operationsPerSecondPerMass).toBeGreaterThan(0);
    });

    test('should compute black hole density', () => {
      const mass = 1e30; // ~solar mass
      const result = density.blackHoleDensity(mass);
      
      expect(result.operationsPerSecond).toBeGreaterThan(0);
      expect(result.operationsPerSecondPerVolume).toBeGreaterThan(0);
      expect(result.operationsPerSecondPerMass).toBeGreaterThan(0);
    });

    test('should include hash in results', () => {
      const result = density.maxPlanckDensity();
      expect(result.hash).toBeDefined();
      expect(result.hash.length).toBe(64);
    });

    test('should have deterministic hash', () => {
      const hash1 = density.getHash();
      const density2 = new ComputationDensity();
      expect(density2.getHash()).toBe(hash1);
    });
  });

  // ==================== MaximumComputation Tests ====================

  describe('MaximumComputation', () => {
    let maxComp: MaximumComputation;

    beforeEach(() => {
      maxComp = new MaximumComputation();
    });

    test('should compute max operations for energy and time', () => {
      const energy = 1; // 1 Joule
      const time = 1;   // 1 second
      const result = maxComp.maxOperations(energy, time);
      
      expect(result.maxOperations).toBeGreaterThan(0);
      expect(result.maxBits).toBeGreaterThan(0);
      expect(result.operationsPerSecond).toBeCloseTo(result.maxOperations / time, 10);
    });

    test('should compute max operations from mass', () => {
      const mass = 1e-10;
      const time = 1;
      const result = maxComp.fromMass(mass, time);
      
      expect(result.maxOperations).toBeGreaterThan(0);
      expect(result.energy).toBe(mass * Math.pow(299792458, 2));
    });

    test('should compute efficiency', () => {
      const energy = 1;
      const time = 1;
      const maxResult = maxComp.maxOperations(energy, time);
      
      const halfOps = maxResult.maxOperations / 2;
      const effResult = maxComp.computeEfficiency(halfOps, energy, time);
      
      expect(effResult.efficiency).toBeCloseTo(0.5, 10);
    });

    test('should compute Planck maximum', () => {
      const result = maxComp.planckMaximum();
      
      expect(result.energy).toBeCloseTo(PlanckComputationConstants.EP, 1);
      expect(result.time).toBeCloseTo(PlanckComputationConstants.tP, 50);
    });

    test('should compute minimum energy for operations', () => {
      const ops = 1e20;
      const time = 1;
      const minEnergy = maxComp.minimumEnergy(ops, time);
      
      expect(minEnergy).toBeGreaterThan(0);
      
      // Verify: E = Nπħ/(2t)
      const hbar = 1.054571817e-34;
      const expected = (ops * Math.PI * hbar) / (2 * time);
      expect(minEnergy).toBeCloseTo(expected, 10);
    });

    test('should compute minimum time for operations', () => {
      const ops = 1e20;
      const energy = 1;
      const minTime = maxComp.minimumTime(ops, energy);
      
      expect(minTime).toBeGreaterThan(0);
    });

    test('should have deterministic hash', () => {
      const hash1 = maxComp.getHash();
      const maxComp2 = new MaximumComputation();
      expect(maxComp2.getHash()).toBe(hash1);
    });
  });

  // ==================== LloydLimit Tests ====================

  describe('LloydLimit', () => {
    let lloyd: LloydLimit;

    beforeEach(() => {
      lloyd = new LloydLimit();
    });

    test('should compute Lloyd limit for energy', () => {
      const energy = 1; // 1 Joule
      const result = lloyd.compute(energy);
      
      expect(result.maxOpsPerSecond).toBeGreaterThan(0);
      expect(result.maxBitsPerSecond).toBeGreaterThan(0);
      expect(result.maxOpsPerJoule).toBeGreaterThan(0);
    });

    test('should verify Lloyd formula: 2E/(πħ)', () => {
      const energy = 1;
      const result = lloyd.compute(energy);
      
      const hbar = 1.054571817e-34;
      const expected = (2 * energy) / (Math.PI * hbar);
      expect(result.maxOpsPerSecond).toBeCloseTo(expected, 5);
    });

    test('should compute limit from mass', () => {
      const mass = 1;
      const result = lloyd.fromMass(mass);
      
      const energy = mass * Math.pow(299792458, 2);
      const directResult = lloyd.compute(energy);
      
      expect(result.maxOpsPerSecond).toBeCloseTo(directResult.maxOpsPerSecond, 10);
    });

    test('should compute Planck limit', () => {
      const result = lloyd.planckLimit();
      
      expect(result.energy).toBeCloseTo(PlanckComputationConstants.EP, 1);
      expect(result.planckNormalized).toBeCloseTo(1, 5);
    });

    test('should compute required energy', () => {
      const targetOps = 1e40;
      const energy = lloyd.requiredEnergy(targetOps);
      
      expect(energy).toBeGreaterThan(0);
      
      // Verify: computing with this energy gives target ops
      const result = lloyd.compute(energy);
      const ratio = result.maxOpsPerSecond / targetOps;
      expect(ratio).toBeCloseTo(1, 10);
    });

    test('should return universal constant', () => {
      const constant = lloyd.universalConstant();
      
      const hbar = 1.054571817e-34;
      const expected = 2 / (Math.PI * hbar);
      expect(constant).toBeCloseTo(expected, 10);
    });

    test('should have deterministic hash', () => {
      const hash1 = lloyd.getHash();
      const lloyd2 = new LloydLimit();
      expect(lloyd2.getHash()).toBe(hash1);
    });
  });

  // ==================== MargolusLevitin Tests ====================

  describe('MargolusLevitin', () => {
    let ml: MargolusLevitin;

    beforeEach(() => {
      ml = new MargolusLevitin();
    });

    test('should compute min transition time', () => {
      const energy = 1; // 1 Joule
      const result = ml.minTransitionTime(energy);
      
      expect(result.minTime).toBeGreaterThan(0);
      expect(result.maxFrequency).toBeGreaterThan(0);
      expect(result.maxFrequency).toBeCloseTo(1 / result.minTime, 10);
    });

    test('should verify formula: t_min = πħ/(2E)', () => {
      const energy = 1;
      const result = ml.minTransitionTime(energy);
      
      const hbar = 1.054571817e-34;
      const expected = (Math.PI * hbar) / (2 * energy);
      expect(result.minTime).toBeCloseTo(expected, 44);
    });

    test('should compute max transition frequency', () => {
      const energy = 1;
      const freq = ml.maxTransitionFrequency(energy);
      
      const result = ml.minTransitionTime(energy);
      expect(freq).toBeCloseTo(result.maxFrequency, 10);
    });

    test('should compute required energy for time', () => {
      const targetTime = 1e-10;
      const energy = ml.requiredEnergy(targetTime);
      
      const result = ml.minTransitionTime(energy);
      expect(result.minTime).toBeCloseTo(targetTime, 20);
    });

    test('should compute Planck transition', () => {
      const result = ml.planckTransition();
      
      expect(result.energy).toBeCloseTo(PlanckComputationConstants.EP, 1);
      // Min time should be within order of magnitude of Planck time
      // t_min = πħ/(2E) ≈ π/2 * t_P when E = E_P
      const ratio = result.minTime / PlanckComputationConstants.tP;
      expect(ratio).toBeGreaterThan(0.5);
      expect(ratio).toBeLessThan(2);
    });

    test('should have deterministic hash', () => {
      const hash1 = ml.getHash();
      const ml2 = new MargolusLevitin();
      expect(ml2.getHash()).toBe(hash1);
    });
  });

  // ==================== LandauerLimit Tests ====================

  describe('LandauerLimit', () => {
    let landauer: LandauerLimit;

    beforeEach(() => {
      landauer = new LandauerLimit();
    });

    test('should compute Landauer limit at temperature', () => {
      const temperature = 300; // Room temperature
      const result = landauer.compute(temperature);
      
      expect(result.minEnergyPerBit).toBeGreaterThan(0);
      expect(result.maxBitsPerJoule).toBeGreaterThan(0);
      expect(result.maxBitsPerJoule).toBeCloseTo(1 / result.minEnergyPerBit, 10);
    });

    test('should verify formula: E_min = kT·ln(2)', () => {
      const temperature = 300;
      const result = landauer.compute(temperature);
      
      const kB = 1.380649e-23;
      const expected = kB * temperature * Math.LN2;
      expect(result.minEnergyPerBit).toBeCloseTo(expected, 30);
    });

    test('should compute room temperature limit', () => {
      const result = landauer.roomTemperature();
      
      expect(result.temperature).toBe(300);
      expect(result.minEnergyPerBit).toBeGreaterThan(0);
    });

    test('should compute Planck temperature limit', () => {
      const result = landauer.planckTemperature();
      
      expect(result.temperature).toBeCloseTo(PlanckComputationConstants.TP, 20);
      expect(result.minEnergyPerBit).toBeGreaterThan(0);
    });

    test('should compute max bits erased', () => {
      const energy = 1; // 1 Joule
      const temperature = 300;
      const bits = landauer.maxBitsErased(energy, temperature);
      
      const result = landauer.compute(temperature);
      expect(bits).toBeCloseTo(energy / result.minEnergyPerBit, 10);
    });

    test('should compute min temperature', () => {
      const energy = 1;
      const bits = 1e20;
      const minTemp = landauer.minTemperature(energy, bits);
      
      expect(minTemp).toBeGreaterThan(0);
      
      // At this temperature, erasing 'bits' should require 'energy'
      const result = landauer.compute(minTemp);
      expect(bits * result.minEnergyPerBit).toBeCloseTo(energy, 10);
    });

    test('should have deterministic hash', () => {
      const hash1 = landauer.getHash();
      const landauer2 = new LandauerLimit();
      expect(landauer2.getHash()).toBe(hash1);
    });
  });

  // ==================== BremermannLimit Tests ====================

  describe('BremermannLimit', () => {
    let bremermann: BremermannLimit;

    beforeEach(() => {
      bremermann = new BremermannLimit();
    });

    test('should compute Bremermann limit for mass', () => {
      const mass = 1; // 1 kg
      const result = bremermann.compute(mass);
      
      expect(result.maxBitsPerSecond).toBeGreaterThan(0);
      expect(result.maxOpsPerSecond).toBeGreaterThan(0);
    });

    test('should verify formula: Rate ≤ mc²/h', () => {
      const mass = 1;
      const result = bremermann.compute(mass);
      
      const c = 299792458;
      const h = 6.62607015e-34;
      const expected = (mass * c * c) / h;
      expect(result.maxBitsPerSecond).toBeCloseTo(expected, 30);
    });

    test('should compute limit for 1 kg', () => {
      const result = bremermann.oneKilogram();
      
      expect(result.mass).toBe(1);
      expect(result.maxBitsPerSecond).toBeGreaterThan(1e50);
    });

    test('should compute limit at Planck mass', () => {
      const result = bremermann.planckMass();
      
      expect(result.mass).toBeCloseTo(PlanckComputationConstants.mP, 15);
    });

    test('should compute required mass', () => {
      const targetBits = 1e50;
      const mass = bremermann.requiredMass(targetBits);
      
      expect(mass).toBeGreaterThan(0);
      
      const result = bremermann.compute(mass);
      // Use relative comparison for large numbers
      const ratio = result.maxBitsPerSecond / targetBits;
      expect(ratio).toBeCloseTo(1, 10);
    });

    test('should have deterministic hash', () => {
      const hash1 = bremermann.getHash();
      const bremermann2 = new BremermannLimit();
      expect(bremermann2.getHash()).toBe(hash1);
    });
  });

  // ==================== BlackHoleComputer Tests ====================

  describe('BlackHoleComputer', () => {
    let bhc: BlackHoleComputer;

    beforeEach(() => {
      bhc = new BlackHoleComputer();
    });

    test('should compute black hole computer specs', () => {
      const mass = 1e30; // ~solar mass
      const result = bhc.compute(mass);
      
      expect(result.schwarzschildRadius).toBeGreaterThan(0);
      expect(result.hawkingTemperature).toBeGreaterThan(0);
      expect(result.lifetime).toBeGreaterThan(0);
      expect(result.maxOperations).toBeGreaterThan(0);
      expect(result.maxMemory).toBeGreaterThan(0);
    });

    test('should compute Schwarzschild radius: R = 2GM/c²', () => {
      const mass = 1e30;
      const result = bhc.compute(mass);
      
      const G = 6.6743e-11;
      const c = 299792458;
      const expected = (2 * G * mass) / (c * c);
      expect(result.schwarzschildRadius).toBeCloseTo(expected, 1);
    });

    test('should compute Planck mass black hole', () => {
      const result = bhc.planckMassBlackHole();
      
      expect(result.mass).toBeCloseTo(PlanckComputationConstants.mP, 15);
      // Schwarzschild radius should be ~2*Planck length (R = 2GM/c²)
      // For Planck mass: R_s = 2 * G * m_P / c² ≈ 2 * l_P
      expect(result.schwarzschildRadius).toBeCloseTo(2 * PlanckComputationConstants.lP, 40);
    });

    test('should compute solar mass black hole', () => {
      const result = bhc.solarMassBlackHole();
      
      expect(result.mass).toBeCloseTo(1.989e30, 25);
      expect(result.schwarzschildRadius).toBeCloseTo(2954, 0); // ~3 km
    });

    test('should compute mass for memory', () => {
      const bits = 1e70;
      const mass = bhc.massForMemory(bits);
      
      expect(mass).toBeGreaterThan(0);
      
      const result = bhc.compute(mass);
      // Memory should be approximately the target
      const relativeDiff = Math.abs(result.maxMemory - bits) / bits;
      expect(relativeDiff).toBeLessThan(0.1);
    });

    test('should compute memory for mass', () => {
      const mass = 1e30;
      const memory = bhc.memoryForMass(mass);
      
      const result = bhc.compute(mass);
      expect(memory).toBeCloseTo(result.maxMemory, 10);
    });

    test('should have deterministic hash', () => {
      const hash1 = bhc.getHash();
      const bhc2 = new BlackHoleComputer();
      expect(bhc2.getHash()).toBe(hash1);
    });
  });

  // ==================== ComputationLimits Tests ====================

  describe('ComputationLimits', () => {
    let limits: ComputationLimits;

    beforeEach(() => {
      limits = new ComputationLimits();
    });

    test('should expose all limit calculators', () => {
      expect(limits.lloyd).toBeInstanceOf(LloydLimit);
      expect(limits.margolusLevitin).toBeInstanceOf(MargolusLevitin);
      expect(limits.landauer).toBeInstanceOf(LandauerLimit);
      expect(limits.bremermann).toBeInstanceOf(BremermannLimit);
      expect(limits.blackHole).toBeInstanceOf(BlackHoleComputer);
      expect(limits.density).toBeInstanceOf(ComputationDensity);
      expect(limits.maximum).toBeInstanceOf(MaximumComputation);
    });

    test('should compute all limits for resources', () => {
      const resources = {
        energy: 1,
        mass: 1e-10,
        volume: 1e-30,
        time: 1
      };
      
      const result = limits.allLimits(resources) as any;
      
      expect(result.lloyd).toBeDefined();
      expect(result.margolusLevitin).toBeDefined();
      expect(result.landauer).toBeDefined();
      expect(result.bremermann).toBeDefined();
      expect(result.maximum).toBeDefined();
      expect(result.density).toBeDefined();
    });

    test('should handle energy-only resources', () => {
      const resources = {
        energy: 1,
        mass: 0,
        volume: 0,
        time: 1
      };
      
      const result = limits.allLimits(resources) as any;
      expect(result.lloyd).toBeDefined();
    });

    test('should have deterministic hash', () => {
      const hash1 = limits.getHash();
      const limits2 = new ComputationLimits();
      expect(limits2.getHash()).toBe(hash1);
    });
  });

  // ==================== PlanckComputationConstants Tests ====================

  describe('PlanckComputationConstants', () => {
    test('should have correct Planck length', () => {
      expect(PlanckComputationConstants.lP).toBeCloseTo(1.616255e-35, 40);
    });

    test('should have correct Planck time', () => {
      expect(PlanckComputationConstants.tP).toBeCloseTo(5.391247e-44, 50);
    });

    test('should have correct Planck energy', () => {
      expect(PlanckComputationConstants.EP).toBeCloseTo(1.956e9, 1);
    });

    test('should have correct hbar', () => {
      expect(PlanckComputationConstants.hbar).toBeCloseTo(1.054571817e-34, 44);
    });

    test('should have computation constant: 2/(πħ)', () => {
      const hbar = 1.054571817e-34;
      const expected = 2 / (Math.PI * hbar);
      expect(PlanckComputationConstants.computationConstant).toBeCloseTo(expected, 20);
    });

    test('should have Planck ops per second', () => {
      const expected = 1 / PlanckComputationConstants.tP;
      expect(PlanckComputationConstants.planckOpsPerSecond).toBeCloseTo(expected, 30);
    });

    test('should have Landauer energy at room temp', () => {
      const kB = 1.380649e-23;
      const expected = kB * 300 * Math.LN2;
      expect(PlanckComputationConstants.landauerEnergyRoomTemp).toBeCloseTo(expected, 30);
    });

    test('should have Bremermann constant', () => {
      const c = 299792458;
      const h = 6.62607015e-34;
      const expected = (c * c) / h;
      expect(PlanckComputationConstants.bremermannConstant).toBeCloseTo(expected, 30);
    });
  });

  // ==================== Physics Validation Tests ====================

  describe('Physics Validation', () => {
    test('Lloyd limit should match Margolus-Levitin at same energy', () => {
      const energy = 1;
      const lloyd = new LloydLimit();
      const ml = new MargolusLevitin();
      
      const lloydResult = lloyd.compute(energy);
      const mlResult = ml.minTransitionTime(energy);
      
      // Lloyd ops/s = 2E/(πħ), ML frequency = 2E/(πħ)
      expect(lloydResult.maxOpsPerSecond).toBeCloseTo(mlResult.maxFrequency, 5);
    });

    test('Black hole should maximize computation for given mass', () => {
      const mass = 1e20;
      const bhc = new BlackHoleComputer();
      const brem = new BremermannLimit();
      
      const bhResult = bhc.compute(mass);
      const bremResult = brem.compute(mass);
      
      // Black hole processing rate should be at Bremermann limit
      // (within order of magnitude due to different formulations)
      const ratio = bremResult.maxOpsPerSecond / (bhResult.maxOperations / bhResult.lifetime);
      expect(ratio).toBeGreaterThan(0.01);
      expect(ratio).toBeLessThan(100);
    });

    test('Landauer limit should increase with temperature', () => {
      const landauer = new LandauerLimit();
      
      const cold = landauer.compute(100);
      const warm = landauer.compute(300);
      const hot = landauer.compute(1000);
      
      expect(warm.minEnergyPerBit).toBeGreaterThan(cold.minEnergyPerBit);
      expect(hot.minEnergyPerBit).toBeGreaterThan(warm.minEnergyPerBit);
    });

    test('Computation limits should scale with energy', () => {
      const lloyd = new LloydLimit();
      
      const e1 = lloyd.compute(1);
      const e10 = lloyd.compute(10);
      
      // Use relative comparison for large floating point numbers
      const ratio = e10.maxOpsPerSecond / (10 * e1.maxOpsPerSecond);
      expect(ratio).toBeCloseTo(1, 10);
    });

    test('Minimum time should approach Planck time for Planck energy', () => {
      const ml = new MargolusLevitin();
      const result = ml.planckTransition();
      
      const ratio = result.minTime / PlanckComputationConstants.tP;
      expect(ratio).toBeGreaterThan(0.1);
      expect(ratio).toBeLessThan(10);
    });
  });

  // ==================== Integration Tests ====================

  describe('Integration Tests', () => {
    test('should compute consistent limits across methods', () => {
      const limits = new ComputationLimits();
      const energy = 1;
      
      const lloydResult = limits.lloyd.compute(energy);
      const densityResult = limits.density.forEnergy(energy);
      
      expect(lloydResult.maxOpsPerSecond).toBeCloseTo(densityResult.operationsPerSecond, 10);
    });

    test('should maintain energy conservation', () => {
      const maxComp = new MaximumComputation();
      const energy = 1;
      const time = 1;
      
      const result = maxComp.maxOperations(energy, time);
      const requiredEnergy = maxComp.minimumEnergy(result.maxOperations, time);
      
      expect(requiredEnergy).toBeCloseTo(energy, 10);
    });

    test('should maintain time consistency', () => {
      const maxComp = new MaximumComputation();
      const energy = 1;
      const time = 1;
      
      const result = maxComp.maxOperations(energy, time);
      const requiredTime = maxComp.minimumTime(result.maxOperations, energy);
      
      expect(requiredTime).toBeCloseTo(time, 10);
    });

    test('hash chains should be consistent', () => {
      const limits1 = new ComputationLimits();
      const limits2 = new ComputationLimits();
      
      expect(limits1.getHash()).toBe(limits2.getHash());
      expect(limits1.lloyd.getHash()).toBe(limits2.lloyd.getHash());
    });

    test('all classes should have hashes', () => {
      const density = new ComputationDensity();
      const maxComp = new MaximumComputation();
      const lloyd = new LloydLimit();
      const ml = new MargolusLevitin();
      const landauer = new LandauerLimit();
      const bremermann = new BremermannLimit();
      const bhc = new BlackHoleComputer();
      const limits = new ComputationLimits();
      
      expect(density.getHash()).toBeDefined();
      expect(maxComp.getHash()).toBeDefined();
      expect(lloyd.getHash()).toBeDefined();
      expect(ml.getHash()).toBeDefined();
      expect(landauer.getHash()).toBeDefined();
      expect(bremermann.getHash()).toBeDefined();
      expect(bhc.getHash()).toBeDefined();
      expect(limits.getHash()).toBeDefined();
    });
  });
});
