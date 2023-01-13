require("dotenv").config();
const mail = require('nodemailer');
const express = require("express");
const crypto = require("crypto");

let passport = require('./passport-config');
const {queryDB} = require("../connection.js");
const router = express.Router();
const bcrypt = require('bcrypt');
const {sendMail} = require("./email");
const multer = require("multer");
const path = require("path");
const {updateAchievements} = require("./utils/updateUserAchievements");


const transporter = mail.createTransport({
    host: 'smtp-relay.sendinblue.com',
    port: 587,
    auth: {
        user: process.env.EMAIL_TEST,
        pass: process.env.EMAIL_TEST_APP_PSWD,
    }
});


let storage = multer.diskStorage({
    destination: (req, file, callBack) => {
        callBack(null, './public/avatar')     // './public/avatar/' directory name where save the file
    },
    filename: (req, file, callBack) => {
        callBack(null, file.fieldname + '-' + req.params.user_id + path.extname(file.originalname))
    }
})

let upload = multer({
    storage: storage
});


let stor = multer.diskStorage({
    destination: (req, file, callBack) => {
        callBack(null, './public/header')     // './public/avatar/' directory name where save the file
    },
    filename: (req, file, callBack) => {
        callBack(null, file.fieldname + '-' + req.params.user_id + path.extname(file.originalname))
    }
})

let upl = multer({
    storage: stor
});


router.get('/current', function (req, res) {
    //console.log(req.user, " req user current")
    res.send(req.user);
});


/*
//login

router.get('/auth' , passport.authenticate('google', { scope:
        [ 'email', 'profile' ]
}));


 */

router.post('/login', function (req, res, next) {
    passport.authenticate('local',
        function (err, user, info) {
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.status(401).json({message: "Failed to authenticate"})
            }

            req.login(user, function () {
                res.json({message: "Fez login", user: user});
            })
        })(req, res, next);
})


//sessao

router.get("/sessao", async function (req, res) {
    if (!req.user) {
        res.status(401).send("Faça Login");
        return;
    }

    res.json({user: req.user});
    //console.log(req.user);
});


router.post('/passwordrecovery/:token', async function (req, res) {
    let user = await queryDB('SELECT * FROM user WHERE token =?', [req.params.token]);
    console.log(user[0], "token recovery")
    if (user.length === 0) {
        res.status(404).json("token inválido ou expirado, ou sem user");
        return;
    }

    user = user[0];

    if (user.token_timestamp < Date.now()) {
        res.status(404).json("token inválido ou expirado");
        return;
    }

    if (req.body.rep_password !== req.body.password) {
        res.status(404).send("Password doesn't match");
        return;
    }

    let hashedpassword = await bcrypt.hash(req.body.password, 10);

    let update_password = await queryDB('UPDATE user SET ? WHERE user.user_id = ?', [{
        password: hashedpassword,
        token: null,
        token_timestamp: null
    }, user.user_id]);

    console.log(user, "user with new pass")


    const mailOptions = {
        from: 'uptubeproject@gmail.com',
        to: user.email,
        subject: 'Password was reset successfully',
        text: 'Your Password has been reset, if it wasn\'t you who modified please update your password and check if your email is safe.'
    };

    transporter.sendMail(mailOptions, function (error, response) {
        if (error) {
            console.log("error", error);
            return res.status(500).json({message: '[ERROR SENDING EMAIL]'});
        } else {
            console.log("Here is the", user, response)
            return res.status(200).json({message: 'Your password was modified'});
        }
    });

    //  res.status(200).json("Password Alterada com Sucesso!");
})


router.post("/logout", function (req, res) {
    req.logout(function () {
        res.send("Logged out");
    });
});


