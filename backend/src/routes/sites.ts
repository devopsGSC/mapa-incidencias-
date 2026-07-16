import { Router } from "express";
import { sitesRepository } from "../repositories/sitesRepository";

export const sitesRouter = Router();

sitesRouter.get("/", (_req, res) => {
  res.json(sitesRepository.findAll());
});
