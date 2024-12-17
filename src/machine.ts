import { readFileSync } from 'fs';
import { Construct } from 'constructs';

import { IRole } from 'aws-cdk-lib/aws-iam';
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
    UserData,
    
    InitElement,
    InitFile,
    InitCommand
} from 'aws-cdk-lib/aws-ec2';

import {
    MachineKeyPair,
    MachineKeyPairProps,
    StandaloneMachineProps,
    VpcProps,
    SgProps,
    LaunchTemplateProps,
    LoadbalancedMachineProps,
    ILoadbalancedWebServer,
    LaunchTemplateRole,
    InitScript,
    Ec2Port
} from './types/machine';

import {
    createEc2ManagedInstanceCoreRole,
    createAdministratorAccessRole
} from './iam';

import { createAutoScalingGroup, createApplicationLoadBalancer } from './scaling-group';

import slugify from "slugify";

export function createKeyPair( scope: Construct, props: MachineKeyPairProps ): MachineKeyPair
{
    const KeyPairName = slugify( props.namePrefix + ' Key Pair', {
        lower: true,
        locale: 'en',
    });
    
    const cfnKeyPair = new CfnKeyPair( scope, `${props.namePrefix}CfnKeyPair`, {
        keyName: KeyPairName,
        //keyType: KeyPairType.ED25519,
        keyType: KeyPairType.RSA,
        keyFormat: KeyPairFormat.PEM,
    });
    const keyPair = KeyPair.fromKeyPairName( scope, `${props.namePrefix}KeyPair`, KeyPairName );
    
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
        vpc: vpc,
        inboundPorts: props.inboundPorts,
    });
    
    let initElements: InitElement[] = [];
    if ( props.initScripts ) {
        initElements = createMachineInitElements( props.initScripts );
    }
    initElements = initElements.concat( props.initElements );
    
    const webServer = new Instance( scope, `${props.namePrefix}Instance`, {
        instanceName: `${props.namePrefix}Instance`,
        
        vpc,
        associatePublicIpAddress: true,
        vpcSubnets: { subnetType: SubnetType.PUBLIC },
        
        instanceType: props.instanceType,
        machineImage: props.machineImage,
        
        keyPair: props.keyPair,
        securityGroup: secGroup,
        
        init: CloudFormationInit.fromElements( ...initElements ),
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
    
    props.inboundPorts.forEach( ( ec2Port ) => {
        let port: Port;
        if ( typeof ec2Port.port === 'number' ) {
            port = Port.tcp( ec2Port.port );
        } else {
            let portRange = ec2Port.port.split( '-' );
            port = Port.tcpRange( Number( portRange[0] ), Number( portRange[1] ) );
        }
        
        secGroup.addIngressRule(
            Peer.anyIpv4(),
            port,
            ec2Port.description
        );
    });
    
    return secGroup;
}

export function createLaunchTemplate( scope: Construct, props: LaunchTemplateProps ): ILaunchTemplate
{
    let role: IRole;
    switch ( props.role ) {
        case LaunchTemplateRole.Ec2ManagedInstanceCoreRole:
            role = createEc2ManagedInstanceCoreRole( scope, { namePrefix: props.namePrefix } );
            break;
        case LaunchTemplateRole.AdministratorAccessRole:
            role = createAdministratorAccessRole( scope, { namePrefix: props.namePrefix } );
            break;
    }
    
    return new LaunchTemplate( scope, `${props.namePrefix}LaunchTemplate`, {
        instanceType: props.instanceType,
        machineImage: props.machineImage,
        
        keyPair: props.keyPair,
        securityGroup: props.securityGroup,
        role: role,
        
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
        vpc: vpc,
        inboundPorts: props.inboundPorts,
    });
    
    let initElements: InitElement[] = [];
    if ( props.initScripts ) {
        initElements = createMachineInitElements( props.initScripts );
    }
    
    const launchTemplate = createLaunchTemplate( scope, {
        namePrefix: props.namePrefix,
        keyPair: props.keyPair,
        instanceType: props.instanceType,
        machineImage: props.machineImage,
        securityGroup: secGroup,
        
        role: props.launchTemplateRole,
    });
    
    // Create Auto-Scaling Group
    const autoScalingGroup = createAutoScalingGroup( scope, {
        namePrefix: props.namePrefix,
        
        vpc: vpc,
        
        launchTemplate: launchTemplate,
        initElements: initElements.concat( props.initElements ),
        
        desiredCapacity: props.desiredCapacity,
    });
    
    // Create a LoadBalancer
    const lb = createApplicationLoadBalancer( scope, {
        namePrefix: props.namePrefix,
        vpc: vpc,
        autoScalingGroup: autoScalingGroup,
    });
    
    // Auto Scalling Rules
    if ( props.autoScalingParams.cpuUtilizationPercent ) {
        autoScalingGroup.scaleOnCpuUtilization( "OnCpuUtilizationScaling", {
            targetUtilizationPercent: props.autoScalingParams.cpuUtilizationPercent,
        });
    }
    
    if ( props.autoScalingParams.рequestsCountPerMinute ) {
        autoScalingGroup.scaleOnRequestCount( 'OnRequestCountScaling', {
            targetRequestsPerMinute: props.autoScalingParams.рequestsCountPerMinute,
        });
    }
    
    return {
        autoScalingGroup: autoScalingGroup,
        loadBalancer: lb,
    };
}

export function createMachineInitElements( initScripts: InitScript[] ): InitElement[]
{
    let scriptPath: string;
    let scriptContent: string;
    
    let elements: InitElement[] = [];
    elements.push( InitCommand.shellCommand(
        'mkdir -p /usr/local/bin/LampServerInit && chmod -R 0777 /usr/local/bin/LampServerInit',
    ));
    
    for ( let script of initScripts ) {
        scriptContent = readFileSync( script.path, 'utf8' );
        for ( let key in script.params ) {
            scriptContent = scriptContent.replaceAll( key, script.params[key] );
        }
        
        scriptPath = `/usr/local/bin/LampServerInit/${script.path.split( '/' ).pop()}`;
        elements.push( InitFile.fromString( scriptPath, scriptContent ) );
        elements.push( InitCommand.shellCommand( `sudo chmod 0777 ${scriptPath} && sudo ${scriptPath}` ) );
    }
    
    return elements;
}
