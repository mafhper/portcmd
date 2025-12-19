/**
 * Rate Limit - Protects API endpoints by IP and API key
 */
const WINDOW_MS = 60_000;   // 1 minute window
const MAX_PER_KEY = 20;     // 20 requests per key per minute
const MAX_PER_IP = 40;      // 40 requests per IP per minute

const store = new Map();

function now() {
    return Date.now();
}

function getId(req, apiKey) {
    const ip =
        req.headers["x-forwarded-for"] ||
        req.socket?.remoteAddress ||
        "unknown";
    return `ip:${ip}|key:${apiKey || "none"}`;
}

function rateLimit(req, res, apiKey) {
    const id = getId(req, apiKey);
    const t = now();

    const entry = store.get(id) || { count: 0, start: t };

    if (t - entry.start > WINDOW_MS) {
        entry.count = 0;
        entry.start = t;
    }

    entry.count++;
    store.set(id, entry);

    const limit = apiKey ? MAX_PER_KEY : MAX_PER_IP;

    if (entry.count > limit) {
        res.writeHead(429, { "Content-Type": "application/json" });
        res.end(
            JSON.stringify({
                success: false,
                error: "Rate limit exceeded. Please wait a minute."
            })
        );
        return false;
    }

    return true;
}

// Clean old entries every 5 minutes
setInterval(() => {
    const t = now();
    for (const [id, entry] of store.entries()) {
        if (t - entry.start > WINDOW_MS * 2) {
            store.delete(id);
        }
    }
}, 5 * 60 * 1000);

module.exports = { rateLimit };
