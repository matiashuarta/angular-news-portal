// server.js
try { require('dotenv').config({ path: require('path').join(__dirname, '../.env') }); } catch (_) {}

const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const PORT = process.env.PORT || 3000;

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET env var is not set. Set it before starting the server.');
  process.exit(1);
}

const cors = require('cors');

// CORS configuration — origins loaded from env so no IPs are hardcoded in source
const allowedOrigins = [
    'http://localhost:4200',
    ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : []),
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Access-Control-Allow-Origin',
        'X-Requested-With',
    ],
};

app.use(cors(corsOptions));
app.use(express.json());

// For serving static assets like images
app.use('/assets', express.static(path.join(__dirname, 'assets'), {
    setHeaders: (res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
}));

// Secret key for JWT
const SECRET_KEY = process.env.JWT_SECRET;

// Connect to the SQLite database with error logging
const db = new sqlite3.Database(path.join(__dirname, 'news_portal.db'), (err) => {
  if (err) {
    console.error('Could not connect to database:', err);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// <-- Cambios: Crear tabla "votes" si no existe
db.serialize(() => {
  db.run(`PRAGMA foreign_keys = ON;`);

  // Core tables — safe to run every startup (IF NOT EXISTS guards them)
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      isAdmin INTEGER DEFAULT 0,
      avatar TEXT DEFAULT 'gamepad'
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      newsId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      text TEXT NOT NULL,
      parentCommentId INTEGER DEFAULT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (newsId) REFERENCES news(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Column migrations — silent error means column already exists, which is fine
  const silent = () => {};
  db.run(`ALTER TABLE news ADD COLUMN relatedIds TEXT DEFAULT '[]'`, silent);
  db.run(`ALTER TABLE news ADD COLUMN newsType TEXT DEFAULT 'Other News'`, silent);
  db.run(`ALTER TABLE news ADD COLUMN category TEXT DEFAULT 'Multi'`, silent);
  db.run(`ALTER TABLE news ADD COLUMN authorId INTEGER DEFAULT NULL`, silent);
  db.run(`ALTER TABLE news ADD COLUMN authorName TEXT DEFAULT 'Admin'`, silent);
  db.run(`ALTER TABLE news ADD COLUMN createdAt DATETIME DEFAULT CURRENT_TIMESTAMP`, silent);
  db.run(`ALTER TABLE news ADD COLUMN updatedAt DATETIME DEFAULT NULL`, silent);
  db.run(`ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT 'gamepad'`, silent);
  db.run(`ALTER TABLE admins ADD COLUMN avatar TEXT DEFAULT 'gamepad'`, silent);
  db.run(`
    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      newsId INTEGER NOT NULL,
      voteType TEXT NOT NULL CHECK (voteType IN ('like','dislike')),
      CONSTRAINT unique_vote UNIQUE (userId, newsId)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS comment_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      commentId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      voteType TEXT NOT NULL CHECK (voteType IN ('like','dislike')),
      CONSTRAINT unique_comment_vote UNIQUE (commentId, userId)
    )
  `);

  // Ensure the default admin account exists with the well-known seed password.
  // Anyone who clones the repo gets a working admin login immediately after
  // running the server. Change this password via the profile page after first login.
  const SEED_ADMIN = { username: 'admin', password: 'Admin1234!' };
  bcrypt.hash(SEED_ADMIN.password, 10, (err, hash) => {
    if (err) return;
    db.run(
      `INSERT INTO admins (username, password, isAdmin) VALUES (?, ?, 1)
       ON CONFLICT(username) DO UPDATE SET password = excluded.password`,
      [SEED_ADMIN.username, hash],
      () => console.log(`Admin account ready — username: ${SEED_ADMIN.username}`)
    );
  });
});
// <-- Fin Cambios

// Register Regular User or Admin
app.post('/api/register', async (req, res) => {
  const { username, password, isAdmin } = req.body;
  console.log('Registration attempt for:', username, 'as', isAdmin ? 'Admin' : 'User');

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const table = isAdmin ? 'admins' : 'users';

    db.run(
      `INSERT INTO ${table} (username, password, isAdmin) VALUES (?, ?, ?)`,
      [username, hashedPassword, isAdmin ? 1 : 0],
      function (err) {
        if (err) {
          console.error('Error registering user:', err);
          return res.status(400).json({ error: 'User already exists' });
        }
        console.log('User registered successfully in', table, 'table');
        res.json({ message: `${isAdmin ? 'Admin' : 'User'} registered successfully` });
      }
    );
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// Login Endpoint — checks users table first, falls back to admins table
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  console.log('Login attempt for:', username);

  const tryLogin = (user) => {
    if (!user) {
      console.log('User not found in either table');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    bcrypt.compare(password, user.password, (err, isValid) => {
      if (err || !isValid) {
        console.log('Invalid password for user');
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const token = jwt.sign(
        { id: user.id, username: user.username, isAdmin: user.isAdmin === 1 },
        SECRET_KEY,
        { expiresIn: '1h' }
      );
      console.log('Token generated for', user.username);
      return res.json({ token });
    });
  };

  db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (user) return tryLogin(user);
    // Not in users — try admins table
    db.get(`SELECT * FROM admins WHERE username = ?`, [username], (err2, admin) => {
      if (err2) return res.status(500).json({ error: 'Database error' });
      tryLogin(admin);
    });
  });
});

// Verify Token Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  console.log('Received token:', token);
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      console.log('Token verification failed:', err);
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.user = user;
    console.log('User from token:', user);
    next();
  });
}

// GET /api/news => Return all news items
app.get('/api/news', (req, res) => {
  db.all('SELECT * FROM news', [], (err, rows) => {
    if (err) {
      console.error('Error fetching news:', err);
      return res.status(500).json({ error: 'Database error while fetching news' });
    }
    res.json(rows);
  });
});

// <-- Cambios en GET /api/news/:id para calcular likes/dislikes
app.get('/api/news/:id', (req, res) => {
  const { id } = req.params;
  db.get(`SELECT * FROM news WHERE id = ?`, [id], (err, item) => {
    if (err) {
      console.error('Error fetching news item:', err);
      return res.status(500).json({ error: 'Database error while fetching news item' });
    }
    if (!item) {
      return res.status(404).json({ error: 'Not found' });
    }

    item.relatedIds = JSON.parse(item.relatedIds || '[]');
    item.isTopNews = item.isTopNews === 1;

    // Primero calculamos likes y dislikes de la tabla "votes"
    const voteSql = `
      SELECT
        SUM(CASE WHEN voteType = 'like' THEN 1 ELSE 0 END) as totalLikes,
        SUM(CASE WHEN voteType = 'dislike' THEN 1 ELSE 0 END) as totalDislikes
      FROM votes
      WHERE newsId = ?
    `;

    db.get(voteSql, [id], (errCount, voteCounts) => {
      if (errCount) {
        console.error('Error counting votes:', errCount);
        return res.status(500).json({ error: 'Database error while counting votes' });
      }
      // Asigna likes/dislikes al item
      item.likes = voteCounts.totalLikes || 0;
      item.dislikes = voteCounts.totalDislikes || 0;

      // Resolve related articles:
      // - manual picks if relatedIds set, otherwise auto-fetch by same category
      const mapRow = row => ({ ...row, relatedIds: JSON.parse(row.relatedIds || '[]'), isTopNews: row.isTopNews === 1 });

      if (item.relatedIds.length) {
        db.all(
          `SELECT * FROM news WHERE id IN (${item.relatedIds.map(() => '?').join(',')})`,
          item.relatedIds,
          (errRel, related) => {
            if (errRel) return res.status(500).json({ error: 'Database error while fetching related news' });
            res.json({ news: item, related: related.map(mapRow) });
          }
        );
      } else {
        db.all(
          `SELECT * FROM news WHERE category = ? AND id != ? ORDER BY id DESC LIMIT 4`,
          [item.category, item.id],
          (errRel, related) => {
            if (errRel) return res.status(500).json({ error: 'Database error while fetching related news' });
            res.json({ news: item, related: related.map(mapRow) });
          }
        );
      }
    });
  });
});
// <-- Fin Cambios en GET /api/news/:id

// <-- Cambios: Nueva ruta POST /api/news/:id/vote para like/dislike
app.post('/api/news/:id/vote', authenticateToken, (req, res) => {
  const newsId = req.params.id;
  const userId = req.user.id; // Proviene del token
  const { voteType } = req.body; // "like", "dislike", o "none"

  // Verificamos si la noticia existe (opcional)
  // db.get(`SELECT id FROM news WHERE id = ?`, [newsId], (errNews, rowNews) => {...})

  // Buscamos si ya existe un voto
  db.get(`SELECT * FROM votes WHERE userId = ? AND newsId = ?`, [userId, newsId], (err, row) => {
    if (err) {
      console.error('Error checking vote:', err);
      return res.status(500).json({ error: 'Database error checking vote' });
    }

    if (!row) {
      // NO hay voto previo => Insert
      if (voteType === 'none') {
        return res.json({ message: 'No vote to remove, user had not voted' });
      }
      // Insert con "like" o "dislike"
      db.run(
        `INSERT INTO votes (userId, newsId, voteType) VALUES (?, ?, ?)`,
        [userId, newsId, voteType],
        function (errInsert) {
          if (errInsert) {
            console.error('Error inserting vote:', errInsert);
            return res.status(500).json({ error: 'Database error inserting vote' });
          }
          return res.json({ message: `Voted ${voteType}` });
        }
      );
    } else {
      // YA existe => row.voteType
      if (voteType === 'none') {
        // quitar voto => DELETE
        db.run(`DELETE FROM votes WHERE id = ?`, [row.id], function (errDelete) {
          if (errDelete) {
            console.error('Error deleting vote:', errDelete);
            return res.status(500).json({ error: 'Database error deleting vote' });
          }
          return res.json({ message: 'Vote removed' });
        });
      } else {
        // Cambiar "like" a "dislike" o viceversa => UPDATE
        db.run(
          `UPDATE votes SET voteType = ? WHERE id = ?`,
          [voteType, row.id],
          function (errUpdate) {
            if (errUpdate) {
              console.error('Error updating vote:', errUpdate);
              return res.status(500).json({ error: 'Database error updating vote' });
            }
            return res.json({ message: `Vote changed to ${voteType}` });
          }
        );
      }
    }
  });
});
// <-- Fin Cambios: Nueva ruta POST /api/news/:id/vote

// Cascade demotion: keep only the newest N articles in each section.
// Latest News (isTopNews) → overflow goes to More News
// More News (Other News)  → overflow goes to Past News (Vertical News)
const MAX_TOP_NEWS   = 14;
const MAX_OTHER_NEWS = 15;

function cascadeDemotion(cb) {
  db.serialize(() => {
    // Keep newest MAX_TOP_NEWS as top news, demote the rest to Other News
    db.run(`
      UPDATE news SET isTopNews = 0, newsType = 'Other News'
      WHERE isTopNews = 1
        AND id NOT IN (
          SELECT id FROM news WHERE isTopNews = 1 ORDER BY id DESC LIMIT ?
        )
    `, [MAX_TOP_NEWS]);

    // Keep newest MAX_OTHER_NEWS as Other News, demote the rest to Vertical News
    db.run(`
      UPDATE news SET newsType = 'Vertical News'
      WHERE newsType = 'Other News'
        AND id NOT IN (
          SELECT id FROM news WHERE newsType = 'Other News' ORDER BY id DESC LIMIT ?
        )
    `, [MAX_OTHER_NEWS], cb);
  });
}

// Create News
app.post('/api/news', authenticateToken, (req, res) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { title, subtitle, image, fullText, isTopNews, relatedIds, newsType, category } = req.body;
  const authorId = req.user.id;
  const authorName = req.user.username;

  db.run(
    `INSERT INTO news (title, subtitle, image, fullText, isTopNews, relatedIds, newsType, category, authorId, authorName, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [title, subtitle, image, fullText, isTopNews ? 1 : 0, JSON.stringify(relatedIds || []), newsType, category || 'Multi', authorId, authorName],
    function (err) {
      if (err) {
        console.error('Error creating news:', err);
        return res.status(500).json({ error: 'Database error while creating news' });
      }
      const newId = this.lastID;
      cascadeDemotion(() => res.status(201).json({ message: 'News created successfully', id: newId }));
    }
  );
});

// Delete News
app.delete('/api/news/:id', authenticateToken, (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { id } = req.params;

  db.run(`DELETE FROM news WHERE id = ?`, [id], (err) => {
    if (err) {
      console.error('Error deleting news:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'News deleted' });
  });
});

// Update News
app.put('/api/news/:id', authenticateToken, (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const id = req.params.id;
  const { title, subtitle, image, fullText, isTopNews, relatedIds, newsType, category } = req.body;

  db.run(
    `UPDATE news
     SET title = ?, subtitle = ?, image = ?, fullText = ?,
         isTopNews = ?, relatedIds = ?, newsType = ?, category = ?,
         updatedAt = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [title, subtitle, image, fullText, isTopNews ? 1 : 0, JSON.stringify(relatedIds || []), newsType, category || 'Multi', id],
    function (err) {
      if (err) {
        console.error('Error updating news:', err);
        return res.status(500).json({ error: 'Database error while updating news' });
      }
      cascadeDemotion(() => res.json({ message: 'News updated successfully' }));
    }
  );
});

// <-- CHANGES: Handle comments -->
// Get comments by news ID
// GET comments for a specific news article
app.get('/api/news/:id/comments', (req, res) => {
    const newsId = req.params.id;
    console.log('Fetching comments for news ID:', newsId);
    db.all(
      `SELECT c.*, u.username 
       FROM comments c 
       JOIN users u ON c.userId = u.id 
       WHERE c.newsId = ? 
       ORDER BY c.timestamp ASC`,
       [newsId],
       (err, rows) => {
         if (err) {
           console.error('Error fetching comments:', err);
           return res.status(500).json({ error: 'Database error fetching comments' });
         }
         console.log('Comments fetched:', rows);
         res.json(rows);
       }
     );
 });
  
 // Add Comment or Reply (POST)
app.post('/api/news/:id/comments', authenticateToken, (req, res) => {
    const newsId = req.params.id;
    const userId = req.user.id;
    const { text, parentCommentId } = req.body;

    console.log('Attempting to add comment or reply:', { newsId, userId, text, parentCommentId });

    db.run(
        `INSERT INTO comments (newsId, userId, text, parentCommentId) VALUES (?, ?, ?, ?)`,
        [newsId, userId, text, parentCommentId || null],
        function (err) {
            if (err) {
                console.error('Error adding comment:', err);
                return res.status(500).json({ error: 'Database error adding comment' });
            }
            console.log('Comment added with ID:', this.lastID);
            res.status(201).json({ id: this.lastID, message: 'Comment added' });
        }
    );
});

// Edit a Comment
app.put('/api/comments/:id', authenticateToken, (req, res) => {
    const commentId = req.params.id;
    const userId = req.user.id;
    const { text } = req.body;

    db.run(
        `UPDATE comments SET text = ? WHERE id = ? AND userId = ?`,
        [text, commentId, userId],
        function (err) {
            if (err) {
                console.error('Error editing comment:', err);
                return res.status(500).json({ error: 'Database error editing comment' });
            }
            if (this.changes === 0) {
                return res.status(403).json({ error: 'Forbidden: Comment not found or not owned by user' });
            }
            res.json({ message: 'Comment edited' });
        }
    );
});

// Delete a Comment
app.delete('/api/comments/:id', authenticateToken, (req, res) => {
    const commentId = req.params.id;
    const userId = req.user.id;

    db.run(
        `DELETE FROM comments WHERE id = ? AND userId = ?`,
        [commentId, userId],
        function (err) {
            if (err) {
                console.error('Error deleting comment:', err);
                return res.status(500).json({ error: 'Database error deleting comment' });
            }
            if (this.changes === 0) {
                return res.status(403).json({ error: 'Forbidden: Comment not found or not owned by user' });
            }
            res.json({ message: 'Comment deleted' });
        }
    );
});
  
// Vote on a comment (like / dislike)
app.post('/api/comments/:id/vote', authenticateToken, (req, res) => {
  const commentId = req.params.id;
  const userId = req.user.id;
  const { voteType } = req.body; // "like" or "dislike"

  if (!['like', 'dislike'].includes(voteType)) {
    return res.status(400).json({ error: 'Invalid voteType' });
  }

  db.get(`SELECT id FROM comments WHERE id = ?`, [commentId], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!row) return res.status(404).json({ error: 'Comment not found' });

    db.run(
      `INSERT INTO comment_votes (commentId, userId, voteType)
       VALUES (?, ?, ?)
       ON CONFLICT(commentId, userId) DO UPDATE SET voteType = excluded.voteType`,
      [commentId, userId, voteType],
      function (errVote) {
        if (errVote) return res.status(500).json({ error: 'Database error saving vote' });
        res.json({ message: `Comment voted ${voteType}` });
      }
    );
  });
});

