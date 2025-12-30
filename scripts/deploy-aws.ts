#!/usr/bin/env node

// Deployment script for L'Atelier Tennis API
// Handles AWS infrastructure setup using CDK

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.production
config({ path: path.join(__dirname, '..', '.env.production') });

// Configuration interface
interface DeploymentConfig {
  stackName: string;
  region: string;
  domainName: string;
  certificateArn: string;
  hostedZoneId: string;
  environment: string;
  accountId?: string;
}

// Configuration
const CONFIG: DeploymentConfig = {
  stackName: 'latelier-tennis-api',
  region: process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION || 'eu-central-1',
  domainName: '', // Leave empty if you don't have a domain - will use Load Balancer DNS
  certificateArn: '', // Optional - only needed if you have a domain
  hostedZoneId: '', // Optional - only needed if you have a domain
  environment: 'production'
};

interface DeploymentOutputs {
  ApiUrl?: string;
  ApiDocsUrl?: string;
  HealthCheckUrl?: string;
  LoadBalancerDNS?: string;
  HttpsEnabled?: string;
  CertificateArn?: string;
  DomainName?: string;
}

interface DeploymentInfo {
  timestamp: string;
  stackName: string;
  region: string;
  outputs: DeploymentOutputs;
  endpoints: {
    api: string;
    docs: string;
    health: string;
  };
}

console.log('Déploiement de l\'API Tennis L\'Atelier sur AWS...\n');

// Check prerequisites
function checkPrerequisites(): string {
  console.log('Vérification des prérequis...');
  
  try {
    // Check AWS CLI
    execSync('aws --version', { stdio: 'pipe' });
    console.log('AWS CLI installé');
    
    // Check CDK
    execSync('cdk --version', { stdio: 'pipe' });
    console.log('AWS CDK installé');
    
    // Check Docker
    execSync('docker --version', { stdio: 'pipe' });
    console.log('Docker installé');
    
    // Check AWS credentials
    const identity = execSync('aws sts get-caller-identity', { encoding: 'utf8' });
    const account = JSON.parse(identity);
    console.log(`AWS configuré (Account: ${account.Account})`);
    
    return account.Account;
  } catch (error: any) {
    console.error('Prérequis manquants:', error.message);
    console.log('\nInstallation requise:');
    console.log('1. AWS CLI: https://aws.amazon.com/cli/');
    console.log('2. AWS CDK: npm install -g aws-cdk');
    console.log('3. Docker: https://docker.com/');
    console.log('4. Configurer AWS: aws configure');
    process.exit(1);
  }
}

// Create CDK app structure
function createCdkApp(accountId: string): void {
  console.log('\nCréation de l\'infrastructure CDK...');
  
  const cdkDir = path.join(__dirname, '..', 'cdk');
  
  // Create CDK directory structure
  if (!fs.existsSync(cdkDir)) {
    fs.mkdirSync(cdkDir, { recursive: true });
  }
  
  const libDir = path.join(cdkDir, 'lib');
  if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir, { recursive: true });
  }
  
  console.log('Structure CDK TypeScript déjà créée');
}

