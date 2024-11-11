// Get postgres
const pg = require("pg");
const pool = new pg.Pool({  
    database: "postgres",
    host: process.env.PGDATABASE || "localhost",
    user: process.env.POSTGRES_UN,
    password: process.env.POSTGRES_PW,
    port: process.env.PGPORT || "5432",
});
module.exports.pool = pool;

// @ts-ignore Ammend pg date types
const types = pg.types;
types.setTypeParser(types.builtins.DATE, (stringValue) => {
    return new Date(stringValue);
});
module.exports.types = types;