import mongoose from "mongoose";
import logger from "./logger.js";

// Configuration de la connexion MongoDB
const MONGODB_URI =
  process.env.MONGODB_URI ||
  `mongodb://${process.env.MONGO_APP_USERNAME || "app_user"}:${process.env.MONGO_APP_PASSWORD || "dev_password"}@localhost:27017/${process.env.MONGO_INITDB_DATABASE || "latelier_dev"}?authSource=${process.env.MONGO_INITDB_DATABASE || "latelier_dev"}`;
const MONGODB_OPTIONS = {
  // Options de connexion
  maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || "10", 10),
  serverSelectionTimeoutMS: parseInt(
    process.env.MONGODB_SERVER_SELECTION_TIMEOUT || "5000",
    10
  ),
  socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT || "45000", 10),

  // Options de retry
  retryWrites: true,
  retryReads: true,

  // Options de lecture préférée
  readPreference: "primaryPreferred" as const,

  // Compression
  compressors: ["zlib"] as ("none" | "snappy" | "zlib" | "zstd")[],

  // Heartbeat
  heartbeatFrequencyMS: parseInt(
    process.env.MONGODB_HEARTBEAT_FREQUENCY || "10000",
    10
  ),
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
   * Établit la connexion à MongoDB
   */
  public async connect(): Promise<void> {
    try {
      if (this.isConnected) {
        logger.info("Connexion MongoDB déjà établie");
        return;
      }

      logger.info("Connexion à MongoDB en cours...", {
        uri: MONGODB_URI.replace(/\/\/.*@/, "//***:***@"), // Masquer les credentials dans les logs
        options: MONGODB_OPTIONS,
      });

      await mongoose.connect(MONGODB_URI, MONGODB_OPTIONS);

      this.isConnected = true;
      logger.info("Connexion MongoDB établie avec succès", {
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name,
      });

      // Écouter les événements de connexion
      this.setupEventListeners();
    } catch (error) {
      logger.error("Erreur lors de la connexion à MongoDB", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Ferme la connexion à MongoDB
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
   * Vérifie l'état de la connexion
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
   * Configure les écouteurs d'événements MongoDB
   */
  private setupEventListeners(): void {
    mongoose.connection.on("connected", () => {
      logger.info("Mongoose connecté à MongoDB");
    });

    mongoose.connection.on("error", (error) => {
      logger.error("Erreur de connexion Mongoose", {
        error: error.message,
        stack: error.stack,
      });
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("Mongoose déconnecté de MongoDB");
      this.isConnected = false;
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("Mongoose reconnecté à MongoDB");
      this.isConnected = true;
    });

    // Gestion de l'arrêt gracieux
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

// Export de l'instance singleton
export const database = DatabaseConnection.getInstance();
export default database;
