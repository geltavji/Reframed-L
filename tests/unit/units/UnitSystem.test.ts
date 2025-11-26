/**
 * Qlaws Ham - UnitSystem Module Tests (M01.08)
 * 
 * Phase 1.5: Unit System & Dimensional Analysis
 * Target: 70+ tests
 */

import {
  DimensionClass,
  Unit,
  UnitSystem,
  DimensionalAnalysis,
  UnitConverter,
  SI_PREFIXES,
  Dimension
} from '../../../src/core/units/UnitSystem';
import { BigNumber } from '../../../src/core/math/BigNumber';

describe('UnitSystem Module (M01.08)', () => {
  
  // =========================================================================
  // DIMENSION CLASS TESTS
  // =========================================================================
  
  describe('DimensionClass', () => {
    
    describe('Constructor', () => {
      test('should create dimensionless by default', () => {
        const dim = new DimensionClass();
        expect(dim.length).toBe(0);
        expect(dim.mass).toBe(0);
        expect(dim.time).toBe(0);
        expect(dim.isDimensionless()).toBe(true);
      });

      test('should create with partial dimensions', () => {
        const dim = new DimensionClass({ length: 1, time: -2 });
        expect(dim.length).toBe(1);
        expect(dim.time).toBe(-2);
        expect(dim.mass).toBe(0);
      });

      test('should create with all dimensions', () => {
        const dim = new DimensionClass({
          length: 1, mass: 2, time: -1, current: 1, 
          temperature: 0, amount: -1, luminosity: 1
        });
        expect(dim.length).toBe(1);
        expect(dim.mass).toBe(2);
        expect(dim.luminosity).toBe(1);
      });
    });

    describe('Operations', () => {
      test('multiply should add exponents', () => {
        const a = new DimensionClass({ length: 1, time: -1 }); // velocity
        const b = new DimensionClass({ time: 1 }); // time
        const result = a.multiply(b);
        expect(result.length).toBe(1);
        expect(result.time).toBe(0);
      });

      test('divide should subtract exponents', () => {
        const a = new DimensionClass({ length: 1 }); // length
        const b = new DimensionClass({ time: 1 }); // time
        const result = a.divide(b);
        expect(result.length).toBe(1);
        expect(result.time).toBe(-1);
      });

      test('pow should multiply exponents', () => {
        const dim = new DimensionClass({ length: 1 });
        const result = dim.pow(3);
        expect(result.length).toBe(3);
      });

      test('pow with fractional exponent', () => {
        const dim = new DimensionClass({ length: 2 });
        const result = dim.pow(0.5);
        expect(result.length).toBe(1);
      });
    });

    describe('Comparison', () => {
      test('equals should work correctly', () => {
        const a = new DimensionClass({ length: 1, time: -2 });
        const b = new DimensionClass({ length: 1, time: -2 });
        const c = new DimensionClass({ length: 1, time: -1 });
        
        expect(a.equals(b)).toBe(true);
        expect(a.equals(c)).toBe(false);
      });

      test('isDimensionless should work', () => {
        const dimless = new DimensionClass();
        const notDimless = new DimensionClass({ length: 1 });
        
        expect(dimless.isDimensionless()).toBe(true);
        expect(notDimless.isDimensionless()).toBe(false);
      });
    });

    describe('Factory Methods', () => {
      test('dimensionless should return zero dimension', () => {
        const dim = DimensionClass.dimensionless();
        expect(dim.isDimensionless()).toBe(true);
      });

      test('length should return L^1', () => {
        const dim = DimensionClass.forLength();
        expect(dim.length).toBe(1);
        expect(dim.mass).toBe(0);
      });

      test('velocity should return L^1 T^-1', () => {
        const dim = DimensionClass.velocity();
        expect(dim.length).toBe(1);
        expect(dim.time).toBe(-1);
      });

      test('force should return M^1 L^1 T^-2', () => {
        const dim = DimensionClass.force();
        expect(dim.mass).toBe(1);
        expect(dim.length).toBe(1);
        expect(dim.time).toBe(-2);
      });

      test('energy should return M^1 L^2 T^-2', () => {
        const dim = DimensionClass.energy();
        expect(dim.mass).toBe(1);
        expect(dim.length).toBe(2);
        expect(dim.time).toBe(-2);
      });

      test('action should return M^1 L^2 T^-1', () => {
        const dim = DimensionClass.action();
        expect(dim.mass).toBe(1);
        expect(dim.length).toBe(2);
        expect(dim.time).toBe(-1);
      });
    });

    describe('String Representation', () => {
      test('toString for velocity', () => {
        const dim = DimensionClass.velocity();
        expect(dim.toString()).toContain('L^1');
        expect(dim.toString()).toContain('T^-1');
      });

      test('toString for dimensionless', () => {
        const dim = DimensionClass.dimensionless();
        expect(dim.toString()).toBe('1 (dimensionless)');
      });
    });

    describe('Hash', () => {
      test('hash should be consistent', () => {
        const a = new DimensionClass({ length: 1 });
        const b = new DimensionClass({ length: 1 });
        expect(a.hash()).toBe(b.hash());
      });

      test('hash should differ for different dimensions', () => {
        const a = new DimensionClass({ length: 1 });
        const b = new DimensionClass({ mass: 1 });
        expect(a.hash()).not.toBe(b.hash());
      });
    });
  });

  // =========================================================================
  // UNIT SYSTEM TESTS
  // =========================================================================

  describe('UnitSystem', () => {
    let unitSystem: UnitSystem;

    beforeEach(() => {
      unitSystem = new UnitSystem();
    });

    describe('Base Units', () => {
      test('should have meter', () => {
        const meter = unitSystem.getUnit('m');
        expect(meter).toBeDefined();
        expect(meter!.name).toBe('meter');
        expect(meter!.isBaseUnit).toBe(true);
      });

      test('should have kilogram', () => {
        const kg = unitSystem.getUnit('kg');
        expect(kg).toBeDefined();
        expect(kg!.name).toBe('kilogram');
        expect(kg!.isBaseUnit).toBe(true);
      });

      test('should have second', () => {
        const s = unitSystem.getUnit('s');
        expect(s).toBeDefined();
        expect(s!.name).toBe('second');
      });

      test('should have all 7 SI base units', () => {
        expect(unitSystem.hasUnit('m')).toBe(true);
        expect(unitSystem.hasUnit('kg')).toBe(true);
        expect(unitSystem.hasUnit('s')).toBe(true);
        expect(unitSystem.hasUnit('A')).toBe(true);
        expect(unitSystem.hasUnit('K')).toBe(true);
        expect(unitSystem.hasUnit('mol')).toBe(true);
        expect(unitSystem.hasUnit('cd')).toBe(true);
      });
    });

    describe('Derived Units', () => {
      test('should have newton', () => {
        const N = unitSystem.getUnit('N');
        expect(N).toBeDefined();
        expect(N!.name).toBe('newton');
        expect(N!.category).toBe('derived');
      });

      test('should have joule', () => {
        const J = unitSystem.getUnit('J');
        expect(J).toBeDefined();
        expect(J!.dimension.mass).toBe(1);
        expect(J!.dimension.length).toBe(2);
        expect(J!.dimension.time).toBe(-2);
      });

      test('should have watt', () => {
        const W = unitSystem.getUnit('W');
        expect(W).toBeDefined();
        expect(W!.dimension.time).toBe(-3);
      });

      test('should have hertz', () => {
        const Hz = unitSystem.getUnit('Hz');
        expect(Hz).toBeDefined();
        expect(Hz!.dimension.time).toBe(-1);
      });
    });

    describe('Planck Units', () => {
      test('should have Planck length', () => {
        const lP = unitSystem.getUnit('l_P');
        expect(lP).toBeDefined();
        expect(lP!.category).toBe('planck');
      });

      test('should have Planck time', () => {
        const tP = unitSystem.getUnit('t_P');
        expect(tP).toBeDefined();
        expect(tP!.conversionFactor.toNumber()).toBeLessThan(1e-40);
      });

      test('should have Planck mass', () => {
        const mP = unitSystem.getUnit('m_P');
        expect(mP).toBeDefined();
        expect(mP!.conversionFactor.toNumber()).toBeCloseTo(2.176434e-8, 10);
      });
    });

    describe('Unit Conversion', () => {
      test('should convert km to m', () => {
        const result = unitSystem.convert(1, 'km', 'm');
        expect(result.valid).toBe(true);
        expect(result.value.toNumber()).toBe(1000);
      });

      test('should convert m to cm', () => {
        const result = unitSystem.convert(1, 'm', 'cm');
        expect(result.valid).toBe(true);
        expect(result.value.toNumber()).toBe(100);
      });

      test('should convert hours to seconds', () => {
        const result = unitSystem.convert(1, 'h', 's');
        expect(result.valid).toBe(true);
        expect(result.value.toNumber()).toBe(3600);
      });

      test('should convert kg to g', () => {
        const result = unitSystem.convert(1, 'kg', 'g');
        expect(result.valid).toBe(true);
        expect(result.value.toNumber()).toBe(1000);
      });

      test('should fail for incompatible units', () => {
        const result = unitSystem.convert(1, 'm', 'kg');
        expect(result.valid).toBe(false);
      });

      test('should convert eV to J', () => {
        const result = unitSystem.convert(1, 'eV', 'J');
        expect(result.valid).toBe(true);
        expect(result.value.toNumber()).toBeCloseTo(1.602176634e-19, 25);
      });

      test('should have hash for conversions', () => {
        const result = unitSystem.convert(1, 'km', 'm');
        expect(result.hash).toBeDefined();
        expect(result.hash.length).toBe(64);
      });
    });

    describe('Create Quantity', () => {
      test('should create quantity with number', () => {
        const q = unitSystem.createQuantity(5, 'm');
        expect(q.value.toNumber()).toBe(5);
        expect(q.unit.symbol).toBe('m');
        expect(q.hash).toBeDefined();
      });

      test('should create quantity with BigNumber', () => {
        const q = unitSystem.createQuantity(new BigNumber('1.5'), 'kg');
        expect(q.value.toString()).toBe('1.5');
        expect(q.unit.symbol).toBe('kg');
      });

      test('should throw for unknown unit', () => {
        expect(() => unitSystem.createQuantity(1, 'unknown')).toThrow();
      });
    });

    describe('Register Custom Unit', () => {
      test('should register custom unit', () => {
        const unit = unitSystem.registerUnit({
          name: 'custom_length',
          symbol: 'cl',
          dimension: { length: 1, mass: 0, time: 0, current: 0, temperature: 0, amount: 0, luminosity: 0 },
          conversionFactor: new BigNumber('2.5'),
          offset: BigNumber.zero(),
          isBaseUnit: false,
          category: 'custom'
        });
        
        expect(unit.symbol).toBe('cl');
        expect(unitSystem.hasUnit('cl')).toBe(true);
      });
    });

    describe('Apply Prefix', () => {
      test('should apply kilo prefix', () => {
        const kHz = unitSystem.applyPrefix('kilo', 'Hz');
        expect(kHz.symbol).toBe('kHz');
        expect(kHz.conversionFactor.toNumber()).toBe(1000);
      });

      test('should apply nano prefix', () => {
        const nm = unitSystem.applyPrefix('nano', 'm');
        expect(nm.symbol).toBe('nm');
        expect(nm.conversionFactor.toNumber()).toBe(1e-9);
      });

      test('should throw for unknown prefix', () => {
        expect(() => unitSystem.applyPrefix('unknown', 'm')).toThrow();
      });
    });

    describe('Get Units by Category', () => {
      test('should get base units', () => {
        const baseUnits = unitSystem.getUnitsByCategory('base');
        expect(baseUnits.length).toBe(7);
      });

      test('should get planck units', () => {
        const planckUnits = unitSystem.getUnitsByCategory('planck');
        expect(planckUnits.length).toBeGreaterThan(0);
      });
    });

    describe('Export', () => {
      test('should export to JSON', () => {
        const json = unitSystem.exportToJson() as any;
        expect(json.version).toBe('1.0.0');
        expect(json.unitCount).toBeGreaterThan(0);
        expect(json.hash).toBeDefined();
      });
    });
  });

  // =========================================================================
  // UNIT CLASS TESTS
  // =========================================================================

  describe('Unit', () => {
    let unitSystem: UnitSystem;

    beforeEach(() => {
      unitSystem = new UnitSystem();
    });

    describe('Compatibility', () => {
      test('isCompatibleWith should work for same dimension', () => {
        const m = unitSystem.getUnit('m')!;
        const km = unitSystem.getUnit('km')!;
        expect(m.isCompatibleWith(km)).toBe(true);
      });

      test('isCompatibleWith should return false for different dimensions', () => {
        const m = unitSystem.getUnit('m')!;
        const kg = unitSystem.getUnit('kg')!;
        expect(m.isCompatibleWith(kg)).toBe(false);
      });
    });

    describe('Unit Operations', () => {
      test('multiply should create derived unit', () => {
        const m = unitSystem.getUnit('m')!;
        const s = unitSystem.getUnit('s')!;
        const ms = m.multiply(s);
        
        expect(ms.dimension.length).toBe(1);
        expect(ms.dimension.time).toBe(1);
      });

      test('divide should create derived unit', () => {
        const m = unitSystem.getUnit('m')!;
        const s = unitSystem.getUnit('s')!;
        const velocity = m.divide(s);
        
        expect(velocity.dimension.length).toBe(1);
        expect(velocity.dimension.time).toBe(-1);
      });

      test('pow should work', () => {
        const m = unitSystem.getUnit('m')!;
        const m2 = m.pow(2);
        
        expect(m2.dimension.length).toBe(2);
      });

      test('inverse should work', () => {
        const s = unitSystem.getUnit('s')!;
        const freq = s.inverse();
        
        expect(freq.dimension.time).toBe(-1);
      });
    });

    describe('Conversion Factor', () => {
      test('getConversionFactorTo should work', () => {
        const km = unitSystem.getUnit('km')!;
        const m = unitSystem.getUnit('m')!;
        const factor = km.getConversionFactorTo(m);
        
        expect(factor.toNumber()).toBe(1000);
      });

      test('should throw for incompatible units', () => {
        const m = unitSystem.getUnit('m')!;
        const kg = unitSystem.getUnit('kg')!;
        
        expect(() => m.getConversionFactorTo(kg)).toThrow();
      });
    });
  });

  // =========================================================================
  // DIMENSIONAL ANALYSIS TESTS
  // =========================================================================

  describe('DimensionalAnalysis', () => {
    let da: DimensionalAnalysis;
    let unitSystem: UnitSystem;

    beforeEach(() => {
      da = new DimensionalAnalysis();
      unitSystem = new UnitSystem();
    });

    describe('canAdd', () => {
      test('should return true for same dimension', () => {
        const q1 = unitSystem.createQuantity(1, 'm');
        const q2 = unitSystem.createQuantity(2, 'km');
        expect(da.canAdd(q1, q2)).toBe(true);
      });

      test('should return false for different dimensions', () => {
        const q1 = unitSystem.createQuantity(1, 'm');
        const q2 = unitSystem.createQuantity(2, 'kg');
        expect(da.canAdd(q1, q2)).toBe(false);
      });
    });

    describe('checkConsistency', () => {
      test('should detect consistent dimensions', () => {
        const result = da.checkConsistency(
          { length: 1, mass: 0, time: 0, current: 0, temperature: 0, amount: 0, luminosity: 0 },
          { length: 1, mass: 0, time: 0, current: 0, temperature: 0, amount: 0, luminosity: 0 }
        );
        expect(result.consistent).toBe(true);
        expect(result.mismatch.length).toBe(0);
      });

      test('should detect inconsistent dimensions', () => {
        const result = da.checkConsistency(
          { length: 1, mass: 0, time: 0, current: 0, temperature: 0, amount: 0, luminosity: 0 },
          { length: 2, mass: 0, time: 0, current: 0, temperature: 0, amount: 0, luminosity: 0 }
        );
        expect(result.consistent).toBe(false);
        expect(result.mismatch).toContain('length');
      });

      test('should have hash', () => {
        const result = da.checkConsistency(
          { length: 1, mass: 0, time: 0, current: 0, temperature: 0, amount: 0, luminosity: 0 },
          { length: 1, mass: 0, time: 0, current: 0, temperature: 0, amount: 0, luminosity: 0 }
        );
        expect(result.hash).toBeDefined();
        expect(result.hash.length).toBe(64);
      });
    });

    describe('Dimension Operations', () => {
      test('multiplyDimensions should work', () => {
        const a: Dimension = { length: 1, mass: 0, time: -1, current: 0, temperature: 0, amount: 0, luminosity: 0 };
        const b: Dimension = { length: 0, mass: 0, time: 1, current: 0, temperature: 0, amount: 0, luminosity: 0 };
        const result = da.multiplyDimensions(a, b);
        expect(result.length).toBe(1);
        expect(result.time).toBe(0);
      });

      test('divideDimensions should work', () => {
        const a: Dimension = { length: 1, mass: 0, time: 0, current: 0, temperature: 0, amount: 0, luminosity: 0 };
        const b: Dimension = { length: 0, mass: 0, time: 1, current: 0, temperature: 0, amount: 0, luminosity: 0 };
        const result = da.divideDimensions(a, b);
        expect(result.length).toBe(1);
        expect(result.time).toBe(-1);
      });

      test('powerDimension should work', () => {
        const dim: Dimension = { length: 1, mass: 0, time: 0, current: 0, temperature: 0, amount: 0, luminosity: 0 };
        const result = da.powerDimension(dim, 3);
        expect(result.length).toBe(3);
      });
    });

    describe('Inference', () => {
      test('should infer length', () => {
        const dim: Dimension = { length: 1, mass: 0, time: 0, current: 0, temperature: 0, amount: 0, luminosity: 0 };
        expect(da.inferQuantityType(dim)).toBe('length');
      });

      test('should infer velocity', () => {
        const dim: Dimension = { length: 1, mass: 0, time: -1, current: 0, temperature: 0, amount: 0, luminosity: 0 };
        expect(da.inferQuantityType(dim)).toBe('velocity');
      });

      test('should infer force', () => {
        const dim: Dimension = { length: 1, mass: 1, time: -2, current: 0, temperature: 0, amount: 0, luminosity: 0 };
        expect(da.inferQuantityType(dim)).toBe('force');
      });

      test('should infer energy', () => {
        const dim: Dimension = { length: 2, mass: 1, time: -2, current: 0, temperature: 0, amount: 0, luminosity: 0 };
        expect(da.inferQuantityType(dim)).toBe('energy');
      });

      test('should return unknown for unrecognized', () => {
        const dim: Dimension = { length: 5, mass: 3, time: -7, current: 2, temperature: 0, amount: 0, luminosity: 0 };
        expect(da.inferQuantityType(dim)).toBe('unknown');
      });
    });
  });

  // =========================================================================
  // UNIT CONVERTER TESTS
  // =========================================================================

  describe('UnitConverter', () => {
    let converter: UnitConverter;

    beforeEach(() => {
      converter = new UnitConverter();
    });

    describe('Basic Conversions', () => {
      test('convert km to m', () => {
        const result = converter.convert(1, 'km', 'm');
        expect(result.toNumber()).toBe(1000);
      });

      test('convert m to ft', () => {
        const result = converter.convert(1, 'm', 'ft');
        expect(result.toNumber()).toBeCloseTo(3.28084, 4);
      });

      test('should throw for incompatible units', () => {
        expect(() => converter.convert(1, 'm', 's')).toThrow();
      });
    });

    describe('Helper Methods', () => {
      test('length conversion', () => {
        expect(converter.length(1000, 'm', 'km')).toBe(1);
      });

      test('mass conversion', () => {
        expect(converter.mass(1, 'kg', 'g')).toBe(1000);
      });

      test('time conversion', () => {
        expect(converter.time(1, 'h', 'min')).toBe(60);
      });

      test('energy conversion', () => {
        const result = converter.energy(1, 'J', 'erg');
        expect(result).toBe(1e7);
      });
    });

    describe('getConversionFactor', () => {
      test('should return correct factor', () => {
        const factor = converter.getConversionFactor('km', 'm');
        expect(factor.toNumber()).toBe(1000);
      });

      test('should throw for unknown unit', () => {
        expect(() => converter.getConversionFactor('unknown', 'm')).toThrow();
      });
    });
  });

  // =========================================================================
  // SI PREFIXES TESTS
  // =========================================================================

  describe('SI_PREFIXES', () => {
    test('should have kilo prefix', () => {
      expect(SI_PREFIXES.kilo).toBeDefined();
      expect(SI_PREFIXES.kilo.symbol).toBe('k');
      expect(SI_PREFIXES.kilo.factor.toNumber()).toBe(1e3);
    });

    test('should have mega prefix', () => {
      expect(SI_PREFIXES.mega).toBeDefined();
      expect(SI_PREFIXES.mega.factor.toNumber()).toBe(1e6);
    });

    test('should have nano prefix', () => {
      expect(SI_PREFIXES.nano).toBeDefined();
      expect(SI_PREFIXES.nano.factor.toNumber()).toBe(1e-9);
    });

    test('should have all common prefixes', () => {
      const expectedPrefixes = [
        'yotta', 'zetta', 'exa', 'peta', 'tera', 'giga', 'mega', 'kilo',
        'hecto', 'deca', 'deci', 'centi', 'milli', 'micro', 'nano',
        'pico', 'femto', 'atto', 'zepto', 'yocto'
      ];
      for (const prefix of expectedPrefixes) {
        expect(SI_PREFIXES[prefix]).toBeDefined();
      }
    });
  });

  // =========================================================================
  // ADDITIONAL TESTS
  // =========================================================================

  describe('Additional Coverage', () => {
    let unitSystem: UnitSystem;

    beforeEach(() => {
      unitSystem = new UnitSystem();
    });

    test('should handle astronomical units', () => {
      expect(unitSystem.hasUnit('AU')).toBe(true);
      expect(unitSystem.hasUnit('ly')).toBe(true);
      expect(unitSystem.hasUnit('pc')).toBe(true);
    });

    test('should convert light year to meters', () => {
      const result = unitSystem.convert(1, 'ly', 'm');
      expect(result.valid).toBe(true);
      expect(result.value.toNumber()).toBeGreaterThan(9e15);
    });

    test('should handle unit toString', () => {
      const m = unitSystem.getUnit('m')!;
      expect(m.toString()).toBe('meter (m)');
    });

    test('should handle unit toJSON', () => {
      const m = unitSystem.getUnit('m')!;
      const json = m.toJSON();
      expect(json.name).toBe('meter');
      expect(json.symbol).toBe('m');
    });

    test('getAllUnits should return unique units', () => {
      const units = unitSystem.getAllUnits();
      const symbols = units.map(u => u.symbol);
      const uniqueSymbols = new Set(symbols);
      expect(uniqueSymbols.size).toBe(symbols.length);
    });

    test('dimension toObject should work', () => {
      const dim = new DimensionClass({ length: 1, mass: 2 });
      const obj = dim.toObject();
      expect(obj.length).toBe(1);
      expect(obj.mass).toBe(2);
    });

    test('should get dimension string', () => {
      const da = new DimensionalAnalysis();
      const dim: Dimension = { length: 1, mass: 0, time: -1, current: 0, temperature: 0, amount: 0, luminosity: 0 };
      const str = da.getDimensionString(dim);
      expect(str).toContain('L^1');
      expect(str).toContain('T^-1');
    });

    test('isDimensionless should work via DimensionalAnalysis', () => {
      const da = new DimensionalAnalysis();
      const dim1: Dimension = { length: 0, mass: 0, time: 0, current: 0, temperature: 0, amount: 0, luminosity: 0 };
      const dim2: Dimension = { length: 1, mass: 0, time: 0, current: 0, temperature: 0, amount: 0, luminosity: 0 };
      
      expect(da.isDimensionless(dim1)).toBe(true);
      expect(da.isDimensionless(dim2)).toBe(false);
    });
  });

});
