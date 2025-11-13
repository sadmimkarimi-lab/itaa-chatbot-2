// api/chat.js

// --- تابع تمیز کردن متن خروجی برای نمایش مرتب در حباب چت ---
function cleanAnswer(text) {
  if (!text || typeof text !== "string") {
    return "نتوانستم پاسخی تولید کنم.";
  }

  let t = text.trim();

  // نرمال‌سازی خط‌ها
  t = t.replace(/\r\n/g, "\n");

  // حداکثر دو خط خالی پشت سر هم
  t = t.replace(/\n{3,}/g, "\n\n");

  // حذف فاصله‌های اضافه در انتهای هر خط
  const lines = t.split("\n").map((line) => line.replace(/\s+$/g, ""));
  return lines.join("\n");
}

export default async function handler(req, res) {
  // برای تست سلامت با GET
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      message: "ChatGPT API آماده است 🚀",
    });
  }

  // فقط POST را به عنوان درخواست اصلی قبول می‌کنیم
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY تعریف نشده است.");
    return res
      .status(500)
      .json({ ok: false, error: "کلید OpenAI روی سرور تنظیم نشده است." });
  }

  // پیام کاربر را از بدنه درخواست بخوانیم
  // (چند حالت مختلف را پشتیبانی می‌کنیم)
  const userMessage =
    (req.body && req.body.text) || // برای وبهوک ایتا { text: "..." }
    (req.body && req.body.message) || // برای فرانت خودت { message: "..." }
    (req.body && req.body.message && req.body.message.text) ||
    null;

  if (!userMessage || typeof userMessage !== "string") {
    return res
      .status(400)
      .json({ ok: false, error: "پیام کاربر ارسال نشده است." });
  }

  try {
    // هر درخواست کاملاً مستقل است؛ هیچ حافظه‌ای بین پیام‌ها نگه نمی‌داریم
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
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
تو یک دستیار حرفه‌ای فارسی‌زبان هستی.

قوانین پاسخ‌گویی:
- هر سؤال را مستقل در نظر بگیر؛ به پیام‌های قبلی دسترسی نداری.
- فقط بر اساس همین پیام فعلی جواب بده.
- کوتاه، واضح و کاربردی بنویس.
- متن را تمیز و خوش‌خوان بنویس (پاراگراف‌بندی، خط‌های جدا بین بخش‌ها).
- اگر مناسب بود، از بولت‌پوینت (با - در ابتدای خط) استفاده کن.
- اگر سؤال چندبخشی است، مرحله‌به‌مرحله و منظم جواب بده.
- لحن: محترمانه، صمیمی و حرفه‌ای.
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
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", data);
      const msg =
        (data && data.error && data.error.message) ||
        "پاسخی از OpenAI دریافت نشد، لطفاً دوباره تلاش کنید.";
      return res
        .status(500)
        .json({ ok: false, error: `خطا از سمت OpenAI: ${msg}` });
    }

    const rawAnswer =
      (data &&
        data.choices &&
        data.choices[0] &&
        data.choices[0].message &&
        data.choices[0].message.content) ||
      "نتوانستم پاسخی تولید کنم، لطفاً دوباره تلاش کنید.";

    const answer = cleanAnswer(rawAnswer);

    // خروجی استاندارد برای فرانت و وبهوک ایتا
    return res.status(200).json({ ok: true, answer });
  } catch (err) {
    console.error("Internal error:", err);
    return res
      .status(500)
      .json({ ok: false, error: "خطای داخلی سرور. کمی بعد دوباره تلاش کن." });
  }
}
