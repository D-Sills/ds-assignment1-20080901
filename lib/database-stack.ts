import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import { generateBatch } from "../shared/util";
import { movieReviews } from '../seed/reviews';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { userData } from "../seed/users";

export class DynamoDBStack extends cdk.Stack {
    usersTable: dynamodb.Table;
    movieReviewsTable: dynamodb.Table;
    
    addReviewFn: NodejsFunction;
    updateReviewFn: NodejsFunction;
    getRevievsByMovieIdFn: NodejsFunction;
    getReviewsByUserIdFn: NodejsFunction;
    getReviewsByMovieIdAndUserIdFn: NodejsFunction;
    getReviewsByMovieIdAndUserIdFnTrans: NodejsFunction;
    getReviewsByMovieIdAndYearFn: NodejsFunction;
    getReviewsByMovieIdAndRatingFn: NodejsFunction;
    
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
    
        // DynamoDB table for reviews
         this.movieReviewsTable = new dynamodb.Table(this, 'MovieReviews', {
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            partitionKey: { name: 'movieId', type: dynamodb.AttributeType.NUMBER },
            sortKey: { name: 'reviewDate', type: dynamodb.AttributeType.STRING },
            tableName: 'MovieReviews',
            removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production code
          });
        
          // Global Secondary Index for ReviewerId
          this.movieReviewsTable.addGlobalSecondaryIndex({
            indexName: 'reviewerIndex',
            partitionKey: { name: 'reviewerId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'reviewDate', type: dynamodb.AttributeType.STRING },
          });
        
          // DynamoDB table for users
          this.usersTable = new dynamodb.Table(this, 'Users', {
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            tableName: 'Users',
            removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production code
          });
    
            // Seed data
          new custom.AwsCustomResource(this, 'SeedData', {
            onCreate: {
              service: "DynamoDB",
              action: "batchWriteItem",
              parameters: {
                RequestItems: {
                  [this.movieReviewsTable.tableName]: generateBatch(movieReviews),
                  [this.usersTable.tableName]: generateBatch(userData),
                },
              },
                physicalResourceId: custom.PhysicalResourceId.of(Date.now().toString()),
            },
            policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
              resources: custom.AwsCustomResourcePolicy.ANY_RESOURCE,
            }),
            
          });
    }
}
