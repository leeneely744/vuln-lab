import express from 'express';
import cookieParser from 'cookie-parser';

import searchRouter from './routes/search.js';
import commentsRouter from './routes/comments.js';
import authRouter from './routes/auth.js';

const __dirname = import.meta.dirname;

const app = express();

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// search form sends to `/search` route
app.use("/search", searchRouter);
app.use("/comments", commentsRouter);
app.use("/auth", authRouter);

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
