"use strict";

const { NotFoundError, BadRequestError } = require("../expressError");
const db = require("../db.js");
const Drink = require("./drink.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testDrinkIds,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  let newDrink = {
    name: "New Drink",
    category: "New Cat",
    type: "New Type",
    glass: "New Glass",
    instructions: "New Inst",
    thumbnail: "http://NewDrink.img",
    ingredients: ["New Ing 1", "New Ing 2", "New Ing 3"],
  };

  test("works", async function () {
    let drink = await Drink.create(newDrink);
    expect(drink).toEqual({
      ...newDrink,
      id: expect.any(Number),
    });
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let drinks = await Drink.findAll();
    expect(drinks).toEqual([
      {
        id: testDrinkIds[0],
        name: "D1",
        category: "Cat1",
        type: "T1",
        glass: "G1",
        instructions: "Inst1",
        thumbnail: "http://D1.img",
        ingredients: ["Ing1a", "Ing1b", "Ing1c"]
      },
      {
        id: testDrinkIds[1],
        name: "D2",
        category: "Cat2",
        type: "T2",
        glass: "G2",
        instructions: "Inst2",
        thumbnail: "http://D2.img",
        ingredients: ["Ing2a", "Ing2b", "Ing2c"]
      },
      {
        id: testDrinkIds[2],
        name: "D3",
        category: "Cat3",
        type: "T3",
        glass: "G3",
        instructions: "Inst3",
        thumbnail: "http://D3.img",
        ingredients: ["Ing3a", "Ing3b", "Ing3c"]
      },
    ]);
  });

  test("works: by category", async function () {
    let drinks = await Drink.findAll({ category: "Cat2" });
    expect(drinks).toEqual([
      {
        id: testDrinkIds[1],
        name: "D2",
        category: "Cat2",
        type: "T2",
        glass: "G2",
        instructions: "Inst2",
        thumbnail: "http://D2.img",
        ingredients: ["Ing2a", "Ing2b", "Ing2c"]
      },
    ]);
  });

  test("works: by type", async function () {
    let drinks = await Drink.findAll({ type: "T3" });
    expect(drinks).toEqual([
      {
        id: testDrinkIds[2],
        name: "D3",
        category: "Cat3",
        type: "T3",
        glass: "G3",
        instructions: "Inst3",
        thumbnail: "http://D3.img",
        ingredients: ["Ing3a", "Ing3b", "Ing3c"]
      },
    ]);
  });

  test("works: by name", async function () {
    let drinks = await Drink.findAll({ name: "D1" });
    expect(drinks).toEqual([
      {
        id: testDrinkIds[0],
        name: "D1",
        category: "Cat1",
        type: "T1",
        glass: "G1",
        instructions: "Inst1",
        thumbnail: "http://D1.img",
        ingredients: ["Ing1a", "Ing1b", "Ing1c"]
      },
    ]);
  });
});

/************************************** getCategories */

describe("getCategories", function () {
  test("works", async function () {
    let categories = await Drink.getCategories();
    expect(categories).toEqual([
      {
        category: "Cat1",
        count: "1",
      },
      {
        category: "Cat2",
        count: "1",
      },
      {
        category: "Cat3",
        count: "1",
      },
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let drink = await Drink.get(testDrinkIds[0]);
    expect(drink).toEqual({
      id: testDrinkIds[0],
      name: "D1",
      category: "Cat1",
      type: "T1",
      glass: "G1",
      instructions: "Inst1",
      thumbnail: "http://D1.img",
      ingredients: ["Ing1a", "Ing1b", "Ing1c"]
    });
  });

  test("not found if no such drink", async function () {
    try {
      await Drink.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  let updateData = {
    name: "New Drink",
    category: "New Cat",
    type: "New Type",
    glass: "New Glass",
    instructions: "New Inst",
    thumbnail: "http://NewDrink.img",
    ingredients: ["New Ing 1", "New Ing 2", "New Ing 3"],
  };
  test("works", async function () {
    let drink = await Drink.update(testDrinkIds[0], updateData);
    expect(drink).toEqual({
      id: testDrinkIds[0],
      ...updateData,
    });
  });

  test("not found if no such drink", async function () {
    try {
      await Drink.update(0, {
        name: "test",
      });
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Drink.update(testDrinkIds[0], {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Drink.remove(testDrinkIds[0]);
    const res = await db.query(
        "SELECT id FROM drinks WHERE id=$1", [testDrinkIds[0]]);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such drink", async function () {
    try {
      await Drink.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
