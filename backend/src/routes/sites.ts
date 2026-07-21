import { Router } from "express";
import { requireAuth } from "../auth";
import { sitesRepository } from "../repositories/sitesRepository";

export const sitesRouter = Router();

sitesRouter.use(requireAuth);

sitesRouter.get("/", (_req, res) => {
  res.json(sitesRepository.findAll());
});
