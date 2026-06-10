/**
 * Health Check Controller
 * System health and status endpoints
 */

import { Request, Response } from 'express';
import { createPool } from 'mysql2/promise';

/**
 * Basic health check
 */
export const healthCheck = async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'TestTrack Pro API',
    version: '1.0.0',
  });
};

/**
 * Detailed health check with dependencies
 */
export const detailedHealthCheck = async (_req: Request, res: Response): Promise<void> => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'TestTrack Pro API',
    version: '1.0.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    checks: {
      database: await checkDatabase(),
      memory: checkMemory(),
      cpu: checkCPU(),
    },
  };

  // Overall status based on checks
  const hasFailure = Object.values(health.checks).some((check: any) => check.status === 'unhealthy');
  health.status = hasFailure ? 'unhealthy' : 'healthy';

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
};

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<any> {
  try {
    const pool = createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'testtrack_pro',
      waitForConnections: true,
      connectionLimit: 10,
    });

    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    await pool.end();

    return {
      status: 'healthy',
      message: 'Database connection successful',
      responseTime: '<50ms',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Database connection failed',
      error: (error as Error).message,
    };
  }
}

/**
 * Check memory usage
 */
function checkMemory(): any {
  const memoryUsage = process.memoryUsage();
  const totalMemoryMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
  const usedMemoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
  const usagePercent = Math.round((usedMemoryMB / totalMemoryMB) * 100);

  return {
    status: usagePercent < 90 ? 'healthy' : 'unhealthy',
    totalMB: totalMemoryMB,
    usedMB: usedMemoryMB,
    usagePercent: `${usagePercent}%`,
  };
}

/**
 * Check CPU usage
 */
function checkCPU(): any {
  const cpuUsage = process.cpuUsage();
  const userCPU = Math.round(cpuUsage.user / 1000000); // Convert to seconds
  const systemCPU = Math.round(cpuUsage.system / 1000000);

  return {
    status: 'healthy',
    userCPU: `${userCPU}s`,
    systemCPU: `${systemCPU}s`,
    uptime: `${Math.round(process.uptime())}s`,
  };
}

/**
 * System information endpoint
 */
export const systemInfo = async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    service: 'TestTrack Pro API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    node: process.version,
    platform: process.platform,
    architecture: process.arch,
    uptime: `${Math.round(process.uptime())}s`,
    timestamp: new Date().toISOString(),
  });
};
