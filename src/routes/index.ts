import express from "express";
import playerRoutes from "./players.js";

const router = express.Router();

// Routes joueurs de tennis
router.use("/api/players", playerRoutes);

export default router;
