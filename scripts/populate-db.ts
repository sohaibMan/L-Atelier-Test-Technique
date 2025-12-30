#!/usr/bin/env node
import { config } from "dotenv";
import { database } from "../src/config/database.js";
import { PlayerService } from "../src/services/playerService.js";
import logger from "../src/config/logger.js";

// Chargement des variables d'environnement
config();

// Données de test des joueurs de tennis (données exactes fournies)
const samplePlayers = [
  {
    id: 52,
    firstname: "Novak",
    lastname: "Djokovic",
    shortname: "N.DJO",
    sex: "M" as const,
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
    sex: "F" as const,
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
    sex: "M" as const,
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
    sex: "F" as const,
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
    sex: "M" as const,
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

async function populateDatabase() {
  try {
    logger.info("Démarrage du script de population de la base de données");
    
    // Connexion à la base de données
    await database.connect();
    logger.info("Connexion à la base de données établie");

    // Vérifier si des joueurs existent déjà
    const existingPlayers = await PlayerService.getAllPlayersSorted();
    
    if (existingPlayers.length > 0) {
      logger.info(`${existingPlayers.length} joueurs trouvés dans la base de données`);
      console.log("Joueurs existants:");
      existingPlayers.forEach(player => {
        console.log(`- ${player.firstname} ${player.lastname} (Rang: ${player.data.rank})`);
      });
      
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise<string>((resolve) => {
        rl.question('Voulez-vous ajouter les joueurs de test quand même? (y/N): ', resolve);
      });
      
      rl.close();
      
      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        logger.info("Population annulée par l'utilisateur");
        await database.disconnect();
        process.exit(0);
      }
    }

    // Ajouter les joueurs de test
    let addedCount = 0;
    let skippedCount = 0;

    for (const playerData of samplePlayers) {
      try {
        const player = await PlayerService.createPlayer(playerData);
        logger.info(`Joueur ajouté: ${player.firstname} ${player.lastname}`);
        addedCount++;
      } catch (error) {
        if (error instanceof Error && error.message.includes('existe déjà')) {
          logger.info(`Joueur ignoré (existe déjà): ${playerData.firstname} ${playerData.lastname}`);
          skippedCount++;
        } else {
          logger.error(`Erreur lors de l'ajout de ${playerData.firstname} ${playerData.lastname}:`, {
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    }

    logger.info("Population terminée", {
      added: addedCount,
      skipped: skippedCount,
      total: samplePlayers.length
    });

    console.log(`\nPopulation terminée:`);
    console.log(`   - ${addedCount} joueurs ajoutés`);
    console.log(`   - ${skippedCount} joueurs ignorés (déjà existants)`);
    
    // Vérifier le résultat final
    const finalPlayers = await PlayerService.getAllPlayersSorted();
    console.log(`   - ${finalPlayers.length} joueurs au total dans la base`);

    await database.disconnect();
    process.exit(0);

  } catch (error) {
    logger.error("Erreur lors de la population de la base de données", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    try {
      await database.disconnect();
    } catch (disconnectError) {
      logger.error("Erreur lors de la déconnexion", {
        error: disconnectError instanceof Error ? disconnectError.message : String(disconnectError)
      });
    }
    
    process.exit(1);
  }
}

// Exécuter le script
populateDatabase();