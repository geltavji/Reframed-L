/**
 * Qlaws Ham - Unit System Module (M01.08)
 * 
 * Phase 1.5: Comprehensive Unit System & Dimensional Analysis
 * 
 * Dependencies: Logger (M01.01), BigNumber (M01.03)
 * Exports: Unit, Dimension, UnitConverter, UnitSystem, DimensionalAnalysis
 * 
 * Features:
 * - SI Base Units (7 fundamental)
 * - Planck Units (natural units)
 * - Derived Units with dimensional analysis
 * - Unit conversion with hash verification
 * - Dimensional consistency checking
 * - Prefix handling (kilo, mega, nano, etc.)
 */

import { Logger, LogLevel } from '../logger/Logger';
import { HashVerifier } from '../logger/HashVerifier';
import { BigNumber } from '../math/BigNumber';

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Represents the dimensional exponents for a physical quantity
 * Based on SI base dimensions: [L, M, T, I, Θ, N, J]
 * L = Length, M = Mass, T = Time, I = Current, Θ = Temperature, N = Amount, J = Luminosity
 */
export interface Dimension {
  length: number;      // L (meter)
  mass: number;        // M (kilogram)
  time: number;        // T (second)
  current: number;     // I (ampere)
  temperature: number; // Θ (kelvin)
  amount: number;      // N (mole)
  luminosity: number;  // J (candela)
}

/**
 * Represents a physical unit
 */
export interface UnitDefinition {
  name: string;
  symbol: string;
  dimension: Dimension;
  conversionFactor: BigNumber;  // Factor to convert to SI base
  offset: BigNumber;            // Offset for temperature-like units
  isBaseUnit: boolean;
  category: UnitCategory;
  hash: string;
}

/**
 * Result of a unit conversion
 */
export interface ConversionResult {
  value: BigNumber;
  fromUnit: string;
  toUnit: string;
  conversionFactor: BigNumber;
  valid: boolean;
  hash: string;
  timestamp: string;
}

/**
 * Result of dimensional analysis
 */
export interface DimensionalAnalysisResult {
  consistent: boolean;
  expectedDimension: Dimension;
  actualDimension: Dimension;
  mismatch: string[];
  hash: string;
}

/**
 * Quantity with value and unit
 */
export interface Quantity {
  value: BigNumber;
  unit: Unit;
  hash: string;
}

/**
 * Unit categories for organization
 */
export type UnitCategory = 
  | 'base'
  | 'derived'
  | 'planck'
  | 'imperial'
  | 'astronomical'
  | 'custom';

/**
 * SI Prefixes
 */
export interface Prefix {
  name: string;
  symbol: string;
  factor: BigNumber;
}

// ============================================================================
// DIMENSION CLASS
// ============================================================================

/**
 * Class for handling dimensional analysis
 */
export class DimensionClass implements Dimension {
  public length: number = 0;
  public mass: number = 0;
  public time: number = 0;
  public current: number = 0;
  public temperature: number = 0;
  public amount: number = 0;
  public luminosity: number = 0;

  constructor(dim?: Partial<Dimension>) {
    if (dim) {
      this.length = dim.length ?? 0;
      this.mass = dim.mass ?? 0;
      this.time = dim.time ?? 0;
      this.current = dim.current ?? 0;
      this.temperature = dim.temperature ?? 0;
      this.amount = dim.amount ?? 0;
      this.luminosity = dim.luminosity ?? 0;
    }
  }

  /**
   * Multiply dimensions (for multiplying quantities)
   */
  multiply(other: Dimension): DimensionClass {
    return new DimensionClass({
      length: this.length + other.length,
      mass: this.mass + other.mass,
      time: this.time + other.time,
      current: this.current + other.current,
      temperature: this.temperature + other.temperature,
      amount: this.amount + other.amount,
      luminosity: this.luminosity + other.luminosity
    });
  }

  /**
   * Divide dimensions (for dividing quantities)
   */
  divide(other: Dimension): DimensionClass {
    return new DimensionClass({
      length: this.length - other.length,
      mass: this.mass - other.mass,
      time: this.time - other.time,
      current: this.current - other.current,
      temperature: this.temperature - other.temperature,
      amount: this.amount - other.amount,
      luminosity: this.luminosity - other.luminosity
    });
  }

  /**
   * Raise dimension to a power
   */
  pow(n: number): DimensionClass {
    return new DimensionClass({
      length: this.length * n,
      mass: this.mass * n,
      time: this.time * n,
      current: this.current * n,
      temperature: this.temperature * n,
      amount: this.amount * n,
      luminosity: this.luminosity * n
    });
  }

  /**
   * Check if dimensionless
   */
  isDimensionless(): boolean {
    return this.length === 0 &&
           this.mass === 0 &&
           this.time === 0 &&
           this.current === 0 &&
           this.temperature === 0 &&
           this.amount === 0 &&
           this.luminosity === 0;
  }

