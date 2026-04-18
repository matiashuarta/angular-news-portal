// seed-news.js — run with: node seed-news.js
// Inserts sample news articles for each category into the SQLite database.

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'news_portal.db'), (err) => {
  if (err) { console.error('DB connection failed:', err); process.exit(1); }
  console.log('Connected to database.');
});

const articles = [
  // ── Nintendo ────────────────────────────────────────────────────────────────
  {
    title: 'Nintendo Switch 2 Officially Revealed: Everything We Know',
    subtitle: 'Bigger screen, magnetic Joy-Cons, and a launch lineup that includes a new Mario Kart',
    image: 'assets/img1.jpg',
    fullText: `Nintendo has officially lifted the curtain on its next-generation console, the Nintendo Switch 2. The device features a larger 7.9-inch LCD screen, redesigned magnetic Joy-Con controllers that click into place, and a more powerful processor built on a custom NVIDIA chipset.\n\nThe launch window has been confirmed for 2025, with a new Mario Kart title serving as the headline release alongside a Zelda remaster and a new 3D Donkey Kong game. The console retains the signature hybrid design that made the original Switch a global phenomenon.\n\nBackward compatibility with existing Switch titles has been confirmed, though some games may require patches to run at higher resolutions. Nintendo also teased online infrastructure improvements, though specifics remain scarce.\n\nPre-order information is expected to arrive within the coming weeks. Pricing has not yet been disclosed.`,
    category: 'Nintendo',
    newsType: 'Top News',
    isTopNews: 1,
    authorName: 'Admin',
  },
  {
    title: 'The Legend of Zelda: Echoes of the Kingdom — First Impressions',
    subtitle: 'Link returns to Hyrule in a surprise Nintendo Direct reveal, and it looks breathtaking',
    image: 'assets/img2.jpg',
    fullText: `Nintendo surprised fans during a mid-year Direct with the first look at The Legend of Zelda: Echoes of the Kingdom, a brand-new entry in the mainline Zelda series built for Nintendo Switch 2.\n\nThe game appears to blend the open-world freedom introduced in Breath of the Wild with a darker tone reminiscent of Majora's Mask. Players will explore a fractured Hyrule where time itself has become unstable, causing ruins and ancient memories to bleed into the present.\n\nThe art style has evolved significantly, featuring more detailed environments, expressive character animations, and a dynamic weather system that visibly affects gameplay. New mechanical puzzles involve manipulating temporal echoes — ghostly replicas of past states of objects and terrain.\n\nNo release window was given, but Nintendo confirmed the title is targeting a 2026 launch exclusively on Nintendo Switch 2.`,
    category: 'Nintendo',
    newsType: 'Other News',
    isTopNews: 0,
    authorName: 'Admin',
  },
  {
    title: 'Metroid Prime 4: Beyond Gets Release Date and Final Trailer',
    subtitle: 'Samus returns in a visually stunning sequel over a decade in the making',
    image: 'assets/img3.jpg',
    fullText: `After years of development turmoil and a full restart in 2019, Metroid Prime 4: Beyond finally has a confirmed release date. Nintendo announced the game will launch exclusively on Nintendo Switch on July 18, 2025, accompanied by a cinematic final trailer.\n\nThe trailer reveals that Samus Aran is investigating a rogue AI network that has infiltrated Galactic Federation systems, hinting at a storyline that directly follows events from Metroid Fusion. Several new alien biomes were shown, including a bioluminescent ocean world and a derelict space station overtaken by parasitic flora.\n\nRetro Studios, the developer behind the original Prime trilogy, confirmed the game runs at a locked 60fps in docked mode and introduces a fully optional third-person camera toggle for exploration segments.\n\nA special edition including a Samus amiibo and a steelbook case will be available at select retailers.`,
    category: 'Nintendo',
    newsType: 'Other News',
    isTopNews: 0,
    authorName: 'Admin',
  },

  // ── Xbox ─────────────────────────────────────────────────────────────────────
  {
    title: 'Xbox Game Pass Gets Its Biggest Month Ever in June',
    subtitle: 'Starfield expansion, Doom: The Dark Ages, and 14 other titles added this month',
    image: 'assets/img4.jpg',
    fullText: `Microsoft has announced what it calls the biggest single month of Xbox Game Pass additions in the service's history. June 2025 brings 16 new titles to the subscription platform, headlined by Doom: The Dark Ages on day one and the long-awaited Shattered Space expansion for Starfield.\n\nOther notable additions include a new Indiana Jones game from MachineGames, a remaster of Fable 2 from Playground Games, and a surprise inclusion of Final Fantasy XVI after its exclusivity period on PlayStation ended.\n\nGame Pass Ultimate subscribers also gain access to five new games through the EA Play integration, including the latest Dragon Age and a remastered version of Mass Effect: Andromeda.\n\nMicrosoft reiterated its commitment to day-one releases for all first-party titles, with the next major Xbox Studio release — a new Perfect Dark — confirmed to arrive day one on Game Pass later this year.`,
    category: 'Xbox',
    newsType: 'Top News',
    isTopNews: 1,
    authorName: 'Admin',
  },
  {
    title: 'Fable Reboot: 20 Minutes of Gameplay Shown at Xbox Showcase',
    subtitle: "Playground Games' long-awaited RPG looks like nothing else on the market",
    image: 'assets/img5.jpg',
    fullText: `Playground Games finally gave fans an extended look at Fable during the Xbox Games Showcase, showing a continuous 20-minute gameplay sequence set in the game's open world.\n\nThe sequence demonstrated fluid combat that blends swords, spells, and firearms in a system that rewards experimentation. The world itself is densely packed with NPCs that remember player actions, adapting their behavior over time. The classic Fable morality system returns with a modern twist: instead of a binary good/evil slider, choices ripple outward and create factional reputation across different settlements.\n\nThe game runs on a modified version of the Forza Motorsport engine, with extraordinary foliage density and dynamic lighting. Voice acting appeared notably strong, with sharp British wit throughout.\n\nFable launches exclusively on Xbox Series X|S and PC in Holiday 2025, with day-one availability on Game Pass.`,
    category: 'Xbox',
    newsType: 'Other News',
    isTopNews: 0,
    authorName: 'Admin',
  },

  // ── PC ───────────────────────────────────────────────────────────────────────
  {
    title: 'NVIDIA RTX 5090 Benchmarks Leak: A Generational Leap or Just a Refresh?',
    subtitle: 'Independent testing surfaces ahead of launch, showing massive gains in ray-traced titles',
    image: 'assets/img6.jpg',
    fullText: `Benchmark results for NVIDIA's upcoming RTX 5090 graphics card have surfaced online ahead of its official launch, and the numbers are generating significant discussion across the PC enthusiast community.\n\nIn ray-traced workloads, the RTX 5090 shows roughly 60–70% improvement over the RTX 4090 at 4K, a generational jump not seen since the RTX 3080 to RTX 4090 transition. Rasterization improvements are more modest at around 35–40%, which some analysts attribute to the continued focus on AI-assisted rendering through DLSS 4.\n\nThe DLSS 4 Multi Frame Generation feature — which can generate up to three synthetic frames for every real one — plays a substantial role in the advertised frame rates, raising questions about latency and image quality from competitive players.\n\nTDP reportedly sits at 600W, requiring a new 16-pin connector configuration. Pricing is expected to start at $1,999 for the Founders Edition.`,
    category: 'PC',
    newsType: 'Top News',
    isTopNews: 1,
    authorName: 'Admin',
  },
  {
    title: 'Half-Life 3 Confirmed? Valve Files Trademarks Hinting at New Entry',
    subtitle: 'A set of new trademark filings from Valve has the internet in a frenzy once again',
    image: 'assets/img1.jpg',
    fullText: `Valve Corporation has filed a series of trademarks related to the Half-Life intellectual property, including what appears to be a new subtitle. The filings, discovered by trademark watchers, include both software and merchandise categories, fueling speculation that an announcement could be imminent.\n\nThis would not be the first time such filings have caused speculation — similar activity preceded the announcement of Half-Life: Alyx in 2019. That title went on to become one of the most critically acclaimed VR games ever made.\n\nIndustry insiders have noted that Valve has been quietly expanding its internal development team over the past two years, with particular emphasis on narrative designers and environment artists — roles consistent with a single-player story-driven sequel.\n\nValve has not commented. Whether this represents Half-Life 3, another VR spin-off, or something else entirely remains unknown.`,
    category: 'PC',
    newsType: 'Other News',
    isTopNews: 0,
    authorName: 'Admin',
  },

  // ── Playstation ──────────────────────────────────────────────────────────────
  {
    title: "Sony's State of Play June 2025: All Announcements Ranked",
    subtitle: 'Ghost of Tsushima 2, a new FromSoftware IP, and a surprise PS5 Pro bundle headlined the show',
    image: 'assets/img2.jpg',
    fullText: `Sony's June State of Play delivered over 40 minutes of new game reveals and updates, and it may have been one of the strongest showings in the PlayStation showcase's history.\n\nThe undisputed highlight was the world premiere of Ghost of Tsushima 2, set in feudal Korea and following a new protagonist. Sucker Punch Productions showed roughly five minutes of gameplay, revealing a dramatically expanded combat system with new weapon types and an environmental stealth mechanic.\n\nFromSoftware appeared with a brief but stunning teaser for an entirely new IP — not Elden Ring 2, not Bloodborne — featuring a science-fiction setting with organic mech suits and what appeared to be a co-op mode.\n\nSony also announced a PS5 Pro bundle paired with a 4K monitor at a competitive price point, aiming to capture the living-room-to-desktop gaming market. PlayStation Plus Extra and Premium tiers received multiple new additions effective immediately.`,
    category: 'Playstation',
    newsType: 'Top News',
    isTopNews: 1,
    authorName: 'Admin',
  },
  {
    title: 'Spider-Man 3 in Development at Insomniac, Targets PS6 Launch Window',
    subtitle: 'Internal documents confirm the next entry is being designed around next-gen hardware from the ground up',
    image: 'assets/img3.jpg',
    fullText: `Following the massive success of Marvel's Spider-Man 2, Insomniac Games has confirmed that a third entry in the series is currently in active development. The studio's creative director confirmed the news in an interview, while noting that the game is being designed primarily for PlayStation 6 hardware.\n\nThe announcement positions Spider-Man 3 as a launch-window title for Sony's next console, rather than a cross-generation release. This represents a notable departure from Sony's recent strategy of supporting PS4 alongside PS5 titles well into the current generation.\n\nInsomniac described the game as "the most ambitious Spider-Man story we've ever told," with both Peter Parker and Miles Morales confirmed to return as playable characters. The studio hinted at a third playable hero without revealing their identity.\n\nNo release date or window was provided. PlayStation 6 is expected to launch in late 2027 or early 2028.`,
    category: 'Playstation',
    newsType: 'Other News',
    isTopNews: 0,
    authorName: 'Admin',
  },

  // ── Esports ──────────────────────────────────────────────────────────────────
  {
    title: 'Team Vitality Win the CS2 Major in Dramatic Fashion',
    subtitle: 'A stunning comeback in the grand final cements Vitality as the most dominant team of 2025',
    image: 'assets/img4.jpg',
    fullText: `Team Vitality claimed the CS2 Major championship in Copenhagen after one of the most dramatic grand finals in tournament history. Facing off against NAVI in a best-of-five series, Vitality came back from a 0-2 deficit to win the next three maps and claim the trophy and the $1,000,000 prize pool.\n\nThe series MVP was ZywOo, who posted a 1.38 rating across the final two maps, including a one-vs-three clutch on the 29th round of the deciding map that swung the entire series momentum.\n\nNAVI's early dominance was built on the back of outstanding performances from s1mple, who has publicly stated this may be his final Major. The French squad's adaptation mid-series — switching to an aggressive eco timing strategy — was widely praised as a coaching masterclass.\n\nWith the Major win, Vitality solidify their number one ranking and qualify directly for the year-end BLAST Premier World Final.`,
    category: 'Esports',
    newsType: 'Top News',
    isTopNews: 1,
    authorName: 'Admin',
  },
  {
    title: 'League of Legends Worlds 2025: Bracket Stage Preview',
    subtitle: 'T1 and JDG Gaming emerge from groups as overwhelming favorites to meet in the final',
    image: 'assets/img5.jpg',
    fullText: `The Worlds 2025 bracket stage is set, and the path to the Summoner's Cup has never looked more contested. T1 topped Group A with a perfect 6-0 record, with Faker posting statistical performances not seen since his peak years in 2016 and 2017.\n\nJDG Gaming, representing the LPL, took Group B with 5-1, with their bot lane duo of Hope and Missing widely considered the best in the world right now. Their victory came despite a shock early loss to Fnatic in week one, which briefly destabilized their group positioning.\n\nThe notable surprise of the group stage was Cloud9 advancing to bracket as the second seed out of Group C. The North American squad narrowly edged out Gen.G in the tiebreaker, in what was one of the most entertaining series of the tournament.\n\nQuarterfinals begin Saturday. A potential T1 vs JDG final would be the most watched Worlds match in the event's fourteen-year history.`,
    category: 'Esports',
    newsType: 'Other News',
    isTopNews: 0,
    authorName: 'Admin',
  },

  // ── Mobile ────────────────────────────────────────────────────────────────────
  {
    title: 'Genshin Impact Version 5.5 Brings a New Region and Overhauled Exploration',
    subtitle: 'HoYoverse reveals Katlan, a wind-swept archipelago with vertical traversal mechanics unlike anything in the game',
    image: 'assets/img6.jpg',
    fullText: `HoYoverse has revealed the full contents of Genshin Impact Version 5.5, headlined by the introduction of Katlan — a brand-new region built around wind currents, aerial combat, and multi-tiered vertical exploration.\n\nUnlike previous regions which were largely horizontal open worlds, Katlan emphasizes height. Characters can now ride updrafts between floating island chains, and a new Glide Mastery system rewards skilled aerial navigation with combat bonuses during descents.\n\nTwo new five-star characters are joining the roster this patch: Aranara, an Anemo swordsman with a passive that creates temporary wind platforms mid-air, and Selene, a Cryo archer whose charged shots curve around terrain.\n\nThe update also includes a permanent expansion to the Serenitea Pot housing system, new multiplayer co-op domains with exclusive cosmetic rewards, and a rerun banner lineup featuring Hu Tao and Kazuha for returning favorites.\n\nVersion 5.5 launches June 11 across all platforms including iOS, Android, and PC.`,
    category: 'Mobile',
    newsType: 'Top News',
    isTopNews: 1,
    authorName: 'Admin',
  },
  {
    title: 'Clash of Clans Introduces Builder Base 3.0 with Async PvP Overhaul',
    subtitle: 'Supercell completely reimagines the secondary village mode after years of community feedback',
    image: 'assets/img1.jpg',
    fullText: `Supercell has announced a sweeping overhaul of Clash of Clans' Builder Base in what is being called the most significant update to the mode since its introduction in 2017.\n\nBuilder Base 3.0 replaces the existing asynchronous attack system with a new League format where players attack and defend within time windows, creating a more competitive and socially engaging experience. Defense replays are now visible in real time, and a new spectator feature lets Clan members watch ongoing Builder Base attacks live.\n\nNew defenses include the Storm Cannon, which charges between shots for a high-damage burst, and the Phantom Barrier, a deployable wall section that absorbs a set amount of damage before collapsing. Several existing defenses have been rebalanced to reduce the dominance of air attack strategies that had made Builder Base feel stale.\n\nThe update rolls out globally across iOS and Android on June 24, with a free cosmetic reward available to all players who log in during the first two weeks.`,
    category: 'Mobile',
    newsType: 'Other News',
    isTopNews: 0,
    authorName: 'Admin',
  },

  // ── Multi (keep some existing-style articles) ─────────────────────────────
  {
    title: 'GTA VI Release Date Confirmed: October 2025 Launch Across All Platforms',
    subtitle: 'Rockstar ends years of silence with a release date and a new gameplay deep-dive trailer',
    image: 'assets/img2.jpg',
    fullText: `After what may be the most anticipated wait in gaming history, Rockstar Games has confirmed that Grand Theft Auto VI will launch on October 17, 2025, simultaneously across PlayStation 5, Xbox Series X|S, and PC.\n\nThe announcement came alongside a 12-minute gameplay deep-dive trailer showing Vice City in unprecedented detail. The city spans three times the playable area of GTA V's Los Santos, with living neighborhoods that change dynamically based on time of day, weather, and player-driven events.\n\nConfirmed for the first time are the game's two protagonists: Lucia, a career criminal recently released from prison, and Jason, a mid-level cartel enforcer whose interests eventually align with hers. The trailer suggests a dual-protagonist structure similar to GTA V, with the ability to switch between characters during open-world exploration.\n\nRockstar also confirmed that GTA Online will receive a massive update on launch day, featuring a rebuilt Vice City with cross-save support from the single-player world state.`,
    category: 'Multi',
    newsType: 'Top News',
    isTopNews: 1,
    authorName: 'Admin',
  },
  {
    title: 'The Game Awards 2025: Game of the Year Nominees Revealed',
    subtitle: 'Six titles compete for the most prestigious prize in gaming, with multiple surprise inclusions',
    image: 'assets/img3.jpg',
    fullText: `Geoff Keighley has unveiled the nominees for The Game Awards 2025, with six titles competing for Game of the Year in what many industry observers are calling the strongest year for gaming since 2017.\n\nThe nominees are: Doom: The Dark Ages (id Software / Bethesda), Elden Ring: Nightreign (FromSoftware), Ghost of Tsushima 2 (Sucker Punch), Fable (Playground Games), Metroid Prime 4: Beyond (Retro Studios), and a surprise entry — Hollow Knight: Silksong, which launched in August to near-universal acclaim after its seven-year development cycle.\n\nSilksong's inclusion drew the loudest reaction from the community, with many considering its belated release the year's most unexpected gaming moment. Team Cherry's sequel currently holds a 97 on Metacritic.\n\nPublic voting is now open and accounts for 10% of the final score alongside the jury vote. The ceremony takes place December 12 at the Peacock Theater in Los Angeles.`,
    category: 'Multi',
    newsType: 'Other News',
    isTopNews: 0,
    authorName: 'Admin',
  },
];

