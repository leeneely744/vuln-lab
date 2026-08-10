import express from 'express';
import { db } from "../db.js";

const router = express.Router();

router.get("/", (req, res) => {
    const sql = "SELECT * FROM comments;";
    console.log("sql: ", sql);

    const result = db.prepare(sql).all();

    res.render("comments", { result });
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
    const sql = "DELETE FROM comments WHERE id = ?;"

    db.prepare(sql).run(id);

    res.redirect("/comments");
})

export default router;
