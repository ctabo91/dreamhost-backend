"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");
const { sqlForPartialUpdate } = require("../helpers/sql");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");

const { BCRYPT_WORK_FACTOR } = require("../config.js");

/** Related functions for users. */

class User {
  /** authenticate user with username, password.
   *
   * Returns { username, first_name, last_name, email }
   *
   * Throws UnauthorizedError is user not found or wrong password.
   **/

  static async authenticate(username, password) {
    // try to find the user first
    const result = await db.query(
          `SELECT username,
                  password,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email
           FROM users
           WHERE username = $1`,
        [username],
    );

    const user = result.rows[0];

    if (user) {
      // compare hashed password to a new hash from password
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid === true) {
        delete user.password;
        return user;
      }
    }

    throw new UnauthorizedError("Invalid username/password");
  }

  /** Register user with data.
   *
   * Returns { username, firstName, lastName, email }
   *
   * Throws BadRequestError on duplicates.
   **/

  static async register(
      { username, password, firstName, lastName, email }) {
    const duplicateCheck = await db.query(
          `SELECT username
           FROM users
           WHERE username = $1`,
        [username],
    );

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate username: ${username}`);
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
          `INSERT INTO users
           (username,
            password,
            first_name,
            last_name,
            email)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING username, first_name AS "firstName", last_name AS "lastName", email`,
        [
          username,
          hashedPassword,
          firstName,
          lastName,
          email,
        ],
    );

    const user = result.rows[0];

    return user;
  }

  /** Find all users.
   *
   * Returns [{ username, first_name, last_name, email }, ...]
   **/

  static async findAll() {
    const result = await db.query(
          `SELECT username,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email
           FROM users
           ORDER BY username`,
    );

    return result.rows;
  }

  /** Given a username, return data about user.
   *
   * Returns { username, first_name, last_name, email, favMeals, favDrinks }
   *   where favMeals is { id, name, category, area, instructions, thumbnail, ingredients }
   *   and favDrinks is { id, name, category, type, glass, instructions, thumbnail, ingredients }
   *
   * Throws NotFoundError if user not found.
   **/

  static async get(username) {
    const userRes = await db.query(
          `SELECT username,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email
           FROM users
           WHERE username = $1`,
        [username],
    );

    const user = userRes.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    const userFavMealsRes = await db.query(
          `SELECT fm.meal_id
           FROM favorite_meals AS fm
           WHERE fm.username = $1`, [username]);

    const userFavDrinksRes = await db.query(
          `SELECT fd.drink_id
           FROM favorite_drinks AS fd
           WHERE fd.username = $1`, [username]);

    user.favMeals = userFavMealsRes.rows.map(fm => fm.meal_id);

    user.favDrinks = userFavDrinksRes.rows.map(fd => fd.drink_id);

    return user;
  }

  /** Update user data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include:
   *   { firstName, lastName, password, email }
   *
   * Returns { username, firstName, lastName, email }
   *
   * Throws NotFoundError if not found.
   *
   * WARNING: this function can set a new password or make a user an admin.
   * Callers of this function must be certain they have validated inputs to this
   * or a serious security risks are opened.
   */

  static async update(username, data) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
    }

    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          firstName: "first_name",
          lastName: "last_name",
        });
    const usernameVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE users 
                      SET ${setCols} 
                      WHERE username = ${usernameVarIdx} 
                      RETURNING username,
                                first_name AS "firstName",
                                last_name AS "lastName",
                                email`;
    const result = await db.query(querySql, [...values, username]);
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    delete user.password;
    return user;
  }

  /** Delete given user from database; returns undefined. */

  static async remove(username) {
    let result = await db.query(
          `DELETE
           FROM users
           WHERE username = $1
           RETURNING username`,
        [username],
    );
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);
  }

  /** Given a username and type (meals or drinks), find all of the peronal recipes associated to that user, of the given type.
   * 
   * if type = "meals":
   * Returns [ { id, name, category, area, instructions, thumbnail, ingredients }, ...] 
   * 
   * if type = "drinks":
   * Returns [ { id, name, category, type, glass, instructions, thumbnail, ingredients }, ...] 
   **/ 

  static async getPersonalRecipes(username, type) {
    const result = type === "meals"
            ? await db.query(
                    `SELECT id,
                            name,
                            category,
                            area,
                            instructions,
                            thumbnail,
                            ingredients
                    FROM personal_meals
                    WHERE username = $1
                    ORDER BY name`,
                  [username]
              )
            :
              await db.query(
                    `SELECT id,
                            name,
                            category,
                            type,
                            glass,
                            instructions,
                            thumbnail,
                            ingredients
                    FROM personal_drinks
                    WHERE username = $1
                    ORDER BY name`,
                  [username]
              );

    return result.rows;
  }

  /** Given a username and type (meals or drinks), create a personalRecipe according to the type, using the data that is passed.
   * 
   * data should be:
   * 
   * -if meal { name, category, area, instructions, thumbnail, ingredients }
   *
   * Returns { id, name, category, area, instructions, thumbnail, ingredients }
   * 
   * -if drink { name, category, type, glass, instructions, thumbnail, ingredients }
   * 
   * Returns { id, name, category, type, glass, instructions, thumbnail, ingredients }
   **/ 

  static async createPersonalRecipe(username, type, data) {
    const result = type === "meals"
            ? await db.query(
                    `INSERT INTO personal_meals
                     (name, category, area, instructions, thumbnail, ingredients, username)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)
                     RETURNING id, name, category, area, instructions, thumbnail, ingredients`,
                  [
                    data.name,
                    data.category,
                    data.area,
                    data.instructions,
                    data.thumbnail,
                    data.ingredients,
                    username
                  ]
              )
            :
              await db.query(
                    `INSERT INTO personal_drinks
                    (name, category, type, glass, instructions, thumbnail, ingredients, username)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    RETURNING id, name, category, type, glass, instructions, thumbnail, ingredients`,
                  [
                    data.name,
                    data.category,
                    data.type,
                    data.glass,
                    data.instructions,
                    data.thumbnail,
                    data.ingredients,
                    username
                  ]
              );

    const personalRecipe = result.rows[0];

    return personalRecipe;
  }

  /** Given a username and type (meals or drinks), return data about a personalRecipe.
   * 
   * if type = meals:
   * 
   * Returns { id, name, category, area, instructions, thumbnail, ingredients }
   * 
   * if type = drinks:
   * 
   * Returns { id, name, category, type, glass, instructions, thumbnail, ingredients }
   * 
   * Throws NotFoundError if not found.
   **/ 

  static async getPersonalRecipe(id, username, type) {
    const result = type === "meals"
             ? await db.query(`SELECT id,
                                      name,
                                      category,
                                      area,
                                      instructions,
                                      thumbnail,
                                      ingredients
                               FROM personal_meals
                               WHERE id = $1 AND username = $2`,
                            [id, username])
             :
               await db.query(`SELECT id,
                                      name,
                                      category,
                                      type,
                                      glass,
                                      instructions,
                                      thumbnail,
                                      ingredients
                               FROM personal_drinks
                               WHERE id = $1 AND username = $2`,
                            [id, username]);

    const personalRecipe = result.rows[0];

    if (!personalRecipe) throw new NotFoundError(`No personal ${type}: ${id}`);

    return personalRecipe;
  }

  /** Given a username and type (meals or drinks), update the personalRecipe data according to the type, with data that is passed
   * 
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   * 
   * Data can include:
   * 
   * -if type = meal { name, category, area, instructions, thumbnail, ingredients }
   *
   * Returns { id, name, category, area, instructions, thumbnail, ingredients }
   * 
   * -if type = drink { name, category, type, glass, instructions, thumbnail, ingredients }
   * 
   * Returns { id, name, category, type, glass, instructions, thumbnail, ingredients }
   * 
   * Throws NotFoundError if not found.
   **/ 

  static async updatePersonalRecipe(id, type, data) {
    const { setCols, values } = sqlForPartialUpdate(data);
    const idVarIdx = "$" + (values.length + 1);

    const querySql = type === "meals"
            ? `UPDATE personal_meals 
               SET ${setCols} 
               WHERE id = ${idVarIdx} 
               RETURNING id, 
                         name, 
                         category, 
                         area, 
                         instructions,
                         thumbnail,
                         ingredients`
            :
              `UPDATE personal_drinks 
               SET ${setCols} 
               WHERE id = ${idVarIdx} 
               RETURNING id, 
                         name, 
                         category, 
                         type,
                         glass,
                         instructions,
                         thumbnail,
                         ingredients`;

    const result = await db.query(querySql, [...values, id]);
    const personalRecipe = result.rows[0];

    if (!personalRecipe) throw new NotFoundError(`No personal ${type}: ${id}`);

    return personalRecipe;
  }

  /** Favorite a meal: update db, returns undefined.
   *
   * - username: username favoriting meal
   * - mealId: meal id
   **/

  static async markFavMeal(username, mealId) {
    const preCheck = await db.query(
          `SELECT id
           FROM meals
           WHERE id = $1`, [mealId]);
    const meal = preCheck.rows[0];

    if (!meal) throw new NotFoundError(`No meal: ${mealId}`);

    const preCheck2 = await db.query(
          `SELECT username
           FROM users
           WHERE username = $1`, [username]);
    const user = preCheck2.rows[0];

    if (!user) throw new NotFoundError(`No username: ${username}`);

    await db.query(
          `INSERT INTO favorite_meals (meal_id, username)
           VALUES ($1, $2)
           ON CONFLICT (meal_id, username) DO NOTHING`,
        [mealId, username]);
  }

  /** Unfavorite a meal: update db, returns undefined.
   *
   * - username: username unfavoriting meal
   * - mealId: meal id
   **/

  static async unmarkFavMeal(username, mealId) {
    const preCheck = await db.query(
          `SELECT id
           FROM meals
           WHERE id = $1`, [mealId]);
    const meal = preCheck.rows[0];

    if (!meal) throw new NotFoundError(`No meal: ${mealId}`);

    const preCheck2 = await db.query(
          `SELECT username
           FROM users
           WHERE username = $1`, [username]);
    const user = preCheck2.rows[0];

    if (!user) throw new NotFoundError(`No username: ${username}`);

    await db.query(
          `DELETE FROM favorite_meals
           WHERE meal_id = $1 AND username = $2`,
        [mealId, username]);
  }

  /** Favorite a drink: update db, returns undefined.
   *
   * - username: username favoriting drink
   * - drinkId: drink id
   **/

  static async markFavDrink(username, drinkId) {
    const preCheck = await db.query(
          `SELECT id
           FROM drinks
           WHERE id = $1`, [drinkId]);
    const drink = preCheck.rows[0];

    if (!drink) throw new NotFoundError(`No drink: ${drinkId}`);

    const preCheck2 = await db.query(
          `SELECT username
           FROM users
           WHERE username = $1`, [username]);
    const user = preCheck2.rows[0];

    if (!user) throw new NotFoundError(`No username: ${username}`);

    await db.query(
          `INSERT INTO favorite_drinks (drink_id, username)
           VALUES ($1, $2)
           ON CONFLICT (drink_id, username) DO NOTHING`,
        [drinkId, username]);
  }

  /** Unfavorite a drink: update db, returns undefined.
   *
   * - username: username unfavoriting drink
   * - mealId: drink id
   **/

  static async unmarkFavDrink(username, drinkId) {
    const preCheck = await db.query(
          `SELECT id
           FROM drinks
           WHERE id = $1`, [drinkId]);
    const drink = preCheck.rows[0];

    if (!drink) throw new NotFoundError(`No drink: ${drinkId}`);

    const preCheck2 = await db.query(
          `SELECT username
           FROM users
           WHERE username = $1`, [username]);
    const user = preCheck2.rows[0];

    if (!user) throw new NotFoundError(`No username: ${username}`);

    await db.query(
          `DELETE FROM favorite_drinks
           WHERE drink_id = $1 AND username = $2`,
        [drinkId, username]);
  }
}


module.exports = User;
