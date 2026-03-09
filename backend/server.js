/* ============================================================
   server.js — SECURED Node.js + Express Backend
   ✅ F-01: /api/messages protected with auth token
   ✅ F-02: CORS restricted to your domain only
   ✅ F-04: HTTP security headers via helmet
   ✅ F-07: Rate limiting via express-rate-limit
   ✅ F-08: Length validation on all inputs
   ============================================================ */

const express    = require('express');
const path = require('path');
const cors       = require('cors');
const helmet     = require('helmet');              // ✅ FIX F-04
const rateLimit  = require('express-rate-limit'); // ✅ FIX F-07
const bodyParser = require('body-parser');
const sqlite3    = require('sqlite3').verbose();

const app  = express();
const PORT = process.env.PORT || 3000;

// ── ✅ FIX F-04: Helmet — sets ALL critical HTTP security headers ─────────────
// Adds: X-Frame-Options, X-Content-Type-Options, Referrer-Policy & more
app.use(helmet({
  contentSecurityPolicy: false,
}));

// ── ✅ FIX F-02: CORS — only YOUR domain can call this API ────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:5500',
  'https://my-portfolio-xybn.onrender.com',   // ⬅ CHANGE THIS to your real domain
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: origin ${origin} not allowed`));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'x-admin-token'],
  credentials: false
}));

// ── ✅ FIX F-07: Rate Limiting ────────────────────────────────────────────────
// Contact form: max 5 submissions per IP per 15 minutes
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Too many messages sent. Please wait 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API: max 100 requests per IP per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests. Please slow down.' },
});

app.use('/api/', generalLimiter);

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(bodyParser.json({ limit: '10kb' })); // Block oversized payloads
app.use(express.static(path.join(__dirname, '../frontend')));

// ── Database ──────────────────────────────────────────────────────────────────
const db = new sqlite3.Database(
  path.join(__dirname, '../database/portfolio.db'),
  (err) => {
    if (err) {
      console.error('Database connection failed:', err.message);
    } else {
      console.log('Connected to SQLite database.');
      initializeDatabase();
    }
  }
);

function initializeDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id         INTEGER  PRIMARY KEY AUTOINCREMENT,
      name       TEXT     NOT NULL,
      email      TEXT     NOT NULL,
      message    TEXT     NOT NULL,
      is_read    INTEGER  DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Table error:', err.message);
    else      console.log('Messages table ready.');
  });
}

// ── Input Sanitizer — strips HTML tags to prevent stored XSS ─────────────────
function sanitize(str) {
  return String(str)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim();
}

// ── ✅ FIX F-01: Admin token middleware — protects private routes ─────────────
// Set token with: ADMIN_TOKEN=mysecretkey node server.js
function requireAdminToken(req, res, next) {
  const token      = req.headers['x-admin-token'];
  const validToken = process.env.ADMIN_TOKEN;

  if (!validToken) {
    return res.status(503).json({ message: 'Admin access not configured.' });
  }
  if (!token || token !== validToken) {
    console.warn(`Unauthorized admin access attempt from ${req.ip}`);
    return res.status(401).json({ message: 'Unauthorized. Invalid or missing token.' });
  }
  next();
}

// ── Routes ────────────────────────────────────────────────────────────────────

/* POST /api/contact — contact form (rate limited) */
app.post('/api/contact', contactLimiter, (req, res) => {
  const name    = sanitize(req.body.name    || '');
  const email   = sanitize(req.body.email   || '');
  const message = sanitize(req.body.message || '');

  // ✅ FIX F-08: Validate ALL field lengths on backend
  if (!name || !email || !message) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  if (name.length > 100) {
    return res.status(400).json({ message: 'Name too long (max 100 chars).' });
  }
  if (email.length > 254) {
    return res.status(400).json({ message: 'Email too long.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Invalid email format.' });
  }
  if (message.length > 2000) {
    return res.status(400).json({ message: 'Message too long (max 2000 chars).' });
  }

  // Parameterized query — safe from SQL injection
  db.run(
    'INSERT INTO messages (name, email, message) VALUES (?, ?, ?)',
    [name, email, message],
    function(err) {
      if (err) {
        console.error('DB insert error:', err.message);
        return res.status(500).json({ message: 'Server error. Please try again.' });
      }
      console.log(`Message saved — ID: ${this.lastID}, From: ${email}`);
      // Don't expose internal DB ID to users
      res.status(201).json({ message: 'Message received successfully!' });
    }
  );
});

/* GET /api/messages — ✅ FIX F-01: Protected by admin token */
app.get('/api/messages', requireAdminToken, (req, res) => {
  db.all('SELECT id, name, email, message, is_read, created_at FROM messages ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Error fetching messages.' });
    res.json({ messages: rows, count: rows.length });
  });
});

/* PATCH /api/messages/:id/read — mark as read (admin only) */
app.patch('/api/messages/:id/read', requireAdminToken, (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid message ID.' });

  db.run('UPDATE messages SET is_read = 1 WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ message: 'Error updating message.' });
    if (this.changes === 0) return res.status(404).json({ message: 'Message not found.' });
    res.json({ message: 'Marked as read.' });
  });
});

/* GET /api/health — public health check */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' }); // Don't expose port/version in production
});

// ── Global Error Handler — never leak stack traces to client ──────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  if (err.message && err.message.startsWith('CORS blocked')) {
    return res.status(403).json({ message: err.message });
  }
  res.status(500).json({ message: 'An unexpected error occurred.' });
});

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n Secured Portfolio Backend Running!');
  console.log(`   URL: http://localhost:${PORT}`);
  console.log('\n  Set ADMIN_TOKEN env variable to access /api/messages');
  console.log('   Example: ADMIN_TOKEN=mysecret node server.js\n');
});

process.on('SIGINT', () => {
  db.close(() => {
    console.log('\n Server stopped cleanly.');
    process.exit(0);
  });
});
