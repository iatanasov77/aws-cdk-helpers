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

var fs = require( 'fs' );

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
    uploadBucket?: string; // Bucket Name
}

export interface VpcProps
{
    namePrefix: string;
    network: string,
    mask: number
}

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
    const secGroup = new SecurityGroup( scope, props.namePrefix + "SecurityGroup", {
        vpc: vpc,
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
            
            /*
            InitFile.fromAsset(
                "/usr/share/nginx/html/info.php", // Destination
                "./src/web/info.php", // Where the file is located
            ),
            */
            
            
            
//             InitFile.fromAsset(
//                 "/usr/share/nginx/html/index.php", // Destination
//                 "./src/web/index.php", // Where the file is located
//             ),

            InitFile.fromString(
                "/usr/share/nginx/html/index.php", // Destination
                fs.readFileSync( './src/web/index.php', 'utf8' ).replace( '__BUCKET_NAME__', props.uploadBucket ),
            ),
            
            InitFile.fromAsset(
                "/usr/share/nginx/html/composer.json", // Destination
                "./src/web/composer.json", // Where the file is located
            ),
            
            InitCommand.shellCommand(
                "cd /usr/share/nginx/html && sudo composer install  --no-interaction",
            ),
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
