"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app");
const User = require("../models/user");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testMealIds,
  testDrinkIds,
  testPersonalMealIds,
  testPersonalDrinkIds,
  u1Token,
  u2Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** GET /users */

describe("GET /users", function () {
  test("works if logged in", async function () {
    const resp = await request(app)
        .get("/users")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      users: [
        {
          username: "u1",
          firstName: "U1F",
          lastName: "U1L",
          email: "user1@user.com",
        },
        {
          username: "u2",
          firstName: "U2F",
          lastName: "U2L",
          email: "user2@user.com",
        },
        {
          username: "u3",
          firstName: "U3F",
          lastName: "U3L",
          email: "user3@user.com",
        },
      ],
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .get("/users");
    expect(resp.statusCode).toEqual(401);
  });

  test("fails: test next() handler", async function () {
    await db.query("DROP TABLE users CASCADE");
    const resp = await request(app)
        .get("/users")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /users/:username */

describe("GET /users/:username", function () {
  test("works for same user", async function () {
    const resp = await request(app)
        .get(`/users/u1`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        favMeals: [testMealIds[0]],
        favDrinks: [testDrinkIds[0]],
      },
    });
  });

  test("unauth for other users", async function () {
    const resp = await request(app)
        .get(`/users/u1`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .get(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
  });
});

/************************************** PATCH /users/:username */

describe("PATCH /users/:username", () => {
  test("works for same user", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: "New",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "New",
        lastName: "U1L",
        email: "user1@user.com",
      },
    });
  });

  test("unauth if not same user", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: "New",
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: "New",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request if invalid data", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: 42,
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("works: can set new password", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          password: "new-password",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
      },
    });
    const isSuccessful = await User.authenticate("u1", "new-password");
    expect(isSuccessful).toBeTruthy();
  });
});

/************************************** DELETE /users/:username */

describe("DELETE /users/:username", function () {
  test("works for same user", async function () {
    const resp = await request(app)
        .delete(`/users/u1`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: "u1" });
  });

  test("unauth if not same user", async function () {
    const resp = await request(app)
        .delete(`/users/u1`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
  });
});

/************************************** GET /users/:username/:type/personal */ 

