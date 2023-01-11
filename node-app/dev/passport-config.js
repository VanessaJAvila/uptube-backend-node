const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');
const passport = require('passport');
const {queryDB} = require("../connection");

async function getUserByEmail(email) {
    let user = await queryDB('SELECT * FROM user WHERE email =?', [email]);
    return user[0];
}

async function getUserById(id) {
    let user = await queryDB('SELECT * FROM user WHERE user_id =?', [id]);
    return user[0];
}


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
    //console.log("serialize", user);
    done(null, {user_id: user.user_id})
})
passport.deserializeUser(async (user, done) => {
    //console.log("deserialize", user);
    return done(null, await getUserById(user.user_id))
})


module.exports = passport;