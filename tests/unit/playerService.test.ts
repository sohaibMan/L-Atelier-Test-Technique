import { PlayerService } from "../../src/services/playerService.js";
import { Player } from "../../src/models/Player.js";

// Mock the Player model
jest.mock("../../src/models/Player.js");
const MockedPlayer = Player as jest.Mocked<typeof Player>;

describe("PlayerService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createPlayer", () => {
    const validPlayerData = {
      id: 1,
      firstname: "Roger",
      lastname: "Federer",
      shortname: "R.FED",
      sex: "M" as const,
      country: {
        picture: "https://example.com/flag.png",
        code: "SUI"
      },
      picture: "https://example.com/player.png",
      data: {
        rank: 3,
        points: 2500,
        weight: 85000,
        height: 185,
        age: 35,
        last: [1, 1, 0, 1, 1]
      }
    };

    it("should create a player successfully", async () => {
      // Mock database responses
      MockedPlayer.findOne.mockResolvedValueOnce(null); // No existing player with ID
      MockedPlayer.findOne.mockResolvedValueOnce(null); // No existing player with shortname
      
      const mockSavedPlayer = {
        ...validPlayerData,
        _id: "mockObjectId",
        createdAt: new Date(),
        updatedAt: new Date(),
        toPublicJSON: jest.fn().mockReturnValue(validPlayerData),
        save: jest.fn().mockResolvedValue({
          ...validPlayerData,
          _id: "mockObjectId",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      };
      
      MockedPlayer.mockImplementation(() => mockSavedPlayer as any);

      const result = await PlayerService.createPlayer(validPlayerData);

      expect(MockedPlayer.findOne).toHaveBeenCalledTimes(2);
      expect(MockedPlayer.findOne).toHaveBeenCalledWith({ id: validPlayerData.id });
      expect(MockedPlayer.findOne).toHaveBeenCalledWith({ shortname: validPlayerData.shortname });
      expect(result).toMatchObject({
        _id: "mockObjectId",
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

    it("should throw error if player ID already exists", async () => {
      const existingPlayer = {
        id: 1,
        firstname: "Existing",
        lastname: "Player"
      };

      MockedPlayer.findOne.mockResolvedValueOnce(existingPlayer as any);

      await expect(PlayerService.createPlayer(validPlayerData))
        .rejects
        .toThrow("Un joueur avec l'ID 1 existe déjà");

      expect(MockedPlayer.findOne).toHaveBeenCalledWith({ id: validPlayerData.id });
    });

    it("should throw error if shortname already exists", async () => {
      const existingPlayer = {
        shortname: "R.FED",
        firstname: "Existing",
        lastname: "Player"
      };

      MockedPlayer.findOne
        .mockResolvedValueOnce(null) // No player with ID
        .mockResolvedValueOnce(existingPlayer as any); // Player with shortname exists

      await expect(PlayerService.createPlayer(validPlayerData))
        .rejects
        .toThrow("Un joueur avec le nom court R.FED existe déjà");

      expect(MockedPlayer.findOne).toHaveBeenCalledTimes(2);
    });
  });

  describe("getPlayerById", () => {
    it("should return player if found", async () => {
      const mockPlayer = {
        id: 1,
        firstname: "Roger",
        lastname: "Federer",
        data: { rank: 3 }
      };

      MockedPlayer.findOne.mockResolvedValue(mockPlayer as any);

      const result = await PlayerService.getPlayerById(1);

      expect(MockedPlayer.findOne).toHaveBeenCalledWith({ id: 1 });
      expect(result).toEqual(mockPlayer);
    });

    it("should return null if player not found", async () => {
      MockedPlayer.findOne.mockResolvedValue(null);

      const result = await PlayerService.getPlayerById(999);

      expect(MockedPlayer.findOne).toHaveBeenCalledWith({ id: 999 });
      expect(result).toBeNull();
    });

    it("should throw error if database error occurs", async () => {
      MockedPlayer.findOne.mockRejectedValue(new Error("Database error"));

      await expect(PlayerService.getPlayerById(1))
        .rejects
        .toThrow("Database error");
    });
  });

  describe("getSpecificStats - Real Calculations", () => {
    const mockPlayers = [
      {
        id: 1,
        firstname: "Rafael",
        lastname: "Nadal",
        country: { code: "ESP" },
        data: {
          weight: 85000, // 85kg
          height: 185,   // 185cm
          last: [1, 1, 1, 0, 0] // 3/5 wins = 60%
        }
      },
      {
        id: 2,
        firstname: "Roger",
        lastname: "Federer",
        country: { code: "SUI" },
        data: {
          weight: 85000, // 85kg
          height: 185,   // 185cm
          last: [1, 1, 0, 1, 1] // 4/5 wins = 80%
        }
      },
      {
        id: 3,
        firstname: "Serena",
        lastname: "Williams",
        country: { code: "USA" },
        data: {
          weight: 72000, // 72kg
          height: 175,   // 175cm
          last: [1, 1, 1, 1, 1] // 5/5 wins = 100%
        }
      }
    ];

    it("should calculate statistics correctly with real math", async () => {
      MockedPlayer.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockPlayers)
      } as any);

      const result = await PlayerService.getSpecificStats();

      // Vérifier le meilleur pays (calculs réels)
      expect(result.bestWinRateCountry.country).toBe("USA");
      expect(result.bestWinRateCountry.winRate).toBe(100);
      expect(result.bestWinRateCountry.wins).toBe(5);
      expect(result.bestWinRateCountry.totalMatches).toBe(5);
      expect(result.bestWinRateCountry.players).toEqual(["Serena Williams"]);

      // Vérifier l'IMC moyen (calculs réels)
      // Nadal: 85 / (1.85^2) = 24.84
      // Federer: 85 / (1.85^2) = 24.84  
      // Serena: 72 / (1.75^2) = 23.51
      // Moyenne: (24.84 + 24.84 + 23.51) / 3 = 24.40
      expect(result.averageIMC).toBeCloseTo(24.40, 1);

      // Vérifier la médiane des tailles (calculs réels)
      // Tailles triées: [175, 185, 185] -> médiane = 185
      expect(result.medianHeight).toBe(185);
      
      expect(result.totalPlayers).toBe(3);
      expect(result.calculatedAt).toEqual(expect.any(String));
    });

    it("should handle weight = 0 (division by zero) in mocked data", async () => {
      const playersWithZeroWeight = [
        {
          id: 1,
          firstname: "Invalid",
          lastname: "Player",
          country: { code: "TST" },
          data: {
            weight: 0, // Poids zéro
            height: 180,
            last: [1, 0, 0, 0, 0]
          }
        }
      ];

      MockedPlayer.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(playersWithZeroWeight)
      } as any);

      await expect(PlayerService.getSpecificStats())
        .rejects
        .toThrow("Aucun joueur avec des données valides pour calculer l'IMC");
    });

    it("should handle height = 0 (division by zero) in mocked data", async () => {
      const playersWithZeroHeight = [
        {
          id: 1,
          firstname: "Invalid",
          lastname: "Player",
          country: { code: "TST" },
          data: {
            weight: 80000,
            height: 0, // Taille zéro
            last: [1, 0, 0, 0, 0]
          }
        }
      ];

      MockedPlayer.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(playersWithZeroHeight)
      } as any);

      await expect(PlayerService.getSpecificStats())
        .rejects
        .toThrow("Aucun joueur avec des données valides pour calculer l'IMC");
    });

    it("should handle negative weight", async () => {
      const playersWithNegativeWeight = [
        {
          id: 1,
          firstname: "Invalid",
          lastname: "Player",
          country: { code: "TST" },
          data: {
            weight: -5000, // Poids négatif
            height: 180,
            last: [1, 0, 0, 0, 0]
          }
        }
      ];

      MockedPlayer.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(playersWithNegativeWeight)
      } as any);

      await expect(PlayerService.getSpecificStats())
        .rejects
        .toThrow("Aucun joueur avec des données valides pour calculer l'IMC");
    });

    it("should handle negative height", async () => {
      const playersWithNegativeHeight = [
        {
          id: 1,
          firstname: "Invalid",
          lastname: "Player",
          country: { code: "TST" },
          data: {
            weight: 80000,
            height: -180, // Taille négative
            last: [1, 0, 0, 0, 0]
          }
        }
      ];

      MockedPlayer.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(playersWithNegativeHeight)
      } as any);

      await expect(PlayerService.getSpecificStats())
        .rejects
        .toThrow("Aucun joueur avec des données valides pour calculer l'IMC");
    });

    it("should exclude invalid players and calculate with valid ones", async () => {
      const mixedPlayers = [
        {
          id: 1,
          firstname: "Valid",
          lastname: "Player",
          country: { code: "OK" },
          data: {
            weight: 80000, // 80kg
            height: 180,   // 180cm
            last: [1, 1, 1, 1, 1] // 100%
          }
        },
        {
          id: 2,
          firstname: "Invalid",
          lastname: "Weight",
          country: { code: "BAD" },
          data: {
            weight: 0, // Poids invalide
            height: 175,
            last: [0, 0, 0, 0, 0] // 0%
          }
        },
        {
          id: 3,
          firstname: "Invalid",
          lastname: "Height",
          country: { code: "BAD" },
          data: {
            weight: 70000,
            height: 0, // Taille invalide
            last: [1, 0, 1, 0, 1] // 60%
          }
        }
      ];

      MockedPlayer.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mixedPlayers)
      } as any);

      const result = await PlayerService.getSpecificStats();

      // Seul le joueur valide doit être pris en compte pour l'IMC
      // IMC = 80 / (1.8^2) = 24.69
      expect(result.averageIMC).toBeCloseTo(24.69, 1);
      
      // Mais tous les joueurs sont pris en compte pour les autres stats
      expect(result.totalPlayers).toBe(3);
      expect(result.bestWinRateCountry.country).toBe("OK"); // 100% > 60% > 0%
    });

    it("should calculate precise IMC values", async () => {
      const precisionPlayers = [
        {
          id: 1,
          firstname: "Test",
          lastname: "One",
          country: { code: "T1" },
          data: {
            weight: 70000, // 70kg
            height: 170,   // 170cm = 1.7m
            last: [1, 0, 0, 0, 0]
          }
        },
        {
          id: 2,
          firstname: "Test",
          lastname: "Two",
          country: { code: "T2" },
          data: {
            weight: 90000, // 90kg
            height: 190,   // 190cm = 1.9m
            last: [1, 0, 0, 0, 0]
          }
        }
      ];

      MockedPlayer.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(precisionPlayers)
      } as any);

      const result = await PlayerService.getSpecificStats();

      // IMC 1: 70 / (1.7^2) = 70 / 2.89 = 24.22
      // IMC 2: 90 / (1.9^2) = 90 / 3.61 = 24.93
      // Moyenne: (24.22 + 24.93) / 2 = 24.58
      expect(result.averageIMC).toBeCloseTo(24.58, 1);
    });

    it("should calculate win rates correctly for multiple countries", async () => {
      const multiCountryPlayers = [
        {
          id: 1, firstname: "Player", lastname: "ESP1", country: { code: "ESP" },
          data: { weight: 80000, height: 180, last: [1, 1, 0, 0, 0] } // 2/5 = 40%
        },
        {
          id: 2, firstname: "Player", lastname: "ESP2", country: { code: "ESP" },
          data: { weight: 80000, height: 180, last: [1, 1, 1, 0, 0] } // 3/5 = 60%
        },
        {
          id: 3, firstname: "Player", lastname: "FRA1", country: { code: "FRA" },
          data: { weight: 80000, height: 180, last: [1, 1, 1, 1, 0] } // 4/5 = 80%
        }
      ];

      MockedPlayer.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(multiCountryPlayers)
      } as any);

      const result = await PlayerService.getSpecificStats();

      // ESP: (2 + 3) victoires sur (5 + 5) matchs = 5/10 = 50%
      // FRA: 4 victoires sur 5 matchs = 4/5 = 80%
      // Meilleur: FRA avec 80%
      expect(result.bestWinRateCountry.country).toBe("FRA");
      expect(result.bestWinRateCountry.winRate).toBe(80);
      expect(result.bestWinRateCountry.wins).toBe(4);
      expect(result.bestWinRateCountry.totalMatches).toBe(5);
    });

    it("should calculate median correctly for different array sizes", async () => {
      // Test avec 4 joueurs (nombre pair)
      const evenPlayers = [
        { id: 1, firstname: "A", lastname: "A", country: { code: "A" }, 
          data: { weight: 80000, height: 170, last: [1, 0, 0, 0, 0] } },
        { id: 2, firstname: "B", lastname: "B", country: { code: "B" }, 
          data: { weight: 80000, height: 180, last: [1, 0, 0, 0, 0] } },
        { id: 3, firstname: "C", lastname: "C", country: { code: "C" }, 
          data: { weight: 80000, height: 190, last: [1, 0, 0, 0, 0] } },
        { id: 4, firstname: "D", lastname: "D", country: { code: "D" }, 
          data: { weight: 80000, height: 200, last: [1, 0, 0, 0, 0] } }
      ];

      MockedPlayer.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(evenPlayers)
      } as any);

      const result = await PlayerService.getSpecificStats();

      // Tailles triées: [170, 180, 190, 200]
      // Médiane (nombre pair): (180 + 190) / 2 = 185
      expect(result.medianHeight).toBe(185);
    });

    it("should handle tie in win rates correctly", async () => {
      const tiedPlayers = [
        {
          id: 1,
          firstname: "Player",
          lastname: "One",
          country: { code: "ESP" },
          data: {
            weight: 80000,
            height: 180,
            last: [1, 1, 0, 0, 0] // 2/5 = 40%
          }
        },
        {
          id: 2,
          firstname: "Player",
          lastname: "Two",
          country: { code: "USA" },
          data: {
            weight: 80000,
            height: 180,
            last: [1, 1, 0, 0, 0] // 2/5 = 40%
          }
        }
      ];

      MockedPlayer.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(tiedPlayers)
      } as any);

      const result = await PlayerService.getSpecificStats();

      // Should return one of the tied countries (first one processed)
      expect(result.bestWinRateCountry.winRate).toBe(40);
      expect(["ESP", "USA"]).toContain(result.bestWinRateCountry.country);
    });

    it("should calculate median correctly for even number of players", async () => {
      const evenPlayers = [
        { data: { height: 170, weight: 70000, last: [1, 0, 0, 0, 0] }, country: { code: "A" }, firstname: "A", lastname: "A" },
        { data: { height: 180, weight: 70000, last: [1, 0, 0, 0, 0] }, country: { code: "B" }, firstname: "B", lastname: "B" },
        { data: { height: 190, weight: 70000, last: [1, 0, 0, 0, 0] }, country: { code: "C" }, firstname: "C", lastname: "C" },
        { data: { height: 200, weight: 70000, last: [1, 0, 0, 0, 0] }, country: { code: "D" }, firstname: "D", lastname: "D" }
      ];

      MockedPlayer.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(evenPlayers)
      } as any);

      const result = await PlayerService.getSpecificStats();

      // Median of [170, 180, 190, 200] = (180 + 190) / 2 = 185
      expect(result.medianHeight).toBe(185);
    });

    it("should throw error if no players found", async () => {
      MockedPlayer.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([])
      } as any);

      await expect(PlayerService.getSpecificStats())
        .rejects
        .toThrow("Aucun joueur trouvé dans la base de données");
    });

    it("should handle database error", async () => {
      MockedPlayer.find.mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error("Database connection failed"))
      } as any);

      await expect(PlayerService.getSpecificStats())
        .rejects
        .toThrow("Database connection failed");
    });
  });

  describe("Statistics Edge Cases", () => {
    it("should handle single player statistics", async () => {
      const singlePlayer = [{
        id: 1,
        firstname: "Solo",
        lastname: "Player",
        country: { code: "SOLO" },
        data: {
          weight: 80000,
          height: 180,
          last: [1, 0, 1, 0, 1] // 3/5 = 60%
        }
      }];

      MockedPlayer.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(singlePlayer)
      } as any);

      const result = await PlayerService.getSpecificStats();

      expect(result.bestWinRateCountry.country).toBe("SOLO");
      expect(result.bestWinRateCountry.winRate).toBe(60);
      expect(result.medianHeight).toBe(180);
      expect(result.totalPlayers).toBe(1);
    });

    it("should handle players with zero wins", async () => {
      const zeroWinPlayers = [{
        id: 1,
        firstname: "Unlucky",
        lastname: "Player",
        country: { code: "LOSE" },
        data: {
          weight: 80000,
          height: 180,
          last: [0, 0, 0, 0, 0] // 0/5 = 0%
        }
      }];

      MockedPlayer.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(zeroWinPlayers)
      } as any);

      const result = await PlayerService.getSpecificStats();

      expect(result.bestWinRateCountry.winRate).toBe(0);
      expect(result.bestWinRateCountry.wins).toBe(0);
      expect(result.bestWinRateCountry.totalMatches).toBe(5);
    });

    it("should handle extreme weight and height values", async () => {
      const extremePlayers = [
        {
          id: 1,
          firstname: "Heavy",
          lastname: "Tall",
          country: { code: "BIG" },
          data: {
            weight: 200000, // 200kg (maximum)
            height: 250,    // 250cm (maximum)
            last: [1, 0, 0, 0, 0]
          }
        },
        {
          id: 2,
          firstname: "Light",
          lastname: "Short",
          country: { code: "SMALL" },
          data: {
            weight: 30000,  // 30kg (minimum)
            height: 140,    // 140cm (minimum)
            last: [1, 0, 0, 0, 0]
          }
        }
      ];

      MockedPlayer.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(extremePlayers)
      } as any);

      const result = await PlayerService.getSpecificStats();

      // Should handle extreme values without error
      expect(result.averageIMC).toBeGreaterThan(0);
      expect(result.medianHeight).toBe((250 + 140) / 2); // 195
      expect(result.totalPlayers).toBe(2);
    });
  });
});