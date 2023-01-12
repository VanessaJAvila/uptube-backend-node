const express = require("express");
const {queryDB} = require("../connection.js");
const {compileQueryParser} = require("express/lib/utils");
const mail = require("nodemailer");

const router = express.Router();

const transporter = mail.createTransport({
    host: 'smtp-relay.sendinblue.com',
    port: 587,
    auth: {
        user: process.env.EMAIL_TEST,
        pass: process.env.EMAIL_TEST_APP_PSWD,
    }
});

const getPlaylistById = `SELECT * FROM playlist WHERE playlist_id = ?`


const usersGbyplaylistId = `SELECT user.name, user.user_id
FROM playlist_has_invitees, user
WHERE playlist_has_invitees.invited_id = user.user_id
AND playlist_has_invitees.playlist_id = ?`;


const usersGbyplaylists = `SELECT user.name, user.user_id, playlist_has_invitees.playlist_id
FROM playlist_has_invitees, user
WHERE playlist_has_invitees.invited_id = user.user_id`;




const getPlaylistsByMovie = 'SELECT playlist.playlist_id FROM video, playlist_has_videos, playlist WHERE video.video_id = playlist_has_videos.video_id AND playlist.playlist_id = playlist_has_videos.playlist_id AND video.video_id = ? AND playlist.creator_id = ? group by playlist_has_videos.playlist_id';


const getPlaylistByUserId = `SELECT playlist.creator_id as creator_id, playlist.playlist_id as playlist_id, playlist.thumbnail as thumbnail, playlist.title as title, playlist.visibility as visibility, SEC_TO_TIME(SUM(TIME_TO_SEC( video.duration))) as duration, playlist.timestamp as timestamp
FROM playlist
LEFT JOIN playlist_has_videos
ON playlist.playlist_id = playlist_has_videos.playlist_id
LEFT JOIN video
ON video.video_id=playlist_has_videos.video_id
WHERE playlist.creator_id=?
GROUP BY playlist.playlist_id`;


//TODO: join com o user para ir buscar o creator photo e name
const getPlaylistByGId = `SELECT playlist.creator_id as creator_id, playlist.playlist_id as playlist_id, playlist.thumbnail as thumbnail, playlist.title as title, playlist.visibility as visibility, SEC_TO_TIME(SUM(TIME_TO_SEC( video.duration))) as duration, playlist.timestamp as timestamp, user.name, user.photo
FROM playlist
LEFT JOIN playlist_has_videos
ON playlist.playlist_id = playlist_has_videos.playlist_id
LEFT JOIN video
ON video.video_id=playlist_has_videos.video_id
LEFT JOIN playlist_has_invitees
on playlist.playlist_id = playlist_has_invitees.playlist_id
LEFT JOIN user
on user.user_id=playlist.creator_id
WHERE playlist_has_invitees.invited_id = ?
GROUP BY playlist.playlist_id`;


const getUserByEmail = `SELECT user_id
FROM user
WHERE user.email = ?`;


const getPlaylistsByuserid = `SELECT playlist.*, invited_id is not null as guest FROM playlist join playlist_has_videos on playlist.playlist_id = playlist_has_videos.playlist_id left JOIN playlist_has_invitees on playlist_has_invitees.playlist_id = playlist.playlist_id where (creator_id = ? or invited_id = ?) and playlist_has_videos.video_id = ?`;



const postNewPlaylist = `INSERT INTO playlist SET ?`;
const allUsers = `SELECT * FROM user WHERE user_id = ?`;


const getPlaylistVideos = `SELECT playlist.playlist_id as playlist_id, playlist.title as playlistTitle, video.video_id as video_id, video.title as videoTitle, video.duration, video.url_video as videoUrl, video.thumbnail, playlist.creator_id, user.username as videoCreator
FROM playlist, playlist_has_videos,video,user
WHERE playlist.playlist_id=playlist_has_videos.playlist_id
AND video.video_id=playlist_has_videos.video_id
AND video.user_id=user.user_id
AND playlist.playlist_id = ?
ORDER BY playlist.playlist_id`;


const getPlaylistByGuestId = `SELECT playlist.playlist_id,playlist_has_invitees.invited_id,playlist.title
FROM playlist_has_invitees, playlist
WHERE playlist_has_invitees.playlist_id = playlist.playlist_id
AND playlist_has_invitees.invited_id = ?`;

