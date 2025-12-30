import { Player } from "../models/Player.js";
import type { IPlayer } from "../models/Player.js";
import logger from "../config/logger.js";

export interface CreatePlayerData {
  id: number;
  firstname: string;
  lastname: string;
  shortname: string;
  sex: "M" | "F";
  country: {
    picture: string;
    code: string;
  };
  picture: string;
  data: {
    rank: number;
    points: number;
    weight: number;
    height: number;
    age: number;
    last: number[];
  };
}

export class PlayerService {
  /**
   * Create a new player
   */
  static async createPlayer(playerData: CreatePlayerData): Promise<IPlayer> {
    try {
      logger.info("Création d'un nouveau joueur", {
        id: playerData.id,
        name: `${playerData.firstname} ${playerData.lastname}`,
        country: playerData.country.code,
      });

      // Vérifier si l'ID existe déjà
      const existingPlayer = await Player.findOne({ id: playerData.id });
      if (existingPlayer) {
        logger.warn("Tentative de création d'un joueur avec un ID existant", {
          id: playerData.id,
          existingPlayer: `${existingPlayer.firstname} ${existingPlayer.lastname}`,
        });
        throw new Error(`Un joueur avec l'ID ${playerData.id} existe déjà`);
      }

      // Vérifier si le shortname existe déjà
      const existingShortname = await Player.findOne({
        shortname: playerData.shortname,
      });
      if (existingShortname) {
        logger.warn(
          "Tentative de création d'un joueur avec un shortname existant",
          {
            shortname: playerData.shortname,
            existingPlayer: `${existingShortname.firstname} ${existingShortname.lastname}`,
          }
        );
        throw new Error(
          `Un joueur avec le nom court ${playerData.shortname} existe déjà`
        );
      }

      const player = new Player(playerData);
      const savedPlayer = await player.save();

      logger.info("Joueur créé avec succès", {
        id: savedPlayer.id,
        name: `${savedPlayer.firstname} ${savedPlayer.lastname}`,
        rank: savedPlayer.data.rank,
        country: savedPlayer.country.code,
      });

      return savedPlayer;
    } catch (error) {
      logger.error("Erreur lors de la création du joueur", {
        error: error instanceof Error ? error.message : String(error),
        playerData: {
          id: playerData.id,
          name: `${playerData.firstname} ${playerData.lastname}`,
          country: playerData.country.code,
        },
      });
      throw error;
    }
  }

  /**
   * Get all players sorted by ranking (best to worst)
   */
  static async getAllPlayersSorted(): Promise<IPlayer[]> {
    try {
      logger.debug("Récupération de tous les joueurs triés par classement");

      const players = await Player.find({}).sort({ "data.rank": 1 }); // Tri ascendant (rank 1 = meilleur)

      logger.info("Joueurs récupérés et triés avec succès", {
        count: players.length,
        bestRank: players.length > 0 ? players[0]?.data.rank : null,
        worstRank:
          players.length > 0 ? players[players.length - 1]?.data.rank : null,
      });

      return players;
    } catch (error) {
      logger.error("Erreur lors de la récupération des joueurs triés", {
        error: error instanceof Error ? error.message : String(error),
      });

      // If it's a database connection timeout, return empty array instead of throwing
      if (
        error instanceof Error &&
        error.message.includes("buffering timed out")
      ) {
        logger.warn("Database connection timeout, returning empty array");
        return [];
      }

      throw error;
    }
  }

  /**
   * Get player by ID
   */
  static async getPlayerById(id: number): Promise<IPlayer | null> {
    try {
      logger.debug("Recherche joueur par ID", { id });

      const player = await Player.findOne({ id });

      if (!player) {
        logger.warn("Joueur non trouvé", { id });
        return null;
      }

      logger.info("Joueur trouvé", {
        id: player.id,
        name: `${player.firstname} ${player.lastname}`,
        rank: player.data.rank,
      });

      return player;
    } catch (error) {
      logger.error("Erreur lors de la recherche du joueur", {
        error: error instanceof Error ? error.message : String(error),
        id,
      });

      // If it's a database connection timeout, return null instead of throwing
      if (
        error instanceof Error &&
        error.message.includes("buffering timed out")
      ) {
        logger.warn("Database connection timeout, returning null", { id });
        return null;
      }

      throw error;
    }
  }

