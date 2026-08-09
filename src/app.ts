import express from 'express';
import searchRouter from './routes/search.js';
import commentsRouter from './routes/comments.js';

const __dirname = import.meta.dirname;

const app = express();

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.use(express.urlencoded({ extended: true }));

// search form sends to `/search` route
app.use("/search", searchRouter);
app.use("/comments", commentsRouter);

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
