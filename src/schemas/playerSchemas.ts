import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

// Extend Zod with OpenAPI
extendZodWithOpenApi(z);

// Schéma pour les données du pays
export const CountrySchema = z
  .object({
    picture: z.string().url().describe("URL de l'image du drapeau du pays"),
    code: z.string().min(2).max(3).toUpperCase().describe("Code du pays (ISO)"),
  })
  .openapi({
    title: "Country",
    description: "Informations sur le pays du joueur",
  });

// Schéma pour les données statistiques du joueur
export const PlayerDataSchema = z
  .object({
    rank: z.number().min(1).describe("Classement mondial du joueur"),
    points: z.number().min(0).describe("Points ATP/WTA du joueur"),
    weight: z
      .number()
      .min(30000)
      .max(200000)
      .describe("Poids du joueur en grammes"),
    height: z
      .number()
      .min(140)
      .max(250)
      .describe("Taille du joueur en centimètres"),
    age: z.number().min(16).max(50).describe("Âge du joueur"),
    last: z
      .array(z.number().min(0).max(1))
      .length(5)
      .describe("5 derniers résultats (1=victoire, 0=défaite)"),
  })
  .openapi({
    title: "PlayerData",
    description: "Données statistiques du joueur",
  });

// Schéma de base pour un joueur
export const PlayerSchema = z
  .object({
    id: z.number().min(1).describe("Identifiant unique du joueur"),
    firstname: z.string().min(2).max(50).describe("Prénom du joueur"),
    lastname: z.string().min(2).max(50).describe("Nom de famille du joueur"),
    shortname: z
      .string()
      .regex(/^[A-Z]\.[A-Z]{2,4}$/)
      .describe("Nom court du joueur (ex: R.NAD)"),
    sex: z.enum(["M", "F"]).describe("Sexe du joueur (M=Masculin, F=Féminin)"),
    country: CountrySchema.describe("Informations sur le pays du joueur"),
    picture: z.string().url().describe("URL de la photo du joueur"),
    data: PlayerDataSchema.describe("Données statistiques du joueur"),
    createdAt: z.string().datetime().describe("Date de création"),
    updatedAt: z.string().datetime().describe("Date de dernière modification"),
  })
  .openapi({
    title: "Player",
    description: "Joueur de tennis avec toutes ses informations",
  });

// Schema for creating a player
export const CreatePlayerSchema = z
  .object({
    id: z
      .number()
      .min(1, "L'ID doit être supérieur à 0")
      .describe("Identifiant unique du joueur"),
    firstname: z
      .string()
      .min(2, "Le prénom doit contenir au moins 2 caractères")
      .max(50, "Le prénom ne peut pas dépasser 50 caractères")
      .trim()
      .describe("Prénom du joueur"),
    lastname: z
      .string()
      .min(2, "Le nom de famille doit contenir au moins 2 caractères")
      .max(50, "Le nom de famille ne peut pas dépasser 50 caractères")
      .trim()
      .describe("Nom de famille du joueur"),
    shortname: z
      .string()
      .regex(/^[A-Z]\.[A-Z]{2,4}$/, "Le format doit être X.XXX (ex: R.NAD)")
      .describe("Nom court du joueur"),
    sex: z
      .enum(["M", "F"], {
        message: "Le sexe doit être 'M' ou 'F'",
      })
      .describe("Sexe du joueur"),
    country: z
      .object({
        picture: z.string().url("L'URL de l'image doit être valide"),
        code: z.string().min(2).max(3).toUpperCase(),
      })
      .describe("Informations sur le pays"),
    picture: z
      .string()
      .url("L'URL de l'image doit être valide")
      .describe("Photo du joueur"),
    data: z
      .object({
        rank: z.number().min(1, "Le classement doit être supérieur à 0"),
        points: z.number().min(0, "Les points ne peuvent pas être négatifs"),
        weight: z
          .number()
          .min(30000, "Le poids minimum est 30kg")
          .max(200000, "Le poids maximum est 200kg"),
        height: z
          .number()
          .min(140, "La taille minimum est 140cm")
          .max(250, "La taille maximum est 250cm"),
        age: z
          .number()
          .min(16, "L'âge minimum est 16 ans")
          .max(50, "L'âge maximum est 50 ans"),
        last: z
          .array(z.number().min(0).max(1))
          .length(5, "Exactement 5 résultats requis"),
      })
      .describe("Données statistiques"),
  })
  .openapi({
    title: "CreatePlayer",
    description: "Required data to create a new player",
  });

