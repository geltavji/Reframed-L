/**
 * Qlaws Ham - Logger Module (M01.01)
 * 
 * Universal logging system with zero external dependencies.
 * Implements hash verification for all logged computations.
 * Enables proof chain tracking for scientific validation.
 * 
 * @module Logger
 * @version 1.0.0
 * @dependencies NONE
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Log levels for categorizing log entries
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  PROOF = 4,
  VALIDATION = 5
}

/**
 * Interface for a single log entry with hash verification
 */
export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: unknown;
  hash: string;
  previousHash: string;
  proofChainId?: string;
}

/**
 * Configuration options for Logger
 */
export interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  filePath?: string;
  maxFileSize?: number;
  enableHashChain: boolean;
}

/**
 * Logger class - Universal logging with hash verification
 * 
 * Features:
 * - Multiple log levels (DEBUG, INFO, WARN, ERROR, PROOF, VALIDATION)
 * - SHA-256 hash generation for each entry
 * - Proof chain linking between entries
 * - File and console output support
 * - Thread-safe implementation
 */
export class Logger {
  private static instance: Logger | null = null;
  private config: LoggerConfig;
  private entries: LogEntry[] = [];
  private lastHash: string = '0'.repeat(64);
  private entryCounter: number = 0;
  private proofChainId: string;
  private fileStream: fs.WriteStream | null = null;

