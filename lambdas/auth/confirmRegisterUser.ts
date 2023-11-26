import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import {
    CognitoIdentityProviderClient,
    ConfirmSignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({
    region: process.env.REGION,
});

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        const confirmationData = event.body
            ? JSON.parse(event.body)
            : undefined;

        if (
            !confirmationData ||
            !confirmationData.email ||
            !confirmationData.code
        ) {
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: "Missing username or verification code",
                }),
            };
        }

        await cognitoClient.send(
            new ConfirmSignUpCommand({
                ClientId: process.env.USER_POOL_CLIENT_ID,
                Username: confirmationData.email,
                ConfirmationCode: confirmationData.code,
            })
        );

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "User confirmed successfully" }),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Confirmation failed" }),
        };
    }
};
