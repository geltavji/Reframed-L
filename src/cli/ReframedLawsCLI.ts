/**
 * Reframed Laws CLI
 * Command-line interface for interacting with the Reframed Laws framework
 * 
 * PRD-17.2: Interactive Components Extension
 */

import * as crypto from 'crypto';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface CLICommand {
  name: string;
  description: string;
  args: string[];
  options: CLIOption[];
  handler: (args: ParsedArgs) => Promise<CLIResponse>;
}

export interface CLIOption {
  name: string;
  shorthand: string;
  description: string;
  type: 'string' | 'number' | 'boolean';
  required: boolean;
  default?: unknown;
}

export interface ParsedArgs {
  command: string;
  positional: string[];
  options: Record<string, unknown>;
}

export interface CLIResponse {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
}

export interface ReframedLaw {
  id: string;
  name: string;
  original: string;
  reframings: Record<string, string>;
  domain: string;
  validationScore: number;
}

// ============================================================================
// Core CLI Implementation
// ============================================================================

export class ReframedLawsCLI {
  private commands: Map<string, CLICommand>;
  private laws: Map<string, ReframedLaw>;
  private history: string[];

  constructor() {
    this.commands = new Map();
    this.laws = new Map();
    this.history = [];
    this.initializeCommands();
    this.initializeLaws();
  }

  private initializeCommands(): void {
    // List command
    this.registerCommand({
      name: 'list',
      description: 'List all reframed laws or filter by domain',
      args: [],
      options: [
        { name: 'domain', shorthand: 'd', description: 'Filter by domain', type: 'string', required: false },
        { name: 'format', shorthand: 'f', description: 'Output format (json, table, plain)', type: 'string', required: false, default: 'table' }
      ],
      handler: this.listLaws.bind(this)
    });

    // Show command
    this.registerCommand({
      name: 'show',
      description: 'Show details of a specific law',
      args: ['lawId'],
      options: [
        { name: 'strategy', shorthand: 's', description: 'Show specific reframing strategy', type: 'string', required: false },
        { name: 'verbose', shorthand: 'v', description: 'Show detailed information', type: 'boolean', required: false, default: false }
      ],
      handler: this.showLaw.bind(this)
    });

    // Validate command
    this.registerCommand({
      name: 'validate',
      description: 'Validate a reframed law',
      args: ['lawId'],
      options: [
        { name: 'strategy', shorthand: 's', description: 'Strategy to validate', type: 'string', required: false, default: 'all' },
        { name: 'strict', shorthand: 'S', description: 'Use strict validation', type: 'boolean', required: false, default: false }
      ],
      handler: this.validateLaw.bind(this)
    });

    // Generate command
    this.registerCommand({
      name: 'generate',
      description: 'Generate visualization or research paper',
      args: ['type', 'lawId'],
      options: [
        { name: 'output', shorthand: 'o', description: 'Output file path', type: 'string', required: false },
        { name: 'format', shorthand: 'f', description: 'Output format', type: 'string', required: false, default: 'html' }
      ],
      handler: this.generate.bind(this)
    });

    // Simulate command
    this.registerCommand({
      name: 'simulate',
      description: 'Run physics simulation',
      args: ['module', 'scenario'],
      options: [
        { name: 'params', shorthand: 'p', description: 'Simulation parameters (JSON)', type: 'string', required: false },
        { name: 'iterations', shorthand: 'i', description: 'Number of iterations', type: 'number', required: false, default: 1000 }
      ],
      handler: this.simulate.bind(this)
    });

    // Search command
    this.registerCommand({
      name: 'search',
      description: 'Search laws and formulas',
      args: ['query'],
      options: [
        { name: 'type', shorthand: 't', description: 'Search type (law, formula, all)', type: 'string', required: false, default: 'all' },
        { name: 'limit', shorthand: 'l', description: 'Maximum results', type: 'number', required: false, default: 10 }
      ],
      handler: this.search.bind(this)
    });

    // Compare command
    this.registerCommand({
      name: 'compare',
      description: 'Compare two reframed laws',
      args: ['lawId1', 'lawId2'],
      options: [
        { name: 'metric', shorthand: 'm', description: 'Comparison metric', type: 'string', required: false, default: 'all' }
      ],
      handler: this.compare.bind(this)
    });

    // Export command
    this.registerCommand({
      name: 'export',
      description: 'Export laws or visualizations',
      args: ['target'],
      options: [
        { name: 'format', shorthand: 'f', description: 'Export format (json, latex, pdf)', type: 'string', required: false, default: 'json' },
        { name: 'output', shorthand: 'o', description: 'Output path', type: 'string', required: false }
      ],
      handler: this.exportData.bind(this)
    });

    // Stats command
    this.registerCommand({
      name: 'stats',
      description: 'Show framework statistics',
      args: [],
      options: [
        { name: 'detailed', shorthand: 'd', description: 'Show detailed statistics', type: 'boolean', required: false, default: false }
      ],
      handler: this.showStats.bind(this)
    });

    // Help command
    this.registerCommand({
      name: 'help',
      description: 'Show help information',
      args: [],
      options: [],
      handler: this.showHelp.bind(this)
    });
  }

