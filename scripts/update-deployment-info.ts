#!/usr/bin/env node

/**
 * Script pour mettre à jour dynamiquement les informations de déploiement
 * Récupère le DNS du load balancer et met à jour deployment-info.json
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface DeploymentInfo {
  timestamp: string;
  stackName: string;
  region: string;
  outputs: {
    LoadBalancerDNS?: string;
    ApiUrl?: string;
    ApiDocsUrl?: string;
    HealthCheckUrl?: string;
  };
  endpoints: {
    api: string;
    docs: string;
    health: string;
  };
}

async function updateDeploymentInfo(): Promise<void> {
  console.log('Mise à jour des informations de déploiement...');
  
  const region = process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION || 'eu-west-2';
  const stackName = 'latelier-tennis-api';
  
  try {
    // Récupérer le DNS du load balancer
    console.log('Récupération du DNS du load balancer...');
    
    let loadBalancerDns = '';
    
    try {
      // First try to get load balancer by tag (more reliable)
      const taggedLbOutput = execSync(
        `aws elbv2 describe-load-balancers --region ${region} --query "LoadBalancers[?Tags[?Key=='aws:cloudformation:stack-name' && Value=='${stackName}']].DNSName" --output text`,
        { encoding: 'utf8' }
      ).trim();
      
      if (taggedLbOutput && taggedLbOutput !== 'None' && taggedLbOutput !== '') {
        loadBalancerDns = taggedLbOutput;
        console.log(`Load balancer trouvé par tag CloudFormation: ${loadBalancerDns}`);
      }
    } catch (error) {
      console.log('Recherche par tag CloudFormation échouée, essai par nom...');
    }
    
    // If tag search failed, try by name pattern
    if (!loadBalancerDns) {
      try {
        const allLbsOutput = execSync(
          `aws elbv2 describe-load-balancers --region ${region} --output json`,
          { encoding: 'utf8' }
        );
        
        const allLbs = JSON.parse(allLbsOutput);
        const targetLb = allLbs.LoadBalancers?.find((lb: any) => 
          lb.LoadBalancerName?.toLowerCase().includes('lateli') ||
          lb.LoadBalancerName?.toLowerCase().includes('tennis')
        );
        
        if (targetLb) {
          loadBalancerDns = targetLb.DNSName;
          console.log(`Load balancer trouvé par nom: ${loadBalancerDns}`);
        }
      } catch (error) {
        console.log('Recherche par nom échouée');
      }
    }
    
    // Last resort: get the most recent load balancer
    if (!loadBalancerDns) {
      try {
        const recentLbOutput = execSync(
          `aws elbv2 describe-load-balancers --region ${region} --query "LoadBalancers[0].DNSName" --output text`,
          { encoding: 'utf8' }
        ).trim();
        
        if (recentLbOutput && recentLbOutput !== 'None' && recentLbOutput !== '') {
          loadBalancerDns = recentLbOutput;
          console.log(`Load balancer le plus récent utilisé: ${loadBalancerDns}`);
        }
      } catch (error) {
        console.log('Impossible de récupérer un load balancer');
      }
    }
    
    if (!loadBalancerDns) {
      throw new Error('Aucun load balancer trouvé');
    }
    
    console.log(`Load balancer trouvé: ${loadBalancerDns}`);
    
    // Récupérer les outputs CloudFormation si disponibles
    let cloudFormationOutputs = {};
    try {
      const cfOutputs = execSync(
        `aws cloudformation describe-stacks --region ${region} --stack-name ${stackName} --query "Stacks[0].Outputs"`,
        { encoding: 'utf8' }
      );
      const outputs = JSON.parse(cfOutputs);
      if (outputs && Array.isArray(outputs)) {
        cloudFormationOutputs = outputs.reduce((acc: any, output: any) => {
          acc[output.OutputKey] = output.OutputValue;
          return acc;
        }, {});
      }
    } catch (error) {
      console.log('Impossible de récupérer les outputs CloudFormation (stack peut-être en cours de création)');
    }
    
    // Créer les URLs
    const baseUrl = `http://${loadBalancerDns}`;
    
    const deploymentInfo: DeploymentInfo = {
      timestamp: new Date().toISOString(),
      stackName: stackName,
      region: region,
      outputs: {
        LoadBalancerDNS: loadBalancerDns,
        ApiUrl: baseUrl,
        ApiDocsUrl: `${baseUrl}/api-docs`,
        HealthCheckUrl: `${baseUrl}/api/health`,
        ...cloudFormationOutputs
      },
      endpoints: {
        api: baseUrl,
        docs: `${baseUrl}/api-docs`,
        health: `${baseUrl}/api/health`
      }
    };
    
    // Sauvegarder les informations
    const deploymentInfoPath = path.join(__dirname, '..', 'deployment-info.json');
    fs.writeFileSync(deploymentInfoPath, JSON.stringify(deploymentInfo, null, 2));
    
    console.log('\nInformations de déploiement mises à jour!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('LIENS D\'ACCÈS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`API Principal: ${deploymentInfo.endpoints.api}`);
    console.log(`Documentation: ${deploymentInfo.endpoints.docs}`);
    console.log(`Santé: ${deploymentInfo.endpoints.health}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ENDPOINTS DISPONIBLES:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   GET  ${deploymentInfo.endpoints.api}/api/players     - Liste des joueurs`);
    console.log(`   POST ${deploymentInfo.endpoints.api}/api/players     - Créer un joueur`);
    console.log(`   GET  ${deploymentInfo.endpoints.api}/api/players/:id - Détails d'un joueur`);
    console.log(`   GET  ${deploymentInfo.endpoints.api}/api/players/stats - Statistiques`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour des informations de déploiement:', error.message);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  updateDeploymentInfo();
}

export { updateDeploymentInfo };