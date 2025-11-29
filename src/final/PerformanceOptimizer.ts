/**
 * PerformanceOptimizer - PRD-18 Phase 18.4
 * Performance Optimization: Computation optimization, caching, and parallel processing
 */

import { Logger } from '../core/logger/Logger';
import { HashVerifier } from '../core/logger/HashVerifier';

// Cache entry interface
export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  expiresAt: number;
  hitCount: number;
  size: number;
  hash: string;
}

// Performance metrics
export interface PerformanceMetrics {
  operationName: string;
  executionTime: number;
  memoryUsage: number;
  cpuUsage: number;
  cacheHitRate: number;
  parallelEfficiency: number;
  timestamp: Date;
}

// Optimization result
export interface OptimizationResult {
  id: string;
  originalMetrics: PerformanceMetrics;
  optimizedMetrics: PerformanceMetrics;
  improvement: number;
  techniquesApplied: string[];
  recommendations: string[];
  hash: string;
}

// Parallel task
export interface ParallelTask<T, R> {
  id: string;
  data: T;
  processor: (data: T) => R;
  priority: number;
  status: 'pending' | 'running' | 'complete' | 'failed';
  result?: R;
  error?: string;
}

// Cache configuration
export interface CacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  evictionPolicy: 'lru' | 'lfu' | 'fifo';
}

/**
 * CacheManager - Manages computation caching
 */
export class CacheManager<T = unknown> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private config: CacheConfig;
  private logger: Logger;
  private hits: number = 0;
  private misses: number = 0;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: config.maxSize || 1000,
      ttl: config.ttl || 3600000, // 1 hour default
      evictionPolicy: config.evictionPolicy || 'lru'
    };
    this.logger = Logger.getInstance();
  }

  /**
   * Get item from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.misses++;
      return null;
    }
    
    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }
    
    // Update hit count
    entry.hitCount++;
    entry.timestamp = Date.now();
    this.hits++;
    
    return entry.value;
  }

  /**
   * Set item in cache
   */
  set(key: string, value: T, size: number = 1): void {
    // Evict if necessary
    if (this.cache.size >= this.config.maxSize) {
      this.evict();
    }
    
    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.config.ttl,
      hitCount: 0,
      size,
      hash: ''
    };
    entry.hash = HashVerifier.hash(JSON.stringify({ key, timestamp: entry.timestamp }));
    
    this.cache.set(key, entry);
  }

  /**
   * Evict entries based on policy
   */
  private evict(): void {
    if (this.cache.size === 0) return;
    
    let keyToEvict: string | null = null;
    
    switch (this.config.evictionPolicy) {
      case 'lru': {
        let oldestTime = Infinity;
        for (const [key, entry] of this.cache.entries()) {
          if (entry.timestamp < oldestTime) {
            oldestTime = entry.timestamp;
            keyToEvict = key;
          }
        }
        break;
      }
      case 'lfu': {
        let lowestHits = Infinity;
        for (const [key, entry] of this.cache.entries()) {
          if (entry.hitCount < lowestHits) {
            lowestHits = entry.hitCount;
            keyToEvict = key;
          }
        }
        break;
      }
      case 'fifo': {
        keyToEvict = this.cache.keys().next().value || null;
        break;
      }
    }
    
    if (keyToEvict) {
      this.cache.delete(keyToEvict);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; hitRate: number; hits: number; misses: number } {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hitRate: total > 0 ? this.hits / total : 0,
      hits: this.hits,
      misses: this.misses
    };
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get hash for cache state
   */
  getHash(): string {
    return HashVerifier.hash(JSON.stringify({
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses
    }));
  }
}

/**
 * ParallelProcessor - Manages parallel computation
 */
export class ParallelProcessor {
  private maxWorkers: number;
  private activeWorkers: number = 0;
  private taskQueue: ParallelTask<unknown, unknown>[] = [];
  private logger: Logger;
  private completedTasks: number = 0;
  private totalProcessingTime: number = 0;

  constructor(maxWorkers: number = 4) {
    this.maxWorkers = maxWorkers;
    this.logger = Logger.getInstance();
  }

  /**
   * Submit task for parallel processing
   */
  async submitTask<T, R>(
    data: T,
    processor: (data: T) => R,
    priority: number = 0
  ): Promise<R> {
    const task: ParallelTask<T, R> = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      data,
      processor,
      priority,
      status: 'pending'
    };
    
