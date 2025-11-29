/**
 * ParadoxResolver - PRD-14 Phase 14.3
 * Paradox detection and resolution strategies for time travel
 */

import { Logger } from '../core/logger/Logger';
import { HashVerifier } from '../core/logger/HashVerifier';

// Paradox types
export type ParadoxType = 
  | 'grandfather'
  | 'bootstrap'
  | 'information'
  | 'predestination'
  | 'ontological'
  | 'causal_loop';

// Paradox analysis
export interface ParadoxAnalysis {
  id: string;
  type: ParadoxType;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detected: boolean;
  timelineAffected: string[];
  resolution: ResolutionStrategy | null;
  hash: string;
}

// Resolution strategy
export interface ResolutionStrategy {
  id: string;
  name: string;
  type: ResolutionType;
  description: string;
  steps: ResolutionStep[];
  successProbability: number;
  sideEffects: string[];
  hash: string;
}

export type ResolutionType = 
  | 'novikov_self_consistency'
  | 'many_worlds'
  | 'timeline_repair'
  | 'information_erasure'
  | 'causal_isolation'
  | 'predestination_acceptance';

export interface ResolutionStep {
  order: number;
  action: string;
  timing: string;
  requirements: string[];
}

// Timeline state
export interface TimelineState {
  id: string;
  name: string;
  divergencePoint: number;
  stability: number;
  paradoxes: string[];
  isMainTimeline: boolean;
  hash: string;
}

/**
 * ParadoxResolver - Main paradox resolution class
 */
export class ParadoxResolver {
  private logger: Logger;
  private knownParadoxes: Map<string, ParadoxAnalysis> = new Map();
  private strategies: Map<string, ResolutionStrategy> = new Map();
  private paradoxCount: number = 0;
  private strategyCount: number = 0;

  constructor() {
    this.logger = Logger.getInstance();
    this.initializeKnownParadoxes();
    this.initializeStrategies();
  }

  private initializeKnownParadoxes(): void {
    // Grandfather Paradox
    this.registerParadox({
      type: 'grandfather',
      name: 'Grandfather Paradox',
      description: 'Traveling back in time to prevent your own existence',
      severity: 'critical',
      timelineAffected: ['personal', 'causal']
    });

    // Bootstrap Paradox
    this.registerParadox({
      type: 'bootstrap',
      name: 'Bootstrap Paradox',
      description: 'Information or object with no origin in any timeline',
      severity: 'high',
      timelineAffected: ['information', 'causal']
    });

    // Information Paradox
    this.registerParadox({
      type: 'information',
      name: 'Information Paradox',
      description: 'Information sent back in time creating its own source',
      severity: 'medium',
      timelineAffected: ['information']
    });

    // Predestination Paradox
    this.registerParadox({
      type: 'predestination',
      name: 'Predestination Paradox',
      description: 'Events determined by time travel that caused them',
      severity: 'low',
      timelineAffected: ['causal']
    });

    // Ontological Paradox
    this.registerParadox({
      type: 'ontological',
      name: 'Ontological Paradox',
      description: 'Object or information exists without creation',
      severity: 'high',
      timelineAffected: ['existence', 'causal']
    });

    // Causal Loop
    this.registerParadox({
      type: 'causal_loop',
      name: 'Causal Loop Paradox',
      description: 'Closed causal chain with no external origin',
      severity: 'medium',
      timelineAffected: ['causal']
    });
  }

  private registerParadox(config: {
    type: ParadoxType;
    name: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timelineAffected: string[];
  }): void {
    const id = `paradox-${++this.paradoxCount}`;
    
    const paradox: ParadoxAnalysis = {
      id,
      type: config.type,
      name: config.name,
      description: config.description,
      severity: config.severity,
      detected: false,
      timelineAffected: config.timelineAffected,
      resolution: null,
      hash: ''
    };
    paradox.hash = HashVerifier.hash(JSON.stringify({ ...paradox, hash: '' }));

    this.knownParadoxes.set(id, paradox);

    this.logger.info('Paradox type registered', {
      id,
      type: config.type,
      severity: config.severity,
      hash: paradox.hash
    });
  }

