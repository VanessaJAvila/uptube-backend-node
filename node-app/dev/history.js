const express = require("express");
const {queryDB} = require("../connection.js");
const router = express.Router();

//get view history by user if
router.get("/user/:id", async function (req, res) {
    const {id} = req.params;
    let userSearchHistory = await queryDB(getSearchByUserId, [id]);
    let user = await queryDB(getUserById, [id]);

    //verify user
    if (user.length === 0){
        return res.status(400).send("ERROR 400: This user doesn't exist");
    }
    //verify if user has sea
    if (userSearchHistory.length === 0) {
        res.status(400).send("This user doesn't have a search history");
        return;
    }
    return res.status(200).json(userSearchHistory);
});




module.exports = router;