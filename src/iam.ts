import { Construct } from 'constructs';
import { CfnAccessKey } from 'aws-cdk-lib/aws-iam';

import { UserProfile } from './types/iam';

export function getUserProfile( scope: Construct, userName: string ): UserProfile
{
    const accessKey: CfnAccessKey = new CfnAccessKey( scope, "UserAccessKey", { userName: userName } );
    
    return {
        region: 'eu-central-1',
        keyId: accessKey.ref,
        keySecret: accessKey.attrSecretAccessKey,
    };
}
