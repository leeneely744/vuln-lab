import express from 'express';
import searchRouter from './routes/search.js';

const __dirname = import.meta.dirname;

const app = express();

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.use("/", searchRouter);

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
