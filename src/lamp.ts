import {
    InitElement,
    InitCommand,
    InitService,
    InitPackage,
    InitServiceRestartHandle
} from 'aws-cdk-lib/aws-ec2';

import { WebServerProps } from './types/application';

/*
 * https://docs.aws.amazon.com/linux/al2023/ug/ec2-lamp-amazon-linux-2023.html
 */
export function initWebServer( props: WebServerProps ): Array<InitElement>
{
    let elements = [];
    
    // Install Web Server
    if ( props.webServerPackage ) {
        elements.push( InitPackage.yum( props.webServerPackage ) );
    } else {
        elements.push( InitPackage.yum( "nginx" ) );
    }
    
    // Install Database Server
    if ( props.databasePackage ) {
        elements.concat( installDatabaseServer( props.databasePackage ) );
    }
    
    // Install PHP
    elements.concat( installPhp( props.phpVersion ) );
    
    // Restart Web Server
    elements.push(
        InitService.enable( props.webServerPackage ? props.webServerPackage : "nginx", {
            serviceRestartHandle: new InitServiceRestartHandle(),
        })
    );
    
    return elements;
}

function installDatabaseServer( databasePackage: string ): Array<InitElement>
{
    let elements = [];
    
    elements.push(
        InitCommand.shellCommand(
            `sudo dnf install ${databasePackage} -y`,
        )
    );
    
    elements.push(
        InitService.enable( "mariadb", {
            serviceRestartHandle: new InitServiceRestartHandle(),
        })
    );
    
    return elements;
}

function installPhp( phpVersion?: string ): Array<InitElement>
{
    let command;
    let elements = [];
    
    if ( phpVersion ) {
        command = `sudo dnf install php${phpVersion} php${phpVersion}-cli php${phpVersion}-common php${phpVersion}-mbstring php${phpVersion}-xml -y`;
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
    
    return elements;
}
