import express from "express";
import type { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import routes from "./routes/index.js";
import logger from "./config/logger.js";

const app = express();

// Compression des réponses
app.use(compression());

// Sécurité - Headers de sécurité
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        // More permissive CSP for Swagger UI assets
        workerSrc: ["'self'", "blob:"],
        childSrc: ["'self'"],
        manifestSrc: ["'self'"],
      },
    },
    // Disable problematic headers for HTTP deployments
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
    originAgentCluster: false,
  })
);

// CORS - Configuration des origines autorisées
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate limiting - Limitation du nombre de requêtes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || "100", 10), // Limite par IP
  message: {
    error: "Trop de requêtes depuis cette IP, réessayez plus tard.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Logging des requêtes HTTP
app.use(
  morgan("combined", {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  })
);

// Middlewares globaux
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Routes de l'application
app.use(routes);

// Gestionnaire pour les routes non trouvées
app.use((req: Request, res: Response) => {
  logger.warn(`Route non trouvée: ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });
  res.status(404).json({ message: "Route non trouvée" });
});

// Gestionnaire d'erreurs pour les erreurs de parsing JSON
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (
    err instanceof SyntaxError &&
    "body" in err &&
    "type" in err &&
    (err as any).type === "entity.parse.failed"
  ) {
    logger.warn("Erreur de parsing JSON", {
      error: err.message,
      path: req.path,
      method: req.method,
      ip: req.ip,
    });

    return res.status(400).json({
      success: false,
      error: "Format JSON invalide",
    });
  }
  next(err);
});

// Gestionnaire global d'erreurs
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error("Erreur interne du serveur", {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  res.status(500).json({
    message: "Erreur interne du serveur",
    ...(process.env.NODE_ENV === "development" && { error: err.message }),
  });
});

export default app;
