import express from "express";
import cors from "cors";
import morgan from "morgan";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import router from "./routes/index.js";
import { errorHandler, notFound } from "./middlewares/errorHandler.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "recipe-manager-api" });
});

app.use(express.static(join(__dirname, "../public")));

app.use("/api", router);
app.use(notFound);
app.use(errorHandler);

export default app;
