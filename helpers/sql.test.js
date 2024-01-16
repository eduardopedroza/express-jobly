
const request = require('supertest');
const { sqlForPartialUpdate } = require('../helpers/sql');
const { BadRequestError } = require("../expressError");


describe("sqlForPartialUpdate", function () {
  test("works: generating SQL for updating a single column", function () {
    const result = sqlForPartialUpdate(
      { firstName: 'Aliya' },
      { firstName: 'first_name' }
    );
    expect(result).toEqual({
      setCols: '"first_name"=$1',
      values: ['Aliya']
    });
  });

  test("throws BadRequest Error if no data", function () {
    expect(() => {
      sqlForPartialUpdate({}, { firstName: 'first_name' });
    }).toThrow(BadRequestError);
  });

  test("correctly maps JS keys to SQL column names", function () {
    const result = sqlForPartialUpdate(
      { firstName: 'Aliya', lastName: 'Smith' },
      { firstName: 'first_name', lastName: 'last_name' }
    );
    expect(result).toEqual({
      setCols: '"first_name"=$1, "last_name"=$2',
      values: ['Aliya', 'Smith']
    });
  });
});
