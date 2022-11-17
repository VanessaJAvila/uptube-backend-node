const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const passport = require('passport');
const {queryDB} = require("../connection");

function initialize(getUserByEmail, getUserById) {
    const authenticateUser = async (email, password, done) => {
        const user = await getUserByEmail(email);
        if (user == null) {
            return done(null, false, {message: 'Invalid email'})
        }

        try {
            if (await bcrypt.compare(password, user.password)) {
                return done(null, user)
            } else {
                return done(null, false, {message: 'invalid password'})
            }
        } catch (e) {
            return done(e)
        }
    }
    passport.use(new LocalStrategy({usernameField: 'email'}, authenticateUser));
    passport.serializeUser((user, done) => {
        done(null, {user_id: user.user_id})
    })
    passport.deserializeUser(async (id, done) => {
        console.log(id)
        return done(null, await getUserById(id))
    })

    return passport;
}


module.exports = initialize(
    async function (email) {
        let user = await queryDB('SELECT * FROM user WHERE email =?', [email]);
        return user[0];
    },
    async function (id) {
        let user = await queryDB('SELECT * FROM user WHERE user_id =?', [id.user_id]);
        console.log(id.user_id, user[0]);
        return user[0];
    },
);