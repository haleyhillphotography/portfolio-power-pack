import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get(api.health.get.path, async (req, res) => {
    res.json({ status: "ok" });
  });

  return httpServer;
}
