import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import * as apig from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as cognito from "aws-cdk-lib/aws-cognito";

export class ApiStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Import the table ARN and create a reference to the DynamoDB table
        const movieReviewsTableArn = cdk.Fn.importValue("MovieReviewsTableArn");
        const movieReviewsTable = dynamodb.Table.fromTableArn(
            this,
            "ImportedTable",
            movieReviewsTableArn
        );

        // Import the Cognito User Pool details
        const userPoolId = cdk.Fn.importValue("UserPoolId");
        const userPoolClientId = cdk.Fn.importValue("UserPoolClientId");
        const userPool = cognito.UserPool.fromUserPoolId(
            this,
            "ImportedUserPool",
            userPoolId
        );

        // REST API
        const api = new apig.RestApi(this, "MovieReviewsApi", {
            restApiName: "Movie Reviews Service",
            description: "This service serves movie reviews.",
            deployOptions: {
                stageName: "dev",
            },

            // enable CORS
            defaultCorsPreflightOptions: {
                allowHeaders: ["Content-Type", "X-Amz-Date"],
                allowMethods: [
                    "OPTIONS",
                    "GET",
                    "POST",
                    "PUT",
                    "PATCH",
                    "DELETE",
                ],
                allowCredentials: true,
                allowOrigins: ["*"],
            },
        });

        // Create Cognito Authorizer
        const authorizer = new apig.CognitoUserPoolsAuthorizer(
            this,
            "CognitoAuthorizer",
            {
                cognitoUserPools: [userPool],
            }
        );

        // Helper to create an IAM role for Lambda functions
        const lambdaRole = new iam.Role(this, "LambdaRole", {
            assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
        });
        lambdaRole.addToPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    "translate:TranslateText", // probablt can do this better? idk, was giving me access errors if i don't do thiis
                    "dynamodb:GetItem",
                    "dynamodb:Query",
                    "dynamodb:Scan",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem",
                ],
                resources: [
                    movieReviewsTableArn,
                    `${movieReviewsTableArn}/index/*`,
                    "*",
                ], // Access to DynamoDB and Translate
            })
        );
        lambdaRole.addManagedPolicy(
            iam.ManagedPolicy.fromAwsManagedPolicyName(
                "service-role/AWSLambdaBasicExecutionRole"
            )
        );

        // Functions
        // GET /movies/{movieId}/reviews
        const getRevievsByMovieIdFn = this.createNodeJsFunction(
            "GetReviewsByMovieIdFunction",
            "../lambdas/getReviewsByMovieId.ts",
            movieReviewsTable,
            lambdaRole
        );
        // GET /movies/{movieId}/reviews/{parameter}
        const getReviewsByMovieIdAndParameterFn = this.createNodeJsFunction(
            "GetReviewsByMovieIdAndParameterFunction",
            "../lambdas/getReviewsByMovieIdAndParameter.ts",
            movieReviewsTable,
            lambdaRole
        );
        // GET /movies/reviews/{reviewerName}
        const getReviewsByReviewerFn = this.createNodeJsFunction(
            "GetReviewsByReviewerFunction",
            "../lambdas/getReviewsByReviewer.ts",
            movieReviewsTable,
            lambdaRole
        );
        // POST /movies/review - requires authentication
        const addReviewFn = this.createNodeJsFunction(
            "AddReviewFunction",
            "../lambdas/addReview.ts",
            movieReviewsTable,
            lambdaRole
        );
        // PUT /movies/{movieId}/reviews/{reviewerName} - requires authentication
        const updateReviewFn = this.createNodeJsFunction(
            "UpdateReviewFunction",
            "../lambdas/updateReview.ts",
            movieReviewsTable,
            lambdaRole
        );
        // POST /auth/register
        const registerUserFn = this.createNodeJsFunction(
            "RegisterUserFunction",
            "../lambdas/auth/registerUser.ts",
            movieReviewsTable,
            lambdaRole,
            {
                USER_POOL_ID: userPoolId,
                USER_POOL_CLIENT_ID: userPoolClientId,
            }
        );
        // POST /auth/confirm
        const confirmRegisterUserFn = this.createNodeJsFunction(
            "ConfirmRegisterUserFunction",
            "../lambdas/auth/confirmRegisterUser.ts",
            movieReviewsTable,
            lambdaRole,
            {
                USER_POOL_ID: userPoolId,
                USER_POOL_CLIENT_ID: userPoolClientId,
            }
        );
        // POST /auth/login
        const loginUserFn = this.createNodeJsFunction(
            "LoginUserFunction",
            "../lambdas/auth/loginUser.ts",
            movieReviewsTable,
            lambdaRole,
            {
                USER_POOL_ID: userPoolId,
                USER_POOL_CLIENT_ID: userPoolClientId,
            }
        );
        // POST /auth/logout
        const logoutUserFn = this.createNodeJsFunction(
            "LogoutUserFunction",
            "../lambdas/auth/logoutUser.ts",
            movieReviewsTable,
            lambdaRole,
            {
                USER_POOL_ID: userPoolId,
                USER_POOL_CLIENT_ID: userPoolClientId,
            }
        );

        // Create API resources
        const moviesResource = api.root.addResource("movies");

        const movieAddReviewResource = moviesResource.addResource("review");
        movieAddReviewResource.addMethod(
            "POST",
            new apig.LambdaIntegration(addReviewFn),
            {
                authorizer: authorizer,
                authorizationType: apig.AuthorizationType.COGNITO,
            }
        );

        // Resource for '/{movieId}/reviews'
        const movieResource = moviesResource.addResource("{movieId}");
        const movieReviewsResource = movieResource.addResource("reviews");
        movieReviewsResource.addMethod(
            "GET",
            new apig.LambdaIntegration(getRevievsByMovieIdFn)
        );

        // Sub-resource for reviewerName or year
        const reviewParameterResource =
            movieReviewsResource.addResource("{parameter}");
        reviewParameterResource.addMethod(
            "GET",
            new apig.LambdaIntegration(getReviewsByMovieIdAndParameterFn)
        );
        reviewParameterResource.addMethod(
            "PUT",
            new apig.LambdaIntegration(updateReviewFn),
            {
                authorizer: authorizer,
                authorizationType: apig.AuthorizationType.COGNITO,
            }
        );

        // Resource for '/reviews/{reviewId}'
        const reviewsResource = moviesResource.addResource("reviews");
        const reviewIdResource = reviewsResource.addResource("{reviewerName}");
        reviewIdResource.addMethod(
            "GET",
            new apig.LambdaIntegration(getReviewsByReviewerFn)
        );

        // Resource for authenication
        const authEndpoint = api.root.addResource("auth");
        const registerEndpoint = authEndpoint.addResource("register");
        registerEndpoint.addMethod(
            "POST",
            new apig.LambdaIntegration(registerUserFn)
        );

        const confirmRegisterEndpoint = authEndpoint.addResource("confirm");
        confirmRegisterEndpoint.addMethod(
            "POST",
            new apig.LambdaIntegration(confirmRegisterUserFn)
        );

        const loginEndpoint = authEndpoint.addResource("login");
        loginEndpoint.addMethod(
            "POST",
            new apig.LambdaIntegration(loginUserFn)
        );

        const logoutEndpoint = authEndpoint.addResource("logout");
        logoutEndpoint.addMethod(
            "POST",
            new apig.LambdaIntegration(logoutUserFn),
            {
                authorizer: authorizer,
                authorizationType: apig.AuthorizationType.COGNITO,
            }
        );

        // permissions for the database
        movieReviewsTable.grantReadData(getRevievsByMovieIdFn);
        movieReviewsTable.grantReadData(getReviewsByMovieIdAndParameterFn);
        movieReviewsTable.grantReadData(getReviewsByReviewerFn);
        movieReviewsTable.grantWriteData(addReviewFn);
        movieReviewsTable.grantWriteData(updateReviewFn);
    }

    private createNodeJsFunction(
        functionId: string,
        entryPath: string,
        table: dynamodb.ITable,
        role: iam.Role,
        additionalEnv?: { [key: string]: string }
    ): lambdanode.NodejsFunction {
        return new lambdanode.NodejsFunction(this, functionId, {
            architecture: lambda.Architecture.ARM_64,
            runtime: lambda.Runtime.NODEJS_16_X,
            entry: `${__dirname}/${entryPath}`,
            timeout: cdk.Duration.seconds(10),
            memorySize: 128,
            environment: {
                TABLE_NAME: table.tableName,
                REGION: "eu-west-1",
                ...additionalEnv,
            },
            role: role,
        });
    }
}