  /**
   * Get specific statistics as requested
   */
  static async getSpecificStats() {
    try {
      logger.debug("Getting specific statistics");

      // Get all players for calculations
      const players = await Player.find({}).lean();

      if (players.length === 0) {
        throw new Error("Aucun joueur trouvé dans la base de données");
      }

      // 1. Calculer le ratio de parties gagnées par pays
      const countryStats: {
        [key: string]: { wins: number; total: number; players: string[] };
      } = {};

      players.forEach((player) => {
        const countryCode = player.country.code;
        const wins = player.data.last.reduce((sum, result) => sum + result, 0);
        const total = player.data.last.length;

        if (!countryStats[countryCode]) {
          countryStats[countryCode] = { wins: 0, total: 0, players: [] };
        }

        countryStats[countryCode].wins += wins;
        countryStats[countryCode].total += total;
        countryStats[countryCode].players.push(
          `${player.firstname} ${player.lastname}`
        );
      });

      // Trouver le pays avec le meilleur ratio
      let bestCountry = {
        code: "",
        ratio: 0,
        wins: 0,
        total: 0,
        players: [] as string[],
      };

      Object.entries(countryStats).forEach(([countryCode, stats]) => {
        const ratio = stats.total > 0 ? (stats.wins / stats.total) * 100 : 0;
        if (
          ratio > bestCountry.ratio ||
          (ratio === bestCountry.ratio && bestCountry.code === "")
        ) {
          bestCountry = {
            code: countryCode,
            ratio: Math.round(ratio * 100) / 100, // Arrondir à 2 décimales
            wins: stats.wins,
            total: stats.total,
            players: stats.players,
          };
        }
      });

      // 2. Calculer l'IMC moyen de tous les joueurs
      // IMC = poids (kg) / (taille (m))²
      const imcValues = players
        .map((player) => {
          const weightKg = player.data.weight / 1000; // Convertir grammes en kg
          const heightM = player.data.height / 100; // Convertir cm en m

          // Vérifier les divisions par zéro
          if (weightKg <= 0) {
            logger.warn("Poids invalide détecté", {
              playerId: player.id,
              playerName: `${player.firstname} ${player.lastname}`,
              weight: player.data.weight,
            });
            return null; // Exclure ce joueur du calcul
          }

          if (heightM <= 0) {
            logger.warn("Taille invalide détectée", {
              playerId: player.id,
              playerName: `${player.firstname} ${player.lastname}`,
              height: player.data.height,
            });
            return null; // Exclure ce joueur du calcul
          }

          return weightKg / (heightM * heightM);
        })
        .filter((imc): imc is number => imc !== null); // Filtrer les valeurs nulles

      if (imcValues.length === 0) {
        throw new Error(
          "Aucun joueur avec des données valides pour calculer l'IMC"
        );
      }

      const averageIMC =
        imcValues.reduce((sum, imc) => sum + imc, 0) / imcValues.length;

      // 3. Calculer la médiane de la taille des joueurs
      const heights = players
        .map((player) => player.data.height)
        .sort((a, b) => a - b);
      let medianHeight: number;

      if (heights.length % 2 === 0) {
        // Nombre pair d'éléments : moyenne des deux éléments du milieu
        const mid1 = heights[heights.length / 2 - 1];
        const mid2 = heights[heights.length / 2];
        if (mid1 !== undefined && mid2 !== undefined) {
          medianHeight = (mid1 + mid2) / 2;
        } else {
          medianHeight = 0;
        }
      } else {
        // Nombre impair d'éléments : élément du milieu
        const midValue = heights[Math.floor(heights.length / 2)];
        medianHeight = midValue !== undefined ? midValue : 0;
      }

      const stats = {
        bestWinRateCountry: {
          country: bestCountry.code,
          winRate: bestCountry.ratio,
          wins: bestCountry.wins,
          totalMatches: bestCountry.total,
          players: bestCountry.players,
        },
        averageIMC: Math.round(averageIMC * 100) / 100, // Arrondir à 2 décimales
        medianHeight: medianHeight,
        totalPlayers: players.length,
        calculatedAt: new Date().toISOString(),
      };

      logger.info("Statistiques spécifiques calculées", {
        bestCountry: bestCountry.code,
        winRate: bestCountry.ratio,
        averageIMC: stats.averageIMC,
        medianHeight: stats.medianHeight,
        totalPlayers: stats.totalPlayers,
      });

      return stats;
    } catch (error) {
      logger.error("Erreur lors du calcul des statistiques spécifiques", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

export default PlayerService;
