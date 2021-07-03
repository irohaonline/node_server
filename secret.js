const express = require("express");
const passport = require("passport");
const Strategy = require("passport-http").DigestStrategy;
const db = require("./db");
const logger = require("morgan");
const router = express.Router();
const app = express();
// app.use(logger);

passport.use(
  new Strategy({ qop: "auth" }, function (username, cb) {
    db.users.findByUsername(username, function (err, user) {
      if (err) {
        return cb(err);
      }
      if (!user) {
        return cb(null, false);
      }
      return cb(null, user, user.password);
    });
  })
);

// Create a new Express application.


router.get(
  "/",
  passport.authenticate("digest", { session: false }),
  function (req, res) {
    res.json({ username: req.user.username, email: req.user.emails[0].value });
  }
);

module.exports = router;
