#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ApiStack } from "../lib/api-stack";
import { AuthStack } from "../lib/auth-stack";
import { DynamoDBStack } from "../lib/database-stack";

const app = new cdk.App();

const dbStack = new DynamoDBStack(app, "MovieReviewDatabaseStack", {
    env: { region: "eu-west-1" },
});

const authStack = new AuthStack(app, "MovieReviewAuthStack", {
    env: { region: "eu-west-1" },
});

const apiStack = new ApiStack(app, "MovieReviewApiStack", {
    env: { region: "eu-west-1" },
});

apiStack.addDependency(dbStack);
apiStack.addDependency(authStack);

app.synth();