  /**
   * Check equality with another dimension
   */
  equals(other: Dimension): boolean {
    return this.length === other.length &&
           this.mass === other.mass &&
           this.time === other.time &&
           this.current === other.current &&
           this.temperature === other.temperature &&
           this.amount === other.amount &&
           this.luminosity === other.luminosity;
  }

  /**
   * Get string representation
   */
  toString(): string {
    const parts: string[] = [];
    if (this.length !== 0) parts.push(`L^${this.length}`);
    if (this.mass !== 0) parts.push(`M^${this.mass}`);
    if (this.time !== 0) parts.push(`T^${this.time}`);
    if (this.current !== 0) parts.push(`I^${this.current}`);
    if (this.temperature !== 0) parts.push(`Θ^${this.temperature}`);
    if (this.amount !== 0) parts.push(`N^${this.amount}`);
    if (this.luminosity !== 0) parts.push(`J^${this.luminosity}`);
    return parts.length > 0 ? parts.join('·') : '1 (dimensionless)';
  }

  /**
   * Compute hash
   */
  hash(): string {
    return HashVerifier.hash(JSON.stringify(this.toObject()));
  }

  /**
   * Convert to plain object
   */
  toObject(): Dimension {
    return {
      length: this.length,
      mass: this.mass,
      time: this.time,
      current: this.current,
      temperature: this.temperature,
      amount: this.amount,
      luminosity: this.luminosity
    };
  }

  // Factory methods for common dimensions
  static dimensionless(): DimensionClass {
    return new DimensionClass();
  }

  static forLength(): DimensionClass {
    return new DimensionClass({ length: 1 });
  }

  static mass(): DimensionClass {
    return new DimensionClass({ mass: 1 });
  }

  static time(): DimensionClass {
    return new DimensionClass({ time: 1 });
  }

  static current(): DimensionClass {
    return new DimensionClass({ current: 1 });
  }

  static temperature(): DimensionClass {
    return new DimensionClass({ temperature: 1 });
  }

  static amount(): DimensionClass {
    return new DimensionClass({ amount: 1 });
  }

  static luminosity(): DimensionClass {
    return new DimensionClass({ luminosity: 1 });
  }

  // Common derived dimensions
  static velocity(): DimensionClass {
    return new DimensionClass({ length: 1, time: -1 });
  }

  static acceleration(): DimensionClass {
    return new DimensionClass({ length: 1, time: -2 });
  }

  static force(): DimensionClass {
    return new DimensionClass({ mass: 1, length: 1, time: -2 });
  }

  static energy(): DimensionClass {
    return new DimensionClass({ mass: 1, length: 2, time: -2 });
  }

  static power(): DimensionClass {
    return new DimensionClass({ mass: 1, length: 2, time: -3 });
  }

  static pressure(): DimensionClass {
    return new DimensionClass({ mass: 1, length: -1, time: -2 });
  }

  static frequency(): DimensionClass {
    return new DimensionClass({ time: -1 });
  }

  static charge(): DimensionClass {
    return new DimensionClass({ current: 1, time: 1 });
  }

  static voltage(): DimensionClass {
    return new DimensionClass({ mass: 1, length: 2, time: -3, current: -1 });
  }

  static resistance(): DimensionClass {
    return new DimensionClass({ mass: 1, length: 2, time: -3, current: -2 });
  }

  static action(): DimensionClass {
    return new DimensionClass({ mass: 1, length: 2, time: -1 }); // J·s
  }
}

// ============================================================================
// UNIT CLASS
// ============================================================================

/**
 * Unit class representing a physical unit
 */
export class Unit {
  private definition: UnitDefinition;
  private logger: Logger;

  constructor(def: UnitDefinition, logger?: Logger) {
    this.definition = { ...def };
    this.logger = logger ?? Logger.getInstance({ minLevel: LogLevel.INFO });
  }

  get name(): string { return this.definition.name; }
  get symbol(): string { return this.definition.symbol; }
  get dimension(): DimensionClass { return new DimensionClass(this.definition.dimension); }
  get conversionFactor(): BigNumber { return this.definition.conversionFactor; }
  get offset(): BigNumber { return this.definition.offset; }
  get isBaseUnit(): boolean { return this.definition.isBaseUnit; }
  get category(): UnitCategory { return this.definition.category; }
  get hash(): string { return this.definition.hash; }

  /**
   * Check if units are dimensionally compatible
   */
  isCompatibleWith(other: Unit): boolean {
    return this.dimension.equals(other.dimension);
  }

  /**
   * Get conversion factor to another unit
   */
  getConversionFactorTo(other: Unit): BigNumber {
    if (!this.isCompatibleWith(other)) {
      throw new Error(`Cannot convert between incompatible units: ${this.symbol} and ${other.symbol}`);
    }
    // factor = this.factor / other.factor
    return this.conversionFactor.divide(other.conversionFactor);
  }

