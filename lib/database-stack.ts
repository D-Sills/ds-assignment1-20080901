import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import { generateBatch } from "../shared/util";
import { movieReviews } from "../seed/reviews";

export class DynamoDBStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // DynamoDB table for reviews
        const movieReviewsTable = new dynamodb.Table(this, "MovieReviews", {
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            partitionKey: {
                name: "movieId",
                type: dynamodb.AttributeType.NUMBER,
            },
            sortKey: {
                name: "reviewerName",
                type: dynamodb.AttributeType.STRING,
            },
            tableName: "MovieReviews",
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        // Global Secondary Index for ReviewerId
        movieReviewsTable.addGlobalSecondaryIndex({
            indexName: "reviewerNameIndex",
            partitionKey: {
                name: "reviewerName",
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: "reviewDate",
                type: dynamodb.AttributeType.STRING,
            },
        });

        // New GSI for querying by reviewDate
        movieReviewsTable.addGlobalSecondaryIndex({
            indexName: "reviewDateIndex",
            partitionKey: {
                name: "movieId",
                type: dynamodb.AttributeType.NUMBER,
            }, // Assuming movieId as partition key
            sortKey: {
                name: "reviewDate",
                type: dynamodb.AttributeType.STRING,
            },
        });

        // Seed data
        new custom.AwsCustomResource(this, "SeedData", {
            onCreate: {
                service: "DynamoDB",
                action: "batchWriteItem",
                parameters: {
                    RequestItems: {
                        [movieReviewsTable.tableName]:
                            generateBatch(movieReviews),
                    },
                },
                physicalResourceId: custom.PhysicalResourceId.of(
                    Date.now().toString()
                ),
            },
            policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
                resources: custom.AwsCustomResourcePolicy.ANY_RESOURCE,
            }),
        });

        // Export the table ARN for cross scene access
        new cdk.CfnOutput(this, "MovieReviewsTableArnOutput", {
            value: movieReviewsTable.tableArn,
            exportName: "MovieReviewsTableArn",
        });
    }
}
