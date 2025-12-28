import request from "supertest";
import app from "../src/app.js";

describe("Application", () => {
  describe("Routes API", () => {
    it("devrait retourner 404 pour une route inexistante", async () => {
      const response = await request(app)
        .get("/route-inexistante")
        .expect("Content-Type", /json/)
        .expect(404);

      expect(response.body).toHaveProperty("message", "Route non trouvée");
    });

    it("devrait retourner 400 pour un ID de joueur invalide", async () => {
      const response = await request(app)
        .get("/api/players/invalid-id")
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error", "Paramètres d'URL invalides");
    });

    it("devrait retourner 404 pour un joueur inexistant", async () => {
      const response = await request(app)
        .get("/api/players/999")
        .expect("Content-Type", /json/)
        .expect(404);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error", "Joueur non trouvé");
    });

    it("devrait retourner les statistiques des joueurs", async () => {
      const response = await request(app)
        .get("/api/players/stats")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("bestWinRateCountry");
      expect(response.body.data).toHaveProperty("averageIMC");
      expect(response.body.data).toHaveProperty("medianHeight");
    });
  });

  describe("Documentation API", () => {
    it("devrait servir la documentation Swagger", async () => {
      await request(app)
        .get("/api-docs/")
        .expect(200);
    });
  });

  describe("Sécurité", () => {
    it("devrait avoir les headers de sécurité", async () => {
      const response = await request(app).get("/api/players/stats");

      // Vérifier la présence des headers de sécurité (Helmet)
      expect(response.headers).toHaveProperty("x-content-type-options");
      expect(response.headers).toHaveProperty("x-frame-options");
    });

    it("devrait respecter les limites de rate limiting", async () => {
      // Test simple pour vérifier qu'une requête normale passe
      await request(app)
        .get("/api/players/stats")
        .expect(200);
    });
  });
});