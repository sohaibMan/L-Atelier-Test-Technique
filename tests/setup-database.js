// Configuration de base de données pour les tests d'intégration et E2E
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

let mongoServer;

// Setup pour les tests nécessitant une base de données
beforeAll(async () => {
  // Créer une instance MongoDB en mémoire
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Configurer l'URI de la base de données de test
  process.env.MONGODB_URI = mongoUri;
  process.env.MONGODB_TEST_URI = mongoUri;
  
  // Connecter Mongoose à la base de données de test
  await mongoose.connect(mongoUri);
});

// Nettoyage après chaque test
afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
});

// Nettoyage global après tous les tests
afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});