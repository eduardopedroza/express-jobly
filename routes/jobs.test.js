"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("/POST", function () {
  const newJob = {
    title: "NewJob",
    salary: 300000,
    equity: 0.27,
    companyHandle: 'c1'
  }

  test("ok for admins", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: newJob
    });
  });

  test("unauth for non-admin users", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "new",
          salary: 10000,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          ...newJob,
          salary: "not-an-integer",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

describe("/GET", function () {
  test("works: no filter", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs: [
        {
          title: 'j1',
          salary: 100000,
          equity: 0,
          companyHandle: 'c1'
        },
        {
          title: 'j2',
          salary: 150000,
          equity: 0.081,
          companyHandle: 'c2'
        },
        {
          title: 'j3',
          salary: 400000,
          equity: 0.032,
          companyHandle: 'c3'
        }
      ]
    });
  });

  test("filtering by title", async function () {
    const resp = await request(app).get("/jobs?title=j1");
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      jobs: [
        {
          title: 'j1',
          salary: 100000,
          equity: 0,
          companyHandle: 'c1'
        }
      ]
    });
  });

  test("filtering by minSalary", async function () {
    const resp = await request(app).get("/jobs?minSalary=120000");
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      jobs: [
        {
          title: 'j2',
          salary: 150000,
          equity: 0.081,
          companyHandle: 'c2'
        },
        {
          title: 'j3',
          salary: 400000,
          equity: 0.032,
          companyHandle: 'c3'
        }
      ]
    });
  });

  test("filtering by hasEquity", async function () {
    const resp = await request(app).get("/jobs?hasEquity=true");
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      jobs: [
        {
          title: 'j2',
          salary: 150000,
          equity: 0.081,
          companyHandle: 'c2'
        },
        {
          title: 'j3',
          salary: 400000,
          equity: 0.032,
          companyHandle: 'c3'
        }
      ]
    });
  });

  test("filtering with combined filters", async function () {
    const resp = await request(app).get("/jobs?title=j&minSalary=300000&hasEquity=true");
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      jobs: [
        {
          title: 'j3',
          salary: 400000,
          equity: 0.032,
          companyHandle: 'c3'
        }
      ]
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
        .get("/jobs")
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(500);
  });
  
});



describe("GET /jobs/:title", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/j1`);
    expect(resp.body).toEqual({
      job: {
        title: 'j1',
        salary: 100000,
        equity: 0,
        companyHandle: 'c1'
      }
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/nope`);
    expect(resp.statusCode).toEqual(404);
  });
});


/************************************** PATCH /jobs/:title */

describe("PATCH /jobs/:title", function () {
  test("works for admins", async function () {
    const resp = await request(app)
        .patch(`/jobs/j1`)
        .send({
          title: "j1-new",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      job: {
        title: "j1-new",
        salary: 100000,
        equity: 0,
        companyHandle: 'c1'
      },
    });
  });

  test("unauth for non-admin users", async function () {
    const resp = await request(app)
        .patch(`/jobs/j1`)
        .send({
          title: "j1-new",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/jobs/j1`)
        .send({
          title: "j1-new",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such company", async function () {
    const resp = await request(app)
        .patch(`/jobs/nope`)
        .send({
          title: "new nope",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
        .patch(`/jobs/j1`)
        .send({
          salary: "not-an-integer",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:title */

describe("DELETE /companies/:title", function () {
  test("works for admins", async function () {
    const resp = await request(app)
        .delete(`/jobs/j1`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: "j1" });
  });

  test("unauth for non-admin users", async function () {
    const resp = await request(app)
        .delete(`/jobs/j1`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/jobs/j1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such company", async function () {
    const resp = await request(app)
        .delete(`/jobs/nope`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
