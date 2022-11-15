const express = require("express");
const app = express();
require("dotenv").config();
app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use("/video", require("./dev/video.js"));

app.listen(3000);