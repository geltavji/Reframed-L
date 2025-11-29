/**
 * PRD-17.2 Extension: Real-time Notifications System
 * 
 * Provides WebSocket-based real-time notifications for:
 * - Validation progress updates
 * - Simulation results streaming
 * - Collaboration features
 * - Live dashboard updates
 */

export interface NotificationEvent {
  id: string;
  type: NotificationType;
  timestamp: Date;
  payload: Record<string, unknown>;
  source: string;
  priority: Priority;
}

export type NotificationType = 
  | 'validation_started'
  | 'validation_progress'
  | 'validation_complete'
  | 'simulation_started'
  | 'simulation_progress'
  | 'simulation_complete'
  | 'law_updated'
  | 'paper_generated'
  | 'export_complete'
  | 'error'
  | 'warning'
  | 'info';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface Subscriber {
  id: string;
  callback: (event: NotificationEvent) => void;
  filters?: NotificationType[];
}

export interface NotificationStats {
  totalSent: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<Priority, number>;
  subscriberCount: number;
  averageLatencyMs: number;
}

export interface RealtimeConfig {
  maxQueueSize: number;
  batchInterval: number;
  retryAttempts: number;
  enableLogging: boolean;
}

/**
 * Real-time notification system for the Reframed Laws framework
 */
export class RealtimeNotifications {
  private subscribers: Map<string, Subscriber> = new Map();
  private eventQueue: NotificationEvent[] = [];
  private stats: NotificationStats;
  private config: RealtimeConfig;
  private isProcessing: boolean = false;

