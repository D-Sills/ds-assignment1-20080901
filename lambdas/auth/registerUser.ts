import { APIGatewayProxyHandlerV2 } from "aws-lambda/trigger/api-gateway-proxy";
import {
    CognitoIdentityProviderClient,
    SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const cognitoIdentityServiceProvider = new CognitoIdentityProviderClient({
    region: process.env.REGION,
});

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        const userData = event.body ? JSON.parse(event.body) : undefined;

        if (
            !userData ||
            !userData.username ||
            !userData.password ||
            !userData.email
        ) {
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: "Missing user registration data",
                }),
            };
        }
        const params = {
            ClientId: process.env.USER_POOL_CLIENT_ID,
            Username: userData.email, // Use email as the username
            Password: userData.password,
            DisplayName: userData.username,
            UserAttributes: [
                {
                    Name: "email",
                    Value: userData.email,
                },
            ],
        };
        await cognitoIdentityServiceProvider.send(new SignUpCommand(params));

        return {
            statusCode: 201,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "User registered successfully" }),
        };
    } catch (error) {
        console.error(error);
        let errorMessage = "Internal Server Error";
        if (error) {
            errorMessage = error.message;
        }
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: errorMessage }),
        };
    }
};
