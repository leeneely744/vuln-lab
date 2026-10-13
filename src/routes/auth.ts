import express from 'express';
import { db, type User } from "../db.js";
import { mySessions } from "../session.js";
import { verifyPassword } from "../session.js";

const router = express.Router();

router.get("/login", (req, res) => {
    res.render("login");
});

router.post("/login", async (req, res) => {
    const username = req.body.username;
    if (typeof username !== 'string') {
        console.log("user is not valid");
        res.redirect("/auth/login")
        return;
    }
    const password = req.body.password;
    if (typeof password !== 'string') {
        console.log("user is not valid");
        res.redirect("/auth/login")
        return;
    }

    const sql = "SELECT * FROM users WHERE username = ?;";
    const user: User | undefined = db.prepare(sql).get(username) as User | undefined;
    if (!user) {
        console.log("user is not valid");
        res.redirect("/auth/login")
        return;
    }
    const isValid = await verifyPassword(password, user.password);

    if (isValid) {
        const sessionId = crypto.randomUUID();
        mySessions.set(sessionId, username);
        res.cookie("sessionId", sessionId);

        res.redirect("/comments");
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