  /**
   * Multiply with another unit to create derived unit
   */
  multiply(other: Unit): Unit {
    const newDim = this.dimension.multiply(other.dimension);
    const newFactor = this.conversionFactor.multiply(other.conversionFactor);
    const newSymbol = `${this.symbol}·${other.symbol}`;
    const newName = `${this.name}·${other.name}`;
    
    return new Unit({
      name: newName,
      symbol: newSymbol,
      dimension: newDim.toObject(),
      conversionFactor: newFactor,
      offset: BigNumber.zero(),
      isBaseUnit: false,
      category: 'derived',
      hash: HashVerifier.hash(`${newName}${newSymbol}${newDim.hash()}`)
    }, this.logger);
  }

  /**
   * Divide by another unit
   */
  divide(other: Unit): Unit {
    const newDim = this.dimension.divide(other.dimension);
    const newFactor = this.conversionFactor.divide(other.conversionFactor);
    const newSymbol = `${this.symbol}/${other.symbol}`;
    const newName = `${this.name}/${other.name}`;
    
    return new Unit({
      name: newName,
      symbol: newSymbol,
      dimension: newDim.toObject(),
      conversionFactor: newFactor,
      offset: BigNumber.zero(),
      isBaseUnit: false,
      category: 'derived',
      hash: HashVerifier.hash(`${newName}${newSymbol}${newDim.hash()}`)
    }, this.logger);
  }

  /**
   * Raise to a power
   */
  pow(n: number): Unit {
    const newDim = this.dimension.pow(n);
    const newFactor = this.conversionFactor.pow(n);
    const newSymbol = `${this.symbol}^${n}`;
    const newName = `${this.name}^${n}`;
    
    return new Unit({
      name: newName,
      symbol: newSymbol,
      dimension: newDim.toObject(),
      conversionFactor: newFactor,
      offset: BigNumber.zero(),
      isBaseUnit: false,
      category: 'derived',
      hash: HashVerifier.hash(`${newName}${newSymbol}${newDim.hash()}`)
    }, this.logger);
  }

  /**
   * Create inverse unit
   */
  inverse(): Unit {
    return this.pow(-1);
  }

  /**
   * String representation
   */
  toString(): string {
    return `${this.name} (${this.symbol})`;
  }

  /**
   * Export to JSON
   */
  toJSON(): UnitDefinition {
    return { ...this.definition };
  }
}

// ============================================================================
// SI PREFIXES
// ============================================================================

export const SI_PREFIXES: Record<string, Prefix> = {
  yotta: { name: 'yotta', symbol: 'Y', factor: new BigNumber('1e24') },
  zetta: { name: 'zetta', symbol: 'Z', factor: new BigNumber('1e21') },
  exa:   { name: 'exa',   symbol: 'E', factor: new BigNumber('1e18') },
  peta:  { name: 'peta',  symbol: 'P', factor: new BigNumber('1e15') },
  tera:  { name: 'tera',  symbol: 'T', factor: new BigNumber('1e12') },
  giga:  { name: 'giga',  symbol: 'G', factor: new BigNumber('1e9') },
  mega:  { name: 'mega',  symbol: 'M', factor: new BigNumber('1e6') },
  kilo:  { name: 'kilo',  symbol: 'k', factor: new BigNumber('1e3') },
  hecto: { name: 'hecto', symbol: 'h', factor: new BigNumber('1e2') },
  deca:  { name: 'deca',  symbol: 'da', factor: new BigNumber('1e1') },
  deci:  { name: 'deci',  symbol: 'd', factor: new BigNumber('1e-1') },
  centi: { name: 'centi', symbol: 'c', factor: new BigNumber('1e-2') },
  milli: { name: 'milli', symbol: 'm', factor: new BigNumber('1e-3') },
  micro: { name: 'micro', symbol: 'μ', factor: new BigNumber('1e-6') },
  nano:  { name: 'nano',  symbol: 'n', factor: new BigNumber('1e-9') },
  pico:  { name: 'pico',  symbol: 'p', factor: new BigNumber('1e-12') },
  femto: { name: 'femto', symbol: 'f', factor: new BigNumber('1e-15') },
  atto:  { name: 'atto',  symbol: 'a', factor: new BigNumber('1e-18') },
  zepto: { name: 'zepto', symbol: 'z', factor: new BigNumber('1e-21') },
  yocto: { name: 'yocto', symbol: 'y', factor: new BigNumber('1e-24') },
};

// ============================================================================
// UNIT SYSTEM CLASS
// ============================================================================

/**
 * Comprehensive Unit System with built-in units and conversion
 */
