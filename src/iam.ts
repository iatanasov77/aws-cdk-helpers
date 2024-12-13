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
    return new Role( scope, `${props.namePrefix}Ec2ManagedInstanceCoreRole`, {
        assumedBy: new ServicePrincipal( "ec2.amazonaws.com" ),
        managedPolicies: [
            ManagedPolicy.fromAwsManagedPolicyName( "AmazonSSMManagedInstanceCore" ),
        ],
    });
}

/**
 * The AdministratorAccess policy in Amazon Web Services (AWS) provides complete,
 * unrestricted access to all resources in an AWS account
 *
 * https://docs.aws.amazon.com/aws-managed-policy/latest/reference/AdministratorAccess.html
 */
export function createAdministratorAccessRole( scope: Construct, props: RoleProps ): IRole
{
    return new Role( scope, `${props.namePrefix}AdministratorAccessRole`, {
        assumedBy: new ServicePrincipal( "ec2.amazonaws.com" ),
        managedPolicies: [
            ManagedPolicy.fromAwsManagedPolicyName( "AdministratorAccess" ),
        ],
    });
}
