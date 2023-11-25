#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from 'aws-cdk-lib';
import { Construct } from "constructs";
import { ApiStack } from "../lib/api-stack";
import { AuthStack } from '../lib/auth-stack';
import { DynamoDBStack } from '../lib/database-stack';

class App extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
      super(scope, id, props);
      
      
      
      // Create the Auth stack for user authentication
      new AuthStack(this, 'AuthenticationStack');
      
      // Create the main API stack
      new ApiStack(this, 'RestAPIStack', {
        
      });
    }
}

const app = new cdk.App();
new DynamoDBStack(app, 'MovieReviewApiStack');

//new RestAPIStack(app, "RestAPIStack", { env: { region: "eu-west-1" } });
