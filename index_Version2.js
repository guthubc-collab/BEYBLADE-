// Express server: Twilio webhook validation + simple bot behavior
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const twilioLib = require('twilio');
const { sendWhatsApp } = require('./twilioClient');
const { getAIReply } = require('./openaiClient');
const sessionStore = require('./sessionStore');

const app = express();

// Twilio sends application/x-www-form-urlencoded POSTs
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';

function fullRequestUrl(req) {
  // In production you should set BASE_URL in env to the public URL of your service (https)
  if (process.env.BASE_URL) return `${process.env.BASE_URL}${req.originalUrl}`;
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  return `${protocol}://${req.get('host')}${req.originalUrl}`;
}

// Middleware to validate Twilio signature (recommended)
app.use('/webhook', (req, res, next) => {
  try {
    const signature = req.headers['x-twilio-signature'];
    if (!signature || !TWILIO_AUTH_TOKEN) {
      // If missing token we allow (dev), but log a warning
      if (!TWILIO_AUTH_TOKEN) console.warn('TWILIO_AUTH_TOKEN not set — webhook validation disabled.');
      return next();
    }
    const url = fullRequestUrl(req);
    const params = req.body || {};
    const isValid = twilioLib.validateRequest(TWILIO_AUTH_TOKEN, signature, url, params);
    if (!isValid) {
      console.warn('Invalid Twilio signature. Rejecting request.');
      return res.status(403).send('Invalid signature');
    }
    next();
  } catch (err) {
    console.error('Error validating Twilio signature:', err);
    return res.status(400).send('Bad Request');
  }
});

app.get('/', (req, res) => res.send('WhatsApp Twilio Bot is running'));

app.post('/webhook', async (req, res) => {
  // Twilio expects a fast 200 OK; process asynchronously where possible
  try {
    const from = req.body.From; // e.g. 'whatsapp:+33xxxx'
    const body = (req.body.Body || '').trim();
    if (!from) return res.status(400).send('Missing From');

    console.log(`[IN] From=${from} Body=${body}`);

    // Simple session usage (in-memory)
    const session = sessionStore.get(from) || { messages: [] };
    session.messages.push({ from: 'user', text: body });
    sessionStore.set(from, session);

    // Quick commands / menu
    const lc = body.toLowerCase();
    let replyText = '';

    if (!body) {
      replyText = "Je n'ai reçu aucun texte. Envoie 'menu' pour voir les options.";
    } else if (lc === 'menu' || lc === 'help') {
      replyText = "Menu:\n1) 'ia' + message → demande au modèle IA (si configuré)\n2) 'echo' + message → renvoie le message\n3) 'help' → ce menu";
    } else if (lc.startsWith('echo ')) {
      replyText = body.slice(5);
    } else if (lc.startsWith('ia ')) {
      // Use OpenAI if configured; otherwise inform user
      const userQuery = body.slice(3).trim();
      if (process.env.OPENAI_API_KEY) {
        try {
          const ai = await getAIReply(userQuery, { from });
          replyText = ai || "Désolé, pas de réponse de l'IA.";
        } catch (err) {
          console.error('OpenAI error:', err);
          replyText = "Erreur lors de la requête IA. Réessaie plus tard.";
        }
      } else {
        replyText = "L'IA n'est pas configurée côté serveur. Ajoute OPENAI_API_KEY dans .env pour activer.";
      }
    } else {
      // Default behavior: if OPENAI_API_KEY set use IA, else echo
      if (process.env.OPENAI_API_KEY) {
        try {
          const ai = await getAIReply(body, { from });
          replyText = ai || `Echo: ${body}`;
        } catch (err) {
          console.error('OpenAI error fallback:', err);
          replyText = `Echo: ${body}`;
        }
      } else {
        replyText = `Echo: ${body}`;
      }
    }

    // push reply to session
    session.messages.push({ from: 'bot', text: replyText });
    sessionStore.set(from, session);

    // Send reply (async)
    sendWhatsApp(from, replyText)
      .then(() => console.log('[OUT] reply sent'))
      .catch(err => console.error('[OUT] send error', err));

    // Respond quickly to Twilio
    return res.status(200).send('OK');
  } catch (err) {
    console.error('Webhook handling error:', err);
    return res.status(500).send('Server error');
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});