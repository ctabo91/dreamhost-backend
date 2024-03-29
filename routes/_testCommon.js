"use strict";

const db = require("../db.js");
const User = require("../models/user");
const Meal = require("../models/meal");
const Drink = require("../models/drink");
const { createToken } = require("../helpers/tokens");

const testMealIds = [];
const testDrinkIds = [];
const testPersonalMealIds = [];
const testPersonalDrinkIds = [];

async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM meals");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM drinks");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM personal_meals");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM personal_drinks");
  
  //  Create meals 
  testMealIds[0] = (await Meal.create(
      {
        name: "M1",
        category: "Cat1",
        area: "A1",
        instructions: "Inst1",
        thumbnail: "http://M1.img",
        ingredients: ["Ing1a", "Ing1b", "Ing1c"]
      })).id;
  testMealIds[1] = (await Meal.create(
      {
        name: "M2",
        category: "Cat2",
        area: "A2",
        instructions: "Inst2",
        thumbnail: "http://M2.img",
        ingredients: ["Ing2a", "Ing2b", "Ing2c"]
      })).id;
  testMealIds[2] = (await Meal.create(
      {
        name: "M3",
        category: "Cat3",
        area: "A3",
        instructions: "Inst3",
        thumbnail: "http://M3.img",
        ingredients: ["Ing3a", "Ing3b", "Ing3c"]
      })).id;

  //  Create drinks
  testDrinkIds[0] = (await Drink.create(
      {
        name: "D1",
        category: "Cat1",
        type: "T1",
        glass: "G1",
        instructions: "Inst1",
        thumbnail: "http://D1.img",
        ingredients: ["Ing1a", "Ing1b", "Ing1c"]
      })).id;
  testDrinkIds[1] = (await Drink.create(
      {
        name: "D2",
        category: "Cat2",
        type: "T2",
        glass: "G2",
        instructions: "Inst2",
        thumbnail: "http://D2.img",
        ingredients: ["Ing2a", "Ing2b", "Ing2c"]
      })).id;
  testDrinkIds[2] = (await Drink.create(
      {
        name: "D3",
        category: "Cat3",
        type: "T3",
        glass: "G3",
        instructions: "Inst3",
        thumbnail: "http://D3.img",
        ingredients: ["Ing3a", "Ing3b", "Ing3c"]
      })).id;


  await User.register({
    username: "u1",
    firstName: "U1F",
    lastName: "U1L",
    email: "user1@user.com",
    password: "password1",
  });
  await User.register({
    username: "u2",
    firstName: "U2F",
    lastName: "U2L",
    email: "user2@user.com",
    password: "password2",
  });
  await User.register({
    username: "u3",
    firstName: "U3F",
    lastName: "U3L",
    email: "user3@user.com",
    password: "password3",
  });

  await User.markFavMeal("u1", testMealIds[0]);
  await User.markFavDrink("u1", testDrinkIds[0]);

  //  Create personal meals
  testPersonalMealIds[0] = (await User.createPersonalRecipe(
      "u1", 
      "meals", 
      {
        name: "P-M1",
        category: "P-Cat1",
        area: "P-A1",
        instructions: "P-Inst1",
        thumbnail: "http://P-M1.img",
        ingredients: ["P-Ing1a", "P-Ing1b", "P-Ing1c"]
      })).id;
  testPersonalMealIds[1] = (await User.createPersonalRecipe(
      "u1", 
      "meals", 
      {
        name: "P-M2",
        category: "P-Cat2",
        area: "P-A2",
        instructions: "P-Inst2",
        thumbnail: "http://P-M2.img",
        ingredients: ["P-Ing2a", "P-Ing2b", "P-Ing2c"]
      })).id;

  //  Create personal drinks
  testPersonalDrinkIds[0] = (await User.createPersonalRecipe(
      "u1", 
      "drinks", 
      {
        name: "P-D1",
        category: "P-Cat1",
        type: "P-T1",
        glass: "P-G1",
        instructions: "P-Inst1",
        thumbnail: "http://P-D1.img",
        ingredients: ["P-Ing1a", "P-Ing1b", "P-Ing1c"]
      })).id;
  testPersonalDrinkIds[1] = (await User.createPersonalRecipe(
      "u1", 
      "drinks", 
      {
        name: "P-D2",
        category: "P-Cat2",
        type: "P-T2",
        glass: "P-G2",
        instructions: "P-Inst2",
        thumbnail: "http://P-D2.img",
        ingredients: ["P-Ing2a", "P-Ing2b", "P-Ing2c"]
      })).id;
}

async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}


const u1Token = createToken({ username: "u1" });
const u2Token = createToken({ username: "u2" });


module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testMealIds,
  testDrinkIds,
  testPersonalMealIds,
  testPersonalDrinkIds,
  u1Token,
  u2Token,
};
