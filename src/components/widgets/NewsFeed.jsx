import { useState, useEffect } from "react";

const C = {
  bg: "#0A0A0A",
  surface: "#131313",
  surfaceHigh: "#1C1C1C",
  border: "#262626",
  borderHi: "#3A3A3A",
  gold: "#E6E6E6",
  text: "#F2F2F2",
  textSub: "#A6A6A6",
  textDim: "#5A5A5A",
  green: "#FFFFFF",
  red: "#7A7A7A",
  mono: "'JetBrains Mono','Fira Mono','Courier New',monospace",
};

export default function NewsFeed() {
  const [articles, setArticles] = useState([]);
  const [query, setQuery] = useState("markets");
  const [loading, setLoading] = useState(false);

  const fetchNews = async (q) => {
    setLoading(true);
    try {
      const r = await fetch(
        `${import.meta.env.VITE_BRIDGE_URL}/bridge/news?q=${encodeURIComponent(q)}&limit=12`,
        { headers: { "X-Bridge-Key": import.meta.env.VITE_BRIDGE_KEY } }
      );
      const data = await r.json();
      setArticles(data.articles || []);
    } catch {
      setArticles([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchNews(query); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchNews(query);
  };

  return (
    <div style={{ background: C.surface, borderRadius: 8, border: `1px solid ${C.border}`, padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, fontFamily: C.mono, color: C.text, letterSpacing: "0.06em" }}>NEWS FEED</div>
        <form onSubmit={handleSearch} style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ticker or topic…"
            style={{
              width: 140, padding: "4px 8px", borderRadius: 4, fontSize: 10, fontFamily: C.mono,
              background: C.bg, border: `1px solid ${C.borderHi}`, color: C.text, outline: "none",
            }}
          />
          <button type="submit" style={{
            padding: "4px 10px", borderRadius: 4, fontSize: 10, fontFamily: C.mono,
            background: C.surfaceHigh, border: `1px solid ${C.border}`, color: C.textDim, cursor: "pointer",
          }}>GO</button>
        </form>
      </div>

      {loading && <div style={{ fontSize: 10, color: C.textDim, fontFamily: C.mono, padding: "8px 0" }}>Loading…</div>}

      {!loading && articles.length === 0 && (
        <div style={{ fontSize: 10, color: C.textDim, fontFamily: C.mono, padding: "8px 0" }}>No articles found.</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 320, overflowY: "auto" }}>
        {articles.map((a, i) => (
          <a
            key={i}
            href={a.url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block", padding: "8px 10px", borderRadius: 5,
              background: C.bg, border: `1px solid ${C.border}`, textDecoration: "none",
              transition: "border-color .15s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = C.borderHi}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: C.text, lineHeight: 1.4, marginBottom: 4 }}>
              {a.title || "Untitled"}
            </div>
            <div style={{ display: "flex", gap: 8, fontSize: 9, fontFamily: C.mono, color: C.textDim }}>
              {a.source && <span>{a.source}</span>}
              {a.published_at && <span>{a.published_at.slice(0, 10)}</span>}
              {a.tickers && <span style={{ color: C.gold }}>{a.tickers.join(", ")}</span>}
            </div>
            {a.summary && (
              <div style={{ fontSize: 10, color: C.textSub, marginTop: 4, lineHeight: 1.5 }}>
                {a.summary.slice(0, 150)}{a.summary.length > 150 ? "…" : ""}
              </div>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
