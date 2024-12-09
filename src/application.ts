import { Construct } from 'constructs';

import {
    InitElement,
    InitFile,
    InitCommand,
    InitService,
    InitPackage,
    InitServiceRestartHandle
} from 'aws-cdk-lib/aws-ec2';

import {
    WebServerProps,
    ApplicationProps,
    ApplicationEnvProps
} from './types/application';

import * as iam from './iam';
import { UserProfile } from './types/iam';

/*
 * https://docs.aws.amazon.com/linux/al2023/ug/ec2-lamp-amazon-linux-2023.html
 */
export function initWebServer( props: WebServerProps ): Array<InitElement>
{
    let command;
    let elements = [];
    
    // Install Web Server
    if ( props.webServerPackage ) {
        elements.push( InitPackage.yum( props.webServerPackage ) );
    } else {
        elements.push( InitPackage.yum( "nginx" ) );
    }
    
    // Install Database Server
    if ( props.databasePackage ) {
        elements.push(
            InitCommand.shellCommand(
                `sudo dnf install ${props.databasePackage} -y`,
            )
        );
        
        elements.push(
            InitService.enable( "mariadb", {
                serviceRestartHandle: new InitServiceRestartHandle(),
            })
        );
    }
    
    // Install PHP
    
    if ( props.phpVersion ) {
        command = `sudo dnf install php${props.phpVersion} php${props.phpVersion}-cli php${props.phpVersion}-common php${props.phpVersion}-mbstring php${props.phpVersion}-xml -y`;
    } else {
        command = "sudo dnf install php php-cli php-common php-mbstring php-xml -y";
    }
    elements.push( InitCommand.shellCommand( command ) );
    
    // Install Composer
    elements.push(
        InitCommand.shellCommand(
            "sudo dnf install composer -y",
        )
    );
    
    // Restart Web Server
    elements.push(
        InitService.enable( props.webServerPackage ? props.webServerPackage : "nginx", {
            serviceRestartHandle: new InitServiceRestartHandle(),
        })
    );
    
    return elements;
}

export function initSamplePhpApplication( scope: Construct, props: ApplicationProps ): Array<InitElement>
{
    let elements = [];
    
    for( let i = 0; i < props.files.length; i++ ) {
        elements.push(
            InitFile.fromAsset(
                `${props.applicationRoot}/${props.files[i]}`,
                `${props.sourcePath}/${props.files[i]}`,
            )
        );
    }
    
    if ( props.useComposer ) {
        elements.push(
            InitFile.fromAsset(
                `${props.applicationRoot}/composer.json`,
                `${props.sourcePath}/composer.json`,
            )
        );
        
        elements.push(
            InitCommand.shellCommand(
                `cd ${props.applicationRoot} && sudo composer install  --no-interaction`,
            )
        );
    }
    
    if ( props.withEnv ) {
        elements.push(
            InitFile.fromString(
                `${props.applicationRoot}/.env`,
                createApplicationEnv( scope, {
                    userName: props.userName,
                    envVars: props.envVars,
                }),
            )
        );
        
    }
    
    return elements;
}

export function createApplicationEnv( scope: Construct, props: ApplicationEnvProps ): string
{
    let env: string = '';
    
    if ( props.userName ) {
        const profile: UserProfile = iam.getUserProfile( scope, props.userName )
        
        env += `
AWS_REGION=${profile.region}
AWS_ACCESS_KEY_ID=${profile.keyId}
AWS_ACCESS_KEY_SECRET=${profile.keySecret}\n
`;
    }

    if ( props.envVars ) {
        for ( const [key, value] of props.envVars ) {
            env += `${key}=${value}\n`;
        }
    }
    
    return env;
}
