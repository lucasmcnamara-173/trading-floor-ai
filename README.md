# Trading Floor AI

Private Discord AI trading education assistant.

## Railway variables
- `DISCORD_TOKEN`: Discord bot token
- `OPENAI_API_KEY`: OpenAI API key
- `OPENAI_MODEL`: optional; defaults to `gpt-4.1-mini`

Railway detects Node.js from `package.json`; start command is `npm start`. Never put secrets in GitHub or Discord.

## Discord setup
1. Create the bot in the Discord Developer Portal.
2. Enable **Message Content Intent** under Bot > Privileged Gateway Intents.
3. Invite it with View Channels, Send Messages, Read Message History, and Embed Links. Do not grant Administrator.
4. Mention the bot in a channel or send it a direct message.

Conversation history is temporary and resets when the Railway process restarts. This assistant is for education and analysis, not trade execution or guaranteed returns. OpenAI API usage is billed separately from a ChatGPT subscription.