router.post('/passwordrecovery', async function (req, res) {
    let user = await queryDB('SELECT * FROM user WHERE email =?', [req.body.email]);
    if (user.length === 0) {
        res.status(404).send("Não existe este user");
        return;
    }

    let receiver_email = req.body.email;

    const token = crypto.randomBytes(48).toString('hex');

    let time_token = Date.now() + 360000;

    let update_token = await queryDB('UPDATE user SET ? WHERE user.email = ?', [{
        token: token,
        token_timestamp: time_token,
    }, req.body.email]);


    let to = await queryDB('SELECT * FROM user WHERE token =?', [token]);


    const mailOptions = {
        from: 'uptubeproject@gmail.com',
        to: receiver_email,
        subject: 'Link to Reset Password',
        text: 'Has you requested we are sending you a link to reset your password.' +
            'http://localhost:3000/RecoverPassword/' + token +
            ', please ignore if you didn`t ask for it'
    };

    transporter.sendMail(mailOptions, function (error, response) {
        if (error) {
            return res.status(500).json({message: '[ERROR SENDING EMAIL]'});
        } else {
            return res.status(200).json({message: 'Email sent'});
        }
    });


    // res.status(200).json({token,time_token,receiver_email,mailOptions});
})

//getAll users

let getAllUsers = `SELECT DISTINCT user_id, username,name,email,bio, photo,header, birthday,
(SELECT COUNT(user_followed_id) FROM subscriptions WHERE user_followed_id = user_id) as 'subscriptions'
FROM subscriptions
JOIN user ON subscriptions.user_followed_id = user.user_id`;
router.get("/", async function (req, res) {
    let users = await queryDB(getAllUsers);
    res.json(users);
});


//get 1 user by id

router.get("/:user_id", async function (req, res) {
    let user = await queryDB('SELECT * FROM user WHERE user_id =?', [req.params.user_id]);
    if (user.length === 0) {
        res.status(404).send("não existe este user id");
        return;
    }
    res.json(user);
});

//get 1 channel by id

router.get("/channel/:user_id", async function (req, res) {
    let user = await queryDB('SELECT * FROM user WHERE user_id =?', [req.params.user_id]);
    if (user.length === 0) {
        res.status(404).send("não existe este user id");
        return;
    }
    res.json(user);
});



//editar 1 user

router.post('/edit', async function (req, res) {
    let user = req.user

    if (user.length === 0) {
        res.status(404).send("não existe este user id");
        return;
    }

    let update_campos = [];
    let update_valores = [];


    if (req.body.username !== undefined) {
        update_campos.push("username");
        update_valores.push(req.body.username);
    }


    if (req.body.bio !== undefined) {
        update_campos.push("bio");
        update_valores.push(req.body.bio);
    }


    if (req.body.email !== undefined) {
        update_campos.push("email");
        update_valores.push(req.body.email);
    }

    if (req.body.birthday !== undefined) {
        update_campos.push("birthday");
        update_valores.push(req.body.birthday);
    }

    if (req.body.administrator !== undefined) {
        update_campos.push("administrator");
        update_valores.push(req.body.administrator);
    }

    if (req.body.name !== undefined) {
        update_campos.push("name");
        update_valores.push(req.body.name);
    }

    if (update_valores.length > 0) {
        await queryDB("UPDATE user SET " + update_campos.map(campo => campo + " = ?").join(", ") + " WHERE user_id = ?",
            [...update_valores, user.user_id]);
    }

    let userEdit = await queryDB("Select * from user where user_id = ?", [user.user_id]);


    res.status(200).send(userEdit);
})


router.post("/edit/upload/avatar", upload.single('photo'), (req, res) => {
    let user =req.user
    if (!req.file) {
        console.log("No file upload");
    } else {
        let imgsrc = 'http://localhost:3001/avatar/' + req.file.filename
        let insertData = queryDB("UPDATE user SET ?  WHERE user_id = ?", [{
            photo: imgsrc
        }, user.user_id]);
    }
    let userPhoto = queryDB("Select * from user where user_id = ?", [user.user_id]);

    res.status(200).json(req.file);
});


