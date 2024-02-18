const bcrypt = require("bcrypt");

const db = require("../db.js");
const { BCRYPT_WORK_FACTOR } = require("../config.js");

const testMealIds = [];
const testDrinkIds = [];

async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM meals");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM drinks");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users");

  const resultsMeals = await db.query(`
    INSERT INTO meals (name, category, area, instructions, thumbnail, ingredients)
    VALUES ('M1', 'Cat1', 'A1', 'Inst1', 'http://M1.img', ARRAY['Ing1a', 'Ing1b', 'Ing1c']),
           ('M2', 'Cat2', 'A2', 'Inst2', 'http://M2.img', ARRAY['Ing2a', 'Ing2b', 'Ing2c']),
           ('M3', 'Cat3', 'A3', 'Inst3', 'http://M3.img', ARRAY['Ing3a', 'Ing3b', 'Ing3c'])
    RETURNING id`);
  testMealIds.splice(0, 0, ...resultsMeals.rows.map(r => r.id));

  const resultsDrinks = await db.query(`
    INSERT INTO drinks (name, category, type, glass, instructions, thumbnail, ingredients)
    VALUES ('D1', 'Cat1', 'T1', 'G1', 'Inst1', 'http://D1.img', ARRAY['Ing1a', 'Ing1b', 'Ing1c']),
           ('D2', 'Cat2', 'T2', 'G2', 'Inst2', 'http://D2.img', ARRAY['Ing2a', 'Ing2b', 'Ing2c']),
           ('D3', 'Cat3', 'T3', 'G3', 'Inst3', 'http://D3.img', ARRAY['Ing3a', 'Ing3b', 'Ing3c'])
    RETURNING id`);
  testDrinkIds.splice(0, 0, ...resultsDrinks.rows.map(r => r.id));

  await db.query(`
        INSERT INTO users(username,
                          password,
                          first_name,
                          last_name,
                          email)
        VALUES ('u1', $1, 'U1F', 'U1L', 'u1@email.com'),
               ('u2', $2, 'U2F', 'U2L', 'u2@email.com')
        RETURNING username`,
      [
        await bcrypt.hash("password1", BCRYPT_WORK_FACTOR),
        await bcrypt.hash("password2", BCRYPT_WORK_FACTOR),
      ]);

  await db.query(`
        INSERT INTO favorite_meals(username, meal_id)
        VALUES ('u1', $1)`,
      [testMealIds[0]]);

  await db.query(`
        INSERT INTO favorite_drinks(username, drink_id)
        VALUES ('u1', $1)`,
      [testDrinkIds[0]]);
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


module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testMealIds,
  testDrinkIds,
};