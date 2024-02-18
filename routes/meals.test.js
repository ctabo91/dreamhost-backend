"use strict";

const request = require("supertest");

const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testMealIds,
  u1Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /meals */

describe("POST /meals", function () {
  test("ok if logged in", async function () {
    const resp = await request(app)
        .post(`/meals`)
        .send({
            name: "New Meal",
            category: "New Cat",
            area: "New Area",
            instructions: "New Inst",
            thumbnail: "http://NewMeal.img",
            ingredients: ["New Ing 1", "New Ing 2", "New Ing 3"],
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      meal: {
        id: expect.any(Number),
        name: "New Meal",
        category: "New Cat",
        area: "New Area",
        instructions: "New Inst",
        thumbnail: "http://NewMeal.img",
        ingredients: ["New Ing 1", "New Ing 2", "New Ing 3"],
      },
    });
  });

  test("unauth if not logged in", async function () {
    const resp = await request(app)
        .post(`/meals`)
        .send({
            name: "New Meal",
            category: "New Cat",
            area: "New Area",
            instructions: "New Inst",
            thumbnail: "http://NewMeal.img",
            ingredients: ["New Ing 1", "New Ing 2", "New Ing 3"],
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post(`/meals`)
        .send({
          name: "test",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post(`/meals`)
        .send({
            name: "New Meal",
            category: 1,
            area: "New Area",
            instructions: "New Inst",
            thumbnail: "http://NewMeal.img",
            ingredients: ["New Ing 1", "New Ing 2", "New Ing 3"],
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /meals */

describe("GET /meals", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get(`/meals`);
    expect(resp.body).toEqual({
          meals: [
            {
              id: expect.any(Number),
              name: "M1",
              category: "Cat1",
              area: "A1",
              instructions: "Inst1",
              thumbnail: "http://M1.img",
              ingredients: ["Ing1a", "Ing1b", "Ing1c"],
            },
            {
              id: expect.any(Number),
              name: "M2",
              category: "Cat2",
              area: "A2",
              instructions: "Inst2",
              thumbnail: "http://M2.img",
              ingredients: ["Ing2a", "Ing2b", "Ing2c"],
            },
            {
              id: expect.any(Number),
              name: "M3",
              category: "Cat3",
              area: "A3",
              instructions: "Inst3",
              thumbnail: "http://M3.img",
              ingredients: ["Ing3a", "Ing3b", "Ing3c"],
            },
          ],
        },
    );
  });

  test("works: filtering", async function () {
    const resp = await request(app)
        .get(`/meals`)
        .query({ name: "M1" });
    expect(resp.body).toEqual({
          meals: [
            {
              id: expect.any(Number),
              name: "M1",
              category: "Cat1",
              area: "A1",
              instructions: "Inst1",
              thumbnail: "http://M1.img",
              ingredients: ["Ing1a", "Ing1b", "Ing1c"],
            },
          ],
        },
    );
  });

  test("bad request on invalid filter key", async function () {
    const resp = await request(app)
        .get(`/meals`)
        .query({ nope: "nope" });
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /meals/:id */

describe("GET /meals/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/meals/${testMealIds[0]}`);
    expect(resp.body).toEqual({
      meal: {
        id: expect.any(Number),
        name: "M1",
        category: "Cat1",
        area: "A1",
        instructions: "Inst1",
        thumbnail: "http://M1.img",
        ingredients: ["Ing1a", "Ing1b", "Ing1c"],
      },
    });
  });

  test("not found for no such meal", async function () {
    const resp = await request(app).get(`/meals/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /meals/:id */

describe("PATCH /meals/:id", function () {
  test("works if logged in", async function () {
    const resp = await request(app)
        .patch(`/meals/${testMealIds[0]}`)
        .send({
          name: "New M",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      meal: {
        id: expect.any(Number),
        name: "New M",
        category: "Cat1",
        area: "A1",
        instructions: "Inst1",
        thumbnail: "http://M1.img",
        ingredients: ["Ing1a", "Ing1b", "Ing1c"],
      },
    });
  });

  test("unauth if not logged in", async function () {
    const resp = await request(app)
        .patch(`/meals/${testMealIds[0]}`)
        .send({
          name: "New M",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such meal", async function () {
    const resp = await request(app)
        .patch(`/meals/0`)
        .send({
          name: "New M",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .patch(`/meals/${testMealIds[0]}`)
        .send({
          category: 1,
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /meals/:id */

describe("DELETE /meals/:id", function () {
  test("works if logged in", async function () {
    const resp = await request(app)
        .delete(`/meals/${testMealIds[0]}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: testMealIds[0] });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/meals/${testMealIds[0]}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such meal", async function () {
    const resp = await request(app)
        .delete(`/meals/0`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
