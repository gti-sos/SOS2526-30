const express = require('express');
const path = require('path');


//const FMPG = require("./index-FMPG.js");
//const GGG = require("./index-GGG.js");
const cool = require("cool-ascii-faces"); 

const app = express()

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'general/about.html'))
})
app.get('/cool', (req, res) => {
  res.send(`<html><body><h1>${cool()}</h1></body></html>`)
})  

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000')
})

