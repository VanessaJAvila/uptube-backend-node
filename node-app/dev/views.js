const express = require("express");
const {queryDB} = require("../connection.js");
const res = require("express/lib/response");
const router = express.Router();

//POST request to create new comment - Working
router.post('/add/:videoId', async function (req, res) {
    const videoId = req.params.videoId;
    const userId = req.user.user_id;

    const createView = await queryDB("INSERT INTO views SET ?", {
        user_id: userId,
        video_id: videoId,
    });
    let newView = await queryDB("SELECT * FROM views WHERE video_id = ?", [createView.insertId]);
    res.json({success: true, new_view: newView[0]});
});

module.exports = router;