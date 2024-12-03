import { Construct } from 'constructs';

import { Alarm, Metric, Statistic, Unit, ComparisonOperator } from 'aws-cdk-lib/aws-cloudwatch';
import { SnsAction } from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Topic, Subscription, SubscriptionProtocol } from 'aws-cdk-lib/aws-sns';

import { AlarmProps } from './types/message';

export function createDaynamoDbAlarm( scope: Construct, props: AlarmProps ): Topic
{
    const topic = new Topic( scope, 'DaynamoDbAlarmTopic' );
    const snsAction = new SnsAction( topic );
        
    const alarm = new Alarm( scope, 'DaynamoDbRecordsCountAlarm', {
        metric: new Metric({
            //metricName: 'ThrottledPutRecordCount',
            metricName: 'ReturnedItemCount',
            namespace: 'AWS/DynamoDB',
            //statistic: Statistic.SAMPLE_COUNT,
            //statistic: Statistic.MINIMUM,
            statistic: Statistic.MAXIMUM,
            unit: Unit.COUNT,
        }),
        threshold: 10,
        evaluationPeriods: 10,
        comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
        alarmDescription: 'DO NOT EDIT OR DELETE. It\'s created by AWS CDK'
    });
    
    new Subscription( scope, 'DaynamoDbAlarmSubscription', {
        topic: topic,
        protocol: SubscriptionProtocol.EMAIL,
        endpoint: 'i.atanasov77@gmail.com'
    });
    
    alarm.addAlarmAction({
        bind( scope, alarm ) {
            return snsAction.bind( scope, alarm );
        }
    });
    
    return topic;
}