export class UnitSystem {
  private units: Map<string, Unit> = new Map();
  private logger: Logger;
  private hashVerifier: typeof HashVerifier = HashVerifier;

  constructor(logger?: Logger) {
    this.logger = logger ?? Logger.getInstance({ minLevel: LogLevel.INFO });
    this.initializeBaseUnits();
    this.initializeDerivedUnits();
    this.initializePlanckUnits();
  }

  /**
   * Initialize SI base units
   */
  private initializeBaseUnits(): void {
    // SI Base Units
    const baseUnits: Array<{ name: string; symbol: string; dimension: Partial<Dimension>; }> = [
      { name: 'meter', symbol: 'm', dimension: { length: 1 } },
      { name: 'kilogram', symbol: 'kg', dimension: { mass: 1 } },
      { name: 'second', symbol: 's', dimension: { time: 1 } },
      { name: 'ampere', symbol: 'A', dimension: { current: 1 } },
      { name: 'kelvin', symbol: 'K', dimension: { temperature: 1 } },
      { name: 'mole', symbol: 'mol', dimension: { amount: 1 } },
      { name: 'candela', symbol: 'cd', dimension: { luminosity: 1 } },
    ];

    for (const base of baseUnits) {
      const dim = new DimensionClass(base.dimension);
      const unit = new Unit({
        name: base.name,
        symbol: base.symbol,
        dimension: dim.toObject(),
        conversionFactor: BigNumber.one(),
        offset: BigNumber.zero(),
        isBaseUnit: true,
        category: 'base',
        hash: this.hashVerifier.hash(`${base.name}${base.symbol}${dim.hash()}`)
      }, this.logger);
      
      this.units.set(base.symbol, unit);
      this.units.set(base.name, unit);
    }

    // Additional length units
    this.addUnit('centimeter', 'cm', { length: 1 }, new BigNumber('0.01'));
    this.addUnit('millimeter', 'mm', { length: 1 }, new BigNumber('0.001'));
    this.addUnit('kilometer', 'km', { length: 1 }, new BigNumber('1000'));
    this.addUnit('micrometer', 'μm', { length: 1 }, new BigNumber('1e-6'));
    this.addUnit('nanometer', 'nm', { length: 1 }, new BigNumber('1e-9'));
    this.addUnit('picometer', 'pm', { length: 1 }, new BigNumber('1e-12'));
    this.addUnit('femtometer', 'fm', { length: 1 }, new BigNumber('1e-15'));
    
    // Imperial length
    this.addUnit('inch', 'in', { length: 1 }, new BigNumber('0.0254'), 'imperial');
    this.addUnit('foot', 'ft', { length: 1 }, new BigNumber('0.3048'), 'imperial');
    this.addUnit('yard', 'yd', { length: 1 }, new BigNumber('0.9144'), 'imperial');
    this.addUnit('mile', 'mi', { length: 1 }, new BigNumber('1609.344'), 'imperial');

    // Additional time units
    this.addUnit('millisecond', 'ms', { time: 1 }, new BigNumber('0.001'));
    this.addUnit('microsecond', 'μs', { time: 1 }, new BigNumber('1e-6'));
    this.addUnit('nanosecond', 'ns', { time: 1 }, new BigNumber('1e-9'));
    this.addUnit('minute', 'min', { time: 1 }, new BigNumber('60'));
    this.addUnit('hour', 'h', { time: 1 }, new BigNumber('3600'));
    this.addUnit('day', 'd', { time: 1 }, new BigNumber('86400'));
    this.addUnit('year', 'yr', { time: 1 }, new BigNumber('31557600')); // Julian year

    // Additional mass units
    this.addUnit('gram', 'g', { mass: 1 }, new BigNumber('0.001'));
    this.addUnit('milligram', 'mg', { mass: 1 }, new BigNumber('1e-6'));
    this.addUnit('microgram', 'μg', { mass: 1 }, new BigNumber('1e-9'));
    this.addUnit('tonne', 't', { mass: 1 }, new BigNumber('1000'));
    this.addUnit('pound', 'lb', { mass: 1 }, new BigNumber('0.45359237'), 'imperial');
    this.addUnit('ounce', 'oz', { mass: 1 }, new BigNumber('0.028349523125'), 'imperial');

    // Temperature (with offset for Celsius and Fahrenheit)
    this.addUnitWithOffset('celsius', '°C', { temperature: 1 }, BigNumber.one(), new BigNumber('273.15'));
    this.addUnitWithOffset('fahrenheit', '°F', { temperature: 1 }, 
      new BigNumber('5').divide(new BigNumber('9')), 
      new BigNumber('459.67').multiply(new BigNumber('5').divide(new BigNumber('9'))));

    this.logger.info('Base units initialized', { count: this.units.size });
  }

