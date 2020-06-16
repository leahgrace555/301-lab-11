'use strict';

const express = require('express');
const app = express();
const superagent = require('superagent');
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

//searches route
app.get('/searches/new', (request,response) => {
  response.render('pages/searches/new.ejs')
})

app.post('/searches',(request,response) => {
  let url = 'https://www.googleapis.com/books/v1/volumes?q='


  let query = request.body.search[0];
  let titleOrAuthor = request.body.search[1];

  if(titleOrAuthor === 'title'){
    url+=`+intitle:${query}`;
  }else if(titleOrAuthor === 'author'){
    url+=`+inauthor:${query}`;
  }

  superagent.get(url)
    .then(results => {
      // console.log(results.body.items[0].volumeInfo.imageLinks);

      let books = results.body.items.map(val => {
        return new Book(val)
      });

      // response.status(200).send(books);

      response.render('pages/searches/show.ejs', {searchResults: books});
    }).catch(err => error(err, response));
});

//book constrcution
function Book(info) {
  const placeholderImg = 'https://i.imgur.com/J5LVHEL.jpg';
  this.title = info.volumeInfo.title ? info.volumeInfo.title: 'not available';
  this.author = info.volumeInfo.authors;
  let reg = /^https/;

  if(reg.test(info.volumeInfo.imageLinks.smallThumbnail)) {
    this.imageULR = info.volumeInfo.imageLinks.smallThumbnail
  } else{
    // let last = info.volumeInfo.imageLinks.smallThumbnail.splice

    this.imageULR = placeholderImg;
  }
  
  //TODO: Make images have 'https' prefix.
}

// 500 error message
const error = (err, res) => {
  console.log('Error', err);
  res.status(500).send('There was an error on our part.');
}

// 'https://www.googleapis.com/books/v1/volumes?q=';

