const express = require("express");
const app = express();

app.use(express.json());

app.listen(80, () => console.log("Port80 listening..."));

const v1 = require("./version/v1");
const v2 = require("./version/v2");
const digest = require("./basic");

// root
app.get("/", (req, res) => {
  res.send("AWS");
});

app.use("/v1", v1);
app.use("/v2", v2);
app.use("/secret", digest);

module.exports = app;
