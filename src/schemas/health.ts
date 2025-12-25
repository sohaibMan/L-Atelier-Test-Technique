import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

// Extension de Zod avec OpenAPI
extendZodWithOpenApi(z);

export const HealthCheckSchema = z.object({
  status: z.enum(["ok", "degraded", "error"]).openapi({ example: "ok" }),
  timestamp: z.string().datetime({ error: "Format de date invalide" }).openapi({ example: "2024-01-01T00:00:00.000Z" }),
  uptime: z.number().openapi({ example: 123.456 }),
  environment: z.string().openapi({ example: "development" })
}).openapi({
  title: "HealthCheck",
  description: "Réponse du contrôle de santé de l'application"
});

export const EnhancedHealthCheckSchema = z.object({
  status: z.enum(["ok", "degraded", "error"]),
  timestamp: z.string().datetime({ error: "Format de date invalide" }),
  uptime: z.number(),
  environment: z.string(),
  checks: z.object({
    memory: z.object({
      status: z.enum(["healthy", "unhealthy"]),
      used: z.string(),
      limit: z.string()
    }),
    uptime: z.object({
      status: z.enum(["healthy", "unhealthy"]),
      value: z.string()
    }),
    responseTime: z.object({
      status: z.enum(["healthy", "unhealthy"]),
      value: z.string()
    })
  }).optional(),
  version: z.string().optional(),
  platform: z.string().optional(),
  error: z.string().optional()
}).openapi({
  title: "EnhancedHealthCheck",
  description: "Réponse détaillée du contrôle de santé avec métriques système"
});

export type HealthCheck = z.infer<typeof HealthCheckSchema>;
export type EnhancedHealthCheck = z.infer<typeof EnhancedHealthCheckSchema>;