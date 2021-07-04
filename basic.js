const express = require("express");
const router = express.Router();
const passport = require("passport");
const passportHttp = require("passport-http");

passport.use(
  new passportHttp.BasicStrategy(function (username, password, done) {
    if (username === "aws" && password == "candidate") {
      return done(null, true);
    } else {
      return done(null, false);
    }
  })
);

router.get(
  "/",
  passport.authenticate("basic", { session: false }),
  (req, res) => {
    res.send("SUCCESS").sendStatus(200);
  }
);


module.exports = router;