  private initializeStrategies(): void {
    // Novikov Self-Consistency
    this.createStrategy({
      name: 'Novikov Self-Consistency Principle',
      type: 'novikov_self_consistency',
      description: 'Events automatically self-correct to maintain consistency',
      steps: [
        { order: 1, action: 'Accept predetermined outcome', timing: 'Before travel', requirements: ['Acceptance of fate'] },
        { order: 2, action: 'Allow natural course', timing: 'During travel', requirements: ['Non-interference'] },
        { order: 3, action: 'Observe consistency', timing: 'After travel', requirements: ['Verification'] }
      ],
      successProbability: 0.95,
      sideEffects: ['Free will implications', 'Deterministic universe']
    });

    // Many Worlds
    this.createStrategy({
      name: 'Many-Worlds Branching',
      type: 'many_worlds',
      description: 'Create new timeline branch avoiding paradox in original',
      steps: [
        { order: 1, action: 'Identify branch point', timing: 'Before action', requirements: ['Timeline mapping'] },
        { order: 2, action: 'Execute timeline split', timing: 'At intervention', requirements: ['Energy for branching'] },
        { order: 3, action: 'Navigate to desired branch', timing: 'After split', requirements: ['Branch selection'] }
      ],
      successProbability: 0.85,
      sideEffects: ['Creates alternate timeline', 'Original timeline unaffected']
    });

    // Timeline Repair
    this.createStrategy({
      name: 'Timeline Repair Protocol',
      type: 'timeline_repair',
      description: 'Actively repair timeline damage from paradox',
      steps: [
        { order: 1, action: 'Isolate paradox region', timing: 'Immediately', requirements: ['Temporal containment'] },
        { order: 2, action: 'Reverse causal damage', timing: 'Sequential', requirements: ['Reverse time field'] },
        { order: 3, action: 'Seal timeline', timing: 'Completion', requirements: ['Timeline lock'] }
      ],
      successProbability: 0.6,
      sideEffects: ['Memory alterations', 'Minor timeline drift']
    });

    // Information Erasure
    this.createStrategy({
      name: 'Information Erasure Protocol',
      type: 'information_erasure',
      description: 'Erase paradoxical information from timeline',
      steps: [
        { order: 1, action: 'Identify paradoxical information', timing: 'Detection', requirements: ['Information scan'] },
        { order: 2, action: 'Apply quantum erasure', timing: 'Execution', requirements: ['Quantum eraser'] },
        { order: 3, action: 'Verify erasure', timing: 'Verification', requirements: ['Consistency check'] }
      ],
      successProbability: 0.7,
      sideEffects: ['Information loss', 'Possible echoes']
    });

    // Causal Isolation
    this.createStrategy({
      name: 'Causal Isolation Bubble',
      type: 'causal_isolation',
      description: 'Isolate time traveler from causal effects',
      steps: [
        { order: 1, action: 'Generate isolation field', timing: 'Before travel', requirements: ['Isolation generator'] },
        { order: 2, action: 'Maintain bubble integrity', timing: 'During travel', requirements: ['Power supply'] },
        { order: 3, action: 'Safe reintegration', timing: 'After travel', requirements: ['Gradual reintegration'] }
      ],
      successProbability: 0.8,
      sideEffects: ['Limited interaction capability', 'Observer-only status']
    });

    // Predestination Acceptance
    this.createStrategy({
      name: 'Predestination Acceptance',
      type: 'predestination_acceptance',
      description: 'Accept that paradoxical events were always meant to happen',
      steps: [
        { order: 1, action: 'Recognize predestined pattern', timing: 'Analysis', requirements: ['Pattern recognition'] },
        { order: 2, action: 'Accept causal loop', timing: 'Understanding', requirements: ['Philosophical acceptance'] },
        { order: 3, action: 'Complete the loop', timing: 'Execution', requirements: ['Destiny fulfillment'] }
      ],
      successProbability: 0.9,
      sideEffects: ['Deterministic implications', 'No actual paradox']
    });
  }

  private createStrategy(config: Omit<ResolutionStrategy, 'id' | 'hash'>): void {
    const id = `strategy-${++this.strategyCount}`;
    
    const strategy: ResolutionStrategy = {
      id,
      ...config,
      hash: ''
    };
    strategy.hash = HashVerifier.hash(JSON.stringify({ ...strategy, hash: '' }));

    this.strategies.set(id, strategy);

    this.logger.info('Resolution strategy created', {
      id,
      name: config.name,
      type: config.type,
      successProbability: config.successProbability,
      hash: strategy.hash
    });
  }

