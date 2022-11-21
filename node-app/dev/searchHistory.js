const express = require("express");
const {queryDB} = require("../connection.js");
const router = express.Router();

const getSearchByUserId = `SELECT * FROM searchhistory WHERE user_id = ?`;
const getUserById = `SELECT * FROM user WHERE user_id = ?`;
const insertNewSearch = `INSERT INTO searchhistory SET ?;`;

//todo: pesquisas do dia, pesquisas da semana, pesquisas do mês

router.get("/user/:id", async function (req, res) {
    //todo acrescentar soma de pesquisas, user existe?
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

router.post('/create', async function (req, res) {
    const {input} = req.body;

    let user_id = 2; //todo ir buscar ao user logado

    if (!input) {
        res.status(400).send("ERROR 400: Missing search input");
        return;
    }
    let data = await queryDB(insertNewSearch, {
        input,
        date: new Date(),
        user_id,
    });

    return res.status(200).json({success: true, search_id: data.insertId, input: input});
});

//json({success: true, comment_id: data.insertId});
module.exports = router;