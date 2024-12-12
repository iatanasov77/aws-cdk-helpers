import { readFileSync } from 'fs';
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
    ILaunchTemplate,
    UserData
} from 'aws-cdk-lib/aws-ec2';

import {
    MachineKeyPair,
    MachineKeyPairProps,
    StandaloneMachineProps,
    VpcProps,
    SgProps,
    LaunchTemplateProps,
    LoadbalancedMachineProps,
    ILoadbalancedWebServer
} from './types/machine';

import { initWebServer } from './lamp';
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

export function createStandaloneWebServerInstance( scope: Construct, props: StandaloneMachineProps ): IInstance
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
    let instanceInit;
    if ( props.withInstanceInit ) {
        instanceInit = CloudFormationInit.fromElements( ...initWebServer(
            props.lamp ? props.lamp : {}
        ).concat( props.initElements ) );
    }
    
    let userDataText;
    if ( props.initScriptPath ) {
        userDataText = readFileSync( props.initScriptPath, 'utf8' ).replaceAll(
            '__PHP_VERSION__',
            props.lamp.phpVersion
        ).replaceAll(
            '__DATABASE_ROOT_PASSWORD__',
            props.lamp.databasePassword
        );
    }
    
    const webServer = new Instance( scope, `${props.namePrefix}Instance`, {
        instanceName: `${props.namePrefix}Instance`,
        
        vpc,
        associatePublicIpAddress: true,
        vpcSubnets: { subnetType: SubnetType.PUBLIC },
        
        instanceType: props.instanceType,
        machineImage: props.machineImage,
        
        keyPair: props.keyPair,
        securityGroup: secGroup,
        
        init: instanceInit ? instanceInit : undefined,
        userData: userDataText ? UserData.custom( userDataText ) : undefined,
    });
    
    // Allow inbound HTTP traffic
    webServer.connections.allowFromAnyIpv4( Port.tcp( 80 ) );
    
    return webServer;
}

export function createVirtualPrivateCloud( scope: Construct, props: VpcProps ): IVpc
{
    const maxAzs: number = props.maxAzs ? props.maxAzs : 1;
    const subnetCidrMask: number = props.mask + maxAzs;
    
    // Create a VPC
    return new Vpc( scope, `${props.namePrefix}Vpc`, {
        vpcName: props.namePrefix + "Vpc",
        ipAddresses: IpAddresses.cidr( `${props.network}/${props.mask}` ),
        maxAzs: props.maxAzs ? props.maxAzs : 1,
        subnetConfiguration: [
            {
                cidrMask: subnetCidrMask,
                name: 'public-subnet',
                subnetType: SubnetType.PUBLIC,
            },
            {
                cidrMask: subnetCidrMask,
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
        
        userData: props.userDataText ? UserData.custom( props.userDataText ) : undefined,
    });
}

export function createLoadbalancedWebServerInstance( scope: Construct, props: LoadbalancedMachineProps ): ILoadbalancedWebServer
{
    // Create a VPC
    let cidrParts = props.cidr.split( "/" );
    const vpc = createVirtualPrivateCloud( scope, {
        namePrefix: props.namePrefix,
        network: cidrParts[0],
        mask: parseInt( cidrParts[1] ),
        maxAzs: props.maxAzs ? props.maxAzs : 2
    });
    
    // Create Security Group
    const secGroup = createSecurityGroup( scope, {
        namePrefix: props.namePrefix,
        vpc: vpc
    });
    
    let userDataText;
    if ( props.initScriptPath ) {
        userDataText = readFileSync( props.initScriptPath, 'utf8' ).replaceAll(
            '__PHP_VERSION__',
            props.lamp.phpVersion
        ).replaceAll(
            '__DATABASE_ROOT_PASSWORD__',
            props.lamp.databasePassword
        );
    }
    
    const launchTemplate = createLaunchTemplate( scope, {
        namePrefix: props.namePrefix,
        keyPair: props.keyPair,
        instanceType: props.instanceType,
        machineImage: props.machineImage,
        securityGroup: secGroup,
        userDataText: userDataText,
    });
    
    // Create Auto-Scaling Group
    const autoScalingGroup = createAutoScalingGroup( scope, {
        namePrefix: props.namePrefix,
        
        vpc: vpc,
        
        withInstanceInit: props.withInstanceInit,
        lamp: props.lamp,
        initElements: props.initElements,
        launchTemplate: launchTemplate,
        
        desiredCapacity: props.desiredCapacity,
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
