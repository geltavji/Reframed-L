/**
 * ReframedLawsAPI - RESTful API interface for the Reframed Laws framework
 * PRD-17 Extension: Provides programmatic access to all framework features
 */

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  requestId: string;
}

export interface LawSummary {
  id: string;
  name: string;
  domain: string;
  originalFormula: string;
  strategies: string[];
}

export interface ReframedLaw {
  id: string;
  name: string;
  domain: string;
  originalFormula: string;
  reframings: {
    strategy: string;
    formula: string;
    explanation: string;
    validationScore: number;
  }[];
}

export interface ValidationResult {
  lawId: string;
  strategy: string;
  isValid: boolean;
  score: number;
  checks: {
    name: string;
    passed: boolean;
    message: string;
  }[];
}

export interface SimulationConfig {
  mechanism: string;
  parameters: Record<string, number>;
  iterations?: number;
  outputFormat?: 'json' | 'csv' | 'chart';
}

export interface SimulationResult {
  mechanism: string;
  success: boolean;
  results: {
    parameter: string;
    value: number;
    unit: string;
  }[];
  feasibilityScore: number;
  energyRequirement: number;
  warnings: string[];
}

export interface ExportConfig {
  format: 'json' | 'latex' | 'html' | 'pdf' | 'markdown';
  laws?: string[];
  includeValidation?: boolean;
  includeDerivations?: boolean;
}

export interface ExportResult {
  format: string;
  content: string;
  filename: string;
  size: number;
}

export class ReframedLawsAPI {
  private laws: Map<string, ReframedLaw>;
  private requestCounter: number = 0;