  /**
   * Analyze potential paradox
   */
  analyzeParadox(actions: string[], targetTime: number, presentTime: number): ParadoxAnalysis[] {
    const detected: ParadoxAnalysis[] = [];
    const isPastTravel = targetTime < presentTime;

    // Check for grandfather-type paradox
    if (isPastTravel && actions.some(a => a.toLowerCase().includes('prevent') || a.toLowerCase().includes('kill'))) {
      const paradox = this.findParadoxByType('grandfather');
      if (paradox) {
        const analysis = { ...paradox, detected: true };
        analysis.resolution = this.getBestStrategy('grandfather');
        detected.push(analysis);
      }
    }

    // Check for information paradox
    if (isPastTravel && actions.some(a => a.toLowerCase().includes('tell') || a.toLowerCase().includes('inform'))) {
      const paradox = this.findParadoxByType('information');
      if (paradox) {
        const analysis = { ...paradox, detected: true };
        analysis.resolution = this.getBestStrategy('information');
        detected.push(analysis);
      }
    }

    // Check for bootstrap paradox
    if (actions.some(a => a.toLowerCase().includes('give') || a.toLowerCase().includes('bring'))) {
      const paradox = this.findParadoxByType('bootstrap');
      if (paradox) {
        const analysis = { ...paradox, detected: true };
        analysis.resolution = this.getBestStrategy('bootstrap');
        detected.push(analysis);
      }
    }

    return detected;
  }

  private findParadoxByType(type: ParadoxType): ParadoxAnalysis | undefined {
    return Array.from(this.knownParadoxes.values()).find(p => p.type === type);
  }

  private getBestStrategy(paradoxType: ParadoxType): ResolutionStrategy | null {
    const strategyMap: Record<ParadoxType, ResolutionType> = {
      'grandfather': 'many_worlds',
      'bootstrap': 'predestination_acceptance',
      'information': 'information_erasure',
      'predestination': 'predestination_acceptance',
      'ontological': 'novikov_self_consistency',
      'causal_loop': 'novikov_self_consistency'
    };

    const targetType = strategyMap[paradoxType];
    return Array.from(this.strategies.values()).find(s => s.type === targetType) || null;
  }

  /**
   * Resolve detected paradox
   */
  resolveParadox(paradoxId: string, strategyId: string): { success: boolean; message: string } {
    const paradox = this.knownParadoxes.get(paradoxId);
    const strategy = this.strategies.get(strategyId);

    if (!paradox || !strategy) {
      return { success: false, message: 'Invalid paradox or strategy ID' };
    }

    const roll = Math.random();
    const success = roll < strategy.successProbability;

    this.logger.proof('Paradox resolution attempted', {
      paradoxId,
      strategyId,
      success,
      roll,
      threshold: strategy.successProbability
    });

    return {
      success,
      message: success
        ? `Paradox resolved using ${strategy.name}`
        : `Resolution failed. Side effects: ${strategy.sideEffects.join(', ')}`
    };
  }

  /**
   * Get all known paradoxes
   */
  getAllParadoxes(): ParadoxAnalysis[] {
    return Array.from(this.knownParadoxes.values());
  }

  /**
   * Get all strategies
   */
  getAllStrategies(): ResolutionStrategy[] {
    return Array.from(this.strategies.values());
  }

  /**
   * Verify strategy hash
   */
  verifyStrategy(id: string): boolean {
    const strategy = this.strategies.get(id);
    if (!strategy) return false;

    const expectedHash = HashVerifier.hash(JSON.stringify({ ...strategy, hash: '' }));
    return expectedHash === strategy.hash;
  }

  /**
   * Get hash
   */
  getHash(): string {
    return HashVerifier.hash(JSON.stringify({
      paradoxCount: this.knownParadoxes.size,
      strategyCount: this.strategies.size
    }));
  }
}

/**
 * Factory for creating paradox resolvers
 */
export class ParadoxResolverFactory {
  static createDefault(): ParadoxResolver {
    return new ParadoxResolver();
  }
}
