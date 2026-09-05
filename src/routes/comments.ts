import express from 'express';
import { db } from "../db.js";
import crypto from "crypto";
import { mySessions } from "../session.js";

const router = express.Router();

let token = crypto.randomBytes(16).toString('hex');

router.get("/", (req, res) => {
    const sessionId = req.cookies.sessionId;
    let username = undefined;

    let sql = "";
    let result = undefined;
    if (mySessions.has(sessionId)) {
        username = mySessions.get(sessionId);
        sql = "SELECT * FROM comments WHERE author = ?;";
        result = db.prepare(sql).all(username);
    } else {
        sql = "SELECT * FROM comments;";
        result = db.prepare(sql).all();
    }
    console.log("sql: ", sql);

    token = crypto.randomBytes(16).toString('hex');

    res.render("comments", { result, token, username: undefined });
});

router.post("/", (req, res) => {
    const body = req.body.body;
    const author = req.body.author;

    const sql = "INSERT INTO comments(author, body) VALUES (?, ?);"
    console.log(sql);

    db.prepare(sql).run(author, body);

    res.redirect("/comments");
});

router.post("/:id/delete", (req, res) => {
    const id = req.params.id;
    const received_token = req.body.token;

    console.log("token: ", received_token);
    if (received_token !== token) {
        console.log("CSRF Token is invalid!");
        res.status(403).end();
        return;
    }
    console.log("token is valid.");

    const sql = "DELETE FROM comments WHERE id = ?;"

    db.prepare(sql).run(id);

    res.redirect("/comments");
})

export default router;
