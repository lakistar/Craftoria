export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не дозволено' });
  }

  const { fullName, phone, email, address, paymentMethod, orderSummaryText } = req.body;



  // Тепер через .env
  const TOKEN = process.env.TELEGRAM_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;


  const text = `🛒 НОВЕ ЗАМОВЛЕННЯ\n
👤 ПІБ: ${fullName}
📞 Телефон: ${phone}
📧 Email: ${email}
🏠 Адреса: ${address}
💳 Оплата: ${paymentMethod}\n
${orderSummaryText}`;

  const response = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text })
  });

  const data = await response.json();
  res.status(200).json(data);
}
