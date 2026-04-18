// reset-db.js — cleans junk accounts, wipes forum data, re-seeds forum topics
// run with: node reset-db.js

const sqlite3 = require('sqlite3').verbose();
const path    = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'news_portal.db'), err => {
  if (err) { console.error('DB error:', err); process.exit(1); }
  console.log('Connected.\n');
});

// Admin account in the admins table: id=4, username='admin'
const ADMIN_ID       = 4;
const ADMIN_USERNAME = 'admin';

// ── Junk accounts to remove from users table ────────────────────────────────
const JUNK_USERS = [1, 9, 10, 12, 13, 14]; // empty, aa, tata, da, ad2, ad12

const topics = [
  // General
  {
    cat: 'general', pinned: 1,
    title: 'Welcome to the Game News Portal Forum!',
    body: `Hey everyone! Welcome to the official forum for Game News Portal.\n\nThis is your space to discuss gaming news, share your opinions, ask questions, and connect with other gamers.\n\nFeel free to introduce yourself below — what platforms do you game on and what are you currently playing?`,
    replies: [
      { b: 'Glad to be here! Currently playing Elden Ring again on NG+7. Great community.' },
      { b: 'Mostly PC gamer here. Just finished Hollow Knight and looking for the next big thing.' },
      { b: 'Xbox and PC for me. Game Pass has been incredible lately.' },
    ],
  },
  {
    cat: 'general',
    title: 'What game are you most hyped for in 2025?',
    body: `Loads of heavy hitters coming this year. GTA VI, Fable, Metroid Prime 4, Spider-Man sequel news… the list goes on.\n\nWhat's the one game you're most looking forward to?`,
    replies: [
      { b: 'GTA VI without question. Been waiting over a decade.' },
      { b: 'Fable for me. Playground Games crushed Forza so I have massive confidence in them.' },
    ],
  },
  {
    cat: 'general',
    title: 'Game of the Decade debate — what wins?',
    body: `If you had to pick a single game as the defining title of the 2010s, what do you go with?\n\nMy vote: The Witcher 3. It fundamentally changed expectations for what open-world RPGs could be.\n\nArgue your case below.`,
    replies: [
      { b: 'Dark Souls. Nothing else reset the design language of an entire genre the way FromSoftware did.' },
      { b: 'Minecraft. The cultural footprint of that game is untouchable. Billions of hours played.' },
    ],
  },

  // Nintendo
  {
    cat: 'nintendo',
    title: 'Nintendo Switch 2 — price predictions?',
    body: `With the Switch 2 officially confirmed, the big question is pricing. The original launched at $299 in 2017 and it was a hit partly because of that accessibility.\n\nGiven inflation and the upgraded hardware, I'm expecting $379–$399 base. What are your guesses?`,
    replies: [
      { b: '$449 with a pack-in game. Nintendo knows demand is there and will price accordingly.' },
      { b: 'I think $399 is the sweet spot. Higher than that and they risk losing the casual market.' },
    ],
  },
  {
    cat: 'nintendo',
    title: 'Best Zelda game ever made — make your case',
    body: `Classic debate that never gets old. My pick: Majora's Mask — the time loop mechanic, the dark tone, and the density of side quests make it unlike anything else in the series.\n\nBreath of the Wild is obviously the revolution but Majora's Mask has soul that's hard to beat.`,
    replies: [
      { b: 'Ocarina of Time. It defined 3D adventure games and still holds up incredibly well.' },
      { b: 'Tears of the Kingdom. The ultrahand puzzles are the best the series has ever felt.' },
    ],
  },

  // Xbox
  {
    cat: 'xbox',
    title: 'Is Game Pass the best deal in gaming right now?',
    body: `Honest question — is there a better value proposition in gaming than Xbox Game Pass Ultimate right now?\n\nFor the price of roughly one game per month you get: day-one first party releases, EA Play, hundreds of older titles, and cloud gaming.`,
    replies: [
      { b: 'Genuinely amazing value, especially if you play a wide variety. Day-one releases alone justify the price.' },
      { b: 'The catalog depth is incredible. I have played games I never would have bought that are now favorites.' },
    ],
  },
  {
    cat: 'xbox',
    title: 'Fable vs Gears — which franchise deserves a comeback more?',
    body: `With Fable confirmed, Gears fans have been asking when their series gets the same love.\n\nGears 5 was excellent but there has been silence since. Meanwhile Fable is finally happening after years in limbo.\n\nWhich franchise needed the comeback more?`,
    replies: [
      { b: 'Fable without a doubt. The original was something completely unique and has been dormant far too long.' },
      { b: 'Gears. The campaign and horde mode formula is one of the best in gaming. Just needs a strong story.' },
    ],
  },

  // Playstation
  {
    cat: 'playstation',
    title: 'Most underrated PS5 exclusive — what are people sleeping on?',
    body: `We all know God of War, Spider-Man, and Horizon. But what PS5 exclusive deserves way more attention?\n\nI'll start: Returnal. Most people bounced off it because of the difficulty but if you give it 4–5 hours it becomes one of the most satisfying games on the platform.`,
    replies: [
      { b: "Demon's Souls remake. It launched alongside the console and people moved on fast, but it is stunning." },
      { b: "Astro's Playroom. Free with the console and genuinely one of the most joyful games ever made." },
    ],
  },
  {
    cat: 'playstation',
    title: 'Ghost of Tsushima 2 — what do you want to see?',
    body: `With GoT2 confirmed and set in Korea with a new protagonist, speculation is running hot.\n\nPersonally I want: expanded stealth, a larger world, naval combat, and the same incredible wind/photography system.\n\nWhat is on your wishlist?`,
    replies: [
      { b: 'Co-op from the start, not as a separate mode. The online in the original was fantastic but felt like an afterthought.' },
      { b: 'A longer main story. GoT1 was about 25–30 hours which is perfect but I want 40+ for the sequel.' },
    ],
  },

  // PC
  {
    cat: 'pc',
    title: 'RTX 5090 or wait for AMD RDNA 4 — what is the smarter buy?',
    body: `The RTX 5090 benchmarks look impressive but $1,999 is a steep ask. AMD's RDNA 4 flagships are right around the corner and historically provide better rasterization value.\n\nIf you are in the market for a GPU upgrade, what is the play?`,
    replies: [
      { b: 'Always wait for competition to shake out. AMD usually forces Nvidia to drop prices or offer better value.' },
      { b: 'If you need DLSS and ray tracing at 4K, Nvidia is still the only real choice at that level.' },
    ],
  },
  {
    cat: 'pc',
    title: 'Best PC gaming controller that is not an Xbox pad?',
    body: `Xbox controller on PC is the obvious default but there are some genuinely great alternatives now.\n\nI have been using the DualSense on PC and the haptic feedback in supported titles is incredible.\n\nWhat are you using?`,
    replies: [
      { b: 'DualSense is the answer. The adaptive triggers in supported PC titles add a layer Xbox pads cannot match.' },
      { b: '8BitDo Ultimate Controller. Incredible build quality, hall effect sticks, and no drift after 2 years.' },
    ],
  },

  // Esports
  {
    cat: 'esports',
    title: 'CS2 Major results — discuss here',
    body: `Team Vitality just won the CS2 Major after one of the most dramatic grand finals ever. Down 0-2 against NAVI, they came back to win 3-2.\n\nZywOo was absolutely insane in the final two maps. That 1v3 clutch in round 29 will live in esports history.`,
    replies: [
      { b: 'That clutch from ZywOo is one of the greatest individual moments I have ever seen in CS. Unreal.' },
      { b: 'NAVI dominated the first two maps. The mental fortitude from Vitality to come back is extraordinary.' },
    ],
  },
  {
    cat: 'esports',
    title: "Worlds 2025 predictions — who wins the Summoner's Cup?",
    body: `Bracket stage is set. T1 and JDG are the overwhelming favorites but upsets happen at Worlds every year.\n\nMy prediction: T1 over JDG in a 3-2 grand final, with Faker playing the best series of his career since 2022.`,
    replies: [
      { b: 'JDG wins it. The LPL has been dominant and their bot lane is the best in the world right now.' },
      { b: 'Cloud9 dark horse run to semis. NA finally makes noise at Worlds.' },
    ],
  },

  // Mobile
  {
    cat: 'mobile',
    title: 'Genshin Impact 5.5 — first impressions of Katlan?',
    body: `Just spent 4 hours in the new Katlan region and the vertical exploration is genuinely fresh. The updraft traversal mechanic changes how you approach the entire map.\n\nAranara's kit is also great for exploration.`,
    replies: [
      { b: 'The new region is gorgeous. HoYoverse keeps raising the bar for open world design in mobile games.' },
      { b: "Selene is broken in the best way. Her charged shots curving around terrain is actually practical in combat." },
    ],
  },
  {
    cat: 'mobile',
    title: 'Best mobile game for 5 minute sessions?',
    body: `I commute for about 45 minutes a day and want something I can pick up and put down easily. Gacha games feel too demanding with daily resets.\n\nLooking for something satisfying in short bursts that is not pay-to-win.`,
    replies: [
      { b: "Alto's Odyssey. Beautiful, relaxing, no pressure, perfect for commutes." },
      { b: 'Into the Breach is perfect for this. Turn-based, short sessions, deep strategy.' },
    ],
  },

  // Off-Topic
  {
    cat: 'off-topic',
    title: 'What TV show are you watching between gaming sessions?',
    body: `Taking a break between Elden Ring sessions watching The Last of Us on HBO. The production quality is genuinely on par with the best gaming cutscenes I have ever seen.\n\nWhat non-gaming content has been competing with your game time lately?`,
    replies: [
      { b: 'Severance. Nothing else on TV right now comes close. The office-horror vibes are relentless.' },
      { b: 'Shogun remake. Epic scale, incredible performances, and it made me want to play Way of the Samurai again.' },
    ],
  },
];

