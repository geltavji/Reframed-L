/**
 * Qlaws Ham - HashVerifier Module Tests
 * 
 * Comprehensive test suite for HashVerifier (M01.02)
 * Target: 100 unit tests
 */

import { 
  HashVerifier, 
  HashChain, 
  ProofType, 
  createHashChain,
  ProofRecord 
} from '../../../src/core/logger/HashVerifier';

describe('HashVerifier Module (M01.02)', () => {
  beforeEach(() => {
    HashVerifier.clearCollisionMap();
  });

  describe('HashVerifier.hash', () => {
    test('should generate 64 character hex hash', () => {
      const hash = HashVerifier.hash('test');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });

    test('should generate consistent hash for same input', () => {
      const hash1 = HashVerifier.hash('same input');
      const hash2 = HashVerifier.hash('same input');
      expect(hash1).toBe(hash2);
    });

    test('should generate different hash for different input', () => {
      const hash1 = HashVerifier.hash('input 1');
      const hash2 = HashVerifier.hash('input 2');
      expect(hash1).not.toBe(hash2);
    });

    test('should handle empty string', () => {
      const hash = HashVerifier.hash('');
      expect(hash).toHaveLength(64);
    });

    test('should handle unicode characters', () => {
      const hash = HashVerifier.hash('こんにちは世界 🌍');
      expect(hash).toHaveLength(64);
    });

    test('should handle very long strings', () => {
      const longString = 'x'.repeat(100000);
      const hash = HashVerifier.hash(longString);
      expect(hash).toHaveLength(64);
    });
  });

  describe('HashVerifier.hashWithTimestamp', () => {
    test('should include timestamp in hash', () => {
      const timestamp = new Date('2024-01-01T00:00:00Z');
      const hash1 = HashVerifier.hashWithTimestamp('test', timestamp);
      const hash2 = HashVerifier.hashWithTimestamp('test', new Date('2024-01-02T00:00:00Z'));
      expect(hash1).not.toBe(hash2);
    });

    test('should use current time if not provided', () => {
      const hash1 = HashVerifier.hashWithTimestamp('test');
      const hash2 = HashVerifier.hashWithTimestamp('test');
      // Hashes may differ due to timestamp differences
      expect(hash1).toHaveLength(64);
      expect(hash2).toHaveLength(64);
    });
  });

  describe('HashVerifier.verify', () => {
    test('should return valid for correct hash', () => {
      const input = 'test input';
      const expectedHash = HashVerifier.hash(input);
      const result = HashVerifier.verify(input, expectedHash);
      expect(result.valid).toBe(true);
    });

    test('should return invalid for incorrect hash', () => {
      const result = HashVerifier.verify('test', 'wrong_hash');
      expect(result.valid).toBe(false);
      expect(result.errorMessage).toBeDefined();
    });

    test('should include computed hash in result', () => {
      const input = 'test';
      const result = HashVerifier.verify(input, 'any');
      expect(result.hash).toBe(HashVerifier.hash(input));
    });

    test('should include timestamp in result', () => {
      const result = HashVerifier.verify('test', 'hash');
      expect(result.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('HashVerifier.hashObject', () => {
    test('should hash object consistently', () => {
      const obj = { a: 1, b: 2 };
      const hash1 = HashVerifier.hashObject(obj);
      const hash2 = HashVerifier.hashObject(obj);
      expect(hash1).toBe(hash2);
    });

    test('should produce same hash regardless of key order', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { b: 2, a: 1 };
      const hash1 = HashVerifier.hashObject(obj1);
      const hash2 = HashVerifier.hashObject(obj2);
      expect(hash1).toBe(hash2);
    });

    test('should handle nested objects', () => {
      const obj = { outer: { inner: { deep: 'value' } } };
      const hash = HashVerifier.hashObject(obj);
      expect(hash).toHaveLength(64);
    });

    test('should handle arrays', () => {
      const arr = [1, 2, 3];
      const hash = HashVerifier.hashObject(arr);
      expect(hash).toHaveLength(64);
    });
  });

  describe('HashVerifier.hashNumber', () => {
    test('should hash regular number', () => {
      const hash = HashVerifier.hashNumber(42);
      expect(hash).toHaveLength(64);
    });

    test('should hash bigint', () => {
      const hash = HashVerifier.hashNumber(BigInt('12345678901234567890'));
      expect(hash).toHaveLength(64);
    });

    test('should hash string number', () => {
      const hash = HashVerifier.hashNumber('3.14159265358979');
      expect(hash).toHaveLength(64);
    });

    test('should produce different hashes for different numbers', () => {
      const hash1 = HashVerifier.hashNumber(1);
      const hash2 = HashVerifier.hashNumber(2);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('HashVerifier.hashFormula', () => {
    test('should hash formula with inputs and output', () => {
      const hash = HashVerifier.hashFormula('E=mc^2', { m: 1, c: 299792458 }, 8.987551787368176e16);
      expect(hash).toHaveLength(64);
    });

    test('should produce consistent hash for same formula', () => {
      const hash1 = HashVerifier.hashFormula('add', { a: 1, b: 2 }, 3);
      const hash2 = HashVerifier.hashFormula('add', { a: 1, b: 2 }, 3);
      expect(hash1).toBe(hash2);
    });

    test('should produce different hash for different inputs', () => {
      const hash1 = HashVerifier.hashFormula('add', { a: 1, b: 2 }, 3);
      const hash2 = HashVerifier.hashFormula('add', { a: 2, b: 3 }, 5);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('HashVerifier.batchVerify', () => {
    test('should verify multiple items', () => {
      const items = [
        { input: 'test1', expectedHash: HashVerifier.hash('test1') },
        { input: 'test2', expectedHash: HashVerifier.hash('test2') }
      ];
      const result = HashVerifier.batchVerify(items);
      expect(result.valid).toBe(true);
      expect(result.results).toHaveLength(2);
    });

    test('should detect invalid items in batch', () => {
      const items = [
        { input: 'test1', expectedHash: HashVerifier.hash('test1') },
        { input: 'test2', expectedHash: 'wrong_hash' }
      ];
      const result = HashVerifier.batchVerify(items);
      expect(result.valid).toBe(false);
    });

    test('should handle empty batch', () => {
      const result = HashVerifier.batchVerify([]);
      expect(result.valid).toBe(true);
      expect(result.results).toHaveLength(0);
    });
  });

  describe('HashVerifier.detectCollision', () => {
    test('should not detect collision for first input', () => {
      const result = HashVerifier.detectCollision('unique input');
      expect(result.isCollision).toBe(false);
      expect(result.existingInputs).toHaveLength(0);
    });

    test('should not detect collision for same input', () => {
      HashVerifier.detectCollision('same input');
      const result = HashVerifier.detectCollision('same input');
      expect(result.isCollision).toBe(false);
    });

    test('should track inputs in collision map', () => {
      HashVerifier.detectCollision('input1');
      HashVerifier.detectCollision('input2');
      expect(HashVerifier.getCollisionMapSize()).toBe(2);
    });

    test('clearCollisionMap should reset tracking', () => {
      HashVerifier.detectCollision('test');
      HashVerifier.clearCollisionMap();
      expect(HashVerifier.getCollisionMapSize()).toBe(0);
    });
  });

  describe('HashVerifier.generateProofHash', () => {
    test('should generate proof hash', () => {
      const hash = HashVerifier.generateProofHash(
        ProofType.THEOREM,
        'P implies Q',
        [{ premise: 'P' }, { conclusion: 'Q' }]
      );
      expect(hash).toHaveLength(64);
    });

    test('should include type in hash', () => {
      const hash1 = HashVerifier.generateProofHash(ProofType.THEOREM, 'statement', []);
      const hash2 = HashVerifier.generateProofHash(ProofType.AXIOM, 'statement', []);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('HashVerifier.createSignature', () => {
    test('should create signature from data', () => {
      const sig = HashVerifier.createSignature('data', 'chain-1', 'record-1');
      expect(sig).toHaveLength(64);
    });

    test('should produce different signatures for different data', () => {
      const sig1 = HashVerifier.createSignature('data1', 'chain', 'rec');
      const sig2 = HashVerifier.createSignature('data2', 'chain', 'rec');
      expect(sig1).not.toBe(sig2);
    });
  });

  describe('HashVerifier.compareHashes', () => {
    test('should return true for identical hashes', () => {
      const hash = HashVerifier.hash('test');
      expect(HashVerifier.compareHashes(hash, hash)).toBe(true);
    });

    test('should return false for different hashes', () => {
      const hash1 = HashVerifier.hash('test1');
      const hash2 = HashVerifier.hash('test2');
      expect(HashVerifier.compareHashes(hash1, hash2)).toBe(false);
    });

    test('should return false for different length strings', () => {
      expect(HashVerifier.compareHashes('abc', 'abcd')).toBe(false);
    });
  });

  describe('HashVerifier.merkleRoot', () => {
    test('should return empty hash for empty array', () => {
      const root = HashVerifier.merkleRoot([]);
      expect(root).toHaveLength(64);
    });

    test('should return same hash for single element', () => {
      const hash = HashVerifier.hash('single');
      const root = HashVerifier.merkleRoot([hash]);
      expect(root).toBe(hash);
    });

    test('should compute merkle root for multiple hashes', () => {
      const hashes = [
        HashVerifier.hash('a'),
        HashVerifier.hash('b'),
        HashVerifier.hash('c'),
        HashVerifier.hash('d')
      ];
      const root = HashVerifier.merkleRoot(hashes);
      expect(root).toHaveLength(64);
    });

    test('should handle odd number of hashes', () => {
      const hashes = [
        HashVerifier.hash('a'),
        HashVerifier.hash('b'),
        HashVerifier.hash('c')
      ];
      const root = HashVerifier.merkleRoot(hashes);
      expect(root).toHaveLength(64);
    });
  });

  describe('HashChain', () => {
    describe('Creation', () => {
      test('should create chain with auto-generated ID', () => {
        const chain = new HashChain();
        expect(chain.getChainId()).toMatch(/^CHAIN-/);
      });

      test('should create chain with custom ID', () => {
        const chain = new HashChain('custom-chain-id');
        expect(chain.getChainId()).toBe('custom-chain-id');
      });

      test('createHashChain factory should work', () => {
        const chain = createHashChain('factory-chain');
        expect(chain.getChainId()).toBe('factory-chain');
      });

      test('should have zero records initially', () => {
        const chain = new HashChain();
        expect(chain.getRecordCount()).toBe(0);
      });

      test('should have creation timestamp', () => {
        const before = new Date();
        const chain = new HashChain();
        const after = new Date();
        expect(chain.getCreatedAt().getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(chain.getCreatedAt().getTime()).toBeLessThanOrEqual(after.getTime());
      });
    });

    describe('Adding Records', () => {
      test('should add record and return it', () => {
        const chain = new HashChain();
        const record = chain.addRecord(ProofType.FORMULA, 'x + y', '3');
        expect(record.type).toBe(ProofType.FORMULA);
        expect(record.input).toBe('x + y');
        expect(record.output).toBe('3');
      });

      test('record should have unique ID', () => {
        const chain = new HashChain();
        const rec1 = chain.addRecord(ProofType.FORMULA, 'a', 'b');
        const rec2 = chain.addRecord(ProofType.FORMULA, 'c', 'd');
        expect(rec1.id).not.toBe(rec2.id);
      });

      test('record should have timestamp', () => {
        const chain = new HashChain();
        const record = chain.addRecord(ProofType.FORMULA, 'input', 'output');
        expect(record.timestamp).toBeInstanceOf(Date);
      });

      test('record should have input hash', () => {
        const chain = new HashChain();
        const record = chain.addRecord(ProofType.FORMULA, 'input', 'output');
        expect(record.inputHash).toBe(HashVerifier.hash('input'));
      });

      test('record should have output hash', () => {
        const chain = new HashChain();
        const record = chain.addRecord(ProofType.FORMULA, 'input', 'output');
        expect(record.outputHash).toBe(HashVerifier.hash('output'));
      });

      test('first record should have zero previous hash', () => {
        const chain = new HashChain();
        const record = chain.addRecord(ProofType.FORMULA, 'input', 'output');
        expect(record.previousHash).toBe('0'.repeat(64));
      });

      test('subsequent records should link to previous', () => {
        const chain = new HashChain();
        const rec1 = chain.addRecord(ProofType.FORMULA, 'a', 'b');
        const rec2 = chain.addRecord(ProofType.FORMULA, 'c', 'd');
        expect(rec2.previousHash).toBe(rec1.chainHash);
      });

      test('should store metadata', () => {
        const chain = new HashChain();
        const metadata = { source: 'test', version: 1 };
        const record = chain.addRecord(ProofType.FORMULA, 'a', 'b', metadata);
        expect(record.metadata).toEqual(metadata);
      });
    });

    describe('Record Retrieval', () => {
      test('getRecords should return all records', () => {
        const chain = new HashChain();
        chain.addRecord(ProofType.FORMULA, 'a', 'b');
        chain.addRecord(ProofType.THEOREM, 'c', 'd');
        expect(chain.getRecords()).toHaveLength(2);
      });

      test('getRecordById should find record', () => {
        const chain = new HashChain();
        const rec = chain.addRecord(ProofType.FORMULA, 'a', 'b');
        const found = chain.getRecordById(rec.id);
        expect(found).toBeDefined();
        expect(found?.id).toBe(rec.id);
      });

      test('getRecordById should return undefined for non-existent', () => {
        const chain = new HashChain();
        expect(chain.getRecordById('non-existent')).toBeUndefined();
      });

      test('getRecordsByType should filter correctly', () => {
        const chain = new HashChain();
        chain.addRecord(ProofType.FORMULA, 'a', 'b');
        chain.addRecord(ProofType.THEOREM, 'c', 'd');
        chain.addRecord(ProofType.FORMULA, 'e', 'f');
        
        const formulas = chain.getRecordsByType(ProofType.FORMULA);
        expect(formulas).toHaveLength(2);
        
        const theorems = chain.getRecordsByType(ProofType.THEOREM);
        expect(theorems).toHaveLength(1);
      });
    });

    describe('Chain Verification', () => {
      test('empty chain should verify', () => {
        const chain = new HashChain();
        const result = chain.verify();
        expect(result.valid).toBe(true);
        expect(result.totalRecords).toBe(0);
      });

      test('valid chain should verify', () => {
        const chain = new HashChain();
        chain.addRecord(ProofType.FORMULA, 'a', 'b');
        chain.addRecord(ProofType.FORMULA, 'c', 'd');
        chain.addRecord(ProofType.FORMULA, 'e', 'f');
        const result = chain.verify();
        expect(result.valid).toBe(true);
        expect(result.validRecords).toBe(3);
        expect(result.invalidRecords).toBe(0);
        expect(result.brokenLinks).toHaveLength(0);
      });

      test('getLastHash should update with each record', () => {
        const chain = new HashChain();
        const initialHash = chain.getLastHash();
        expect(initialHash).toBe('0'.repeat(64));
        
        const rec1 = chain.addRecord(ProofType.FORMULA, 'a', 'b');
        expect(chain.getLastHash()).toBe(rec1.chainHash);
        
        const rec2 = chain.addRecord(ProofType.FORMULA, 'c', 'd');
        expect(chain.getLastHash()).toBe(rec2.chainHash);
      });
    });

    describe('Export and Import', () => {
      test('exportToJson should produce valid JSON', () => {
        const chain = new HashChain('test-chain');
        chain.addRecord(ProofType.FORMULA, 'a', 'b');
        const json = chain.exportToJson();
        const parsed = JSON.parse(json);
        expect(parsed.chainId).toBe('test-chain');
        expect(parsed.recordCount).toBe(1);
      });

      test('importFromJson should restore chain', () => {
        const original = new HashChain('import-test');
        original.addRecord(ProofType.FORMULA, 'x', 'y');
        original.addRecord(ProofType.THEOREM, 'a', 'b');
        
        const json = original.exportToJson();
        const restored = HashChain.importFromJson(json);
        
        expect(restored.getChainId()).toBe('import-test');
        expect(restored.getRecordCount()).toBe(2);
        expect(restored.verify().valid).toBe(true);
      });

      test('exported JSON should include verification status', () => {
        const chain = new HashChain();
        chain.addRecord(ProofType.FORMULA, 'a', 'b');
        const json = chain.exportToJson();
        const parsed = JSON.parse(json);
        expect(parsed.verified).toBe(true);
      });
    });

    describe('Clear', () => {
      test('clear should remove all records', () => {
        const chain = new HashChain();
        chain.addRecord(ProofType.FORMULA, 'a', 'b');
        chain.addRecord(ProofType.FORMULA, 'c', 'd');
        chain.clear();
        expect(chain.getRecordCount()).toBe(0);
      });

      test('clear should reset last hash', () => {
        const chain = new HashChain();
        chain.addRecord(ProofType.FORMULA, 'a', 'b');
        chain.clear();
        expect(chain.getLastHash()).toBe('0'.repeat(64));
      });
    });

    describe('ProofType enum', () => {
      test('should have all required types', () => {
        expect(ProofType.FORMULA).toBe('FORMULA');
        expect(ProofType.THEOREM).toBe('THEOREM');
        expect(ProofType.COMPUTATION).toBe('COMPUTATION');
        expect(ProofType.AXIOM).toBe('AXIOM');
        expect(ProofType.VALIDATION).toBe('VALIDATION');
        expect(ProofType.INTEGRATION).toBe('INTEGRATION');
      });
    });
  });

  describe('Performance', () => {
    test('should hash 10000 strings quickly', () => {
      const start = Date.now();
      for (let i = 0; i < 10000; i++) {
        HashVerifier.hash(`string-${i}`);
      }
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(2000);
    });

    test('chain should handle 1000 records efficiently', () => {
      const chain = new HashChain();
      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        chain.addRecord(ProofType.COMPUTATION, `input-${i}`, `output-${i}`);
      }
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(3000);
      expect(chain.verify().valid).toBe(true);
    });
  });
});
