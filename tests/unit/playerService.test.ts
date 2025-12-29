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

  describe("getSpecificStats", () => {
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

    it("should calculate statistics correctly", async () => {
      MockedPlayer.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockPlayers)
      } as any);

      const result = await PlayerService.getSpecificStats();

      expect(result).toMatchObject({
        bestWinRateCountry: {
          country: "USA",
          winRate: 100,
          wins: 5,
          totalMatches: 5,
          players: ["Serena Williams"]
        },
        totalPlayers: 3,
        medianHeight: 185, // Median of [175, 185, 185]
        calculatedAt: expect.any(String)
      });

      // Check IMC calculation
      // Player 1: 85 / (1.85^2) = 24.84
      // Player 2: 85 / (1.85^2) = 24.84  
      // Player 3: 72 / (1.75^2) = 23.51
      // Average: (24.84 + 24.84 + 23.51) / 3 = 24.40
      expect(result.averageIMC).toBeCloseTo(24.40, 1);
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