  /**
   * Initialize derived SI units
   */
  private initializeDerivedUnits(): void {
    // Frequency
    this.addUnit('hertz', 'Hz', { time: -1 }, BigNumber.one(), 'derived');
    
    // Force
    this.addUnit('newton', 'N', { mass: 1, length: 1, time: -2 }, BigNumber.one(), 'derived');
    this.addUnit('dyne', 'dyn', { mass: 1, length: 1, time: -2 }, new BigNumber('1e-5'), 'derived');
    
    // Energy
    this.addUnit('joule', 'J', { mass: 1, length: 2, time: -2 }, BigNumber.one(), 'derived');
    this.addUnit('electronvolt', 'eV', { mass: 1, length: 2, time: -2 }, new BigNumber('1.602176634e-19'), 'derived');
    this.addUnit('calorie', 'cal', { mass: 1, length: 2, time: -2 }, new BigNumber('4.184'), 'derived');
    this.addUnit('kilocalorie', 'kcal', { mass: 1, length: 2, time: -2 }, new BigNumber('4184'), 'derived');
    this.addUnit('erg', 'erg', { mass: 1, length: 2, time: -2 }, new BigNumber('1e-7'), 'derived');
    
    // Power
    this.addUnit('watt', 'W', { mass: 1, length: 2, time: -3 }, BigNumber.one(), 'derived');
    this.addUnit('horsepower', 'hp', { mass: 1, length: 2, time: -3 }, new BigNumber('745.7'), 'derived');
    
    // Pressure
    this.addUnit('pascal', 'Pa', { mass: 1, length: -1, time: -2 }, BigNumber.one(), 'derived');
    this.addUnit('bar', 'bar', { mass: 1, length: -1, time: -2 }, new BigNumber('1e5'), 'derived');
    this.addUnit('atmosphere', 'atm', { mass: 1, length: -1, time: -2 }, new BigNumber('101325'), 'derived');
    
    // Electric charge
    this.addUnit('coulomb', 'C', { current: 1, time: 1 }, BigNumber.one(), 'derived');
    
    // Electric potential
    this.addUnit('volt', 'V', { mass: 1, length: 2, time: -3, current: -1 }, BigNumber.one(), 'derived');
    
    // Electric resistance
    this.addUnit('ohm', 'Ω', { mass: 1, length: 2, time: -3, current: -2 }, BigNumber.one(), 'derived');
    
    // Electric capacitance
    this.addUnit('farad', 'F', { mass: -1, length: -2, time: 4, current: 2 }, BigNumber.one(), 'derived');
    
    // Magnetic flux
    this.addUnit('weber', 'Wb', { mass: 1, length: 2, time: -2, current: -1 }, BigNumber.one(), 'derived');
    
    // Magnetic flux density
    this.addUnit('tesla', 'T', { mass: 1, time: -2, current: -1 }, BigNumber.one(), 'derived');
    
    // Inductance
    this.addUnit('henry', 'H', { mass: 1, length: 2, time: -2, current: -2 }, BigNumber.one(), 'derived');
    
    // Velocity
    this.addUnit('meter_per_second', 'm/s', { length: 1, time: -1 }, BigNumber.one(), 'derived');
    this.addUnit('kilometer_per_hour', 'km/h', { length: 1, time: -1 }, new BigNumber('0.277778'), 'derived');
    
    // Acceleration
    this.addUnit('meter_per_second_squared', 'm/s²', { length: 1, time: -2 }, BigNumber.one(), 'derived');
    
    // Angular units
    this.addUnit('radian', 'rad', {}, BigNumber.one(), 'derived');
    this.addUnit('degree', '°', {}, new BigNumber(Math.PI.toString()).divide(new BigNumber('180')), 'derived');
    this.addUnit('steradian', 'sr', {}, BigNumber.one(), 'derived');
    
    // Action (Planck's constant dimension)
    this.addUnit('joule_second', 'J·s', { mass: 1, length: 2, time: -1 }, BigNumber.one(), 'derived');

    this.logger.info('Derived units initialized', { count: this.units.size });
  }

