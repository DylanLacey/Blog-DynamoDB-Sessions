import aws from "aws-sdk";
import { Entity, Table } from "dynamodb-toolbox";
import { nanoid } from "nanoid"

const DocumentClient = new aws.DynamoDB.DocumentClient();

export const MarukiTable = new Table({
  name: process.env.tableName,
  partitionKey: "pk",
  sortKey: "sk",
  indexes: {
    GSI1: { partitionKey: 'gsi1pk', sortKey: 'gsi1sk' },
    GSI2: { partitionKey: 'gsi2pk', sortKey: 'gsi2sk' },
  },

  DocumentClient,
});

export const Developer = new Entity({
  name: "Developer",
  attributes: {
    id: { partitionKey: true, default: "Developer" },
    sk: { sortKey: true },

    displayName: {},
  },
  table: MarukiTable,
});

