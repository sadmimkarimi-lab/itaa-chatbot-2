const fetch = require("node-fetch"); // برای ارسال درخواست به ایتا

// نام کلید باید دقیقاً مثل ورسل باشد
const BOT_TOKEN = process.env.EITAA_BOT_TOKEN;

const API_BASE = `https://api.eitaa.com/bot${BOT_TOKEN}`;

// ارسال پیام به ایتا
async function sendMessage(chat_id, text) {
  await fetch(`${API_BASE}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id, text }),
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).send("OK");

  const update = req.body;
  const msg = update.message;
  if (!msg) return res.status(200).json({ ok: true });

  const chatId = msg.chat.id;
  const text = msg.text || "";

  // پیام خوش‌آمد
  if (text === "/start") {
    await sendMessage(chatId, "سلام 👋 من چت‌بات هوش مصنوعی هستم.");
    await sendMessage(chatId, "هر سوالی داری بپرس، من اینجام کمک کنم 🌿");
    return res.status(200).json({ ok: true });
  }

  // ارسال پیام به سرور چت (OpenAI)
  const resp = await fetch(`${req.headers.origin}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  }).then((r) => r.json());

  // و ارسال جواب به کاربر
  await sendMessage(chatId, resp.answer || "نتونستم جواب بگیرم 😔");

  return res.status(200).json({ ok: true });
};
