const Joi = require("joi");
const express = require("express");
const app = express();

const passport = require("passport");

app.use(express.json());

app.listen(3000, () => console.log("Port3000 listening..."));

// // ここから RESTfulAPI              //////////////////////////////////////////////////////////////////////////////
/*
自動販売機のイメージ
クライアントとJSONをやり取りして品数確認、品追加、販売ができる

参考：
https://youtu.be/pKd0Rpw7O48
https://youtu.be/_tk4mpUdO1Y


../vend/stock
GETで品数確認、
POSTで新規品追加ができる {name:  , quantity:  } or {name:  }
../vend/stock/:id
parmに応じた飲み物の情報が確認できる
DELETE でidに一致する飲み物を削除

../vend/sales
GETで小計確認
POSTでクライアントが注文できる {name:  , quantity:  }

*/

// 在庫
const stocks = [
  { id: 1, name: "Cola", quantity: 3, price: 100 },
  { id: 2, name: "Pepsi", quantity: 3, price: 150 },
  { id: 3, name: "Ramune", quantity: 3, price: 120 },
  { id: 3, name: "Tea", quantity: 3, price: 110 },
];

// 小計
let subtotal = 0;

// POSTされるJSONのバリデーションを共通化
const post_validation = (posted) => {
  const schema = Joi.object({
    name: Joi.string()
      .regex(/^[a-zA-Z]*$/)
      .max(8)
      .required(),
    quantity: Joi.number().integer().min(1), //自然数
  });
  return schema.validate(posted);
};

// root
app.get("/", (req, res) => {
  res.send("HEY, I am Vending machine");
});

// GET /vend/stocks/
//在庫すべて参照
app.get("/vend/stocks/", (req, res) => {
  res.send(stocks);
});

//paramの在庫だけ参照 idで取得
app.get("/vend/stocks/:id", (req, res) => {
  const stock = stocks.find((s) => s.id === parseInt(req.params.id));
  if (!stock) return res.status(404).send("No product yet with given id");
  res.send(stock);
});

//POST {name:  , quantity:  } or {name:  }をもらいたい
//追加（POST） .../vend/stocks/
app.post("/vend/stocks", (req, res) => {
  const { error } = post_validation(req.body);
  // status code with error
  if (error) return res.status(400).send(error.details[0].message);

  // 商品の価格は１００~２００ price has to be decided at serverside
  const minPrice = 100;
  const maxPrice = 200;
  const price =
    Math.floor(Math.random() * (maxPrice + 1 - minPrice)) + minPrice;

  if (!req.body?.quantity) {
    const newStock = {
      name: req.body.name,
      id: stocks.length + 1,
      quantity: 1,
      price,
    };
    stocks.push(newStock);
    res.status(200).send({
      posted: "true",
      message:
        newStock.name + " you posted will be sold for ￥" + newStock.price,
    });
  } else {
    const newStock = {
      id: stocks.length + 1,
      name: req.body.name,
      quantity: req.body.quantity,
      price,
    };
    stocks.push(newStock);
    res.status(200).send({
      posted: "true",
      message:
        newStock.name + " you posted will be sold for ￥" + newStock.price,
    });
  }
});

// 販売（POST） {name:  , quantity:  } をもらいたい
// .../vend/sales
app.post("/vend/sales", (req, res) => {
  //リクエストされた商品を名前で取得
  const soldStock = stocks.find((s) => s.name === req.body.name);
  // 在庫にない商品名の場合はSold outでごまかす
  if (!soldStock)
    return res.status(404).send("So sorry, that's sold out now...");
  // status code with error
  if (!req.body.quantity)
    //quantity はここでは必須だが任意のとこもあるのでそこは関数化できてない
    return res
      .status(400)
      .send("Ops, please request the drink quantity you want");

  const { error } = post_validation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  if (soldStock.quantity < req.body.quantity)
    return res
      .status(404)
      .send("sorry..., stocks are only " + soldStock.quantity + " now");

  //売り上げに加算
  //0 >= 0 は判断済み？
  if (req.body.quantity) {
    subtotal += req.body.quantity * soldStock.price;
  }

  //売れた個数分減らす
  soldStock.quantity -= req.body.quantity;

  res.status(201).send(req.body); // 送られたJSONをそのまま返す
});

//売り上げ照会（GET）  .../vend/sales
//売り上げすべて参照
app.get("/vend/sales", (req, res) => {
  res.status(200).send(JSON.stringify({ subtotal })); //{"sales": sales}
});

// DELETE  .../vend/stocks/:id... idを受け取って任意の商品を削除
app.delete("/vend/stocks/:id", (req, res) => {
  const stock = stocks.find((s) => s.id === parseInt(req.params?.id));

  if (!stock) return res.status(404).send("No product yet with given id");

  const index = stocks.indexOf(stock);
  stocks.splice(index, 1);
  res
    .send(
      JSON.stringify({
        delete: "true",
        message: stock.name + " was successfully deleted",
      })
    )
    .status(200);
});

// // 認証 /////////////////////////////////////////////////
/*
 本当はページを分割したい
 Curlで ../secret/ がたたけるか確認したい
  curl -L --digest -u aaa:sss http://localhost:3000/secret
*/

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
passport.deserializeUser(function (user, done) {
  User.findById(id, function (err, user) {
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

// EJS設定
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

// ログインページ
app.get("/secret/", function (req, res) {
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
app.get("/afterLogin", function (req, res) {
  if ("passport" in req.session && "user" in req.session.passport) {
    res.render("afterLogin", {});
  } else {
    res.redirect("/secret");
  }
});
