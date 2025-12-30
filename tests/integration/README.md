# Tests d'Intégration PlayerService

Ce dossier contient les tests d'intégration pour le service `PlayerService` avec une vraie base de données MongoDB en mémoire.

## Objectif

Contrairement aux tests unitaires qui utilisent des mocks, ces tests d'intégration :
- Utilisent une vraie base de données MongoDB (en mémoire)
- Testent les calculs réels avec des données persistées
- Vérifient l'intégrité des opérations CRUD
- Valident les contraintes de base de données

## Tests Implémentés

### 1. Calculs Statistiques Réels

#### Ratio de Victoires par Pays
- **Test** : `should calculate correct win rate by country with real data`
- **Données** : 5 joueurs de tennis réels (Nadal, Federer, Serena, Djokovic, Alcaraz)
- **Calcul** : Pourcentage de victoires par pays basé sur les 5 derniers matchs
- **Vérification** : USA (Serena) = 100%, SUI (Federer) = 80%, ESP = 70%

#### IMC Moyen des Joueurs
- **Test** : `should calculate correct average IMC with real data`
- **Formule** : `poids(kg) / (taille(m))²`
- **Conversion** : grammes → kg, cm → m
- **Précision** : 2 décimales
- **Résultat attendu** : ~23.58 pour le jeu de données test

#### Médiane des Tailles
- **Test** : `should calculate correct median height with real data`
- **Données** : Tailles triées [175, 183, 185, 185, 188]
- **Résultat** : 185cm (élément du milieu)
- **Test supplémentaire** : Nombre pair d'éléments (moyenne des 2 du milieu)

### 2. Tests de Cohérence

#### Intégrité des Calculs
- **Test** : `should maintain data integrity across multiple calculations`
- **Vérification** : Calculs multiples donnent des résultats identiques
- **Objectif** : S'assurer de la reproductibilité

#### Gestion des Cas Limites
- **Joueur unique** : Test avec un seul joueur dans la base
- **Égalités** : Pays avec même ratio de victoires
- **Nombre pair** : Calcul de médiane avec nombre pair d'éléments

### 3. Tests de Base de Données

#### Opérations CRUD
- **Création** : Insertion de joueurs avec validation
- **Lecture** : Récupération par ID et liste triée
- **Contraintes** : Unicité des ID et shortnames

#### Validation des Données
- **Format shortname** : Pattern `X.XXX` (ex: R.NAD)
- **Code pays** : 2-3 caractères maximum
- **Longueur noms** : Minimum 2 caractères

## Structure des Tests

```typescript
describe("PlayerService Integration Tests - Real Database Calculations", () => {
  // Setup MongoDB en mémoire
  beforeAll(async () => {
    // Connexion à MongoDB Memory Server
  });

  // Nettoyage après tests
  afterAll(async () => {
    // Fermeture connexions et serveur
  });

  // Nettoyage entre tests
  beforeEach(async () => {
    await Player.deleteMany({});
  });

  describe("Real Statistics Calculations", () => {
    // Tests avec données réelles
  });

  describe("Real Database Operations", () => {
    // Tests CRUD et contraintes
  });
});
```

## Données de Test

### Joueurs de Tennis Réels
```javascript
const testPlayers = [
  {
    id: 1, firstname: "Rafael", lastname: "Nadal",
    country: { code: "ESP" },
    data: { weight: 85000, height: 185, last: [1,1,1,0,0] } // 60%
  },
  {
    id: 2, firstname: "Roger", lastname: "Federer", 
    country: { code: "SUI" },
    data: { weight: 85000, height: 185, last: [1,1,0,1,1] } // 80%
  },
  {
    id: 3, firstname: "Serena", lastname: "Williams",
    country: { code: "USA" },
    data: { weight: 72000, height: 175, last: [1,1,1,1,1] } // 100%
  }
  // ... autres joueurs
];
```

## Exécution des Tests

### Commandes Disponibles

```bash
# Tous les tests d'intégration
npm run test:integration

# Seulement les tests de calculs avec DB réelle
npm run test:integration -- --testNamePattern="Real Database Calculations"

# Script avec résumé détaillé
npm run test:integration:db
```

### Configuration Jest

Les tests utilisent une configuration Jest spécifique :
- **Timeout** : 30 secondes pour les opérations DB
- **Setup** : `setup-integration.js` pour la gestion des connexions
- **Environment** : Node.js avec support ESM

## Avantages des Tests d'Intégration

1. **Validation Réelle** : Calculs avec vraies données persistées
2. **Détection d'Erreurs** : Problèmes de conversion, arrondi, tri
3. **Contraintes DB** : Validation des règles métier au niveau base
4. **Performance** : Mesure des temps de réponse réels
5. **Régression** : Protection contre les changements cassants

## Maintenance

### Ajout de Nouveaux Tests
1. Créer les données de test respectant les contraintes
2. Utiliser `beforeEach` pour nettoyer la DB
3. Vérifier les calculs avec des valeurs attendues précises
4. Tester les cas limites et erreurs

### Mise à Jour des Données
- Respecter les formats de validation (shortname, pays)
- Maintenir la cohérence des calculs attendus
- Documenter les changements de logique métier