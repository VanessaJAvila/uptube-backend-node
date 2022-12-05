const express = require("express");
const {queryDB} = require("../connection.js");
const router = express.Router();
const {updatePopularity} = require("./utils/popularity.js");


const getAllVideos = `SELECT * FROM video`;
const getVideoById = `SELECT * FROM video WHERE video_id = ?`;
const getCommentsByVideoID = `SELECT * FROM comments WHERE video_id = ?`;
const getCommentByID = `SELECT * FROM comments WHERE comment_id = ?`;
const postNewComment = `INSERT INTO comments SET ?`;
const deleteCommentById = `DELETE FROM comments WHERE comment_id = ?`;

//getAllVideos
router.get("/", async function (req, res) {
    console.log(req.query.search);
    let videos_list = await queryDB(getAllVideos);
    if (videos_list.length === 0) {
        res.status(404).send("There are no videos");
        return;
    }
    res.json(videos_list);
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

    let sender_id = 5       ; //todo ir buscar ao user logado

    let data = await queryDB(postNewComment, {
        timestamp: new Date(),
        comment,
        sender_id,
        video_id
    });
    await updatePopularity(video_id);
    return res.status(200).json({success: true, comment_id: data.insertId});
});

//POST request to create view
router.post('/:video_id/views/create', async function (req, res) {
    const {video_id} = req.params;
    const createView = `INSERT INTO views SET ?`;
    let user_id = 5       ; //todo ir buscar ao user logado

    let data = await queryDB(createView, {
        user_id,
        video_id,
        timestamp_start: new Date(),
        timestamp_end: 0
    });
    await updatePopularity(video_id);
    return res.status(200).json({success: true, view_id: data.insertId});
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

    return res.status(202).json({success: true});
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

//Update Video details
router.post('/:video_id/update', async function (req, res) {
    const {video_id} = req.params;
    const video = await queryDB(`SELECT * FROM video
        WHERE video_id = ?`, [video_id]);
    if (video.length === 0) {
        return res.status(404).send("Video not found!");
    }

    let existent_info = [];
    let update_values = [];

    if (req.body.title !== undefined) {
        existent_info.push("title");
        update_values.push(req.body.title);
    }

    if (req.body.thumbnail !== undefined) {
        existent_info.push("thumbnail");
        update_values.push(req.body.thumbnail);
    }

    if (req.body.description !== undefined) {
        existent_info.push("description");
        update_values.push(req.body.description);
    }
    if (req.body.duration !== undefined) {
        existent_info.push("duration");
        update_values.push(req.body.duration);
    }
    if (req.body.url_video !== undefined) {
        existent_info.push("url_video");
        update_values.push(req.body.url_video);
    }
    if (update_values.length > 0) {
        await queryDB("UPDATE video SET " + existent_info.map(info => info + " = ?").join(", ") + " WHERE video_id = ?",
            [...update_values, req.params.video_id]);
    }
    return res.status(200).send('Updated!');
});

// Delete video

router.post('/:video_id/delete', async function (req, res) {
    const {video_id} = req.params;
    const video = await queryDB("SELECT * FROM video WHERE video.video_id = ?", [video_id]);
    if (video.length === 0) {
        return res.status(404).send('Video id not valid!');
    }
    await queryDB(`DELETE FROM video where video_id = ?`, [video[0].video_id])
    return res.status(200).send('Video removed!');
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



module.exports = router;