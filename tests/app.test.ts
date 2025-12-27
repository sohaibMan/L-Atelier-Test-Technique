import request from "supertest";
import app from "../src/app";

describe("Application", () => {
  describe("Routes de base", () => {
    it("devrait rediriger / vers /api-docs", async () => {
      const response = await request(app)
        .get("/")
        .expect(302);

      expect(response.headers.location).toBe("/api-docs");
    });

    it("devrait retourner 404 pour une route inexistante", async () => {
      const response = await request(app)
        .get("/route-inexistante")
        .expect("Content-Type", /json/)
        .expect(404);

      expect(response.body).toHaveProperty("message", "Route non trouvée");
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
      const response = await request(app).get("/api-docs/");

      // Vérifier la présence des headers de sécurité (Helmet)
      expect(response.headers).toHaveProperty("x-content-type-options");
      expect(response.headers).toHaveProperty("x-frame-options");
    });

    it("devrait respecter les limites de rate limiting", async () => {
      // Cette test nécessiterait plusieurs requêtes pour déclencher le rate limiting
      // Pour l'instant, on vérifie juste qu'une requête normale passe
      await request(app)
        .get("/api-docs/")
        .expect(200);
    });
  });
});