  /**
   * Initialize Planck units
   */
  private initializePlanckUnits(): void {
    // Planck length: sqrt(ℏG/c³) ≈ 1.616255 × 10^-35 m
    this.addUnit('planck_length', 'l_P', { length: 1 }, 
      new BigNumber('1.616255e-35'), 'planck');
    
    // Planck time: sqrt(ℏG/c⁵) ≈ 5.391247 × 10^-44 s
    this.addUnit('planck_time', 't_P', { time: 1 }, 
      new BigNumber('5.391247e-44'), 'planck');
    
    // Planck mass: sqrt(ℏc/G) ≈ 2.176434 × 10^-8 kg
    this.addUnit('planck_mass', 'm_P', { mass: 1 }, 
      new BigNumber('2.176434e-8'), 'planck');
    
    // Planck temperature: sqrt(ℏc⁵/(Gk_B²)) ≈ 1.416784 × 10^32 K
    this.addUnit('planck_temperature', 'T_P', { temperature: 1 }, 
      new BigNumber('1.416784e32'), 'planck');
    
    // Planck charge: sqrt(4πε₀ℏc) ≈ 1.875545956 × 10^-18 C
    this.addUnit('planck_charge', 'q_P', { current: 1, time: 1 }, 
      new BigNumber('1.875545956e-18'), 'planck');
    
    // Planck energy: sqrt(ℏc⁵/G) ≈ 1.956 × 10^9 J
    this.addUnit('planck_energy', 'E_P', { mass: 1, length: 2, time: -2 }, 
      new BigNumber('1.9561e9'), 'planck');

    // Astronomical units
    this.addUnit('astronomical_unit', 'AU', { length: 1 }, 
      new BigNumber('1.495978707e11'), 'astronomical');
    this.addUnit('light_year', 'ly', { length: 1 }, 
      new BigNumber('9.4607304725808e15'), 'astronomical');
    this.addUnit('parsec', 'pc', { length: 1 }, 
      new BigNumber('3.0856775814913673e16'), 'astronomical');
    this.addUnit('solar_mass', 'M☉', { mass: 1 }, 
      new BigNumber('1.98892e30'), 'astronomical');
    this.addUnit('earth_mass', 'M⊕', { mass: 1 }, 
      new BigNumber('5.97217e24'), 'astronomical');

    this.logger.info('Planck and astronomical units initialized', { count: this.units.size });
  }

  /**
   * Add a unit to the system
   */
  private addUnit(
    name: string, 
    symbol: string, 
    dimension: Partial<Dimension>, 
    conversionFactor: BigNumber,
    category: UnitCategory = 'derived'
  ): void {
    const dim = new DimensionClass(dimension);
    const unit = new Unit({
      name,
      symbol,
      dimension: dim.toObject(),
      conversionFactor,
      offset: BigNumber.zero(),
      isBaseUnit: false,
      category,
      hash: this.hashVerifier.hash(`${name}${symbol}${dim.hash()}`)
    }, this.logger);
    
    this.units.set(symbol, unit);
    this.units.set(name, unit);
  }

  /**
   * Add a unit with temperature-like offset
   */
  private addUnitWithOffset(
    name: string, 
    symbol: string, 
    dimension: Partial<Dimension>, 
    conversionFactor: BigNumber,
    offset: BigNumber
  ): void {
    const dim = new DimensionClass(dimension);
    const unit = new Unit({
      name,
      symbol,
      dimension: dim.toObject(),
      conversionFactor,
      offset,
      isBaseUnit: false,
      category: 'derived',
      hash: this.hashVerifier.hash(`${name}${symbol}${dim.hash()}`)
    }, this.logger);
    
    this.units.set(symbol, unit);
    this.units.set(name, unit);
  }

  /**
   * Get a unit by name or symbol
   */
  getUnit(nameOrSymbol: string): Unit | undefined {
    return this.units.get(nameOrSymbol);
  }

  /**
   * Check if unit exists
   */
  hasUnit(nameOrSymbol: string): boolean {
    return this.units.has(nameOrSymbol);
  }

  /**
   * Get all units
   */
  getAllUnits(): Unit[] {
    const uniqueUnits = new Set<Unit>();
    for (const unit of this.units.values()) {
      uniqueUnits.add(unit);
    }
    return Array.from(uniqueUnits);
  }

  /**
   * Get units by category
   */
  getUnitsByCategory(category: UnitCategory): Unit[] {
    return this.getAllUnits().filter(u => u.category === category);
  }

  /**
   * Create a quantity with value and unit
   */
  createQuantity(value: number | BigNumber, unitNameOrSymbol: string): Quantity {
    const unit = this.getUnit(unitNameOrSymbol);
    if (!unit) {
      throw new Error(`Unknown unit: ${unitNameOrSymbol}`);
    }
    const bigValue = value instanceof BigNumber ? value : new BigNumber(value);
    const hash = this.hashVerifier.hash(`${bigValue.toString()}${unit.symbol}`);
    
    return { value: bigValue, unit, hash };
  }

