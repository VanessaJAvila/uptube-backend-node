var ffmpeg = require('fluent-ffmpeg');

const transcodeVideo = async (filename, filepath) => {
    return new Promise((resolve, reject) => {
        ffmpeg(filepath)
            .videoCodec('libx264')
            .audioCodec('libmp3lame')
            .size('720x?')
            .on('error', function(err) {
                reject(err)
            })
            .on('end', function() {
                ffmpeg(filepath)
                    .screenshots({
                        timestamps: ['10%'],
                        folder: './transcoded',
                        filename: `${filename}.mp4.png`,
                        size: '720x?'
                    })
                    .on('error', function(err){
                        reject(err)
                    })
                    .on('end', function (){
                        resolve()
                    })
            })
            .save(`./transcoded/${filename}.mp4`)
    })
}

module.exports = transcodeVideo;