const getPlaylistsByGuestId = `SELECT playlist.playlist_id
FROM playlist_has_invitees, playlist, playlist_has_videos
WHERE playlist_has_invitees.playlist_id = playlist.playlist_id
AND playlist.playlist_id=playlist_has_videos.playlist_id
AND playlist_has_videos.video_id=?
AND playlist_has_invitees.invited_id = ?`;

const postGPlaylist = `INSERT INTO playlist_has_invitees SET ?`;




const addMusictoPlaylist = `INSERT INTO playlist_has_videos SET ?`;


const deleteGfromPlaylist = `DELETE FROM playlist_has_invitees WHERE playlist_has_invitees.playlist_id = ? AND playlist_has_invitees.invited_id = ?`



router.get("/guest/playlists", async function (req, res) {

    const id = req.user.user_id;
    const userExists = await queryDB(allUsers, [id]);
    const userPlaylist = await queryDB(getPlaylistByGId, [id]);


    if (userExists.length === 0) {
        return res.status(400).send("ERROR 400: There is no user with this ID");

    }
    if (userPlaylist.length === 0) {
        return res.status(400).send("ERROR 400: This user doesn't have any playlists");

    }

    return res.status(200).json(userPlaylist);
});


router.get('/ginplaylist', async function (req, res) {
    let movie = await queryDB(usersGbyplaylists);

    if (movie.length === 0) {
        return  res.status(400).send("ERROR 400: There is no playlists with guests");
    }

    return res.status(200).json(movie);
});
router.get('/moviesinplaylist/:video_id/:creator_id', async function (req, res) {
    const {video_id,creator_id} = req.params;
    let movie = await queryDB(getPlaylistsByMovie, [video_id, creator_id]);

    if (movie.length === 0) {
        res.status(400).send([req.params,"ERROR 400: There is no videos in playlist with this ID",video_id, movie,creator_id]);
        return;
    }


    return res.status(200).json(movie.map(item => item.playlist_id));
});



router.get('/gmoviesinplaylist/:video_id/:creator_id', async function (req, res) {
    const {video_id,creator_id} = req.params;
    let movie = await queryDB(getPlaylistsByGuestId, [video_id, creator_id]);

    if (movie.length === 0) {
        res.status(400).send([req.params,"ERROR 400: There is no videos in playlist with this ID",video_id, movie,creator_id]);
        return;
    }


    return res.status(200).json(movie.map(item => item.playlist_id));
});



router.get('/playlistBymovieanduserid/:video_id',async function (req, res) {
    const {video_id} = req.params;
    const creator_id=req.user.user_id;
    const invited_id=req.user.user_id;

    console.log(creator_id,invited_id,video_id)

    let data = await queryDB(getPlaylistsByuserid, [creator_id,invited_id,video_id])

    return res.status(200).json(data);
})

router.post('/addMusic', async function (req, res) {
    const {playlist_id, video_id} = req.body;


    let data = await queryDB(addMusictoPlaylist, {
        playlist_id, video_id
    });
    return res.status(200).json({success: true, playlist_id: data.insertId});
});


router.post('/guest/addMusic', async function (req, res) {
    const {playlist_id, video_id} = req.body;
    let data = await queryDB(addMusictoPlaylist, {
        playlist_id, video_id
    });
    return res.status(200).json({success: true, playlist_id: data.insertId});
});

router.get("/guest/:invited_id", async function (req, res) {
    const {invited_id} = req.params;
    const userExists = await queryDB(allUsers, [invited_id]);
    const guestUserPlaylist = await queryDB(getPlaylistByGuestId, [invited_id]);


    if (userExists.length === 0) {
        res.status(400).send("ERROR 400:user not found");
        return;
    }
    if (guestUserPlaylist.length === 0) {
        res.status(400).send("ERROR 400: This user isn't a guest in any playlist");
        return;
    }

    return res.status(200).json(guestUserPlaylist);
});



