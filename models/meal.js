"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");


class Meal {
    static async dumpData(dataArr) {
        dataArr.forEach(async meal => {
            await db.query(
                `INSERT INTO meals
                (name, category, area, instructions, thumbnail, ingredients)
                VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    meal.name,
                    meal.category,
                    meal.area,
                    meal.instructions,
                    meal.thumbnail,
                    meal.ingredients,
                ],
            );
        });
    }


    /** Create a meal (from data), update the db, and return the new meal data.
     * 
     * data should be { name, category, area, instructions, thumbnail, ingredients }
     * 
     * returns { id, name, category, area, instructions, thumbnail, ingredients }
     * 
     * Throws a BadRequestError if meal is already in the database.
     * */ 
    
    static async create({ name, category, area, instructions, thumbnail, ingredients }) {
        const duplicateCheck = await db.query(
            `SELECT name
             FROM meals
             WHERE name = $1`,
            [name]);

        if (duplicateCheck.rows[0])
            throw new BadRequestError(`Duplicate meal: ${name}`);

        const result = await db.query(
                `INSERT INTO meals
                (name, category, area, instructions, thumbnail, ingredients)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id, name, category, area, instructions, thumbnail, ingredients`,
            [
                name,
                category,
                area,
                instructions,
                thumbnail,
                ingredients,
            ],
        );

        const meal = result.rows[0];

        return meal;
    }


    /** Find all meals (optional filter on searchFilters).
     *
     * searchFilters (all optional):
     * - name
     * - category
     * - area
     * (will find case-insensitive, partial matches)
     *
     * Returns [{ id, name, category, area, instructions, thumbnail, ingredients }, ...]
     * */

    static async findAll(searchFilters = {}) {
        let query = `SELECT id,
                            name,
                            category,
                            area,
                            instructions,
                            thumbnail,
                            ingredients
                     FROM meals`;
        let whereExpressions = [];
        let queryValues = [];

        const { name, category, area } = searchFilters;

        if (name) {
            queryValues.push(`%${name}%`);
            whereExpressions.push(`name ILIKE $${queryValues.length}`);
        }

        if (category) {
            queryValues.push(`%${category}%`);
            whereExpressions.push(`category ILIKE $${queryValues.length}`);
        }

        if (area) {
            queryValues.push(`%${area}%`);
            whereExpressions.push(`area ILIKE $${queryValues.length}`);
        }

        if (whereExpressions.length > 0) {
            query += " WHERE " + whereExpressions.join(" AND ");
        }

        query += " ORDER BY name";
        const mealsRes = await db.query(query, queryValues);
        return mealsRes.rows;
    }

    /** Get all category names, with a count of how many items have that particular category 
     * 
     * Returns [ { category, count }, ...] 
     */ 

    static async getCategories() {
        const categoriesRes = await db.query(
                `SELECT category, COUNT(*)
                 FROM meals
                 GROUP BY category
                 ORDER BY category`);
        return categoriesRes.rows;
    }


    /** Given a meal id, return data about meal.
     *
     * Returns { id, name, category, area, instructions, thumbnail, ingredients }
     *
     * Throws NotFoundError if not found.
     **/

    static async get(id) {
        const mealRes = await db.query(
                `SELECT id,
                        name,
                        category,
                        area,
                        instructions,
                        thumbnail,
                        ingredients
                 FROM meals
                 WHERE id = $1`,
                [id]);

        const meal = mealRes.rows[0];

        if (!meal) throw new NotFoundError(`No meal: ${id}`);

        return meal;
    }


    /** Update meal data with `data`.
     *
     * This is a "partial update" --- it's fine if data doesn't contain all the
     * fields; this only changes provided ones.
     *
     * Data can include: {name, category, area, instructions, thumbnail, ingredients}
     *
     * Returns {id, name, category, area, instructions, thumbnail, ingredients}
     *
     * Throws NotFoundError if not found.
     */

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(data);
        const idVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE meals 
                          SET ${setCols} 
                          WHERE id = ${idVarIdx} 
                          RETURNING id, 
                                    name, 
                                    category, 
                                    area, 
                                    instructions,
                                    thumbnail,
                                    ingredients`;
        const result = await db.query(querySql, [...values, id]);
        const meal = result.rows[0];

        if (!meal) throw new NotFoundError(`No meal: ${id}`);

        return meal;
    }


    /** Delete given meal from database; returns undefined.
     *
     * Throws NotFoundError if meal not found.
     **/

    static async remove(id) {
        const result = await db.query(
            `DELETE
             FROM meals
             WHERE id = $1
             RETURNING id`,
            [id]);
        const meal = result.rows[0];

        if (!meal) throw new NotFoundError(`No meal: ${id}`);
    }
}


module.exports = Meal;