// Schema for updating a player
export const UpdatePlayerSchema = z.object({
  firstname: z
    .string()
    .min(2, "Le prénom doit contenir au moins 2 caractères")
    .max(50, "Le prénom ne peut pas dépasser 50 caractères")
    .trim()
    .optional()
    .describe("Prénom du joueur"),
  lastname: z
    .string()
    .min(2, "Le nom de famille doit contenir au moins 2 caractères")
    .max(50, "Le nom de famille ne peut pas dépasser 50 caractères")
    .trim()
    .optional()
    .describe("Nom de famille du joueur"),
  shortname: z
    .string()
    .regex(/^[A-Z]\.[A-Z]{2,4}$/, "Le format doit être X.XXX (ex: R.NAD)")
    .optional()
    .describe("Nom court du joueur"),
  sex: z.enum(["M", "F"]).optional().describe("Sexe du joueur"),
  country: z
    .object({
      picture: z.string().url("L'URL de l'image doit être valide"),
      code: z.string().min(2).max(3).toUpperCase(),
    })
    .optional()
    .describe("Informations sur le pays"),
  picture: z
    .string()
    .url("L'URL de l'image doit être valide")
    .optional()
    .describe("Photo du joueur"),
  data: z
    .object({
      rank: z
        .number()
        .min(1, "Le classement doit être supérieur à 0")
        .optional(),
      points: z
        .number()
        .min(0, "Les points ne peuvent pas être négatifs")
        .optional(),
      weight: z
        .number()
        .min(30000, "Le poids minimum est 30kg")
        .max(200000, "Le poids maximum est 200kg")
        .optional(),
      height: z
        .number()
        .min(140, "La taille minimum est 140cm")
        .max(250, "La taille maximum est 250cm")
        .optional(),
      age: z
        .number()
        .min(16, "L'âge minimum est 16 ans")
        .max(50, "L'âge maximum est 50 ans")
        .optional(),
      last: z
        .array(z.number().min(0).max(1))
        .length(5, "Exactement 5 résultats requis")
        .optional(),
    })
    .optional()
    .describe("Données statistiques"),
});

// Schéma pour les paramètres de requête
export const PlayerQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, "La page doit être supérieure à 0")
    .describe("Numéro de page pour la pagination"),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine(
      (val) => val > 0 && val <= 100,
      "La limite doit être entre 1 et 100"
    )
    .describe("Nombre d'éléments par page"),
  sex: z.enum(["M", "F"]).optional().describe("Filtrer par sexe"),
  country: z
    .string()
    .optional()
    .transform((val) => (val ? val.toUpperCase() : undefined))
    .refine(
      (val) => !val || (val.length >= 2 && val.length <= 3),
      "Le code pays doit contenir entre 2 et 3 caractères"
    )
    .describe("Filtrer par code pays"),
  search: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length >= 1,
      "Le terme de recherche doit contenir au moins 1 caractère"
    )
    .describe("Terme de recherche pour le nom ou prénom"),
  sortBy: z
    .enum(["rank", "points", "age", "firstname", "lastname"])
    .optional()
    .default("rank")
    .describe("Champ de tri"),
  sortOrder: z
    .enum(["asc", "desc"])
    .optional()
    .default("asc")
    .describe("Ordre de tri"),
});

// Schéma pour les paramètres d'URL
export const PlayerParamsSchema = z
  .object({
    id: z
      .string()
      .min(1, "L'ID est requis")
      .refine(
        (val) => /^\d+$/.test(val),
        "L'ID doit être un nombre entier positif"
      )
      .transform((val) => parseInt(val, 10))
      .refine(
        (val) => !isNaN(val) && val > 0,
        "L'ID doit être un nombre positif"
      )
      .describe("Identifiant du joueur"),
  })
  .openapi({
    title: "PlayerParams",
    description: "Paramètres d'URL pour identifier un joueur",
  });

// Schémas de réponse
export const PlayerResponseSchema = z
  .object({
    success: z.boolean().describe("Statut de la réponse"),
    data: PlayerSchema.describe("Données du joueur"),
    message: z.string().optional().describe("Message de réponse"),
  })
  .openapi({
    title: "PlayerResponse",
    description: "Réponse contenant les données d'un joueur",
  });

export const PlayersListResponseSchema = z.object({
  success: z.boolean().describe("Statut de la réponse"),
  data: z
    .object({
      players: z.array(PlayerSchema).describe("Liste des joueurs"),
      pagination: z
        .object({
          page: z.number().describe("Page actuelle"),
          limit: z.number().describe("Nombre d'éléments par page"),
          total: z.number().describe("Nombre total de joueurs"),
          totalPages: z.number().describe("Nombre total de pages"),
          hasNext: z.boolean().describe("Y a-t-il une page suivante"),
          hasPrev: z.boolean().describe("Y a-t-il une page précédente"),
        })
        .describe("Informations de pagination"),
    })
    .describe("Données de la réponse"),
  message: z.string().optional().describe("Message de réponse"),
});

export const PlayerStatsResponseSchema = z.object({
  success: z.boolean().describe("Statut de la réponse"),
  data: z
    .object({
      total: z.number().describe("Nombre total de joueurs"),
      men: z.number().describe("Nombre de joueurs masculins"),
      women: z.number().describe("Nombre de joueuses féminines"),
      countries: z.number().describe("Nombre de pays représentés"),
      averageAge: z.number().describe("Âge moyen des joueurs"),
      averageRank: z.number().describe("Classement moyen"),
      topRanked: PlayerSchema.optional().describe("Joueur le mieux classé"),
    })
    .describe("Statistiques des joueurs"),
  message: z.string().optional().describe("Message de réponse"),
});

// Types TypeScript dérivés des schémas Zod
export type Country = z.infer<typeof CountrySchema>;
export type PlayerData = z.infer<typeof PlayerDataSchema>;
export type Player = z.infer<typeof PlayerSchema>;
export type CreatePlayer = z.infer<typeof CreatePlayerSchema>;
export type UpdatePlayer = z.infer<typeof UpdatePlayerSchema>;
export type PlayerQuery = z.infer<typeof PlayerQuerySchema>;
export type PlayerParams = z.infer<typeof PlayerParamsSchema>;
export type PlayerResponse = z.infer<typeof PlayerResponseSchema>;
export type PlayersListResponse = z.infer<typeof PlayersListResponseSchema>;
export type PlayerStatsResponse = z.infer<typeof PlayerStatsResponseSchema>;
