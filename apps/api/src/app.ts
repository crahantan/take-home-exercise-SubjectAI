import { ResponseUtil } from "@coach/core";
import express from "express";
import { logger } from "./lib/logger";
import { errorHandler, notFoundHandler } from "./middleware";
import { nextPracticeRouter } from "./modules/next-practice";

const PORT = Number(process.env.PORT ?? 3001);

const app = express();

app.use(express.json());

app.get("/api/health", (_req, res) => {
	res.json(ResponseUtil.success({ status: "ok" }));
});
app.use("/api", nextPracticeRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
	logger.info("api listening", { port: PORT });
});
