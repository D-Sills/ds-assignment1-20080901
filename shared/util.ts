import { marshall } from "@aws-sdk/util-dynamodb";
import { User, MovieReview } from './types';

type Entity = User | MovieReview;
export const generateItem = (entity: Entity) => {
  return {
    PutRequest: {
      Item: marshall(entity),
    },
  };
};

export const generateBatch = (data: Entity[]) => {
  return data.map((e) => {
    return generateItem(e);
  });
};
