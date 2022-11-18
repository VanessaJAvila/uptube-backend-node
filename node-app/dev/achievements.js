const express = require("express");
const {queryDB} = require("../connection.js");
const router = express.Router();

const getAllAchievements = `SELECT * FROM achievements`;
const getUserAchievements = `SELECT * FROM user_has_achievements WHERE user_id=?`;
const addUserAchievements = `INSERT INTO user_has_achievements SET ?`;
const getUserById = `SELECT * FROM user WHERE user_id = ?`;
const getAchievementName = `SELECT * FROM achievements WHERE name = ?`;
const createNewAchievement = `INSERT INTO achievements SET ?`;

//list all achievements
router.get("/", async function (req, res) {
    let achievements = await queryDB(getAllAchievements);
    if (achievements.length === 0) {
        res.status(400).send("ERROR 400: There are no achievements");
        return;
    }
    return res.status(200).json(achievements);
});

//list user's achievements by id
router.get("/:id", async function (req, res) {
    const {id} = req.params;
    let userAchievements = await queryDB(getUserAchievements, [id]);
    if (userAchievements.length === 0) {
        res.status(400).send("ERROR 400: This user has no achievements");
        return;
    }
    return res.status(200).json(userAchievements);
});

//add achievement to user
router.post("/:user_id/create", async function (req, res) {
    const {user_id} = req.params;
    const {achievements_id} = req.body;
    const user = await queryDB(getUserById, [user_id]);

    //verificar se user existe

    if (user.length === 0){
        return res.status(400).send("ERROR 400: This user doesn't exist");
    }
    //todo: verificar se achievement existe
    let newAchievement = await queryDB(addUserAchievements, {
        user_id,
        achievements_id
    });
    return res.status(200).json(newAchievement);
});

//post to create achievements
//todo: return json
router.post("/create", async function (req, res) {
    const {name, achievement_level_id} = req.body;
    const achievement_name = await queryDB(getAchievementName, [name]);

    //verificar se user existe
    if (!(achievement_name.length === 0)){
        return res.status(409).send("ERROR 409: This achievement already exists");
    }

    let newAchievement = await queryDB(createNewAchievement, {
        name,
        achievement_level_id
    });
    return res.status(200).json(newAchievement);
});

router.post("/user/user_id/")

module.exports = router;