function runMigrations(cb) {
  const silent = () => {};
  db.run(`ALTER TABLE news ADD COLUMN relatedIds TEXT DEFAULT '[]'`, silent);
  db.run(`ALTER TABLE news ADD COLUMN newsType TEXT DEFAULT 'Other News'`, silent);
  db.run(`ALTER TABLE news ADD COLUMN category TEXT DEFAULT 'Multi'`, silent);
  db.run(`ALTER TABLE news ADD COLUMN authorId INTEGER DEFAULT NULL`, silent);
  db.run(`ALTER TABLE news ADD COLUMN authorName TEXT DEFAULT 'Admin'`, silent);
  db.run(`ALTER TABLE news ADD COLUMN createdAt DATETIME DEFAULT CURRENT_TIMESTAMP`, silent);
  db.run(`ALTER TABLE news ADD COLUMN updatedAt DATETIME DEFAULT NULL`, silent, cb);
}

function insertArticles() {
  db.serialize(() => {
    const stmt = db.prepare(`
      INSERT INTO news (title, subtitle, image, fullText, category, newsType, isTopNews, authorName)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const a of articles) {
      stmt.run(
        a.title, a.subtitle, a.image, a.fullText,
        a.category, a.newsType, a.isTopNews, a.authorName,
        (err) => { if (err) console.error('Insert error:', a.title, err); }
      );
      console.log(`  ✓ [${a.category}] ${a.title}`);
    }

    stmt.finalize(() => {
      console.log(`\nDone — inserted ${articles.length} articles.`);
      db.close();
    });
  });
}

db.serialize(() => {
  runMigrations(insertArticles);
});