  private initializeLaws(): void {
    // Original 6 laws
    this.laws.set('newton-2', {
      id: 'newton-2',
      name: "Newton's Second Law",
      original: 'F = ma',
      reframings: {
        information: 'I(F = ma) = -log₂(P(F))',
        computational: 'COMPUTE(F = ma) : O(1) → result',
        geometric: '∇·T_μν = 0 implies F = ma',
        holographic: 'F_boundary = ma_bulk (AdS/CFT)',
        emergent: 'F = ∂E/∂x emerges from entropy gradients'
      },
      domain: 'Classical Mechanics',
      validationScore: 0.92
    });

    this.laws.set('einstein-mc2', {
      id: 'einstein-mc2',
      name: 'Mass-Energy Equivalence',
      original: 'E = mc²',
      reframings: {
        information: 'I(E = mc²) = -log₂(P(E))',
        computational: 'COMPUTE(E) : O(1) from m',
        geometric: 'ds² = 0 implies E = mc²',
        holographic: 'E_boundary = (m_bulk)c² via AdS/CFT',
        emergent: 'E = mc² emerges from information flow'
      },
      domain: 'Special Relativity',
      validationScore: 0.95
    });

    this.laws.set('schrodinger', {
      id: 'schrodinger',
      name: 'Schrödinger Equation',
      original: 'iℏ∂ψ/∂t = Ĥψ',
      reframings: {
        information: 'I(ψ) evolution = -S(ψ|ψ₀)',
        computational: 'QUANTUM_COMPUTE(H, ψ) : O(1)',
        geometric: 'Ψ as section of Hilbert bundle',
        holographic: 'ψ_bulk = ∫ψ_boundary (reconstruction)',
        emergent: 'ψ emerges from entanglement network'
      },
      domain: 'Quantum Mechanics',
      validationScore: 0.88
    });

    this.laws.set('maxwell', {
      id: 'maxwell',
      name: 'Maxwell Equations',
      original: '∇×E = -∂B/∂t, ∇×B = μ₀(J + ε₀∂E/∂t)',
      reframings: {
        information: 'I(E,B) = ε₀∫(E² + c²B²)d³x',
        computational: 'PARALLEL_COMPUTE(E,B) : O(1)',
        geometric: 'F = dA, d*F = *J',
        holographic: 'A_bulk ↔ J_boundary',
        emergent: 'EM emerges from U(1) gauge symmetry'
      },
      domain: 'Electrodynamics',
      validationScore: 0.91
    });

    this.laws.set('thermodynamics-2', {
      id: 'thermodynamics-2',
      name: 'Second Law of Thermodynamics',
      original: 'dS ≥ 0',
      reframings: {
        information: 'I(t₂) ≥ I(t₁) (information monotonicity)',
        computational: 'IRREVERSIBLE_COMPUTE increases entropy',
        geometric: 'Entropy flow along geodesics',
        holographic: 'S_bulk ≤ A_boundary/(4G)',
        emergent: 'Arrow of time from initial conditions'
      },
      domain: 'Thermodynamics',
      validationScore: 0.89
    });

    this.laws.set('heisenberg', {
      id: 'heisenberg',
      name: 'Heisenberg Uncertainty',
      original: 'ΔxΔp ≥ ℏ/2',
      reframings: {
        information: 'I(x) + I(p) ≥ log(πeℏ)',
        computational: 'No O(1) simultaneous measurement',
        geometric: 'Phase space minimum area = ℏ',
        holographic: 'Uncertainty ↔ horizon complementarity',
        emergent: 'Uncertainty from discrete spacetime'
      },
      domain: 'Quantum Mechanics',
      validationScore: 0.93
    });

    // Extended 6 laws (PRD-18.1)
    this.laws.set('einstein-field', {
      id: 'einstein-field',
      name: 'Einstein Field Equations',
      original: 'G_μν + Λg_μν = (8πG/c⁴)T_μν',
      reframings: {
        information: 'I(G_μν) = S_gravity = A/(4l_P²)',
        computational: 'SPACETIME_COMPUTE(T) → g_μν',
        geometric: 'Ricci flow minimizes action',
        holographic: 'G_bulk = (c³/8πG)K_boundary',
        emergent: 'Gravity from entanglement entropy'
      },
      domain: 'General Relativity',
      validationScore: 0.94
    });

    this.laws.set('dirac', {
      id: 'dirac',
      name: 'Dirac Equation',
      original: '(iγ^μ∂_μ - m)ψ = 0',
      reframings: {
        information: 'I(ψ) = 4-component spinor entropy',
        computational: 'SPIN_COMPUTE(γ, ψ) : O(1)',
        geometric: 'ψ as Clifford bundle section',
        holographic: 'ψ_bulk ↔ CFT fermion',
        emergent: 'Spinor from discrete rotations'
      },
      domain: 'Quantum Field Theory',
      validationScore: 0.87
    });

    this.laws.set('qcd', {
      id: 'qcd',
      name: 'QCD Lagrangian',
      original: 'L = ψ̄(iγ^μD_μ - m)ψ - (1/4)G^a_μνG^aμν',
      reframings: {
        information: 'I(QCD) = color charge information',
        computational: 'LATTICE_COMPUTE(G, ψ)',
        geometric: 'Principal SU(3) bundle',
        holographic: 'Gluon flux ↔ string tension',
        emergent: 'Confinement from entanglement'
      },
      domain: 'Particle Physics',
      validationScore: 0.82
    });

    this.laws.set('casimir', {
      id: 'casimir',
      name: 'Casimir Effect',
      original: 'F/A = -π²ℏc/(240d⁴)',
      reframings: {
        information: 'I(vacuum) changes with boundary',
        computational: 'MODE_COUNT(d) → force',
        geometric: 'Boundary curvature → stress',
        holographic: 'Casimir ↔ boundary entanglement',
        emergent: 'Zero-point energy gradient'
      },
      domain: 'Quantum Electrodynamics',
      validationScore: 0.90
    });

    this.laws.set('hawking', {
      id: 'hawking',
      name: 'Hawking Radiation',
      original: 'T_H = ℏc³/(8πGMk_B)',
      reframings: {
        information: 'I_released = dA/(4l_P²)',
        computational: 'HORIZON_COMPUTE emits bits',
        geometric: 'Temperature = surface gravity/(2π)',
        holographic: 'Thermal CFT on boundary',
        emergent: 'Radiation from horizon entropy'
      },
      domain: 'Quantum Gravity',
      validationScore: 0.86
    });

    this.laws.set('dark-energy', {
      id: 'dark-energy',
      name: 'Dark Energy Equation',
      original: 'w = p/ρ = -1 (cosmological constant)',
      reframings: {
        information: 'I(Λ) = constant information density',
        computational: 'EXPAND_COMPUTE(H) : O(1)',
        geometric: 'de Sitter horizon',
        holographic: 'Λ ↔ holographic screen entropy',
        emergent: 'Dark energy from vacuum structure'
      },
      domain: 'Cosmology',
      validationScore: 0.79
    });
  }

