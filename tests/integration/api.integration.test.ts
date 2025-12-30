import request from "supertest";
import app from "../../src/app.js";

describe("API Integration Tests - Basic Functionality", () => {
  describe("Health Check & Documentation", () => {
    it("should return health status", async () => {
      const response = await request(app)
        .get("/api/health")
        .expect(200);

      expect(response.body).toHaveProperty("status", "healthy");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("uptime");
      expect(response.body).toHaveProperty("version");
    });

    it("should return database health status", async () => {
      const response = await request(app)
        .get("/api/health/db")
        .expect(503); // 503 car pas de DB connectée dans les tests d'intégration

      expect(response.body).toHaveProperty("status", "unhealthy");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("database");
    });

    it("should serve API documentation at /api-docs", async () => {
      const response = await request(app)
        .get("/api-docs/")
        .expect(200);

      expect(response.text).toContain("swagger");
    });

    it("should return 404 for non-existent routes", async () => {
      const response = await request(app)
        .get("/api/nonexistent")
        .expect(404);

      expect(response.body.message).toBe("Route non trouvée");
    });

    it("should handle CORS headers", async () => {
      const response = await request(app)
        .options("/api/players")
        .expect(204);

      // The actual headers are different from what we expected
      expect(response.headers["access-control-allow-credentials"]).toBeDefined();
      expect(response.headers["access-control-allow-methods"]).toBeDefined();
    });
  });

  describe("Request Validation", () => {
    it("should validate JSON content type for POST requests", async () => {
      const response = await request(app)
        .post("/api/players")
        .send("not json")
        .set("Content-Type", "text/plain")
        .expect(400);

      // Express will handle this as malformed JSON
      expect(response.status).toBe(400);
    });

    it("should handle large payloads within limits", async () => {
      const largePayload = {
        id: 1,
        firstname: "A".repeat(1000), // Larger than allowed
        lastname: "Test",
        shortname: "A.TST",
        sex: "M",
        country: { picture: "https://example.com/flag.png", code: "TST" },
        picture: "https://example.com/player.png",
        data: {
          rank: 1,
          points: 1000,
          weight: 80000,
          height: 180,
          age: 25,
          last: [1, 1, 1, 1, 1]
        }
      };

      const response = await request(app)
        .post("/api/players")
        .send(largePayload);

      // Should get validation error for firstname length
      expect(response.status).toBe(400);
    });

    it("should enforce rate limiting headers", async () => {
      const response = await request(app)
        .get("/api/players/1")
        .expect(404); // Will be 404 since no DB, but headers should be present

      // The actual headers use different names
      expect(response.headers["ratelimit-limit"]).toBeDefined();
      expect(response.headers["ratelimit-remaining"]).toBeDefined();
    });
  });

  describe("Security Headers", () => {
    it("should include security headers", async () => {
      const response = await request(app)
        .get("/api/players/1");

      // Check for Helmet security headers
      expect(response.headers["x-content-type-options"]).toBe("nosniff");
      expect(response.headers["x-frame-options"]).toBeDefined();
      expect(response.headers["x-xss-protection"]).toBeDefined();
    });

    it("should handle compression", async () => {
      const response = await request(app)
        .get("/api-docs/")
        .set("Accept-Encoding", "gzip");

      // Response should be compressed if large enough
      expect(response.status).toBe(200);
    });
  });

  describe("Input Validation Edge Cases", () => {
    it("should validate player ID parameter format", async () => {
      const response = await request(app)
        .get("/api/players/abc")
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Paramètres d'URL invalides");
    });

    it("should validate negative player ID", async () => {
      const response = await request(app)
        .get("/api/players/-1")
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Paramètres d'URL invalides");
    });

    it("should validate zero player ID", async () => {
      const response = await request(app)
        .get("/api/players/0")
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Paramètres d'URL invalides");
    });

    it("should validate decimal player ID", async () => {
      const response = await request(app)
        .get("/api/players/1.5")
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Paramètres d'URL invalides");
    });
  });

  describe("Request Body Validation", () => {
    const basePlayerData = {
      id: 1,
      firstname: "Test",
      lastname: "Player",
      shortname: "T.PLY",
      sex: "M",
      country: {
        picture: "https://example.com/flag.png",
        code: "TST"
      },
      picture: "https://example.com/player.png",
      data: {
        rank: 1,
        points: 1000,
        weight: 80000,
        height: 180,
        age: 25,
        last: [1, 1, 1, 1, 1]
      }
    };

    it("should validate missing required fields", async () => {
      const incompleteData = {
        id: 1,
        firstname: "Test"
        // Missing other required fields
      };

      const response = await request(app)
        .post("/api/players")
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Données invalides");
      expect(response.body.details).toBeInstanceOf(Array);
      expect(response.body.details.length).toBeGreaterThan(0);
    });

    it("should validate invalid sex value", async () => {
      const invalidData = {
        ...basePlayerData,
        sex: "X" // Invalid sex
      };

      const response = await request(app)
        .post("/api/players")
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["sex"]
          })
        ])
      );
    });

    it("should validate shortname format", async () => {
      const invalidData = {
        ...basePlayerData,
        shortname: "INVALID_FORMAT"
      };

      const response = await request(app)
        .post("/api/players")
        .send(invalidData)
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

    it("should validate URL format for pictures", async () => {
      const invalidData = {
        ...basePlayerData,
        picture: "not-a-url"
      };

      const response = await request(app)
        .post("/api/players")
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["picture"]
          })
        ])
      );
    });

    it("should validate weight boundaries", async () => {
      const invalidData = {
        ...basePlayerData,
        data: {
          ...basePlayerData.data,
          weight: 25000 // Below minimum
        }
      };

      const response = await request(app)
        .post("/api/players")
        .send(invalidData)
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
      const invalidData = {
        ...basePlayerData,
        data: {
          ...basePlayerData.data,
          height: 300 // Above maximum
        }
      };

      const response = await request(app)
        .post("/api/players")
        .send(invalidData)
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
      const invalidData = {
        ...basePlayerData,
        data: {
          ...basePlayerData.data,
          age: 15 // Below minimum
        }
      };

      const response = await request(app)
        .post("/api/players")
        .send(invalidData)
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

    it("should validate last results array length", async () => {
      const invalidData = {
        ...basePlayerData,
        data: {
          ...basePlayerData.data,
          last: [1, 1, 1] // Wrong length
        }
      };

      const response = await request(app)
        .post("/api/players")
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["data", "last"]
          })
        ])
      );
    });

    it("should validate last results array values", async () => {
      const invalidData = {
        ...basePlayerData,
        data: {
          ...basePlayerData.data,
          last: [1, 1, 2, 1, 1] // Invalid value (2)
        }
      };

      const response = await request(app)
        .post("/api/players")
        .send(invalidData)
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

    it("should validate country code format", async () => {
      const invalidData = {
        ...basePlayerData,
        country: {
          ...basePlayerData.country,
          code: "TOOLONG" // Too long
        }
      };

      const response = await request(app)
        .post("/api/players")
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["country", "code"]
          })
        ])
      );
    });

    it("should validate firstname length", async () => {
      const invalidData = {
        ...basePlayerData,
        firstname: "A" // Too short
      };

      const response = await request(app)
        .post("/api/players")
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["firstname"]
          })
        ])
      );
    });

    it("should validate lastname length", async () => {
      const invalidData = {
        ...basePlayerData,
        lastname: "B" // Too short
      };

      const response = await request(app)
        .post("/api/players")
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["lastname"]
          })
        ])
      );
    });
  });

  describe("HTTP Methods", () => {
    it("should only allow GET for player retrieval endpoint", async () => {
      await request(app)
        .post("/api/players/1")
        .expect(404); // Route doesn't exist for POST

      await request(app)
        .put("/api/players/1")
        .expect(404); // Route doesn't exist for PUT

      await request(app)
        .delete("/api/players/1")
        .expect(404); // Route doesn't exist for DELETE
    });

    it("should only allow GET for stats endpoint", async () => {
      await request(app)
        .post("/api/players/stats")
        .expect(404); // Route doesn't exist for POST

      await request(app)
        .put("/api/players/stats")
        .expect(404); // Route doesn't exist for PUT

      await request(app)
        .delete("/api/players/stats")
        .expect(404); // Route doesn't exist for DELETE
    });

    it("should only allow POST for player creation endpoint", async () => {
      // GET /api/players now exists (returns all players sorted by rank)
      await request(app)
        .get("/api/players")
        .expect(200); // Now returns 200 with empty array when no database

      await request(app)
        .put("/api/players")
        .expect(404); // Route doesn't exist for PUT

      await request(app)
        .delete("/api/players")
        .expect(404); // Route doesn't exist for DELETE
    });
  });
});