const express = require("express");
const {queryDB} = require("../connection.js");
const router = express.Router();

const getReactionsById = `SELECT * FROM reaction WHERE video_id = ?`;

//getAllReactions by video id

router.get("/:video_id", async function (req, res) {
    const {video_id} = req.params;
    let reactions = await queryDB(getReactionsById, [video_id]);
    if (reactions.length === 0) {
        res.status(404).send("There are no reactions");
        return;
    }
    return res.status(200).json(reactions);
});

// Counter of reactions type by video

router.get('/counter/:video_id', async function (req, res) {
    try {
        const {video_id} = req.params;
        const reactions_report = await queryDB(`SELECT
        (select COUNT(video_id) FROM reaction WHERE video_id = ? AND reaction_type_id = 1) as 'Likes',
        (SELECT COUNT(video_id) FROM reaction WHERE video_id = ? AND reaction_type_id = 2) as 'Dislike'
        FROM reaction
        LIMIT 1; `, [video_id, video_id]);
        res.status(200).json({sucess: true, reactions_report});
    } catch (err) {
        return res.status(404).json({success: false, error: err, message: '[ERROR]'});
    }
});

// Add reaction

router.post('/new', async function (req, res) {
    try {
        await queryDB(`INSERT INTO reaction SET ?`, {
            user_id: req.body.user_id,
            date: new Date(),
            video_id: req.body.video_id,
            reaction_type_id: req.body.reaction_type_id
        })
        return res.status(201).send('Reaction saved!');
    } catch (err) {
        return res.status(404).json({success: false, error: err, message: 'Verify video_id!'});
    }
});

//Delete reaction by user and video id´s

router.post('/:video_id/:user_id/delete', async function (req, res) {
    const {video_id, user_id} = req.params;
    const video = await queryDB("SELECT * FROM reaction WHERE video_id = ? AND user_id = ?", [video_id,user_id]);
    if (video.length === 0) {
        return res.status(404).send('This video has no reactions done by this user!');
    }
    await queryDB(`DELETE FROM reaction where video_id = ? AND user_id = ?`, [video_id, user_id])
    return res.status(200).send('reaction removed!');

});

module.exports = router;