require("dotenv").config();
const mail = require('nodemailer');
const express = require("express");

const {queryDB} = require("../connection.js");
const router = express.Router();
const bcrypt = require('bcrypt');

router.get('/current', function (req, res) {
    console.log(req.user, " req user current")
    res.send(req.user);
});


let passport = require('./passport-config');

//login

router.post('/login', function (req, res, next) {
    passport.authenticate('local',
        function (err, user, info) {
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.status(401).json({message: "Failed to authenticate"})
            }

            req.login(user, function(){
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

    res.send({user: req.user});
    console.log(req.user);
});

router.post("/logout", function (req, res) {
    req.logout(function () {
        res.send("Logged out");
    });
});


//getAllusers
let getAllUsers = `SELECT * FROM user`;
router.get("/", async function (req, res) {
    let users = await queryDB(getAllUsers);
    res.json(users);
});


//get 1 user

router.get("/:user_id", async function (req, res) {
    let user = await queryDB('SELECT * FROM user WHERE user_id =?', [req.params.user_id]);
    if (user.length === 0) {
        res.status(404).send("não existe este user id");
        return;
    }
    res.json(user);
});


//editar 1 user

router.post('/:user_id/edit', async function (req, res) {
    let user = await queryDB('SELECT * FROM user WHERE user_id =?', [req.params.user_id]);
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

    if (req.body.email !== undefined) {
        update_campos.push("email");
        update_valores.push(req.body.email);
    }

    if (req.body.bio !== undefined) {
        update_campos.push("bio");
        update_valores.push(req.body.bio);
    }

    if (req.body.photo !== undefined) {
        update_campos.push("photo");
        update_valores.push(req.body.photo);
    }

    if (req.body.email !== undefined) {
        update_campos.push("email");
        update_valores.push(req.body.email);
    }
    if (req.body.header !== undefined) {
        update_campos.push("header");
        update_valores.push(req.body.header);
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
        update_valores.push(req.body.password);
    }

    if (update_valores.length > 0) {
        await queryDB("UPDATE user SET " + update_campos.map(campo => campo + " = ?").join(", ") + " WHERE user_id = ?",
            [...update_valores, req.params.user_id]);
    }

    let userEdit = await queryDB("Select * from user where user_id = ?", [req.params.user_id]);


    res.status(200).send(userEdit);
})

//delete user

router.post('/:user_id/delete', async function (req, res) {
    let user = await queryDB("Select * from user where user_id = ?", [req.params.user_id]);

    if (user.length === 0) {
        res.status(400).send("não existe este user");
        return;
    }
    await queryDB("DELETE FROM user WHERE user_id = ?", [req.params.user_id]);


    res.send("user apagado");
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

            req.login({
                user_id: newuser.insertId,
            }, function (err) {
                res.json({message: "Registado com sucesso"});
            })
        } catch (e) {
            console.log(e)
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
        return;
    }
    //todo: if user doesnt exist -> error
    return res.status(200).json(userComments);
});

// Get Notifications by receiver_id

const getNotificationsByUser = `SELECT * FROM notifications WHERE receiver_id = ?`;

router.get("/:receiver_id/notifications", async function (req, res) {
    const {receiver_id} = req.params;
    let notifications = await queryDB(getNotificationsByUser, [receiver_id]);
    if (notifications.length === 0) {
        res.status(404).send("There are no notifications");
        return;
    }
    return res.status(200).json(notifications);
});

//Add notification

router.post('/:receiver_id/notification', async function (req, res) {
    try {
        await queryDB(`INSERT INTO notifications SET ?`, {
            sender_id:req.body.sender_id,
            receiver_id:req.params.receiver_id,
            comment_id:req.body.comment_id,
            seen: false,
            date: new Date(),
            type_id: req.body.type_id
        })
         res.status(201).send('Notification created!');
    } catch (err) {
        res.status(404).json({success: false, error: err, message: 'Verify data!'});
    }
});

// Delete notification by notification_id

router.post('/:notification_id/delete', async function (req, res) {

    const {notification_id} = req.params;
    const nots = await queryDB("SELECT * FROM notifications WHERE notification_id = ?", [notification_id]);
    if (nots.length === 0) {
        return res.status(404).send('Notification not found!');
    }
    await queryDB(`DELETE FROM notifications WHERE notification_id = ?`, [notification_id])
    return res.status(200).send('Notification deleted!');
});


// send mail to a user id with notification of subscription/ register and password recovery

router.get('/:receiver_id/notification/send', async function (req, res) {
    let mail_receiver = await queryDB(`SELECT email FROM user u LEFT JOIN notifications n on u.user_id = n.receiver_id 
                        WHERE receiver_id = ?`, [req.params.receiver_id])
    console.log(mail_receiver)
    const email = mail_receiver[0].email;
    const receiver_email = JSON.stringify(email);

// create reusable transporter object
    const transporter = mail.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_TEST,
            pass: process.env.EMAIL_TEST_APP_PSWD,
        },
        tls: {
            rejectUnauthorized: false,
        }
    });

// setup email data
    const mailOptions = {
        from: 'uptubeproject@gmail.com',
        to: receiver_email,
        subject: 'Welcome to UpTube',
        text: 'Congrats you are now part of the family UpTube! Happy video sharings!'
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            return res.status(404).json({success: false, message: '[ERROR]'});
        } else {
            return res.status(200).json({sucess: true, message: 'Email sent', receiver_email});
        }
    });
});

module.exports = router;