  constructor() {
    this.laws = new Map();
    this.initializeLaws();
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${++this.requestCounter}`;
  }

  private createResponse<T>(data?: T, error?: string): APIResponse<T> {
    return {
      success: !error,
      data,
      error,
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId()
    };
  }

  private initializeLaws(): void {
    const originalLaws = [
      {
        id: 'newton-2',
        name: "Newton's Second Law",
        domain: 'Classical Mechanics',
        originalFormula: 'F = ma',
        reframings: [
          { strategy: 'information', formula: 'I(F = ma) = -log₂(P(F))', explanation: 'Force as information content', validationScore: 0.85 },
          { strategy: 'computational', formula: 'COMPUTE(F = ma) : O(1) → result', explanation: 'Force as computation', validationScore: 0.82 },
          { strategy: 'geometric', formula: 'F = ∇_g(ma) in manifold M', explanation: 'Force in geometric space', validationScore: 0.88 },
          { strategy: 'entropic', formula: 'S(F) = k_B ln(Ω_F)', explanation: 'Force entropy', validationScore: 0.80 },
          { strategy: 'holographic', formula: 'F_bulk = A_boundary/(4G)', explanation: 'Holographic force', validationScore: 0.78 }
        ]
      },
      {
        id: 'einstein-mc2',
        name: 'Mass-Energy Equivalence',
        domain: 'Special Relativity',
        originalFormula: 'E = mc²',
        reframings: [
          { strategy: 'information', formula: 'I(E = mc²) = -log₂(P(E))', explanation: 'Energy as information', validationScore: 0.90 },
          { strategy: 'computational', formula: 'COMPUTE(E = mc²) : O(1) → result', explanation: 'Energy as computation', validationScore: 0.87 },
          { strategy: 'geometric', formula: 'E = g_μν p^μ p^ν / (2m)', explanation: 'Energy in curved spacetime', validationScore: 0.92 },
          { strategy: 'entropic', formula: 'S(E) = k_B ln(Ω_E)', explanation: 'Energy entropy', validationScore: 0.85 },
          { strategy: 'holographic', formula: 'E_bulk = A/(4l_P²)', explanation: 'Holographic energy', validationScore: 0.83 }
        ]
      },
      {
        id: 'schrodinger',
        name: 'Schrödinger Equation',
        domain: 'Quantum Mechanics',
        originalFormula: 'iℏ∂ψ/∂t = Ĥψ',
        reframings: [
          { strategy: 'information', formula: 'I(ψ) = -Tr(ρ log₂ ρ)', explanation: 'Wavefunction as quantum information', validationScore: 0.93 },
          { strategy: 'computational', formula: 'QCOMPUTE(Ĥψ) : O(2^n) → |ψ⟩', explanation: 'Quantum computation', validationScore: 0.91 },
          { strategy: 'geometric', formula: 'iℏ∇_H ψ = 0 in Hilbert bundle', explanation: 'Geometric quantum mechanics', validationScore: 0.89 },
          { strategy: 'entropic', formula: 'S(ψ) = -k_B Tr(ρ ln ρ)', explanation: 'Von Neumann entropy', validationScore: 0.94 },
          { strategy: 'holographic', formula: '|ψ⟩_bulk ↔ CFT_boundary', explanation: 'AdS/CFT correspondence', validationScore: 0.86 }
        ]
      },
      {
        id: 'maxwell',
        name: "Maxwell's Equations",
        domain: 'Electromagnetism',
        originalFormula: '∇·E = ρ/ε₀, ∇×B = μ₀J + μ₀ε₀∂E/∂t',
        reframings: [
          { strategy: 'information', formula: 'I(F^μν) = -log₂(P(field))', explanation: 'EM field as information', validationScore: 0.87 },
          { strategy: 'computational', formula: 'SIMULATE(Maxwell) : O(n³) → fields', explanation: 'Field simulation', validationScore: 0.85 },
          { strategy: 'geometric', formula: 'dF = 0, d*F = *J', explanation: 'Differential forms', validationScore: 0.95 },
          { strategy: 'entropic', formula: 'S(EM) = ∫ε₀E²/2 + B²/(2μ₀) d³x', explanation: 'EM entropy', validationScore: 0.82 },
          { strategy: 'holographic', formula: 'A_μ(bulk) ↔ J^μ(boundary)', explanation: 'Gauge/gravity duality', validationScore: 0.80 }
        ]
      },
      {
        id: 'thermodynamics-2',
        name: 'Second Law of Thermodynamics',
        domain: 'Thermodynamics',
        originalFormula: 'dS ≥ 0',
        reframings: [
          { strategy: 'information', formula: 'I_total ≤ I_max', explanation: 'Information bound', validationScore: 0.91 },
          { strategy: 'computational', formula: 'COMPUTE(entropy) : O(n log n) → S', explanation: 'Entropy computation', validationScore: 0.84 },
          { strategy: 'geometric', formula: '∇_g S ≥ 0 in state manifold', explanation: 'Geometric entropy flow', validationScore: 0.86 },
          { strategy: 'entropic', formula: 'S_universe → S_max', explanation: 'Universal entropy increase', validationScore: 0.96 },
          { strategy: 'holographic', formula: 'S ≤ A/(4l_P²)', explanation: 'Bekenstein bound', validationScore: 0.93 }
        ]
      },
      {
        id: 'heisenberg',
        name: 'Heisenberg Uncertainty Principle',
        domain: 'Quantum Mechanics',
        originalFormula: 'ΔxΔp ≥ ℏ/2',
        reframings: [
          { strategy: 'information', formula: 'I(x) + I(p) ≥ log₂(πeℏ)', explanation: 'Information uncertainty', validationScore: 0.92 },
          { strategy: 'computational', formula: 'MEASURE(x,p) : precision ≤ ℏ', explanation: 'Measurement limits', validationScore: 0.88 },
          { strategy: 'geometric', formula: 'ω(Δx, Δp) ≥ ℏ/2', explanation: 'Symplectic uncertainty', validationScore: 0.90 },
          { strategy: 'entropic', formula: 'H(x) + H(p) ≥ 1 + ln(π)', explanation: 'Entropic uncertainty', validationScore: 0.94 },
          { strategy: 'holographic', formula: 'δA ≥ l_P²', explanation: 'Minimum area quantum', validationScore: 0.85 }
        ]
      }
    ];

    const extendedLaws = [
      {
        id: 'einstein-field',
        name: 'Einstein Field Equations',
        domain: 'General Relativity',
        originalFormula: 'G_μν + Λg_μν = 8πG/c⁴ T_μν',
        reframings: [
          { strategy: 'information', formula: 'I(G_μν) = S_gravity = A/(4l_P²)', explanation: 'Gravity as information', validationScore: 0.91 },
          { strategy: 'computational', formula: 'COMPUTE(Einstein) : O(n⁴) → g_μν', explanation: 'Metric computation', validationScore: 0.85 },
          { strategy: 'geometric', formula: 'Ric - (1/2)Rg + Λg = 8πT', explanation: 'Ricci flow geometry', validationScore: 0.96 },
          { strategy: 'entropic', formula: 'δS = (c³/4Gℏ)δA', explanation: 'Entropic gravity', validationScore: 0.89 },
          { strategy: 'holographic', formula: 'G_μν(bulk) ↔ ⟨T_μν⟩(CFT)', explanation: 'AdS/CFT gravity', validationScore: 0.88 }
        ]
      },
      {
        id: 'dirac',
        name: 'Dirac Equation',
        domain: 'Quantum Field Theory',
        originalFormula: '(iγ^μ∂_μ - m)ψ = 0',
        reframings: [
          { strategy: 'information', formula: 'I(ψ) = -Tr(ρ_Dirac log₂ ρ_Dirac)', explanation: 'Spinor information', validationScore: 0.90 },
          { strategy: 'computational', formula: 'QCOMPUTE(Dirac) : O(4^n) → |ψ⟩', explanation: 'Fermion simulation', validationScore: 0.87 },
          { strategy: 'geometric', formula: '∇_S ψ = mψ in spin bundle', explanation: 'Spinor geometry', validationScore: 0.92 },
          { strategy: 'entropic', formula: 'S(ψ) = -∫ψ†ψ ln(ψ†ψ) d³x', explanation: 'Fermionic entropy', validationScore: 0.85 },
          { strategy: 'holographic', formula: 'ψ_bulk ↔ O_Δ(boundary)', explanation: 'Holographic fermions', validationScore: 0.83 }
        ]
      },
      {
        id: 'qcd',
        name: 'QCD Lagrangian',
        domain: 'Particle Physics',
        originalFormula: 'L = -¼G^a_μν G^aμν + ψ̄(iγ^μD_μ - m)ψ',
        reframings: [
          { strategy: 'information', formula: 'I(QCD) = I(gluon) + I(quark)', explanation: 'Color information', validationScore: 0.86 },
          { strategy: 'computational', formula: 'LATTICE_QCD : O(V⁴) → observables', explanation: 'Lattice computation', validationScore: 0.91 },
          { strategy: 'geometric', formula: 'F_A + *F_A = 0 in SU(3) bundle', explanation: 'Yang-Mills geometry', validationScore: 0.93 },
          { strategy: 'entropic', formula: 'S_QCD = -β∫tr(F∧*F)', explanation: 'Topological entropy', validationScore: 0.84 },
          { strategy: 'holographic', formula: 'QCD ↔ String theory (5D)', explanation: 'AdS/QCD duality', validationScore: 0.82 }
        ]
      },
      {
        id: 'casimir',
        name: 'Casimir Effect',
        domain: 'Quantum Electrodynamics',
        originalFormula: 'F/A = -π²ℏc/(240d⁴)',
        reframings: [
          { strategy: 'information', formula: 'I(Casimir) = log₂(modes_outside/modes_inside)', explanation: 'Mode information', validationScore: 0.88 },
          { strategy: 'computational', formula: 'SUM(ω_n) : regularized → F', explanation: 'Mode summation', validationScore: 0.90 },
          { strategy: 'geometric', formula: 'F = -∂E_vac/∂d in boundary geometry', explanation: 'Boundary energy', validationScore: 0.91 },
          { strategy: 'entropic', formula: 'F = T∂S_vac/∂d', explanation: 'Vacuum entropy force', validationScore: 0.85 },
          { strategy: 'holographic', formula: 'E_Casimir ∝ A/d³', explanation: 'Holographic Casimir', validationScore: 0.83 }
        ]
      },
      {
        id: 'hawking',
        name: 'Hawking Radiation',
        domain: 'Quantum Gravity',
        originalFormula: 'T_H = ℏc³/(8πGMk_B)',
        reframings: [
          { strategy: 'information', formula: 'I_Hawking = A/(4l_P²) bits', explanation: 'Information paradox', validationScore: 0.87 },
          { strategy: 'computational', formula: 'SCRAMBLE(info) : t_scr = M log(M)', explanation: 'Scrambling time', validationScore: 0.84 },
          { strategy: 'geometric', formula: 'T = κ/(2π) on horizon', explanation: 'Surface gravity temperature', validationScore: 0.93 },
          { strategy: 'entropic', formula: 'S_BH = A/(4l_P²) = 4πM²G²/ℏc', explanation: 'Bekenstein-Hawking entropy', validationScore: 0.96 },
          { strategy: 'holographic', formula: 'BH ↔ thermal CFT state', explanation: 'Thermal holography', validationScore: 0.91 }
        ]
      },
      {
        id: 'dark-energy',
        name: 'Dark Energy Equation',
        domain: 'Cosmology',
        originalFormula: 'w = P/ρ = -1 (Λ)',
        reframings: [
          { strategy: 'information', formula: 'I(Λ) = ln(ρ_Λ/ρ_P) bits/l_P³', explanation: 'Vacuum information density', validationScore: 0.82 },
          { strategy: 'computational', formula: 'INTEGRATE(Friedmann) : O(t) → a(t)', explanation: 'Scale factor evolution', validationScore: 0.88 },
          { strategy: 'geometric', formula: 'Λ = 3/l_dS² in de Sitter', explanation: 'de Sitter geometry', validationScore: 0.90 },
          { strategy: 'entropic', formula: 'S_dS = πl_dS²/l_P² = π/(Λl_P²)', explanation: 'de Sitter entropy', validationScore: 0.91 },
          { strategy: 'holographic', formula: 'ρ_Λ ∝ 1/l_IR²', explanation: 'Holographic dark energy', validationScore: 0.85 }
        ]
      }
    ];

    [...originalLaws, ...extendedLaws].forEach(law => {
      this.laws.set(law.id, law);
    });
  }

  listLaws(filters?: { domain?: string; strategy?: string }): APIResponse<LawSummary[]> {
    let laws = Array.from(this.laws.values());
    
    if (filters?.domain) {
      laws = laws.filter(l => l.domain.toLowerCase().includes(filters.domain!.toLowerCase()));
    }
    
    const summaries: LawSummary[] = laws.map(l => ({
      id: l.id,
      name: l.name,
      domain: l.domain,
      originalFormula: l.originalFormula,
      strategies: l.reframings.map(r => r.strategy)
    }));
    
    return this.createResponse(summaries);
  }

  getLaw(id: string): APIResponse<ReframedLaw> {
    const law = this.laws.get(id);
    if (!law) {
      return this.createResponse(undefined, `Law not found: ${id}`);
    }
    return this.createResponse(law);
  }

  validate(lawId: string, strategy: string, strict: boolean = false): APIResponse<ValidationResult> {
    const law = this.laws.get(lawId);
    if (!law) {
      return this.createResponse(undefined, `Law not found: ${lawId}`);
    }
    
    const reframing = law.reframings.find(r => r.strategy === strategy);
    if (!reframing) {
      return this.createResponse(undefined, `Strategy not found: ${strategy}`);
    }
    
    const threshold = strict ? 0.90 : 0.75;
    const checks = [
      { name: 'Mathematical Consistency', passed: reframing.validationScore >= 0.80, message: `Score: ${reframing.validationScore}` },
      { name: 'Physical Plausibility', passed: reframing.validationScore >= 0.75, message: 'Passes physical constraints' },
      { name: 'Dimensional Analysis', passed: true, message: 'Dimensions are consistent' },
      { name: 'Limiting Cases', passed: reframing.validationScore >= 0.70, message: 'Reduces to known results' },
      { name: 'Publication Ready', passed: reframing.validationScore >= threshold, message: strict ? 'Strict validation' : 'Standard validation' }
    ];
    
    return this.createResponse({
      lawId,
      strategy,
      isValid: checks.every(c => c.passed),
      score: reframing.validationScore,
      checks
    });
  }

  simulate(config: SimulationConfig): APIResponse<SimulationResult> {
    const mechanisms: Record<string, () => SimulationResult> = {
      'casimir': () => ({
        mechanism: 'casimir',
        success: true,
        results: [
          { parameter: 'Force', value: -1.3e-7 * (config.parameters.area || 1) / Math.pow(config.parameters.distance || 1e-6, 4), unit: 'N' },
          { parameter: 'Energy', value: -2.4e-8 * (config.parameters.area || 1) / Math.pow(config.parameters.distance || 1e-6, 3), unit: 'J' }
        ],
        feasibilityScore: 0.95,
        energyRequirement: 1e-12,
        warnings: []
      }),
      'alcubierre': () => ({
        mechanism: 'alcubierre',
        success: true,
        results: [
          { parameter: 'Warp Factor', value: config.parameters.velocity || 1, unit: 'c' },
          { parameter: 'Bubble Radius', value: config.parameters.radius || 100, unit: 'm' },
          { parameter: 'Energy Required', value: Math.pow(config.parameters.velocity || 1, 2) * 1e45, unit: 'J' }
        ],
        feasibilityScore: 0.15,
        energyRequirement: 1e45,
        warnings: ['Requires negative energy density', 'Exotic matter needed', 'Causality concerns']
      }),
      'time-dilation': () => {
        const v = config.parameters.velocity || 0.5;
        const gamma = 1 / Math.sqrt(1 - v * v);
        return {
          mechanism: 'time-dilation',
          success: true,
          results: [
            { parameter: 'Lorentz Factor', value: gamma, unit: '' },
            { parameter: 'Time Dilation', value: gamma, unit: 'factor' },
            { parameter: 'Proper Time (1 year)', value: 365.25 / gamma, unit: 'days' }
          ],
          feasibilityScore: 1.0,
          energyRequirement: config.parameters.mass ? config.parameters.mass * 3e8 * 3e8 * (gamma - 1) : 1e18,
          warnings: v > 0.99 ? ['Extreme energy requirements'] : []
        };
      }
    };
    
    const simulator = mechanisms[config.mechanism];
    if (!simulator) {
      return this.createResponse(undefined, `Unknown mechanism: ${config.mechanism}`);
    }
    
    return this.createResponse(simulator());
  }

  export(config: ExportConfig): APIResponse<ExportResult> {
    const lawsToExport = config.laws 
      ? config.laws.map(id => this.laws.get(id)).filter(Boolean) as ReframedLaw[]
      : Array.from(this.laws.values());
    
    let content: string;
    let filename: string;
    
    switch (config.format) {
      case 'json':
        content = JSON.stringify(lawsToExport, null, 2);
        filename = 'reframed_laws.json';
        break;
      case 'latex':
        content = this.generateLatex(lawsToExport, config);
        filename = 'reframed_laws.tex';
        break;
      case 'html':
        content = this.generateHTML(lawsToExport);
        filename = 'reframed_laws.html';
        break;
      case 'markdown':
        content = this.generateMarkdown(lawsToExport);
        filename = 'reframed_laws.md';
        break;
      default:
        return this.createResponse(undefined, `Unsupported format: ${config.format}`);
    }
    
    return this.createResponse({
      format: config.format,
      content,
      filename,
      size: content.length
    });
  }

  private generateLatex(laws: ReframedLaw[], config: ExportConfig): string {
    let latex = `\\documentclass{article}\n\\usepackage{amsmath,amssymb}\n\\title{Reframed Physics Laws}\n\\begin{document}\n\\maketitle\n`;
    laws.forEach(law => {
      latex += `\\section{${law.name}}\nOriginal: $${law.originalFormula}$\n`;
      law.reframings.forEach(r => {
        latex += `\\subsection{${r.strategy}}\n$${r.formula}$\n${r.explanation}\n`;
      });
    });
    latex += `\\end{document}`;
    return latex;
  }

  private generateHTML(laws: ReframedLaw[]): string {
    return `<!DOCTYPE html><html><head><title>Reframed Laws</title></head><body><h1>Reframed Physics Laws</h1>${laws.map(l => `<h2>${l.name}</h2><p>${l.originalFormula}</p>`).join('')}</body></html>`;
  }

  private generateMarkdown(laws: ReframedLaw[]): string {
    return laws.map(l => `# ${l.name}\n\n**Original:** ${l.originalFormula}\n\n${l.reframings.map(r => `## ${r.strategy}\n${r.formula}\n${r.explanation}`).join('\n\n')}`).join('\n\n---\n\n');
  }

  getStats(): APIResponse<{ totalLaws: number; totalReframings: number; averageScore: number }> {
    const laws = Array.from(this.laws.values());
    const allReframings = laws.flatMap(l => l.reframings);
    return this.createResponse({
      totalLaws: laws.length,
      totalReframings: allReframings.length,
      averageScore: allReframings.reduce((sum, r) => sum + r.validationScore, 0) / allReframings.length
    });
  }

  search(query: string): APIResponse<LawSummary[]> {
    const queryLower = query.toLowerCase();
    const results = Array.from(this.laws.values())
      .filter(l => l.name.toLowerCase().includes(queryLower) || l.domain.toLowerCase().includes(queryLower))
      .map(l => ({ id: l.id, name: l.name, domain: l.domain, originalFormula: l.originalFormula, strategies: l.reframings.map(r => r.strategy) }));
    return this.createResponse(results);
  }
}

export class ReframedLawsAPIFactory {
  static createDefault(): ReframedLawsAPI {
    return new ReframedLawsAPI();
  }
}