// Deploy to AWS
function deployToAws(): void {
  console.log('\nDéploiement sur AWS...');
  
  const cdkDir = path.join(__dirname, '..', 'cdk');
  
  try {
    // Install CDK dependencies
    console.log('Installation des dépendances CDK...');
    execSync('npm install', { cwd: cdkDir, stdio: 'inherit' });
    
    // Build TypeScript
    console.log('Compilation TypeScript...');
    execSync('npm run build', { cwd: cdkDir, stdio: 'inherit' });
    
    // Bootstrap CDK (if needed)
    console.log('Bootstrap CDK...');
    try {
      execSync(`cdk bootstrap aws://${CONFIG.accountId}/${CONFIG.region}`, { 
        cwd: cdkDir, 
        stdio: 'inherit' 
      });
    } catch (error) {
      console.log('CDK déjà bootstrappé');
    }
    
    // Build the application
    console.log('Construction de l\'application...');
    execSync('npm run build', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
    
    // Deploy the stack
    console.log('Déploiement de la stack...');
    const deployOutput = execSync(`cdk deploy --require-approval never`, { 
      cwd: cdkDir, 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    console.log(deployOutput);
    
    // Extract outputs
    const outputs = extractOutputs(deployOutput);
    
    console.log('\nDéploiement réussi!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('LIENS D\'ACCÈS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const httpsEnabled = outputs.HttpsEnabled === 'true';
    const protocol = httpsEnabled ? 'https' : 'http';
    const baseUrl = httpsEnabled && CONFIG.domainName ? `${protocol}://${CONFIG.domainName}` : 
                   (outputs.LoadBalancerDNS ? `${protocol}://${outputs.LoadBalancerDNS}` : outputs.ApiUrl);
    
    if (httpsEnabled && CONFIG.domainName) {
      console.log(`🔒 HTTPS activé avec certificat SSL`);
      console.log(`   Domaine: ${CONFIG.domainName}`);
      if (outputs.CertificateArn) {
        console.log(`   Certificat: ${outputs.CertificateArn}`);
      }
    } else {
      console.log(`🌐 Utilisation du DNS Load Balancer AWS (HTTP)`);
      console.log(`   Pour HTTPS, configurez un nom de domaine et un certificat SSL`);
    }
    
    if (baseUrl) {
      console.log(`API Principal: ${baseUrl}`);
      console.log(`Documentation: ${baseUrl}/api-docs`);
      console.log(`Santé: ${baseUrl}/api/health`);
    }
    if (outputs.ApiDocsUrl) {
      console.log(`Documentation: ${outputs.ApiDocsUrl}`);
    }
    if (outputs.HealthCheckUrl) {
      console.log(`Santé: ${outputs.HealthCheckUrl}`);
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ENDPOINTS DISPONIBLES:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const endpointUrl = httpsEnabled && CONFIG.domainName ? `${protocol}://${CONFIG.domainName}` : 
                       (outputs.LoadBalancerDNS ? `${protocol}://${outputs.LoadBalancerDNS}` : outputs.ApiUrl || 'http://your-load-balancer-dns');
    
    console.log(`   GET  ${endpointUrl}/api/players     - Liste des joueurs`);
    console.log(`   POST ${endpointUrl}/api/players     - Créer un joueur`);
    console.log(`   GET  ${endpointUrl}/api/players/:id - Détails d'un joueur`);
    console.log(`   GET  ${endpointUrl}/api/players/stats - Statistiques`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Save deployment info
    const deploymentInfo: DeploymentInfo = {
      timestamp: new Date().toISOString(),
      stackName: CONFIG.stackName,
      region: CONFIG.region,
      outputs: outputs,
      endpoints: {
        api: endpointUrl,
        docs: `${endpointUrl}/api-docs`,
        health: `${endpointUrl}/api/health`
      }
    };
    
    fs.writeFileSync(
      path.join(__dirname, '..', 'deployment-info.json'), 
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log('Informations de déploiement sauvegardées dans deployment-info.json');
    
  } catch (error: any) {
    console.error('Erreur de déploiement:', error.message);
    process.exit(1);
  }
}

// Extract outputs from CDK deploy output
function extractOutputs(deployOutput: string): DeploymentOutputs {
  const outputs: DeploymentOutputs = {};
  const lines = deployOutput.split('\n');
  
  for (const line of lines) {
    if (line.includes('ApiUrl =')) {
      outputs.ApiUrl = line.split('=')[1].trim();
    }
    if (line.includes('ApiDocsUrl =')) {
      outputs.ApiDocsUrl = line.split('=')[1].trim();
    }
    if (line.includes('HealthCheckUrl =')) {
      outputs.HealthCheckUrl = line.split('=')[1].trim();
    }
    if (line.includes('LoadBalancerDNS =')) {
      outputs.LoadBalancerDNS = line.split('=')[1].trim();
    }
    if (line.includes('HttpsEnabled =')) {
      outputs.HttpsEnabled = line.split('=')[1].trim();
    }
    if (line.includes('CertificateArn =')) {
      outputs.CertificateArn = line.split('=')[1].trim();
    }
    if (line.includes('DomainName =')) {
      outputs.DomainName = line.split('=')[1].trim();
    }
  }
  
  // Récupérer dynamiquement le DNS du load balancer si pas trouvé dans les outputs
  if (!outputs.LoadBalancerDNS) {
    try {
      console.log('Tentative de récupération du DNS du load balancer...');
      
      // First, try to get all load balancers and filter by tags or name pattern
      const elbOutput = execSync(`aws elbv2 describe-load-balancers --region ${CONFIG.region} --query "LoadBalancers[?contains(LoadBalancerName, 'latelier') || contains(LoadBalancerName, 'Latelier')].DNSName" --output text`, { encoding: 'utf8' });
      
      let loadBalancerDns = elbOutput.trim();
      
      // If that doesn't work, try a broader search
      if (!loadBalancerDns || loadBalancerDns === 'None' || loadBalancerDns === '') {
        console.log('Recherche élargie des load balancers...');
        const allElbOutput = execSync(`aws elbv2 describe-load-balancers --region ${CONFIG.region} --query "LoadBalancers[0].DNSName" --output text`, { encoding: 'utf8' });
        loadBalancerDns = allElbOutput.trim();
      }
      
      if (loadBalancerDns && loadBalancerDns !== 'None' && loadBalancerDns !== '') {
        outputs.LoadBalancerDNS = loadBalancerDns;
        console.log(`Load balancer DNS récupéré: ${loadBalancerDns}`);
      } else {
        console.log('Aucun load balancer trouvé, utilisation des outputs CDK');
      }
    } catch (error) {
      console.log('Impossible de récupérer le DNS du load balancer dynamiquement:', (error as Error).message);
    }
  }
  
  return outputs;
}

// Main execution
async function main(): Promise<void> {
  try {
    const accountId = checkPrerequisites();
    CONFIG.accountId = accountId;
    
    createCdkApp(accountId);
    deployToAws();
    
  } catch (error: any) {
    console.error('Erreur:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main, CONFIG };