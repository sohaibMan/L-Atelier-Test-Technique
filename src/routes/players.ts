import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { PlayerService } from "../services/playerService.js";
import {
  PlayerParamsSchema,
  CreatePlayerSchema,
} from "../schemas/playerSchemas.js";
import logger from "../config/logger.js";

const router = Router();

// Middleware de validation pour les paramètres
const validateParams = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.params);
      req.params = parsed as any;
      next();
    } catch (error: unknown) {
      const zodError = error as z.ZodError;
      logger.warn("Erreur de validation des paramètres d'URL", {
        path: req.path,
        method: req.method,
        errors: zodError.issues,
      });
      res.status(400).json({
        success: false,
        error: "Paramètres d'URL invalides",
        details: zodError.issues,
      });
    }
  };
};

// Middleware de validation pour le body
const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error: unknown) {
      const zodError = error as z.ZodError;
      logger.warn("Erreur de validation du body", {
        path: req.path,
        method: req.method,
        errors: zodError.issues,
      });
      res.status(400).json({
        success: false,
        error: "Données invalides",
        details: zodError.issues,
      });
    }
  };
};

/**
 * @openapi
 * /api/players/stats:
 *   get:
 *     summary: Récupérer les statistiques spécifiques des joueurs
 *     description: Retourne les statistiques suivantes - Pays avec le meilleur ratio de victoires, IMC moyen, médiane des tailles
 *     tags: [Players]
 *     responses:
 *       200:
 *         description: Statistiques calculées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     bestWinRateCountry:
 *                       type: object
 *                       properties:
 *                         country:
 *                           type: string
 *                           example: "ESP"
 *                         winRate:
 *                           type: number
 *                           example: 60.0
 *                         wins:
 *                           type: integer
 *                           example: 3
 *                         totalMatches:
 *                           type: integer
 *                           example: 5
 *                         players:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["Rafael Nadal"]
 *                     averageIMC:
 *                       type: number
 *                       example: 23.45
 *                       description: "IMC moyen de tous les joueurs"
 *                     medianHeight:
 *                       type: number
 *                       example: 185
 *                       description: "Médiane de la taille des joueurs en cm"
 *                     totalPlayers:
 *                       type: integer
 *                       example: 5
 *                     calculatedAt:
 *                       type: string
 *                       format: date-time
 *                 message:
 *                   type: string
 *                   example: "Statistiques calculées avec succès"
 *       500:
 *         description: Erreur interne du serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Erreur lors du calcul des statistiques"
 */
router.get("/stats", async (req: Request, res: Response) => {
  try {
    logger.info("Calcul des statistiques spécifiques demandé");

    const stats = await PlayerService.getSpecificStats();

    logger.info("Statistiques spécifiques calculées avec succès", {
      bestCountry: stats.bestWinRateCountry.country,
      winRate: stats.bestWinRateCountry.winRate,
      averageIMC: stats.averageIMC,
      medianHeight: stats.medianHeight,
    });

    res.json({
      success: true,
      data: stats,
      message: "Statistiques calculées avec succès",
    });
  } catch (error) {
    logger.error("Erreur lors du calcul des statistiques", {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      success: false,
      error: "Erreur lors du calcul des statistiques",
    });
  }
});

/**
 * @openapi
 * /api/players:
 *   post:
 *     summary: Créer un nouveau joueur
 *     description: Ajoute un nouveau joueur de tennis dans la base de données
 *     tags: [Players]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - firstname
 *               - lastname
 *               - shortname
 *               - sex
 *               - country
 *               - picture
 *               - data
 *             properties:
 *               id:
 *                 type: integer
 *                 description: Identifiant unique du joueur
 *                 example: 123
 *               firstname:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 description: Prénom du joueur
 *                 example: "Roger"
 *               lastname:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 description: Nom de famille du joueur
 *                 example: "Federer"
 *               shortname:
 *                 type: string
 *                 pattern: "^[A-Z]\\.[A-Z]{2,4}$"
 *                 description: Nom court du joueur (format X.XXX)
 *                 example: "R.FED"
 *               sex:
 *                 type: string
 *                 enum: [M, F]
 *                 description: Sexe du joueur (M=Masculin, F=Féminin)
 *                 example: "M"
 *               country:
 *                 type: object
 *                 required:
 *                   - picture
 *                   - code
 *                 properties:
 *                   picture:
 *                     type: string
 *                     format: uri
 *                     description: URL de l'image du drapeau
 *                     example: "https://tenisu.latelier.co/resources/Suisse.png"
 *                   code:
 *                     type: string
 *                     minLength: 2
 *                     maxLength: 3
 *                     description: Code du pays (ISO)
 *                     example: "SUI"
 *               picture:
 *                 type: string
 *                 format: uri
 *                 description: URL de la photo du joueur
 *                 example: "https://tenisu.latelier.co/resources/Federer.png"
 *               data:
 *                 type: object
 *                 required:
 *                   - rank
 *                   - points
 *                   - weight
 *                   - height
 *                   - age
 *                   - last
 *                 properties:
 *                   rank:
 *                     type: integer
 *                     minimum: 1
 *                     description: Classement mondial
 *                     example: 3
 *                   points:
 *                     type: integer
 *                     minimum: 0
 *                     description: Points ATP/WTA
 *                     example: 2500
 *                   weight:
 *                     type: integer
 *                     minimum: 30000
 *                     maximum: 200000
 *                     description: Poids en grammes
 *                     example: 85000
 *                   height:
 *                     type: integer
 *                     minimum: 140
 *                     maximum: 250
 *                     description: Taille en centimètres
 *                     example: 185
 *                   age:
 *                     type: integer
 *                     minimum: 16
 *                     maximum: 50
 *                     description: Âge du joueur
 *                     example: 35
 *                   last:
 *                     type: array
 *                     items:
 *                       type: integer
 *                       minimum: 0
 *                       maximum: 1
 *                     minItems: 5
 *                     maxItems: 5
 *                     description: 5 derniers résultats (1=victoire, 0=défaite)
 *                     example: [1, 1, 0, 1, 1]
 *     responses:
 *       201:
 *         description: Joueur créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Player'
 *                 message:
 *                   type: string
 *                   example: "Joueur créé avec succès"
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Données invalides"
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *       409:
 *         description: Conflit - ID ou nom court déjà utilisé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Un joueur avec l'ID 123 existe déjà"
 *       500:
 *         description: Erreur interne du serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Erreur lors de la création du joueur"
 */
