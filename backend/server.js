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

      // Luego resolvemos las "related"
      db.all(
        `SELECT * FROM news WHERE id IN (${item.relatedIds.map(() => '?').join(',')})`,
        item.relatedIds,
        (errRel, related) => {
          if (errRel) {
            console.error('Error fetching related news:', errRel);
            return res.status(500).json({ error: 'Database error while fetching related news' });
          }
          const relatedNews = related.map(row => ({
            ...row,
            relatedIds: JSON.parse(row.relatedIds || '[]'),
            isTopNews: row.isTopNews === 1
          }));
          res.json({ news: item, related: relatedNews });
        }
      );
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

// Create News
app.post('/api/news', authenticateToken, (req, res) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Cambios: añadir "category"
  const { title, subtitle, image, fullText, isTopNews, relatedIds, newsType, category } = req.body;

  db.run(
    `INSERT INTO news (title, subtitle, image, fullText, isTopNews, relatedIds, newsType, category)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title,
      subtitle,
      image,
      fullText,
      isTopNews ? 1 : 0,
      JSON.stringify(relatedIds || []),
      newsType,
      category || 'Multi'
    ],
    function (err) {
      if (err) {
        console.error('Error creating news:', err);
        return res.status(500).json({ error: 'Database error while creating news' });
      }
      res.status(201).json({
        message: 'News created successfully',
        news: {
          id: this.lastID.toString(),
          title,
          subtitle,
          image,
          fullText,
          isTopNews: !!isTopNews,
          relatedIds: relatedIds || [],
          newsType,
          category: category || 'Multi'
        }
      });
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
     SET title = ?,
         subtitle = ?,
         image = ?,
         fullText = ?,
         isTopNews = ?,
         relatedIds = ?,
         newsType = ?,
         category = ?
     WHERE id = ?`,
    [
      title,
      subtitle,
      image,
      fullText,
      isTopNews ? 1 : 0,
      JSON.stringify(relatedIds || []),
      newsType,
      category || 'Multi',
      id
    ],
    function (err) {
      if (err) {
        console.error('Error updating news:', err);
        return res.status(500).json({ error: 'Database error while updating news' });
      }
      res.json({ message: 'News updated successfully' });
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

// <-- END CHANGES -->

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
