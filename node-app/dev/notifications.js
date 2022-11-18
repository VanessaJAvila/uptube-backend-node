const express = require("express");
const {queryDB} = require("../connection.js");
const router = express.Router();


// Get Notifications by user

const getNotificationsByUser = `SELECT * FROM notifications WHERE user_id = ?`;

router.get("/:user_id", async function (req, res) {
    const {user_id} = req.params;
    let notifications = await queryDB(getNotificationsByUser, [user_id]);
    if (notifications.length === 0) {
        res.status(404).send("There are no notifications");
        return;
    }
    return res.status(200).json(notifications);
});

// Group and count notifications type by user

//todo verificar como vamos agrupar o tipo ou alterar bd para colocar já os tipos existentes

router.get('/stats/:user_id', async function (req, res) {
    try {
        const {user_id} = req.params;
        const reactions_report = await queryDB(`SELECT
        (select COUNT(video_id) FROM notifications WHERE user_id = ? AND reaction_type_id = 1) as 'Likes',
        (SELECT COUNT(video_id) FROM notifications WHERE user_id = ? AND reaction_type_id = 2) as 'Dislike'
        FROM reaction
        LIMIT 1; `, [video_id, video_id]);
        res.status(200).json({sucess: true, reactions_report});
    } catch (err) {
        return res.status(404).json({success: false, error: err, message: '[ERROR]'});
    }
});

//Add notification

router.post('/new', async function (req, res) {
    try {
        await queryDB(`INSERT INTO notifications SET ?`, {
            user_id:req.body.user_id,
            seen: false,
            date: new Date(),
            type: req.body.type
        })
        return res.status(201).send('Notification created!');
    } catch (err) {
        return res.status(404).json({success: false, error: err, message: 'Verify data!'});
    }
});

// Delete notification by notification_id

router.post('/:notification_id/delete', async function (req, res) {

    const {notification_id} = req.params;
    const nots = await queryDB("SELECT * FROM notifications WHERE notification_id = ?", [notification_id]);
    if (nots.length === 0) {
        return res.status(404).send('Notification not found!');
    }
    await queryDB(`DELETE FROM notifications WHERE notification_id = ?`, [notification_id])
    return res.status(200).send('Notification deleted!');
});








module.exports = router;