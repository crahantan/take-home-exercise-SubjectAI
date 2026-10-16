import express from "express";
import { renderHomePage } from "./views/home";

const PORT = Number(process.env.PORT ?? 3000);

const app = express();

app.get("/", (_req, res) => {
	res.type("html").send(renderHomePage());
});

app.listen(PORT, () => {
	console.log(`web listening on http://localhost:${PORT}`);
});
