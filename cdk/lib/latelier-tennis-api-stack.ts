import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as docdb from 'aws-cdk-lib/aws-docdb';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';

export interface LatelierTennisApiStackProps extends cdk.StackProps {
  stackName: string;
  domainName: string;
  certificateArn?: string; // Optional - will create one if not provided
  hostedZoneId?: string; // Optional - will look up if not provided
  environment: string;
}

export class LatelierTennisApiStack extends cdk.Stack {
  public readonly apiUrl: string;

  constructor(scope: Construct, id: string, props: LatelierTennisApiStackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, 'LatelierVpc', {
      maxAzs: 2,
      natGateways: 1,
    });

    // HTTPS Configuration - only if domain name is provided and valid
    let certificate: certificatemanager.ICertificate | undefined;
    let hostedZone: route53.IHostedZone | undefined;
    let enableHttps = false;

    // Only attempt HTTPS setup if a real domain name is provided
    if (props.domainName && props.domainName !== 'api.latelier-tennis.com' && !props.domainName.includes('example')) {
      if (props.certificateArn) {
        // Use existing certificate
        certificate = certificatemanager.Certificate.fromCertificateArn(
          this,
          'ExistingCertificate',
          props.certificateArn
        );
        enableHttps = true;
      } else {
        // Look up or create hosted zone
        if (props.hostedZoneId) {
          hostedZone = route53.HostedZone.fromHostedZoneId(
            this,
            'ExistingHostedZone',
            props.hostedZoneId
          );
        } else {
          // Try to look up hosted zone by domain name
          const rootDomain = props.domainName.split('.').slice(-2).join('.');
          try {
            hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
              domainName: rootDomain,
            });
          } catch (error) {
            console.warn(`Could not find hosted zone for ${rootDomain}. HTTPS will be disabled.`);
          }
        }

