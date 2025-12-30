#!/usr/bin/env node

/**
 * AWS CDK Destroy Script for L'Atelier Tennis API
 * 
 * This script destroys the AWS infrastructure created by the deployment script
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration interface
interface DestroyConfig {
  stackName: string;
  region: string;
}

interface DeploymentInfo {
  timestamp: string;
  stackName: string;
  region: string;
  outputs: Record<string, any>;
  endpoints: {
    api: string;
    docs: string;
    health: string;
  };
}

// Configuration
const CONFIG: DestroyConfig = {
  stackName: 'latelier-tennis-api',
  region: 'eu-west-3'
};

console.log('Suppression de l\'infrastructure AWS...\n');

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Check if deployment exists
function checkDeploymentExists(): DeploymentInfo | null {
  const deploymentInfoPath = path.join(__dirname, '..', 'deployment-info.json');
  
  if (!fs.existsSync(deploymentInfoPath)) {
    console.log('Aucune information de déploiement trouvée.');
    return null;
  }
  
  try {
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentInfoPath, 'utf8'));
    return deploymentInfo as DeploymentInfo;
  } catch (error) {
    console.log('Impossible de lire les informations de déploiement.');
    return null;
  }
}

// Destroy AWS infrastructure
async function destroyInfrastructure(): Promise<void> {
  const cdkDir = path.join(__dirname, '..', 'cdk');
  
  if (!fs.existsSync(cdkDir)) {
    console.log('Répertoire CDK non trouvé. Aucune infrastructure à supprimer.');
    return;
  }
  
  try {
    console.log('Vérification de la stack AWS...');
    
    // Check if stack exists
    try {
      execSync(`aws cloudformation describe-stacks --stack-name ${CONFIG.stackName} --region ${CONFIG.region}`, { 
        stdio: 'pipe' 
      });
      console.log('Stack trouvée sur AWS');
    } catch (error) {
      console.log('Aucune stack trouvée sur AWS. Rien à supprimer.');
      return;
    }
    
    // Install CDK dependencies if needed
    console.log('Vérification des dépendances CDK...');
    if (!fs.existsSync(path.join(cdkDir, 'node_modules'))) {
      execSync('npm install', { cwd: cdkDir, stdio: 'inherit' });
    }
    
    // Build TypeScript if needed
    if (fs.existsSync(path.join(cdkDir, 'tsconfig.json'))) {
      console.log('Compilation TypeScript...');
      execSync('npm run build', { cwd: cdkDir, stdio: 'inherit' });
    }
    
    // Destroy the stack
    console.log('Suppression de la stack AWS...');
    execSync(`cdk destroy --force`, { 
      cwd: cdkDir, 
      encoding: 'utf8',
      stdio: 'inherit'
    });
    
    console.log('\nAWS infrastructure successfully destroyed!');
    
    // Clean up local files
    console.log('Nettoyage des fichiers locaux...');
    
    // Remove deployment info
    const deploymentInfoPath = path.join(__dirname, '..', 'deployment-info.json');
    if (fs.existsSync(deploymentInfoPath)) {
      fs.unlinkSync(deploymentInfoPath);
      console.log('Informations de déploiement supprimées');
    }
    
    // Optionally remove CDK build artifacts
    const cdkOutPath = path.join(cdkDir, 'cdk.out');
    if (fs.existsSync(cdkOutPath)) {
      fs.rmSync(cdkOutPath, { recursive: true, force: true });
      console.log('Artefacts CDK supprimés');
    }
    
    // Optionally remove CDK directory
    const removeCdk = await askQuestion('Supprimer le répertoire CDK complet? (y/N): ');
    if (removeCdk.toLowerCase() === 'y' || removeCdk.toLowerCase() === 'yes') {
      fs.rmSync(cdkDir, { recursive: true, force: true });
      console.log('Répertoire CDK supprimé');
    }
    
    console.log('\nSuppression terminée!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('RÉSUMÉ:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Stack CloudFormation supprimée');
    console.log('Ressources AWS libérées');
    console.log('Coûts AWS arrêtés');
    console.log('Load Balancer supprimé');
    console.log('ECS Service supprimé');
    console.log('DocumentDB supprimé');
    console.log('VPC et sous-réseaux supprimés');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
  } catch (error: any) {
    console.error('Erreur lors de la suppression:', error.message);
    console.log('\nActions manuelles possibles:');
    console.log('1. Vérifier la console AWS CloudFormation');
    console.log('2. Supprimer manuellement la stack si nécessaire');
    console.log(`3. aws cloudformation delete-stack --stack-name ${CONFIG.stackName} --region ${CONFIG.region}`);
    console.log('4. Vérifier les ressources orphelines dans la console AWS');
    process.exit(1);
  }
}

// Main execution
async function main(): Promise<void> {
  try {
    // Check deployment info
    const deploymentInfo = checkDeploymentExists();
    
    if (deploymentInfo) {
      console.log('Déploiement trouvé:');
      console.log(`   Stack: ${deploymentInfo.stackName}`);
      console.log(`   Région: ${deploymentInfo.region}`);
      console.log(`   Déployé le: ${new Date(deploymentInfo.timestamp).toLocaleString('fr-FR')}`);
      if (deploymentInfo.endpoints) {
        console.log(`   API: ${deploymentInfo.endpoints.api}`);
        console.log(`   Docs: ${deploymentInfo.endpoints.docs}`);
        console.log(`   Health: ${deploymentInfo.endpoints.health}`);
      }
      console.log('');
    }
    
    // Confirmation
    const confirm = await askQuestion('Êtes-vous sûr de vouloir supprimer l\'infrastructure AWS? (y/N): ');
    
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log('Suppression annulée.');
      rl.close();
      return;
    }
    
    const doubleConfirm = await askQuestion('ATTENTION: Cette action est irréversible! Tapez "SUPPRIMER" pour confirmer: ');
    
    if (doubleConfirm !== 'SUPPRIMER') {
      console.log('Suppression annulée.');
      rl.close();
      return;
    }
    
    rl.close();
    
    await destroyInfrastructure();
    
  } catch (error: any) {
    console.error('Erreur:', error.message);
    rl.close();
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main, CONFIG };