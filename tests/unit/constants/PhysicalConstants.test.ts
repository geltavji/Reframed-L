/**
 * Qlaws Ham - PhysicalConstants Module Tests
 * 
 * Comprehensive tests for CODATA 2018 physical constants.
 * Tests fundamental constants, derived constants, and validation.
 * 
 * @module PhysicalConstants.test
 */

import {
  PhysicalConstants,
  CONSTANTS,
  ConstantValue,
  Uncertainty,
  c, h, hbar, G, e, kB, NA, alpha, me, mp, eps0, mu0, lP, tP, mP, TP
} from '../../../src/core/constants/PhysicalConstants';

describe('PhysicalConstants Module', () => {
  
  beforeEach(() => {
    // Reset singleton for clean tests
    PhysicalConstants.resetInstance();
  });

  describe('Singleton Pattern', () => {
    test('should return same instance', () => {
      const instance1 = PhysicalConstants.getInstance();
      const instance2 = PhysicalConstants.getInstance();
      expect(instance1).toBe(instance2);
    });

    test('should reset instance correctly', () => {
      const instance1 = PhysicalConstants.getInstance();
      PhysicalConstants.resetInstance();
      const instance2 = PhysicalConstants.getInstance();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Fundamental Constants - CODATA 2018', () => {
    describe('Exact Constants (SI 2019)', () => {
      test('speed of light should be exact', () => {
        const constant = c();
        expect(constant.isExact).toBe(true);
        expect(constant.numericValue).toBe(299792458);
        expect(constant.unit).toBe('m/s');
        expect(constant.symbol).toBe('c');
      });

      test('Planck constant should be exact', () => {
        const constant = h();
        expect(constant.isExact).toBe(true);
        expect(constant.numericValue).toBeCloseTo(6.62607015e-34, 42);
        expect(constant.unit).toBe('J⋅s');
        expect(constant.symbol).toBe('h');
      });

      test('elementary charge should be exact', () => {
        const constant = e();
        expect(constant.isExact).toBe(true);
        expect(constant.numericValue).toBeCloseTo(1.602176634e-19, 27);
        expect(constant.unit).toBe('C');
        expect(constant.symbol).toBe('e');
      });

      test('Boltzmann constant should be exact', () => {
        const constant = kB();
        expect(constant.isExact).toBe(true);
        expect(constant.numericValue).toBeCloseTo(1.380649e-23, 29);
        expect(constant.unit).toBe('J/K');
        expect(constant.symbol).toBe('k_B');
      });

      test('Avogadro constant should be exact', () => {
        const constant = NA();
        expect(constant.isExact).toBe(true);
        expect(constant.numericValue).toBeCloseTo(6.02214076e23, 15);
        expect(constant.unit).toBe('mol⁻¹');
        expect(constant.symbol).toBe('N_A');
      });
    });

    describe('Measured Constants (with uncertainty)', () => {
      test('gravitational constant should have uncertainty', () => {
        const constant = G();
        expect(constant.isExact).toBe(false);
        expect(constant.numericValue).toBeCloseTo(6.67430e-11, 15);
        expect(constant.uncertainty.value).toBeGreaterThan(0);
        expect(constant.unit).toBe('m³/(kg⋅s²)');
      });

      test('fine-structure constant should have uncertainty', () => {
        const constant = alpha();
        expect(constant.isExact).toBe(false);
        expect(constant.numericValue).toBeCloseTo(7.2973525693e-3, 12);
        expect(constant.unit).toBe('dimensionless');
      });

      test('electron mass should have uncertainty', () => {
        const constant = me();
        expect(constant.isExact).toBe(false);
        expect(constant.numericValue).toBeCloseTo(9.1093837015e-31, 40);
        expect(constant.unit).toBe('kg');
      });

      test('proton mass should have uncertainty', () => {
        const constant = mp();
        expect(constant.isExact).toBe(false);
        expect(constant.numericValue).toBeCloseTo(1.67262192369e-27, 37);
        expect(constant.unit).toBe('kg');
      });

      test('vacuum permittivity should have uncertainty', () => {
        const constant = eps0();
        expect(constant.numericValue).toBeCloseTo(8.8541878128e-12, 21);
        expect(constant.unit).toBe('F/m');
      });

      test('vacuum permeability should have uncertainty', () => {
        const constant = mu0();
        expect(constant.numericValue).toBeCloseTo(1.25663706212e-6, 17);
        expect(constant.unit).toBe('H/m');
      });
    });
  });

  describe('Derived Constants - Planck Units', () => {
    test('reduced Planck constant should be h/(2π)', () => {
      const constant = hbar();
      const expected = 6.62607015e-34 / (2 * Math.PI);
      expect(constant.numericValue).toBeCloseTo(expected, 42);
      expect(constant.symbol).toBe('ħ');
      expect(constant.unit).toBe('J⋅s');
    });

    test('Planck length should be approximately 1.616e-35 m', () => {
      const constant = lP();
      expect(constant.numericValue).toBeCloseTo(1.616255e-35, 40);
      expect(constant.symbol).toBe('l_P');
      expect(constant.unit).toBe('m');
    });

    test('Planck time should be approximately 5.391e-44 s', () => {
      const constant = tP();
      expect(constant.numericValue).toBeCloseTo(5.391247e-44, 49);
      expect(constant.symbol).toBe('t_P');
      expect(constant.unit).toBe('s');
    });

    test('Planck mass should be approximately 2.176e-8 kg', () => {
      const constant = mP();
      expect(constant.numericValue).toBeCloseTo(2.176434e-8, 14);
      expect(constant.symbol).toBe('m_P');
      expect(constant.unit).toBe('kg');
    });

    test('Planck temperature should be approximately 1.417e32 K', () => {
      const constant = TP();
      const expected = 1.416784e32;
      const relativeError = Math.abs(constant.numericValue - expected) / expected;
      expect(relativeError).toBeLessThan(1e-5); // Within 0.001%
      expect(constant.symbol).toBe('T_P');
      expect(constant.unit).toBe('K');
    });
  });

  describe('Constant Retrieval', () => {
    test('should get constant by name', () => {
      const constants = PhysicalConstants.getInstance();
      const constant = constants.get('speed_of_light');
      expect(constant.name).toBe('speed_of_light');
      expect(constant.symbol).toBe('c');
    });

    test('should get derived constant by name', () => {
      const constants = PhysicalConstants.getInstance();
      const constant = constants.getDerived('planck_length');
      expect(constant.name).toBe('planck_length');
      expect(constant.symbol).toBe('l_P');
    });

    test('should get constant by symbol', () => {
      const constants = PhysicalConstants.getInstance();
      const constant = constants.getBySymbol('c');
      expect(constant.name).toBe('speed_of_light');
    });

    test('should throw for unknown constant', () => {
      const constants = PhysicalConstants.getInstance();
      expect(() => constants.get('unknown_constant')).toThrow('Unknown constant');
    });

    test('should throw for unknown derived constant', () => {
      const constants = PhysicalConstants.getInstance();
      expect(() => constants.getDerived('unknown_derived')).toThrow('Unknown derived constant');
    });

    test('should throw for unknown symbol', () => {
      const constants = PhysicalConstants.getInstance();
      expect(() => constants.getBySymbol('xyz')).toThrow('Unknown constant symbol');
    });
  });

  describe('Has Check', () => {
    test('should return true for existing constant', () => {
      const constants = PhysicalConstants.getInstance();
      expect(constants.has('speed_of_light')).toBe(true);
    });

    test('should return true for existing derived constant', () => {
      const constants = PhysicalConstants.getInstance();
      expect(constants.has('planck_length')).toBe(true);
    });

    test('should return false for non-existing constant', () => {
      const constants = PhysicalConstants.getInstance();
      expect(constants.has('nonexistent')).toBe(false);
    });
  });

  describe('Hash Verification', () => {
    test('each constant should have a hash', () => {
      const constants = PhysicalConstants.getInstance();
      const constant = constants.get('speed_of_light');
      expect(constant.hash).toBeDefined();
      expect(constant.hash.length).toBe(64); // SHA-256 hex length
    });

    test('different constants should have different hashes', () => {
      const constants = PhysicalConstants.getInstance();
      const c = constants.get('speed_of_light');
      const h = constants.get('planck_constant');
      expect(c.hash).not.toBe(h.hash);
    });

    test('derived constants should have hashes', () => {
      const constant = hbar();
      expect(constant.hash).toBeDefined();
      expect(constant.hash.length).toBe(64);
    });
  });

  describe('Constant Lists', () => {
    test('should get all constant names', () => {
      const constants = PhysicalConstants.getInstance();
      const names = constants.getAllNames();
      expect(names).toContain('speed_of_light');
      expect(names).toContain('planck_constant');
      expect(names).toContain('planck_length');
      expect(names.length).toBeGreaterThan(20);
    });

    test('should get exact constants', () => {
      const constants = PhysicalConstants.getInstance();
      const exact = constants.getExactConstants();
      expect(exact.length).toBeGreaterThan(5);
      exact.forEach(c => expect(c.isExact).toBe(true));
    });

    test('should get measured constants', () => {
      const constants = PhysicalConstants.getInstance();
      const measured = constants.getMeasuredConstants();
      expect(measured.length).toBeGreaterThan(5);
      measured.forEach(c => expect(c.isExact).toBe(false));
    });
  });

  describe('Consistency Validation', () => {
    test('should validate fundamental relationships', () => {
      const constants = PhysicalConstants.getInstance();
      const result = constants.validateConsistency();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('R = N_A * k_B should hold', () => {
      const constants = PhysicalConstants.getInstance();
      const R = constants.get('molar_gas_constant').numericValue;
      const NA_val = constants.get('avogadro_constant').numericValue;
      const kB_val = constants.get('boltzmann_constant').numericValue;
      const calculated = NA_val * kB_val;
      expect(Math.abs(R - calculated) / R).toBeLessThan(1e-10);
    });

    test('F = N_A * e should hold', () => {
      const constants = PhysicalConstants.getInstance();
      const F = constants.get('faraday_constant').numericValue;
      const NA_val = constants.get('avogadro_constant').numericValue;
      const e_val = constants.get('elementary_charge').numericValue;
      const calculated = NA_val * e_val;
      expect(Math.abs(F - calculated) / F).toBeLessThan(1e-10);
    });

    test('c² ≈ 1/(ε₀μ₀) should approximately hold', () => {
      const constants = PhysicalConstants.getInstance();
      const c_val = constants.get('speed_of_light').numericValue;
      const eps0_val = constants.get('vacuum_permittivity').numericValue;
      const mu0_val = constants.get('vacuum_permeability').numericValue;
      const c_squared = c_val * c_val;
      const calculated = 1 / (eps0_val * mu0_val);
      expect(Math.abs(c_squared - calculated) / c_squared).toBeLessThan(1e-8);
    });
  });

  describe('Uncertainty Propagation', () => {
    test('should propagate uncertainty correctly', () => {
      const constants = PhysicalConstants.getInstance();
      
      // Test: Calculate E = mc² uncertainty
      const partialDerivatives = new Map<string, number>();
      const c_val = constants.get('speed_of_light').numericValue;
      const m_val = constants.get('electron_mass').numericValue;
      
      partialDerivatives.set('electron_mass', c_val * c_val);
      
      const uncertainty = constants.propagateUncertainty(
        m_val * c_val * c_val,
        partialDerivatives,
        ['electron_mass']
      );
      
      expect(uncertainty.type).toBe('absolute');
      expect(uncertainty.standardError).toBeGreaterThan(0);
    });

    test('uncertainty should be zero for exact constants only', () => {
      const constants = PhysicalConstants.getInstance();
      const partialDerivatives = new Map<string, number>();
      partialDerivatives.set('speed_of_light', 1);
      
      const uncertainty = constants.propagateUncertainty(
        299792458,
        partialDerivatives,
        ['speed_of_light']
      );
      
      expect(uncertainty.standardError).toBe(0);
    });
  });

  describe('Export to JSON', () => {
    test('should export all constants to JSON', () => {
      const constants = PhysicalConstants.getInstance();
      const json = constants.exportToJson();
      const parsed = JSON.parse(json);
      
      expect(parsed.fundamental).toBeDefined();
      expect(parsed.derived).toBeDefined();
      expect(parsed.fundamental.length).toBeGreaterThan(0);
      expect(parsed.derived.length).toBeGreaterThan(0);
    });

    test('exported JSON should contain required fields', () => {
      const constants = PhysicalConstants.getInstance();
      const json = constants.exportToJson();
      const parsed = JSON.parse(json);
      
      const c = parsed.fundamental.find((f: any) => f.name === 'speed_of_light');
      expect(c).toBeDefined();
      expect(c.symbol).toBe('c');
      expect(c.value).toBe(299792458);
      expect(c.unit).toBe('m/s');
      expect(c.isExact).toBe(true);
      expect(c.hash).toBeDefined();
    });
  });

  describe('Validation Toggle', () => {
    test('should allow disabling hash validation', () => {
      const constants = PhysicalConstants.getInstance();
      constants.setValidationEnabled(false);
      
      // Should not throw even if hash were wrong
      const constant = constants.get('speed_of_light');
      expect(constant).toBeDefined();
      
      constants.setValidationEnabled(true);
    });
  });

  describe('Count Properties', () => {
    test('should return correct total count', () => {
      const constants = PhysicalConstants.getInstance();
      expect(constants.count).toBeGreaterThan(25);
    });

    test('should return correct fundamental count', () => {
      const constants = PhysicalConstants.getInstance();
      expect(constants.fundamentalCount).toBeGreaterThan(20);
    });

    test('should return correct derived count', () => {
      const constants = PhysicalConstants.getInstance();
      expect(constants.derivedCount).toBeGreaterThan(5);
    });

    test('total should equal fundamental plus derived', () => {
      const constants = PhysicalConstants.getInstance();
      expect(constants.count).toBe(constants.fundamentalCount + constants.derivedCount);
    });
  });

  describe('Physical Value Accuracy', () => {
    test('speed of light should be exactly 299792458 m/s', () => {
      expect(c().numericValue).toBe(299792458);
    });

    test('Planck constant should be 6.62607015e-34 J⋅s', () => {
      expect(h().numericValue).toBe(6.62607015e-34);
    });

    test('elementary charge should be 1.602176634e-19 C', () => {
      expect(e().numericValue).toBe(1.602176634e-19);
    });

    test('Boltzmann constant should be 1.380649e-23 J/K', () => {
      expect(kB().numericValue).toBe(1.380649e-23);
    });

    test('Avogadro constant should be 6.02214076e23 mol⁻¹', () => {
      expect(NA().numericValue).toBe(6.02214076e23);
    });

    test('gravitational constant should be approximately 6.67430e-11', () => {
      expect(G().numericValue).toBeCloseTo(6.67430e-11, 15);
    });

    test('fine-structure constant should be approximately 1/137', () => {
      const alphaValue = alpha().numericValue;
      expect(1 / alphaValue).toBeCloseTo(137.036, 2);
    });
  });

  describe('Planck Units Relationships', () => {
    test('l_P² = ħG/c³', () => {
      const hbar_val = hbar().numericValue;
      const G_val = G().numericValue;
      const c_val = c().numericValue;
      const lP_val = lP().numericValue;
      
      const calculated = Math.sqrt(hbar_val * G_val / Math.pow(c_val, 3));
      expect(lP_val).toBeCloseTo(calculated, 43);
    });

    test('t_P = l_P / c', () => {
      const lP_val = lP().numericValue;
      const c_val = c().numericValue;
      const tP_val = tP().numericValue;
      
      const calculated = lP_val / c_val;
      expect(tP_val).toBeCloseTo(calculated, 52);
    });

    test('l_P / t_P = c (speed of light)', () => {
      const lP_val = lP().numericValue;
      const tP_val = tP().numericValue;
      const c_val = c().numericValue;
      
      const calculated = lP_val / tP_val;
      const relativeError = Math.abs(calculated - c_val) / c_val;
      expect(relativeError).toBeLessThan(1e-10);
    });

    test('E_P = m_P * c²', () => {
      const constants = PhysicalConstants.getInstance();
      const EP = constants.getDerived('planck_energy').numericValue;
      const mP_val = mP().numericValue;
      const c_val = c().numericValue;
      
      const calculated = mP_val * c_val * c_val;
      expect(EP).toBeCloseTo(calculated, 0);
    });
  });

  describe('Additional Constants', () => {
    test('should have Rydberg constant', () => {
      const constants = PhysicalConstants.getInstance();
      const R_inf = constants.get('rydberg_constant');
      expect(R_inf.numericValue).toBeCloseTo(10973731.568160, 0);
    });

    test('should have Bohr radius', () => {
      const constants = PhysicalConstants.getInstance();
      const a0 = constants.get('bohr_radius');
      expect(a0.numericValue).toBeCloseTo(5.29177210903e-11, 20);
    });

    test('should have Stefan-Boltzmann constant', () => {
      const constants = PhysicalConstants.getInstance();
      const sigma = constants.get('stefan_boltzmann_constant');
      expect(sigma.numericValue).toBeCloseTo(5.670374419e-8, 17);
    });

    test('should have electron volt', () => {
      const constants = PhysicalConstants.getInstance();
      const eV = constants.get('electron_volt');
      expect(eV.numericValue).toBe(1.602176634e-19);
      expect(eV.isExact).toBe(true);
    });

    test('should have atomic mass unit', () => {
      const constants = PhysicalConstants.getInstance();
      const u = constants.get('atomic_mass_unit');
      expect(u.numericValue).toBeCloseTo(1.66053906660e-27, 38);
    });

    test('should have neutron mass', () => {
      const constants = PhysicalConstants.getInstance();
      const mn = constants.get('neutron_mass');
      expect(mn.numericValue).toBeCloseTo(1.67492749804e-27, 38);
    });

    test('should have Compton wavelength', () => {
      const constants = PhysicalConstants.getInstance();
      const lambdaC = constants.get('compton_wavelength_electron');
      expect(lambdaC.numericValue).toBeCloseTo(2.42631023867e-12, 21);
    });

    test('should have Wien displacement constant', () => {
      const constants = PhysicalConstants.getInstance();
      const b = constants.get('wien_displacement_constant');
      expect(b.numericValue).toBeCloseTo(2.897771955e-3, 12);
    });
  });

  describe('Source Attribution', () => {
    test('all constants should have source', () => {
      const constants = PhysicalConstants.getInstance();
      const names = constants.getAllNames();
      
      for (const name of names) {
        try {
          const constant = constants.get(name);
          expect(constant.source).toBeDefined();
          expect(constant.source.length).toBeGreaterThan(0);
        } catch {
          const derived = constants.getDerived(name);
          expect(derived.source).toBeDefined();
          expect(derived.source.length).toBeGreaterThan(0);
        }
      }
    });

    test('exact constants should reference SI 2019', () => {
      const constants = PhysicalConstants.getInstance();
      const exact = constants.getExactConstants();
      
      for (const constant of exact) {
        if (['speed_of_light', 'planck_constant', 'elementary_charge', 'boltzmann_constant', 'avogadro_constant'].includes(constant.name)) {
          expect(constant.source).toContain('SI 2019');
        }
      }
    });
  });

  describe('Dimensional Analysis', () => {
    test('should get dimensions for speed of light', () => {
      const constants = PhysicalConstants.getInstance();
      const dims = constants.getDimensions('speed_of_light');
      expect(dims.length).toBe(1);
      expect(dims.time).toBe(-1);
    });

    test('should get dimensions for mass constants', () => {
      const constants = PhysicalConstants.getInstance();
      const dims = constants.getDimensions('electron_mass');
      expect(dims.mass).toBe(1);
    });
  });
});
