// seed-forum.js — run with: node seed-forum.js
// Inserts example topics and posts for each forum category.

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'news_portal.db'), (err) => {
  if (err) { console.error('DB connection failed:', err); process.exit(1); }
  console.log('Connected.');
});

// Bot usernames for variety
const bots = ['GamerPro99', 'NightOwl', 'PixelHunter', 'RetroFan', 'DigitalNomad', 'VoidWalker', 'LevelUp'];

const topics = [
  // General
  {
    cat: 'general',
    title: 'Welcome to the Game News Portal Forum!',
    body: `Hey everyone! Welcome to the official forum for Game News Portal.\n\nThis is your space to discuss gaming news, share your opinions, ask questions, and connect with other gamers.\n\nFeel free to introduce yourself below — what platforms do you game on and what are you currently playing?`,
    replies: [
      { u: 'PixelHunter', b: 'Glad to be here! Currently playing Elden Ring again on NG+7. Great forum!' },
      { u: 'RetroFan',    b: 'Mostly PC gamer here. Just finished Hollow Knight and looking for the next big thing. This forum looks great.' },
      { u: 'NightOwl',    b: 'Xbox and PC for me. Game Pass has been incredible lately.' },
    ],
    pinned: 1,
  },
  {
    cat: 'general',
    title: 'What game are you most hyped for in 2025?',
    body: `Loads of heavy hitters coming this year. GTA VI, Fable, Metroid Prime 4, Spider-Man 2 sequel news… the list goes on.\n\nWhat's the one game you're most looking forward to? Drop your pick below and why.`,
    replies: [
      { u: 'GamerPro99', b: 'GTA VI without question. I have been waiting for this for over a decade.' },
      { u: 'VoidWalker',  b: 'Fable for me. Playground Games crushed Forza so I have massive confidence in them.' },
      { u: 'LevelUp',     b: 'Metroid Prime 4 is the one. The original trilogy is in my top 5 of all time.' },
    ],
  },
  {
    cat: 'general',
    title: 'Game of the Decade debate — what wins?',
    body: `If you had to pick a single game as the defining title of the 2010s, what do you go with?\n\nMy vote: The Witcher 3. It fundamentally changed expectations for what open-world RPGs could be.\n\nArgue your case below.`,
    replies: [
      { u: 'DigitalNomad', b: 'Dark Souls. Nothing else reset the design language of an entire genre the way FromSoftware did.' },
      { u: 'PixelHunter',  b: 'Minecraft. The cultural footprint of that game is untouchable. Billions of hours played.' },
    ],
  },

  // Nintendo
  {
    cat: 'nintendo',
    title: 'Nintendo Switch 2 — price predictions?',
    body: `With the Switch 2 officially confirmed, the big question is pricing. The original launched at $299 in 2017 and it was a hit partly because of that accessibility.\n\nGiven inflation and the upgraded hardware, I'm expecting $379–$399 base. What are your guesses?`,
    replies: [
      { u: 'RetroFan',  b: '$449 with a pack-in game. Nintendo knows demand is there and will price accordingly.' },
      { u: 'NightOwl',  b: 'I think $399 is the sweet spot. Higher than that and they risk losing the casual market that made the original huge.' },
      { u: 'LevelUp',   b: 'The Mario Kart bundle will probably land at $449. Standalone console at $379.' },
    ],
  },
  {
    cat: 'nintendo',
    title: 'Best Zelda game ever made — make your case',
    body: `Classic debate that never gets old. My personal pick is Majora's Mask — the time loop mechanic, the dark tone, and the density of side quests make it unlike anything else in the series.\n\nBreath of the Wild is obviously the revolution but Majora's Mask has soul that's hard to beat.`,
    replies: [
      { u: 'GamerPro99',  b: 'Ocarina of Time. It defined 3D adventure games and still holds up incredibly well.' },
      { u: 'VoidWalker',  b: 'Wind Waker. The art style, the sailing, the sense of adventure — it is pure magic.' },
      { u: 'PixelHunter', b: 'Tears of the Kingdom for me. The ultrahand puzzles are the best the series has ever felt.' },
    ],
  },

  // Xbox
  {
    cat: 'xbox',
    title: 'Is Game Pass the best deal in gaming right now?',
    body: `Honest question — is there a better value proposition in gaming than Xbox Game Pass Ultimate right now?\n\nFor the price of roughly one game per month you get: day-one first party releases, EA Play, hundreds of older titles, and cloud gaming.\n\nAm I missing something or is this genuinely the best deal going?`,
    replies: [
      { u: 'DigitalNomad', b: 'It is genuinely amazing value, especially if you play a wide variety. The day-one releases alone justify the price.' },
      { u: 'RetroFan',     b: 'The catalog depth is incredible. I have played games I never would have bought that are now all-time favorites.' },
      { u: 'NightOwl',     b: 'Sony needs a proper answer to this. PS Plus still does not come close to Game Pass day-one.' },
    ],
  },
  {
    cat: 'xbox',
    title: 'Fable vs Gears — which Xbox franchise deserves a comeback more?',
    body: `With Fable confirmed and deep in development, Gears fans have been asking when their series gets the same love.\n\nGears 5 was actually excellent but there has been silence since. Meanwhile Fable is finally happening after years in limbo.\n\nWhich franchise do you think needed the comeback more?`,
    replies: [
      { u: 'LevelUp',     b: 'Fable without a doubt. The original was something completely unique and the franchise has been dormant far too long.' },
      { u: 'GamerPro99',  b: 'Gears. The campaign and horde mode formula is one of the best in gaming. Just needs a strong story.' },
    ],
  },

  // Playstation
  {
    cat: 'playstation',
    title: 'Most underrated PS5 exclusive — what are people sleeping on?',
    body: `We all know God of War, Spider-Man, and Horizon. But what PS5 exclusive do you think deserves way more attention than it gets?\n\nI'll start: Returnal. Most people bounced off it because of the difficulty but if you give it 4–5 hours it becomes one of the most satisfying games on the platform.`,
    replies: [
      { u: 'VoidWalker',  b: 'Demon\'s Souls remake. It launched alongside the console and people moved on fast, but it is absolutely stunning.' },
      { u: 'PixelHunter', b: 'Astro\'s Playroom. Free with the console and it is genuinely one of the most joyful games ever made.' },
      { u: 'RetroFan',    b: 'Returnal is the right answer. Once it clicked for me I played it obsessively for two weeks.' },
    ],
  },
  {
    cat: 'playstation',
    title: 'Ghost of Tsushima 2 — what do you want to see?',
    body: `With GoT2 confirmed and set in Korea with a new protagonist, the speculation is running hot.\n\nPersonally I want: expanded stealth options, a larger world with more biome variety, naval combat (optional), and the same incredible wind/photography system.\n\nWhat is on your wishlist?`,
    replies: [
      { u: 'DigitalNomad', b: 'Co-op from the start, not as a separate mode. The online in the original was fantastic but felt like an afterthought.' },
      { u: 'NightOwl',     b: 'A longer main story. GoT1 was about 25–30 hours which is perfect but I want 40+ for the sequel.' },
    ],
  },

  // PC
  {
    cat: 'pc',
    title: 'RTX 5090 or wait for AMD RDNA 4 — what is the smarter buy?',
    body: `The RTX 5090 benchmarks look impressive but $1,999 is a steep ask. AMD's RDNA 4 flagships are right around the corner and historically provide better rasterization value.\n\nIf you are in the market for a GPU upgrade right now, what is the play?`,
    replies: [
      { u: 'GamerPro99',  b: 'Always wait for competition to shake out. AMD usually forces Nvidia to either drop prices or offer better value.' },
      { u: 'LevelUp',     b: 'If you need DLSS and ray tracing at 4K, Nvidia is still the only real choice at that level.' },
      { u: 'PixelHunter', b: 'Wait for RDNA 4. If AMD delivers, prices across the board will get better. If they do not, you still know what you are buying.' },
    ],
  },
  {
    cat: 'pc',
    title: 'Best PC gaming controller that is not an Xbox pad?',
    body: `Xbox controller on PC is the obvious default but there are some genuinely great alternatives now.\n\nI have been using the DualSense on PC and the haptic feedback in supported titles is incredible. The DualSense Edge is expensive but for competitive games the back buttons are worth it.\n\nWhat are you using?`,
    replies: [
      { u: 'VoidWalker',  b: 'DualSense is the answer. The adaptive triggers in supported PC titles add a layer that Xbox pads cannot match.' },
      { u: 'RetroFan',    b: '8BitDo Ultimate Controller. Incredible build quality, hall effect sticks, and no drift after 2 years of heavy use.' },
    ],
  },

  // Esports
  {
    cat: 'esports',
    title: 'CS2 Major results thread — discuss here',
    body: `Team Vitality just won the CS2 Major after one of the most dramatic grand finals ever. Down 0-2 against NAVI, they came back to win 3-2.\n\nZywOo was absolutely insane in the final two maps. That 1v3 clutch in round 29 is going to live in esports history.\n\nYour thoughts?`,
    replies: [
      { u: 'GamerPro99',  b: 'That clutch from ZywOo is one of the greatest individual moments I have ever seen in CS. Unreal.' },
      { u: 'DigitalNomad', b: 'NAVI absolutely dominated the first two maps. The mental fortitude from Vitality to come back from that is extraordinary.' },
      { u: 'NightOwl',     b: 'S1mple retiring rumors after this loss are going to be loud. He played great but the team let him down.' },
    ],
  },
  {
    cat: 'esports',
    title: 'Worlds 2025 predictions — who wins the Summoner\'s Cup?',
    body: `Bracket stage is set. T1 and JDG are the overwhelming favorites but upsets happen at Worlds every year.\n\nMy prediction: T1 over JDG in a 3-2 grand final, with Faker playing the best series of his career since 2022.\n\nWhat is your bracket pick?`,
    replies: [
      { u: 'LevelUp',     b: 'JDG wins it. The LPL has been dominant and their bot lane is the best in the world. T1 will push them but JDG takes it.' },
      { u: 'PixelHunter', b: 'Cloud9 dark horse run to semis. NA finally makes noise at Worlds.' },
    ],
  },

  // Mobile
  {
    cat: 'mobile',
    title: 'Genshin Impact 5.5 — first impressions of Katlan?',
    body: `Just spent 4 hours in the new Katlan region and I have to say the vertical exploration is genuinely fresh. The updraft traversal mechanic changes how you approach the entire map.\n\nAranara's kit is also insane for exploration — creating platforms mid-air is exactly what I have wanted since Sumeru.\n\nWhat are your first impressions?`,
    replies: [
      { u: 'RetroFan',    b: 'The new region is gorgeous. HoYoverse keeps raising the bar for open world design in mobile games.' },
      { u: 'VoidWalker',  b: 'Selene is broken in the best way. Her charged shots curving around terrain is actually practical in combat, not just a visual effect.' },
      { u: 'GamerPro99',  b: 'Pulled for Aranara and got her in 40 pulls. The gameplay is exactly as good as it looked in the trailer.' },
    ],
  },
  {
    cat: 'mobile',
    title: 'Best mobile game for 5 minute sessions?',
    body: `I commute for about 45 minutes a day and want something I can pick up and put down easily. Gacha games feel too demanding with daily resets.\n\nLooking for something satisfying in short bursts that is not pay-to-win. Any recommendations?`,
    replies: [
      { u: 'DigitalNomad', b: 'Alto\'s Odyssey. Beautiful, relaxing, no pressure, perfect for commutes.' },
      { u: 'NightOwl',     b: 'Into the Breach is perfect for this. Turn-based, short sessions, deep strategy.' },
      { u: 'LevelUp',      b: 'Vampire Survivors mobile. The 15-minute runs fit a commute perfectly and it is endlessly replayable.' },
    ],
  },

  // Off-Topic
  {
    cat: 'off-topic',
    title: 'What TV show are you watching between gaming sessions?',
    body: `Taking a break between Elden Ring sessions watching The Last of Us on HBO. The production quality is genuinely on par with the best gaming cutscenes I have ever seen — makes sense given the source material.\n\nWhat non-gaming content has been competing with your game time lately?`,
    replies: [
      { u: 'PixelHunter', b: 'Severance. Nothing else on TV right now comes close. The office-horror vibes are relentless.' },
      { u: 'RetroFan',    b: 'Shogun remake. Epic scale, incredible performances, and it made me want to play Way of the Samurai again.' },
      { u: 'VoidWalker',  b: 'Rewatching Arcane before Season 2. The animation is still the best I have ever seen.' },
    ],
  },
];

