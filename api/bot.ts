import type { VercelRequest, VercelResponse } from "@vercel/node";

import { createBot } from "../src/bot";

const bot = createBot();
const webhookSecret = process.env.WEBHOOK_SECRET;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method === "GET") {
    return res.status(200).send("Bot webhook is running");
  }

  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  if (webhookSecret) {
    const telegramSecret = req.headers["x-telegram-bot-api-secret-token"];

    if (telegramSecret !== webhookSecret) {
      return res.status(401).send("Unauthorized");
    }
  }

  try {
    await bot.handleUpdate(req.body);
    return res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).send("Webhook error");
  }
}
