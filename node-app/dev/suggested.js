const express = require("express");
const {queryDB} = require("../connection.js");
const {shuffleArray} = require("./utils/suggestions")

const router = express.Router();

//video card containing length, title, channel name, user photo,  video thumbnail, views, post date, comments counter, likes counter

const videoCard = `SELECT video.video_id, video.title, video.thumbnail, video.date, video.duration as 'length', video.url_video as 'url', user.username, user.photo as 'user photo',  COUNT(views.view_id) as 'views', COUNT(CASE reaction.reaction_type_id WHEN '1' then 1 else null end) as 'likes', COUNT(CASE reaction.reaction_type_id WHEN '2' then 1 else null end) as 'dislikes', 
    (SELECT GROUP_CONCAT(DISTINCT tags.name SEPARATOR ', ')) as 'tags'
FROM video 
LEFT JOIN user on video.user_id=user.user_id
LEFT JOIN views on video.video_id=views.video_id
LEFT JOIN reaction on video.video_id=reaction.video_id
LEFT JOIN video_has_tags on video.video_id=video_has_tags.video_id
LEFT JOIN tags on video_has_tags.tag_id=tags.tag_id
GROUP BY video_id;`;

const videoTags = `SELECT name as 'tags' FROM video_has_tags LEFT JOIN tags on video_has_tags.tag_id=tags.tag_id where video_id=?`

const tagsFromVideosWatchedUser = `SELECT user_id,  CONCAT('["', GROUP_CONCAT(DISTINCT tags.name SEPARATOR '", "'), '"]') as 'tags' FROM views LEFT JOIN video_has_tags on views.video_id=video_has_tags.video_id LEFT JOIN tags on video_has_tags.tag_id=tags.tag_id WHERE user_id=?`
router.get("/tags/:user_id", async function (req, res) {
    const {user_id} = req.params;
    let viewedTags = await queryDB(tagsFromVideosWatchedUser, [user_id]);
    if (viewedTags.length === 0) {
        res.status(404).send("This user hasn't seen any videos with tags");
        return;
    }
    console.log(viewedTags)
    return res.status(200).json(viewedTags);
});

router.get("/allvideos", async function (req, res) {
    let allVideos = await queryDB(videoCard);
    if (allVideos.length === 0) {
        res.status(404).send("There are no videos");
        return;
    }
    console.log(allVideos)
    return res.status(200).json(allVideos);
});

router.get("/50popular", async function (req, res) {
    let popularVideos = await queryDB(`SELECT * FROM video ORDER BY popularity LIMIT 50`);
    if (popularVideos.length === 0) {
        res.status(404).send("There are no videos");
        return;
    }

    shuffleArray(popularVideos)
    return res.status(200).json(popularVideos);
});


module.exports = router;