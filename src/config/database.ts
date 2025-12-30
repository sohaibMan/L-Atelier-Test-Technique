import mongoose from "mongoose";
import logger from "./logger.js";
import fs from "fs";
import path from "path";

// Configuration de la connexion MongoDB - entièrement dynamique depuis les variables d'environnement
let MONGODB_URI = process.env.MONGODB_URI;

// Auto-detect environment and configure MongoDB URI accordingly
if (!MONGODB_URI) {
  const nodeEnv = process.env.NODE_ENV || "development";
  const mongoUser = process.env.MONGO_APP_USERNAME || "app_user";
  const mongoPassword = process.env.MONGO_APP_PASSWORD || "dev_password";
  const mongoDatabase = process.env.MONGO_INITDB_DATABASE || "latelier_dev";

  // Determine MongoDB host based on environment
  let mongoHost: string;
  let mongoPort = process.env.MONGO_PORT || "27017";

  if (process.env.DOCDB_CLUSTER_ENDPOINT) {
    // Cloud environment (AWS DocumentDB from CDK)
    mongoHost = process.env.DOCDB_CLUSTER_ENDPOINT;
    mongoPort = process.env.DOCDB_PORT || "27017";
    MONGODB_URI = `mongodb://${mongoUser}:${mongoPassword}@${mongoHost}:${mongoPort}/${mongoDatabase}?tls=true&retryWrites=false&authSource=admin&authMechanism=SCRAM-SHA-1`;
    logger.info("Using AWS DocumentDB from CDK configuration", {
      host: mongoHost,
      port: mongoPort,
    });
  } else if (
    process.env.DOCKER_ENV === "true" ||
    process.env.NODE_ENV === "production"
  ) {
    // Docker environment (both app and MongoDB in containers)
    mongoHost = process.env.MONGO_HOST || "mongodb-primary";
    MONGODB_URI = `mongodb://${mongoUser}:${mongoPassword}@${mongoHost}:${mongoPort}/${mongoDatabase}?authSource=${mongoDatabase}`;
    logger.info("Using Docker MongoDB container", {
      host: mongoHost,
      port: mongoPort,
    });
  } else {
    // Development environment (app local, MongoDB in Docker)
    mongoHost = process.env.MONGO_HOST || "localhost";
    MONGODB_URI = `mongodb://${mongoUser}:${mongoPassword}@${mongoHost}:${mongoPort}/${mongoDatabase}?authSource=${mongoDatabase}`;
    logger.info("Using local development with Docker MongoDB", {
      host: mongoHost,
      port: mongoPort,
    });
  }

  logger.info("Auto-generated MongoDB URI", {
    environment: nodeEnv,
    host: mongoHost,
    port: mongoPort,
    database: mongoDatabase,
    user: mongoUser,
    isDocumentDB: !!process.env.DOCDB_CLUSTER_ENDPOINT,
    isDocker:
      process.env.DOCKER_ENV === "true" ||
      process.env.NODE_ENV === "production",
  });
}

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI est requis dans les variables d'environnement");
}

// Détection automatique du type de base de données
const isDocumentDB =
  MONGODB_URI.includes("docdb") || MONGODB_URI.includes("amazonaws.com");

// URI validée (non undefined après la vérification)
const validatedMongoUri: string = MONGODB_URI;

// Chargement du certificat SSL pour les connexions DocumentDB
function loadSSLCertificate(): Buffer[] | undefined {
  if (!isDocumentDB) return undefined;

  try {
    const certPath = path.join(process.cwd(), "global-bundle.pem");

    if (fs.existsSync(certPath)) {
      logger.info("Certificat CA DocumentDB chargé avec succès");
      return [fs.readFileSync(certPath)];
    } else {
      logger.warn(
        "Certificat CA DocumentDB non trouvé, utilisation de tlsAllowInvalidCertificates"
      );
      return undefined;
    }
  } catch (error) {
    logger.error("Erreur lors du chargement du certificat CA DocumentDB", {
      error: error instanceof Error ? error.message : String(error),
    });
    return undefined;
  }
}

