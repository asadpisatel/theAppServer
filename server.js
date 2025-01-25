const express = require("express");
const cors = require("cors");
const path = require("path");
const { connection } = require("./db");
const bcrypt = require("bcrypt");

const app = express();

app.use(express.static(path.join(__dirname, "public")));
app.use(cors());
app.use(express.json());

const port = 5000;
const saltRounds = 10;

const checkUserStatus = (req, res, next) => {
  const { email } = req.headers;

  if (!email) {
    return res.status(401).json({ message: "Unauthorized. Email is missing." });
  }

  const sql = "SELECT `status` FROM `user-details` WHERE `email` = ?";
  connection.query(sql, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error", err });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: "User does not exist." });
    }

    const userStatus = results[0].status;
    if (userStatus === "Blocked") {
      return res.status(403).json({ message: "User is blocked." });
    }

    next();
  });
};

app.use((req, res, next) => {
  if (req.path === "/register" || req.path === "/login") {
    return next();
  }
  checkUserStatus(req, res, next);
});

app.post("/register", async (req, res) => {
  const status = "Active";
  const loginDate = new Date();
  const password = req.body.password;

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const sql =
      "INSERT INTO `user-details` (`name`, `email`, `password`, `last_login`, `status`) VALUES (?, ?, ?, ?, ?)";
    const values = [
      req.body.name,
      req.body.email,
      hashedPassword,
      loginDate,
      status,
    ];

    connection.query(sql, values, (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ message: "Email already registered" });
        }
        return res.json({ message: "Somthing wrong: ", err });
      }
      return res.json({ message: "The data was has been saved" });
    });
  } catch (error) {
    res.status(500).json({ message: "Error hashing password", err });
  }
});

app.get("/users", (req, res) => {
  const sql = "SELECT * FROM `user-details`";
  connection.query(sql, (err, result) => {
    if (err) res.json({ message: "Server error" });
    return res.json(result);
  });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const sql = "SELECT * FROM `user-details` WHERE `email` = ?";
    connection.query(sql, [email], async (err, results) => {
      if (err) {
        return res.status(500).json({ message: "Database error", err });
      }

      if (results.length === 0) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const user = results[0];

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      res.status(200).json({ message: "Login successful", userId: user.id });
    });
  } catch (error) {
    res.status(500).json({ message: "An error occurred", error });
  }
});

app.post("/users/block", (req, res) => {
  const { emails } = req.body;
  const sql =
    "UPDATE `user-details` SET `status` = 'Blocked' WHERE `email` IN (?)";

  connection.query(sql, [emails], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Database error", err });
    }
    res.json({ message: "Users have been blocked successfully." });
  });
});

app.post("/users/unblock", (req, res) => {
  const { emails } = req.body;
  const sql =
    "UPDATE `user-details` SET `status` = 'Active' WHERE `email` IN (?)";

  connection.query(sql, [emails], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Database error", err });
    }
    res.json({ message: "Users have been unblocked successfully." });
  });
});

app.post("/users/delete", (req, res) => {
  const { emails } = req.body;
  const sql = "DELETE FROM `user-details` WHERE `email` IN (?)";

  connection.query(sql, [emails], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Database error", err });
    }
    res.json({ message: "Users have been deleted successfully." });
  });
});

app.listen(port, () => {
  console.log("Listining...");
});
