const mysql = require('mysql');
require("dotenv").config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: "root",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

connection.connect();

function queryDB(query, valores) {
    return new Promise((resolve, reject) => {
        connection.query(query, valores, function (err, resultados) {
            if (err)
                reject(err);
            else
                resolve(resultados);
        })
    })
}

module.exports = {queryDB, connection};