// ── Profile endpoints ─────────────────────────────────────────────────────────
app.get('/api/profile', authenticateToken, (req, res) => {
  const { id, isAdmin } = req.user;
  const table = isAdmin ? 'admins' : 'users';
  db.get(`SELECT id, username, avatar FROM ${table} WHERE id = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!row) return res.status(404).json({ error: 'User not found' });
    res.json(row);
  });
});

app.put('/api/profile', authenticateToken, async (req, res) => {
  const { id, isAdmin } = req.user;
  const table = isAdmin ? 'admins' : 'users';
  const { avatar, password } = req.body;

  if (!avatar) return res.status(400).json({ error: 'Avatar is required' });

  const finish = (err) => {
    if (err) {
      console.error('Profile update error:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Profile updated' });
  };

  try {
    if (password && password.length >= 6) {
      const hashed = await bcrypt.hash(password, 10);
      db.run(`UPDATE ${table} SET avatar = ?, password = ? WHERE id = ?`, [avatar, hashed, id], finish);
    } else {
      db.run(`UPDATE ${table} SET avatar = ? WHERE id = ?`, [avatar, id], finish);
    }
  } catch (e) {
    console.error('Profile update exception:', e);
    res.status(500).json({ error: String(e) });
  }
});

// <-- END CHANGES -->

// ═══════════════════════════════════════════════════════════════════════════
// FORUM
// ═══════════════════════════════════════════════════════════════════════════

// Forum tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS forum_categories (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      slug        TEXT UNIQUE NOT NULL,
      description TEXT,
      icon        TEXT DEFAULT '💬',
      color       TEXT DEFAULT '#ff9800',
      sort_order  INTEGER DEFAULT 0,
      topic_count INTEGER DEFAULT 0
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS forum_topics (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id  INTEGER NOT NULL,
      title        TEXT NOT NULL,
      user_id      INTEGER,
      username     TEXT NOT NULL,
      post_count   INTEGER DEFAULT 0,
      view_count   INTEGER DEFAULT 0,
      pinned       INTEGER DEFAULT 0,
      locked       INTEGER DEFAULT 0,
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_post_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES forum_categories(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS forum_posts (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id   INTEGER NOT NULL,
      user_id    INTEGER,
      username   TEXT NOT NULL,
      body       TEXT NOT NULL,
      like_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (topic_id) REFERENCES forum_topics(id) ON DELETE CASCADE
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS forum_post_likes (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      UNIQUE (post_id, user_id),
      FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE
    )
  `);

  // Seed categories once
  const cats = [
    { name: 'General',    slug: 'general',     desc: 'General gaming discussions',        icon: '🎮', color: '#ff9800', sort: 0 },
    { name: 'Nintendo',   slug: 'nintendo',    desc: 'Switch, Mario, Zelda, and more',    icon: '🔴', color: '#e4000f', sort: 1 },
    { name: 'Xbox',       slug: 'xbox',        desc: 'Xbox Series X/S, Game Pass & PC',   icon: '🟢', color: '#107c10', sort: 2 },
    { name: 'Playstation',slug: 'playstation', desc: 'PS5, exclusives and Sony news',     icon: '🔵', color: '#003087', sort: 3 },
    { name: 'PC Gaming',  slug: 'pc',          desc: 'Hardware, mods, and PC titles',     icon: '🖥️', color: '#00b4d8', sort: 4 },
    { name: 'Esports',    slug: 'esports',     desc: 'Competitive gaming and tournaments',icon: '🏆', color: '#a855f7', sort: 5 },
    { name: 'Mobile',     slug: 'mobile',      desc: 'iOS, Android and handheld gaming',  icon: '📱', color: '#f97316', sort: 6 },
    { name: 'Off-Topic',  slug: 'off-topic',   desc: 'Anything that doesn\'t fit above',  icon: '💬', color: '#666',    sort: 7 },
  ];
  const insertCat = db.prepare(
    `INSERT OR IGNORE INTO forum_categories (name,slug,description,icon,color,sort_order) VALUES (?,?,?,?,?,?)`
  );
  cats.forEach(c => insertCat.run(c.name, c.slug, c.desc, c.icon, c.color, c.sort));
  insertCat.finalize();
});

