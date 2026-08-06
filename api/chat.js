export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { system, messages } = req.body;

  if (!system || !messages) {
    return res.status(400).json({ error: "Missing system or messages" });
  }

  const apiMessages = [{ role: "system", content: system }, ...messages];

  try {
    const r = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: apiMessages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({
        error: data.error?.message || `DeepSeek API error ${r.status}`,
      });
    }

    const content = data.choices?.[0]?.message?.content || "";
    return res.status(200).json({ content });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
