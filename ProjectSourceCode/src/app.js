const express = require('express');
const { engine } = require('express-handlebars');
const { db } = require('./db');
const validateRegistration = require('./validateRegistration');

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/welcome', (req, res) => {
    res.json({ status: 'success', message: 'Welcome!' });
});

app.get('/', (req, res) => {
    res.render('home');
});

app.post('/register', async (req, res) => {
    if (!validateRegistration(req.body)) {
        return res.status(400).json({ message: 'Invalid input' });
    }
    try {
        const hash = await argon2.hash(req.body.password);
        await db.none(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)',
            [req.body.username.trim(), req.body.email.trim(), hash]
        );
        return res.status(201).json({ message: 'Registration successful' });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ message: 'Username or email already exists' });
        }
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (typeof username !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ error: 'Invalid request' });
        }

        const user = await db.oneOrNone(
            'SELECT id, username, password_hash FROM users WHERE username = $1',
            [username]
        );

        const hash = user.password_hash;
        const valid = await argon2.verify(hash, password);

        if (!user || !valid) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Create a session or JWT here
        return res.json({ id: user.id, username: user.username });
    } catch (err) {
        return res.status(500).json({ error: 'Server error' });
    }
});

app.get('/leaderboard', (req, res) => {
    res.render('leaderboard');
});

module.exports = app;