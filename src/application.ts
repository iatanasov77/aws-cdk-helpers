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
    ApplicationProps
} from './types/application';

export function initWebServer( props: WebServerProps ): Array<InitElement>
{
    let elements = [];
    
    elements.push( InitPackage.yum( "nginx" ) );
    
    elements.push(
        InitCommand.shellCommand(
            "sudo dnf install php php-cli php-json php-common php-mbstring -y",
        )
    );
    
    elements.push(
        InitCommand.shellCommand(
            "sudo dnf install composer -y",
        )
    );
    
    elements.push(
        InitService.enable( "nginx", {
            serviceRestartHandle: new InitServiceRestartHandle(),
        })
    );
    
    return elements;
}

export function initSamplePhpApplication( props: ApplicationProps ): Array<InitElement>
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
    
    return elements;
}
