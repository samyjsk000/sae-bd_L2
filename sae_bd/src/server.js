import app from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./db/connection.js";

const server = app.listen(env.port, () => {
  console.log(`API listening on http://localhost:${env.port}`);
});

const shutdown = async () => {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
