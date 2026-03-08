import { Inject, Injectable } from '@nestjs/common';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { DYNAMODB_DOCUMENT_CLIENT } from '../../../common/dynamodb/dynamodb.module';

export interface ProductRecord {
  id: number;
  name: string;
  description: string;
  price: string;
  stock: number;
}

@Injectable()
export class ProductsDynamoRepository {
  private readonly tableName: string;

  constructor(
    @Inject(DYNAMODB_DOCUMENT_CLIENT)
    private readonly docClient: DynamoDBDocumentClient,
  ) {
    this.tableName = process.env.DYNAMO_PRODUCTS_TABLE || 'wompi-products';
  }

  async findAll(): Promise<ProductRecord[]> {
    const result = await this.docClient.send(
      new ScanCommand({ TableName: this.tableName }),
    );
    const items = (result.Items ?? []) as ProductRecord[];
    return items.sort((a, b) => a.id - b.id);
  }

  async findById(id: number): Promise<ProductRecord | null> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { id },
      }),
    );
    return (result.Item as ProductRecord) ?? null;
  }

  async save(record: ProductRecord): Promise<void> {
    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: record,
      }),
    );
  }

  async updateStock(id: number, newStock: number): Promise<void> {
    await this.docClient.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { id },
        UpdateExpression: 'SET stock = :stock',
        ExpressionAttributeValues: { ':stock': newStock },
      }),
    );
  }

  async count(): Promise<number> {
    const result = await this.docClient.send(
      new ScanCommand({
        TableName: this.tableName,
        Select: 'COUNT',
      }),
    );
    return result.Count ?? 0;
  }
}
