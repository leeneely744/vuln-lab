import express from 'express';
import { db } from "../db.js";

const router = express.Router();

router.get("/", (req, res) => {
    let q = req.query.q;
    if (typeof q !== 'string') {
        q = "";
    }

    const sql = "SELECT * FROM comments WHERE body LIKE ?;";
    console.log("sql: ", sql);

    const result = db.prepare(sql).all("%" + q + "%");

    res.render("search", { q, result });
});

export default router;
