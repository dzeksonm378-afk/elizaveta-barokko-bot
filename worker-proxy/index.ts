export interface Env {
  PROXY_SECRET: string;
}

const TELEGRAM_API_ORIGIN = "https://api.telegram.org";

const decodePathSegment = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return "";
  }
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method !== "GET" && request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const match = url.pathname.match(/^\/telegram\/([^/]+)\/bot([^/]+)\/(.+)$/);

    if (!match) {
      return new Response("Not Found", { status: 404 });
    }

    const [, proxySecret, token, method] = match;

    if (!env.PROXY_SECRET || decodePathSegment(proxySecret) !== env.PROXY_SECRET) {
      return new Response("Forbidden", { status: 403 });
    }

    const telegramUrl = new URL(`${TELEGRAM_API_ORIGIN}/bot${token}/${method}`);
    telegramUrl.search = url.search;

    const headers = new Headers(request.headers);
    headers.delete("host");

    return fetch(telegramUrl.toString(), {
      method: request.method,
      headers,
      body: request.method === "GET" ? undefined : request.body
    });
  }
};
