const express = require("express");
const app = express();
const path = require("path");
const session = require('express-session');
const mongoose = require("mongoose");
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const ejsMate = require('ejs-mate');
const flash = require('connect-flash');
const bodyParser = require('body-parser');

const userRoutes = require('./routes/users');
const documentRoutes = require('./routes/documents');
const readRoutes = require('./routes/read');

mongoose.connect('mongodb://localhost:27017/moneyware', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

app.engine('ejs', ejsMate)
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))

app.use(express.urlencoded({ extended: true }));

app.use(bodyParser.urlencoded({ extended: true }));

const sessionConfig = {
    secret: 'thisshouldbeabettersecret!',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(session(sessionConfig))
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

app.use('/', userRoutes);
app.use('/documents', documentRoutes)
app.use('/read', readRoutes)

app.listen(3000, () => {
    console.log("Listening on 3000");
})