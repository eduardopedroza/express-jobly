const { BadRequestError } = require("../expressError");

/**
 * Generates a SQL query for a partial update.
 *
 * This is a "partial update", it's fine if `dataToUpdate` doesn't contain all the
 * fields; this function only changes the provided ones.
 *
 * `dataToUpdate` can include any set of key-value pairs where the key represents the field name
 * and the value represents the new value to set for that field.
 *
 * `jsToSql` is used to map JavaScript-style camelCased variable names to SQL-style snake_cased
 * column names, if necessary.
 *
 * Returns an object with two properties:
 *   - setCols: A string of column-value pairs for the SQL query.
 *   - values: An array of values corresponding to the column-value pairs.
 *
 */


function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
