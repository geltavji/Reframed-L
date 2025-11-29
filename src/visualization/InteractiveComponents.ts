/**
 * InteractiveComponents - PRD-17 Phase 17.2
 * Interactive UI components for formula exploration
 */

import { Logger } from '../core/logger/Logger';
import { HashVerifier } from '../core/logger/HashVerifier';

// Parameter control
export interface ParameterControl {
  id: string;
  name: string;
  symbol: string;
  type: 'slider' | 'input' | 'dropdown' | 'toggle';
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  description: string;
  hash: string;
}

// Formula explorer state
export interface FormulaExplorerState {
  id: string;
  formulaId: string;
  parameters: ParameterControl[];
  currentOutput: number;
  history: ExplorationStep[];
  hash: string;
}

export interface ExplorationStep {
  timestamp: Date;
  parameters: Record<string, number>;
  output: number;
}

// Real-time update
export interface RealTimeUpdate {
  timestamp: Date;
  parameterId: string;
  oldValue: number;
  newValue: number;
  resultingOutput: number;
  computationTime: number;
}

/**
 * InteractiveComponents - Main interactive components class
 */
export class InteractiveComponents {
  private logger: Logger;
  private explorerStates: Map<string, FormulaExplorerState> = new Map();
  private stateCount: number = 0;

  constructor() {
    this.logger = Logger.getInstance();
  }

  /**
   * Create formula explorer
   */
  createFormulaExplorer(formulaId: string, parameters: Omit<ParameterControl, 'id' | 'hash'>[]): FormulaExplorerState {
    const id = `explorer-${++this.stateCount}`;
    
    const paramControls: ParameterControl[] = parameters.map((p, i) => {
      const control: ParameterControl = {
        id: `param-${id}-${i}`,
        ...p,
        hash: ''
      };
      control.hash = HashVerifier.hash(JSON.stringify({ ...control, hash: '' }));
      return control;
    });

    const state: FormulaExplorerState = {
      id,
      formulaId,
      parameters: paramControls,
      currentOutput: this.calculateOutput(paramControls),
      history: [],
      hash: ''
    };
    state.hash = HashVerifier.hash(JSON.stringify({ ...state, hash: '' }));

    this.explorerStates.set(id, state);

    this.logger.info('Formula explorer created', {
      id,
      formulaId,
      parameterCount: parameters.length,
      hash: state.hash
    });

    return state;
  }

  /**
   * Update parameter value
   */
  updateParameter(explorerId: string, parameterId: string, newValue: number): RealTimeUpdate | null {
    const state = this.explorerStates.get(explorerId);
    if (!state) return null;

    const param = state.parameters.find(p => p.id === parameterId);
    if (!param) return null;

    const startTime = Date.now();
    const oldValue = param.value;
    
    // Update parameter
    param.value = Math.max(param.min, Math.min(param.max, newValue));
    param.hash = HashVerifier.hash(JSON.stringify({ ...param, hash: '' }));

    // Recalculate output
    const newOutput = this.calculateOutput(state.parameters);
    state.currentOutput = newOutput;

    // Record history
    const historyEntry: ExplorationStep = {
      timestamp: new Date(),
      parameters: Object.fromEntries(state.parameters.map(p => [p.symbol, p.value])),
      output: newOutput
    };
    state.history.push(historyEntry);

    // Update state hash
    state.hash = HashVerifier.hash(JSON.stringify({ ...state, hash: '' }));

    const update: RealTimeUpdate = {
      timestamp: new Date(),
      parameterId,
      oldValue,
      newValue: param.value,
      resultingOutput: newOutput,
      computationTime: Date.now() - startTime
    };

    this.logger.info('Parameter updated', {
      explorerId,
      parameterId,
      oldValue,
      newValue: param.value,
      output: newOutput
    });

    return update;
  }

  /**
   * Calculate output based on parameters
   */
  private calculateOutput(parameters: ParameterControl[]): number {
    // Generic calculation - would be customized per formula
    return parameters.reduce((sum, p) => sum + p.value, 0);
  }

  /**
   * Reset explorer to defaults
   */
  resetExplorer(explorerId: string): FormulaExplorerState | null {
    const state = this.explorerStates.get(explorerId);
    if (!state) return null;

    // Reset all parameters to their middle value
    state.parameters.forEach(p => {
      p.value = (p.min + p.max) / 2;
      p.hash = HashVerifier.hash(JSON.stringify({ ...p, hash: '' }));
    });

    state.currentOutput = this.calculateOutput(state.parameters);
    state.history = [];
    state.hash = HashVerifier.hash(JSON.stringify({ ...state, hash: '' }));

    return state;
  }

  /**
   * Get explorer state
   */
  getExplorerState(explorerId: string): FormulaExplorerState | undefined {
    return this.explorerStates.get(explorerId);
  }

  /**
   * Get all explorer states
   */
  getAllExplorerStates(): FormulaExplorerState[] {
    return Array.from(this.explorerStates.values());
  }

  /**
   * Generate HTML for parameter controls
   */
  generateControlsHTML(explorerId: string): string {
    const state = this.explorerStates.get(explorerId);
    if (!state) return '';

    let html = '<div class="parameter-controls">\n';
    
    for (const param of state.parameters) {
      html += `  <div class="control" id="${param.id}">\n`;
      html += `    <label>${param.name} (${param.symbol})</label>\n`;
      html += `    <input type="range" min="${param.min}" max="${param.max}" step="${param.step}" value="${param.value}">\n`;
      html += `    <span class="value">${param.value} ${param.unit}</span>\n`;
      html += `    <p class="description">${param.description}</p>\n`;
      html += `  </div>\n`;
    }
    
    html += '</div>';
    return html;
  }

  /**
   * Get hash
   */
  getHash(): string {
    return HashVerifier.hash(JSON.stringify({
      stateCount: this.explorerStates.size
    }));
  }
}

/**
 * Factory for creating InteractiveComponents
 */
export class InteractiveComponentsFactory {
  static createDefault(): InteractiveComponents {
    return new InteractiveComponents();
  }
}
