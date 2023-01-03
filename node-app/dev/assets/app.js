const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

router.get('/video', (req, res) => {
    res.sendFile('/catvideo.mp4', {root: __dirname});
});

module.exports = router;