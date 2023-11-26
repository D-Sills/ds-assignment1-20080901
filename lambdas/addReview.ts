import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import Ajv from "ajv";
import schema from "../shared/types.schema.json";
import { MovieReview } from "../shared/types";

const ajv = new Ajv();
const isValidBodyParams = ajv.compile(schema.definitions["MovieReview"] || {});

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    // Parse request body
    const reviewData: MovieReview = event.body ? JSON.parse(event.body) : undefined;

    if (!reviewData) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Missing review data" }),
      };
    }

    // Basic input validation
    if (!isValidBodyParams(reviewData)) {
        return {
          statusCode: 500,
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            message: `Incorrect type. Must match MovieReview schema`,
            schema: schema.definitions["MovieReview"],
          }),
        };
      }

    // Prepare item for DynamoDB
    const reviewItem = {
      movieId: reviewData.movieId,
      reviewDate: reviewData.reviewDate, // Ensure this is in a valid format for a sort key
      reviewerName: reviewData.reviewerName,
      content: reviewData.content,
      // Include any other fields as needed
    };

    // Insert review into DynamoDB
    await ddbDocClient.send(new PutCommand({
      TableName: process.env.TABLE_NAME,
      Item: reviewItem
    }));

    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Review added successfully" }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};

function createDDbDocClient() {
    const ddbClient = new DynamoDBClient({ region: process.env.REGION });
    const marshallOptions = {
      convertEmptyValues: true,
      removeUndefinedValues: true,
      convertClassInstanceToMap: true,
    };
    const unmarshallOptions = {
      wrapNumbers: false,
    };
    const translateConfig = { marshallOptions, unmarshallOptions };
    return DynamoDBDocumentClient.from(ddbClient, translateConfig);
  }