  /**
   * Convert a value from one unit to another
   */
  convert(value: number | BigNumber, fromUnit: string, toUnit: string): ConversionResult {
    const from = this.getUnit(fromUnit);
    const to = this.getUnit(toUnit);
    
    if (!from) {
      throw new Error(`Unknown unit: ${fromUnit}`);
    }
    if (!to) {
      throw new Error(`Unknown unit: ${toUnit}`);
    }
    
    if (!from.isCompatibleWith(to)) {
      this.logger.warn('Incompatible unit conversion attempted', { fromUnit, toUnit });
      return {
        value: BigNumber.zero(),
        fromUnit,
        toUnit,
        conversionFactor: BigNumber.zero(),
        valid: false,
        hash: '',
        timestamp: new Date().toISOString()
      };
    }
    
    const bigValue = value instanceof BigNumber ? value : new BigNumber(value);
    const factor = from.getConversionFactorTo(to);
    
    // Handle offset for temperature units
    let result: BigNumber;
    if (!from.offset.isZero() || !to.offset.isZero()) {
      // Convert to base unit (Kelvin), then to target
      const baseValue = bigValue.multiply(from.conversionFactor).add(from.offset);
      result = baseValue.subtract(to.offset).divide(to.conversionFactor);
    } else {
      result = bigValue.multiply(factor);
    }
    
    const conversionHash = this.hashVerifier.hash(
      `${bigValue.toString()}${fromUnit}${result.toString()}${toUnit}`
    );
    
    this.logger.debug('Unit conversion performed', {
      from: fromUnit,
      to: toUnit,
      input: bigValue.toString(),
      output: result.toString(),
      factor: factor.toString(),
      hash: conversionHash
    });
    
    return {
      value: result,
      fromUnit,
      toUnit,
      conversionFactor: factor,
      valid: true,
      hash: conversionHash,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Register a custom unit
   */
  registerUnit(definition: Omit<UnitDefinition, 'hash'>): Unit {
    const dim = new DimensionClass(definition.dimension);
    const hash = this.hashVerifier.hash(
      `${definition.name}${definition.symbol}${dim.hash()}${definition.conversionFactor.toString()}`
    );
    
    const unit = new Unit({ ...definition, hash }, this.logger);
    this.units.set(definition.symbol, unit);
    this.units.set(definition.name, unit);
    
    this.logger.info('Custom unit registered', { name: definition.name, symbol: definition.symbol });
    
    return unit;
  }

  /**
   * Apply SI prefix to a unit
   */
  applyPrefix(prefixName: string, unitNameOrSymbol: string): Unit {
    const prefix = SI_PREFIXES[prefixName];
    if (!prefix) {
      throw new Error(`Unknown prefix: ${prefixName}`);
    }
    
    const unit = this.getUnit(unitNameOrSymbol);
    if (!unit) {
      throw new Error(`Unknown unit: ${unitNameOrSymbol}`);
    }
    
    const newFactor = unit.conversionFactor.multiply(prefix.factor);
    const newSymbol = `${prefix.symbol}${unit.symbol}`;
    const newName = `${prefix.name}${unit.name}`;
    
    const dim = unit.dimension;
    const hash = this.hashVerifier.hash(`${newName}${newSymbol}${dim.hash()}`);
    
    const newUnit = new Unit({
      name: newName,
      symbol: newSymbol,
      dimension: dim.toObject(),
      conversionFactor: newFactor,
      offset: unit.offset,
      isBaseUnit: false,
      category: unit.category,
      hash
    }, this.logger);
    
    // Optionally add to registry
    this.units.set(newSymbol, newUnit);
    this.units.set(newName, newUnit);
    
    return newUnit;
  }

  /**
   * Export unit system to JSON
   */
  exportToJson(): object {
    const units: Record<string, UnitDefinition> = {};
    const uniqueUnits = new Set<Unit>();
    
    for (const unit of this.units.values()) {
      uniqueUnits.add(unit);
    }
    
    for (const unit of uniqueUnits) {
      units[unit.symbol] = unit.toJSON();
    }
    
    return {
      version: '1.0.0',
      unitCount: uniqueUnits.size,
      units,
      hash: this.hashVerifier.hash(JSON.stringify(units))
    };
  }
}

// ============================================================================
// DIMENSIONAL ANALYSIS
// ============================================================================

/**
 * Dimensional Analysis utility class
 */
export class DimensionalAnalysis {
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger ?? Logger.getInstance({ minLevel: LogLevel.INFO });
  }

  /**
   * Check if two quantities can be added/subtracted
   */
  canAdd(a: Quantity, b: Quantity): boolean {
    return a.unit.dimension.equals(b.unit.dimension);
  }

  /**
   * Check if an expression is dimensionally consistent
   */
  checkConsistency(
    expected: Dimension,
    actual: Dimension
  ): DimensionalAnalysisResult {
    const expectedDim = new DimensionClass(expected);
    const actualDim = new DimensionClass(actual);
    
    const consistent = expectedDim.equals(actualDim);
    const mismatch: string[] = [];
    
    if (expected.length !== actual.length) mismatch.push('length');
    if (expected.mass !== actual.mass) mismatch.push('mass');
    if (expected.time !== actual.time) mismatch.push('time');
    if (expected.current !== actual.current) mismatch.push('current');
    if (expected.temperature !== actual.temperature) mismatch.push('temperature');
    if (expected.amount !== actual.amount) mismatch.push('amount');
    if (expected.luminosity !== actual.luminosity) mismatch.push('luminosity');
    
    const hash = HashVerifier.hash(
      `${expectedDim.hash()}${actualDim.hash()}${consistent}`
    );
    
    if (!consistent) {
      this.logger.warn('Dimensional inconsistency detected', {
        expected: expectedDim.toString(),
        actual: actualDim.toString(),
        mismatch
      });
    }
    
    return {
      consistent,
      expectedDimension: expected,
      actualDimension: actual,
      mismatch,
      hash
    };
  }

  /**
   * Compute the dimension of a product
   */
  multiplyDimensions(a: Dimension, b: Dimension): Dimension {
    return new DimensionClass(a).multiply(b).toObject();
  }

  /**
   * Compute the dimension of a quotient
   */
  divideDimensions(a: Dimension, b: Dimension): Dimension {
    return new DimensionClass(a).divide(b).toObject();
  }

  /**
   * Compute the dimension of a power
   */
  powerDimension(dim: Dimension, power: number): Dimension {
    return new DimensionClass(dim).pow(power).toObject();
  }

  /**
   * Check if dimension is dimensionless
   */
  isDimensionless(dim: Dimension): boolean {
    return new DimensionClass(dim).isDimensionless();
  }

  /**
   * Get the dimension string (human readable)
   */
  getDimensionString(dim: Dimension): string {
    return new DimensionClass(dim).toString();
  }

  /**
   * Infer the physical quantity from its dimension
   */
  inferQuantityType(dim: Dimension): string {
    const d = new DimensionClass(dim);
    
    // Check common physical quantities
    if (d.isDimensionless()) return 'dimensionless';
    if (d.equals(DimensionClass.forLength())) return 'length';
    if (d.equals(DimensionClass.mass())) return 'mass';
    if (d.equals(DimensionClass.time())) return 'time';
    if (d.equals(DimensionClass.current())) return 'electric current';
    if (d.equals(DimensionClass.temperature())) return 'temperature';
    if (d.equals(DimensionClass.amount())) return 'amount of substance';
    if (d.equals(DimensionClass.luminosity())) return 'luminous intensity';
    if (d.equals(DimensionClass.velocity())) return 'velocity';
    if (d.equals(DimensionClass.acceleration())) return 'acceleration';
    if (d.equals(DimensionClass.force())) return 'force';
    if (d.equals(DimensionClass.energy())) return 'energy';
    if (d.equals(DimensionClass.power())) return 'power';
    if (d.equals(DimensionClass.pressure())) return 'pressure';
    if (d.equals(DimensionClass.frequency())) return 'frequency';
    if (d.equals(DimensionClass.charge())) return 'electric charge';
    if (d.equals(DimensionClass.voltage())) return 'electric potential';
    if (d.equals(DimensionClass.resistance())) return 'electric resistance';
    if (d.equals(DimensionClass.action())) return 'action';
    
    return 'unknown';
  }
}

// ============================================================================
// UNIT CONVERTER (STANDALONE)
// ============================================================================

/**
 * Standalone unit converter for quick conversions
 */
export class UnitConverter {
  private unitSystem: UnitSystem;

