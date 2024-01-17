"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError.js");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


/************************************** create */

describe("create", function () {
  const newJob = {
    title: "newJob",
    salary: 50000,
    equity: 0,
    companyHandle: 'c1',
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual(newJob);
  
    const result = await db.query(
          `SELECT title, salary, equity, company_handle
           FROM jobs
           WHERE title = 'newJob'`);
    
    const jobsWithConvertedEquity = result.rows.map(job => ({
      ...job,
      equity: Number(job.equity),  
    }));
  
    expect(jobsWithConvertedEquity).toEqual([
      {
        title: "newJob",
        salary: 50000,
        equity: 0,
        company_handle: 'c1',
      },
    ]);
  });
  

  test("bad request with dupe", async function () {
    try {
      await Job.create(newJob);
      await Job.create(newJob);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});


describe("find all", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll({});

    const jobsWithConvertedEquity = jobs.map(job => ({
      ...job,
      equity: Number(job.equity), 
    }));

    expect(jobsWithConvertedEquity).toEqual([
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
      },
    ]);
  });

  test("works: filtered by title, minSalary, hasEquity", async function () {
    let filters = {
      title: 'j',
      minSalary: 150000,
      hasEquity: true
    };

    let jobs = await Job.findAll(filters);

    const jobsWithConvertedEquity = jobs.map(job => ({
      ...job,
      equity: Number(job.equity), 
    }));

    expect(jobsWithConvertedEquity).toEqual([
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
      },
    ]);
  });

  test("works: filtered by title", async function () {
    let filters = {
      title: 'j1'
    };

    let jobs = await Job.findAll(filters);

    const jobsWithConvertedEquity = jobs.map(job => ({
      ...job,
      equity: Number(job.equity), 
    }));

    expect(jobsWithConvertedEquity).toEqual([
      {
        title: 'j1',
        salary: 100000,
        equity: 0,
        companyHandle: 'c1'
      }
    ]);
  });

  test("works: filtered by minSalary", async function () {
    let filters = {
      minSalary: 300000
    };

    let jobs = await Job.findAll(filters);

    const jobsWithConvertedEquity = jobs.map(job => ({
      ...job,
      equity: Number(job.equity), 
    }));

    expect(jobsWithConvertedEquity).toEqual([
      {
        title: 'j3',
        salary: 400000,
        equity: 0.032,
        companyHandle: 'c3'
      },
    ]);
  });

  test("works: filtered by hasEquity", async function () {
    let filters = {
      minSalary: 150000,
      hasEquity: true
    };

    let jobs = await Job.findAll(filters);

    const jobsWithConvertedEquity = jobs.map(job => ({
      ...job,
      equity: Number(job.equity), 
    }));

    expect(jobsWithConvertedEquity).toEqual([
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
      },
    ]);
  });
});

describe("get", function () {
  test("works", async function () {
    let job = await Job.get('j1');
    expect(job).toEqual({
      title: 'j1',
      salary: 100000,
      equity: 0,
      companyHandle: 'c1'
    });
  });

  test("not found", async function () {
    try {
      await Job.get("fake job");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  })
});

describe("update", function () {
  const updateData = {
    title: "New",
    salary: 150500,
    equity: 0.64,
    companyHandle: 'c2'
  };

  test("works", async function () {
    let job = await Job.update('j2', updateData);
    expect(job).toEqual({
      title: 'New',
      ...updateData,
    });

    const result = await db.query(
      `SELECT title, salary, equity, company_handle
       FROM jobs
       WHERE title = 'New'`);
    
    result.rows[0].equity = Number(result.rows[0].equity)
    expect(result.rows).toEqual([{
      title: "New",
      salary: 150500,
      equity: 0.64,
      company_handle: 'c2'
    }]);
  });

  test("works: null fields", async function () {
    const updateDataNulls = {
      title: "New",
      salary: null,
      equity: null,
      companyHandle: 'c1'
    };

    let job = await Job.update('j1', updateDataNulls);
    expect(job).toEqual({
      title: "New",
      ...updateDataNulls,
    });

    const result = await db.query(
      `SELECT title, salary, equity, company_handle
       FROM jobs
       WHERE title = 'New'`);
    
    expect(result.rows).toEqual([{
      title: "New",
      salary: null,
      equity: null,
      company_handle: 'c1'
    }]);
  });

  test("not found if no such title", async function () {
    try {
      await Job.update("fake job", updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  // test("bad request with no data", async function () {
  //   try {
  //     await Job.update("c1", {});
  //     fail();
  //   } catch (err) {
  //     expect(err instanceof BadRequestError).toBeTruthy();
  //   }
  // })
});

describe("remove", function () {
  test("works", async function () {
    await Job.remove('j1');
    const res = await db.query(
      `SELECT title FROM jobs WHERE title = 'j1'`);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove('fake job');
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  })
})