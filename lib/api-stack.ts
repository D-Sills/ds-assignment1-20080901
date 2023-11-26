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
          
          // enable CORS
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
      
      const getReviewsByMovieIdAndParameterFn = new lambdanode.NodejsFunction(
        this,
        "GetReviewsByMovieIdAndParameterFunction",
        {
          architecture: lambda.Architecture.ARM_64,
          runtime: lambda.Runtime.NODEJS_16_X,
          entry: `${__dirname}/../lambdas/getReviewsByMovieIdAndParameter.ts`,
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          environment: {
            TABLE_NAME: databaseStack.movieReviewsTable.tableName,
            REGION: 'eu-west-1',
          },
        }
        );
        
        const getReviewsByReviewerFn = new lambdanode.NodejsFunction(
          this,
          "GetReviewsByReviewerFunction",
          {
            architecture: lambda.Architecture.ARM_64,
            runtime: lambda.Runtime.NODEJS_16_X,
            entry: `${__dirname}/../lambdas/getReviewsByReviewer.ts`,
            timeout: cdk.Duration.seconds(10),
            memorySize: 128,
            environment: {
              TABLE_NAME: databaseStack.movieReviewsTable.tableName,
              REGION: 'eu-west-1',
            },
          }
          );
          
        const addReviewFn = new lambdanode.NodejsFunction(
          this,
          "AddReviewFunction",
          {
            architecture: lambda.Architecture.ARM_64,
            runtime: lambda.Runtime.NODEJS_16_X,
            entry: `${__dirname}/../lambdas/addReview.ts`,
            timeout: cdk.Duration.seconds(10),
            memorySize: 128,
            environment: {
              TABLE_NAME: databaseStack.movieReviewsTable.tableName,
              REGION: 'eu-west-1',
            },
          }
          );
      
        const updateReviewFn = new lambdanode.NodejsFunction(
          this,
          "UpdateReviewFunction",
          {
            architecture: lambda.Architecture.ARM_64,
            runtime: lambda.Runtime.NODEJS_16_X,
            entry: `${__dirname}/../lambdas/updateReview.ts`,
            timeout: cdk.Duration.seconds(10),
            memorySize: 128,
            environment: {
              TABLE_NAME: databaseStack.movieReviewsTable.tableName,
              REGION: 'eu-west-1',
            },
          }
          );
      
          const moviesResource = api.root.addResource('movies');
      
          const movieAddReviewResource = moviesResource.addResource('review');
          movieAddReviewResource.addMethod('POST', new apig.LambdaIntegration(addReviewFn));
      
       // Resource for '/{movieId}/reviews'
       const movieResource = moviesResource.addResource('{movieId}');
       const movieReviewsResource = movieResource.addResource('reviews');
       movieReviewsResource.addMethod('GET', new apig.LambdaIntegration(getRevievsByMovieIdFn));
      
      
      
            // Sub-resource for reviewerName or year
      const reviewParameterResource = movieReviewsResource.addResource('{parameter}');
      reviewParameterResource.addMethod('GET', new apig.LambdaIntegration(getReviewsByMovieIdAndParameterFn));
      reviewParameterResource.addMethod('PUT', new apig.LambdaIntegration(updateReviewFn));
      
      // Resource for '/reviews/{reviewId}'
    const reviewsResource = moviesResource.addResource('reviews');
    const reviewIdResource = reviewsResource.addResource('{reviewerName}');
    reviewIdResource.addMethod('GET', new apig.LambdaIntegration(getReviewsByReviewerFn));
      
      
      // permissions
      databaseStack.movieReviewsTable.grantReadData(getRevievsByMovieIdFn);
      databaseStack.movieReviewsTable.grantReadData(getReviewsByMovieIdAndParameterFn);
      databaseStack.movieReviewsTable.grantReadData(getReviewsByReviewerFn);
      databaseStack.movieReviewsTable.grantWriteData(addReviewFn);
      databaseStack.movieReviewsTable.grantWriteData(updateReviewFn);
      }
    }
    