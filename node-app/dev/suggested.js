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

const tagsFromVideosWatchedUser = `SELECT user_id,  CONCAT('["', GROUP_CONCAT(DISTINCT tags.name SEPARATOR '", "'),
 '"]') as 'tags' FROM views LEFT JOIN video_has_tags on views.video_id=video_has_tags.video_id 
 LEFT JOIN tags on video_has_tags.tag_id=tags.tag_id WHERE user_id=?`
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
    let popularVideos = await queryDB(`SELECT date(video.date) as 'date', description, duration, popularity, thumbnail, title, url_video, video.user_id, video.video_id, 
(SELECT count(user_id) FROM reaction WHERE reaction_type_id=1 and video_id=video.video_id) as 'likes',
(SELECT count(comment_id) FROM comments WHERE video_id=video.video_id) as 'comments',
(SELECT count(view_id) FROM views WHERE video_id=video.video_id) as 'views',
(SELECT user.name FROM user WHERE user_id=video.user_id) as 'username',
(SELECT user.photo FROM user WHERE user_id=video.user_id) as 'photo'
FROM video 
LIMIT 50;`);
    if (popularVideos.length === 0) {
        res.status(404).send("There are no videos");
        return;
    }

    shuffleArray(popularVideos)
    return res.status(200).json(popularVideos);
});

// Suggested channels
router.get("/topchannels", async function (req, res) {
    let suggestedChannels = await queryDB(`SELECT user.user_id,
       MAX(video.popularity) as 'max_popularity',
       COUNT(video.video_id) as 'num_videos',
       SUM((SELECT count(user_id) FROM reaction WHERE reaction_type_id=1 and video_id=video.video_id)) as 'total_likes',
       SUM((SELECT count(comment_id) FROM comments WHERE video_id=video.video_id)) as 'total_comments',
       SUM((SELECT count(view_id) FROM views WHERE video_id=video.video_id)) as 'total_views',
       (SELECT user.username FROM user WHERE user_id=video.user_id) as 'Channel',
       (SELECT user.photo FROM user WHERE user_id=video.user_id) as 'photo',
       (SELECT user.bio FROM user WHERE user_id=video.user_id) as 'bio'
FROM user
LEFT JOIN video ON video.user_id = user.user_id
GROUP BY user.user_id
ORDER BY user_id
LIMIT 50`);

    if (suggestedChannels.length === 0) {
        res.status(202).send("There are no suggestions");
        return;
    }
    shuffleArray(suggestedChannels)
    return res.status(200).json(suggestedChannels);
});


module.exports = router;