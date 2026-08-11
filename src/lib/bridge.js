// ── Harper Intelligence Bridge — Dashboard API client ────────────────────────
// Thin fetch wrapper for all Bridge endpoints. All calls include X-Bridge-Key.
// SSE endpoints return an EventSource or ReadableStream per the PRD.

const BRIDGE_URL = import.meta.env.VITE_BRIDGE_URL || "";
const BRIDGE_KEY = import.meta.env.VITE_BRIDGE_KEY || "";

export function bridgeConfigured() {
  return !!(BRIDGE_URL && BRIDGE_KEY);
}

function headers(extra = {}) {
  return { "Content-Type": "application/json", "X-Bridge-Key": BRIDGE_KEY, ...extra };
}

async function req(method, path, body) {
  const r = await fetch(`${BRIDGE_URL}${path}`, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) {
    let detail;
    try { detail = await r.json(); } catch { detail = await r.text(); }
    const err = new Error(typeof detail === "string" ? detail : (detail.detail || r.statusText));
    err.status = r.status;
    err.detail = detail;
    throw err;
  }
  return r.json();
}

// ── REST endpoints ───────────────────────────────────────────────────────────
export const bridge = {
  signal: (payload) => req("POST", "/bridge/signal", payload),
  shadow: (payload) => req("POST", "/bridge/shadow", payload),
  resolveForecast: (payload) => req("POST", "/bridge/forecast/resolve", payload),
  brief: () => req("GET", "/bridge/brief"),
  health: () => req("GET", "/bridge/health"),
  publish: (payload) => req("POST", "/bridge/publish", payload),
  performance: () => req("GET", "/bridge/performance"),
  chat: (payload) => req("POST", "/bridge/chat", payload),
};

// ── SSE endpoints ────────────────────────────────────────────────────────────
// Returns a ReadableStream via fetch streaming; caller consumes events.
export function screen(payload, { onProgress, onComplete, onError }) {
  return stream("POST", "/bridge/screen", payload, { onProgress, onComplete, onError });
}

export function backtest(payload, { onProgress, onComplete, onError }) {
  return stream("POST", "/bridge/backtest", payload, { onProgress, onComplete, onError });
}

async function stream(method, path, body, { onProgress, onComplete, onError }) {
  try {
    const r = await fetch(`${BRIDGE_URL}${path}`, {
      method,
      headers: headers(),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!r.ok || !r.body) throw new Error(`HTTP ${r.status}`);
    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf("\n\n")) !== -1) {
        const raw = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        const ev = parseSse(raw);
        if (ev.event === "complete" && ev.data) onComplete?.(JSON.parse(ev.data));
        else if (ev.event === "progress" && ev.data) onProgress?.(JSON.parse(ev.data));
        else if (ev.event === "error" && ev.data) onError?.(typeof ev.data === "string" ? ev.data : JSON.stringify(ev.data));
      }
    }
  } catch (e) {
    onError?.(e.message);
  }
}

function parseSse(raw) {
  const lines = raw.split("\n");
  let event = "message";
  let data = "";
  for (const line of lines) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) data = line.slice(5).trim();
  }
  return { event, data };
}
