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
    ApplicationProps,
    ApplicationEnvProps
} from './types/application';

import * as iam from './iam';
import { UserProfile } from './types/iam';

export function initSamplePhpApplication( scope: Construct, props: ApplicationProps ): Array<InitElement>
{
    let elements = [];
    
    for( let i = 0; i < props.files.length; i++ ) {
        elements.push( InitFile.fromAsset(
            `${props.applicationRoot}/${props.files[i]}`,
            `${props.sourcePath}/${props.files[i]}`,
        ));
    }
    
    if ( props.useComposer ) {
        elements.push( InitFile.fromAsset(
            `${props.applicationRoot}/composer.json`,
            `${props.sourcePath}/composer.json`,
        ));
        
        elements.push( InitCommand.shellCommand(
            `cd ${props.applicationRoot} && sudo composer install  --no-interaction`,
        ));
    }
    
    if ( props.withEnv ) {
        elements.push( InitFile.fromString(
            `${props.applicationRoot}/.env`,
            createApplicationEnv( scope, {
                userName: props.userName,
                envVars: props.envVars,
            }),
        ));
        
    }
    
    return elements;
}

export function createApplicationEnv( scope: Construct, props: ApplicationEnvProps ): string
{
    let env: string = `# ENV File for VankoSoft AWS PHP Application\n
';
    
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
