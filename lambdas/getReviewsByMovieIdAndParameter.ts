import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient, QueryCommandInput } from "@aws-sdk/client-dynamodb";
import { TranslateClient, TranslateTextCommand } from "@aws-sdk/client-translate";

const ddbDocClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.REGION }));

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    console.log("Event: ", event);
    const movieId = event.pathParameters?.movieId ? parseInt(event.pathParameters.movieId) : undefined;
    const secondParameter = event.pathParameters?.parameter; // Could be reviewerName or year
    const language = event.queryStringParameters?.language;

    if (!movieId || !secondParameter) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Missing movieId or second parameter" }),
      };
    }
    const queryParams = {
      TableName: process.env.TABLE_NAME,
      IndexName: 'reviewerNameIndex', // Query the GSI
      KeyConditionExpression: 'movieId = :movieId',
      ExpressionAttributeValues: {
        ':movieId': movieId,
        ':parameter': secondParameter,
      },
    };


    const response = await ddbDocClient.send(new QueryCommand(queryParams));
    let items = response.Items || [];
    if (/^\d{4}$/.test(secondParameter)) {
      items = items.filter(item => item.reviewDate.startsWith(secondParameter));
    }
    // Translation
    if (language && items) {
      const translateClient = new TranslateClient({ region: process.env.REGION });
      for (let item of items) {
        const translateParams = {
          SourceLanguageCode: 'en',
          TargetLanguageCode: language,
          Text: item.content,
        };
        const translationResult = await translateClient.send(new TranslateTextCommand(translateParams));
        item.content = translationResult.TranslatedText;
      }
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(items),
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


