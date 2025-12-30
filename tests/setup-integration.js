// Setup spécifique pour les tests d'intégration
import mongoose from 'mongoose';

// Augmenter le timeout pour les tests d'intégration
jest.setTimeout(30000);

// Nettoyer les connexions avant chaque suite de tests
beforeAll(async () => {
  // Fermer toute connexion existante
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});

// Nettoyer après tous les tests
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});