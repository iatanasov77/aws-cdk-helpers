import { Construct } from 'constructs';
import {
    CfnAccessKey,
    IRole,
    Role,
    ServicePrincipal,
    ManagedPolicy
} from 'aws-cdk-lib/aws-iam';

import {
    UserProfile,
    RoleProps
} from './types/iam';

export function getUserProfile( scope: Construct, userName: string ): UserProfile
{
    const accessKey: CfnAccessKey = new CfnAccessKey( scope, "UserAccessKey", { userName: userName } );
    
    return {
        region: 'eu-central-1',
        keyId: accessKey.ref,
        keySecret: accessKey.attrSecretAccessKey,
    };
}

export function createEc2ManagedInstanceCoreRole( scope: Construct, props: RoleProps ): IRole
{
    return new Role( scope, `${props.namePrefix}Role`, {
        assumedBy: new ServicePrincipal( "ec2.amazonaws.com" ),
        managedPolicies: [
            ManagedPolicy.fromAwsManagedPolicyName(
                "AmazonSSMManagedInstanceCore",
            ),
        ],
    });
}
