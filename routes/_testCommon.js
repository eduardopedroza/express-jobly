"use strict";

const db = require("../db.js");
const User = require("../models/user");
const Company = require("../models/company");
const Job = require("../models/job.js");
const { createToken } = require("../helpers/tokens");

async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM companies");

  await Company.create(
      {
        handle: "c1",
        name: "C1",
        numEmployees: 1,
        description: "Desc1",
        logoUrl: "http://c1.img",
      });
  await Company.create(
      {
        handle: "c2",
        name: "C2",
        numEmployees: 2,
        description: "Desc2",
        logoUrl: "http://c2.img",
      });
  await Company.create(
      {
        handle: "c3",
        name: "C3",
        numEmployees: 3,
        description: "Desc3",
        logoUrl: "http://c3.img",
      });
  await Company.create(
      {
        handle: "c4",
        name: "C4",
        numEmployees: 4,
        description: "Desc4",
        logoUrl: "http://c4.img",
      });

  await User.register({
    username: "u1",
    firstName: "U1F",
    lastName: "U1L",
    email: "user1@user.com",
    password: "password1",
    isAdmin: false,
  });
  await User.register({
    username: "u2",
    firstName: "U2F",
    lastName: "U2L",
    email: "user2@user.com",
    password: "password2",
    isAdmin: false,
  });
  await User.register({
    username: "u3",
    firstName: "U3F",
    lastName: "U3L",
    email: "user3@user.com",
    password: "password3",
    isAdmin: false,
  });
  await User.register({
    username: "admin",
    firstName: "ADMINF",
    lastName: "ADMINL",
    email: "admin@user.com",
    password: "password4",
    isAdmin: true,
  });

  await Job.create({
    title: 'j1',
    salary: 100000,
    equity: 0,
    companyHandle: 'c1'
  });
  await Job.create({
    title: 'j2',
    salary: 150000,
    equity: 0.081,
    companyHandle: 'c2'
  });
  await Job.create({
    title: 'j3',
    salary: 400000,
    equity: 0.032,
    companyHandle: 'c3'
  });

  const jobRes = await db.query("SELECT id FROM jobs WHERE title='j2'");
  const jobId = jobRes.rows[0].id
  await User.apply('u1', jobId);
}



async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}

const adminToken = createToken({ username: "admin", isAdmin: true });
const u1Token = createToken({ username: "u1", isAdmin: false });


module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken
};
