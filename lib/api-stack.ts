import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import * as apig from "aws-cdk-lib/aws-apigateway";
import { generateBatch } from "../shared/util";
import { userData } from "../seed/users";
import { movieReviews } from "../seed/reviews";
import { DynamoDBStack } from "./database-stack";

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
      // Create the DynamoDB stack
      const databaseStack = new DynamoDBStack(this, "DatabaseStack");
    
        // REST API 
        const api = new apig.RestApi(this, "MovieReviewsApi", {
          restApiName: 'Movie Reviews Service',
          description: 'This service serves movie reviews.',
          deployOptions: {
            stageName: 'dev',
          },
          
          // 👇 enable CORS
          defaultCorsPreflightOptions: {
            allowHeaders: ["Content-Type", "X-Amz-Date"],
            allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
            allowCredentials: true,
            allowOrigins: ["*"],
          },
        });

    // Functions 
    const getRevievsByMovieIdFn  = new lambdanode.NodejsFunction(
      this,
      "GetReviewsByMovieIdFunction",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambdas/getReviewsByMovieId.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: databaseStack.movieReviewsTable.tableName,
          REGION: 'eu-west-1',
        },
      }
      );
      
       // Resource for '/{movieId}/reviews'
       const movieResource = api.root.addResource('{movieId}');
       const movieReviewsResource = movieResource.addResource('reviews');
       movieReviewsResource.addMethod('GET', new apig.LambdaIntegration(getRevievsByMovieIdFn));

      
      
      databaseStack.movieReviewsTable.grantReadData(getRevievsByMovieIdFn);
      }
    }
    