// ── Helpers ────────────────────────────────────────────────────────────────
function forumAuth(req, res, next) {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Login required' });
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user; next();
  });
}

// ── GET /api/forum/categories ──────────────────────────────────────────────
app.get('/api/forum/categories', (req, res) => {
  db.all(`
    SELECT fc.*,
      (SELECT COUNT(*) FROM forum_topics ft WHERE ft.category_id = fc.id) AS topic_count
    FROM forum_categories fc
    ORDER BY fc.sort_order
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ categories: rows });
  });
});

// ── GET /api/forum/stats ───────────────────────────────────────────────────
app.get('/api/forum/stats', (req, res) => {
  db.get(`SELECT COUNT(*) AS cnt FROM users`, [], (e1, r1) => {
    db.get(`SELECT COUNT(*) AS cnt FROM forum_topics`, [], (e2, r2) => {
      db.get(`SELECT COUNT(*) AS cnt FROM forum_posts`, [], (e3, r3) => {
        res.json({ members: r1?.cnt || 0, topics: r2?.cnt || 0, posts: r3?.cnt || 0 });
      });
    });
  });
});

// ── GET /api/forum/topics/hot ──────────────────────────────────────────────
app.get('/api/forum/topics/hot', (req, res) => {
  db.all(`
    SELECT ft.*, fc.name AS category_name
    FROM forum_topics ft
    JOIN forum_categories fc ON ft.category_id = fc.id
    ORDER BY ft.post_count DESC, ft.view_count DESC
    LIMIT 5
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ topics: rows });
  });
});

