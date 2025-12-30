#!/usr/bin/env node

// Script to populate database via ECS task
// Creates a temporary ECS task to test connection and populate the database

import { execSync } from 'child_process';

const CLUSTER_NAME = 'latelier-tennis-api-LatelierClusterB0DA47C1-6s8BPxj0jWxc';
const TASK_DEFINITION = 'lateliertennisapiLatelierApiServiceTaskDef08EA98F0';
const SUBNET_ID = 'subnet-03b4bc9397d6f91cf'; // Private subnet
const SECURITY_GROUP = 'sg-049aa839f2c9ad6a7'; // ECS security group

console.log('Création d\'une tâche ECS pour tester la connexion DocumentDB...');

// Créer une tâche ECS temporaire avec une commande de test
const taskCommand = [
  'node', '-e', `
    const mongoose = require('mongoose');
    
    console.log('=== Test de connexion DocumentDB depuis ECS ===');
    console.log('Environment variables:');
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/\\/\\/.*@/, '//***:***@') : 'Non défini');
    console.log('DOCDB_ENDPOINT:', process.env.DOCDB_ENDPOINT);
    console.log('DOCDB_PORT:', process.env.DOCDB_PORT);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('');
    
    async function testConnection() {
      try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
          throw new Error('MONGODB_URI non défini');
        }
        
        console.log('Tentative de connexion...');
        await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 15000,
          connectTimeoutMS: 15000,
          socketTimeoutMS: 15000,
          directConnection: true,
          retryWrites: false
        });
        
        console.log('Connexion réussie!');
        console.log('ReadyState:', mongoose.connection.readyState);
        console.log('Host:', mongoose.connection.host);
        console.log('Port:', mongoose.connection.port);
        console.log('Name:', mongoose.connection.name);
        
        // Test d'une opération simple
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name).join(', ') || 'Aucune');
        
        // Créer une collection de test
        const testCollection = mongoose.connection.db.collection('test');
        await testCollection.insertOne({ test: true, timestamp: new Date() });
        console.log('Test d\\'écriture réussi');
        
        const count = await testCollection.countDocuments();
        console.log('Documents dans test:', count);
        
        await mongoose.disconnect();
        console.log('Déconnexion réussie');
        
      } catch (error) {
        console.error('Erreur de connexion:');
        console.error('Type:', error.constructor.name);
        console.error('Message:', error.message);
        console.error('Code:', error.code);
        console.error('Stack:', error.stack);
        process.exit(1);
      }
    }
    
    testConnection();
  `
];

try {
  // Lancer la tâche ECS
  const runTaskCommand = `
    aws ecs run-task \\
      --region eu-west-3 \\
      --cluster ${CLUSTER_NAME} \\
      --task-definition ${TASK_DEFINITION} \\
      --launch-type FARGATE \\
      --network-configuration "awsvpcConfiguration={subnets=[${SUBNET_ID}],securityGroups=[${SECURITY_GROUP}],assignPublicIp=DISABLED}" \\
      --overrides '{"containerOverrides":[{"name":"web","command":${JSON.stringify(taskCommand)}}]}' \\
      --query 'tasks[0].taskArn' \\
      --output text
  `;

  console.log('Lancement de la tâche ECS...');
  const taskArn = execSync(runTaskCommand, { encoding: 'utf8' }).trim();
  console.log('Tâche créée:', taskArn);

  // Attendre que la tâche démarre
  console.log('Attente du démarrage de la tâche...');
  await new Promise(resolve => setTimeout(resolve, 30000));

  // Récupérer les logs
  const taskId = taskArn.split('/').pop();
  const logStreamName = `latelier-api/web/${taskId}`;
  
  console.log('Récupération des logs...');
  
  // Attendre un peu plus pour que les logs soient disponibles
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  try {
    const logsCommand = `
      aws logs get-log-events \\
        --region eu-west-3 \\
        --log-group-name "latelier-tennis-api-LatelierApiServiceTaskDefwebLogGroup27AFA74C-z8VJGU09LEEH" \\
        --log-stream-name "${logStreamName}" \\
        --query 'events[].message' \\
        --output text
    `;
    
    const logs = execSync(logsCommand, { encoding: 'utf8' });
    console.log('=== LOGS DE LA TÂCHE ===');
    console.log(logs);
    
  } catch (logError) {
    console.log('Impossible de récupérer les logs automatiquement');
    console.log('Vérifiez manuellement avec:');
    console.log(`aws logs get-log-events --region eu-west-3 --log-group-name "latelier-tennis-api-LatelierApiServiceTaskDefwebLogGroup27AFA74C-z8VJGU09LEEH" --log-stream-name "${logStreamName}"`);
  }

  // Arrêter la tâche
  console.log('Arrêt de la tâche...');
  execSync(`aws ecs stop-task --region eu-west-3 --cluster ${CLUSTER_NAME} --task ${taskArn}`, { stdio: 'inherit' });

} catch (error) {
  console.error('Erreur lors de l\'exécution de la tâche ECS:', error.message);
  process.exit(1);
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}