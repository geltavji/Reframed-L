/**
 * Qlaws Ham - InformationEnergy Module Tests (M06.03)
 * 
 * Comprehensive tests for information-energy equivalence module.
 * 
 * @module InformationEnergy.test
 * @version 1.0.0
 */

import {
  InformationEnergy,
  InformationEnergyFactory,
  LandauerLimit,
  ReversibleComputation,
  InfoEnergyConstants,
  LandauerResult,
  ReversibleAnalysis,
  EnergyConversion,
  ComputationalBounds,
  InformationDensity
} from '../../../src/revolutionary/infoEnergy/InformationEnergy';
import { Logger, LogLevel } from '../../../src/core/logger/Logger';

describe('InformationEnergy Module (M06.03)', () => {
  let logger: Logger;
  let infoEnergy: InformationEnergy;

  beforeEach(() => {
    Logger.resetInstance();
    logger = Logger.getInstance({ minLevel: LogLevel.ERROR, enableConsole: false });
    InformationEnergy.setLogger(logger);
    infoEnergy = new InformationEnergy();
  });

  afterEach(() => {
    infoEnergy.clear();
    Logger.resetInstance();
  });

  describe('InfoEnergyConstants', () => {
    it('should have correct Boltzmann constant', () => {
      expect(InfoEnergyConstants.kB).toBeCloseTo(1.380649e-23, 28);
    });

    it('should have correct speed of light', () => {
      expect(InfoEnergyConstants.c).toBe(299792458);
    });

    it('should have correct Planck constant', () => {
      expect(InfoEnergyConstants.h).toBeCloseTo(6.62607015e-34, 43);
    });

    it('should have correct reduced Planck constant', () => {
      expect(InfoEnergyConstants.hbar).toBeCloseTo(1.054571817e-34, 43);
    });

    it('should have correct ln(2)', () => {
      expect(InfoEnergyConstants.ln2).toBe(Math.LN2);
    });

    it('should have room temperature defined', () => {
      expect(InfoEnergyConstants.roomTemperature).toBe(300);
    });
  });

  describe('LandauerLimit Class', () => {
    let landauer: LandauerLimit;

    beforeEach(() => {
      landauer = new LandauerLimit();
    });

    afterEach(() => {
      landauer.clear();
    });

    it('should calculate minimum energy at room temperature', () => {
      const minEnergy = landauer.calculateMinimumEnergy();
      
      // E_min = kT·ln(2) at 300K
      const expected = InfoEnergyConstants.kB * 300 * Math.LN2;
      expect(minEnergy).toBeCloseTo(expected, 25);
    });

    it('should calculate minimum energy at different temperatures', () => {
      const energy100K = landauer.calculateMinimumEnergy(100);
      const energy300K = landauer.calculateMinimumEnergy(300);
      const energy600K = landauer.calculateMinimumEnergy(600);
      
      // Energy should scale linearly with temperature
      expect(energy300K / energy100K).toBeCloseTo(3, 10);
      expect(energy600K / energy300K).toBeCloseTo(2, 10);
    });

    it('should calculate erasure energy for multiple bits', () => {
      const result = landauer.calculateErasureEnergy(8);
      
      expect(result.bitsErased).toBe(8);
      expect(result.totalEnergy).toBeCloseTo(result.minimumEnergy * 8, 25);
      expect(result.hash).toHaveLength(64);
    });

    it('should calculate entropy change on erasure', () => {
      const result = landauer.calculateErasureEnergy(1);
      
      // ΔS = k·ln(2) per bit
      const expectedEntropy = InfoEnergyConstants.kB * Math.LN2;
      expect(result.entropyChange).toBeCloseTo(expectedEntropy, 25);
    });

    it('should calculate bits from energy', () => {
      const bits = landauer.calculateBitsFromEnergy(1e-18);
      
      expect(bits).toBeGreaterThan(0);
      expect(Number.isInteger(bits)).toBe(true);
    });

    it('should calculate temperature for energy budget', () => {
      const energy = 1e-18;
      const bits = 100;
      
      const temp = landauer.calculateTemperatureForEnergy(energy, bits);
      
      // Verify: E = kT·ln(2)·n → T = E / (k·ln(2)·n)
      const expectedTemp = energy / (InfoEnergyConstants.kB * Math.LN2 * bits);
      expect(temp).toBeCloseTo(expectedTemp, 10);
    });

    it('should detect Landauer limit violations', () => {
      const minEnergy = landauer.calculateMinimumEnergy(300);
      
      // Too little energy for one bit
      expect(landauer.violatesLimit(minEnergy * 0.5, 1, 300)).toBe(true);
      
      // Enough energy for one bit
      expect(landauer.violatesLimit(minEnergy, 1, 300)).toBe(false);
      
      // More than enough energy
      expect(landauer.violatesLimit(minEnergy * 2, 1, 300)).toBe(false);
    });

    it('should track calculations', () => {
      landauer.calculateErasureEnergy(1);
      landauer.calculateErasureEnergy(8);
      landauer.calculateErasureEnergy(64);
      
      expect(landauer.getCalculations()).toHaveLength(3);
    });

    it('should clear calculations', () => {
      landauer.calculateErasureEnergy(1);
      landauer.clear();
      
      expect(landauer.getCalculations()).toHaveLength(0);
    });
  });

  describe('ReversibleComputation Class', () => {
    let reversible: ReversibleComputation;

    beforeEach(() => {
      reversible = new ReversibleComputation();
    });

    afterEach(() => {
      reversible.clear();
    });

    it('should identify reversible operations', () => {
      const analysis = reversible.analyze('CopyBit', 1, 2); // 1 in, 2 out (includes copy)
      
      // Output >= input means no information lost
      expect(analysis.isReversible).toBe(true);
      expect(analysis.bitsLost).toBe(0);
      expect(analysis.energyDissipated).toBe(0);
    });

    it('should identify irreversible operations', () => {
      const analysis = reversible.analyze('AND', 2, 1);
      
      expect(analysis.isReversible).toBe(false);
      expect(analysis.bitsLost).toBe(1);
      expect(analysis.energyDissipated).toBeGreaterThan(0);
    });

    it('should analyze common logical gates', () => {
      const not = reversible.analyzeGate('NOT');
      const and = reversible.analyzeGate('AND');
      const cnot = reversible.analyzeGate('CNOT');
      const toffoli = reversible.analyzeGate('CCNOT');
      
      expect(not.isReversible).toBe(true);
      expect(and.isReversible).toBe(false);
      expect(cnot.isReversible).toBe(true);
      expect(toffoli.isReversible).toBe(true);
    });

    it('should calculate efficiency', () => {
      const reversibleOp = reversible.analyze('Identity', 2, 2);
      const irreversibleOp = reversible.analyze('AND', 2, 1);
      
      expect(reversibleOp.efficiency).toBe(1);
      expect(irreversibleOp.efficiency).toBe(0.5);
    });

    it('should calculate energy savings from reversibility', () => {
      const savings = reversible.calculateEnergySavings(1000);
      
      expect(savings.saved).toBe(savings.original);
      expect(savings.percentage).toBe(100);
    });

    it('should get reversible operations only', () => {
      reversible.analyzeGate('NOT');
      reversible.analyzeGate('AND');
      reversible.analyzeGate('CNOT');
      
      const reversibleOps = reversible.getReversibleOperations();
      expect(reversibleOps).toHaveLength(2); // NOT and CNOT
    });

    it('should get irreversible operations only', () => {
      reversible.analyzeGate('NOT');
      reversible.analyzeGate('AND');
      reversible.analyzeGate('OR');
      
      const irreversibleOps = reversible.getIrreversibleOperations();
      expect(irreversibleOps).toHaveLength(2); // AND and OR
    });

    it('should handle unknown gates', () => {
      const unknown = reversible.analyzeGate('UNKNOWN_GATE');
      
      expect(unknown).toBeDefined();
      expect(unknown.operation).toBe('UNKNOWN_GATE');
    });
  });

  describe('InformationEnergy - Conversion', () => {
    it('should convert information to energy', () => {
      const conversion = infoEnergy.informationToEnergy(1);
      
      expect(conversion.inputBits).toBe(1);
      expect(conversion.outputEnergy).toBeGreaterThan(0);
      expect(conversion.efficiency).toBe(1);
      expect(conversion.hash).toHaveLength(64);
    });

    it('should scale energy linearly with bits', () => {
      const conv1 = infoEnergy.informationToEnergy(1);
      const conv10 = infoEnergy.informationToEnergy(10);
      
      expect(conv10.outputEnergy / conv1.outputEnergy).toBeCloseTo(10, 10);
    });

    it('should convert energy to information', () => {
      const energy = 1e-18; // 1 attojoule
      const bits = infoEnergy.energyToInformation(energy);
      
      expect(bits).toBeGreaterThan(0);
    });

    it('should be inverse operations', () => {
      const originalBits = 1000;
      const energy = infoEnergy.informationToEnergy(originalBits).outputEnergy;
      const recoveredBits = infoEnergy.energyToInformation(energy);
      
      expect(recoveredBits).toBeCloseTo(originalBits, 10);
    });

    it('should track conversion history', () => {
      infoEnergy.informationToEnergy(1);
      infoEnergy.informationToEnergy(10);
      infoEnergy.informationToEnergy(100);
      
      expect(infoEnergy.getConversions()).toHaveLength(3);
    });
  });

  describe('InformationEnergy - Mass Equivalence', () => {
    it('should convert mass to information', () => {
      const mass = 1e-30; // Very small mass (kg)
      const bits = infoEnergy.massToInformation(mass);
      
      expect(bits).toBeGreaterThan(0);
    });

    it('should convert information to mass', () => {
      const bits = 1e40; // Huge number of bits
      const mass = infoEnergy.informationToMass(bits);
      
      expect(mass).toBeGreaterThan(0);
    });

    it('should maintain consistency in mass-information conversion', () => {
      const originalMass = 1e-25;
      const bits = infoEnergy.massToInformation(originalMass);
      const recoveredMass = infoEnergy.informationToMass(bits);
      
      expect(recoveredMass).toBeCloseTo(originalMass, 30);
    });
  });

  describe('InformationEnergy - Computational Bounds', () => {
    it('should calculate Lloyd limit', () => {
      const energy = 1; // 1 Joule
      const bounds = infoEnergy.calculateBounds(energy);
      
      // Lloyd's limit: 2E/(πℏ)
      const expectedLloyd = (2 * energy) / (Math.PI * InfoEnergyConstants.hbar);
      expect(bounds.lloydLimit).toBeCloseTo(expectedLloyd, 10);
    });

    it('should calculate Bremermann limit when mass provided', () => {
      const energy = 1;
      const mass = 1; // 1 kg
      const bounds = infoEnergy.calculateBounds(energy, mass);
      
      expect(bounds.bremermannLimit).toBeDefined();
      // Bremermann: mc²/h
      const expected = (mass * InfoEnergyConstants.c ** 2) / InfoEnergyConstants.h;
      expect(bounds.bremermannLimit).toBeCloseTo(expected, 10);
    });

    it('should calculate minimum energy per operation', () => {
      const bounds = infoEnergy.calculateBounds(1);
      
      // E_min = kT·ln(2) at room temperature
      const expected = InfoEnergyConstants.kB * 300 * Math.LN2;
      expect(bounds.minimumEnergy).toBeCloseTo(expected, 25);
    });

    it('should track bounds history', () => {
      infoEnergy.calculateBounds(1);
      infoEnergy.calculateBounds(10);
      infoEnergy.calculateBounds(100);
      
      expect(infoEnergy.getBoundsHistory()).toHaveLength(3);
    });

    it('should generate unique hashes for bounds', () => {
      const bounds1 = infoEnergy.calculateBounds(1);
      const bounds2 = infoEnergy.calculateBounds(2);
      
      expect(bounds1.hash).not.toBe(bounds2.hash);
    });
  });

  describe('InformationEnergy - Information Density', () => {
    it('should calculate Bekenstein bound', () => {
      const energy = 1; // 1 Joule
      const radius = 1; // 1 meter
      const actualBits = 1e30;
      
      const density = infoEnergy.calculateInformationDensity(energy, radius, actualBits);
      
      expect(density.bekensteinBound).toBeGreaterThan(0);
      expect(density.hash).toHaveLength(64);
    });

    it('should calculate holographic limit', () => {
      const energy = 1e10;
      const radius = 0.001; // 1 millimeter
      const actualBits = 1e20;
      
      const density = infoEnergy.calculateInformationDensity(energy, radius, actualBits);
      
      expect(density.holographicLimit).toBeGreaterThan(0);
    });

    it('should detect if below Bekenstein bound', () => {
      const energy = 1e20;
      const radius = 1;
      const lowBits = 1e10;
      
      const density = infoEnergy.calculateInformationDensity(energy, radius, lowBits);
      
      expect(density.isBelowBound).toBe(true);
    });

    it('should calculate information density per volume', () => {
      const energy = 1;
      const radius = 1;
      const bits = 1e30;
      
      const density = infoEnergy.calculateInformationDensity(energy, radius, bits);
      
      // Volume = 4/3 π r³
      const expectedVolume = (4/3) * Math.PI * 1 * 1 * 1;
      expect(density.volume).toBeCloseTo(expectedVolume, 10);
      expect(density.density).toBeCloseTo(bits / expectedVolume, 10);
    });
  });

  describe('InformationEnergy - Getters', () => {
    it('should get Landauer calculator', () => {
      expect(infoEnergy.getLandauer()).toBeInstanceOf(LandauerLimit);
    });

    it('should get reversible computation analyzer', () => {
      expect(infoEnergy.getReversible()).toBeInstanceOf(ReversibleComputation);
    });
  });

  describe('InformationEnergy - Statistics', () => {
    it('should provide statistics', () => {
      infoEnergy.informationToEnergy(1);
      infoEnergy.informationToEnergy(10);
      infoEnergy.calculateBounds(1);
      
      const stats = infoEnergy.getStatistics();
      
      expect(stats.totalConversions).toBe(2);
      expect(stats.totalBoundsCalculations).toBe(1);
      expect(stats.averageEfficiency).toBe(1);
    });

    it('should handle empty statistics', () => {
      const stats = infoEnergy.getStatistics();
      
      expect(stats.totalConversions).toBe(0);
      expect(stats.averageEfficiency).toBe(0);
    });
  });

  describe('InformationEnergy - Export and Hash', () => {
    it('should export to JSON', () => {
      infoEnergy.informationToEnergy(1);
      infoEnergy.calculateBounds(1);
      
      const json = infoEnergy.exportToJson();
      const parsed = JSON.parse(json);
      
      expect(parsed.conversions).toBeDefined();
      expect(parsed.bounds).toBeDefined();
      expect(parsed.statistics).toBeDefined();
      expect(parsed.exportTimestamp).toBeDefined();
    });

    it('should generate proof chain hash', () => {
      infoEnergy.informationToEnergy(1);
      infoEnergy.calculateBounds(1);
      
      const hash = infoEnergy.getProofChainHash();
      expect(hash).toHaveLength(64);
    });

    it('should clear all data', () => {
      infoEnergy.informationToEnergy(1);
      infoEnergy.calculateBounds(1);
      
      infoEnergy.clear();
      
      expect(infoEnergy.getConversions()).toHaveLength(0);
      expect(infoEnergy.getBoundsHistory()).toHaveLength(0);
    });
  });

  describe('InformationEnergyFactory', () => {
    it('should create instance without logger', () => {
      const instance = InformationEnergyFactory.create();
      expect(instance).toBeInstanceOf(InformationEnergy);
    });

    it('should create instance with logger', () => {
      const instance = InformationEnergyFactory.create(logger);
      expect(instance).toBeInstanceOf(InformationEnergy);
    });
  });

  describe('Physical Consistency Checks', () => {
    it('should give consistent energy for 1 bit at 300K', () => {
      const result = infoEnergy.getLandauer().calculateErasureEnergy(1, 300);
      
      // Expected: kT·ln(2) ≈ 2.87e-21 J at 300K
      expect(result.totalEnergy).toBeCloseTo(2.87e-21, 23);
    });

    it('should correctly apply temperature scaling', () => {
      const result1 = infoEnergy.getLandauer().calculateErasureEnergy(1, 100);
      const result2 = infoEnergy.getLandauer().calculateErasureEnergy(1, 200);
      
      // Energy should double when temperature doubles
      expect(result2.totalEnergy / result1.totalEnergy).toBeCloseTo(2, 10);
    });

    it('should respect Landauer principle in reversible analysis', () => {
      const reversible = infoEnergy.getReversible();
      
      // CNOT is reversible, should use no energy
      const cnot = reversible.analyzeGate('CNOT');
      expect(cnot.energyDissipated).toBe(0);
      
      // AND is irreversible, must dissipate at least kT·ln(2)
      const and = reversible.analyzeGate('AND');
      expect(and.energyDissipated).toBeGreaterThan(0);
    });
  });
});
