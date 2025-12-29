import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import app from "../../src/app.js";
import { Player } from "../../src/models/Player.js";

describe("Players API - End-to-End Tests", () => {
  let mongoServer: MongoMemoryServer;
  let server: any;

  // Test data
  const validPlayerData = {
    id: 999,
    firstname: "Roger",
    lastname: "Federer",
    shortname: "R.FED",
    sex: "M" as const,
    country: {
      picture: "https://tenisu.latelier.co/resources/Suisse.png",
      code: "SUI"
    },
    picture: "https://tenisu.latelier.co/resources/Federer.png",
    data: {
      rank: 3,
      points: 2500,
      weight: 85000,
      height: 185,
      age: 35,
      last: [1, 1, 0, 1, 1]
    }
  };

  const secondPlayerData = {
    id: 998,
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
      rank: 1,
      points: 3500,
      weight: 72000,
      height: 175,
      age: 32,
      last: [1, 1, 1, 0, 1]
    }
  };

  const thirdPlayerData = {
    id: 997,
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
      rank: 2,
      points: 3000,
      weight: 85000,
      height: 185,
      age: 33,
      last: [1, 0, 1, 1, 1]
    }
  };

  beforeAll(async () => {
    // Disconnect any existing mongoose connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(mongoUri);
    
    // Start the server
    server = app.listen(0); // Use port 0 for random available port
  });

  afterAll(async () => {
    // Close server and database connections
    if (server) {
      server.close();
    }
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clean the database before each test
    await Player.deleteMany({});
  });

  describe("Complete Workflow - Happy Path", () => {
    it("should complete a full workflow: create players, retrieve them, and get statistics", async () => {
      // Step 1: Create first player
      const createResponse1 = await request(app)
        .post("/api/players")
        .send(validPlayerData)
        .expect(201);

      expect(createResponse1.body).toMatchObject({
        success: true,
        message: "Joueur créé avec succès",
        data: expect.objectContaining({
          id: validPlayerData.id,
          firstname: validPlayerData.firstname,
          lastname: validPlayerData.lastname,
          shortname: validPlayerData.shortname,
          sex: validPlayerData.sex,
          country: validPlayerData.country,
          data: expect.objectContaining(validPlayerData.data)
        })
      });

      // Step 2: Create second player
      const createResponse2 = await request(app)
        .post("/api/players")
        .send(secondPlayerData)
        .expect(201);

      expect(createResponse2.body.success).toBe(true);
      expect(createResponse2.body.data.id).toBe(secondPlayerData.id);

      // Step 3: Create third player
      const createResponse3 = await request(app)
        .post("/api/players")
        .send(thirdPlayerData)
        .expect(201);

      expect(createResponse3.body.success).toBe(true);
      expect(createResponse3.body.data.id).toBe(thirdPlayerData.id);

      // Step 4: Retrieve first player by ID
      const getResponse = await request(app)
        .get(`/api/players/${validPlayerData.id}`)
        .expect(200);

      expect(getResponse.body).toMatchObject({
        success: true,
        message: "Joueur récupéré avec succès",
        data: expect.objectContaining({
          id: validPlayerData.id,
          firstname: validPlayerData.firstname,
          lastname: validPlayerData.lastname,
          shortname: validPlayerData.shortname,
          sex: validPlayerData.sex,
          country: validPlayerData.country,
          data: expect.objectContaining(validPlayerData.data),
          createdAt: expect.any(String),
          updatedAt: expect.any(String)
        })
      });

      // Step 5: Get all players sorted by rank
      const allPlayersResponse = await request(app)
        .get("/api/players")
        .expect(200);

      expect(allPlayersResponse.body).toMatchObject({
        success: true,
        message: "Joueurs récupérés avec succès",
        data: expect.any(Array),
        count: expect.any(Number)
      });

      // Verify players are sorted by rank (ascending)
      const players = allPlayersResponse.body.data;
      expect(players.length).toBeGreaterThan(0);
      
      // Check that players are sorted by rank (1, 2, 3, etc.)
      for (let i = 1; i < players.length; i++) {
        expect(players[i].data.rank).toBeGreaterThanOrEqual(players[i - 1].data.rank);
      }

      // Step 6: Get statistics
      const statsResponse = await request(app)
        .get("/api/players/stats")
        .expect(200);

      expect(statsResponse.body).toMatchObject({
        success: true,
        message: "Statistiques calculées avec succès",
        data: expect.objectContaining({
          bestWinRateCountry: expect.objectContaining({
            country: expect.any(String),
            winRate: expect.any(Number),
            wins: expect.any(Number),
            totalMatches: expect.any(Number),
            players: expect.any(Array)
          }),
          averageIMC: expect.any(Number),
          medianHeight: expect.any(Number),
          totalPlayers: 3,
          calculatedAt: expect.any(String)
        })
      });

      // Verify statistics calculations
      const stats = statsResponse.body.data;
      expect(stats.totalPlayers).toBe(3);
      expect(stats.averageIMC).toBeGreaterThan(0);
      expect(stats.medianHeight).toBe(185); // Median of [175, 185, 185]
      expect(stats.bestWinRateCountry.winRate).toBeGreaterThan(0);
      expect(stats.bestWinRateCountry.winRate).toBeLessThanOrEqual(100);
    });
  });

  describe("Player Creation", () => {
    it("should create a player with valid data", async () => {
      const response = await request(app)
        .post("/api/players")
        .send(validPlayerData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: validPlayerData.id,
        firstname: validPlayerData.firstname,
        lastname: validPlayerData.lastname,
        shortname: validPlayerData.shortname,
        sex: validPlayerData.sex,
        country: validPlayerData.country,
        picture: validPlayerData.picture,
        data: validPlayerData.data
      });
      expect(response.body.data.createdAt).toBeDefined();
      expect(response.body.data.updatedAt).toBeDefined();
    });

    it("should reject player creation with invalid data", async () => {
      const invalidData = {
        ...validPlayerData,
        id: -1, // Invalid ID
        firstname: "A", // Too short
        sex: "X", // Invalid sex
        data: {
          ...validPlayerData.data,
          age: 15, // Too young
          last: [1, 1, 1] // Wrong array length
        }
      };

      const response = await request(app)
        .post("/api/players")
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Données invalides");
      expect(response.body.details).toBeInstanceOf(Array);
      expect(response.body.details.length).toBeGreaterThan(0);
    });

    it("should reject duplicate player ID", async () => {
      // Create first player
      await request(app)
        .post("/api/players")
        .send(validPlayerData)
        .expect(201);

      // Try to create player with same ID
      const duplicateData = {
        ...validPlayerData,
        firstname: "Different",
        lastname: "Player",
        shortname: "D.PLY"
      };

      const response = await request(app)
        .post("/api/players")
        .send(duplicateData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("existe déjà");
    });

    it("should reject duplicate shortname", async () => {
      // Create first player
      await request(app)
        .post("/api/players")
        .send(validPlayerData)
        .expect(201);

      // Try to create player with same shortname
      const duplicateData = {
        ...validPlayerData,
        id: 888,
        firstname: "Different",
        lastname: "Player"
      };

      const response = await request(app)
        .post("/api/players")
        .send(duplicateData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("nom court");
    });
  });

  describe("Player Retrieval", () => {
    beforeEach(async () => {
      // Create a player for retrieval tests
      await request(app)
        .post("/api/players")
        .send(validPlayerData)
        .expect(201);
    });

    it("should retrieve an existing player by ID", async () => {
      const response = await request(app)
        .get(`/api/players/${validPlayerData.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: validPlayerData.id,
        firstname: validPlayerData.firstname,
        lastname: validPlayerData.lastname,
        shortname: validPlayerData.shortname,
        sex: validPlayerData.sex,
        country: validPlayerData.country,
        picture: validPlayerData.picture,
        data: validPlayerData.data
      });
    });

    it("should return 404 for non-existent player", async () => {
      const response = await request(app)
        .get("/api/players/99999")
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Joueur non trouvé");
    });

    it("should return 400 for invalid player ID", async () => {
      const response = await request(app)
        .get("/api/players/invalid-id")
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Paramètres d'URL invalides");
    });

    it("should return 400 for negative player ID", async () => {
      const response = await request(app)
        .get("/api/players/-1")
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Paramètres d'URL invalides");
    });

    it("should retrieve all players sorted by rank", async () => {
      // Create multiple players with different ranks and unique shortnames
      const player1 = { 
        ...validPlayerData, 
        id: 1001, 
        firstname: "Player",
        lastname: "One",
        shortname: "P.ONE",
        data: { ...validPlayerData.data, rank: 3 } 
      };
      const player2 = { 
        ...validPlayerData, 
        id: 1002, 
        firstname: "Player",
        lastname: "Two",
        shortname: "P.TWO",
        data: { ...validPlayerData.data, rank: 1 } 
      };
      const player3 = { 
        ...validPlayerData, 
        id: 1003, 
        firstname: "Player",
        lastname: "Three",
        shortname: "P.THR",
        data: { ...validPlayerData.data, rank: 2 } 
      };

      await request(app).post("/api/players").send(player1).expect(201);
      await request(app).post("/api/players").send(player2).expect(201);
      await request(app).post("/api/players").send(player3).expect(201);

      const response = await request(app)
        .get("/api/players")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Joueurs récupérés avec succès");
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.count).toBe(4); // 3 new players + 1 from beforeEach

      // Verify players are sorted by rank (ascending: 1, 2, 3, ...)
      const players = response.body.data;
      expect(players[0].data.rank).toBe(1); // Player Two
      expect(players[1].data.rank).toBe(2); // Player Three
      expect(players[2].data.rank).toBe(3); // Player One or validPlayerData
    });
  });

  describe("Statistics Calculation", () => {
    beforeEach(async () => {
      // Create multiple players for statistics tests
      await request(app).post("/api/players").send(validPlayerData);
      await request(app).post("/api/players").send(secondPlayerData);
      await request(app).post("/api/players").send(thirdPlayerData);
    });

    it("should calculate and return correct statistics", async () => {
      const response = await request(app)
        .get("/api/players/stats")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        bestWinRateCountry: expect.objectContaining({
          country: expect.any(String),
          winRate: expect.any(Number),
          wins: expect.any(Number),
          totalMatches: expect.any(Number),
          players: expect.any(Array)
        }),
        averageIMC: expect.any(Number),
        medianHeight: expect.any(Number),
        totalPlayers: 3,
        calculatedAt: expect.any(String)
      });

      // Verify specific calculations
      const stats = response.body.data;
      
      // Check that win rate is a percentage (0-100)
      expect(stats.bestWinRateCountry.winRate).toBeGreaterThanOrEqual(0);
      expect(stats.bestWinRateCountry.winRate).toBeLessThanOrEqual(100);
      
      // Check that IMC is reasonable (typically 18-30 for athletes)
      expect(stats.averageIMC).toBeGreaterThan(15);
      expect(stats.averageIMC).toBeLessThan(35);
      
      // Check median height calculation
      // Heights: [175, 185, 185] -> median should be 185
      expect(stats.medianHeight).toBe(185);
      
      // Check that best country has players listed
      expect(stats.bestWinRateCountry.players.length).toBeGreaterThan(0);
    });

    it("should handle empty database gracefully", async () => {
      // Clear all players
      await Player.deleteMany({});

      const response = await request(app)
        .get("/api/players/stats")
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Erreur lors du calcul des statistiques");
    });
  });

  describe("Data Validation Edge Cases", () => {
    it("should validate weight boundaries", async () => {
      const invalidWeight = {
        ...validPlayerData,
        id: 777,
        data: {
          ...validPlayerData.data,
          weight: 25000 // Below minimum (30kg)
        }
      };

      const response = await request(app)
        .post("/api/players")
        .send(invalidWeight)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["data", "weight"]
          })
        ])
      );
    });

    it("should validate height boundaries", async () => {
      const invalidHeight = {
        ...validPlayerData,
        id: 776,
        data: {
          ...validPlayerData.data,
          height: 300 // Above maximum (250cm)
        }
      };

      const response = await request(app)
        .post("/api/players")
        .send(invalidHeight)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["data", "height"]
          })
        ])
      );
    });

    it("should validate age boundaries", async () => {
      const invalidAge = {
        ...validPlayerData,
        id: 775,
        data: {
          ...validPlayerData.data,
          age: 55 // Above maximum (50 years)
        }
      };

      const response = await request(app)
        .post("/api/players")
        .send(invalidAge)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["data", "age"]
          })
        ])
      );
    });

    it("should validate shortname format", async () => {
      const invalidShortname = {
        ...validPlayerData,
        id: 774,
        shortname: "INVALID" // Wrong format
      };

      const response = await request(app)
        .post("/api/players")
        .send(invalidShortname)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["shortname"]
          })
        ])
      );
    });

    it("should validate last results array", async () => {
      const invalidResults = {
        ...validPlayerData,
        id: 773,
        data: {
          ...validPlayerData.data,
          last: [1, 1, 2, 1, 1] // Invalid value (2)
        }
      };

      const response = await request(app)
        .post("/api/players")
        .send(invalidResults)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["data", "last", 2]
          })
        ])
      );
    });
  });

  describe("API Error Handling", () => {
    it("should handle malformed JSON", async () => {
      const response = await request(app)
        .post("/api/players")
        .send("invalid json")
        .set("Content-Type", "application/json")
        .expect(400);

      // Express handles malformed JSON with a 400 status
      expect(response.status).toBe(400);
    });

    it("should handle missing required fields", async () => {
      const incompleteData = {
        id: 772,
        firstname: "John"
        // Missing required fields
      };

      const response = await request(app)
        .post("/api/players")
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Données invalides");
      expect(response.body.details.length).toBeGreaterThan(0);
    });

    it("should handle non-existent routes", async () => {
      const response = await request(app)
        .get("/api/nonexistent")
        .expect(404);

      expect(response.body.message).toBe("Route non trouvée");
    });
  });

  describe("Performance and Stress Tests", () => {
    it("should handle multiple concurrent requests", async () => {
      const promises = [];
      
      // Create 10 concurrent requests
      for (let i = 0; i < 10; i++) {
        const playerData = {
          ...validPlayerData,
          id: 700 + i,
          shortname: `T.${String.fromCharCode(65 + i)}${String.fromCharCode(65 + i)}${String.fromCharCode(65 + i)}`
        };
        
        promises.push(
          request(app)
            .post("/api/players")
            .send(playerData)
        );
      }

      const responses = await Promise.all(promises);
      
      // All requests should succeed
      responses.forEach((response, index) => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(700 + index);
      });
    });

    it("should handle large payload within limits", async () => {
      const largePlayerData = {
        ...validPlayerData,
        id: 771,
        firstname: "A".repeat(50), // Maximum allowed length
        lastname: "B".repeat(50)   // Maximum allowed length
      };

      const response = await request(app)
        .post("/api/players")
        .send(largePlayerData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firstname).toBe("A".repeat(50));
      expect(response.body.data.lastname).toBe("B".repeat(50));
    });
  });

  describe("Statistics Accuracy", () => {
    it("should calculate IMC correctly", async () => {
      // Create players with known weights and heights for IMC calculation
      const player1 = {
        ...validPlayerData,
        id: 601,
        data: {
          ...validPlayerData.data,
          weight: 80000, // 80kg
          height: 180    // 180cm
        }
      };
      
      const player2 = {
        ...secondPlayerData,
        id: 602,
        data: {
          ...secondPlayerData.data,
          weight: 60000, // 60kg
          height: 160    // 160cm
        }
      };

      await request(app).post("/api/players").send(player1);
      await request(app).post("/api/players").send(player2);

      const response = await request(app)
        .get("/api/players/stats")
        .expect(200);

      // Expected IMC calculations:
      // Player 1: 80 / (1.8^2) = 24.69
      // Player 2: 60 / (1.6^2) = 23.44
      // Average: (24.69 + 23.44) / 2 = 24.07
      const expectedIMC = ((80 / (1.8 * 1.8)) + (60 / (1.6 * 1.6))) / 2;
      
      expect(response.body.data.averageIMC).toBeCloseTo(expectedIMC, 2);
    });

    it("should calculate median height correctly with odd number of players", async () => {
      // Create 3 players with heights: 170, 180, 190
      const players = [
        { ...validPlayerData, id: 501, shortname: "P.AAA", data: { ...validPlayerData.data, height: 170 } },
        { ...validPlayerData, id: 502, shortname: "P.BBB", data: { ...validPlayerData.data, height: 180 } },
        { ...validPlayerData, id: 503, shortname: "P.CCC", data: { ...validPlayerData.data, height: 190 } }
      ];

      for (const player of players) {
        const createResponse = await request(app).post("/api/players").send(player);
        if (createResponse.status !== 201) {
          console.log("Player creation failed:", createResponse.body);
        }
        expect(createResponse.status).toBe(201); // Ensure player creation succeeds
      }

      const response = await request(app)
        .get("/api/players/stats")
        .expect(200);

      // Median of [170, 180, 190] should be 180
      expect(response.body.data.medianHeight).toBe(180);
    });

    it("should calculate median height correctly with even number of players", async () => {
      // Create 4 players with heights: 170, 180, 190, 200
      const players = [
        { ...validPlayerData, id: 401, shortname: "P.AAA", data: { ...validPlayerData.data, height: 170 } },
        { ...validPlayerData, id: 402, shortname: "P.BBB", data: { ...validPlayerData.data, height: 180 } },
        { ...validPlayerData, id: 403, shortname: "P.CCC", data: { ...validPlayerData.data, height: 190 } },
        { ...validPlayerData, id: 404, shortname: "P.DDD", data: { ...validPlayerData.data, height: 200 } }
      ];

      for (const player of players) {
        const createResponse = await request(app).post("/api/players").send(player);
        if (createResponse.status !== 201) {
          console.log("Player creation failed:", createResponse.body);
        }
        expect(createResponse.status).toBe(201); // Ensure player creation succeeds
      }

      const response = await request(app)
        .get("/api/players/stats")
        .expect(200);

      // Median of [170, 180, 190, 200] should be (180 + 190) / 2 = 185
      expect(response.body.data.medianHeight).toBe(185);
    });

    it("should calculate win rates correctly by country", async () => {
      // Create players with known win/loss records
      const playerESP = {
        ...validPlayerData,
        id: 301,
        country: { picture: "https://example.com/esp.png", code: "ESP" },
        data: { ...validPlayerData.data, last: [1, 1, 1, 1, 1] } // 100% win rate
      };
      
      const playerUSA = {
        ...validPlayerData,
        id: 302,
        country: { picture: "https://example.com/usa.png", code: "USA" },
        data: { ...validPlayerData.data, last: [1, 1, 0, 0, 0] } // 40% win rate
      };

      await request(app).post("/api/players").send(playerESP);
      await request(app).post("/api/players").send(playerUSA);

      const response = await request(app)
        .get("/api/players/stats")
        .expect(200);

      const stats = response.body.data;
      
      // ESP should have the best win rate (100%)
      expect(stats.bestWinRateCountry.country).toBe("ESP");
      expect(stats.bestWinRateCountry.winRate).toBe(100);
      expect(stats.bestWinRateCountry.wins).toBe(5);
      expect(stats.bestWinRateCountry.totalMatches).toBe(5);
    });
  });
});