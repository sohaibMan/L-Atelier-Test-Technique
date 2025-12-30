import express from "express";
import playerRoutes from "./players.js";
import { database } from "../config/database.js";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "../config/openapi.js";

const router = express.Router();

// Basic health check for load balancer
router.get("/api/health", (req, res) => {
  // Check if the application is ready to serve requests
  const healthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: process.env.npm_package_version || "1.0.0",
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
  };

  res.status(200).json(healthStatus);
});

// Check if database connection is working
router.get("/api/health/db", (req, res) => {
  const dbStatus = database.getConnectionStatus();

  const isHealthy = dbStatus.readyState === 1; // connected

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    database: {
      connected: dbStatus.isConnected,
      readyState: dbStatus.readyState,
      host: dbStatus.host,
      port: dbStatus.port,
      name: dbStatus.name,
    },
  });
});

// Routes joueurs de tennis
router.use("/api/players", playerRoutes);

// Documentation Swagger - accessible à /api-docs
// Middleware spécial pour Swagger UI pour éviter les warnings de sécurité
router.use("/api-docs", (req, res, next) => {
  // Remove all problematic security headers for Swagger UI on HTTP
  res.removeHeader("Cross-Origin-Opener-Policy");
  res.removeHeader("Cross-Origin-Embedder-Policy");
  res.removeHeader("Origin-Agent-Cluster");
  res.removeHeader("Cross-Origin-Resource-Policy");
  res.removeHeader("Content-Security-Policy");

  // Set minimal safe headers for Swagger UI
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");

  next();
});

router.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Documentation API L'Atelier",
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      tryItOutEnabled: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
    // Ensure assets are served properly
    customCssUrl: undefined,
    customJs: undefined,
    customfavIcon: undefined,
    swaggerUrl: undefined,
  })
);

export default router;
