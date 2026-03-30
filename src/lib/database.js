import Database from 'better-sqlite3';
import path from 'path';

// Database file path
const dbPath = path.resolve('./db/collegeApp.db');
const db = new Database(dbPath);

// ---------- Users Table ----------
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    avatar TEXT,
    email TEXT,
    role TEXT,
    department TEXT,
    bio TEXaT,
    isFollowing INTEGER
  )
`).run();

// ---------- Posts Table ----------
db.prepare(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    authorId TEXT,
    role TEXT,
    avatar TEXT,
    time TEXT,
    content TEXT,
    image TEXT,
    imageHint TEXT,
    likes INTEGER
  )
`).run();

// ---------- Comments Table ----------
db.prepare(`
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    postId INTEGER,
    authorId TEXT,
    avatar TEXT,
    text TEXT,
    likes INTEGER
  )
`).run();

// ---------- Notes Table ----------
db.prepare(`
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    authorId TEXT,
    date TEXT,
    course TEXT,
    branch TEXT,
    year TEXT,
    subject TEXT,
    fileUrl TEXT,
    fileName TEXT,
    fileSize TEXT
  )
`).run();

// ---------- Reels Table ----------
db.prepare(`
  CREATE TABLE IF NOT EXISTS reels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    authorId TEXT,
    avatar TEXT,
    videoUrl TEXT,
    caption TEXT,
    likes INTEGER
  )
`).run();

// ---------- Internships Table ----------
db.prepare(`
  CREATE TABLE IF NOT EXISTS internships (
    id TEXT PRIMARY KEY,
    title TEXT,
    company TEXT,
    location TEXT,
    description TEXT,
    url TEXT,
    uploaderId TEXT,
    postedAt TEXT
  )
`).run();

// ---------- Notifications Table ----------
db.prepare(`
  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    type TEXT,
    title TEXT,
    description TEXT,
    timestamp TEXT,
    read INTEGER,
    link TEXT,
    actorName TEXT,
    actorAvatar TEXT
  )
`).run();

// ---------- Chats Table ----------
db.prepare(`
  CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    users TEXT,  -- JSON array of user ids
    messages TEXT  -- JSON array of messages
  )
`).run();

console.log('SQLite database initialized!');

export default db;
