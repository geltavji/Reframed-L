/**
 * FiberBundle.test.ts
 * Tests for Fiber Bundle Mathematics (PRD-05 Phase 5.2)
 */

import {
  Manifold,
  Chart,
  LieGroup,
  Fiber,
  FiberPoint,
  FiberBundle,
  Section,
  Connection,
  Curvature2Form,
  ParallelTransport,
  ChernClass,
  FiberBundleFactory,
  exportProofChain
} from '../../../src/unified/bundles/FiberBundle';

describe('FiberBundle Module (M05.02)', () => {
  describe('Manifold', () => {
    it('creates manifold with correct dimension', () => {
      const M = new Manifold('R3', 3);
      expect(M.getDimension()).toBe(3);
      expect(M.getName()).toBe('R3');
    });

    it('generates default coordinates', () => {
      const M = new Manifold('M', 4);
      expect(M.getCoordinates()).toEqual(['x0', 'x1', 'x2', 'x3']);
    });

    it('accepts custom coordinates', () => {
      const M = new Manifold('R4', 4, ['t', 'x', 'y', 'z']);
      expect(M.getCoordinates()).toEqual(['t', 'x', 'y', 'z']);
    });

    it('throws on invalid dimension', () => {
      expect(() => new Manifold('M', 0)).toThrow();
      expect(() => new Manifold('M', -1)).toThrow();
    });

    it('throws on coordinate count mismatch', () => {
      expect(() => new Manifold('M', 3, ['x', 'y'])).toThrow();
    });

    it('creates chart at a point', () => {
      const M = new Manifold('R3', 3);
      const chart = M.createChart([1, 2, 3]);
      expect(chart.getCenter()).toEqual([1, 2, 3]);
    });

    it('checks point containment', () => {
      const M = new Manifold('R3', 3);
      expect(M.containsPoint([1, 2, 3])).toBe(true);
      expect(M.containsPoint([1, 2])).toBe(false);
    });

    it('manifold has hash', () => {
      const M = new Manifold('R3', 3);
      expect(M.getHash()).toBeDefined();
      expect(M.getHash().length).toBe(16);
    });
  });

  describe('Chart', () => {
    it('computes local coordinates', () => {
      const M = new Manifold('R3', 3);
      const chart = M.createChart([1, 2, 3]);
      expect(chart.localCoordinates([2, 4, 6])).toEqual([1, 2, 3]);
    });

    it('local coordinates at center are zero', () => {
      const M = new Manifold('R3', 3);
      const chart = M.createChart([1, 2, 3]);
      expect(chart.localCoordinates([1, 2, 3])).toEqual([0, 0, 0]);
    });

    it('chart has hash', () => {
      const M = new Manifold('R3', 3);
      const chart = M.createChart([0, 0, 0]);
      expect(chart.getHash()).toBeDefined();
    });
  });

  describe('LieGroup', () => {
    it('creates Lie group with correct properties', () => {
      const G = new LieGroup('SO(3)', 3);
      expect(G.getName()).toBe('SO(3)');
      expect(G.getDimension()).toBe(3);
    });

    it('creates identity matrix', () => {
      const G = new LieGroup('GL(3)', 9);
      const id = G.identity(3);
      expect(id).toEqual([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
    });

    it('multiplies group elements correctly', () => {
      const G = new LieGroup('GL(2)', 4);
      const A = [[1, 2], [3, 4]];
      const B = [[5, 6], [7, 8]];
      const AB = G.multiply(A, B);
      expect(AB[0][0]).toBe(19); // 1*5 + 2*7
      expect(AB[0][1]).toBe(22); // 1*6 + 2*8
      expect(AB[1][0]).toBe(43); // 3*5 + 4*7
      expect(AB[1][1]).toBe(50); // 3*6 + 4*8
    });

    it('computes inverse for 2x2 matrix', () => {
      const G = new LieGroup('GL(2)', 4);
      const A = [[1, 2], [3, 4]];
      const Ainv = G.inverse(A);
      const product = G.multiply(A, Ainv);
      expect(product[0][0]).toBeCloseTo(1);
      expect(product[0][1]).toBeCloseTo(0);
      expect(product[1][0]).toBeCloseTo(0);
      expect(product[1][1]).toBeCloseTo(1);
    });

    it('computes inverse for 3x3 matrix', () => {
      const G = new LieGroup('GL(3)', 9);
      const A = [[1, 2, 1], [0, 1, 1], [1, 0, 1]];
      const Ainv = G.inverse(A);
      const product = G.multiply(A, Ainv);
      expect(product[0][0]).toBeCloseTo(1);
      expect(product[1][1]).toBeCloseTo(1);
      expect(product[2][2]).toBeCloseTo(1);
    });

    it('Lie group has hash', () => {
      const G = new LieGroup('SU(2)', 3);
      expect(G.getHash()).toBeDefined();
    });
  });

  describe('Fiber', () => {
    it('creates fiber with correct properties', () => {
      const G = new LieGroup('U(1)', 1);
      const F = new Fiber(2, 'vector', G);
      expect(F.getDimension()).toBe(2);
      expect(F.getType()).toBe('vector');
    });

    it('creates fiber point', () => {
      const G = new LieGroup('U(1)', 1);
      const F = new Fiber(3, 'vector', G);
      const p = F.point([1, 2, 3]);
      expect(p.getCoordinates()).toEqual([1, 2, 3]);
    });

    it('throws on dimension mismatch', () => {
      const G = new LieGroup('U(1)', 1);
      const F = new Fiber(3, 'vector', G);
      expect(() => F.point([1, 2])).toThrow();
    });

    it('fiber has hash', () => {
      const G = new LieGroup('U(1)', 1);
      const F = new Fiber(2, 'principal', G);
      expect(F.getHash()).toBeDefined();
    });
  });

  describe('FiberPoint', () => {
    it('fiber point stores coordinates', () => {
      const G = new LieGroup('GL(2)', 4);
      const F = new Fiber(2, 'vector', G);
      const p = F.point([3, 4]);
      expect(p.getCoordinates()).toEqual([3, 4]);
    });

    it('applies group action', () => {
      const G = new LieGroup('GL(2)', 4);
      const F = new Fiber(2, 'vector', G);
      const p = F.point([1, 0]);
      const rotation = [[0, -1], [1, 0]]; // 90 degree rotation
      const rotated = p.act(rotation);
      expect(rotated.getCoordinates()[0]).toBeCloseTo(0);
      expect(rotated.getCoordinates()[1]).toBeCloseTo(1);
    });

    it('fiber point has hash', () => {
      const G = new LieGroup('U(1)', 1);
      const F = new Fiber(2, 'vector', G);
      const p = F.point([1, 2]);
      expect(p.getHash()).toBeDefined();
    });
  });

  describe('FiberBundle', () => {
    it('creates fiber bundle', () => {
      const base = new Manifold('M', 4);
      const G = new LieGroup('U(1)', 1);
      const fiber = new Fiber(2, 'vector', G);
      const bundle = new FiberBundle('E', base, fiber, G);
      
      expect(bundle.getName()).toBe('E');
      expect(bundle.getBase()).toBe(base);
      expect(bundle.getFiber()).toBe(fiber);
    });

    it('computes total dimension', () => {
      const base = new Manifold('M', 4);
      const G = new LieGroup('U(1)', 1);
      const fiber = new Fiber(3, 'vector', G);
      const bundle = new FiberBundle('E', base, fiber, G);
      
      expect(bundle.getTotalDimension()).toBe(7);
    });

    it('projects to base space', () => {
      const base = new Manifold('M', 3);
      const G = new LieGroup('U(1)', 1);
      const fiber = new Fiber(2, 'vector', G);
      const bundle = new FiberBundle('E', base, fiber, G);
      
      const totalPoint = [1, 2, 3, 4, 5];
      const basePoint = bundle.project(totalPoint);
      expect(basePoint).toEqual([1, 2, 3]);
    });

    it('is locally trivial', () => {
      const base = new Manifold('M', 4);
      const G = new LieGroup('SU(2)', 3);
      const fiber = new Fiber(2, 'principal', G);
      const bundle = new FiberBundle('P', base, fiber, G);
      
      expect(bundle.isLocallyTrivial()).toBe(true);
    });

    it('creates sections', () => {
      const base = new Manifold('M', 2);
      const G = new LieGroup('U(1)', 1);
      const fiber = new Fiber(2, 'vector', G);
      const bundle = new FiberBundle('E', base, fiber, G);
      
      const section = bundle.createSection(p => [p[0], p[1]]);
      expect(section.at([3, 4])).toEqual([3, 4]);
    });

    it('fiber bundle has hash', () => {
      const base = new Manifold('M', 4);
      const G = new LieGroup('U(1)', 1);
      const fiber = new Fiber(2, 'vector', G);
      const bundle = new FiberBundle('E', base, fiber, G);
      
      expect(bundle.getHash()).toBeDefined();
    });
  });

  describe('Section', () => {
    let bundle: FiberBundle;

    beforeEach(() => {
      const base = new Manifold('M', 2);
      const G = new LieGroup('GL(2)', 4);
      const fiber = new Fiber(2, 'vector', G);
      bundle = new FiberBundle('E', base, fiber, G);
    });

    it('evaluates section at point', () => {
      const section = bundle.createSection(p => [2 * p[0], 3 * p[1]]);
      expect(section.at([1, 2])).toEqual([2, 6]);
    });

    it('adds two sections', () => {
      const s1 = bundle.createSection(p => [p[0], 0]);
      const s2 = bundle.createSection(p => [0, p[1]]);
      const sum = s1.add(s2);
      expect(sum.at([3, 4])).toEqual([3, 4]);
    });

    it('scales section', () => {
      const s = bundle.createSection(p => [p[0], p[1]]);
      const scaled = s.scale(p => 2);
      expect(scaled.at([3, 4])).toEqual([6, 8]);
    });

    it('section has hash', () => {
      const section = bundle.createSection(p => [p[0], p[1]]);
      expect(section.getHash()).toBeDefined();
    });
  });

  describe('Connection', () => {
    let bundle: FiberBundle;

    beforeEach(() => {
      const base = new Manifold('M', 2);
      const G = new LieGroup('GL(2)', 4);
      const fiber = new Fiber(2, 'vector', G);
      bundle = new FiberBundle('E', base, fiber, G);
    });

    it('creates connection with given form', () => {
      const conn = new Connection(bundle, (p, dir) => [[0, 0], [0, 0]]);
      expect(conn.getBundle()).toBe(bundle);
    });

    it('gets connection component', () => {
      const A = [[1, 0], [0, -1]];
      const conn = new Connection(bundle, (p, dir) => dir === 0 ? A : [[0, 0], [0, 0]]);
      expect(conn.getComponent([0, 0], 0)).toEqual(A);
    });

    it('flat connection has zero curvature', () => {
      const conn = FiberBundleFactory.flatConnection(bundle);
      expect(conn.isFlat([0, 0])).toBe(true);
    });

    it('computes covariant derivative', () => {
      const conn = FiberBundleFactory.flatConnection(bundle);
      const section = bundle.createSection(p => [p[0] * p[0], p[1]]);
      const Ds = conn.covariantDerivative(section, [1, 0], 0);
      // For flat connection, this is just ordinary derivative ∂_0 s = [2x, 0] at x=1
      expect(Ds[0]).toBeCloseTo(2, 4);
    });

    it('computes curvature for non-flat connection', () => {
      // Connection with A_0 = [[0, 1], [0, 0]], A_1 = [[0, 0], [1, 0]]
      const conn = new Connection(bundle, (p, dir) => {
        if (dir === 0) return [[0, p[1]], [0, 0]];
        return [[0, 0], [p[0], 0]];
      });
      const F = conn.curvature([1, 1], 0, 1);
      // Curvature should be non-zero for this connection
      expect(F.some(row => row.some(v => Math.abs(v) > 1e-10))).toBe(true);
    });

    it('connection has hash', () => {
      const conn = FiberBundleFactory.flatConnection(bundle);
      expect(conn.getHash()).toBeDefined();
    });
  });

  describe('Curvature2Form', () => {
    let conn: Connection;
    let curvature: Curvature2Form;

    beforeEach(() => {
      const bundle = FiberBundleFactory.trivial(2, 2);
      conn = new Connection(bundle, (p, dir) => {
        // Non-trivial connection
        const x = p[0], y = p[1];
        if (dir === 0) return [[0, y], [-y, 0]];
        return [[0, x], [-x, 0]];
      });
      curvature = new Curvature2Form(conn);
    });

    it('evaluates curvature at point', () => {
      const F = curvature.at([1, 1], 0, 1);
      expect(F).toBeDefined();
      expect(F.length).toBe(2);
    });

    it('computes trace', () => {
      const tr = curvature.trace([0, 0], 0, 1);
      expect(typeof tr).toBe('number');
    });

    it('computes curvature scalar', () => {
      const scalar = curvature.curvatureScalar([1, 1]);
      expect(typeof scalar).toBe('number');
    });

    it('curvature 2-form has hash', () => {
      expect(curvature.getHash()).toBeDefined();
    });
  });

  describe('ParallelTransport', () => {
    it('transports along straight path', () => {
      const bundle = FiberBundleFactory.trivial(2, 2);
      const conn = FiberBundleFactory.flatConnection(bundle);
      const transport = new ParallelTransport(conn);
      
      // Straight line from (0,0) to (1,0)
      const path = (t: number) => [t, 0];
      const result = transport.transport([0, 0], path, 100);
      
      // For flat connection, should be identity
      expect(result[0][0]).toBeCloseTo(1, 3);
      expect(result[1][1]).toBeCloseTo(1, 3);
    });

    it('computes holonomy around closed loop', () => {
      const bundle = FiberBundleFactory.trivial(2, 2);
      const conn = FiberBundleFactory.flatConnection(bundle);
      const transport = new ParallelTransport(conn);
      
      // Square loop
      const loop = (t: number) => {
        if (t < 0.25) return [4 * t, 0];
        if (t < 0.5) return [1, 4 * (t - 0.25)];
        if (t < 0.75) return [1 - 4 * (t - 0.5), 1];
        return [0, 1 - 4 * (t - 0.75)];
      };
      
      const holonomy = transport.holonomy([0, 0], loop, 100);
      
      // For flat connection, holonomy should be identity
      expect(holonomy[0][0]).toBeCloseTo(1, 2);
      expect(holonomy[1][1]).toBeCloseTo(1, 2);
    });

    it('parallel transport has hash', () => {
      const bundle = FiberBundleFactory.trivial(2, 2);
      const conn = FiberBundleFactory.flatConnection(bundle);
      const transport = new ParallelTransport(conn);
      expect(transport.getHash()).toBeDefined();
    });
  });

  describe('ChernClass', () => {
    let chern: ChernClass;

    beforeEach(() => {
      const bundle = FiberBundleFactory.trivial(2, 2);
      const conn = FiberBundleFactory.flatConnection(bundle);
      const curvature = new Curvature2Form(conn);
      chern = new ChernClass(curvature);
    });

    it('computes first Chern number', () => {
      const c1 = chern.firstChernNumber([0, 0], 0, 1);
      // For flat connection, c1 = 0
      expect(c1).toBeCloseTo(0, 5);
    });

    it('computes second Chern number', () => {
      const c2 = chern.secondChernNumber([0, 0]);
      // For flat connection, c2 = 0
      expect(Math.abs(c2)).toBeLessThan(0.01);
    });

    it('computes Chern character', () => {
      const ch = chern.chernCharacter([0, 0], 2);
      expect(typeof ch).toBe('number');
    });

    it('Chern class has hash', () => {
      expect(chern.getHash()).toBeDefined();
    });
  });

  describe('FiberBundleFactory', () => {
    it('creates trivial bundle', () => {
      const bundle = FiberBundleFactory.trivial(4, 2);
      expect(bundle.getName()).toBe('Trivial');
      expect(bundle.getBase().getDimension()).toBe(4);
      expect(bundle.getFiber().getDimension()).toBe(2);
    });

    it('creates tangent bundle', () => {
      const bundle = FiberBundleFactory.tangent(3);
      expect(bundle.getName()).toBe('Tangent');
      expect(bundle.getBase().getDimension()).toBe(3);
      expect(bundle.getFiber().getDimension()).toBe(3);
    });

    it('creates cotangent bundle', () => {
      const bundle = FiberBundleFactory.cotangent(4);
      expect(bundle.getName()).toBe('Cotangent');
      expect(bundle.getTotalDimension()).toBe(8);
    });

    it('creates principal U(1) bundle', () => {
      const bundle = FiberBundleFactory.principalU1(4);
      expect(bundle.getName()).toBe('U(1)-bundle');
      expect(bundle.getStructureGroup().getName()).toBe('U(1)');
    });

    it('creates principal SU(2) bundle', () => {
      const bundle = FiberBundleFactory.principalSU2(4);
      expect(bundle.getName()).toBe('SU(2)-bundle');
      expect(bundle.getStructureGroup().getName()).toBe('SU(2)');
    });

    it('creates principal SU(3) bundle', () => {
      const bundle = FiberBundleFactory.principalSU3(4);
      expect(bundle.getName()).toBe('SU(3)-bundle');
      expect(bundle.getFiber().getDimension()).toBe(3);
    });

    it('creates line bundle', () => {
      const bundle = FiberBundleFactory.lineBundle(2);
      expect(bundle.getName()).toBe('LineBundle');
    });

    it('creates flat connection', () => {
      const bundle = FiberBundleFactory.trivial(3, 2);
      const conn = FiberBundleFactory.flatConnection(bundle);
      expect(conn.isFlat([1, 2, 3])).toBe(true);
    });

    it('creates constant connection', () => {
      const bundle = FiberBundleFactory.trivial(2, 2);
      const A = [[[1, 0], [0, -1]], [[0, 1], [1, 0]]];
      const conn = FiberBundleFactory.constantConnection(bundle, A);
      expect(conn.getComponent([0, 0], 0)).toEqual([[1, 0], [0, -1]]);
      expect(conn.getComponent([5, 5], 1)).toEqual([[0, 1], [1, 0]]);
    });

    it('throws on dimension mismatch for constant connection', () => {
      const bundle = FiberBundleFactory.trivial(3, 2);
      const A = [[[1, 0], [0, 1]], [[1, 0], [0, 1]]]; // Only 2 components
      expect(() => FiberBundleFactory.constantConnection(bundle, A)).toThrow();
    });

    it('creates instanton connection on 4D SU(2) bundle', () => {
      const bundle = FiberBundleFactory.principalSU2(4);
      const conn = FiberBundleFactory.instantonConnection(bundle, [0, 0, 0, 0], 1);
      expect(conn).toBeDefined();
    });

    it('throws for instanton on wrong dimension', () => {
      const bundle = FiberBundleFactory.trivial(3, 2);
      expect(() => FiberBundleFactory.instantonConnection(bundle, [0, 0, 0], 1)).toThrow();
    });
  });

  describe('Gauge Theory Applications', () => {
    it('U(1) bundle describes electromagnetism', () => {
      const bundle = FiberBundleFactory.principalU1(4);
      expect(bundle.getStructureGroup().getDimension()).toBe(1);
      // U(1) gauge theory is QED
    });

    it('SU(2) bundle describes weak interactions', () => {
      const bundle = FiberBundleFactory.principalSU2(4);
      expect(bundle.getStructureGroup().getAlgebraDimension()).toBe(3);
      // SU(2) has 3 generators - W+, W-, Z bosons
    });

    it('SU(3) bundle describes strong interactions', () => {
      const bundle = FiberBundleFactory.principalSU3(4);
      expect(bundle.getStructureGroup().getDimension()).toBe(8);
      // SU(3) has 8 generators - 8 gluons
    });
  });

  describe('Mathematical Properties', () => {
    it('bundle projection is surjective', () => {
      const bundle = FiberBundleFactory.trivial(3, 2);
      // Every base point has a fiber
      const basePoint = [1, 2, 3];
      const fiber = bundle.fiberAt(basePoint);
      expect(fiber).toBeDefined();
    });

    it('sections can be composed with functions', () => {
      const bundle = FiberBundleFactory.trivial(2, 2);
      const s = bundle.createSection(p => [Math.sin(p[0]), Math.cos(p[1])]);
      const result = s.at([Math.PI / 2, 0]);
      expect(result[0]).toBeCloseTo(1);
      expect(result[1]).toBeCloseTo(1);
    });

    it('connection defines parallel transport', () => {
      const bundle = FiberBundleFactory.trivial(2, 2);
      const conn = FiberBundleFactory.flatConnection(bundle);
      const transport = new ParallelTransport(conn);
      expect(transport.getConnection()).toBe(conn);
    });

    it('curvature is antisymmetric', () => {
      const bundle = FiberBundleFactory.trivial(3, 2);
      const conn = new Connection(bundle, (p, dir) => [[p[dir], 0], [0, -p[dir]]]);
      const F01 = conn.curvature([1, 1, 1], 0, 1);
      const F10 = conn.curvature([1, 1, 1], 1, 0);
      // F_μν = -F_νμ
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          expect(F01[i][j]).toBeCloseTo(-F10[i][j], 3);
        }
      }
    });
  });

  describe('Hash Verification', () => {
    it('all components have unique hashes', () => {
      const hashes = new Set<string>();
      
      const M = new Manifold('M', 3);
      hashes.add(M.getHash());
      
      const G = new LieGroup('SU(2)', 3);
      hashes.add(G.getHash());
      
      const F = new Fiber(2, 'vector', G);
      hashes.add(F.getHash());
      
      const bundle = new FiberBundle('E', M, F, G);
      hashes.add(bundle.getHash());
      
      expect(hashes.size).toBe(4);
    });

    it('exports proof chain', () => {
      const proof = exportProofChain();
      expect(proof.module).toBe('FiberBundle');
      expect(proof.classes).toContain('FiberBundle');
      expect(proof.classes).toContain('Connection');
      expect(proof.hash).toBeDefined();
    });
  });

  describe('Physical Validation', () => {
    it('tangent bundle has correct structure', () => {
      const TM = FiberBundleFactory.tangent(4);
      // Tangent bundle of 4D spacetime has 8 total dimensions
      expect(TM.getTotalDimension()).toBe(8);
      // Fiber at each point is R^4 (tangent space)
      expect(TM.getFiber().getDimension()).toBe(4);
    });

    it('principal bundle fiber is the group', () => {
      const P = FiberBundleFactory.principalSU2(4);
      // Principal bundle fiber is the structure group
      expect(P.getFiber().getType()).toBe('principal');
    });

    it('flat connection has trivial holonomy', () => {
      const bundle = FiberBundleFactory.trivial(2, 2);
      const conn = FiberBundleFactory.flatConnection(bundle);
      const transport = new ParallelTransport(conn);
      
      // Any closed loop
      const loop = (t: number) => [Math.cos(2 * Math.PI * t), Math.sin(2 * Math.PI * t)];
      const hol = transport.holonomy([1, 0], loop, 50);
      
      // Should be close to identity
      const trace = hol[0][0] + hol[1][1];
      expect(trace).toBeCloseTo(2, 1); // tr(I) = 2
    });
  });
});
