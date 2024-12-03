import { Construct } from 'constructs';
import { RemovalPolicy } from 'aws-cdk-lib';
import {
    AttributeType,
    BillingMode,
    Table,
    StreamViewType
} from 'aws-cdk-lib/aws-dynamodb';

import { TableProps } from './types/db';

export function createDynamoDbTable( scope: Construct, props: TableProps ): Table
{
    const table: Table = new Table( scope, props.tableName, {
        tableName: props.tableName,
        removalPolicy: RemovalPolicy.DESTROY,
        
        partitionKey: {
            name: 'id',
            type: AttributeType.STRING
        },
        billingMode: BillingMode.PAY_PER_REQUEST,
        timeToLiveAttribute: 'TTL',
        stream: StreamViewType.NEW_AND_OLD_IMAGES
    });
    
    return table;
}
