const express = require("express");
const router = express.Router();
const fs = require("fs");

router.get('/:videoKey/:imageName', function(req, res) {
    const image = req.params.imageName;
    const videoKey = req.params.videoKey;
    res.header('Content-Type', "image");
    fs.readFile(image, 'utf8', function(err, data){
        if(err){
            console.log(err)
            return res.send({success: false});
        }
        return res.send({success: true})
    });
});
module.exports = router;