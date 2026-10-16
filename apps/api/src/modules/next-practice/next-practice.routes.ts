import { Router } from "express";
import { getNextPracticeSchema } from "@coach/core";
import { validateRequest } from "../../middleware";
import { getNextPractice } from "./next-practice.controllers";

const router: Router = Router();

router.get("/", validateRequest(getNextPracticeSchema), getNextPractice);

export default router;
