# CyberSec Portfolio — Full-Stack Project

## Project Structure

```
portfolio/
├── frontend/
│   ├── index.html      ← HTML structure only
│   ├── styles.css      ← All visual styling
│   └── script.js       ← Animations + form submission
│
├── backend/
│   ├── server.js       ← Node.js + Express API
│   └── package.json    ← Node dependencies
│
└── database/
    ├── schema.sql      ← Database design (reference)
    └── portfolio.db    ← Auto-created by server.js (SQLite file)
```

## How to Run

### Frontend Only (no backend)
Just open `frontend/index.html` in your browser using Live Server in VS Code.
The contact form will show a message that the backend is not connected.

### Full Stack (frontend + backend + database)

1. Install Node.js from https://nodejs.org

2. Open terminal in the `backend/` folder:
   ```
   cd backend
   npm install
   node server.js
   ```

3. Open http://localhost:3000 in your browser

The contact form will now save messages to the SQLite database!
