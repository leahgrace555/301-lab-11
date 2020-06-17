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

/////////////////////////////////CONSTRUCTORS////////////////////////////////////////////

//book constructor
function Book(info) {
  this.title = info.volumeInfo.title ? info.volumeInfo.title : 'not available';
  this.author = info.volumeInfo.authors;
  this.description = info.volumeInfo.description;
  this.isbn = info.volumeInfo.industryIdentifiers[0].identifier;

  let img = info.volumeInfo.imageLinks.thumbnail;
  let reg = /^https/;

  if (reg.test(img)) {
    this.image_url = img
  } else {
    let first = 'https';
    let last = img.slice(4);
    this.image_url = first + last;
  }
}

/////////////////////////////////ROUTES//////////////////////////////////////////////////////

// routes
app.get('/books/:book_id', getSingleBook);
app.get('/searches', getSearch);
app.get('/', getFavorites);
app.post('/searches', postSearchResults);
app.post('/', addBook);

/////////////////////////////////HELPER FUNCTIONS////////////////////////////////////////////

// 500 error message
const error = (err, res) => {
  console.log('Error', err);
  res.status(500).send('There was an error on our part.');
}

/////////////////////////////////CALLBACK FUNCTIONS////////////////////////////////////////////

// call back function for addbook route
// adds a book to the favorites list
function addBook(request, response) {

  let {
    title,
    authors,
    description,
    image_url,
    isbn
  } = request.body;
  // console.log(request.body.items);
  let sql = 'INSERT INTO books (title, authors, description, image_url, isbn) VALUES ($1, $2, $3, $4, $5) RETURNING ID;';
  let safeVals = [title, authors, description, image_url, isbn];

  client.query(sql, safeVals)
    .then(sqlResults => {
      let id = sqlResults.rows[0].id;
      console.log(id);
      response.redirect(`/books/${id}`);
    }).catch(err => error(err, response));
}

// call back function for searches/new route
function getSearch(request, response) {
  response.render('pages/searches/new.ejs')
}

// call back function for home route
// displays the favorited books on the home page
function getFavorites(request, response) {
  let sql = 'SELECT * FROM books;';
  client.query(sql)
    .then(sqlResults => {
      let books = sqlResults.rows
      let totalBooks = sqlResults.rowCount;
      // console.log(books);
      response.render('pages/index.ejs', {
        books: books,
        bookCount: totalBooks
      });
    }).catch(err => error(err, response));
}

// call back function for search results route
function postSearchResults(request, response) {
  // get api url
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

      // loop through results and construct new book object each iteration
      let books = results.body.items.map(val => {
        return new Book(val);
      });
      // console.log(results.body.items[0]);
      response.render('pages/searches/show.ejs', {
        searchResults: books
      });
    }).catch(err => error(err, response));
}

// call back function for books route
function getSingleBook(request, response) {
  // console.log('request params id:', request.params.book_id);

  let id = request.params.book_id;

  // get sql data
  let sql = 'SELECT * FROM books WHERE id=$1;';
  let safeVals = [id];

  client.query(sql, safeVals)
    .then(sqlResults => {

      // render sql data to detail.ejs
      response.status(200).render('pages/searches/detail.ejs', {
        oneBook: sqlResults.rows[0]
      });
    }).catch(err => error(err, response));
}

////////////////////////////////////////LISTENERS///////////////////////////////////

client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`listening on ${PORT}.`);
    });
  });

// const placeholderImg = 'https://i.imgur.com/J5LVHEL.jpg';