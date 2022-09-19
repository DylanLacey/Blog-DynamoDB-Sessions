import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { User, createUser, findUser } from "./users"

export const create_user: APIGatewayProxyHandlerV2 = async (event) => {
  console.log("Creating user")
  let params = event.queryStringParameters ?? {}
  
  const userDetails = {
    displayName: params.displayName,
    username: params.username,
    desiredPassword: params.pw
  };

  let newUserDetails = await createUser(userDetails)

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newUserDetails)
  };
};

export const get_user: APIGatewayProxyHandlerV2 = async (event) => {
  const queriedId = event?.pathParameters?.id ?? "FAKE"
  // const developerDetails = await User.get({pk: queriedId, sk: "UserDetails"});
  const developerDetails = await findUser(queriedId)

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(developerDetails.Items[0]),
  };
};