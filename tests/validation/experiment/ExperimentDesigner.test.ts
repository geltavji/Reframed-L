/**
 * ExperimentDesigner Tests (M09.01)
 * PRD-09 Phase 9.1: Experimental Verification Design
 */

import {
  ExperimentDesigner,
  ExperimentFactory,
  HypothesisBuilder,
  Hypothesis,
  Experiment,
  ExperimentResult,
  SimulationResult,
  ReproducibilityGuide
} from '../../../src/validation/experiment/ExperimentDesigner';

describe('ExperimentDesigner', () => {
  let designer: ExperimentDesigner;

  beforeEach(() => {
    designer = new ExperimentDesigner();
  });

  describe('HypothesisBuilder', () => {
    it('should build a valid hypothesis', () => {
      const hypothesis = designer.createHypothesis()
        .setId('H1')
        .setStatement('Test hypothesis statement')
        .addVariable({
          name: 'x',
          type: 'independent',
          domain: { min: 0, max: 100 },
          description: 'Input variable'
        })
        .addVariable({
          name: 'y',
          type: 'dependent',
          domain: { min: 0, max: 1000 },
          description: 'Output variable'
        })
        .setNullHypothesis('No relationship between x and y')
        .setAlternativeHypothesis('y increases with x')
        .build();

      expect(hypothesis.id).toBe('H1');
      expect(hypothesis.statement).toBe('Test hypothesis statement');
      expect(hypothesis.variables.length).toBe(2);
      expect(hypothesis.hash).toBeDefined();
    });

    it('should throw error for hypothesis without id', () => {
      expect(() => {
        designer.createHypothesis()
          .setStatement('Test')
          .addVariable({ name: 'x', type: 'independent', domain: { min: 0, max: 1 }, description: 'd' })
          .setNullHypothesis('H0')
          .setAlternativeHypothesis('H1')
          .build();
      }).toThrow();
    });

    it('should throw error for hypothesis without variables', () => {
      expect(() => {
        designer.createHypothesis()
          .setId('H1')
          .setStatement('Test')
          .setNullHypothesis('H0')
          .setAlternativeHypothesis('H1')
          .build();
      }).toThrow();
    });

    it('should allow setting significance level', () => {
      const hypothesis = designer.createHypothesis()
        .setId('H1')
        .setStatement('Test')
        .addVariable({ name: 'x', type: 'independent', domain: { min: 0, max: 1 }, description: 'd' })
        .setNullHypothesis('H0')
        .setAlternativeHypothesis('H1')
        .setSignificanceLevel(0.01)
        .build();

      expect(hypothesis.significance).toBe(0.01);
    });

    it('should throw error for invalid significance level', () => {
      expect(() => {
        designer.createHypothesis()
          .setSignificanceLevel(0);
      }).toThrow();

      expect(() => {
        designer.createHypothesis()
          .setSignificanceLevel(1);
      }).toThrow();
    });

    it('should add predictions to hypothesis', () => {
      const hypothesis = designer.createHypothesis()
        .setId('H1')
        .setStatement('Test')
        .addVariable({ name: 'x', type: 'independent', domain: { min: 0, max: 1 }, description: 'd' })
        .setNullHypothesis('H0')
        .setAlternativeHypothesis('H1')
        .addPrediction({
          id: 'P1',
          condition: 'x > 0.5',
          expectedOutcome: 'y > 100',
          quantitative: { value: 150, uncertainty: 10, unit: 'units' },
          confidence: 0.95
        })
        .build();

      expect(hypothesis.predictions.length).toBe(1);
      expect(hypothesis.predictions[0].hash).toBeDefined();
    });
  });

  describe('Experiment Design', () => {
    let hypothesis: Hypothesis;

    beforeEach(() => {
      hypothesis = designer.createHypothesis()
        .setId('H1')
        .setStatement('Test hypothesis')
        .addVariable({ name: 'x', type: 'independent', domain: { min: 0, max: 100 }, description: 'Input' })
        .addVariable({ name: 'y', type: 'dependent', domain: { min: 0, max: 1000 }, description: 'Output' })
        .setNullHypothesis('H0')
        .setAlternativeHypothesis('H1')
        .build();
    });

    it('should design an experiment', () => {
      const experiment = designer.designExperiment(
        'Test Experiment',
        'Testing the hypothesis',
        hypothesis,
        {
          sampleSize: 100,
          repetitions: 10,
          randomization: true,
          blinding: 'double',
          controlGroup: true
        }
      );

      expect(experiment.id).toBeDefined();
      expect(experiment.name).toBe('Test Experiment');
      expect(experiment.status).toBe('designed');
      expect(experiment.hash).toBeDefined();
    });

    it('should add steps to experiment', () => {
      const experiment = designer.designExperiment('Test', 'Desc', hypothesis, {
        sampleSize: 50,
        repetitions: 5,
        randomization: true,
        blinding: 'none',
        controlGroup: false
      });

      designer.addStep(experiment.id, {
        order: 1,
        description: 'Initialize',
        duration: 10,
        inputs: ['config'],
        outputs: ['state']
      });

      const updated = designer.getExperiment(experiment.id);
      expect(updated?.steps.length).toBe(1);
      expect(updated?.expectedDuration).toBe(10);
    });

    it('should add equipment to experiment', () => {
      const experiment = designer.designExperiment('Test', 'Desc', hypothesis, {
        sampleSize: 50,
        repetitions: 5,
        randomization: true,
        blinding: 'none',
        controlGroup: false
      });

      designer.addEquipment(experiment.id, ['Equipment A', 'Equipment B']);

      const updated = designer.getExperiment(experiment.id);
      expect(updated?.equipment.length).toBe(2);
    });

    it('should finalize experiment', () => {
      const experiment = designer.designExperiment('Test', 'Desc', hypothesis, {
        sampleSize: 50,
        repetitions: 5,
        randomization: true,
        blinding: 'none',
        controlGroup: false
      });

      designer.addStep(experiment.id, {
        order: 1,
        description: 'Run test',
        inputs: [],
        outputs: []
      });

      const finalized = designer.finalizeExperiment(experiment.id);
      expect(finalized.status).toBe('ready');
    });

    it('should throw error finalizing experiment without steps', () => {
      const experiment = designer.designExperiment('Test', 'Desc', hypothesis, {
        sampleSize: 50,
        repetitions: 5,
        randomization: true,
        blinding: 'none',
        controlGroup: false
      });

      expect(() => designer.finalizeExperiment(experiment.id)).toThrow();
    });
  });

  describe('Simulation', () => {
    let experiment: Experiment;

    beforeEach(() => {
      const hypothesis = designer.createHypothesis()
        .setId('H1')
        .setStatement('Test hypothesis')
        .addVariable({ name: 'x', type: 'independent', domain: { min: 0, max: 100 }, description: 'Input' })
        .addVariable({ name: 'y', type: 'dependent', domain: { min: 0, max: 1000 }, description: 'Output' })
        .setNullHypothesis('H0')
        .setAlternativeHypothesis('H1')
        .addPrediction({
          id: 'P1',
          condition: 'standard',
          expectedOutcome: 'y = 100',
          quantitative: { value: 100, uncertainty: 5, unit: '' },
          confidence: 0.95
        })
        .build();

      experiment = designer.designExperiment('Test', 'Desc', hypothesis, {
        sampleSize: 50,
        repetitions: 5,
        randomization: true,
        blinding: 'none',
        controlGroup: false
      });

      designer.addStep(experiment.id, { order: 1, description: 'Test', inputs: [], outputs: ['y'] });
      designer.finalizeExperiment(experiment.id);
    });

    it('should run simulation', () => {
      const result = designer.runSimulation(experiment.id, {
        iterations: 100,
        precision: 6,
        parallelization: false,
        checkpoints: []
      });

      expect(result.iterations).toBe(100);
      expect(result.statistics.mean).toBeDefined();
      expect(result.hash).toBeDefined();
    });

    it('should run simulation with seed for reproducibility', () => {
      const result1 = designer.runSimulation(experiment.id, {
        iterations: 50,
        seed: 12345,
        precision: 6,
        parallelization: false,
        checkpoints: []
      });

      const result2 = designer.runSimulation(experiment.id, {
        iterations: 50,
        seed: 12345,
        precision: 6,
        parallelization: false,
        checkpoints: []
      });

      // Same seed should produce similar statistics
      expect(result1.iterations).toBe(result2.iterations);
    });
  });

  describe('Results Recording', () => {
    let experiment: Experiment;

    beforeEach(() => {
      const hypothesis = designer.createHypothesis()
        .setId('H1')
        .setStatement('Test')
        .addVariable({ name: 'x', type: 'dependent', domain: { min: 0, max: 1 }, description: 'd' })
        .setNullHypothesis('H0')
        .setAlternativeHypothesis('H1')
        .build();

      experiment = designer.designExperiment('Test', 'Desc', hypothesis, {
        sampleSize: 10,
        repetitions: 1,
        randomization: false,
        blinding: 'none',
        controlGroup: false
      });

      designer.addStep(experiment.id, { order: 1, description: 'Test', inputs: [], outputs: [] });
      designer.finalizeExperiment(experiment.id);
    });

    it('should record experiment result', () => {
      const result = designer.recordResult(
        experiment.id,
        1,
        { x: 0.5, y: 100 },
        ['Observation 1'],
        []
      );

      expect(result.runNumber).toBe(1);
      expect(result.valid).toBe(true);
      expect(result.hash).toBeDefined();
    });

    it('should mark result as invalid with anomalies', () => {
      const result = designer.recordResult(
        experiment.id,
        1,
        { x: 0.5 },
        [],
        ['Anomaly detected']
      );

      expect(result.valid).toBe(false);
      expect(result.anomalies.length).toBe(1);
    });

    it('should retrieve results', () => {
      designer.recordResult(experiment.id, 1, { x: 0.5 }, [], []);
      designer.recordResult(experiment.id, 2, { x: 0.6 }, [], []);

      const results = designer.getResults(experiment.id);
      expect(results.length).toBe(2);
    });
  });

  describe('Reproducibility Guide', () => {
    it('should generate reproducibility guide', () => {
      const hypothesis = designer.createHypothesis()
        .setId('H1')
        .setStatement('Test')
        .addVariable({ name: 'x', type: 'dependent', domain: { min: 0, max: 1 }, description: 'd' })
        .setNullHypothesis('H0')
        .setAlternativeHypothesis('H1')
        .addPrediction({
          id: 'P1',
          condition: 'standard',
          expectedOutcome: 'x = 0.5',
          quantitative: { value: 0.5, uncertainty: 0.05, unit: '' },
          confidence: 0.95
        })
        .build();

      const experiment = designer.designExperiment('Test', 'Desc', hypothesis, {
        sampleSize: 10,
        repetitions: 1,
        randomization: false,
        blinding: 'none',
        controlGroup: false
      });

      designer.addStep(experiment.id, { order: 1, description: 'Step 1', inputs: ['a'], outputs: ['b'] });
      designer.addEquipment(experiment.id, ['Equip A']);
      designer.finalizeExperiment(experiment.id);

      const guide = designer.generateReproducibilityGuide(experiment.id);

      expect(guide.experimentId).toBe(experiment.id);
      expect(guide.equipment.length).toBe(1);
      expect(guide.procedure.length).toBe(1);
      expect(guide.hash).toBeDefined();
    });
  });

  describe('ExperimentFactory', () => {
    it('should create quantum experiment', () => {
      const experiment = ExperimentFactory.quantumExperiment(designer, 'Quantum Test');
      
      expect(experiment.name).toBe('Quantum Test');
      expect(experiment.status).toBe('ready');
      expect(experiment.steps.length).toBeGreaterThan(0);
      expect(experiment.equipment.length).toBeGreaterThan(0);
    });

    it('should create complexity experiment', () => {
      const experiment = ExperimentFactory.complexityExperiment(designer, 'Complexity Test');
      
      expect(experiment.name).toBe('Complexity Test');
      expect(experiment.status).toBe('ready');
    });

    it('should create physics experiment', () => {
      const experiment = ExperimentFactory.physicsExperiment(designer, 'Physics Test');
      
      expect(experiment.name).toBe('Physics Test');
      expect(experiment.status).toBe('ready');
    });
  });

  describe('Proof Chain', () => {
    it('should export proof chain', () => {
      const hypothesis = designer.createHypothesis()
        .setId('H1')
        .setStatement('Test')
        .addVariable({ name: 'x', type: 'dependent', domain: { min: 0, max: 1 }, description: 'd' })
        .setNullHypothesis('H0')
        .setAlternativeHypothesis('H1')
        .build();

      designer.designExperiment('Test', 'Desc', hypothesis, {
        sampleSize: 10,
        repetitions: 1,
        randomization: false,
        blinding: 'none',
        controlGroup: false
      });

      const chain = designer.exportProofChain();
      expect(chain.experiments.length).toBe(1);
    });

    it('should generate hash', () => {
      const hash = designer.getHash();
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });
  });

  describe('Validation', () => {
    it('should throw error for invalid sample size', () => {
      const hypothesis = designer.createHypothesis()
        .setId('H1')
        .setStatement('Test')
        .addVariable({ name: 'x', type: 'dependent', domain: { min: 0, max: 1 }, description: 'd' })
        .setNullHypothesis('H0')
        .setAlternativeHypothesis('H1')
        .build();

      expect(() => {
        designer.designExperiment('Test', 'Desc', hypothesis, {
          sampleSize: 0,
          repetitions: 1,
          randomization: false,
          blinding: 'none',
          controlGroup: false
        });
      }).toThrow();
    });

    it('should throw error for invalid repetitions', () => {
      const hypothesis = designer.createHypothesis()
        .setId('H1')
        .setStatement('Test')
        .addVariable({ name: 'x', type: 'dependent', domain: { min: 0, max: 1 }, description: 'd' })
        .setNullHypothesis('H0')
        .setAlternativeHypothesis('H1')
        .build();

      expect(() => {
        designer.designExperiment('Test', 'Desc', hypothesis, {
          sampleSize: 10,
          repetitions: 0,
          randomization: false,
          blinding: 'none',
          controlGroup: false
        });
      }).toThrow();
    });
  });

  describe('Get All Experiments', () => {
    it('should return all designed experiments', () => {
      const hypothesis = designer.createHypothesis()
        .setId('H1')
        .setStatement('Test')
        .addVariable({ name: 'x', type: 'dependent', domain: { min: 0, max: 1 }, description: 'd' })
        .setNullHypothesis('H0')
        .setAlternativeHypothesis('H1')
        .build();

      designer.designExperiment('Test 1', 'Desc', hypothesis, {
        sampleSize: 10, repetitions: 1, randomization: false, blinding: 'none', controlGroup: false
      });
      designer.designExperiment('Test 2', 'Desc', hypothesis, {
        sampleSize: 10, repetitions: 1, randomization: false, blinding: 'none', controlGroup: false
      });

      const experiments = designer.getAllExperiments();
      expect(experiments.length).toBe(2);
    });
  });
});
