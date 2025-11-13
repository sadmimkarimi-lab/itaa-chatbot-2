import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(400).json({ ok: false, error: "Method not allowed" });
  }

  const userText = req.body?.text;

  if (!userText || userText.trim() === "") {
    return res.status(400).json({
      ok: false,
      error: "پیام کاربر ارسال نشده است."
    });
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
تو یک دستیار فارسی‌زبان هستی.
سبک پاسخ‌دهی:
- جمله‌ها کوتاه، روان و قابل فهم باشند.
- توضیح اضافی نده.
- از بولد، ایموجی زیاد و متن شلوغ استفاده نکن.
- پاسخ باید شبیه یک ربات حرفه‌ای و مینیمال باشد.
- فقط در صورت ضرورت از لیست با "-" استفاده کن.
- پاراگراف‌ها کوتاه باشند.
`.trim()
        },
        { role: "user", content: userText }
      ],
      temperature: 0.5
    });

    const botReply = response.choices?.[0]?.message?.content || "پاسخی دریافت نشد.";

    return res.status(200).json({
      ok: true,
      answer: botReply
    });
  } catch (err) {
    console.error("OpenAI API Error:", err);

    return res.status(500).json({
      ok: false,
      error: "خطا از سمت سرور یا OpenAI."
    });
  }
}
