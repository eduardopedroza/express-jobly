"use strict";

const db = require('../db');
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");


class Job {
  /** Create a job (from data), update db, return new job data
   * 
   * data should be (title, salary, equit, companyHandle)
   * 
   * changes job.equity to number from string necause SQL returns 'NUMERIC' as a string
   * 
   * Returns (title, salary, equity, companyHandle)
   * 
   * Throws BadRequestError if job already in database
   */
  static async create({ title, salary, equity, companyHandle }) {
    const duplicateCheck = await db.query(
      `SELECT title
       FROM jobs
       WHERE title = $1`,
    [title]);

    if (duplicateCheck.rows[0]) throw new BadRequestError(`Duplicate company: ${title}`);
    
    const result = await db.query(
      `INSERT INTO jobs
       (title, salary, equity, company_handle)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [title, salary, equity, companyHandle]
    );

    const job = result.rows[0];
    job.equity = Number(job.equity);

    return job;
  }

  /** Find all jobs.
   * 
   * Creates base query, and initializes sql query parts for filtering
   * 
   * Adds sql query parts if they are provided
   * 
   * Combines all expressions and appends to the query
   * 
   * Returns all or filtered jobs [{ title, salary, equity, companyHandle }, ...]
   */

  static async findAll({ title, minSalary, hasEquity }) {
    let query = `
      SELECT title,
             salary, 
             equity,
             company_handle AS "companyHandle"
      FROM jobs`;
  
    let whereExpressions = [];
    let queryValues = [];
  
    if (title) {
      queryValues.push(`%${title}%`);
      whereExpressions.push(`title ILIKE $${queryValues.length}`);
    }
  
    if (minSalary !== undefined) {
      queryValues.push(minSalary);
      whereExpressions.push(`salary >= $${queryValues.length}`);
    }
  
    if (hasEquity === true) {
      whereExpressions.push(`equity > 0`);
    }
  
    if (whereExpressions.length > 0) {
      query += " WHERE " + whereExpressions.join(" AND ");
    }
  
    query += " ORDER BY title";
  
    const jobs = await db.query(query, queryValues);

    const jobsWithConvertedEquity = jobs.rows.map(job => ({
      ...job,
      equity: Number(job.equity),  
    }));

    return jobsWithConvertedEquity;
  }
  
  /** Given a job id, return data about job.
   * 
   * Returns { title, salary, equity, companyHandle }
   * 
   * Throws NotFoundError if not found.
   */
  static async get(id) {
    const jobRes = await db.query(
      `SELECT id,
              title,
              salary,
              equity,
              company_handle AS "companyHandle"
      FROM jobs
      WHERE id = $1`,
      [id]);
    
    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`)
    
    job.equity = Number(job.equity);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity, companyHandle}
   *
   * Returns {title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if not found.
   */
  static async update(title, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        companyHandle: "company_handle"
      });
    const titleVarIdx = "$" + (values.length + 1);

    const query = `UPDATE jobs
                   SET ${setCols}
                   WHERE title = ${titleVarIdx}
                   RETURNING title, 
                             salary, 
                             equity,
                             company_handle AS "companyHandle"`;
    const result = await db.query(query, [...values, title]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${title}`);
    
    if (job.equity !== null) {
      job.equity = Number(job.equity);
    }

    return job;
  }

   /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/
  
  static async remove(title) {
    const result = await db.query(
      `DELETE 
       FROM jobs
       WHERE title = $1
       RETURNING title`,
      [title]);
    const job = result.rows[0];

    if (!job)throw new NotFoundError(`No job: ${title}`); 
  }
}
  





module.exports = Job;