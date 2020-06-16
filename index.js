'use strict';

const express = require('express');
const app = express();
const superagent = require('superagent');
const pg = require('pg');
require('dotenv').config();
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => console.log(err));

require('ejs');
app.set('view engine', 'ejs');
const PORT = process.env.PORT || 3001;

app.use(express.urlencoded({
  extended: true
}));
app.use(express.static('./Public'));

//home route:
app.get('/', (request, response) => {
  let sql = 'SELECT * FROM books;';
  client.query(sql)
    .then(sqlResults => {
      let books = sqlResults.rows
      let totalBooks = sqlResults.rowCount;
      console.log(books);
      response.render('pages/index.ejs',{books: books, bookCount: totalBooks});
    }).catch(err => error(err, response));
});

//searches route
app.get('/searches/new', (request, response) => {
  response.render('pages/searches/new.ejs')
})

// searches route
app.post('/searches', (request, response) => {
  let url = 'https://www.googleapis.com/books/v1/volumes?q='

  let query = request.body.search[0];
  let titleOrAuthor = request.body.search[1];

  if (titleOrAuthor === 'title') {
    url += `+intitle:${query}`;
  } else if (titleOrAuthor === 'author') {
    url += `+inauthor:${query}`;
  }

  // grab data from api
  superagent.get(url)
    .then(results => {

      let books = results.body.items.map(val => {
        return new Book(val)
      });

      response.render('pages/searches/show.ejs', {
        searchResults: books
      });
    }).catch(err => error(err, response));
});

//book construction
function Book(info) {
  this.title = info.volumeInfo.title ? info.volumeInfo.title : 'not available';
  this.author = info.volumeInfo.authors;
  this.description = info.volumeInfo.description

  let img = info.volumeInfo.imageLinks.thumbnail;
  let reg = /^https/;

  if (reg.test(img)) {
    this.imageULR = img
  } else {
    let first = 'https';
    let last = img.slice(4);
    this.imageULR = first + last;
  }
}

// 500 error message
const error = (err, res) => {
  console.log('Error', err);
  res.status(500).send('There was an error on our part.');
}

// app.listen(PORT, () => {
//   console.log(`listening on ${PORT}`);
// });

client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`listening on ${PORT}.`);
    });
  });
// const placeholderImg = 'https://i.imgur.com/J5LVHEL.jpg';
