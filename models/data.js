// @ts-check
const pool = require("../config/database").pool;
const tablename = process.env.TABLENAME || "covid_populations";

module.exports.getAll = function (callback) {
  const query = `SELECT ccg, age, sex, rsk, w, m, d, l, gp, lcnt, fcnt, ltcs, flags, cr, cv FROM ${tablename};`;
  pool.query(query, (error, results) => {
    if (error) {
      console.log("Error: " + error);
    } else {
      if (results && results.rows) {
        callback(null, results.rows);
      } else {
        console.log("Error: " + error);
        callback("No rows returned", null);
      }
    }
  });
};
