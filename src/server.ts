import { createServer } from "http";
import { config } from "dotenv";
import app from "./app.js";

// Chargement des variables d'environnement
config();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "localhost";
const SERVER_URL = process.env.SERVER_URL || `http://${HOST}:${PORT}`;

// Création du serveur HTTP
const server = createServer(app);

server.listen(PORT, () => {
  console.log(`Serveur démarré sur ${SERVER_URL}`);
  console.log(`Documentation API : ${SERVER_URL}/api-docs`);
});

// Arrêt gracieux
const shutdown = (signal: string) => {
  console.log(`\nSignal ${signal} reçu. Arrêt gracieux...`);
  server.close(() => {
    console.log("Serveur HTTP fermé");
    process.exit(0);
  });
};

// Gestionnaires de signaux
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
