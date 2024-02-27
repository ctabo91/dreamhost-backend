"use strict";


const jsonschema = require("jsonschema");

const express = require("express");
const { ensureCorrectUser, ensureLoggedIn } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const User = require("../models/user");
const userUpdateSchema = require("../schemas/userUpdate.json");
const mealNewSchema = require("../schemas/mealNew.json");
const mealUpdateSchema = require("../schemas/mealUpdate.json");
const drinkNewSchema = require("../schemas/drinkNew.json");
const drinkUpdateSchema = require("../schemas/drinkUpdate.json");

const router = express.Router();


/** GET / => { users: [ {username, firstName, lastName, email }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: logged in
 **/

router.get("/", ensureLoggedIn, async function (req, res, next) {
    try {
        const users = await User.findAll();
        return res.json({ users });
    } catch (err) {
        return next(err);
    }
});
  
  
/** GET /[username] => { user }
 *
 * Returns { username, firstName, lastName, favMeals, favDrinks }
 *   where favMeals is { id, name, category, area, instructions, thumbnail, ingredients }
 *   and favDrinks is { id, name, category, type, glass, instructions, thumbnail, ingredients }
 *
 * Authorization required: same user-as-:username
 **/
  
router.get("/:username", ensureCorrectUser, async function (req, res, next) {
    try {
        const user = await User.get(req.params.username);
        return res.json({ user });
    } catch (err) {
        return next(err);
    }
});
  
  
/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email }
 *
 * Authorization required: same-user-as-:username
 **/
  
router.patch("/:username", ensureCorrectUser, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, userUpdateSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
    
        const user = await User.update(req.params.username, req.body);
        return res.json({ user });
    } catch (err) {
        return next(err);
    }
});
  
  
/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: same-user-as-:username
 **/
  
router.delete("/:username", ensureCorrectUser, async function (req, res, next) {
    try {
        await User.remove(req.params.username);
        return res.json({ deleted: req.params.username });
    } catch (err) {
        return next(err);
    }
});


/** GET /[username]/[type]/personal =>
 *   if (type === "meals")
 *    Return { personalRecipes: [ { id, name, category, area, instructions, thumbnail, ingredients }, ...] }
 *   if (type === "drinks")
 *    Return { personalDrinks: [ { id, name, category, type, glass, instructions, thumbnail, ingredients }, ...] }
 * 
 * Authorization required: same-user-as-:username
 **/ 

router.get("/:username/:type/personal", ensureCorrectUser, async function(req, res, next) {
    try {
        const { username, type } = req.params;
        const personalRecipes = await User.getPersonalRecipes(username, type);
        return res.json({ personalRecipes });
    } catch (err) {
        return next(err);
    }
});


/** POST /[username]/[type]/personal  {personalRecipe} => {personalRecipe}
 * 
 * personalRecipe should be:
 * 
 * -if type = meal { name, category, area, instructions, thumbnail, ingredients }
 *
 * Returns { id, name, category, area, instructions, thumbnail, ingredients }
 * 
 * -if type = drink { name, category, type, glass, instructions, thumbnail, ingredients }
 * 
 * Returns { id, name, category, type, glass, instructions, thumbnail, ingredients } 
 * 
 * Authorization required: same-user-as-:username
 **/ 

router.post("/:username/:type/personal", ensureCorrectUser, async function(req, res, next) {
    try {
        const { username, type } = req.params;

        const validator = type === "meals"
                    ? jsonschema.validate(req.body, mealNewSchema)
                    : jsonschema.validate(req.body, drinkNewSchema);

        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const personalRecipe = await User.createPersonalRecipe(username, type, req.body);
        return res.status(201).json({ personalRecipe });
    } catch (err) {
        return next(err);
    }
});


/** GET /[username]/[type]/personal/[id] => { personalRecipe } 
 * 
 * if type = meals:
 * 
 * Returns { id, name, category, area, instructions, thumbnail, ingredients }
 * 
 * if type = drinks:
 * 
 * Returns { id, name, category, type, glass, instructions, thumbnail, ingredients }
 * 
 * Authorization required: same-user-as-:username
 **/ 

router.get("/:username/:type/personal/:id", ensureCorrectUser, async function(req, res, next) {
    try {
        const { username, type, id } = req.params;
        const personalRecipe = await User.getPersonalRecipe(id, username, type);
        return res.json({ personalRecipe });
    } catch (err) {
        return next(err);
    }
});


/** PATCH /[username]/[type]/personal/[id]  { fld1, fld2, ... } => {personalRecipe}
 * 
 * data can include:
 * 
 * -if type = meal { name, category, area, instructions, thumbnail, ingredients }
 *
 * Returns { id, name, category, area, instructions, thumbnail, ingredients }
 * 
 * -if type = drink { name, category, type, glass, instructions, thumbnail, ingredients }
 * 
 * Returns { id, name, category, type, glass, instructions, thumbnail, ingredients } 
 * 
 * Authorization required: same-user-as-:username
 **/ 

router.patch("/:username/:type/personal/:id", ensureCorrectUser, async function(req, res, next) {
    try {
        const { type, id } = req.params;

        const validator = type === "meals"
                    ? jsonschema.validate(req.body, mealUpdateSchema)
                    : jsonschema.validate(req.body, drinkUpdateSchema);

        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const personalRecipe = await User.updatePersonalRecipe(id, type, req.body);
        return res.json({ personalRecipe });
    } catch (err) {
        return next(err);
    }
});
  
  
/** POST /[username]/meals/[id]  { state } => { favorite }
 *
 * Returns {"favorited": mealId}
 *
 * Authorization required: same-user-as-:username
 **/
  
router.post("/:username/meals/:id/:action", ensureCorrectUser, async function (req, res, next) {
    try {
        const mealId = +req.params.id;
        const action = req.params.action;

        if (action !== "add" && action !== "remove") {
            throw new BadRequestError();
        }

        if (action === "add") {
            await User.markFavMeal(req.params.username, mealId);
        } else {
            await User.unmarkFavMeal(req.params.username, mealId);
        }
        
        return res.json({ favorited: action === "add", mealId });
    } catch (err) {
        return next(err);
    }
});


/** POST /[username]/drinks/[id]  { state } => { favorite }
 *
 * Returns {"favorited": drinkId}
 *
 * Authorization required: same-user-as-:username
 **/
  
router.post("/:username/drinks/:id/:action", ensureCorrectUser, async function (req, res, next) {
    try {
        const drinkId = +req.params.id;
        const action = req.params.action;

        if (action !== "add" && action !== "remove") {
            throw new BadRequestError();
        }

        if (action === "add") {
            await User.markFavDrink(req.params.username, drinkId);
        } else {
            await User.unmarkFavDrink(req.params.username, drinkId);
        }

        return res.json({ favorited: action === "add", drinkId });
    } catch (err) {
        return next(err);
    }
});


module.exports = router;