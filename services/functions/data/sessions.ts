import aws from "aws-sdk"
import { Entity, Table } from "dynamodb-toolbox"
import dayjs from "dayjs"
const DocumentClient = new aws.DynamoDB.DocumentClient()

export const SessionTable = new Table({
    name: process.env.sessionTableName ?? "NO TABLE FOUND IN ENVIRONMENT!",
    partitionKey: "pk",
    sortKey: "sk",
    indexes: {
      GSI1: { partitionKey: 'gsi1pk', sortKey: 'gsi1sk' },
    },
  
    DocumentClient,
});

export const Session = new Entity({
    name: "Session",
    timestamps: true,
    attributes: {

      sessionID: { 
        partitionKey: true, 
        prefix: "Session|" 
      },
      
      principalID: { sortKey: true },
  
      expiry: {
        default: () => {dayjs().add(1, "hour").unix}
      },

      authorizationMechanism: {
        type: "string",
        required: true,
      },

      authorizationOrigin: {
        type: "string",
        required: true,
      },

      gsipk: {
        hidden: true,
        prefix: "Principal|",
        default: (data: {principalID: string;}) =>
            {return `${data.principalID}`}
      },

      gsi1sk: {
        hidden: true,
        prefix: "Session|",
        default: (data: {sessionID: string;}) =>
            {return `${data.sessionID}`}
      },
    },

    table: SessionTable,
  });