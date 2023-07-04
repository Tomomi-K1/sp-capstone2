﻿-- Link to schema: https://app.quickdatabasediagrams.com/#/d/pbR29N
-- on ubuntu type psql <dbtable.sql

DROP DATABASE IF EXISTS podsearch_db;

CREATE DATABASE podsearch_db;

\c podsearch_db;

CREATE TABLE users (
    id SERIAL  PRIMARY KEY,
    username  VARCHAR(25)  UNIQUE NOT NULL,
    password VARCHAR(25)   UNIQUE NOT NULL,
    email TEXT  UNIQUE NOT NULL,
    signup_date DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE categories (
    id INT  PRIMARY KEY,
    name TEXT   NOT NULL
);

CREATE TABLE reviews (
    id SERIAL  PRIMARY KEY,
    user_id INT  NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    feed_id INT   NOT NULL,
    comment TEXT   NOT NULL,
    rating INT   NOT NULL,
    created_at DATE  NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE fav_pods (
    id SERIAL   PRIMARY KEY,
    user_id INT   NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    feed_id INT   NOT NULL,
    author TEXT NOT NULL,
    title TEXT NOT NULL,
    artwork_url TEXT NOT NULL
);

CREATE TABLE fav_categories (
    id SERIAL   PRIMARY KEY,
    user_id INT   NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    category_id INT   NOT NULL REFERENCES categories (id) ON DELETE CASCADE
);

INSERT INTO categories
    (id, name)
VALUES (9, 'Business');

INSERT INTO categories
    (id, name)
VALUES (16, 'Comedy');