// ── GET /api/forum/me/rank ─────────────────────────────────────────────────
app.get('/api/forum/me/rank', forumAuth, (req, res) => {
  db.get(`SELECT COUNT(*) AS cnt FROM forum_posts WHERE user_id = ?`, [req.user.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    const cnt = row?.cnt || 0;
    let rank = 'Lurker';
    if (cnt >= 200) rank = 'Legend';
    else if (cnt >= 50) rank = 'Veteran';
    else if (cnt >= 10) rank = 'Regular';
    else if (cnt >= 1)  rank = 'Recruit';
    res.json({ post_count: cnt, rank });
  });
});

// ── GET /api/forum/topics ──────────────────────────────────────────────────
app.get('/api/forum/topics', (req, res) => {
  const { category, page = '1' } = req.query;
  const perPage = 20;
  const offset  = (parseInt(page) - 1) * perPage;

  if (category) {
    db.get(`SELECT id FROM forum_categories WHERE slug = ?`, [category], (err, cat) => {
      if (err || !cat) return res.status(404).json({ error: 'Category not found' });
      db.get(`SELECT COUNT(*) AS cnt FROM forum_topics WHERE category_id = ?`, [cat.id], (e2, r2) => {
        db.all(`
          SELECT ft.*, fc.name AS category_name, fc.slug AS category_slug
          FROM forum_topics ft JOIN forum_categories fc ON ft.category_id = fc.id
          WHERE ft.category_id = ?
          ORDER BY ft.pinned DESC, ft.last_post_at DESC
          LIMIT ? OFFSET ?
        `, [cat.id, perPage, offset], (e3, rows) => {
          if (e3) return res.status(500).json({ error: e3.message });
          res.json({ topics: rows, total: r2?.cnt || 0, page: parseInt(page), per_page: perPage });
        });
      });
    });
  } else {
    db.get(`SELECT COUNT(*) AS cnt FROM forum_topics`, [], (e2, r2) => {
      db.all(`
        SELECT ft.*, fc.name AS category_name, fc.slug AS category_slug
        FROM forum_topics ft JOIN forum_categories fc ON ft.category_id = fc.id
        ORDER BY ft.pinned DESC, ft.last_post_at DESC
        LIMIT ? OFFSET ?
      `, [perPage, offset], (e3, rows) => {
        if (e3) return res.status(500).json({ error: e3.message });
        res.json({ topics: rows, total: r2?.cnt || 0, page: parseInt(page), per_page: perPage });
      });
    });
  }
});

