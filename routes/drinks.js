"use strict";

const jsonschema = require("jsonschema");
const express = require("express");
const axios = require("axios");

const { BadRequestError, NotFoundError } = require("../expressError");
const { makeDrinkObj } = require("../helpers/helperFunctions");
const { ensureLoggedIn } = require("../middleware/auth");
const Drink = require("../models/drink");
const drinkNewSchema = require("../schemas/drinkNew.json");
const drinkUpdateSchema = require("../schemas/drinkUpdate.json");
const drinkSearchSchema = require("../schemas/drinkSearch.json");

const { DRINK_BASE_URL } = require("../config");

const router = express.Router();


router.get("/dump", async (req, res, next) => {
    try {
        const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
        let allDrinks = [];
        for (let i = 0; i < letters.length; i++) {
            let response = await axios.get(`${DRINK_BASE_URL}/search.php?f=${letters[i]}`);
            let drinks = response.data.drinks;
            if (drinks !== null) {
                for (let j = 0; j < drinks.length; j++) {
                    let drink = makeDrinkObj(drinks[j]);
                    allDrinks.push(drink);
                }
            }
        }

        Drink.dumpData(allDrinks);
        
        return res.json({ allDrinks });
    } catch (err) {
        return next(err);
    }
});

/** POST / { drink } => { drink }
 *
 * drink should be { name, category, type, glass, instructions, thumbnail, ingredients }
 *
 * Returns { id, name, category, type, glass, instructions, thumbnail, ingredients }
 *
 * Authorization required: logged in
 */

router.post("/", ensureLoggedIn, async (req, res, next) => {
    try {
        const validator = jsonschema.validate(req.body, drinkNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
    
        const drink = await Drink.create(req.body);
        return res.status(201).json({ drink });
    } catch (err) {
        return next(err);
    }
});

/** GET /  =>
 *    { drinks: [ { id, name, category, type, glass, instructions, thumbnail, ingredients }, ...] }
 * 
 * Can filter based on provided search filters:
 * - name
 * - category
 * - type
 */ 

router.get("/", async (req, res, next) => {
    const q = req.query;

    try {
        const validator = jsonschema.validate(q, drinkSearchSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const drinks = await Drink.findAll(q);
        return res.json({ drinks });
    } catch (err) {
        return next(err);
    }
});

/** GET /[drinkId] => { drink }
 *
 * Returns { id, name, category, type, glass, instructions, thumbnail, ingredients }
 *
 * Authorization required: none
 */

router.get("/:id", async (req, res, next) => {
    try {
        const drink = await Drink.get(req.params.id);
        return res.json({ drink });
    } catch (err) {
        return next(err);
    }
});

/** PATCH /[drinkId]  { fld1, fld2, ... } => { drink }
 *
 * Data can include: { name, category, type, glass, instructions, thumbnail, ingredients }
 *
 * Returns { id, name, category, type, glass, instructions, thumbnail, ingredients }
 *
 * Authorization required: logged in
 */

router.patch("/:id", ensureLoggedIn, async (req, res, next) => {
    try {
        const validator = jsonschema.validate(req.body, drinkUpdateSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
    
        const drink = await Drink.update(req.params.id, req.body);
        return res.json({ drink });
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
        await Drink.remove(req.params.id);
        return res.json({ deleted: +req.params.id });
    } catch (err) {
        return next(err);
    }
});


module.exports = router;