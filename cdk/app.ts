#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { config } from 'dotenv';
import { LatelierTennisApiStack } from './lib/latelier-tennis-api-stack';
import * as path from 'path';

// Load environment variables from .env.production
config({ path: path.join(__dirname, '..', '.env.production') });

const app = new cdk.App();

// Get account ID from environment or AWS CLI
const account = process.env.CDK_DEFAULT_ACCOUNT || '273528188531';
const region = process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'eu-central-1';

new LatelierTennisApiStack(app, 'latelier-tennis-api', {
  env: {
    account: account,
    region: region,
  },
  stackName: 'latelier-tennis-api',
  domainName: '', // Leave empty if you don't have a domain - will use Load Balancer DNS
  // certificateArn: '', // Optional - only needed if you have a domain
  // hostedZoneId: '', // Optional - only needed if you have a domain
  environment: 'production'
});