// @ts-check
const pool = require("../config/database").pool;
const tablename = process.env.TABLENAME || "realtime_surveillance";
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
            dynamodbgetAll(config[0].dataQuery, null, null, (error, results) => {
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

const dynamodbgetAll = function (tableName, previousresults, LastEvaluatedKey, callback) {
    const params = {
        TableName: tableName,
    };
    if (LastEvaluatedKey) {
        params.ExclusiveStartKey = LastEvaluatedKey;
    }
    let output = previousresults || { Items: [], Count: 0, ScannedCount: 0 };
    docClient.scan(params, (err, result) => {
        if (err) callback(err, null);
        else {
            output = {
                Items: output.Items.concat(result.Items),
                Count: output.Count + result.Count,
                ScannedCount: output.ScannedCount + result.ScannedCount,
            };

            if (typeof result.LastEvaluatedKey !== "undefined") {
                dynamodbgetAll(tableName, output, result.LastEvaluatedKey, callback);
            } else {
                callback(null, output);
            }
        }
    });
};
