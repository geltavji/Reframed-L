/**
 * Qlaws Ham - FTLTheory Module Tests (M06.04)
 * 
 * Comprehensive tests for FTL theory exploration module.
 * 
 * @module FTLTheory.test
 * @version 1.0.0
 */

import {
  FTLTheory,
  FTLTheoryFactory,
  FTLChannel,
  TachyonField,
  ClosedTimelikeCurve,
  FTLConstants,
  FTLMechanism,
  CausalityType,
  FTLChannelAnalysis,
  TachyonFieldProperties,
  CTCProperties,
  NoSignalingAnalysis
} from '../../../src/revolutionary/ftl/FTLTheory';
import { Logger, LogLevel } from '../../../src/core/logger/Logger';

describe('FTLTheory Module (M06.04)', () => {
  let logger: Logger;
  let ftlTheory: FTLTheory;

  beforeEach(() => {
    Logger.resetInstance();
    logger = Logger.getInstance({ minLevel: LogLevel.ERROR, enableConsole: false });
    FTLTheory.setLogger(logger);
    ftlTheory = new FTLTheory();
  });

  afterEach(() => {
    ftlTheory.clear();
    Logger.resetInstance();
  });

  describe('FTLConstants', () => {
    it('should have correct speed of light', () => {
      expect(FTLConstants.c).toBe(299792458);
    });

    it('should have correct Planck time', () => {
      expect(FTLConstants.tPlanck).toBeCloseTo(5.391247e-44, 50);
    });

    it('should have correct Planck length', () => {
      expect(FTLConstants.lPlanck).toBeCloseTo(1.616255e-35, 40);
    });

    it('should have light year defined', () => {
      expect(FTLConstants.lightYear).toBeCloseTo(9.461e15, 12);
    });

    it('should have Schwarzschild constant defined', () => {
      expect(FTLConstants.schwarzschildConstant).toBeGreaterThan(0);
    });
  });

  describe('FTLChannel Class', () => {
    let channel: FTLChannel;

    beforeEach(() => {
      channel = new FTLChannel();
    });

    afterEach(() => {
      channel.clear();
    });

    it('should analyze FTL channel', () => {
      const analysis = channel.analyze(FTLMechanism.TACHYON_FIELD, 1e12);
      
      expect(analysis).toBeDefined();
      expect(analysis.mechanism).toBe(FTLMechanism.TACHYON_FIELD);
      expect(analysis.distance).toBe(1e12);
      expect(analysis.hash).toHaveLength(64);
    });

    it('should calculate classical time correctly', () => {
      const distance = FTLConstants.c; // 1 light-second
      const analysis = channel.analyze(FTLMechanism.WORMHOLE, distance);
      
      expect(analysis.classicalTime).toBeCloseTo(1, 10);
    });

    it('should calculate speed multiple', () => {
      const analysis = channel.analyze(FTLMechanism.ALCUBIERRE_DRIVE, 1e12, FTLConstants.c * 5);
      
      expect(analysis.speedMultiple).toBeCloseTo(5, 10);
    });

    it('should assess causality violations', () => {
      const subluminal = channel.analyze(FTLMechanism.TACHYON_FIELD, 1e9, FTLConstants.c * 0.5);
      const slowFTL = channel.analyze(FTLMechanism.TACHYON_FIELD, 1e9, FTLConstants.c * 1.5);
      const fastFTL = channel.analyze(FTLMechanism.TACHYON_FIELD, 1e9, FTLConstants.c * 5);
      const extremeFTL = channel.analyze(FTLMechanism.TACHYON_FIELD, 1e9, FTLConstants.c * 20);
      
      expect(subluminal.causalityViolation).toBe(CausalityType.NONE);
      expect(slowFTL.causalityViolation).toBe(CausalityType.POTENTIAL);
      expect(fastFTL.causalityViolation).toBe(CausalityType.DEFINITE);
      expect(extremeFTL.causalityViolation).toBe(CausalityType.PARADOX);
    });

    it('should estimate energy requirements', () => {
      const analysis = channel.analyze(FTLMechanism.WORMHOLE, 1e12);
      
      expect(analysis.energyRequired).toBeGreaterThan(0);
    });

    it('should assess physical plausibility', () => {
      const entanglement = channel.analyze(FTLMechanism.QUANTUM_ENTANGLEMENT, 1e9);
      const tachyon = channel.analyze(FTLMechanism.TACHYON_FIELD, 1e9);
      
      // Entanglement exists but can't transmit info FTL
      expect(entanglement.isPhysicallyPlausible).toBe(true);
      // Tachyons not observed
      expect(tachyon.isPhysicallyPlausible).toBe(false);
    });

    it('should list constraints', () => {
      const analysis = channel.analyze(FTLMechanism.WORMHOLE, 1e12);
      
      expect(analysis.constraints.length).toBeGreaterThan(0);
      expect(analysis.constraints).toContain('Exotic matter required');
    });

    it('should track analyses', () => {
      channel.analyze(FTLMechanism.TACHYON_FIELD, 1e9);
      channel.analyze(FTLMechanism.WORMHOLE, 1e10);
      channel.analyze(FTLMechanism.ALCUBIERRE_DRIVE, 1e11);
      
      expect(channel.getAnalyses()).toHaveLength(3);
    });

    it('should clear analyses', () => {
      channel.analyze(FTLMechanism.TACHYON_FIELD, 1e9);
      channel.clear();
      
      expect(channel.getAnalyses()).toHaveLength(0);
    });
  });

  describe('TachyonField Class', () => {
    let tachyonField: TachyonField;

    beforeEach(() => {
      tachyonField = new TachyonField();
    });

    afterEach(() => {
      tachyonField.clear();
    });

    it('should create tachyon particle', () => {
      const tachyon = tachyonField.createTachyon(1e-30, 1e-20);
      
      expect(tachyon).toBeDefined();
      expect(tachyon.restMass).toBe(1e-30);
      expect(tachyon.momentum).toBe(1e-20);
      expect(tachyon.hash).toHaveLength(64);
    });

    it('should calculate tachyon energy', () => {
      const tachyon = tachyonField.createTachyon(1e-30, 1e-20);
      
      expect(tachyon.energy).toBeGreaterThan(0);
    });

    it('should create superluminal particles', () => {
      const tachyon = tachyonField.createTachyon(1e-30, 1e-20);
      
      expect(tachyon.isSuperluminal).toBe(true);
      expect(tachyon.velocity).toBeGreaterThan(FTLConstants.c);
    });

    it('should identify causality issues', () => {
      const tachyon = tachyonField.createTachyon(1e-30, 1e-20);
      
      expect(tachyon.causalityIssues.length).toBeGreaterThan(0);
      expect(tachyon.causalityIssues).toContain('Superluminal velocity detected');
    });

    it('should calculate speed multiple', () => {
      const tachyon = tachyonField.createTachyon(1e-30, 1e-20);
      const multiple = tachyonField.getSpeedMultiple(tachyon);
      
      expect(multiple).toBeGreaterThan(1);
    });

    it('should track particles', () => {
      tachyonField.createTachyon(1e-30, 1e-20);
      tachyonField.createTachyon(1e-29, 1e-19);
      
      expect(tachyonField.getParticles()).toHaveLength(2);
    });

    it('should clear particles', () => {
      tachyonField.createTachyon(1e-30, 1e-20);
      tachyonField.clear();
      
      expect(tachyonField.getParticles()).toHaveLength(0);
    });
  });

  describe('ClosedTimelikeCurve Class', () => {
    let ctc: ClosedTimelikeCurve;

    beforeEach(() => {
      ctc = new ClosedTimelikeCurve();
    });

    afterEach(() => {
      ctc.clear();
    });

    it('should create rotating CTC', () => {
      const curve = ctc.createRotatingCTC(1e6, 1000);
      
      expect(curve).toBeDefined();
      expect(curve.radius).toBe(1e6);
      expect(curve.angularVelocity).toBe(1000);
      expect(curve.hash).toHaveLength(64);
    });

    it('should detect subluminal rotation', () => {
      // Slow rotation - subluminal
      const curve = ctc.createRotatingCTC(1, 1);  // v = ωr = 1 m/s
      
      expect(curve.canSendToOwnPast).toBe(false);
      expect(curve.timeDilation).toBeGreaterThan(0);
    });

    it('should detect superluminal rotation', () => {
      // Fast rotation - superluminal (v = ωr > c)
      const curve = ctc.createRotatingCTC(1e9, 1);  // v = 1e9 m/s > c
      
      expect(curve.canSendToOwnPast).toBe(true);
    });

    it('should apply Novikov self-consistency', () => {
      const curve = ctc.createRotatingCTC(1e9, 1);
      
      expect(curve.novikovSelfConsistent).toBe(true);
    });

    it('should list constraints', () => {
      const curve = ctc.createRotatingCTC(1e9, 1);
      
      expect(curve.constraints.length).toBeGreaterThan(0);
      expect(curve.constraints).toContain('Chronology protection conjecture (Hawking)');
    });

    it('should check self-consistency', () => {
      const curve = ctc.createRotatingCTC(1e9, 1);
      
      expect(ctc.checkSelfConsistency(curve)).toBe(true);
    });

    it('should track curves', () => {
      ctc.createRotatingCTC(1e6, 1000);
      ctc.createRotatingCTC(1e7, 100);
      
      expect(ctc.getCurves()).toHaveLength(2);
    });

    it('should clear curves', () => {
      ctc.createRotatingCTC(1e6, 1000);
      ctc.clear();
      
      expect(ctc.getCurves()).toHaveLength(0);
    });
  });

  describe('FTLTheory - No-Signaling Analysis', () => {
    it('should analyze quantum entanglement compliance', () => {
      const analysis = ftlTheory.analyzeNoSignaling(FTLMechanism.QUANTUM_ENTANGLEMENT);
      
      expect(analysis.violatesNoSignaling).toBe(false);
      expect(analysis.explanation).toContain('cannot transmit information');
      expect(analysis.possibleLoopholes).toHaveLength(0);
    });

    it('should analyze tachyon field violation', () => {
      const analysis = ftlTheory.analyzeNoSignaling(FTLMechanism.TACHYON_FIELD);
      
      expect(analysis.violatesNoSignaling).toBe(true);
      expect(analysis.possibleLoopholes.length).toBeGreaterThan(0);
    });

    it('should analyze wormhole violation', () => {
      const analysis = ftlTheory.analyzeNoSignaling(FTLMechanism.WORMHOLE);
      
      expect(analysis.violatesNoSignaling).toBe(true);
    });

    it('should analyze CTC violation', () => {
      const analysis = ftlTheory.analyzeNoSignaling(FTLMechanism.CLOSED_TIMELIKE_CURVE);
      
      expect(analysis.violatesNoSignaling).toBe(true);
      expect(analysis.explanation).toContain('own past');
    });

    it('should track analyses', () => {
      ftlTheory.analyzeNoSignaling(FTLMechanism.QUANTUM_ENTANGLEMENT);
      ftlTheory.analyzeNoSignaling(FTLMechanism.TACHYON_FIELD);
      
      expect(ftlTheory.getNoSignalingAnalyses()).toHaveLength(2);
    });
  });

  describe('FTLTheory - Travel Times', () => {
    it('should calculate travel times', () => {
      const distance = FTLConstants.lightYear; // 1 light year
      const times = ftlTheory.calculateTravelTimes(distance);
      
      // Light speed should take approximately 1 year
      const oneYear = 365.25 * 24 * 3600;
      // Allow 1% tolerance due to light year definition variations
      expect(Math.abs(times.light - oneYear) / oneYear).toBeLessThan(0.01);
      
      // 2x c should take half the time
      expect(times.twice).toBeCloseTo(times.light / 2, 5);
      
      // 10x c should take 1/10 the time
      expect(times.ten).toBeCloseTo(times.light / 10, 5);
    });

    it('should calculate warp speeds', () => {
      const distance = FTLConstants.lightYear * 10; // 10 light years
      const times = ftlTheory.calculateTravelTimes(distance);
      
      // Warp 1 = 1 ly/day, so 10 ly should take 10 days
      expect(times.warp1).toBeCloseTo(10 * 86400, 0);
      
      // Warp 10 = 10 ly/day, so 10 ly should take 1 day
      expect(times.warp10).toBeCloseTo(86400, 0);
    });
  });

  describe('FTLTheory - Analysis', () => {
    it('should analyze all mechanisms', () => {
      const distance = 1e15; // 1 light-year-ish
      const analyses = ftlTheory.analyzeAllMechanisms(distance);
      
      expect(analyses.length).toBe(Object.values(FTLMechanism).length);
    });

    it('should get FTL channel', () => {
      expect(ftlTheory.getFTLChannel()).toBeInstanceOf(FTLChannel);
    });

    it('should get tachyon field', () => {
      expect(ftlTheory.getTachyonField()).toBeInstanceOf(TachyonField);
    });

    it('should get CTC model', () => {
      expect(ftlTheory.getCTC()).toBeInstanceOf(ClosedTimelikeCurve);
    });
  });

  describe('FTLTheory - Statistics', () => {
    it('should provide statistics', () => {
      ftlTheory.getFTLChannel().analyze(FTLMechanism.TACHYON_FIELD, 1e9);
      ftlTheory.getTachyonField().createTachyon(1e-30, 1e-20);
      ftlTheory.getCTC().createRotatingCTC(1e6, 1000);
      ftlTheory.analyzeNoSignaling(FTLMechanism.WORMHOLE);
      
      const stats = ftlTheory.getStatistics();
      
      expect(stats.totalChannelAnalyses).toBe(1);
      expect(stats.totalTachyons).toBe(1);
      expect(stats.totalCTCs).toBe(1);
      expect(stats.totalNoSignalingAnalyses).toBe(1);
    });

    it('should count plausible mechanisms', () => {
      ftlTheory.getFTLChannel().analyze(FTLMechanism.QUANTUM_ENTANGLEMENT, 1e9);
      ftlTheory.getFTLChannel().analyze(FTLMechanism.TACHYON_FIELD, 1e9);
      
      const stats = ftlTheory.getStatistics();
      
      // Only entanglement is "plausible" (but can't transmit info)
      expect(stats.plausibleMechanisms).toBe(1);
    });
  });

  describe('FTLTheory - Export and Hash', () => {
    it('should export to JSON', () => {
      ftlTheory.getFTLChannel().analyze(FTLMechanism.WORMHOLE, 1e12);
      ftlTheory.analyzeNoSignaling(FTLMechanism.WORMHOLE);
      
      const json = ftlTheory.exportToJson();
      const parsed = JSON.parse(json);
      
      expect(parsed.channelAnalyses).toBeDefined();
      expect(parsed.noSignalingAnalyses).toBeDefined();
      expect(parsed.statistics).toBeDefined();
      expect(parsed.disclaimer).toBeDefined();
    });

    it('should generate proof chain hash', () => {
      ftlTheory.getFTLChannel().analyze(FTLMechanism.TACHYON_FIELD, 1e9);
      
      const hash = ftlTheory.getProofChainHash();
      expect(hash).toHaveLength(64);
    });

    it('should clear all data', () => {
      ftlTheory.getFTLChannel().analyze(FTLMechanism.WORMHOLE, 1e12);
      ftlTheory.getTachyonField().createTachyon(1e-30, 1e-20);
      ftlTheory.getCTC().createRotatingCTC(1e6, 1000);
      ftlTheory.analyzeNoSignaling(FTLMechanism.TACHYON_FIELD);
      
      ftlTheory.clear();
      
      const stats = ftlTheory.getStatistics();
      expect(stats.totalChannelAnalyses).toBe(0);
      expect(stats.totalTachyons).toBe(0);
      expect(stats.totalCTCs).toBe(0);
      expect(stats.totalNoSignalingAnalyses).toBe(0);
    });
  });

  describe('FTLTheoryFactory', () => {
    it('should create instance without logger', () => {
      const instance = FTLTheoryFactory.create();
      expect(instance).toBeInstanceOf(FTLTheory);
    });

    it('should create instance with logger', () => {
      const instance = FTLTheoryFactory.create(logger);
      expect(instance).toBeInstanceOf(FTLTheory);
    });
  });

  describe('Physical Consistency', () => {
    it('should correctly identify quantum entanglement as non-FTL', () => {
      const analysis = ftlTheory.analyzeNoSignaling(FTLMechanism.QUANTUM_ENTANGLEMENT);
      
      expect(analysis.violatesNoSignaling).toBe(false);
    });

    it('should require energy for non-entanglement FTL', () => {
      const wormhole = ftlTheory.getFTLChannel().analyze(FTLMechanism.WORMHOLE, 1e12);
      const entanglement = ftlTheory.getFTLChannel().analyze(FTLMechanism.QUANTUM_ENTANGLEMENT, 1e12);
      
      expect(wormhole.energyRequired).toBeGreaterThan(0);
      expect(entanglement.energyRequired).toBe(0);
    });

    it('should mark all non-entanglement mechanisms as implausible', () => {
      for (const mechanism of Object.values(FTLMechanism)) {
        const analysis = ftlTheory.getFTLChannel().analyze(mechanism, 1e12);
        
        if (mechanism === FTLMechanism.QUANTUM_ENTANGLEMENT) {
          expect(analysis.isPhysicallyPlausible).toBe(true);
        } else {
          expect(analysis.isPhysicallyPlausible).toBe(false);
        }
      }
    });
  });
});
