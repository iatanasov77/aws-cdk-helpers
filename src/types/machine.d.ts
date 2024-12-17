import {
    InstanceType,
    IMachineImage,
    CfnKeyPair,
    IKeyPair,
    IVpc,
    InitElement,
    SecurityGroup
} from 'aws-cdk-lib/aws-ec2';

import { AutoScalingGroup } from 'aws-cdk-lib/aws-autoscaling';
import { IApplicationLoadBalancer } from 'aws-cdk-lib/aws-elasticloadbalancingv2';

import { WebServerProps } from './application';
import { AutoScalingParams } from './scaling-group';

export interface MachineKeyPair
{
    cfnKeyPair: CfnKeyPair;
    keyPair: IKeyPair;
}

export interface MachineKeyPairProps
{
    namePrefix: string;
}

export interface StandaloneMachineProps
{
    namePrefix: string;
    
    instanceType: InstanceType;
    machineImage: IMachineImage;
    
    keyPair: IKeyPair;
    cidr: string; // Classless Inter-Domain Routing
    inboundPorts: Array<Ec2Port> // Inbound Ports for Security Group;
    
    initScripts?: InitScript[]
    initElements?: InitElement[];
    
    uploadBucket?: string; // Bucket Name
}

export interface VpcProps
{
    namePrefix: string;
    
    network: string;
    mask: number;
    
    maxAzs?: number;
}

export interface SgProps
{
    namePrefix: string;
    vpc: IVpc;
    inboundPorts: Array<Ec2Port>;
}

export interface LaunchTemplateProps
{
    namePrefix: string;
    
    instanceType: InstanceType;
    machineImage: IMachineImage;
    keyPair: IKeyPair;
    securityGroup: SecurityGroup;
    role?: LaunchTemplateRole;
    
    userDataText?: string;
}

export interface LoadbalancedMachineProps
{
    /**
     * Standalone Machine Props
     */ 
    namePrefix: string;
    
    instanceType: InstanceType;
    machineImage: IMachineImage;
    
    keyPair: IKeyPair;
    cidr: string; // Classless Inter-Domain Routing
    inboundPorts: Array<Ec2Port> // Inbound Ports for Security Group;
    
    maxAzs?: number; // Maximum number of Availability Zones to use in this region
    launchTemplateRole?: LaunchTemplateRole;
    
    initScripts?: InitScript[]
    initElements: InitElement[];
    
    uploadBucket?: string; // Bucket Name
    
    /**
     * Loadbalance dMachine Props
     */
    desiredCapacity: number;
    autoScalingParams: AutoScalingParams;
}

export interface InitScript
{
    path: string;
    params: { [key: string]: string };
}

export interface Ec2Port
{
    port: number | string;
    description?: string;
}

export interface ILoadbalancedWebServer
{
    autoScalingGroup: AutoScalingGroup;
    loadBalancer: IApplicationLoadBalancer;
}

export const enum LaunchTemplateRole
{
    Ec2ManagedInstanceCoreRole,
    AdministratorAccessRole,
}