        if (hostedZone) {
          // Create certificate with DNS validation
          certificate = new certificatemanager.Certificate(this, 'ApiCertificate', {
            domainName: props.domainName,
            validation: certificatemanager.CertificateValidation.fromDns(hostedZone),
          });
          enableHttps = true;
        }
      }
    } else {
      console.log('No valid domain name provided. Deploying with HTTP only using Load Balancer DNS.');
    }

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'LatelierCluster', {
      vpc,
      containerInsights: true,
    });

    // MongoDB credentials from environment variables
    const docdbUsername = process.env.DOCDB_USERNAME || 'dbadmin';
    const docdbPassword = process.env.DOCDB_PASSWORD || 'TennisAPI2024!';
    const docdbDatabase = process.env.DOCDB_DATABASE || 'latelier_prod';

    // DocumentDB Cluster - properly configured for VPC connectivity
    const docdbCluster = new docdb.DatabaseCluster(this, 'LatelierDocDB', {
      masterUser: {
        username: docdbUsername,
        password: cdk.SecretValue.unsafePlainText(docdbPassword),
      },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
      instances: 1,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      // DocumentDB requires TLS
      parameterGroup: new docdb.ClusterParameterGroup(this, 'LatelierDocDBParams', {
        family: 'docdb5.0',
        parameters: {
          tls: 'enabled',
        },
      }),
      // Enable storage encryption
      storageEncrypted: true,
      // Backup configuration
      backup: {
        retention: cdk.Duration.days(7),
        preferredWindow: '03:00-04:00',
      },
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development
    });

    // Définition de tâche personnalisée avec health check
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'ApiTaskDefinition', {
      memoryLimitMiB: 1024,
      cpu: 512,
    });

    const container = taskDefinition.addContainer('web', {
      image: ecs.ContainerImage.fromAsset('../', {
        exclude: ['cdk/', 'node_modules/', '.git/', 'tests/', 'coverage/', 'logs/', '*.md']
      }),
      memoryLimitMiB: 1024,
      environment: {
        NODE_ENV: 'production',
        PORT: '3000',
        // MONGODB_URI entièrement dynamique - construit depuis les ressources DocumentDB déployées
        MONGODB_URI: `mongodb://${docdbUsername}:${docdbPassword}@${docdbCluster.instanceEndpoints[0].hostname}:${docdbCluster.instanceEndpoints[0].port}/${docdbDatabase}?tls=true&retryWrites=false&authSource=admin&authMechanism=SCRAM-SHA-1`,
        // Variables DocumentDB pour debugging
        DOCDB_CLUSTER_ENDPOINT: docdbCluster.clusterEndpoint.hostname,
        DOCDB_INSTANCE_ENDPOINT: docdbCluster.instanceEndpoints[0].hostname,
        DOCDB_PORT: docdbCluster.instanceEndpoints[0].port.toString(),
        DOCDB_USERNAME: docdbUsername,
        DOCDB_PASSWORD: docdbPassword,
        DOCDB_DATABASE: docdbDatabase,
        LOG_LEVEL: 'info',
        RATE_LIMIT_MAX: '1000',
        ALLOWED_ORIGINS: '*',
        // Timeouts augmentés pour DocumentDB
        MONGODB_SERVER_SELECTION_TIMEOUT: '60000',
        MONGODB_SOCKET_TIMEOUT: '60000',
        MONGODB_CONNECT_TIMEOUT: '60000',
      },
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'latelier-api',
        logRetention: logs.RetentionDays.ONE_WEEK,
      }),
      // Health check au niveau du conteneur
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:3000/api/health || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60), // Attendre 60 secondes avant de commencer les health checks
      },
    });

    container.addPortMappings({
      containerPort: 3000,
      protocol: ecs.Protocol.TCP,
    });

    // Application Load Balanced Fargate Service avec définition de tâche personnalisée
    const fargateServiceConfig: any = {
      cluster,
      desiredCount: 2,
      // CRITIQUE: Placer les tâches ECS dans les mêmes subnets que DocumentDB
      taskSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      // Load balancer public mais tâches privées
      publicLoadBalancer: true,
      // Utiliser notre définition de tâche personnalisée
      taskDefinition: taskDefinition,
    };

    // Add HTTPS configuration only if certificate is available
    if (enableHttps && certificate) {
      fargateServiceConfig.certificate = certificate;
      fargateServiceConfig.domainName = props.domainName;
      fargateServiceConfig.domainZone = hostedZone;
      fargateServiceConfig.redirectHTTP = true; // Redirect HTTP to HTTPS
    }

    const fargateService: ecsPatterns.ApplicationLoadBalancedFargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'LatelierApiService', fargateServiceConfig);

    // CRITICAL: Configure security groups for DocumentDB connectivity
    // Allow ECS tasks to connect to DocumentDB on port 27017
    docdbCluster.connections.allowFrom(fargateService.service, ec2.Port.tcp(27017), 'Allow ECS tasks to connect to DocumentDB');
    
    // Ensure ECS tasks can make outbound connections to DocumentDB
    fargateService.service.connections.allowTo(docdbCluster, ec2.Port.tcp(27017), 'Allow ECS tasks outbound to DocumentDB');
    
    // Additional security group rule to ensure connectivity
    const ecsSecurityGroup = fargateService.service.connections.securityGroups[0];
    const docdbSecurityGroup = docdbCluster.connections.securityGroups[0];
    
    // Explicit bidirectional rules
    ecsSecurityGroup.addEgressRule(
      docdbSecurityGroup,
      ec2.Port.tcp(27017),
      'ECS to DocumentDB outbound'
    );
    
    docdbSecurityGroup.addIngressRule(
      ecsSecurityGroup,
      ec2.Port.tcp(27017),
      'DocumentDB from ECS inbound'
    );

    // Auto Scaling
    const scaling = fargateService.service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 10,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
    });

    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 80,
    });

    // Note: L'injection des données sera faite manuellement après le déploiement
    // via un script de population pour éviter les problèmes de dépendances Lambda

    // Health check - configuration plus tolérante
    fargateService.targetGroup.configureHealthCheck({
      path: '/api/health',
      healthyHttpCodes: '200',
      interval: cdk.Duration.seconds(60), // Augmenté de 30 à 60 secondes
      timeout: cdk.Duration.seconds(10), // Augmenté de 5 à 10 secondes
      healthyThresholdCount: 2, // 2 checks successifs pour être considéré comme sain
      unhealthyThresholdCount: 5, // 5 checks échoués pour être considéré comme non sain (au lieu de 3)
    });

    // Store the API URL
    this.apiUrl = enableHttps && certificate ? props.domainName! : fargateService.loadBalancer.loadBalancerDnsName;
    
    // Outputs avec informations DocumentDB dynamiques
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: enableHttps && certificate ? `https://${props.domainName}` : `http://${fargateService.loadBalancer.loadBalancerDnsName}`,
      description: 'L\'Atelier Tennis API URL',
    });

    new cdk.CfnOutput(this, 'ApiDocsUrl', {
      value: enableHttps && certificate ? `https://${props.domainName}/api-docs` : `http://${fargateService.loadBalancer.loadBalancerDnsName}/api-docs`,
      description: 'API Documentation URL',
    });

    new cdk.CfnOutput(this, 'HealthCheckUrl', {
      value: enableHttps && certificate ? `https://${props.domainName}/api/health` : `http://${fargateService.loadBalancer.loadBalancerDnsName}/api/health`,
      description: 'Health Check URL',
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: fargateService.loadBalancer.loadBalancerDnsName,
      description: 'Load Balancer DNS Name',
    });

    // Certificate and HTTPS information
    if (enableHttps && certificate) {
      new cdk.CfnOutput(this, 'CertificateArn', {
        value: certificate.certificateArn,
        description: 'SSL Certificate ARN',
      });

      new cdk.CfnOutput(this, 'DomainName', {
        value: props.domainName!,
        description: 'Custom Domain Name',
      });

      new cdk.CfnOutput(this, 'HttpsEnabled', {
        value: 'true',
        description: 'HTTPS is enabled',
      });
    } else {
      new cdk.CfnOutput(this, 'HttpsEnabled', {
        value: 'false',
        description: 'HTTPS is not enabled - using Load Balancer DNS with HTTP',
      });
    }

    new cdk.CfnOutput(this, 'DocumentDBClusterEndpoint', {
      value: docdbCluster.clusterEndpoint.hostname,
      description: 'DocumentDB Cluster Endpoint',
    });

    new cdk.CfnOutput(this, 'DocumentDBInstanceEndpoint', {
      value: docdbCluster.instanceEndpoints[0].hostname,
      description: 'DocumentDB Instance Endpoint',
    });

    new cdk.CfnOutput(this, 'MongoDBURI', {
      value: `mongodb://${docdbUsername}:***@${docdbCluster.instanceEndpoints[0].hostname}:${docdbCluster.instanceEndpoints[0].port}/${docdbDatabase}?tls=true&retryWrites=false&authSource=admin&authMechanism=SCRAM-SHA-1`,
      description: 'MongoDB Connection URI (password masked)',
    });

    new cdk.CfnOutput(this, 'DataPopulationStatus', {
      value: `Run 'npm run populate:data' to inject tennis players data after deployment`,
      description: 'Data Population Instructions',
    });
  }
}