  constructor(unitSystem?: UnitSystem) {
    this.unitSystem = unitSystem ?? new UnitSystem();
  }

  /**
   * Convert between units
   */
  convert(value: number | BigNumber, from: string, to: string): BigNumber {
    const result = this.unitSystem.convert(value, from, to);
    if (!result.valid) {
      throw new Error(`Cannot convert from ${from} to ${to}`);
    }
    return result.value;
  }

  /**
   * Quick length conversion
   */
  length(value: number, from: string, to: string): number {
    return this.convert(value, from, to).toNumber();
  }

  /**
   * Quick mass conversion
   */
  mass(value: number, from: string, to: string): number {
    return this.convert(value, from, to).toNumber();
  }

  /**
   * Quick time conversion
   */
  time(value: number, from: string, to: string): number {
    return this.convert(value, from, to).toNumber();
  }

  /**
   * Quick temperature conversion
   */
  temperature(value: number, from: string, to: string): number {
    return this.convert(value, from, to).toNumber();
  }

  /**
   * Quick energy conversion
   */
  energy(value: number, from: string, to: string): number {
    return this.convert(value, from, to).toNumber();
  }

  /**
   * Get conversion factor between two units
   */
  getConversionFactor(from: string, to: string): BigNumber {
    const fromUnit = this.unitSystem.getUnit(from);
    const toUnit = this.unitSystem.getUnit(to);
    
    if (!fromUnit || !toUnit) {
      throw new Error('Unknown unit');
    }
    
    return fromUnit.getConversionFactorTo(toUnit);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { Dimension as DimensionInterface };
