const express = require("express");
const {queryDB} = require("../connection.js");
const router = express.Router();
const {updatePopularity} = require("./utils/popularity.js");
const shortID = require('shortid');
const fs = require('fs');
const path = require('path');
const videoRepo = "./public/video/";
const thumbnailRepo = "./public/thumbnail/";
const { videoLengthSec } = require('get-video-duration');
const thumbsupply = require('thumbsupply');

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);


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
WHERE tags.name LIKE('%?%') or user.username LIKE('%a?%') or user.name LIKE('%?%') or video.title LIKE('%?%') 
or playlist.title LIKE('%?%')
GROUP BY video_id`;
const getAllVideos = `SELECT * FROM video ORDER BY popularity DESC`;
const getVideoById = `SELECT * FROM video WHERE video_id = ?`;
const getCommentsByVideoID = `SELECT * FROM comments WHERE video_id = ?`;
const getCommentByID = `SELECT * FROM comments WHERE comment_id = ?`;
const postNewComment = `INSERT INTO comments SET ?`;
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


// search by username, video, playlist titles and
router.get("/search", async function (req, res) {
    console.log(req.query.search)
    let videos = await queryDB(getAllVideos);
    let search_res = await queryDB(getSearch, ['%' + req.query.search + '%']);
    if (search_res.length === 0) {
        return res.status(404).send("There are no results");
    }
    if (req.query.search === " ") {
        return res.json(videos)
    }
    return res.json(search_res)

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

    let sender_id = 5; //todo ir buscar ao user logado

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
    let user_id = 5; //todo ir buscar ao user logado

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
    } else {
        await queryDB(deleteCommentById, [id]);
    }

    return res.status(202).json({success: true});
});
/*
// Upload video
router.post('/upload', async function (req, res) {

    // verify if there is any video to upload
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send("No video to upload");
    }

    if (req.files.file) {
        let uploadFile = req.files.file;

        let baseName = uploadFile.name;
        let videoExt = path.parse(baseName).ext;

        let fileList = fs.readdirSync("./public/video/");

        // create an id and verify if it exists
        let videoID = '';
        let existingID = false;
        do {
            existingID = false;
            videoID = shortID();
            fileList.map(v => {
                if (videoID === path.parse(v).name)
                    existingID = true;
            })
        } while (existingID);

        const videoURL = videoRepo + videoID + videoExt;

        // UPLOAD OF THE VIDEO INSIDE THE FOLDER
        await uploadFile.mv(videoURL, function (err) {
            if (err) {
                return res.status(500).send(err);
            }
        });

        // get video length in seconds
        let videoDuration = 0;
        await videoLengthSec(videoURL).then((length) => {
            videoDuration = length;
        })

        // TIME MARKS TO CHOOSE FOUR THUMBNAILS - 0% - 30% - 60% - 100%
        let time1 = '1';
        let time2 = Math.floor(videoDuration * 30 / 100).toString();
        let time3 = Math.floor(videoDuration * 60 / 100).toString();
        let time4 = Math.floor(videoDuration).toString();

        // PUT THE PARAMETERS INSIDE OF AN OBJECT
        let reqParams = {
            Video_ID: videoID,
            Channel_ID: 1, // todo:     req.user.id
            Video_URL: videoURL,
            Video_Duration: videoDuration
        }

        // CREATING THE THUMBNAILS AND ADDING THEM INSIDE THE OBJECT REQPARAMS
        // https://www.npmjs.com/package/ffmpeg
        let proc = new ffmpeg(videoURL)
            .on('filenames', async function (filenames) {
                const setThumbnails = (filenames) => {
                    //reqParams.Video_Thumbnail = filenames.join();
                }
                setThumbnails(filenames);
            }).on('end', async function (end) {
                res.status(200).json({video_id: videoID})
            })
            .takeScreenshots({
                count: 4,
                timemarks: [time1, time2, time3, time4]
            },
                thumbnailRepo+videoID, function (err) {
                });
        try {
            await queryDB("INSERT INTO video SET ?", reqParams).then(
                resolve => console.log("resolve: ", resolve)
            ).catch(
                reject => console.log("reject: ", reject)
            )
        } catch (e) {
            res.status(400).json({message: "Error: " + e})
        }}
})
*/
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


//get video data by id
    router.get("/:id/data", async function (req, res) {
        const {id} = req.params;
        let video = await queryDB(getVideoById, [id]);
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



//get video by id to stream
router.get("/:id", async function (req, res) {
    const {id} = req.params;
    const path = `assets/${id}.mp4`
    const stat = fs.statSync(path);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range){
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1]
        ? parseInt(parts[1], 10)
            : fileSize -1;
        const chunkSize = (end-start) - 1;
        const file = fs.createReadStream(path, {start, end});
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': `bytes`,
            'Content-Length': chunkSize,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(206, head);
        file.pipe(res);
    }
    else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4'
        }
        res.writeHead(200, head);
        fs.createReadStream(path).pipe(res);
    }
});
/*
//generate one thumbnail
router.get('/:id/thumbnail', async function (req, res) => {
    thumbsupply.generateThumbnail(`assets/${req.params.id}.mp4`)
        .then(thumb => res.sendFile(thumb));
});
*/
module.exports = router;