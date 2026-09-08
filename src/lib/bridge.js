// Harper Intelligence Bridge — research API client.
// The frontend remains engine-agnostic: VectorBT/Nautilus/LEAN can sit behind these contracts.
const BRIDGE_URL = import.meta.env.VITE_BRIDGE_URL || "";
const BRIDGE_KEY = import.meta.env.VITE_BRIDGE_KEY || "";

export function bridgeConfigured() {
  return Boolean(BRIDGE_URL && BRIDGE_KEY);
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
    const err = new Error(describeError(detail, r.statusText));
    err.status = r.status;
    err.detail = detail;
    throw err;
  }
  return r.json();
}

function describeError(detail, fallback) {
  if (typeof detail === "string") return detail || fallback;
  if (!detail) return fallback;
  return detail.detail || detail.error || detail.message || JSON.stringify(detail);
}

export const bridge = {
  health: () => req("GET", "/bridge/health"),
  brief: () => req("GET", "/bridge/brief"),
  signal: (payload) => req("POST", "/bridge/signal", payload),
  shadow: (payload) => req("POST", "/bridge/shadow", payload),
  resolveForecast: (payload) => req("POST", "/bridge/forecast/resolve", payload),
  publish: (payload) => req("POST", "/bridge/publish", payload),
  performance: () => req("GET", "/bridge/performance"),
  chat: (payload) => req("POST", "/bridge/chat", payload),

  // Harper v2 research contracts
  strategies: () => req("GET", "/bridge/research/strategies"),
  createStrategy: (payload) => req("POST", "/bridge/research/strategies", payload),
  getExperiment: (id) => req("GET", `/bridge/research/experiments/${encodeURIComponent(id)}`),
  listExperiments: () => req("GET", "/bridge/research/experiments"),
  robustness: (payload) => req("POST", "/bridge/research/robustness", payload),
  promote: (payload) => req("POST", "/bridge/research/promote", payload),
};

export function screen(payload, handlers = {}) {
  return stream("POST", "/bridge/screen", payload, handlers);
}

export function backtest(payload, handlers = {}) {
  return stream("POST", "/bridge/backtest", payload, handlers);
}

export async function stream(method, path, body, { onProgress, onComplete, onError } = {}) {
  try {
    const r = await fetch(`${BRIDGE_URL}${path}`, {
      method,
      headers: headers(),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!r.ok || !r.body) throw new Error(`HTTP ${r.status}`);
    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    const consume = (raw) => {
      const ev = parseSse(raw);
      if (!ev.data) return;
      let data = ev.data;
      try { data = JSON.parse(ev.data); } catch { /* plain text event */ }
      if (ev.event === "complete") onComplete?.(data);
      else if (ev.event === "progress") onProgress?.(data);
      else if (ev.event === "error") onError?.(typeof data === "string" ? data : JSON.stringify(data));
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let index;
      while ((index = buffer.indexOf("\n\n")) !== -1) {
        consume(buffer.slice(0, index));
        buffer = buffer.slice(index + 2);
      }
    }
    if (buffer.trim()) consume(buffer);
  } catch (e) {
    onError?.(e.message);
  }
}

function parseSse(raw) {
  let event = "message";
  const data = [];
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
  }
  return { event, data: data.join("\n") };
}
