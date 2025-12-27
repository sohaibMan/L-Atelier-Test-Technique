// Configuration globale pour les tests
const { config } = require("dotenv");

// Charger les variables d'environnement de test
config({ path: ".env.test" });

// Configuration par défaut pour les tests
process.env.NODE_ENV = "test";
process.env.PORT = "0"; // Port aléatoire pour les tests
process.env.LOG_LEVEL = "error"; // Réduire les logs pendant les tests