router.post("/edit/upload/header", upl.single('photo'), (req, res) => {
    let user = req.user
    if (!req.file) {
        console.log("No file upload");
    } else {
        let imgsrc = 'http://localhost:3001/header/' + req.file.filename;
        let insertData = queryDB("UPDATE user SET ?  WHERE user_id = ?", [{
            header: imgsrc
        }, user.user_id]);
    }
    let userPhoto = queryDB("Select * from user where user_id = ?", [user.user_id]);

    res.status(200).json(req.file);
});

//delete user

router.post('/delete', async function (req, res) {
    let user = req.user;

    if (user.length === 0) {
        res.status(400).send("não existe este user");
        return;
    }


    req.logout(function () {
        res.send("user apagado");
    });

    await queryDB("DELETE FROM user WHERE user_id = ?", [user.user_id]);

});

//criar user usando o bycrypt na password

router.post("/register", async function (req, res) {
        try {
            let hashedpassword = await bcrypt.hash(req.body.password, 10);
            if (req.body.name === undefined) {
                res.status(404).send("Insert name mandatory");
                return;
            }
            if (req.body.email === undefined) {
                res.status(404).send("Insert email mandatory");
                return;
            }
            let useremail = await queryDB('SELECT * FROM user WHERE email =?', [req.body.email]);
            if (useremail.length > 0) {
                res.status(404).send("Já existe este email");
                return;
            }

            if (req.body.password === undefined) {
                res.status(404).send("Insert password mandatory");
                return;
            }

            if (req.body.rep_password === undefined) {
                res.status(404).send("Password doesn't match");
                return;
            }
            if (req.body.rep_password !== req.body.password) {
                res.status(404).send("Password doesn't match");
                return;
            }

            let newuser = await queryDB('INSERT INTO `user` SET ?', {
                name: req.body.name,
                email: req.body.email,
                password: hashedpassword
            });


            let user = await queryDB('SELECT * FROM user WHERE user_id =?', [newuser.insertId]);
            user = user[0];
            console.log(user.user_id, "user endpoint register");


            if (!user) {
                return res.status(401).json({message: "Failed to authenticate"})
            }

            req.login(user, function () {
                res.json({message: "Registado e Fez login", user: user});
            })
        } catch (e) {
            console.log(e, "erro no registo")
            res.send("erro no registo")
            //  res.redirect('/register')
        }
    }
);

const getUserComments = `SELECT * FROM comments WHERE user_id = ?`

router.get("/:id/comments", async function (req, res) {
    const {id} = req.params;
    let userComments = await queryDB(getUserComments, [id]);
    if (userComments.length === 0) {
        res.status(404).send("This user has no comments");
        await updateAchievements(id);
        return;
    }
    //todo: if user doesnt exist -> error
    return res.status(200).json(userComments);
});

// Statistics (subscriptions/videos/views/playlist by user_id)

router.get('/stats/:user_id', async function (req, res) {
    try {
        const {user_id} = req.params;
        const user_report = await queryDB(`SELECT
        (select COUNT(user_id) FROM video WHERE user_id = ?) as 'videos',
        (SELECT COUNT(user_id) FROM views WHERE user_id = ?) as 'views',
        (SELECT COUNT(user_following_id) from subscriptions WHERE user_followed_id = ?) as 'followers',
        (SELECT COUNT(playlist_id) FROM playlist WHERE creator_id = ? 
        ) as 'playlists'
        FROM video
        LIMIT 1; `, [user_id, user_id, user_id, user_id]);
        res.status(200).json({sucess: true, user_report});
    } catch (err) {
        return res.status(404).json({success: false, error: err, message: '[ERROR]'});
    }
});

// Get  channels/videos views //todo verificar este endpoint/query para obter info para os channel cards

router.get('/stats', async function (req, res) {
    try {
        const report = await queryDB(`SELECT user.user_id,username,thumbnail,title,
        (SELECT COUNT(user_id) FROM views ) as 'views'
        FROM user, video
        where user.user_id =video.video_id`);
        res.status(200).json({sucess: true, report});
    } catch (err) {
        return res.status(404).json({success: false, error: err, message: '[ERROR]'});
    }
});

