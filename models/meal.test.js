"use strict";

const { NotFoundError, BadRequestError } = require("../expressError");
const db = require("../db.js");
const Meal = require("./meal.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testMealIds,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  let newMeal = {
    name: "New Meal",
    category: "New Cat",
    area: "New Area",
    instructions: "New Inst",
    thumbnail: "http://NewMeal.img",
    ingredients: ["New Ing 1", "New Ing 2", "New Ing 3"],
  };

  test("works", async function () {
    let meal = await Meal.create(newMeal);
    expect(meal).toEqual({
      ...newMeal,
      id: expect.any(Number),
    });
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let meals = await Meal.findAll();
    expect(meals).toEqual([
      {
        id: testMealIds[0],
        name: "M1",
        category: "Cat1",
        area: "A1",
        instructions: "Inst1",
        thumbnail: "http://M1.img",
        ingredients: ["Ing1a", "Ing1b", "Ing1c"]
      },
      {
        id: testMealIds[1],
        name: "M2",
        category: "Cat2",
        area: "A2",
        instructions: "Inst2",
        thumbnail: "http://M2.img",
        ingredients: ["Ing2a", "Ing2b", "Ing2c"]
      },
      {
        id: testMealIds[2],
        name: "M3",
        category: "Cat3",
        area: "A3",
        instructions: "Inst3",
        thumbnail: "http://M3.img",
        ingredients: ["Ing3a", "Ing3b", "Ing3c"]
      },
    ]);
  });

  test("works: by category", async function () {
    let meals = await Meal.findAll({ category: "Cat2" });
    expect(meals).toEqual([
      {
        id: testMealIds[1],
        name: "M2",
        category: "Cat2",
        area: "A2",
        instructions: "Inst2",
        thumbnail: "http://M2.img",
        ingredients: ["Ing2a", "Ing2b", "Ing2c"]
      },
    ]);
  });

  test("works: by area", async function () {
    let meals = await Meal.findAll({ area: "A3" });
    expect(meals).toEqual([
      {
        id: testMealIds[2],
        name: "M3",
        category: "Cat3",
        area: "A3",
        instructions: "Inst3",
        thumbnail: "http://M3.img",
        ingredients: ["Ing3a", "Ing3b", "Ing3c"]
      },
    ]);
  });

  test("works: by name", async function () {
    let meals = await Meal.findAll({ name: "M1" });
    expect(meals).toEqual([
      {
        id: testMealIds[0],
        name: "M1",
        category: "Cat1",
        area: "A1",
        instructions: "Inst1",
        thumbnail: "http://M1.img",
        ingredients: ["Ing1a", "Ing1b", "Ing1c"]
      },
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let meal = await Meal.get(testMealIds[0]);
    expect(meal).toEqual({
      id: testMealIds[0],
      name: "M1",
      category: "Cat1",
      area: "A1",
      instructions: "Inst1",
      thumbnail: "http://M1.img",
      ingredients: ["Ing1a", "Ing1b", "Ing1c"]
    });
  });

  test("not found if no such meal", async function () {
    try {
      await Meal.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  let updateData = {
    name: "New Meal",
    category: "New Cat",
    area: "New Area",
    instructions: "New Inst",
    thumbnail: "http://NewMeal.img",
    ingredients: ["New Ing 1", "New Ing 2", "New Ing 3"],
  };
  test("works", async function () {
    let meal = await Meal.update(testMealIds[0], updateData);
    expect(meal).toEqual({
      id: testMealIds[0],
      ...updateData,
    });
  });

  test("not found if no such meal", async function () {
    try {
      await Meal.update(0, {
        name: "test",
      });
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Meal.update(testMealIds[0], {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Meal.remove(testMealIds[0]);
    const res = await db.query(
        "SELECT id FROM meals WHERE id=$1", [testMealIds[0]]);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such meal", async function () {
    try {
      await Meal.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
