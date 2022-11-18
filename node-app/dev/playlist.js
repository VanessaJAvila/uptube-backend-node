const express = require("express");
const {queryDB} = require("../connection.js");
const {compileQueryParser} = require("express/lib/utils");
const router = express.Router();

const getPlaylistById = `SELECT * FROM playlist WHERE playlist_id = ?`
const postNewPlaylist = `INSERT INTO playlist SET ?`;
const allUsers = `SELECT * FROM user WHERE user_id = ?`;
const getPlaylistByUserId = `SELECT * FROM playlist WHERE creator_id = ?`;
const getPlaylistByGuestId = `SELECT * FROM playlist_has_invitees WHERE invited_id = ?`;
const updatePlaylistByID = `UPDATE playlist SET  ? WHERE playlist_id = ?`;;


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

// todo: Editar uma playlist, Apagar playlist de user
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
    const {updateTitle, updateThumbnail, updateVisibility} = req.body;

    const playlist = await queryDB(getPlaylistById, [id]);
        const updatePlaylist = await queryDB(`UPDATE playlist SET playlist.title = ?, playlist.thumbnail = ?, playlist.visibility = ?, WHERE playlist_id = ?;`, [updateTitle, updateThumbnail, updateVisibility, id])
    if (playlist.length === 0) {
        res.status(400).send("ERROR 400: There is no playlist with this ID");
        return;
    }

    return res.status(200).json(updatePlaylist);
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

module.exports = router;