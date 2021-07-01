const Joi = require("joi");
const express = require("express");
const app = express();

const passport = require("passport");

app.use(express.json());

app.listen(3000, () => console.log("Port3000 listening..."));

// // 認証 /////////////////////////////////////////////////
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

// // ここから RESTfulAPI              //////////////////////////////////////////////////////////////////////////////
/* 概要：.../v1/stocks/と.../v1/salesそれぞれでGET, POSTの処理をする

TS使いたい。。
認証のやつと結合できない？
ファイルを分割できないか？

...v1/...
   v1/stocksでは
  在庫の追加と確認を行う
  最後にDELETEで全削除
  
   v1/salesでは
  売り上げの照会と販売を行う

..v2/...
  v1の別バージョン
  操作としてはほぼ同じ



*/

// TypeScript の環境構築で詰まったからとりあえずJS
// /v1/stocks/ で使う
// type Product = {
//   name: string; //必須
//   amount?: number; //任意
//   price?: number; //任意
// };

// /v1/stocks/のパスではpriceがあったらエラーにしたい
// /v1/sales/ で売る時使う？
// type OrderedProduct = {
//   name: string; //必須
//   amount?: number; //任意
//   price?: number; //任意
// };

// 在庫
const products = [
  { name: "product1", amount: 3 },
  { name: "product2", amount: 4 },
  { name: "product3", amount: 5 },
];

// 在庫をソートする関数
const sort_by = (field, reverse, primer) => {
  reverse = reverse ? -1 : 1;
  return function (a, b) {
    a = a[field];
    b = b[field];
    if (typeof primer != "undefined") {
      a = primer(a);
      b = primer(b);
    }
    if (a < b) return reverse * -1;
    if (a > b) return reverse * 1;
    return 0;
  };
};

// // 売り上げ
let sales = 0;

// 小数点第n位までで切り上げ
const sales_caluc = (value, n) => {
  Math.ceil(value * Math.pow(10, n)) / Math.pow(10, n);
};

// // ../v1/... で投げるエラー
const errorMessage = { message: "ERROR" };

// root
app.get("/", (req, res) => {
  res.send("ROOT");
});

// POSTされるJSONのバリデーションを共通化
const validation = (posted) => {
  const schema = Joi.object({
    name: Joi.string()
      .regex(/^[a-zA-Z]*$/)
      .max(8)
      .required(),
    amount: Joi.number().integer().min(1), //自然数
    price: Joi.number().min(0), //0より大きい整数 or 小数 にしたい
  });
  return schema.validate(posted);
};

// GET /v1/stocks/
//在庫すべて参照
app.get("/v1/stocks/", (req, res) => {
  //nameの昇順にソート
  products.sort(
    sort_by("name", false, function (a) {
      return a;
    })
  );
  res.send(products);
});

//paramの在庫だけ参照
app.get("/v1/stocks/:name", (req, res) => {
  const searchedProductName = req.params.name.toString();
  const product = products.find(
    (product) => product.name === searchedProductName
  );
  if (!product)
    //存在しない時の処理: 在庫０として表示する
    return res.send("{" + searchedProductName + ": 0 }");
  //param に一致するproductを返す
  res.send(product);
});

//POST
//追加（POST） .../v1/stocks/
app.post("/v1/stocks", (req, res) => {
  const postedJSON = req.body; //リクエストボディはJSONのみ許可
  const name = postedJSON.name;
  const amount = postedJSON.amount;

  console.log(validation(postedJSON));
  const { error } = validation(postedJSON);
  // status code with staticmassage "ERROR"
  if (error) return res.status(400).send(JSON.stringify(errorMessage));

  res.header("Location", "/v1/stocks/" + name).send(postedJSON); // 送られたJSONをそのまま返す

  if (!amount) {
    const stock = {
      name,
      amount: 1,
    };
    return products.push(stock); //在庫に追加
  }

  products.push(postedJSON); //在庫に追加
});

