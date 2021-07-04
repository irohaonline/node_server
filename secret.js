const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();

router.use(express.json());

const users = [];

// /secret
router.get("/", (req, res) => {
  res.send(
    JSON.stringify({
      status: "401 Unauthorized",
      message: "POST authorized name and password",
    })
  );
});

router.post("/", async (req, res) => {
  //aws, candidateなら登録なしでSUCCESS
  if (req.body.name === "aws" && req.body.password === "candidate")
    return res.status(200).send("SUCCESS");
  //それ以外のユーザーとパスワードなら登録の有無を確認
  const user = users.find((user) => user.name === req.body.name);
  if (user == null) {
    return res.status(400).send("Cannot find user");
  }
  try {
    if (await bcrypt.compare(req.body.password, user.password)) {
      res.send("SUCESS");
    } else {
      res.send("Not Allowed");
    }
  } catch {
    res.status(500).send();
  }
});

// 新規ユーザーの登録（{name: aws, password: candidate}以外）
router.post("/signup", async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = { name: req.body.name, password: hashedPassword };
    users.push(user);
    res
      .status(201)
      .send(
        "Sign up Succeeded with name '" +
          req.body.name +
          "' and passoword '" +
          req.body.password +
          "'"
      );
  } catch {
    res.status(500).send();
  }
});

module.exports = router;
