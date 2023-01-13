const express = require("express");
const app = express();
require("dotenv").config();
app.use(express.urlencoded({extended: true}));
app.use(express.json());

const session = require('express-session');
const FileStore = require('session-file-store')(session);

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,PATCH,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, x-ijt");
    res.header('Access-Control-Allow-Credentials', "true");
    res.removeHeader('X-Frame-Options');

    if ('OPTIONS' === req.method) return res.sendStatus(200);
    next();
});

app.use(express.static('public'));


//app.use(flash());
app.use(session({
    store: new FileStore(),
    secret: process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:false,
    maxAge: 60000
}));

let passport = require('./dev/passport-config');

app.use(passport.initialize());
app.use(passport.session());
app.use(express.static('public'))




app.use("/video", require("./dev/video.js"));
app.use("/tags", require("./dev/tags.js"));
app.use("/report", require("./dev/reports.js"));
app.use("/user", require("./dev/user.js"));
app.use("/subscriptions", require("./dev/subscriptions.js"));
app.use("/reaction", require("./dev/reaction.js"));
app.use("/notifications", require("./dev/notifications.js"));
app.use("/playlist", require ("./dev/playlist.js"));
app.use("/achievements", require ("./dev/achievements.js"));
app.use("/searchhistory", require ("./dev/searchHistory.js"));
app.use("/suggested", require ("./dev/suggested.js"));
app.use("/history", require ("./dev/history.js"));
app.use("/videotutorial", require ("./dev/assets/app.js"));
app.use("/studio", require ("./dev/studio.js"));
app.use("/views", require("./dev/views.js"));
app.use("/reports", require("./dev/reports.js"));


app.listen(3001);