function cleanUsers(cb) {
  console.log('── Cleaning junk user accounts ─────────────────────────');
  const placeholders = JUNK_USERS.map(() => '?').join(',');
  db.run(`DELETE FROM users WHERE id IN (${placeholders})`, JUNK_USERS, function(err) {
    if (err) console.error('  Error cleaning users:', err.message);
    else console.log(`  ✓ Removed ${this.changes} junk account(s)\n`);
    cb();
  });
}

function wipeForumData(cb) {
  console.log('── Wiping existing forum data ───────────────────────────');
  db.serialize(() => {
    db.run(`DELETE FROM forum_post_likes`);
    db.run(`DELETE FROM forum_posts`);
    db.run(`DELETE FROM forum_topics`);
    db.run(`UPDATE forum_categories SET topic_count = 0`, [], err => {
      if (err) console.error('  Error wiping forum data:', err.message);
      else console.log('  ✓ Forum tables cleared\n');
      cb();
    });
  });
}

function seedTopics() {
  console.log('── Seeding forum topics ─────────────────────────────────');
  let inserted = 0;

  function insertNext(i) {
    if (i >= topics.length) {
      console.log(`\n✓ Done — inserted ${inserted} topics attributed to '${ADMIN_USERNAME}' (id=${ADMIN_ID}).`);
      db.close();
      return;
    }

    const t = topics[i];
    db.get(`SELECT id FROM forum_categories WHERE slug = ?`, [t.cat], (err, cat) => {
      if (!cat) { console.error(`  ✗ Category '${t.cat}' not found`); insertNext(i + 1); return; }

      db.run(
        `INSERT INTO forum_topics (category_id, title, user_id, username, post_count, pinned) VALUES (?,?,?,?,?,?)`,
        [cat.id, t.title, ADMIN_ID, ADMIN_USERNAME, 0, t.pinned || 0],
        function(e2) {
          if (e2) { console.error(`  ✗ Topic error:`, e2.message); insertNext(i + 1); return; }
          const topicId = this.lastID;

          db.run(
            `INSERT INTO forum_posts (topic_id, user_id, username, body) VALUES (?,?,?,?)`,
            [topicId, ADMIN_ID, ADMIN_USERNAME, t.body],
            e3 => {
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
                db.run(
                  `INSERT INTO forum_posts (topic_id, user_id, username, body) VALUES (?,?,?,?)`,
                  [topicId, ADMIN_ID, ADMIN_USERNAME, replies[ri].b],
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

db.serialize(() => {
  cleanUsers(() => wipeForumData(seedTopics));
});
