import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDynamoDBDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    const movieId = event.pathParameters?.movieId;

    if (!movieId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid movie ID" }),
      };
    }

    const deleteParams = {
      TableName: process.env.TABLE_NAME,
      Key: {
        movieId: Number(movieId),
      },
    };

    await ddbDocClient.send(new DeleteCommand(deleteParams));

    return {
      statusCode: 204,
    };
  } catch (error: any) {
    console.error(JSON.stringify(error));
    return {
      statusCode: 500,
      body: JSON.stringify({ error }),
    };
  }
};

function createDynamoDBDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const translateConfig = {
    marshallOptions: {
      convertEmptyValues: true,
      removeUndefinedValues: true,
      convertClassInstanceToMap: true,
    },
    unmarshallOptions: {
      wrapNumbers: false,
    },
  };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}
