const express = require("express");
const app = express();

app.use(express.json());

// EJS設定
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

app.listen(80, () => console.log("Port80 listening..."));

const v1 = require("./back/v1");
const v2 = require("./back/v2");
// const digest = require("./back/secret");

// root
app.get("/", (req, res) => {
  res.send("HEY, I am stocks machine");
});

app.use("/v1", v1);
app.use("/v2", v2);
// app.use("/secret", digest);

/*
認証ページ願わくば別ページに
*/

const passport = require("passport");
app.use(passport.initialize());
const session = require("express-session");
app.use(session({ secret: "123456" }));
app.use(passport.session());

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const LocalStrategy = require("passport-local").Strategy;

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

// 認証が通る名前とパスワード
const validUserName = "aaa";
const validPassword = "sss";

// 認証処理の定義
passport.use(
  new LocalStrategy((username, password, done) => {
    if (username == validUserName && password == validPassword) {
      return done(null, username);
    } else {
      return done(null, false);
    }
  })
);

// ログインページ
app.get("/secret", (req, res) => {
  res.render("secret", {});
});

// 認証処理
app.post(
  "/auth",
  passport.authenticate("local", {
    successRedirect: "/afterLogin",
    failureRedirect: "/secret",
    failureFlash: true,
  })
);

// 認証後ページ
app.get("/afterLogin", (req, res) => {
  if ("passport" in req.session && "user" in req.session.passport) {
    res.render("afterLogin", {});
  } else {
    res.redirect("/secret");
  }
});

module.exports = app;
