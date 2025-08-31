import { EventEmitter } from 'events';

export interface MetricData {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp?: Date;
}

export interface ErrorData {
  message: string;
  stack?: string;
  context?: Record<string, any>;
  timestamp?: Date;
}

export interface LogData {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, any>;
  timestamp?: Date;
}

export interface PerformanceMetric {
  operation: string;
  duration: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: boolean;
    redis: boolean;
    pinecone: boolean;
    openai: boolean;
  };
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  timestamp: Date;
}

export class MonitoringService extends EventEmitter {
  private metrics: Map<string, MetricData[]> = new Map();
  private errors: ErrorData[] = [];
  private logs: LogData[] = [];
  private performance: PerformanceMetric[] = [];
  private startTime: Date = new Date();
  private config: {
    maxMetricsPerName: number;
    maxErrors: number;
    maxLogs: number;
    maxPerformanceRecords: number;
    flushInterval: number;
  };

  constructor(config?: Partial<typeof MonitoringService.prototype.config>) {
    super();
    this.config = {
      maxMetricsPerName: 1000,
      maxErrors: 500,
      maxLogs: 1000,
      maxPerformanceRecords: 1000,
      flushInterval: 60000, // 1 minute
      ...config,
    };

    // Set up periodic flush
    if (this.config.flushInterval > 0) {
      setInterval(() => this.flush(), this.config.flushInterval);
    }
  }

  // Metrics
  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    const metric: MetricData = {
      name,
      value,
      tags,
      timestamp: new Date(),
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricsArray = this.metrics.get(name)!;
    metricsArray.push(metric);

    // Trim if exceeds max
    if (metricsArray.length > this.config.maxMetricsPerName) {
      metricsArray.shift();
    }

    this.emit('metric', metric);
  }

  incrementCounter(name: string, value: number = 1, tags?: Record<string, string>): void {
    this.recordMetric(name, value, { ...tags, type: 'counter' });
  }

  recordGauge(name: string, value: number, tags?: Record<string, string>): void {
    this.recordMetric(name, value, { ...tags, type: 'gauge' });
  }

  recordHistogram(name: string, value: number, tags?: Record<string, string>): void {
    this.recordMetric(name, value, { ...tags, type: 'histogram' });
  }

  // Error tracking
  recordError(error: Error | string, context?: Record<string, any>): void {
    const errorData: ErrorData = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'string' ? undefined : error.stack,
      context,
      timestamp: new Date(),
    };

    this.errors.push(errorData);

    // Trim if exceeds max
    if (this.errors.length > this.config.maxErrors) {
      this.errors.shift();
    }

