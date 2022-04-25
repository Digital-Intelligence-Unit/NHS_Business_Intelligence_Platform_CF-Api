// @ts-check
const pool = require("../config/database").pool;
const tablename = process.env.TABLENAME || "covid_populations";
const configurations = require("../config/cf_configurations").cfConfigurations;
let query;

module.exports.getAll = function (callback) {
  const config = configurations.filter((x) => x.name === tablename);
  if (config.length === 0) {
    query = `SELECT ccg, age, sex, rsk, w, m, d, l, gp, lcnt, fcnt, ltcs, flags, cr, cv FROM ${tablename} LIMIT 100;`; // TODO: LIMIT FOR TESTING ONLY
  } else {
    query = config[0].dataQuery;
  }
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
