```markdown
# WhatsApp Bot (Twilio) — Node.js (Minimal & Secure)

Ce projet est un bot WhatsApp prêt à l'emploi utilisant Twilio. Il :
- valide la signature des webhooks Twilio,
- propose des commandes simples (menu, echo),
- peut utiliser OpenAI si tu fournis une clé (commande `ia ` ou par défaut),
- est packagé avec Docker.

## Prérequis
- Node.js >= 18
- Compte Twilio (sandbox WhatsApp pour tests) — Programmable Messaging
- (Optionnel) Clé OpenAI pour réponses IA

## Installation locale
1. Copier le repo et créer `.env` :
   ```bash
   cp .env.example .env
   ```
   Remplis les variables (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM).
2. Installer dépendances :
   ```bash
   npm install
   ```
3. Démarrer :
   ```bash
   npm start
   ```
   Serveur disponible sur `http://localhost:3000`

## Twilio — sandbox rapide
1. Dans Twilio Console → Messaging → Try it Out → Try WhatsApp → Sandbox.
2. Associe ton téléphone en envoyant le code au numéro sandbox (whatsapp:+14155238886).
3. Dans Sandbox configuration, mets le webhook "When a message comes in" à :
   - si en local via ngrok : `https://<NGROK_ID>.ngrok.io/webhook` (POST)
   - si en prod : `https://your-domain.com/webhook` (POST)

Important: pour valider la signature Twilio, remplis TWILIO_AUTH_TOKEN dans `.env` (même token que TWILIO_AUTH_TOKEN).

### Test en local avec ngrok
```bash
ngrok http 3000
```
Copie l'URL fournie (https) dans la configuration sandbox Twilio.

## Utilisation du bot
- Envoyer `menu` ou `help` → reçoit le menu.
- Envoyer `echo bonjour` → renvoie `bonjour`.
- Envoyer `ia Explique X` → si OPENAI_API_KEY configurée, la requête passera à OpenAI.

## Déploiement Docker (générique)
1. Build :
   ```bash
   docker build -t whatsapp-twilio-bot .
   ```
2. Run :
   ```bash
   docker run -d -p 3000:3000 --env-file .env --name wbot whatsapp-twilio-bot
   ```
3. Configure Twilio webhook sur l'URL publique.

## Sécurité / production
- Toujours définir BASE_URL (https) en prod pour une validation fiable.
- En prod, ne pas utiliser le store en mémoire — utiliser Redis (ex: REDIS_URL) et adapter sessionStore.
- Protéger les clés (store en secrets manager).
- Activer la validation du webhook (déjà incluse) — indispensable.

## Améliorations possibles (je peux les ajouter)
- Persistance de session avec Redis.
- Validation stricte + middleware Twilio officiel.
- Gestion média (images/docs).
- Escalade vers opérateur humain / file d'attente.
- Tests unitaires / CI.

## Besoin d'aide pour déployer ?
Je peux générer :
- un repo ZIP,
- une configuration Docker Compose + Redis,
- des instructions pas-à-pas pour un hébergeur (Railway, Render, Fly, ou ton "bot-hosting.net" si tu me donnes le lien).

Dis‑moi ce que tu veux que j'ajoute ensuite (Redis pour sessions, déploiement sur un hébergeur précis, ou configuration CI/CD).
```
