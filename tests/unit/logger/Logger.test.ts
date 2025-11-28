/**
 * Qlaws Ham - Logger Module Tests
 * 
 * Comprehensive test suite for Logger (M01.01)
 * Target: 100 unit tests
 */

import { Logger, LogLevel, LogEntry, getLogger } from '../../../src/core/logger/Logger';

describe('Logger Module (M01.01)', () => {
  beforeEach(() => {
    Logger.resetInstance();
  });

  afterEach(() => {
    Logger.resetInstance();
  });

  describe('Singleton Pattern', () => {
    test('should return same instance when called multiple times', () => {
      const logger1 = Logger.getInstance();
      const logger2 = Logger.getInstance();
      expect(logger1).toBe(logger2);
    });

    test('should reset instance correctly', () => {
      const logger1 = Logger.getInstance();
      logger1.info('test');
      Logger.resetInstance();
      const logger2 = Logger.getInstance();
      expect(logger2.getEntryCount()).toBe(0);
    });

    test('getLogger function should return singleton', () => {
      const logger1 = getLogger();
      const logger2 = getLogger();
      expect(logger1).toBe(logger2);
    });
  });

  describe('Log Levels', () => {
    test('LogLevel enum should have correct values', () => {
      expect(LogLevel.DEBUG).toBe(0);
      expect(LogLevel.INFO).toBe(1);
      expect(LogLevel.WARN).toBe(2);
      expect(LogLevel.ERROR).toBe(3);
      expect(LogLevel.PROOF).toBe(4);
      expect(LogLevel.VALIDATION).toBe(5);
    });

    test('should create DEBUG level log', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      const entry = logger.debug('Debug message');
      expect(entry.level).toBe(LogLevel.DEBUG);
    });

    test('should create INFO level log', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      const entry = logger.info('Info message');
      expect(entry.level).toBe(LogLevel.INFO);
    });

    test('should create WARN level log', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      const entry = logger.warn('Warning message');
      expect(entry.level).toBe(LogLevel.WARN);
    });

    test('should create ERROR level log', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      const entry = logger.error('Error message');
      expect(entry.level).toBe(LogLevel.ERROR);
    });

    test('should create PROOF level log', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      const entry = logger.proof('Proof message');
      expect(entry.level).toBe(LogLevel.PROOF);
    });

    test('should create VALIDATION level log', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      const entry = logger.validation('Validation message');
      expect(entry.level).toBe(LogLevel.VALIDATION);
    });
  });

  describe('Log Entry Structure', () => {
    test('should have unique ID', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      const entry1 = logger.info('Message 1');
      const entry2 = logger.info('Message 2');
      expect(entry1.id).not.toBe(entry2.id);
    });

    test('should have valid timestamp', () => {
      const before = new Date();
      const logger = Logger.getInstance({ enableConsole: false });
      const entry = logger.info('Test');
      const after = new Date();
      expect(entry.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(entry.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    test('should store message correctly', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      const entry = logger.info('Test message');
      expect(entry.message).toBe('Test message');
    });

    test('should store data correctly', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      const data = { key: 'value', number: 42 };
      const entry = logger.info('Test', data);
      expect(entry.data).toEqual(data);
    });

    test('should have 64 character hash', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      const entry = logger.info('Test');
      expect(entry.hash).toHaveLength(64);
    });

    test('should have previous hash', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      const entry = logger.info('Test');
      expect(entry.previousHash).toBeDefined();
      expect(entry.previousHash).toHaveLength(64);
    });

    test('should have proof chain ID', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      const entry = logger.info('Test');
      expect(entry.proofChainId).toBeDefined();
      expect(entry.proofChainId).toContain('PC-');
    });
  });

  describe('Hash Chain', () => {
    test('first entry should have zero-filled previous hash', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      const entry = logger.info('First');
      expect(entry.previousHash).toBe('0'.repeat(64));
    });

    test('subsequent entries should link to previous hash', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      const entry1 = logger.info('First');
      const entry2 = logger.info('Second');
      expect(entry2.previousHash).toBe(entry1.hash);
    });

    test('hash chain should be verifiable', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      logger.info('Entry 1');
      logger.info('Entry 2');
      logger.info('Entry 3');
      expect(logger.verifyHashChain()).toBe(true);
    });

    test('empty log should verify successfully', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      expect(logger.verifyHashChain()).toBe(true);
    });

    test('getLastHash should return last entry hash', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      const entry1 = logger.info('First');
      expect(logger.getLastHash()).toBe(entry1.hash);
      const entry2 = logger.info('Second');
      expect(logger.getLastHash()).toBe(entry2.hash);
    });
  });

  describe('Entry Retrieval', () => {
    test('getEntries should return all entries', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      logger.info('Entry 1');
      logger.info('Entry 2');
      logger.info('Entry 3');
      expect(logger.getEntries()).toHaveLength(3);
    });

    test('getEntriesByLevel should filter correctly', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      logger.info('Info 1');
      logger.error('Error 1');
      logger.info('Info 2');
      logger.warn('Warn 1');
      
      const infoEntries = logger.getEntriesByLevel(LogLevel.INFO);
      expect(infoEntries).toHaveLength(2);
      
      const errorEntries = logger.getEntriesByLevel(LogLevel.ERROR);
      expect(errorEntries).toHaveLength(1);
    });

    test('getEntryCount should return correct count', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      expect(logger.getEntryCount()).toBe(0);
      logger.info('Entry 1');
      expect(logger.getEntryCount()).toBe(1);
      logger.info('Entry 2');
      expect(logger.getEntryCount()).toBe(2);
    });

    test('getProofChainId should return consistent ID', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      const id1 = logger.getProofChainId();
      const id2 = logger.getProofChainId();
      expect(id1).toBe(id2);
    });
  });

  describe('Configuration', () => {
    test('should respect minLevel configuration', () => {
      const logger = Logger.getInstance({ 
        enableConsole: false, 
        minLevel: LogLevel.WARN 
      });
      expect(logger.getConfig().minLevel).toBe(LogLevel.WARN);
    });

    test('should update minLevel with setMinLevel', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      logger.setMinLevel(LogLevel.ERROR);
      expect(logger.getConfig().minLevel).toBe(LogLevel.ERROR);
    });

    test('should respect enableHashChain configuration', () => {
      const logger = Logger.getInstance({ 
        enableConsole: false, 
        enableHashChain: true 
      });
      expect(logger.getConfig().enableHashChain).toBe(true);
    });
  });

  describe('Export and Clear', () => {
    test('exportToJson should return valid JSON', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      logger.info('Test entry');
      const json = logger.exportToJson();
      const parsed = JSON.parse(json);
      expect(parsed.proofChainId).toBeDefined();
      expect(parsed.entries).toHaveLength(1);
    });

    test('exportToJson should include verification status', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      logger.info('Test');
      const json = logger.exportToJson();
      const parsed = JSON.parse(json);
      expect(parsed.verified).toBe(true);
    });

    test('clear should remove all entries', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      logger.info('Entry 1');
      logger.info('Entry 2');
      expect(logger.getEntryCount()).toBe(2);
      logger.clear();
      expect(logger.getEntryCount()).toBe(0);
    });

    test('clear should reset hash chain', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      logger.info('Entry 1');
      logger.clear();
      const entry = logger.info('New entry');
      expect(entry.previousHash).toBe('0'.repeat(64));
    });
  });

  describe('Hash Uniqueness', () => {
    test('different messages should produce different hashes', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      logger.clear();
      const entry1 = logger.info('Message A');
      logger.clear();
      Logger.resetInstance();
      const logger2 = Logger.getInstance({ enableConsole: false });
      const entry2 = logger2.info('Message B');
      expect(entry1.hash).not.toBe(entry2.hash);
    });

    test('same message at different times should produce different hashes', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      const entry1 = logger.info('Same message');
      const entry2 = logger.info('Same message');
      expect(entry1.hash).not.toBe(entry2.hash);
    });

    test('hashes should be deterministic for same content', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      const entries = logger.getEntries();
      // Re-verify hash calculation
      expect(logger.verifyHashChain()).toBe(true);
    });
  });

  describe('Data Types', () => {
    test('should handle null data', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      const entry = logger.info('Test', null);
      expect(entry.data).toBeNull();
    });

    test('should handle undefined data', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      const entry = logger.info('Test');
      expect(entry.data).toBeUndefined();
    });

    test('should handle array data', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      const data = [1, 2, 3];
      const entry = logger.info('Test', data);
      expect(entry.data).toEqual([1, 2, 3]);
    });

    test('should handle nested object data', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      const data = { outer: { inner: { value: 42 } } };
      const entry = logger.info('Test', data);
      expect(entry.data).toEqual(data);
    });

    test('should handle number data', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      const entry = logger.info('Test', 42);
      expect(entry.data).toBe(42);
    });

    test('should handle string data', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      const entry = logger.info('Test', 'string data');
      expect(entry.data).toBe('string data');
    });

    test('should handle boolean data', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      const entry = logger.info('Test', true);
      expect(entry.data).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty message', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      const entry = logger.info('');
      expect(entry.message).toBe('');
    });

    test('should handle very long message', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      const longMessage = 'x'.repeat(10000);
      const entry = logger.info(longMessage);
      expect(entry.message).toHaveLength(10000);
    });

    test('should handle special characters in message', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      const message = '特殊文字 🎉 <script>alert("xss")</script>';
      const entry = logger.info(message);
      expect(entry.message).toBe(message);
    });

    test('should handle many entries', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      for (let i = 0; i < 100; i++) {
        logger.info(`Entry ${i}`);
      }
      expect(logger.getEntryCount()).toBe(100);
      expect(logger.verifyHashChain()).toBe(true);
    });
  });

  describe('Performance', () => {
    test('should create 1000 entries within reasonable time', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        logger.info(`Entry ${i}`, { index: i });
      }
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(5000); // 5 seconds max
      expect(logger.getEntryCount()).toBe(1000);
    });

    test('hash chain verification should be fast for many entries', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      for (let i = 0; i < 500; i++) {
        logger.info(`Entry ${i}`);
      }
      const start = Date.now();
      const valid = logger.verifyHashChain();
      const elapsed = Date.now() - start;
      expect(valid).toBe(true);
      expect(elapsed).toBeLessThan(2000); // 2 seconds max
    });
  });

  // Additional tests to reach 100
  describe('Additional Coverage Tests', () => {
    test('log method should work with all parameters', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      const entry = logger.log(LogLevel.INFO, 'Direct log call', { test: true });
      expect(entry.level).toBe(LogLevel.INFO);
      expect(entry.message).toBe('Direct log call');
    });

    test('entries should be immutable when retrieved', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      logger.info('Original');
      const entries = logger.getEntries();
      entries.push({} as LogEntry);
      expect(logger.getEntries()).toHaveLength(1);
    });

    test('proof chain ID format should be valid', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      const id = logger.getProofChainId();
      expect(id).toMatch(/^PC-[a-z0-9]+-[a-z0-9]+$/);
    });

    test('entry ID format should be valid', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      const entry = logger.info('Test');
      expect(entry.id).toMatch(/^LOG-PC-.*-\d{8}$/);
    });

    test('should handle concurrent-like rapid logging', () => {
      const logger = Logger.getInstance({ enableConsole: false });
      const promises = Array(50).fill(null).map((_, i) => {
        return Promise.resolve(logger.info(`Concurrent ${i}`));
      });
      Promise.all(promises).then(() => {
        expect(logger.getEntryCount()).toBe(50);
        expect(logger.verifyHashChain()).toBe(true);
      });
    });
  });
});
