import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const setupSecret = process.env.SETUP_SECRET;
  const requestSecret = Array.isArray(req.query.secret)
    ? req.query.secret[0]
    : req.query.secret;

  if (!setupSecret || requestSecret !== setupSecret) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const token = process.env.BOT_TOKEN;

  if (!token) {
    return res.status(500).json({ ok: false, error: "BOT_TOKEN is missing" });
  }

  const publicUrl =
    process.env.PUBLIC_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  if (!publicUrl) {
    return res
      .status(500)
      .json({ ok: false, error: "PUBLIC_URL or VERCEL_URL is missing" });
  }

  const webhookUrl = `${publicUrl.replace(/\/$/, "")}/api/bot`;
  const body: Record<string, string> = {
    url: webhookUrl
  };

  if (process.env.WEBHOOK_SECRET) {
    body.secret_token = process.env.WEBHOOK_SECRET;
  }

  const response = await fetch(
    `https://api.telegram.org/bot${token}/setWebhook`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }
  );

  const data = await response.json();

  return res.status(200).json({
    webhookUrl,
    telegramResponse: data
  });
}