// ── GET /api/forum/topics/:id ──────────────────────────────────────────────
app.get('/api/forum/topics/:id', (req, res) => {
  const id = parseInt(req.params.id);
  db.get(`
    SELECT ft.*, fc.name AS category_name, fc.slug AS category_slug,
           fc.icon AS category_icon, fc.color AS category_color
    FROM forum_topics ft JOIN forum_categories fc ON ft.category_id = fc.id
    WHERE ft.id = ?
  `, [id], (err, topic) => {
    if (err || !topic) return res.status(404).json({ error: 'Topic not found' });
    db.run(`UPDATE forum_topics SET view_count = view_count + 1 WHERE id = ?`, [id]);
    db.all(`
      SELECT fp.*,
        (SELECT COUNT(*) FROM forum_posts fp2 WHERE fp2.user_id = fp.user_id) AS user_post_count
      FROM forum_posts fp
      WHERE fp.topic_id = ?
      ORDER BY fp.created_at ASC
    `, [id], (e2, posts) => {
      if (e2) return res.status(500).json({ error: e2.message });
      res.json({ topic, posts: posts || [] });
    });
  });
});

// ── POST /api/forum/topics ─────────────────────────────────────────────────
app.post('/api/forum/topics', forumAuth, (req, res) => {
  const { category, title, body } = req.body;
  if (!category || !title?.trim() || !body?.trim())
    return res.status(400).json({ error: 'category, title and body are required' });

  db.get(`SELECT id FROM forum_categories WHERE slug = ?`, [category], (err, cat) => {
    if (err || !cat) return res.status(404).json({ error: 'Category not found' });
    db.run(
      `INSERT INTO forum_topics (category_id, title, user_id, username) VALUES (?,?,?,?)`,
      [cat.id, title.trim(), req.user.id, req.user.username],
      function(e2) {
        if (e2) return res.status(500).json({ error: e2.message });
        const topicId = this.lastID;
        db.run(
          `INSERT INTO forum_posts (topic_id, user_id, username, body) VALUES (?,?,?,?)`,
          [topicId, req.user.id, req.user.username, body.trim()],
          (e3) => {
            if (e3) return res.status(500).json({ error: e3.message });
            db.run(`UPDATE forum_topics SET post_count = 1 WHERE id = ?`, [topicId]);
            db.run(`UPDATE forum_categories SET topic_count = topic_count + 1 WHERE id = ?`, [cat.id]);
            res.status(201).json({ topic: { id: topicId, title: title.trim() } });
          }
        );
      }
    );
  });
});

