import express from 'express';
import { db } from "../db.js";
import crypto from "crypto";
import { mySessions } from "../session.js";

const router = express.Router();

let token = crypto.randomBytes(16).toString('hex');

router.get("/login", (req, res) => {
    res.render("login");
});

router.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const sql = "SELECT * FROM users WHERE username = ? AND password = ?;";
    const isUser = db.prepare(sql).get(username, password);

    if (isUser) {
        const cSql = "SELECT * FROM comments WHERE author = ?;";
        console.log("cSql: ", cSql);

        const result = db.prepare(cSql).all(username);

        console.log("result: ", result);

        const sessionId = mySessions.size;
        mySessions.set(sessionId, username);
        res.cookie("sessionId", sessionId);

        res.render("comments", { result, token, username: username })
    } else {
        console.log("user is not valid");
        res.redirect("/auth/login")
    }
});

router.get("/logout", (req, res) => {
    //TODO: clear session
    const sessionId = req.cookies.sessionId;
    mySessions.delete(sessionId);
    res.clearCookie("sessionId");
    res.render("login");
})

export default router;
