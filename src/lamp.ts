import {
    InitElement,
    InitFile,
    InitCommand,
    InitService,
    InitPackage,
    InitServiceRestartHandle
} from 'aws-cdk-lib/aws-ec2';

import { WebServerProps } from './types/application';

let elements = [];

/*
 * https://docs.aws.amazon.com/linux/al2023/ug/ec2-lamp-amazon-linux-2023.html
 */
export function initWebServer( props: WebServerProps ): Array<InitElement>
{
    // Install Web Server
    if ( 'webServerPackage' in props && props.webServerPackage ) {
        elements.push( InitPackage.yum( props.webServerPackage ) );
    } else {
        elements.push( InitPackage.yum( "nginx" ) );
    }
    
    // Install Database Server
    if ( 'databasePackage' in props && props.databasePackage ) {
        installDatabaseServer( props.databasePackage, props.databasePassword );
    }
    
    // Install PHP
    installPhp( props.phpVersion );
    
    if ( 'phpMyAdmin' in props && props.phpMyAdmin ) {
        installPhpMyAdmin( props.phpMyAdmin );
    }
    
    // Restart Web Server
    elements.push(
        InitService.enable( props.webServerPackage ? props.webServerPackage : "nginx", {
            serviceRestartHandle: new InitServiceRestartHandle(),
        })
    );
    
    return elements;
}

function installDatabaseServer( databasePackage: string, databasePassword: string ): void
{
    elements.push( InitCommand.shellCommand(
        `sudo dnf install ${databasePackage} -y`,
    ));
    
    elements.push( InitCommand.shellCommand(
        `echo -e "\\ny\\ny\\n${databasePassword}\\n${databasePassword}\\ny\\ny\\ny\\ny\\n" | sudo mysql_secure_installation`,
    ));
    
    elements.push( InitService.enable( "mariadb", {
        serviceRestartHandle: new InitServiceRestartHandle(),
    }));
}

function installPhp( phpVersion?: string ): void
{
    let command;
    
    if ( phpVersion ) {
        command = `sudo dnf install php${phpVersion} php${phpVersion}-cli php${phpVersion}-common php${phpVersion}-mysqlnd php${phpVersion}-mbstring php${phpVersion}-xml -y`;
    } else {
        command = "sudo dnf install php php-cli php-common php-mysqlnd php-mbstring php-xml -y";
    }
    elements.push( InitCommand.shellCommand( command ) );
    
    // Install Composer
    elements.push( InitCommand.shellCommand(
        "sudo dnf install composer -y",
    ));
}

function installPhpMyAdmin( phpMyAdminVersion: string ): void
{
    elements.push( InitFile.fromAsset(
        '/usr/local/bin/phpmyadmin.sh', './src/ec2Init/phpmyadmin.sh'
    ));
    
    elements.push( InitCommand.shellCommand(
        "sudo chmod 0777 /usr/local/bin/phpmyadmin.sh && sudo /usr/local/bin/phpmyadmin.sh",
    ));
}