// ── POST /api/forum/topics/:id/posts ──────────────────────────────────────
app.post('/api/forum/topics/:id/posts', forumAuth, (req, res) => {
  const topicId = parseInt(req.params.id);
  const { body } = req.body;
  if (!body?.trim()) return res.status(400).json({ error: 'body is required' });

  db.get(`SELECT id, locked FROM forum_topics WHERE id = ?`, [topicId], (err, topic) => {
    if (err || !topic) return res.status(404).json({ error: 'Topic not found' });
    if (topic.locked) return res.status(403).json({ error: 'Topic is locked' });
    db.run(
      `INSERT INTO forum_posts (topic_id, user_id, username, body) VALUES (?,?,?,?)`,
      [topicId, req.user.id, req.user.username, body.trim()],
      function(e2) {
        if (e2) return res.status(500).json({ error: e2.message });
        const postId = this.lastID;
        db.run(`UPDATE forum_topics SET post_count = post_count + 1, last_post_at = CURRENT_TIMESTAMP WHERE id = ?`, [topicId]);
        db.get(`SELECT * FROM forum_posts WHERE id = ?`, [postId], (e3, post) => {
          res.status(201).json({ post });
        });
      }
    );
  });
});

// ── POST /api/forum/posts/:id/like ────────────────────────────────────────
app.post('/api/forum/posts/:id/like', forumAuth, (req, res) => {
  const postId = parseInt(req.params.id);
  db.get(`SELECT id FROM forum_post_likes WHERE post_id = ? AND user_id = ?`, [postId, req.user.id], (err, existing) => {
    if (existing) {
      db.run(`DELETE FROM forum_post_likes WHERE post_id = ? AND user_id = ?`, [postId, req.user.id], () => {
        db.run(`UPDATE forum_posts SET like_count = MAX(0, like_count - 1) WHERE id = ?`, [postId]);
        res.json({ liked: false });
      });
    } else {
      db.run(`INSERT INTO forum_post_likes (post_id, user_id) VALUES (?,?)`, [postId, req.user.id], () => {
        db.run(`UPDATE forum_posts SET like_count = like_count + 1 WHERE id = ?`, [postId]);
        res.json({ liked: true });
      });
    }
  });
});

