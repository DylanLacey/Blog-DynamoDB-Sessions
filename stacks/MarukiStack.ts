import {
  StackContext,
  Table,
  Api,
  ViteStaticSite,
  Function,
  Config,
} from "@serverless-stack/resources";
import { Stage } from "aws-cdk-lib/aws-apigateway";
import { aws_apigateway } from "aws-cdk-lib"

// import { Canary } from "aws-cdk-lib/aws-apigateway/Cfn" 

export function MarukiStack({ stack }: StackContext) {
  const PEPPER = new Config.Secret(stack, "SPICE");

  const marukiDataTable = new Table(stack, "MarukiTable", {
    fields: {
      pk: "string",
      sk: "string",
      gsi1pk: "string",
      gsi1sk: "string",
      gsi2pk: "string",
      gsi2sk: "string"
    },
    primaryIndex: { partitionKey: "pk", sortKey: "sk" },
    globalIndexes: {
      GSI1: { partitionKey: "gsi1pk", sortKey: "gsi1sk"},
      GSI2: { partitionKey: "gsi2pk", sortKey: "gsi2sk"},
    },
  });

  stack.setDefaultFunctionProps({
    runtime: "nodejs16.x"
  })

  const marukiSessionTable = new Table(stack, "MarukiSessionTable", {
    fields: {
      pk: "string",
      sk: "string",
      gsi1pk: "string",
      gsi1sk: "string",
      ttl: "number",
    },
    primaryIndex: { partitionKey: "pk", sortKey: "sk" },
    globalIndexes: {
      GSI1: { partitionKey: "gsi1pk", sortKey: "gsi1sk"},
    },
    timeToLiveAttribute: "expiry",
  });

  const newSessionAuthFunction = new Function(stack, "NewSessionAuthorizer", {
    handler: "functions/api/newSessionAuthorizer.doAuth",
    permissions: [marukiDataTable, marukiSessionTable],
    environment: {
      tableName: marukiDataTable.tableName,
      sessionTableName: marukiSessionTable.tableName,
      SPICE: "SomeVeryLongStringWeUseToPepperPasswords"
    }
  });

  const existingSessionValidatorFunction = new Function(stack, 
    "ExistingSessionValidatorFunction", {
    handler: "functions/api/existingSessionValidator.validate",
    permissions: [marukiDataTable, marukiSessionTable],
    environment: {
      tableName: marukiDataTable.tableName,
      sessionTableName: marukiSessionTable.tableName,
    }
  });

  const api = new Api(stack, "MarukiApi", {
    authorizers: {
      newSessionAuthorizer: {
        type: "lambda",
        function: newSessionAuthFunction,
        resultsCacheTtl: "1 seconds",
        identitySource: ["$request.header.Authorization", "$context.path"]
      },
      existingSessionAuthorizer: {
        type: "lambda",
        function: existingSessionValidatorFunction,
        resultsCacheTtl: "1 seconds",
      }
    },
    defaults: {
      function: {
        permissions: [marukiDataTable],
        environment: {
          tableName: marukiDataTable.tableName,
          sessionTableName: marukiSessionTable.tableName
        },
      },
    },
    routes: {
      "POST /api/authorize/{username}": {
        function: {
          handler: "functions/api/sessionHandler.create_session", 
          permissions: [marukiSessionTable],
          config: [PEPPER],
        },
        authorizer: "newSessionAuthorizer"
      },

      "POST /user": {
        function: {
          handler: "functions/users/handler.create_user",
          config: [PEPPER],
        }
      },

      "GET /user/{id}": { 
        function: "functions/users/handler.get_user",
        authorizer: "existingSessionAuthorizer"
      },


    },
  });
  

  // const site = new ViteStaticSite(stack, "MarukiSite", {
  //   path: "frontend",
  //   environment: {
  //     VITE_APP_API_URL: api.url,
  //     production: "false",
  //     tableName: marukiDataTable.tableName,
  //     sessionTableName: marukiSessionTable.tableName
  //   },
  // });



  // stack.addOutputs({
  //   SiteUrl: site.url,
  //   ApiEndpoint: api.url,
  // });
}
