const express = require("express");
const {queryDB} = require("../connection.js");
const router = express.Router();

let getAllVideos = `SELECT * FROM video`;

//getAllVideos
router.get("/", async function (req, res) {
    let videos = await queryDB(getAllVideos);
    res.json(videos);
});

module.exports = router;