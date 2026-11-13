const express = require('express');
const session = require('express-session');
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

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));


function isForm(req) {
    return Boolean(req.is('application/x-www-form-urlencoded'));
}

app.get('/welcome', (req, res) => {
    res.json({ status: 'success', message: 'Welcome!' });
});

app.get('/', (req, res) => {
    if (req.session.user) {
        return res.redirect('/home');
    }
    res.render('landing');
});

app.get('/home', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('home', { username: req.session.user.username });
});

app.post('/register', async (req, res) => {
    const fail = (status, message) =>
        isForm(req)
            ? res.status(status).render('register', { error: message })
            : res.status(status).json({ message });

    if (!validateRegistration(req.body)) {
        return fail(400, 'Invalid input');
    }
    try {
        const hash = await argon2.hash(req.body.password);
        const user = await db.one(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username',
            [req.body.username.trim(), req.body.email.trim(), hash]
        );
        req.session.user = { id: user.id, username: user.username };
        if (isForm(req)) {
            return res.redirect('/home');
        }
        return res.status(201).json({ message: 'Registration successful' });
    } catch (err) {
        if (err.code === '23505') {
            return fail(409, 'Username or email already exists');
        }
        console.error(err);
        return fail(500, 'Server error');
    }
});

app.post('/login', async (req, res) => {
    const fail = (status, message) =>
        isForm(req)
            ? res.status(status).render('login', { error: message })
            : res.status(status).json({ error: message });

    try {
        const { username, password } = req.body;

        if (typeof username !== 'string' || typeof password !== 'string') {
            return fail(400, 'Invalid request');
        }

        const user = await db.oneOrNone(
            'SELECT id, username, password_hash FROM users WHERE username = $1',
            [username]
        );

        if (!user) {
            return fail(401, 'Invalid username or password');
        }

        const valid = await argon2.verify(user.password_hash, password);

        if (!valid) {
            return fail(401, 'Invalid username or password');
        }

        req.session.user = { id: user.id, username: user.username };
        if (isForm(req)) {
            return res.redirect('/home');
        }
        return res.json({ id: user.id, username: user.username });
    } catch (err) {
        console.error(err);
        return fail(500, 'Server error');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/leaderboard', (req, res) => {
    res.render('leaderboard');
});

module.exports = app;