/**
 * AnimationSystem - PRD-17 Phase 17.4
 * Animation system for time evolution and transformations
 */

import { Logger } from '../core/logger/Logger';
import { HashVerifier } from '../core/logger/HashVerifier';

// Animation types
export type AnimationType = 
  | 'time_evolution'
  | 'transformation'
  | 'transition'
  | 'walkthrough'
  | 'oscillation'
  | 'propagation';

// Time evolution animation
export interface TimeEvolutionAnimation {
  id: string;
  name: string;
  duration: number; // seconds
  frameRate: number;
  keyframes: Keyframe[];
  loop: boolean;
  easing: string;
  hash: string;
}

export interface Keyframe {
  time: number;
  state: Record<string, number>;
  label?: string;
}

// Transformation animation
export interface TransformAnimation {
  id: string;
  name: string;
  fromState: Record<string, number | string>;
  toState: Record<string, number | string>;
  duration: number;
  easing: string;
  steps: TransformStep[];
  hash: string;
}

export interface TransformStep {
  progress: number; // 0-1
  description: string;
  intermediateState: Record<string, number | string>;
}

// Educational walkthrough
export interface Walkthrough {
  id: string;
  title: string;
  description: string;
  steps: WalkthroughStep[];
  currentStep: number;
  totalDuration: number;
  hash: string;
}

export interface WalkthroughStep {
  order: number;
  title: string;
  content: string;
  visualFocus: string;
  duration: number;
  interactive: boolean;
  quiz?: QuizQuestion;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

/**
 * AnimationSystem - Main animation system class
 */
export class AnimationSystem {
  private logger: Logger;
  private timeEvolutions: Map<string, TimeEvolutionAnimation> = new Map();
  private transformations: Map<string, TransformAnimation> = new Map();
  private walkthroughs: Map<string, Walkthrough> = new Map();
  private animationCount: number = 0;

  constructor() {
    this.logger = Logger.getInstance();
    this.initializeWalkthroughs();
  }

  private initializeWalkthroughs(): void {
    // Introduction walkthrough
    this.createWalkthrough({
      title: 'Introduction to Reframed Laws',
      description: 'Learn the basics of physics law reframing',
      steps: [
        { order: 1, title: 'What is Reframing?', content: 'Reframing is a technique to view physical laws from new perspectives.', visualFocus: 'overview', duration: 30, interactive: false },
        { order: 2, title: 'Original Laws', content: 'We start with fundamental physics laws like F=ma.', visualFocus: 'original', duration: 45, interactive: false },
        { order: 3, title: 'Reframing Strategies', content: 'Five strategies: information, computational, geometric, algebraic, quantum.', visualFocus: 'strategies', duration: 60, interactive: true },
        { order: 4, title: 'New Insights', content: 'Reframed laws reveal hidden connections and new possibilities.', visualFocus: 'insights', duration: 45, interactive: false },
        { order: 5, title: 'Quiz', content: 'Test your understanding.', visualFocus: 'quiz', duration: 60, interactive: true, quiz: { question: 'What is the main benefit of reframing physics laws?', options: ['Making them shorter', 'Revealing hidden connections', 'Making them harder', 'None'], correctIndex: 1 } }
      ]
    });

    // Advanced topics
    this.createWalkthrough({
      title: 'Advanced Reframing Techniques',
      description: 'Deep dive into advanced reframing methods',
      steps: [
        { order: 1, title: 'Information Theory', content: 'How information theory connects to physics.', visualFocus: 'info_theory', duration: 60, interactive: false },
        { order: 2, title: 'Computational Perspective', content: 'Viewing physics as computation.', visualFocus: 'computation', duration: 60, interactive: false },
        { order: 3, title: 'Geometric Framework', content: 'Using geometry to understand physics.', visualFocus: 'geometry', duration: 60, interactive: true }
      ]
    });
  }

  /**
   * Create time evolution animation
   */
  createTimeEvolution(config: {
    name: string;
    duration: number;
    keyframes: Keyframe[];
    loop?: boolean;
  }): TimeEvolutionAnimation {
    const id = `anim-te-${++this.animationCount}`;
    
    const animation: TimeEvolutionAnimation = {
      id,
      name: config.name,
      duration: config.duration,
      frameRate: 30,
      keyframes: config.keyframes,
      loop: config.loop || false,
      easing: 'ease-in-out',
      hash: ''
    };
    animation.hash = HashVerifier.hash(JSON.stringify({ ...animation, hash: '' }));

    this.timeEvolutions.set(id, animation);

    this.logger.info('Time evolution animation created', {
      id,
      name: config.name,
      duration: config.duration,
      keyframes: config.keyframes.length,
      hash: animation.hash
    });

    return animation;
  }

