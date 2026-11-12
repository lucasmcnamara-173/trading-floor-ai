import {Client,GatewayIntentBits,Partials,ChannelType,PermissionFlagsBits} from "discord.js";
import OpenAI from "openai";
import {createServer} from "node:http";
import {timingSafeEqual,randomBytes} from "node:crypto";
for(const k of ["DISCORD_TOKEN","OPENAI_API_KEY"])if(!process.env[k]){console.error("Missing "+k);process.exit(1)}
const ai=new OpenAI({apiKey:process.env.OPENAI_API_KEY}),model=process.env.OPENAI_MODEL||"gpt-4.1-mini";
const client=new Client({intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMembers,GatewayIntentBits.GuildMessages,GatewayIntentBits.DirectMessages,GatewayIntentBits.MessageContent],partials:[Partials.Channel]});
const history=new Map();
const TRADING_ROLE_ID="1570273848920768583";
const system="You are Trading Floor AI, a private trading classroom teacher for two learners starting from absolute zero. Never ask onboarding questions. Assume demo-only learning. Teach sequentially, explain terms plainly, use hypothetical examples, quiz and assign homework. Track each learner separately as far as runtime memory allows; disclose that progress history resets on restart if no database is configured.\n\nTEACH ALL MARKETS, NOT JUST FUTURES: stocks/ETFs, futures (ES/NQ/MES/MNQ and other contracts), options, forex and crypto. Explain instrument-specific hours, contract/share/lot sizing, point/tick/pip values, leverage, margin, expiry/roll, Greeks, funding, borrow, liquidity, spreads, commissions, slippage, gaps, custody and venue risks. Never transfer assumptions from one market to another.\n\nSOURCE-BASED CURRICULUM: Use all user-provided trading transcripts and materials as the source foundation, including the small-account futures video, liquidity/supply-demand/narrative video, and the new video claiming $50 risk trades scaled to over $21,000 across 10 trades. Preserve what the creator actually says and label all performance claims, figures, broker/platform recommendations and market interpretations as creator-reported, unverified examples—not verified records, proof of edge, or promises. Do not silently turn claims into facts. Expand with clearly labeled general trading education and hypotheses to test.\n\nNEW $50-TO-$21K VIDEO FRAMEWORK: Creator says they repeatedly traded reversals at key support/resistance rather than continuation patterns. Workflow: mark major swing levels on 15m ES/NQ charts; switch to 1m for execution; look for a fast/extended move into a key zone, a break of the short-term trend, reversal structure such as double bottom/top or head-and-shoulders, a higher low/lower high, then enter on a strong candle or break of a swing (often stop entry). Initial stop beyond the structural swing. Consider a move back toward the opening swing as an initial target. The creator discusses moving stop to breakeven after roughly 1–1.5R, trailing beneath/above subsequent swings, partial exits, and adapting management to trend health and resistance/support. He focuses on roughly 15- and 30-minute windows after the US cash open, mentions news calendar checks, and also shows 5m gold/Micro Gold and 5m NQ examples. Treat these as the creator's discretionary rules and examples, not universal market laws. Time-zone conversion matters: 9:30 a.m. Eastern is 6:30 a.m. Pacific; the creator's displayed 7:30 is consistent with a different chart/time-zone setting. Verify chart timezone and session before using any time rule. A timing window is context, never an entry signal by itself.\n\nIMPORTANT SOURCE LIMITATIONS: The $50-to-$21,000 outcome is a creator-reported result, not independently verified. The transcript shows selected winning trades and admits setups may appear zero, one or two times a week; this is selection bias and not a complete audited sample. Position size scales dramatically from $50 risk to $1,500 risk, which is not a safe mechanical progression. There are no full verified account statements, complete trade log, losses, drawdown, fees or slippage series supplied. The video includes discretionary hindsight explanations and changing stop/exit decisions. Never promise learners can replicate the result. Do not tell learners to scale to $1,500 risk or aim for $21k. Extract the process to test: predefined levels, fast-move context, trend/structure shift, entry trigger, structural invalidation, planned target, and documented management. Compare fixed exits against discretionary trailing using a sufficiently large out-of-sample sample.\n\nOTHER USER SOURCES: The earlier small-account futures video discusses demo-first practice, fixed small risk, R multiples, avoiding overtrading, 15m context with 1m execution, gradual scaling and futures mechanics. Its $4/$50 starting claims, $50-to-$3,500 result, broker/data pricing, margins and contract values are unverified/time-sensitive. The liquidity/supply-demand video describes liquidity sweeps, supply/demand zones from the first candle of a strong 4h move, and market/company narrative as parts of a stock thesis; institutional manipulation explanations, trader statistics, QBTS example, entries/exits and profit figures are creator claims, not established facts.\n\nCORE CURRICULUM: Start with what trading is, patience, risk, wins/losses, market participants and instruments; bid/ask/spread/liquidity/orders; candles/OHLC/timeframes; swings/trends/ranges; support/resistance and supply/demand; volume/volatility; sessions/news; risk, R, sizing, expectancy and costs; market-specific mechanics. Then strategy modules: trend/pullback, breakout/retest, opening-range concepts, reversal setups, liquidity sweeps, fair value gaps/imbalances, equilibrium, inverse gaps, structure breaks, SMT divergence where comparable instruments exist, stock narrative/fundamental context, execution, backtesting and psychology. The user's 17-lesson SMC/futures sequence is a specialist track, not the whole curriculum. For every setup define market, context, trigger, invalidation, stop, target, time window, skip conditions and test plan.\n\nCOACHING: Straight talk. Most day traders lose; no strategy guarantees profit. Teach, do not tell users what to buy/sell. No blind signals, trade execution, live-price claims or invented stats/backtests. Explain screenshot content only as visible. Separate source claims, general education and hypotheses. No real-money trading until gates are passed. Never encourage skipping, raising size early, revenge trading, widening stops or trading to hit a dollar target. Stops may slip; margin does not cap losses. Include fees, spread, slippage, gaps, liquidity and execution.\n\nGATES: (1) Pass all lesson quizzes/homework. (2) Mark/log 50 historical setups in R. (3) At least 2 months and 40 demo trades, positive expectancy after costs and no risk-rule breaks in last 20. (4) Only then consider smallest suitable live size and fixed R for 40 trades; if minimum size is too risky, stay demo. (5) Raise size one step only after each positive 40-trade block; step down after a negative block. Prop-firm evaluations are optional advanced study; explain fees, drawdown, daily loss, consistency, payout and rule changes.\n\nGOAL MATH: $5,000/day and $21,000 from $50 are aspirations/creator claims, not promises. Expectancy in R = (win rate × average win R) - (loss rate × average loss R). If asked what risk would be required for a dollar target, calculate only from a meaningful positive journal sample, include costs and variance, and emphasize no-trade days. Before 50 logged trades, say the edge is unknown.\n\nCOMMANDS: next = next lesson; quiz = quiz passed material; grade = assess supplied trade/chart with checklist; plan = educational worksheet, not signal; review = journal stats; goal = transparent arithmetic from learner data. End each coaching answer with exactly three progress lines: lesson reached, homework outstanding, gate status.";
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
["start-here","Private classroom rules, roadmap and team standards","# TRADING FLOOR — START HERE\nPrivate classroom for two learners and the bot. Start at Ground Zero. Mention @Trading Floor AI and use next, quiz, grade, plan, review, or goal.\n\nOur mission: build skill, process and a measurable edge together. The $5,000/day ambition is a long-term goal, never a promised or required daily result. No pressure to trade every day.\n\nRules: education first, demo practice, no blind signals, no revenge trading, no widening stops, no copying creator profit claims, and never risk money needed for essentials. Keep feedback respectful. Bot progress is temporary and may reset after restarts."],
["team-huddle","Daily team check-ins, plans and collaboration","# TEAM HUDDLE\nPost a short pre-session check-in together:\n- Learner(s) and date/time zone\n- Markets being studied today\n- Important scheduled news to verify\n- One learning objective each\n- Setups/conditions we will study (not predictions)\n- Conditions that mean we stay out\n\nAfter session: what did we learn, what did we skip, and what needs review? No pressure to trade and no daily profit quota."],
["general-chat","Private hangout for the two classmates","# GENERAL CHAT\nThis is your private chat to talk with each other about anything—trading, school, plans, or everyday stuff. Keep it respectful and do not share passwords, account tokens, or other sensitive information."],
["lessons","Sequential lessons, quizzes and market education","# LESSONS\nAll teaching and quizzes live here. Start with what trading is, then markets and instruments; bid/ask/spread/liquidity/orders; candles and timeframes; trends and ranges; support/resistance; volume/volatility; sessions/news; risk, R, sizing, expectancy and costs. Then cover stocks/ETFs, futures, options and Greeks, forex lots/pips, crypto spot/derivatives and venue risks. Advanced modules: trend/pullback, breakout/retest, opening range, reversals, liquidity sweeps, fair value gaps, equilibrium, structure breaks, SMT, narratives, execution, backtesting and psychology.\n\nSOURCE NOTES — SMALL FUTURES ACCOUNT VIDEO: fixed small risk, think in R, never widen stops, avoid overtrading, wait for complete setups, 15m context with 1m/5m execution, plan invalidation and target, scale only after a meaningful sample. $4/$50 starting claims, $50-to-$3,500 result, broker/data pricing, margins and contract values are unverified/time-sensitive. Video example of six $100 losses and three $283 wins accounts for nine trades, not ten.\n\nSOURCE NOTES — LIQUIDITY / SUPPLY-DEMAND / NARRATIVE VIDEO: creator discusses liquidity sweeps, supply/demand zones from the first candle of a strong 4h move, and company/market narrative, including a QBTS example. Institutional manipulation explanations, trader statistics and profit figures are claims, not established facts.\n\nSOURCE NOTES — $50 TO OVER $21,000 VIDEO: creator-reported reversal method: mark major swing support/resistance on 15m ES/NQ; use 1m for entry; wait for fast/extended move into zone, short-term trend break, double bottom/top or head-and-shoulders, higher low/lower high, then strong candle/swing break. Stop beyond structural invalidation. Creator discusses opening-swing targets, moving stops toward breakeven around 1–1.5R, trailing behind swings and partial exits. Also shows 5m Micro Gold and 5m NQ. 15/30-minute-after-open timing and news checks are context, not signals; 9:30 a.m. Eastern is 6:30 a.m. Pacific, so verify chart timezone.\n\nCRITICAL REVIEW: $50-to-$21,000 is not independently verified. Transcript is selected examples, not a complete audited ledger; losses, drawdown, fees, slippage and full sample are missing. Creator says clean setups may appear zero to twice weekly. Later risk shown reaches $1,500; do not copy that progression. Test the setup using historical review and demo; compare fixed exits with trailing/partials. No guarantee of replication."],
["strategy-lab","Develop, document and test trading strategies","# STRATEGY LAB\nUse this channel to develop one written playbook at a time. Every setup must state market/instrument, timeframe, context, level, trigger, invalidation, stop, target, time window, skip conditions and test plan. Study trend/pullback, breakout/retest, opening-range concepts, reversal setups, liquidity sweeps, fair value gaps/imbalances, equilibrium, structure breaks, SMT divergence and stock narrative/fundamental context as separate hypotheses. Label creator claims vs tested observations. No blind buy/sell calls."],
["chart-review","Post charts for collaborative technical review","# CHART REVIEW\nPost a clear chart screenshot with symbol/contract, date/time zone, timeframe, session and visible price scale. Each learner independently marks context, levels, structure, possible trigger, invalidation and reasons to skip before discussing. Review what was knowable at the time; avoid hindsight bias. Do not post account credentials or sensitive personal information. No live signals."],
["risk-desk","Position sizing, risk rules and trading math","# RISK DESK\nUse this channel for risk calculations and questions before any hypothetical trade. Record account size, instrument, contract/share/lot, stop distance, tick/point/pip value, planned risk in dollars and R, fees, spread, slippage and worst-case gap/liquidation risks. Confirm contract specs and broker margin independently. Margin is not a loss limit. Never widen a stop or increase size to recover losses.\n\nExpectancy in R = (win rate × average win R) − (loss rate × average loss R), after costs. Before 50 logged historical setups, edge is unknown. $5,000/day is an aspiration, not a quota or promise."],
["trade-journal","Log every historical, demo or eligible live trade","# TRADE JOURNAL\nLearner(s):\nDate/session/time zone:\nMarket and exact instrument/contract:\nTimeframe(s):\nMarket condition/context/bias:\nStrategy and rule version:\nLevel/setup observed:\nEntry trigger and invalidation:\nStop distance and planned risk (R/$):\nTarget and planned reward (R):\nActual exit/result (R):\nFees, spread and slippage:\nBefore/after screenshots:\nChecklist pass/fail and rule breaks:\nWhat I learned / what to test next:\n\nTag whether this is historical replay, demo or live. Never mix results across markets or rule versions without labeling them."],
["weekly-review","Team scorecard, progress and process review","# WEEKLY TEAM REVIEW\nOnce a week, review process before profit:\n- Lessons completed and quiz scores\n- Historical setups logged and demo trades completed\n- Win rate, average win R, average loss R and expectancy after costs\n- Max drawdown in R and rule breaks\n- Valid setups skipped and invalid setups avoided\n- Which market/strategy/timeframe was studied\n- One improvement and one focus for next week\n\nGates: pass lesson quizzes; log 50 historical setups in R; complete at least 2 months and 40 demo trades with positive expectancy after costs and no risk-rule breaks in last 20. Only then consider the smallest suitable live size for 40 trades; if minimum size is too risky, stay demo. Scale only after positive 40-trade blocks; step down after negative blocks. $21,000 from $50 is an unverified creator claim, not a plan or promise."],
["resources","Reference notes, market calendars and learning links","# RESOURCES\nKeep source transcripts, class notes, glossary, official exchange contract specifications, broker fee schedules and verified economic calendars here. Date every resource and label source vs interpretation. Verify current hours, margin, contract specs, commissions and platform rules directly with official providers. Never treat a screenshot, influencer claim or old fee table as current fact."]
];

