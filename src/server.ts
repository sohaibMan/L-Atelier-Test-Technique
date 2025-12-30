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
    // Informations d'environnement pour le débogage
    logger.info("Démarrage du serveur avec les paramètres suivants:", {
      nodeEnv: process.env.NODE_ENV,
      port: PORT,
      host: HOST,
      mongoUri: process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/\/\/.*@/, "//***:***@") : 'Non défini',
      docdbEndpoint: process.env.DOCDB_ENDPOINT || 'Non défini',
      docdbPort: process.env.DOCDB_PORT || 'Non défini',
      docdbDatabase: process.env.DOCDB_DATABASE || 'Non défini',
    });

    // Logs directs dans la console pour ECS
    console.log('DEMARRAGE DU SERVEUR');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/\/\/.*@/, "//***:***@") : 'Non défini');
    console.log('DOCDB_ENDPOINT:', process.env.DOCDB_ENDPOINT || 'Non défini');

    // Création du serveur HTTP d'abord
    const server = createServer(app);

    server.listen(Number(PORT), '0.0.0.0', () => {
      logger.info("Serveur démarré avec succès", {
        url: SERVER_URL,
        port: PORT,
        host: HOST,
        env: process.env.NODE_ENV || "development",
      });
      console.log(`Serveur démarré sur ${SERVER_URL}`);
      console.log(`Health check disponible sur: ${SERVER_URL}/api/health`);
      console.log(`Documentation API : ${SERVER_URL}/api-docs`);
    });

    // Tentative de connexion à la base de données (non bloquante)
    logger.info("Initialisation de la connexion à la base de données...");
    console.log('CONNEXION BASE DE DONNEES');
    try {
      await database.connect();
      logger.info("Base de données connectée avec succès");
      console.log('Base de données connectée avec succès');
    } catch (error) {
      logger.error("Impossible de se connecter à la base de données au démarrage", {
        error: error instanceof Error ? error.message : String(error),
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorCode: error instanceof Error ? (error as any).code : undefined,
        stack: error instanceof Error ? error.stack : undefined,
      });
      console.error('Erreur de connexion base de données:', error instanceof Error ? error.message : String(error));
      logger.info("Le serveur continue de fonctionner sans base de données");
      console.log('Le serveur continue sans base de données');
      
      // Nouvelle tentative en arrière-plan avec logs détaillés
      setTimeout(async () => {
        try {
          logger.info("Nouvelle tentative de connexion à la base de données...");
          console.log('Nouvelle tentative de connexion...');
          await database.connect();
          logger.info("Base de données connectée avec succès (retry)");
          console.log('Base de données connectée (retry)');
        } catch (retryError) {
          logger.error("Échec de la reconnexion à la base de données", {
            error: retryError instanceof Error ? retryError.message : String(retryError),
            errorName: retryError instanceof Error ? retryError.name : 'Unknown',
            errorCode: retryError instanceof Error ? (retryError as any).code : undefined,
            stack: retryError instanceof Error ? retryError.stack : undefined,
          });
          console.error('Échec reconnexion:', retryError instanceof Error ? retryError.message : String(retryError));
        }
      }, 10000); // Nouvelle tentative après 10 secondes
    }

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
