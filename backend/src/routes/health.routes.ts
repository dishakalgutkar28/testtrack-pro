/**
 * Health Check Routes
 * Health monitoring and system status endpoints
 */

import { Router } from 'express';
import { healthCheck, detailedHealthCheck, systemInfo } from '../controllers/HealthController';

const router = Router();

/**
 * @route   GET /health
 * @desc    Basic health check
 * @access  Public
 */
router.get('/health', healthCheck);

/**
 * @route   GET /health/detailed
 * @desc    Detailed health check with dependency status
 * @access  Public
 */
router.get('/health/detailed', detailedHealthCheck);

/**
 * @route   GET /system/info
 * @desc    System information
 * @access  Public
 */
router.get('/system/info', systemInfo);

export default router;