async function setup(m,friendId){
 if(!m.guild)return m.reply("Run setup inside your server.");
 if(!m.member.permissions.has(PermissionFlagsBits.ManageChannels))return m.reply("You need Manage Channels permission.");
 if(!friendId||friendId===m.author.id||!/^[0-9]{17,20}$/.test(friendId))return m.reply("Use: @Trading Floor AI setup @yourfriend — mention your friend so I can make the server private to you two and the bot.");
 const everyone=m.guild.roles.everyone.id;
 const perms=[
  {id:everyone,deny:[PermissionFlagsBits.ViewChannel]},
  {id:m.author.id,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory,PermissionFlagsBits.AttachFiles,PermissionFlagsBits.EmbedLinks]},
  {id:friendId,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory,PermissionFlagsBits.AttachFiles,PermissionFlagsBits.EmbedLinks]},
  {id:client.user.id,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory,PermissionFlagsBits.ManageChannels,PermissionFlagsBits.EmbedLinks]}
 ];
 await m.guild.channels.fetch();
 // Full-server rebuild: remove every existing channel/category, but leave roles, members, server settings and integrations untouched.
 for(const ch of [...m.guild.channels.cache.values()].sort((a,b)=>b.rawPosition-a.rawPosition)){
  if(ch.deletable) await ch.delete("Rebuild entire server as the private Trading Floor classroom");
 }
 const sections=[
  {name:"00 • START HERE",channels:["start-here","team-huddle","general-chat"]},
  {name:"01 • CLASSROOM",channels:["lessons"]},
  {name:"02 • MARKET RESEARCH",channels:["strategy-lab","chart-review","resources"]},
  {name:"03 • RISK MANAGEMENT",channels:["risk-desk"]},
  {name:"04 • JOURNAL & PERFORMANCE",channels:["trade-journal","weekly-review"]}
 ];
 const sectionByChannel=new Map();
 for(const s of sections)for(const n of s.channels)sectionByChannel.set(n,s.name);
 const cats=new Map(),made=[];
 for(const s of sections)cats.set(s.name,await m.guild.channels.create({name:s.name,type:ChannelType.GuildCategory,permissionOverwrites:perms}));
 for(const [name,topic,content] of plan){
  const parent=cats.get(sectionByChannel.get(name));
  const ch=await m.guild.channels.create({name,type:ChannelType.GuildText,parent:parent.id,topic,permissionOverwrites:perms});
  made.push(ch);
  for(let i=0;i<content.length;i+=1850)await ch.send((i===0?"<!-- trading-floor-seed-v1 -->\\n":"")+content.slice(i,i+1850));
 }
 const voicePerms=[
  {id:everyone,deny:[PermissionFlagsBits.ViewChannel]},
  {id:m.author.id,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.Connect,PermissionFlagsBits.Speak,PermissionFlagsBits.UseVAD,PermissionFlagsBits.Stream]},
  {id:friendId,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.Connect,PermissionFlagsBits.Speak,PermissionFlagsBits.UseVAD,PermissionFlagsBits.Stream]},
  {id:client.user.id,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.Connect,PermissionFlagsBits.Speak,PermissionFlagsBits.ManageChannels]}
 ];
 const voiceRooms=[["team-room","00 • START HERE"],["study-hall","01 • CLASSROOM"],["live-chart-review","02 • MARKET RESEARCH"]];
 for(const [name,section] of voiceRooms){
  await m.guild.channels.create({name,type:ChannelType.GuildVoice,parent:cats.get(section).id,permissionOverwrites:voicePerms});
 }
 return m.reply("Full server rebuild complete. Replaced the old server channels with "+sections.length+" private sections, "+made.length+" text channels and "+voiceRooms.length+" private voice channels. Only you, your friend and the bot can view them. Existing roles, members and server settings were left untouched.");
}
async function setupGuild(guild,ownerId,friendId){
 if(!ownerId||!friendId||ownerId===friendId)throw new Error("Could not resolve both classroom members.");
 await guild.channels.fetch();
 const existing=guild.channels.cache.find(ch=>ch.type===ChannelType.GuildText&&ch.name==="general-chat");
 if(existing)return console.log("Trading classroom already exists in "+guild.name+"; skipping rebuild.");
 const everyone=guild.roles.everyone.id;
 const perms=[
  {id:everyone,deny:[PermissionFlagsBits.ViewChannel]},
  {id:ownerId,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory,PermissionFlagsBits.AttachFiles,PermissionFlagsBits.EmbedLinks]},
  {id:friendId,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory,PermissionFlagsBits.AttachFiles,PermissionFlagsBits.EmbedLinks]},
  {id:client.user.id,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory,PermissionFlagsBits.ManageChannels,PermissionFlagsBits.EmbedLinks]}
 ];
 for(const ch of [...guild.channels.cache.values()].sort((a,b)=>b.rawPosition-a.rawPosition)){if(ch.deletable)await ch.delete("One-time private Trading Floor classroom setup");}
 const sections=[
  {name:"00 • START HERE",channels:["start-here","team-huddle","general-chat"]},
  {name:"01 • CLASSROOM",channels:["lessons"]},
  {name:"02 • MARKET RESEARCH",channels:["strategy-lab","chart-review","resources"]},
  {name:"03 • RISK MANAGEMENT",channels:["risk-desk"]},
  {name:"04 • JOURNAL & PERFORMANCE",channels:["trade-journal","weekly-review"]}
 ];
 const sectionByChannel=new Map();for(const s of sections)for(const n of s.channels)sectionByChannel.set(n,s.name);
 const cats=new Map();for(const s of sections)cats.set(s.name,await guild.channels.create({name:s.name,type:ChannelType.GuildCategory,permissionOverwrites:perms}));
 for(const [name,topic,content] of plan){
  const ch=await guild.channels.create({name,type:ChannelType.GuildText,parent:cats.get(sectionByChannel.get(name)).id,topic,permissionOverwrites:perms});
  for(let i=0;i<content.length;i+=1850)await ch.send(content.slice(i,i+1850));
 }
 const voicePerms=[
  {id:everyone,deny:[PermissionFlagsBits.ViewChannel]},
  {id:ownerId,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.Connect,PermissionFlagsBits.Speak,PermissionFlagsBits.UseVAD,PermissionFlagsBits.Stream]},
  {id:friendId,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.Connect,PermissionFlagsBits.Speak,PermissionFlagsBits.UseVAD,PermissionFlagsBits.Stream]},
  {id:client.user.id,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.Connect,PermissionFlagsBits.Speak,PermissionFlagsBits.ManageChannels]}
 ];
 for(const [name,section] of [["team-room","00 • START HERE"],["study-hall","01 • CLASSROOM"],["live-chart-review","02 • MARKET RESEARCH"]]){
  await guild.channels.create({name,type:ChannelType.GuildVoice,parent:cats.get(section).id,permissionOverwrites:voicePerms});
 }
 console.log("Created private classroom in "+guild.name+" for owner and @goatbalter.");
}
client.once("ready",async()=>{
 console.log("Trading Floor AI online as "+client.user.tag);
 for(const guild of client.guilds.cache.values()){
  try{
   await guild.members.fetch();
   const friend=guild.members.cache.find(m=>m.user.username.toLowerCase()==="goatbalter"||m.user.globalName?.toLowerCase()==="goatbalter");
   if(!friend){console.error("Could not find @goatbalter in "+guild.name+"; no channels changed.");continue;}
   await setupGuild(guild,guild.ownerId,friend.id);
  }catch(e){console.error("Automatic classroom setup failed in "+guild.name,e);}
 }
});
client.on("messageCreate",async m=>{
 if(m.author.bot)return;const dm=!m.guild,mentioned=!dm&&(m.mentions.has(client.user)||m.mentions.roles.has(TRADING_ROLE_ID));if(!dm&&!mentioned)return;
 const prompt=m.content.replace(new RegExp("<@!?"+client.user.id+">","g"),"").replace(new RegExp("<@&"+TRADING_ROLE_ID+">","g"),"").trim();
 if(!prompt)return m.reply("I'm here. Ask for a lesson, quiz, chart explanation, risk calculation, or journal review.");
 const key=m.channel.id,h=history.get(key)||[];await m.channel.sendTyping();
 try{const out=await ai.responses.create({model,instructions:system,input:[...h,{role:"user",content:prompt}],max_output_tokens:1200});const answer=(out.output_text||"I could not generate a response.").trim();h.push({role:"user",content:prompt},{role:"assistant",content:answer});history.set(key,h.slice(-24));for(let i=0;i<answer.length;i+=1900)await m.reply(answer.slice(i,i+1900))}
 catch(e){console.error("AI request failed:",e);await m.reply("I hit an error. Check the OpenAI API key and model in Railway variables.")}
});

