// Minimal OpenAI wrapper using global fetch (Node 18+).
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function getAIReply(userMessage, meta = {}) {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');

  const systemPrompt = process.env.OPENAI_SYSTEM_PROMPT ||
    "Tu es un assistant utile et concis qui répond en français si l'utilisateur parle français.";

  const payload = {
    model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ],
    max_tokens: 400,
    temperature: 0.7
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${text}`);
  }
  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content?.trim();
  return reply || null;
}

module.exports = { getAIReply };
