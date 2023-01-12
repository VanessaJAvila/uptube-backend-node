const express = require("express");
const {queryDB} = require("../connection.js");
const {updateAchievements} = require("./utils/updateUserAchievements");
const router = express.Router();


// user add subscription of a channel
router.post('/follow/:user_followed_id/', async function (req, res) {
    const user_id = req.user.user_id;
    if (!user_id) {
        res.json({success: false, message: 'no user logged'});
        return;

    }
    const user_followed_id = req.params.user_followed_id;
    if (!user_followed_id){
        res.json({success: false, message: 'not getting user_followed_id'});
        return;
    }
    console.log("there is user followed")
    if (user_id === user_followed_id) {
        res.json({success: false, message: "user cannot follow it´s own channel"});
        return;
    }

    const subscription = await queryDB('SELECT * FROM subscriptions WHERE user_followed_id = ? AND user_following_id = ? LIMIT 1', [user_followed_id, user_id]);
    if (subscription.length > 0) {
        console.log("delete req:")
        await queryDB(`DELETE FROM subscriptions WHERE subscriptions.user_followed_id = ? AND subscriptions.user_following_id = ?`, [user_followed_id, user_id]);
        res.json({success: true, message: `${user_id} unfollowed ${user_followed_id}`, subscribed: false});
        return;
    }
    console.log("subscription:", subscription)

        await queryDB("INSERT INTO subscriptions SET ?", {
            user_followed_id: req.params.user_followed_id,
            user_following_id: req.user.user_id
        });
        return res.json({success: true, new_subscription: subscription[0], message: `${user_id} followed ${user_followed_id}`, subscribed: true});

})



//Get all subscriptions

const subs = `SELECT DISTINCT user.username as 'channel', user_followed_id as 'channel id',
(SELECT COUNT(user_followed_id) FROM subscriptions WHERE user_followed_id = user_id) as 'subscriptions'
FROM subscriptions
JOIN user ON subscriptions.user_followed_id = user.user_id`;

router.get('/', async function (req, res) {
    try {
        const subscriptions = await queryDB(subs);
        return res.status(200).json(subscriptions);
    } catch (err) {
        return res.status(404).json({success: false, error: err, message: '[ERROR]'});
    }
});


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
            date: new Date(),
        });
        await updateAchievements(req.body.user_following_id, req.body.user_followed_id);
        res.status(200).json({success: true, new_subs});
    } catch (err) {
        return res.status(404).json({success: false, error: err, message: '[ERROR]'});
    }
});


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