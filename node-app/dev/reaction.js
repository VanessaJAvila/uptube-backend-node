const {updatePopularity} = require("./utils/popularity.js");
const express = require("express");
const {queryDB} = require("../connection.js");
const {updateAchievements} = require("./utils/updateUserAchievements");
const router = express.Router();

const getReactionsById = `SELECT * FROM reaction WHERE video_id = ?`;

// add reaction like to video
router.post('/:video_id/like', async function (req, res) {
    const video_id = req.params.video_id;
    const user_id = req.user.user_id;

    if (!user_id) {
        res.json({success: false, message: 'no user logged in'});
        return;
    }
    const videoExists = await queryDB('SELECT * FROM video WHERE video_id = ?', [video_id]);
    if (videoExists.length === 0){
        res.json({success: false, message: 'video does not exist'});
        return;
    }
    const user_id_video = await queryDB('SELECT user_id FROM video WHERE video_id = ?', [video_id]);
    if (user_id === user_id_video[0].user_id) {
        res.json({success: false, message: "user can´t like is own video"});
        return;
    }

    const reaction = await queryDB('SELECT * FROM reaction WHERE user_id = ? AND video_id = ? LIMIT 1', [user_id, video_id]);

    // if already there is a reaction
    if (reaction[0]) {
        // if already like
        if (reaction[0].reaction_type_id === 1) {
            await queryDB(`DELETE FROM reaction WHERE reaction.user_id = ? AND reaction.video_id = ?`, [user_id, video_id])
            res.json({success: true, message: 'like was deleted'});
            return;
        }

        // if dislike, update to like
        if (reaction[0].reaction_type_id === 2) {
            await queryDB("UPDATE reaction SET reaction_type_id = 1 WHERE reaction.user_id = ? AND reaction.video_id = ?", [user_id, video_id]);
            const updated_reaction = await queryDB('SELECT * FROM reaction WHERE user_id = ? AND video_id =?', [user_id, video_id]);
            res.json({success: true, updated_reaction: updated_reaction[0], message: 'your dislike is now a like'});
            return;
        }
    }

    // if no reaction yet, insert one
    const createReaction = await queryDB("INSERT INTO reaction SET ?", {
        user_id: user_id,
        video_id: video_id,
        reaction_type_id: 1
    });
    const newReaction = await queryDB('SELECT * FROM reaction WHERE user_id = ? AND video_id =?', [user_id, video_id]);
    res.json({success: true, new_reaction: newReaction[0]});
});

// add reaction dislike to video
router.post('/:video_id/dislike', async function (req, res) {
    const video_id = req.params.video_id;
    const user_id = req.user.user_id;
    console.log(video_id)

    if (!user_id) {
        res.json({success: false, message: 'no user logged in'});
        return;
    }
    const videoExists = await queryDB('SELECT * FROM video WHERE video_id = ?', [video_id]);
    if (videoExists.length === 0){
        res.json({success: false, message: 'video does not exist'});
        return;
    }
    const user_id_video = await queryDB('SELECT user_id FROM video WHERE video_id = ?', [video_id]);
    if (user_id === user_id_video[0].user_id) {
        res.json({success: false, message: "user can´t like is own video"});
        return;
    }

    const reaction = await queryDB('SELECT * FROM reaction WHERE user_id = ? AND video_id = ? LIMIT 1', [user_id, video_id]);

    // if already there is a reaction
    if (reaction[0]) {
        // if already dislike
        if (reaction[0].reaction_type_id === 2) {
            await queryDB(`DELETE FROM reaction WHERE reaction.user_id = ? AND reaction.video_id = ?`, [user_id, video_id])
            res.json({success: true, message: 'dislike removed'});
            return;
        }

        // if like, update to dislike
        if (reaction[0].reaction_type_id === 1) {
            await queryDB("UPDATE reaction SET reaction_type_id = 2 WHERE reaction.user_id = ? AND reaction.video_id = ?", [user_id, video_id]);
            const updated_reaction = await queryDB('SELECT * FROM reaction WHERE user_id = ? AND video_id =?', [user_id, video_id]);
            res.json({success: true, updated_reaction: updated_reaction[0], message: 'your like is now a dislike'});
            return;
        }
    }
    // if no reaction yet, insert one
    const createReaction = await queryDB("INSERT INTO reaction SET ?", {
        user_id: user_id,
        video_id: video_id,
        reaction_type_id: 2
    });
    const newReaction = await queryDB('SELECT * FROM reaction WHERE user_id = ? AND video_id =?', [user_id, video_id]);
    res.json({success: true, new_reaction: newReaction[0]});
});

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

router.post('/new', async function (req, res) {
    const sender_id = req.user.user_id;
    const comment = req.body.comment;
    if (!sender_id) {
        res.json({success: false, message: 'user is not logged in'});
        return;
    }
    try {
        await queryDB(`INSERT INTO reaction SET ?`, {
            user_id: req.body.user_id,
            video_id: req.body.video_id,
            reaction_type_id: req.body.reaction_type_id
        })
        await updatePopularity(req.body.video_id);
        await updateAchievements(req.body.user_id);
        return res.status(201).send('Reaction saved!');
    } catch (err) {
        return res.status(400).json({success: false, error: err, message: err});
    }

});

//Delete reaction by user and video id´s
router.delete('/:video_id/:user_id/delete', async function (req, res) {
    const {video_id, user_id} = req.params;
    const video = await queryDB("SELECT * FROM reaction WHERE video_id = ? AND user_id = ?", [video_id,user_id]);
    if (video.length === 0) {
        return res.status(404).send('This video has no reactions done by this user!');
    }
    await queryDB(`DELETE FROM reaction where video_id = ? AND user_id = ?`, [video_id, user_id])
    return res.status(200).send('reaction removed!');

});

//Delete reaction by user and video id´s
router.delete('/:video_id/:user_id/delete', async function (req, res) {
    try {
        const video_id = req.params.video_id;
        const user_id = req.params.user_id;
        const deleteReaction = await queryDB(`DELETE FROM reaction where video_id = ? AND user_id = ?`, [video_id, user_id]);
        res.status(200).json({success: true, deleteReaction});
    } catch (err) {
        return res.status(404).json({success: false, error: err, message: '[ERROR]'});
    }
});
//check if user has liked the post
router.get('/like/:video_id/:user_id', async function (req, res) {
    try {
        const video_id = req.params.video_id;
        const user_id = req.params.user_id;
        const reaction_type_id = 1; //reaction_type.reaction_type_id.1 = Like
        const liked = await queryDB(`SELECT * FROM reaction WHERE video_id = ? AND user_id = ? AND reaction_type_id = ?`, [video_id, user_id, reaction_type_id]);
        if (liked.length > 0) {
            res.status(200).json({success: true, liked: true});
        } else {
            res.status(200).json({success: true, liked: false});
        }
    } catch (err) {
        return res.status(404).json({success: false, error: err, message: '[ERROR]'});
    }
});
//check if user has disliked the post
router.get('/dislike/:video_id/:user_id', async function (req, res) {
    const {video_id, user_id} = req.params;
    const video = await queryDB("SELECT * FROM reaction WHERE video_id = ? AND user_id = ? AND reaction_type_id = 2", [video_id, user_id]);
    if (video.length === 0) {
        return res.status(404).send({ liked: false });
    }
    return res.status(200).send({ liked: true });
});


module.exports = router;