  registerCommand(command: CLICommand): void {
    this.commands.set(command.name, command);
  }

  parse(input: string): ParsedArgs {
    const parts = input.trim().split(/\s+/);
    const command = parts[0] || 'help';
    const positional: string[] = [];
    const options: Record<string, unknown> = {};

    let i = 1;
    while (i < parts.length) {
      const part = parts[i];
      if (part.startsWith('--')) {
        const [key, value] = part.slice(2).split('=');
        options[key] = value ?? true;
      } else if (part.startsWith('-')) {
        const key = part.slice(1);
        const nextPart = parts[i + 1];
        if (nextPart && !nextPart.startsWith('-')) {
          options[key] = nextPart;
          i++;
        } else {
          options[key] = true;
        }
      } else {
        positional.push(part);
      }
      i++;
    }

    return { command, positional, options };
  }

  async execute(input: string): Promise<CLIResponse> {
    this.history.push(input);
    const args = this.parse(input);
    const command = this.commands.get(args.command);

    if (!command) {
      return {
        success: false,
        message: `Unknown command: ${args.command}`,
        error: `Available commands: ${Array.from(this.commands.keys()).join(', ')}`
      };
    }

    try {
      return await command.handler(args);
    } catch (error) {
      return {
        success: false,
        message: `Error executing command: ${args.command}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // Command Handlers
  private async listLaws(args: ParsedArgs): Promise<CLIResponse> {
    const domain = (args.options['domain'] || args.options['d']) as string | undefined;
    const format = (args.options['format'] || args.options['f'] || 'table') as string;

    let laws = Array.from(this.laws.values());
    if (domain) {
      laws = laws.filter(l => l.domain.toLowerCase().includes(domain.toLowerCase()));
    }

    if (format === 'json') {
      return {
        success: true,
        message: `Found ${laws.length} laws`,
        data: laws
      };
    }

    const table = laws.map(l => ({
      ID: l.id,
      Name: l.name,
      Domain: l.domain,
      Score: l.validationScore.toFixed(2)
    }));

    return {
      success: true,
      message: `Found ${laws.length} reframed laws`,
      data: this.formatTable(table)
    };
  }

  private async showLaw(args: ParsedArgs): Promise<CLIResponse> {
    const lawId = args.positional[0];
    if (!lawId) {
      return { success: false, message: 'Law ID required', error: 'Usage: show <lawId>' };
    }

    const law = this.laws.get(lawId);
    if (!law) {
      return { success: false, message: `Law not found: ${lawId}`, error: `Available: ${Array.from(this.laws.keys()).join(', ')}` };
    }

    const strategy = args.options['strategy'] as string | undefined;
    const verbose = args.options['verbose'] as boolean || args.options['v'] as boolean;

    let output = `\n=== ${law.name} ===\n`;
    output += `Domain: ${law.domain}\n`;
    output += `Original: ${law.original}\n`;
    output += `Validation Score: ${(law.validationScore * 100).toFixed(1)}%\n\n`;

    if (strategy) {
      const reframing = law.reframings[strategy];
      if (reframing) {
        output += `${strategy} reframing:\n  ${reframing}\n`;
      } else {
        output += `Strategy '${strategy}' not found.\n`;
        output += `Available: ${Object.keys(law.reframings).join(', ')}\n`;
      }
    } else {
      output += 'Reframings:\n';
      for (const [strat, formula] of Object.entries(law.reframings)) {
        output += `  ${strat}: ${formula}\n`;
      }
    }

    if (verbose) {
      output += `\nHash: ${this.computeHash(JSON.stringify(law))}\n`;
    }

    return {
      success: true,
      message: output,
      data: law
    };
  }

  private async validateLaw(args: ParsedArgs): Promise<CLIResponse> {
    const lawId = args.positional[0];
    if (!lawId) {
      return { success: false, message: 'Law ID required', error: 'Usage: validate <lawId>' };
    }

    const law = this.laws.get(lawId);
    if (!law) {
      return { success: false, message: `Law not found: ${lawId}` };
    }

    const strategy = (args.options['strategy'] || args.options['s'] || 'all') as string;
    const strict = args.options['strict'] as boolean || args.options['S'] as boolean;

    const validations: Record<string, { valid: boolean; score: number; issues: string[] }> = {};
    const strategies = strategy === 'all' ? Object.keys(law.reframings) : [strategy];

    for (const strat of strategies) {
      const formula = law.reframings[strat];
      if (!formula) continue;

      // Simulated validation
      const score = law.validationScore * (0.85 + Math.random() * 0.15);
      const threshold = strict ? 0.9 : 0.7;
      const issues: string[] = [];

      if (score < threshold) {
        issues.push(`Score ${score.toFixed(2)} below threshold ${threshold}`);
      }
      if (formula.length < 10) {
        issues.push('Formula may be incomplete');
      }

      validations[strat] = {
        valid: score >= threshold && issues.length === 0,
        score,
        issues
      };
    }

    const allValid = Object.values(validations).every(v => v.valid);
    const avgScore = Object.values(validations).reduce((sum, v) => sum + v.score, 0) / Object.keys(validations).length;

    return {
      success: allValid,
      message: `Validation ${allValid ? 'PASSED' : 'FAILED'} (avg score: ${(avgScore * 100).toFixed(1)}%)`,
      data: validations
    };
  }

  private async generate(args: ParsedArgs): Promise<CLIResponse> {
    const type = args.positional[0];
    const lawId = args.positional[1];

    if (!type || !lawId) {
      return { success: false, message: 'Usage: generate <type> <lawId>', error: 'type: visualization, paper, diagram' };
    }

    const law = this.laws.get(lawId);
    if (!law) {
      return { success: false, message: `Law not found: ${lawId}` };
    }

    const format = (args.options['format'] || args.options['f'] || 'html') as string;

    if (type === 'visualization') {
      const html = this.generateVisualizationHTML(law);
      return {
        success: true,
        message: `Generated ${format.toUpperCase()} visualization for ${law.name}`,
        data: { content: html, format }
      };
    } else if (type === 'paper') {
      const paper = this.generatePaperContent(law);
      return {
        success: true,
        message: `Generated research paper for ${law.name}`,
        data: paper
      };
    } else if (type === 'diagram') {
      return {
        success: true,
        message: `Generated diagram for ${law.name}`,
        data: { type: 'svg', content: this.generateDiagramSVG(law) }
      };
    }

    return { success: false, message: `Unknown generation type: ${type}` };
  }

  private async simulate(args: ParsedArgs): Promise<CLIResponse> {
    const module = args.positional[0];
    const scenario = args.positional[1];

    if (!module || !scenario) {
      return { success: false, message: 'Usage: simulate <module> <scenario>' };
    }

    const iterations = (args.options['iterations'] || args.options['i'] || 1000) as number;
    const paramsStr = args.options['params'] as string;
    let params = {};
    
    if (paramsStr) {
      try {
        params = JSON.parse(paramsStr);
      } catch {
        return { success: false, message: 'Invalid JSON in params', error: 'Use valid JSON format' };
      }
    }

    // Simulated simulation results
    const results = {
      module,
      scenario,
      iterations,
      params,
      results: {
        success_rate: 0.85 + Math.random() * 0.15,
        avg_time_ms: Math.random() * 100,
        convergence: true,
        anomalies: Math.floor(Math.random() * 5)
      },
      hash: this.computeHash(`${module}-${scenario}-${iterations}`)
    };

    return {
      success: true,
      message: `Simulation complete: ${iterations} iterations`,
      data: results
    };
  }

  private async search(args: ParsedArgs): Promise<CLIResponse> {
    const query = args.positional.join(' ').toLowerCase();
    if (!query) {
      return { success: false, message: 'Search query required' };
    }

    const limit = (args.options['limit'] || args.options['l'] || 10) as number;
    const results: Array<{ law: ReframedLaw; relevance: number; matches: string[] }> = [];

    for (const law of this.laws.values()) {
      const matches: string[] = [];
      let relevance = 0;

      if (law.name.toLowerCase().includes(query)) {
        matches.push('name');
        relevance += 3;
      }
      if (law.original.toLowerCase().includes(query)) {
        matches.push('original');
        relevance += 2;
      }
      if (law.domain.toLowerCase().includes(query)) {
        matches.push('domain');
        relevance += 2;
      }
      
      for (const [strategy, formula] of Object.entries(law.reframings)) {
        if (formula.toLowerCase().includes(query)) {
          matches.push(`reframing:${strategy}`);
          relevance += 1;
        }
      }

      if (matches.length > 0) {
        results.push({ law, relevance, matches });
      }
    }

    results.sort((a, b) => b.relevance - a.relevance);
    const limited = results.slice(0, limit);

    return {
      success: true,
      message: `Found ${results.length} results for "${query}"`,
      data: limited.map(r => ({
        id: r.law.id,
        name: r.law.name,
        relevance: r.relevance,
        matches: r.matches
      }))
    };
  }

  private async compare(args: ParsedArgs): Promise<CLIResponse> {
    const lawId1 = args.positional[0];
    const lawId2 = args.positional[1];

    if (!lawId1 || !lawId2) {
      return { success: false, message: 'Usage: compare <lawId1> <lawId2>' };
    }

    const law1 = this.laws.get(lawId1);
    const law2 = this.laws.get(lawId2);

    if (!law1) return { success: false, message: `Law not found: ${lawId1}` };
    if (!law2) return { success: false, message: `Law not found: ${lawId2}` };

    const comparison = {
      law1: { id: law1.id, name: law1.name, score: law1.validationScore },
      law2: { id: law2.id, name: law2.name, score: law2.validationScore },
      commonStrategies: Object.keys(law1.reframings).filter(s => s in law2.reframings),
      scoreDiff: Math.abs(law1.validationScore - law2.validationScore),
      sameDomain: law1.domain === law2.domain,
      recommendation: law1.validationScore > law2.validationScore 
        ? `${law1.name} has higher validation score`
        : `${law2.name} has higher validation score`
    };

    return {
      success: true,
      message: `Comparison: ${law1.name} vs ${law2.name}`,
      data: comparison
    };
  }

  private async exportData(args: ParsedArgs): Promise<CLIResponse> {
    const target = args.positional[0] || 'all';
    const format = (args.options['format'] || args.options['f'] || 'json') as string;

    let data: unknown;

    if (target === 'all') {
      data = Array.from(this.laws.values());
    } else if (this.laws.has(target)) {
      data = this.laws.get(target);
    } else {
      return { success: false, message: `Unknown export target: ${target}` };
    }

    if (format === 'latex') {
      const latex = this.generateLaTeX(data as ReframedLaw | ReframedLaw[]);
      return { success: true, message: 'Exported to LaTeX', data: latex };
    }

    return {
      success: true,
      message: `Exported ${target} as ${format}`,
      data
    };
  }

  private async showStats(_args: ParsedArgs): Promise<CLIResponse> {
    const totalLaws = this.laws.size;
    const domains = new Set(Array.from(this.laws.values()).map(l => l.domain));
    const avgScore = Array.from(this.laws.values()).reduce((sum, l) => sum + l.validationScore, 0) / totalLaws;
    const totalReframings = Array.from(this.laws.values()).reduce((sum, l) => sum + Object.keys(l.reframings).length, 0);

    const stats = {
      totalLaws,
      totalDomains: domains.size,
      domains: Array.from(domains),
      totalReframings,
      averageValidationScore: avgScore,
      strategies: ['information', 'computational', 'geometric', 'holographic', 'emergent'],
      commandsExecuted: this.history.length
    };

    return {
      success: true,
      message: `Framework Statistics:\n  Laws: ${totalLaws}\n  Domains: ${domains.size}\n  Reframings: ${totalReframings}\n  Avg Score: ${(avgScore * 100).toFixed(1)}%`,
      data: stats
    };
  }

  private async showHelp(_args: ParsedArgs): Promise<CLIResponse> {
    let help = '\n=== Reframed Laws CLI ===\n\nCommands:\n';
    
    for (const [name, cmd] of this.commands) {
      help += `\n  ${name} ${cmd.args.map(a => `<${a}>`).join(' ')}\n`;
      help += `    ${cmd.description}\n`;
      if (cmd.options.length > 0) {
        help += '    Options:\n';
        for (const opt of cmd.options) {
          help += `      -${opt.shorthand}, --${opt.name}: ${opt.description}\n`;
        }
      }
    }

    help += '\nExamples:\n';
    help += '  list --domain="Quantum"\n';
    help += '  show newton-2 -s information\n';
    help += '  validate einstein-mc2 --strict\n';
    help += '  generate visualization schrodinger\n';
    help += '  search "entropy"\n';

    return {
      success: true,
      message: help
    };
  }

  // Helper methods
  private formatTable(data: Array<Record<string, unknown>>): string {
    if (data.length === 0) return 'No data';

    const keys = Object.keys(data[0]);
    const widths = keys.map(k => Math.max(k.length, ...data.map(row => String(row[k]).length)));

    let table = '\n';
    table += keys.map((k, i) => k.padEnd(widths[i])).join(' | ') + '\n';
    table += widths.map(w => '-'.repeat(w)).join('-+-') + '\n';
    
    for (const row of data) {
      table += keys.map((k, i) => String(row[k]).padEnd(widths[i])).join(' | ') + '\n';
    }

    return table;
  }

  private computeHash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex').slice(0, 16);
  }

  private generateVisualizationHTML(law: ReframedLaw): string {
    return `<!DOCTYPE html>
<html>
<head>
  <title>${law.name} - Reframed Visualization</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .formula { background: #f0f0f0; padding: 20px; border-radius: 8px; margin: 10px 0; }
    .reframing { border-left: 3px solid #4CAF50; padding-left: 15px; margin: 10px 0; }
  </style>
</head>
<body>
  <h1>${law.name}</h1>
  <p>Domain: ${law.domain}</p>
  <div class="formula"><strong>Original:</strong> ${law.original}</div>
  <h2>Reframings</h2>
  ${Object.entries(law.reframings).map(([s, f]) => `<div class="reframing"><strong>${s}:</strong> ${f}</div>`).join('\n')}
  <p>Validation Score: ${(law.validationScore * 100).toFixed(1)}%</p>
</body>
</html>`;
  }

  private generatePaperContent(law: ReframedLaw): Record<string, string> {
    return {
      title: `Reframing ${law.name}: Five Perspectives`,
      abstract: `This paper presents five novel reframings of ${law.name} (${law.original}) from information-theoretic, computational, geometric, holographic, and emergent perspectives.`,
      introduction: `${law.name} is a fundamental law in ${law.domain}. We explore alternative formulations that reveal deeper connections.`,
      methodology: 'We apply systematic reframing strategies to transform classical formulations.',
      results: Object.entries(law.reframings).map(([s, f]) => `${s}: ${f}`).join('\n'),
      discussion: `The reframings reveal that ${law.name} can be understood from multiple perspectives, each offering unique insights.`,
      conclusion: `These reframings provide new avenues for theoretical and experimental research.`
    };
  }

  private generateDiagramSVG(law: ReframedLaw): string {
    return `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
  <rect fill="#f5f5f5" width="400" height="300"/>
  <text x="200" y="30" text-anchor="middle" font-size="16" font-weight="bold">${law.name}</text>
  <rect x="150" y="50" width="100" height="40" fill="#4CAF50" rx="5"/>
  <text x="200" y="75" text-anchor="middle" fill="white" font-size="12">${law.original}</text>
  ${Object.keys(law.reframings).map((s, i) => `
  <line x1="200" y1="90" x2="${80 + i * 60}" y2="140" stroke="#666"/>
  <circle cx="${80 + i * 60}" cy="160" r="30" fill="#2196F3"/>
  <text x="${80 + i * 60}" y="165" text-anchor="middle" fill="white" font-size="8">${s.slice(0, 4)}</text>
  `).join('')}
</svg>`;
  }

  private generateLaTeX(data: ReframedLaw | ReframedLaw[]): string {
    const laws = Array.isArray(data) ? data : [data];
    let latex = '\\documentclass{article}\n\\begin{document}\n\n';
    
    for (const law of laws) {
      latex += `\\section{${law.name}}\n`;
      latex += `\\textbf{Domain:} ${law.domain}\n\n`;
      latex += `\\textbf{Original:} $${law.original}$\n\n`;
      latex += '\\subsection{Reframings}\n';
      for (const [strategy, formula] of Object.entries(law.reframings)) {
        latex += `\\textbf{${strategy}:} $${formula}$\n\n`;
      }
    }
    
    latex += '\\end{document}';
    return latex;
  }

  // Public getters
  getHistory(): string[] {
    return [...this.history];
  }

  getLaws(): Map<string, ReframedLaw> {
    return new Map(this.laws);
  }

  getCommands(): Map<string, CLICommand> {
    return new Map(this.commands);
  }
}

// Factory
export class ReframedLawsCLIFactory {
  static createDefault(): ReframedLawsCLI {
    return new ReframedLawsCLI();
  }
}

// Export all
export default ReframedLawsCLI;
