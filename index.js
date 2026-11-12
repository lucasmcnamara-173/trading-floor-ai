import { Client, GatewayIntentBits, Partials } from "discord.js";
import OpenAI from "openai";
for (const key of ["DISCORD_TOKEN", "OPENAI_API_KEY"]) { if (!process.env[key]) { console.error("Missing required environment variable: " + key); process.exit(1); } }
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages, GatewayIntentBits.MessageContent], partials: [Partials.Channel] });
const histories = new Map();
const MAX_TURNS = 12;
const SYSTEM_PROMPT = "You are Trading Floor AI, a disciplined trading education assistant. Teach market structure, technical analysis, risk management, trade planning, journaling, and trading psychology. Explain concepts step by step. Never promise profits or imply that $5,000/day is guaranteed. Do not issue blind buy/sell orders. Explain uncertainty, scenarios, invalidation, and risk. Emphasize position sizing and protecting capital. Never execute trades or request credentials/API keys."; 
client.once("ready", () => console.log("Trading Floor AI online as " + client.user.tag));
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  const isDM = !message.guild;
  if (!isDM && !message.mentions.has(client.user)) return;
  const prompt = message.content.replace(new RegExp("<@!?" + client.user.id + ">", "g"), "").trim();
  if (!prompt) { await message.reply("I am here. Ask about a setup, chart, risk management, or a trading lesson."); return; }
  const key = message.channel.id;
  const history = histories.get(key) || [];
  await message.channel.sendTyping();
  try {
    const result = await openai.responses.create({ model, instructions: SYSTEM_PROMPT, input: [...history, { role: "user", content: prompt }], max_output_tokens: 900 });
    const answer = (result.output_text || "I could not generate a response. Try again.").trim();
    history.push({ role: "user", content: prompt }, { role: "assistant", content: answer });
    histories.set(key, history.slice(-MAX_TURNS * 2));
    for (let i = 0; i < answer.length; i += 1900) await message.reply(answer.slice(i, i + 1900));
  } catch (err) { console.error("AI request failed:", err); await message.reply("I hit an error. Check the OpenAI API key and model in Railway service variables."); }
});
client.login(process.env.DISCORD_TOKEN);
