const express = require("express");
const {queryDB} = require("../connection.js");
const {compileQueryParser} = require("express/lib/utils");
const router = express.Router();

const getPlaylistById = `SELECT * FROM playlist WHERE playlist_id = ?`


const getPlaylistsByMovie = 'SELECT playlist.playlist_id FROM video, playlist_has_videos, playlist WHERE video.video_id = playlist_has_videos.video_id AND playlist.playlist_id = playlist_has_videos.playlist_id AND video.video_id = ? AND playlist.creator_id = ? group by playlist_has_videos.playlist_id';



const getPlaylistByUserId = `SELECT playlist.creator_id as creator_id, playlist.playlist_id as playlist_id, playlist.thumbnail as thumbnail, playlist.title as title, playlist.visibility as visibility, SEC_TO_TIME(SUM(TIME_TO_SEC( video.duration))) as duration, playlist.timestamp as timestamp
FROM playlist
LEFT JOIN playlist_has_videos
ON playlist.playlist_id = playlist_has_videos.playlist_id
LEFT JOIN video
ON video.video_id=playlist_has_videos.video_id
WHERE playlist.creator_id=?
GROUP BY playlist.playlist_id`;



const postNewPlaylist = `INSERT INTO playlist SET ?`;
const allUsers = `SELECT * FROM user WHERE user_id = ?`;


const getPlaylistVideos = `SELECT playlist.playlist_id as playlist_id, playlist.title as playlistTitle, video.video_id as video_id, video.title as videoTitle, video.url_video as videoUrl, video.thumbnail, playlist.creator_id
FROM playlist, playlist_has_videos,video
WHERE playlist.playlist_id=playlist_has_videos.playlist_id
AND video.video_id=playlist_has_videos.video_id
AND playlist.playlist_id = ?
ORDER BY playlist.playlist_id`;
const getPlaylistByGuestId = `SELECT * FROM playlist_has_invitees WHERE invited_id = ?`;


const addMusictoPlaylist = `INSERT INTO playlist_has_videos SET ?`;


//get playlist by user id


router.get('/moviesinplaylist/:video_id/:creator_id', async function (req, res) {
    const {video_id,creator_id} = req.params;
    let movie = await queryDB(getPlaylistsByMovie, [video_id, creator_id]);

    if (movie.length === 0) {
        res.status(400).send([req.params,"ERROR 400: There is no videos in playlist with this ID",video_id, movie,creator_id]);
        return;
    }


    return res.status(200).json(movie.map(item => item.playlist_id));
});

router.post('/addMusic', async function (req, res) {
    const {playlist_id, video_id} = req.body;


    let data = await queryDB(addMusictoPlaylist, {
        playlist_id, video_id
    });
    return res.status(200).json({success: true, playlist_id: data.insertId});
});





router.get('/:id', async function (req, res) {
    const {id} = req.params;
    const playlistById = await queryDB(getPlaylistVideos, [id]);

    if (playlistById.length === 0) {
        res.status(400).send("ERROR 400: There is no playlist with this ID");
        return;
    }

    return res.status(200).json(playlistById);
});


router.post('/create', async function (req, res) {
    const {title, visibility, thumbnail,creator_id} = req.body;


    let data = await queryDB(postNewPlaylist, {
        title,
        timestamp: new Date(),
        creator_id,
        thumbnail,
        visibility
    });
    return res.status(200).json({success: true, playlist_id: data.insertId});
});

router.post('/:id/update', async function (req, res) {
    const {id} = req.params;
    const {title, thumbnail, visibility} = req.body;

    const playlist = await queryDB(getPlaylistById, [id]);
    //const updatePlaylist = await queryDB(`UPDATE playlist SET playlist.title = ?, playlist.thumbnail = ?, playlist.visibility = ? WHERE playlist_id = ?;`, [updateTitle, updateThumbnail, updateVisibility, id])

    if (playlist.length === 0) {
        res.status(400).send("ERROR 400: There is no playlist with this ID");
        return;
    }

    let update_fields = [];
    let update_values = [];

    if (title !== undefined) {
        update_fields.push("title");
        update_values.push(title);
    }

    if (thumbnail !== undefined) {
        update_fields.push("thumbnail");
        update_values.push(thumbnail);
    }

    if (visibility !== undefined) {
        update_fields.push("visibility");
        update_values.push(visibility);
    }

    if (update_values.length > 0) {
        await queryDB("UPDATE playlist SET " + update_fields.map(field => field + " =?").join(", ") + "WHERE playlist_id = ?",
            [...update_values, id])
    }

    let playlistEdit = await queryDB("SELECT * FROM playlist WHERE playlist_id=?", [id]);
    return res.status(200).json(playlistEdit);
});

//Listar playlists de um user(owner)
router.get("/user/:id", async function (req, res) {
    const {id} = req.params;
    const userExists = await queryDB(allUsers, [id]);
    const userPlaylist = await queryDB(getPlaylistByUserId, [id]);

    if (userExists.length === 0) {
        res.status(400).send("ERROR 400: There is no user with this ID");
        return;
    }
    if (userPlaylist.length === 0) {
        res.status(400).send("ERROR 400: This user doesn't have any playlists");
        return;
    }

    return res.status(200).json(userPlaylist);
});





//Listar playlists de um user(guest)
//todo: join detalhes da playlist do guest
router.get("/guest/:id", async function (req, res) {
    const {id} = req.params;
    const userExists = await queryDB(allUsers, [id]);
    const guestUserPlaylist = await queryDB(getPlaylistByGuestId, [id]);

    if (userExists.length === 0) {
        res.status(400).send("ERROR 400: There is no user with this ID");
        return;
    }
    if (guestUserPlaylist.length === 0) {
        res.status(400).send("ERROR 400: This user isn't a guest in any playlist");
        return;
    }

    return res.status(200).json(guestUserPlaylist);
});



router.post('/delete/', async function (req, res) {
    const {playlist_id,creator_id,user_id} = req.body;

    //let creator_id = 2; //todo ir buscar ao user logado
    if (creator_id !== user_id) {
        return res.status(400).send("ERROR 400: You are not the owner of this playlist");
    }

    let data = await queryDB(`DELETE FROM playlist WHERE playlist.playlist_id= ? AND playlist.creator_id = ?`, [ playlist_id,creator_id]);
    return res.status(200).json({success: true, playlist_id: playlist_id, creator_id: creator_id});
});

//remove video from playlist
router.post('/remove', async function (req, res) {
    const {playlist_id,creator_id,user_id,video_id} = req.body;

    //let creator_id = 2; //todo ir buscar ao user logado
    if (creator_id !== user_id) {
        return res.status(400).send(["ERROR 400: You are not the owner of this playlist",creator_id,user_id]);
    }

    let data = await queryDB(`DELETE FROM playlist_has_videos WHERE playlist_has_videos.playlist_id= ? AND playlist_has_videos.video_id = ?`, [ playlist_id,video_id]);
    return res.status(200).json({success: true, playlist_id: playlist_id, creator_id: creator_id});
});





module.exports = router;