    return this.processTask(task);
  }

  /**
   * Process a task
   */
  private async processTask<T, R>(task: ParallelTask<T, R>): Promise<R> {
    // Wait if all workers busy
    while (this.activeWorkers >= this.maxWorkers) {
      await this.sleep(10);
    }
    
    this.activeWorkers++;
    task.status = 'running';
    const startTime = Date.now();
    
    try {
      task.result = task.processor(task.data);
      task.status = 'complete';
      this.completedTasks++;
      this.totalProcessingTime += Date.now() - startTime;
      return task.result;
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    } finally {
      this.activeWorkers--;
    }
  }

  /**
   * Process multiple tasks in parallel
   */
  async processAll<T, R>(
    items: T[],
    processor: (item: T) => R
  ): Promise<R[]> {
    const promises = items.map(item => this.submitTask(item, processor));
    return Promise.all(promises);
  }

  /**
   * Map function with parallel processing
   */
  async parallelMap<T, R>(
    items: T[],
    mapper: (item: T, index: number) => R,
    batchSize: number = this.maxWorkers
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((item, idx) => this.submitTask(item, (d) => mapper(d, i + idx)))
      );
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Reduce function with parallel processing
   */
  async parallelReduce<T, R>(
    items: T[],
    reducer: (acc: R, item: T) => R,
    initial: R
  ): Promise<R> {
    // For parallel reduce, we process in batches
    const batchSize = Math.ceil(items.length / this.maxWorkers);
    const batches: T[][] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    
    // Reduce each batch in parallel
    const batchResults = await Promise.all(
      batches.map(batch => 
        this.submitTask(batch, (b) => b.reduce(reducer, initial))
      )
    );
    
    // Combine batch results sequentially
    let result = initial;
    for (const batchResult of batchResults) {
      // Type assertion since batchResult is the reduced value from each batch
      result = batchResult as R;
    }
    return result;
  }

  /**
   * Get processor statistics
   */
  getStats(): {
    maxWorkers: number;
    activeWorkers: number;
    completedTasks: number;
    averageProcessingTime: number;
  } {
    return {
      maxWorkers: this.maxWorkers,
      activeWorkers: this.activeWorkers,
      completedTasks: this.completedTasks,
      averageProcessingTime: this.completedTasks > 0 
        ? this.totalProcessingTime / this.completedTasks 
        : 0
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get hash for processor state
   */
  getHash(): string {
    return HashVerifier.hash(JSON.stringify({
      maxWorkers: this.maxWorkers,
      completedTasks: this.completedTasks
    }));
  }
}

/**
 * PerformanceOptimizer - Main optimization class
 */
export class PerformanceOptimizer {
  private logger: Logger;
  private cache: CacheManager;
  private processor: ParallelProcessor;
  private metrics: Map<string, PerformanceMetrics[]> = new Map();

  constructor(options: {
    cacheConfig?: Partial<CacheConfig>;
    maxWorkers?: number;
  } = {}) {
    this.logger = Logger.getInstance();
    this.cache = new CacheManager(options.cacheConfig);
    this.processor = new ParallelProcessor(options.maxWorkers);
  }

  /**
   * Measure operation performance
   */
  measure<T>(operationName: string, operation: () => T): { result: T; metrics: PerformanceMetrics } {
    const startTime = Date.now();
    const startMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
    
    const result = operation();
    
    const endTime = Date.now();
    const endMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
    
    const metrics: PerformanceMetrics = {
      operationName,
      executionTime: endTime - startTime,
      memoryUsage: (endMemory - startMemory) / (1024 * 1024), // MB
      cpuUsage: 0, // Would require more sophisticated measurement
      cacheHitRate: this.cache.getStats().hitRate,
      parallelEfficiency: this.calculateParallelEfficiency(),
      timestamp: new Date()
    };
    
    // Store metrics
    if (!this.metrics.has(operationName)) {
      this.metrics.set(operationName, []);
    }
    const metricsArray = this.metrics.get(operationName);
    if (metricsArray) {
      metricsArray.push(metrics);
    }
    
    return { result, metrics };
  }

  /**
   * Optimize computation with caching
   */
  optimizeWithCache<T>(
    key: string,
    computation: () => T,
    size: number = 1
  ): T {
    // Check cache first
    const cached = this.cache.get(key) as T | null;
    if (cached !== null) {
      return cached;
    }
    
    // Compute and cache
    const result = computation();
    this.cache.set(key, result, size);
    return result;
  }

  /**
   * Optimize batch processing with parallel execution
   */
  async optimizeBatch<T, R>(
    items: T[],
    processor: (item: T) => R
  ): Promise<R[]> {
    return this.processor.processAll(items, processor);
  }

  /**
   * Generate optimization report
   */
  generateOptimizationReport(operationName: string): OptimizationResult | null {
    const metricsArray = this.metrics.get(operationName);
    if (!metricsArray || metricsArray.length < 2) {
      return null;
    }
    
    const original = metricsArray[0];
    const optimized = metricsArray[metricsArray.length - 1];
    
    const techniquesApplied: string[] = [];
    const recommendations: string[] = [];
    
    // Check what improved
    if (optimized.cacheHitRate > original.cacheHitRate) {
      techniquesApplied.push('Caching');
    }
    if (optimized.executionTime < original.executionTime) {
      techniquesApplied.push('Algorithm optimization');
    }
    if (optimized.parallelEfficiency > original.parallelEfficiency) {
      techniquesApplied.push('Parallelization');
    }
    
    // Generate recommendations
    if (optimized.cacheHitRate < 0.8) {
      recommendations.push('Increase cache size for better hit rate');
    }
    if (optimized.executionTime > 100) {
      recommendations.push('Consider algorithm optimizations');
    }
    if (optimized.memoryUsage > 100) {
      recommendations.push('Implement memory pooling');
    }
    
    const improvement = original.executionTime > 0
      ? (original.executionTime - optimized.executionTime) / original.executionTime
      : 0;
    
    const result: OptimizationResult = {
      id: `opt-${Date.now()}`,
      originalMetrics: original,
      optimizedMetrics: optimized,
      improvement,
      techniquesApplied,
      recommendations,
      hash: ''
    };
    result.hash = HashVerifier.hash(JSON.stringify({ ...result, hash: '' }));
    
    this.logger.proof('Optimization report generated', {
      id: result.id,
      improvement: `${(improvement * 100).toFixed(1)}%`,
      hash: result.hash
    });
    
    return result;
  }

  /**
   * Auto-optimize based on metrics
   */
  autoOptimize(): string[] {
    const suggestions: string[] = [];
    
    const cacheStats = this.cache.getStats();
    const processorStats = this.processor.getStats();
    
    // Cache suggestions
    if (cacheStats.hitRate < 0.5) {
      suggestions.push('Cache hit rate is low - consider increasing cache TTL');
    }
    if (cacheStats.size === 0) {
      suggestions.push('Cache is empty - ensure frequently used computations are cached');
    }
    
    // Processor suggestions
    if (processorStats.averageProcessingTime > 100) {
      suggestions.push('Average task processing time is high - consider increasing parallelism');
    }
    
    // Memory suggestions
    const memUsage = process.memoryUsage ? process.memoryUsage().heapUsed / (1024 * 1024) : 0;
    if (memUsage > 500) {
      suggestions.push('High memory usage detected - consider memory optimization');
    }
    
    return suggestions;
  }

  /**
   * Get cache manager
   */
  getCache(): CacheManager {
    return this.cache;
  }

  /**
   * Get parallel processor
   */
  getProcessor(): ParallelProcessor {
    return this.processor;
  }

  /**
   * Clear all caches and reset metrics
   */
  reset(): void {
    this.cache.clear();
    this.metrics.clear();
  }

  /**
   * Calculate parallel efficiency
   */
  private calculateParallelEfficiency(): number {
    const stats = this.processor.getStats();
    if (stats.completedTasks === 0) return 1.0;
    // Simplified efficiency calculation
    return Math.min(1.0, stats.maxWorkers / (stats.activeWorkers + 1));
  }

  /**
   * Export performance data
   */
  exportPerformanceData(): string {
    const data = {
      cache: this.cache.getStats(),
      processor: this.processor.getStats(),
      metrics: Object.fromEntries(this.metrics),
      suggestions: this.autoOptimize(),
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Get hash for optimizer state
   */
  getHash(): string {
    return HashVerifier.hash(JSON.stringify({
      cacheHash: this.cache.getHash(),
      processorHash: this.processor.getHash()
    }));
  }
}

/**
 * Factory for creating PerformanceOptimizer
 */
export class PerformanceOptimizerFactory {
  static createDefault(): PerformanceOptimizer {
    return new PerformanceOptimizer();
  }

  static createWithConfig(config: {
    cacheConfig?: Partial<CacheConfig>;
    maxWorkers?: number;
  }): PerformanceOptimizer {
    return new PerformanceOptimizer(config);
  }
}
