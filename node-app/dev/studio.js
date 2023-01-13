const express = require("express");
const multer = require("multer");
const shortID = require('shortid');
const fs = require('fs');

const {queryDB} = require("../connection.js");
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('ffprobe-static').path;
const router = express.Router();

let fileList = fs.readdirSync("./public/videos");
// create an id and verify if it exists
let video_key = shortID();


const checkIfIDisValid = () => {
    if (fileList.includes(video_key)) {
        video_key = shortID()
        return checkIfIDisValid()
    }
    return;
}
checkIfIDisValid();

let folderName;
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        folderName = path.join(__dirname, '../public/videos', `${video_key}`);
        if (!fs.existsSync(folderName)) {
            fs.mkdirSync(folderName, {recursive: true}, (error) => {
               // console.log(error)
            });
        }
        cb(null, 'public/videos/' + video_key + '/')
    },
    filename: (req, file, cb) => {
        cb(null, video_key + path.extname(file.originalname))
    }
});

function checkFileType(file, cb) {
    // Allowed ext
    const filetypes = /mp4|mov|wmv|avi|avchd|flv|f4v|sfw|mkv|webm|html5|mpeg-2/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toString());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);

    //console.log("mimetype", file.mimetype);
    //console.log("originalname", path.extname(file.originalname));

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        console.log("Error: Videos Only!")
        cb("Error: File format not allowed, videos only!");
    }
}

const upload = multer({
    storage,
    //fileFilter: function (req, file, cb) {
    //    checkFileType(file, cb)
}).single('file')

router.post('/upload', upload, async (req, res) => {

    const file = req.file;
    //console.log(req.file)
    try {
        if (!file) {
            video_key = shortID();
            return res.status(200).send("No video to upload");
        }
        const videoPath = `./public/videos/${video_key}/${video_key}${path.extname(file.originalname)}`;
        ffmpeg.setFfmpegPath(ffmpegPath)
        ffmpeg.setFfprobePath(ffprobePath)

        function metadata(path) {
            return new Promise((resolve, reject) => {
                ffmpeg.ffprobe(path, (err, metadata) => {
                    if (err) {
                        reject(err)
                    }
                    resolve(metadata)
                })
            })
        }


        function command(input, output) {
            return new Promise((resolve, reject) => {
                ffmpeg(input)
                    .on('end', () => {
                        console.log("thumbnails created")
                        resolve()
                    })
                    .on('error', (error) => console.log(error))
                    .takeScreenshots({ count: 4, timemarks: [ '1', '3', '6', '9' ] }, folderName)
            })
        }

        async function compress() {
            console.log("entered compress")
            const outputPath = path.join(__dirname, '/../public/videos/', `${video_key}/`, `${video_key}.mp4`)
            const inputMetadata = await metadata(videoPath)
            await command(videoPath, outputPath)
        }

        await compress();
        //compress().catch(err => console.log(err))
        //get duration and format duration


        const inputMetadata = await metadata(videoPath)
        const durationInSeconds = inputMetadata.format.duration;
        const formatDuration = () => {
            if (durationInSeconds < 3600) {
                return new Date(durationInSeconds * 1000).toISOString().slice(14, 19)
            } else {
                return new Date(durationInSeconds * 1000).toISOString().slice(11, 19);
            }
        }
        // Generate the url_video value using the video_key and the file's original extension
        let reqParams = {
            video_key,
            user_id: req.user.user_id,
            thumbnail: "thumbnail",
            title: "title",
            description: "description",
            duration: formatDuration(),
            url_video: `/videos/${video_key}/${video_key}.mp4`
        }
        // Validate the user_id field
        if (isNaN(reqParams.user_id)) {
            return res.status(400).send("Invalid user_id: must be an integer");
        }

        // Validate the duration field
        if (!reqParams.duration) {
            return res.status(400).send("Duration field is required");
        }

        // Validate the thumbnail field
        if (!reqParams.thumbnail) {
            return res.status(400).send("Thumbnail field is required");
        }

        // Validate the title field
        if (!reqParams.title) {
            return res.status(400).send("Title field is required");
        }

        // Validate the description field
        if (!reqParams.description) {
            return res.status(400).send("Description field is required");
        }

        // Validate the url_video field
        if (!reqParams.url_video) {
            return res.status(400).send("URL field is required");
        }
        const uploadedVideo = await queryDB("INSERT INTO video SET ?", [reqParams]);
        console.log(reqParams)

        const videoData = Object.assign({}, uploadedVideo, reqParams);

        setTimeout(function() {
            return res.status(200).send({message: "Video uploaded successfully", data: videoData});
        }, 2000);
        // Return a success response to the client
    } catch (err) {
        // An error occurred, log it and return an error response to the client
        console.error(err);
        return res.status(500).send("Error uploading video");
    }
});
module.exports = router;