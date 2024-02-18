CREATE TABLE users (
    username VARCHAR(25) PRIMARY KEY,
    password TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL
        CHECK (position('@' IN email) > 1)
);

CREATE TABLE meals (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    area TEXT NOT NULL,
    instructions TEXT NOT NULL,
    thumbnail TEXT,
    ingredients TEXT[] NOT NULL
);

CREATE TABLE drinks (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    type TEXT NOT NULL,
    glass TEXT,
    instructions TEXT NOT NULL,
    thumbnail TEXT,
    ingredients TEXT[] NOT NULL
);

CREATE TABLE favorite_meals (
    username VARCHAR(25)
        REFERENCES users ON DELETE CASCADE,
    meal_id INTEGER
        REFERENCES meals ON DELETE CASCADE,
    PRIMARY KEY (username, meal_id)
);

CREATE TABLE favorite_drinks (
    username VARCHAR(25)
        REFERENCES users ON DELETE CASCADE,
    drink_id INTEGER
        REFERENCES drinks ON DELETE CASCADE,
    PRIMARY KEY (username, drink_id)
);