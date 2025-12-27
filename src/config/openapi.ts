import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { config } from "dotenv";

// Chargement des variables d'environnement
config();

// Création du registre OpenAPI
const registry = new OpenAPIRegistry();

// Configuration du serveur depuis les variables d'environnement
const SERVER_URL = process.env.SERVER_URL || `http://${process.env.HOST || 'localhost'}:${process.env.PORT || 3000}`;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Génération du document OpenAPI
const generator = new OpenApiGeneratorV3(registry.definitions);
export const openApiDocument = generator.generateDocument({
  openapi: "3.0.0",
  info: {
    title: "API L'Atelier",
    version: "1.0.0",
    description: "Documentation API générée automatiquement avec les schémas Zod"
  },
  servers: [
    {
      url: SERVER_URL,
      description: NODE_ENV === 'production' ? "Serveur de production" : "Serveur de développement"
    }
  ]
});