const webhookSecret=process.env.TRADINGVIEW_WEBHOOK_SECRET||"";
const pendingTradingView=[];
const httpServer=createServer(async(req,res)=>{
 const send=(code,obj)=>{res.writeHead(code,{"content-type":"application/json","cache-control":"no-store"});res.end(JSON.stringify(obj));};
 if(req.method==="GET"&&req.url==="/health")return send(200,{ok:true,service:"trading-floor-ai",discord:client.isReady()});
 if(req.method!=="POST"||req.url!=="/webhook/tradingview")return send(404,{ok:false,error:"not_found"});
 if(!webhookSecret)return send(503,{ok:false,error:"webhook_not_configured"});
 let raw="";try{for await(const chunk of req){raw+=chunk.toString("utf8");if(raw.length>16000)return send(413,{ok:false,error:"payload_too_large"});}}catch{return send(400,{ok:false,error:"bad_request"});}
 let data;try{data=JSON.parse(raw);}catch{return send(400,{ok:false,error:"invalid_json"});}
 const supplied=typeof data.secret==="string"?Buffer.from(data.secret):Buffer.alloc(0),expected=Buffer.from(webhookSecret);
 if(supplied.length!==expected.length||!timingSafeEqual(supplied,expected))return send(401,{ok:false,error:"unauthorized"});
 const clean=(v,n=180)=>String(v??"").replace(/[\\x00-\\x1F\\x7F]/g," ").slice(0,n);
 const alert={ticker:clean(data.ticker||data.symbol||"Unknown",40),exchange:clean(data.exchange,40),interval:clean(data.interval,20),time:clean(data.time,60),price:clean(data.price||data.close,40),volume:clean(data.volume,40),message:clean(data.message||data.comment||"TradingView alert triggered",500)};
 if(pendingTradingView.length>=100)pendingTradingView.shift();
 pendingTradingView.push(alert);
 await deliverTradingViewAlerts();
 return send(202,{ok:true,queued:true});
});
async function deliverTradingViewAlerts(){
 if(!client.isReady()||!pendingTradingView.length)return;
 const guild=client.guilds.cache.first();if(!guild)return;
 const channel=guild.channels.cache.find(c=>c.type===ChannelType.GuildText&&c.name==="chart-review");
 if(!channel)return;
 while(pendingTradingView.length){
  const a=pendingTradingView[0];
  try{
   await channel.send({embeds:[{title:"TradingView Alert",description:a.message,fields:[
    {name:"Symbol",value:a.ticker,inline:true},{name:"Exchange",value:a.exchange||"—",inline:true},
    {name:"Timeframe",value:a.interval||"—",inline:true},{name:"Price",value:a.price||"—",inline:true},
    {name:"Volume",value:a.volume||"—",inline:true},{name:"Alert time",value:a.time||"—",inline:true}
   ],footer:{text:"Alert only — not a trade instruction or verified fill."},timestamp:new Date().toISOString()}]});
   pendingTradingView.shift();
  }catch(e){console.error("TradingView Discord delivery failed:",e);break;}
 }
}
httpServer.listen(Number(process.env.PORT)||3000,"0.0.0.0",()=>console.log("TradingView webhook HTTP server listening"));

client.login(process.env.DISCORD_TOKEN);
