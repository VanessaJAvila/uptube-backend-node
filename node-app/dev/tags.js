const express = require("express");
const {queryDB} = require("../connection.js");
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


//Create new tag

router.post('/new', async function (req, res) {

    const saved_tag = await queryDB(`SELECT * FROM tags WHERE tags.name = ?`, [req.body.name]);
    if (saved_tag.length > 0) {
        return res.status(404).send('This tag was saved before!');
    }
    await queryDB(`INSERT INTO tags SET ?`, {
        name: req.body.name,
    })
    return res.status(201).send('Tag saved!');
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