describe("GET /users/:username/:type/personal", function () {
  test("works for same user", async function () {
    const mealResp = await request(app)
        .get("/users/u1/meals/personal")
        .set("authorization", `Bearer ${u1Token}`);

    const drinkResp = await request(app)
        .get("/users/u1/drinks/personal")
        .set("authorization", `Bearer ${u1Token}`);

    expect(mealResp.body).toEqual({
          personalRecipes: [
            {
              id: expect.any(Number),
              name: "P-M1",
              category: "P-Cat1",
              area: "P-A1",
              instructions: "P-Inst1",
              thumbnail: "http://P-M1.img",
              ingredients: ["P-Ing1a", "P-Ing1b", "P-Ing1c"]
            },
            {
              id: expect.any(Number),
              name: "P-M2",
              category: "P-Cat2",
              area: "P-A2",
              instructions: "P-Inst2",
              thumbnail: "http://P-M2.img",
              ingredients: ["P-Ing2a", "P-Ing2b", "P-Ing2c"]
            },
          ],
        },
    );

    expect(drinkResp.body).toEqual({
          personalRecipes: [
            {
              id: expect.any(Number),
              name: "P-D1",
              category: "P-Cat1",
              type: "P-T1",
              glass: "P-G1",
              instructions: "P-Inst1",
              thumbnail: "http://P-D1.img",
              ingredients: ["P-Ing1a", "P-Ing1b", "P-Ing1c"]
            },
            {
              id: expect.any(Number),
              name: "P-D2",
              category: "P-Cat2",
              type: "P-T2",
              glass: "P-G2",
              instructions: "P-Inst2",
              thumbnail: "http://P-D2.img",
              ingredients: ["P-Ing2a", "P-Ing2b", "P-Ing2c"]
            },
          ],
        },
    );
  });

  test("unauth for others", async function () {
    const mealResp = await request(app)
        .get("/users/u1/meals/personal")
        .set("authorization", `Bearer ${u2Token}`);
    expect(mealResp.statusCode).toEqual(401);

    const drinkResp = await request(app)
        .get("/users/u1/meals/personal")
        .set("authorization", `Bearer ${u2Token}`);
    expect(drinkResp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const mealResp = await request(app)
        .get("/users/u1/meals/personal");
    expect(mealResp.statusCode).toEqual(401);

    const drinkResp = await request(app)
        .get("/users/u1/meals/personal");
    expect(drinkResp.statusCode).toEqual(401);
  });
});

/************************************** POST /users/:username/:type/personal */ 

describe("POST /users/:username/:type/personal", function () {
  test("works for same user", async function () {
    const mealResp = await request(app)
        .post("/users/u1/meals/personal")
        .send({
            name: "New Personal Meal",
            category: "New Personal Cat",
            area: "New Personal Area",
            instructions: "New Personal Inst",
            thumbnail: "http://NewPersonalMeal.img",
            ingredients: ["New Personal Ing 1", "New Personal Ing 2", "New Personal Ing 3"],
        })
        .set("authorization", `Bearer ${u1Token}`);

    const drinkResp = await request(app)
        .post("/users/u1/drinks/personal")
        .send({
            name: "New Personal Drink",
            category: "New Personal Cat",
            type: "New Personal Type",
            glass: "New Personal Glass",
            instructions: "New Personal Inst",
            thumbnail: "http://NewPersonalDrink.img",
            ingredients: ["New Personal Ing 1", "New Personal Ing 2", "New Personal Ing 3"],
        })
        .set("authorization", `Bearer ${u1Token}`);

    expect(mealResp.statusCode).toEqual(201);
    expect(mealResp.body).toEqual({
      personalRecipe: {
        id: expect.any(Number),
        name: "New Personal Meal",
        category: "New Personal Cat",
        area: "New Personal Area",
        instructions: "New Personal Inst",
        thumbnail: "http://NewPersonalMeal.img",
        ingredients: ["New Personal Ing 1", "New Personal Ing 2", "New Personal Ing 3"],
      },
    });

    expect(drinkResp.statusCode).toEqual(201);
    expect(drinkResp.body).toEqual({
      personalRecipe: {
        id: expect.any(Number),
        name: "New Personal Drink",
        category: "New Personal Cat",
        type: "New Personal Type",
        glass: "New Personal Glass",
        instructions: "New Personal Inst",
        thumbnail: "http://NewPersonalDrink.img",
        ingredients: ["New Personal Ing 1", "New Personal Ing 2", "New Personal Ing 3"],
      },
    });
  });

  test("unauth for others", async function () {
    const mealResp = await request(app)
        .post("/users/u1/meals/personal")
        .send({
            name: "New Personal Meal",
            category: "New Personal Cat",
            area: "New Personal Area",
            instructions: "New Personal Inst",
            thumbnail: "http://NewPersonalMeal.img",
            ingredients: ["New Personal Ing 1", "New Personal Ing 2", "New Personal Ing 3"],
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(mealResp.statusCode).toEqual(401);

    const drinkResp = await request(app)
        .post("/users/u1/drinks/personal")
        .send({
            name: "New Personal Drink",
            category: "New Personal Cat",
            type: "New Personal Type",
            glass: "New Personal Glass",
            instructions: "New Personal Inst",
            thumbnail: "http://NewPersonalDrink.img",
            ingredients: ["New Personal Ing 1", "New Personal Ing 2", "New Personal Ing 3"],
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(drinkResp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const mealResp = await request(app)
        .post("/users/u1/meals/personal")
        .send({
            name: "New Personal Meal",
            category: "New Personal Cat",
            area: "New Personal Area",
            instructions: "New Personal Inst",
            thumbnail: "http://NewPersonalMeal.img",
            ingredients: ["New Personal Ing 1", "New Personal Ing 2", "New Personal Ing 3"],
        });
    expect(mealResp.statusCode).toEqual(401);

    const drinkResp = await request(app)
        .post("/users/u1/drinks/personal")
        .send({
            name: "New Personal Drink",
            category: "New Personal Cat",
            type: "New Personal Type",
            glass: "New Personal Glass",
            instructions: "New Personal Inst",
            thumbnail: "http://NewPersonalDrink.img",
            ingredients: ["New Personal Ing 1", "New Personal Ing 2", "New Personal Ing 3"],
        });
    expect(drinkResp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const mealResp = await request(app)
        .post("/users/u1/meals/personal")
        .send({
          name: "test",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(mealResp.statusCode).toEqual(400);

    const drinkResp = await request(app)
        .post("/users/u1/drinks/personal")
        .send({
          name: "test",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(drinkResp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const mealResp = await request(app)
        .post("/users/u1/meals/personal")
        .send({
            name: "New Personal Meal",
            category: 1,
            area: "New Personal Area",
            instructions: "New Personal Inst",
            thumbnail: "http://NewPersonalMeal.img",
            ingredients: ["New Personal Ing 1", "New Personal Ing 2", "New Personal Ing 3"],
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(mealResp.statusCode).toEqual(400);

    const drinkResp = await request(app)
        .post("/users/u1/drinks/personal")
        .send({
            name: "New Personal Drink",
            category: 1,
            type: "New Personal Type",
            glass: "New Personal Glass",
            instructions: "New Personal Inst",
            thumbnail: "http://NewPersonalDrink.img",
            ingredients: ["New Personal Ing 1", "New Personal Ing 2", "New Personal Ing 3"],
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(drinkResp.statusCode).toEqual(400);
  });
});

/************************************** GET /users/:username/:type/personal/:id */ 

describe("GET /users/:username/:type/personal/:id", function () {
  test("works for same user", async function () {
    const mealResp = await request(app)
        .get(`/users/u1/meals/personal/${testPersonalMealIds[0]}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(mealResp.body).toEqual({
      personalRecipe: {
        id: expect.any(Number),
        name: "P-M1",
        category: "P-Cat1",
        area: "P-A1",
        instructions: "P-Inst1",
        thumbnail: "http://P-M1.img",
        ingredients: ["P-Ing1a", "P-Ing1b", "P-Ing1c"]
      }
    });

    const drinkResp = await request(app)
        .get(`/users/u1/drinks/personal/${testPersonalDrinkIds[0]}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(drinkResp.body).toEqual({
      personalRecipe: {
        id: expect.any(Number),
        name: "P-D1",
        category: "P-Cat1",
        type: "P-T1",
        glass: "P-G1",
        instructions: "P-Inst1",
        thumbnail: "http://P-D1.img",
        ingredients: ["P-Ing1a", "P-Ing1b", "P-Ing1c"]
      }
    });
  });

  test("unauth for others", async function () {
    const mealResp = await request(app)
        .get(`/users/u1/meals/personal/${testPersonalMealIds[0]}`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(mealResp.statusCode).toEqual(401);

    const drinkResp = await request(app)
        .get(`/users/u1/drinks/personal/${testPersonalDrinkIds[0]}`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(drinkResp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const mealResp = await request(app)
        .get(`/users/u1/meals/personal/${testPersonalMealIds[0]}`);
    expect(mealResp.statusCode).toEqual(401);

    const drinkResp = await request(app)
        .get(`/users/u1/drinks/personal/${testPersonalDrinkIds[0]}`);
    expect(drinkResp.statusCode).toEqual(401);
  });

  test("not found for no such personal meal or drink", async function () {
    const mealResp = await request(app)
        .get("/users/u1/meals/personal/0")
        .set("authorization", `Bearer ${u1Token}`);
    expect(mealResp.statusCode).toEqual(404);

    const drinkResp = await request(app)
        .get("/users/u1/drinks/personal/0")
        .set("authorization", `Bearer ${u1Token}`);
    expect(drinkResp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /users/:username/:type/personal/:id */ 

describe("PATCH /users/:username/:type/personal/:id", function () {
  test("works for same user", async function () {
    const mealResp = await request(app)
        .patch(`/users/u1/meals/personal/${testPersonalMealIds[0]}`)
        .send({
          name: "New P-M",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(mealResp.body).toEqual({
      personalRecipe: {
        id: expect.any(Number),
        name: "New P-M",
        category: "P-Cat1",
        area: "P-A1",
        instructions: "P-Inst1",
        thumbnail: "http://P-M1.img",
        ingredients: ["P-Ing1a", "P-Ing1b", "P-Ing1c"],
      },
    });

    const drinkResp = await request(app)
        .patch(`/users/u1/drinks/personal/${testPersonalDrinkIds[0]}`)
        .send({
          name: "New P-D",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(drinkResp.body).toEqual({
      personalRecipe: {
        id: expect.any(Number),
        name: "New P-D",
        category: "P-Cat1",
        type: "P-T1",
        glass: "P-G1",
        instructions: "P-Inst1",
        thumbnail: "http://P-D1.img",
        ingredients: ["P-Ing1a", "P-Ing1b", "P-Ing1c"],
      },
    });
  });

  test("unauth for others", async function () {
    const mealResp = await request(app)
        .patch(`/users/u1/meals/personal/${testPersonalMealIds[0]}`)
        .send({
            name: "New P-M",
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(mealResp.statusCode).toEqual(401);

    const drinkResp = await request(app)
        .patch(`/users/u1/drinks/personal/${testPersonalDrinkIds[0]}`)
        .send({
            name: "New P-D",
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(drinkResp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const mealResp = await request(app)
        .patch(`/users/u1/meals/personal/${testPersonalMealIds[0]}`)
        .send({
            name: "New P-M",
        });
    expect(mealResp.statusCode).toEqual(401);

    const drinkResp = await request(app)
        .patch(`/users/u1/drinks/personal/${testPersonalDrinkIds[0]}`)
        .send({
            name: "New P-D",
        });
    expect(drinkResp.statusCode).toEqual(401);
  });

  test("not found for no such personal meal or drink", async function () {
    const mealResp = await request(app)
        .patch("/users/u1/meals/personal")
        .send({
          name: "New P-M",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(mealResp.statusCode).toEqual(404);

    const drinkResp = await request(app)
        .patch("/users/u1/drinks/personal")
        .send({
          name: "New P-D",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(drinkResp.statusCode).toEqual(404);
  });

  test("bad request with invalid data", async function () {
    const mealResp = await request(app)
        .patch(`/users/u1/meals/personal/${testPersonalMealIds[0]}`)
        .send({
            category: 1,
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(mealResp.statusCode).toEqual(400);

    const drinkResp = await request(app)
        .patch(`/users/u1/drinks/personal/${testPersonalDrinkIds[0]}`)
        .send({
            category: 1,
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(drinkResp.statusCode).toEqual(400);
  });
});

/************************************** POST /users/:username/meals/:id/:action */

describe("POST /users/:username/meals/:id/:action", function () {
  test("add and remove works for same user", async function () {
    const addResp = await request(app)
        .post(`/users/u1/meals/${testMealIds[1]}/add`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(addResp.body).toEqual({ favorited: true, mealId: testMealIds[1] });

    const removeResp = await request(app)
        .post(`/users/u1/meals/${testMealIds[1]}/remove`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(removeResp.body).toEqual({ favorited: false, mealId: testMealIds[1] });
  });

  test("unauth for others", async function () {
    const addResp = await request(app)
        .post(`/users/u1/meals/${testMealIds[1]}/add`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(addResp.statusCode).toEqual(401);

    const removeResp = await request(app)
        .post(`/users/u1/meals/${testMealIds[1]}/remove`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(removeResp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const addResp = await request(app)
        .post(`/users/u1/meals/${testMealIds[1]}/add`);
    expect(addResp.statusCode).toEqual(401);

    const removeResp = await request(app)
        .post(`/users/u1/meals/${testMealIds[1]}/remove`);
    expect(removeResp.statusCode).toEqual(401);
  });

  test("not found for no such meal", async function () {
    const addResp = await request(app)
        .post(`/users/u1/meals/0/add`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(addResp.statusCode).toEqual(404);

    const removeResp = await request(app)
        .post(`/users/u1/meals/0/remove`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(removeResp.statusCode).toEqual(404);
  });
});

/************************************** POST /users/:username/drinks/:id/:action */

describe("POST /users/:username/drinks/:id/:action", function () {
  test("add and remove works for same user", async function () {
    const addResp = await request(app)
        .post(`/users/u1/drinks/${testDrinkIds[1]}/add`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(addResp.body).toEqual({ favorited: true, drinkId: testDrinkIds[1] });

    const removeResp = await request(app)
        .post(`/users/u1/drinks/${testDrinkIds[1]}/remove`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(removeResp.body).toEqual({ favorited: false, drinkId: testDrinkIds[1] });
  });

  test("unauth for others", async function () {
    const addResp = await request(app)
        .post(`/users/u1/drinks/${testDrinkIds[1]}/add`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(addResp.statusCode).toEqual(401);

    const removeResp = await request(app)
        .post(`/users/u1/drinks/${testDrinkIds[1]}/remove`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(removeResp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const addResp = await request(app)
        .post(`/users/u1/drinks/${testDrinkIds[1]}/add`);
    expect(addResp.statusCode).toEqual(401);

    const removeResp = await request(app)
        .post(`/users/u1/drinks/${testDrinkIds[1]}/remove`);
    expect(removeResp.statusCode).toEqual(401);
  });

  test("not found for no such drink", async function () {
    const addResp = await request(app)
        .post(`/users/u1/drinks/0/add`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(addResp.statusCode).toEqual(404);

    const removeResp = await request(app)
        .post(`/users/u1/drinks/0/remove`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(removeResp.statusCode).toEqual(404);
  });
});
