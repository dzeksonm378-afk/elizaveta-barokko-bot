import "dotenv/config";
import http from "http";

import { createBot } from "./bot";

const bot = createBot();
const port = Number(process.env.PORT) || 3000;

const healthcheckServer = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Bot is running");
});

healthcheckServer.listen(port, () => {
  console.log(`Healthcheck server is running on port ${port}`);
});

async function main() {
  await bot.telegram.deleteWebhook();
  await bot.launch();

  const me = await bot.telegram.getMe();
  console.log(`Bot started successfully: @${me.username}`);
}

main().catch((error) => {
  console.error("Failed to start bot:", error);
  process.exit(1);
});

process.once("SIGINT", () => {
  bot.stop("SIGINT");
  healthcheckServer.close();
});

process.once("SIGTERM", () => {
  bot.stop("SIGTERM");
  healthcheckServer.close();
});
