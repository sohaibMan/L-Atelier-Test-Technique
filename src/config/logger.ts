import winston from "winston";

// Configuration du logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "latelier-api" },
  transports: [
    // Écriture des logs d'erreur dans error.log
    new winston.transports.File({ 
      filename: "logs/error.log", 
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Écriture de tous les logs dans combined.log
    new winston.transports.File({ 
      filename: "logs/combined.log",
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// En développement, afficher aussi dans la console
if (process.env.NODE_ENV !== "production") {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

export default logger;