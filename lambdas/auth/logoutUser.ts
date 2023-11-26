import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import {
    CognitoIdentityProviderClient,
    GlobalSignOutCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({
    region: process.env.REGION,
});

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        // Extracting the Authorization header
        const authHeader = event.headers.Authorization || event.headers.authorization;

        if (!authHeader) {
            return {
                statusCode: 401,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: "Authorization header is missing",
                }),
            };
        }

        // Extracting the token from the Authorization header
        const tokenParts = authHeader.split(' ');
        if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
            return {
                statusCode: 401,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: "Invalid Authorization header format",
                }),
            };
        }
        const accessToken = tokenParts[1];

        console.log("Extracted Access Token:", accessToken);

        await cognitoClient.send(new GlobalSignOutCommand({ AccessToken: accessToken }));

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Successfully logged out" }),
        };
    } catch (error) {
        console.error("Error during logout:", error);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Logout failed", details: error.message }),
        };
    }
};
