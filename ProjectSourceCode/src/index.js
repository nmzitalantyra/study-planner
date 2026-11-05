
const express = require('express');
const { engine } = require('express-handlebars');

const argon2 = require('argon2');

const app = express();

app.engine('hbs', engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: __dirname + '/views/layouts',
    partialsDir: __dirname + '/views/partials'
}));

app.set('view engine', 'hbs');
app.set('views', __dirname + '/views/pages');

// Serve CSS, images, and other local resources
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/leaderboard', (req, res) => {
    res.render('leaderboard');
})

app.listen(3000, () => {
    console.log('Study Sprout running on port 3000');
});
