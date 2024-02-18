"use strict";


const jsonschema = require("jsonschema");

const express = require("express");
const { ensureCorrectUser, ensureLoggedIn } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const User = require("../models/user");
const userUpdateSchema = require("../schemas/userUpdate.json");

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
  
  
/** POST /[username]/meals/[id]  { state } => { favorite }
 *
 * Returns {"favorited": mealId}
 *
 * Authorization required: same-user-as-:username
 * */
  
router.post("/:username/meals/:id", ensureCorrectUser, async function (req, res, next) {
    try {
        const mealId = +req.params.id;
        await User.markFavMeal(req.params.username, mealId);
        return res.json({ favorited: mealId });
    } catch (err) {
        return next(err);
    }
});


/** POST /[username]/drinks/[id]  { state } => { favorite }
 *
 * Returns {"favorited": drinkId}
 *
 * Authorization required: same-user-as-:username
 * */
  
router.post("/:username/drinks/:id", ensureCorrectUser, async function (req, res, next) {
    try {
        const drinkId = +req.params.id;
        await User.markFavDrink(req.params.username, drinkId);
        return res.json({ favorited: drinkId });
    } catch (err) {
        return next(err);
    }
});


module.exports = router;