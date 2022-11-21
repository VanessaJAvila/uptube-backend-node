require("dotenv").config();


const express = require("express");

const {queryDB} = require("../connection.js");
const router = express.Router();
const bcrypt = require('bcrypt');
const flash = require('express-flash');
const session = require('express-session');

const initializePassport = require('./passport-config');

router.get('/current', function (req, res){
   res.send(req.user);
});


let passport = require('./passport-config');

//login

router.post('/login',function(req,res,next){
    passport.authenticate('local', function(err,user,info){
        if(err){
            return next(err);
        }
        if(!user){
            return res.json({message: "Failed to authenticate"})
        }
        req.session.user_id = user.user_id;

        res.json({message:"Fez login",user:user});
    })(req,res,next);
})


//sessao


router.get("/sessao", async function (req, res) {
    if (!req.session.user_id) {
        res.status(401).send("Faça Login");
        return;
    }
    let utilizador = await queryDB('SELECT * FROM user WHERE user_id =?', [req.session.user_id]);
    if (!utilizador) {
        res.status(401).send("Faça login (não encontrado)");
        return;
    }

    res.send({utilizador, session: req.session});
});

router.post("/logout", function (req, res) {
    req.session.destroy();
    res.send("Logged out");
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


            let newuser = await queryDB('INSERT INTO `user` SET ?', {
                name: req.body.name,
                email: req.body.email,
                password: hashedpassword
            });
            let user = await queryDB('SELECT * FROM user');

            res.json(user);
            //  res.redirect('/');
        } catch (e) {
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

//todo: user playlist's


module.exports = router;