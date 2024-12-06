import {
    InstanceType,
    IMachineImage,
    CfnKeyPair,
    IKeyPair,
    IVpc,
    InitElement,
    SecurityGroup
} from 'aws-cdk-lib/aws-ec2';

export interface MachineKeyPair
{
    cfnKeyPair: CfnKeyPair;
    keyPair: IKeyPair;
}

export interface MachineKeyPairProps
{
    namePrefix: string;
}

export interface MachineProps
{
    namePrefix: string;
    
    instanceType: InstanceType,
    machineImage: IMachineImage;
    
    keyPair: IKeyPair;
    cidr: string; // Classless Inter-Domain Routing
    
    initElements: InitElement[],
    uploadBucket?: string; // Bucket Name
}

export interface VpcProps
{
    namePrefix: string;
    
    network: string,
    mask: number
}

export interface SgProps
{
    namePrefix: string;
    vpc: IVpc;
}

export interface LaunchTemplateProps
{
    namePrefix: string;
    
    instanceType: InstanceType,
    machineImage: IMachineImage;
    keyPair: IKeyPair,
    securityGroup: SecurityGroup
}

export interface LoadbalancedMachineProps extends MachineProps
{
    desiredCapacity: number;
}

export interface ILoadbalancedWebServer
{

}
