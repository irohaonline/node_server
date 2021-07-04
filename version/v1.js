const Joi = require("joi");
const express = require("express");
const router = express.Router();

// app.use(express.json());

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
router.get("/stocks/", (req, res) => {
  //nameの昇順にソート
  products.sort(
    sort_by("name", false, function (a) {
      return a;
    })
  );
  res.send(products);
});

//paramの在庫だけ参照
router.get("/stocks/:name", (req, res) => {
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
router.post("/stocks", (req, res) => {
  const postedJSON = req.body; //リクエストボディはJSONのみ許可
  const name = postedJSON.name;
  const amount = postedJSON.amount;

  console.log(validation(postedJSON));
  const { error } = validation(postedJSON);
  // status code with staticmassage "ERROR"
  if (error) return res.status(400).send(JSON.stringify(errorMessage));

  res.header("Location", "/stocks/" + name).send(postedJSON); // 送られたJSONをそのまま返す

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
router.post("/sales", (req, res) => {
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

  res.header("Location", "/sales/" + name).send(postedJSON); // 送られたJSONをそのまま返す
});

//売り上げすべて参照
router.get("/sales/", (req, res) => {
  //小数点第二位まで表示
  sales = Math.ceil(sales * Math.pow(10, 2)) / Math.pow(10, 2);
  res.send(JSON.stringify({ sales })); //{"sales": sales}
});

// DELETE  /v1/stocks
router.delete("/stocks", (res, req) => {
  // 在庫と売り上げを削除
  products.length = 0;
  sales = 0;
});

module.exports = router;
