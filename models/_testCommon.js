const bcrypt = require("bcrypt");

const db = require("../db.js");
const { BCRYPT_WORK_FACTOR } = require("../config.js");

const testMealIds = [];
const testDrinkIds = [];
const testPersonalMealIds = [];
const testPersonalDrinkIds = [];

async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM meals");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM drinks");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM personal_meals");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM personal_drinks");

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

  const resultsPersonalMeals = await db.query(`
    INSERT INTO personal_meals (name, category, area, instructions, thumbnail, ingredients, username)
    VALUES ('P-M1', 'P-Cat1', 'P-A1', 'P-Inst1', 'http://P-M1.img', ARRAY['P-Ing1a', 'P-Ing1b', 'P-Ing1c'], 'u1'),
            ('P-M2', 'P-Cat2', 'P-A2', 'P-Inst2', 'http://P-M2.img', ARRAY['P-Ing2a', 'P-Ing2b', 'P-Ing2c'], 'u1'),
            ('P-M3', 'P-Cat3', 'P-A3', 'P-Inst3', 'http://P-M3.img', ARRAY['P-Ing3a', 'P-Ing3b', 'P-Ing3c'], 'u1')
    RETURNING id`);
  testPersonalMealIds.splice(0, 0, ...resultsPersonalMeals.rows.map(r => r.id));

  const resultsPersonalDrinks = await db.query(`
    INSERT INTO personal_drinks (name, category, type, glass, instructions, thumbnail, ingredients, username)
    VALUES ('P-D1', 'P-Cat1', 'P-T1', 'P-G1', 'P-Inst1', 'http://P-D1.img', ARRAY['P-Ing1a', 'P-Ing1b', 'P-Ing1c'], 'u1'),
            ('P-D2', 'P-Cat2', 'P-T2', 'P-G2', 'P-Inst2', 'http://P-D2.img', ARRAY['P-Ing2a', 'P-Ing2b', 'P-Ing2c'], 'u1'),
            ('P-D3', 'P-Cat3', 'P-T3', 'P-G3', 'P-Inst3', 'http://P-D3.img', ARRAY['P-Ing3a', 'P-Ing3b', 'P-Ing3c'], 'u1')
    RETURNING id`);
  testPersonalDrinkIds.splice(0, 0, ...resultsPersonalDrinks.rows.map(r => r.id));
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
  testPersonalMealIds,
  testPersonalDrinkIds,
};