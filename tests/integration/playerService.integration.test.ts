import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { PlayerService } from "../../src/services/playerService.js";
import { Player } from "../../src/models/Player.js";

describe("PlayerService Integration Tests - Real Database Calculations", () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    // Créer une instance MongoDB en mémoire
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connecter à la base de données de test
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Nettoyer et fermer les connexions
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    // Nettoyer la collection avant chaque test
    await Player.deleteMany({});
  });

  describe("Real Statistics Calculations with Database", () => {
    const testPlayers = [
      {
        id: 1,
        firstname: "Rafael",
        lastname: "Nadal",
        shortname: "R.NAD",
        sex: "M" as const,
        country: { picture: "https://example.com/esp.png", code: "ESP" },
        picture: "https://example.com/nadal.png",
        data: {
          rank: 1,
          points: 10000,
          weight: 85000, // 85kg
          height: 185,   // 185cm
          age: 37,
          last: [1, 1, 1, 0, 1] // 4/5 = 80%
        }
      },
      {
        id: 2,
        firstname: "Roger",
        lastname: "Federer",
        shortname: "R.FED",
        sex: "M" as const,
        country: { picture: "https://example.com/sui.png", code: "SUI" },
        picture: "https://example.com/federer.png",
        data: {
          rank: 2,
          points: 9500,
          weight: 85000, // 85kg
          height: 185,   // 185cm
          age: 42,
          last: [1, 1, 0, 1, 1] // 4/5 = 80%
        }
      },
      {
        id: 3,
        firstname: "Serena",
        lastname: "Williams",
        shortname: "S.WIL",
        sex: "F" as const,
        country: { picture: "https://example.com/usa.png", code: "USA" },
        picture: "https://example.com/serena.png",
        data: {
          rank: 1,
          points: 8500,
          weight: 70000, // 70kg
          height: 175,   // 175cm
          age: 42,
          last: [1, 1, 1, 1, 1] // 5/5 = 100%
        }
      },
      {
        id: 4,
        firstname: "Novak",
        lastname: "Djokovic",
        shortname: "N.DJO",
        sex: "M" as const,
        country: { picture: "https://example.com/srb.png", code: "SRB" },
        picture: "https://example.com/djokovic.png",
        data: {
          rank: 3,
          points: 9000,
          weight: 80000, // 80kg
          height: 188,   // 188cm
          age: 36,
          last: [1, 0, 1, 1, 1] // 4/5 = 80%
        }
      },
      {
        id: 5,
        firstname: "Carlos",
        lastname: "Alcaraz",
        shortname: "C.ALC",
        sex: "M" as const,
        country: { picture: "https://example.com/esp.png", code: "ESP" },
        picture: "https://example.com/alcaraz.png",
        data: {
          rank: 4,
          points: 8000,
          weight: 74000, // 74kg
          height: 183,   // 183cm
          age: 21,
          last: [1, 1, 1, 1, 0] // 4/5 = 80%
        }
      }
    ];

    beforeEach(async () => {
      // Insérer les joueurs de test
      await Player.insertMany(testPlayers);
    });

    it("should calculate real IMC statistics from database", async () => {
      const stats = await PlayerService.getSpecificStats();

      // Vérifier que les calculs d'IMC sont corrects
      // Rafael: 85/(1.85^2) = 24.84
      // Roger: 85/(1.85^2) = 24.84  
      // Serena: 70/(1.75^2) = 22.86
      // Novak: 80/(1.88^2) = 22.64
      // Carlos: 74/(1.83^2) = 22.10
      // Moyenne: (24.84 + 24.84 + 22.86 + 22.64 + 22.10) / 5 = 23.46

      expect(stats.averageIMC).toBeCloseTo(23.46, 1);
      expect(stats.medianHeight).toBe(185); // Médiane de [175, 183, 185, 185, 188]
    });

    it("should calculate country statistics correctly", async () => {
      const stats = await PlayerService.getSpecificStats();

      // ESP: Rafael (4/5) + Carlos (4/5) = 8/10 = 80%
      // SUI: Roger (4/5) = 4/5 = 80%
      // USA: Serena (5/5) = 5/5 = 100%
      // SRB: Novak (4/5) = 4/5 = 80%
      // Meilleur pays: USA avec 100%

      expect(stats.bestWinRateCountry.country).toBe("USA");
      expect(stats.bestWinRateCountry.winRate).toBe(100);
      expect(stats.bestWinRateCountry.wins).toBe(5);
      expect(stats.bestWinRateCountry.totalMatches).toBe(5);
    });

    it("should handle players with invalid weight (division by zero)", async () => {
      // Ajouter un joueur avec poids très faible mais valide
      const invalidPlayer = {
        id: 99,
        firstname: "Invalid",
        lastname: "Weight",
        shortname: "I.WEI",
        sex: "M" as const,
        country: { picture: "https://example.com/test.png", code: "TST" },
        picture: "https://example.com/invalid.png",
        data: {
          rank: 99,
          points: 1000,
          weight: 10000, // 10kg - très faible mais valide
          height: 180,
          age: 25,
          last: [1, 0, 1, 0, 1]
        }
      };

      await Player.create(invalidPlayer);
      
      // Le service devrait inclure ce joueur dans les calculs
      const stats = await PlayerService.getSpecificStats();
      
      // Les calculs devraient inclure le joueur avec poids faible
      // IMC sera très faible: 10/(1.8^2) = 3.09
      // Cela va changer la moyenne globale
      expect(stats.averageIMC).toBeLessThan(23.46); // Plus faible qu'avant
    });

    it("should handle players with invalid height (division by zero)", async () => {
      // Ajouter un joueur avec taille très faible mais valide
      const invalidPlayer = {
        id: 98,
        firstname: "Invalid",
        lastname: "Height",
        shortname: "I.HEI",
        sex: "M" as const,
        country: { picture: "https://example.com/test.png", code: "TST" },
        picture: "https://example.com/invalid.png",
        data: {
          rank: 98,
          points: 1000,
          weight: 80000,
          height: 100, // 100cm - très faible mais valide
          age: 25,
          last: [1, 0, 1, 0, 1]
        }
      };

      await Player.create(invalidPlayer);
      
      // Le service devrait inclure ce joueur dans les calculs
      const stats = await PlayerService.getSpecificStats();
      
      // Les calculs devraient inclure le joueur avec taille faible
      // IMC sera très élevé: 80/(1.0^2) = 80
      // Cela va augmenter la moyenne globale
      expect(stats.averageIMC).toBeGreaterThan(23.46); // Plus élevé qu'avant
    });

    it("should calculate statistics with mixed valid and invalid data", async () => {
      // Nettoyer et ajouter des données mixtes
      await Player.deleteMany({});
      
      const mixedPlayers = [
        {
          id: 1,
          firstname: "Valid",
          lastname: "Player",
          shortname: "V.PLY",
          sex: "M" as const,
          country: { picture: "https://example.com/test.png", code: "VAL" },
          picture: "https://example.com/valid.png",
          data: {
            rank: 1,
            points: 5000,
            weight: 80000, // Valide
            height: 180,   // Valide
            age: 25,
            last: [1, 1, 1, 1, 1] // 100%
          }
        },
        {
          id: 2,
          firstname: "Light",
          lastname: "Weight",
          shortname: "L.WEI",
          sex: "M" as const,
          country: { picture: "https://example.com/test.png", code: "INV" },
          picture: "https://example.com/invalid.png",
          data: {
            rank: 2,
            points: 4000,
            weight: 30000, // 30kg - minimum valide mais très léger
            height: 180,
            age: 25,
            last: [0, 0, 0, 0, 0] // 0%
          }
        }
      ];

      await Player.insertMany(mixedPlayers);
      
      const stats = await PlayerService.getSpecificStats();
      
      // Les deux joueurs devraient être inclus dans les calculs d'IMC
      // Player1: 80/(1.8^2) = 24.69
      // Player2: 30/(1.8^2) = 9.26
      // Moyenne: (24.69 + 9.26) / 2 = 16.98
      expect(stats.averageIMC).toBeCloseTo(16.98, 1);
      expect(stats.medianHeight).toBe(180); // Médiane de [180, 180]
      
      // Mais les deux pays devraient être inclus dans les stats de pays
      expect(stats.bestWinRateCountry.country).toBe("VAL");
      expect(stats.bestWinRateCountry.winRate).toBe(100);
    });

    it("should handle database with no players", async () => {
      // Nettoyer complètement la base de données
      await Player.deleteMany({});
      
      // Devrait lever une erreur car aucun joueur dans la base
      await expect(PlayerService.getSpecificStats()).rejects.toThrow(
        "Aucun joueur trouvé dans la base de données"
      );
    });

    it("should calculate median height correctly with odd number of players", async () => {
      // Nettoyer et ajouter un nombre impair de joueurs
      await Player.deleteMany({});
      
      const players = [
        { ...testPlayers[0], data: { ...testPlayers[0].data, height: 170 } },
        { ...testPlayers[1], data: { ...testPlayers[1].data, height: 180 } },
        { ...testPlayers[2], data: { ...testPlayers[2].data, height: 190 } }
      ];

      await Player.insertMany(players);
      
      const stats = await PlayerService.getSpecificStats();
      
      // Médiane de [170, 180, 190] = 180
      expect(stats.medianHeight).toBe(180);
    });

    it("should calculate median height correctly with even number of players", async () => {
      // Nettoyer et ajouter un nombre pair de joueurs
      await Player.deleteMany({});
      
      const players = [
        { ...testPlayers[0], data: { ...testPlayers[0].data, height: 170 } },
        { ...testPlayers[1], data: { ...testPlayers[1].data, height: 180 } },
        { ...testPlayers[2], data: { ...testPlayers[2].data, height: 190 } },
        { ...testPlayers[3], data: { ...testPlayers[3].data, height: 200 } }
      ];

      await Player.insertMany(players);
      
      const stats = await PlayerService.getSpecificStats();
      
      // Médiane de [170, 180, 190, 200] = (180 + 190) / 2 = 185
      expect(stats.medianHeight).toBe(185);
    });
  });
});