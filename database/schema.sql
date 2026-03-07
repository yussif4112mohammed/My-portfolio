-- ============================================================
-- schema.sql — Portfolio Database Schema
-- This file documents the database structure.
-- SQLite runs this automatically via server.js,
-- but you can also run it manually for MySQL/PostgreSQL.
-- ============================================================

-- ── Messages Table ───────────────────────────────────────────────────────────
-- Stores every contact form submission from the portfolio website.
-- Each row = one message sent by a visitor.

CREATE TABLE IF NOT EXISTS messages (
  id         INTEGER  PRIMARY KEY AUTOINCREMENT, -- Unique ID for each message
  name       TEXT     NOT NULL,                  -- Visitor's full name
  email      TEXT     NOT NULL,                  -- Visitor's email address
  message    TEXT     NOT NULL,                  -- The message body they typed
  is_read    INTEGER  DEFAULT 0,                 -- 0 = unread, 1 = read (boolean)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP  -- Auto-set when row is inserted
);

-- ── Example of what a row looks like after form submission ───────────────────
-- id: 1
-- name: "Alice Smith"
-- email: "alice@example.com"
-- message: "Hi, I need a pentest for my startup."
-- is_read: 0
-- created_at: "2026-03-06 14:22:10"


-- ── (Optional) Visitor Analytics Table ──────────────────────────────────────
-- Tracks which pages are being viewed and from where.
-- Useful to know if your portfolio is getting traffic.

CREATE TABLE IF NOT EXISTS page_views (
  id         INTEGER  PRIMARY KEY AUTOINCREMENT,
  page       TEXT     NOT NULL,      -- Which page was visited (e.g. "/", "/about")
  ip_hash    TEXT,                   -- Hashed visitor IP (for privacy compliance)
  user_agent TEXT,                   -- Browser/device info
  visited_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


-- ── (Optional) Future: Projects Table ────────────────────────────────────────
-- If you later want to manage portfolio projects from a dashboard
-- instead of hardcoding them in HTML, you'd add a table like this:

CREATE TABLE IF NOT EXISTS projects (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL,          -- Project name
  description TEXT,                      -- Short description
  tags        TEXT,                      -- Comma-separated tags e.g. "pentest,web"
  github_url  TEXT,                      -- Link to GitHub repo
  live_url    TEXT,                      -- Link to live demo
  is_featured INTEGER DEFAULT 0,         -- Show on homepage?
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── Useful Queries ───────────────────────────────────────────────────────────

-- Get all unread messages (newest first):
-- SELECT * FROM messages WHERE is_read = 0 ORDER BY created_at DESC;

-- Count total messages received:
-- SELECT COUNT(*) AS total FROM messages;

-- Mark a message as read:
-- UPDATE messages SET is_read = 1 WHERE id = 1;

-- Get all messages from a specific email:
-- SELECT * FROM messages WHERE email = 'alice@example.com';
