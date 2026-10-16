import express from "express";
import type { Application } from "express";
import { ResponseUtil } from "@coach/core";
import { errorHandler, notFoundHandler } from "./middleware";
import { logger } from "./lib/logger";
import { nextPracticeRouter } from "./modules/next-practice";

const app: Application = express();
const host = process.env.HOST || "localhost";
const port: number = parseInt(process.env.PORT || "3001", 10);
const baseAPI = process.env.BASE_API || "/api";

app.use(express.json({ limit: "10kb" }));

app.get(`${baseAPI}/health`, (_req, res) => {
	res.status(200).json(ResponseUtil.success({ status: "ok" }, "API online"));
});

app.use(`${baseAPI}/next-practice`, nextPracticeRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, host, () => {
	logger.info({ event: "api_started", url: `http://${host}:${port}${baseAPI}` });
});

export default app;
