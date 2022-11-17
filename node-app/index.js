const express = require("express");
const app = express();
require("dotenv").config();
app.use(express.urlencoded({extended: true}));
app.use(express.json());

const flash = require('express-flash');
const session = require('express-session');
const initializePassport = require("./dev/passport-config");
const {queryDB} = require("./connection");

app.use(flash());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:false,
    maxAge: 60000
}));

let passport = require('./dev/passport-config');

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,PATCH,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, x-ijt");
    res.header('Access-Control-Allow-Credentials', "true");
    res.removeHeader('X-Frame-Options');

    if ('OPTIONS' === req.method) return res.sendStatus(200);
    next();
});


app.use("/video", require("./dev/video.js"));
app.use("/user", require("./dev/user.js"));

app.listen(3000);