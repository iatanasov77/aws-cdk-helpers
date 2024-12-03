import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { Runtime, Architecture } from 'aws-cdk-lib/aws-lambda';
import { Duration } from 'aws-cdk-lib';

interface BaseFunctionProps
{
    tableName: string;
    handlerLocation: string;
    handlerFile: string;
}

export class BaseFunction extends NodejsFunction
{
    constructor( scope: Construct, id: string, props: BaseFunctionProps )
    {
        super( scope, id, {
            ...props,
            runtime: Runtime.NODEJS_20_X,
            handler: props.handlerLocation,
            entry: props.handlerFile,
            timeout: Duration.seconds( 10 ),
            architecture: Architecture.ARM_64,
            environment: {
                TABLE_NAME: props.tableName
            }
        });
    }
}