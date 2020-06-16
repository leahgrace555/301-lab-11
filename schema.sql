DROP TABLE IF EXISTS books;

CREATE TABLE books
(
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  authors VARCHAR(255),
  description TEXT,
  image_url VARCHAR(255),
  isbn VARCHAR(255),
  bookshelf VARCHAR(255)
);

