import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDynamoDBDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("Event: ", event);
    const parameters = event?.pathParameters;
    const movieId = parameters?.movieId ? parseInt(parameters.movieId) : undefined;
    const includeCast = event.queryStringParameters?.cast === "true";

    if (!movieId) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Missing movie Id" }),
      };
    }

    const movieParams = {
      TableName: process.env.MOVIE_TABLE_NAME,
      Key: { movieId: movieId },
    };

    const movieResponse = await ddbDocClient.send(new GetCommand(movieParams));
    if (!movieResponse.Item) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Invalid movie Id" }),
      };
    }

    if (includeCast) {
      const castParams = {
        TableName: process.env.MOVIE_CAST_TABLE_NAME,
        Key: { movieId: movieId },
      };
      const castResponse = await ddbDocClient.send(new GetCommand(castParams));
      if (castResponse.Item) {
        movieResponse.Item["cast"] = castResponse.Item;
      }
    }

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(movieResponse.Item),
    };
  } catch (error: any) {
    console.log(JSON.stringify(error));
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
      },
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

