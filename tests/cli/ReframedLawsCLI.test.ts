/**
 * Reframed Laws CLI Tests
 * PRD-17.2: Interactive Components Extension
 */

import { ReframedLawsCLI, ReframedLawsCLIFactory } from '../../src/cli/ReframedLawsCLI';

describe('ReframedLawsCLI', () => {
  let cli: ReframedLawsCLI;

  beforeEach(() => {
    cli = ReframedLawsCLIFactory.createDefault();
  });

  describe('Initialization', () => {
    test('should create CLI with default commands', () => {
      const commands = cli.getCommands();
      expect(commands.size).toBeGreaterThan(0);
      expect(commands.has('list')).toBe(true);
      expect(commands.has('show')).toBe(true);
      expect(commands.has('validate')).toBe(true);
      expect(commands.has('help')).toBe(true);
    });

    test('should initialize with laws', () => {
      const laws = cli.getLaws();
      expect(laws.size).toBeGreaterThan(0);
      expect(laws.has('newton-2')).toBe(true);
      expect(laws.has('einstein-mc2')).toBe(true);
    });

    test('should have extended laws from PRD-18', () => {
      const laws = cli.getLaws();
      expect(laws.has('einstein-field')).toBe(true);
      expect(laws.has('dirac')).toBe(true);
      expect(laws.has('hawking')).toBe(true);
    });
  });

  describe('Command Parsing', () => {
    test('should parse simple command', () => {
      const args = cli.parse('list');
      expect(args.command).toBe('list');
      expect(args.positional).toEqual([]);
      expect(args.options).toEqual({});
    });

    test('should parse command with positional args', () => {
      const args = cli.parse('show newton-2');
      expect(args.command).toBe('show');
      expect(args.positional).toEqual(['newton-2']);
    });

    test('should parse command with short options', () => {
      const args = cli.parse('list -d quantum');
      expect(args.command).toBe('list');
      expect(args.options['d']).toBe('quantum');
    });

    test('should parse command with long options', () => {
      const args = cli.parse('list --domain=quantum');
      expect(args.command).toBe('list');
      expect(args.options['domain']).toBe('quantum');
    });

    test('should parse boolean flags', () => {
      const args = cli.parse('show newton-2 -v');
      expect(args.options['v']).toBe(true);
    });
  });

  describe('List Command', () => {
    test('should list all laws', async () => {
      const result = await cli.execute('list --format=json');
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect((result.data as unknown[]).length).toBeGreaterThan(0);
    });

    test('should filter by domain', async () => {
      const result = await cli.execute('list -d relativity --format=json');
      expect(result.success).toBe(true);
      const laws = result.data as Array<{ domain: string }>;
      expect(laws.length).toBeGreaterThan(0);
      // All results should contain "relativity" in domain
      for (const law of laws) {
        expect(law.domain.toLowerCase()).toContain('relativity');
      }
    });

    test('should format as table by default', async () => {
      const result = await cli.execute('list');
      expect(result.success).toBe(true);
      expect(typeof result.data).toBe('string');
      expect(result.data).toContain('ID');
      expect(result.data).toContain('Name');
    });
  });

  describe('Show Command', () => {
    test('should show law details', async () => {
      const result = await cli.execute('show newton-2');
      expect(result.success).toBe(true);
      expect(result.message).toContain("Newton's Second Law");
      expect(result.message).toContain('F = ma');
    });

    test('should show specific reframing strategy', async () => {
      const result = await cli.execute('show newton-2 -s information');
      expect(result.success).toBe(true);
      expect(result.message).toContain('information');
    });

    test('should fail for unknown law', async () => {
      const result = await cli.execute('show unknown-law');
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });

    test('should require law ID', async () => {
      const result = await cli.execute('show');
      expect(result.success).toBe(false);
      expect(result.message).toContain('required');
    });
  });

  describe('Validate Command', () => {
    test('should validate law', async () => {
      const result = await cli.execute('validate newton-2');
      expect(result.success).toBeDefined();
      expect(result.data).toBeDefined();
    });

    test('should validate specific strategy', async () => {
      const result = await cli.execute('validate einstein-mc2 -s information');
      expect(result.success).toBeDefined();
      const data = result.data as Record<string, unknown>;
      expect(data['information']).toBeDefined();
    });

    test('should fail for unknown law', async () => {
      const result = await cli.execute('validate unknown');
      expect(result.success).toBe(false);
    });
  });

  describe('Generate Command', () => {
    test('should generate visualization', async () => {
      const result = await cli.execute('generate visualization newton-2');
      expect(result.success).toBe(true);
      const data = result.data as { content: string; format: string };
      expect(data.content).toContain('<!DOCTYPE html>');
      expect(data.content).toContain("Newton's Second Law");
    });

    test('should generate paper', async () => {
      const result = await cli.execute('generate paper schrodinger');
      expect(result.success).toBe(true);
      const paper = result.data as Record<string, string>;
      expect(paper.title).toBeDefined();
      expect(paper.abstract).toBeDefined();
      expect(paper.conclusion).toBeDefined();
    });

    test('should generate diagram', async () => {
      const result = await cli.execute('generate diagram maxwell');
      expect(result.success).toBe(true);
      const data = result.data as { type: string; content: string };
      expect(data.type).toBe('svg');
      expect(data.content).toContain('<svg');
    });

    test('should fail for missing arguments', async () => {
      const result = await cli.execute('generate');
      expect(result.success).toBe(false);
    });
  });

  describe('Simulate Command', () => {
    test('should run simulation', async () => {
      const result = await cli.execute('simulate antigravity casimir');
      expect(result.success).toBe(true);
      const data = result.data as { module: string; scenario: string; results: unknown };
      expect(data.module).toBe('antigravity');
      expect(data.scenario).toBe('casimir');
      expect(data.results).toBeDefined();
    });

    test('should accept iterations option', async () => {
      const result = await cli.execute('simulate time dilation -i 500');
      expect(result.success).toBe(true);
      const data = result.data as { iterations: number | string };
      expect(Number(data.iterations)).toBe(500);
    });

    test('should fail for missing arguments', async () => {
      const result = await cli.execute('simulate');
      expect(result.success).toBe(false);
    });
  });

  describe('Search Command', () => {
    test('should search laws', async () => {
      const result = await cli.execute('search quantum');
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    test('should find laws by name', async () => {
      const result = await cli.execute('search newton');
      expect(result.success).toBe(true);
      const data = result.data as Array<{ id: string }>;
      expect(data.some(r => r.id === 'newton-2')).toBe(true);
    });

    test('should respect limit option', async () => {
      const result = await cli.execute('search law -l 3');
      expect(result.success).toBe(true);
      const data = result.data as unknown[];
      expect(data.length).toBeLessThanOrEqual(3);
    });

    test('should fail for empty query', async () => {
      const result = await cli.execute('search');
      expect(result.success).toBe(false);
    });
  });

  describe('Compare Command', () => {
    test('should compare two laws', async () => {
      const result = await cli.execute('compare newton-2 einstein-mc2');
      expect(result.success).toBe(true);
      const data = result.data as { law1: unknown; law2: unknown; commonStrategies: string[] };
      expect(data.law1).toBeDefined();
      expect(data.law2).toBeDefined();
      expect(data.commonStrategies).toBeDefined();
    });

    test('should fail for unknown law', async () => {
      const result = await cli.execute('compare newton-2 unknown');
      expect(result.success).toBe(false);
    });

    test('should fail for missing arguments', async () => {
      const result = await cli.execute('compare newton-2');
      expect(result.success).toBe(false);
    });
  });

  describe('Export Command', () => {
    test('should export all laws as JSON', async () => {
      const result = await cli.execute('export all');
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    test('should export single law', async () => {
      const result = await cli.execute('export newton-2');
      expect(result.success).toBe(true);
      const data = result.data as { id: string };
      expect(data.id).toBe('newton-2');
    });

    test('should export as LaTeX', async () => {
      const result = await cli.execute('export newton-2 -f latex');
      expect(result.success).toBe(true);
      expect(typeof result.data).toBe('string');
      expect(result.data).toContain('\\documentclass');
    });
  });

  describe('Stats Command', () => {
    test('should show statistics', async () => {
      const result = await cli.execute('stats');
      expect(result.success).toBe(true);
      const data = result.data as { totalLaws: number; totalDomains: number };
      expect(data.totalLaws).toBeGreaterThan(0);
      expect(data.totalDomains).toBeGreaterThan(0);
    });

    test('should include strategy list', async () => {
      const result = await cli.execute('stats');
      const data = result.data as { strategies: string[] };
      expect(data.strategies).toContain('information');
      expect(data.strategies).toContain('computational');
    });
  });

  describe('Help Command', () => {
    test('should show help', async () => {
      const result = await cli.execute('help');
      expect(result.success).toBe(true);
      expect(result.message).toContain('list');
      expect(result.message).toContain('show');
      expect(result.message).toContain('validate');
    });

    test('should include examples', async () => {
      const result = await cli.execute('help');
      expect(result.message).toContain('Examples');
    });
  });

  describe('Unknown Command', () => {
    test('should handle unknown command', async () => {
      const result = await cli.execute('unknown');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Unknown command');
      expect(result.error).toContain('Available commands');
    });
  });

  describe('History', () => {
    test('should track command history', async () => {
      await cli.execute('list');
      await cli.execute('show newton-2');
      const history = cli.getHistory();
      expect(history).toContain('list');
      expect(history).toContain('show newton-2');
    });
  });
});

describe('ReframedLawsCLIFactory', () => {
  test('should create default CLI instance', () => {
    const cli = ReframedLawsCLIFactory.createDefault();
    expect(cli).toBeInstanceOf(ReframedLawsCLI);
  });
});
