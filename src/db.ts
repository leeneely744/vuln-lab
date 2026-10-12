import Database from "better-sqlite3";
import { hashPassword } from "./session.js";
const db: Database.Database = Database("data/app.db")

export interface User {
  id: number;
  username: string;
  password: string;
}

db.exec(`
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author TEXT NOT NULL,
    body TEXT NOT NULL,
    likes INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS secrets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT,
    value TEXT
  );
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  );
  `);

let records: any = db.prepare("SELECT COUNT(*) as count FROM comments;").get();
if (records?.count === 0) {
  db.exec(`
    INSERT INTO comments(author, body, likes) VALUES('Alice', 'Hello', 1);
    INSERT INTO comments(author, body, likes) VALUES('Bob', 'Hey!', 2);
    INSERT INTO comments(author, body, likes) VALUES('Charlie', 'konnnichiwa', 3);
  `);
}

records = db.prepare("SELECT COUNT(*) as count FROM secrets;").get();
if (records?.count === 0) {
  db.exec(`
    INSERT INTO secrets(label, value) VALUES('api_key', '1a1a1a');
  `);
}

records = db.prepare("SELECT COUNT(*) as count FROM users;").get();
if (records?.count === 0) {
  const hashedPass1 = await hashPassword("1234");
  const hashedPass2 = await hashPassword("5678");
  const hashedPass3 = await hashPassword("90ab");
  db.exec(`
    INSERT INTO users(username, password) VALUES('Alice', '${hashedPass1}');
    INSERT INTO users(username, password) VALUES('Bob', '${hashedPass2}');
    INSERT INTO users(username, password) VALUES('Charlie', '${hashedPass3}');
  `);
}

export { db };
