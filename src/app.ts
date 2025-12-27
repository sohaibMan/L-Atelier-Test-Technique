import express from "express";
import type { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import routes from "./routes/index.js";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "./config/openapi.js";
import logger from "./config/logger.js";

const app = express();

// Compression des réponses
app.use(compression());

// Sécurité - Headers de sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));

// CORS - Configuration des origines autorisées
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Rate limiting - Limitation du nombre de requêtes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || "100", 10), // Limite par IP
  message: {
    error: "Trop de requêtes depuis cette IP, réessayez plus tard."
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Logging des requêtes HTTP
app.use(morgan("combined", {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// Middlewares globaux
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Documentation Swagger générée automatiquement
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Documentation API L'Atelier"
}));

// Routes de l'application
app.use(routes);

// Gestionnaire pour les routes non trouvées
app.use((req: Request, res: Response) => {
  logger.warn(`Route non trouvée: ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get("User-Agent")
  });
  res.status(404).json({ message: "Route non trouvée" });
});

// Gestionnaire global d'erreurs
app.use(
  (err: Error, req: Request, res: Response, _next: NextFunction) => {
    logger.error("Erreur interne du serveur", {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip
    });
    
    res.status(500).json({
      message: "Erreur interne du serveur",
      ...(process.env.NODE_ENV === "development" && { error: err.message })
    });
  }
);

export default app;
