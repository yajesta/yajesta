const UNIVERSE_CTS = "10771782448";
const UNIVERSE_BAT = "10556383571";
const ROBLOX_URL =
  "https://games.roblox.com/v1/games?universeIds=" + UNIVERSE_CTS + "," + UNIVERSE_BAT;
const TTL = 45;
const CACHE_KEY = new Request("https://oscarkalid-roblox-stats.internal/stats");

function allowedOrigin(origin) {
  if (origin === "https://oscarkalid.com") return true;
  if (origin === "https://oscarkalid-nelson-preview.doskioscar.workers.dev") return true;
  return /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin || "");
}

function corsHeaders(origin) {
  const headers = {
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (allowedOrigin(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

export default {
  async fetch(request) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405, headers: cors });
    }

    const cache = caches.default;
    const cached = await cache.match(CACHE_KEY);
    if (cached) {
      return new Response(await cached.text(), {
        status: 200,
        headers: {
          ...cors,
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "public, max-age=" + TTL,
        },
      });
    }

    try {
      const res = await fetch(ROBLOX_URL, {
        headers: {
          Accept: "application/json",
          "User-Agent": "oscarkalid.com-stats",
        },
      });
      if (!res.ok) throw new Error("roblox " + res.status);
      const json = await res.json();
      const byId = {};
      for (const game of json.data || []) {
        byId[String(game.id)] = {
          visits: game.visits,
          favourites: game.favoritedCount,
        };
      }
      const body = JSON.stringify({
        cts: byId[UNIVERSE_CTS] || null,
        bat: byId[UNIVERSE_BAT] || null,
        asOf: new Date().toISOString(),
      });
      const cachedResponse = new Response(body, {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "public, max-age=" + TTL,
        },
      });
      await cache.put(CACHE_KEY, cachedResponse.clone());
      return new Response(body, {
        status: 200,
        headers: {
          ...cors,
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "public, max-age=" + TTL,
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: true }), {
        status: 502,
        headers: {
          ...cors,
          "Content-Type": "application/json; charset=utf-8",
        },
      });
    }
  },
};
