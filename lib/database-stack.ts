import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import { generateBatch } from "../shared/util";
import { movieReviews } from '../seed/reviews';
import { userData } from "../seed/users";

export class DynamoDBStack extends cdk.Stack {
    usersTable: dynamodb.Table;
    movieReviewsTable: dynamodb.Table;
    
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
    
        // DynamoDB table for reviews
   
        this.movieReviewsTable = new dynamodb.Table(this, 'MovieReviews', {
          billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
          partitionKey: { name: 'movieId', type: dynamodb.AttributeType.NUMBER },
          sortKey: { name: 'reviewerName', type: dynamodb.AttributeType.STRING },
          tableName: 'MovieReviews',
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
        
          // Global Secondary Index for ReviewerId
          this.movieReviewsTable.addGlobalSecondaryIndex({
                indexName: 'reviewerNameIndex',
            partitionKey: { name: 'reviewerName', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'reviewDate', type: dynamodb.AttributeType.STRING },
          });
          
          // New GSI for querying by reviewDate
this.movieReviewsTable.addGlobalSecondaryIndex({
  indexName: 'reviewDateIndex',
  partitionKey: { name: 'movieId', type: dynamodb.AttributeType.NUMBER }, // Assuming movieId as partition key
  sortKey: { name: 'reviewDate', type: dynamodb.AttributeType.STRING },
});
        
          // DynamoDB table for users
          this.usersTable = new dynamodb.Table(this, 'Users', {
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            tableName: 'Users',
            removalPolicy: cdk.RemovalPolicy.DESTROY,
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
