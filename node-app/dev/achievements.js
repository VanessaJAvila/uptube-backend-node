const express = require("express");
const {queryDB} = require("../connection.js");
const {updateUserAchievements} = require("./utils/updateUserAchievements");
const router = express.Router();

const getAllAchievements = `SELECT * FROM achievements`;
const getUserAchievements = `SELECT user_id, achievements.achievements_id as id, name as achievement,ranking, level
FROM user_has_achievements
left join achievements on user_has_achievements.achievements_id = achievements.achievements_id 
left join achievement_level on achievements.achievement_level_id = achievement_level.achievement_level_id
where user_id=?`;
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
//todo eliminar endpoint
//add achievement to user
router.post("/:user_id/create", async function (req, res) {
    const {user_id} = req.params;
    const user = await queryDB(getUserById, [user_id]);

    if (user.length === 0){
        return res.status(400).send("ERROR 400: This user doesn't exist");
    }
     const user_has_newAchievement = await updateAchievements(user_id);
    return res.status(200).json(user_has_newAchievement);
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


module.exports = router;