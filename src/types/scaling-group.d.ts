import {
    IVpc,
    InitElement,
    InstanceType,
    IMachineImage,
    IKeyPair,
    SecurityGroup,
    ILaunchTemplate
} from 'aws-cdk-lib/aws-ec2';
import { AutoScalingGroup } from 'aws-cdk-lib/aws-autoscaling';

import { WebServerProps } from './application';

export interface AutoScalingGroupProps
{
    namePrefix: string;
    
    vpc: IVpc;
    
    withInstanceInit?: boolean;
    lamp?: WebServerProps;
    initElements: InitElement[];
    launchTemplate: ILaunchTemplate;
    
    desiredCapacity: number;
}

export interface ApplicationLoadBalancerProps
{
    namePrefix: string;
    
    vpc: IVpc;
    autoScalingGroup: AutoScalingGroup;
}

export interface AutoScalingParams
{
    cpuUtilizationPercent?: number;
    рequestsCountPerMinute?: number;
}
