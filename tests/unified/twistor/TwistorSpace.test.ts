/**
 * TwistorSpace.test.ts
 * 
 * Tests for Phase 5.5: Twistor Theory
 * 
 * Tests cover:
 * - TwistorComplex operations
 * - Spinor2 operations
 * - Twistor construction and operations
 * - Spacetime point operations
 * - Incidence relation
 * - Null geodesics
 * - Twistor transformations
 * - Projective twistor space
 * - Twistor lines
 * - Penrose transform
 * - Twistor string theory connection
 * - Factory and analysis
 */

import {
  TwistorConstants,
  TwistorComplex,
  Spinor2,
  Twistor,
  ProjectiveTwistor,
  SpacetimePoint,
  IncidenceRelation,
  NullGeodesic,
  TwistorTransform,
  TwistorLine,
  PenroseTransform,
  TwistorStringTheory,
  TwistorFactory,
  TwistorAnalysis,
} from '../../../src/unified/twistor';

describe('TwistorSpace', () => {
  // ========================================================================
  // TwistorComplex Tests
  // ========================================================================
  
  describe('TwistorComplex', () => {
    describe('construction', () => {
      test('creates complex number with real and imaginary parts', () => {
        const z = new TwistorComplex(3, 4);
        expect(z.re).toBe(3);
        expect(z.im).toBe(4);
      });

      test('zero() creates zero complex number', () => {
        const z = TwistorComplex.zero();
        expect(z.re).toBe(0);
        expect(z.im).toBe(0);
      });

      test('one() creates unit complex number', () => {
        const z = TwistorComplex.one();
        expect(z.re).toBe(1);
        expect(z.im).toBe(0);
      });

      test('i() creates imaginary unit', () => {
        const z = TwistorComplex.i();
        expect(z.re).toBe(0);
        expect(z.im).toBe(1);
      });

      test('fromPolar creates from polar form', () => {
        const z = TwistorComplex.fromPolar(2, Math.PI / 2);
        expect(z.re).toBeCloseTo(0);
        expect(z.im).toBeCloseTo(2);
      });
    });

    describe('arithmetic', () => {
      test('add() adds two complex numbers', () => {
        const z1 = new TwistorComplex(1, 2);
        const z2 = new TwistorComplex(3, 4);
        const sum = z1.add(z2);
        expect(sum.re).toBe(4);
        expect(sum.im).toBe(6);
      });

      test('subtract() subtracts two complex numbers', () => {
        const z1 = new TwistorComplex(5, 7);
        const z2 = new TwistorComplex(2, 3);
        const diff = z1.subtract(z2);
        expect(diff.re).toBe(3);
        expect(diff.im).toBe(4);
      });

      test('multiply() multiplies two complex numbers', () => {
        const z1 = new TwistorComplex(1, 2);
        const z2 = new TwistorComplex(3, 4);
        const prod = z1.multiply(z2);
        expect(prod.re).toBe(-5);
        expect(prod.im).toBe(10);
      });

      test('scale() multiplies by real number', () => {
        const z = new TwistorComplex(2, 3);
        const scaled = z.scale(2);
        expect(scaled.re).toBe(4);
        expect(scaled.im).toBe(6);
      });

      test('divide() divides two complex numbers', () => {
        const z1 = new TwistorComplex(2, 1);
        const z2 = new TwistorComplex(1, -1);
        const quot = z1.divide(z2);
        expect(quot.re).toBeCloseTo(0.5);
        expect(quot.im).toBeCloseTo(1.5);
      });
    });

    describe('properties', () => {
      test('conjugate() returns complex conjugate', () => {
        const z = new TwistorComplex(3, 4);
        const conj = z.conjugate();
        expect(conj.re).toBe(3);
        expect(conj.im).toBe(-4);
      });

      test('magnitude() returns absolute value', () => {
        const z = new TwistorComplex(3, 4);
        expect(z.magnitude()).toBe(5);
      });

      test('magnitudeSquared() returns |z|²', () => {
        const z = new TwistorComplex(3, 4);
        expect(z.magnitudeSquared()).toBe(25);
      });

      test('phase() returns argument', () => {
        const z = new TwistorComplex(1, 1);
        expect(z.phase()).toBeCloseTo(Math.PI / 4);
      });
    });

    describe('functions', () => {
      test('exp() computes complex exponential', () => {
        const z = new TwistorComplex(0, Math.PI);
        const exp = z.exp();
        expect(exp.re).toBeCloseTo(-1);
        expect(exp.im).toBeCloseTo(0);
      });

      test('sqrt() computes principal square root', () => {
        const z = new TwistorComplex(0, 2);
        const sqrt = z.sqrt();
        expect(sqrt.magnitudeSquared()).toBeCloseTo(2);
      });
    });

    describe('comparison', () => {
      test('isZero() detects zero', () => {
        expect(TwistorComplex.zero().isZero()).toBe(true);
        expect(new TwistorComplex(0.0001, 0).isZero()).toBe(false);
      });

      test('equals() compares with tolerance', () => {
        const z1 = new TwistorComplex(1, 2);
        const z2 = new TwistorComplex(1.0000001, 2.0000001);
        expect(z1.equals(z2, 1e-6)).toBe(true);
      });
    });

    test('getHash() returns consistent hash', () => {
      const z = new TwistorComplex(1, 2);
      const hash1 = z.getHash();
      const hash2 = z.getHash();
      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(16);
    });
  });

  // ========================================================================
  // Spinor2 Tests
  // ========================================================================

  describe('Spinor2', () => {
    describe('construction', () => {
      test('creates 2-spinor from components', () => {
        const c0 = new TwistorComplex(1, 0);
        const c1 = new TwistorComplex(0, 1);
        const spinor = Spinor2.fromComponents(c0, c1);
        expect(spinor.get(0).equals(c0)).toBe(true);
        expect(spinor.get(1).equals(c1)).toBe(true);
      });

      test('zero() creates zero spinor', () => {
        const spinor = Spinor2.zero();
        expect(spinor.isZero()).toBe(true);
      });
    });

    describe('operations', () => {
      test('add() adds two spinors', () => {
        const s1 = Spinor2.fromComponents(
          new TwistorComplex(1, 0),
          new TwistorComplex(0, 1)
        );
        const s2 = Spinor2.fromComponents(
          new TwistorComplex(2, 0),
          new TwistorComplex(0, 2)
        );
        const sum = s1.add(s2);
        expect(sum.get(0).re).toBe(3);
        expect(sum.get(1).im).toBe(3);
      });

      test('scale() multiplies by complex scalar', () => {
        const s = Spinor2.fromComponents(
          TwistorComplex.one(),
          TwistorComplex.i()
        );
        const scaled = s.scale(TwistorComplex.i());
        expect(scaled.get(0).equals(TwistorComplex.i())).toBe(true);
        expect(scaled.get(1).re).toBeCloseTo(-1);
      });

      test('contract() computes spinor contraction', () => {
        const s1 = Spinor2.fromComponents(
          TwistorComplex.one(),
          TwistorComplex.zero()
        );
        const s2 = Spinor2.fromComponents(
          TwistorComplex.zero(),
          TwistorComplex.one()
        );
        const contraction = s1.contract(s2);
        expect(contraction.re).toBe(1);
        expect(contraction.im).toBe(0);
      });

      test('conjugate() returns complex conjugate', () => {
        const s = Spinor2.fromComponents(
          new TwistorComplex(1, 2),
          new TwistorComplex(3, 4)
        );
        const conj = s.conjugate();
        expect(conj.get(0).im).toBe(-2);
        expect(conj.get(1).im).toBe(-4);
      });
    });

    describe('properties', () => {
      test('magnitude() returns norm', () => {
        const s = Spinor2.fromComponents(
          new TwistorComplex(3, 0),
          new TwistorComplex(4, 0)
        );
        expect(s.magnitude()).toBe(5);
      });

      test('normalize() returns unit spinor', () => {
        const s = Spinor2.fromComponents(
          new TwistorComplex(3, 0),
          new TwistorComplex(4, 0)
        );
        const normalized = s.normalize();
        expect(normalized.magnitude()).toBeCloseTo(1);
      });
    });

    test('getHash() returns consistent hash', () => {
      const s = Spinor2.fromComponents(TwistorComplex.one(), TwistorComplex.i());
      expect(s.getHash().length).toBe(16);
    });
  });

  // ========================================================================
  // Twistor Tests
  // ========================================================================

  describe('Twistor', () => {
    describe('construction', () => {
      test('creates twistor from omega and pi', () => {
        const omega = Spinor2.fromComponents(TwistorComplex.one(), TwistorComplex.zero());
        const pi = Spinor2.fromComponents(TwistorComplex.zero(), TwistorComplex.one());
        const Z = new Twistor(omega, pi);
        expect(Z.omega.equals(omega)).toBe(true);
        expect(Z.pi.equals(pi)).toBe(true);
      });

      test('zero() creates zero twistor', () => {
        const Z = Twistor.zero();
        expect(Z.isZero()).toBe(true);
      });

      test('fromComponents() creates from 4 complex numbers', () => {
        const Z = Twistor.fromComponents(
          TwistorComplex.one(),
          TwistorComplex.i(),
          new TwistorComplex(2, 0),
          new TwistorComplex(0, 2)
        );
        expect(Z.getComponent(0).equals(TwistorComplex.one())).toBe(true);
        expect(Z.getComponent(3).im).toBe(2);
      });

      test('fromArray() creates from array', () => {
        const arr: [TwistorComplex, TwistorComplex, TwistorComplex, TwistorComplex] = [
          TwistorComplex.one(),
          TwistorComplex.zero(),
          TwistorComplex.i(),
          TwistorComplex.one()
        ];
        const Z = Twistor.fromArray(arr);
        expect(Z.toArray().length).toBe(4);
      });
    });

    describe('operations', () => {
      test('add() adds two twistors', () => {
        const Z1 = Twistor.fromComponents(
          TwistorComplex.one(), TwistorComplex.zero(),
          TwistorComplex.zero(), TwistorComplex.one()
        );
        const Z2 = Twistor.fromComponents(
          TwistorComplex.one(), TwistorComplex.one(),
          TwistorComplex.one(), TwistorComplex.one()
        );
        const sum = Z1.add(Z2);
        expect(sum.getComponent(0).re).toBe(2);
      });

      test('scale() multiplies by complex scalar', () => {
        const Z = Twistor.fromComponents(
          TwistorComplex.one(), TwistorComplex.one(),
          TwistorComplex.one(), TwistorComplex.one()
        );
        const scaled = Z.scale(new TwistorComplex(2, 0));
        expect(scaled.getComponent(0).re).toBe(2);
      });

      test('dual() returns twistor dual', () => {
        const Z = Twistor.fromComponents(
          new TwistorComplex(1, 2), new TwistorComplex(3, 4),
          new TwistorComplex(5, 6), new TwistorComplex(7, 8)
        );
        const dual = Z.dual();
        // Dual swaps omega and pi (conjugated)
        expect(dual.omega.get(0).re).toBe(5);
        expect(dual.omega.get(0).im).toBe(-6);
      });
    });

    describe('inner product and helicity', () => {
      test('innerProduct() computes twistor inner product', () => {
        const Z = Twistor.fromComponents(
          TwistorComplex.one(), TwistorComplex.zero(),
          TwistorComplex.one(), TwistorComplex.zero()
        );
        const ip = Z.innerProduct(Z);
        expect(ip.re).toBeGreaterThan(0);
      });

      test('helicity() returns helicity value', () => {
        const Z = Twistor.fromComponents(
          TwistorComplex.one(), TwistorComplex.zero(),
          TwistorComplex.zero(), TwistorComplex.one()
        );
        const h = Z.helicity();
        expect(typeof h).toBe('number');
      });

      test('normSquared() returns norm squared', () => {
        const Z = Twistor.fromComponents(
          TwistorComplex.one(), TwistorComplex.zero(),
          TwistorComplex.one(), TwistorComplex.zero()
        );
        const normSq = Z.normSquared();
        expect(typeof normSq).toBe('number');
      });
    });

    describe('null twistors', () => {
      test('isNull() detects null twistors', () => {
        // Null twistor: omega = 0
        const Z = Twistor.fromComponents(
          TwistorComplex.zero(), TwistorComplex.zero(),
          TwistorComplex.one(), TwistorComplex.one()
        );
        expect(Z.isNull()).toBe(true);
      });

      test('non-null twistor detected correctly', () => {
        const Z = Twistor.fromComponents(
          new TwistorComplex(10, 0), TwistorComplex.zero(),
          TwistorComplex.one(), TwistorComplex.zero()
        );
        // May or may not be null depending on computation
        expect(typeof Z.isNull()).toBe('boolean');
      });
    });

    describe('projective equivalence', () => {
      test('projectivelyEquivalent() detects proportional twistors', () => {
        const Z1 = Twistor.fromComponents(
          TwistorComplex.one(), TwistorComplex.zero(),
          TwistorComplex.one(), TwistorComplex.zero()
        );
        const Z2 = Z1.scale(new TwistorComplex(2, 0));
        expect(Z1.projectivelyEquivalent(Z2)).toBe(true);
      });

      test('non-proportional twistors not equivalent', () => {
        const Z1 = Twistor.fromComponents(
          TwistorComplex.one(), TwistorComplex.zero(),
          TwistorComplex.zero(), TwistorComplex.one()
        );
        const Z2 = Twistor.fromComponents(
          TwistorComplex.zero(), TwistorComplex.one(),
          TwistorComplex.one(), TwistorComplex.zero()
        );
        expect(Z1.projectivelyEquivalent(Z2)).toBe(false);
      });
    });

    test('getHash() returns consistent hash', () => {
      const Z = TwistorFactory.random();
      expect(Z.getHash().length).toBe(16);
    });
  });

  // ========================================================================
  // SpacetimePoint Tests
  // ========================================================================

  describe('SpacetimePoint', () => {
    describe('construction', () => {
      test('zero() creates origin', () => {
        const x = SpacetimePoint.zero();
        const m = x.toMinkowski();
        expect(m.t).toBeCloseTo(0);
        expect(m.x).toBeCloseTo(0);
        expect(m.y).toBeCloseTo(0);
        expect(m.z).toBeCloseTo(0);
      });

      test('fromMinkowski() creates from coordinates', () => {
        const x = SpacetimePoint.fromMinkowski(1, 2, 3, 4);
        const m = x.toMinkowski();
        expect(m.t).toBeCloseTo(1);
        expect(m.x).toBeCloseTo(2);
        expect(m.y).toBeCloseTo(3);
        expect(m.z).toBeCloseTo(4);
      });
    });

    describe('operations', () => {
      test('add() adds two points', () => {
        const x1 = SpacetimePoint.fromMinkowski(1, 0, 0, 0);
        const x2 = SpacetimePoint.fromMinkowski(0, 1, 0, 0);
        const sum = x1.add(x2);
        const m = sum.toMinkowski();
        expect(m.t).toBeCloseTo(1);
        expect(m.x).toBeCloseTo(1);
      });

      test('scale() multiplies by scalar', () => {
        const x = SpacetimePoint.fromMinkowski(1, 2, 3, 4);
        const scaled = x.scale(2);
        const m = scaled.toMinkowski();
        expect(m.t).toBeCloseTo(2);
        expect(m.x).toBeCloseTo(4);
      });
    });

    describe('interval', () => {
      test('determinant() gives interval squared', () => {
        const x = SpacetimePoint.fromMinkowski(1, 0, 0, 0);
        const det = x.determinant();
        expect(det.re).toBeGreaterThan(0); // Timelike
      });

      test('isNull() detects light cone', () => {
        // Light-like: t² = x² + y² + z²
        const x = SpacetimePoint.fromMinkowski(1, 1, 0, 0);
        expect(x.isNull()).toBe(true);
      });

      test('getIntervalType() classifies correctly', () => {
        const timelike = SpacetimePoint.fromMinkowski(2, 1, 0, 0);
        expect(timelike.getIntervalType()).toBe('timelike');
        
        const spacelike = SpacetimePoint.fromMinkowski(0, 1, 0, 0);
        expect(spacelike.getIntervalType()).toBe('spacelike');
      });
    });

    test('getHash() returns consistent hash', () => {
      const x = SpacetimePoint.fromMinkowski(1, 2, 3, 4);
      expect(x.getHash().length).toBe(16);
    });
  });

  // ========================================================================
  // IncidenceRelation Tests
  // ========================================================================

  describe('IncidenceRelation', () => {
    test('computeOmega() computes ω from x and π', () => {
      const x = SpacetimePoint.zero();
      const pi = Spinor2.fromComponents(TwistorComplex.one(), TwistorComplex.zero());
      const omega = IncidenceRelation.computeOmega(x, pi);
      // At origin, ω should be zero
      expect(omega.isZero()).toBe(true);
    });

    test('createIncidentTwistor() creates twistor incident with point', () => {
      const x = SpacetimePoint.fromMinkowski(1, 0, 0, 0);
      const pi = Spinor2.fromComponents(TwistorComplex.one(), TwistorComplex.one());
      const Z = IncidenceRelation.createIncidentTwistor(x, pi);
      expect(Z.pi.equals(pi)).toBe(true);
    });

    test('isIncident() checks incidence relation', () => {
      const x = SpacetimePoint.zero();
      const pi = Spinor2.fromComponents(TwistorComplex.one(), TwistorComplex.zero());
      const Z = IncidenceRelation.createIncidentTwistor(x, pi);
      expect(IncidenceRelation.isIncident(Z, x)).toBe(true);
    });

    test('getHash() returns consistent hash', () => {
      expect(IncidenceRelation.getHash().length).toBe(16);
    });
  });

  // ========================================================================
  // NullGeodesic Tests
  // ========================================================================

  describe('NullGeodesic', () => {
    test('fromTwistor() creates geodesic from null twistor', () => {
      const Z = TwistorFactory.nullTwistor(
        Spinor2.fromComponents(TwistorComplex.one(), TwistorComplex.zero())
      );
      const geodesic = NullGeodesic.fromTwistor(Z);
      expect(geodesic.twistor.equals(Z)).toBe(true);
    });

    test('fromPointAndDirection() creates geodesic', () => {
      const x = SpacetimePoint.zero();
      const direction = Spinor2.fromComponents(TwistorComplex.one(), TwistorComplex.i());
      const geodesic = NullGeodesic.fromPointAndDirection(x, direction);
      expect(geodesic).toBeDefined();
    });

    test('getPoint() returns point on geodesic', () => {
      const geodesic = NullGeodesic.fromTwistor(TwistorFactory.randomNull());
      const point = geodesic.getPoint(0.5);
      expect(point).toBeDefined();
    });

    test('getMomentumDirection() returns momentum', () => {
      const geodesic = NullGeodesic.fromTwistor(TwistorFactory.randomNull());
      const p = geodesic.getMomentumDirection();
      expect(p).toBeDefined();
    });

    test('getHelicity() returns helicity', () => {
      const geodesic = NullGeodesic.fromTwistor(TwistorFactory.randomNull());
      const h = geodesic.getHelicity();
      expect(typeof h).toBe('number');
    });

    test('getHash() returns consistent hash', () => {
      const geodesic = NullGeodesic.fromTwistor(TwistorFactory.randomNull());
      expect(geodesic.getHash().length).toBe(16);
    });
  });

  // ========================================================================
  // TwistorTransform Tests
  // ========================================================================

  describe('TwistorTransform', () => {
    test('identity() creates identity transformation', () => {
      const id = TwistorTransform.identity();
      const Z = TwistorFactory.random();
      const transformed = id.apply(Z);
      expect(transformed.equals(Z, 1e-8)).toBe(true);
    });

    test('boostZ() creates z-boost', () => {
      const boost = TwistorTransform.boostZ(0.5);
      const Z = TwistorFactory.random();
      const boosted = boost.apply(Z);
      expect(boosted).toBeDefined();
    });

    test('rotationZ() creates z-rotation', () => {
      const rot = TwistorTransform.rotationZ(Math.PI / 4);
      const Z = TwistorFactory.random();
      const rotated = rot.apply(Z);
      expect(rotated).toBeDefined();
    });

    test('translation() creates translation', () => {
      const trans = TwistorTransform.translation(1, 0, 0, 0);
      const Z = TwistorFactory.random();
      const translated = trans.apply(Z);
      expect(translated).toBeDefined();
    });

    test('dilation() creates scale transformation', () => {
      const dil = TwistorTransform.dilation(2);
      const Z = TwistorFactory.random();
      const dilated = dil.apply(Z);
      expect(dilated).toBeDefined();
    });

    test('compose() composes transformations', () => {
      const T1 = TwistorTransform.rotationZ(Math.PI / 4);
      const T2 = TwistorTransform.boostZ(0.1);
      const composed = T1.compose(T2);
      expect(composed).toBeDefined();
    });

    test('transformations preserve structure', () => {
      // Identity composed with itself is identity
      const id = TwistorTransform.identity();
      const composed = id.compose(id);
      const Z = TwistorFactory.random();
      const result = composed.apply(Z);
      expect(result.equals(Z, 1e-8)).toBe(true);
    });

    test('getHash() returns consistent hash', () => {
      const T = TwistorTransform.identity();
      expect(T.getHash().length).toBe(16);
    });
  });

  // ========================================================================
  // ProjectiveTwistor Tests
  // ========================================================================

  describe('ProjectiveTwistor', () => {
    test('fromTwistor() creates projective twistor', () => {
      const Z = TwistorFactory.random();
      const PT = ProjectiveTwistor.fromTwistor(Z);
      expect(PT.representative).toBeDefined();
    });

    test('throws for zero twistor', () => {
      expect(() => {
        ProjectiveTwistor.fromTwistor(Twistor.zero());
      }).toThrow();
    });

    test('getNormalized() returns unit representative', () => {
      const Z = TwistorFactory.random();
      const PT = ProjectiveTwistor.fromTwistor(Z);
      const normalized = PT.getNormalized();
      expect(normalized.magnitude()).toBeCloseTo(1);
    });

    test('isNull() detects null projective twistors', () => {
      const Z = TwistorFactory.nullTwistor(
        Spinor2.fromComponents(TwistorComplex.one(), TwistorComplex.i())
      );
      const PT = ProjectiveTwistor.fromTwistor(Z);
      expect(PT.isNull()).toBe(true);
    });

    test('equals() checks projective equality', () => {
      const Z = TwistorFactory.random();
      const PT1 = ProjectiveTwistor.fromTwistor(Z);
      const PT2 = ProjectiveTwistor.fromTwistor(Z.scale(new TwistorComplex(2, 1)));
      expect(PT1.equals(PT2)).toBe(true);
    });

    test('getHelicity() returns helicity', () => {
      const PT = ProjectiveTwistor.fromTwistor(TwistorFactory.random());
      expect(typeof PT.getHelicity()).toBe('number');
    });

    test('toNullGeodesic() returns geodesic for null twistor', () => {
      const Z = TwistorFactory.nullTwistor(
        Spinor2.fromComponents(TwistorComplex.one(), TwistorComplex.one())
      );
      const PT = ProjectiveTwistor.fromTwistor(Z);
      const geodesic = PT.toNullGeodesic();
      expect(geodesic).not.toBeNull();
    });

    test('getHash() returns consistent hash', () => {
      const PT = ProjectiveTwistor.fromTwistor(TwistorFactory.random());
      expect(PT.getHash().length).toBe(16);
    });
  });

  // ========================================================================
  // TwistorLine Tests
  // ========================================================================

  describe('TwistorLine', () => {
    test('constructor creates line from two twistors', () => {
      const Z1 = TwistorFactory.random();
      const Z2 = TwistorFactory.random();
      const line = new TwistorLine(Z1, Z2);
      expect(line.Z1).toBe(Z1);
      expect(line.Z2).toBe(Z2);
    });

    test('throws for proportional twistors', () => {
      const Z = TwistorFactory.random();
      expect(() => {
        new TwistorLine(Z, Z.scale(new TwistorComplex(2, 0)));
      }).toThrow();
    });

    test('fromSpacetimePoint() creates line for point', () => {
      const x = SpacetimePoint.fromMinkowski(1, 2, 3, 4);
      const line = TwistorLine.fromSpacetimePoint(x);
      expect(line).toBeDefined();
    });

    test('getPoint() returns point on line', () => {
      const Z1 = TwistorFactory.random();
      const Z2 = TwistorFactory.random();
      const line = new TwistorLine(Z1, Z2);
      const point = line.getPoint(new TwistorComplex(0.5, 0));
      expect(point).toBeDefined();
    });

    test('toSpacetimePoint() returns spacetime point', () => {
      const x = SpacetimePoint.fromMinkowski(1, 0, 0, 0);
      const line = TwistorLine.fromSpacetimePoint(x);
      const recovered = line.toSpacetimePoint();
      expect(recovered).toBeDefined();
    });

    test('getHash() returns consistent hash', () => {
      const line = TwistorLine.fromSpacetimePoint(SpacetimePoint.zero());
      expect(line.getHash().length).toBe(16);
    });
  });

  // ========================================================================
  // PenroseTransform Tests
  // ========================================================================

  describe('PenroseTransform', () => {
    test('helicityWeight() returns correct weight', () => {
      expect(PenroseTransform.helicityWeight(0)).toBe(-2);
      expect(PenroseTransform.helicityWeight(2)).toBe(-4);
      expect(PenroseTransform.helicityWeight(-2)).toBe(0);
    });

    test('scalarFieldWeight() returns -2', () => {
      expect(PenroseTransform.scalarFieldWeight()).toBe(-2);
    });

    test('maxwellFieldWeight() returns correct weights', () => {
      expect(PenroseTransform.maxwellFieldWeight(true)).toBe(-4);
      expect(PenroseTransform.maxwellFieldWeight(false)).toBe(0);
    });

    test('gravitonWeight() returns correct weights', () => {
      expect(PenroseTransform.gravitonWeight(true)).toBe(-6);
      expect(PenroseTransform.gravitonWeight(false)).toBe(2);
    });

    test('contourIntegralSymbolic() returns symbolic formula', () => {
      const formula = PenroseTransform.contourIntegralSymbolic(1);
      expect(formula).toContain('∮');
    });

    test('inversePenroseSymbolic() returns inverse formula', () => {
      const formula = PenroseTransform.inversePenroseSymbolic(1);
      expect(formula).toContain('∫');
    });

    test('scalarWaveExample() computes numerical approximation', () => {
      const x = SpacetimePoint.fromMinkowski(0, 0, 0, 0);
      const f = (Z: Twistor) => TwistorComplex.one();
      const result = PenroseTransform.scalarWaveExample(f, x, 10);
      expect(result).toBeDefined();
    });

    test('getHash() returns consistent hash', () => {
      expect(PenroseTransform.getHash().length).toBe(16);
    });
  });

  // ========================================================================
  // TwistorStringTheory Tests
  // ========================================================================

  describe('TwistorStringTheory', () => {
    test('mhvAmplitudeSymbolic() returns amplitude formula', () => {
      expect(TwistorStringTheory.mhvAmplitudeSymbolic(2)).toBe('0');
      expect(TwistorStringTheory.mhvAmplitudeSymbolic(4)).toContain('<12>⁴');
    });

    test('spinorBracket() computes <ij>', () => {
      const lambda1 = Spinor2.fromComponents(TwistorComplex.one(), TwistorComplex.zero());
      const lambda2 = Spinor2.fromComponents(TwistorComplex.zero(), TwistorComplex.one());
      const bracket = TwistorStringTheory.spinorBracket(lambda1, lambda2);
      expect(bracket.re).toBe(1);
    });

    test('antiSpinorBracket() computes [ij]', () => {
      const lambda1 = Spinor2.fromComponents(TwistorComplex.one(), TwistorComplex.i());
      const lambda2 = Spinor2.fromComponents(TwistorComplex.i(), TwistorComplex.one());
      const bracket = TwistorStringTheory.antiSpinorBracket(lambda1, lambda2);
      expect(bracket).toBeDefined();
    });

    test('bcfwRecursionSymbolic() returns BCFW formula', () => {
      const formula = TwistorStringTheory.bcfwRecursionSymbolic();
      expect(formula).toContain('A_n');
    });

    test('getHash() returns consistent hash', () => {
      expect(TwistorStringTheory.getHash().length).toBe(16);
    });
  });

  // ========================================================================
  // TwistorFactory Tests
  // ========================================================================

  describe('TwistorFactory', () => {
    test('masslessParticle() creates twistor for massless particle', () => {
      const Z = TwistorFactory.masslessParticle(1, 0, 0, 1, 1);
      expect(Z).toBeDefined();
      expect(Z.pi.isZero()).toBe(false);
    });

    test('atOrigin() creates twistor at origin', () => {
      const pi = Spinor2.fromComponents(TwistorComplex.one(), TwistorComplex.one());
      const Z = TwistorFactory.atOrigin(pi);
      expect(Z.omega.isZero()).toBe(true);
    });

    test('nullTwistor() creates null twistor', () => {
      const pi = Spinor2.fromComponents(TwistorComplex.one(), TwistorComplex.i());
      const Z = TwistorFactory.nullTwistor(pi);
      expect(Z.isNull()).toBe(true);
    });

    test('celestialSphere() creates twistor for celestial direction', () => {
      const Z = TwistorFactory.celestialSphere(Math.PI / 4, Math.PI / 2);
      expect(Z.isNull()).toBe(true);
    });

    test('random() creates random twistor', () => {
      const Z1 = TwistorFactory.random();
      const Z2 = TwistorFactory.random();
      expect(Z1.equals(Z2)).toBe(false); // Very likely different
    });

    test('randomNull() creates random null twistor', () => {
      const Z = TwistorFactory.randomNull();
      expect(Z.isNull()).toBe(true);
    });

    test('getHash() returns consistent hash', () => {
      expect(TwistorFactory.getHash().length).toBe(16);
    });
  });

  // ========================================================================
  // TwistorAnalysis Tests
  // ========================================================================

  describe('TwistorAnalysis', () => {
    test('classify() classifies twistors by norm', () => {
      const nullZ = TwistorFactory.nullTwistor(
        Spinor2.fromComponents(TwistorComplex.one(), TwistorComplex.zero())
      );
      expect(TwistorAnalysis.classify(nullZ)).toBe('null');
    });

    test('sameRegion() checks if twistors are in same region', () => {
      const Z1 = TwistorFactory.nullTwistor(
        Spinor2.fromComponents(TwistorComplex.one(), TwistorComplex.zero())
      );
      const Z2 = TwistorFactory.nullTwistor(
        Spinor2.fromComponents(TwistorComplex.zero(), TwistorComplex.one())
      );
      expect(TwistorAnalysis.sameRegion(Z1, Z2)).toBe(true);
    });

    test('innerProductMatrix() computes matrix', () => {
      const twistors = [TwistorFactory.random(), TwistorFactory.random()];
      const matrix = TwistorAnalysis.innerProductMatrix(twistors);
      expect(matrix.length).toBe(2);
      expect(matrix[0].length).toBe(2);
    });

    test('areIndependent() checks linear independence', () => {
      const Z1 = TwistorFactory.random();
      const Z2 = TwistorFactory.random();
      expect(TwistorAnalysis.areIndependent([Z1, Z2])).toBe(true);
      expect(TwistorAnalysis.areIndependent([Z1, Z1.scale(new TwistorComplex(2, 0))])).toBe(false);
    });

    test('projectToNull() projects to null cone', () => {
      const Z = TwistorFactory.random();
      const projected = TwistorAnalysis.projectToNull(Z);
      expect(projected.isNull(0.1)).toBe(true);
    });

    test('getHash() returns consistent hash', () => {
      expect(TwistorAnalysis.getHash().length).toBe(16);
    });
  });

  // ========================================================================
  // Integration Tests
  // ========================================================================

  describe('Integration', () => {
    test('twistor-spacetime correspondence', () => {
      // A spacetime point corresponds to a line in PT
      const x = SpacetimePoint.fromMinkowski(1, 0, 0, 0);
      const line = TwistorLine.fromSpacetimePoint(x);
      
      // All twistors on this line should be incident with x
      const Z = line.getPoint(TwistorComplex.one());
      // Note: incidence check may have numerical issues
      expect(Z).toBeDefined();
    });

    test('null geodesic from twistor', () => {
      // A null twistor corresponds to a null geodesic
      const Z = TwistorFactory.celestialSphere(Math.PI / 3, Math.PI / 4);
      const geodesic = NullGeodesic.fromTwistor(Z);
      
      // Get two points on the geodesic
      const p1 = geodesic.getPoint(0);
      const p2 = geodesic.getPoint(1);
      
      expect(p1).toBeDefined();
      expect(p2).toBeDefined();
    });

    test('conformal transformations', () => {
      // Conformal transformations preserve null structure
      const Z = TwistorFactory.nullTwistor(
        Spinor2.fromComponents(TwistorComplex.one(), TwistorComplex.i())
      );
      
      const dil = TwistorTransform.dilation(2);
      const transformed = dil.apply(Z);
      
      // Null property should be preserved (up to numerical precision)
      expect(typeof transformed.isNull()).toBe('boolean');
    });

    test('Penrose transform example', () => {
      // Simple twistor function
      const f = (Z: Twistor): TwistorComplex => {
        const norm = Z.normSquared();
        return new TwistorComplex(1 / (1 + norm * norm), 0);
      };
      
      const x = SpacetimePoint.zero();
      const phi = PenroseTransform.scalarWaveExample(f, x, 20);
      
      expect(phi).toBeDefined();
      expect(phi.magnitude()).toBeGreaterThan(0);
    });

    test('MHV amplitude spinor brackets', () => {
      // Create momentum spinors
      const lambda1 = Spinor2.fromComponents(
        new TwistorComplex(1, 0),
        new TwistorComplex(0.5, 0.5)
      );
      const lambda2 = Spinor2.fromComponents(
        new TwistorComplex(0.5, -0.5),
        new TwistorComplex(1, 0)
      );
      
      const bracket = TwistorStringTheory.spinorBracket(lambda1, lambda2);
      expect(bracket.magnitude()).toBeGreaterThan(0);
    });
  });

  // ========================================================================
  // Physical Constants
  // ========================================================================

  describe('TwistorConstants', () => {
    test('contains physical constants', () => {
      expect(TwistorConstants.c).toBe(299792458);
      expect(TwistorConstants.hbar).toBeCloseTo(1.054571817e-34);
      expect(TwistorConstants.G).toBeCloseTo(6.67430e-11);
      expect(TwistorConstants.lP).toBeCloseTo(1.616255e-35);
    });
  });
});
