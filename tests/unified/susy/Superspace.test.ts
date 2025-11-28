/**
 * Tests for Superspace.ts - Phase 5.3: Supersymmetry Basics
 * 
 * Tests covering:
 * - Grassmann number algebra
 * - Superspace coordinates
 * - Chiral and vector superfields
 * - SUSY transformations and algebra
 * - Superpotential and Kähler potential
 */

import {
    GrassmannNumber,
    SuperspacePoint,
    Superfield,
    ChiralSuperfield,
    AntichiralSuperfield,
    VectorSuperfield,
    SUSYTransform,
    SUSYAlgebra,
    Superpotential,
    KahlerPotential,
    SUSYLagrangian,
    SuperspaceFactory,
    SUSYConstants,
    PauliMatrices
} from '../../../src/unified/susy/Superspace';

describe('Superspace - Phase 5.3', () => {
    // ========================================================================
    // Grassmann Numbers
    // ========================================================================

    describe('GrassmannNumber', () => {
        test('creates scalar Grassmann number', () => {
            const g = GrassmannNumber.scalar(5.0, 2);
            expect(g.getScalar()).toBe(5.0);
            expect(g.getLinear(0)).toBe(0);
            expect(g.getLinear(1)).toBe(0);
        });

        test('creates Grassmann generator θ₀', () => {
            const theta0 = GrassmannNumber.generator(0, 2);
            expect(theta0.getScalar()).toBe(0);
            expect(theta0.getLinear(0)).toBe(1);
            expect(theta0.getLinear(1)).toBe(0);
        });

        test('creates Grassmann generator θ₁', () => {
            const theta1 = GrassmannNumber.generator(1, 2);
            expect(theta1.getScalar()).toBe(0);
            expect(theta1.getLinear(0)).toBe(0);
            expect(theta1.getLinear(1)).toBe(1);
        });

        test('adds Grassmann numbers correctly', () => {
            const g1 = new GrassmannNumber(2, [1, 0], [], 2);
            const g2 = new GrassmannNumber(3, [0, 2], [], 2);
            const sum = g1.add(g2);
            
            expect(sum.getScalar()).toBe(5);
            expect(sum.getLinear(0)).toBe(1);
            expect(sum.getLinear(1)).toBe(2);
        });

        test('subtracts Grassmann numbers correctly', () => {
            const g1 = new GrassmannNumber(5, [3, 2], [], 2);
            const g2 = new GrassmannNumber(2, [1, 1], [], 2);
            const diff = g1.subtract(g2);
            
            expect(diff.getScalar()).toBe(3);
            expect(diff.getLinear(0)).toBe(2);
            expect(diff.getLinear(1)).toBe(1);
        });

        test('multiplies scalar by Grassmann generator', () => {
            const scalar = GrassmannNumber.scalar(3, 2);
            const theta = GrassmannNumber.generator(0, 2);
            const product = scalar.multiply(theta);
            
            expect(product.getScalar()).toBe(0);
            expect(product.getLinear(0)).toBe(3);
        });

        test('θ₀θ₁ produces bilinear term', () => {
            const theta0 = GrassmannNumber.generator(0, 2);
            const theta1 = GrassmannNumber.generator(1, 2);
            const product = theta0.multiply(theta1);
            
            expect(product.getBilinear(0, 1)).toBe(1);
        });

        test('θ₁θ₀ = -θ₀θ₁ (anticommutation)', () => {
            const theta0 = GrassmannNumber.generator(0, 2);
            const theta1 = GrassmannNumber.generator(1, 2);
            
            const prod01 = theta0.multiply(theta1);
            const prod10 = theta1.multiply(theta0);
            
            expect(prod01.getBilinear(0, 1)).toBe(1);
            expect(prod10.getBilinear(0, 1)).toBe(-1);
        });

        test('θ² = 0 (nilpotency)', () => {
            const theta = GrassmannNumber.generator(0, 2);
            const squared = theta.multiply(theta);
            
            expect(squared.getScalar()).toBe(0);
            expect(squared.getLinear(0)).toBe(0);
            expect(squared.getLinear(1)).toBe(0);
        });

        test('scales Grassmann number', () => {
            const g = new GrassmannNumber(2, [1, 3], [], 2);
            const scaled = g.scale(2);
            
            expect(scaled.getScalar()).toBe(4);
            expect(scaled.getLinear(0)).toBe(2);
            expect(scaled.getLinear(1)).toBe(6);
        });

        test('conjugates Grassmann number', () => {
            const g = new GrassmannNumber(3, [1, 2], [], 2);
            const conj = g.conjugate();
            
            expect(conj.getScalar()).toBe(3);
            expect(conj.getLinear(0)).toBe(1);
        });

        test('all Grassmann numbers are nilpotent', () => {
            const theta = GrassmannNumber.generator(0, 2);
            expect(theta.isNilpotent()).toBe(true);
        });

        test('Berezin integral ∫dθ 1 = 0', () => {
            const one = GrassmannNumber.scalar(1, 2);
            const integral = one.integrateOver(0);
            expect(integral.getScalar()).toBe(0);
        });

        test('Berezin integral ∫dθ₀ θ₀ = 1', () => {
            const theta0 = GrassmannNumber.generator(0, 2);
            const integral = theta0.integrateOver(0);
            expect(integral.getScalar()).toBe(1);
        });

        test('Berezin integral ∫dθ₀ θ₁ = 0', () => {
            const theta1 = GrassmannNumber.generator(1, 2);
            const integral = theta1.integrateOver(0);
            expect(integral.getScalar()).toBe(0);
        });

        test('full Grassmann integral', () => {
            // ∫dθ₁dθ₀ θ₀θ₁ = 1
            const theta0 = GrassmannNumber.generator(0, 2);
            const theta1 = GrassmannNumber.generator(1, 2);
            const product = theta0.multiply(theta1);
            
            const fullInt = product.fullIntegral();
            expect(fullInt).toBe(1);
        });

        test('generates valid hash', () => {
            const g = new GrassmannNumber(1, [2, 3], [], 2);
            const hash = g.getHash();
            expect(hash.length).toBe(16);
        });
    });

    // ========================================================================
    // Superspace Points
    // ========================================================================

    describe('SuperspacePoint', () => {
        test('creates origin in superspace', () => {
            const origin = SuperspacePoint.origin(4, 2);
            
            expect(origin.getX(0)).toBe(0);
            expect(origin.getX(1)).toBe(0);
            expect(origin.getX(2)).toBe(0);
            expect(origin.getX(3)).toBe(0);
        });

        test('gets bosonic coordinates', () => {
            const point = new SuperspacePoint(
                [1, 2, 3, 4],
                [new GrassmannNumber(), new GrassmannNumber()],
                [new GrassmannNumber(), new GrassmannNumber()]
            );
            
            const coords = point.getXCoords();
            expect(coords).toEqual([1, 2, 3, 4]);
        });

        test('gets Grassmann coordinates', () => {
            const theta = [
                GrassmannNumber.generator(0, 2),
                GrassmannNumber.generator(1, 2)
            ];
            const point = new SuperspacePoint([0, 0, 0, 0], theta, theta);
            
            expect(point.getTheta(0).getLinear(0)).toBe(1);
            expect(point.getTheta(1).getLinear(1)).toBe(1);
        });

        test('performs SUSY transformation', () => {
            const origin = SuperspacePoint.origin();
            const xi = [GrassmannNumber.generator(0, 2), GrassmannNumber.generator(1, 2)];
            const xiBar = [new GrassmannNumber(), new GrassmannNumber()];
            
            const transformed = origin.susyTransform(xi, xiBar);
            expect(transformed.getTheta(0).getLinear(0)).toBe(1);
        });

        test('generates valid hash', () => {
            const point = SuperspacePoint.origin();
            const hash = point.getHash();
            expect(hash.length).toBe(16);
        });
    });

    // ========================================================================
    // Superfields
    // ========================================================================

    describe('Superfield', () => {
        test('creates general superfield', () => {
            const field = new Superfield('general', 4);
            expect(field.getType()).toBe('general');
        });

        test('sets and gets components', () => {
            const field = new Superfield();
            field.setComponent('scalar', [1.0, 2.0]);
            
            const comp = field.getComponent('scalar');
            expect(comp).toEqual([1.0, 2.0]);
        });

        test('adds superfields', () => {
            const f1 = new Superfield();
            f1.setComponent('scalar', [1.0]);
            
            const f2 = new Superfield();
            f2.setComponent('scalar', [2.0]);
            
            const sum = f1.add(f2);
            expect(sum.getComponent('scalar')).toEqual([3.0]);
        });

        test('scales superfield', () => {
            const field = new Superfield();
            field.setComponent('scalar', [2.0]);
            
            const scaled = field.scale(3);
            expect(scaled.getComponent('scalar')).toEqual([6.0]);
        });

        test('multiplies superfields', () => {
            const f1 = new Superfield();
            f1.setComponent('scalar', [2.0]);
            
            const f2 = new Superfield();
            f2.setComponent('scalar', [3.0]);
            
            const product = f1.multiply(f2);
            expect(product.getComponent('scalar')).toEqual([6.0]);
        });

        test('generates valid hash', () => {
            const field = new Superfield();
            field.setComponent('test', [1, 2, 3]);
            const hash = field.getHash();
            expect(hash.length).toBe(16);
        });
    });

    // ========================================================================
    // Chiral Superfield
    // ========================================================================

    describe('ChiralSuperfield', () => {
        test('creates chiral superfield', () => {
            const phi = new ChiralSuperfield(1.0, [0.5, 0.5], 0.1);
            
            expect(phi.getPhi()).toBe(1.0);
            expect(phi.getPsi()).toEqual([0.5, 0.5]);
            expect(phi.getF()).toBe(0.1);
        });

        test('is identified as chiral', () => {
            const phi = new ChiralSuperfield();
            expect(phi.isChiral()).toBe(true);
            expect(phi.isAntichiral()).toBe(false);
        });

        test('computes kinetic term', () => {
            const phi = new ChiralSuperfield(2.0, [0, 0], 1.0);
            const kinetic = phi.kineticTerm();
            
            // φ² + F² = 4 + 1 = 5
            expect(kinetic).toBe(5);
        });

        test('creates conjugate (antichiral)', () => {
            const phi = new ChiralSuperfield(1.0, [0.5, 0.5], 0.1);
            const phiBar = phi.conjugate();
            
            expect(phiBar.getPhiBar()).toBe(1.0);
            expect(phiBar.isAntichiral()).toBe(true);
        });

        test('default values are zero', () => {
            const phi = new ChiralSuperfield();
            
            expect(phi.getPhi()).toBe(0);
            expect(phi.getPsi()).toEqual([0, 0]);
            expect(phi.getF()).toBe(0);
        });
    });

    // ========================================================================
    // Antichiral Superfield
    // ========================================================================

    describe('AntichiralSuperfield', () => {
        test('creates antichiral superfield', () => {
            const phiBar = new AntichiralSuperfield(1.0, [0.5, 0.5], 0.1);
            
            expect(phiBar.getPhiBar()).toBe(1.0);
            expect(phiBar.getPsiBar()).toEqual([0.5, 0.5]);
            expect(phiBar.getFBar()).toBe(0.1);
        });

        test('is identified as antichiral', () => {
            const phiBar = new AntichiralSuperfield();
            expect(phiBar.isAntichiral()).toBe(true);
            expect(phiBar.isChiral()).toBe(false);
        });
    });

    // ========================================================================
    // Vector Superfield
    // ========================================================================

    describe('VectorSuperfield', () => {
        test('creates vector superfield', () => {
            const V = new VectorSuperfield(0, [0, 0], 0, [1, 0, 0, 0], [0.5, 0.5], 0.1);
            
            expect(V.getVectorField()).toEqual([1, 0, 0, 0]);
            expect(V.getGaugino()).toEqual([0.5, 0.5]);
            expect(V.getDTerm()).toBe(0.1);
        });

        test('is identified as vector', () => {
            const V = new VectorSuperfield();
            expect(V.isVector()).toBe(true);
        });

        test('converts to Wess-Zumino gauge', () => {
            const V = new VectorSuperfield(1, [0.1, 0.2], 0.5, [1, 0, 0, 0], [0.5, 0.5], 0.1);
            const VWZ = V.toWessZuminoGauge();
            
            expect(VWZ.isWessZuminoGauge()).toBe(true);
            expect(VWZ.getVectorField()).toEqual([1, 0, 0, 0]);
            expect(VWZ.getGaugino()).toEqual([0.5, 0.5]);
        });

        test('checks Wess-Zumino gauge condition', () => {
            const V1 = new VectorSuperfield(0, [0, 0], 0, [1, 0, 0, 0], [0, 0], 0);
            expect(V1.isWessZuminoGauge()).toBe(true);
            
            const V2 = new VectorSuperfield(1, [0, 0], 0, [1, 0, 0, 0], [0, 0], 0);
            expect(V2.isWessZuminoGauge()).toBe(false);
        });

        test('computes field strength superfield', () => {
            const V = new VectorSuperfield(0, [0, 0], 0, [0, 0, 0, 0], [1, 0], 0.5);
            const W = V.fieldStrength();
            
            expect(W.isChiral()).toBe(true);
            expect(W.getPsi()).toEqual([1, 0]);
            expect(W.getF()).toBe(0.5);
        });
    });

    // ========================================================================
    // SUSY Transformations
    // ========================================================================

    describe('SUSYTransform', () => {
        test('creates identity transformation', () => {
            const identity = SUSYTransform.identity();
            const xi = identity.getXi();
            
            expect(xi[0].getScalar()).toBe(0);
            expect(xi[1].getScalar()).toBe(0);
        });

        test('composes transformations', () => {
            const t1 = SuperspaceFactory.susyTransform([1, 0, 0, 0]);
            const t2 = SuperspaceFactory.susyTransform([0, 1, 0, 0]);
            const composed = t1.compose(t2);
            
            const xi = composed.getXi();
            expect(xi[0].getLinear(0)).toBe(1);
            expect(xi[1].getLinear(0)).toBe(1);
        });

        test('transforms scalar field', () => {
            const transform = SuperspaceFactory.susyTransform([1, 0, 0, 0]);
            const psi = [0.5, 0.5];
            const result = transform.transformScalar(psi);
            
            // Result involves Grassmann × spinor
            expect(typeof result).toBe('number');
        });

        test('generates valid hash', () => {
            const transform = SUSYTransform.identity();
            const hash = transform.getHash();
            expect(hash.length).toBe(16);
        });
    });

    // ========================================================================
    // SUSY Algebra
    // ========================================================================

    describe('SUSYAlgebra', () => {
        test('{Q_α, Q_β} = 0', () => {
            for (let a = 0; a < 2; a++) {
                for (let b = 0; b < 2; b++) {
                    expect(SUSYAlgebra.anticommutatorQQ(a, b)).toBe(0);
                }
            }
        });

        test('{Q̄_α̇, Q̄_β̇} = 0', () => {
            for (let a = 0; a < 2; a++) {
                for (let b = 0; b < 2; b++) {
                    expect(SUSYAlgebra.anticommutatorQbarQbar(a, b)).toBe(0);
                }
            }
        });

        test('{Q_α, Q̄_α̇} = 2σ^μP_μ', () => {
            const result = SUSYAlgebra.anticommutatorQQbar(0, 0);
            // Should give coefficients related to Pauli matrices
            expect(result.length).toBe(4);
        });

        test('[P_μ, Q_α] = 0', () => {
            expect(SUSYAlgebra.commutatorPQ()).toBe(0);
        });

        test('verifies SUSY algebra', () => {
            expect(SUSYAlgebra.verifyAlgebra()).toBe(true);
        });

        test('N=1 SUSY has no central charge', () => {
            expect(SUSYAlgebra.centralCharge()).toBe(0);
        });

        test('generates valid hash', () => {
            const hash = SUSYAlgebra.getHash();
            expect(hash.length).toBe(16);
        });
    });

    // ========================================================================
    // Pauli Matrices
    // ========================================================================

    describe('PauliMatrices', () => {
        test('σ⁰ is identity', () => {
            expect(PauliMatrices.sigma0).toEqual([[1, 0], [0, 1]]);
        });

        test('σ¹ is correct', () => {
            expect(PauliMatrices.sigma1).toEqual([[0, 1], [1, 0]]);
        });

        test('σ³ is diagonal', () => {
            expect(PauliMatrices.sigma3).toEqual([[1, 0], [0, -1]]);
        });

        test('σ̄⁰ equals σ⁰', () => {
            expect(PauliMatrices.sigmaBar0).toEqual(PauliMatrices.sigma0);
        });
    });

    // ========================================================================
    // Superpotential
    // ========================================================================

    describe('Superpotential', () => {
        test('creates empty superpotential', () => {
            const W = new Superpotential();
            expect(W.evaluate(1.0)).toBe(0);
        });

        test('creates mass term W = ½mΦ²', () => {
            const W = Superpotential.massTerm(2.0);
            // W = ½ × 2 × φ² = φ²
            expect(W.evaluate(3.0)).toBe(9.0);
        });

        test('creates Yukawa term W = yΦ³', () => {
            const W = Superpotential.yukawaTerm(1.0);
            // W = 1 × φ³
            expect(W.evaluate(2.0)).toBe(8.0);
        });

        test('creates Wess-Zumino superpotential', () => {
            const W = Superpotential.wess_Zumino(2.0, 3.0);
            // W = ½ × 2 × φ² + ⅓ × 3 × φ³ = φ² + φ³
            expect(W.evaluate(1.0)).toBe(2.0); // 1 + 1 = 2
        });

        test('computes derivative dW/dφ', () => {
            const W = Superpotential.massTerm(2.0);
            // W = φ², dW/dφ = 2φ
            expect(W.derivative(3.0)).toBe(6.0);
        });

        test('checks renormalizability', () => {
            const W1 = Superpotential.wess_Zumino(1.0, 1.0);
            expect(W1.isRenormalizable()).toBe(true);
            
            const W2 = new Superpotential();
            W2.setCoefficient(4, 1.0);
            expect(W2.isRenormalizable()).toBe(false);
        });

        test('computes F-term potential', () => {
            const W = Superpotential.massTerm(2.0);
            // V_F = |dW/dφ|² = (2φ)² = 4φ²
            expect(W.fTermPotential(2.0)).toBe(16.0);
        });

        test('generates valid hash', () => {
            const W = Superpotential.massTerm(1.0);
            const hash = W.getHash();
            expect(hash.length).toBe(16);
        });
    });

    // ========================================================================
    // Kähler Potential
    // ========================================================================

    describe('KahlerPotential', () => {
        test('creates canonical Kähler potential', () => {
            const K = new KahlerPotential('canonical');
            expect(K.isCanonical()).toBe(true);
        });

        test('evaluates K = Φ†Φ', () => {
            const K = new KahlerPotential('canonical');
            // K = φ* × φ = |φ|²
            expect(K.evaluate(3.0, 3.0)).toBe(9.0);
        });

        test('computes Kähler metric', () => {
            const K = new KahlerPotential('canonical');
            const metric = K.kahlerMetric();
            
            // For K = Φ†Φ: g = ∂²K/∂φ∂φ* = 1
            expect(metric).toEqual([[1]]);
        });

        test('computes D-term potential', () => {
            const K = new KahlerPotential('canonical');
            const g = 1.0;
            const phi = 2.0;
            const xi = 1.0; // FI term
            
            // D = g(|φ|² - ξ) = 1 × (4 - 1) = 3
            // V_D = ½D² = ½ × 9 = 4.5
            const V_D = K.dTermPotential(phi, phi, g, xi);
            expect(V_D).toBe(4.5);
        });

        test('computes total scalar potential', () => {
            const K = new KahlerPotential('canonical');
            const W = Superpotential.massTerm(2.0);
            const phi = 1.0;
            
            const V = K.totalPotential(phi, phi, W, 0, 0);
            // V = V_F + V_D = |dW/dφ|² + 0 = 4
            expect(V).toBe(4.0);
        });

        test('generates valid hash', () => {
            const K = new KahlerPotential();
            const hash = K.getHash();
            expect(hash.length).toBe(16);
        });
    });

    // ========================================================================
    // SUSY Lagrangian
    // ========================================================================

    describe('SUSYLagrangian', () => {
        test('creates Lagrangian with default components', () => {
            const L = new SUSYLagrangian();
            const V = L.computePotential(0, 0);
            expect(V).toBe(0);
        });

        test('sets Kähler and superpotential', () => {
            const L = new SUSYLagrangian();
            L.setKahler(new KahlerPotential('canonical'));
            L.setSuperpotential(Superpotential.massTerm(2.0));
            
            const V = L.computePotential(1.0, 1.0);
            expect(V).toBe(4.0);
        });

        test('finds vacuum', () => {
            const L = new SUSYLagrangian();
            L.setSuperpotential(Superpotential.massTerm(2.0));
            
            const vacuum = L.findVacuum(0.5);
            expect(Math.abs(vacuum)).toBeLessThan(1);
        });

        test('checks SUSY preservation', () => {
            const L = new SUSYLagrangian();
            L.setSuperpotential(Superpotential.massTerm(2.0));
            
            // At φ = 0: F = dW/dφ = 0, SUSY preserved
            expect(L.isSUSYPreserved(0)).toBe(true);
            
            // At φ ≠ 0: F ≠ 0, SUSY broken
            expect(L.isSUSYPreserved(1.0)).toBe(false);
        });

        test('generates valid hash', () => {
            const L = new SUSYLagrangian();
            const hash = L.getHash();
            expect(hash.length).toBe(16);
        });
    });

    // ========================================================================
    // Factory
    // ========================================================================

    describe('SuperspaceFactory', () => {
        test('creates Wess-Zumino model', () => {
            const L = SuperspaceFactory.wessZuminoModel(1.0, 0.5);
            expect(L).toBeDefined();
            expect(L.getHash().length).toBe(16);
        });

        test('creates free chiral superfield', () => {
            const phi = SuperspaceFactory.freeChiral(1.0);
            expect(phi.getPhi()).toBe(1.0);
            expect(phi.getPsi()).toEqual([0, 0]);
            expect(phi.getF()).toBe(0);
        });

        test('creates massive chiral superfield', () => {
            const { field, W } = SuperspaceFactory.massiveChiral(2.0, 1.0);
            expect(field.getPhi()).toBe(2.0);
            expect(field.getF()).toBe(-2.0); // F = -m*φ
            expect(W.evaluate(1.0)).toBe(0.5); // W = ½mφ²
        });

        test('creates abelian vector superfield', () => {
            const V = SuperspaceFactory.abelianVector([1, 0, 0, 0]);
            expect(V.isWessZuminoGauge()).toBe(true);
            expect(V.getVectorField()).toEqual([1, 0, 0, 0]);
        });

        test('creates superspace point', () => {
            const point = SuperspaceFactory.superspacePoint([1, 2, 3, 4], [0.1, 0.2, 0.3, 0.4]);
            expect(point.getXCoords()).toEqual([1, 2, 3, 4]);
        });

        test('creates SUSY transformation', () => {
            const transform = SuperspaceFactory.susyTransform([1, 0, 0, 0]);
            const xi = transform.getXi();
            expect(xi[0].getLinear(0)).toBe(1);
        });

        test('generates valid hash', () => {
            const hash = SuperspaceFactory.getHash();
            expect(hash.length).toBe(16);
        });
    });

    // ========================================================================
    // Constants
    // ========================================================================

    describe('SUSYConstants', () => {
        test('has correct N=1 SUSY', () => {
            expect(SUSYConstants.N).toBe(1);
        });

        test('has 4 spacetime dimensions', () => {
            expect(SUSYConstants.D).toBe(4);
        });

        test('has 2-component spinors', () => {
            expect(SUSYConstants.spinorDim).toBe(2);
        });

        test('has 2 Grassmann variables per spinor', () => {
            expect(SUSYConstants.grassmannDim).toBe(2);
        });
    });

    // ========================================================================
    // Integration Tests
    // ========================================================================

    describe('Integration', () => {
        test('chiral × antichiral gives real expression', () => {
            const phi = new ChiralSuperfield(2.0, [0, 0], 0);
            const phiBar = phi.conjugate();
            
            // Φ†Φ should give real Kähler term
            expect(phi.getPhi() * phiBar.getPhiBar()).toBe(4.0);
        });

        test('complete Wess-Zumino model', () => {
            const L = SuperspaceFactory.wessZuminoModel(1.0, 0.1);
            
            // Check potential at different field values
            const V0 = L.computePotential(0, 0);
            const V1 = L.computePotential(1.0, 1.0);
            
            expect(V0).toBe(0);
            expect(V1).toBeGreaterThan(0);
        });

        test('vector superfield gauge transformation', () => {
            const V = new VectorSuperfield(1, [0.1, 0.1], 0.5, [1, 0, 0, 0], [0, 0], 0);
            const VWZ = V.toWessZuminoGauge();
            
            // Physical content preserved
            expect(VWZ.getVectorField()).toEqual([1, 0, 0, 0]);
            expect(VWZ.getDTerm()).toBe(0);
        });

        test('Grassmann integration for action', () => {
            // ∫d²θ θ²F → F term
            const theta0 = GrassmannNumber.generator(0, 2);
            const theta1 = GrassmannNumber.generator(1, 2);
            const theta2 = theta0.multiply(theta1);
            
            // Multiply by F coefficient (scalar)
            const Fterm = theta2.scale(3.0); // F = 3
            const integral = Fterm.fullIntegral();
            
            expect(integral).toBe(3.0);
        });

        test('SUSY algebra closure', () => {
            // Two SUSY transformations compose to translation
            expect(SUSYAlgebra.verifyAlgebra()).toBe(true);
            
            // [P, Q] = 0 ensures algebra closes
            expect(SUSYAlgebra.commutatorPQ()).toBe(0);
        });
    });
});
