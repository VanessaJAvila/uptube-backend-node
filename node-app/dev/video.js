const express = require("express");
const {queryDB} = require("../connection.js");
const router = express.Router();

const getAllVideos = `SELECT * FROM video`;
const getVideoById = `SELECT * FROM video WHERE video_id = ?`;
const getCommentsByVideoID = `SELECT * FROM comments WHERE video_id = ?`;


//getAllVideos
router.get("/", async function (req, res) {
    let videos = await queryDB(getAllVideos);
    if (videos.length === 0) {
        res.status(404).send("There are no videos");
        return;
    }
    return res.status(200).json(videos);
});

//get video by id
router.get("/:id", async function (req, res) {
    const {id} = req.params;
    let video = await queryDB(getVideoById, [id]);
    if (video.length === 0) {
        res.status(404).send("There is no video with this ID");
        return;
    }
    return res.status(200).json(video);
});

//get comments by video id

router.get("/:video_id/comments", async function (req, res) {
    const {video_id} = req.params;
    let comments = await queryDB(getCommentsByVideoID, [video_id]);
    let video = await queryDB(getVideoById, [video_id]);
    if (video.length === 0) {
        res.status(404).send("There is no video with this ID");
        return;
    }
    if (comments.length === 0) {
        res.status(404).send("This video has no comments");
        return;
    }

    return res.status(200).json(comments);
});

module.exports = router;