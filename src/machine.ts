import { Construct } from 'constructs';

import {
    CfnKeyPair,
    KeyPairType,
    KeyPairFormat,
    KeyPair,
    IKeyPair,
    IVpc,
    IInstance,
    Instance,
    InstanceClass,
    InstanceSize,
    InstanceType,
    AmazonLinuxImage,
    AmazonLinuxGeneration,
    Vpc,
    IpAddresses,
    SubnetType,
    Peer,
    Port,
    SecurityGroup,
    
    CloudFormationInit,
    InitPackage,
    InitCommand,
    InitService,
    InitServiceRestartHandle,
    InitFile
} from 'aws-cdk-lib/aws-ec2';

import {
    MachineKeyPair,
    MachineKeyPairProps,
    MachineProps,
    VpcProps,
    SgProps
} from './types/machine';

export function createKeyPair( scope: Construct, props: MachineKeyPairProps ): MachineKeyPair
{
    const cfnKeyPair = new CfnKeyPair( scope, 'MyCfnKeyPair', {
        keyName: 'my-key-pair',
        //keyType: KeyPairType.ED25519,
        keyType: KeyPairType.RSA,
        keyFormat: KeyPairFormat.PEM,
    });
    const keyPair = KeyPair.fromKeyPairName( scope, 'MyKeyPair', 'my-key-pair' );
    
    return {
        cfnKeyPair: cfnKeyPair,
        keyPair: keyPair,
    };
}

export function createWebServer( scope: Construct, props: MachineProps ): IInstance
{
    // Create a VPC
    let cidrParts = props.cidr.split( "/" );
    const vpc = createVirtualPrivateCloud( scope, {
        namePrefix: props.namePrefix,
        network: cidrParts[0],
        mask: parseInt( cidrParts[1] )
    });
    
    // Create Security Group
    const secGroup = createSecurityGroup( scope, {
        namePrefix: props.namePrefix,
        vpc: vpc
    });
    
    // Create an EC2 instance
    const webServer = new Instance( scope, props.namePrefix + 'Instance', {
        vpc,
        
        instanceType: InstanceType.of(
            InstanceClass.T2,
            InstanceSize.MICRO
        ),
        
        machineImage: new AmazonLinuxImage({
            generation: AmazonLinuxGeneration.AMAZON_LINUX_2023,
        }),
        
        keyPair: props.keyPair,
        associatePublicIpAddress: true,
        instanceName: props.namePrefix + "Instance",
        vpcSubnets: { subnetType: SubnetType.PUBLIC },
        securityGroup: secGroup,
        
        //////////////////////////////////////////////////////////////////////////////////
        // Debug Initialization:
        // aws ec2 get-console-output --instance-id i-09edc092e25b1500b --profile default
        //////////////////////////////////////////////////////////////////////////////////
        init: CloudFormationInit.fromElements(
            InitPackage.yum( "nginx" ),
            
            InitCommand.shellCommand(
                "sudo dnf install php php-cli php-json php-common php-mbstring -y",
            ),
            
            InitCommand.shellCommand(
                "sudo dnf install composer -y",
            ),
            
            InitService.enable( "nginx", {
                serviceRestartHandle: new InitServiceRestartHandle(),
            }),
        ),
    });
    
    // Allow inbound HTTP traffic
    webServer.connections.allowFromAnyIpv4( Port.tcp( 80 ) );
    
    return webServer;
}

export function createVirtualPrivateCloud( scope: Construct, props: VpcProps ): IVpc
{
    // Create a VPC
    return new Vpc( scope, props.namePrefix + 'Vpc', {
        vpcName: props.namePrefix + "Vpc",
        ipAddresses: IpAddresses.cidr( `${props.network}/${props.mask}` ),
        maxAzs: 1,
        subnetConfiguration: [
            {
                cidrMask: props.mask + 1,
                name: 'public-subnet',
                subnetType: SubnetType.PUBLIC,
            },
            {
                cidrMask: props.mask + 1,
                name: 'private-subnet',
                subnetType: SubnetType.PRIVATE_ISOLATED,
            },
        ],
    });
}

export function createSecurityGroup( scope: Construct, props: SgProps ): SecurityGroup
{
    const secGroup = new SecurityGroup( scope, props.namePrefix + "SecurityGroup", {
        vpc: props.vpc,
        allowAllOutbound: true
    });
    
    secGroup.addIngressRule(
        Peer.anyIpv4(),
        Port.tcp( 22 ), "allow SSH access"
    );
    
    secGroup.addIngressRule(
        Peer.anyIpv4(),
        Port.tcp( 80 ), "allow HTTP access"
    );
    
    return secGroup;
}
