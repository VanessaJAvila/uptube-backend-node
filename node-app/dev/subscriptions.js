const express = require("express");
const {queryDB} = require("../connection.js");
const router = express.Router();

//Get all subscriptions from user

router.get('/:user_id', async function (req, res) {
    try {
        const {user_id} = req.params;
        const followers = await queryDB(`SELECT user_followed_id as 'User', COUNT(user_following_id) as 'Followers'
        FROM subscriptions WHERE user_followed_id = ?`, [user_id]);
        return res.status(200).json(followers);
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
module.exports = router;