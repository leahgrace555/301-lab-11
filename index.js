'use strict';

const express = require('express');
const app = express();

require('ejs');
app.set('view engine','ejs');

require('dotenv').config();
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});

app.use(express.urlencoded({extended: true}));
app.use(express.static('./Public'));

//test route:
app.get('/hello', (request,response) => {
  response.render('pages/index.ejs');
})


