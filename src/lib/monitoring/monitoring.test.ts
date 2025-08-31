import { MonitoringService } from './monitoring';

describe('MonitoringService', () => {
  let monitoring: MonitoringService;

  beforeEach(() => {
    monitoring = new MonitoringService({ flushInterval: 0 });
    // Add a default error handler to prevent unhandled errors
    monitoring.on('error', () => {});
    jest.spyOn(console, 'debug').mockImplementation();
    jest.spyOn(console, 'info').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Metrics', () => {
    it('should record metrics', () => {
      monitoring.recordMetric('test.metric', 100, { env: 'test' });
      
      const metrics = monitoring.getMetrics('test.metric');
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        name: 'test.metric',
        value: 100,
        tags: { env: 'test' },
      });
    });

    it('should increment counter', () => {
      monitoring.incrementCounter('requests.count');
      monitoring.incrementCounter('requests.count', 5);
      
      const metrics = monitoring.getMetrics('requests.count');
      expect(metrics).toHaveLength(2);
      expect(metrics[0].value).toBe(1);
      expect(metrics[1].value).toBe(5);
    });

    it('should record gauge', () => {
      monitoring.recordGauge('memory.usage', 75.5);
      
      const metrics = monitoring.getMetrics('memory.usage');
      expect(metrics[0].tags?.type).toBe('gauge');
    });

    it('should record histogram', () => {
      monitoring.recordHistogram('response.time', 150);
      
      const metrics = monitoring.getMetrics('response.time');
      expect(metrics[0].tags?.type).toBe('histogram');
    });

    it('should limit metrics per name', () => {
      const service = new MonitoringService({ 
        maxMetricsPerName: 3,
        flushInterval: 0
      });
      
      for (let i = 0; i < 5; i++) {
        service.recordMetric('test', i);
      }
      
      const metrics = service.getMetrics('test');
      expect(metrics).toHaveLength(3);
      expect(metrics[0].value).toBe(2); // Oldest kept
    });
  });

  describe('Error Tracking', () => {
    it('should record errors', () => {
      const error = new Error('Test error');
      monitoring.recordError(error, { userId: '123' });
      
      const errors = monitoring.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        message: 'Test error',
        context: { userId: '123' },
      });
      expect(errors[0].stack).toBeDefined();
    });

    it('should record string errors', () => {
      monitoring.recordError('String error');
      
      const errors = monitoring.getErrors();
      expect(errors[0].message).toBe('String error');
      expect(errors[0].stack).toBeUndefined();
    });

    it('should limit error count', () => {
      const service = new MonitoringService({ 
        maxErrors: 3,
        flushInterval: 0
      });
      // Add error handler to prevent unhandled errors
      service.on('error', () => {});
      
      for (let i = 0; i < 5; i++) {
        service.recordError(`Error ${i}`);
      }
      
      const errors = service.getErrors();
      expect(errors).toHaveLength(3);
      expect(errors[0].message).toBe('Error 2');
    });
  });

  describe('Logging', () => {
    it('should log messages at different levels', () => {
      monitoring.debug('Debug message');
      monitoring.info('Info message');
      monitoring.warn('Warning message');
      monitoring.error('Error message');
      
      const logs = monitoring.getLogs();
      expect(logs).toHaveLength(4);
      
      expect(console.debug).toHaveBeenCalled();
      expect(console.info).toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });

    it('should filter logs by level', () => {
      monitoring.debug('Debug 1');
      monitoring.info('Info 1');
      monitoring.debug('Debug 2');
      
      const debugLogs = monitoring.getLogs('debug');
      expect(debugLogs).toHaveLength(2);
    });

    it('should limit log count', () => {
      const service = new MonitoringService({ 
        maxLogs: 3,
        flushInterval: 0
      });
      
      for (let i = 0; i < 5; i++) {
        service.info(`Log ${i}`);
      }
      
      const logs = service.getLogs();
      expect(logs).toHaveLength(3);
    });
  });

  describe('Performance Tracking', () => {
    it('should track operation performance', () => {
      const endOperation = monitoring.startOperation('api.request');
      
      // Call the end operation directly
      endOperation();
      
      const metrics = monitoring.getPerformanceMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        operation: 'api.request',
        success: true,
      });
    });

    it('should track operation with error', () => {
      const endOperation = monitoring.startOperation('api.request');
      endOperation(new Error('Request failed'));
      
      const metrics = monitoring.getPerformanceMetrics();
      expect(metrics[0]).toMatchObject({
        operation: 'api.request',
        success: false,
        error: 'Request failed',
      });
    });

    it('should track async operations', async () => {
      const result = await monitoring.trackOperation(
        'async.task',
        async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return 'success';
        },
        { taskId: '123' }
      );
      
      expect(result).toBe('success');
      
      const metrics = monitoring.getPerformanceMetrics();
      expect(metrics[0]).toMatchObject({
        operation: 'async.task',
        success: true,
        metadata: { taskId: '123' },
      });
    });

    it('should track failed async operations', async () => {
      await expect(
        monitoring.trackOperation(
          'async.task',
          async () => {
            throw new Error('Task failed');
          }
        )
      ).rejects.toThrow('Task failed');
      
      const metrics = monitoring.getPerformanceMetrics();
      expect(metrics[0]).toMatchObject({
        operation: 'async.task',
        success: false,
        error: 'Task failed',
      });
    });
  });

  describe('Health Checks', () => {
    it('should report healthy status when all checks pass', async () => {
      const health = await monitoring.checkHealth({
        database: async () => true,
        redis: async () => true,
        pinecone: async () => true,
        openai: async () => true,
      });
      
      expect(health.status).toBe('healthy');
      expect(health.checks).toEqual({
        database: true,
        redis: true,
        pinecone: true,
        openai: true,
      });
    });

    it('should report degraded status with one failure', async () => {
      const health = await monitoring.checkHealth({
        database: async () => true,
        redis: async () => false,
        pinecone: async () => true,
        openai: async () => true,
      });
      
      expect(health.status).toBe('degraded');
      expect(health.checks.redis).toBe(false);
    });

    it('should report unhealthy status with multiple failures', async () => {
      const health = await monitoring.checkHealth({
        database: async () => false,
        redis: async () => false,
        pinecone: async () => true,
        openai: async () => true,
      });
      
      expect(health.status).toBe('unhealthy');
    });

    it('should handle check exceptions', async () => {
      const health = await monitoring.checkHealth({
        database: async () => {
          throw new Error('Connection failed');
        },
      });
      
      expect(health.checks.database).toBe(false);
    });
  });

  describe('Data Management', () => {
    it('should get statistics', () => {
      monitoring.recordMetric('test', 1);
      monitoring.recordError('Error');
      monitoring.info('Log');
      monitoring.recordPerformance({
        operation: 'test',
        duration: 100,
        success: true,
      });
      
      const stats = monitoring.getStats();
      expect(stats).toMatchObject({
        metrics: 3, // 1 metric + 2 from performance (histogram and counter)
        errors: 1,
        logs: 2, // 1 info log + 1 error log (from recordError)
        performance: 1,
      });
      expect(stats.uptime).toBeGreaterThanOrEqual(0);
      expect(stats.memory).toBeDefined();
    });

    it('should flush data', () => {
      const flushHandler = jest.fn();
      monitoring.on('flush', flushHandler);
      
      monitoring.recordMetric('test', 1);
      monitoring.flush();
      
      expect(flushHandler).toHaveBeenCalled();
      expect(monitoring.getMetrics()).toHaveLength(0);
    });

    it('should clear all data', () => {
      monitoring.recordMetric('test', 1);
      monitoring.recordError('Error');
      monitoring.info('Log');
      
      monitoring.clear();
      
      const stats = monitoring.getStats();
      expect(stats.metrics).toBe(0);
      expect(stats.errors).toBe(0);
      expect(stats.logs).toBe(0);
    });

    it('should export data as JSON', () => {
      monitoring.recordMetric('test', 1);
      
      const exported = monitoring.exportMetrics();
      const data = JSON.parse(exported);
      
      expect(data).toHaveProperty('metrics');
      expect(data).toHaveProperty('errors');
      expect(data).toHaveProperty('logs');
      expect(data).toHaveProperty('performance');
      expect(data).toHaveProperty('stats');
      expect(data).toHaveProperty('timestamp');
    });
  });

  describe('Event Emitters', () => {
    it('should emit metric events', () => {
      const handler = jest.fn();
      monitoring.on('metric', handler);
      
      monitoring.recordMetric('test', 1);
      
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test',
          value: 1,
        })
      );
    });

    it('should emit error events', () => {
      const handler = jest.fn();
      monitoring.on('error', handler);
      
      monitoring.recordError('Test error');
      
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error',
        })
      );
    });

    it('should emit log events', () => {
      const handler = jest.fn();
      monitoring.on('log', handler);
      
      monitoring.info('Test log');
      
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
          message: 'Test log',
        })
      );
    });

    it('should emit performance events', () => {
      const handler = jest.fn();
      monitoring.on('performance', handler);
      
      monitoring.recordPerformance({
        operation: 'test',
        duration: 100,
        success: true,
      });
      
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'test',
          duration: 100,
        })
      );
    });

    it('should emit health events', async () => {
      const handler = jest.fn();
      monitoring.on('health', handler);
      
      await monitoring.checkHealth({});
      
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'healthy',
        })
      );
    });
  });
});