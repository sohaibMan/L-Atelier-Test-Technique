import express from "express";
import type { Request, Response } from "express";
import { HealthCheckSchema } from "../schemas/health.js";
import logger from "../config/logger.js";

const router = express.Router();

// Endpoint de contrôle de santé
router.get("/", async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const memoryUsage = process.memoryUsage();
    const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100;
    const memoryLimitMB = parseInt(process.env.MEMORY_LIMIT_MB || "512", 10);
    
    const isHealthy = memoryUsedMB < memoryLimitMB && process.uptime() > 0;
    
    const healthData = {
      status: isHealthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development"
    };
    
    const validatedData = HealthCheckSchema.parse(healthData);
    const responseCode = isHealthy ? 200 : 503;
    
    logger.info("Contrôle de santé effectué", { 
      status: healthData.status, 
      memory: `${memoryUsedMB}MB`,
      uptime: `${Math.floor(process.uptime())}s`
    });
    
    res.status(responseCode).json(validatedData);
  } catch (error) {
    logger.error("Erreur lors du contrôle de santé", error);
    res.status(503).json({
      status: "error",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development"
    });
  }
});

export default router;