function seedTopics() {
  let inserted = 0;

  function insertNext(i) {
    if (i >= topics.length) {
      console.log(`\nDone — inserted ${inserted} topics with replies.`);
      db.close();
      return;
    }

    const t = topics[i];
    const botUser = bots[i % bots.length];

    db.get(`SELECT id FROM forum_categories WHERE slug = ?`, [t.cat], (err, cat) => {
      if (!cat) { console.error(`  ✗ Category '${t.cat}' not found`); insertNext(i + 1); return; }

      db.run(
        `INSERT INTO forum_topics (category_id, title, user_id, username, post_count, pinned) VALUES (?,?,?,?,?,?)`,
        [cat.id, t.title, 1, botUser, 0, t.pinned || 0],
        function(e2) {
          if (e2) { console.error(`  ✗ Topic error:`, e2.message); insertNext(i + 1); return; }
          const topicId = this.lastID;

          db.run(
            `INSERT INTO forum_posts (topic_id, user_id, username, body) VALUES (?,?,?,?)`,
            [topicId, 1, botUser, t.body],
            (e3) => {
              if (e3) { console.error(`  ✗ Post error:`, e3.message); insertNext(i + 1); return; }

              let replyCount = 0;
              const replies = t.replies || [];

              function insertReply(ri) {
                if (ri >= replies.length) {
                  const total = 1 + replyCount;
                  db.run(`UPDATE forum_topics SET post_count = ? WHERE id = ?`, [total, topicId]);
                  db.run(`UPDATE forum_categories SET topic_count = topic_count + 1 WHERE id = ?`, [cat.id]);
                  console.log(`  ✓ [${t.cat}] "${t.title}" (${total} posts)`);
                  inserted++;
                  insertNext(i + 1);
                  return;
                }
                const r = replies[ri];
                db.run(
                  `INSERT INTO forum_posts (topic_id, user_id, username, body) VALUES (?,?,?,?)`,
                  [topicId, 1, r.u, r.b],
                  () => { replyCount++; insertReply(ri + 1); }
                );
              }

              insertReply(0);
            }
          );
        }
      );
    });
  }

  insertNext(0);
}

