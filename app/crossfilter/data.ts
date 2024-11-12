import { cfConfigurations } from "./config/cf_configurations.js";

import db from '@adonisjs/lucid/services/db'
import { AWSHelper } from 'diu-data-functions/helpers'
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { Exception } from "@adonisjs/core/exceptions";
const dynamodbClient = DynamoDBDocumentClient.from(new DynamoDBClient(AWSHelper.getCredentials()))

export class DataModel {
    static async get(tableName: string) {
        const config = cfConfigurations.filter((x) => x.name === tableName);
        if (config[0].type && config[0].type === "dynamodb") {
            const output = await this.getFromDynamoDb(config[0].dataQuery, null, null);
            if(output.Items.length <= 0) {
                throw new Exception('Error retrieving model data: No rows returned')
            }
            return output.Items;
        } else {
            return await this.getFromTable(config[0].dataQuery);
        }
    }

    static async getFromTable(query: string) {
        // To do: Change to async
        const data = await db.rawQuery(query).exec();
        
        if(!data || data.rows.length <= 0) {
            throw new Exception('Error retrieving model data: No rows returned')
        }

        return data.rows;
    }

    static async getFromDynamoDb(tableName: string, previousResults: any, lastEvaluatedKey: any) {
        // Setup params
        const params: any = { TableName: tableName };
        if (lastEvaluatedKey) {
            params.ExclusiveStartKey = lastEvaluatedKey;
        }

        // Create output
        let output = previousResults || { Items: [], Count: 0, ScannedCount: 0 };

        // Get data
        const result = await dynamodbClient.send(new ScanCommand(params));

        if(result == null) {
            throw new Exception('Error retrieving model data: No rows returned')
        }

        // Create output
        output = {
            Items: output.Items.concat(result.Items),
            Count: output.Count + result.Count,
            ScannedCount: output.ScannedCount + result.ScannedCount,
        };

        // Get next page
        if (result.LastEvaluatedKey !== undefined) {
            output = await this.getFromDynamoDb(tableName, output, result.LastEvaluatedKey);
        }
        
        return output;
    }
}