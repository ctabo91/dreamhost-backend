"use strict";

const request = require("supertest");

const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testDrinkIds,
  u1Token,
} = require("./_testCommon");
const { BadRequestError } = require("../expressError");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /drinks */

describe("POST /drinks", function () {
  test("ok if logged in", async function () {
    const resp = await request(app)
        .post(`/drinks`)
        .send({
            name: "New Drink",
            category: "New Cat",
            type: "New Type",
            glass: "New Glass",
            instructions: "New Inst",
            thumbnail: "http://NewDrink.img",
            ingredients: ["New Ing 1", "New Ing 2", "New Ing 3"],
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      drink: {
        id: expect.any(Number),
        name: "New Drink",
        category: "New Cat",
        type: "New Type",
        glass: "New Glass",
        instructions: "New Inst",
        thumbnail: "http://NewDrink.img",
        ingredients: ["New Ing 1", "New Ing 2", "New Ing 3"],
      },
    });
  });

  test("unauth if not logged in", async function () {
    const resp = await request(app)
        .post(`/drinks`)
        .send({
            name: "New Drink",
            category: "New Cat",
            type: "New Type",
            glass: "New Glass",
            instructions: "New Inst",
            thumbnail: "http://NewDrink.img",
            ingredients: ["New Ing 1", "New Ing 2", "New Ing 3"],
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post(`/drinks`)
        .send({
          name: "test",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post(`/drinks`)
        .send({
            name: "New Drink",
            category: 1,
            type: "New Type",
            glass: "New Glass",
            instructions: "New Inst",
            thumbnail: "http://NewDrink.img",
            ingredients: ["New Ing 1", "New Ing 2", "New Ing 3"],
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /drinks */

describe("GET /drinks", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get(`/drinks`);
    expect(resp.body).toEqual({
          drinks: [
            {
              id: expect.any(Number),
              name: "D1",
              category: "Cat1",
              type: "T1",
              glass: "G1",
              instructions: "Inst1",
              thumbnail: "http://D1.img",
              ingredients: ["Ing1a", "Ing1b", "Ing1c"],
            },
            {
              id: expect.any(Number),
              name: "D2",
              category: "Cat2",
              type: "T2",
              glass: "G2",
              instructions: "Inst2",
              thumbnail: "http://D2.img",
              ingredients: ["Ing2a", "Ing2b", "Ing2c"],
            },
            {
              id: expect.any(Number),
              name: "D3",
              category: "Cat3",
              type: "T3",
              glass: "G3",
              instructions: "Inst3",
              thumbnail: "http://D3.img",
              ingredients: ["Ing3a", "Ing3b", "Ing3c"],
            },
          ],
        },
    );
  });

  test("works: filtering", async function () {
    const resp = await request(app)
        .get(`/drinks`)
        .query({ name: "D1" });
    expect(resp.body).toEqual({
          drinks: [
            {
              id: expect.any(Number),
              name: "D1",
              category: "Cat1",
              type: "T1",
              glass: "G1",
              instructions: "Inst1",
              thumbnail: "http://D1.img",
              ingredients: ["Ing1a", "Ing1b", "Ing1c"],
            },
          ],
        },
    );
  });

  test("bad request on invalid filter key", async function () {
    const resp = await request(app)
        .get(`/drinks`)
        .query({ nope: "nope" });
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /drinks/:id */

describe("GET /drinks/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/drinks/${testDrinkIds[0]}`);
    expect(resp.body).toEqual({
      drink: {
        id: expect.any(Number),
        name: "D1",
        category: "Cat1",
        type: "T1",
        glass: "G1",
        instructions: "Inst1",
        thumbnail: "http://D1.img",
        ingredients: ["Ing1a", "Ing1b", "Ing1c"],
      },
    });
  });

  test("not found for no such drink", async function () {
    const resp = await request(app).get(`/drinks/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /drinks/:id */

describe("PATCH /drinks/:id", function () {
  test("works if logged in", async function () {
    const resp = await request(app)
        .patch(`/drinks/${testDrinkIds[0]}`)
        .send({
          name: "New D",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      drink: {
        id: expect.any(Number),
        name: "New D",
        category: "Cat1",
        type: "T1",
        glass: "G1",
        instructions: "Inst1",
        thumbnail: "http://D1.img",
        ingredients: ["Ing1a", "Ing1b", "Ing1c"],
      },
    });
  });

  test("unauth if not logged in", async function () {
    const resp = await request(app)
        .patch(`/drinks/${testDrinkIds[0]}`)
        .send({
          name: "New D",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such drink", async function () {
    const resp = await request(app)
        .patch(`/drinks/0`)
        .send({
          name: "New D",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .patch(`/drinks/${testDrinkIds[0]}`)
        .send({
          category: 1,
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /drinks/:id */

describe("DELETE /drinks/:id", function () {
  test("works if logged in", async function () {
    const resp = await request(app)
        .delete(`/drinks/${testDrinkIds[0]}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: testDrinkIds[0] });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/drinks/${testDrinkIds[0]}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such drink", async function () {
    const resp = await request(app)
        .delete(`/drinks/0`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
