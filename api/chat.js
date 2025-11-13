import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const userMessage = req.body.text;

    if (!userMessage || userMessage.trim() === "") {
      return res.status(200).json({
        ok: false,
        error: "پیام کاربر ارسال نشده است."
      });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "تو یک ربات حرفه‌ای هستی. پاسخ‌ها را تمیز، مودب، خلاصه و خوش‌فرم بنویس. ساختار متن شیک و خوانا باشد.",
        },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
    });

    const answer = response.choices?.[0]?.message?.content || "پاسخی دریافت نشد";

    return res.status(200).json({
      ok: true,
      answer,
    });

  } catch (error) {
    console.error("OpenAI ERROR:", error);

    return res.status(200).json({
      ok: false,
      error: "خطا از سرور هوش مصنوعی"
    });
  }
}
