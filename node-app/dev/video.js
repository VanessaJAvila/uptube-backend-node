const express = require("express");
const {queryDB} = require("../connection.js");
const router = express.Router();
const {updatePopularity} = require("./utils/popularity.js");


const getSearch = `SELECT video.video_id, video.title, video.thumbnail, video.date, video.duration as 'length', 
video.url_video as 'url', user.username, user.photo as 'user photo',  COUNT(views.view_id) as 'views',
 COUNT(CASE reaction.reaction_type_id WHEN '1' then 1 else null end) as 'likes', COUNT(CASE reaction.reaction_type_id WHEN '2' 
 then 1 else null end) as 'dislikes', 
    (SELECT GROUP_CONCAT(DISTINCT tags.name SEPARATOR ', ')) as 'tags',
    (SELECT playlist.title from playlist WHERE playlist_has_videos.playlist_id=playlist.playlist_id) as 'playlist'
FROM video 
LEFT JOIN user on video.user_id=user.user_id
LEFT JOIN views on video.video_id=views.video_id
LEFT JOIN reaction on video.video_id=reaction.video_id
LEFT JOIN video_has_tags on video.video_id=video_has_tags.video_id
LEFT JOIN tags on video_has_tags.tag_id=tags.tag_id
LEFT JOIN playlist_has_videos on video.video_id=playlist_has_videos.video_id
LEFT JOIN playlist on playlist_has_videos.playlist_id=playlist.playlist_id
WHERE tags.name LIKE ? or user.username LIKE ? or user.name LIKE ? or video.title LIKE ?
or playlist.title LIKE ?
GROUP BY video_id`;

const getAllVideos = `SELECT * FROM video ORDER BY popularity DESC`;
const getVideoById = `SELECT * FROM video WHERE video_id = ?`;

const getCommentsByVideoID = `SELECT c.comment, c.timestamp, u.username, u.photo
FROM comments as c 
LEFT JOIN user as u on c.sender_id=u.user_id
WHERE video_id = ?`;
const getCommentByID = `SELECT * FROM comments WHERE comment_id = ?`;
const deleteCommentById = `DELETE FROM comments WHERE comment_id = ?`;

//getAllVideos by popularity desc
router.get("/", async function (req, res) {
    console.log(req.query.search)
    let videos_list = await queryDB(getAllVideos);
    if (videos_list.length === 0) {
        return res.status(404).send("There are no videos");
    }
    return res.json(videos_list)
});

// search by username, video, playlist titles and tags
router.get("/search", async function (req, res) {
    console.log(req.query.search)
    let videos = await queryDB(getAllVideos);
    let search_res = await queryDB( getSearch, ['%'+req.query.search+'%','%'+req.query.search+'%',
        '%'+req.query.search+'%','%'+req.query.search+'%','%'+req.query.search+'%']);
    if (search_res.length === 0){
        return res.status(404).send("There are no results");
    }if(req.query.search === " "){
        return res.json(videos)
    }
    return res.json(search_res)
});


//get comments by video id
router.get("/:video_id/comments", async function (req, res) {
    const {video_id} = req.params;
    if (!video_id) {
        return res.status(400).send("ERROR 400: No video_id provided in request");
    }
    try {
        let comments = await queryDB(getCommentsByVideoID, [video_id]);
        let video = await queryDB(getVideoById, [video_id]);
        if (video.length === 0) {
            return res.status(400).send("ERROR 400: There is no video with this ID");
        }
        if (comments.length === 0) {
            return res.status(400).send("ERROR 400: This video has no comments");
        }
        return res.status(200).json(comments);
    } catch (error) {
        console.error(error);
        return res.status(500).send("ERROR 500: Internal Server Error");
    }
});


//POST request to create new comment
    router.post('/:video_id/comments/create', async function (req, res) {
        const {video_id} = req.params;
        const {comment} = req.body;

        const postNewComment = `INSERT INTO comments (timestamp, comment, sender_id, video_id) VALUES ?`;


        let data = await queryDB(postNewComment, {
            timestamp: new Date(),
            comment,
            sender_id: '1',
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

//get video by id for streaming page
router.get("/stream/:id", async function (req, res) {
    const streamVideoById = `SELECT v.video_id, v.title, v.thumbnail, v.description, v.date, v.duration, v.url_video, u.username, v.user_id, u.photo, COUNT(views.view_id) as 'views',
(SELECT COUNT(reaction_type_id) FROM reaction WHERE video_id=13 and reaction_type_id = 1) as 'likes',
(SELECT COUNT(reaction_type_id) FROM reaction WHERE video_id=13 and reaction_type_id = 2) as 'dislikes'FROM video as v
LEFT JOIN user as u ON v.user_id=u.user_id
LEFT JOIN views ON v.video_id=views.video_id
WHERE v.video_id = ?`;
    const {id} = req.params;
    let video = await queryDB(streamVideoById, [id]);
    if (video.length === 0) {
        res.status(404).send("There is no video with this ID");
        return;
    }
    return res.status(200).json(video);
});

//get video data by id
router.get("/:id/tags", async function (req, res) {
    const {id} = req.params;
    let tags = await queryDB(`SELECT name FROM video_has_tags LEFT JOIN tags on video_has_tags.tag_id=tags.tag_id WHERE video_id=?`, [id]);
    if (tags.length === 0) {
        res.status(404).send("there are no tags");
        return;
    }
    return res.status(200).json(tags);
});



module.exports = router;