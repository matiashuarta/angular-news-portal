# Game News Portal

A full-stack gaming news and forum web application built with Angular 19 (frontend) and Node.js + Express + SQLite (backend).

---

## Tech Stack

- **Frontend:** Angular 19 (standalone components), Angular Material, SCSS
- **Backend:** Node.js, Express, SQLite3, JWT authentication
- **Database:** SQLite (local file — not included in the repo)

---

## Getting Started

### 1. Clone the repo

```bash
git clone <repo-url>
cd news_portal
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:

```
JWT_SECRET=your_secret_key_here
PORT=3000
```

Start the server once so it creates the database file and all tables:

```bash
node server.js
```

Once you see `Server running`, stop it with `Ctrl+C`.

### 3. Seed the database

Seed news articles (15 articles across 7 categories):

```bash
node seed-news.js
```

Seed forum categories, topics, and example posts:

```bash
node reset-db.js
```

### 4. Start the backend

```bash
node server.js
```

The API will be available at `http://localhost:3000`.

### 5. Set up the frontend

In a new terminal:

```bash
cd responsive-angular-app
npm install
npx ng serve
```

The app will be available at `http://localhost:4200`.

---

## Creating an Admin Account

Register a new account at `/register` and check the **Admin** checkbox, or register via the API:

```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"yourpassword","isAdmin":true}'
```

---

## Project Structure

```
news_portal/
├── backend/
│   ├── server.js          # Express API + DB table creation
│   ├── seed-news.js        # Seeds 15 news articles
│   ├── reset-db.js         # Cleans junk accounts + seeds forum topics
│   └── news_portal.db      # SQLite database (gitignored, generated locally)
└── responsive-angular-app/
    └── src/app/
        ├── forum/          # Forum feature (categories, topics, posts)
        ├── news-details/   # Article detail page
        ├── profile/        # User profile
        └── ...
```

---

## Notes

- The `.db` file is gitignored — every clone starts with a fresh empty database.
- Run `seed-news.js` and `reset-db.js` after the first server start to populate content.
- The `reset-db.js` script also removes junk/test accounts from the users table and re-seeds all forum topics attributed to the admin user.
