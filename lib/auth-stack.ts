import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";

export class AuthStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const userPool = new cognito.UserPool(this, "UserPool", {
            selfSignUpEnabled: true,
            autoVerify: { email: true },
            signInAliases: { email: true },
            passwordPolicy: {
                requireDigits: false,
                requireLowercase: false,
                requireSymbols: false,
                requireUppercase: false,
            },
            standardAttributes: {
                email: {
                    required: true,
                    mutable: true,
                },
            },
        });

        const userPoolClient = new cognito.UserPoolClient(
            this,
            "UserPoolClient",
            {
                userPool: userPool,
                authFlows: {
                    userPassword: true,
                    userSrp: true,
                },
            }
        );

        new cdk.CfnOutput(this, "UserPoolId", {
            value: userPool.userPoolId,
            exportName: "UserPoolId",
        });

        new cdk.CfnOutput(this, "UserPoolClientId", {
            value: userPoolClient.userPoolClientId,
            exportName: "UserPoolClientId",
        });
    }
}
