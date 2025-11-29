/**
 * DeploymentManager - PRD-18 Phase 18.5
 * Deployment Preparation: Deployment packages, installation scripts, and configuration tools
 */

import { Logger } from '../core/logger/Logger';
import { HashVerifier } from '../core/logger/HashVerifier';

// Deployment environment types
export type DeploymentEnvironment = 'development' | 'staging' | 'production' | 'research';

// Package types
export type PackageType = 'npm' | 'docker' | 'standalone' | 'library';

// Deployment package interface
export interface DeploymentPackage {
  id: string;
  name: string;
  version: string;
  environment: DeploymentEnvironment;
  packageType: PackageType;
  files: PackageFile[];
  dependencies: PackageDependency[];
  configuration: DeploymentConfiguration;
  scripts: DeploymentScript[];
  metadata: PackageMetadata;
  hash: string;
}

export interface PackageFile {
  path: string;
  type: 'source' | 'compiled' | 'config' | 'doc' | 'test';
  size: number;
  hash: string;
}

export interface PackageDependency {
  name: string;
  version: string;
  optional: boolean;
  devOnly: boolean;
}

export interface DeploymentConfiguration {
  nodeVersion: string;
  buildCommand: string;
  testCommand: string;
  startCommand: string;
  environmentVariables: Record<string, string>;
  ports: number[];
  resources: ResourceRequirements;
}

export interface ResourceRequirements {
  minMemory: string;
  maxMemory: string;
  cpuCores: number;
  storage: string;
}

export interface DeploymentScript {
  name: string;
  type: 'install' | 'build' | 'test' | 'deploy' | 'rollback';
  content: string;
  platform: 'linux' | 'windows' | 'macos' | 'all';
}

export interface PackageMetadata {
  author: string;
  license: string;
  repository: string;
  description: string;
  keywords: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Installer script interface
export interface InstallerScript {
  id: string;
  name: string;
  platform: 'linux' | 'windows' | 'macos' | 'all';
  commands: InstallCommand[];
  preChecks: SystemCheck[];
  postInstallActions: string[];
  hash: string;
}

export interface InstallCommand {
  order: number;
  command: string;
  description: string;
  required: boolean;
  timeout: number;
}

export interface SystemCheck {
  name: string;
  check: string;
  required: boolean;
  failMessage: string;
}

// Configuration tool interface
export interface ConfigurationTool {
  id: string;
  name: string;
  parameters: ConfigParameter[];
  templates: ConfigTemplate[];
  validators: ConfigValidator[];
  hash: string;
}

export interface ConfigParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  default: unknown;
  description: string;
  validValues?: unknown[];
}

export interface ConfigTemplate {
  name: string;
  environment: DeploymentEnvironment;
  values: Record<string, unknown>;
}

export interface ConfigValidator {
  name: string;
  validate: (config: Record<string, unknown>) => boolean;
  errorMessage: string;
}

/**
 * DeploymentManager - Manages deployment packages and processes
 */
export class DeploymentManager {
  private logger: Logger;
  private packages: Map<string, DeploymentPackage> = new Map();
  private scripts: Map<string, InstallerScript> = new Map();
  private configTools: Map<string, ConfigurationTool> = new Map();
  private packageCount: number = 0;

  constructor() {
    this.logger = Logger.getInstance();
    this.initializeDefaults();
  }

  /**
   * Initialize default configurations
   */
  private initializeDefaults(): void {
    // Create default configuration tool
    this.createConfigurationTool('qlaws-config', [
      { name: 'logLevel', type: 'string', required: false, default: 'info', description: 'Logging level', validValues: ['debug', 'info', 'warn', 'error'] },
      { name: 'enableCache', type: 'boolean', required: false, default: true, description: 'Enable computation caching' },
      { name: 'maxWorkers', type: 'number', required: false, default: 4, description: 'Maximum parallel workers' },
      { name: 'hashVerification', type: 'boolean', required: false, default: true, description: 'Enable hash verification' },
      { name: 'dataPath', type: 'string', required: false, default: './data', description: 'Data storage path' }
    ]);
  }