// Bootstrap: create tables + seed categories, then seed topics
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS forum_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, description TEXT,
    icon TEXT DEFAULT '💬', color TEXT DEFAULT '#ff9800',
    sort_order INTEGER DEFAULT 0, topic_count INTEGER DEFAULT 0
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS forum_topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT, category_id INTEGER NOT NULL,
    title TEXT NOT NULL, user_id INTEGER, username TEXT NOT NULL,
    post_count INTEGER DEFAULT 0, view_count INTEGER DEFAULT 0,
    pinned INTEGER DEFAULT 0, locked INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_post_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES forum_categories(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS forum_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT, topic_id INTEGER NOT NULL,
    user_id INTEGER, username TEXT NOT NULL, body TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (topic_id) REFERENCES forum_topics(id) ON DELETE CASCADE
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS forum_post_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL, UNIQUE (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE
  )`);

  const cats = [
    { name: 'General',     slug: 'general',     desc: 'General gaming discussions',         icon: '🎮', color: '#ff9800', sort: 0 },
    { name: 'Nintendo',    slug: 'nintendo',    desc: 'Switch, Mario, Zelda, and more',     icon: '🔴', color: '#e4000f', sort: 1 },
    { name: 'Xbox',        slug: 'xbox',        desc: 'Xbox Series X/S, Game Pass & PC',    icon: '🟢', color: '#107c10', sort: 2 },
    { name: 'Playstation', slug: 'playstation', desc: 'PS5, exclusives and Sony news',      icon: '🔵', color: '#003087', sort: 3 },
    { name: 'PC Gaming',   slug: 'pc',          desc: 'Hardware, mods, and PC titles',      icon: '🖥️', color: '#00b4d8', sort: 4 },
    { name: 'Esports',     slug: 'esports',     desc: 'Competitive gaming and tournaments', icon: '🏆', color: '#a855f7', sort: 5 },
    { name: 'Mobile',      slug: 'mobile',      desc: 'iOS, Android and handheld gaming',   icon: '📱', color: '#f97316', sort: 6 },
    { name: 'Off-Topic',   slug: 'off-topic',   desc: "Anything that doesn't fit above",    icon: '💬', color: '#666',    sort: 7 },
  ];
  const stmt = db.prepare(
    `INSERT OR IGNORE INTO forum_categories (name,slug,description,icon,color,sort_order) VALUES (?,?,?,?,?,?)`
  );
  cats.forEach(c => stmt.run(c.name, c.slug, c.desc, c.icon, c.color, c.sort));
  stmt.finalize(seedTopics);
});
