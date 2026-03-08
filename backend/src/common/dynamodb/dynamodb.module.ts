import { Global, Module } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

export const DYNAMODB_CLIENT = 'DYNAMODB_CLIENT';
export const DYNAMODB_DOCUMENT_CLIENT = 'DYNAMODB_DOCUMENT_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: DYNAMODB_CLIENT,
      useFactory: () => {
        const region = process.env.DYNAMODB_REGION || process.env.AWS_REGION || 'us-east-2';
        const endpoint = process.env.DYNAMODB_ENDPOINT;
        return new DynamoDBClient(
          endpoint ? { region, endpoint } : { region },
        );
      },
    },
    {
      provide: DYNAMODB_DOCUMENT_CLIENT,
      useFactory: (client: DynamoDBClient) => {
        return DynamoDBDocumentClient.from(client);
      },
      inject: [DYNAMODB_CLIENT],
    },
  ],
  exports: [DYNAMODB_CLIENT, DYNAMODB_DOCUMENT_CLIENT],
})
export class DynamoDbModule {}
