import { Construct } from 'constructs';
import { Duration } from 'aws-cdk-lib/core';
import { AutoScalingGroup, Signals } from 'aws-cdk-lib/aws-autoscaling';
import { IApplicationLoadBalancer, ApplicationLoadBalancer } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { CloudFormationInit, SubnetType } from 'aws-cdk-lib/aws-ec2';

import {
    AutoScalingGroupProps,
    ApplicationLoadBalancerProps
} from './types/scaling-group';

import { initWebServer } from './application';

export function createAutoScalingGroup( scope: Construct, props: AutoScalingGroupProps ): AutoScalingGroup
{
    const autoScalingGroup = new AutoScalingGroup( scope, `${props.namePrefix}AutoScalingGroup`, {
        autoScalingGroupName: `${props.namePrefix}AutoScalingGroup`,
        
        vpc: props.vpc,
        vpcSubnets: { subnetType: SubnetType.PUBLIC },
        desiredCapacity: 3,
        
        launchTemplate: props.launchTemplate,
        
        init: CloudFormationInit.fromElements( ...initWebServer( {} ).concat( props.initElements ) ),
        
        signals: Signals.waitForCount(1, {
            minSuccessPercentage: 80,
            timeout: Duration.minutes( 5 ),
        }),
    });
    
    return autoScalingGroup;
}

export function createApplicationLoadBalancer( scope: Construct, props: ApplicationLoadBalancerProps ): IApplicationLoadBalancer
{
    // Create a LoadBalancer
    const lb = new ApplicationLoadBalancer( scope, `${props.namePrefix}LoadBalancer`, {
        vpc: props.vpc,
        internetFacing: true
    });
    
    // Configure LoadBalancer Gateway
    const listener = lb.addListener( `${props.namePrefix}LoadBalancerListener`, { port: 80 } );
    listener.addTargets( `${props.namePrefix}LoadBalancerTarget`, {
        port: 80,
        targets: [props.autoScalingGroup]
    });
    
    return lb;
}
