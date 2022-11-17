const express = require("express");
const {queryDB} = require("../connection.js");
const router = express.Router();

// Get Report by action type

router.get('/action/:action', async function (req, res) {
    const {action} = req.params;
    const reports_by_action = await queryDB(`SELECT * FROM reports WHERE action = ?`, [action]);
    if (reports_by_action < 1) {
        return res.status(404).send('There is no reports with this action !');
    }
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
    const reporter = await queryDB(`SELECT * FROM reports WHERE reporter_id = ?`,
        [reporter_id]);
    if (!reporter.length ) {
        return res.status(404).send('This user didn´t made any reports yet!');
    }
    const reports_by_reporter = await queryDB(`SELECT * FROM reports WHERE reporter_id = ?`, [reporter_id]);
    return res.status(200).json(reports_by_reporter);
});

//Update report

router.post('/:report_id/update', async function (req, res) {
    const {report_id} = req.params;
    const {state,action,obs} = req.body;
    let report = await queryDB(`SELECT * FROM reports
        WHERE report_id = ?`, [report_id]);
    if (report.length === 0) {
        res.status(404).send("Insert valid data!");
        return;
    }
    await queryDB(`UPDATE reports set state = ?, obs = ?, action = ? WHERE report_id = ?`,
        [state,obs,action,report_id])
    return res.status(200).send('Report updated!');
});

//Report comment or video

router.post('/new', async function (req, res) {
    const {report_type_id, comment_id, video_id, state, obs, action, reporter_id} = req.body;
    try {
        const new_report = await queryDB(`INSERT INTO reports SET ?`, {
            report_type_id,
            comment_id,
            video_id,
            timestamp_report: new Date(),
            state,
            obs,
            action,
            reporter_id
        })
        res.status(200).json({success: true, new_report});
    } catch(err){
        return res.status(404).json({success: false, error: err, message: '[ERROR] Insert valid data'});
    }
});

module.exports = router;