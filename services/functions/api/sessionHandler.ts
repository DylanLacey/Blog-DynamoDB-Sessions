import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { ulid } from "ulid"
import { Session } from "../data/sessions" 

export const create_session: APIGatewayProxyHandlerV2 = async (event, context) => {
    let newSessionDetails ={
        sessionID: ulid(),
        // principalId: event.pathParameters.username,
        principalID: event.requestContext.authorizer.lambda.principalID,
        authorizationMechanism: "APIKey",
        authorizationOrigin: event.requestContext.http.sourceIp,
    }

    try {
        Session.put(newSessionDetails)
    } catch (e) {
        return {
            statusCode: 422, // Couldn't return a session for some reason
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({error_message: "Sorry, couldn't create a session for you."})
        }
    }

    return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({sessionKey: newSessionDetails.sessionID})
    }
}

