const express = require("express");
const app = express();

app.use(express.json());

app.listen(80, () => console.log("Port80 listening..."));

const v1 = require("./version/v1");
const v2 = require("./version/v2");
const digest = require("./secret");

// root
app.get("/", (req, res) => {
  res.send("AWS");
});

app.use("/v1", v1);
app.use("/v2", v2);
app.use("/secret", digest);

/*
認証ページ願わくば別ページに
*/

// const passport = require("passport");
// const Strategy = require("passport-http").DigestStrategy;
// const db = require("./db");
// // Create a new Express application.

// passport.use(
//   new Strategy({ qop: "auth" }, function (username, cb) {
//     db.users.findByUsername(username, function (err, user) {
//       if (err) {
//         return cb(err);
//       }
//       if (!user) {
//         return cb(null, false);
//       }
//       return cb(null, user, user.password);
//     });
//   })
// );

// // Configure Express application.
// // app.use(express.logger());

// app.get(
//   "/",
//   passport.authenticate("digest", { session: false }),
//   function (req, res) {
//     res.json({ username: req.user.username, email: req.user.emails[0].value });
//   }
// );

module.exports = app;
