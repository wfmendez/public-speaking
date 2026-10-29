# Everyday AI Agents: Opening Video (≈3:00)

A sung music video that opens the class. It is about **what agents do**, not about the class itself. It plays on its own after one click, in the style of the reference ("LGTM", a music video made with code): a dark app screen with soft out-of-focus lights, app panels, a bar of counters along the top, and the **lyrics lighting up word by word as they are sung**, with a cut on every beat. It runs in the web with live music, at 112 BPM in A minor (1 bar = 2.14 s, 84 bars in total). The melody of every line is written in `src/decks/agents/song.json`.

**Story in one line:** Monday chaos → a chatbot only gives advice → an agent does the work → everything gets solved → *"…but who decides?"* → **You do.**

| # | Part | Time | Bars | Sung (the lyrics on screen) | On screen | Music |
|---|---|---|---|---|---|---|
| 1 | **Intro** | 0:00–0:17 | 8 | *It's Monday, eight A.M. / Wake up, wake up! / Here we go again* | Blinking cursor → *"8:00 AM."* → a line-art clock rings | Soft pad, a single pulse |
| 2 | **Verse 1: the chaos** | 0:17–0:51 | 16 | *Forty-seven emails waiting, a trip I have to plan, homework due on Friday, a game I haven't built, three group chats are blowing up, one dentist I forgot. Too much, too much, it's way too much for me!* | A new card every 2 bars, piling up: inbox (the counter climbs), trip, homework, `game.js`, chats, dentist | Beat comes in; hats → bass, building up |
| 3 | **Pre-chorus: alone** | 0:51–1:08 | 8 | *So I asked a chatbot: "Help me." But the work is still mine. Three, two, one!* | The chat window: *"help me."* is typed → the bot answers (spoken) *"Here are 5 tips…"* → a line-art stick figure alone | The filter closes and a riser builds |
| 4 | **Chorus 1: the agent arrives** | 1:08–1:42 | 16 | *Meet your agent! It searches, it plans, it books, it writes, it tests, it checks! Goal, plan, act, check, on repeat, all night long… it gets the job done right!* | The pixel robot; one verb slams in per sung word; then the loop **Goal → Plan → Act → Check** spins | Drop: full volume, harmony on the voice |
| 5 | **Verse 2: watch it work** | 1:42–2:16 | 16 | *Goal: a weekend in Prague, under one-fifty, make a plan, find the trains, compare the beds, search, calendar, email, check the price: one forty-two, it's done! And it remembers you: trains over buses, every time.* | The trip up close: **Goal** → **Plan** (the list types itself) → **Act** (search, calendar, email) → **Check** (*"€142 ✓"*) → memory: *vegetarian*, *trains > buses* | Groove |
| 6 | **Chorus 2: everything done** | 2:16–2:33 | 8 | *Inbox zero, done! Calendar sorted, done! Homework ready, done! Game is passing, done, done, done!* | Fast montage: inbox 47 → 0 · calendar · homework · game *"tests passing"*; *"Done ✓"* on every hit | Full volume, more energy |
| 7 | **Bridge: the twist** | 2:33–2:46 | 6 | *Done. But is it right? Who decides?* (sung alone, with reverb) | *"Done ✓"* glitches; the question in pink; the cursor blinking | Silence |
| 8 | **Final** | 2:46–3:00 | 6 | *You do! Goal: you! Check: you! Everyday A.I. agents!* | The answer fills the screen → title **Everyday AI Agents** | Back at full volume, then fades to a soft background so you can start talking |

The counters along the top follow the story: *tasks open* climbs with the chaos, *done by agent* climbs in chorus 2 (one task stays open: the dentist is still yours to call), and *decided by* changes from *?* to *you* on "You do!".

## How it works in class
- The screen starts blank and blue. **First click** starts the video; it plays on its own and the music marks the cuts.
- **Next click** during the video skips straight to the title, in case you need to cut it short.
- When it ends, it stays on the title with soft music, and you start talking. The video asks *"who decides?"*; the class answers it and closes with *"You are the DJ."*
- For rehearsal, `/agents?from=128` starts the video at that beat.