// Get Notifications by receiver_id

const getNotificationsByUser = `SELECT notifications.notification_id,user.username as 'sender', receiver_id, notifications_type.type as 'notification',comment,video_id,seen
FROM notifications
LEFT JOIN notifications_type ON  notifications.type_id= notifications_type.type_id 
LEFT JOIN comments ON  notifications.comment_id= comments.comment_id
LEFT JOIN user ON  notifications.sender_id= user.user_id
WHERE receiver_id = ? `;

const getUnseenNot =`SELECT notifications.notification_id,user.username as 'sender', receiver_id, notifications_type.type as 'notification',comment,video_id,seen
FROM notifications
LEFT JOIN notifications_type ON  notifications.type_id= notifications_type.type_id
LEFT JOIN comments ON  notifications.comment_id= comments.comment_id
LEFT JOIN user ON  notifications.sender_id= user.user_id
WHERE receiver_id = ? and seen = 0`

router.get("/:receiver_id/notifications", async function (req, res) {
    const {receiver_id} = req.params
    let notifications = await queryDB(getNotificationsByUser, [receiver_id]);
    let unseenNot = await queryDB(getUnseenNot, [receiver_id]);

    if (notifications.length <= 0) {
        res.status(200).json({ unseenNot: unseenNot, notifications: notifications});
        return;
    }
    if (unseenNot.length <= 0) {
        res.status(200).json({ unseenNot: unseenNot, notifications: notifications});
        return;
    }

    res.status(200).json({ unseenNot: unseenNot, notifications: notifications});
});

//Add notification

router.post('/:receiver_id/new/notification', async function (req, res) {
    try {
        const new_not = await queryDB(`INSERT INTO notifications SET ?`, {
            sender_id: req.body.sender_id,
            receiver_id: req.params.receiver_id,
            comment_id: req.body.comment_id,
            seen: false,
            date: new Date(),
            type_id: req.body.type_id
        })
        res.status(201).send('Notification created!');
        //Todo construir lógica para despoletar envio automático do mail por Type id
        switch (new_not.type_id) {
        }
    } catch (err) {
        res.status(404).json({success: false, error: err, message: 'Verify data!'});
    }
});

// Update notification by notification_id

router.post('/readNotifications', async function (req, res) {

    try {
        console.log("user", req.user);
        const user_id = req.user.user_id;
        await queryDB(`UPDATE notifications SET seen = 1 WHERE receiver_id = ?`, [user_id])
        res.status(200).send('State updated to viewed!');
    } catch (err) {
        console.error(err);
        res.status(500).json({success: false, error: err, message: 'Verify data!'});
    }
});




// send mail to a user id with notification of subscription/ register and password recovery

router.get('/:receiver_id/notification/send', async function (req, res) {
    let mail_receiver = await queryDB(`SELECT email FROM user u LEFT JOIN notifications n on u.user_id = n.receiver_id 
                        WHERE receiver_id = ?`, [req.params.receiver_id])

    const email = mail_receiver[0].email;
    const receiver_email = JSON.stringify(email);
    await sendMail(receiver_email, req.body.subject, req.body.text);
})

router.get('/watchhistory/', async function (req, res) {
    let user_id = req.user.user_id;
    let watchhistory = await queryDB(`SELECT DATE(views.timestamp_start) as 'date', video.title, views.video_id, video.thumbnail, video.duration, video.description, video.url_video, user.username as 'channel', COUNT(views.video_id) as 'total_views'
        FROM views
        LEFT JOIN video on views.video_id=video.video_id
        LEFT JOIN user on video.user_id=user.user_id
        WHERE views.user_id = ?
        GROUP BY video.title
        ORDER BY date ASC`, [user_id])
    if (user_id.length === 0){
        res.status(404).send("Please insert user");
        return;
    }
    if (watchhistory.length === 0) {
        res.status(404).send("User has no history");
        return;
    }
    return res.status(200).json(watchhistory)
})


module.exports = router;