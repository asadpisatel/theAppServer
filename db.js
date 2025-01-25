const mysql = require("mysql");
require("dotenv").config();

const connection = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB,
});

connection.connect(function (err) {
  if (err) {
    console.log("CONNECT FAILED. Error: " + err.code);
  } else {
    console.log("CONNECTED");
  }
});

module.exports = { connection };
