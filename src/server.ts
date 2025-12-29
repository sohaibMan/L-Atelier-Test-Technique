import { createServer } from "http";
import { config } from "dotenv";
import app from "./app.js";
import { database } from "./config/database.js";
import logger from "./config/logger.js";

// Chargement des variables d'environnement
config();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "localhost";
const SERVER_URL = process.env.SERVER_URL || `http://${HOST}:${PORT}`;

// Fonction de démarrage du serveur
async function startServer() {
  try {
    // Connexion à la base de données
    logger.info("Initialisation de la connexion à la base de données...");
    await database.connect();

    // Création du serveur HTTP
    const server = createServer(app);

    server.listen(PORT, () => {
      logger.info("Serveur démarré avec succès", {
        url: SERVER_URL,
        port: PORT,
        host: HOST,
        env: process.env.NODE_ENV || "development",
      });
      console.log(`Serveur démarré sur ${SERVER_URL}`);
      console.log(`Documentation API : ${SERVER_URL}/api-docs`);
    });

    // Arrêt gracieux
    const shutdown = async (signal: string) => {
      logger.info(`Signal ${signal} reçu. Arrêt gracieux...`);

      server.close(async () => {
        logger.info("Serveur HTTP fermé");

        try {
          await database.disconnect();
          logger.info("Connexion à la base de données fermée");
        } catch (error) {
          logger.error("Erreur lors de la fermeture de la base de données", {
            error: error instanceof Error ? error.message : String(error),
          });
        }

        process.exit(0);
      });
    };

    // Gestionnaires de signaux
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    logger.error("Erreur lors du démarrage du serveur", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

// Démarrage du serveur
startServer();
