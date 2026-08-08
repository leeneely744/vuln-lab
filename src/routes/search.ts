import express from 'express';
import { db } from "../db.js";

const router = express.Router();

router.get("/", (req, res) => {
    const q = req.query.q;

    // vulanable sql injection
    const sql = `SELECT * FROM comments WHERE body LIKE '%${q}%'; `
    console.log("sql: ", sql);

    const result = db.prepare(sql).all();

    res.render("search", { q, result });
});

export default router;
