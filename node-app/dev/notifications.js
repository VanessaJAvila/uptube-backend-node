const express = require("express");
const {queryDB} = require("../connection.js");
const mail = require('nodemailer');
require ("dotenv").config()
const router = express.Router();




//todo pagina html para cada tipo de mail/notificação a enviar e depois associar ao seu envio



// Group and count notifications type by user

//todo verificar como vamos agrupar o tipo ou alterar bd para colocar já os tipos existentes

router.get('/stats/:user_id', async function (req, res) {
    try {
        const {user_id} = req.params;
        const reactions_report = await queryDB(`SELECT
        (select COUNT(video_id) FROM notifications WHERE receiver_id = ? AND reaction_type_id = 1) as 'Likes',
        (SELECT COUNT(video_id) FROM notifications WHERE receiver_id = ? AND reaction_type_id = 2) as 'Dislike'
        FROM reaction
        LIMIT 1; `, [video_id, video_id]);
        res.status(200).json({sucess: true, reactions_report});
    } catch (err) {
        return res.status(404).json({success: false, error: err, message: '[ERROR]'});
    }
});






module.exports = router;