const express = require("express");
const port = 8080;

const app = express();

app.get('/login', (req, res) => {
  console.log('this is login page');
});

app.get('/main', (req, res) => {
  console.log('this is main page');
})

app.listen(port, (req, res) => {
  console.log(`App is running at port ${port}`);
});
