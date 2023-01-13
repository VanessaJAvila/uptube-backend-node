const express = require("express");
const {queryDB} = require("../connection.js");
const res = require("express/lib/response");
const router = express.Router();


// Show all Tags
router.get('/', async function (req, res) {
    const tags_list = await queryDB(`SELECT * FROM tags`)
    if (tags_list.length === 0) {
        res.status(404).send("There are no tags");
        return;
    }
    return res.status(200).json(tags_list);
});

router.get('/:videoId', async function (req, res) {
    const {videoId} = req.params;
    try {
        let tags = await queryDB(`SELECT name FROM video_has_tags LEFT JOIN tags on video_has_tags.tag_id=tags.tag_id WHERE video_id=?`, [videoId]);
        if (tags.length === 0) {
            res.status(204).send("there are no tags");
            return;
        }
        return res.status(200).json(tags);
    } catch (error) {
        console.error(error);
        return res.status(500).send("ERROR 500: Internal Server Error");
    }
});
//Create new tag

router.post('/new', async function (req, res) {
    try {
        // Validate input data
        if (!req.body.name) {
            return res.status(400).send({
                message: 'Tag name is required.'
            });
        }

        // Check if tag already exists
        const saved_tag = await queryDB(`SELECT * FROM tags WHERE tags.name = ?`, [req.body.name]);
        if (saved_tag.length > 0) {
            return res.status(409).send({
                message: `Tag with name ${req.body.name} already exists`
            });
        }

        // Insert new tag
        await queryDB(`INSERT INTO tags SET ?`, {
            name: req.body.name,
        });
        return res.status(201).send({
            message: 'Tag saved!'
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send({
            message: 'Error occured while saving the tag.'
        });
    }
});

//add tag to video
router.post('/:videoID/add/:tagName', async function (req, res) {
    const { videoID, tagName} = req.params;

    // Verify if the video already has this tag
    const existingTag = await queryDB(`SELECT tag_id FROM video_has_tags WHERE video_id = ? AND tag_id = (SELECT tag_id FROM tags WHERE name = ?)`, [videoID, tagName]
    );

    if (existingTag.length > 0) {
        return res.status(400).json({
            error: 'This video already has the specified tag'
        });
    }

    // Add the tag to the video
    await queryDB(`INSERT INTO video_has_tags (video_id, tag_id) VALUES (?, (SELECT tag_id FROM tags WHERE name = ?))`, [videoID, tagName]);
    return res.status(200).send('New tag added!');
    });


//Delete tag

router.post('/:name/delete', async function (req, res) {

    const {name} = req.params;
    const tags = await queryDB("SELECT * FROM tags WHERE tags.name = ?", [name]);
    if (tags.length === 0) {
        return res.status(404).send('This tag does not exist!');
    }
    await queryDB(`DELETE FROM tags where name = ?`, [tags[0].name])
    return res.status(200).send('Tag removed!');
});

module.exports = router;