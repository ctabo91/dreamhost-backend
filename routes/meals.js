"use strict";

const jsonschema = require("jsonschema");
const express = require("express");
const axios = require("axios");

const { BadRequestError, NotFoundError } = require("../expressError");
const { makeMealObj } = require("../helpers/helperFunctions");
const { ensureLoggedIn } = require("../middleware/auth");
const Meal = require("../models/meal");
const mealNewSchema = require("../schemas/mealNew.json");
const mealUpdateSchema = require("../schemas/mealUpdate.json");
const mealSearchSchema = require("../schemas/mealSearch.json");

const { MEAL_BASE_URL } = require("../config");

const router = express.Router();


router.get("/dump", async (req, res, next) => {
    try {
        const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
        
        const requests = letters.map(async letter => {
            const response = await axios.get(`${MEAL_BASE_URL}/search.php?f=${letter}`);
            const meals = response.data.meals;
            if (meals !== null) {
                return meals.map(meal => makeMealObj(meal));
            }
            return [];
        });

        const mealsArrays = await Promise.all(requests);
        const allMeals = [].concat(...mealsArrays);

        Meal.dumpData(allMeals);

        return res.json({ allMeals });
    } catch (err) {
        return next(err);
    }
});


/** POST / { meal } => { meal }
 *
 * meal should be { name, category, area, instructions, thumbnail, ingredients }
 *
 * Returns { id, name, category, area, instructions, thumbnail, ingredients }
 *
 * Authorization required: logged in
 */

router.post("/", ensureLoggedIn, async (req, res, next) => {
    try {
        const validator = jsonschema.validate(req.body, mealNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
    
        const meal = await Meal.create(req.body);
        return res.status(201).json({ meal });
    } catch (err) {
        return next(err);
    }
});

/** GET /  =>
 *    { meals: [ { id, name, category, area, instructions, thumbnail, ingredients }, ...] }
 * 
 * Can filter based on provided search filters:
 * - name
 * - category
 * - area
 */ 

router.get("/", async (req, res, next) => {
    const q = req.query;

    try {
        const validator = jsonschema.validate(q, mealSearchSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const meals = await Meal.findAll(q);
        return res.json({ meals });
    } catch (err) {
        return next(err);
    }
});


/** GET /categories => 
 *    { categories: [ { category, count }, ...] }
 * 
 * Authorization required: none
 */ 

router.get("/categories", async (req, res, next) => {
    try {
        const categories = await Meal.getCategories();
        return res.json({ categories });
    } catch (err) {
        return next(err);
    }
});

/** GET /[mealId] => { meal }
 *
 * Returns { id, name, category, area, instructions, thumbnail, ingredients }
 *
 * Authorization required: none
 */

router.get("/:id", async (req, res, next) => {
    try {
        const meal = await Meal.get(req.params.id);
        return res.json({ meal });
    } catch (err) {
        return next(err);
    }
});

/** PATCH /[mealId]  { fld1, fld2, ... } => { meal }
 *
 * Data can include: { name, category, area, instructions, thumbnail, ingredients }
 *
 * Returns { id, name, category, area, instructions, thumbnail, ingredients }
 *
 * Authorization required: logged in
 */

router.patch("/:id", ensureLoggedIn, async (req, res, next) => {
    try {
        const validator = jsonschema.validate(req.body, mealUpdateSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
    
        const meal = await Meal.update(req.params.id, req.body);
        return res.json({ meal });
    } catch (err) {
        return next(err);
    }
});
  
/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization required: logged in
 */
  
router.delete("/:id", ensureLoggedIn, async (req, res, next) => {
    try {
        await Meal.remove(req.params.id);
        return res.json({ deleted: +req.params.id });
    } catch (err) {
        return next(err);
    }
});


module.exports = router;