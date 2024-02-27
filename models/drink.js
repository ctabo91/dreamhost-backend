"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");


class Drink {
    static async dumpData(dataArr) {
        dataArr.forEach(async drink => {
            await db.query(
                `INSERT INTO drinks
                 (name, category, type, glass, instructions, thumbnail, ingredients)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    drink.name,
                    drink.category,
                    drink.type,
                    drink.glass,
                    drink.instructions,
                    drink.thumbnail,
                    drink.ingredients,
                ],
            );
        });
    }

    /** Create a drink (from data), update the db, and return the new drink data.
     * 
     * data should be { name, category, type, glass, instructions, thumbnail, ingredients }
     * 
     * returns { id, name, category, type, glass, instructions, thumbnail, ingredients }
     * 
     * Throws a BadRequestError if drink is already in the database.
     * */ 

    static async create({ name, category, type, glass, instructions, thumbnail, ingredients }) {
        const duplicateCheck = await db.query(
            `SELECT name
             FROM drinks
             WHERE name = $1`,
            [name]);

        if (duplicateCheck.rows[0])
            throw new BadRequestError(`Duplicate drink: ${name}`);

        const result = await db.query(
                `INSERT INTO drinks
                (name, category, type, glass, instructions, thumbnail, ingredients)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id, name, category, type, glass, instructions, thumbnail, ingredients`,
            [
                name,
                category,
                type,
                glass,
                instructions,
                thumbnail,
                ingredients,
            ],
        );

        const drink = result.rows[0];

        return drink;
    }


    /** Find all drinks (optional filter on searchFilters).
     *
     * searchFilters (all optional):
     * - name
     * - category
     * - type
     * (will find case-insensitive, partial matches)
     *
     * Returns [{ id, name, category, type, glass, instructions, thumbnail, ingredients }, ...]
     * */

    static async findAll(searchFilters = {}) {
        let query = `SELECT id,
                            name,
                            category,
                            type,
                            glass,
                            instructions,
                            thumbnail,
                            ingredients
                     FROM drinks`;
        let whereExpressions = [];
        let queryValues = [];

        const { name, category, type } = searchFilters;

        if (name) {
            queryValues.push(`%${name}%`);
            whereExpressions.push(`name ILIKE $${queryValues.length}`);
        }

        if (category) {
            queryValues.push(`%${category}%`);
            whereExpressions.push(`category ILIKE $${queryValues.length}`);
        }

        if (type) {
            queryValues.push(`%${type}%`);
            whereExpressions.push(`type ILIKE $${queryValues.length}`);
        }

        if (whereExpressions.length > 0) {
            query += " WHERE " + whereExpressions.join(" AND ");
        }

        query += " ORDER BY name";
        const drinksRes = await db.query(query, queryValues);
        return drinksRes.rows;
    }


    /** Get all category names, with a count of how many items have that particular category 
     * 
     * Returns [ { category, count }, ...] 
     */ 

    static async getCategories() {
        const categoriesRes = await db.query(
                `SELECT category, COUNT(*)
                 FROM drinks
                 GROUP BY category
                 ORDER BY category`);
        return categoriesRes.rows;
    }


    /** Given a drink id, return data about drink.
     *
     * Returns { id, name, category, type, glass, instructions, thumbnail, ingredients }
     *
     * Throws NotFoundError if not found.
     **/

    static async get(id) {
        const drinkRes = await db.query(
                `SELECT id,
                        name,
                        category,
                        type,
                        glass,
                        instructions,
                        thumbnail,
                        ingredients
                 FROM drinks
                 WHERE id = $1`,
                [id]);

        const drink = drinkRes.rows[0];

        if (!drink) throw new NotFoundError(`No drink: ${id}`);

        return drink;
    }


    /** Update drink data with `data`.
     *
     * This is a "partial update" --- it's fine if data doesn't contain all the
     * fields; this only changes provided ones.
     *
     * Data can include: {name, category, type, glass, instructions, thumbnail, ingredients}
     *
     * Returns {id, name, category, type, glass, instructions, thumbnail, ingredients}
     *
     * Throws NotFoundError if not found.
     */

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(data);
        const idVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE drinks 
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
        const drink = result.rows[0];

        if (!drink) throw new NotFoundError(`No drink: ${id}`);

        return drink;
    }


    /** Delete given drink from database; returns undefined.
     *
     * Throws NotFoundError if drink not found.
     **/

    static async remove(id) {
        const result = await db.query(
            `DELETE
             FROM drinks
             WHERE id = $1
             RETURNING id`,
            [id]);
        const drink = result.rows[0];

        if (!drink) throw new NotFoundError(`No drink: ${id}`);
    }
}


module.exports = Drink;