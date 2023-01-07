const {queryDB} = require("../../connection");
const {parseRawDataPacket} = require("./data")


const updateUserAchievements = async (user_id) => {
    const views = parseRawDataPacket(await queryDB(`SELECT COUNT(view_id) as 'views' FROM views WHERE user_id=?`, [62]));
    console.log (views);

    const videos = parseRawDataPacket(await queryDB(`SELECT COUNT(user_id) as 'videos' FROM video WHERE user_id=?`, [user_id]));
    const comments = parseRawDataPacket(await queryDB(`SELECT COUNT(comment_id) as 'comments' FROM comments WHERE user_id=?`, [user_id]));
    const likes = parseRawDataPacket(await queryDB(`SELECT COUNT(user_id) as 'likes' FROM reaction WHERE user_id=? and reaction_type_id=1`, [user_id]));
    const followers = parseRawDataPacket(await queryDB(`SELECT COUNT(user_following_id) as 'followers' FROM subscriptions WHERE user_followed_id=?`, [user_id]));
    const subscriptions = parseRawDataPacket(await queryDB(`SELECT COUNT(user_followed_id) as 'subscriptions' FROM subscriptions WHERE user_following_id=?`, [user_id]));
    let achievement_id =0;


    if (views >= 50) {
         achievement_id = 6;
    }
    if (views >= 200) {
         achievement_id = 5;
    }
    if (views >= 1000) {
         achievement_id = 4;
    }

    if (videos === 0) {
         achievement_id = 14;

    }
    if (comments >= 1) {
        achievement_id = 12;
    }
    if (comments >= 50) {
     achievement_id = 11;
    }
    if (comments >= 200) {
        achievement_id = 10;
    }

    if (likes >= 5) {
         achievement_id = 3;
    }
    if (likes >= 20) {
         achievement_id = 2;
    }
    if (likes >= 100) {
        achievement_id = 1;
    }

    if (followers >= 1) {
         achievement_id = 6;
    }
    if (followers >= 5) {
        achievement_id = 8;
    }
    if (followers >= 200) {
       achievement_id = 7;
    }

    if (subscriptions >= 5) {
         achievement_id = 17;
    }
    if (subscriptions >= 10) {
         achievement_id = 16;
    }
    if (subscriptions >= 20) {
         achievement_id = 15;
    }else { return }

    await queryDB(`INSERT INTO user_has_achievements SET user_id and achievement_id = ?`, user_id, achievement_id);

}

module.exports = {updateUserAchievements};