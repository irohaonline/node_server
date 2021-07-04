//version2

const Joi = require("joi");
const express = require("express");
const router = express.Router();

// 在庫
const stocks = [
  { id: 1, name: "Cola", quantity: 3, price: 100 },
  { id: 2, name: "Pepsi", quantity: 3, price: 150 },
  { id: 3, name: "Ramune", quantity: 3, price: 120 },
  { id: 4, name: "Tea", quantity: 3, price: 110 },
];

// 小計
let subtotal = 0;

// POSTされるJSONのバリデーション
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

// GET /stocks/
//在庫すべて参照
router.get("/stocks/", (req, res) => {
  res.send(stocks);
});

//paramの在庫だけ参照 idで取得
router.get("/stocks/:id", (req, res) => {
  const stock = stocks.find((s) => s.id === parseInt(req.params.id));
  if (!stock) return res.status(404).send("No product yet with given id");
  res.send(stock);
});

//POST {name:  , quantity:  } or {name:  }をもらいたい
//追加（POST） .../stocks/
router.post("/stocks", (req, res) => {
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
// .../sales
router.post("/sales", (req, res) => {
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

//売り上げすべて参照
router.get("/sales", (req, res) => {
  res.status(200).send(JSON.stringify({ subtotal })); //{"sales": sales}
});

// DELETE  .../stocks/:id... idを受け取って任意の商品を削除
router.delete("/stocks/:id", (req, res) => {
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

module.exports = router;
