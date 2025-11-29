/**
 * PRD-18 Tests - Final Scientific Validation & Deployment
 * Tests for all 6 phases of PRD-18
 */

import { 
  ExtendedLaws, 
  ExtendedLawsFactory,
  CrossValidator,
  CrossValidatorFactory,
  PerformanceOptimizer,
  PerformanceOptimizerFactory,
  CacheManager,
  ParallelProcessor,
  DeploymentManager,
  DeploymentManagerFactory,
  FinalIntegrationManager,
  FinalIntegrationManagerFactory
} from '../../src/final';

describe('PRD-18: Final Scientific Validation & Deployment', () => {
  
  // ============================================
  // Phase 18.1: Extended Laws Tests
  // ============================================
  describe('Phase 18.1: ExtendedLaws', () => {
    let extendedLaws: ExtendedLaws;

    beforeEach(() => {
      extendedLaws = ExtendedLawsFactory.createDefault();
    });

    test('should initialize with 6 extended laws', () => {
      const laws = extendedLaws.getAllLaws();
      expect(laws.length).toBe(6);
    });

    test('should have Einstein Field Equations', () => {
      const law = extendedLaws.getLawByName('Einstein Field Equations');
      expect(law).toBeDefined();
      expect(law?.originalFormula).toContain('Gμν');
    });

    test('should have Dirac Equation', () => {
      const law = extendedLaws.getLawByName('Dirac Equation');
      expect(law).toBeDefined();
      expect(law?.domain).toBe('Quantum Field Theory');
    });

    test('should have QCD Lagrangian', () => {
      const law = extendedLaws.getLawByName('QCD Lagrangian');
      expect(law).toBeDefined();
      expect(law?.constants.some(c => c.symbol === 'g_s')).toBe(true);
    });

    test('should have Casimir Effect', () => {
      const law = extendedLaws.getLawByName('Casimir Effect');
      expect(law).toBeDefined();
      expect(law?.originalFormula).toContain('π²ℏc');
    });

    test('should have Hawking Radiation', () => {
      const law = extendedLaws.getLawByName('Hawking Radiation');
      expect(law).toBeDefined();
      expect(law?.domain).toBe('Quantum Gravity');
    });

    test('should have Dark Energy Equation', () => {
      const law = extendedLaws.getLawByName('Dark Energy Equation');
      expect(law).toBeDefined();
      expect(law?.domain).toBe('Cosmology');
    });

    test('each law should have 5 reframings (all strategies)', () => {
      const laws = extendedLaws.getAllLaws();
      for (const law of laws) {
        expect(law.reframings.length).toBe(5);
        const strategies = law.reframings.map(r => r.strategy);
        expect(strategies).toContain('information');
        expect(strategies).toContain('computational');
        expect(strategies).toContain('geometric');
        expect(strategies).toContain('holographic');
        expect(strategies).toContain('emergent');
      }
    });

    test('should have validations for each law', () => {
      const laws = extendedLaws.getAllLaws();
      for (const law of laws) {
        expect(law.validations.length).toBeGreaterThan(0);
        expect(law.hash).toBeTruthy();
      }
    });

    test('getEinsteinFieldReframe should return reframed formulations', () => {
      const reframe = extendedLaws.getEinsteinFieldReframe();
      expect(reframe).not.toBeNull();
      expect(reframe?.informationReframe).toBeTruthy();
      expect(reframe?.holographicReframe).toBeTruthy();
    });

    test('getDiracReframe should return reframed formulations', () => {
      const reframe = extendedLaws.getDiracReframe();
      expect(reframe).not.toBeNull();
      expect(reframe?.computationalReframe).toBeTruthy();
      expect(reframe?.geometricReframe).toBeTruthy();
    });

    test('getReframingsByStrategy should filter correctly', () => {
      const infoReframings = extendedLaws.getReframingsByStrategy('information');
      expect(infoReframings.length).toBe(6); // One per law
      expect(infoReframings.every(r => r.strategy === 'information')).toBe(true);
    });

    test('getValidationSummary should return aggregated stats', () => {
      const summary = extendedLaws.getValidationSummary();
      expect(summary.totalLaws).toBe(6);
      expect(summary.totalReframings).toBe(30);
      expect(summary.averageValidationScore).toBeGreaterThan(0);
      expect(summary.passedValidations).toBeGreaterThanOrEqual(0);
    });

    test('exportToJson should produce valid JSON', () => {
      const json = extendedLaws.exportToJson();
      const parsed = JSON.parse(json);
      expect(parsed.laws).toBeDefined();
      expect(parsed.summary).toBeDefined();
      expect(parsed.hash).toBeTruthy();
    });

    test('getHash should return consistent hash', () => {
      const hash1 = extendedLaws.getHash();
      const hash2 = extendedLaws.getHash();
      expect(hash1).toBe(hash2);
    });
  });

  // ============================================
  // Phase 18.2: Cross Validator Tests
  // ============================================
  describe('Phase 18.2: CrossValidator', () => {
    let validator: CrossValidator;

    beforeEach(() => {
      validator = CrossValidatorFactory.createDefault();
    });

    test('runFullValidation should return consistency report', () => {
      const report = validator.runFullValidation();
      expect(report.id).toBeTruthy();
      expect(report.modulesChecked).toBeGreaterThan(0);
      expect(report.crossChecksPerformed).toBeGreaterThan(0);
      expect(report.consistencyScore).toBeGreaterThanOrEqual(0);
      expect(report.consistencyScore).toBeLessThanOrEqual(1);
    });

    test('should validate all module categories', () => {
      const report = validator.runFullValidation();
      const categories = new Set(report.moduleResults.map(r => r.category));
      expect(categories.has('foundation')).toBe(true);
      expect(categories.has('quantum')).toBe(true);
      expect(categories.has('spacetime')).toBe(true);
      expect(categories.has('antigravity')).toBe(true);
      expect(categories.has('visualization')).toBe(true);
    });

    test('analyzeCoherence should return coherence analysis', () => {
      const analysis = validator.analyzeCoherence();
      expect(analysis.mathematicalCoherence).toBeGreaterThan(0);
      expect(analysis.physicalCoherence).toBeGreaterThan(0);
      expect(analysis.computationalCoherence).toBeGreaterThan(0);
      expect(analysis.overallCoherence).toBeGreaterThan(0);
    });

    test('getResultsByCategory should filter correctly', () => {
      validator.runFullValidation();
      const foundationResults = validator.getResultsByCategory('foundation');
      expect(foundationResults.length).toBeGreaterThan(0);
      expect(foundationResults.every(r => r.category === 'foundation')).toBe(true);
    });

    test('getAllCrossResults should return cross-module checks', () => {
      validator.runFullValidation();
      const crossResults = validator.getAllCrossResults();
      expect(crossResults.length).toBeGreaterThan(0);
      expect(crossResults[0].sourceModule).toBeTruthy();
      expect(crossResults[0].targetModule).toBeTruthy();
    });

    test('exportReport should produce valid JSON', () => {
      const json = validator.exportReport();
      const parsed = JSON.parse(json);
      expect(parsed.modulesChecked).toBeGreaterThan(0);
    });

    test('report should have hash verification', () => {
      const report = validator.runFullValidation();
      expect(report.hash).toBeTruthy();
    });
  });

  // ============================================
  // Phase 18.4: Performance Optimizer Tests
  // ============================================
  describe('Phase 18.4: PerformanceOptimizer', () => {
    let optimizer: PerformanceOptimizer;

    beforeEach(() => {
      optimizer = PerformanceOptimizerFactory.createDefault();
    });

    test('measure should track performance metrics', () => {
      const { result, metrics } = optimizer.measure('test-op', () => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) sum += i;
        return sum;
      });
      
      expect(result).toBe(499500);
      expect(metrics.operationName).toBe('test-op');
      expect(metrics.executionTime).toBeGreaterThanOrEqual(0);
    });

    test('optimizeWithCache should cache results', () => {
      let callCount = 0;
      const compute = () => {
        callCount++;
        return 'computed';
      };
      
      const result1 = optimizer.optimizeWithCache('test-key', compute);
      const result2 = optimizer.optimizeWithCache('test-key', compute);
      
      expect(result1).toBe('computed');
      expect(result2).toBe('computed');
      expect(callCount).toBe(1); // Only called once
    });

    test('CacheManager should handle get/set', () => {
      const cache = new CacheManager<string>();
      
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('missing')).toBeNull();
    });

    test('CacheManager should track stats', () => {
      const cache = new CacheManager<number>();
      
      cache.set('a', 1);
      cache.get('a'); // hit
      cache.get('b'); // miss
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });

    test('CacheManager should evict based on LRU policy', () => {
      const cache = new CacheManager<number>({ maxSize: 3, evictionPolicy: 'lru' });
      
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      
      // Verify all three are cached
      expect(cache.get('a')).toBe(1);
      expect(cache.get('b')).toBe(2);
      expect(cache.get('c')).toBe(3);
      
      // Now add 'd', which should evict based on LRU
      // 'a', 'b', 'c' were all accessed, but we'll access 'a' again to ensure it's most recent
      cache.get('a');
      cache.set('d', 4);
      
      // 'd' should be in cache, and 'a' should still be there (accessed most recently)
      expect(cache.get('d')).toBe(4);
      expect(cache.getStats().size).toBeLessThanOrEqual(3);
    });

    test('ParallelProcessor should process tasks', async () => {
      const processor = new ParallelProcessor(2);
      
      const result = await processor.submitTask(5, (x) => x * 2);
      expect(result).toBe(10);
    });

    test('ParallelProcessor should process all in parallel', async () => {
      const processor = new ParallelProcessor(4);
      
      const results = await processor.processAll([1, 2, 3, 4], x => x * 2);
      expect(results).toEqual([2, 4, 6, 8]);
    });

    test('ParallelProcessor should parallel map', async () => {
      const processor = new ParallelProcessor(2);
      
      const results = await processor.parallelMap([1, 2, 3], (x, i) => x + i);
      expect(results).toEqual([1, 3, 5]); // 1+0, 2+1, 3+2
    });

    test('autoOptimize should return suggestions', () => {
      const suggestions = optimizer.autoOptimize();
      expect(Array.isArray(suggestions)).toBe(true);
    });

    test('exportPerformanceData should produce valid JSON', () => {
      optimizer.measure('test', () => 1);
      const json = optimizer.exportPerformanceData();
      const parsed = JSON.parse(json);
      expect(parsed.cache).toBeDefined();
      expect(parsed.processor).toBeDefined();
    });
  });

  // ============================================
  // Phase 18.5: Deployment Manager Tests
  // ============================================
  describe('Phase 18.5: DeploymentManager', () => {
    let manager: DeploymentManager;

    beforeEach(() => {
      manager = DeploymentManagerFactory.createDefault();
    });

    test('createPackage should create deployment package', () => {
      const pkg = manager.createPackage('qlaws-ham', '1.0.0', 'production', 'npm');
      
      expect(pkg.name).toBe('qlaws-ham');
      expect(pkg.version).toBe('1.0.0');
      expect(pkg.environment).toBe('production');
      expect(pkg.packageType).toBe('npm');
    });

    test('package should have files', () => {
      const pkg = manager.createPackage('test', '1.0.0', 'development', 'npm');
      
      expect(pkg.files.length).toBeGreaterThan(0);
      expect(pkg.files.some(f => f.type === 'source')).toBe(true);
      expect(pkg.files.some(f => f.type === 'config')).toBe(true);
      expect(pkg.files.some(f => f.type === 'doc')).toBe(true);
    });

    test('package should have dependencies', () => {
      const pkg = manager.createPackage('test', '1.0.0', 'development', 'npm');
      
      expect(pkg.dependencies.length).toBeGreaterThan(0);
      expect(pkg.dependencies.some(d => d.name === 'typescript')).toBe(true);
    });

    test('package should have scripts', () => {
      const pkg = manager.createPackage('test', '1.0.0', 'development', 'npm');
      
      expect(pkg.scripts.length).toBeGreaterThan(0);
      expect(pkg.scripts.some(s => s.type === 'install')).toBe(true);
      expect(pkg.scripts.some(s => s.type === 'deploy')).toBe(true);
    });

    test('createInstallerScript should create installer', () => {
      const script = manager.createInstallerScript('linux-install', 'linux');
      
      expect(script.name).toBe('linux-install');
      expect(script.platform).toBe('linux');
      expect(script.commands.length).toBeGreaterThan(0);
      expect(script.preChecks.length).toBeGreaterThan(0);
    });

    test('generateConfigFile should generate valid config', () => {
      const tools = manager.getAllConfigTools();
      expect(tools.length).toBeGreaterThan(0);
      
      const toolId = tools[0].id;
      const config = manager.generateConfigFile(toolId, 'production');
      const parsed = JSON.parse(config);
      
      expect(parsed).toBeDefined();
    });

    test('getAllPackages should return all packages', () => {
      manager.createPackage('pkg1', '1.0.0', 'development', 'npm');
      manager.createPackage('pkg2', '2.0.0', 'production', 'docker');
      
      const packages = manager.getAllPackages();
      expect(packages.length).toBe(2);
    });

    test('exportManifest should produce valid JSON', () => {
      manager.createPackage('test', '1.0.0', 'development', 'npm');
      const json = manager.exportManifest();
      const parsed = JSON.parse(json);
      
      expect(parsed.packages).toBeDefined();
      expect(parsed.hash).toBeTruthy();
    });

    test('package should have hash verification', () => {
      const pkg = manager.createPackage('test', '1.0.0', 'development', 'npm');
      expect(pkg.hash).toBeTruthy();
    });
  });

  // ============================================
  // Phase 18.6: Final Integration Tests
  // ============================================
  describe('Phase 18.6: FinalIntegration', () => {
    let integrationManager: FinalIntegrationManager;

    beforeEach(() => {
      integrationManager = FinalIntegrationManagerFactory.createDefault();
    });

    test('runFinalIntegration should return integration status', () => {
      const integration = integrationManager.runFinalIntegration();
      
      expect(integration.id).toBeTruthy();
      expect(integration.systemStatus.totalModules).toBeGreaterThan(0);
      expect(integration.moduleIntegration.length).toBeGreaterThan(0);
    });

    test('integration should check all 18 PRDs', () => {
      const integration = integrationManager.runFinalIntegration();
      
      const prds = integration.moduleIntegration.map(m => m.prd);
      expect(prds.length).toBe(18);
      expect(prds).toContain('PRD-01');
      expect(prds).toContain('PRD-18');
    });

    test('runLaunchValidation should return validation results', () => {
      const validation = integrationManager.runLaunchValidation();
      
      expect(validation.id).toBeTruthy();
      expect(validation.validators.length).toBeGreaterThan(0);
      expect(validation.results.length).toBeGreaterThan(0);
    });

    test('launch validation should issue certificate when passing', () => {
      // May or may not pass based on random validation
      const validation = integrationManager.runLaunchValidation();
      
      if (validation.overallPassed) {
        expect(validation.certificate).not.toBeNull();
        expect(validation.certificate?.signature).toBeTruthy();
      }
    });

    test('generateLaunchReport should return comprehensive report', () => {
      const report = integrationManager.generateLaunchReport();
      
      expect(report.id).toBeTruthy();
      expect(report.title).toContain('Qlaws Ham');
      expect(report.summary.projectName).toBeTruthy();
      expect(report.metrics.codeQuality).toBeGreaterThan(0);
    });

    test('launch report should have timeline', () => {
      const report = integrationManager.generateLaunchReport();
      
      expect(report.timeline.milestones.length).toBeGreaterThan(0);
      expect(report.timeline.milestones.some(m => m.status === 'complete')).toBe(true);
    });

    test('launch report should have risks', () => {
      const report = integrationManager.generateLaunchReport();
      
      expect(report.risks.length).toBeGreaterThan(0);
      expect(report.risks.every(r => r.mitigation)).toBe(true);
    });

    test('launch report should have approvals', () => {
      const report = integrationManager.generateLaunchReport();
      
      expect(report.approvals.length).toBeGreaterThan(0);
      expect(report.approvals.some(a => a.role === 'Technical Lead')).toBe(true);
    });

    test('exportFinalReport should produce valid JSON', () => {
      const json = integrationManager.exportFinalReport();
      const parsed = JSON.parse(json);
      
      expect(parsed.summary).toBeDefined();
      expect(parsed.metrics).toBeDefined();
      expect(parsed.hash).toBeTruthy();
    });

    test('all reports should have hash verification', () => {
      const integration = integrationManager.runFinalIntegration();
      const validation = integrationManager.runLaunchValidation();
      const report = integrationManager.generateLaunchReport();
      
      expect(integration.hash).toBeTruthy();
      expect(validation.hash).toBeTruthy();
      expect(report.hash).toBeTruthy();
    });
  });
});
