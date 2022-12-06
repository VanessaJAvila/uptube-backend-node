const {queryDB} = require("../../connection");
const {parseRawDataPacket} = require ("./data")

const calculatePopularity = (views, comments, daysPast, likes, dislikes) => {
    const popularity = views*3+comments*4+daysPast*-1+likes*2+dislikes*-2;
    return popularity
}

const updatePopularity = async (video_id) => {
    const views = parseRawDataPacket(await queryDB(`SELECT COUNT(view_id) as views FROM views WHERE video_id=?`, [video_id]));
    const comments = parseRawDataPacket(await queryDB(`SELECT COUNT(comment_id) as 'comments' FROM comments WHERE video_id=?`, [video_id]));
    const likes = parseRawDataPacket(await queryDB(`SELECT COUNT(user_id) as 'likes' FROM reaction WHERE video_id=? and reaction_type_id=1`, [video_id]));
    const dislikes = parseRawDataPacket(await queryDB(`SELECT COUNT(user_id) as 'dislikes' FROM reaction WHERE video_id=? and reaction_type_id=2`, [video_id]));
    const daysPast = parseRawDataPacket(await queryDB(`SELECT DATEDIFF(NOW(), DATE(video.date)) FROM video WHERE video_id=?`, [video_id]));

    const popularity = calculatePopularity(views, comments, daysPast, likes, dislikes);
    await queryDB(`UPDATE video SET popularity = ${popularity} WHERE video.video_id = ${video_id}`);
    console.log(views)
}

module.exports = { updatePopularity }