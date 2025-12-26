// Twilio client wrapper for sending WhatsApp messages
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM; // e.g. "whatsapp:+14155238886" or your number

if (!accountSid || !authToken || !whatsappFrom) {
  console.warn('Twilio config missing. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM in .env');
}

const client = twilio(accountSid, authToken);

async function sendWhatsApp(to, body) {
  if (!client) throw new Error('Twilio client not configured');
  try {
    const msg = await client.messages.create({
      from: whatsappFrom,
      to,
      body
    });
    console.log(`[OUT] SID=${msg.sid} To=${to}`);
    return msg;
  } catch (err) {
    console.error('Twilio send error:', err);
    throw err;
  }
}

module.exports = { sendWhatsApp };