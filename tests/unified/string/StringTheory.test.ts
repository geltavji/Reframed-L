/**
 * StringTheory.test.ts - Tests for Phase 5.4 String Theory Elements
 * 
 * Tests for:
 * - StringConstants
 * - StringWorldsheet
 * - StringMode
 * - StringState
 * - StringSpectrum
 * - PolyakovAction
 * - TDuality
 * - Compactification
 * - WorldsheetCFT
 * - StringTheoryFactory
 */

import {
  StringConstants,
  StringWorldsheet,
  StringMode,
  StringState,
  StringSpectrum,
  PolyakovAction,
  TDuality,
  Compactification,
  WorldsheetCFT,
  StringTheoryFactory
} from '../../../src/unified/string/StringTheory';

describe('StringTheory Module', () => {
  
  // ==================== StringConstants Tests ====================
  describe('StringConstants', () => {
    
    test('should have positive string length', () => {
      expect(StringConstants.STRING_LENGTH).toBeGreaterThan(0);
    });
    
    test('should have positive Regge slope', () => {
      expect(StringConstants.REGGE_SLOPE).toBeGreaterThan(0);
    });
    
    test('should have Regge slope = string length squared', () => {
      expect(StringConstants.REGGE_SLOPE).toBeCloseTo(
        StringConstants.STRING_LENGTH ** 2,
        30
      );
    });
    
    test('should have positive string tension', () => {
      expect(StringConstants.STRING_TENSION).toBeGreaterThan(0);
    });
    
    test('should have string tension = 1/(2π α\')', () => {
      const expected = 1 / (2 * Math.PI * StringConstants.REGGE_SLOPE);
      expect(StringConstants.STRING_TENSION).toBeCloseTo(expected, 20);
    });
    
    test('should have bosonic critical dimension = 26', () => {
      expect(StringConstants.BOSONIC_CRITICAL_DIM).toBe(26);
    });
    
    test('should have superstring critical dimension = 10', () => {
      expect(StringConstants.SUPERSTRING_CRITICAL_DIM).toBe(10);
    });
    
    test('should have positive Planck mass', () => {
      expect(StringConstants.PLANCK_MASS).toBeGreaterThan(0);
    });
    
    test('should generate valid hash', () => {
      const hash = StringConstants.getHash();
      expect(hash).toHaveLength(16);
      expect(hash).toMatch(/^[a-f0-9]+$/);
    });
  });
  
  // ==================== StringWorldsheet Tests ====================
  describe('StringWorldsheet', () => {
    
    test('should create closed string worldsheet', () => {
      const ws = new StringWorldsheet('closed', 26);
      expect(ws.getStringType()).toBe('closed');
      expect(ws.getTargetDimension()).toBe(26);
    });
    
    test('should create open string worldsheet', () => {
      const ws = new StringWorldsheet('open', 26);
      expect(ws.getStringType()).toBe('open');
    });
    
    test('should have correct sigma range for closed string', () => {
      const ws = new StringWorldsheet('closed');
      const [min, max] = ws.getSigmaRange();
      expect(min).toBe(0);
      expect(max).toBeCloseTo(2 * Math.PI, 10);
    });
    
    test('should have correct sigma range for open string', () => {
      const ws = new StringWorldsheet('open');
      const [min, max] = ws.getSigmaRange();
      expect(min).toBe(0);
      expect(max).toBeCloseTo(Math.PI, 10);
    });
    
    test('should set and get embedding', () => {
      const ws = new StringWorldsheet('closed', 4);
      const coords = [0, 1, 2, 3];
      ws.setEmbedding(0, 0, coords);
      const result = ws.getEmbedding(0, 0);
      expect(result).toEqual(coords);
    });
    
    test('should reject embedding with wrong dimension', () => {
      const ws = new StringWorldsheet('closed', 4);
      expect(() => ws.setEmbedding(0, 0, [1, 2, 3])).toThrow();
    });
    
    test('should return undefined for missing embedding', () => {
      const ws = new StringWorldsheet('closed');
      expect(ws.getEmbedding(999, 999)).toBeUndefined();
    });
    
    test('should calculate induced metric', () => {
      const ws = new StringWorldsheet('closed', 4);
      const metric = ws.inducedMetric(0, 0);
      expect(metric).toHaveLength(2);
      expect(metric[0]).toHaveLength(2);
    });
    
    test('should calculate Nambu-Goto action', () => {
      const ws = new StringWorldsheet('closed', 4);
      // Set up a simple embedding
      for (let i = 0; i <= 10; i++) {
        for (let j = 0; j <= 10; j++) {
          const tau = i * 0.1;
          const sigma = j * 0.1 * 2 * Math.PI;
          ws.setEmbedding(tau, sigma, [tau, Math.cos(sigma), Math.sin(sigma), 0]);
        }
      }
      const action = ws.nambuGotoAction([0, 1], 10);
      expect(typeof action).toBe('number');
    });
    
    test('should generate valid hash', () => {
      const ws = new StringWorldsheet('closed');
      const hash = ws.getHash();
      expect(hash).toHaveLength(16);
    });
  });
  
  // ==================== StringMode Tests ====================
  describe('StringMode', () => {
    
    test('should create string mode for closed string', () => {
      const mode = new StringMode('closed', 26);
      expect(mode.getModes()).toHaveLength(0);
    });
    
    test('should create string mode for open string', () => {
      const mode = new StringMode('open', 26);
      expect(mode.getModes()).toHaveLength(0);
    });
    
    test('should add vibrational mode', () => {
      const mode = new StringMode('closed', 26);
      mode.addMode(1, 1, 1.0, false);
      expect(mode.getModes()).toHaveLength(1);
    });
    
    test('should reject left-moving mode for open string', () => {
      const mode = new StringMode('open', 26);
      expect(() => mode.addMode(1, 1, 1.0, true)).toThrow();
    });
    
    test('should reject invalid spacetime index', () => {
      const mode = new StringMode('closed', 26);
      expect(() => mode.addMode(1, 26, 1.0)).toThrow();
      expect(() => mode.addMode(1, -1, 1.0)).toThrow();
    });
    
    test('should get modes by spacetime index', () => {
      const mode = new StringMode('closed', 26);
      mode.addMode(1, 1, 1.0);
      mode.addMode(2, 2, 1.0);
      mode.addMode(3, 1, 1.0);
      
      const modesAtMu1 = mode.getModesByIndex(1);
      expect(modesAtMu1).toHaveLength(2);
    });
    
    test('should calculate level number for right-movers', () => {
      const mode = new StringMode('closed', 26);
      mode.addMode(1, 1, 1.0, false);
      mode.addMode(2, 2, 1.0, false);
      
      expect(mode.levelNumber(true)).toBe(3);
    });
    
    test('should calculate level number for left-movers', () => {
      const mode = new StringMode('closed', 26);
      mode.addMode(1, 1, 1.0, true);
      mode.addMode(1, 2, 1.0, true);
      
      expect(mode.levelNumber(false)).toBe(2);
    });
    
    test('should check level matching for balanced modes', () => {
      const mode = new StringMode('closed', 26);
      mode.addMode(1, 1, 1.0, false);
      mode.addMode(1, 1, 1.0, true);
      
      expect(mode.isLevelMatched()).toBe(true);
    });
    
    test('should detect level mismatch', () => {
      const mode = new StringMode('closed', 26);
      mode.addMode(1, 1, 1.0, false);
      mode.addMode(2, 1, 1.0, true);
      
      expect(mode.isLevelMatched()).toBe(false);
    });
    
    test('open string should always be level matched', () => {
      const mode = new StringMode('open', 26);
      mode.addMode(1, 1, 1.0);
      expect(mode.isLevelMatched()).toBe(true);
    });
    
    test('should clear all modes', () => {
      const mode = new StringMode('closed', 26);
      mode.addMode(1, 1, 1.0);
      mode.clear();
      expect(mode.getModes()).toHaveLength(0);
    });
    
    test('should generate valid hash', () => {
      const mode = new StringMode('closed');
      const hash = mode.getHash();
      expect(hash).toHaveLength(16);
    });
  });
  
  // ==================== StringState Tests ====================
  describe('StringState', () => {
    
    test('should create string state', () => {
      const state = new StringState('closed', 26);
      expect(state.getMomentum()).toHaveLength(26);
    });
    
    test('should set and get momentum', () => {
      const state = new StringState('closed', 4);
      const momentum = [1, 2, 3, 4];
      state.setMomentum(momentum);
      expect(state.getMomentum()).toEqual(momentum);
    });
    
    test('should reject momentum with wrong dimension', () => {
      const state = new StringState('closed', 4);
      expect(() => state.setMomentum([1, 2, 3])).toThrow();
    });
    
    test('should add excitation', () => {
      const state = new StringState('closed', 26);
      state.addExcitation(1, 1, 1.0);
      expect(state.getModes().getModes()).toHaveLength(1);
    });
    
    test('should calculate mass squared for tachyon (ground state)', () => {
      const state = new StringState('closed', 26);
      // No excitations: N = Ñ = 0
      const m2 = state.massSquared();
      // M² = (2/α')(0 + 0 - 2) = -4/α' < 0
      expect(m2).toBeLessThan(0);
    });
    
    test('should calculate mass squared for massless graviton', () => {
      const state = new StringState('closed', 26);
      state.addExcitation(1, 1, 1.0, false);
      state.addExcitation(1, 2, 1.0, true);
      // N = Ñ = 1: M² = (2/α')(1 + 1 - 2) = 0
      expect(Math.abs(state.massSquared())).toBeLessThan(1e-20);
    });
    
    test('should calculate mass squared for open string tachyon', () => {
      const state = new StringState('open', 26);
      // N = 0: M² = (1/α')(0 - 1) = -1/α' < 0
      expect(state.massSquared()).toBeLessThan(0);
    });
    
    test('should calculate mass squared for open string photon', () => {
      const state = new StringState('open', 26);
      state.addExcitation(1, 1, 1.0);
      // N = 1: M² = (1/α')(1 - 1) = 0
      expect(Math.abs(state.massSquared())).toBeLessThan(1e-20);
    });
    
    test('should detect tachyonic state', () => {
      const state = new StringState('closed', 26);
      expect(state.isTachyonic()).toBe(true);
    });
    
    test('should detect massless state', () => {
      const state = new StringState('closed', 26);
      state.addExcitation(1, 1, 1.0, false);
      state.addExcitation(1, 1, 1.0, true);
      expect(state.isMassless()).toBe(true);
    });
    
    test('should check physical state (level matched)', () => {
      const state = new StringState('closed', 26);
      state.addExcitation(1, 1, 1.0, false);
      state.addExcitation(1, 1, 1.0, true);
      expect(state.isPhysical()).toBe(true);
    });
    
    test('should detect unphysical state (level mismatch)', () => {
      const state = new StringState('closed', 26);
      state.addExcitation(1, 1, 1.0, false);
      state.addExcitation(2, 1, 1.0, true);
      expect(state.isPhysical()).toBe(false);
    });
    
    test('should calculate mass (possibly imaginary)', () => {
      const state = new StringState('closed', 26);
      const mass = state.mass();
      expect(typeof mass).toBe('number');
    });
    
    test('should get spin for graviton', () => {
      const state = new StringState('closed', 26);
      state.addExcitation(1, 1, 1.0, false);
      state.addExcitation(1, 2, 1.0, true);
      expect(state.getSpin()).toBe(2);
    });
    
    test('should get spin for photon', () => {
      const state = new StringState('open', 26);
      state.addExcitation(1, 1, 1.0);
      expect(state.getSpin()).toBe(1);
    });
    
    test('should generate valid hash', () => {
      const state = new StringState('closed');
      const hash = state.getHash();
      expect(hash).toHaveLength(16);
    });
  });
  
  // ==================== StringSpectrum Tests ====================
  describe('StringSpectrum', () => {
    
    test('should create spectrum', () => {
      const spectrum = new StringSpectrum('closed', 26);
      expect(spectrum.getAllStates().size).toBe(0);
    });
    
    test('should create tachyon', () => {
      const spectrum = new StringSpectrum('closed', 26);
      const tachyon = spectrum.createTachyon();
      expect(tachyon.isTachyonic()).toBe(true);
    });
    
    test('should create photon for open string', () => {
      const spectrum = new StringSpectrum('open', 26);
      const photon = spectrum.createPhoton(1);
      expect(photon.isMassless()).toBe(true);
    });
    
    test('should reject photon for closed string', () => {
      const spectrum = new StringSpectrum('closed', 26);
      expect(() => spectrum.createPhoton()).toThrow();
    });
    
    test('should create graviton for closed string', () => {
      const spectrum = new StringSpectrum('closed', 26);
      const graviton = spectrum.createGraviton(1, 2);
      expect(graviton.isMassless()).toBe(true);
      expect(graviton.isPhysical()).toBe(true);
    });
    
    test('should reject graviton for open string', () => {
      const spectrum = new StringSpectrum('open', 26);
      expect(() => spectrum.createGraviton()).toThrow();
    });
    
    test('should create dilaton', () => {
      const spectrum = new StringSpectrum('closed', 26);
      const dilaton = spectrum.createDilaton();
      expect(dilaton.isMassless()).toBe(true);
    });
    
    test('should create Kalb-Ramond field', () => {
      const spectrum = new StringSpectrum('closed', 26);
      const bField = spectrum.createKalbRamond(1, 2);
      expect(bField.isMassless()).toBe(true);
    });
    
    test('should reject Kalb-Ramond with equal indices', () => {
      const spectrum = new StringSpectrum('closed', 26);
      expect(() => spectrum.createKalbRamond(1, 1)).toThrow();
    });
    
    test('should get state by name', () => {
      const spectrum = new StringSpectrum('closed', 26);
      spectrum.createTachyon();
      expect(spectrum.getState('tachyon')).toBeDefined();
    });
    
    test('should generate states at level', () => {
      const spectrum = new StringSpectrum('closed', 26);
      const states = spectrum.generateLevel(1);
      expect(states.length).toBeGreaterThan(0);
    });
    
    test('should count states at level 0', () => {
      const spectrum = new StringSpectrum('closed', 26);
      expect(spectrum.countStatesAtLevel(0)).toBe(1);
    });
    
    test('should count states at level 1', () => {
      const spectrum = new StringSpectrum('closed', 26);
      const count = spectrum.countStatesAtLevel(1);
      // (D-2)² for closed string
      expect(count).toBe(24 * 24);
    });
    
    test('should count states at level 1 for open string', () => {
      const spectrum = new StringSpectrum('open', 26);
      const count = spectrum.countStatesAtLevel(1);
      // D-2 transverse polarizations
      expect(count).toBe(24);
    });
    
    test('should generate valid hash', () => {
      const spectrum = new StringSpectrum('closed');
      const hash = spectrum.getHash();
      expect(hash).toHaveLength(16);
    });
  });
  
  // ==================== PolyakovAction Tests ====================
  describe('PolyakovAction', () => {
    
    test('should create Polyakov action', () => {
      const action = new PolyakovAction();
      expect(action).toBeDefined();
    });
    
    test('should return equations of motion string', () => {
      const action = new PolyakovAction();
      const eom = action.equationsOfMotion();
      expect(eom).toContain('∂_α');
    });
    
    test('should create conformal gauge metric', () => {
      const action = new PolyakovAction();
      const metric = action.conformalGaugeMetric(0);
      expect(metric[0][0]).toBe(-1);
      expect(metric[1][1]).toBe(1);
      expect(metric[0][1]).toBe(0);
    });
    
    test('should create conformal gauge metric with non-zero phi', () => {
      const action = new PolyakovAction();
      const phi = 1.0;
      const metric = action.conformalGaugeMetric(phi);
      const factor = Math.exp(phi);
      expect(metric[0][0]).toBeCloseTo(-factor, 10);
      expect(metric[1][1]).toBeCloseTo(factor, 10);
    });
    
    test('should calculate action for simple embedding', () => {
      const action = new PolyakovAction(1, 4);
      const metric = [[-1, 0], [0, 1]];
      const embedding = (tau: number, sigma: number) => [tau, sigma, 0, 0];
      
      const S = action.calculate(metric, embedding, [0, 1], [0, 1], 10);
      expect(typeof S).toBe('number');
    });
    
    test('should generate valid hash', () => {
      const action = new PolyakovAction();
      const hash = action.getHash();
      expect(hash).toHaveLength(16);
    });
  });
  
  // ==================== TDuality Tests ====================
  describe('TDuality', () => {
    
    test('should create T-duality transformer', () => {
      const td = new TDuality();
      expect(td).toBeDefined();
    });
    
    test('should calculate dual radius', () => {
      const td = new TDuality();
      const R = 1e-30;
      const R_dual = td.dualRadius(R);
      expect(R_dual).toBe(StringConstants.REGGE_SLOPE / R);
    });
    
    test('should satisfy R * R\' = α\'', () => {
      const td = new TDuality();
      const R = 1e-30;
      const R_dual = td.dualRadius(R);
      expect(R * R_dual).toBeCloseTo(StringConstants.REGGE_SLOPE, 20);
    });
    
    test('should calculate self-dual radius', () => {
      const td = new TDuality();
      const R_sd = td.selfDualRadius();
      expect(R_sd).toBeCloseTo(Math.sqrt(StringConstants.REGGE_SLOPE), 20);
    });
    
    test('should check self-dual point', () => {
      const td = new TDuality();
      const R_sd = td.selfDualRadius();
      expect(td.isSelfDual(R_sd)).toBe(true);
      // Use a significantly different radius to avoid precision issues
      expect(td.isSelfDual(R_sd * 2, 1e-35)).toBe(false);
    });
    
    test('should calculate mass squared for compactified string', () => {
      const td = new TDuality();
      const R = 1e-30;
      const m2 = td.massSquaredCompact(1, 0, 1, 1, R);
      expect(m2).toBeGreaterThan(0);
    });
    
    test('should exchange quantum numbers under T-duality', () => {
      const td = new TDuality();
      const { momentum, winding } = td.dualQuantumNumbers(2, 3);
      expect(momentum).toBe(3);
      expect(winding).toBe(2);
    });
    
    test('should give same mass for T-dual configurations', () => {
      const td = new TDuality();
      const R = 1e-30;
      const R_dual = td.dualRadius(R);
      
      const m2_original = td.massSquaredCompact(2, 3, 0, 0, R);
      const m2_dual = td.massSquaredCompact(3, 2, 0, 0, R_dual);
      
      expect(m2_original).toBeCloseTo(m2_dual, 10);
    });
    
    test('should generate valid hash', () => {
      const td = new TDuality();
      const hash = td.getHash();
      expect(hash).toHaveLength(16);
    });
  });
  
  // ==================== Compactification Tests ====================
  describe('Compactification', () => {
    
    test('should create compactification', () => {
      const comp = new Compactification(26, [1e-30]);
      expect(comp.getCompactDimensions()).toBe(1);
    });
    
    test('should calculate uncompactified dimensions', () => {
      const comp = new Compactification(26, [1e-30, 1e-30]);
      expect(comp.getUncompactifiedDimensions()).toBe(24);
    });
    
    test('should reject too many compact dimensions', () => {
      const radii = new Array(23).fill(1e-30);
      expect(() => new Compactification(26, radii)).toThrow();
    });
    
    test('should get compact radii', () => {
      const radii = [1e-30, 2e-30];
      const comp = new Compactification(26, radii);
      expect(comp.getRadii()).toEqual(radii);
    });
    
    test('should calculate compact volume', () => {
      const R = 1e-30;
      const comp = new Compactification(26, [R]);
      const volume = comp.compactVolume();
      expect(volume).toBeCloseTo(2 * Math.PI * R, 40);
    });
    
    test('should calculate volume for torus', () => {
      const R1 = 1e-30;
      const R2 = 2e-30;
      const comp = new Compactification(26, [R1, R2]);
      const volume = comp.compactVolume();
      expect(volume).toBeCloseTo(4 * Math.PI * Math.PI * R1 * R2, 60);
    });
    
    test('should return 1 for no compactification', () => {
      const comp = new Compactification(26, []);
      expect(comp.compactVolume()).toBe(1);
    });
    
    test('should calculate effective 4D Planck mass', () => {
      const comp = new Compactification(26, [1e-30]);
      const M_eff = comp.effective4DPlanckMass(1e19);
      expect(M_eff).toBeGreaterThan(0);
    });
    
    test('should get KK tower masses', () => {
      const R = 1e-30;
      const comp = new Compactification(26, [R]);
      const masses = comp.kkTowerMasses(0, 3);
      
      expect(masses).toHaveLength(4);
      expect(masses[0]).toBe(0);
      expect(masses[1]).toBeCloseTo(1 / R, 30);
      expect(masses[2]).toBeCloseTo(2 / R, 30);
    });
    
    test('should reject invalid dimension index for KK masses', () => {
      const comp = new Compactification(26, [1e-30]);
      expect(() => comp.kkTowerMasses(1)).toThrow();
    });
    
    test('should generate valid hash', () => {
      const comp = new Compactification(26, [1e-30]);
      const hash = comp.getHash();
      expect(hash).toHaveLength(16);
    });
  });
  
  // ==================== WorldsheetCFT Tests ====================
  describe('WorldsheetCFT', () => {
    
    test('should create CFT with correct central charge', () => {
      const cft = new WorldsheetCFT(26);
      expect(cft.getCentralCharge()).toBe(26);
    });
    
    test('should have critical central charge = 26', () => {
      const cft = new WorldsheetCFT(26);
      expect(cft.criticalCentralCharge()).toBe(26);
    });
    
    test('should be critical for D=26', () => {
      const cft = new WorldsheetCFT(26);
      expect(cft.isCritical()).toBe(true);
    });
    
    test('should not be critical for D≠26', () => {
      const cft = new WorldsheetCFT(10);
      expect(cft.isCritical()).toBe(false);
    });
    
    test('should calculate Virasoro commutator', () => {
      const cft = new WorldsheetCFT(26);
      const { coefficient, centralTerm } = cft.virasoroCommutator(2, 1);
      expect(coefficient).toBe(1); // 2 - 1
      expect(centralTerm).toBe(0); // m + n ≠ 0
    });
    
    test('should include central extension when m + n = 0', () => {
      const cft = new WorldsheetCFT(26);
      const { centralTerm } = cft.virasoroCommutator(2, -2);
      // c/12 * (m³ - m) = 26/12 * (8 - 2) = 26/12 * 6 = 13
      expect(centralTerm).toBeCloseTo(13, 10);
    });
    
    test('should calculate vertex operator dimension', () => {
      const cft = new WorldsheetCFT(26);
      const kSquared = 1;
      const dim = cft.vertexOperatorDimension(kSquared, StringConstants.REGGE_SLOPE);
      expect(dim).toBe(StringConstants.REGGE_SLOPE / 4);
    });
    
    test('should calculate X OPE coefficient', () => {
      const cft = new WorldsheetCFT(26);
      const coeff = cft.xOPECoefficient(StringConstants.REGGE_SLOPE);
      expect(coeff).toBe(-StringConstants.REGGE_SLOPE / 2);
    });
    
    test('should generate valid hash', () => {
      const cft = new WorldsheetCFT(26);
      const hash = cft.getHash();
      expect(hash).toHaveLength(16);
    });
  });
  
  // ==================== StringTheoryFactory Tests ====================
  describe('StringTheoryFactory', () => {
    
    test('should create bosonic string in 26D', () => {
      const { worldsheet, spectrum, action, cft } = StringTheoryFactory.bosonicString26D();
      
      expect(worldsheet.getStringType()).toBe('closed');
      expect(worldsheet.getTargetDimension()).toBe(26);
      expect(cft.isCritical()).toBe(true);
    });
    
    test('should create open bosonic string', () => {
      const { worldsheet, spectrum, action } = StringTheoryFactory.openBosonicString();
      
      expect(worldsheet.getStringType()).toBe('open');
      expect(worldsheet.getTargetDimension()).toBe(26);
    });
    
    test('should create compactified string', () => {
      const { compactification, tDuality, spectrum } = 
        StringTheoryFactory.compactifiedString([1e-30]);
      
      expect(compactification.getCompactDimensions()).toBe(1);
    });
    
    test('should create self-dual compactification', () => {
      const { compactification, tDuality } = StringTheoryFactory.selfDualCompactification();
      
      const R = compactification.getRadii()[0];
      expect(tDuality.isSelfDual(R)).toBe(true);
    });
    
    test('should generate valid hash', () => {
      const hash = StringTheoryFactory.getHash();
      expect(hash).toHaveLength(16);
    });
  });
  
  // ==================== Integration Tests ====================
  describe('Integration Tests', () => {
    
    test('should create full string theory setup', () => {
      const { worldsheet, spectrum, cft } = StringTheoryFactory.bosonicString26D();
      
      // Create tachyon
      const tachyon = spectrum.createTachyon();
      expect(tachyon.isTachyonic()).toBe(true);
      
      // Create graviton
      const graviton = spectrum.createGraviton();
      expect(graviton.isMassless()).toBe(true);
      expect(graviton.getSpin()).toBe(2);
      
      // Verify CFT is critical
      expect(cft.isCritical()).toBe(true);
    });
    
    test('should verify T-duality invariance', () => {
      const { tDuality } = StringTheoryFactory.compactifiedString([1e-30]);
      
      // Mass should be invariant under T-duality
      const R = 1e-30;
      const R_dual = tDuality.dualRadius(R);
      
      // (n, w) at R should have same mass as (w, n) at R'
      const m2_1 = tDuality.massSquaredCompact(1, 2, 1, 1, R);
      const m2_2 = tDuality.massSquaredCompact(2, 1, 1, 1, R_dual);
      
      expect(m2_1).toBeCloseTo(m2_2, 10);
    });
    
    test('should verify level matching for physical states', () => {
      const state = new StringState('closed', 26);
      
      // Add balanced excitations
      state.addExcitation(1, 1, 1.0, false);
      state.addExcitation(1, 2, 1.0, true);
      
      expect(state.isPhysical()).toBe(true);
      expect(state.isMassless()).toBe(true);
    });
    
    test('should calculate spectrum degeneracy', () => {
      const spectrum = new StringSpectrum('closed', 26);
      
      const level0 = spectrum.countStatesAtLevel(0);
      const level1 = spectrum.countStatesAtLevel(1);
      const level2 = spectrum.countStatesAtLevel(2);
      
      // Degeneracy should grow
      expect(level0).toBe(1);
      expect(level1).toBeGreaterThan(level0);
      expect(level2).toBeGreaterThan(level1);
    });
    
    test('should verify massless states are physical', () => {
      const spectrum = new StringSpectrum('closed', 26);
      
      const graviton = spectrum.createGraviton();
      const dilaton = spectrum.createDilaton();
      const bField = spectrum.createKalbRamond();
      
      expect(graviton.isMassless()).toBe(true);
      expect(dilaton.isMassless()).toBe(true);
      expect(bField.isMassless()).toBe(true);
      
      expect(graviton.isPhysical()).toBe(true);
      expect(dilaton.isPhysical()).toBe(true);
      expect(bField.isPhysical()).toBe(true);
    });
  });
});
