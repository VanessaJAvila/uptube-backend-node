const express = require("express");
const {queryDB} = require("../connection.js");
const router = express.Router();

// Get Report by action type

router.get('/action/:action', async function (req, res) {
    const {action} = req.params;
    const reports_by_action = await queryDB(`SELECT * FROM reports WHERE action = ?`, [action]);
    return res.status(200).json(reports_by_action);
});

// Get Report by state

router.get('/state/:state', async function (req, res) {
    const reports_by_state = await queryDB(`SELECT * FROM reports WHERE state = ?`, [req.params.state]);
    return res.status(200).json(reports_by_state);
});

// Get reports done by a reporter_id

router.get('/reporter/:reporter_id', async function (req, res) {
    const {reporter_id} = req.params;
    const reporter = await queryDB(`SELECT * FROM reports WHERE reports.reporter_id = ?`,
        [req.body.reporter_id]);
    if (reporter.length == undefined) {
        return res.status(404).send('This user didn´t made any reports yet!');
    }
    const reports_by_reporter = await queryDB(`SELECT * FROM reports WHERE reporter_id = ?`, [reporter_id]);
    return res.status(200).json(reports_by_reporter);
});

//Edit user reports-----------não actualiza apenas está a remover a info ?!1

router.post('/:reporter_id/edit', async function (req, res) {
    const {state,action,obs} = req.body;
    const {reporter_id} =req.params;
    await queryDB(`UPDATE reports set state = ?, action = ?, obs = ? WHERE reports.reporter_id = ?`,
        [state,action, obs, reporter_id])
    return res.status(200).send('Report updated!');
});


//Report comment or video

router.post('/new', async function (req, res) {
    const {report_type_id,comment_id, video_id,state,obs,action, reporter_id} = req.body;
    await queryDB(`INSERT INTO reports SET = ?`,
        [report_type_id,comment_id,video_id,state, obs,action, reporter_id])
    return res.status(200).send('Report created!');
});











module.exports = router;