router.get("/getInvitedEmail/:email", async function (req, res) {

    try{
        const {email} = req.params;
        const userIdByEmail = await queryDB(getUserByEmail, [email]);
        return res.status(200).json(userIdByEmail);
    }catch(e){
        return  res.status(404).json({success: false, message: 'Já existe este guest na playlist!', error:e});
    }
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

/*
   let confirmation=await queryDB(getAllGplaylists);
    console.log(confirmation.includes(1), "COOOOOOOOOOOOOOOOOOOOOOOOOOOOOOONNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNFFFFFFFFFFIRMATION");

    if(confirmation[0].playlist_id === playlist_id && confirmation[0].invited_id === invited_id){
        return res.status(400).json({message: '[THIS USER IS ALREADY IN PLAYLIST]'})
    }

 */


router.post('/addguestplaylist', async function (req, res) {
    const {playlist_id,invited_id,email} = req.body;
   try  {
       let data = await queryDB(postGPlaylist, {
           playlist_id,
           invited_id
       });

       let guestadded = await queryDB(usersGbyplaylistId,{playlist_id})

       if (!data) {
           res.status(400).send("ERROR 400: This user is already a guest in the playlist backend");
           return;
       }

       const mailOptions = {
           from: 'uptubeproject@gmail.com',
           to: email,
           subject: 'Added to Playlist',
           text: 'You were invited to edit this playlist, please click the link to acess it, http://localhost:3000/playlist/'+ playlist_id
       };

       transporter.sendMail(mailOptions, function (error, response) {
           if (error) {
               console.log("error", error);
               return res.status(500).json({message: '[ERROR SENDING EMAIL]'});
           } else {
               console.log("Here is the", response)
               return res.status(200).json({guest: guestadded});
           }
       });

   } catch (err) {
       const mailOptions = {
           from: 'uptubeproject@gmail.com',
           to: email,
           subject: 'Added to Playlist',
           text: 'You were invited to this playlist, please click the link to acess it, http://localhost:3000/playlist/'+ playlist_id
       };

       transporter.sendMail(mailOptions, function (error, response) {
           if (error) {
               console.log("error", error);
               return res.status(500).json({message: '[ERROR SENDING EMAIL]'});
           } else {
               console.log("Here is the", response)
               return res.status(200).json({success: true, message: 'Email enviado!'});
           }
       });
   }
});







router.post('/deletegfromp/', async function (req, res) {
    const {playlist_id,invited_id} = req.body;
    let data = await queryDB(deleteGfromPlaylist, [ playlist_id,invited_id]);
    return res.status(200).json({success: true});
});



router.post('/delete/', async function (req, res) {
    const {playlist_id,creator_id,user_id} = req.body;

    if (creator_id !== user_id) {
        return res.status(400).send("ERROR 400: You are not the owner of this playlist");
    }

    let data = await queryDB(`DELETE FROM playlist WHERE playlist.playlist_id= ? AND playlist.creator_id = ?`, [ playlist_id,creator_id]);
    return res.status(200).json({success: true, playlist_id: playlist_id, creator_id: creator_id});
});

//remove video from playlist
router.post('/remove', async function (req, res) {
    const {playlist_id,creator_id,user_id,video_id} = req.body;

    if (creator_id !== user_id) {
        return res.status(400).send(["ERROR 400: You are not the owner of this playlist",creator_id,user_id]);
    }

    let data = await queryDB(`DELETE FROM playlist_has_videos WHERE playlist_has_videos.playlist_id= ? AND playlist_has_videos.video_id = ?`, [ playlist_id,video_id]);
    return res.status(200).json({success: true, playlist_id: playlist_id, creator_id: creator_id});
});

router.post('/guest/remove', async function (req, res) {
    const {playlist_id,creator_id,user_id,video_id,invited_id} = req.body;

    //let creator_id = 2; //todo ir buscar ao user logado


    if (creator_id === user_id || invited_id=== creator_id) {
        let data = await queryDB(`DELETE FROM playlist_has_videos WHERE playlist_has_videos.playlist_id= ? AND playlist_has_videos.video_id = ?`, [ playlist_id,video_id]);
        return res.status(200).json({success: true, playlist_id: playlist_id, creator_id: creator_id});
    } else {
        return res.status(400).send(["ERROR 400: You are not the owner of this playlist",creator_id,user_id]);
    }
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



router.get("/helper/:user_id", async function (req, res) {
    let user = await queryDB('SELECT * FROM user WHERE user_id =?', [req.params.user_id]);
    if (user.length === 0) {
        res.status(404).send("não existe este user id");
        return;
    }
    res.json(user);
});



module.exports = router;