const express = require('express');
const app = express();
const port = 3000;

// Incorrect path initially
// const verifyToken = require('../middleware/auth');

// Corrected path
const verifyToken = require('../auth');

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/protected', verifyToken, (req, res) => {
  res.send('Protected route accessed!');
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});