  constructor(config: Partial<RealtimeConfig> = {}) {
    this.config = {
      maxQueueSize: config.maxQueueSize ?? 1000,
      batchInterval: config.batchInterval ?? 100,
      retryAttempts: config.retryAttempts ?? 3,
      enableLogging: config.enableLogging ?? false
    };

    this.stats = {
      totalSent: 0,
      byType: {} as Record<NotificationType, number>,
      byPriority: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      },
      subscriberCount: 0,
      averageLatencyMs: 0
    };
  }

  /**
   * Subscribe to notifications
   */
  subscribe(callback: (event: NotificationEvent) => void, filters?: NotificationType[]): string {
    const id = this.generateId();
    this.subscribers.set(id, { id, callback, filters });
    this.stats.subscriberCount = this.subscribers.size;
    return id;
  }

  /**
   * Unsubscribe from notifications
   */
  unsubscribe(subscriberId: string): boolean {
    const result = this.subscribers.delete(subscriberId);
    this.stats.subscriberCount = this.subscribers.size;
    return result;
  }

  /**
   * Emit a notification event
   */
  emit(type: NotificationType, payload: Record<string, unknown>, priority: Priority = 'medium', source: string = 'system'): NotificationEvent {
    const event: NotificationEvent = {
      id: this.generateId(),
      type,
      timestamp: new Date(),
      payload,
      source,
      priority
    };

    this.eventQueue.push(event);
    
    // Process immediately for high priority
    if (priority === 'critical' || priority === 'high') {
      this.processQueue();
    }

    // Trim queue if too large
    if (this.eventQueue.length > this.config.maxQueueSize) {
      this.eventQueue = this.eventQueue.slice(-this.config.maxQueueSize);
    }

    return event;
  }

  /**
   * Process the event queue
   */
  private processQueue(): void {
    if (this.isProcessing || this.eventQueue.length === 0) return;

    this.isProcessing = true;
    const startTime = Date.now();

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (!event) continue;

      this.notifySubscribers(event);
      this.updateStats(event);
    }

    const latency = Date.now() - startTime;
    this.stats.averageLatencyMs = (this.stats.averageLatencyMs + latency) / 2;
    this.isProcessing = false;
  }

  /**
   * Notify all relevant subscribers
   */
  private notifySubscribers(event: NotificationEvent): void {
    for (const [, subscriber] of this.subscribers) {
      // Check filters
      if (subscriber.filters && !subscriber.filters.includes(event.type)) {
        continue;
      }

      try {
        subscriber.callback(event);
      } catch (error) {
        if (this.config.enableLogging) {
          console.error(`Error notifying subscriber ${subscriber.id}:`, error);
        }
      }
    }
  }

  /**
   * Update statistics
   */
  private updateStats(event: NotificationEvent): void {
    this.stats.totalSent++;
    this.stats.byType[event.type] = (this.stats.byType[event.type] || 0) + 1;
    this.stats.byPriority[event.priority]++;
  }

  /**
   * Get current statistics
   */
  getStats(): NotificationStats {
    return { ...this.stats };
  }

  /**
   * Clear all subscribers
   */
  clearSubscribers(): void {
    this.subscribers.clear();
    this.stats.subscriberCount = 0;
  }

  /**
   * Get subscriber count
   */
  getSubscriberCount(): number {
    return this.subscribers.size;
  }

  // === Convenience Methods for Common Events ===

  /**
   * Emit validation started event
   */
  validationStarted(lawId: string, strategy: string): NotificationEvent {
    return this.emit('validation_started', { lawId, strategy }, 'medium', 'validator');
  }

  /**
   * Emit validation progress event
   */
  validationProgress(lawId: string, progress: number, step: string): NotificationEvent {
    return this.emit('validation_progress', { lawId, progress, step }, 'low', 'validator');
  }

  /**
   * Emit validation complete event
   */
  validationComplete(lawId: string, score: number, passed: boolean): NotificationEvent {
    return this.emit('validation_complete', { lawId, score, passed }, 'high', 'validator');
  }

  /**
   * Emit simulation started event
   */
  simulationStarted(mechanism: string, parameters: Record<string, unknown>): NotificationEvent {
    return this.emit('simulation_started', { mechanism, parameters }, 'medium', 'simulator');
  }

  /**
   * Emit simulation progress event
   */
  simulationProgress(mechanism: string, iteration: number, total: number): NotificationEvent {
    return this.emit('simulation_progress', { mechanism, iteration, total, progress: iteration / total }, 'low', 'simulator');
  }

  /**
   * Emit simulation complete event
   */
  simulationComplete(mechanism: string, results: Record<string, unknown>): NotificationEvent {
    return this.emit('simulation_complete', { mechanism, results }, 'high', 'simulator');
  }

  /**
   * Emit law updated event
   */
  lawUpdated(lawId: string, changes: Record<string, unknown>): NotificationEvent {
    return this.emit('law_updated', { lawId, changes }, 'medium', 'laws');
  }

  /**
   * Emit paper generated event
   */
  paperGenerated(paperId: string, title: string, format: string): NotificationEvent {
    return this.emit('paper_generated', { paperId, title, format }, 'high', 'paper_generator');
  }

  /**
   * Emit export complete event
   */
  exportComplete(format: string, filename: string, size: number): NotificationEvent {
    return this.emit('export_complete', { format, filename, size }, 'medium', 'exporter');
  }

  /**
   * Emit error event
   */
  error(message: string, details: Record<string, unknown> = {}): NotificationEvent {
    return this.emit('error', { message, ...details }, 'critical', 'system');
  }

  /**
   * Emit warning event
   */
  warning(message: string, details: Record<string, unknown> = {}): NotificationEvent {
    return this.emit('warning', { message, ...details }, 'high', 'system');
  }

  /**
   * Emit info event
   */
  info(message: string, details: Record<string, unknown> = {}): NotificationEvent {
    return this.emit('info', { message, ...details }, 'low', 'system');
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

/**
 * Factory for creating RealtimeNotifications instances
 */
export class RealtimeNotificationsFactory {
  static createDefault(): RealtimeNotifications {
    return new RealtimeNotifications();
  }

  static createWithConfig(config: Partial<RealtimeConfig>): RealtimeNotifications {
    return new RealtimeNotifications(config);
  }

  static createHighPerformance(): RealtimeNotifications {
    return new RealtimeNotifications({
      maxQueueSize: 10000,
      batchInterval: 50,
      retryAttempts: 5,
      enableLogging: false
    });
  }

  static createDebug(): RealtimeNotifications {
    return new RealtimeNotifications({
      maxQueueSize: 100,
      batchInterval: 0,
      retryAttempts: 1,
      enableLogging: true
    });
  }
}

export default RealtimeNotifications;
