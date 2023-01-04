const express = require("express");
const {queryDB} = require("../connection.js");
const router = express.Router();

//Get all subscriptions from user

//Get all avatar & usernames of followed channels
const channelsSubs = `SELECT subscriptions.user_followed_id as 'channel', user.username, user.photo as 'avatar'
FROM subscriptions
LEFT JOIN user
ON subscriptions.user_followed_id=user.user_id
WHERE user_following_id=?`;

router.get('/:user_id', async function (req, res) {
    try {
        const {user_id} = req.params;
      /*  const followers = await queryDB(`SELECT user_followed_id as 'User', COUNT(user_following_id) as 'Followers'
        FROM subscriptions WHERE user_followed_id = ?`, [user_id]);
        return res.status(200).json(followers);*/
        const channels = await queryDB(channelsSubs, [user_id]);
        return res.status(200).json(channels);
    } catch (err) {
        return res.status(404).json({success: false, error: err, message: '[ERROR]'});
    }
});

//Check if user follows
router.get('/:user_following_id/:user_followed_id', async function (req, res) {
    try {
        const user_following_id = req.params.user_following_id;
        const user_followed_id = req.params.user_followed_id;
        const subscribed = await queryDB(`SELECT * FROM subscriptions WHERE user_following_id = ? AND user_followed_id = ?`, [user_following_id, user_followed_id]);
        if (subscribed.length > 0) {
            res.status(200).json({success: true, subscribed: true});
        } else {
            res.status(200).json({success: true, subscribed: false});
        }
    } catch (err) {
        return res.status(404).json({success: false, error: err, message: '[ERROR]'});
    }
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
        return res.status(404).json({success: false, error: err, message: '[ERROR]'});
    }
})

//delete follower
router.delete('/delete/:user_following_id/:user_followed_id', async function (req, res) {
    try {
        const user_following_id = req.params.user_following_id;
        const user_followed_id = req.params.user_followed_id;
        const delete_sub = await queryDB(`DELETE FROM subscriptions WHERE user_following_id = ? AND user_followed_id = ?`, [user_following_id, user_followed_id]);
        res.status(200).json({success: true, delete_sub});
    } catch (err) {
        return res.status(404).json({success: false, error: err, message: '[ERROR]'});
    }
});
module.exports = router;