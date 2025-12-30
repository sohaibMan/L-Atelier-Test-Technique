#!/usr/bin/env node

// DocumentDB connection test script
// Tests connection to DocumentDB with different configurations

import mongoose from 'mongoose';

// Configuration de test
const DOCDB_ENDPOINT = process.env.DOCDB_ENDPOINT || 'latelierdocdbf4cb1911-cyvztsqeub4h.cluster-c7w0mwkkird1.eu-west-3.docdb.amazonaws.com';
const DOCDB_PORT = process.env.DOCDB_PORT || '27017';
const DOCDB_USERNAME = process.env.DOCDB_USERNAME || 'dbadmin';
const DOCDB_PASSWORD = process.env.DOCDB_PASSWORD || 'TennisAPI2024!';
const DOCDB_DATABASE = process.env.DOCDB_DATABASE || 'latelier_prod';

console.log('=== Test de connexion DocumentDB ===');
console.log('Configuration:');
console.log(`- Endpoint: ${DOCDB_ENDPOINT}`);
console.log(`- Port: ${DOCDB_PORT}`);
console.log(`- Username: ${DOCDB_USERNAME}`);
console.log(`- Database: ${DOCDB_DATABASE}`);
console.log('');

async function testConnection() {
  // Test 1: Connexion sans SSL
  console.log('Test 1: Connexion sans SSL...');
  const uriNoSSL = `mongodb://${DOCDB_USERNAME}:${DOCDB_PASSWORD}@${DOCDB_ENDPOINT}:${DOCDB_PORT}/${DOCDB_DATABASE}?retryWrites=false`;
  
  try {
    console.log(`URI: ${uriNoSSL.replace(/\/\/.*@/, "//***:***@")}`);
    
    await mongoose.connect(uriNoSSL, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 10000,
    });
    
    console.log('Connexion sans SSL réussie!');
    console.log(`ReadyState: ${mongoose.connection.readyState}`);
    console.log(`Host: ${mongoose.connection.host}`);
    console.log(`Port: ${mongoose.connection.port}`);
    console.log(`Name: ${mongoose.connection.name}`);
    
    // Test d'une opération simple
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`Collections: ${collections.map(c => c.name).join(', ') || 'Aucune'}`);
    
    await mongoose.disconnect();
    console.log('Déconnexion réussie');
    
  } catch (error) {
    console.error('Erreur de connexion sans SSL:');
    console.error(`Type: ${error.constructor.name}`);
    console.error(`Message: ${error.message}`);
    console.error(`Code: ${(error as any).code}`);
    console.error(`CodeName: ${(error as any).codeName}`);
    if (error.stack) {
      console.error(`Stack: ${error.stack}`);
    }
  }
  
  console.log('');
  
  // Test 2: Connexion avec SSL
  console.log('Test 2: Connexion avec SSL...');
  const uriSSL = `mongodb://${DOCDB_USERNAME}:${DOCDB_PASSWORD}@${DOCDB_ENDPOINT}:${DOCDB_PORT}/${DOCDB_DATABASE}?ssl=true&sslValidate=false&retryWrites=false`;
  
  try {
    console.log(`URI: ${uriSSL.replace(/\/\/.*@/, "//***:***@")}`);
    
    await mongoose.connect(uriSSL, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 10000,
    });
    
    console.log('Connexion avec SSL réussie!');
    console.log(`ReadyState: ${mongoose.connection.readyState}`);
    console.log(`Host: ${mongoose.connection.host}`);
    console.log(`Port: ${mongoose.connection.port}`);
    console.log(`Name: ${mongoose.connection.name}`);
    
    // Test d'une opération simple
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`Collections: ${collections.map(c => c.name).join(', ') || 'Aucune'}`);
    
    await mongoose.disconnect();
    console.log('Déconnexion réussie');
    
  } catch (error) {
    console.error('Erreur de connexion avec SSL:');
    console.error(`Type: ${error.constructor.name}`);
    console.error(`Message: ${error.message}`);
    console.error(`Code: ${(error as any).code}`);
    console.error(`CodeName: ${(error as any).codeName}`);
    if (error.stack) {
      console.error(`Stack: ${error.stack}`);
    }
  }
  
  console.log('');
  console.log('=== Fin des tests ===');
}

// Exécuter les tests
testConnection().catch(error => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});