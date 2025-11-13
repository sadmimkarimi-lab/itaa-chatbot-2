// api/chat.js

// ——————— تمیز کردن متن خروجی ———————
function cleanAnswer(text) {
  if (!text || typeof text !== "string") return "نتوانستم پاسخی تولید کنم.";

  let t = text.trim();
  t = t.replace(/\r\n/g, "\n");      // نرمال‌سازی
  t = t.replace(/\n{3,}/g, "\n\n");  // محدودیت فاصله‌های خالی

  const lines = t.split("\n").map((line) => line.replace(/\s+$/g, ""));
  return lines.join("\n");
}

export default async function handler(req, res) {
  // فقط POST
  if (req.method !== "POST") {
    return res.status(200).send("OK");
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY تعریف نشده");
    return res
      .status(500)
      .json({ ok: false, error: "کلید OpenAI روی سرور تنظیم نشده است." });
  }

  // پیام ورودی
  const userMessage =
    req.body?.text ||
    req.body?.message ||
    req.body?.message?.text ||
    null;

  if (!userMessage || typeof userMessage !== "string") {
    return res
      .status(400)
      .json({ ok: false, error: "پیام کاربر ارسال نشده است." });
  }

  try {
    // ——————— ارسال به OpenAI ———————
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
تو یک دستیار فارسی‌زبان حرفه‌ای هستی.

قوانین:
- هر سؤال را مستقل جواب بده (هیچ حافظه‌ای وجود ندارد).
- فقط بر اساس همین پیام جواب بده.
- ساده، واضح و تمیز بنویس.
- اگر لازم بود بولت‌پوینت استفاده کن.
- از توضیح اضافه و تکرار بی‌خودی جلوگیری کن.
- اگر سؤال چند بخش داشت، مرحله‌ای پاسخ بده.
- لحن دوستانه و محترمانه باشد.
`.trim(),
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
        temperature: 0.5,
        max_tokens: 400,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", data);
      const msg =
        data?.error?.message ||
        "پاسخی از OpenAI دریافت نشد، لطفاً دوباره تلاش کنید.";
      return res.status(500).json({ ok: false, error: msg });
    }

    const rawAnswer =
      data?.choices?.[0]?.message?.content ||
      "نتوانستم پاسخی تولید کنم، لطفاً دوباره تلاش کنید.";

    const answer = cleanAnswer(rawAnswer);

    return res.status(200).json({ ok: true, answer });
  } catch (err) {
    console.error("Internal error:", err);
    return res
      .status(500)
      .json({ ok: false, error: "خطای داخلی سرور. کمی بعد دوباره تلاش کن." });
  }
}
