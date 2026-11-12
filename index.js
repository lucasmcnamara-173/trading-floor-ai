import {Client,GatewayIntentBits,Partials,ChannelType,PermissionFlagsBits} from "discord.js";
import OpenAI from "openai";
for(const k of ["DISCORD_TOKEN","OPENAI_API_KEY"])if(!process.env[k]){console.error("Missing "+k);process.exit(1)}
const ai=new OpenAI({apiKey:process.env.OPENAI_API_KEY}),model=process.env.OPENAI_MODEL||"gpt-4.1-mini";
const client=new Client({intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMessages,GatewayIntentBits.DirectMessages,GatewayIntentBits.MessageContent],partials:[Partials.Channel]});
const history=new Map();
const system=`You are Trading Floor AI, an instructor for two friends. Teach lessons, quiz/grade, explain errors, futures basics, chart reading, risk, setups and journaling. Treat their Small Futures Account notes as one video's claims, not verified broker terms or proof. Flag arithmetic: six losses + three wins = nine trades, not ten; 3x$283=$849, minus $600=$249. Contract specs/margins may be outdated/product-specific. Never promise $5,000/day, issue blind buy/sell calls, execute trades, give personalized financial advice, or request credentials. Stress demo practice, fees, slippage, stops not guaranteeing max loss, and margin not capping losses.`;
const notes=`# Trading Starter List: Small Futures Account
**Nov 12, 2026 · @Lucas**

Working notes from one video on growing a small futures account. Risk one small fixed amount per trade, aim to win two to three times that, and practise on demo first. Treat it as a method to practise, not a promise: the video explains a path from $100 to $10,000 but never shows an account doing it.

## The five rules
1. Risk one small, fixed amount per trade (1R). On a $50–$100 account the video suggests about $5.
2. Never move a stop further away; widening it raises risk and shrinks the planned reward ratio.
3. Aim to be profitable over many trades. Wins of 2R–3R can outweigh more frequent losses.
4. Trade only when the full setup is present. Look for reasons not to enter. No-trade days can mean the plan worked.
5. Size up only when results justify it, not after one good week. Keep the chart and strategy the same; change only size.

Think in R, not dollars: $10 made on $5 risked is 2R, same as $2,000 on $1,000 risked.

**Arithmetic issue in video example:** It says ten trades, six losses of $100 and three wins averaging $283. That lists only nine trades. Three wins = $849; minus $600 losses = $249 (rounded in video to $850/$250). One trade is unaccounted for, so the example is incomplete. 30% wins assumes ten trades.

Before fees, 1:3 reward/risk breaks even at 25%; 1:2 at 33.3%. Costs, spread, slippage and execution raise the real break-even rate.

## Futures basics
- A futures contract, not a share; long benefits from rising price, short from falling price.
- Points: each contract has a set dollar value per point. A tick is the smallest allowed move.
- Leverage magnifies both gains and losses.
- Margin is collateral while a trade is open, not the maximum possible loss.
- Contracts expire; rollover moves to a later contract according to broker/contract procedures.
- Commissions and exchange fees apply and accumulate with frequent trading.

## Nasdaq figures quoted in the video — NOT verified current terms
| Contract | Point value | Tick | Video intraday margin |
|---|---:|---:|---:|
| Mini (NQ) | $20 | 0.25 = $5 | $1,000 |
| Micro (MNQ) | $2 | 0.25 = $0.50 | $100 |
| Nano | $0.20 | 0.5 = $0.10 | $20 |

Video attributes margins to NinjaTrader. Confirm current contract specifications, product availability, margins and fees with the broker/exchange before funding. The video elsewhere says nano is $1/point; $0.20 matches its own 25-point/$5 example. Source claims only, not recommendations.

## Daily plan and entry checklist
1. Mark daily/60-minute context, then 15-minute reversal zones.
2. Fixed window: about 60–90 minutes/day.
3. Wait for a fast stretched move into a marked zone, short-term trend break, then a pattern such as double bottom; mirror for shorts.
4. Try to disqualify it: key zone? clean pattern? inside window? chasing/frustrated? If concern, skip.
5. Plan stop at 1R and target about 3R before entry; use 5-minute and 1-minute charts to time entry.
6. Write down timeframes, window, setup, invalidation, target and risk.

## Demo-to-live path proposed by video
1. Demo one to two months; seek consistent results in trending, sideways and choppy markets.
2. Video suggests $50–$100, one nano and about $5 risk; not a recommendation or guarantee.
3. Keep market, chart and strategy consistent.
4. Video's ladder: nano, micro, mini; quoted risk $5, $50, $100, $1,000. Do not copy mechanically; scale only after a substantial documented sample and affordable risk.
5. Think in years, not overnight wealth.

## Cautions
- Wins shown are cherry-picked; speaker says so. He took one trade in four days that week.
- Stops can slip or be bypassed in gaps/fast markets; losses can exceed planned risk.
- Speaker closes before session end and avoids overnight/weekend holds; this is his rule, not universal.
- Losses are not capped at margin.
- Speaker says options are more complex and need more capital.
- Speaker discloses a NinjaTrader partnership; compare brokers independently.
- $100-to-$10,000 is a proposed plan, not a demonstrated account result.

**Class rule:** Demo first. Never risk money needed for essentials. Journal every trade including costs. No-trade days can be successful.`;
const plan=[
["start-here","Rules, curriculum, and classroom guide", "# Welcome\nPrivate two-person classroom. Demo first. Define risk before entry. Never widen stops, revenge trade, or chase. Journal every setup including fees/slippage. Never share passwords/API keys. Curriculum: foundations → market structure → setups → risk → demo execution → review. Mention @Trading Floor AI for lessons and quizzes. $5,000/day is an aspiration, not a promise."],
["daily-lessons","Lessons and quizzes","# Lesson roadmap\n1. Stocks, risk, entry/stop, backtesting, responding to losses.\n2. Bid/ask, spread, market and limit orders.\n3. Candlestick bodies/wicks, swing highs/lows, timeframes.\nAsk the bot to quiz each of you separately."],
["small-futures-account","Source notes from the Small Futures Account video",notes],
["risk-management","R multiples, position sizing, stops and costs","# Risk management\nDefine 1R before each practice trade. Estimate point value × stop distance × contracts + costs. Never widen a stop. Slippage/gaps can exceed planned loss. Margin is not a max-loss limit. Track win rate, average win/loss in R, expectancy, drawdown and costs. Before costs: 1:2 needs 33.3% wins; 1:3 needs 25%."],
["trade-journal","Post demo trades using the journal template","# Demo journal\nDate/session:\nMarket/contract:\nTimeframes:\nMarket condition:\nSetup/key level:\nEntry/stop/target:\nPlanned risk (R and $):\nExit/result (R):\nFees/slippage:\nFollowed plan?\nScreenshot before/after:\nLesson learned:"],
["market-discussion","Chart scenarios and invalidation—not blind signals","# Market discussion\nShare ticker/contract, timeframe, marked levels, scenario, and what invalidates it. No blind buy/sell calls; never copy a trade without understanding risk."]
];
client.once("ready",()=>console.log("Trading Floor AI online as "+client.user.tag));
async function setup(m,friendId){
 if(!m.guild)return m.reply("Run setup inside your server.");
 if(!m.member.permissions.has(PermissionFlagsBits.ManageChannels))return m.reply("You need Manage Channels permission.");
 if(!friendId||friendId===m.author.id||!/^\d{17,20}$/.test(friendId))return m.reply("Use: @Trading Floor AI setup @yourfriend — mention your friend so I can make the classroom visible only to you two and the bot.");
 const everyone=m.guild.roles.everyone.id, perms=[{id:everyone,deny:[PermissionFlagsBits.ViewChannel]},{id:m.author.id,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory,PermissionFlagsBits.AttachFiles,PermissionFlagsBits.EmbedLinks]},{id:friendId,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory,PermissionFlagsBits.AttachFiles,PermissionFlagsBits.EmbedLinks]},{id:client.user.id,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory,PermissionFlagsBits.ManageChannels,PermissionFlagsBits.EmbedLinks]}];
 let cat=m.guild.channels.cache.find(c=>c.type===ChannelType.GuildCategory&&c.name==="TRADING FLOOR");
 if(!cat)cat=await m.guild.channels.create({name:"TRADING FLOOR",type:ChannelType.GuildCategory,permissionOverwrites:perms});else await cat.permissionOverwrites.set(perms);
 const made=[];
 for(const [name,topic,content] of plan){
  let ch=m.guild.channels.cache.find(c=>c.type===ChannelType.GuildText&&c.name===name);
  if(!ch)ch=await m.guild.channels.create({name,type:ChannelType.GuildText,parent:cat.id,topic,permissionOverwrites:perms});
  else{await ch.permissionOverwrites.set(perms);if(ch.parentId!==cat.id)await ch.setParent(cat.id);await ch.setTopic(topic)}
  made.push(ch);const recent=await ch.messages.fetch({limit:10}).catch(()=>null);
  if(!recent?.some(x=>x.author.id===client.user.id&&x.content.includes("<!-- trading-floor-seed-v1 -->"))){for(let i=0;i<content.length;i+=1850)await ch.send((i===0?"<!-- trading-floor-seed-v1 -->\n":"")+content.slice(i,i+1850))}
 }
 return m.reply("Private Trading Floor created/updated. Only you, your friend and the bot can view: "+made.map(c=>"<#"+c.id+">").join(" "));
}
client.on("messageCreate",async m=>{
 if(m.author.bot)return;const dm=!m.guild,mentioned=!dm&&m.mentions.has(client.user);if(!dm&&!mentioned)return;
 const friend=m.mentions.users.find(u=>u.id!==client.user.id&&u.id!==m.author.id);
 const prompt=m.content.replace(new RegExp("<@!?"+client.user.id+">","g"),"").replace(friend?new RegExp("<@!?"+friend.id+">","g"):/$^/,"").trim();
 if(/^setup\b/i.test(prompt))return setup(m,friend?.id);
 if(!prompt)return m.reply("I'm here. Ask for a lesson, quiz, chart explanation, risk calculation, or journal review.");
 const key=m.channel.id,h=history.get(key)||[];await m.channel.sendTyping();
 try{const out=await ai.responses.create({model,instructions:system,input:[...h,{role:"user",content:prompt}],max_output_tokens:1200});const answer=(out.output_text||"I could not generate a response.").trim();h.push({role:"user",content:prompt},{role:"assistant",content:answer});history.set(key,h.slice(-24));for(let i=0;i<answer.length;i+=1900)await m.reply(answer.slice(i,i+1900))}
 catch(e){console.error("AI request failed:",e);await m.reply("I hit an error. Check the OpenAI API key and model in Railway variables.")}
});
client.login(process.env.DISCORD_TOKEN);