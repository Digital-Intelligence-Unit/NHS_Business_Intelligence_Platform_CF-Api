// @ts-check
const pool = require("../config/database").pool;
const tablename = process.env.TABLENAME || "population_health_mini";
const configurations = require("../config/cf_configurations").cfConfigurations;
let query;
const AWS = require("../config/database").AWS;
const docClient = new AWS.DynamoDB.DocumentClient();

module.exports.getAll = function (callback) {
    const config = configurations.filter((x) => x.name === tablename);
    if (config.length === 0) {
        query = `SELECT ccg, age, sex, rsk, w, m, d, l, gp, lcnt, fcnt, ltcs, flags, cr, cv FROM ${tablename};`;
        pool.query(query, (error, results) => {
            if (error) {
                console.log("Error: " + error);
            } else {
                if (results && results.rows) {
                    callback(null, results.rows);
                } else {
                    const response = "No rows returned";
                    callback(response, null);
                }
            }
        });
    } else {
        if (config[0].type && config[0].type === "dynamodb") {
            dynamodbgetAll(config[0].dataQuery, (error, results) => {
                if (error) {
                    console.log("Error: " + error);
                } else {
                    if (results && results.Items) {
                        callback(null, results.Items);
                    } else {
                        const response = "No rows returned";
                        callback(response, null);
                    }
                }
            });
        } else {
            query = config[0].dataQuery;
            pool.query(query, (error, results) => {
                if (error) {
                    console.log("Error: " + error);
                } else {
                    if (results && results.rows) {
                        callback(null, results.rows);
                    } else {
                        const response = "No rows returned";
                        callback(response, null);
                    }
                }
            });
        }
    }
};

const dynamodbgetAll = function (name, callback) {
    const params = {
        TableName: name,
    };
    docClient.scan(params, callback);
};