  /**
   * Private constructor for singleton pattern
   */
  private constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: false,
      enableHashChain: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB default
      ...config
    };
    this.proofChainId = this.generateProofChainId();
    
    if (this.config.enableFile && this.config.filePath) {
      this.initFileStream();
    }
  }

  /**
   * Get singleton instance of Logger
   */
  public static getInstance(config?: Partial<LoggerConfig>): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    }
    return Logger.instance;
  }

  /**
   * Reset the singleton instance (for testing)
   */
  public static resetInstance(): void {
    if (Logger.instance) {
      Logger.instance.close();
      Logger.instance = null;
    }
  }

  /**
   * Generate unique proof chain ID
   */
  private generateProofChainId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `PC-${timestamp}-${random}`;
  }

  /**
   * Initialize file stream for file logging
   */
  private initFileStream(): void {
    if (this.config.filePath) {
      const dir = path.dirname(this.config.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      this.fileStream = fs.createWriteStream(this.config.filePath, { flags: 'a' });
    }
  }

  /**
   * Generate SHA-256 hash for log entry
   */
  private generateHash(entry: Omit<LogEntry, 'hash'>): string {
    const data = JSON.stringify({
      id: entry.id,
      timestamp: entry.timestamp.toISOString(),
      level: entry.level,
      message: entry.message,
      data: entry.data,
      previousHash: entry.previousHash,
      proofChainId: entry.proofChainId
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate unique entry ID
   */
  private generateEntryId(): string {
    this.entryCounter++;
    return `LOG-${this.proofChainId}-${this.entryCounter.toString().padStart(8, '0')}`;
  }

  /**
   * Create a log entry with hash verification
   */
  private createEntry(level: LogLevel, message: string, data?: unknown): LogEntry {
    const partialEntry: Omit<LogEntry, 'hash'> = {
      id: this.generateEntryId(),
      timestamp: new Date(),
      level,
      message,
      data,
      previousHash: this.lastHash,
      proofChainId: this.proofChainId
    };

    const hash = this.generateHash(partialEntry);
    const entry: LogEntry = { ...partialEntry, hash };

    if (this.config.enableHashChain) {
      this.lastHash = hash;
    }

    return entry;
  }

  /**
   * Output log entry to configured destinations
   */
  private output(entry: LogEntry): void {
    const levelName = LogLevel[entry.level];
    const timestamp = entry.timestamp.toISOString();
    const dataStr = entry.data ? ` | Data: ${JSON.stringify(entry.data)}` : '';
    const hashStr = ` | Hash: ${entry.hash.substring(0, 16)}...`;
    
    const formattedMessage = `[${timestamp}] [${levelName}] ${entry.message}${dataStr}${hashStr}`;

    if (this.config.enableConsole && entry.level >= this.config.minLevel) {
      switch (entry.level) {
        case LogLevel.ERROR:
          console.error(formattedMessage);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage);
          break;
        default:
          console.log(formattedMessage);
      }
    }

    if (this.config.enableFile && this.fileStream) {
      this.fileStream.write(JSON.stringify(entry) + '\n');
    }
  }

  /**
   * Core logging method
   */
  public log(level: LogLevel, message: string, data?: unknown): LogEntry {
    const entry = this.createEntry(level, message, data);
    this.entries.push(entry);
    this.output(entry);
    return entry;
  }

  /**
   * Debug level log
   */
  public debug(message: string, data?: unknown): LogEntry {
    return this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Info level log
   */
  public info(message: string, data?: unknown): LogEntry {
    return this.log(LogLevel.INFO, message, data);
  }

  /**
   * Warning level log
   */
  public warn(message: string, data?: unknown): LogEntry {
    return this.log(LogLevel.WARN, message, data);
  }

  /**
   * Error level log
   */
  public error(message: string, data?: unknown): LogEntry {
    return this.log(LogLevel.ERROR, message, data);
  }

  /**
   * Proof level log - for scientific proofs
   */
  public proof(message: string, data?: unknown): LogEntry {
    return this.log(LogLevel.PROOF, message, data);
  }

  /**
   * Validation level log - for validation results
   */
  public validation(message: string, data?: unknown): LogEntry {
    return this.log(LogLevel.VALIDATION, message, data);
  }

  /**
   * Get all log entries
   */
  public getEntries(): LogEntry[] {
    return [...this.entries];
  }

  /**
   * Get entries by level
   */
  public getEntriesByLevel(level: LogLevel): LogEntry[] {
    return this.entries.filter(e => e.level === level);
  }

  /**
   * Get the current proof chain ID
   */
  public getProofChainId(): string {
    return this.proofChainId;
  }

  /**
   * Get the last hash in the chain
   */
  public getLastHash(): string {
    return this.lastHash;
  }

  /**
   * Get entry count
   */
  public getEntryCount(): number {
    return this.entries.length;
  }

  /**
   * Verify the hash chain integrity
   */
  public verifyHashChain(): boolean {
    if (this.entries.length === 0) return true;

    let previousHash = '0'.repeat(64);
    
    for (const entry of this.entries) {
      // Verify previous hash matches
      if (entry.previousHash !== previousHash) {
        return false;
      }

      // Verify entry hash is correct
      const expectedHash = this.generateHash({
        id: entry.id,
        timestamp: entry.timestamp,
        level: entry.level,
        message: entry.message,
        data: entry.data,
        previousHash: entry.previousHash,
        proofChainId: entry.proofChainId
      });

      if (entry.hash !== expectedHash) {
        return false;
      }

      previousHash = entry.hash;
    }

    return true;
  }

  /**
   * Export entries to JSON
   */
  public exportToJson(): string {
    return JSON.stringify({
      proofChainId: this.proofChainId,
      entryCount: this.entries.length,
      lastHash: this.lastHash,
      entries: this.entries,
      verified: this.verifyHashChain()
    }, null, 2);
  }

  /**
   * Clear all entries (for testing)
   */
  public clear(): void {
    this.entries = [];
    this.lastHash = '0'.repeat(64);
    this.entryCounter = 0;
  }

  /**
   * Close file stream
   */
  public close(): void {
    if (this.fileStream) {
      this.fileStream.end();
      this.fileStream = null;
    }
  }

  /**
   * Set minimum log level
   */
  public setMinLevel(level: LogLevel): void {
    this.config.minLevel = level;
  }

  /**
   * Get current configuration
   */
  public getConfig(): LoggerConfig {
    return { ...this.config };
  }
}

// Export default instance getter
export const getLogger = (config?: Partial<LoggerConfig>): Logger => {
  return Logger.getInstance(config);
};
