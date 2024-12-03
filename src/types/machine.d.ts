import {
    CfnKeyPair,
    IKeyPair,
    IVpc,
    InitElement
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
    keyPair: IKeyPair;
    cidr: string; // Classless Inter-Domain Routing
    elements: InitElement[],
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
