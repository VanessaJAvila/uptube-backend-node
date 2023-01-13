const express = require("express");
const router = express.Router();
const fs = require("fs");

router.get('/:videoKey/:imageName', function(req, res) {

    try{
        const image = req.params.imageName;
        const videoKey = req.params.videoKey;
        res.header('Content-Type', "image");
        fs.readFile(image, 'utf8', function(err, data){
            return res.send({success: true})
        });
    } catch(e){
        return res.send({success: false});
    }

});
module.exports = router;