// ── DELETE /api/forum/posts/:id ────────────────────────────────────────────
app.delete('/api/forum/posts/:id', forumAuth, (req, res) => {
  db.get(`SELECT * FROM forum_posts WHERE id = ?`, [parseInt(req.params.id)], (err, post) => {
    if (err || !post) return res.status(404).json({ error: 'Post not found' });
    if (post.user_id !== req.user.id && !req.user.isAdmin)
      return res.status(403).json({ error: 'Not authorized' });
    db.run(`DELETE FROM forum_posts WHERE id = ?`, [post.id], () => {
      db.run(`UPDATE forum_topics SET post_count = MAX(0, post_count - 1) WHERE id = ?`, [post.topic_id]);
      res.json({ message: 'Post deleted' });
    });
  });
});

// ── DELETE /api/forum/topics/:id ────────────────────────────────────────────
app.delete('/api/forum/topics/:id', forumAuth, (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin only' });
  db.get(`SELECT * FROM forum_topics WHERE id = ?`, [parseInt(req.params.id)], (err, topic) => {
    if (err || !topic) return res.status(404).json({ error: 'Topic not found' });
    db.run(`DELETE FROM forum_topics WHERE id = ?`, [topic.id], () => {
      db.run(`UPDATE forum_categories SET topic_count = MAX(0, topic_count - 1) WHERE id = ?`, [topic.category_id]);
      res.json({ message: 'Topic deleted' });
    });
  });
});

// ── GET /api/forum/posts/:id/liked ────────────────────────────────────────
app.get('/api/forum/posts/:id/liked', forumAuth, (req, res) => {
  db.get(`SELECT id FROM forum_post_likes WHERE post_id = ? AND user_id = ?`,
    [parseInt(req.params.id), req.user.id],
    (err, row) => res.json({ liked: !!row })
  );
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
