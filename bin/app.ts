#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from 'aws-cdk-lib';
import { ApiStack } from "../lib/api-stack";
import { AuthStack } from '../lib/auth-stack';
import { DynamoDBStack } from '../lib/database-stack';

const app = new cdk.App();

new DynamoDBStack(app, 'DynamoDBStack', { env: { region: "eu-west-1" } });
new ApiStack(app, 'MovieReviewApiStack', { env: { region: "eu-west-1" } });
