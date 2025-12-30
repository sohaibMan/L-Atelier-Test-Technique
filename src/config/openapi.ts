import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";
import { config } from "dotenv";
import {
  PlayerSchema,
  CreatePlayerSchema,
  PlayerParamsSchema,
  PlayerResponseSchema,
} from "../schemas/playerSchemas.js";

// Chargement des variables d'environnement
config();

// Création du registre OpenAPI
const registry = new OpenAPIRegistry();

// Enregistrement des schémas joueur
registry.register("Player", PlayerSchema);
registry.register("CreatePlayer", CreatePlayerSchema);
registry.register("PlayerParams", PlayerParamsSchema);
registry.register("PlayerResponse", PlayerResponseSchema);

// Configuration du serveur depuis les variables d'environnement
const SERVER_URL =
  process.env.SERVER_URL ||
  `http://${process.env.HOST || "localhost"}:${process.env.PORT || 3000}`;
const NODE_ENV = process.env.NODE_ENV || "development";

// Génération du document OpenAPI
const generator = new OpenApiGeneratorV3(registry.definitions);
export const openApiDocument = generator.generateDocument({
  openapi: "3.0.0",
  info: {
    title: "API Tennis L'Atelier - Gestion des Joueurs",
    version: "1.0.0",
    description: `
# API Tennis L'Atelier

This API manages tennis players with creation, retrieval and statistics features.

## Features

### Player Management
- **POST /api/players** : Create a new tennis player
- **GET /api/players/{id}** : Get specific player information

### Specific Statistics
- **GET /api/players/stats** : Returns calculated statistics :
  - Pays avec le meilleur ratio de parties gagnées
  - IMC moyen de tous les joueurs
  - Médiane de la taille des joueurs

## Validation des données

### Contraintes pour la création d'un joueur
- **ID** : Unique, nombre entier positif
- **Nom court** : Format X.XXX (ex: R.FED), unique
- **Sexe** : M (Masculin) ou F (Féminin)
- **Poids** : Entre 30kg et 200kg (en grammes)
- **Taille** : Entre 140cm et 250cm
- **Âge** : Entre 16 et 50 ans
- **Derniers résultats** : Exactement 5 valeurs (0 ou 1)

## Base de données

L'API utilise MongoDB en configuration replica set (cluster) avec 3 nœuds pour la haute disponibilité.

### Collection
- **players** : Joueurs de tennis avec données ATP/WTA complètes

### Données disponibles
- 5 joueurs de tennis professionnels avec leurs informations complètes :
  - **ID 17** : Rafael Nadal (Rank 1, ESP) - Taille: 185cm, Poids: 85kg
  - **ID 52** : Novak Djokovic (Rank 2, SRB) - Taille: 188cm, Poids: 80kg
  - **ID 102** : Serena Williams (Rank 10, USA) - Taille: 175cm, Poids: 72kg
  - **ID 65** : Stan Wawrinka (Rank 21, SUI) - Taille: 183cm, Poids: 81kg
  - **ID 95** : Venus Williams (Rank 52, USA) - Taille: 185cm, Poids: 74kg

## Usage Examples

### Create a new player
\`\`\`bash
curl -X POST http://localhost:3000/api/players \\
  -H "Content-Type: application/json" \\
  -d '{
    "id": 123,
    "firstname": "Roger",
    "lastname": "Federer",
    "shortname": "R.FED",
    "sex": "M",
    "country": {
      "picture": "https://tenisu.latelier.co/resources/Suisse.png",
      "code": "SUI"
    },
    "picture": "https://tenisu.latelier.co/resources/Federer.png",
    "data": {
      "rank": 3,
      "points": 2500,
      "weight": 85000,
      "height": 185,
      "age": 35,
      "last": [1, 1, 0, 1, 1]
    }
  }'
\`\`\`

### Get a player
\`GET /api/players/123\`

### Get statistics
\`GET /api/players/stats\`

## Error Handling

- **400** : Invalid data (validation failed)
- **409** : Conflict (ID or shortname already used)
- **404** : Player not found
- **500** : Internal server error

## Environnement

Environnement actuel : **${NODE_ENV}**
    `,
    contact: {
      name: "L'Atelier",
      email: "sohaib.manah.contact@gmail.com",
    },
  },
  servers: [
    {
      url: SERVER_URL,
      description:
        NODE_ENV === "production"
          ? "Serveur de production"
          : "Serveur de développement",
    },
  ],
  tags: [
    {
      name: "Players",
      description:
        "Gestion des joueurs de tennis - création, récupération et statistiques",
    },
  ],
});
