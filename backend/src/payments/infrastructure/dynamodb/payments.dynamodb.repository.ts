import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { DYNAMODB_DOCUMENT_CLIENT } from '../../../common/dynamodb/dynamodb.module';
import { PaymentStatus } from '../../domain/payment-status.enum';

export interface PaymentRecord {
  id: string;
  productId: number;
  units: number;
  totalAmount: string;
  status: PaymentStatus;
  customerName: string;
  customerEmail: string;
  deliveryAddress: string;
  wompiTransactionId?: string | null;
  /** Timestamp in milliseconds (epoch). */
  createdAt: number;
}

@Injectable()
export class PaymentsDynamoRepository {
  private readonly tableName: string;

  constructor(
    @Inject(DYNAMODB_DOCUMENT_CLIENT)
    private readonly docClient: DynamoDBDocumentClient,
  ) {
    this.tableName = process.env.DYNAMO_PAYMENTS_TABLE || 'wompi-payments';
  }

  async create(data: {
    productId: number;
    units: number;
    totalAmount: number;
    status: PaymentStatus;
    customerName: string;
    customerEmail: string;
    deliveryAddress: string;
  }): Promise<PaymentRecord> {
    const id = randomUUID();
    const createdAt = Date.now();
    const record: PaymentRecord = {
      id,
      productId: data.productId,
      units: data.units,
      totalAmount: String(data.totalAmount),
      status: data.status,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      deliveryAddress: data.deliveryAddress,
      wompiTransactionId: null,
      createdAt,
    };

    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: record,
      }),
    );

    return record;
  }

  async findById(id: string): Promise<PaymentRecord | null> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { id },
      }),
    );
    return (result.Item as PaymentRecord) ?? null;
  }

  async updateStatus(id: string, status: PaymentStatus): Promise<void> {
    await this.docClient.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { id },
        UpdateExpression: 'SET #status = :status',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':status': status },
      }),
    );
  }

  async updateWompiTransactionId(id: string, wompiTransactionId: string): Promise<void> {
    await this.docClient.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { id },
        UpdateExpression: 'SET wompiTransactionId = :wompiId',
        ExpressionAttributeValues: { ':wompiId': wompiTransactionId },
      }),
    );
  }
}
