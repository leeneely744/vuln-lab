import Database from "better-sqlite3";
const db: Database.Database = Database("data/app.db")

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

export { db };
