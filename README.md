# Trading Floor AI

Private Discord AI trading education assistant.

## Railway variables
- `DISCORD_TOKEN`: Discord bot token
- `OPENAI_API_KEY`: OpenAI API key
- `OPENAI_MODEL`: optional; defaults to `gpt-4.1-mini`
- `TRADINGVIEW_WEBHOOK_SECRET`: a long random value that TradingView alerts must include (see below). Use letters and digits only, for example the output of `openssl rand -hex 24`.
- `PORT`: optional. The web server listens on `PORT` (Railway sets it) or 3000. Railway's public domain must point at the same port; the deploy log prints it.

Railway detects Node.js from `package.json`; start command is `npm start`. Never put secrets in GitHub or Discord.

## Discord setup
1. Create the bot in the Discord Developer Portal.
2. No privileged intents are needed. The bot answers when you @mention it directly or send it a direct message.
3. Invite it with View Channels, Send Messages, Read Message History, and Embed Links. Do not grant Administrator.
4. Mention the bot in a channel or send it a direct message.

Conversation history is temporary and resets when the Railway process restarts. This assistant is for education and analysis, not trade execution or guaranteed returns. OpenAI API usage is billed separately from a ChatGPT subscription.

## TradingView alerts
Alerts are posted to the text channel named `chart-review` in the bot's server. The bot must be able to see that channel and send embeds there.

1. Check the bot is reachable: open `https://<your-railway-domain>/health`. It should show `"ok":true` and `"webhook":"configured"`.
2. In TradingView, create an alert, open **Notifications**, tick **Webhook URL** and enter `https://<your-railway-domain>/webhook/tradingview`. TradingView only allows webhooks on accounts with two-factor authentication and a plan that includes webhook notifications.
3. Put this in the alert's **Message** field, with your real secret:

```json
{
  "secret": "YOUR_TRADINGVIEW_WEBHOOK_SECRET",
  "ticker": "{{ticker}}",
  "exchange": "{{exchange}}",
  "interval": "{{interval}}",
  "time": "{{time}}",
  "price": "{{close}}",
  "volume": "{{volume}}",
  "message": "TradingView alert triggered"
}
```

Responses: `202` accepted, `401` wrong secret, `400` the message is not a JSON object, `503` `TRADINGVIEW_WEBHOOK_SECRET` is not set. A `502 Application failed to respond` comes from Railway, not the bot: the service is down or its domain points at the wrong port.
