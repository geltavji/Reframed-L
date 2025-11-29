/**
 * Final Module Index - PRD-18
 * Exports all final integration and validation modules
 */

// Phase 18.1: Extended Laws
export {
  ExtendedLaws,
  ExtendedLawsFactory,
  type ExtendedLaw,
  type ReframingStrategy,
  type ReframedFormulation,
  type LawValidation,
  type EinsteinFieldReframe,
  type DiracReframe,
  type PhysicalConstant
} from './ExtendedLaws';

// Phase 18.2: Cross Validator
export {
  CrossValidator,
  CrossValidatorFactory,
  type ModuleCategory,
  type ConsistencyReport,
  type ConsistencyIssue,
  type ModuleValidationResult,
  type CrossModuleResult,
  type CoherenceAnalysis,
  type Incoherency
} from './CrossValidator';

// Phase 18.4: Performance Optimizer
export {
  PerformanceOptimizer,
  PerformanceOptimizerFactory,
  CacheManager,
  ParallelProcessor,
  type CacheEntry,
  type CacheConfig,
  type PerformanceMetrics,
  type OptimizationResult,
  type ParallelTask
} from './PerformanceOptimizer';

// Phase 18.5: Deployment Manager
export {
  DeploymentManager,
  DeploymentManagerFactory,
  type DeploymentEnvironment,
  type PackageType,
  type DeploymentPackage,
  type PackageFile,
  type PackageDependency,
  type DeploymentConfiguration,
  type DeploymentScript,
  type InstallerScript,
  type ConfigurationTool,
  type ConfigParameter
} from './DeploymentManager';

// Phase 18.6: Final Integration
export {
  FinalIntegrationManager,
  FinalIntegrationManagerFactory,
  type FinalIntegration,
  type LaunchReadiness,
  type SystemStatus,
  type ModuleIntegrationStatus,
  type ValidationSummary,
  type LaunchReadinessReport,
  type LaunchValidation,
  type LaunchCertificate,
  type LaunchReport,
  type LaunchMetrics
} from './FinalIntegration';

// Existing PRD-12 modules
export { FinalValidator, FinalValidatorFactory } from './validation/FinalValidator';
export { SystemIntegrator, SystemIntegratorFactory } from './integration/SystemIntegrator';
export { DocumentationGenerator, DocumentationGeneratorFactory } from './docs/DocumentationGenerator';
export { Deployer, DeployerFactory } from './deploy/Deployer';
export { LaunchSystem, LaunchSystemFactory } from './launch/LaunchSystem';
export { ProjectCompletion, ProjectCompletionFactory } from './completion/ProjectCompletion';
