const express = require("express");
const {queryDB} = require("../connection.js");
const router = express.Router();


// Statistics (subscriptions/videos/views/playlist by user_id)------> Como colocar condição para msg de erro ver Git
//todo: passar endpoit para user.js
router.get('/stats/:user_id', async function (req, res) {
    const {user_id} = req.params;
    const user_report = await queryDB(`SELECT
        (select COUNT(user_id) FROM video WHERE user_id = ?) as 'videos',
        (SELECT COUNT(user_id) FROM views WHERE user_id = ?) as 'views',
        (SELECT COUNT(user_following_id) from subscriptions WHERE user_followed_id = ?) as 'followers',
        (SELECT COUNT(playlist_id) FROM playlist WHERE creator_id = ? 
        ) as 'playlists'
        FROM video
        LIMIT 1; `, [user_id,user_id,user_id,user_id]);
    /*   if (user_report.videos === 0) {
       res.status(404).send("User does not have videos or subscriptions!");
       return;
       }*/
    return res.status(200).json(user_report);
});

//Get all subscriptions from user-------------------> Como colocar condição para msg de erro ver Git

router.get('/:user_id', async function (req, res) {
    const {user_id} = req.params;
    const followers = await queryDB(`SELECT user_followed_id as 'User', COUNT(user_following_id) as 'Followers'
        FROM subscriptions WHERE user_followed_id = ?`, [user_id]);
    return res.status(200).json(followers);
});

//Add Follower

router.post('/add', async function (req, res) {
    try {
        const new_subs = await queryDB(`INSERT INTO subscriptions SET ?`, {
            user_following_id: req.body.user_following_id,
            user_followed_id: req.body.user_followed_id,
            date: new Date()
        })
        res.status(200).json({success: true, new_subs});
    } catch (err) {
        return res.status(404).json({success: false, error: err, message: '[ERROR] Insert valid users'});
    }
})
module.exports = router;