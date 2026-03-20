import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import type { NativeAttributeValue } from '@aws-sdk/util-dynamodb';

export const TABLE_NAMES = {
  PLAYERS: process.env.STREAKS_PLAYERS_TABLE || 'streaks-players',
  ACTIVITY: process.env.STREAKS_ACTIVITY_TABLE || 'streaks-activity',
  REWARDS: process.env.STREAKS_REWARDS_TABLE || 'streaks-rewards',
  FREEZE_HISTORY: process.env.STREAKS_FREEZE_HISTORY_TABLE || 'streaks-freeze-history',
} as const;

@Injectable()
export class DynamoService implements OnModuleInit {
  private readonly logger = new Logger(DynamoService.name);
  private docClient!: DynamoDBDocumentClient;

  onModuleInit() {
    const clientConfig: ConstructorParameters<typeof DynamoDBClient>[0] = {
      region: process.env.AWS_REGION || 'us-east-1',
    };

    if (process.env.DYNAMODB_ENDPOINT) {
      clientConfig.endpoint = process.env.DYNAMODB_ENDPOINT;
      clientConfig.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'local',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'local',
      };
    }

    const ddbClient = new DynamoDBClient(clientConfig);
    this.docClient = DynamoDBDocumentClient.from(ddbClient, {
      marshallOptions: { removeUndefinedValues: true },
    });

    this.logger.log(
      `DynamoDB client initialized (endpoint: ${process.env.DYNAMODB_ENDPOINT || 'AWS default'})`,
    );
  }

  async get(
    tableName: string,
    key: Record<string, NativeAttributeValue>,
  ): Promise<Record<string, NativeAttributeValue> | null> {
    const result = await this.docClient.send(
      new GetCommand({ TableName: tableName, Key: key }),
    );
    return (result.Item as Record<string, NativeAttributeValue>) ?? null;
  }

  async put(
    tableName: string,
    item: Record<string, NativeAttributeValue>,
  ): Promise<void> {
    await this.docClient.send(
      new PutCommand({ TableName: tableName, Item: item }),
    );
  }

  async query(
    tableName: string,
    keyCondition: string,
    expressionValues: Record<string, NativeAttributeValue>,
    options: {
      scanIndexForward?: boolean;
      limit?: number;
      indexName?: string;
      expressionNames?: Record<string, string>;
      filterExpression?: string;
    } = {},
  ): Promise<Record<string, NativeAttributeValue>[]> {
    const params: ConstructorParameters<typeof QueryCommand>[0] = {
      TableName: tableName,
      KeyConditionExpression: keyCondition,
      ExpressionAttributeValues: expressionValues,
      ScanIndexForward: options.scanIndexForward ?? true,
      ...(options.limit && { Limit: options.limit }),
      ...(options.indexName && { IndexName: options.indexName }),
      ...(options.expressionNames && {
        ExpressionAttributeNames: options.expressionNames,
      }),
      ...(options.filterExpression && {
        FilterExpression: options.filterExpression,
      }),
    };

    const result = await this.docClient.send(new QueryCommand(params));
    return (result.Items as Record<string, NativeAttributeValue>[]) ?? [];
  }

  async scan(
    tableName: string,
    options: {
      filterExpression?: string;
      expressionValues?: Record<string, NativeAttributeValue>;
      expressionNames?: Record<string, string>;
      limit?: number;
    } = {},
  ): Promise<Record<string, NativeAttributeValue>[]> {
    const allItems: Record<string, NativeAttributeValue>[] = [];
    let lastKey: Record<string, NativeAttributeValue> | undefined;

    do {
      const params: ConstructorParameters<typeof ScanCommand>[0] = {
        TableName: tableName,
        ...(options.filterExpression && {
          FilterExpression: options.filterExpression,
        }),
        ...(options.expressionValues && {
          ExpressionAttributeValues: options.expressionValues,
        }),
        ...(options.expressionNames && {
          ExpressionAttributeNames: options.expressionNames,
        }),
        ...(lastKey && { ExclusiveStartKey: lastKey }),
      };

      const result = await this.docClient.send(new ScanCommand(params));
      const items =
        (result.Items as Record<string, NativeAttributeValue>[]) ?? [];
      allItems.push(...items);
      lastKey = result.LastEvaluatedKey as
        | Record<string, NativeAttributeValue>
        | undefined;

      if (options.limit && allItems.length >= options.limit) {
        return allItems.slice(0, options.limit);
      }
    } while (lastKey);

    return allItems;
  }

  async update(
    tableName: string,
    key: Record<string, NativeAttributeValue>,
    updates: Record<string, NativeAttributeValue>,
  ): Promise<void> {
    const expressions: string[] = [];
    const names: Record<string, string> = {};
    const values: Record<string, NativeAttributeValue> = {};

    Object.entries(updates).forEach(([field, value], i) => {
      expressions.push(`#k${i} = :v${i}`);
      names[`#k${i}`] = field;
      values[`:v${i}`] = value;
    });

    await this.docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: key,
        UpdateExpression: `SET ${expressions.join(', ')}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
      }),
    );
  }

  async delete(
    tableName: string,
    key: Record<string, NativeAttributeValue>,
  ): Promise<void> {
    await this.docClient.send(
      new DeleteCommand({ TableName: tableName, Key: key }),
    );
  }

  async batchWrite(
    tableName: string,
    items: Record<string, NativeAttributeValue>[],
  ): Promise<void> {
    const BATCH_SIZE = 25;
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      await this.docClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [tableName]: batch.map((item) => ({
              PutRequest: { Item: item },
            })),
          },
        }),
      );
    }
  }
}
