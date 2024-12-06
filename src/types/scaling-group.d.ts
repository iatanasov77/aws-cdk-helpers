import {
    IVpc,
    InitElement,
    InstanceType,
    IMachineImage,
    IKeyPair,
    SecurityGroup
} from 'aws-cdk-lib/aws-ec2';
import { IAutoScalingGroup } from 'aws-cdk-lib/aws-autoscaling';
import { IApplicationLoadBalancerTarget } from 'aws-cdk-lib/aws-elasticloadbalancingv2';

interface LoadBalancerTargetInterface extends IAutoScalingGroup, IApplicationLoadBalancerTarget
{

}

export interface AutoScalingGroupProps
{
    namePrefix: string;
    
    vpc: IVpc;
    initElements: InitElement[],
    
    // Launch Template Props
    instanceType: InstanceType,
    machineImage: IMachineImage;
    keyPair: IKeyPair,
    securityGroup: SecurityGroup
}

export interface ApplicationLoadBalancerProps
{
    namePrefix: string;
    
    vpc: IVpc;
    autoScalingGroup: LoadBalancerTargetInterface;
}