const sslCA = loadSSLCertificate();

const MONGODB_OPTIONS = {
  // Timeouts augmentés pour DocumentDB
  maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || "3", 10),
  serverSelectionTimeoutMS: parseInt(
    process.env.MONGODB_SERVER_SELECTION_TIMEOUT || "60000",
    10
  ),
  socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT || "60000", 10),
  connectTimeoutMS: parseInt(
    process.env.MONGODB_CONNECT_TIMEOUT || "60000",
    10
  ),

  // Options de retry
  retryWrites: false, // DocumentDB ne supporte pas retryWrites
  retryReads: true,

  // Préférence de lecture
  readPreference: "primary" as const,

  // Compression désactivée pour DocumentDB
  ...(isDocumentDB
    ? {}
    : { compressors: ["zlib"] as ("none" | "snappy" | "zlib" | "zstd")[] }),

  // Heartbeat plus fréquent pour détecter les déconnexions
  heartbeatFrequencyMS: parseInt(
    process.env.MONGODB_HEARTBEAT_FREQUENCY || "5000",
    10
  ),

  // Authentification DocumentDB
  ...(isDocumentDB
    ? {
        authMechanism: "SCRAM-SHA-1" as const,
        authSource: "admin",
      }
    : {}),

  // Désactiver le buffering des commandes pour éviter les timeouts
  bufferCommands: false,

  // Configuration TLS pour DocumentDB avec certificat CA approprié
  ...(isDocumentDB
    ? {
        tls: true,
        ...(sslCA
          ? {
              ca: sslCA,
            }
          : {
              tlsAllowInvalidCertificates: true,
              tlsAllowInvalidHostnames: true,
            }),
      }
    : {}),
};

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnected = false;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  /**
   * Connect to MongoDB
   */
  public async connect(): Promise<void> {
    try {
      if (this.isConnected) {
        logger.info("Connexion MongoDB déjà établie");
        return;
      }

      logger.info("Connexion à MongoDB en cours...", {
        uri: validatedMongoUri.replace(/\/\/.*@/, "//***:***@"), // Masquer les credentials dans les logs
        options: {
          ...MONGODB_OPTIONS,
          // Masquer les détails sensibles
          tls: (MONGODB_OPTIONS as any).tls || false,
          hasCertificate: !!sslCA,
          isDocumentDB,
        },
      });

      // Informations de connexion DocumentDB (logs minimaux)
      if (isDocumentDB) {
        const hostname = validatedMongoUri.match(/@([^:]+):/)?.[1];
        console.log(`Connexion à DocumentDB: ${hostname}:27017`);
        console.log(
          `TLS: activé, certificat CA: ${sslCA ? "chargé" : "certificats invalides autorisés"}`
        );
      }

      // Connection retry with exponential backoff
      let retries = 5;
      let lastError: Error | null = null;
      let delay = 2000; // Start with 2 seconds

      while (retries > 0) {
        try {
          logger.info(`Tentative de connexion MongoDB ${6 - retries}/5...`, {
            retriesLeft: retries,
            delay: delay / 1000,
          });
          console.log(
            `Tentative ${6 - retries}/5 - URI: ${validatedMongoUri.replace(/\/\/.*@/, "//***:***@")}`
          );

          await mongoose.connect(validatedMongoUri, MONGODB_OPTIONS);

          logger.info("Connexion MongoDB réussie!", {
            readyState: mongoose.connection.readyState,
            host: mongoose.connection.host,
            port: mongoose.connection.port,
            name: mongoose.connection.name,
          });
          console.log("Connexion MongoDB réussie!", {
            readyState: mongoose.connection.readyState,
            host: mongoose.connection.host,
            port: mongoose.connection.port,
          });

          break;
        } catch (error) {
          lastError = error as Error;
          retries--;

          logger.error(
            `Échec de connexion MongoDB (tentative ${6 - retries}/5)`,
            {
              error: lastError.message,
              errorName: lastError.name,
              errorCode: (lastError as any).code,
              errorCodeName: (lastError as any).codeName,
              isDocumentDB,
              retriesLeft: retries,
              stack: lastError.stack,
            }
          );
          console.error(`Échec tentative ${6 - retries}/5:`, lastError.message);
          console.error(
            "Code:",
            (lastError as any).code,
            "Name:",
            lastError.name
          );

          if (retries > 0) {
            logger.warn(`Nouvelle tentative dans ${delay / 1000}s...`);
            console.log(`Nouvelle tentative dans ${delay / 1000}s...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay = Math.min(delay * 1.5, 30000); // Exponential backoff, max 30s
          }
        }
      }

      if (retries === 0 && lastError) {
        logger.error("Toutes les tentatives de connexion MongoDB ont échoué", {
          finalError: lastError.message,
          errorName: lastError.name,
          errorCode: (lastError as any).code,
          totalAttempts: 5,
        });
        throw lastError;
      }

      this.isConnected = true;
      logger.info("Connexion MongoDB établie avec succès", {
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name,
      });

      // Setup connection event listeners
      this.setupEventListeners();
    } catch (error) {
      logger.error("Erreur critique lors de la connexion à MongoDB", {
        error: error instanceof Error ? error.message : String(error),
        errorName: error instanceof Error ? error.name : "Unknown",
        errorCode: error instanceof Error ? (error as any).code : undefined,
        stack: error instanceof Error ? error.stack : undefined,
        isDocumentDB,
      });
      throw error;
    }
  }

  /**
   * Close MongoDB connection
   */
  public async disconnect(): Promise<void> {
    try {
      if (!this.isConnected) {
        logger.info("Aucune connexion MongoDB à fermer");
        return;
      }

      await mongoose.disconnect();
      this.isConnected = false;
      logger.info("Connexion MongoDB fermée");
    } catch (error) {
      logger.error("Erreur lors de la fermeture de la connexion MongoDB", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Check connection status
   */
  public getConnectionStatus(): {
    isConnected: boolean;
    readyState: number;
    host?: string;
    port?: number;
    name?: string;
  } {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
    };
  }

  /**
   * Setup MongoDB event listeners
   */
  private setupEventListeners(): void {
    mongoose.connection.on("connected", () => {
      logger.info("Mongoose connecté à MongoDB", {
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name,
      });
      this.isConnected = true;
    });

    mongoose.connection.on("error", (error) => {
      logger.error("Erreur de connexion Mongoose", {
        error: error.message,
        errorName: error.name,
        errorCode: (error as any).code,
        stack: error.stack,
        readyState: mongoose.connection.readyState,
      });
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("Mongoose déconnecté de MongoDB", {
        readyState: mongoose.connection.readyState,
        wasConnected: this.isConnected,
      });
      this.isConnected = false;
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("Mongoose reconnecté à MongoDB", {
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
      });
      this.isConnected = true;
    });

    mongoose.connection.on("connecting", () => {
      logger.info("Mongoose en cours de connexion...", {
        readyState: mongoose.connection.readyState,
      });
    });

    mongoose.connection.on("close", () => {
      logger.info("Connexion Mongoose fermée", {
        readyState: mongoose.connection.readyState,
      });
      this.isConnected = false;
    });

    // Graceful shutdown handling
    process.on("SIGINT", async () => {
      logger.info("Signal SIGINT reçu, fermeture de la connexion MongoDB...");
      await this.disconnect();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      logger.info("Signal SIGTERM reçu, fermeture de la connexion MongoDB...");
      await this.disconnect();
      process.exit(0);
    });
  }
}

// Export singleton instance
export const database = DatabaseConnection.getInstance();
export default database;
