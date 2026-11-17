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

app.get('/home', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    try {
        const userId = req.session.user.id;

        const assignments = await db.any(
            `SELECT id, title, course, completed,
                to_char(due_date, 'Mon FMDD') AS due_label,
                to_char(due_date, 'YYYY-MM-DD') AS due_iso
             FROM assignments
             WHERE user_id = $1
               AND (completed = FALSE OR due_date >= date_trunc('week', CURRENT_DATE))
             ORDER BY completed, due_date
             LIMIT 8`,
            [userId]
        );

        const week = await db.one(
            `SELECT COUNT(*)::int AS total,
                    COUNT(*) FILTER (WHERE completed)::int AS done
             FROM assignments
             WHERE user_id = $1
               AND due_date >= date_trunc('week', CURRENT_DATE)
               AND due_date < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days'`,
            [userId]
        );

        const courses = await db.map(
            'SELECT DISTINCT course FROM assignments WHERE user_id = $1 ORDER BY course',
            [userId],
            (row) => row.course
        );

        res.render('home', {
            username: req.session.user.username,
            assignments,
            courses,
            total: week.total,
            done: week.done,
            percent: week.total ? Math.round((week.done / week.total) * 100) : 0
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Regitster and login routes
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

// Add assignment route
app.post('/add-assignment', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const title = (req.body.title || '').trim();
    const course = (req.body.course || '').trim();
    const dueDate = req.body.due_date;

    if (!title || title.length > 100 || !course || course.length > 50 || !dueDate) {
        return res.redirect('/home');
    }

    try {
        await db.none(
            'INSERT INTO assignments (user_id, title, course, due_date) VALUES ($1, $2, $3, $4)',
            [req.session.user.id, title, course, dueDate]
        );
    } catch (err) {
        console.error(err);
    }

    res.redirect('/home');
});

app.post('/assignments/:id/toggle', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    try {
        await db.none(
            'UPDATE assignments SET completed = NOT completed WHERE id = $1 AND user_id = $2',
            [req.params.id, req.session.user.id]
        );
    } catch (err) {
        console.error(err);
    }
    res.redirect('/home');
});

app.post('/assignments/:id/edit', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const title = (req.body.title || '').trim();
    const course = (req.body.course || '').trim();
    const dueDate = req.body.due_date;

    if (!title || title.length > 100 || !course || course.length > 50 || !dueDate) {
        return res.redirect('/home');
    }

    try {
        await db.none(
            'UPDATE assignments SET title = $1, course = $2, due_date = $3 WHERE id = $4 AND user_id = $5',
            [title, course, dueDate, req.params.id, req.session.user.id]
        );
    } catch (err) {
        console.error(err);
    }

    res.redirect('/home');
});

app.post('/assignments/:id/delete', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    try {
        await db.none(
            'DELETE FROM assignments WHERE id = $1 AND user_id = $2',
            [req.params.id, req.session.user.id]
        );
    } catch (err) {
        console.error(err);
    }
    res.redirect('/home');
});

app.get('/leaderboard', (req, res) => {
    res.render('leaderboard');
});

module.exports = app;