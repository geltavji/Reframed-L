/**
 * Curvature module index - PRD-03 Phase 3.5
 * 
 * Exports all curvature-related classes and interfaces.
 */

export {
  // Interfaces
  CurvatureTensorResult,
  CurvatureScalarResult,
  CurvatureInvariants,
  EinsteinEquationResult,
  GeodesicDeviationResult,
  CurvatureClassification,
  
  // Classes
  RiemannTensor,
  RicciTensor,
  RicciScalar,
  EinsteinTensor,
  WeylTensor,
  CurvatureInvariantsCalculator,
  GeodesicDeviation,
  CurvatureFactory
} from './RiemannTensor';
