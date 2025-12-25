const swaggerAutogen = require('swagger-autogen')();
require('dotenv').config();

const SERVER_URL = process.env.SERVER_URL || `http://${process.env.HOST || 'localhost'}:${process.env.PORT || 3000}`;
const url = new URL(SERVER_URL);

const doc = {
  info: {
    title: "API L'Atelier",
    version: "1.0.0",
    description: "Documentation API générée automatiquement"
  },
  host: url.host,
  schemes: [url.protocol.replace(':', '')],
  tags: [
    {
      name: "Santé",
      description: "Points de terminaison de contrôle de santé et de surveillance"
    }
  ]
};

const outputFile = './src/swagger-output.json';
const endpointsFiles = ['./src/app.ts'];

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  console.log('Documentation Swagger générée avec succès !');
});