  /**
   * Create transformation animation
   */
  createTransformation(config: {
    name: string;
    fromState: Record<string, number | string>;
    toState: Record<string, number | string>;
    duration: number;
    stepDescriptions: string[];
  }): TransformAnimation {
    const id = `anim-tr-${++this.animationCount}`;
    
    // Generate intermediate steps
    const steps: TransformStep[] = config.stepDescriptions.map((desc, i) => ({
      progress: (i + 1) / config.stepDescriptions.length,
      description: desc,
      intermediateState: this.interpolateStates(config.fromState, config.toState, (i + 1) / config.stepDescriptions.length)
    }));

    const animation: TransformAnimation = {
      id,
      name: config.name,
      fromState: config.fromState,
      toState: config.toState,
      duration: config.duration,
      easing: 'ease-in-out',
      steps,
      hash: ''
    };
    animation.hash = HashVerifier.hash(JSON.stringify({ ...animation, hash: '' }));

    this.transformations.set(id, animation);

    this.logger.info('Transformation animation created', {
      id,
      name: config.name,
      duration: config.duration,
      steps: steps.length,
      hash: animation.hash
    });

    return animation;
  }

  private interpolateStates(from: Record<string, number | string>, to: Record<string, number | string>, t: number): Record<string, number | string> {
    const result: Record<string, number | string> = {};
    for (const key of Object.keys(from)) {
      if (typeof from[key] === 'number' && typeof to[key] === 'number') {
        result[key] = from[key] as number + t * ((to[key] as number) - (from[key] as number));
      } else {
        result[key] = t < 0.5 ? from[key] : to[key];
      }
    }
    return result;
  }

  /**
   * Create walkthrough
   */
  createWalkthrough(config: {
    title: string;
    description: string;
    steps: WalkthroughStep[];
  }): Walkthrough {
    const id = `walkthrough-${++this.animationCount}`;
    
    const totalDuration = config.steps.reduce((sum, s) => sum + s.duration, 0);

    const walkthrough: Walkthrough = {
      id,
      title: config.title,
      description: config.description,
      steps: config.steps,
      currentStep: 0,
      totalDuration,
      hash: ''
    };
    walkthrough.hash = HashVerifier.hash(JSON.stringify({ ...walkthrough, hash: '' }));

    this.walkthroughs.set(id, walkthrough);

    this.logger.info('Walkthrough created', {
      id,
      title: config.title,
      steps: config.steps.length,
      hash: walkthrough.hash
    });

    return walkthrough;
  }

  /**
   * Advance walkthrough step
   */
  advanceWalkthrough(walkthroughId: string): WalkthroughStep | null {
    const walkthrough = this.walkthroughs.get(walkthroughId);
    if (!walkthrough) return null;

    if (walkthrough.currentStep < walkthrough.steps.length - 1) {
      walkthrough.currentStep++;
      walkthrough.hash = HashVerifier.hash(JSON.stringify({ ...walkthrough, hash: '' }));
      return walkthrough.steps[walkthrough.currentStep];
    }
    return null;
  }

  /**
   * Get all time evolutions
   */
  getAllTimeEvolutions(): TimeEvolutionAnimation[] {
    return Array.from(this.timeEvolutions.values());
  }

  /**
   * Get all transformations
   */
  getAllTransformations(): TransformAnimation[] {
    return Array.from(this.transformations.values());
  }

  /**
   * Get all walkthroughs
   */
  getAllWalkthroughs(): Walkthrough[] {
    return Array.from(this.walkthroughs.values());
  }

  /**
   * Get hash
   */
  getHash(): string {
    return HashVerifier.hash(JSON.stringify({
      timeEvolutionCount: this.timeEvolutions.size,
      transformationCount: this.transformations.size,
      walkthroughCount: this.walkthroughs.size
    }));
  }
}

/**
 * Factory for creating AnimationSystem
 */
export class AnimationSystemFactory {
  static createDefault(): AnimationSystem {
    return new AnimationSystem();
  }
}
