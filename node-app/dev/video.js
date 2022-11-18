const express = require("express");
const {queryDB} = require("../connection.js");
const router = express.Router();

const getAllVideos = `SELECT * FROM video`;
const getVideoById = `SELECT * FROM video WHERE video_id = ?`;
const getCommentsByVideoID = `SELECT * FROM comments WHERE video_id = ?`;
const getCommentByID = `SELECT * FROM comments WHERE comment_id = ?`;
const postNewComment = `INSERT INTO comments SET ?`;
const deleteCommentById = `DELETE FROM comments WHERE comment_id = ?`;

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
        res.status(400).send("ERROR 400: There is no video with this ID");
        return;
    }
    if (comments.length === 0) {
        res.status(400).send("ERROR 400: This video has no comments");
        return;
    }

    return res.status(200).json(comments);
});

//POST request to create new comment
router.post('/:video_id/comments/create', async function (req, res) {
    const {video_id} = req.params;
    const {comment} = req.body;

    let user_id = 2; //todo ir buscar ao user logado

    let data = await queryDB(postNewComment, {
        timestamp: new Date(),
        comment,
        user_id,
        video_id
    });

    return res.status(200).json({success: true, comment_id: data.insertId});
});

// POST request to delete comment by :id
//todo: apaga comentario mas nao retorna nada
router.post('/comments/:id/delete', async function (req, res) {
    const {id} = req.params;
    const comment = await queryDB(getCommentByID, [id])
    console.log(comment)
    if (comment.length === 0) {
        return res.status(400).send("ERROR 400: This comment doesn't exist");
    }
    else{
        await queryDB(deleteCommentById, [id]);
    }

    return res.status(202).json({success: true, "deleted"});
});

// Upload video

router.post('/upload', async function (req, res) {
    const {title, thumbnail, description, user_id, duration, url_video} = req.body;
    try {
        const new_video = await queryDB(`INSERT INTO video SET ?`, {
            title,
            thumbnail,
            description,
            date: new Date(),
            user_id,
            duration,
            url_video
        })
        res.status(200).json({success: true, new_video});
    } catch(err){
        return res.status(404).json({success: false, error: err, message: '[ERROR] Insert valid data'});
    }
});

module.exports = router;