# L'Atelier Tennis API

Une API REST complète pour la gestion des joueurs de tennis et le calcul de statistiques spécifiques. Cette application utilise TypeScript, Express.js, MongoDB et Docker pour offrir une solution robuste et scalable.

## 🚀 Démarrage rapide

La façon la plus simple de démarrer l'application avec des données d'exemple :

```bash
# Cloner le repository
git clone <repository-url>
cd l-atelier-test-technique

# Démarrer l'application complète (API + MongoDB avec données)
npm run docker:dev

# L'application sera disponible sur http://localhost:3000
# Documentation API : http://localhost:3000/api-docs
```

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Installation](#-installation)
- [Configuration Docker](#-configuration-docker)
- [API Endpoints](#-api-endpoints)
- [Base de données](#-base-de-données)
- [Tests](#-tests)
- [Sécurité](#-sécurité)
- [Déploiement](#-déploiement)
- [Structure du projet](#-structure-du-projet)
- [Scripts disponibles](#-scripts-disponibles)
- [Variables d'environnement](#-variables-denvironnement)
- [Contribution](#-contribution)

## ✨ Fonctionnalités

### Technologies principales
- ✅ **TypeScript** - Typage statique pour une meilleure qualité de code
- ✅ **Express.js** - Framework web rapide et minimaliste
- ✅ **MongoDB** - Base de données NoSQL avec données d'exemple
- ✅ **Mongoose** - ODM pour MongoDB avec validation et schémas
- ✅ **Docker** - Containerisation avec multi-stage build

### API et validation
- ✅ **Récupération Joueur** - Endpoint pour récupérer un joueur par ID
- ✅ **Liste des Joueurs** - Endpoint pour récupérer tous les joueurs triés par classement
- ✅ **Création de Joueur** - Endpoint pour créer de nouveaux joueurs
- ✅ **Statistiques Avancées** - Calculs spécifiques (ratio victoires, IMC, médiane)
- ✅ **Swagger/OpenAPI** - Documentation API automatique et interactive
- ✅ **Zod** - Validation des schémas et génération de types TypeScript

### Sécurité et monitoring
- ✅ **Winston** - Logging structuré avec rotation des fichiers
- ✅ **Helmet** - Headers de sécurité (CSP, HSTS, etc.)
- ✅ **CORS** - Configuration des origines autorisées
- ✅ **Rate Limiting** - Protection contre les abus (100 req/15min)
- ✅ **Compression** - Compression gzip des réponses
- ✅ **Health Check** - Monitoring de l'état de l'application et de la DB

### Qualité de code
- ✅ **ESLint & Prettier** - Qualité et formatage du code
- ✅ **Tests complets** - Tests unitaires, d'intégration et E2E (85 tests)
- ✅ **CI/CD** - Pipeline GitHub Actions avec tests automatisés
- ✅ **Audit de sécurité** - Vérification des vulnérabilités

## 🛠 Installation

### Prérequis
- Node.js 18+ ou Docker
- npm ou yarn

### Installation locale

1. **Cloner le repository**
```bash
git clone <repository-url>
cd l-atelier-test-technique
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Démarrer avec Docker (recommandé)**
```bash
npm run docker:dev
```

4. **Ou développer localement**
```bash
# Démarrer MongoDB avec Docker
npm run docker:dev

# Dans un autre terminal, démarrer l'API en mode développement
npm run dev
```

## 🐳 Configuration Docker

### Environnement de développement (recommandé)

```bash
# Démarrer l'environnement complet
npm run docker:dev

# Voir les logs en temps réel
npm run docker:dev:logs

# Arrêter l'environnement
npm run docker:dev:stop
```

**Ce que fait `npm run docker:dev` :**
- Démarre MongoDB avec initialisation automatique des données
- Construit et démarre l'API
- Configure les réseaux Docker
- Initialise 5 joueurs de tennis d'exemple
- Active les health checks

### Environnement de production

```bash
# Démarrer en production
npm run docker:prod

# Arrêter
npm run docker:prod:stop
```

### Configuration Docker Compose

#### Développement (`docker-compose.dev.yml`)
- **MongoDB** : Configuration simple, un seul nœud
- **Initialisation automatique** : Script `init-mongodb.sh` 
- **Données d'exemple** : 5 joueurs de tennis pré-configurés
- **Health checks** : Surveillance de l'état des services
- **Volumes persistants** : Conservation des données entre redémarrages

#### Production (`docker-compose.yml`)
- **MongoDB** : Configuration sécurisée avec authentification
- **Variables d'environnement** : Configuration via `.env.production`
- **Optimisations** : Build multi-stage, utilisateur non-root
- **Monitoring** : Health checks avancés

### Réinitialisation des données

```bash
# Arrêter les services
npm run docker:dev:stop

# Supprimer les volumes (efface les données)
docker volume rm l-atelier-test-technique_mongodb_data

# Redémarrer (réinitialise les données d'exemple)
npm run docker:dev
```

## 🌐 API Endpoints

### Gestion des joueurs

#### `POST /api/players`
Créer un nouveau joueur de tennis.

**Corps de la requête :**
```json
{
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
}
```

#### `GET /api/players/{id}`
Récupère les informations complètes d'un joueur par son ID.

**Exemple :** `GET /api/players/17` (Rafael Nadal)

#### `GET /api/players`
Récupère tous les joueurs triés par classement (du meilleur au moins bon).

**Paramètres de requête optionnels :**
- `page` : Numéro de page (défaut: 1)
- `limit` : Nombre d'éléments par page (défaut: 10, max: 100)
- `sex` : Filtrer par sexe (M/F)
- `country` : Filtrer par code pays (ex: ESP, USA)
- `search` : Recherche dans le nom/prénom
- `sortBy` : Champ de tri (rank, points, age, firstname, lastname)
- `sortOrder` : Ordre de tri (asc, desc)

### Statistiques spécifiques

#### `GET /api/players/stats`
Retourne les statistiques calculées :

**Réponse :**
```json
{
  "success": true,
  "data": {
    "bestWinRateCountry": {
      "country": "ESP",
      "winRate": 60.0,
      "wins": 3,
      "totalMatches": 5,
      "players": ["Rafael Nadal"]
    },
    "averageIMC": 23.45,
    "medianHeight": 185,
    "totalPlayers": 5,
    "calculatedAt": "2024-01-01T12:00:00.000Z"
  },
  "message": "Statistiques calculées avec succès"
}
```

**Calculs effectués :**

1. **Pays avec le meilleur ratio de victoires**
   - Analyse le tableau `last` de chaque joueur (5 derniers matchs)
   - 1 = victoire, 0 = défaite
   - Calcule le pourcentage de victoires par pays
   - Retourne le pays avec le meilleur ratio

2. **IMC moyen**
   - Formule : IMC = poids (kg) / (taille (m))²
   - Convertit le poids de grammes en kg
   - Convertit la taille de cm en m
   - Calcule la moyenne de tous les IMC

3. **Médiane des tailles**
   - Trie toutes les tailles par ordre croissant
   - Si nombre pair : moyenne des 2 valeurs centrales
   - Si nombre impair : valeur centrale

### Monitoring

#### `GET /health`
Contrôle de santé de l'application et de la base de données.

**Réponse :**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600,
  "memory": {
    "used": 45.2,
    "limit": 512,
    "percentage": 8.8
  },
  "database": {
    "status": "connected",
    "responseTime": 12
  }
}
```

### Documentation

#### `GET /api-docs`
Documentation Swagger interactive avec interface utilisateur.

## 🗄 Base de données

### Architecture MongoDB

Le projet utilise MongoDB avec une configuration adaptée à l'environnement :

#### Développement
- **1 nœud MongoDB** (port 27017)
- **Authentification simple** : `app_user` / `dev_password`
- **Base de données** : `latelier_dev`
- **Initialisation automatique** des données d'exemple

#### Production
- **Configuration sécurisée** avec mots de passe forts
- **Authentification obligatoire**
- **Variables d'environnement** pour les credentials

### Initialisation automatique

Le script `scripts/init-mongodb.sh` s'exécute automatiquement au premier démarrage :

1. **Attend que MongoDB soit prêt**
2. **Vérifie si la base existe** (idempotent)
3. **Crée les utilisateurs** admin et application
4. **Insère les données d'exemple** (5 joueurs)
5. **Crée les index** de performance

### Données d'exemple incluses

L'application démarre avec 5 joueurs de tennis pré-configurés :

| ID  | Nom                | Classement | Pays | Sexe | Taille | Poids | Derniers matchs |
|-----|-------------------|------------|------|------|--------|-------|-----------------|
| 17  | Rafael Nadal      | 1          | ESP  | M    | 185cm  | 85kg  | [1,0,0,0,1]     |
| 52  | Novak Djokovic    | 2          | SRB  | M    | 188cm  | 80kg  | [1,1,1,1,1]     |
| 102 | Serena Williams   | 10         | USA  | F    | 175cm  | 72kg  | [0,1,1,1,0]     |
| 65  | Stan Wawrinka     | 21         | SUI  | M    | 183cm  | 81kg  | [1,1,1,0,1]     |
| 95  | Venus Williams    | 52         | USA  | F    | 185cm  | 74kg  | [0,1,0,0,1]     |

### Accès aux services

- **API** : http://localhost:3000
- **Documentation API** : http://localhost:3000/api-docs
- **MongoDB** : localhost:27017
- **Shell MongoDB** : `docker exec -it mongodb-dev mongosh latelier_dev`

### Modèle de données

#### Schéma Joueur
```typescript
interface Player {
  id: number;                    // Identifiant unique
  firstname: string;             // Prénom (2-50 caractères)
  lastname: string;              // Nom (2-50 caractères)
  shortname: string;             // Nom court (format X.XXX)
  sex: 'M' | 'F';               // Sexe
  country: {
    picture: string;             // URL image drapeau
    code: string;                // Code pays ISO (2-3 lettres)
  };
  picture: string;               // URL photo joueur
  data: {
    rank: number;                // Classement (≥1)
    points: number;              // Points ATP/WTA (≥0)
    weight: number;              // Poids en grammes (30000-200000)
    height: number;              // Taille en cm (140-250)
    age: number;                 // Âge (16-50)
    last: number[];              // 5 derniers résultats [0,1,1,0,1]
  };
  createdAt: Date;               // Date de création
  updatedAt: Date;               // Date de modification
}
```

#### Index de performance
- `id` : Index unique
- `data.rank` : Tri par classement
- `sex` : Filtrage par sexe
- `country.code` : Filtrage par pays
- `firstname, lastname` : Recherche textuelle
- `shortname` : Index unique

### Validation des données

#### Contraintes pour la création d'un joueur
- **ID** : Unique, nombre entier positif
- **Nom court** : Format X.XXX (ex: R.FED), unique
- **Sexe** : M (Masculin) ou F (Féminin)
- **Poids** : Entre 30kg et 200kg (en grammes : 30000-200000)
- **Taille** : Entre 140cm et 250cm
- **Âge** : Entre 16 et 50 ans
- **Derniers résultats** : Exactement 5 valeurs (0=défaite, 1=victoire)
- **URLs** : Format URL valide pour les images

#### Gestion des erreurs
- **400** : Données invalides (validation échouée)
- **409** : Conflit (ID ou nom court déjà utilisé)
- **404** : Joueur non trouvé
- **500** : Erreur interne du serveur

## 🧪 Tests

### Exécution des tests

```bash
# Exécuter tous les tests
npm test

# Tests avec couverture
npm run test:coverage

# Tests en mode watch
npm run test:watch

# Tests spécifiques
npm run test:unit      # Tests unitaires uniquement
npm run test:integration # Tests d'intégration uniquement
npm run test:e2e       # Tests end-to-end uniquement
```

### Suite de tests complète (85 tests)

#### Tests unitaires (`tests/unit/`)
- **Service PlayerService** : Logique métier
- **Calculs statistiques** : IMC, médiane, ratios
- **Validation des données** : Schémas Zod
- **Gestion des erreurs** : Cas d'erreur et exceptions

#### Tests d'intégration (`tests/integration/`)
- **API endpoints** : Tous les endpoints REST
- **Base de données** : Opérations CRUD
- **Middleware** : Sécurité, CORS, rate limiting
- **Validation** : Schémas de requête/réponse

#### Tests end-to-end (`tests/e2e/`)
- **Workflow complet** : Création → Lecture → Statistiques
- **Scénarios utilisateur** : Cas d'usage réels
- **Performance** : Temps de réponse
- **Robustesse** : Gestion des cas limites

#### Tests de base (`tests/`)
- **Health check** : Monitoring de l'application
- **Configuration** : Variables d'environnement
- **Sécurité** : Headers, CORS, rate limiting

### Configuration des tests

#### Jest (`jest.config.cjs`)
```javascript
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: ['src/**/*.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html']
};
```

#### Base de données de test
- **MongoDB Memory Server** : Base en mémoire pour les tests E2E
- **Isolation** : Chaque test utilise une base propre
- **Performance** : Tests rapides sans I/O disque
- **Nettoyage automatique** : Pas de pollution entre tests

## 🔒 Sécurité

### Headers de sécurité (Helmet)
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### Rate Limiting
```typescript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par IP
  message: 'Trop de requêtes, réessayez plus tard',
  standardHeaders: true,
  legacyHeaders: false
});
```

### CORS
```typescript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Validation des entrées
- **Zod** : Validation stricte des schémas
- **Sanitisation** : Nettoyage des données d'entrée
- **Type safety** : TypeScript pour la sécurité des types
- **Validation côté serveur** : Toutes les données sont validées

### Logging sécurisé
```typescript
// Pas de logging des mots de passe ou tokens
const sanitizedBody = { ...req.body };
delete sanitizedBody.password;
delete sanitizedBody.token;
logger.info('Request processed', { sanitizedBody });
```

### Container Docker sécurisé
```dockerfile
# Utilisateur non-root
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

# Répertoire de travail sécurisé
WORKDIR /app
RUN chown nodejs:nodejs /app
```

## 🚀 Déploiement

### Prérequis production
- **Node.js 18+** ou Docker
- **MongoDB** (local ou cloud)
- **Variables d'environnement** configurées
- **Certificats SSL/TLS** pour HTTPS

### Étapes de déploiement

#### 1. Préparation
```bash
# Cloner le repository
git clone <repository-url>
cd l-atelier-test-technique

# Installer les dépendances
npm ci --only=production
```

#### 2. Configuration
```bash
# Copier et configurer les variables d'environnement
cp .env.example .env.production

# Éditer les variables pour la production
nano .env.production
```

#### 3. Build et tests
```bash
# Build de l'application
npm run build

# Exécuter les tests
npm run test:ci

# Audit de sécurité
npm audit --audit-level moderate
```

#### 4. Déploiement Docker
```bash
# Build de l'image
docker build -t latelier-api:latest .

# Démarrer en production
npm run docker:prod
```

### Plateformes de déploiement

#### AWS
```bash
# ECR + ECS
aws ecr get-login-password --region eu-west-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.eu-west-1.amazonaws.com
docker tag latelier-api:latest <account>.dkr.ecr.eu-west-1.amazonaws.com/latelier-api:latest
docker push <account>.dkr.ecr.eu-west-1.amazonaws.com/latelier-api:latest
```

#### Google Cloud Platform
```bash
# Cloud Run
gcloud builds submit --tag gcr.io/<project-id>/latelier-api
gcloud run deploy --image gcr.io/<project-id>/latelier-api --platform managed
```

#### Azure
```bash
# Container Instances
az acr build --registry <registry-name> --image latelier-api .
az container create --resource-group <rg> --name latelier-api --image <registry>.azurecr.io/latelier-api:latest
```

### Recommandations production

#### Infrastructure
- **Reverse proxy** : Nginx ou Traefik pour SSL/TLS
- **Load balancer** : Distribution de charge
- **CDN** : Cache des ressources statiques
- **Monitoring** : Prometheus + Grafana
- **Logs centralisés** : ELK Stack ou équivalent

#### Base de données
- **MongoDB Atlas** ou cluster auto-géré
- **Backup automatique** : Snapshots quotidiens
- **Réplication** : Replica set pour la haute disponibilité
- **Monitoring** : Métriques de performance

#### Sécurité
- **HTTPS obligatoire** : Certificats Let's Encrypt ou commercial
- **Firewall** : Restriction des ports et IPs
- **Secrets management** : Vault, AWS Secrets Manager, etc.
- **Audit logs** : Traçabilité des accès

#### Performance
- **Scaling horizontal** : Plusieurs instances de l'API
- **Cache Redis** : Cache des requêtes fréquentes
- **Compression** : Gzip/Brotli activé
- **Optimisation images** : WebP, lazy loading

## 📁 Structure du projet

```
l-atelier-test-technique/
├── src/                          # Code source TypeScript
│   ├── config/                   # Configuration de l'application
│   │   ├── database.ts           # Configuration MongoDB/Mongoose
│   │   ├── logger.ts             # Configuration Winston (logs)
│   │   └── openapi.ts            # Configuration Swagger/OpenAPI
│   ├── models/                   # Modèles de données Mongoose
│   │   └── Player.ts             # Modèle joueur avec validation
│   ├── routes/                   # Routes Express de l'API
│   │   ├── index.ts              # Routes principales et health check
│   │   └── players.ts            # Routes CRUD joueurs de tennis
│   ├── schemas/                  # Schémas Zod pour validation
│   │   └── playerSchemas.ts      # Schémas et types joueur
│   ├── services/                 # Services métier (logique business)
│   │   └── playerService.ts      # Service de gestion des joueurs
│   ├── app.ts                    # Configuration Express (middleware, routes)
│   └── server.ts                 # Point d'entrée du serveur HTTP
├── scripts/                      # Scripts utilitaires
│   └── init-mongodb.sh           # Script d'initialisation MongoDB
├── tests/                        # Tests automatisés (85 tests)
│   ├── setup.js                  # Configuration globale des tests
│   ├── basic.test.js             # Tests de base (health check)
│   ├── simple.test.ts            # Tests simples (configuration)
│   ├── app.test.ts               # Tests de l'application Express
│   ├── unit/                     # Tests unitaires
│   │   └── playerService.test.ts # Tests du service joueur
│   ├── integration/              # Tests d'intégration
│   │   └── api.integration.test.ts # Tests des endpoints API
│   └── e2e/                      # Tests end-to-end
│       └── players.e2e.test.ts   # Tests de workflow complet
├── logs/                         # Fichiers de logs (générés)
│   ├── combined.log              # Tous les logs
│   └── error.log                 # Logs d'erreur uniquement
├── dist/                         # Code JavaScript compilé (généré)
├── coverage/                     # Rapports de couverture de tests (généré)
├── node_modules/                 # Dépendances npm (généré)
├── .env                          # Variables d'environnement (développement)
├── .env.example                  # Exemple de configuration
├── .env.production               # Variables d'environnement (production)
├── .env.test                     # Variables d'environnement (tests)
├── .dockerignore                 # Fichiers ignorés par Docker
├── .gitignore                    # Fichiers ignorés par Git
├── .prettierrc                   # Configuration Prettier
├── docker-compose.yml            # Configuration Docker (production)
├── docker-compose.dev.yml        # Configuration Docker (développement)
├── Dockerfile                    # Instructions de build Docker
├── eslint.config.js              # Configuration ESLint
├── jest.config.cjs               # Configuration Jest (tests)
├── package.json                  # Dépendances et scripts npm
├── package-lock.json             # Versions exactes des dépendances
├── tsconfig.json                 # Configuration TypeScript
├── tsconfig.test.json            # Configuration TypeScript (tests)
└── README.md                     # Documentation complète (ce fichier)
```

### Description des répertoires

#### `src/` - Code source
- **`config/`** : Configuration centralisée (DB, logs, API docs)
- **`models/`** : Modèles Mongoose avec validation et hooks
- **`routes/`** : Définition des endpoints REST avec middleware
- **`schemas/`** : Schémas Zod pour validation et génération de types
- **`services/`** : Logique métier découplée des routes

#### `tests/` - Tests automatisés
- **`unit/`** : Tests isolés des fonctions et classes
- **`integration/`** : Tests des interactions entre composants
- **`e2e/`** : Tests de scénarios utilisateur complets

#### `scripts/` - Utilitaires
- **`init-mongodb.sh`** : Initialisation automatique de la base de données

#### Configuration
- **Docker** : Multi-environnement (dev/prod)
- **TypeScript** : Configuration stricte avec types
- **Tests** : Jest avec couverture de code
- **Linting** : ESLint + Prettier pour la qualité

## 📜 Scripts disponibles

### Développement
```bash
npm run dev              # Démarrer en mode développement (nodemon)
npm run build            # Compiler TypeScript vers JavaScript
npm run start            # Démarrer l'application compilée
npm run clean            # Nettoyer le répertoire dist/
```

### Tests
```bash
npm test                 # Exécuter tous les tests
npm run test:watch       # Tests en mode watch (redémarrage auto)
npm run test:coverage    # Tests avec rapport de couverture
npm run test:ci          # Tests pour CI/CD (sans watch)
npm run test:unit        # Tests unitaires uniquement
npm run test:integration # Tests d'intégration uniquement
npm run test:e2e         # Tests end-to-end uniquement
```

### Qualité de code
```bash
npm run lint             # Vérifier le code avec ESLint
npm run lint:fix         # Corriger automatiquement les erreurs ESLint
npm run format           # Formater le code avec Prettier
npm run type-check       # Vérifier les types TypeScript
```

### Docker
```bash
npm run docker:dev       # Démarrer l'environnement de développement
npm run docker:dev:logs  # Voir les logs en temps réel
npm run docker:dev:stop  # Arrêter l'environnement de développement
npm run docker:prod      # Démarrer l'environnement de production
npm run docker:prod:stop # Arrêter l'environnement de production
```

### Utilitaires
```bash
npm run audit            # Audit de sécurité des dépendances
npm run outdated         # Vérifier les dépendances obsolètes
npm run clean:all        # Nettoyer tous les fichiers générés
```

## 🔧 Variables d'environnement

### Configuration serveur
| Variable | Description | Défaut | Exemple |
|----------|-------------|---------|---------|
| `NODE_ENV` | Environnement d'exécution | `development` | `production` |
| `PORT` | Port du serveur HTTP | `3000` | `8080` |
| `HOST` | Adresse d'écoute | `localhost` | `0.0.0.0` |
| `SERVER_URL` | URL complète du serveur | `http://localhost:3000` | `https://api.example.com` |

### Sécurité et performance
| Variable | Description | Défaut | Exemple |
|----------|-------------|---------|---------|
| `ALLOWED_ORIGINS` | Origines CORS autorisées | `http://localhost:3000` | `https://app.com,https://admin.com` |
| `RATE_LIMIT_MAX` | Limite de requêtes par IP (15min) | `100` | `1000` |
| `REQUEST_SIZE_LIMIT` | Taille max des requêtes | `10mb` | `50mb` |
| `UPLOAD_SIZE_LIMIT` | Taille max des uploads | `5mb` | `100mb` |
| `JWT_SECRET` | Clé secrète JWT | `dev-jwt-secret` | `super-secret-key-256-bits` |
| `API_KEY` | Clé API pour authentification | `dev-api-key` | `api-key-production` |

### Logging et monitoring
| Variable | Description | Défaut | Exemple |
|----------|-------------|---------|---------|
| `LOG_LEVEL` | Niveau de logging | `info` | `debug`, `warn`, `error` |
| `MEMORY_LIMIT_MB` | Limite mémoire pour health check | `512` | `1024` |
| `DEBUG_MODE` | Mode debug activé | `true` | `false` |
| `ENABLE_API_DOCS` | Documentation API activée | `true` | `false` |
| `ENABLE_REQUEST_LOGGING` | Logging des requêtes HTTP | `true` | `false` |

### Base de données MongoDB
| Variable | Description | Défaut | Exemple |
|----------|-------------|---------|---------|
| `MONGODB_URI` | URI de connexion complète | `mongodb://app_user:dev_password@mongodb:27017/latelier_dev?authSource=latelier_dev` | `mongodb+srv://user:pass@cluster.mongodb.net/prod` |
| `MONGO_INITDB_DATABASE` | Nom de la base de données | `latelier_dev` | `latelier_prod` |
| `MONGO_INITDB_ROOT_USERNAME` | Utilisateur admin MongoDB | `admin` | `root_user` |
| `MONGO_INITDB_ROOT_PASSWORD` | Mot de passe admin | `dev_password` | `strong-password-123` |
| `MONGO_APP_USERNAME` | Utilisateur application | `app_user` | `api_user` |
| `MONGO_APP_PASSWORD` | Mot de passe application | `dev_password` | `app-password-456` |

### Configuration MongoDB avancée
| Variable | Description | Défaut | Exemple |
|----------|-------------|---------|---------|
| `MONGODB_MAX_POOL_SIZE` | Taille max du pool de connexions | `10` | `50` |
| `MONGODB_SERVER_SELECTION_TIMEOUT` | Timeout sélection serveur (ms) | `5000` | `30000` |
| `MONGODB_SOCKET_TIMEOUT` | Timeout socket (ms) | `45000` | `60000` |
| `MONGODB_HEARTBEAT_FREQUENCY` | Fréquence heartbeat (ms) | `10000` | `30000` |
| `MONGODB_CONNECT_TIMEOUT` | Timeout connexion (ms) | `10000` | `20000` |

### Fichiers de configuration

#### `.env` (développement)
```bash
NODE_ENV=development
PORT=3000
HOST=localhost
LOG_LEVEL=debug
MONGODB_URI=mongodb://app_user:dev_password@localhost:27017/latelier_dev?authSource=latelier_dev
```

#### `.env.production` (production)
```bash
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info
ALLOWED_ORIGINS=https://myapp.com,https://admin.myapp.com
RATE_LIMIT_MAX=1000
MONGODB_URI=mongodb+srv://prod_user:strong_password@cluster.mongodb.net/latelier_prod
```

#### `.env.test` (tests)
```bash
NODE_ENV=test
PORT=3001
LOG_LEVEL=error
MONGODB_URI=mongodb://localhost:27017/latelier_test
```

## 🤝 Contribution

### Processus de contribution

1. **Fork** le projet sur GitHub
2. **Créer une branche** feature (`git checkout -b feature/amazing-feature`)
3. **Développer** la fonctionnalité avec tests
4. **Commit** les changements (`git commit -m 'Add amazing feature'`)
5. **Push** vers la branche (`git push origin feature/amazing-feature`)
6. **Ouvrir une Pull Request** avec description détaillée

### Standards de code

#### TypeScript
- Utiliser les **types stricts** (pas de `any`)
- **Interfaces** pour les objets complexes
- **Enums** pour les constantes
- **Génériques** quand approprié
- **JSDoc** pour la documentation

#### Tests
- **Couverture minimale** : 80%
- **Tests unitaires** pour la logique métier
- **Tests d'intégration** pour les APIs
- **Tests E2E** pour les workflows
- **Mocks** appropriés pour les dépendances externes

#### Commits
```bash
# Format des messages de commit
type(scope): description

# Types autorisés
feat:     # Nouvelle fonctionnalité
fix:      # Correction de bug
docs:     # Documentation
style:    # Formatage (pas de changement de code)
refactor: # Refactoring
test:     # Ajout/modification de tests
chore:    # Maintenance

# Exemples
feat(api): add player creation endpoint
fix(db): resolve connection timeout issue
docs(readme): update installation instructions
```

#### Code Review
- **Lisibilité** : Code auto-documenté
- **Performance** : Pas de régression
- **Sécurité** : Validation des entrées
- **Tests** : Couverture des nouveaux cas
- **Documentation** : Mise à jour si nécessaire

### Environnement de développement

#### Prérequis
```bash
# Node.js et npm
node --version  # >= 18.0.0
npm --version   # >= 8.0.0

# Docker (optionnel mais recommandé)
docker --version
docker compose version
```

#### Configuration IDE

##### VS Code (recommandé)
```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/coverage": true
  }
}
```

##### Extensions recommandées
- **TypeScript** : Support TypeScript
- **ESLint** : Linting en temps réel
- **Prettier** : Formatage automatique
- **Jest** : Support des tests
- **Docker** : Support Docker
- **Thunder Client** : Tests API

#### Workflow de développement

1. **Setup initial**
```bash
git clone <repository-url>
cd l-atelier-test-technique
npm install
npm run docker:dev
```

2. **Développement**
```bash
# Terminal 1 : API en mode watch
npm run dev

# Terminal 2 : Tests en mode watch
npm run test:watch

# Terminal 3 : Linting automatique
npm run lint:watch
```

3. **Avant commit**
```bash
npm run lint          # Vérifier le code
npm run test          # Exécuter tous les tests
npm run build         # Vérifier la compilation
```

### Signalement de bugs

#### Template d'issue
```markdown
## Description
Description claire et concise du bug.

## Reproduction
Étapes pour reproduire le comportement :
1. Aller à '...'
2. Cliquer sur '....'
3. Faire défiler jusqu'à '....'
4. Voir l'erreur

## Comportement attendu
Description de ce qui devrait se passer.

## Captures d'écran
Si applicable, ajouter des captures d'écran.

## Environnement
- OS: [ex: Ubuntu 20.04]
- Node.js: [ex: 18.17.0]
- Version: [ex: 1.0.0]

## Contexte additionnel
Tout autre contexte utile pour le problème.
```

### Demandes de fonctionnalités

#### Template de feature request
```markdown
## Problème résolu
Description claire du problème que cette fonctionnalité résoudrait.

## Solution proposée
Description claire de ce que vous voulez qu'il se passe.

## Alternatives considérées
Description des solutions alternatives que vous avez considérées.

## Contexte additionnel
Tout autre contexte ou captures d'écran utiles.
```

## 📄 Licence

**ISC License**

Copyright (c) 2024 L'Atelier

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

---

## 📞 Contact

- **Email** : sohaib.manah.contact@gmail.com
- **Projet** : L'Atelier Tennis API
- **Documentation** : http://localhost:3000/api-docs (quand l'application est démarrée)

---

*Développé avec ❤️ par L'Atelier*