    this.emit('error', errorData);
    this.log('error', errorData.message, context);
  }

  // Logging
  log(level: LogData['level'], message: string, context?: Record<string, any>): void {
    const logData: LogData = {
      level,
      message,
      context,
      timestamp: new Date(),
    };

    this.logs.push(logData);

    // Trim if exceeds max
    if (this.logs.length > this.config.maxLogs) {
      this.logs.shift();
    }

    this.emit('log', logData);

    // Console output based on level
    const timestamp = logData.timestamp?.toISOString() || new Date().toISOString();
    switch (level) {
      case 'debug':
        console.debug(`[${timestamp}] DEBUG: ${message}`, context || '');
        break;
      case 'info':
        console.info(`[${timestamp}] INFO: ${message}`, context || '');
        break;
      case 'warn':
        console.warn(`[${timestamp}] WARN: ${message}`, context || '');
        break;
      case 'error':
        console.error(`[${timestamp}] ERROR: ${message}`, context || '');
        break;
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, any>): void {
    this.log('error', message, context);
  }

  // Performance tracking
  startOperation(operation: string): () => void {
    const startTime = Date.now();
    
    return (error?: Error) => {
      const duration = Date.now() - startTime;
      this.recordPerformance({
        operation,
        duration,
        success: !error,
        error: error?.message,
      });
    };
  }

  async trackOperation<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await fn();
      this.recordPerformance({
        operation,
        duration: Date.now() - startTime,
        success: true,
        metadata,
      });
      return result;
    } catch (error) {
      this.recordPerformance({
        operation,
        duration: Date.now() - startTime,
        success: false,
        error: (error as Error).message,
        metadata,
      });
      throw error;
    }
  }

  recordPerformance(metric: PerformanceMetric): void {
    this.performance.push(metric);

    // Trim if exceeds max
    if (this.performance.length > this.config.maxPerformanceRecords) {
      this.performance.shift();
    }

    this.emit('performance', metric);
    
    // Also record as metrics
    this.recordHistogram(`${metric.operation}.duration`, metric.duration);
    this.incrementCounter(`${metric.operation}.${metric.success ? 'success' : 'failure'}`);
  }

  // Health checks
  async checkHealth(
    checks: {
      database?: () => Promise<boolean>;
      redis?: () => Promise<boolean>;
      pinecone?: () => Promise<boolean>;
      openai?: () => Promise<boolean>;
    }
  ): Promise<SystemHealth> {
    const health: SystemHealth = {
      status: 'healthy',
      checks: {
        database: true,
        redis: true,
        pinecone: true,
        openai: true,
      },
      uptime: Date.now() - this.startTime.getTime(),
      memory: this.getMemoryUsage(),
      timestamp: new Date(),
    };

    // Run health checks
    if (checks.database) {
      try {
        health.checks.database = await checks.database();
      } catch {
        health.checks.database = false;
      }
    }

    if (checks.redis) {
      try {
        health.checks.redis = await checks.redis();
      } catch {
        health.checks.redis = false;
      }
    }

    if (checks.pinecone) {
      try {
        health.checks.pinecone = await checks.pinecone();
      } catch {
        health.checks.pinecone = false;
      }
    }

    if (checks.openai) {
      try {
        health.checks.openai = await checks.openai();
      } catch {
        health.checks.openai = false;
      }
    }

    // Determine overall status
    const failedChecks = Object.values(health.checks).filter(check => !check).length;
    if (failedChecks === 0) {
      health.status = 'healthy';
    } else if (failedChecks === 1) {
      health.status = 'degraded';
    } else {
      health.status = 'unhealthy';
    }

    this.emit('health', health);
    return health;
  }

  // Utility methods
  private getMemoryUsage(): SystemHealth['memory'] {
    const used = process.memoryUsage().heapUsed;
    const total = process.memoryUsage().heapTotal;
    
    return {
      used,
      total,
      percentage: (used / total) * 100,
    };
  }

  getMetrics(name?: string): MetricData[] {
    if (name) {
      return this.metrics.get(name) || [];
    }
    
    const allMetrics: MetricData[] = [];
    this.metrics.forEach(metrics => allMetrics.push(...metrics));
    return allMetrics;
  }

  getErrors(limit?: number): ErrorData[] {
    if (limit) {
      return this.errors.slice(-limit);
    }
    return [...this.errors];
  }

  getLogs(level?: LogData['level'], limit?: number): LogData[] {
    let logs = [...this.logs];
    
    if (level) {
      logs = logs.filter(log => log.level === level);
    }
    
    if (limit) {
      logs = logs.slice(-limit);
    }
    
    return logs;
  }

  getPerformanceMetrics(operation?: string, limit?: number): PerformanceMetric[] {
    let metrics = [...this.performance];
    
    if (operation) {
      metrics = metrics.filter(m => m.operation === operation);
    }
    
    if (limit) {
      metrics = metrics.slice(-limit);
    }
    
    return metrics;
  }

  getStats(): {
    metrics: number;
    errors: number;
    logs: number;
    performance: number;
    uptime: number;
    memory: SystemHealth['memory'];
  } {
    return {
      metrics: Array.from(this.metrics.values()).reduce((sum, arr) => sum + arr.length, 0),
      errors: this.errors.length,
      logs: this.logs.length,
      performance: this.performance.length,
      uptime: Date.now() - this.startTime.getTime(),
      memory: this.getMemoryUsage(),
    };
  }

  // Data management
  flush(): void {
    const data = {
      metrics: this.getMetrics(),
      errors: this.getErrors(),
      logs: this.getLogs(),
      performance: this.getPerformanceMetrics(),
      timestamp: new Date(),
    };

    this.emit('flush', data);

    // Clear old data
    this.metrics.clear();
    this.errors = [];
    this.logs = [];
    this.performance = [];
  }

  clear(): void {
    this.metrics.clear();
    this.errors = [];
    this.logs = [];
    this.performance = [];
  }

  // Export methods
  exportMetrics(): string {
    return JSON.stringify({
      metrics: this.getMetrics(),
      errors: this.getErrors(),
      logs: this.getLogs(),
      performance: this.getPerformanceMetrics(),
      stats: this.getStats(),
      timestamp: new Date(),
    }, null, 2);
  }
}

// Singleton instance
let monitoringInstance: MonitoringService | null = null;

export function getMonitoring(): MonitoringService {
  if (!monitoringInstance) {
    monitoringInstance = new MonitoringService();
  }
  return monitoringInstance;
}