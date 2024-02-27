"use strict";

const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");
const db = require("../db.js");
const User = require("./user.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testMealIds,
  testDrinkIds,
  testPersonalMealIds,
  testPersonalDrinkIds,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** authenticate */

describe("authenticate", function () {
  test("works", async function () {
    const user = await User.authenticate("u1", "password1");
    expect(user).toEqual({
      username: "u1",
      firstName: "U1F",
      lastName: "U1L",
      email: "u1@email.com",
    });
  });

  test("unauth if no such user", async function () {
    try {
      await User.authenticate("nope", "password");
      fail();
    } catch (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    }
  });

  test("unauth if wrong password", async function () {
    try {
      await User.authenticate("u1", "wrong");
      fail();
    } catch (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    }
  });
});

/************************************** register */

describe("register", function () {
  const newUser = {
    username: "new",
    firstName: "Test",
    lastName: "Tester",
    email: "test@test.com",
  };

  test("works", async function () {
    let user = await User.register({
      ...newUser,
      password: "password",
    });
    expect(user).toEqual(newUser);
    const found = await db.query("SELECT * FROM users WHERE username = 'new'");
    expect(found.rows.length).toEqual(1);
    expect(found.rows[0].password.startsWith("$2b$")).toEqual(true);
  });

  test("bad request with dup data", async function () {
    try {
      await User.register({
        ...newUser,
        password: "password",
      });
      await User.register({
        ...newUser,
        password: "password",
      });
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works", async function () {
    const users = await User.findAll();
    expect(users).toEqual([
      {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "u1@email.com",
      },
      {
        username: "u2",
        firstName: "U2F",
        lastName: "U2L",
        email: "u2@email.com",
      },
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let user = await User.get("u1");
    expect(user).toEqual({
      username: "u1",
      firstName: "U1F",
      lastName: "U1L",
      email: "u1@email.com",
      favMeals: [testMealIds[0]],
      favDrinks: [testDrinkIds[0]],
    });
  });

  test("not found if no such user", async function () {
    try {
      await User.get("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    firstName: "NewF",
    lastName: "NewF",
    email: "new@email.com",
  };

  test("works", async function () {
    let user = await User.update("u1", updateData);
    expect(user).toEqual({
      username: "u1",
      ...updateData,
    });
  });

  test("works: set password", async function () {
    let user = await User.update("u1", {
      password: "new",
    });
    expect(user).toEqual({
      username: "u1",
      firstName: "U1F",
      lastName: "U1L",
      email: "u1@email.com",
    });
    const found = await db.query("SELECT * FROM users WHERE username = 'u1'");
    expect(found.rows.length).toEqual(1);
    expect(found.rows[0].password.startsWith("$2b$")).toEqual(true);
  });

  test("not found if no such user", async function () {
    try {
      await User.update("nope", {
        firstName: "test",
      });
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request if no data", async function () {
    expect.assertions(1);
    try {
      await User.update("c1", {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await User.remove("u1");
    const res = await db.query(
        "SELECT * FROM users WHERE username='u1'");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such user", async function () {
    try {
      await User.remove("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** getPersonalRecipes */

describe("getPersonalRecipes", function () {
  test("works", async function () {
    let personalMeals = await User.getPersonalRecipes("u1", "meals");
    let personalDrinks = await User.getPersonalRecipes("u1", "drinks");

    expect(personalMeals).toEqual([
      {
        id: testPersonalMealIds[0],
        name: "P-M1",
        category: "P-Cat1",
        area: "P-A1",
        instructions: "P-Inst1",
        thumbnail: "http://P-M1.img",
        ingredients: ["P-Ing1a", "P-Ing1b", "P-Ing1c"]
      },
      {
        id: testPersonalMealIds[1],
        name: "P-M2",
        category: "P-Cat2",
        area: "P-A2",
        instructions: "P-Inst2",
        thumbnail: "http://P-M2.img",
        ingredients: ["P-Ing2a", "P-Ing2b", "P-Ing2c"]
      },
      {
        id: testPersonalMealIds[2],
        name: "P-M3",
        category: "P-Cat3",
        area: "P-A3",
        instructions: "P-Inst3",
        thumbnail: "http://P-M3.img",
        ingredients: ["P-Ing3a", "P-Ing3b", "P-Ing3c"]
      },
    ]);

    expect(personalDrinks).toEqual([
      {
        id: testPersonalDrinkIds[0],
        name: "P-D1",
        category: "P-Cat1",
        type: "P-T1",
        glass: "P-G1",
        instructions: "P-Inst1",
        thumbnail: "http://P-D1.img",
        ingredients: ["P-Ing1a", "P-Ing1b", "P-Ing1c"]
      },
      {
        id: testPersonalDrinkIds[1],
        name: "P-D2",
        category: "P-Cat2",
        type: "P-T2",
        glass: "P-G2",
        instructions: "P-Inst2",
        thumbnail: "http://P-D2.img",
        ingredients: ["P-Ing2a", "P-Ing2b", "P-Ing2c"]
      },
      {
        id: testPersonalDrinkIds[2],
        name: "P-D3",
        category: "P-Cat3",
        type: "P-T3",
        glass: "P-G3",
        instructions: "P-Inst3",
        thumbnail: "http://P-D3.img",
        ingredients: ["P-Ing3a", "P-Ing3b", "P-Ing3c"]
      },
    ]);
  });
});

/************************************** createPersonalRecipe */

describe("createPersonalRecipe", function () {
  let newPersonalMeal = {
    name: "New P-M",
    category: "New P-Cat",
    area: "New P-A",
    instructions: "New P-Inst",
    thumbnail: "http://New P-M.img",
    ingredients: ["New P-Ing1", "New P-Ing1", "New P-Ing1"]
  };
  let newPersonalDrink = {
    name: "New P-D",
    category: "New P-Cat",
    type: "New P-T",
    glass: "New P-G",
    instructions: "New P-Inst",
    thumbnail: "http://New P-D.img",
    ingredients: ["New P-Ing1", "New P-Ing1", "New P-Ing1"]
  };

  test("works", async function () {
    let personalMeal = await User.createPersonalRecipe("u1", "meals", newPersonalMeal);
    let personalDrink = await User.createPersonalRecipe("u1", "drinks", newPersonalDrink);

    expect(personalMeal).toEqual({
      ...newPersonalMeal,
      id: expect.any(Number),
    });
    expect(personalDrink).toEqual({
      ...newPersonalDrink,
      id: expect.any(Number),
    });
  });
});

/************************************** getPersonalRecipe */

describe("getPersonalRecipe", function () {
  test("works", async function () {
    let personalMeal = await User.getPersonalRecipe(testPersonalMealIds[0], "u1", "meals");
    let personalDrink = await User.getPersonalRecipe(testPersonalDrinkIds[0], "u1", "drinks");

    expect(personalMeal).toEqual({
      id: testPersonalMealIds[0],
      name: "P-M1",
      category: "P-Cat1",
      area: "P-A1",
      instructions: "P-Inst1",
      thumbnail: "http://P-M1.img",
      ingredients: ["P-Ing1a", "P-Ing1b", "P-Ing1c"]
    });

    expect(personalDrink).toEqual({
      id: testPersonalDrinkIds[0],
      name: "P-D1",
      category: "P-Cat1",
      type: "P-T1",
      glass: "P-G1",
      instructions: "P-Inst1",
      thumbnail: "http://P-D1.img",
      ingredients: ["P-Ing1a", "P-Ing1b", "P-Ing1c"]
    });
  });

  test("not found if no such personal meal", async function () {
    try {
      await User.getPersonalRecipe(0, "u1", "meals");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("not found if no such personal drink", async function () {
    try {
      await User.getPersonalRecipe(0, "u1", "drinks");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** updatePersonalRecipe */

describe("updatePersonalRecipe", function () {
  let personalMealUpdate = {
    name: "New P-M",
    category: "New P-Cat",
    area: "New P-A",
    instructions: "New P-Inst",
    thumbnail: "http://New P-M.img",
    ingredients: ["New P-Ing1", "New P-Ing1", "New P-Ing1"]
  };
  let personalDrinkUpdate = {
    name: "New P-D",
    category: "New P-Cat",
    type: "New P-T",
    glass: "New P-G",
    instructions: "New P-Inst",
    thumbnail: "http://New P-D.img",
    ingredients: ["New P-Ing1", "New P-Ing1", "New P-Ing1"]
  };

  test("works", async function () {
    let personalMeal = await User.updatePersonalRecipe(testPersonalMealIds[0], "meals", personalMealUpdate);
    let personalDrink = await User.updatePersonalRecipe(testPersonalDrinkIds[0], "drinks", personalDrinkUpdate);

    expect(personalMeal).toEqual({
      id: testPersonalMealIds[0],
      ...personalMealUpdate,
    });
    expect(personalDrink).toEqual({
      id: testPersonalDrinkIds[0],
      ...personalDrinkUpdate,
    });
  });

  test("not found if no such personal meal", async function () {
    try {
      await User.updatePersonalRecipe(0, "meals", {
        name: "test",
      });
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("not found if no such personal drink", async function () {
    try {
      await User.updatePersonalRecipe(0, "drinks", {
        name: "test",
      });
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no meal update data", async function () {
    try {
      await User.updatePersonalRecipe(testPersonalMealIds[0], "meals", {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  test("bad request with no drink update data", async function () {
    try {
      await User.updatePersonalRecipe(testPersonalDrinkIds[0], "drinks", {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** markFavMeal */

describe("markFavMeal", function () {
  test("works", async function () {
    await User.markFavMeal("u1", testMealIds[1]);

    const res = await db.query(
        "SELECT * FROM favorite_meals WHERE meal_id=$1 AND username=$2", [testMealIds[1], "u1"]);
    expect(res.rows).toEqual([{
      meal_id: testMealIds[1],
      username: "u1",
    }]);
  });

  test("not found if no such meal", async function () {
    try {
      await User.markFavMeal("u1", 0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("not found if no such user", async function () {
    try {
      await User.markFavMeal("nope", testMealIds[0]);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** unmarkFavMeal */

describe("unmarkFavMeal", function () {
  test("works", async function () {
    await User.unmarkFavMeal("u1", testMealIds[0]);

    const res = await db.query(
        "SELECT * FROM favorite_meals WHERE meal_id=$1 AND username=$2", [testMealIds[0], "u1"]);
    expect(res.rows).toEqual([]);
  });

  test("not found if no such meal", async function () {
    try {
      await User.unmarkFavMeal("u1", 0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("not found if no such user", async function () {
    try {
      await User.unmarkFavMeal("nope", testMealIds[0]);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** markFavDrink */

describe("markFavDrink", function () {
  test("works", async function () {
    await User.markFavDrink("u1", testDrinkIds[1]);

    const res = await db.query(
        "SELECT * FROM favorite_drinks WHERE drink_id=$1 AND username=$2", [testDrinkIds[1], "u1"]);
    expect(res.rows).toEqual([{
      drink_id: testDrinkIds[1],
      username: "u1",
    }]);
  });

  test("not found if no such drink", async function () {
    try {
      await User.markFavDrink("u1", 0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("not found if no such user", async function () {
    try {
      await User.markFavDrink("nope", testDrinkIds[0]);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** unmarkFavDrink */

describe("unmarkFavDrink", function () {
  test("works", async function () {
    await User.unmarkFavDrink("u1", testDrinkIds[0]);

    const res = await db.query(
        "SELECT * FROM favorite_drinks WHERE drink_id=$1 AND username=$2", [testDrinkIds[0], "u1"]);
    expect(res.rows).toEqual([]);
  });

  test("not found if no such drink", async function () {
    try {
      await User.unmarkFavDrink("u1", 0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("not found if no such user", async function () {
    try {
      await User.unmarkFavDrink("nope", testDrinkIds[0]);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