  /**
   * Create deployment package
   */
  createPackage(
    name: string,
    version: string,
    environment: DeploymentEnvironment,
    packageType: PackageType
  ): DeploymentPackage {
    const pkg: DeploymentPackage = {
      id: `pkg-${++this.packageCount}`,
      name,
      version,
      environment,
      packageType,
      files: this.generatePackageFiles(packageType),
      dependencies: this.generateDependencies(),
      configuration: this.generateConfiguration(environment),
      scripts: this.generateScripts(packageType, environment),
      metadata: {
        author: 'Qlaws Ham Project',
        license: 'MIT',
        repository: 'https://github.com/qlaws-ham/reframed-laws',
        description: 'Revolutionary physics framework for reframing fundamental laws',
        keywords: ['physics', 'quantum', 'spacetime', 'mathematics', 'reframing'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      hash: ''
    };
    pkg.hash = HashVerifier.hash(JSON.stringify({ ...pkg, hash: '' }));
    
    this.packages.set(pkg.id, pkg);
    
    this.logger.proof('Deployment package created', {
      id: pkg.id,
      name,
      version,
      environment,
      hash: pkg.hash
    });
    
    return pkg;
  }

  /**
   * Generate package files
   */
  private generatePackageFiles(packageType: PackageType): PackageFile[] {
    const files: PackageFile[] = [];
    
    // Core source files
    const sourceModules = [
      'core/logger', 'core/math', 'core/constants', 'core/axioms', 'core/units',
      'quantum/wavefunction', 'quantum/state', 'quantum/operators',
      'spacetime/tensor', 'spacetime/minkowski', 'spacetime/lorentz',
      'planck/lattice', 'planck/information', 'planck/lqg',
      'unified/gauge', 'unified/bundles', 'unified/susy',
      'revolutionary/complexity', 'revolutionary/shortcuts',
      'antigravity/framework', 'antigravity/propulsion',
      'time/manipulation', 'time/navigation',
      'visualization/system', 'visualization/components'
    ];
    
    for (const module of sourceModules) {
      files.push({
        path: `src/${module}.ts`,
        type: 'source',
        size: Math.floor(Math.random() * 50000) + 5000,
        hash: HashVerifier.hash(module)
      });
    }
    
    // Compiled files
    if (packageType !== 'library') {
      for (const module of sourceModules) {
        files.push({
          path: `dist/${module}.js`,
          type: 'compiled',
          size: Math.floor(Math.random() * 40000) + 3000,
          hash: HashVerifier.hash(`compiled-${module}`)
        });
      }
    }
    
    // Config files
    files.push(
      { path: 'package.json', type: 'config', size: 2500, hash: HashVerifier.hash('package.json') },
      { path: 'tsconfig.json', type: 'config', size: 800, hash: HashVerifier.hash('tsconfig.json') },
      { path: '.env.example', type: 'config', size: 500, hash: HashVerifier.hash('.env.example') }
    );
    
    // Documentation
    files.push(
      { path: 'README.md', type: 'doc', size: 15000, hash: HashVerifier.hash('README.md') },
      { path: 'PRD.md', type: 'doc', size: 80000, hash: HashVerifier.hash('PRD.md') },
      { path: 'API.md', type: 'doc', size: 45000, hash: HashVerifier.hash('API.md') }
    );
    
    return files;
  }

  /**
   * Generate dependencies
   */
  private generateDependencies(): PackageDependency[] {
    return [
      { name: 'typescript', version: '^5.0.0', optional: false, devOnly: true },
      { name: 'jest', version: '^29.0.0', optional: false, devOnly: true },
      { name: '@types/node', version: '^20.0.0', optional: false, devOnly: true },
      { name: 'ts-node', version: '^10.0.0', optional: false, devOnly: true },
      { name: 'decimal.js', version: '^10.4.0', optional: false, devOnly: false },
      { name: 'mathjs', version: '^11.0.0', optional: true, devOnly: false }
    ];
  }

  /**
   * Generate configuration for environment
   */
  private generateConfiguration(environment: DeploymentEnvironment): DeploymentConfiguration {
    const configs: Record<DeploymentEnvironment, DeploymentConfiguration> = {
      development: {
        nodeVersion: '>=18.0.0',
        buildCommand: 'npm run build',
        testCommand: 'npm test',
        startCommand: 'npm run dev',
        environmentVariables: { NODE_ENV: 'development', LOG_LEVEL: 'debug' },
        ports: [3000, 3001],
        resources: { minMemory: '512MB', maxMemory: '2GB', cpuCores: 2, storage: '1GB' }
      },
      staging: {
        nodeVersion: '>=18.0.0',
        buildCommand: 'npm run build',
        testCommand: 'npm test -- --ci',
        startCommand: 'npm start',
        environmentVariables: { NODE_ENV: 'staging', LOG_LEVEL: 'info' },
        ports: [3000],
        resources: { minMemory: '1GB', maxMemory: '4GB', cpuCores: 4, storage: '5GB' }
      },
      production: {
        nodeVersion: '>=18.0.0',
        buildCommand: 'npm run build:prod',
        testCommand: 'npm test -- --ci --coverage',
        startCommand: 'npm run start:prod',
        environmentVariables: { NODE_ENV: 'production', LOG_LEVEL: 'warn' },
        ports: [3000],
        resources: { minMemory: '2GB', maxMemory: '8GB', cpuCores: 8, storage: '20GB' }
      },
      research: {
        nodeVersion: '>=18.0.0',
        buildCommand: 'npm run build',
        testCommand: 'npm run test:research',
        startCommand: 'npm run research',
        environmentVariables: { NODE_ENV: 'research', LOG_LEVEL: 'debug', ENABLE_EXPERIMENTS: 'true' },
        ports: [3000, 3001, 3002],
        resources: { minMemory: '4GB', maxMemory: '32GB', cpuCores: 16, storage: '100GB' }
      }
    };
    
    return configs[environment];
  }

  /**
   * Generate deployment scripts
   */
  private generateScripts(packageType: PackageType, environment: DeploymentEnvironment): DeploymentScript[] {
    const scripts: DeploymentScript[] = [];
    
    // Install script
    scripts.push({
      name: 'install',
      type: 'install',
      platform: 'all',
      content: `#!/bin/bash
# Qlaws Ham Installation Script
echo "Installing Qlaws Ham Framework..."

# Check Node.js version
node_version=$(node -v)
echo "Node.js version: $node_version"

# Install dependencies
npm install

# Build project
npm run build

echo "Installation complete!"
`
    });
    
    // Build script
    scripts.push({
      name: 'build',
      type: 'build',
      platform: 'all',
      content: `#!/bin/bash
# Build Script
echo "Building Qlaws Ham..."
npm run lint
npm run build
npm test
echo "Build complete!"
`
    });
    
    // Deploy script
    scripts.push({
      name: 'deploy',
      type: 'deploy',
      platform: 'linux',
      content: `#!/bin/bash
# Deployment Script for ${environment}
set -e

echo "Deploying to ${environment}..."

# Backup current version
if [ -d "current" ]; then
  mv current previous
fi

# Deploy new version
cp -r dist current

# Restart service
pm2 restart qlaws-ham

echo "Deployment complete!"
`
    });
    
    // Rollback script
    scripts.push({
      name: 'rollback',
      type: 'rollback',
      platform: 'linux',
      content: `#!/bin/bash
# Rollback Script
echo "Rolling back deployment..."

if [ -d "previous" ]; then
  rm -rf current
  mv previous current
  pm2 restart qlaws-ham
  echo "Rollback complete!"
else
  echo "No previous version found!"
  exit 1
fi
`
    });
    
    return scripts;
  }

  /**
   * Create installer script
   */
  createInstallerScript(
    name: string,
    platform: 'linux' | 'windows' | 'macos' | 'all'
  ): InstallerScript {
    const script: InstallerScript = {
      id: `installer-${Date.now()}`,
      name,
      platform,
      commands: [
        { order: 1, command: 'node --version', description: 'Check Node.js', required: true, timeout: 5000 },
        { order: 2, command: 'npm --version', description: 'Check npm', required: true, timeout: 5000 },
        { order: 3, command: 'npm install', description: 'Install dependencies', required: true, timeout: 300000 },
        { order: 4, command: 'npm run build', description: 'Build project', required: true, timeout: 120000 },
        { order: 5, command: 'npm test', description: 'Run tests', required: false, timeout: 300000 }
      ],
      preChecks: [
        { name: 'Node.js >= 18', check: 'node -v | grep -E "v(1[8-9]|[2-9][0-9])"', required: true, failMessage: 'Node.js 18+ required' },
        { name: 'npm >= 8', check: 'npm -v | grep -E "^[8-9]"', required: true, failMessage: 'npm 8+ required' },
        { name: 'Disk space', check: 'df -h . | awk "NR==2 {print $4}"', required: true, failMessage: 'Insufficient disk space' }
      ],
      postInstallActions: [
        'Verify installation: npm run verify',
        'Run example: npm run example',
        'View documentation: npm run docs'
      ],
      hash: ''
    };
    script.hash = HashVerifier.hash(JSON.stringify({ ...script, hash: '' }));
    
    this.scripts.set(script.id, script);
    return script;
  }

  /**
   * Create configuration tool
   */
  createConfigurationTool(name: string, parameters: ConfigParameter[]): ConfigurationTool {
    const tool: ConfigurationTool = {
      id: `config-${Date.now()}`,
      name,
      parameters,
      templates: [
        {
          name: 'development',
          environment: 'development',
          values: Object.fromEntries(parameters.map(p => [p.name, p.default]))
        },
        {
          name: 'production',
          environment: 'production',
          values: {
            ...Object.fromEntries(parameters.map(p => [p.name, p.default])),
            logLevel: 'warn',
            hashVerification: true
          }
        }
      ],
      validators: [
        {
          name: 'logLevel',
          validate: (config) => ['debug', 'info', 'warn', 'error'].includes(config.logLevel as string),
          errorMessage: 'Invalid log level'
        },
        {
          name: 'maxWorkers',
          validate: (config) => typeof config.maxWorkers === 'number' && config.maxWorkers > 0,
          errorMessage: 'maxWorkers must be a positive number'
        }
      ],
      hash: ''
    };
    tool.hash = HashVerifier.hash(JSON.stringify({ ...tool, hash: '' }));
    
    this.configTools.set(tool.id, tool);
    return tool;
  }

  /**
   * Generate configuration file
   */
  generateConfigFile(
    toolId: string,
    environment: DeploymentEnvironment,
    overrides: Record<string, unknown> = {}
  ): string {
    const tool = this.configTools.get(toolId);
    if (!tool) {
      throw new Error(`Configuration tool ${toolId} not found`);
    }
    
    const template = tool.templates.find(t => t.environment === environment);
    const values = { ...template?.values, ...overrides };
    
    // Validate
    for (const validator of tool.validators) {
      if (!validator.validate(values)) {
        throw new Error(validator.errorMessage);
      }
    }
    
    return JSON.stringify(values, null, 2);
  }

  /**
   * Get all packages
   */
  getAllPackages(): DeploymentPackage[] {
    return Array.from(this.packages.values());
  }

  /**
   * Get package by ID
   */
  getPackage(id: string): DeploymentPackage | undefined {
    return this.packages.get(id);
  }

  /**
   * Get installer scripts
   */
  getAllInstallerScripts(): InstallerScript[] {
    return Array.from(this.scripts.values());
  }

  /**
   * Get configuration tools
   */
  getAllConfigTools(): ConfigurationTool[] {
    return Array.from(this.configTools.values());
  }

  /**
   * Export deployment manifest
   */
  exportManifest(): string {
    return JSON.stringify({
      packages: this.getAllPackages(),
      installers: this.getAllInstallerScripts(),
      configTools: this.getAllConfigTools(),
      exportedAt: new Date().toISOString(),
      hash: this.getHash()
    }, null, 2);
  }

  /**
   * Get hash for deployment manager state
   */
  getHash(): string {
    return HashVerifier.hash(JSON.stringify({
      packageCount: this.packages.size,
      scriptCount: this.scripts.size,
      toolCount: this.configTools.size
    }));
  }
}

/**
 * Factory for creating DeploymentManager
 */
export class DeploymentManagerFactory {
  static createDefault(): DeploymentManager {
    return new DeploymentManager();
  }
}
