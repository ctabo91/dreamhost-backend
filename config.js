"use strict";

require("dotenv").config();
require("colors");

const MEAL_BASE_URL = "https://www.themealdb.com/api/json/v1/1/";

const DRINK_BASE_URL = "https://www.thecocktaildb.com/api/json/v1/1/";

const SECRET_KEY = process.env.SECRET_KEY || "secret-dev";

const PORT = +process.env.PORT || 3001;

function getDatabaseUri() {
    return (process.env.NODE_ENV === "test")
        ? "postgresql:///dreamhost_test"
        : process.env.DATABASE_URL || "postgresql:///dreamhost";
}


const BCRYPT_WORK_FACTOR = process.env.NODE_ENV === "test" ? 1 : 12;

console.log("DreamHost Config:".green);
console.log("SECRET_KEY:".yellow, SECRET_KEY);
console.log("PORT:".yellow, PORT.toString());
console.log("BCRYPT_WORK_FACTOR".yellow, BCRYPT_WORK_FACTOR);
console.log("Database:".yellow, getDatabaseUri());
console.log("---");


module.exports = {
    MEAL_BASE_URL,
    DRINK_BASE_URL,
    PORT,
    SECRET_KEY,
    BCRYPT_WORK_FACTOR,
    getDatabaseUri
};