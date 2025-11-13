export default async function handler(req, res) {
  // فقط متد POST مجازه
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { text, chatHistory = [] } = req.body || {};

    if (!text || typeof text !== "string") {
      return res.status(400).json({ ok: false, error: "متن خالی است" });
    }

    // تاریخچه چت (برای بعداً، فعلاً فقط نقش تزئینی داره)
    const newChatHistory = [...chatHistory, { role: "user", content: text }];

    // درخواست به OpenAI Chat Completions
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // ❗ حتماً همون نام متغیر محیطی که در Vercel گذاشتی:
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // مدل سبک و ارزان
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: text },
        ],
        max_tokens: 300,
      }),
    });

    const data = await openaiRes.json();

    // اگر خود OpenAI خطا داد
    if (!openaiRes.ok) {
      console.error("OpenAI API error:", openaiRes.status, data);
      return res.status(500).json({
        ok: false,
        error: "خطا از سمت OpenAI",
        details: data,
      });
    }

    const answer =
      data?.choices?.[0]?.message?.content?.trim() || "جوابی دریافت نشد.";

    const fullHistory = [
      ...newChatHistory,
      { role: "assistant", content: answer },
    ];

    return res.status(200).json({
      ok: true,
      answer,
      chatHistory: fullHistory,
    });
  } catch (err) {
    console.error("Server error in /api/chat:", err);
    return res.status(500).json({
      ok: false,
      error: "server error",
    });
  }
}
