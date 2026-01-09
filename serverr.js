const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
app.use(cors());

app.get("/products", (req, res) => {
  db.query("SELECT * FROM products", (err, result) => {
    if (err) return res.status(500).send(err);
    res.json(result);
  });
});

app.listen(3000, () => {
  console.log("Server çalışıyor : http://localhost:3000");
});