// 販売（POST） .../v1/sales
app.post("/v1/sales", (req, res) => {
  const { error } = validation(req.body);
  // status code with staticmassage "ERROR"
  if (error) return res.status(400).send(JSON.stringify(errorMessage));

  const postedJSON = req.body;

  //POSTについてamountとpriceは任意
  const name = postedJSON.name;
  const amount = postedJSON.amount;
  const price = postedJSON.price;
  //両方あった時だけ売り上げに加算
  //0 >= 0 は判断済み？
  if (amount && price) {
    sales += amount * price;
  }
  // headerのLocationを.../v1/sales/:nameにしたい
  // ・・・

  res.header("Location", "/v1/sales/" + name).send(postedJSON); // 送られたJSONをそのまま返す
});

//売り上げ照会（GET）  .../v1/sales
//売り上げすべて参照
app.get("/v1/sales/", (req, res) => {
  //小数点第二位まで表示
  sales = Math.ceil(sales * Math.pow(10, 2)) / Math.pow(10, 2);
  res.send(JSON.stringify({ sales })); //{"sales": sales}
});

// DELETE  /v1/stocks
app.delete("/v1/stocks", (res, req) => {
  // 在庫と売り上げを削除
  products.length = 0;
  sales = 0;
});

// // .../v2/...             //////////////////////////////////////////////////////////////////////////////
// 在庫
const stocks = [
  { id: 1, name: "stock1", amount: 3, price: 100 },
  { id: 2, name: "stock2", amount: 3, price: 150 },
  { id: 3, name: "stock3", amount: 3, price: 120 },
];

// 小計
let subtotal = 0;

// POSTされるJSONのバリデーションを共通化
const validationV2 = (posted) => {
  const schema = Joi.object({
    name: Joi.string()
      .regex(/^[a-zA-Z]*$/)
      .max(8)
      .required(),
    amount: Joi.number().integer().min(1), //自然数
  });
  return schema.validate(posted);
};

// GET /v2/stocks/
//在庫すべて参照
app.get("/v2/stocks/", (req, res) => {
  res.send(stocks);
});

//paramの在庫だけ参照 idで取得
app.get("/v2/stocks/:id", (req, res) => {
  const stock = stocks.find((s) => s.id === parseInt(req.params.id));
  if (!stock) return res.status(404).send("No product yet with given id");
  res.send(stock);
});

//POST
//追加（POST） .../v2/stocks/
app.post("/v2/stocks", (req, res) => {
  // POSTは{name:  , amount:  } or {name:  }でもらいたい

  const { error } = validationV2(req.body);
  // status code with error
  if (error) return res.status(400).send(error.details[0].message);
  console.log(error);

  // 商品の価格は１００~２００ price has to be decided at serverside
  const minPrice = 100;
  const maxPrice = 200;
  const price =
    Math.floor(Math.random() * (maxPrice + 1 - minPrice)) + minPrice;

  if (!req.body?.amount) {
    const newStock = {
      name: req.body.name,
      id: stocks.length + 1,
      amount: 1,
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
      amount: req.body.amount,
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

// 売る（POST） .../v2/sales
app.post("/v2/sales", (req, res) => {
  // {name:  , amount:  }がPOSTされる

  const { error } = validationV2(req.body);
  // status code with error
  if (!req.body.amount)
    //amount はここでは必須だが任意のとこもあるのでそこは関数化できてない
    return res
      .status(400)
      .send("Ops, please request the item quantity you want");
  if (error) return res.status(400).send(error.details[0].message);

  //POSTについてnameとamountしか受け取りたくないがValidationが・・・
  //・・・

  //リクエストされた商品を名前で取得
  const soldStock = stocks.find((s) => s.name === req.body.name);

  if (soldStock.amount < req.body.amount)
    return res
      .status(404)
      .send("sorry..., stocks are only " + soldStock.amount + " now");

  //売り上げに加算
  //0 >= 0 は判断済み？
  if (req.body.amount) {
    subtotal += req.body.amount * soldStock.price;
  }

  //売れた個数分減らす
  soldStock.amount -= req.body.amount;

  res.status(201).send(req.body); // 送られたJSONをそのまま返す
});

//売り上げ照会（GET）  .../v2/sales
//売り上げすべて参照
app.get("/v2/sales", (req, res) => {
  res.status(200).send(JSON.stringify({ subtotal })); //{"sales": sales}
});

// DELETE  .../v2/stocks... idを受け取って任意の商品を削除
app.delete("/v2/stocks/:id", (req, res) => {
  const stock = stocks.find((s) => s.id === parseInt(req.params?.id));

  console.log(stock);
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