router.post(
  "/",
  validateBody(CreatePlayerSchema),
  async (req: Request, res: Response) => {
    try {
      logger.info("Demande de création d'un nouveau joueur", {
        id: req.body.id,
        name: `${req.body.firstname} ${req.body.lastname}`,
        country: req.body.country.code,
      });

      const player = await PlayerService.createPlayer(req.body);

      logger.info("Joueur créé avec succès", {
        id: player.id,
        name: `${player.firstname} ${player.lastname}`,
        rank: player.data.rank,
      });

      res.status(201).json({
        success: true,
        data: player.toPublicJSON(),
        message: "Joueur créé avec succès",
      });
    } catch (error: any) {
      logger.error("Erreur lors de la création du joueur", {
        error: error.message,
        body: {
          id: req.body.id,
          name: `${req.body.firstname} ${req.body.lastname}`,
          country: req.body.country?.code,
        },
      });

      // Gestion des erreurs spécifiques
      if (error.message.includes("existe déjà")) {
        return res.status(409).json({
          success: false,
          error: error.message,
        });
      }

      // Gestion des erreurs de validation MongoDB
      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          error: "Erreur de validation des données",
          details: Object.values(error.errors).map((err: any) => ({
            field: err.path,
            message: err.message,
          })),
        });
      }

      // Gestion des erreurs de duplication MongoDB (index unique)
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(409).json({
          success: false,
          error: `La valeur du champ '${field}' est déjà utilisée`,
        });
      }

      res.status(500).json({
        success: false,
        error: "Erreur lors de la création du joueur",
      });
    }
  }
);

/**
 * @openapi
 * /api/players/{id}:
 *   get:
 *     summary: Récupérer un joueur par ID
 *     description: Récupère les informations complètes d'un joueur de tennis grâce à son ID
 *     tags: [Players]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID unique du joueur
 *         example: 17
 *     responses:
 *       200:
 *         description: Joueur trouvé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 17
 *                     firstname:
 *                       type: string
 *                       example: "Rafael"
 *                     lastname:
 *                       type: string
 *                       example: "Nadal"
 *                     shortname:
 *                       type: string
 *                       example: "R.NAD"
 *                     sex:
 *                       type: string
 *                       enum: [M, F]
 *                       example: "M"
 *                     country:
 *                       type: object
 *                       properties:
 *                         picture:
 *                           type: string
 *                           format: uri
 *                           example: "https://tenisu.latelier.co/resources/Espagne.png"
 *                         code:
 *                           type: string
 *                           example: "ESP"
 *                     picture:
 *                       type: string
 *                       format: uri
 *                       example: "https://tenisu.latelier.co/resources/Nadal.png"
 *                     data:
 *                       type: object
 *                       properties:
 *                         rank:
 *                           type: integer
 *                           example: 1
 *                         points:
 *                           type: integer
 *                           example: 1982
 *                         weight:
 *                           type: integer
 *                           example: 85000
 *                         height:
 *                           type: integer
 *                           example: 185
 *                         age:
 *                           type: integer
 *                           example: 33
 *                         last:
 *                           type: array
 *                           items:
 *                             type: integer
 *                             minimum: 0
 *                             maximum: 1
 *                           example: [1, 0, 0, 0, 1]
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                 message:
 *                   type: string
 *                   example: "Joueur récupéré avec succès"
 *       400:
 *         description: ID invalide
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Paramètres d'URL invalides"
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Joueur non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Joueur non trouvé"
 *       500:
 *         description: Erreur interne du serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Erreur lors de la récupération du joueur"
 */
router.get(
  "/:id",
  validateParams(PlayerParamsSchema),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id!, 10);

      logger.info("Récupération des informations du joueur", { id });

      const player = await PlayerService.getPlayerById(id);

      if (!player) {
        logger.warn("Joueur non trouvé", { id });
        return res.status(404).json({
          success: false,
          error: "Joueur non trouvé",
        });
      }

      logger.info("Joueur récupéré avec succès", {
        id: player.id,
        name: `${player.firstname} ${player.lastname}`,
        rank: player.data.rank,
      });

      res.json({
        success: true,
        data: player.toPublicJSON(),
        message: "Joueur récupéré avec succès",
      });
    } catch (error) {
      logger.error("Erreur lors de la récupération du joueur", {
        error: error instanceof Error ? error.message : String(error),
        id: req.params.id,
      });

      res.status(500).json({
        success: false,
        error: "Erreur lors de la récupération du joueur",
      });
    }
  }
);

export default router;
