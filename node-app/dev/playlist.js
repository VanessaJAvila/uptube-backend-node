const express = require("express");
const {queryDB} = require("../connection.js");
const {compileQueryParser} = require("express/lib/utils");
const router = express.Router();

const getPlaylistById = `SELECT * FROM playlist WHERE playlist_id = ?`

const getVideoduration = `SELECT playlist.playlist_id as playlist_id, playlist.title as title,  playlist.timestamp as timestamp, playlist.thumbnail as thumbail, playlist.visibility as visibility, video.duration as duration
FROM playlist, playlist_has_videos,video
WHERE playlist.playlist_id=playlist_has_videos.playlist_id
AND video.video_id=playlist_has_videos.video_id
AND playlist.creator_id= ?
ORDER BY playlist.playlist_id`;


const postNewPlaylist = `INSERT INTO playlist SET ?`;
const allUsers = `SELECT * FROM user WHERE user_id = ?`;

/*
"date": "2022-11-18T00:00:00.000Z",
        "description": "",
        "duration": "00:00:00",
        "popularity": 0,
        "thumbnail": "",
        "title": " A maria vai á fonte",
        "url_video": "",
        "user_id": 4,
        "video_id": 5,
        "likes": 0,
        "comments": 1,
        "views": 0,
        "username": "Sandra chan",
        "photo": "url/pastas/imagens/imagem3"
    },
 */
const getPlaylistByUserId = `SELECT * FROM playlist WHERE creator_id=?`;
const getPlaylistByGuestId = `SELECT * FROM playlist_has_invitees WHERE invited_id = ?`;


//get playlist by id
router.get('/:id', async function (req, res) {
    const {id} = req.params;
    const playlistById = await queryDB(getPlaylistById, [id]);

    if (playlistById.length === 0) {
        res.status(400).send("ERROR 400: There is no playlist with this ID");
        return;
    }

    return res.status(200).json(playlistById);
});

//todo: corrigir

router.post('/create', async function (req, res) {
    const {title, visibility, thumbnail} = req.body;

    let creator_id = 2; //todo ir buscar ao user logado

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

//listar playlists com duração de cada video
router.get("/user/:id/duration/", async function (req, res) {
    const {id} = req.params;
    const {playlist_id} = req.params;
    const userExists = await queryDB(allUsers, [id]);
    const userPlaylist = await queryDB(getVideoduration, [id]);

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

module.exports = router;