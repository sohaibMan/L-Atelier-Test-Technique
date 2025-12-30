#!/usr/bin/env node

/**
 * Script pour peupler l'API avec les données des joueurs de tennis
 * Utilise l'API REST pour injecter les données
 */

const https = require('https');
const http = require('http');

const API_URL = process.argv[2] || 'http://lateli-latel-xclvpyskjdve-878348924.eu-central-1.elb.amazonaws.com';

const samplePlayers = [
  {
    id: 52,
    firstname: "Novak",
    lastname: "Djokovic",
    shortname: "N.DJO",
    sex: "M",
    country: {
      picture: "https://tenisu.latelier.co/resources/Serbie.png",
      code: "SRB"
    },
    picture: "https://tenisu.latelier.co/resources/Djokovic.png",
    data: {
      rank: 2,
      points: 2542,
      weight: 80000,
      height: 188,
      age: 31,
      last: [1, 1, 1, 1, 1]
    }
  },
  {
    id: 95,
    firstname: "Venus",
    lastname: "Williams",
    shortname: "V.WIL",
    sex: "F",
    country: {
      picture: "https://tenisu.latelier.co/resources/USA.png",
      code: "USA"
    },
    picture: "https://tenisu.latelier.co/resources/Venus.webp",
    data: {
      rank: 52,
      points: 1105,
      weight: 74000,
      height: 185,
      age: 38,
      last: [0, 1, 0, 0, 1]
    }
  },
  {
    id: 65,
    firstname: "Stan",
    lastname: "Wawrinka",
    shortname: "S.WAW",
    sex: "M",
    country: {
      picture: "https://tenisu.latelier.co/resources/Suisse.png",
      code: "SUI"
    },
    picture: "https://tenisu.latelier.co/resources/Wawrinka.png",
    data: {
      rank: 21,
      points: 1784,
      weight: 81000,
      height: 183,
      age: 33,
      last: [1, 1, 1, 0, 1]
    }
  },
  {
    id: 102,
    firstname: "Serena",
    lastname: "Williams",
    shortname: "S.WIL",
    sex: "F",
    country: {
      picture: "https://tenisu.latelier.co/resources/USA.png",
      code: "USA"
    },
    picture: "https://tenisu.latelier.co/resources/Serena.png",
    data: {
      rank: 10,
      points: 3521,
      weight: 72000,
      height: 175,
      age: 37,
      last: [0, 1, 1, 1, 0]
    }
  },
  {
    id: 17,
    firstname: "Rafael",
    lastname: "Nadal",
    shortname: "R.NAD",
    sex: "M",
    country: {
      picture: "https://tenisu.latelier.co/resources/Espagne.png",
      code: "ESP"
    },
    picture: "https://tenisu.latelier.co/resources/Nadal.png",
    data: {
      rank: 1,
      points: 1982,
      weight: 85000,
      height: 185,
      age: 33,
      last: [1, 0, 0, 0, 1]
    }
  }
];

function makeHttpRequest(method, urlString, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(responseData));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

async function populateData() {
  console.log(`Peuplement de l'API Tennis avec les données des joueurs...`);
  console.log(`URL de l'API: ${API_URL}`);
  console.log('');

  let successCount = 0;
  let errorCount = 0;

  for (const player of samplePlayers) {
    try {
      console.log(`Ajout de ${player.firstname} ${player.lastname}...`);
      const result = await makeHttpRequest('POST', `${API_URL}/api/players`, player);
      console.log(`   Succès: ${result.message || 'Joueur ajouté'}`);
      successCount++;
    } catch (error) {
      console.log(`   Erreur: ${error.message}`);
      errorCount++;
    }
  }

  console.log('');
  console.log('Résumé:');
  console.log(`   Succès: ${successCount}`);
  console.log(`   Erreurs: ${errorCount}`);
  console.log(`   Total: ${samplePlayers.length}`);
  
  if (successCount > 0) {
    console.log('');
    console.log('Données injectées avec succès !');
    console.log(`Vérifiez: ${API_URL}/api/players`);
  }
}

// Exécuter le script
populateData().catch(console.error);