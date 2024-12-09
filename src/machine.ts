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
    AmazonLinuxImage,
    AmazonLinuxGeneration,
    Vpc,
    IpAddresses,
    SubnetType,
    Peer,
    Port,
    SecurityGroup,
    CloudFormationInit,
    LaunchTemplate,
    ILaunchTemplate
} from 'aws-cdk-lib/aws-ec2';

import {
    MachineKeyPair,
    MachineKeyPairProps,
    MachineProps,
    VpcProps,
    SgProps,
    LaunchTemplateProps,
    LoadbalancedMachineProps,
    ILoadbalancedWebServer
} from './types/machine';

import { initWebServer } from './application';
import { createEc2ManagedInstanceCoreRole } from './iam';

import { createAutoScalingGroup, createApplicationLoadBalancer } from './scaling-group';

export function createKeyPair( scope: Construct, props: MachineKeyPairProps ): MachineKeyPair
{
    const cfnKeyPair = new CfnKeyPair( scope, `${props.namePrefix}CfnKeyPair`, {
        keyName: 'my-key-pair',
        //keyType: KeyPairType.ED25519,
        keyType: KeyPairType.RSA,
        keyFormat: KeyPairFormat.PEM,
    });
    const keyPair = KeyPair.fromKeyPairName( scope, `${props.namePrefix}KeyPair`, 'my-key-pair' );
    
    return {
        cfnKeyPair: cfnKeyPair,
        keyPair: keyPair,
    };
}

export function createStandaloneWebServerInstance( scope: Construct, props: MachineProps ): IInstance
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
    const webServer = new Instance( scope, `${props.namePrefix}Instance`, {
        instanceName: `${props.namePrefix}Instance`,
        
        vpc,
        associatePublicIpAddress: true,
        vpcSubnets: { subnetType: SubnetType.PUBLIC },
        
        instanceType: props.instanceType,
        machineImage: props.machineImage,
        
        keyPair: props.keyPair,
        securityGroup: secGroup,
        
        init: CloudFormationInit.fromElements( ...initWebServer( {} ).concat( props.initElements ) ),
    });
    
    // Allow inbound HTTP traffic
    webServer.connections.allowFromAnyIpv4( Port.tcp( 80 ) );
    
    return webServer;
}

export function createVirtualPrivateCloud( scope: Construct, props: VpcProps ): IVpc
{
    // Create a VPC
    return new Vpc( scope, `${props.namePrefix}Vpc`, {
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

export function createLaunchTemplate( scope: Construct, props: LaunchTemplateProps ): ILaunchTemplate
{
    return new LaunchTemplate( scope, `${props.namePrefix}LaunchTemplate`, {
        instanceType: props.instanceType,
        machineImage: props.machineImage,
        
        keyPair: props.keyPair,
        securityGroup: props.securityGroup,
        
        role: createEc2ManagedInstanceCoreRole( scope, { namePrefix: props.namePrefix } ),
    });
}

export function createLoadbalancedWebServerInstance( scope: Construct, props: LoadbalancedMachineProps ): ILoadbalancedWebServer
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
    
     const launchTemplate = createLaunchTemplate( scope, {
            namePrefix: props.namePrefix,
            keyPair: props.keyPair,
            instanceType: props.instanceType,
            machineImage: props.machineImage,
            securityGroup: secGroup,
        })
    
    // Create Auto-Scaling Group
    const autoScalingGroup = createAutoScalingGroup( scope, {
        namePrefix: props.namePrefix,
        
        vpc: vpc,
        launchTemplate: launchTemplate,
        desiredCapacity: props.desiredCapacity,
        initElements: props.initElements,
    });
    
    // Create a LoadBalancer
    const lb = createApplicationLoadBalancer( scope, {
        namePrefix: props.namePrefix,
        vpc: vpc,
        autoScalingGroup: autoScalingGroup,
    });
    
    // Auto Scalling Rules
    autoScalingGroup.scaleOnCpuUtilization( "OnCpuUtilizationScaling", {
        targetUtilizationPercent: 60,
    });
    
    autoScalingGroup.scaleOnRequestCount( 'OnRequestCountScaling', {
        targetRequestsPerMinute: 60,
    });
    
    return {
        autoScalingGroup: autoScalingGroup,
        loadBalancer: lb,
    };
}
