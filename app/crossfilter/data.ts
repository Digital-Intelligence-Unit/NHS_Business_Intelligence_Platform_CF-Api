// @ts-nocheck (temporary)
const pool = require("../config/postgres").pool;
const configurations = require("../config/cf_configurations").cfConfigurations;

const { getCredentials } = require("../config/aws");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const dynamodbClient = DynamoDBDocumentClient.from(new DynamoDBClient(getCredentials()))

export class DataModel {
    static get(tableName, callback) {
        const config = configurations.filter((x) => x.name === tableName);
        
        if (config.length === 0) {
            this.getFromTable(
                `SELECT ccg, age, sex, rsk, w, m, d, l, gp, lcnt, fcnt, ltcs, flags, cr, cv FROM ${tableName};`,
                callback
            );
            return;
        }

        if (config[0].type && config[0].type === "dynamodb") {
            this.getFromDynamoDb(
                config[0].dataQuery, null, null, 
                (error, results) => {
                    if (error) {
                        console.log(error);
                    } else {
                        if (results && results.Items) {
                            callback(null, results.Items);
                        } else {
                            const response = "No rows returned";
                            callback(response, null);
                        }
                    }
                }
            );
        } else {
            this.getFromTable(config[0].dataQuery, callback);
        }
    }

    static getFromTable(query, callback) {
        pool.query(query, (error, results) => {
            if (error) {
                console.log(error);
                callback('Error retreiving postgres data', null); return 
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

    static getFromDynamoDb(tableName, previousresults, LastEvaluatedKey, callback) {
        // Setup params
        const params = { TableName: tableName };
        if (LastEvaluatedKey) {
            params.ExclusiveStartKey = LastEvaluatedKey;
        }

        // Create output
        let output = previousresults || { Items: [], Count: 0, ScannedCount: 0 };

        dynamodbClient.send(
            new ScanCommand(params)
        , (err, result) => {
            if (err || result == null) { 
                console.log(err);
                callback('Error retreiving dynamodb data', null); return 
            } else {
                // Create output
                output = {
                    Items: output.Items.concat(result.Items),
                    Count: output.Count + result.Count,
                    ScannedCount: output.ScannedCount + result.ScannedCount,
                };
    
                // Get next page
                if (result.LastEvaluatedKey !== undefined) {
                    this.getFromDynamoDb(tableName, output, result.LastEvaluatedKey, callback);
                } else {
                    callback(null, output);
                }
            }
        });
    }
}